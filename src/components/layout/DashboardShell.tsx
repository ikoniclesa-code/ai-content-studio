"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, avatar_url, language, theme, onboarding_completed, credits, stripe_customer_id, is_blocked, created_at, updated_at")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("[DashboardShell] Profile query error:", error);
          return;
        }
        if (data) setProfile(data as Profile);
      } catch (err) {
        console.error("[DashboardShell] Error loading profile:", err);
      }
    }
    loadProfile();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          userName={profile?.full_name || undefined}
          userEmail={profile?.email}
          credits={profile?.credits}
          isAdmin={profile?.role === "admin"}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
