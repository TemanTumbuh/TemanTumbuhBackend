import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import realtimeRoutes from "./routes/realtimeRoutes.js";

const app = express();

// ---------- CORS ----------
// CORS_ORIGINS di .env:
//   "*"                           -> semua situs boleh mengakses
//   "https://a.com,https://b.com" -> hanya situs yang di-whitelist
const allowedOrigins = (process.env.CORS_ORIGINS || "*")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const allowAll = allowedOrigins.includes("*");

app.use(
    cors({
        origin: allowAll
            ? "*"
            : (origin, callback) => {
                  // !origin = request tanpa header Origin (Postman, curl, server-to-server)
                  if (!origin || allowedOrigins.includes(origin)) {
                      return callback(null, true);
                  }
                  // Tidak diberi header CORS -> diblokir oleh browser
                  return callback(null, false);
              },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        maxAge: 86400, // cache preflight selama 24 jam
    })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Root route
app.get("/", (_, res) => res.json({ info: "TemanTumbuh Backend API" }));

// API docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/auth", authRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/realtime", realtimeRoutes);

// Global error handler (harus 4 argumen)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    console.error("[GlobalError]", err);
    res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Internal server error" });
});

export default app;
