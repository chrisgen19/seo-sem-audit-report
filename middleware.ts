import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");
  const isPendingPage = req.nextUrl.pathname.startsWith("/pending-approval");

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Block PENDING/unapproved members — check before auth-page redirect to avoid double redirect
  if (isLoggedIn && !isPendingPage) {
    const memberStatus = req.auth?.user?.memberStatus;
    const hasOrg = !!req.auth?.user?.organizationId;

    if (!hasOrg || memberStatus === "PENDING") {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
