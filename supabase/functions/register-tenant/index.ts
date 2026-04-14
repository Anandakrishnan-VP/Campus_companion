import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { college_name, abbreviation, website_url, admin_name, email } = await req.json();

    if (!college_name || !abbreviation || !email) throw new Error("college_name, abbreviation, and email are required");
    if (!/^[a-z0-9]+$/.test(abbreviation)) throw new Error("Abbreviation must contain only lowercase letters and numbers");
    if (abbreviation.length < 2 || abbreviation.length > 20) throw new Error("Abbreviation must be 2-20 characters");

    const slug = abbreviation;

    // Check slug/abbreviation uniqueness
    const { data: existingTenant } = await supabase.from("tenants").select("id").or(`slug.eq.${slug},abbreviation.eq.${abbreviation}`).maybeSingle();
    if (existingTenant) throw new Error("This abbreviation is already taken. Please choose a different one.");

    // Create tenant with status 'pending' — admin credentials will be created by super admin after approval
    const { data: newTenant, error: tenantErr } = await supabase.from("tenants").insert({
      name: college_name,
      slug,
      abbreviation,
      website_url: website_url || "",
      status: "pending",
    }).select("id").single();
    if (tenantErr) throw tenantErr;

    return new Response(JSON.stringify({ success: true, tenant_id: newTenant.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("register-tenant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
