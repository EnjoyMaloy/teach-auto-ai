import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — парсер MD-файлов для мобильных образовательных курсов. Твоя задача — преобразовать Markdown-документ в структурированный JSON курса.

## ТВОЯ ЗАДАЧА:
1. Определи заголовок курса (первый # заголовок)
2. Определи уроки (## заголовки = отдельные уроки)
3. Для каждого урока определи блоки (разделённые --- или логически)
4. Определи тип каждого блока: design (теория) или quiz (single_choice, multiple_choice, true_false, fill_blank, matching, ordering)
5. Для design-блоков создай subBlocks из контента
6. Для quiz-блоков определи вопрос, варианты ответов и правильный ответ
7. Найди промпты/описания для генерации картинок и добавь их как image subBlocks

## ПРАВИЛА ПАРСИНГА:

### Определение типов блоков:
- Если блок содержит вопрос с вариантами ответов (А/Б/В или маркеры + -) → quiz
- Если блок содержит текстовый контент, заголовки, описания → design
- Если в блоке есть промпт для картинки (описание иллюстрации, ![...]) → добавь image subBlock

### Для DESIGN блоков создавай subBlocks:
- Заголовки (### или **bold**) → { "type": "heading", "content": "...", "textAlign": "center", "textSize": "large", "fontWeight": "bold", "padding": "small" }
- Абзацы текста → { "type": "text", "content": "...", "textAlign": "left", "textSize": "medium", "padding": "small" }
- Списки через бейджи → { "type": "badge", "badges": [...], "badgeVariant": "oval", "badgeLayout": "vertical", "textAlign": "center", "padding": "small" }
- Описания картинок → { "type": "image", "imageDescription": "... (НА АНГЛИЙСКОМ!)", "imageSize": "medium", "textAlign": "center", "padding": "small" }

### Для TEXT subBlocks обязательно:
- Максимум 120 символов на один text subBlock! Если текст длиннее — разбей на несколько text subBlocks
- Используй HTML-форматирование: <b>жирный</b>, <i>курсив</i>, <mark>выделение</mark>
- Добавляй визуальное оформление:
  - "backdrop": "light" | "primary" | "dark" | "blur" — для 40-60% текстов
  - "backdropRounded": true — всегда при backdrop
  - "highlight": "marker" | "underline" | "wavy" — для 30-50% текстов для выделения ключевых слов

### Для QUIZ блоков:
- Определи тип квиза по контексту:
  - Один правильный ответ → single_choice
  - Несколько правильных → multiple_choice
  - Верно/Неверно → true_false
  - Пропуск слова → fill_blank
  - Соединить пары → matching
  - Порядок → ordering
- Найди правильный ответ (отмечен ✅, +, (правильно) или по контексту)
- Создай объяснение (explanation)

### Промпты для картинок:
- Если в тексте есть описание иллюстрации, промпт для картинки или ![описание] → создай image subBlock
- imageDescription ВСЕГДА на английском языке!
- Если промпт на русском — переведи на английский
- Стиль: "2D flat vector illustration, minimalist, clean background"

## КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ (iPhone 16, 393×852):
- МИНИМУМ 3 саб-блока на design слайд
- МАКСИМУМ 6 саб-блоков на design слайд
- heading: МАКС 45 символов
- text: МАКС 120 символов
- Для backdrop ВСЕГДА backdropRounded: true

## ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО валидный JSON:
{
  "title": "Название курса",
  "description": "Описание курса",
  "lessons": [
    {
      "title": "Название урока",
      "description": "Описание урока",
      "slides": [
        {
          "type": "design",
          "subBlocks": [ /* subBlocks */ ]
        },
        {
          "type": "single_choice",
          "content": "Вопрос?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "B",
          "explanation": "Потому что...",
          "explanationCorrect": "Верно! Потому что..."
        }
      ]
    }
  ]
}

Верни ТОЛЬКО валидный JSON без markdown-обёртки.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Требуется авторизация" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Недействительный токен" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { mdContent } = await req.json();
    if (!mdContent || typeof mdContent !== 'string' || mdContent.length === 0 || mdContent.length > 200000) {
      return new Response(
        JSON.stringify({ error: "MD контент должен быть от 1 до 200000 символов" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY не настроен" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MODEL = "gemini-3-flash-preview";
    console.log(`[parse-md-course] Parsing MD for user ${user.id}, content length: ${mdContent.length}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: SYSTEM_PROMPT + "\n\n## MD-ФАЙЛ ДЛЯ ПАРСИНГА:\n\n" + mdContent }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 65536,
        }
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error("[parse-md-course] Gemini API error:", status);
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Превышен лимит запросов" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Ошибка AI сервиса" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const content = parts
      .map((p: any) => p.text || '')
      .filter((t: string) => t.trim().length > 0)
      .pop() || '';

    console.log("[parse-md-course] Response length:", content.length);

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[parse-md-course] Error:", error);
    return new Response(
      JSON.stringify({ error: "Внутренняя ошибка сервера" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
