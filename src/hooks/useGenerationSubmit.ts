"use client";

import { useCallback, useRef, useState } from "react";
import { showSuccess, showError, showWarning } from "@/lib/toast";
import type { GenerationResponse } from "@/types/api";

interface UseGenerationSubmitOptions {
  endpoint: "/api/generate/text" | "/api/generate/image" | "/api/generate/video";
  onSuccess?: (data: GenerationResponse & { success: true }) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Niste prijavljeni. Prijavite se ponovo.",
  NO_SUBSCRIPTION: "Nemate aktivnu pretplatu.",
  INSUFFICIENT_CREDITS: "Nemate dovoljno kredita za ovu akciju.",
  RATE_LIMITED: "Previše zahteva. Sačekajte minut.",
  VALIDATION_ERROR: "Proverite unete podatke.",
  AI_SERVICE_ERROR: "AI servis je trenutno nedostupan. Krediti NISU oduzeti.",
  INTERNAL_ERROR: "Došlo je do greške na serveru. Pokušajte ponovo.",
};

export function useGenerationSubmit({ endpoint, onSuccess }: UseGenerationSubmitOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<(GenerationResponse & { success: true }) | null>(null);
  const lockRef = useRef(false);

  const submit = useCallback(
    async (data: Record<string, unknown>) => {
      if (lockRef.current) return;
      lockRef.current = true;
      setIsSubmitting(true);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const json = (await res.json()) as GenerationResponse;

        if (!json.success) {
          const friendlyMsg = json.error || ERROR_MESSAGES[json.code] || "Došlo je do greške.";

          if (json.code === "INSUFFICIENT_CREDITS") {
            showWarning(friendlyMsg);
          } else if (json.code === "RATE_LIMITED") {
            showWarning(friendlyMsg);
          } else if (json.code === "UNAUTHORIZED") {
            showError(friendlyMsg);
            setTimeout(() => {
              window.location.href = "/login";
            }, 2000);
          } else {
            showError(friendlyMsg);
          }
          return;
        }

        setResult(json);
        showSuccess("Sadržaj je uspešno generisan!");
        onSuccess?.(json);
      } catch (err) {
        if (err instanceof TypeError && err.message.includes("fetch")) {
          showError("Nema internet konekcije. Proverite vezu i pokušajte ponovo.");
        } else {
          showError("Došlo je do neočekivane greške. Pokušajte ponovo.");
        }
      } finally {
        setTimeout(() => {
          lockRef.current = false;
          setIsSubmitting(false);
        }, 1000);
      }
    },
    [endpoint, onSuccess],
  );

  const reset = useCallback(() => setResult(null), []);

  return { isSubmitting, result, submit, reset };
}
