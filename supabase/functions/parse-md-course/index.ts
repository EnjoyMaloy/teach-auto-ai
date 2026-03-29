import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a LOSSLESS Markdown-to-Course-JSON converter for mobile educational courses.

## ABSOLUTE RULES — ZERO CONTENT LOSS:
1. **COPY** every lesson, heading, paragraph, list item, quiz, callout, caption, and prompt EXACTLY as written in the source MD. NEVER shorten, rewrite, merge, omit, reorder, summarize, or infer missing text.
2. **PRESERVE** the original lesson count and block count exactly. If the MD has 5 lessons with 12 blocks each, your output MUST have 5 lessons with 12 blocks each.
3. For each text block, include "raw_md" with the exact source text slice so we can verify nothing was lost.
4. If you are unsure how to classify a block, output it as a design block with the full raw text — do NOT drop it.

## BLOCK TYPES:

### DESIGN blocks (theory/content):
Each design block contains subBlocks array:
- Headings (### or **bold**) → { "type": "heading", "content": "EXACT TEXT", "raw_md": "EXACT SOURCE", "textAlign": "center", "textSize": "large", "fontWeight": "bold", "padding": "small" }
- Paragraphs → { "type": "text", "content": "EXACT TEXT with <b>bold</b>, <i>italic</i>, <mark>highlight</mark>", "raw_md": "EXACT SOURCE", "textAlign": "left", "textSize": "medium", "padding": "small" }
- Lists → { "type": "badge", "badges": [{"text": "EXACT ITEM TEXT", "iconType": "emoji", "iconValue": "relevant emoji"}], "badgeVariant": "oval", "badgeLayout": "vertical", "textAlign": "center", "padding": "small" }
- Image prompts (any description of illustration, ![...], or text describing what image should show) → { "type": "image", "imageDescription": "ENGLISH translation of the description, 2D flat vector illustration style", "imageSize": "medium", "textAlign": "center", "padding": "small" }

### TEXT subBlock formatting rules:
- Split text longer than 120 chars into multiple text subBlocks
- Use HTML: <b>bold</b>, <i>italic</i>, <mark>highlighted</mark>
- Add visual styling to 40-60% of text blocks:
  - "backdrop": "light" | "primary" | "dark" | "blur"
  - "backdropRounded": true (always when backdrop is set)
  - "highlight": "marker" | "underline" | "wavy" — for 30-50% of key terms

### QUIZ blocks:
Identify quizzes by: questions with answer options (А/Б/В, A/B/C, markers +/-, checkboxes)
- single_choice: one correct answer
- multiple_choice: multiple correct
- true_false: true/false question
- fill_blank: missing word (use ___ in content, set blankWord)
- matching: pairs to connect
- ordering: items to order

Quiz format:
{
  "type": "single_choice",
  "content": "EXACT question text",
  "options": ["EXACT option A", "EXACT option B", "EXACT option C", "EXACT option D"],
  "correctAnswer": "EXACT correct option text",
  "explanation": "EXACT explanation or auto-generated",
  "explanationCorrect": "Positive feedback"
}

## CONSTRAINTS (iPhone 16 screen, 393×852):
- MIN 3, MAX 6 subBlocks per design slide
- heading: MAX 45 chars
- text: MAX 120 chars per subBlock (split longer text into multiple subBlocks!)
- If a section has too many elements for one slide, split into multiple slides within the same lesson
- NEVER drop content to fit constraints — create more slides instead

## IMAGE DESCRIPTIONS:
- ALL imageDescription values MUST be in English
- Translate from source language if needed
- Always append style: "2D flat vector illustration, minimalist, bold outlines, clean background"
- Describe the scene specifically related to the educational content

## OUTPUT FORMAT:
Return ONLY valid JSON, no markdown fences:
{
  "title": "Course title from MD",
  "description": "Course description from MD or auto-generated",
  "lessons": [
    {
      "title": "Lesson title — EXACT from MD",
      "description": "Lesson description",
      "slides": [
        {
          "type": "design",
          "subBlocks": [/* subBlocks with raw_md */]
        },
        {
          "type": "single_choice",
          "content": "EXACT question",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "B",
          "explanation": "Because...",
          "explanationCorrect": "Correct!"
        }
      ]
    }
  ]
}

CRITICAL REMINDER: Your #1 job is ZERO CONTENT LOSS. Every piece of text from the MD file must appear in the output. Count lessons and blocks — they must match the source exactly.`;

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
    if (!mdContent || typeof mdContent !== 'string' || mdContent.length === 0 || mdContent.length > 200000) {
      return new Response(
        JSON.stringify({ error: "MD контент должен быть от 1 до 200000 символов" }),
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

    console.log(`[parse-md-course] Parsing MD for user ${user.id}, content length: ${mdContent.length}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000); // 90s timeout

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: "## SOURCE MD FILE (preserve ALL content):\n\n" + mdContent }
          ],
          temperature: 0.1,
          max_tokens: 65536,
        }),
      });
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') {
        console.error("[parse-md-course] Request timed out after 90s");
        return new Response(
          JSON.stringify({ error: "Таймаут: файл слишком большой, попробуйте разбить на части" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw e;
    }
    clearTimeout(timer);

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      console.error("[parse-md-course] AI gateway error:", status, errorText);
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Превышен лимит запросов, попробуйте позже" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Недостаточно средств для AI запроса" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Ошибка AI сервиса" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log("[parse-md-course] Response length:", content.length);

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[parse-md-course] Error:", error);
    return new Response(
      JSON.stringify({ error: "Внутренняя ошибка сервера" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
