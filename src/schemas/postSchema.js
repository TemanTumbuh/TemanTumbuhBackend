import { z } from "zod";

const uuidSchema = z.string().uuid();

// categoryId di postService.js (formatCategoryId) menerima "", "null", "undefined"
// sebagai representasi null - direplikasi di sini supaya perilaku persis sama.
const categoryIdInputSchema = z
    .string()
    .optional()
    .refine(
        (val) => {
            if (val === undefined) return true;
            const trimmed = val.trim();
            if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return true;
            return uuidSchema.safeParse(trimmed).success;
        },
        { message: "categoryId harus berupa UUID yang valid." }
    );

// limit: postService.js melakukan Math.min(parseInt(limit) || 20, 50) sendiri -
// jadi apapun yang dikirim (termasuk non-angka) tidak boleh ditolak di sini,
// cukup dipastikan bertipe string supaya parseInt() di service tetap jalan seperti semula.
const limitInputSchema = z.union([z.string(), z.number()]).optional();

// ---- GET /api/v1/posts ----
const listPostsQuerySchema = z.object({
    limit: limitInputSchema,
    cursor: uuidSchema.optional(),
    categoryId: categoryIdInputSchema,
});

// ---- GET /api/v1/posts/:id, PATCH /api/v1/posts/:id, DELETE /api/v1/posts/:id ----
const postIdParamSchema = z.object({
    id: uuidSchema,
});

// content: tidak ada batas panjang di postService.js saat ini, jadi tidak ditambahkan
// max() di sini supaya tidak menolak request yang sebelumnya valid.

// ---- POST /api/v1/posts (multipart/form-data - body divalidasi setelah multer parse) ----
const createPostSchema = z.object({
    content: z.string().optional(),
    categoryId: categoryIdInputSchema,
});

// ---- PATCH /api/v1/posts/:id ----
const updatePostSchema = z.object({
    content: z.string().nullable().optional(),
    categoryId: categoryIdInputSchema,
});

// ---- POST /api/v1/posts/:id/comments ----
const createCommentSchema = z.object({
    content: z.string().min(1, "Komentar tidak boleh kosong.").max(1000, "Komentar maksimal 1000 karakter."),
});

export { listPostsQuerySchema, postIdParamSchema, createPostSchema, updatePostSchema, createCommentSchema };
