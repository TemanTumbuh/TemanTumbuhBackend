import supabase from "../config/supabase.js";

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
}

export default UserModel;