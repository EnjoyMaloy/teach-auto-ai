import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  - iconType: 'none' | 'emoji' | 'lucide' | 'custom'
  - iconValue: string — эмодзи, имя иконки Lucide или URL картинки
- badgeVariant: 'square' | 'oval' | 'contrast' | 'pastel'
- badgeSize: 'small' | 'medium' | 'large'
- badgeLayout: 'horizontal' | 'vertical'
- textAlign: 'left' | 'center' | 'right'
- padding: 'none' | 'small' | 'medium' | 'large'

Доступные Lucide иконки для бейджей: Star, Heart, CheckCircle, Zap, Target, Trophy, Gift, Crown, Flame, Rocket, Lightbulb, ThumbsUp, BookOpen, Brain, Puzzle, GraduationCap, Award, Gem, Shield, Eye, Clock, Calendar, MapPin, Mail, User, Users, Settings, Search, Home, Bell, MessageCircle, FileText, Database, Cloud, Code, AlertCircle

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

### 9. animation — Lottie/Rive анимация (пользователь загружает сам)
- animationType: 'lottie' | 'rive'
- animationSize: 'small' | 'medium' | 'large' | 'full'
- textAlign: 'left' | 'center' | 'right'
- padding: 'none' | 'small' | 'medium' | 'large'

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

## СОВЕТЫ ПО ДИЗАЙНУ:
- Используй highlight для акцентирования ключевых слов
- Комбинируй backdrop с текстом для контраста
- Добавляй иконки для визуального разнообразия
- Используй badge с эмодзи или Lucide иконками для категорий
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
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a clean, professional illustration for an educational mobile app slide: ${description}. Style: modern, minimal, vibrant colors, no text on image.`
            }]
          }],
          generationConfig: {
            responseModalities: ["image", "text"]
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation failed:", response.status, errorText);
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
    
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, currentSubBlock, allSubBlocks, conversationHistory } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
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

    // Add conversation history if available
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Add current message
    contents.push({ role: "user", parts: [{ text: userContext }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean markdown wrapping if present
    resultText = resultText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { message: resultText };
    }

    // Generate images for image blocks that have descriptions but no URLs
    if (result.newBlocks && Array.isArray(result.newBlocks)) {
      for (const block of result.newBlocks) {
        if (block.type === 'image' && block.imageDescription && !block.imageUrl) {
          console.log("Found image block needing generation:", block.imageDescription);
          const imageUrl = await generateImage(block.imageDescription, GEMINI_API_KEY);
          if (imageUrl) {
            block.imageUrl = imageUrl;
          }
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("subblock-ai error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
