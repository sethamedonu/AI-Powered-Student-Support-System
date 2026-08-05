import { type NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/chat",
  "/conversations",
  "/profile",
  "/feedback",
  "/admin",
];

// Routes that require admin role
const ADMIN_PREFIXES = ["/admin"];

// Routes only for guests (redirect logged-in users away)
const GUEST_ONLY_PREFIXES = [
  "/auth/login",
  "/auth/register",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const userCookie = request.cookies.get("user")?.value;

  // Parse user from cookie (best-effort — not cryptographically verified here;
  // server components do the authoritative check)
  let userRole: string | null = null;
  if (userCookie) {
    try {
      const user = JSON.parse(decodeURIComponent(userCookie)) as {
        role?: string;
      };
      userRole = user.role ?? null;
    } catch {
      // malformed cookie — treat as unauthenticated
    }
  }

  const isAuthenticated = !!accessToken;

  // Redirect authenticated users away from guest-only pages
  if (isAuthenticated && GUEST_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) &&
    !isAuthenticated
  ) {
    const returnTo = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/auth/login?redirect=${returnTo}`, request.url),
    );
  }

  // Redirect non-admins away from admin pages
  if (
    ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) &&
    isAuthenticated &&
    userRole !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
