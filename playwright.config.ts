import { defineConfig, devices } from "@playwright/test";

/**
 * Minimalni E2E smoke testovi.
 * Zahtevaju validan `.env.local` (NEXT_PUBLIC_SUPABASE_*) jer middleware zove Supabase.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    // Odvojen port od lokalnog `next dev` (3000) da E2E ne pada ako je 3000 zauzet.
    baseURL: "http://127.0.0.1:3333",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Samo `next start` (ne `next dev`) — Next 16 dozvoljava jedan `dev` po folderu.
  // Pokreni: `npm run test:e2e` (prvo radi `build` u npm skripti), ugasi `next dev` ako build pukne sa EPERM.
  webServer: {
    command: "npx next start -p 3333",
    url: "http://127.0.0.1:3333",
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
