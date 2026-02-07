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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all courses
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, title, cover_image");

    if (coursesError) throw coursesError;
    
    console.log(`Found ${courses?.length || 0} courses total`);

    const updates: { id: string; cover_image: string; title: string }[] = [];

    for (const course of courses || []) {
      // Fetch lessons for this course
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", course.id)
        .order("order", { ascending: true });

      if (!lessons || lessons.length === 0) continue;

      // Fetch slides for these lessons
      const lessonIds = lessons.map(l => l.id);
      const { data: slides } = await supabase
        .from("slides")
        .select("sub_blocks, image_url, lesson_id, order")
        .in("lesson_id", lessonIds)
        .order("order", { ascending: true });

      if (!slides || slides.length === 0) continue;

      // Sort slides by lesson order then slide order
      const lessonOrderMap = new Map(lessons.map((l, i) => [l.id, i]));
      slides.sort((a, b) => {
        const lessonDiff = (lessonOrderMap.get(a.lesson_id) || 0) - (lessonOrderMap.get(b.lesson_id) || 0);
        if (lessonDiff !== 0) return lessonDiff;
        return a.order - b.order;
      });

      // Find first image
      let firstImage: string | null = null;
      
      for (const slide of slides) {
        // Check sub_blocks
        if (slide.sub_blocks && Array.isArray(slide.sub_blocks)) {
          const sortedBlocks = [...slide.sub_blocks].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          for (const block of sortedBlocks) {
            if (block.type === 'image' && block.imageUrl && !block.imageUrl.startsWith('data:')) {
              firstImage = block.imageUrl;
              break;
            }
          }
        }
        
        // Check slide's direct imageUrl
        if (!firstImage && slide.image_url && !slide.image_url.startsWith('data:')) {
          firstImage = slide.image_url;
        }
        
        if (firstImage) break;
      }

      if (firstImage) {
        updates.push({ id: course.id, cover_image: firstImage, title: course.title });
      }
    }

    // Batch update all courses
    for (const update of updates) {
      await supabase
        .from("courses")
        .update({ cover_image: update.cover_image })
        .eq("id", update.id);
    }

    console.log(`Updated ${updates.length} courses with cover images`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updates.length,
        courses: updates.map(u => ({ id: u.id, title: u.title }))
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
