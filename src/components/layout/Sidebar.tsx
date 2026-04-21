"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Image,
  Video,
  Clock,
  BarChart3,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create-text", label: "Kreiraj tekst", icon: FileText },
  { href: "/create-image", label: "Kreiraj sliku", icon: Image },
  { href: "/create-video", label: "Kreiraj video", icon: Video },
  { href: "/history", label: "Istorija", icon: Clock },
  { href: "/analytics", label: "Analitika", icon: BarChart3 },
  { href: "/settings", label: "Podešavanja", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--border)]">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-bold text-[var(--text-primary)]">
              AI Content Studio
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--sidebar-active)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-[var(--accent)]" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-[var(--border)]">
          <div className="px-3 py-2.5 bg-[var(--accent-light)] rounded-lg">
            <p className="text-xs font-medium text-[var(--accent)]">Potrebna pomoć?</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">support@aicontentstudio.com</p>
          </div>
        </div>
      </aside>
    </>
  );
}
