import { NextResponse, type NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/forgot-password",
  "/api/auth",
];
const publicPrefixes = [
  "/listings/",
  "/store/",
  "/product/",
  "/api/products",
  "/api/categories",
  "/api/inquiries",
  "/api/cart",
  "/api/mpesa",
  "/api/push",
  "/api/ai",
  "/services",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
  if (publicPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (pathname.match(/\/_next\/|\/favicon\.ico|\/logo\.jpg|\/manifest\.json|\/sw\.js/)) {
    return NextResponse.next();
  }

  // Allow static assets
  if (pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|map|txt|xml|json)$/)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
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

    return supabaseResponse;
  } catch {
    // If auth check fails (network error, etc.), allow request through
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"
  ],
};
