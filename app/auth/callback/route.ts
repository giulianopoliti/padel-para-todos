import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Handle password reset flow
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // Handle custom redirect
  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Default redirect after sign up/login
  return NextResponse.redirect(`${origin}/home`);
}
