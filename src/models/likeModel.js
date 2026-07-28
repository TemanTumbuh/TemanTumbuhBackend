import supabase from "../config/supabase.js";

const LikeModel = {
    async findByUserAndPost(userId, postId) {
        const { data, error } = await supabase
            .from("likes")
            .select("*")
            .eq("user_id", userId)
            .eq("post_id", postId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async create(userId, postId) {
        const { data, error } = await supabase
            .from("likes")
            .insert({ user_id: userId, post_id: postId })
            .select("*")
            .single();

        if (error) throw error;
        return data;
    },

    async remove(userId, postId) {
        const { error } = await supabase
            .from("likes")
            .delete()
            .eq("user_id", userId)
            .eq("post_id", postId);

        if (error) throw error;
    },

    async countByPost(postId) {
        const { count, error } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId);

        if (error) throw error;
        return count ?? 0;
    },
};

export default LikeModel;
