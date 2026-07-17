import supabase from "../config/supabase.js";

class RefreshTokenModel {
    // Simpan hash refresh token baru untuk user.
    static async create({ userId, tokenHash, expiresAt }) {
        const { data, error } = await supabase
            .from("refresh_tokens")
            .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Cari row berdasarkan hash token (dipakai saat verifikasi refresh/logout).
    static async findByTokenHash(tokenHash) {
        const { data, error } = await supabase
            .from("refresh_tokens")
            .select("*")
            .eq("token_hash", tokenHash)
            .single();

        if (error && error.code !== "PGRST116") throw error;
        return data ?? null;
    }

    // Hapus satu row berdasarkan hash (rotation: buang token lama, atau logout).
    static async removeByTokenHash(tokenHash) {
        const { error } = await supabase.from("refresh_tokens").delete().eq("token_hash", tokenHash);
        if (error) throw error;
    }

    // Hapus semua refresh token milik user (mis. saat suspend/hapus akun).
    static async removeAllForUser(userId) {
        const { error } = await supabase.from("refresh_tokens").delete().eq("user_id", userId);
        if (error) throw error;
    }
}

export default RefreshTokenModel;
