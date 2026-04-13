import { describe, expect, it } from "vitest";
import {
  loginSchema,
  newPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "./validations";

describe("loginSchema", () => {
  it("prihvata validan email i lozinku", () => {
    const r = loginSchema.safeParse({
      email: "korisnik@example.com",
      password: "123456",
    });
    expect(r.success).toBe(true);
  });

  it("odbija nevalidan email", () => {
    const r = loginSchema.safeParse({ email: "nije-email", password: "123456" });
    expect(r.success).toBe(false);
  });

  it("odbija prekratku lozinku", () => {
    const r = loginSchema.safeParse({ email: "a@b.co", password: "12" });
    expect(r.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("prihvata podudarajuće lozinke", () => {
    const r = registerSchema.safeParse({
      full_name: "Marko Marković",
      email: "m@example.com",
      password: "lozinka12",
      confirm_password: "lozinka12",
    });
    expect(r.success).toBe(true);
  });

  it("odbija različite lozinke", () => {
    const r = registerSchema.safeParse({
      full_name: "Marko",
      email: "m@example.com",
      password: "lozinka12",
      confirm_password: "druga",
    });
    expect(r.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("prihvata validan email", () => {
    const r = resetPasswordSchema.safeParse({ email: "a@b.co" });
    expect(r.success).toBe(true);
  });
});

describe("newPasswordSchema", () => {
  it("prihvata podudarajuće nove lozinke", () => {
    const r = newPasswordSchema.safeParse({
      password: "nova12345",
      confirm_password: "nova12345",
    });
    expect(r.success).toBe(true);
  });
});
