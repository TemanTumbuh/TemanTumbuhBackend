import LikeModel from "../models/likeModel.js";

const LikeService = {
    async toggleLike(postId, userId) {
        const existing = await LikeModel.findByUserAndPost(userId, postId);

        if (existing) {
            await LikeModel.remove(userId, postId);
            const count = await LikeModel.countByPost(postId);
            return { liked: false, likesCount: count };
        }

        await LikeModel.create(userId, postId);
        const count = await LikeModel.countByPost(postId);
        return { liked: true, likesCount: count };
    },

    async getLikeStatus(postId, userId) {
        const existing = await LikeModel.findByUserAndPost(userId, postId);
        const count = await LikeModel.countByPost(postId);
        return { liked: !!existing, likesCount: count };
    },
};

export default LikeService;
