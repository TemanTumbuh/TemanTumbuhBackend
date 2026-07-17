import { z } from "zod";

// Shared/reusable pieces
const uuidSchema = z.string().uuid();

// ---- PATCH /api/users/:id ----
// Semua field opsional; email/password sengaja tidak disertakan (endpoint terpisah - lihat Open Questions di standardization.md)
const updateUserSchema = z
    .object({
        username: z.string().min(3).max(50),
        bio: z.string().max(200).nullable(),
        avatar_url: z.string().url().nullable(),
        place_id: z.string().max(20),
        is_active: z.boolean(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

// ---- GET /api/users/:id, PATCH /api/users/:id, DELETE /api/users/:id ----
const userIdParamSchema = z.object({
    id: uuidSchema,
});

// ---- GET /api/users ----
const getUsersQuerySchema = z.object({
    page: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    order: z.enum(["asc", "desc"]).default("desc"),
    orderBy: z.enum(["created_at", "username", "last_login"]).default("created_at"),
    search: z.string().max(100).optional().default(""),
    searchBy: z.enum(["username", "email"]).optional().default("username"),
});

// ---- Response shape (User) ----
// Mirror of formatUser() in userService.js. Sumber untuk Swagger `User` schema
// via z.toJSONSchema() — password_hash sengaja tidak pernah disertakan di sini.
const userResponseSchema = z.object({
    id: uuidSchema,
    username: z.string(),
    email: z.string().email(),
    bio: z.string().nullable(),
    avatar_url: z.string().url().nullable(),
    is_active: z.boolean(),
    role_id: z.number().int().nullable(),
    place_id: z.string().nullable(),
    created_at: z.string().datetime({ offset: true }),
    last_login: z.string().datetime({ offset: true }).nullable(),
});

export { updateUserSchema, userIdParamSchema, getUsersQuerySchema, userResponseSchema };
