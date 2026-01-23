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
- Если не указано — используй разумные значения (3-5 уроков, 6-10 блоков на урок)

## ОБЯЗАТЕЛЬНАЯ СТРУКТУРА КАЖДОГО УРОКА:
1. ПЕРВЫЙ БЛОК — "design" с ВВЕДЕНИЕМ: что узнаем в уроке (badge + heading + text)
2. СРЕДНИЕ БЛОКИ — обучающий контент и практика (design, квизы, примеры)
3. ПОСЛЕДНИЙ БЛОК — "design" с ИТОГАМИ: что изучили + анонс следующего урока

## ДОСТУПНЫЕ ТИПЫ БЛОКОВ (выбирай самые подходящие!):

### КОНТЕНТНЫЕ:
- "design" — составной блок с sub-blocks (для красивых информационных слайдов)
- "text" — простой текст
- "image_text" — картинка с текстом

### ИНТЕРАКТИВНЫЕ (КВИЗЫ):
- "single_choice" — выбор ОДНОГО правильного ответа (лучше для проверки знаний)
- "multiple_choice" — выбор НЕСКОЛЬКИХ правильных ответов
- "true_false" — утверждение верно/неверно
- "fill_blank" — заполнить пропуск (для терминов)
- "matching" — соединить пары (для связей)
- "ordering" — расставить в правильном порядке (для процессов/шагов)
- "slider" — выбрать число на шкале

## РЕКОМЕНДАЦИИ ПО ВЫБОРУ БЛОКОВ:
- Введение/итоги урока → "design" 
- Объяснение концепции → "design" с heading + text + image
- Сравнение вариантов → "design" с table
- Проверка понимания → "single_choice" или "true_false"
- Закрепление терминов → "fill_blank"
- Шаги/процессы → "ordering"
- Связи между понятиями → "matching"

Верни JSON:
{
  "title": "Название курса",
  "description": "Описание",
  "lessonsCount": <число>,
  "blocksPerLesson": <число>,
  "lessons": [
    {
      "title": "Название урока",
      "goal": "Цель урока",
      "blocks": [
        { "type": "design", "purpose": "Введение: что узнаем в уроке" },
        { "type": "design|single_choice|...", "purpose": "Зачем этот блок" },
        { "type": "design", "purpose": "Итоги: что изучили, анонс след. урока" }
      ]
    }
  ]
}

Верни ТОЛЬКО валидный JSON без markdown.`;

// Step 3: Content - generate actual content for each block
const CONTENT_PROMPT = `Ты — контент-мейкер для мобильных образовательных курсов. Создай ПОЛНЫЙ контент для каждого блока.

## ВСЕ ТИПЫ БЛОКОВ И ИХ СТРУКТУРА:

### ========== DESIGN BLOCK (главный для контента!) ==========
Составной слайд с массивом subBlocks. Используй для красивых информационных слайдов.

**ТИПЫ САБ-БЛОКОВ:**

#### heading (заголовок)
{
  "type": "heading",
  "order": 1,
  "content": "Текст (МАКС 45 символов!)",
  "textAlign": "left|center|right",
  "textSize": "large|xlarge",
  "fontWeight": "medium|semibold|bold",
  "textRotation": -5...5,
  "backdrop": "none|light|dark|primary|blur",
  "backdropRounded": true,
  "highlight": "none|marker|underline|wavy",
  "padding": "none|small|medium|large"
}

#### text (параграф)
{
  "type": "text",
  "order": 2,
  "content": "Текст (МАКС 120 символов! Поддерживает <b>, <i>, <u>, <mark>)",
  "textAlign": "left|center|right",
  "textSize": "small|medium|large",
  "fontWeight": "normal|medium|semibold|bold",
  "backdrop": "none|light|dark|primary|blur",
  "backdropRounded": true,
  "highlight": "none|marker|underline|wavy",
  "padding": "none|small|medium|large"
}

#### image (картинка)
{
  "type": "image",
  "order": 3,
  "imageDescription": "Detailed illustration of... (ENGLISH! Для генерации AI)",
  "imageSize": "small|medium|large|full",
  "imageRotation": -5...5,
  "textAlign": "left|center|right",
  "padding": "none|small|medium|large"
}

#### badge (метки)
{
  "type": "badge",
  "order": 1,
  "badges": [
    {"id": "1", "text": "Урок 1", "iconType": "emoji|lucide|none", "iconValue": "📚|Star"}
  ],
  "badgeVariant": "square|oval|contrast|pastel",
  "badgeSize": "small|medium|large",
  "badgeLayout": "horizontal|vertical",
  "textAlign": "left|center|right",
  "padding": "none|small|medium|large"
}

#### button (кнопка со ссылкой)
{
  "type": "button",
  "order": 5,
  "buttonLabel": "Текст кнопки",
  "buttonUrl": "https://...",
  "buttonVariant": "primary|secondary|outline|ghost",
  "textAlign": "left|center|right",
  "padding": "none|small|medium|large"
}

#### divider (разделитель)
{
  "type": "divider",
  "order": 4,
  "dividerStyle": "thin|medium|bold|dashed|dotted|wavy",
  "padding": "none|small|medium|large"
}

#### table (таблица)
{
  "type": "table",
  "order": 3,
  "tableData": [
    [{"id": "1", "content": "Заголовок 1"}, {"id": "2", "content": "Заголовок 2"}],
    [{"id": "3", "content": "Ячейка 1"}, {"id": "4", "content": "Ячейка 2"}]
  ],
  "tableStyle": "simple|striped|bordered",
  "tableTextSize": "small|medium|large",
  "textAlign": "left|center|right",
  "padding": "none|small|medium|large"
}

