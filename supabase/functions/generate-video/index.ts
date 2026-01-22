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

// Poll for video generation completion
async function pollForVideo(
  operationName: string,
  apiKey: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<{ videoData: string; mimeType: string } | null> {
  console.log(`Polling for video generation: ${operationName}`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Poll attempt ${attempt + 1}/${maxAttempts}...`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Poll error: ${response.status}`, errorText);
      throw new Error(`Polling failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.done) {
      console.log("Video generation completed!");
      
      if (data.error) {
        console.error("Generation error:", data.error);
        throw new Error(data.error.message || "Video generation failed");
      }
      
      // Extract video from response
      const generatedVideos = data.response?.generatedVideos;
      if (generatedVideos && generatedVideos.length > 0) {
        const video = generatedVideos[0];
        if (video.video?.videoBytes) {
          return {
            videoData: video.video.videoBytes,
            mimeType: "video/mp4"
          };
        }
      }
      
      console.log("No video data in response:", JSON.stringify(data).substring(0, 500));
      return null;
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error("Video generation timed out");
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

    const { prompt, durationSeconds = 5 } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY не настроен. Добавьте ваш API ключ в настройках." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clamp duration to 5-10 seconds (Veo limits)
    const duration = Math.min(Math.max(durationSeconds, 5), 10);

    console.log(`Generating video via Veo 2 for: ${prompt.substring(0, 60)}... (${duration}s)`);

    // Use Veo 2 model for video generation
    const MODEL = "veo-2.0-generate-001";
    
    // Start video generation (async operation)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateVideos?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: prompt
            }
          ],
          generationConfig: {
            videoDuration: `${duration}s`,
            aspectRatio: "9:16", // Vertical for mobile courses
            resolution: "720p",
            numberOfVideos: 1
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Veo API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: "Доступ к Veo API запрещён. Возможно, ваш API ключ не поддерживает генерацию видео.",
            details: errorText 
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: "Модель Veo не найдена. Генерация видео может быть недоступна для вашего региона или аккаунта.",
            details: errorText 
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Veo API error: ${response.status} - ${errorText}`);
    }

    const operationData = await response.json();
    console.log("Video generation started:", JSON.stringify(operationData).substring(0, 300));
    
    // Check if this is an async operation (long-running)
    if (operationData.name) {
      // Poll for completion
      const videoResult = await pollForVideo(operationData.name, GEMINI_API_KEY);
      
      if (!videoResult) {
        return new Response(
          JSON.stringify({ videoUrl: null, message: "Video generation did not produce output" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const videoBytes = base64ToUint8Array(videoResult.videoData);
      
      // Generate unique filename
      const fileName = `generated/${user.id}/${crypto.randomUUID()}.mp4`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from('course-videos')
        .upload(fileName, videoBytes, {
          contentType: videoResult.mimeType,
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabaseClient
        .storage
        .from('course-videos')
        .getPublicUrl(fileName);

      console.log("Video uploaded successfully:", urlData.publicUrl);

      return new Response(
        JSON.stringify({ videoUrl: urlData.publicUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If response contains video directly (unlikely for Veo but handle it)
    const generatedVideos = operationData.generatedVideos;
    if (generatedVideos && generatedVideos.length > 0) {
      const video = generatedVideos[0];
      if (video.video?.videoBytes) {
        const videoBytes = base64ToUint8Array(video.video.videoBytes);
        const fileName = `generated/${user.id}/${crypto.randomUUID()}.mp4`;

        const { error: uploadError } = await supabaseClient
          .storage
          .from('course-videos')
          .upload(fileName, videoBytes, {
            contentType: "video/mp4",
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload video: ${uploadError.message}`);
        }

        const { data: urlData } = supabaseClient
          .storage
          .from('course-videos')
          .getPublicUrl(fileName);

        return new Response(
          JSON.stringify({ videoUrl: urlData.publicUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ videoUrl: null, message: "No video generated" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-video:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
