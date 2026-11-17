import supabase from "../config/supabase.js";

const ROLE_COLUMNS =
  "id, name, slug, description, is_system, is_default, is_superadmin, created_at, updated_at";
const ROLE_WITH_PERMISSIONS = `${ROLE_COLUMNS}, role_permissions(permissions(id, key))`;

class RoleModel {
  static async getAll() {
    const { data, error } = await supabase
      .from("roles")
      .select(ROLE_WITH_PERMISSIONS)
      .order("id", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from("roles")
      .select(ROLE_WITH_PERMISSIONS)
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") return null;
    if (error) throw error;
    return data;
  }

  // Role yang dipakai untuk user baru / user tanpa role. Null jika belum ada yang ditandai.
  static async getDefault() {
    const { data, error } = await supabase
      .from("roles")
      .select(ROLE_WITH_PERMISSIONS)
      .eq("is_default", true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async create({ name, slug, description }) {
    const { data, error } = await supabase
      .from("roles")
      .insert({ name, slug, description: description ?? null })
      .select(ROLE_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, fields) {
    const { data, error } = await supabase
      .from("roles")
      .update(fields)
      .eq("id", id)
      .select(ROLE_COLUMNS)
      .single();

    if (error && error.code === "PGRST116") return null;
    if (error) throw error;
    return data;
  }

  static async remove(id) {
    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) throw error;
  }

  // Ganti seluruh permission sebuah role secara atomik (fungsi SQL set_role_permissions).
  static async setPermissions(roleId, permissionKeys) {
    const { error } = await supabase.rpc("set_role_permissions", {
      p_role_id: roleId,
      p_keys: permissionKeys,
    });
    if (error) throw error;
  }

  // Jadikan role ini default (fungsi SQL set_default_role).
  static async setDefault(roleId) {
    const { error } = await supabase.rpc("set_default_role", { p_role_id: roleId });
    if (error) throw error;
  }

  // Jumlah user yang memakai role tertentu.
  static async countUsers(roleId) {
    const { count, error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role_id", roleId);

    if (error) throw error;
    return count ?? 0;
  }

  // Jumlah user yang memegang role superadmin (untuk mencegah admin terakhir hilang).
  static async countSuperadminUsers() {
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select("id")
      .eq("is_superadmin", true);
    if (rolesError) throw rolesError;

    const ids = (roles ?? []).map((r) => r.id);
    if (ids.length === 0) return 0;

    const { count, error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .in("role_id", ids);

    if (error) throw error;
    return count ?? 0;
  }
}

export default RoleModel;
