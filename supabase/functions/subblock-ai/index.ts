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
  AUTH_REQUIRED: 'Требуется авторизация.',
  RATE_LIMIT: 'Слишком много запросов. Подождите немного.',
  API_ERROR: 'Сервис временно недоступен.',
  CONFIG_ERROR: 'Ошибка конфигурации сервиса.'
};

// Input validation helper
function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { message, currentSubBlock, allSubBlocks, conversationHistory } = data;
  
  // Message is required and must be a string with reasonable length
  if (typeof message !== 'string' || message.length === 0 || message.length > 5000) {
    return { valid: false, error: 'Message must be a string between 1 and 5000 characters' };
  }
  
  // currentSubBlock is optional but must be an object if provided
  if (currentSubBlock !== undefined && (typeof currentSubBlock !== 'object' || currentSubBlock === null)) {
    return { valid: false, error: 'currentSubBlock must be an object' };
  }
  
  // allSubBlocks is optional but must be an array if provided
  if (allSubBlocks !== undefined && !Array.isArray(allSubBlocks)) {
    return { valid: false, error: 'allSubBlocks must be an array' };
  }
  
  // Limit array sizes
  if (Array.isArray(allSubBlocks) && allSubBlocks.length > 50) {
    return { valid: false, error: 'Too many sub-blocks' };
  }
  
  // conversationHistory is optional but must be an array if provided
  if (conversationHistory !== undefined && !Array.isArray(conversationHistory)) {
    return { valid: false, error: 'conversationHistory must be an array' };
  }
  
  if (Array.isArray(conversationHistory) && conversationHistory.length > 20) {
    return { valid: false, error: 'Conversation history too long' };
  }
  
  return { valid: true };
}

// Helper function to verify user authentication
async function verifyAuth(req: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    console.error("No authorization header provided");
    return {
      user: null,
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

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  
  if (error || !user) {
    console.error("Auth verification failed:", error?.message || "No user found");
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: ERROR_MESSAGES.AUTH_REQUIRED }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }

  console.log(`Authenticated user: ${user.id}`);
  return { user, error: null };
}

