import supabase from "../config/supabase.js";

class OauthExchangeCodeModel {
    // Simpan one-time code setelah callback Google sukses.
    static async create({ code, userId, expiresAt }) {
        const { error } = await supabase
            .from("oauth_exchange_codes")
            .insert({ code, user_id: userId, expires_at: expiresAt });

        if (error) throw error;
    }

    // Ambil + langsung hapus (one-time use). Supabase JS tidak punya atomic
    // "delete...returning" terpisah dari select, jadi select dulu lalu delete.
    static async consume(code) {
        const { data, error } = await supabase
            .from("oauth_exchange_codes")
            .select("*")
            .eq("code", code)
            .single();

        if (error && error.code === "PGRST116") return null;
        if (error) throw error;

        await supabase.from("oauth_exchange_codes").delete().eq("code", code);

        return data;
    }
}

export default OauthExchangeCodeModel;
