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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [facultyRes, timetableRes, eventsRes, locationsRes, attendanceRes, kbRes, deptsRes] = await Promise.all([
      supabase.from("faculty").select("*"),
      supabase.from("timetable").select("*"),
      supabase.from("events").select("*").gte("event_date", new Date().toISOString().split("T")[0]),
      supabase.from("locations").select("*"),
      supabase.from("attendance").select("*").eq("date", new Date().toISOString().split("T")[0]),
      supabase.from("knowledge_base").select("*"),
      supabase.from("departments").select("*"),
    ]);

    const facultyData = facultyRes.data || [];
    const timetableData = timetableRes.data || [];
    const eventsData = eventsRes.data || [];
    const locationsData = locationsRes.data || [];
    const attendanceData = attendanceRes.data || [];
    const kbData = kbRes.data || [];
    const deptsData = deptsRes.data || [];

    const dayOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
    const currentTime = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

    // Build dynamic context
    const facultyInfo = facultyData.map(f => {
      const schedule = timetableData.filter(t => t.faculty_id === f.id && !t.is_cancelled);
      const todayAttendance = attendanceData.find(a => a.faculty_id === f.id);
      const presence = todayAttendance ? todayAttendance.status : "unmarked";
      return `- ${f.name} (aliases: ${f.aliases || "none"}) | Dept: ${f.department} | Office: ${f.office_location || "N/A"} | Phone: ${f.phone || "N/A"} | Today's status: ${presence} | Schedule: ${schedule.map(s => `${s.day_of_week} ${s.start_time?.slice(0,5)}-${s.end_time?.slice(0,5)} ${s.subject} in ${s.room}`).join("; ") || "No schedule"}`;
    }).join("\n");

    const locationInfo = locationsData.map(l => `- ${l.name}: ${l.type}, Floor: ${l.floor || "N/A"}, Block: ${l.block || "N/A"}, ${l.description || ""} ${l.nearby_landmarks ? "Near: " + l.nearby_landmarks : ""} | HOW TO REACH: ${(l as any).directions || "No directions available"}`).join("\n");

    const eventInfo = eventsData.map(e => `- ${e.title}: Venue: ${e.location || "TBD"}, Date: ${e.event_date}, Time: ${e.start_time?.slice(0,5) || "TBD"}${e.end_time ? "-" + e.end_time.slice(0,5) : ""}, ${e.description || ""}`).join("\n") || "No upcoming events.";

    // Knowledge base grouped by category
    const kbInfo = kbData.length > 0
      ? kbData.map(kb => `[${kb.category}] ${kb.title}: ${kb.content}`).join("\n")
      : "No additional college information available yet.";

    const SYSTEM_PROMPT = `You are a friendly, intelligent AI campus assistant deployed at the NCERC (Nehru College of Engineering and Research Centre) kiosk. Your name is "Yukti".

CURRENT TIME: ${currentTime} IST, ${dayOfWeek}
TODAY'S DATE: ${new Date().toISOString().split("T")[0]}

PERSONALITY: Warm, helpful, conversational. Keep responses concise (2-4 sentences). Speak naturally. You represent NCERC's Department of CSE(AI & ML).

CONVERSATION RULES:
1. MEMORY: Remember the full conversation and reference previous questions naturally.
2. FOLLOW-UPS: After answering, ask a relevant follow-up when appropriate.
3. TYPO TOLERANCE: Understand intent despite typos, grammar errors, and misspellings. If someone types "libaray" understand they mean "library". If they type "were is dr sham" understand they mean "where is Dr. Sharma". Always try to match partial/misspelled names against faculty names and aliases.
4. AMBIGUITY: Ask clarifying questions when queries are ambiguous.
5. AVAILABILITY: When asked if a professor is free, check their timetable for ${dayOfWeek} and compare with current time ${currentTime}. If they have no class at this time and are present, they are likely free. If their status is "unmarked", say "Their attendance has not been marked for today, so their availability is uncertain."
6. EMERGENCY: If user mentions fire, medical emergency, help, immediately provide emergency contacts.
7. Respond as spoken text - avoid markdown, special characters, or emojis.
8. NAVIGATION: When someone asks how to reach or find a place, use the "HOW TO REACH" directions from location data. Give step-by-step navigation naturally.
9. ATTENDANCE STATUS: If a faculty member's status is "unmarked", explicitly say they haven't marked their attendance today and their presence is unknown. Do NOT assume they are present or absent.
10. COLLEGE KNOWLEDGE: Use the COLLEGE INFORMATION section to answer any questions about the college - admissions, courses, facilities, fees, hostel, placements, history, rules, etc. Answer confidently from this data.

LIVE FACULTY DATA:
${facultyInfo || "No faculty data available yet. Admin has not added any faculty."}

LIVE LOCATION DATA:
${locationInfo || "No location data available yet."}

LIVE EVENTS:
${eventInfo}

COLLEGE INFORMATION (from admin's Brain):
${kbInfo}

EMERGENCY CONTACTS:
- Campus Security: +91-XXX-XXX-1234
- Medical: +91-XXX-XXX-5678
- Fire: 101`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
