import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUILDER_SYSTEM_PROMPT = `Ты — AI-ассистент для создания интерактивных образовательных курсов в стиле Duolingo.

Когда пользователь описывает курс, ты должен вернуть JSON со структурой курса.

## Правила:
1. Курс делится на 2-5 уроков
2. Каждый урок содержит 4-8 слайдов
3. Тексты должны быть КОРОТКИМИ (1 мысль = 1 экран)
4. Язык простой, без воды
5. Квизы должны быть логичными и проверять понимание
6. Всегда добавляй explanation к квизам

## Типы слайдов:

### Контентные:
- "text" — простой текст
- "image_text" — картинка с текстом снизу
- "design" — составной слайд из суб-блоков (для красивых интро, карточек, фич)

### Квизы:
- "single_choice" — выбор одного ответа
- "multiple_choice" — выбор нескольких ответов  
- "true_false" — да/нет вопрос
- "fill_blank" — заполнить пропуск

## Design блок (type: "design"):
Используй для вступительных слайдов, карточек с фичами, красивых итогов.
Содержит массив subBlocks. Каждый sub-block имеет:
- type: "heading" | "text" | "badge" | "icon" | "button" | "divider"
- order: порядковый номер (1, 2, 3...)
- content: текст (для heading, text)
- textAlign: "left" | "center" | "right"
- textSize: "small" | "medium" | "large" | "xlarge" (для heading, text)
- fontWeight: "normal" | "medium" | "semibold" | "bold" (для heading)
- badgeText, badgeVariant: для badge
- iconName: название иконки из Lucide (Star, Heart, Zap, BookOpen, Trophy, Target, Lightbulb, Rocket, CheckCircle)
- buttonLabel, buttonVariant: для button

### Примеры design блоков:

Hero-секция (для начала урока):
{
  "type": "design",
  "subBlocks": [
    { "type": "badge", "order": 1, "badgeText": "Урок 1", "badgeVariant": "default", "textAlign": "center" },
    { "type": "heading", "order": 2, "content": "Введение в тему", "textAlign": "center", "textSize": "xlarge", "fontWeight": "bold" },
    { "type": "text", "order": 3, "content": "Узнаем основы", "textAlign": "center", "textSize": "medium" }
  ]
}

Карточка с фичей:
{
  "type": "design", 
  "subBlocks": [
    { "type": "icon", "order": 1, "iconName": "Lightbulb", "textAlign": "center" },
    { "type": "heading", "order": 2, "content": "Важный факт", "textAlign": "center", "textSize": "large", "fontWeight": "semibold" },
    { "type": "text", "order": 3, "content": "Описание факта", "textAlign": "center", "textSize": "medium" }
  ]
}

Итог урока:
{
  "type": "design",
  "subBlocks": [
    { "type": "icon", "order": 1, "iconName": "Trophy", "textAlign": "center" },
    { "type": "heading", "order": 2, "content": "Отлично!", "textAlign": "center", "textSize": "xlarge", "fontWeight": "bold" },
    { "type": "text", "order": 3, "content": "Ты изучил основы темы", "textAlign": "center", "textSize": "medium" }
  ]
}

## Рекомендации по использованию design:
- Первый слайд каждого урока — design с hero-секцией
- Последний слайд урока — design с итогом и иконкой Trophy
- Между контентом можно вставлять design с иконкой и важным фактом

Верни ТОЛЬКО валидный JSON без markdown-форматирования в формате:
{
  "title": "Название курса",
  "description": "Описание курса",
  "targetAudience": "Целевая аудитория",
  "estimatedMinutes": 10,
  "lessons": [
    {
      "title": "Название урока",
      "description": "Краткое описание",
      "slides": [
        {
          "type": "design",
          "subBlocks": [...]
        },
        {
          "type": "text",
          "content": "Текст слайда"
        },
        {
          "type": "single_choice",
          "content": "Вопрос?",
          "options": ["Вариант 1", "Вариант 2", "Вариант 3"],
          "correctAnswer": "Вариант 1",
          "explanation": "Объяснение правильного ответа"
        }
      ]
    }
  ]
}`;

const CHAT_SYSTEM_PROMPT = `Ты — AI-ассистент для помощи в редактировании образовательных курсов.

Ты помогаешь:
1. Улучшать контент слайдов (делать понятнее, интереснее)
2. Предлагать новые идеи для уроков и слайдов
3. Проверять качество вопросов и ответов
4. Советовать, как сделать курс более engaging

Отвечай на русском языке. Будь кратким и полезным.
Если пользователь просит улучшить конкретный слайд, предложи конкретные изменения.
Если просят идеи — дай 3-5 конкретных вариантов.`;

// Helper function to verify user authentication
async function verifyAuth(req: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    console.error("No authorization header provided");
    return {
      user: null,
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

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  
  if (error || !user) {
    console.error("Auth verification failed:", error?.message || "No user found");
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: "Недействительный токен авторизации" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }

  console.log(`Authenticated user: ${user.id}`);
  return { user, error: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(req);
    if (authError) {
      return authError;
    }

    const { userMessage, agentRole, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = BUILDER_SYSTEM_PROMPT;
    let userPrompt = userMessage;

    // Chat mode for editor assistant
    if (mode === "chat") {
      systemPrompt = CHAT_SYSTEM_PROMPT;
    }
    // Adjust prompts based on agent role for course generation
    else if (agentRole === "planner") {
      systemPrompt = `Ты — Planner AI. Твоя задача — проанализировать запрос пользователя и кратко описать план курса.
      
Ответь на русском языке, кратко опиши:
1. Что будет в курсе
2. Сколько уроков
3. Примерное время прохождения

Будь лаконичен, 2-3 предложения максимум.`;
    } else if (agentRole === "reviewer") {
      systemPrompt = `Ты — Reviewer AI. Проверь структуру курса и дай краткую оценку.

Ответь на русском, укажи:
1. Качество структуры
2. Логичность квизов  
3. Готовность к редактированию

Будь позитивен и лаконичен, 2-3 предложения.`;
    }

    console.log(`Calling AI Gateway with role: ${agentRole || 'builder'} for user: ${user.id}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Недостаточно кредитов. Пополните баланс в настройках." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI response received:", content?.substring(0, 200));

    return new Response(
      JSON.stringify({ content, agentRole }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-course:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
