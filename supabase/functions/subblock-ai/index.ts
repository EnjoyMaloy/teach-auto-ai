import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — ИИ-ассистент для редактирования саб-блоков в конструкторе образовательных курсов.

ТИПЫ САБ-БЛОКОВ И ИХ НАЗНАЧЕНИЕ:
1. heading — крупный заголовок секции. Поля: content (текст), textAlign (left/center/right), textSize (large/xlarge), fontWeight (normal/bold)
2. text — абзац текста с форматированием. Поля: content (HTML с <b>, <i>, <mark>), textAlign, textSize (small/medium/large), backdrop (none/light/dark/blur)
3. image — изображение. Поля: imageUrl, imageRotation (-5..5)
4. button — кнопка со ссылкой. Поля: buttonLabel, buttonUrl, buttonVariant (primary/secondary/outline/ghost), textAlign
5. badge — метки/теги. Поля: badges (массив {text, iconType, iconValue}), badgeVariant (square/oval/contrast/pastel), badgeLayout (horizontal/vertical)
6. icon — декоративная иконка. Поля: iconName (Star/Heart/Zap/Trophy/Target/Lightbulb/Rocket/CheckCircle...), iconSize (medium/large), textAlign
7. divider — горизонтальный разделитель. Поля: dividerStyle (thin/medium/bold/dashed/dotted/wavy)
8. table — таблица данных. Поля: tableData (2D массив ячеек), tableStyle (simple/striped/bordered), tableTextSize (small/medium/large)
9. animation — Lottie/Rive анимация. Поля: animationUrl, animationType (lottie/rive), animationSize

ТВОИ ЗАДАЧИ:
1. Если пользователь описывает что хочет для КОНКРЕТНОГО саб-блока — верни обновлённые поля для этого блока
2. Если пользователь даёт ТЕКСТ для распределения — проанализируй и предложи набор саб-блоков с контентом
3. Отвечай на русском, будь лаконичен

ФОРМАТ ОТВЕТА (JSON):
{
  "message": "Краткое пояснение что сделал",
  "updates": { ... поля для обновления текущего саб-блока },
  "newBlocks": [ ... массив новых саб-блоков если нужно создать несколько ]
}

Если это просто вопрос — верни только message без updates/newBlocks.
Верни ТОЛЬКО валидный JSON без markdown-обёртки.`;

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
