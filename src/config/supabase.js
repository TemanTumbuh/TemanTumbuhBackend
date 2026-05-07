import { createClient } from "@supabase/supabase-js";

// Validasi env variables
if (!process.env.DATABASE_URL || !process.env.DATABASE_KEY) {
  console.error("Missing DATABASE_URL or DATABASE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(
  process.env.DATABASE_URL,
  process.env.DATABASE_KEY
);

export default supabase;
