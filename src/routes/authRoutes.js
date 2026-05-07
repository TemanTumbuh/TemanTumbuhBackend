import express from "express";
import AuthController from "../controllers/authController.js";

const router = express.Router();

// Route untuk register
router.post("/register", AuthController.register);

// Route untuk login
router.post("/login", AuthController.login);

export default router;