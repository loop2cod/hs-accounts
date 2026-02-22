import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("hs_auth_token")?.value;
    const isLoginPage = request.nextUrl.pathname.startsWith("/login");

    // Exclude API routes that might be external webhooks if any
    if (request.nextUrl.pathname.startsWith("/api/whatsapp")) {
        return NextResponse.next();
    }

    if (!token && !isLoginPage) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    if (token && isLoginPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|fav.png|logo.png|logo-transparent.png|manifest.json).*)"
    ],
};
