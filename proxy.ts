import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/sqlite/constants";

export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get(sessionCookieName)?.value);

  if (request.nextUrl.pathname.startsWith("/dashboard") && !hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
