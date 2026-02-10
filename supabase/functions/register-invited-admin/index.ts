import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Expose-Headers": "content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { step: "method", message: "Method not allowed" });
  }

  try {
    const payload = await req.json();

    const token = String(payload.token ?? "").trim();
    const full_name = String(payload.full_name ?? "").trim();
    const username = String(payload.username ?? "").trim();
    const password = String(payload.password ?? "").trim();

    if (!token || !full_name || !username || !password) {
      return json(400, {
        step: "validate",
        message: "token, full_name, username, password are required",
      });
    }

    const PROJECT_URL = Deno.env.get("PROJECT_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

    if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
      return json(500, { step: "env", message: "Missing PROJECT_URL or SERVICE_ROLE_KEY" });
    }

    const admin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: invite, error: inviteErr } = await admin
      .from("admin_invites")
      .select("id, email, expires_at, used_at, is_active")
      .eq("token", token)
      .eq("is_active", true)
      .is("used_at", null)
      .single();

    if (inviteErr || !invite) {
      return json(400, { step: "invite", message: "Invalid or expired invite" });
    }

    // 1) Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      return json(400, { step: "createUser", message: createErr.message, details: createErr });
    }

    const authUserId = created.user?.id;
    if (!authUserId) return json(500, { step: "createUser", message: "Missing user id" });

    // 2) Insert admins row
    const { data: adminRow, error: insertErr } = await admin
      .from("admins")
      .insert({
        id: authUserId,
        username: username,
        admin_name: full_name,
        role: "Admin",
        status: "Active",
      })
      .select("*")
      .single();

    if (insertErr) {
      // optional cleanup to avoid orphan auth user
      // await admin.auth.admin.deleteUser(authUserId);
      return json(400, { step: "insert_admin", message: insertErr.message, details: insertErr });
    }

    // 3) Mark invite used
    const { error: updateErr } = await admin
      .from("admin_invites")
      .update({ used_at: new Date().toISOString(), is_active: false })
      .eq("id", invite.id);

    if (updateErr) {
      return json(400, { step: "update_invite", message: updateErr.message, details: updateErr });
    }

    return json(200, { success: true, admin: adminRow });
  } catch (e) {
    return json(400, { step: "catch", message: String(e) });
  }
});
