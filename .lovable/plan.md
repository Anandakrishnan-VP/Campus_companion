

# Website Import for Knowledge Base

## What
Add a feature in the Admin "Brain" section where the admin can paste a website URL, scrape its content, and store it in the existing `knowledge_base` table. The campus chat AI (Yukti) already reads from `knowledge_base` in its system prompt, so scraped content will automatically be available for answering queries.

## How It Works

The pipeline is simple: Admin pastes URL → Edge function scrapes content → Content saved to `knowledge_base` → Yukti can answer questions from it.

No new tables needed. The existing `knowledge_base` table (with `title`, `content`, `category` columns) is a perfect fit.

## Implementation

### 1. Create edge function `scrape-website`
**File: `supabase/functions/scrape-website/index.ts`**

- Accepts `{ url: string }` in the request body
- Uses the Lovable AI gateway (Gemini 3 Flash) to summarize/extract the key information from the fetched content (since raw HTML can be huge and noisy)
- Fetches the website using `fetch()` in Deno, extracts text content
- Returns `{ title, content }` to the client

### 2. Add URL import UI in Admin Brain section
**File: `src/pages/Admin.tsx`**

- Add a "Import from Website" button next to "Add to Brain"
- Shows an input field for the URL and a "Scrape & Import" button
- On submit, calls the edge function, then inserts the result into `knowledge_base` with category "Website Import"
- Shows loading state and success/error toast

### 3. Update `supabase/config.toml`
Add the new function config with `verify_jwt = false`.

## Technical Details

- **No Firecrawl needed** — we use Deno's built-in `fetch()` to get the page HTML, then parse text content server-side. For most college/institutional websites this is sufficient.
- If the content is too large for the knowledge_base, the AI summarization step will condense it to the most relevant information.
- The admin can edit/delete imported entries just like any other Brain entry.
- The `campus-chat` function already includes all `knowledge_base` rows in its system prompt, so no changes needed there.

## Files Modified
- `src/pages/Admin.tsx` — Add URL import UI
- `supabase/functions/scrape-website/index.ts` — New edge function
- `supabase/config.toml` — Register new function

