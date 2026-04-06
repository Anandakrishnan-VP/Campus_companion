import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractText(html: string): string {
  let text = html.replace(/<(script|style|nav|footer|header|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

async function scrapeUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CampusBot/1.0)" },
    });
    if (!res.ok) return `Error: Could not fetch ${url} (HTTP ${res.status})`;
    const html = await res.text();
    let text = extractText(html);
    if (text.length > 15000) text = text.slice(0, 15000);
    return text || "No content found on this page.";
  } catch (e) {
    return `Error fetching ${url}: ${e instanceof Error ? e.message : "Unknown error"}`;
  }
}

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
      let tempScheduleInfo = "";
      if (presence === "schedule_changed" && todayAttendance?.note) {
        try {
          const tmp = JSON.parse(todayAttendance.note);
          const parts = [];
          if (tmp.tempFrom || tmp.tempTo) parts.push(`Available ${tmp.tempFrom || "?"}-${tmp.tempTo || "?"}`);
          if (tmp.tempRoom) parts.push(`in ${tmp.tempRoom}`);
          if (tmp.tempNote) parts.push(`(Note: ${tmp.tempNote})`);
          if (parts.length > 0) tempScheduleInfo = ` | TEMPORARY SCHEDULE: ${parts.join(" ")}`;
        } catch (_) { /* not JSON, ignore */ }
      }
      return `- ${f.name} (aliases: ${f.aliases || "none"}) | Dept: ${f.department} | Office: ${f.office_location || "N/A"} | Phone: ${f.phone || "N/A"} | Today's status: ${presence}${tempScheduleInfo} | Schedule: ${schedule.map(s => `${s.day_of_week} ${s.start_time?.slice(0,5)}-${s.end_time?.slice(0,5)} ${s.subject} in ${s.room}`).join("; ") || "No schedule"}`;
    }).join("\n");

    const locationInfo = locationsData.map(l => `- ${l.name}: ${l.type}, Floor: ${l.floor || "N/A"}, Block: ${l.block || "N/A"}, ${l.description || ""} ${l.nearby_landmarks ? "Near: " + l.nearby_landmarks : ""} | HOW TO REACH: ${(l as any).directions || "No directions available"}`).join("\n");

    const eventInfo = eventsData.map(e => `- ${e.title}: Venue: ${e.location || "TBD"}, Date: ${e.event_date}, Time: ${e.start_time?.slice(0,5) || "TBD"}${e.end_time ? "-" + e.end_time.slice(0,5) : ""}, ${e.description || ""}`).join("\n") || "No upcoming events.";

    const deptInfo = deptsData.length > 0
      ? deptsData.map((d: any) => `- ${d.name}: HOD: ${d.hod_name || "N/A"}${d.description ? ", " + d.description : ""}`).join("\n")
      : "No department data available yet.";

    // Extract source URLs from knowledge base for live lookup
    const sourceUrls: string[] = [];
    kbData.forEach(kb => {
      const match = kb.content.match(/\[Source:\s*(https?:\/\/[^\]]+)\]/);
      if (match) sourceUrls.push(match[1]);
    });
    const websiteDomain = sourceUrls.length > 0
      ? new URL(sourceUrls[0]).origin
      : "https://ncerc.ac.in";

    const kbInfo = kbData.length > 0
      ? kbData.map(kb => `[${kb.category}] ${kb.title}: ${kb.content}`).join("\n")
      : "No additional college information available yet.";

    const SYSTEM_PROMPT = `You are a friendly, intelligent AI campus assistant deployed at the NCERC (Nehru College of Engineering and Research Centre) kiosk. Your name is "Yukti".

CURRENT TIME: ${currentTime} IST, ${dayOfWeek}
TODAY'S DATE: ${new Date().toISOString().split("T")[0]}

PERSONALITY: Warm, helpful, conversational. Speak naturally. You represent NCERC's Department of CSE(AI & ML).

RESPONSE LENGTH RULES:
- For simple factual questions (who, where, when): Keep it concise, 1-3 sentences.
- For questions about college info, admissions, courses, facilities, placements, fees, or anything covered in the COLLEGE INFORMATION section: Give a DETAILED and COMPREHENSIVE answer. Include all relevant facts, numbers, requirements, and details available. Do not summarize or shorten — students need complete information.
- For navigation/directions: Give full step-by-step directions.

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
10. COLLEGE KNOWLEDGE: When a user asks ANYTHING about the college — admissions, courses, facilities, fees, hostel, placements, history, rules, departments, infrastructure, achievements, or any general information — THOROUGHLY search the COLLEGE INFORMATION section below. Provide ALL relevant details found there. Do not omit information. If multiple knowledge entries are relevant, combine information from all of them into one comprehensive answer.
11. DEPARTMENTS: When asked about departments, HODs, or which departments exist, use the DEPARTMENTS data. Provide HOD names and descriptions.
12. SCHEDULE CHANGES: When a professor's status is "schedule_changed" and TEMPORARY SCHEDULE info is available, ALWAYS proactively mention it.
13. LIVE WEBSITE SEARCH: You have a tool called "search_college_website" that can fetch LIVE information from the college website (${websiteDomain}). USE THIS TOOL whenever:
    - The user asks about something NOT covered in your existing COLLEGE INFORMATION data below.
    - The user asks for very specific details (fees, specific contacts, specific department info, admission procedures, etc.) that you don't have.
    - You want to verify or get the latest information.
    - The user specifically mentions checking the website.
    When calling the tool, construct a likely URL path. Common pages: /contact, /about, /admissions, /placements, /departments, /facilities, /hostel, /scholarships, /gallery, /faculty, /courses.

LIVE FACULTY DATA:
${facultyInfo || "No faculty data available yet. Admin has not added any faculty."}

LIVE LOCATION DATA:
${locationInfo || "No location data available yet."}

LIVE EVENTS:
${eventInfo}

DEPARTMENTS:
${deptInfo}

COLLEGE INFORMATION (from admin's Brain):
${kbInfo}

EMERGENCY CONTACTS:
- Campus Security: +91-XXX-XXX-1234
- Medical: +91-XXX-XXX-5678
- Fire: 101`;

    const tools = [
      {
        type: "function",
        function: {
          name: "search_college_website",
          description: `Fetches and reads a page from the college website to find specific information. Use this when existing knowledge doesn't have the answer. The college website base URL is ${websiteDomain}.`,
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: `The full URL to fetch. Must start with ${websiteDomain}. Examples: ${websiteDomain}/contact, ${websiteDomain}/admissions, ${websiteDomain}/placements`,
              },
            },
            required: ["url"],
          },
        },
      },
    ];

    const aiMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    // Helper: consume an SSE stream and reconstruct the full message
    async function consumeSSE(response: Response): Promise<any> {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let content = "";
      let toolCalls: any[] = [];
      let finishReason = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta;
            const fr = parsed.choices?.[0]?.finish_reason;
            if (fr) finishReason = fr;
            if (delta?.content) content += delta.content;
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const i = tc.index ?? 0;
                if (!toolCalls[i]) toolCalls[i] = { id: "", type: "function", function: { name: "", arguments: "" } };
                if (tc.id) toolCalls[i].id = tc.id;
                if (tc.function?.name) toolCalls[i].function.name = tc.function.name;
                if (tc.function?.arguments) toolCalls[i].function.arguments += tc.function.arguments;
              }
            }
          } catch { /* skip partial */ }
        }
      }

      const msg: any = { role: "assistant", content: content || null };
      if (toolCalls.length > 0) msg.tool_calls = toolCalls;
      return { message: msg, finish_reason: finishReason };
    }

    // First call: with tools, consumed as SSE to detect tool calls
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools,
        stream: true,
      }),
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (firstResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await firstResponse.text();
      console.error("AI gateway error:", firstResponse.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const firstResult = await consumeSSE(firstResponse);

    // Check if AI wants to call a tool
    if (firstResult.message.tool_calls?.length > 0) {
      const toolCalls = firstResult.message.tool_calls;
      const toolResults = [];

      for (const tc of toolCalls) {
        if (tc.function.name === "search_college_website") {
          let args;
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            args = { url: websiteDomain };
          }
          
          // Security: only allow scraping the college domain
          let targetUrl = args.url || websiteDomain;
          if (!targetUrl.startsWith(websiteDomain)) {
            targetUrl = websiteDomain + (targetUrl.startsWith("/") ? targetUrl : "/" + targetUrl);
          }

          console.log("Live scraping:", targetUrl);
          const pageContent = await scrapeUrl(targetUrl);
          toolResults.push({
            role: "tool",
            tool_call_id: tc.id,
            content: pageContent,
          });
        }
      }

      // Second call: stream the final answer with tool results
      const finalMessages = [
        ...aiMessages,
        firstResult.message,
        ...toolResults,
      ];

      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: finalMessages,
          stream: true,
        }),
      });

      if (!finalResponse.ok) {
        const t = await finalResponse.text();
        console.error("AI final call error:", finalResponse.status, t);
        return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(finalResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // No tool call — the first call already has the content, re-stream it
    // Build a synthetic SSE response from the consumed content
    const contentText = firstResult.message.content || "";
    const sseData = `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: contentText, role: "assistant" }, finish_reason: null }] })}\n\ndata: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "" }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`;
    return new Response(sseData, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
