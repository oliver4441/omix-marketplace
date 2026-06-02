import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/forgot-password",
  "/api/auth",
];
const PUBLIC_PREFIXES = [
  "/listings/",
  "/store/",
  "/product/",
  "/api/products",
  "/api/categories",
  "/api/inquiries",
  "/api/cart",
  "/api/mpesa",
  "/api/push",
  "/services",
];

// Security headers applied to ALL responses
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=self",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://opencode.ai",
    "frame-ancestors 'none'",
  ].join("; "),
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return addSecurityHeaders(NextResponse.next());
  }
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return addSecurityHeaders(NextResponse.next());
  }
  if (pathname.match(/\/_next\/|\/favicon\.ico|\/logo\.jpg|\/manifest\.json|\/sw\.js/)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Allow static assets
  if (pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|map|txt|xml|json)$/)) {
    return addSecurityHeaders(NextResponse.next());
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return addSecurityHeaders(NextResponse.next());
  }

  try {
    const { createServerClient } = await import("@supabase/ssr");

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = new URL("/auth/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Check admin routes
    if (pathname.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.is_admin) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return addSecurityHeaders(supabaseResponse);
  } catch {
    // If auth check fails, allow request through
    return addSecurityHeaders(NextResponse.next());
  }
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"
  ],
};
