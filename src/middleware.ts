import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rute koje ne zahtevaju autentifikaciju */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/reset-password/confirm",
  "/auth/callback",
];

/** Auth rute — ako je korisnik već ulogovan, preusmeriti na /dashboard */
const AUTH_ONLY_PATHS = ["/login", "/register", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Uvek propusti: Stripe webhook i auth callback
  if (
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.next();
  }

  // API rute handle-uju sopstvenu autentifikaciju
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Zapisati kolačiće i na request i na response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Osvežava sesiju i vraća autentifikovanog korisnika
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Nije ulogovan → preusmeriti na /login za zaštićene rute
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Ulogovan → preusmeriti sa auth ruta na /dashboard
  if (user && AUTH_ONLY_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Ulogovan na zaštićenoj ruti → provera onboarding statusa
  if (
    user &&
    !PUBLIC_PATHS.includes(pathname) &&
    pathname !== "/onboarding"
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
