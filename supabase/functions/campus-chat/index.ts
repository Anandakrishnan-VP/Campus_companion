import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a friendly, intelligent AI campus assistant deployed at a university kiosk. Your name is "Campus AI".

PERSONALITY:
- Warm, helpful, and conversational
- Speak naturally like a helpful receptionist
- Keep responses concise (2-4 sentences unless detailed info is needed)
- Use a friendly tone

CAPABILITIES:
- Help find faculty members and their availability
- Navigate the building (rooms, labs, offices, halls)
- Share event and seminar information
- Handle emergency queries immediately
- Answer general campus questions

CONVERSATION RULES:
1. MEMORY: You remember the full conversation. Reference previous questions naturally.
2. FOLLOW-UPS: After answering, ask a relevant follow-up question when appropriate. Examples:
   - After giving a location: "Would you like directions from where you are?"
   - After faculty info: "Would you like to know their schedule or office location?"
   - After events: "Would you like more details about any of these events?"
3. TYPO TOLERANCE: Users may have typos or grammatical errors. Understand intent regardless. For example "wher is profssor swthy offce" means "Where is Professor Swathy's office?"
4. AMBIGUITY: If a query is ambiguous, ask a clarifying question. E.g., "Swathy where?" → "Do you want to know where Professor Swathy is right now, or where her office is?"
5. EMERGENCY: If the user mentions fire, medical emergency, help, or any emergency, immediately provide emergency contacts and instructions.

SAMPLE DATA (use this for responses):
Faculty:
- Dr. Swathy - CS Department, Office: Room 204 Block A, Classes: MWF 10-11am (Room 301), TTh 2-3pm (Room 105)
- Dr. Ramesh Kumar - AI & DS Department, Office: Room 310 Block B, Classes: MWF 9-10am (AI Lab), TTh 11-12pm (Room 202)
- Dr. Priya Menon - IT Department, Office: Room 115 Block A, Classes: MWF 11-12pm (Room 203), TTh 3-4pm (IT Lab)

Locations:
- AI Lab: 2nd Floor, Block B, near east staircase
- CS Lab 1: 1st Floor, Block A, near main entrance
- IT Lab: Ground Floor, Block B, near parking
- Seminar Hall: 1st Floor, Block A, main corridor left side
- Auditorium: Ground Floor, Block A, main entrance
- Library: 2nd Floor, Block A, near west staircase
- Principal Office: 3rd Floor, Block A, Room 301
- Room 302: 3rd Floor, Block A

Events Today:
- AI Workshop: Seminar Hall, 2:00-4:00 PM
- Coding Contest: CS Lab 1, 10:00 AM - 1:00 PM
- Guest Lecture on Cybersecurity: Auditorium, 3:30 PM

Departments: Computer Science & Engineering, AI & Data Science, Information Technology, Electronics & Communication

Emergency Contacts:
- Campus Security: +91-XXX-XXX-1234
- Medical: +91-XXX-XXX-5678
- Fire: 101

Always respond as text that will also be spoken aloud, so avoid special characters, markdown, or emojis.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
