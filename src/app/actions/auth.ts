"use server";

import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  newPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations";
import { sanitizeTextInput } from "@/lib/utils";
import { redirect } from "next/navigation";

export type AuthActionState = {
  error?: string;
  success?: string;
};

// ─── Login ──────────────────────────────────────────────────────────────────

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { error: "Email adresa nije potvrđena. Proverite inbox." };
    }
    return { error: "Pogrešan email ili lozinka." };
  }

  redirect("/dashboard");
}

// ─── Register ───────────────────────────────────────────────────────────────

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = {
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const safeName = sanitizeTextInput(result.data.full_name);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { full_name: safeName },
      emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Email adresa je već registrovana." };
    }
    return { error: "Greška pri registraciji. Pokušajte ponovo." };
  }

  return {
    success:
      "Registracija uspešna! Proverite email i kliknite na link za potvrdu.",
  };
}

// ─── Reset password (slanje emaila) ─────────────────────────────────────────

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = { email: formData.get("email") };

  const result = resetPasswordSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    result.data.email,
    {
      redirectTo: `${appUrl}/auth/callback?type=recovery`,
    },
  );

  if (error) {
    return { error: "Greška pri slanju emaila. Pokušajte ponovo." };
  }

  return {
    success: "Email za reset lozinke je poslat. Proverite inbox.",
  };
}

// ─── Postavljanje nove lozinke (posle recovery linka) ───────────────────────

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = {
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  };

  const result = newPasswordSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return { error: "Greška pri promeni lozinke. Link je možda istekao." };
  }

  redirect("/dashboard");
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
