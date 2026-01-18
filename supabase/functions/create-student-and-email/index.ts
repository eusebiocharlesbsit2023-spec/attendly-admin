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


// Simple temp password generator
function genTempPassword() {
  // ex: 12 chars-ish w/ symbols
  const base = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `${base}A1!`;
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
      "api-key": args.apiKey, // Brevo auth header :contentReference[oaicite:3]{index=3}
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
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { step: "method", message: "Method not allowed" });
  }

  try {
    const payload = await req.json();

    const student_number = String(payload.student_number ?? "").trim();
    const student_email = String(payload.student_email ?? "").trim().toLowerCase();

    const first_name = payload.first_name ?? null;
    const middle_name = payload.middle_name ?? null;
    const last_name = payload.last_name ?? null;
    const year_level = payload.year_level ?? null;
    const section = payload.section ?? null;
    const program = payload.program ?? null;
    const status = payload.status ?? "Active";

    if (!student_number || !student_email) {
      return json(400, {
        step: "validate",
        message: "student_number and student_email are required",
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

    // login pattern: studentNo@attendly.com
    const auth_email = `${student_number}@attendly.com`.toLowerCase();
    const login_password = String(payload.login_password ?? "").trim();

    if (!login_password) {
      return json(400, { step: "validate", message: "login_password is required" });
    }

    // 1) Create Auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: auth_email,
      password: login_password,
      email_confirm: true,
    });

    if (createErr) {
      return json(400, { step: "createUser", message: createErr.message, details: createErr });
    }

    const authUserId = created.user?.id;
    if (!authUserId) return json(500, { step: "createUser", message: "Missing user id" });

    // 2) Save student row
    const { error: upsertErr } = await admin.from("students").upsert(
      {
        id: authUserId,
        student_number,
        email: student_email, // real email for contact
        first_name,
        middle_name,
        last_name,
        year_level,
        section,
        program,
        status,
      },
      { onConflict: "id" }
    );

    if (upsertErr) {
      return json(400, { step: "upsert_student", message: upsertErr.message, details: upsertErr });
    }

    // 3) Send Brevo email
    const html = `
      <h2 style={text-align: center;}>Welcome to Attendly</h2>
      <p style={text-align: center;}>Your student account has been created.</p>
      <p style={text-align: center;}><b>Student Number:</b> ${student_number}</p>
      <p style={text-align: center;}><b>Password:</b> ${login_password}</p>
      <p style={text-align: center;}>Please use this credentials when signin in on Attendly app</p>
    `;

    const mail = await sendBrevoEmail({
      to: student_email,
      subject: "Your Attendly account (Student No. + Password)",
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
      student_number,
      sent_to: student_email,
      auth_email,
      auth_user_id: authUserId,
      brevo: mail.data,
    });
  } catch (e) {
    return json(400, { step: "catch", message: String(e) });
  }
});

