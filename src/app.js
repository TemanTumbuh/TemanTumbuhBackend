import express from "express";
import articleRoutes from "./routes/articleRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Middleware
app.use(express.json());

// Root route
app.get("/", (_, res) => res.json({ info: "Express app with Supabase" }));

// Routes
app.use("/articles", articleRoutes);
app.use("/auth", authRoutes);

export default app;
