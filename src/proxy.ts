import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "www.sattaonlineresult.com";

export function proxy(request: NextRequest) {
  if (request.nextUrl.hostname !== "sattaonlineresult.com") {
    return NextResponse.next();
  }

  const canonicalUrl = request.nextUrl.clone();
  canonicalUrl.protocol = "https";
  canonicalUrl.hostname = CANONICAL_HOST;
  canonicalUrl.port = "";

  return NextResponse.redirect(canonicalUrl, 301);
}

export const config = {
  matcher: "/:path*",
};
