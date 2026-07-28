import PostModel from "../models/postModel.js";
import MediaService from "./mediaService.js";

// Mapping raw DB row → camelCase JSON
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validasi dan format categoryId.
// Mengembalikan null jika string kosong atau tidak dikirim.
// Melempar error 400 jika format UUID tidak valid.
function formatCategoryId(val) {
    if (val === undefined || val === null) return null;
    const str = String(val).trim();
    if (str === "" || str === "null" || str === "undefined") return null;
    if (!UUID_REGEX.test(str)) {
        const err = new Error("categoryId harus berupa UUID yang valid.");
        err.status = 400;
        throw err;
    }
    return str;
}

// Mapping raw DB row → camelCase JSON
function formatPost(row) {
    return {
        id: row.id,
        content: row.content,
        isPinned: row.is_pinned,
        createdAt: row.created_at,
        category: row.categories
            ? {
                id: row.categories.id,
                name: row.categories.name,
                slug: row.categories.slug,
            }
            : null,
        author: row.users
            ? {
                id: row.users.id,
                username: row.users.username,
                avatarUrl: row.users.avatar_url,
            }
            : null,
        media: (row.post_media ?? [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((m) => ({
                id: m.id,
                mediaUrl: m.media_url,
                mediaType: m.media_type,
                sortOrder: m.sort_order,
            })),
        likesCount: row.likes?.[0]?.count ?? 0,
        commentsCount: row.comments?.[0]?.count ?? 0,
    };
}

const PostService = {
    // TEMAN-31: GET semua post (feed publik, cursor-based).
    async getAllPosts({ limit, cursor, categoryId } = {}) {
        const parsedLimit = Math.min(parseInt(limit) || 20, 50);
        const cleanCategoryId = categoryId ? formatCategoryId(categoryId) : null;
        const posts = await PostModel.getAll({ limit: parsedLimit + 1, cursor, categoryId: cleanCategoryId });

        const hasMore = posts.length > parsedLimit;
        const items = hasMore ? posts.slice(0, parsedLimit) : posts;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        return {
            posts: items.map(formatPost),
            nextCursor,
        };
    },

    // TEMAN-31: GET satu post by ID.
    async getPostById(id) {
        const post = await PostModel.getById(id);
        if (!post) {
            const err = new Error("Post tidak ditemukan.");
            err.status = 404;
            throw err;
        }
        return formatPost(post);
    },

    // TEMAN-31: DELETE post.
    // - Owner bisa hapus miliknya sendiri.
    // - Admin bisa hapus semua.
    async deletePost(id, reqUser) {
        const post = await PostModel.getById(id);
        if (!post) {
            const err = new Error("Post tidak ditemukan.");
            err.status = 404;
            throw err;
        }

        const isOwner = post.user_id === reqUser.id;
        const isAdmin = reqUser.role === "admin";

        if (!isOwner && !isAdmin) {
            const err = new Error("Tidak diizinkan menghapus post ini.");
            err.status = 403;
            throw err;
        }

        // Ambil media URLs sebelum delete dari DB
        const mediaList = await PostModel.getMediaByPostId(id);

        // Hapus dari DB (cascade ke post_media)
        await PostModel.remove(id);

        // Hapus dari R2 (async best-effort, tidak perlu ditunggu)
        for (const media of mediaList) {
            const key = MediaService.extractKeyFromUrl(media.media_url);
            MediaService.deleteFromR2(key);
        }
    },


    // TEMAN-32: PATCH update teks & kategori (hanya owner).
    async updatePost(id, { content, categoryId }, reqUser) {
        const post = await PostModel.getById(id);
        if (!post) {
            const err = new Error("Post tidak ditemukan.");
            err.status = 404;
            throw err;
        }

        if (post.user_id !== reqUser.id) {
            const err = new Error("Tidak diizinkan mengubah post ini.");
            err.status = 403;
            throw err;
        }

        // Jika post tidak punya media, content tidak boleh dikosongkan
        const hasMedia = (post.post_media ?? []).length > 0;
        if (!hasMedia && (content === "" || content === null)) {
            const err = new Error("content tidak boleh kosong jika post tidak punya media.");
            err.status = 400;
            throw err;
        }

        const cleanCategoryId = categoryId !== undefined ? formatCategoryId(categoryId) : undefined;
        await PostModel.update(id, { content, categoryId: cleanCategoryId });
        return this.getPostById(id);
    },

    // POST /api/v1/posts — unified endpoint.
    // Menangani semua kasus: teks saja, gambar saja, atau teks + gambar.
    // files = array dari multer (req.files), bisa [] jika tidak ada gambar.
    async createPostWithMedia({ userId, content, categoryId, files }) {
        const hasContent = content && content.trim() !== "";
        const hasFiles = files && files.length > 0;

        if (!hasContent && !hasFiles) {
            const err = new Error("Minimal satu dari content atau images harus ada.");
            err.status = 400;
            throw err;
        }

        const cleanCategoryId = formatCategoryId(categoryId);

        // Buat post dulu
        const newPost = await PostModel.create({
            userId,
            content: hasContent ? content.trim() : null,
            categoryId: cleanCategoryId,
        });

        // Proses tiap file: konversi WebP → upload R2 → insert post_media
        if (hasFiles) {
            for (let i = 0; i < files.length; i++) {
                const webpBuffer = await MediaService.convertToWebp(files[i].buffer);
                const key = `posts/${newPost.id}/${i}.webp`;
                const mediaUrl = await MediaService.uploadToR2(webpBuffer, key);

                await PostModel.addMedia({
                    postId: newPost.id,
                    mediaUrl,
                    mediaType: "image",
                    sortOrder: i,
                });
            }
        }

        return this.getPostById(newPost.id);
    },
};

export default PostService;
