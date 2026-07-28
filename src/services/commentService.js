import CommentModel from "../models/commentModel.js";

const CommentService = {
    async getComments(postId, { limit, cursor } = {}) {
        const parsedLimit = Math.min(parseInt(limit) || 20, 50);
        const comments = await CommentModel.getByPostId(postId, { limit: parsedLimit + 1, cursor });

        const hasMore = comments.length > parsedLimit;
        const items = hasMore ? comments.slice(0, parsedLimit) : comments;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        return {
            comments: items.map((c) => ({
                id: c.id,
                content: c.content,
                createdAt: c.created_at,
                parentId: c.parent_id,
                author: c.users
                    ? {
                        id: c.users.id,
                        username: c.users.username,
                        avatarUrl: c.users.avatar_url,
                    }
                    : null,
            })),
            nextCursor,
        };
    },

    async createComment(postId, userId, content) {
        if (!content || content.trim() === "") {
            const err = new Error("Komentar tidak boleh kosong.");
            err.status = 400;
            throw err;
        }

        const comment = await CommentModel.create({
            postId,
            userId,
            content: content.trim(),
        });

        const count = await CommentModel.countByPost(postId);

        return {
            comment: {
                id: comment.id,
                content: comment.content,
                createdAt: comment.created_at,
                parentId: comment.parent_id,
                author: comment.users
                    ? {
                        id: comment.users.id,
                        username: comment.users.username,
                        avatarUrl: comment.users.avatar_url,
                    }
                    : null,
            },
            commentsCount: count,
        };
    },

    async deleteComment(commentId, postId, reqUser) {
        const comment = await CommentModel.getById(commentId);
        if (!comment) {
            const err = new Error("Komentar tidak ditemukan.");
            err.status = 404;
            throw err;
        }

        if (comment.post_id !== postId) {
            const err = new Error("Komentar tidak ditemukan di post ini.");
            err.status = 404;
            throw err;
        }

        const isOwner = comment.user_id === reqUser.id;
        const isAdmin = reqUser.role === "admin";

        if (!isOwner && !isAdmin) {
            const err = new Error("Tidak diizinkan menghapus komentar ini.");
            err.status = 403;
            throw err;
        }

        await CommentModel.remove(commentId);
        const count = await CommentModel.countByPost(postId);
        return { commentsCount: count };
    },
};

export default CommentService;
