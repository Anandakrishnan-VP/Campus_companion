import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tenant_id, action } = await req.json();

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === "activate") {
      // Mock: simulate successful payment → activate subscription
      const { error } = await supabase
        .from("tenants")
        .update({
          subscription_status: "active",
          razorpay_customer_id: `mock_cust_${Date.now()}`,
          razorpay_subscription_id: `mock_sub_${Date.now()}`,
        })
        .eq("id", tenant_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: "Subscription activated (mock)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deactivate") {
      const { error } = await supabase
        .from("tenants")
        .update({ subscription_status: "canceled" })
        .eq("id", tenant_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: "Subscription canceled (mock)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'activate' or 'deactivate'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
