import { SessionGuard } from "@/components/ui/SessionGuard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <SessionGuard />
      <nav className="bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-bold text-[var(--text-primary)] text-lg">
                Admin Panel
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <NavLink href="/admin">Dashboard</NavLink>
                <NavLink href="/admin/users">Korisnici</NavLink>
                <NavLink href="/admin/logs">Logovi</NavLink>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              &larr; Nazad na app
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
    >
      {children}
    </Link>
  );
}
