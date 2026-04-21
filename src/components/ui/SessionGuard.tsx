"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { showWarning } from "@/lib/toast";

/**
 * Monitors the Supabase auth session and redirects to login
 * with a user-friendly toast when the session expires.
 */
export function SessionGuard() {
  const redirected = useRef(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !redirected.current) {
        redirected.current = true;
        showWarning("Sesija je istekla. Prijavite se ponovo.");
        setTimeout(() => {
          window.location.href = "/login?redirectTo=" + encodeURIComponent(window.location.pathname);
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
