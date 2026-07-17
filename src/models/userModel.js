import supabase from "../config/supabase.js";

const PUBLIC_COLUMNS =
  "id, username, email, bio, avatar_url, is_active, created_at, role_id, place_id, last_login";

class UserModel {
  // Cari user berdasarkan email
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  }

  // Buat user baru
  static async create(userData) {
    const { data, error } = await supabase
      .from("users")
      .insert(userData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // Ambil daftar user dengan pagination, sort, dan search.
  static async getAll({ page = 0, limit = 20, order = "desc", orderBy = "created_at", search = null, searchBy = "username", includeInactive = false } = {}) {
    let query = supabase
      .from("users")
      .select(PUBLIC_COLUMNS, { count: "exact" })
      .order(orderBy, { ascending: order === "asc" });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    if (search) {
      query = query.ilike(searchBy, `%${search}%`);
    }

    if (limit > 0) {
      const from = page * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data ?? [], total: count ?? 0 };
  }

  // Ambil satu user berdasarkan ID (tanpa password_hash).
  static async getById(id) {
    const { data, error } = await supabase
      .from("users")
      .select(PUBLIC_COLUMNS)
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") return null;
    if (error) throw error;
    return data;
  }

  // Update sebagian field user.
  static async update(id, fields) {
    const { data, error } = await supabase
      .from("users")
      .update(fields)
      .eq("id", id)
      .select(PUBLIC_COLUMNS)
      .single();

    if (error && error.code === "PGRST116") return null;
    if (error) throw error;
    return data;
  }

  // Hard delete user (cascade ditangani oleh DB).
  static async remove(id) {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
  }

  // Update last_login ke waktu sekarang.
  static async updateLastLogin(id) {
    const { error } = await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }
}

export default UserModel;
