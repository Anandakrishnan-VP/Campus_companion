import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const setupSecret = Deno.env.get("SETUP_SECRET");
    if (!setupSecret) return json({ error: "Setup not configured" }, 403);

    const providedSecret = req.headers.get("x-setup-secret");
    if (providedSecret !== setupSecret) return json({ error: "Unauthorized" }, 403);

    const adminEmail = Deno.env.get("SETUP_ADMIN_EMAIL");
    const adminPassword = Deno.env.get("SETUP_ADMIN_PASSWORD");
    if (!adminEmail || !adminPassword) {
      return json({ error: "Admin credentials not configured in secrets" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: existingRole }, { data: listedUsers, error: listUsersError }] = await Promise.all([
      supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin")
        .limit(1)
        .maybeSingle(),
      supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    if (listUsersError) throw listUsersError;

    const existingEmailUser = listedUsers.users.find(
      (user) => user.email?.toLowerCase() === adminEmail.toLowerCase(),
    );

    let targetUserId = existingEmailUser?.id ?? existingRole?.user_id ?? null;
    let action: "created" | "updated" = "updated";

    if (!targetUserId) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: "Super Admin" },
      });

      if (createError) throw createError;
      targetUserId = newUser.user.id;
      action = "created";
    } else {
      const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: "Super Admin" },
      });

      if (updateError) throw updateError;
    }

    if (existingRole?.user_id && existingRole.user_id !== targetUserId) {
      const { error: deleteOldRoleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", existingRole.user_id)
        .eq("role", "super_admin");

      if (deleteOldRoleError) throw deleteOldRoleError;
    }

    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: targetUserId, role: "super_admin" }, { onConflict: "user_id,role" });

    if (roleError) throw roleError;

    return json({ success: true, action, user_id: targetUserId });
  } catch (e) {
    console.error("setup-admin error:", e);
    return json({ error: e instanceof Error ? e.message : "Setup failed" }, 400);
  }
});
