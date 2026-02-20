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

// ✅ Binago para gamitin ang Brevo Template ID #8
async function sendBrevoTemplate(args: {
  to: string;
  templateId: number;
  params: Record<string, any>;
  apiKey: string;
}) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": args.apiKey,
    },
    body: JSON.stringify({
      to: [{ email: args.to }],
      templateId: args.templateId, // Template ID #8 para sa Admin Account Creation
      params: args.params,         // Dito ipapasa ang adminEmail at temporaryPassword
    }),
  });

  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
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

    const first_name = String(payload.first_name ?? "").trim();
    const last_name = String(payload.last_name ?? "").trim();
    const email = String(payload.email ?? "").trim().toLowerCase();
    const temp_password = String(payload.temp_password ?? "").trim();
    const role = String(payload.role ?? "Admin").trim();
    const status = String(payload.status ?? "Active").trim();

    if (!first_name || !last_name || !email || !temp_password) {
      return json(400, {
        step: "validate",
        message: "first_name, last_name, email, temp_password are required",
      });
    }

    const PROJECT_URL = Deno.env.get("PROJECT_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

    if (!PROJECT_URL || !SERVICE_ROLE_KEY || !BREVO_API_KEY) {
      return json(500, { step: "env", message: "Missing environment variables" });
    }

    const admin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: temp_password,
      email_confirm: true,
    });

    if (createErr) {
      return json(400, { step: "createUser", message: createErr.message });
    }

    const authUserId = created.user?.id;

    // 2) Insert admins row
    const admin_name = `${first_name} ${last_name}`.trim();
    const { data: adminRow, error: insertErr } = await admin
      .from("admins")
      .insert({
        id: authUserId,
        username: email,
        admin_name,
        role,
        status,
      })
      .select("*")
      .single();

    if (insertErr) return json(400, { step: "insert_admin", message: insertErr.message });

    // 3) ✅ PAG-SEND GAMIT ANG TEMPLATE ID #8
    // Base sa iyong UI: kailangan ng adminEmail at temporaryPassword na params
    const mail = await sendBrevoTemplate({
      to: email,
      templateId: 8, // "account creation admin" ID
      params: {
        adminEmail: email,                   // {{ params.adminEmail }} sa Brevo
        temporaryPassword: temp_password,    // {{ params.temporaryPassword }} sa Brevo
      },
      apiKey: BREVO_API_KEY,
    });

    if (!mail.ok) {
      return json(400, { step: "brevo_send", message: "Brevo send failed", details: mail });
    }

    return json(200, {
      success: true,
      auth_user_id: authUserId,
      admin: adminRow,
    });
  } catch (e) {
    return json(400, { step: "catch", message: String(e) });
  }
});