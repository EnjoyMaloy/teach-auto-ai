import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all courses
    const { data: courses, error: fetchError } = await supabase
      .from("courses")
      .select("id, title")
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;

    const prompt = `Сгенерируй ровно ${courses.length} уникальных названий курсов и описаний.
Темы: технологии, творчество, бизнес, здоровье, языки, наука.
Названия 2-4 слова. Описания - 1 короткое предложение (до 10 слов).
Ответ ТОЛЬКО JSON массив:
[{"title":"Название","description":"Описание."}]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    console.log("Raw Gemini response:", text);
    
    // Clean up the response - remove markdown code blocks
    let cleanedText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // Parse JSON from response
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error(`Failed to parse Gemini response: ${cleanedText.substring(0, 200)}`);
    }
    
    const generatedData = JSON.parse(jsonMatch[0]);
    console.log("Parsed data:", generatedData.length, "items");
    
    // Update each course
    const updates = [];
    for (let i = 0; i < courses.length && i < generatedData.length; i++) {
      const course = courses[i];
      const generated = generatedData[i];
      
      updates.push(
        supabase
          .from("courses")
          .update({
            title: generated.title,
            description: generated.description,
          })
          .eq("id", course.id)
      );
    }

    await Promise.all(updates);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: Math.min(courses.length, generatedData.length),
        data: generatedData.slice(0, courses.length)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
