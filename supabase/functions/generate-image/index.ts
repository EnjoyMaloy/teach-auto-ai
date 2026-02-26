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

Deno.serve(async (req) => {
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

    // Create image generation prompt - minimalist flat design style with consistent mascot
    const imagePrompt = `${slideContext || prompt}

Style requirements:
- Minimalist flat design illustration
- Clean geometric shapes and simplified forms
- Bold, vibrant colors with good contrast
- NO text, words, letters, or labels on the image
- Modern, professional look suitable for educational content
- Simple backgrounds, no complex textures

Character consistency (CRITICAL):
- Every illustration MUST feature the same single mascot character throughout the entire course
- The mascot is a friendly, round-shaped cartoon character with simple expressive features
- The mascot should interact with the scene: pointing at objects, holding items, reacting emotionally to the topic
- Keep the mascot's design extremely simple and consistent: same body shape, same color, same proportions
- The mascot acts as a guide/teacher — it should feel like the same character across all slides${colorGuidance}`;

    const useFlash = imageModel === 'gemini-2.5-flash';
    const useNB2 = imageModel === 'gemini-3.1-flash';
    const primaryModel = useFlash ? "gemini-2.5-flash-image" : useNB2 ? "gemini-3.1-flash-image-preview" : "gemini-3-pro-image-preview";
    const fallbackModel = "gemini-2.5-flash-image";
    
    const modelsToTry = useFlash ? [primaryModel] : [primaryModel, fallbackModel];
    
    let response: Response | null = null;
    let lastError = '';

    for (const MODEL of modelsToTry) {
      const MAX_RETRIES = MODEL === primaryModel && !useFlash ? 2 : 3;
      console.log(`Generating image via ${MODEL} for: ${(slideContext || prompt).substring(0, 60)}...`);
      
      let succeeded = false;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: imagePrompt }] }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
              ...(MODEL === "gemini-2.5-flash-image" ? {} : { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }),
            },
          }),
        });

        if (response.ok) { succeeded = true; break; }

        const errorText = await response.text();
        lastError = errorText;
        console.error(`${MODEL} error (attempt ${attempt + 1}/${MAX_RETRIES}):`, response.status, errorText);

        if (response.status === 503 || response.status === 429) {
          if (attempt < MAX_RETRIES - 1) {
            const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
            console.log(`Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          // Fall through to try fallback model
          break;
        }
        if (response.status === 403 || response.status === 400) {
          return new Response(
            JSON.stringify({ error: "Ошибка Gemini API. Проверьте ключ и биллинг.", details: errorText }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }
      if (succeeded) break;
      
      if (MODEL !== modelsToTry[modelsToTry.length - 1]) {
        console.log(`${MODEL} exhausted retries, falling back to ${fallbackModel}...`);
      }
    }

    if (!response?.ok) {
      return new Response(
        JSON.stringify({ error: "Сервис генерации изображений временно перегружен. Попробуйте через минуту." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));
    let imageMimeType = '';
    let imageBase64 = '';
    if (imagePart?.inlineData) {
      imageMimeType = imagePart.inlineData.mimeType;
      imageBase64 = imagePart.inlineData.data;
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

    // Upload to Supabase Storage with retry
    let uploadError: any = null;
    for (let uploadAttempt = 0; uploadAttempt < 3; uploadAttempt++) {
      const { error: err } = await supabaseClient
        .storage
        .from('course-images')
        .upload(uploadAttempt === 0 ? fileName : `generated/${user.id}/${crypto.randomUUID()}.${imageType}`, imageBytes, {
          contentType: imageMimeType,
          upsert: false
        });

      if (!err) {
        uploadError = null;
        break;
      }

      console.error(`Storage upload error (attempt ${uploadAttempt + 1}/3):`, err.message);
      uploadError = err;

      if (uploadAttempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (uploadAttempt + 1)));
      }
    }

    if (uploadError) {
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