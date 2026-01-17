import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeployRequest {
  botToken: string;
  courseId: string;
  courseTitle: string;
  webAppUrl: string;
}

// Helper function to verify user authentication and course ownership
async function verifyAuthAndOwnership(
  req: Request, 
  courseId: string
): Promise<{ user: any; supabaseClient: any; error: Response | null }> {
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
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  
  if (authError || !user) {
    console.error("Auth verification failed:", authError?.message || "No user found");
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

  // Verify course ownership
  const { data: course, error: courseError } = await supabaseClient
    .from('courses')
    .select('author_id')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    console.error("Course not found:", courseError?.message || "No course data");
    return {
      user: null,
      supabaseClient: null,
      error: new Response(
        JSON.stringify({ error: "Курс не найден" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }

  if (course.author_id !== user.id) {
    console.error(`User ${user.id} attempted to deploy bot for course ${courseId} owned by ${course.author_id}`);
    return {
      user: null,
      supabaseClient: null,
      error: new Response(
        JSON.stringify({ error: "У вас нет прав для деплоя бота этого курса" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }

  return { user, supabaseClient, error: null };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { botToken, courseId, courseTitle, webAppUrl }: DeployRequest = await req.json();

    if (!botToken || !courseId || !webAppUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authentication and course ownership
    const { user, error: authError } = await verifyAuthAndOwnership(req, courseId);
    if (authError) {
      return authError;
    }

    console.log(`User ${user.id} deploying Telegram bot for course ${courseId}`);

    // Validate bot token by getting bot info
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = await botInfoResponse.json();

    if (!botInfo.ok) {
      return new Response(
        JSON.stringify({ error: "Invalid bot token", details: botInfo.description }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botUsername = botInfo.result.username;

    // Set up the menu button to open the Mini App
    const menuButtonResponse = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: "🎓 Открыть курс",
          web_app: {
            url: webAppUrl,
          },
        },
      }),
    });

    const menuButtonResult = await menuButtonResponse.json();

    if (!menuButtonResult.ok) {
      console.error("Failed to set menu button:", menuButtonResult);
    }

    // Set bot commands
    await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "start", description: "Начать курс" },
          { command: "help", description: "Помощь" },
        ],
      }),
    });

    // Set bot description
    await fetch(`https://api.telegram.org/bot${botToken}/setMyDescription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: `📚 ${courseTitle}\n\nНажмите кнопку "Открыть курс" чтобы начать обучение!`,
      }),
    });

    // Set bot short description
    await fetch(`https://api.telegram.org/bot${botToken}/setMyShortDescription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        short_description: `Интерактивный курс: ${courseTitle}`,
      }),
    });

    console.log(`Successfully deployed bot @${botUsername} for course ${courseId} by user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        botUsername,
        botLink: `https://t.me/${botUsername}`,
        message: "Bot successfully configured as Mini App",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deploying Telegram bot:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
