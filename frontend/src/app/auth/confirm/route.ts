import { NextResponse, type NextRequest } from "next/server";
export function GET(request: NextRequest) {
  return NextResponse.redirect(
    new URL("/login?message=email-deferred", request.url),
  );
}
export function POST(request: NextRequest) {
  return NextResponse.redirect(
    new URL("/login?message=email-deferred", request.url),
    303,
  );
}
