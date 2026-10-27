import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },

);

// Protect all routes under /profile, /cashier, /kitchen, and /manager
export const config = {
  matcher: [
    "/profile/:path*",
    "/cashier/:path*",
    "/kitchen/:path*",
    "/manager/:path*",
  ],
};
