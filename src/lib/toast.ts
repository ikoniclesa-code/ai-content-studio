import toast from "react-hot-toast";

export const showSuccess = (message: string) =>
  toast.success(message, { duration: 4000 });

export const showError = (message: string) =>
  toast.error(message, { duration: 6000 });

export const showWarning = (message: string) =>
  toast(message, {
    icon: "⚠️",
    duration: 5000,
    style: {
      background: "#FFFBEB",
      color: "#92400E",
      border: "1px solid #FDE68A",
    },
  });

export const showInfo = (message: string) =>
  toast(message, {
    icon: "ℹ️",
    duration: 4000,
    style: {
      background: "#EFF6FF",
      color: "#1E40AF",
      border: "1px solid #BFDBFE",
    },
  });

export const showLoading = (message: string) => toast.loading(message);

export const dismissToast = (id: string) => toast.dismiss(id);

/**
 * Wraps an async operation with loading/success/error toasts.
 */
export async function withToast<T>(
  fn: () => Promise<T>,
  opts: { loading: string; success: string; error?: string },
): Promise<T | undefined> {
  const id = showLoading(opts.loading);
  try {
    const result = await fn();
    toast.dismiss(id);
    showSuccess(opts.success);
    return result;
  } catch (err) {
    toast.dismiss(id);
    const message =
      opts.error ?? (err instanceof Error ? err.message : "Došlo je do greške");
    showError(message);
    return undefined;
  }
}
