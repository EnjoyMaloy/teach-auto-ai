import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANGUAGE_NAMES: Record<string, string> = {
  ru: 'Russian', en: 'English', es: 'Spanish', de: 'German', fr: 'French',
  pt: 'Portuguese', it: 'Italian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
  ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', pl: 'Polish', uk: 'Ukrainian',
};

interface TranslationRequest {
  course_id: string;
  target_languages: string[];
  source_language: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { course_id, target_languages, source_language }: TranslationRequest = await req.json();

    if (!course_id || !target_languages?.length || !source_language) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    const { data: course, error: courseError } = await supabase
      .from("courses").select("id, author_id, title").eq("id", course_id).single();
    
    if (courseError || !course || course.author_id !== user.id) {
      return new Response(JSON.stringify({ error: "Course not found or access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load lessons and slides
    const { data: lessons } = await supabase
      .from("lessons").select("*").eq("course_id", course_id).order("order");
    
    if (!lessons?.length) {
      return new Response(JSON.stringify({ error: "No lessons found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lessonIds = lessons.map(l => l.id);
    const { data: slides } = await supabase
      .from("slides").select("*").in("lesson_id", lessonIds).order("order");

    // Get AI model from admin_settings
    let textModel = "gemini-3-flash-preview";
    try {
      const { data: setting } = await supabase
        .from("admin_settings").select("value").eq("key", "ai_text_model").single();
      if (setting?.value) textModel = String(setting.value);
    } catch {}

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceLangName = LANGUAGE_NAMES[source_language] || source_language;
    const results: Record<string, { lessons: number; slides: number }> = {};

    for (const targetLang of target_languages) {
      const targetLangName = LANGUAGE_NAMES[targetLang] || targetLang;
      let translatedLessons = 0;
      let translatedSlides = 0;

      // Translate lessons
      for (const lesson of lessons) {
        const prompt = `Translate the following course lesson metadata from ${sourceLangName} to ${targetLangName}. Return ONLY a JSON object with "title" and "description" fields. Keep formatting, do not add explanations.

Title: ${lesson.title}
Description: ${lesson.description || ''}`;

        try {
          const translated = await callGemini(geminiApiKey, textModel, prompt);
          const parsed = parseJsonResponse(translated);
          
          if (parsed?.title) {
            await supabase.from("lesson_translations").upsert({
              lesson_id: lesson.id,
              language_code: targetLang,
              title: parsed.title,
              description: parsed.description || '',
            }, { onConflict: "lesson_id,language_code" });
            translatedLessons++;
          }
        } catch (e) {
          console.error(`Failed to translate lesson ${lesson.id} to ${targetLang}:`, e);
        }
      }

      // Translate slides in batches
      if (slides?.length) {
        // Group slides into batches of 10
        const batches = [];
        for (let i = 0; i < slides.length; i += 10) {
          batches.push(slides.slice(i, i + 10));
        }

        for (const batch of batches) {
          const slidesPayload = batch.map(s => ({
            id: s.id,
            content: s.content || '',
            options: s.options,
            explanation: s.explanation,
            explanation_correct: s.explanation_correct,
            explanation_partial: s.explanation_partial,
            hints: s.hints,
            blank_word: s.blank_word,
            matching_pairs: s.matching_pairs,
            ordering_items: s.ordering_items,
            sub_blocks: s.sub_blocks,
          }));

          const prompt = `Translate the following course slide content from ${sourceLangName} to ${targetLangName}. Return ONLY a JSON array where each element has "id" and the translated fields. Keep the same field names. Only translate text content — do not translate IDs, colors, URLs, or structural data. For sub_blocks, only translate text/content fields inside them, preserve all other properties.

Slides:
${JSON.stringify(slidesPayload, null, 2)}`;

          try {
            const translated = await callGemini(geminiApiKey, textModel, prompt);
            const parsed = parseJsonResponse(translated);
            
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (!item.id) continue;
                await supabase.from("slide_translations").upsert({
                  slide_id: item.id,
                  language_code: targetLang,
                  content: item.content ?? null,
                  options: item.options ?? null,
                  explanation: item.explanation ?? null,
                  explanation_correct: item.explanation_correct ?? null,
                  explanation_partial: item.explanation_partial ?? null,
                  hints: item.hints ?? null,
                  blank_word: item.blank_word ?? null,
                  matching_pairs: item.matching_pairs ?? null,
                  ordering_items: item.ordering_items ?? null,
                  sub_blocks: item.sub_blocks ?? null,
                  is_stale: false,
                }, { onConflict: "slide_id,language_code" });
                translatedSlides++;
              }
            }
          } catch (e) {
            console.error(`Failed to translate slide batch to ${targetLang}:`, e);
          }
        }
      }

      results[targetLang] = { lessons: translatedLessons, slides: translatedSlides };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("translate-course error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseJsonResponse(text: string): any {
  // Try direct parse
  try { return JSON.parse(text); } catch {}
  
  // Extract from markdown code block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try { return JSON.parse(match[1].trim()); } catch {}
  }

  // Try finding array or object
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch {}
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }

  return null;
}
