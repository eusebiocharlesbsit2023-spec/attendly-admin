import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Mas mainam na i-allow ang lahat sa production o i-specify ang Railway domain
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Binago ang function para suportahan ang Brevo Templates
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
      templateId: args.templateId, // Template ID #1
      params: args.params,         // Dito ipapasa ang login details
    }),
  });

  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { step: "method", message: "Method not allowed" });

  try {
    const payload = await req.json();
    const student_number = String(payload.student_number ?? "").trim();
    const student_email = String(payload.student_email ?? "").trim().toLowerCase();
    const login_password = String(payload.login_password ?? "").trim();
    const first_name = String(payload.first_name ?? "").trim();
    const middle_name = String(payload.middle_name ?? "").trim();
    const last_name = String(payload.last_name ?? "").trim();
    const year_level = String(payload.year_level ?? "").trim();
    const section = String(payload.section ?? "").trim();
    const department = String(payload.department ?? "").trim();
    const program = String(payload.program ?? "").trim();
    const status = String(payload.status ?? "Active").trim() || "Active";

    if (!student_number || !student_email || !login_password) {
      return json(400, {
        step: "validate",
        message: "student_number, student_email, login_password are required",
      });
    }

    if (!first_name || !last_name || !department || !program || !year_level || !section) {
      return json(400, {
        step: "validate",
        message: "first_name, last_name, department, program, year_level, section are required",
      });
    }

    const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

    if (!PROJECT_URL || !SERVICE_ROLE_KEY || !BREVO_API_KEY) {
      return json(500, { step: "env", message: "Missing environment variables" });
    }

    const admin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // 1) Create Auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: student_email,
      password: login_password,
      email_confirm: true,
    });

    if (createErr) return json(400, { step: "createUser", message: createErr.message });

    // 2) Save student row (Upsert)
    const { error: upsertErr } = await admin.from("students").upsert({
      id: created.user?.id,
      student_number,
      email: student_email,
      first_name,
      middle_name: middle_name || null,
      last_name,
      year_level,
      section,
      department,
      program,
      status,
    });

    if (upsertErr) return json(400, { step: "upsert_student", message: upsertErr.message });

    // 3) PAG-SEND NG EMAIL GAMIT ANG TEMPLATE ID #1
    // Base sa iyong UI: kailangan ng studentNumber at temporaryPassword na params
    const mail = await sendBrevoTemplate({
      to: student_email,
      templateId: 1, // ID para sa "ACCOUNT CREATION"
      params: {
        studentNumber: student_number,      // {{ params.studentNumber }} sa Brevo
        temporaryPassword: login_password, // {{ params.temporaryPassword }} sa Brevo
      },
      apiKey: BREVO_API_KEY,
    });

    if (!mail.ok) return json(400, { step: "brevo_send", message: "Brevo send failed", details: mail });

    return json(200, { success: true, student_number, sent_to: student_email });

  } catch (e) {
    return json(400, { step: "catch", message: String(e) });
  }
});
