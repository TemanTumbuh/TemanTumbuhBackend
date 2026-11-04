import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9][a-z0-9_-]{1,49}$/;

const permissionKeySchema = z.string().min(1).max(100);

// ---- :id pada /api/roles/:id ----
const roleIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

// ---- POST /api/roles ----
const createRoleSchema = z.object({
    name: z.string().trim().min(2).max(50),
    slug: z.string().regex(SLUG_REGEX, "slug hanya boleh huruf kecil, angka, - dan _ (2-50 karakter)").optional(),
    description: z.string().max(255).nullable().optional(),
    permissions: z.array(permissionKeySchema).max(200).optional().default([]),
    is_default: z.boolean().optional().default(false),
});

// ---- PATCH /api/roles/:id ----
// is_default hanya bisa di-set true: default berpindah dengan menjadikan role LAIN default.
const updateRoleSchema = z
    .object({
        name: z.string().trim().min(2).max(50),
        description: z.string().max(255).nullable(),
        is_default: z.literal(true),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

// ---- PUT /api/roles/:id/permissions ----
const setRolePermissionsSchema = z.object({
    permissions: z.array(permissionKeySchema).max(200),
});

// ---- PUT /api/users/:id/role ----
const assignRoleSchema = z.object({
    role_id: z.number().int().positive(),
});

export {
    SLUG_REGEX,
    roleIdParamSchema,
    createRoleSchema,
    updateRoleSchema,
    setRolePermissionsSchema,
    assignRoleSchema,
};
