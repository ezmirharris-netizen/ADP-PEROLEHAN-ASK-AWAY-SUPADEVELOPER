import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error("SUPABASE_URL dan SUPABASE_ANON_KEY belum dikonfigurasi.");
  }
  return createClient(url, key);
}
