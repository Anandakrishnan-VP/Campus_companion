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

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) throw new Error("Not authenticated");

    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin");
    
    if (!callerRoles || callerRoles.length === 0) throw new Error("Only super admins can create credentials");

    const { tenant_id, admin_id, password, admin_email } = await req.json();
    if (!tenant_id || !admin_id || !password) throw new Error("tenant_id, admin_id, and password are required");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    const email = `${admin_id.toLowerCase().trim()}@campus.local`;

    // Check if tenant exists and is approved
    const { data: tenant } = await supabase.from("tenants").select("id, status, name").eq("id", tenant_id).single();
    if (!tenant) throw new Error("Tenant not found");
    if (tenant.status !== "active") throw new Error("Tenant must be approved first");

    // Create auth user
    const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Admin - ${tenant.name}`, admin_email: admin_email || "" },
    });
    if (userErr) throw userErr;

    // Assign admin role
    await supabase.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });

    // Create tenant membership
    await supabase.from("tenant_memberships").insert({
      tenant_id,
      user_id: newUser.user.id,
      role: "admin",
    });

    return new Response(JSON.stringify({ success: true, admin_id, email: admin_email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-admin-credentials error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
