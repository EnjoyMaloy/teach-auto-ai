import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyAuth(req: Request): Promise<{ user: any; supabaseClient: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      user: null, supabaseClient: null,
      error: new Response(JSON.stringify({ error: "Требуется авторизация" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
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
      user: null, supabaseClient: null,
      error: new Response(JSON.stringify({ error: "Недействительный токен авторизации" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    };
  }

  return { user, supabaseClient, error: null };
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const arrayBuffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const mimeType = resp.headers.get('content-type') || 'image/png';
    return { base64, mimeType };
  } catch (e) {
    console.error('Failed to fetch reference image:', e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, supabaseClient, error: authError } = await verifyAuth(req);
    if (authError) return authError;

    const { prompt, slideContext, colorPalette, imageModel, mascotDescription, referenceImageUrl } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY не настроен." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build color guidance
    let colorGuidance = '';
    if (colorPalette && (colorPalette.primary || colorPalette.accent)) {
      const colors = [colorPalette.primary, colorPalette.accent].filter(Boolean);
      colorGuidance = `\nColor palette guidance:\n- Use colors harmonious with: ${colors.join(', ')}\n- These should be the dominant accent colors in the illustration`;
    }

    // Build mascot block
    const mascotBlock = mascotDescription
      ? `\n\nCharacter/Mascot (MUST appear in the illustration):\n${mascotDescription}\n- The character MUST appear in EVERY image, interacting naturally with the scene\n- Vary the character's actions: studying, celebrating, thinking, building, exploring, presenting, surprised, relaxed\n- Keep the character's appearance EXACTLY consistent across all images\n- CRITICAL: The character must ALWAYS be rendered in 2D flat vector style`
      : '';

    // Reference image instruction
    const referenceBlock = referenceImageUrl
      ? `\n\nVISUAL REFERENCE IMAGE IS ATTACHED. You MUST copy this character EXACTLY as shown:\n- Same face shape, eye style, body proportions\n- Same colors, outfit, and accessories\n- Same art style (2D flat vector with bold outlines)\n- DO NOT redesign or reinterpret the character — COPY it precisely`
      : '';

    const imagePrompt = `${slideContext || prompt}

Style requirements (STRICTLY FOLLOW):
- 2D flat vector illustration — absolutely NO 3D rendering, NO realistic shading, NO photorealism
- Clean geometric shapes and simplified forms with bold black outlines
- Solid color fills only — NO gradients, NO drop shadows, NO glossy effects
- Bold, vibrant colors with good contrast
- NO text, words, letters, or labels on the image
- Modern, professional look suitable for educational content
- Simple flat backgrounds, no complex textures or depth effects
- Everything in the image must follow the same 2D flat vector style consistently${mascotBlock}${referenceBlock}${colorGuidance}`;

    // Fetch reference image if provided
    let referenceImageData: { base64: string; mimeType: string } | null = null;
    if (referenceImageUrl) {
      referenceImageData = await fetchImageAsBase64(referenceImageUrl);
      if (referenceImageData) {
        console.log('Reference image fetched successfully');
      } else {
        console.warn('Failed to fetch reference image, proceeding without');
      }
    }

    // Build request parts — text + optional reference image
    const requestParts: any[] = [{ text: imagePrompt }];
    if (referenceImageData) {
      requestParts.push({
        inlineData: {
          mimeType: referenceImageData.mimeType,
          data: referenceImageData.base64,
        }
      });
    }

    const useFlash = imageModel === 'gemini-2.5-flash';
    const useNB2 = imageModel === 'gemini-3.1-flash';
    const primaryModel = useFlash ? "gemini-2.5-flash-image" : useNB2 ? "gemini-3.1-flash-image-preview" : "gemini-3-pro-image-preview";
    const fallbackModel = "gemini-2.5-flash-image";
    const modelsToTry = useFlash ? [primaryModel] : [primaryModel, fallbackModel];
    
    let response: Response | null = null;
    let lastError = '';

    for (const MODEL of modelsToTry) {
      const MAX_RETRIES = MODEL === primaryModel && !useFlash ? 2 : 3;
      console.log(`Generating image via ${MODEL}...`);
      
      let succeeded = false;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: requestParts }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
              ...(MODEL === "gemini-2.5-flash-image" ? {} : { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }),
            },
          }),
        });

        if (response.ok) { succeeded = true; break; }

        const errorText = await response.text();
        lastError = errorText;
        console.error(`${MODEL} error (attempt ${attempt + 1}/${MAX_RETRIES}):`, response.status);

        if (response.status === 503 || response.status === 429) {
          if (attempt < MAX_RETRIES - 1) {
            const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
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
        JSON.stringify({ error: "Сервис генерации изображений временно перегружен." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));
    let imageBase64 = imagePart?.inlineData?.data || '';
    let imageMimeType = imagePart?.inlineData?.mimeType || '';

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ imageUrl: null, message: "Image generation skipped" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageType = imageMimeType.split('/')[1] || 'png';
    const imageBytes = base64ToUint8Array(imageBase64);
    const fileName = `generated/${user.id}/${crypto.randomUUID()}.${imageType}`;

    let uploadError: any = null;
    for (let uploadAttempt = 0; uploadAttempt < 3; uploadAttempt++) {
      const { error: err } = await supabaseClient.storage.from('course-images')
        .upload(uploadAttempt === 0 ? fileName : `generated/${user.id}/${crypto.randomUUID()}.${imageType}`, imageBytes, {
          contentType: imageMimeType, upsert: false
        });

      if (!err) { uploadError = null; break; }
      console.error(`Upload error (attempt ${uploadAttempt + 1}/3):`, err.message);
      uploadError = err;
      if (uploadAttempt < 2) await new Promise(r => setTimeout(r, 1000 * (uploadAttempt + 1)));
    }

    if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

    const { data: urlData } = supabaseClient.storage.from('course-images').getPublicUrl(fileName);
    console.log("Image uploaded:", urlData.publicUrl);

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
