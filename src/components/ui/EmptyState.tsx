import Link from "next/link";
import { FileText, Image, Video, Clock, BarChart3, Search, Plus } from "lucide-react";

interface EmptyStateProps {
  icon?: "document" | "image" | "video" | "history" | "chart" | "search";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const iconMap = {
  document: FileText,
  image: Image,
  video: Video,
  history: Clock,
  chart: BarChart3,
  search: Search,
};

export function EmptyState({
  icon = "document",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] mb-5">
        <Icon className="w-7 h-7 text-[var(--text-secondary)]" />
      </div>

      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">{description}</p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
