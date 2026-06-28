import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseKey = process.env["SUPABASE_ANON_KEY"];

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws as unknown as typeof WebSocket },
});
