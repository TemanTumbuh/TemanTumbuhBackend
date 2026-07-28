import express from "express";
import PostController from "../controllers/postController.js";
import LikeController from "../controllers/likeController.js";
import CommentController from "../controllers/commentController.js";
import authenticate from "../middlewares/authenticate.js";
import upload from "../middlewares/upload.js";
import validate from "../middlewares/validate.js";
import { listPostsQuerySchema, postIdParamSchema, createPostSchema, updatePostSchema, createCommentSchema } from "../schemas/postSchema.js";

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

// ── Like ──────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/posts/{id}/like:
 *   post:
 *     summary: Toggle like/unlike a post
 *     description: |
 *       Jika user sudah like → unlike (hapus like).  
 *       Jika user belum like → like (tambah like).  
 *       Mengembalikan status `liked` (boolean) dan total `likesCount`.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID post yang akan di-like/unlike
 *     responses:
 *       200:
 *         description: Like toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/LikeResponse' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Post not found
 */
router.post("/:id/like", authenticate, validate(postIdParamSchema, "params"), LikeController.toggle);

/**
 * @swagger
 * /api/v1/posts/{id}/like/status:
 *   get:
 *     summary: Check if current user liked the post
 *     description: |
 *       Mengecek apakah user yang sedang login sudah like post ini.  
 *       Berguna saat membuka halaman detail post untuk menampilkan status like.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID post yang dicek
 *     responses:
 *       200:
 *         description: Like status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/LikeResponse' }
 *       401:
 *         description: Missing or invalid token
 */
router.get("/:id/like/status", authenticate, validate(postIdParamSchema, "params"), LikeController.status);

// ── Comments ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/posts/{id}/comments:
 *   get:
 *     summary: List comments for a post (cursor-based pagination)
 *     description: |
 *       Mengambil daftar komentar dari sebuah post.  
 *       Public endpoint (tidak perlu JWT).  
 *       Menggunakan cursor-based pagination — kirim `cursor` = ID komentar terakhir dari response sebelumnya.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID post
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *         description: Jumlah komentar per halaman (max 50)
 *       - in: query
 *         name: cursor
 *         schema: { type: string, format: uuid }
 *         description: ID komentar terakhir dari halaman sebelumnya (untuk pagination)
 *     responses:
 *       200:
 *         description: Paginated list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/PaginatedCommentsResponse' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Post not found
 */
router.get("/:id/comments", validate(postIdParamSchema, "params"), CommentController.list);

/**
 * @swagger
 * /api/v1/posts/{id}/comments:
 *   post:
 *     summary: Create a comment on a post
 *     description: |
 *       Menambahkan komentar baru ke sebuah post.  
 *       Membutuhkan JWT. Body hanya berisi `content` (string, 1-1000 karakter).
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID post yang akan dikomentari
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ content ]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: "Kontennya bagus banget!"
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     comment: { $ref: '#/components/schemas/Comment' }
 *                     commentsCount: { type: integer }
 *       400:
 *         description: Validation error (content kosong atau terlalu panjang)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Post not found
 */
router.post(
    "/:id/comments",
    authenticate,
    validate(postIdParamSchema, "params"),
    validate(createCommentSchema, "body"),
    CommentController.create
);

/**
 * @swagger
 * /api/v1/posts/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment (owner or admin only)
 *     description: |
 *       Menghapus komentar. Hanya pemilik komentar atau admin yang bisa menghapus.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID komentar yang akan dihapus
 *     responses:
 *       200:
 *         description: Comment deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     commentsCount: { type: integer }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not allowed (bukan owner atau admin)
 *       404:
 *         description: Post or comment not found
 */
router.delete(
    "/:id/comments/:commentId",
    authenticate,
    validate(postIdParamSchema, "params"),
    CommentController.remove
);

export default router;
