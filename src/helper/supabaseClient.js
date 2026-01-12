import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ucfundmbawljngzowzgd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZnVuZG1iYXdsam5nem93emdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1OTY5NDQsImV4cCI6MjA4MzE3Mjk0NH0.rPcB5ZIHZ77hR2DzXHKwJp8nF-IJH-bmICzioCma5Bk";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
