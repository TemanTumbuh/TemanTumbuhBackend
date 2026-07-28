import supabase from "../config/supabase.js";

const CommentModel = {
    async getByPostId(postId, { limit = 20, cursor = null } = {}) {
        let query = supabase
            .from("comments")
            .select(`
                id,
                content,
                created_at,
                parent_id,
                user_id,
                users!comments_user_id_fkey ( id, username, avatar_url )
            `)
            .eq("post_id", postId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (cursor) {
            const { data: cursorComment } = await supabase
                .from("comments")
                .select("created_at")
                .eq("id", cursor)
                .single();

            if (cursorComment) {
                query = query.lt("created_at", cursorComment.created_at);
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    async getById(id) {
        const { data, error } = await supabase
            .from("comments")
            .select(`
                id,
                content,
                created_at,
                parent_id,
                post_id,
                user_id,
                users!comments_user_id_fkey ( id, username, avatar_url )
            `)
            .eq("id", id)
            .single();

        if (error && error.code === "PGRST116") return null;
        if (error) throw error;
        return data;
    },

    async create({ postId, userId, content }) {
        const { data, error } = await supabase
            .from("comments")
            .insert({
                post_id: postId,
                user_id: userId,
                content,
            })
            .select(`
                id,
                content,
                created_at,
                parent_id,
                user_id,
                users!comments_user_id_fkey ( id, username, avatar_url )
            `)
            .single();

        if (error) throw error;
        return data;
    },

    async remove(id) {
        const { error } = await supabase.from("comments").delete().eq("id", id);
        if (error) throw error;
    },

    async countByPost(postId) {
        const { count, error } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId);

        if (error) throw error;
        return count ?? 0;
    },
};

export default CommentModel;
