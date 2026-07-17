import PostService from "../services/postService.js";

const PostController = {
    // GET /api/v1/posts
    async getAll(req, res) {
        try {
            const { limit, cursor, categoryId } = req.query;
            const result = await PostService.getAllPosts({ limit, cursor, categoryId });

            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            console.error("[PostController.getAll]", err);
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },

    // GET /api/v1/posts/:id
    async getById(req, res) {
        try {
            const post = await PostService.getPostById(req.params.id);
            return res.status(200).json({ success: true, data: post });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },


    // DELETE /api/v1/posts/:id
    async remove(req, res) {
        try {
            await PostService.deletePost(req.params.id, req.user);
            return res.status(200).json({ success: true, message: "Post berhasil dihapus." });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },


    // PATCH /api/v1/posts/:id
    async update(req, res) {
        try {
            const { content, categoryId } = req.body;
            const post = await PostService.updatePost(
                req.params.id,
                { content, categoryId },
                req.user
            );
            return res.status(200).json({ success: true, message: "Post berhasil diperbarui.", data: post });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },

    // POST /api/v1/posts — buat posting (teks saja, teks + gambar, atau gambar saja)
    // Menerima multipart/form-data. req.files = [] jika tidak ada gambar.
    async create(req, res) {
        try {
            const { content, categoryId } = req.body;
            const files = req.files ?? [];

            const post = await PostService.createPostWithMedia({
                userId: req.user.id,
                content,
                categoryId,
                files,
            });

            return res.status(201).json({ success: true, message: "Post berhasil dibuat.", data: post });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },
};


export default PostController;
