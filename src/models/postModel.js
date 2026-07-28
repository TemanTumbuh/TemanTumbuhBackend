import supabase from "../config/supabase.js";

const PostModel = {
    // Ambil semua post dengan cursor-based pagination.
    // Join: users (author), post_media (array), like & comment counts via embedded count.
    async getAll({ limit = 20, cursor = null, categoryId = null } = {}) {
        // Resolve cursor timestamp SEBELUM membangun query utama
        let cursorTimestamp = null;
        if (cursor) {
            const { data: cursorPost, error: cursorErr } = await supabase
                .from("posts")
                .select("created_at")
                .eq("id", cursor)
                .single();

            if (cursorErr || !cursorPost) {
                throw new Error("Cursor tidak valid.");
            }
            cursorTimestamp = cursorPost.created_at;
        }

        // Bangun query utama
        let query = supabase
            .from("posts")
            .select(
                `
        id,
        content,
        is_pinned,
        created_at,
        category_id,
        user_id,
        categories ( id, name, slug ),
        users!posts_user_id_fkey ( id, username, avatar_url ),
        post_media ( id, media_url, media_type, sort_order ),
        likes:likes(count),
        comments:comments(count)
      `
            )
            .order("created_at", { ascending: false })
            .limit(limit);

        if (cursorTimestamp) {
            query = query.lt("created_at", cursorTimestamp);
        }

        if (categoryId) {
            query = query.eq("category_id", categoryId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    // Ambil satu post berdasarkan ID.
    async getById(id) {
        const { data, error } = await supabase
            .from("posts")
            .select(
                `
        id,
        content,
        is_pinned,
        created_at,
        category_id,
        user_id,
        categories ( id, name, slug ),
        users!posts_user_id_fkey ( id, username, avatar_url ),
        post_media ( id, media_url, media_type, sort_order ),
        likes:likes(count),
        comments:comments(count)
      `
            )
            .eq("id", id)
            .single();

        if (error && error.code === "PGRST116") return null;
        if (error) throw error;
        return data;
    },

    // Buat post baru (teks only).
    async create({ userId, content, categoryId = null }) {
        const { data, error } = await supabase
            .from("posts")
            .insert({
                user_id: userId,
                content: content ?? null,
                category_id: categoryId ?? null,
            })
            .select("id, content, is_pinned, created_at, category_id, user_id")
            .single();

        if (error) throw error;
        return data;
    },

    // Update konten teks dan/atau kategori.
    async update(id, { content, categoryId }) {
        const fields = {};
        if (content !== undefined) fields.content = content;
        if (categoryId !== undefined) fields.category_id = categoryId; // boleh null

        // Guard: jangan panggil .update({}) jika tidak ada field yang berubah
        if (Object.keys(fields).length === 0) {
            return this.getById(id);
        }

        const { data, error } = await supabase
            .from("posts")
            .update(fields)
            .eq("id", id)
            .select("id, content, is_pinned, created_at, category_id, user_id")
            .single();

        if (error) throw error;
        return data;
    },

    // Hapus post (cascade ke post_media otomatis via DB).
    async remove(id) {
        const { error } = await supabase.from("posts").delete().eq("id", id);
        if (error) throw error;
    },

    // Insert satu baris ke post_media.
    async addMedia({ postId, mediaUrl, mediaType, sortOrder }) {
        const { data, error } = await supabase
            .from("post_media")
            .insert({
                post_id: postId,
                media_url: mediaUrl,
                media_type: mediaType,
                sort_order: sortOrder,
            })
            .select("id, media_url, media_type, sort_order")
            .single();

        if (error) throw error;
        return data;
    },

    // Ambil semua media dari satu post (untuk ambil URLs sebelum delete dari R2).
    async getMediaByPostId(postId) {
        const { data, error } = await supabase
            .from("post_media")
            .select("id, media_url, media_type, sort_order")
            .eq("post_id", postId);

        if (error) throw error;
        return data ?? [];
    },
};

export default PostModel;
