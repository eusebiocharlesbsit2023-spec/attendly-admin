import { createClient } from "@supabase/supabase-js";

const url = "https://ucfundmbawljngzowzgd.supabase.co";
const anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZnVuZG1iYXdsam5nem93emdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1OTY5NDQsImV4cCI6MjA4MzE3Mjk0NH0.rPcB5ZIHZ77hR2DzXHKwJp8nF-IJH-bmICzioCma5Bk";

export const supabaseCreateUser = createClient(url, anon, {
  auth: {
    storageKey: "sb-create-user",     // separate storage so di niya mapapalitan main session
    persistSession: false,            // don’t keep session
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
