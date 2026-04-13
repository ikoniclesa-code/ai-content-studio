import { expect, test } from "@playwright/test";

test.describe("smoke — javne stranice i middleware", () => {
  test("početna stranica se učitava", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Content Studio/);
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
  });

  test("stranica za prijavu se učitava", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Prijava" })).toBeVisible();
    await expect(page.getByLabel(/Email adresa/i)).toBeVisible();
  });

  test("stranica za registraciju se učitava", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Kreirajte nalog" }),
    ).toBeVisible();
  });

  test("stranica za reset lozinke se učitava", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(
      page.getByRole("heading", { name: "Reset lozinke" }),
    ).toBeVisible();
  });

  test("neautentifikovan zahtev za /dashboard dobija redirect na /login", async ({
    request,
  }) => {
    const res = await request.get("/dashboard", { maxRedirects: 0 });
    expect(res.status()).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
    const loc = res.headers()["location"] ?? "";
    expect(loc).toMatch(/\/login/);
  });

  test("neautentifikovan zahtev za /settings dobija redirect na /login", async ({
    request,
  }) => {
    const res = await request.get("/settings", { maxRedirects: 0 });
    expect(res.status()).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
    const loc = res.headers()["location"] ?? "";
    expect(loc).toMatch(/\/login/);
  });

  test("API webhook nije blokiran auth middleware-om (stub 501)", async ({
    request,
  }) => {
    const res = await request.post("/api/webhooks/stripe", {
      data: "{}",
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(501);
  });
});