const SYSTEM_PROMPT = `Ты — ИИ-ассистент для редактирования саб-блоков в конструкторе образовательных курсов.

## ТИПЫ САБ-БЛОКОВ И ВСЕ ИХ ПОЛЯ:

### 1. heading — крупный заголовок
- content: string — текст заголовка
- textAlign: 'left' | 'center' | 'right' | 'justify'
- textSize: 'small' | 'medium' | 'large' | 'xlarge'
- fontWeight: 'normal' | 'medium' | 'semibold' | 'bold'
- textRotation: number — поворот текста в градусах (например -5, 0, 5)
- padding: 'none' | 'small' | 'medium' | 'large'
- backdrop: 'none' | 'light' | 'dark' | 'primary' | 'blur' — фон под текстом
- backdropRounded: boolean — скруглённый фон
- highlight: 'none' | 'marker' | 'underline' | 'wavy' — выделение текста

### 2. text — абзац текста с форматированием
- content: string — текст (поддерживает HTML: <b>, <i>, <u>, <mark>, <s>)
- textAlign: 'left' | 'center' | 'right' | 'justify'
- textSize: 'small' | 'medium' | 'large' | 'xlarge'
- fontWeight: 'normal' | 'medium' | 'semibold' | 'bold'
- textRotation: number — поворот текста
- padding: 'none' | 'small' | 'medium' | 'large'
- backdrop: 'none' | 'light' | 'dark' | 'primary' | 'blur'
- backdropRounded: boolean
- highlight: 'none' | 'marker' | 'underline' | 'wavy'

### 3. image — изображение (ТРЕБУЕТ ОПИСАНИЕ ДЛЯ ГЕНЕРАЦИИ!)
- imageDescription: string — ОБЯЗАТЕЛЬНО! Описание изображения на английском для генерации ИИ
- imageSize: 'small' | 'medium' | 'large' | 'full'
- imageRotation: number — поворот картинки в градусах (-5...5)
- textAlign: 'left' | 'center' | 'right' — позиционирование
- padding: 'none' | 'small' | 'medium' | 'large'

### 4. button — кнопка со ссылкой
- buttonLabel: string — текст кнопки
- buttonUrl: string — URL ссылки
- buttonVariant: 'primary' | 'secondary' | 'outline' | 'ghost'
- textAlign: 'left' | 'center' | 'right'
- padding: 'none' | 'small' | 'medium' | 'large'

### 5. badge — метки/теги (один или несколько)
- badges: массив объектов [{id, text, iconType, iconValue}]
  - id: string — уникальный ID (используй crypto.randomUUID() формат)
  - text: string — текст бейджа
  - iconType: 'none' | 'lucide' — ТОЛЬКО lucide иконки или без иконки!
  - iconValue: string — имя иконки Lucide (если iconType = 'lucide')
- badgeVariant: 'square' | 'oval' | 'contrast' | 'pastel'
- badgeSize: 'small' | 'medium' | 'large'
- badgeLayout: 'horizontal' | 'vertical'
- textAlign: 'left' | 'center' | 'right'
- padding: 'none' | 'small' | 'medium' | 'large'

ВАЖНО для бейджей: НЕ используй emoji! Только iconType: 'lucide' или 'none'.

### 6. icon — декоративная иконка Lucide
- iconName: string — имя иконки из списка выше
- iconSize: 'medium' | 'large'
- iconColor: string — CSS цвет
- textAlign: 'left' | 'center' | 'right'
- padding: 'none' | 'small' | 'medium' | 'large'

### 7. divider — горизонтальный разделитель
- dividerStyle: 'thin' | 'medium' | 'bold' | 'dashed' | 'dotted' | 'wavy'
- padding: 'none' | 'small' | 'medium' | 'large'

### 8. table — таблица данных
- tableData: двумерный массив ячеек [[{id, content}, ...], ...]
  - Первая строка — заголовки
  - Остальные строки — данные
- tableStyle: 'simple' | 'striped' | 'bordered'
- tableTextSize: 'small' | 'medium' | 'large'
- textAlign: 'left' | 'center' | 'right'
- padding: 'none' | 'small' | 'medium' | 'large'

### 9. animation — Lottie анимация (ИИ подбирает автоматически!)
- animationType: 'lottie' (по умолчанию)
- animationKeyword: string — ОБЯЗАТЕЛЬНО! Ключевое слово для поиска анимации НА АНГЛИЙСКОМ (например: "rocket", "success", "loading", "coffee", "star")
- animationSize: 'small' | 'medium' | 'large' | 'full'
- textAlign: 'left' | 'center' | 'right'
- padding: 'none' | 'small' | 'medium' | 'large'

ВАЖНО для анимаций: Указывай animationKeyword — лучшие слова: rocket, success, loading, check, star, heart, celebration, confetti, trophy, gift, coins, money, fire, lightning, brain, idea, lightbulb, target, goal, growth, chart, progress, done, complete, thumbs up

## ОБЩИЕ ПОЛЯ ДЛЯ ВСЕХ БЛОКОВ:
- id: string — уникальный ID (генерируется автоматически)
- type: тип саб-блока
- order: number — порядок в списке

## ТВОИ ЗАДАЧИ:
1. Когда пользователь просит ИЗМЕНИТЬ существующие блоки — верни ВСЕ блоки в newBlocks с внесёнными изменениями
2. Когда пользователь даёт ТЕКСТ/ТЕМУ для создания — создай красивый набор саб-блоков в newBlocks
3. ВАЖНО: Всегда возвращай newBlocks с ПОЛНЫМ набором блоков (существующие + изменения)
4. Сохраняй id существующих блоков при их изменении!
5. Для image блоков ОБЯЗАТЕЛЬНО указывай imageDescription на английском — картинка будет сгенерирована автоматически
6. Отвечай на русском, будь лаконичен

## КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ ПО РАЗМЕРУ (iPhone 16, 393×852):
- МАКСИМУМ 5-6 саб-блоков на один design слайд
- heading: максимум 45 символов
- text: максимум 120-150 символов (1-2 предложения)
- Если контент не влезает — разбей на несколько слайдов
- Для backdrop ВСЕГДА ставь backdropRounded: true
- image размером 'medium' или 'small' (не 'full' если есть текст)
- table: максимум 3 колонки, 4 строки

## СОВЕТЫ ПО ДИЗАЙНУ:
- Используй highlight для акцентирования ключевых слов
- Комбинируй backdrop с текстом для контраста
- Используй badge с Lucide иконками для категорий (НЕ emoji!)
- Поворачивай (textRotation) элементы для динамики (-5 до 5 градусов)
- Таблицы отлично подходят для сравнений
- Для изображений пиши чёткие описания на АНГЛИЙСКОМ

## ФОРМАТ ОТВЕТА (JSON):
{
  "message": "Краткое пояснение что сделал",
  "newBlocks": [ ... массив ВСЕХ саб-блоков с изменениями ]
}

ВАЖНО: НЕ используй "updates" — всегда возвращай полный массив newBlocks!
Если это просто вопрос — верни только message без newBlocks.
Верни ТОЛЬКО валидный JSON без markdown-обёртки.`;

