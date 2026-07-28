import CommentService from "../services/commentService.js";
import PostModel from "../models/postModel.js";

const CommentController = {
    async list(req, res) {
        try {
            const { id: postId } = req.params;
            const { limit, cursor } = req.query;

            const post = await PostModel.getById(postId);
            if (!post) {
                return res.status(404).json({ success: false, message: "Post tidak ditemukan." });
            }

            const result = await CommentService.getComments(postId, { limit, cursor });
            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            console.error("[CommentController.list]", err);
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },

    async create(req, res) {
        try {
            const { id: postId } = req.params;
            const { content } = req.body;

            const post = await PostModel.getById(postId);
            if (!post) {
                return res.status(404).json({ success: false, message: "Post tidak ditemukan." });
            }

            const result = await CommentService.createComment(postId, req.user.id, content);
            return res.status(201).json({ success: true, message: "Komentar berhasil ditambahkan.", data: result });
        } catch (err) {
            console.error("[CommentController.create]", err);
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },

    async remove(req, res) {
        try {
            const { id: postId, commentId } = req.params;

            const post = await PostModel.getById(postId);
            if (!post) {
                return res.status(404).json({ success: false, message: "Post tidak ditemukan." });
            }

            const result = await CommentService.deleteComment(commentId, postId, req.user);
            return res.status(200).json({ success: true, message: "Komentar berhasil dihapus.", data: result });
        } catch (err) {
            console.error("[CommentController.remove]", err);
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },
};

export default CommentController;
