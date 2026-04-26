import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (err) {
            // cookieStore.set() throws when called during Server Component rendering
            // (read-only context). That's expected — the proxy handles session refresh
            // on subsequent requests. Any other error is a real problem.
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.toLowerCase().includes("server component")) {
              console.error("[supabase/server] setAll failed unexpectedly:", msg);
            }
          }
        },
      },
    }
  );
}
