import express from "express";
import AuthController from "../controllers/authController.js";
import authenticate from "../middlewares/authenticate.js";
import validate from "../middlewares/validate.js";
import {
    registerSchema,
    loginSchema,
    refreshTokenBodySchema,
    googleCallbackQuerySchema,
    exchangeCodeSchema,
} from "../schemas/authSchema.js";

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (email/password) and auto-login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, confirmPassword]
 *             properties:
 *               username: { type: string, minLength: 3, maxLength: 50 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, maxLength: 72 }
 *               confirmPassword: { type: string, minLength: 8, maxLength: 72 }
 *     responses:
 *       201:
 *         description: Registered and logged in
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 */
router.post("/register", validate(registerSchema, "body"), AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login success, returns accessToken + refreshToken
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials, or account uses another provider
 */
router.post("/login", validate(loginSchema, "body"), AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Exchange a refresh token for a new access + refresh token pair (rotation)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New access + refresh token
 *       400:
 *         description: Validation error
 *       401:
 *         description: Refresh token invalid, revoked, or expired
 */
router.post("/refresh", validate(refreshTokenBodySchema, "body"), AuthController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Revoke a refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out
 *       400:
 *         description: Validation error
 */
router.post("/logout", validate(refreshTokenBodySchema, "body"), AuthController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Missing or invalid access token
 */
router.get("/me", authenticate, AuthController.me);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Redirect to Google's OAuth consent screen
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google
 */
router.get("/google", AuthController.googleRedirect);

/**
 * @swagger
 * /auth/callback:
 *   get:
 *     summary: Google OAuth callback - verifies state + code, issues a one-time exchange code, redirects to frontend
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: state
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       302:
 *         description: Redirect to FRONTEND_REDIRECT_URL with ?code=... (or ?error=... on failure)
 */
router.get("/callback", validate(googleCallbackQuerySchema, "query"), AuthController.googleCallback);

/**
 * @swagger
 * /auth/exchange:
 *   post:
 *     summary: Exchange a one-time OAuth code (from the Google redirect) for real tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Access + refresh token
 *       401:
 *         description: Code invalid, already used, or expired
 */
router.post("/exchange", validate(exchangeCodeSchema, "body"), AuthController.exchange);

export default router;
