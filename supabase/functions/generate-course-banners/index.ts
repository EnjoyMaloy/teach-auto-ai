import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to verify user authentication
async function verifyAuth(req: Request): Promise<{ user: any; supabaseClient: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      user: null,
      supabaseClient: null,
      error: new Response(
        JSON.stringify({ error: "Требуется авторизация" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  
  if (error || !user) {
    return {
      user: null,
      supabaseClient: null,
      error: new Response(
        JSON.stringify({ error: "Недействительный токен авторизации" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }

  return { user, supabaseClient, error: null };
}

// Convert base64 to Uint8Array for upload
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const { user, supabaseClient, error: authError } = await verifyAuth(req);
    if (authError) {
      return authError;
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY не настроен" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get courses without cover images for current user
    const { data: courses, error: fetchError } = await supabaseClient
      .from('courses')
      .select('id, title, description')
      .eq('author_id', user.id)
      .is('cover_image', null)
      .limit(10);

    if (fetchError) {
      throw new Error(`Failed to fetch courses: ${fetchError.message}`);
    }

    if (!courses || courses.length === 0) {
      return new Response(
        JSON.stringify({ message: "Все курсы уже имеют обложки", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { courseId: string; success: boolean; imageUrl?: string; error?: string }[] = [];
    const MODEL = "gemini-3-pro-image-preview";

    // Process courses one by one to avoid rate limits
    for (const course of courses) {
      try {
        // Create a banner prompt based on course title
        const imagePrompt = `Create a beautiful course banner illustration for: "${course.title}"
${course.description ? `Course description: ${course.description}` : ''}

Style requirements:
- Modern minimalist gradient background
- Abstract geometric shapes and patterns
- Professional educational aesthetic
- Vibrant yet sophisticated color palette with purples, blues, and warm accents
- NO text, words, letters, or labels
- Clean composition suitable for a course card banner
- Portrait orientation (3:4 aspect ratio)
- Subtle depth with layered elements`;

        console.log(`Generating banner for course: ${course.title}`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: imagePrompt }] }],
            generationConfig: {
              imageConfig: {
                aspectRatio: "3:4",
                imageSize: "1K"
              }
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini error for ${course.id}:`, errorText);
          results.push({ courseId: course.id, success: false, error: `API error: ${response.status}` });
          
          // If rate limited, stop processing
          if (response.status === 429) {
            break;
          }
          continue;
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));

        if (!imagePart?.inlineData) {
          console.log(`No image generated for ${course.id}`);
          results.push({ courseId: course.id, success: false, error: "No image generated" });
          continue;
        }

        const mimeType = imagePart.inlineData.mimeType;
        const base64Data = imagePart.inlineData.data;
        const imageType = mimeType.split('/')[1] || 'png';
        const imageBytes = base64ToUint8Array(base64Data);

        // Upload to course-banners bucket
        const fileName = `${user.id}/${course.id}.${imageType}`;

        const { error: uploadError } = await supabaseClient
          .storage
          .from('course-banners')
          .upload(fileName, imageBytes, {
            contentType: mimeType,
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${course.id}:`, uploadError);
          results.push({ courseId: course.id, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseClient
          .storage
          .from('course-banners')
          .getPublicUrl(fileName);

        // Update course with cover image
        const { error: updateError } = await supabaseClient
          .from('courses')
          .update({ cover_image: urlData.publicUrl })
          .eq('id', course.id);

        if (updateError) {
          console.error(`Update error for ${course.id}:`, updateError);
          results.push({ courseId: course.id, success: false, error: updateError.message });
          continue;
        }

        console.log(`Successfully generated banner for: ${course.title}`);
        results.push({ courseId: course.id, success: true, imageUrl: urlData.publicUrl });

        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(`Error processing course ${course.id}:`, err);
        results.push({ courseId: course.id, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Сгенерировано ${successCount} из ${courses.length} баннеров`,
        updated: successCount,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-course-banners:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
