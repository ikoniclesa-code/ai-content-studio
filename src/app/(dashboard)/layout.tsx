import { SessionGuard } from "@/components/ui/SessionGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <SessionGuard />
      {children}
    </DashboardShell>
  );
}