// Generate image using Gemini API
async function generateImage(description: string, apiKey: string): Promise<string | null> {
  try {
    console.log("Generating image for:", description);
    
    const imagePrompt = `${description}

Style requirements:
- Minimalist flat design illustration
- Clean geometric shapes and simplified forms
- Bold, vibrant colors with good contrast
- NO text, words, letters, or labels on the image
- Modern look suitable for mobile educational app
- Simple backgrounds, no complex textures`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: imagePrompt }]
          }],
          generationConfig: {
            imageConfig: {
              aspectRatio: "9:16",
              imageSize: "1K"
            }
          }
        })
      }
    );

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const base64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        console.log("Image generated successfully");
        return `data:${mimeType};base64,${base64}`;
      }
    }
    
    console.log("No image in response");
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

// Search LottieFiles for animation by keyword
async function searchLottieAnimation(keyword: string, supabaseUrl: string, supabaseKey: string): Promise<string | null> {
  try {
    console.log("Searching Lottie animation for:", keyword);
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/lottiefiles-search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query: keyword, limit: 1 }),
      }
    );

    if (!response.ok) {
      console.error("Lottie search failed:", response.status);
      return null;
    }

    const data = await response.json();
    if (data?.success && data?.data?.length > 0) {
      const lottieUrl = data.data[0].lottieUrl;
      console.log("Found Lottie animation:", lottieUrl);
      return lottieUrl;
    }
    
    console.log("No Lottie animation found for:", keyword);
    return null;
  } catch (error) {
    console.error("Lottie search error:", error);
    return null;
  }
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

    // Parse and validate input
    let requestData;
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

    const { message, currentSubBlock, allSubBlocks, conversationHistory } = requestData;
    console.log(`Processing subblock-ai request for user: ${user.id}`);
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.CONFIG_ERROR }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context based on what we have
    let userContext = '';
    if (currentSubBlock) {
      userContext = `Текущий саб-блок (тип: ${currentSubBlock.type}): ${JSON.stringify(currentSubBlock)}\n\nЗапрос пользователя: ${message}`;
    } else if (allSubBlocks && allSubBlocks.length > 0) {
      userContext = `Текущие саб-блоки на слайде: ${JSON.stringify(allSubBlocks)}\n\nЗапрос пользователя: ${message}`;
    } else {
      userContext = `Слайд пустой. Создай саб-блоки по запросу.\n\nЗапрос пользователя: ${message}`;
    }

    // Build conversation with history
    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Понял. Готов помочь с дизайном слайдов. Жду запрос." }] },
    ];

    // Add conversation history if available (limited to validated entries)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        if (msg && typeof msg === 'object' && typeof msg.content === 'string') {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content.slice(0, 2000) }]
          });
        }
      }
    }

    // Add current message
    contents.push({ role: "user", parts: [{ text: userContext }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      console.error("Gemini API error:", status);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.RATE_LIMIT }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.API_ERROR }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean markdown wrapping if present
    resultText = resultText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let result;
    try {
      result = JSON.parse(resultText);
      
      // Handle double-encoded JSON (when AI returns JSON inside message field)
      if (result.message && typeof result.message === 'string' && !result.newBlocks) {
        try {
          const innerResult = JSON.parse(result.message);
          if (innerResult.newBlocks || innerResult.message) {
            console.log("Fixed double-encoded JSON response");
            result = innerResult;
          }
        } catch {
          // Not double-encoded, keep original
        }
      }
    } catch {
      result = { message: resultText };
    }

    // Get Supabase URL for internal function calls
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

    // Generate images for image blocks and find animations for animation blocks
    if (result.newBlocks && Array.isArray(result.newBlocks)) {
      const promises: Promise<void>[] = [];
      
      for (const block of result.newBlocks) {
        // Generate images
        if (block.type === 'image' && block.imageDescription && !block.imageUrl) {
          console.log("Found image block needing generation:", block.imageDescription);
          promises.push(
            generateImage(block.imageDescription, GEMINI_API_KEY).then(imageUrl => {
              if (imageUrl) {
                block.imageUrl = imageUrl;
              }
            })
          );
        }
        
        // Search Lottie animations
        if (block.type === 'animation' && block.animationKeyword && !block.animationUrl) {
          console.log("Found animation block needing search:", block.animationKeyword);
          promises.push(
            searchLottieAnimation(block.animationKeyword, SUPABASE_URL, SUPABASE_ANON_KEY).then(animationUrl => {
              if (animationUrl) {
                block.animationUrl = animationUrl;
                block.animationType = 'lottie';
              }
            })
          );
        }
      }
      
      // Wait for all media generation to complete
      await Promise.all(promises);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("subblock-ai internal error:", error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
