import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHUNK_SYSTEM_PROMPT = `You are a LOSSLESS Markdown-to-Course-JSON converter for mobile educational courses.
You will receive a CHUNK of a larger MD file containing one or more lessons.

## ABSOLUTE RULES — ZERO CONTENT LOSS:
1. **COPY** every heading, paragraph, list item, quiz, callout, caption, and prompt EXACTLY as written. NEVER shorten, rewrite, merge, omit, reorder, summarize, or infer.
2. **PRESERVE** the original block count exactly.
3. If unsure how to classify a block, output it as a design block with full raw text — do NOT drop it.

## BLOCK TYPES:

### DESIGN blocks (theory/content):
Each design block contains subBlocks array:
- Headings (### or **bold**) → { "type": "heading", "content": "EXACT TEXT", "textAlign": "center", "textSize": "large", "fontWeight": "bold", "padding": "small" }
- Paragraphs → { "type": "text", "content": "EXACT TEXT with <b>bold</b>, <i>italic</i>, <mark>highlight</mark>", "textAlign": "left", "textSize": "medium", "padding": "small" }
- Lists → { "type": "badge", "badges": [{"text": "EXACT ITEM TEXT", "iconType": "emoji", "iconValue": "relevant emoji"}], "badgeVariant": "oval", "badgeLayout": "vertical", "textAlign": "center", "padding": "small" }
- Image prompts → { "type": "image", "imageDescription": "ENGLISH translation, 2D flat vector illustration, minimalist, bold outlines, clean background", "imageSize": "medium", "textAlign": "center", "padding": "small" }

### TEXT subBlock formatting:
- Split text longer than 120 chars into multiple text subBlocks
- Use HTML: <b>bold</b>, <i>italic</i>, <mark>highlighted</mark>
- Add visual styling to 40-60% of text blocks:
  - "backdrop": "light" | "primary" | "dark" | "blur"
  - "backdropRounded": true
  - "highlight": "marker" | "underline" | "wavy"

### QUIZ blocks:
- single_choice / multiple_choice / true_false / fill_blank / matching / ordering
Quiz format:
{
  "type": "single_choice",
  "content": "EXACT question text",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "EXACT correct option text",
  "explanation": "explanation",
  "explanationCorrect": "Positive feedback"
}

## CONSTRAINTS (iPhone 16 screen, 393×852):
- MIN 3, MAX 6 subBlocks per design slide
- heading: MAX 45 chars
- text: MAX 120 chars per subBlock
- NEVER drop content — create more slides instead

## OUTPUT FORMAT:
Return ONLY valid JSON, no markdown fences:
{
  "lessons": [
    {
      "title": "Lesson title — EXACT from MD",
      "description": "Lesson description",
      "slides": [...]
    }
  ]
}

CRITICAL: ZERO CONTENT LOSS. Every piece of text must appear in the output.`;

const META_PROMPT = `Extract course metadata from this markdown. Return ONLY valid JSON:
{"title": "course title", "description": "course description"}`;

function splitMdByLessons(md: string): string[] {
  // Split by ## headers (lesson boundaries), keeping header with content
  const lessonPattern = /(?=^## [^\n]+)/gm;
  const parts = md.split(lessonPattern).filter(p => p.trim().length > 0);
  
  if (parts.length <= 1) {
    // No ## headers found, try # headers
    const h1Pattern = /(?=^# [^\n]+)/gm;
    const h1Parts = md.split(h1Pattern).filter(p => p.trim().length > 0);
    if (h1Parts.length > 1) return h1Parts;
  }
  
  if (parts.length <= 1) {
    // No clear lesson boundaries, split by size (~10K chars)
    const chunks: string[] = [];
    let current = '';
    for (const line of md.split('\n')) {
      if (current.length > 10000 && line.startsWith('#')) {
        chunks.push(current);
        current = line + '\n';
      } else {
        current += line + '\n';
      }
    }
    if (current.trim()) chunks.push(current);
    return chunks.length > 0 ? chunks : [md];
  }
  
  // Merge small adjacent parts to avoid too many tiny requests
  const merged: string[] = [];
  let buffer = '';
  for (const part of parts) {
    if (buffer.length + part.length < 15000) {
      buffer += part;
    } else {
      if (buffer) merged.push(buffer);
      buffer = part;
    }
  }
  if (buffer) merged.push(buffer);
  
  return merged;
}

async function callAI(apiKey: string, systemPrompt: string, userContent: string, maxTokens = 16384): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 0.1,
        max_tokens: maxTokens,
      }),
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Требуется авторизация" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Недействительный токен" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { mdContent } = await req.json();
    if (!mdContent || typeof mdContent !== 'string' || mdContent.length === 0 || mdContent.length > 300000) {
      return new Response(
        JSON.stringify({ error: "MD контент должен быть от 1 до 300000 символов" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY не настроен" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chunks = splitMdByLessons(mdContent);
    console.log(`[parse-md-course] User ${user.id}, content: ${mdContent.length} chars, split into ${chunks.length} chunks`);

    // Process chunks in parallel (max 3 concurrent)
    const BATCH_SIZE = 3;
    const allLessons: any[] = [];
    let courseTitle = '';
    let courseDescription = '';

    // Get metadata from first chunk
    try {
      const metaResult = await callAI(LOVABLE_API_KEY, META_PROMPT, mdContent.slice(0, 3000), 512);
      const metaJson = metaResult.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const meta = JSON.parse(metaJson);
      courseTitle = meta.title || '';
      courseDescription = meta.description || '';
    } catch (e) {
      console.warn("[parse-md-course] Failed to extract metadata:", e);
    }

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (chunk, idx) => {
          const chunkIdx = i + idx;
          console.log(`[parse-md-course] Processing chunk ${chunkIdx + 1}/${chunks.length} (${chunk.length} chars)`);
          try {
            const result = await callAI(LOVABLE_API_KEY, CHUNK_SYSTEM_PROMPT, chunk);
            // Extract JSON from response
            let jsonStr = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            return parsed.lessons || [];
          } catch (e) {
            console.error(`[parse-md-course] Chunk ${chunkIdx + 1} failed:`, e);
            // Return a fallback lesson with raw content
            return [{
              title: `Урок ${chunkIdx + 1}`,
              description: '',
              slides: [{
                type: 'design',
                subBlocks: [{ type: 'text', content: chunk.slice(0, 500), textAlign: 'left', textSize: 'medium', padding: 'small' }]
              }]
            }];
          }
        })
      );
      for (const lessons of results) {
        allLessons.push(...lessons);
      }
    }

    const finalResult = JSON.stringify({
      title: courseTitle,
      description: courseDescription,
      lessons: allLessons,
    });

    console.log(`[parse-md-course] Done: ${allLessons.length} lessons, ${finalResult.length} chars`);

    return new Response(
      JSON.stringify({ content: finalResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[parse-md-course] Error:", error);
    const msg = error.name === 'AbortError'
      ? "Таймаут при обработке, попробуйте файл поменьше"
      : "Внутренняя ошибка сервера";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
