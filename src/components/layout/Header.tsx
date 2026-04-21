"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, Bell, LogOut, User, Shield } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
  userEmail?: string;
  credits?: number;
  isAdmin?: boolean;
}

export function Header({ onMenuClick, userName, userEmail, credits, isAdmin }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center px-4 sm:px-6 gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        aria-label="Otvori meni"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Credits badge */}
      {credits !== undefined && (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/20">
          <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.35 5.35 0 01-.488-.521h2.751a1 1 0 000-2H7.5c-.048-.327-.075-.66-.075-1s.027-.673.075-1h3.498a1 1 0 100-2H8.248c.14-.18.318-.373.488-.521z" />
          </svg>
          <span className="text-xs font-semibold text-[var(--accent)]">
            {credits.toLocaleString()}
          </span>
        </div>
      )}

      {/* Notifications */}
      <button className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
        <Bell className="w-[18px] h-[18px]" />
      </button>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">
              {userName || "Korisnik"}
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-tight">
              {userEmail || ""}
            </p>
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2.5 border-b border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--text-primary)]">{userName}</p>
              <p className="text-xs text-[var(--text-secondary)]">{userEmail}</p>
            </div>
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              >
                <User className="w-4 h-4" />
                Profil
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                >
                  <Shield className="w-4 h-4" />
                  Admin panel
                </Link>
              )}
            </div>
            <div className="border-t border-[var(--border)] pt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-bg)]"
              >
                <LogOut className="w-4 h-4" />
                Odjavi se
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
