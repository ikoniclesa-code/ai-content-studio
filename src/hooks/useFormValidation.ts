"use client";

import { useCallback, useState } from "react";
import type { ZodSchema, ZodError } from "zod";

interface FieldErrors {
  [field: string]: string;
}

/**
 * Client-side form validation using Zod schemas.
 * Returns field-level errors that can be displayed inline.
 */
export function useFormValidation<T>(schema: ZodSchema<T>) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = useCallback(
    (data: unknown): data is T => {
      const result = schema.safeParse(data);
      if (result.success) {
        setFieldErrors({});
        return true;
      }

      const errors: FieldErrors = {};
      (result.error as ZodError).issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path && !errors[path]) {
          errors[path] = issue.message;
        }
      });
      setFieldErrors(errors);
      return false;
    },
    [schema],
  );

  const clearErrors = useCallback(() => setFieldErrors({}), []);

  const clearField = useCallback(
    (field: string) =>
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      }),
    [],
  );

  return { fieldErrors, validate, clearErrors, clearField };
}
