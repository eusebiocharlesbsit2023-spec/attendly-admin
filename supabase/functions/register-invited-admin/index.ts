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

type SupportedUserType = "admin" | "professor" | "student";

const SUPPORTED_TYPES: SupportedUserType[] = ["admin", "professor", "student"];

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
    const user_type = String(payload.user_type ?? "").trim().toLowerCase() as SupportedUserType;
    const first_name = String(payload.first_name ?? "").trim();
    const last_name = String(payload.last_name ?? "").trim();
    const middle_name = String(payload.middle_name ?? "").trim();
    const full_name = `${first_name} ${last_name}`.trim();
    const department = String(payload.department ?? "").trim();
    const student_number = String(payload.student_number ?? "").trim();
    const program = String(payload.program ?? "").trim();
    const year_level = String(payload.year_level ?? "").trim();
    const section = String(payload.section ?? "").trim();
    const password = String(payload.password ?? "").trim();

    if (!token || !full_name || !password || !SUPPORTED_TYPES.includes(user_type)) {
      return json(400, {
        step: "validate",
        message: "token, user_type, first_name, last_name, password are required",
      });
    }

    if (user_type === "professor" && !department) {
      return json(400, { step: "validate", message: "department is required for professor invites" });
    }

    if (user_type === "student") {
      if (!student_number) return json(400, { step: "validate", message: "student_number is required for student invites" });
      if (!department) return json(400, { step: "validate", message: "department is required for student invites" });
      if (!program) return json(400, { step: "validate", message: "program is required for student invites" });
      if (!year_level) return json(400, { step: "validate", message: "year_level is required for student invites" });
      if (!section) return json(400, { step: "validate", message: "section is required for student invites" });
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
      .from("user_invites")
      .select("id, email, user_type, expires_at, used_at, is_active")
      .eq("token", token)
      .eq("user_type", user_type)
      .eq("is_active", true)
      .is("used_at", null)
      .single();

    if (inviteErr || !invite) {
      return json(400, { step: "invite", message: "Invalid or expired invite" });
    }

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

    let profileTable = "";
    let profilePayload: Record<string, unknown> = {};

    if (user_type === "admin") {
      profileTable = "admins";
      profilePayload = {
        id: authUserId,
        username: invite.email,
        admin_name: full_name,
        role: "Admin",
        status: "Active",
      };
    } else if (user_type === "professor") {
      profileTable = "professors";
      profilePayload = {
        id: authUserId,
        professor_name: full_name,
        email: invite.email,
        department,
        status: "Active",
        archived: false,
      };
    } else {
      profileTable = "students";
      profilePayload = {
        id: authUserId,
        first_name,
        middle_name: middle_name || null,
        last_name,
        student_number,
        email: invite.email,
        department,
        program,
        year_level,
        section,
        status: "Active",
        archived: false,
      };
    }

    const { data: profileRow, error: insertErr } = await admin
      .from(profileTable)
      .insert(profilePayload)
      .select("*")
      .single();

    if (insertErr) {
      await admin.auth.admin.deleteUser(authUserId);
      return json(400, { step: "insert_profile", message: insertErr.message, details: insertErr });
    }

    const { error: updateErr } = await admin
      .from("user_invites")
      .update({ used_at: new Date().toISOString(), is_active: false })
      .eq("id", invite.id);

    if (updateErr) {
      return json(400, { step: "update_invite", message: updateErr.message, details: updateErr });
    }

    return json(200, { success: true, user_type, profile: profileRow });
  } catch (e) {
    return json(400, { step: "catch", message: String(e) });
  }
});
