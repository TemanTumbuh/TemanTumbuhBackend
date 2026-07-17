import "dotenv/config";
import express from "express";
import articleRoutes from "./routes/articleRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// Middleware
app.use(express.json());

// Root route
app.get("/", (_, res) => res.json({ info: "TemanTumbuh Backend API" }));

// Routes
app.use("/articles", articleRoutes);
app.use("/auth", authRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/users", userRoutes);

// Global error handler (harus 4 argumen)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    console.error("[GlobalError]", err);
    res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Internal server error" });
});

export default app;
