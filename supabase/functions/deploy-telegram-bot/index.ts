import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
