import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5174",
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

async function sendBrevoEmail(args: {
  to: string;
  subject: string;
  html: string;
  fromEmail: string;
  fromName: string;
  apiKey: string;
}) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": args.apiKey,
    },
    body: JSON.stringify({
      sender: { email: args.fromEmail, name: args.fromName },
      to: [{ email: args.to }],
      subject: args.subject,
      htmlContent: args.html,
    }),
  });

  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

serve(async (req) => {
  // CORS preflight
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
    const department = String(payload.department ?? "").trim();
    const password = String(payload.password ?? "").trim();

    const professor_name = `${first_name} ${last_name}`.trim();
    const status = String(payload.status ?? "Active").trim();

    if (!first_name || !last_name || !email || !department || !password) {
      return json(400, {
        step: "validate",
        message: "first_name, last_name, email, department, password are required",
      });
    }

    const PROJECT_URL = Deno.env.get("PROJECT_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const BREVO_FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL");
    const BREVO_FROM_NAME = Deno.env.get("BREVO_FROM_NAME") ?? "Attendly";

    if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
      return json(500, { step: "env", message: "Missing PROJECT_URL or SERVICE_ROLE_KEY" });
    }
    if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
      return json(500, { step: "env", message: "Missing BREVO_API_KEY or BREVO_FROM_EMAIL" });
    }

    const admin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      return json(400, { step: "createUser", message: createErr.message, details: createErr });
    }

    const authUserId = created.user?.id;
    if (!authUserId) return json(500, { step: "createUser", message: "Missing user id" });

    // 2) Insert professors row (match your table exactly)
    const { data: profRow, error: insertErr } = await admin
      .from("professors")
      .insert({
        id: authUserId,
        professor_name,
        email,
        department,
        status,
        push_enabled: true,       // default (optional)
        auto_end_session: false,  // default (optional)
        avatar_url: null,
      })
      .select("*")
      .single();

    if (insertErr) {
      // optional cleanup: avoid orphan auth user
      // await admin.auth.admin.deleteUser(authUserId);
      return json(400, { step: "insert_professor", message: insertErr.message, details: insertErr });
    }

    // 3) Send credentials email
    const html = `
      <h2>Welcome to Attendly</h2>
      <p>Your professor account has been created.</p>
      <p><b>Name:</b> ${professor_name}</p>
      <p><b>Email (login):</b> ${email}</p>
      <p><b>Password:</b> ${password}</p>
      <p style="font-size:12px;color:#6b7280">We recommend changing your password after logging in.</p>
    `;

    const mail = await sendBrevoEmail({
      to: email,
      subject: "Your Attendly Professor Account",
      html,
      fromEmail: BREVO_FROM_EMAIL,
      fromName: BREVO_FROM_NAME,
      apiKey: BREVO_API_KEY,
    });

    if (!mail.ok) {
      return json(400, { step: "brevo_send", message: "Brevo send failed", details: mail });
    }

    return json(200, {
      success: true,
      auth_user_id: authUserId,
      professor: profRow,
      brevo: mail.data,
    });
  } catch (e) {
    return json(400, { step: "catch", message: String(e) });
  }
});
