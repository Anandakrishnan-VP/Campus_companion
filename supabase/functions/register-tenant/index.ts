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

    const { college_name, slug, website_url, admin_name, email, password } = await req.json();

    if (!college_name || !email || !password) throw new Error("college_name, email, and password are required");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    // Check slug uniqueness
    const { data: existingTenant } = await supabase.from("tenants").select("id").eq("slug", slug).maybeSingle();
    if (existingTenant) throw new Error("This institution name is already taken. Please choose a different name.");

    // Check email uniqueness
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    if (existingUsers?.users?.some((u: any) => u.email === email)) {
      throw new Error("This email is already registered.");
    }

    // Create tenant
    const { data: newTenant, error: tenantErr } = await supabase.from("tenants").insert({
      name: college_name,
      slug,
      website_url: website_url || "",
      status: "active",
    }).select("id").single();
    if (tenantErr) throw tenantErr;

    // Create auth user
    const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: admin_name },
    });
    if (userErr) throw userErr;

    // Assign admin role
    await supabase.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });

    // Create tenant membership
    await supabase.from("tenant_memberships").insert({
      tenant_id: newTenant.id,
      user_id: newUser.user.id,
      role: "admin",
    });

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
