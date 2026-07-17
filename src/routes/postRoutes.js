import express from "express";
import PostController from "../controllers/postController.js";
import authenticate from "../middlewares/authenticate.js";
import upload from "../middlewares/upload.js";
import validate from "../middlewares/validate.js";
import { listPostsQuerySchema, postIdParamSchema, createPostSchema, updatePostSchema } from "../schemas/postSchema.js";

const router = express.Router();

// ── Publik ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/posts:
 *   get:
 *     summary: List posts (cursor-based pagination)
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *       - in: query
 *         name: cursor
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated list of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Post' }
 *                     nextCursor: { type: string, format: uuid, nullable: true }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
// GET /api/v1/posts
router.get("/", validate(listPostsQuerySchema, "query"), PostController.getAll);

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Post found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Post' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Post not found
 */
// GET /api/v1/posts/:id
router.get("/:id", validate(postIdParamSchema, "params"), PostController.getById);

// ── Butuh JWT ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   delete:
 *     summary: Delete a post (owner or admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Post deleted
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not allowed to delete this post
 *       404:
 *         description: Post not found
 */
// DELETE /api/v1/posts/:id
router.delete("/:id", authenticate, validate(postIdParamSchema, "params"), PostController.remove);

/**
 * @swagger
 * /api/v1/posts:
 *   post:
 *     summary: Create a post (text, images, or both)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               categoryId: { type: string, format: uuid }
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *                 maxItems: 3
 *     responses:
 *       201:
 *         description: Post created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Post' }
 *       400:
 *         description: Validation error (bad file, missing content+images, or invalid categoryId)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid token
 */
// POST /api/v1/posts
// Multer selalu aktif; req.files = [] jika tidak ada file yang dikirim
router.post(
    "/",
    authenticate,
    (req, res, next) => {
        upload.array("images", 3)(req, res, (err) => {
            if (!err) return next();
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ success: false, message: "Ukuran file maksimal 5 MB." });
            }
            if (err.code === "LIMIT_FILE_COUNT") {
                return res.status(400).json({ success: false, message: "Maksimal 3 file gambar." });
            }
            return res.status(400).json({ success: false, message: err.message });
        });
    },
    validate(createPostSchema, "body"),
    PostController.create
);

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   patch:
 *     summary: Update a post's text content and/or category (owner only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, nullable: true }
 *               categoryId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Post updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Post' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not allowed to update this post
 *       404:
 *         description: Post not found
 */
// PATCH /api/v1/posts/:id
router.patch(
    "/:id",
    authenticate,
    validate(postIdParamSchema, "params"),
    validate(updatePostSchema, "body"),
    PostController.update
);

export default router;
