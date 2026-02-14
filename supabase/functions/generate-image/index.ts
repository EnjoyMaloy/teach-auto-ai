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
    console.error("No authorization header provided");
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
    console.error("Auth verification failed:", error?.message || "No user found");
    return {
      user: null,
      supabaseClient: null,
      error: new Response(
        JSON.stringify({ error: "Недействительный токен авторизации" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }

  console.log(`Authenticated user: ${user.id}`);
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

    const { prompt, slideContext, colorPalette, imageModel } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY не настроен. Добавьте ваш API ключ в настройках." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build color guidance from design system palette
    let colorGuidance = '';
    if (colorPalette && (colorPalette.primary || colorPalette.accent)) {
      const colors = [colorPalette.primary, colorPalette.accent].filter(Boolean);
      colorGuidance = `
Color palette guidance:
- Use colors harmonious with: ${colors.join(', ')}
- These should be the dominant accent colors in the illustration
- Complementary and analogous colors are allowed for visual balance
- Keep the overall palette cohesive and professional`;
    }

    // Create image generation prompt - minimalist flat design style
    const imagePrompt = `${slideContext || prompt}

Style requirements:
- Minimalist flat design illustration
- Clean geometric shapes and simplified forms
- Bold, vibrant colors with good contrast
- NO text, words, letters, or labels on the image
- Modern, professional look suitable for educational content
- Simple backgrounds, no complex textures${colorGuidance}`;

    const useFlash = imageModel === 'gemini-2.5-flash';
    
    console.log(`Generating image via ${useFlash ? 'gemini-2.5-flash (Lovable AI)' : 'gemini-3-pro-image-preview (Direct)'} for: ${(slideContext || prompt).substring(0, 60)}...`);

    let imageBase64: string | null = null;
    let imageMimeType = 'image/png';

    if (useFlash) {
      // Use Lovable AI Gateway for flash image model
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "LOVABLE_API_KEY не настроен" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI Gateway error:", response.status, errorText);
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Недостаточно кредитов Lovable AI." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Lovable AI error: ${response.status}`);
      }

      const data = await response.json();
      const imgUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imgUrl && imgUrl.startsWith('data:')) {
        const match = imgUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          imageMimeType = match[1];
          imageBase64 = match[2];
        }
      }
    } else {
      // Use direct Gemini API for pro model
      const MODEL = "gemini-3-pro-image-preview";

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini Image API error:", response.status, errorText);
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Превышен лимит запросов Gemini API. Попробуйте позже." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 403 || response.status === 400) {
          return new Response(
            JSON.stringify({ error: "Ошибка Gemini API. Проверьте ключ и биллинг.", details: errorText }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));
      if (imagePart?.inlineData) {
        imageMimeType = imagePart.inlineData.mimeType;
        imageBase64 = imagePart.inlineData.data;
      }
    }

    if (!imageBase64) {
      console.log("No image generated");
      return new Response(
        JSON.stringify({ imageUrl: null, message: "Image generation skipped" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageType = imageMimeType.split('/')[1] || 'png';
    const imageBytes = base64ToUint8Array(imageBase64);

    // Generate unique filename
    const fileName = `generated/${user.id}/${crypto.randomUUID()}.${imageType}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('course-images')
      .upload(fileName, imageBytes, {
        contentType: imageMimeType,
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient
      .storage
      .from('course-images')
      .getPublicUrl(fileName);

    console.log("Image uploaded successfully:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ imageUrl: urlData.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});