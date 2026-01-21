import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Step 1: Research - gather facts about the topic
const RESEARCH_PROMPT = `Ты — исследователь. Твоя задача — собрать ключевые факты по теме для образовательного курса.

ЗАДАЧА: Изучи тему и верни структурированную информацию.

Верни JSON:
{
  "topic": "Тема",
  "keyFacts": ["Факт 1", "Факт 2", ...],
  "concepts": ["Концепция 1", "Концепция 2", ...],
  "commonMistakes": ["Ошибка 1", "Ошибка 2"],
  "practicalExamples": ["Пример 1", "Пример 2"],
  "difficulty": "beginner|intermediate|advanced"
}

Верни ТОЛЬКО валидный JSON без markdown.`;

// Step 2: Structure - plan the course based on research and user requirements
const STRUCTURE_PROMPT = `Ты — архитектор курсов. Твоя задача — спланировать структуру курса СТРОГО по требованиям пользователя.

КРИТИЧЕСКИ ВАЖНО:
- Если пользователь указал количество уроков — сделай РОВНО столько
- Если пользователь указал количество блоков — сделай РОВНО столько  
- Если не указано — используй разумные значения (2-3 урока, 6-8 блоков)

На основе исследования и требований пользователя, создай план:

Верни JSON:
{
  "title": "Название курса",
  "description": "Описание",
  "lessonsCount": <число из требований>,
  "blocksPerLesson": <число из требований>,
  "lessons": [
    {
      "title": "Название урока",
      "goal": "Цель урока",
      "blocks": [
        { "type": "design|text|single_choice|...", "purpose": "Зачем этот блок" }
      ]
    }
  ]
}

Верни ТОЛЬКО валидный JSON без markdown.`;

// Step 3: Content - generate actual content for each block
const CONTENT_PROMPT = `Ты — контент-мейкер. Создай контент для КАЖДОГО блока по плану.

ТИПЫ БЛОКОВ И ИХ ФОРМАТ:

1. "design" — составной слайд с subBlocks:
{
  "type": "design",
  "subBlocks": [
    { "type": "badge", "order": 1, "badgeText": "Текст", "badgeVariant": "default", "textAlign": "center" },
    { "type": "heading", "order": 2, "content": "Заголовок", "textAlign": "center", "textSize": "xlarge", "fontWeight": "bold" },
    { "type": "text", "order": 3, "content": "Подзаголовок", "textAlign": "center", "textSize": "medium" },
    { "type": "icon", "order": 1, "iconName": "Star|Heart|Zap|BookOpen|Trophy|Target|Lightbulb|Rocket|CheckCircle", "textAlign": "center" }
  ]
}

2. "text" — простой текст:
{ "type": "text", "content": "Текст" }

3. "image_text" — картинка + текст:
{ "type": "image_text", "content": "Текст под картинкой" }

4. "single_choice" — один правильный ответ:
{
  "type": "single_choice",
  "content": "Вопрос?",
  "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
  "correctAnswer": "Правильный вариант",
  "explanation": "Почему это правильно"
}

5. "multiple_choice" — несколько правильных:
{
  "type": "multiple_choice",
  "content": "Вопрос?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": ["A", "C"],
  "explanation": "Объяснение"
}

6. "true_false" — да/нет:
{
  "type": "true_false",
  "content": "Утверждение",
  "correctAnswer": true,
  "explanation": "Объяснение"
}

7. "fill_blank" — заполни пропуск (слово в ___ ):
{
  "type": "fill_blank",
  "content": "Текст с ___ пропуском",
  "blankWord": "правильное",
  "explanation": "Объяснение"
}

РЕКОМЕНДАЦИИ:
- Первый блок урока: design с hero (badge + heading + text)
- Последний блок урока: design с итогом (icon Trophy + heading "Отлично!" + text)
- Между ними: text для теории, квизы для проверки
- Тексты КОРОТКИЕ (1 мысль = 1 экран)

Верни JSON:
{
  "title": "Название курса",
  "description": "Описание",
  "lessons": [
    {
      "title": "Название урока",
      "description": "Описание",
      "slides": [ /* блоки */ ]
    }
  ]
}

Верни ТОЛЬКО валидный JSON без markdown.`;

const CHAT_SYSTEM_PROMPT = `Ты — AI-ассистент для помощи в редактировании образовательных курсов.

Ты помогаешь:
1. Улучшать контент слайдов (делать понятнее, интереснее)
2. Предлагать новые идеи для уроков и слайдов
3. Проверять качество вопросов и ответов
4. Советовать, как сделать курс более engaging

Отвечай на русском языке. Будь кратким и полезным.`;

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

    let systemPrompt = CONTENT_PROMPT;
    let userPrompt = userMessage;

    // Chat mode for editor assistant
    if (mode === "chat") {
      systemPrompt = CHAT_SYSTEM_PROMPT;
    }
    // Adjust prompts based on agent role for course generation
    else if (agentRole === "research") {
      systemPrompt = RESEARCH_PROMPT;
    } else if (agentRole === "structure") {
      systemPrompt = STRUCTURE_PROMPT;
    } else if (agentRole === "content") {
      systemPrompt = CONTENT_PROMPT;
    }

    // Check if user has their own Gemini API key, otherwise fallback to Lovable AI
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    let response: Response;
    
    if (GEMINI_API_KEY) {
      // Use Google Gemini API directly (cheaper for user)
      console.log(`Calling Google Gemini directly with role: ${agentRole || 'builder'} for user: ${user.id}`);
      
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Gemini API error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Превышен лимит запросов Google API. Попробуйте позже." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 403) {
          return new Response(
            JSON.stringify({ error: "Неверный API ключ Gemini. Проверьте настройки." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw new Error(`Google Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      console.log("Gemini response received:", content?.substring(0, 200));
      
      return new Response(
        JSON.stringify({ content, agentRole }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } else if (LOVABLE_API_KEY) {
      // Fallback to Lovable AI Gateway
      console.log(`Calling Lovable AI Gateway with role: ${agentRole || 'builder'} for user: ${user.id}`);
      
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    } else {
      throw new Error("No AI API key configured (GEMINI_API_KEY or LOVABLE_API_KEY)");
    }

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
