import supabase from "../config/supabase.js";

class PermissionModel {
  // Seluruh katalog permission, urut per resource lalu key.
  static async getAll() {
    const { data, error } = await supabase
      .from("permissions")
      .select("id, key, resource, description")
      .order("resource", { ascending: true })
      .order("key", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }
}

export default PermissionModel;
