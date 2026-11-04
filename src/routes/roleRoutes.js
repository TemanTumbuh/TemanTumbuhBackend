import express from "express";
import RoleController from "../controllers/roleController.js";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import validate from "../middlewares/validate.js";
import PERMISSIONS from "../constants/permissions.js";
import {
    roleIdParamSchema,
    createRoleSchema,
    updateRoleSchema,
    setRolePermissionsSchema,
} from "../schemas/roleSchema.js";

const router = express.Router();

// Semua endpoint role butuh login.
router.use(authenticate);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: List semua role beserta permission-nya
 *     description: Butuh permission `roles:read`.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar role
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Tidak punya permission roles:read
 */
router.get("/", authorize(PERMISSIONS.ROLES_READ), RoleController.list);

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Katalog seluruh permission yang tersedia
 *     description: Butuh permission `roles:read`. Dipakai untuk menampilkan checklist saat mengatur role.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar permission
 *       403:
 *         description: Tidak punya permission roles:read
 */
// Harus di atas "/:id" agar "permissions" tidak dibaca sebagai id.
router.get("/permissions", authorize(PERMISSIONS.ROLES_READ), RoleController.listPermissions);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Detail satu role
 *     description: Butuh permission `roles:read`.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detail role
 *       404:
 *         description: Role tidak ditemukan
 */
router.get("/:id", authorize(PERMISSIONS.ROLES_READ), validate(roleIdParamSchema, "params"), RoleController.getById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Buat role baru
 *     description: Butuh permission `roles:manage`. `slug` dibuat otomatis dari `name` jika tidak diisi.
 *     tags: [Roles]
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
 *               name: { type: string, example: Moderator }
 *               slug: { type: string, example: moderator }
 *               description: { type: string, nullable: true }
 *               permissions:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["comments:delete:any", "posts:delete:any"]
 *               is_default: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Role dibuat
 *       400:
 *         description: Validasi gagal / permission tidak dikenal
 *       409:
 *         description: Nama atau slug sudah dipakai
 */
router.post("/", authorize(PERMISSIONS.ROLES_MANAGE), validate(createRoleSchema, "body"), RoleController.create);

/**
 * @swagger
 * /api/roles/{id}:
 *   patch:
 *     summary: Ubah nama / deskripsi role, atau jadikan role default
 *     description: Butuh permission `roles:manage`. Slug tidak dapat diubah.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *               is_default: { type: boolean, enum: [true] }
 *     responses:
 *       200:
 *         description: Role diperbarui
 *       404:
 *         description: Role tidak ditemukan
 *       409:
 *         description: Nama sudah dipakai
 */
router.patch(
    "/:id",
    authorize(PERMISSIONS.ROLES_MANAGE),
    validate(roleIdParamSchema, "params"),
    validate(updateRoleSchema, "body"),
    RoleController.update
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   put:
 *     summary: Ganti seluruh permission sebuah role
 *     description: Butuh permission `roles:manage`. Daftar yang dikirim MENGGANTIKAN daftar lama. Role superadmin tidak dapat diatur.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissions]
 *             properties:
 *               permissions:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Permission diperbarui
 *       400:
 *         description: Permission tidak dikenal / role superadmin
 *       404:
 *         description: Role tidak ditemukan
 */
router.put(
    "/:id/permissions",
    authorize(PERMISSIONS.ROLES_MANAGE),
    validate(roleIdParamSchema, "params"),
    validate(setRolePermissionsSchema, "body"),
    RoleController.setPermissions
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Hapus role
 *     description: Butuh permission `roles:manage`. Role bawaan, role default, dan role yang masih dipakai user tidak dapat dihapus.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Role dihapus
 *       403:
 *         description: Role bawaan sistem
 *       404:
 *         description: Role tidak ditemukan
 *       409:
 *         description: Role default atau masih dipakai user
 */
router.delete("/:id", authorize(PERMISSIONS.ROLES_MANAGE), validate(roleIdParamSchema, "params"), RoleController.remove);

export default router;
