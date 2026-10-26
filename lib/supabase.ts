import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

/** Server-side client with the secret key. Never import this from a client component. */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL과 SUPABASE_SECRET_KEY 환경 변수가 필요해요. docs/SUPABASE.md를 참고해 .env.local에 넣어 주세요.",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
