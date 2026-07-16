import express from "express";
import PostController from "../controllers/postController.js";
import authenticate from "../middlewares/authenticate.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// ── Publik ────────────────────────────────────────────────────────────────────
// GET /api/v1/posts           
router.get("/", PostController.getAll);

// GET /api/v1/posts/:id      
router.get("/:id", PostController.getById);

// ── Butuh JWT ─────────────────────────────────────────────────────────────────
// DELETE /api/v1/posts/:id    
router.delete("/:id", authenticate, PostController.remove);

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
    PostController.create
);

// PATCH /api/v1/posts/:id     
router.patch("/:id", authenticate, PostController.update);

export default router;

