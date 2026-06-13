import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Middleware: refresh session ทุก request + กั้นเส้นทางตาม role
 *  - ยังไม่ล็อกอิน + เข้าหน้า protected → ส่งไป /login
 *  - ล็อกอินแล้วเข้า /login → ส่งไปหน้าตาม role
 *  - /tutor/* ต้องเป็น role tutor, /student/* ต้องเป็น role student
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/student") || path.startsWith("/tutor");

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (isProtected || path === "/login" || path === "/")) {
    // อ่าน role จาก profiles เพื่อ route ให้ถูกพื้นที่
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role;
    const home = role === "tutor" ? "/tutor" : "/student";

    if (path === "/login" || path === "/") {
      return NextResponse.redirect(new URL(home, request.url));
    }
    if (path.startsWith("/tutor") && role !== "tutor") {
      return NextResponse.redirect(new URL("/student", request.url));
    }
    if (path.startsWith("/student") && role !== "student") {
      return NextResponse.redirect(new URL("/tutor", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
