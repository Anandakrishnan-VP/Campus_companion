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
    // Require a setup secret to prevent unauthorized calls
    const setupSecret = Deno.env.get("SETUP_SECRET");
    if (!setupSecret) {
      return new Response(JSON.stringify({ error: "Setup not configured" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providedSecret = req.headers.get("x-setup-secret");
    if (providedSecret !== setupSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if a super_admin already exists
    const { data: existingSuperAdmins } = await supabase
      .from("user_roles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1);

    if (existingSuperAdmins && existingSuperAdmins.length > 0) {
      return new Response(JSON.stringify({ error: "Super admin already exists" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read credentials from environment secrets
    const adminEmail = Deno.env.get("SETUP_ADMIN_EMAIL");
    const adminPassword = Deno.env.get("SETUP_ADMIN_PASSWORD");

    if (!adminEmail || !adminPassword) {
      return new Response(JSON.stringify({ error: "Admin credentials not configured in secrets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "Super Admin" },
    });
    if (createError) throw createError;

    await supabase.from("user_roles").insert({ user_id: newUser.user.id, role: "super_admin" });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("setup-admin error:", e);
    return new Response(JSON.stringify({ error: "Setup failed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
