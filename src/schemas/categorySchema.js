import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugSchema = z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(SLUG_REGEX, "slug hanya boleh huruf kecil, angka, dan tanda - (tanpa - di awal/akhir)");

// ---- :id pada /api/v1/categories/:id ----
const categoryIdParamSchema = z.object({
    id: z.string().uuid(),
});

// ---- GET /api/v1/categories ----
const listCategoriesQuerySchema = z.object({
    includeInactive: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
});

// ---- POST /api/v1/categories ----
const createCategorySchema = z.object({
    name: z.string().trim().min(2).max(100),
    slug: slugSchema.optional(), // dibuat otomatis dari name jika kosong
    is_active: z.boolean().optional().default(true),
});

// ---- PATCH /api/v1/categories/:id ----
const updateCategorySchema = z
    .object({
        name: z.string().trim().min(2).max(100),
        slug: slugSchema,
        is_active: z.boolean(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export { categoryIdParamSchema, listCategoriesQuerySchema, createCategorySchema, updateCategorySchema };