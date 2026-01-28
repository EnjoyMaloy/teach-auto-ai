import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard error messages
const ERROR_MESSAGES = {
  INTERNAL_ERROR: 'Произошла ошибка. Попробуйте снова.',
  INVALID_INPUT: 'Некорректные данные запроса.',
  INVALID_TOKEN: 'Недействительный токен бота.',
  AUTH_REQUIRED: 'Требуется авторизация.',
  COURSE_NOT_FOUND: 'Курс не найден.',
  ACCESS_DENIED: 'Нет доступа к этому курсу.',
  EXTERNAL_SERVICE: 'Сервис Telegram временно недоступен.'
};

interface DeployRequest {
  botToken: string;
  courseId: string;
  courseTitle: string;
  webAppUrl: string;
}

// Input validation
function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { botToken, courseId, courseTitle, webAppUrl } = data;
  
  // Bot token validation (basic format check)
  if (typeof botToken !== 'string' || botToken.length < 30 || botToken.length > 100) {
    return { valid: false, error: 'Invalid bot token format' };
  }
  
  // Course ID validation (UUID format)
  if (typeof courseId !== 'string' || !/^[0-9a-f-]{36}$/i.test(courseId)) {
    return { valid: false, error: 'Invalid course ID format' };
  }
  
  // Course title validation
  if (typeof courseTitle !== 'string' || courseTitle.length === 0 || courseTitle.length > 500) {
    return { valid: false, error: 'Invalid course title' };
  }
  
  // Web app URL validation
  if (typeof webAppUrl !== 'string' || !webAppUrl.startsWith('https://')) {
    return { valid: false, error: 'Invalid web app URL' };
  }
  
  return { valid: true };
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
        JSON.stringify({ error: ERROR_MESSAGES.AUTH_REQUIRED }),
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
        JSON.stringify({ error: ERROR_MESSAGES.AUTH_REQUIRED }),
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
        JSON.stringify({ error: ERROR_MESSAGES.COURSE_NOT_FOUND }),
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
        JSON.stringify({ error: ERROR_MESSAGES.ACCESS_DENIED }),
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
    // Parse and validate input
    let requestData: DeployRequest;
    try {
      requestData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_INPUT }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validateInput(requestData);
    if (!validation.valid) {
      console.error("Input validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_INPUT }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { botToken, courseId, courseTitle, webAppUrl } = requestData;

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
      console.error("Bot token validation failed");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }),
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
      console.error("Failed to set menu button");
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
  } catch (error) {
    console.error("Error deploying Telegram bot:", error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
