import express from "express";
import UserController from "../controllers/userController.js";
import authenticate from "../middlewares/authenticate.js";
import validate from "../middlewares/validate.js";
import { updateUserSchema, userIdParamSchema, getUsersQuerySchema } from "../schemas/userSchema.js";

const router = express.Router();

// ── Publik ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List / search users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, enum: [created_at, username, last_login], default: created_at }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: searchBy
 *         schema: { type: string, enum: [username, email], default: username }
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedUsersResponse' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
// GET /api/users
router.get("/", validate(getUsersQuerySchema, "query"), UserController.getAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: User not found
 */
// GET /api/users/:id
router.get("/:id", validate(userIdParamSchema, "params"), UserController.getById);

// ── Butuh JWT (self atau admin, dicek di service) ────────────────────────────

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
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
 *           schema: { $ref: '#/components/schemas/UpdateUserInput' }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not allowed to update this user
 *       404:
 *         description: User not found
 *       409:
 *         description: username conflict
 */
// PATCH /api/users/:id
router.patch(
    "/:id",
    authenticate,
    validate(userIdParamSchema, "params"),
    validate(updateUserSchema, "body"),
    UserController.update
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (hard delete, cascades to related rows)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: User deleted
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not allowed to delete this user
 *       404:
 *         description: User not found
 */
// DELETE /api/users/:id
router.delete("/:id", authenticate, validate(userIdParamSchema, "params"), UserController.remove);

export default router;
