import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";

// Land on a form first: email security scanners must not consume single-use tokens.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const destination = new URL("/auth/verify", request.url);
  for (const key of ["token_hash", "type", "next"]) {
    const value = params.get(key);
    if (value) destination.searchParams.set(key, value);
  }
  const response = NextResponse.redirect(destination);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== request.nextUrl.origin)
    return new NextResponse("Invalid origin", { status: 403 });
  const form = await request.formData();
  const token_hash = form.get("token_hash");
  const type = form.get("type");
  if (
    typeof token_hash === "string" &&
    token_hash &&
    (type === "email" || type === "recovery")
  ) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (!error) {
        const destination =
          type === "recovery" ? "/reset-password" : safeNext(form.get("next"));
        const response = NextResponse.redirect(
          new URL(destination, request.url),
          303,
        );
        response.headers.set("Cache-Control", "no-store");
        response.headers.set("Referrer-Policy", "no-referrer");
        return response;
      }
    } catch {
      /* Show a recoverable error without leaking auth details. */
    }
  }
  return NextResponse.redirect(new URL("/auth/error", request.url), 303);
}
