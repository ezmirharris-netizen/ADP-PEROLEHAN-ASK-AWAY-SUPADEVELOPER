import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabaseKey = process.env["SUPABASE_ANON_KEY"];
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set.");
  }
  _supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});
