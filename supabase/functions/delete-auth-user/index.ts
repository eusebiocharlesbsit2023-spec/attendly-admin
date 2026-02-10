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
    const user_id = String(payload.user_id ?? "").trim();
    if (!user_id) {
      return json(400, { step: "validate", message: "user_id is required" });
    }

    const PROJECT_URL = Deno.env.get("PROJECT_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
    if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
      return json(500, { step: "env", message: "Missing environment variables" });
    }

    const admin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { error } = await admin.auth.admin.deleteUser(user_id);
    if (error) {
      return json(400, { step: "deleteUser", message: error.message });
    }

    return json(200, { success: true });
  } catch (e) {
    return json(400, { step: "catch", message: String(e) });
  }
});
