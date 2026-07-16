import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

const protectedRoutes = ["/admin"];
const publicRoutes = ["/admin/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Sadece /admin yollarını kontrol et (ama api vs. dahil olabilir)
  if (!path.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((route) => path === route || path.startsWith(route + "/"));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get("admin_session")?.value;
  let session = null;
  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (e) {
      session = null;
    }
  }

  if (isProtectedRoute && !isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }

  if (isPublicRoute && session && req.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
