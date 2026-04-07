import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractText(html: string): string {
  // Remove script, style, nav, footer, header, noscript, svg, iframe tags
  let text = html.replace(/<(script|style|nav|footer|header|noscript|svg|iframe|form|button)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode HTML entities
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'").replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"').replace(/&ndash;/g, "–").replace(/&mdash;/g, "—")
    .replace(/&bull;/g, "•").replace(/&hellip;/g, "...").replace(/&copy;/g, "©")
    .replace(/&reg;/g, "®").replace(/&trade;/g, "™").replace(/&#\d+;/g, " ");
  // Remove asset URLs but keep useful ones
  text = text.replace(/https?:\/\/[^\s)]+/g, (match) => {
    if (/\.(js|css|png|jpg|jpeg|gif|svg|woff|ttf|ico|webp)/i.test(match)) return " ";
    return match;
  });
  // Remove CSS/JS residue
  text = text.replace(/\{[^}]*\}/g, " ");
  text = text.replace(/var\s+\w+\s*=/g, " ");
  text = text.replace(/function\s*\([^)]*\)/g, " ");
  // Remove unicode control characters
  text = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");
  // Remove repeated special characters
  text = text.replace(/([|*_~=#>\\/<])\1{2,}/g, " ");
  // Remove standalone special chars
  text = text.replace(/\s[|•*►▶→←↑↓■□▪▫◆◇○●]\s/g, " ");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  // Remove single-char noise tokens
  text = text.replace(/\s+[^\w\s@+.]\s+/g, " ");
  return text.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Invalid protocol");
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch the website
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CampusBot/1.0)" },
    });
    if (!pageRes.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch website (HTTP ${pageRes.status})` }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await pageRes.text();
    let textContent = extractText(html);

    // Truncate to ~30k chars to stay within token limits
    if (textContent.length > 30000) {
      textContent = textContent.slice(0, 30000);
    }

    if (textContent.length < 50) {
      return new Response(JSON.stringify({ error: "Could not extract meaningful content from this URL" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to summarize and extract key information
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an information extraction assistant. Given website text content, extract and organize ALL useful information into a clean, structured summary. Include facts, details, contact info, dates, processes, requirements, fees, facilities — everything a campus AI assistant might need to answer student questions. Format as clear paragraphs with section headers. Be thorough but remove navigation elements, ads, and irrelevant boilerplate. Also generate a short descriptive title (max 10 words) for this content.

Return your response in this exact format:
TITLE: <your generated title>
---
<the organized content>`,
          },
          { role: "user", content: `Extract all useful information from this website content:\n\n${textContent}` },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const rawOutput = aiData.choices?.[0]?.message?.content || "";

    // Parse title and content from AI output
    let title = parsedUrl.hostname;
    let content = rawOutput;

    const titleMatch = rawOutput.match(/^TITLE:\s*(.+)/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
      const separatorIdx = rawOutput.indexOf("---");
      if (separatorIdx !== -1) {
        content = rawOutput.slice(separatorIdx + 3).trim();
      }
    }

    return new Response(JSON.stringify({ title, content, source_url: url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