#### animation (Lottie)
{
  "type": "animation",
  "order": 2,
  "animationKeyword": "success|loading|rocket|coffee|...",
  "animationType": "lottie",
  "animationSize": "small|medium|large|full",
  "animationAutoplay": true,
  "animationLoop": true,
  "textAlign": "center",
  "padding": "none|small|medium|large"
}

**Пример design блока:**
{
  "type": "design",
  "subBlocks": [
    { "type": "badge", "order": 1, "badges": [{"id": "1", "text": "Урок 1", "iconType": "emoji", "iconValue": "📚"}], "badgeVariant": "oval", "textAlign": "center", "padding": "medium" },
    { "type": "heading", "order": 2, "content": "Добро пожаловать!", "textAlign": "center", "textSize": "xlarge", "fontWeight": "bold" },
    { "type": "text", "order": 3, "content": "В этом уроке вы узнаете основы темы", "textAlign": "center", "textSize": "medium", "backdrop": "primary", "backdropRounded": true }
  ]
}

### ========== TEXT BLOCK (простой текст) ==========
{ "type": "text", "content": "Текст" }

### ========== IMAGE_TEXT BLOCK (картинка + текст) ==========
{ 
  "type": "image_text", 
  "content": "Текст под картинкой",
  "imageDescription": "A detailed illustration of... (ENGLISH!)"
}

### ========== SINGLE_CHOICE (один ответ) ==========
{
  "type": "single_choice",
  "content": "Вопрос?",
  "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
  "correctAnswer": "Правильный вариант",
  "explanation": "Объяснение почему это правильно",
  "explanationCorrect": "Молодец! Это верный ответ.",
  "explanationPartial": null
}

### ========== MULTIPLE_CHOICE (несколько ответов) ==========
{
  "type": "multiple_choice",
  "content": "Выберите все правильные варианты:",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": ["A", "C"],
  "explanation": "Объяснение",
  "explanationCorrect": "Отлично! Все верно!",
  "explanationPartial": "Частично верно. Есть ещё правильные варианты."
}

### ========== TRUE_FALSE (да/нет) ==========
{
  "type": "true_false",
  "content": "Утверждение для проверки",
  "correctAnswer": true,
  "explanation": "Объяснение"
}

### ========== FILL_BLANK (заполни пропуск) ==========
{
  "type": "fill_blank",
  "content": "Текст с ___ пропуском для слова",
  "blankWord": "пропущенное",
  "explanation": "Объяснение"
}

### ========== MATCHING (соедини пары) ==========
{
  "type": "matching",
  "content": "Соедините понятия с определениями:",
  "matchingPairs": [
    {"id": "1", "left": "Термин 1", "right": "Определение 1"},
    {"id": "2", "left": "Термин 2", "right": "Определение 2"},
    {"id": "3", "left": "Термин 3", "right": "Определение 3"}
  ],
  "explanation": "Объяснение связей"
}

### ========== ORDERING (расставь по порядку) ==========
{
  "type": "ordering",
  "content": "Расставьте шаги в правильном порядке:",
  "orderingItems": ["Шаг 1", "Шаг 2", "Шаг 3", "Шаг 4"],
  "correctOrder": ["Шаг 1", "Шаг 2", "Шаг 3", "Шаг 4"],
  "explanation": "Объяснение порядка"
}

### ========== SLIDER (выбери число) ==========
{
  "type": "slider",
  "content": "Сколько будет 2 + 2?",
  "sliderMin": 0,
  "sliderMax": 10,
  "sliderCorrect": 4,
  "sliderStep": 1,
  "explanation": "2 + 2 = 4"
}

## КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ (iPhone 16, 393×852):
- МАКСИМУМ 5-6 саб-блоков на design слайд!
- heading: МАКС 45 символов
- text: МАКС 120 символов (1-2 предложения)
- table: МАКС 4 колонки, 5 строк
- Для backdrop ВСЕГДА backdropRounded: true
- НЕ БОЛЕЕ 5-8 image/image_text на ВЕСЬ курс

## СТРУКТУРА УРОКОВ (ОБЯЗАТЕЛЬНО!):
1. ПЕРВЫЙ БЛОК каждого урока = design с ВВЕДЕНИЕМ (badge урока + heading + text)
2. СРЕДНИЕ БЛОКИ = обучающий контент (design, квизы разных типов)
3. ПОСЛЕДНИЙ БЛОК каждого урока = design с ИТОГАМИ (heading "Отлично!" + текст что изучили + анонс след. урока)

## РЕКОМЕНДАЦИИ:
- Чередуй design блоки с квизами для вовлечения
- Используй РАЗНЫЕ типы квизов (не только single_choice!)
- ordering отлично для процессов/шагов
- matching для связей между понятиями
- fill_blank для терминов
- true_false для быстрой проверки

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

    // Use user's own Gemini API key (required)
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY не настроен. Добавьте ваш API ключ в настройках." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Using Gemini 2.5 Pro model
    const MODEL = "gemini-2.5-pro";
    console.log(`Calling Google Gemini (${MODEL}) with role: ${agentRole || 'builder'} for user: ${user.id}`);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
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
          maxOutputTokens: 16384,
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
      if (response.status === 403 || response.status === 400) {
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
      JSON.stringify({ content, agentRole, model: MODEL }),
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