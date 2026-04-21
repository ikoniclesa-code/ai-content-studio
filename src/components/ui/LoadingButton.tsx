"use client";

import { useCallback, useRef, type ButtonHTMLAttributes } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  /** Cooldown in ms after click before button re-enables (default: 1000) */
  cooldownMs?: number;
}

export function LoadingButton({
  loading = false,
  loadingText,
  cooldownMs = 1000,
  children,
  onClick,
  disabled,
  className = "",
  ...rest
}: LoadingButtonProps) {
  const cooldownRef = useRef(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (cooldownRef.current || loading || disabled) {
        e.preventDefault();
        return;
      }

      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, cooldownMs);

      onClick?.(e);
    },
    [onClick, loading, disabled, cooldownMs],
  );

  const isDisabled = disabled || loading;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${className}`}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
