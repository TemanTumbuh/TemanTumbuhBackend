import LikeService from "../services/likeService.js";
import PostModel from "../models/postModel.js";

const LikeController = {
    async toggle(req, res) {
        try {
            const { id: postId } = req.params;

            const post = await PostModel.getById(postId);
            if (!post) {
                return res.status(404).json({ success: false, message: "Post tidak ditemukan." });
            }

            const result = await LikeService.toggleLike(postId, req.user.id);
            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            console.error("[LikeController.toggle]", err);
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },

    async status(req, res) {
        try {
            const { id: postId } = req.params;
            const result = await LikeService.getLikeStatus(postId, req.user.id);
            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            console.error("[LikeController.status]", err);
            return res.status(err.status ?? 500).json({ success: false, message: err.message });
        }
    },
};

export default LikeController;
