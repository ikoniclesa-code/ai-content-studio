import { z } from "zod";

// ─── Auth validacije ────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Unesite važeću email adresu"),
  password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
});

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Ime mora imati najmanje 2 karaktera")
      .max(100, "Ime je predugo"),
    email: z.string().email("Unesite važeću email adresu"),
    password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Lozinke se ne podudaraju",
    path: ["confirm_password"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email("Unesite važeću email adresu"),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Lozinke se ne podudaraju",
    path: ["confirm_password"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
