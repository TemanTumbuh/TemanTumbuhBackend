import supabase from "../config/supabase.js";

const TABLE = "posts";

// Ambil semua artikel
const findAll = async () => {
  const { data, error } = await supabase.from(TABLE).select("*");
  return { data, error };
};

// Ambil satu artikel berdasarkan ID
const findById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
};

// Buat artikel baru
const create = async (body) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(body)
    .select("*");
  return { data, error };
};

// Update artikel berdasarkan ID
const update = async (id, fields) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(fields)
    .eq("id", id)
    .select("*");
  return { data, error };
};

// Hapus artikel berdasarkan ID
const remove = async (id) => {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  return { error };
};

export default { findAll, findById, create, update, remove };
