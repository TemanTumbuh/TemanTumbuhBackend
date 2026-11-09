import express from "express";
import CategoryController from "../controllers/categoryController.js";
import authenticate, { optionalAuthenticate } from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import validate from "../middlewares/validate.js";
import PERMISSIONS from "../constants/permissions.js";
import {
    categoryIdParamSchema,
    listCategoriesQuerySchema,
    createCategorySchema,
    updateCategorySchema,
} from "../schemas/categorySchema.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: List kategori
 *     description: |
 *       Publik, hanya mengembalikan kategori aktif.
 *       `includeInactive=true` hanya berlaku jika user login dan punya salah satu permission `categories:*`.
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Daftar kategori
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Category' }
 */
router.get("/", optionalAuthenticate, validate(listCategoriesQuerySchema, "query"), CategoryController.list);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Detail satu kategori
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Kategori ditemukan
 *       404:
 *         description: Kategori tidak ditemukan
 */
router.get("/:id", validate(categoryIdParamSchema, "params"), CategoryController.getById);

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Buat kategori
 *     description: Butuh permission `categories:create`. `slug` dibuat otomatis dari `name` jika tidak diisi.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Parenting }
 *               slug: { type: string, example: parenting }
 *               is_active: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Kategori dibuat
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Tidak punya permission categories:create
 *       409:
 *         description: Slug sudah dipakai
 */
router.post(
    "/",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_CREATE),
    validate(createCategorySchema, "body"),
    CategoryController.create
);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   patch:
 *     summary: Ubah kategori
 *     description: Butuh permission `categories:update`.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Kategori diperbarui
 *       400:
 *         description: Validasi gagal
 *       403:
 *         description: Tidak punya permission categories:update
 *       404:
 *         description: Kategori tidak ditemukan
 *       409:
 *         description: Slug sudah dipakai
 */
router.patch(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_UPDATE),
    validate(categoryIdParamSchema, "params"),
    validate(updateCategorySchema, "body"),
    CategoryController.update
);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Hapus kategori
 *     description: Butuh permission `categories:delete`. Post yang memakai kategori ini tetap ada, `category` menjadi null.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Kategori dihapus
 *       403:
 *         description: Tidak punya permission categories:delete
 *       404:
 *         description: Kategori tidak ditemukan
 */
router.delete(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_DELETE),
    validate(categoryIdParamSchema, "params"),
    CategoryController.remove
);

export default router;