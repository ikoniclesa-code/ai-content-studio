"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Prevents double-submit on async operations.
 * Returns `[isSubmitting, guardedSubmit]`.
 */
export function useSubmitGuard<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  cooldownMs: number = 1000,
): [boolean, (...args: Parameters<T>) => Promise<void>] {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lockRef = useRef(false);

  const guardedSubmit = useCallback(
    async (...args: Parameters<T>) => {
      if (lockRef.current) return;
      lockRef.current = true;
      setIsSubmitting(true);

      try {
        await fn(...args);
      } finally {
        setTimeout(() => {
          lockRef.current = false;
          setIsSubmitting(false);
        }, cooldownMs);
      }
    },
    [fn, cooldownMs],
  );

  return [isSubmitting, guardedSubmit];
}
