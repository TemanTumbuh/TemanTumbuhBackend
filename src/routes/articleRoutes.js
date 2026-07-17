import { Router } from "express";
import {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} from "../controllers/articleController.js";
import validate from "../middlewares/validate.js";
import { articleIdParamSchema } from "../schemas/articleSchema.js";

const router = Router();

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: List all articles
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: List of articles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Article' }
 *       400:
 *         description: Database error
 */
router.get("/", getAll);

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get an article by ID
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Article found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Article' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Article not found
 */
router.get("/:id", validate(articleIdParamSchema, "params"), getOne);

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create an article
 *     tags: [Articles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Article created
 *       400:
 *         description: Database error
 */
router.post("/", createOne);

/**
 * @swagger
 * /articles/{id}:
 *   put:
 *     summary: Update an article
 *     tags: [Articles]
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
 *     responses:
 *       200:
 *         description: Article updated
 *       400:
 *         description: Validation error or database error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Article not found
 */
router.put("/:id", validate(articleIdParamSchema, "params"), updateOne);

/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Delete an article
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Remaining articles after delete
 *       400:
 *         description: Validation error or database error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete("/:id", validate(articleIdParamSchema, "params"), deleteOne);

export default router;
