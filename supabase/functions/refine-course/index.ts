const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — ИИ-редактор образовательных курсов. Тебе дают текущий курс (массив уроков с блоками) и запрос пользователя на доработку.

## ТВОИ ВОЗМОЖНОСТИ:
- Добавлять новые уроки (генерируй полный контент с блоками)
- Удалять уроки
- Менять порядок уроков
- Изменять контент блоков массово (убрать все квизы, упростить тексты и т.д.)
- Добавлять/удалять блоки в уроках
- Менять тексты, вопросы, ответы

## СТРУКТУРА КАЖДОГО УРОКА (эталон — 10 блоков):
1. design ВВЕДЕНИЕ (badge урока + heading + text + image)
2-3. теория (design с контентом)
4. КВИЗ (single_choice, multiple_choice, true_false, fill_blank, matching, ordering, slider)
5-6. теория (design с контентом)
7. КВИЗ
8-9. теория (design с контентом)
10. design ИТОГИ (heading + text + badge навыков)

## ТИПЫ БЛОКОВ:
### Контентные:
- "design" — составной блок с subBlocks (heading, text, image, badge, button, divider, table)
- "image_text" — картинка с текстом

### Квизы:
- "single_choice" — один ответ, поля: content, options[], correctAnswer, explanation, explanationCorrect
- "multiple_choice" — несколько ответов, поля: content, options[], correctAnswer[], explanation, explanationCorrect, explanationPartial
- "true_false" — верно/неверно, поля: content, correctAnswer (boolean), explanation
- "fill_blank" — пропуск, поля: content (с ___), blankWord, explanation
- "matching" — пары, поля: content, matchingPairs[{id,left,right}], explanation
- "ordering" — порядок, поля: content, orderingItems[], correctOrder[], explanation
- "slider" — число, поля: content, sliderMin, sliderMax, sliderCorrect, sliderStep, explanation

## DESIGN SUB-BLOCKS:
- heading: { type, order, content (макс 45 символов), textAlign, textSize, fontWeight, backdrop, backdropRounded, highlight, padding }
- text: { type, order, content (макс 120 символов), textAlign, textSize, fontWeight, backdrop, backdropRounded, highlight, padding }
- image: { type, order, imageDescription (ENGLISH!), imageSize, textAlign, padding }
- badge: { type, order, badges[{id,text,iconType:"lucide",iconValue}], badgeVariant, badgeSize, badgeLayout, textAlign, padding }
- table: { type, order, tableData[[{id,content}]], tableStyle, tableTextSize, textAlign, padding }
- divider: { type, order, dividerStyle, padding }
- button: { type, order, buttonLabel, buttonUrl, buttonVariant, textAlign, padding }

## ПРАВИЛА:
- КАЖДЫЙ design блок без table ОБЯЗАТЕЛЬНО заканчивается image sub-block
- Макс 5-6 саб-блоков на design
- Для backdrop ВСЕГДА backdropRounded: true
- Чередуй текст и визуальные элементы

## ФОРМАТ ОТВЕТА:
Верни JSON:
{
  "message": "Краткое описание что изменилось (1-2 предложения, на русском)",
  "lessons": [
    {
      "title": "Название урока",
      "description": "Описание",
      "slides": [
        // Полные данные каждого блока
      ]
    }
  ]
}

КРИТИЧЕСКИ ВАЖНО:
- Верни ВСЕ уроки курса, не только измененные!
- Сохраняй неизмененные уроки как есть
- Для новых уроков генерируй полный контент по эталону (10 блоков)
- Верни ТОЛЬКО валидный JSON без markdown-обертки`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, lessons, conversationHistory } = await req.json();

    if (!message || !lessons) {
      return new Response(JSON.stringify({ error: "Missing message or lessons" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compress lessons for context - keep structure but trim verbose fields
    const compressedLessons = lessons.map((lesson: any, i: number) => ({
      index: i + 1,
      title: lesson.title,
      description: lesson.description,
      slides: (lesson.slides || []).map((slide: any) => {
        const s: any = { type: slide.type, content: slide.content };
        if (slide.options) s.options = slide.options;
        if (slide.correctAnswer !== undefined) s.correctAnswer = slide.correctAnswer;
        if (slide.explanation) s.explanation = slide.explanation;
        if (slide.explanationCorrect) s.explanationCorrect = slide.explanationCorrect;
        if (slide.explanationPartial) s.explanationPartial = slide.explanationPartial;
        if (slide.blankWord) s.blankWord = slide.blankWord;
        if (slide.matchingPairs) s.matchingPairs = slide.matchingPairs;
        if (slide.orderingItems) s.orderingItems = slide.orderingItems;
        if (slide.correctOrder) s.correctOrder = slide.correctOrder;
        if (slide.sliderMin !== undefined) {
          s.sliderMin = slide.sliderMin;
          s.sliderMax = slide.sliderMax;
          s.sliderCorrect = slide.sliderCorrect;
          s.sliderStep = slide.sliderStep;
        }
        if (slide.subBlocks) {
          s.subBlocks = slide.subBlocks.map((sb: any) => {
            const block: any = { type: sb.type, order: sb.order };
            if (sb.content) block.content = sb.content;
            if (sb.textAlign) block.textAlign = sb.textAlign;
            if (sb.textSize) block.textSize = sb.textSize;
            if (sb.fontWeight) block.fontWeight = sb.fontWeight;
            if (sb.badges) block.badges = sb.badges;
            if (sb.badgeVariant) block.badgeVariant = sb.badgeVariant;
            if (sb.badgeSize) block.badgeSize = sb.badgeSize;
            if (sb.badgeLayout) block.badgeLayout = sb.badgeLayout;
            if (sb.imageDescription) block.imageDescription = sb.imageDescription;
            if (sb.imageSize) block.imageSize = sb.imageSize;
            if (sb.backdrop && sb.backdrop !== 'none') block.backdrop = sb.backdrop;
            if (sb.backdropRounded) block.backdropRounded = sb.backdropRounded;
            if (sb.highlight && sb.highlight !== 'none') block.highlight = sb.highlight;
            if (sb.padding && sb.padding !== 'none') block.padding = sb.padding;
            if (sb.dividerStyle) block.dividerStyle = sb.dividerStyle;
            if (sb.tableData) block.tableData = sb.tableData;
            if (sb.tableStyle) block.tableStyle = sb.tableStyle;
            if (sb.buttonLabel) block.buttonLabel = sb.buttonLabel;
            if (sb.buttonUrl) block.buttonUrl = sb.buttonUrl;
            if (sb.buttonVariant) block.buttonVariant = sb.buttonVariant;
            return block;
          });
        }
        return s;
      }),
    }));

    const userContent = `Текущий курс (${compressedLessons.length} уроков):\n${JSON.stringify(compressedLessons, null, 1)}\n\nЗапрос: ${message}`;

    const messages: any[] = [];
    
    // Add conversation history if present
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-6)) {
        messages.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    messages.push({
      role: 'user',
      parts: [{ text: userContent }],
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 65536,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiResponse.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse JSON response
    let parsed: any;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(jsonStr.slice(start, end + 1));
      } else {
        throw new Error("Could not extract JSON");
      }
    }

    return new Response(JSON.stringify({
      message: parsed.message || "Курс обновлён",
      lessons: parsed.lessons || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("refine-course error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

