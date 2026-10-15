import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isWelcomePage = pathname === "/welcome";
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isSignupPage = pathname === "/signup";
  const isPublicAuthFlow =
    pathname === "/auth/callback" || pathname === "/reset-password";
  const isPolicyPage =
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/content-guidelines";
  const isPublicPage =
    isWelcomePage || isAuthPage || isPublicAuthFlow || isPolicyPage;
  const isApiRoute = pathname.startsWith("/api/");
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getClaims();
  const isLoggedIn = !error && Boolean(data?.claims);
  const isSuspendedPage = pathname === "/suspended";

  const claimUserId =
    typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  const userMetadata =
    data?.claims?.user_metadata && typeof data.claims.user_metadata === "object"
      ? (data.claims.user_metadata as Record<string, unknown>)
      : {};
  const hasAdultSelfAttestation = userMetadata.age_gate === "18_plus_self_attested";
  const hasCurrentPolicyAcceptance =
    userMetadata.policy_acceptance_version === "videobox-2026-10-07-v1";

  let isSuspended = false;

  if (isLoggedIn && claimUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("suspended_at")
      .eq("id", claimUserId)
      .maybeSingle();

    isSuspended = Boolean(profile?.suspended_at);
  }






  function redirectTo(path: string, nextPath?: string | null) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (nextPath) url.searchParams.set("next", nextPath);

    const response = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });

    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = supabaseResponse.headers.get(header);
      if (value) response.headers.set(header, value);
    }

    return response;
  }




  const requestedNext =
    request.nextUrl.pathname === "/welcome"
      ? request.nextUrl.searchParams.get("next")
      : `${pathname}${request.nextUrl.search}`;

  if (!isLoggedIn && !isPublicPage) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    return redirectTo("/welcome", requestedNext);
  }
  if (isLoggedIn && (!hasAdultSelfAttestation || !hasCurrentPolicyAcceptance) && !isSignupPage && !isSuspendedPage) {
    return redirectTo("/signup", requestedNext);
  }
  if (isLoggedIn && isSuspended && !isSuspendedPage) {
    return redirectTo("/suspended");
  }
  if (isLoggedIn && !isSuspended && isSuspendedPage) {
    return redirectTo("/");
  }
  if (
    isLoggedIn &&
    (isWelcomePage || isAuthPage) &&
    hasAdultSelfAttestation &&
    hasCurrentPolicyAcceptance
  ) {
    return redirectTo("/");
  }





  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
