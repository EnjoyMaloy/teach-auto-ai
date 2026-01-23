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

## ТИПЫ СЛАЙДОВ:

### 1. "design" — составной слайд с subBlocks (ОСНОВНОЙ ТИП!)
Используй для красивых информационных слайдов. Внутри массив subBlocks:

#### ТИПЫ САБ-БЛОКОВ И ВСЕ ИХ ПОЛЯ:

##### heading — крупный заголовок
- content: string — текст заголовка
- textAlign: 'left' | 'center' | 'right' | 'justify'
- textSize: 'small' | 'medium' | 'large' | 'xlarge'
- fontWeight: 'normal' | 'medium' | 'semibold' | 'bold'
- textRotation: number — поворот текста в градусах (-5...5)
- padding: 'none' | 'small' | 'medium' | 'large'
- backdrop: 'none' | 'light' | 'dark' | 'primary' | 'blur' — фон под текстом
- backdropRounded: true — ВСЕГДА ставь true для скруглённого фона
- highlight: 'none' | 'marker' | 'underline' | 'wavy' — выделение текста

##### text — абзац текста с форматированием
- content: string — текст (поддерживает HTML: <b>, <i>, <u>, <mark>, <s>)
- textAlign, textSize, fontWeight, textRotation, padding, backdrop, backdropRounded, highlight — как у heading

##### image — изображение (ТРЕБУЕТ ОПИСАНИЕ!)
- imageDescription: string — ОБЯЗАТЕЛЬНО! Описание на АНГЛИЙСКОМ для генерации ИИ
- imageSize: 'small' | 'medium' | 'large' | 'full'
- imageRotation: number — поворот картинки (-5...5)
- textAlign: 'left' | 'center' | 'right'
- padding: 'none' | 'small' | 'medium' | 'large'

##### button — кнопка со ссылкой
- buttonLabel: string — текст кнопки
- buttonUrl: string — URL ссылки
- buttonVariant: 'primary' | 'secondary' | 'outline' | 'ghost'
- textAlign, padding

##### badge — метки/теги
- badges: [{id: "uuid", text: "Текст", iconType: 'none'|'emoji'|'lucide', iconValue: "🔥 или Star"}]
- badgeVariant: 'square' | 'oval' | 'contrast' | 'pastel'
- badgeSize: 'small' | 'medium' | 'large'
- badgeLayout: 'horizontal' | 'vertical'
- textAlign, padding

##### divider — горизонтальный разделитель
- dividerStyle: 'thin' | 'medium' | 'bold' | 'dashed' | 'dotted' | 'wavy'
- padding

##### table — таблица данных (для сравнений!)
- tableData: [[{id, content}, ...], ...] — первая строка = заголовки
- tableStyle: 'simple' | 'striped' | 'bordered'
- tableTextSize: 'small' | 'medium' | 'large'
- textAlign, padding

Пример design слайда:
{
  "type": "design",
  "subBlocks": [
    { "type": "badge", "order": 1, "badges": [{"id": "1", "text": "Урок 1", "iconType": "emoji", "iconValue": "📚"}], "badgeVariant": "oval", "textAlign": "center" },
    { "type": "heading", "order": 2, "content": "Введение в тему", "textAlign": "center", "textSize": "xlarge", "fontWeight": "bold" },
    { "type": "text", "order": 3, "content": "Краткое описание", "textAlign": "center", "textSize": "medium", "backdrop": "primary", "backdropRounded": true }
  ]
}

### 2. "text" — простой текст:
{ "type": "text", "content": "Текст" }

### 3. "image_text" — картинка + текст (ВАЖНО: добавь imageDescription!):
{ 
  "type": "image_text", 
  "content": "Текст под картинкой",
  "imageDescription": "A detailed illustration of... (описание на АНГЛИЙСКОМ)"
}

### 4. "single_choice" — один правильный ответ:
{
  "type": "single_choice",
  "content": "Вопрос?",
  "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
  "correctAnswer": "Правильный вариант",
  "explanation": "Почему это правильно"
}

### 5. "multiple_choice" — несколько правильных:
{
  "type": "multiple_choice",
  "content": "Вопрос?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": ["A", "C"],
  "explanation": "Объяснение"
}

### 6. "true_false" — да/нет:
{
  "type": "true_false",
  "content": "Утверждение",
  "correctAnswer": true,
  "explanation": "Объяснение"
}

### 7. "fill_blank" — заполни пропуск:
{
  "type": "fill_blank",
  "content": "Текст с ___ пропуском",
  "blankWord": "правильное",
  "explanation": "Объяснение"
}

## РЕКОМЕНДАЦИИ ПО СТРУКТУРЕ:
- Первый слайд урока: design с hero (badge урока + heading + text с backdrop)
- Информационные слайды: design с heading + text + icon/image
- Сравнения: design с table внутри
- Проверка знаний: single_choice, multiple_choice, true_false, fill_blank
- Последний слайд урока: design с итогом (icon Trophy + heading "Отлично!")

## КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ ПО РАЗМЕРУ (iPhone 16, 393×852):
- МАКСИМУМ 5-6 саб-блоков на один design слайд!
- heading: максимум 45 символов
- text: максимум 120-150 символов (1-2 коротких предложения)
- Если контент длинный — разбей на несколько design слайдов
- image размером 'medium' или 'small' (не 'full' если есть текст)
- table: максимум 3 колонки, 4 строки

## ВАЖНО:
- Тексты КОРОТКИЕ (1 мысль = 1 экран мобильного)
- Для backdrop ВСЕГДА ставь backdropRounded: true
- Для image саб-блоков ОБЯЗАТЕЛЬНО imageDescription на АНГЛИЙСКОМ
- НЕ БОЛЕЕ 5-8 image/image_text на ВЕСЬ курс
- Используй table для сравнительных таблиц (до 3 колонок, до 4 строк)

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
