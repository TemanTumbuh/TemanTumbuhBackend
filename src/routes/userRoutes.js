import express from "express";
import UserController from "../controllers/userController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

// ── Publik ────────────────────────────────────────────────────────────────────
// GET /api/users
router.get("/", UserController.getAll);

// GET /api/users/:id
router.get("/:id", UserController.getById);

// ── Butuh JWT (self atau admin, dicek di service) ────────────────────────────
// PATCH /api/users/:id
router.patch("/:id", authenticate, UserController.update);

// DELETE /api/users/:id
router.delete("/:id", authenticate, UserController.remove);

export default router;
