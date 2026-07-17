import { z } from "zod";
import swaggerJsdoc from "swagger-jsdoc";
import { updateUserSchema, userResponseSchema } from "../schemas/userSchema.js";

// Zod -> JSON Schema (native to Zod v4, no zod-to-json-schema dependency needed).
// Keeps component schemas in sync with the actual validators instead of hand-duplicating them.
function toOpenApiSchema(zodSchema) {
    const { $schema, ...jsonSchema } = z.toJSONSchema(zodSchema, { target: "openapi-3.0" });
    return jsonSchema;
}

const userSchemaComponent = toOpenApiSchema(userResponseSchema);
const updateUserInputComponent = toOpenApiSchema(updateUserSchema);

// Hand-written: no live Zod schema backs POST /api/users (route doesn't exist yet —
// registration is owned by POST /auth/register, see agent/auth.md).
const createUserInputComponent = {
    type: "object",
    required: ["username", "email", "password", "role_id", "place_id"],
    properties: {
        username: { type: "string", minLength: 3, maxLength: 50 },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8, maxLength: 72 },
        bio: { type: "string", maxLength: 200 },
        avatar_url: { type: "string", format: "uri" },
        role_id: { type: "integer" },
        place_id: { type: "string", maxLength: 20 },
    },
};

const paginatedUsersResponseComponent = {
    type: "object",
    properties: {
        data: { type: "array", items: { $ref: "#/components/schemas/User" } },
        meta: {
            type: "object",
            properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
            },
        },
    },
};

const errorResponseComponent = {
    type: "object",
    properties: {
        error: { type: "string", example: "ValidationError" },
        message: { type: "string" },
        details: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    path: { type: "string" },
                    message: { type: "string" },
                },
            },
        },
    },
};

// Mirrors formatPost() in postService.js.
const postComponent = {
    type: "object",
    properties: {
        id: { type: "string", format: "uuid" },
        content: { type: "string", nullable: true },
        isPinned: { type: "boolean" },
        createdAt: { type: "string", format: "date-time" },
        category: {
            type: "object",
            nullable: true,
            properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                slug: { type: "string" },
            },
        },
        author: {
            type: "object",
            nullable: true,
            properties: {
                id: { type: "string", format: "uuid" },
                username: { type: "string" },
                avatarUrl: { type: "string", nullable: true },
            },
        },
        media: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    mediaUrl: { type: "string" },
                    mediaType: { type: "string", enum: ["image", "video"] },
                    sortOrder: { type: "integer" },
                },
            },
        },
    },
};

// Mirrors the raw "posts" table row returned by articleModel.js
// (articleRoutes currently reads/writes the same underlying table as posts).
const articleComponent = {
    type: "object",
    properties: {
        id: { type: "string", format: "uuid" },
        user_id: { type: "string", format: "uuid", nullable: true },
        content: { type: "string", nullable: true },
        created_at: { type: "string", format: "date-time" },
        category_id: { type: "string", format: "uuid", nullable: true },
        is_pinned: { type: "boolean" },
    },
};

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Teman Tumbuh API",
            version: "1.0.0",
            description: "Backend API for Teman Tumbuh (Express + Supabase)",
        },
        servers: [
            { url: "http://localhost:3000", description: "Local" },
            { url: "https://api.tementumbuh.app", description: "Production" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: userSchemaComponent,
                CreateUserInput: createUserInputComponent,
                UpdateUserInput: updateUserInputComponent,
                PaginatedUsersResponse: paginatedUsersResponseComponent,
                ErrorResponse: errorResponseComponent,
                Post: postComponent,
                Article: articleComponent,
            },
        },
    },
    apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
