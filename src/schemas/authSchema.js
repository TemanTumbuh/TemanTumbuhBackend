import { z } from "zod";

// ---- POST /auth/register ----
const registerSchema = z
    .object({
        username: z.string().min(3).max(50),
        email: z.string().email().max(255),
        password: z.string().min(8).max(72),
        confirmPassword: z.string().min(8).max(72),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password confirmation does not match",
        path: ["confirmPassword"],
    });

// ---- POST /auth/login ----
const loginSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(1),
});

// ---- POST /auth/refresh, POST /auth/logout ----
const refreshTokenBodySchema = z.object({
    refreshToken: z.string().min(1),
});

// ---- GET /auth/callback ----
const googleCallbackQuerySchema = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
});

// ---- POST /auth/exchange ----
const exchangeCodeSchema = z.object({
    code: z.string().min(1),
});

export { registerSchema, loginSchema, refreshTokenBodySchema, googleCallbackQuerySchema, exchangeCodeSchema };
