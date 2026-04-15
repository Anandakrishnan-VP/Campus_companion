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

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) throw new Error("Invalid token");

    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin");

    if (!callerRoles || callerRoles.length === 0) throw new Error("Not authorized - admin only");

    // Get caller's tenant
    const { data: callerMembership } = await supabase
      .from("tenant_memberships")
      .select("tenant_id")
      .eq("user_id", caller.id)
      .limit(1)
      .single();

    if (!callerMembership) throw new Error("No tenant membership found");
    const callerTenantId = callerMembership.tenant_id;

    const { faculty_id } = await req.json();
    if (!faculty_id) throw new Error("faculty_id required");

    // Verify faculty belongs to caller's tenant
    const { data: facultyRecord } = await supabase
      .from("faculty")
      .select("tenant_id")
      .eq("id", faculty_id)
      .single();

    if (!facultyRecord) throw new Error("Faculty not found");
    if (facultyRecord.tenant_id !== callerTenantId) {
      throw new Error("Unauthorized: faculty belongs to another tenant");
    }

    // Generate unique 3-digit numeric ID (100-999)
    let numericId: string;
    let attempts = 0;
    while (true) {
      numericId = String(Math.floor(100 + Math.random() * 900));
      const email = `${numericId}@campus.local`;
      const { data: existing } = await supabase.auth.admin.listUsers();
      const taken = existing?.users?.some((u: any) => u.email === email);
      if (!taken) break;
      attempts++;
      if (attempts > 50) throw new Error("Could not generate unique ID");
    }

    const password = `ncerc${numericId}`;
    const email = `${numericId}@campus.local`;

    // Create auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;

    // Assign professor role
    await supabase.from("user_roles").insert({ user_id: newUser.user.id, role: "professor" });

    // Link to faculty record
    await supabase.from("faculty").update({ user_id: newUser.user.id, email }).eq("id", faculty_id);

    return new Response(JSON.stringify({ 
      success: true, 
      user_id: newUser.user.id,
      professor_id: numericId,
      password: password,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-professor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
