import supabase from "../config/supabase.js";

const COLUMNS = "id, name, slug, is_active";

const CategoryModel = {
    async getAll({ includeInactive = false } = {}) {
        let query = supabase.from("categories").select(COLUMNS).order("name", { ascending: true });
        if (!includeInactive) query = query.eq("is_active", true);

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    async getById(id) {
        const { data, error } = await supabase.from("categories").select(COLUMNS).eq("id", id).maybeSingle();
        if (error) throw error;
        return data;
    },

    async create({ name, slug, isActive = true }) {
        const { data, error } = await supabase
            .from("categories")
            .insert({ name, slug, is_active: isActive })
            .select(COLUMNS)
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, fields) {
        const { data, error } = await supabase
            .from("categories")
            .update(fields)
            .eq("id", id)
            .select(COLUMNS)
            .maybeSingle();
        if (error) throw error;
        return data; // null jika id tidak ada
    },

    async remove(id) {
        const { data, error } = await supabase.from("categories").delete().eq("id", id).select("id");
        if (error) throw error;
        return (data ?? []).length > 0;
    },

    async countPosts(id) {
        const { count, error } = await supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("category_id", id);
        if (error) throw error;
        return count ?? 0;
    },
};

export default CategoryModel;