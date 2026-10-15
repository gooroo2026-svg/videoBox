
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const origin = request.headers.get("origin");

  if (origin && new URL(origin).origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !publishableKey || !secretKey) {
    return NextResponse.json(
      { error: "Server configuration is missing." },
      { status: 500 }
    );
  }







  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const userClient = createSupabaseClient(supabaseUrl, publishableKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user: signedInUser },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !signedInUser) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const { data: isAdmin, error: adminCheckError } =
    await userClient.rpc("is_admin");

  if (adminCheckError || !isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }









  const { userId } = await context.params;

  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
  }

  if (userId === signedInUser.id) {
    return NextResponse.json(
      { error: "You cannot suspend your own admin account." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (action !== "suspend" && action !== "unsuspend") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  if (action === "suspend" && reason.length < 3) {
    return NextResponse.json(
      { error: "Enter a short reason for the suspension." },
      { status: 400 }
    );
  }

  const adminClient = createSupabaseClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data: targetAdmin, error: targetAdminError } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (targetAdminError) {
    return NextResponse.json(
      { error: "Could not check that account." },
      { status: 500 }
    );
  }

  if (targetAdmin) {
    return NextResponse.json(
      { error: "Admin accounts cannot be suspended here." },
      { status: 400 }
    );
  }

  const { data: targetUser, error: targetUserError } =
    await adminClient.auth.admin.getUserById(userId);

  if (targetUserError || !targetUser.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (action === "suspend") {
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .update({
        suspended_at: new Date().toISOString(),
        suspension_reason: reason,
      })
      .eq("id", userId)
      .select("id")
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Could not save the suspension." },
        { status: 500 }
      );
    }

    const { error: banError } = await adminClient.auth.admin.updateUserById(
      userId,
      { ban_duration: "876000h" }
    );

    if (banError) {
      await adminClient
        .from("profiles")
        .update({ suspended_at: null, suspension_reason: null })
        .eq("id", userId);

      return NextResponse.json(
        { error: "Could not suspend this account." },
        { status: 500 }
      );
    }
  } else {
    const { error: unbanError } = await adminClient.auth.admin.updateUserById(
      userId,
      { ban_duration: "none" }
    );

    if (unbanError) {
      return NextResponse.json(
        { error: "Could not restore this account." },
        { status: 500 }
      );
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ suspended_at: null, suspension_reason: null })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json(
        { error: "Account restored, but its suspension record could not be cleared." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, action });
}