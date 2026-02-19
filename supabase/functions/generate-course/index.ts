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
  RATE_LIMIT: 'Превышен лимит запросов. Попробуйте позже.',
  API_ERROR: 'Сервис временно недоступен.',
  CONFIG_ERROR: 'Ошибка конфигурации сервиса.'
};

// Input validation helper
function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { userMessage, agentRole, mode } = data;
  
  // userMessage is required and must be a string with reasonable length
  if (typeof userMessage !== 'string' || userMessage.length === 0 || userMessage.length > 50000) {
    return { valid: false, error: 'userMessage must be a string between 1 and 50000 characters' };
  }
  
  // agentRole is optional but must be one of the valid roles if provided
  const validRoles = ['research', 'structure', 'content', undefined];
  if (agentRole !== undefined && !validRoles.includes(agentRole)) {
    return { valid: false, error: 'Invalid agentRole' };
  }
  
  // mode is optional but must be 'chat' or undefined if provided
  if (mode !== undefined && mode !== 'chat') {
    return { valid: false, error: 'Invalid mode' };
  }
  
  return { valid: true };
}

// Step 1: Research - deep topic analysis
const RESEARCH_PROMPT = `Ты — эксперт-исследователь. Твоя задача — провести ГЛУБОКОЕ исследование темы для создания образовательного курса.

## ЗАДАЧА:
1. Разбери тему на ключевые концепции (каждая концепция = потенциальный урок)
2. Для каждой концепции собери: определение, примеры, частые ошибки, интересные факты
3. Определи ЛОГИЧЕСКУЮ ПОСЛЕДОВАТЕЛЬНОСТЬ изучения (что нужно знать сначала, что потом)
4. Собери данные, которые можно использовать для квизов (факты, числа, сравнения, термины)

## ПРИНЦИП: 1 КОНЦЕПЦИЯ = 1 УРОК
Раздели всю тему на отдельные концепции так, чтобы каждая была:
- Самостоятельной единицей знания
- Логически связана с предыдущей
- Достаточно содержательной для 10 блоков (теория + квизы)

Верни JSON:
{
  "topic": "Тема",
  "targetAudience": "Для кого этот курс",
  "learningPath": "Описание пути обучения: от чего к чему придёт ученик",
  "concepts": [
    {
      "name": "Название концепции",
      "whyImportant": "Зачем это знать",
      "keyPoints": ["Ключевой тезис 1", "Ключевой тезис 2", "Ключевой тезис 3"],
      "definitions": [{"term": "Термин", "definition": "Определение"}],
      "examples": ["Практический пример 1", "Практический пример 2"],
      "commonMistakes": ["Частая ошибка 1"],
      "quizFacts": ["Факт для квиза 1", "Факт для квиза 2"],
      "connectsTo": "Как связано со следующей концепцией"
    }
  ],
  "difficulty": "beginner|intermediate|advanced"
}

ВАЖНО: Количество концепций должно соответствовать запрошенному количеству уроков!
Верни ТОЛЬКО валидный JSON без markdown.`;

// Step 2: Structure - plan the course with content outline per block
const STRUCTURE_PROMPT = `Ты — архитектор курсов. Твоя задача — спланировать ДЕТАЛЬНУЮ структуру курса, где каждый блок логически связан с предыдущим.

## ГЛАВНЫЙ ПРИНЦИП: СВЯЗНОСТЬ
- 1 УРОК = 1 КОНЦЕПЦИЯ/ИДЕЯ (не смешивай разные темы в одном уроке!)
- 1 БЛОК = 1 МЫСЛЬ (каждый блок раскрывает ровно один аспект)
- Каждый квиз проверяет ТОЛЬКО то, что было объяснено в предыдущих 2-3 блоках теории
- Урок строится как рассказ: введение → раскрытие → проверка → углубление → проверка → итоги

## ОБЯЗАТЕЛЬНАЯ СТРУКТУРА КАЖДОГО УРОКА (10 блоков):

### БЛОК 1 — ВВЕДЕНИЕ (design)
- Приветствие + название урока
- Чему научимся (2-3 пункта через badge-и)
- Мотивация: зачем это нужно знать
- Картинка по теме

### БЛОКИ 2-3 — ТЕОРЕТИЧЕСКИЙ БЛОК А (design)
- Блок 2: вводит понятие/тезис А (определение, объяснение)
- Блок 3: раскрывает тезис А глубже (пример, детали)
- Оба блока посвящены ОДНОЙ мысли!

### БЛОК 4 — КВИЗ по блокам 2-3
- Проверяет ТОЛЬКО материал из блоков 2-3!
- Вопрос должен быть ответим на основе прочитанного

### БЛОКИ 5-6 — ТЕОРЕТИЧЕСКИЙ БЛОК Б (design)
- Блок 5: вводит понятие/тезис Б
- Блок 6: раскрывает тезис Б глубже
- Логически продолжает блок А!

### БЛОК 7 — КВИЗ по блокам 5-6
- Проверяет ТОЛЬКО материал из блоков 5-6!

### БЛОКИ 8-9 — ТЕОРЕТИЧЕСКИЙ БЛОК В (design)
- Блок 8: вводит понятие/тезис В
- Блок 9: раскрывает тезис В или связывает А+Б+В

### БЛОК 10 — ИТОГИ (design)
- Краткий вывод: что узнали в этом уроке
- Badge-и с навыками/знаниями
- Тизер следующего урока: "В следующем уроке мы узнаем..."
- Картинка

## ДОСТУПНЫЕ ТИПЫ БЛОКОВ ДЛЯ КВИЗОВ:
- "single_choice" — выбор ОДНОГО правильного ответа
- "multiple_choice" — выбор НЕСКОЛЬКИХ правильных ответов
- "true_false" — утверждение верно/неверно
- "fill_blank" — заполнить пропуск (для терминов, введённых в теории!)
- "matching" — соединить пары (для связей между понятиями из теории!)
- "ordering" — расставить в правильном порядке (для процессов из теории!)
- "slider" — выбрать число на шкале

## КРИТИЧЕСКИ ВАЖНО:
- Если пользователь указал количество уроков — сделай РОВНО столько
- КАЖДЫЙ УРОК = РОВНО 10 БЛОКОВ
- В поле "contentOutline" опиши КОНКРЕТНО что будет в блоке (не абстрактно!)
- В поле "quizSource" для квизов укажи какой именно факт/тезис из теории проверяется

Верни JSON:
{
  "title": "Название курса",
  "description": "Описание курса",
  "lessonsCount": <число>,
  "lessons": [
    {
      "title": "Название урока (= одна концепция!)",
      "coreIdea": "Одно предложение: главная идея урока",
      "blocks": [
        { "type": "design", "purpose": "Введение", "contentOutline": "Приветствие + чему научимся: [конкретные пункты]" },
        { "type": "design", "purpose": "Теория А.1", "contentOutline": "Определение [конкретного понятия]: [суть]" },
        { "type": "design", "purpose": "Теория А.2", "contentOutline": "Пример [понятия]: [конкретный пример]" },
        { "type": "single_choice", "purpose": "Квиз по А", "contentOutline": "Вопрос про [понятие]", "quizSource": "Тезис из блока 2: [какой именно]" },
        { "type": "design", "purpose": "Теория Б.1", "contentOutline": "Определение [второго понятия]: [суть]" },
        { "type": "design", "purpose": "Теория Б.2", "contentOutline": "Детали [второго понятия]: [что именно]" },
        { "type": "matching", "purpose": "Квиз по Б", "contentOutline": "Соедини [что с чем]", "quizSource": "Связи из блоков 5-6" },
        { "type": "design", "purpose": "Теория В.1", "contentOutline": "Новый аспект: [что именно]" },
        { "type": "design", "purpose": "Теория В.2", "contentOutline": "Связь всех тезисов: [как A+Б+В работают вместе]" },
        { "type": "design", "purpose": "Итоги", "contentOutline": "Вывод: [что узнали] + тизер: [тема следующего урока]" }
      ]
    }
  ]
}

Верни ТОЛЬКО валидный JSON без markdown.`;

// Step 3: Content - generate actual content for each block
const CONTENT_PROMPT = `Ты — контент-мейкер для мобильных образовательных курсов. Создай ПОЛНЫЙ контент для каждого блока.

## 🎯 ГЛАВНЫЙ ПРИНЦИП: СВЯЗНОСТЬ И ЦЕЛОСТНОСТЬ

### ПРАВИЛО СВЯЗНОСТИ КВИЗОВ (САМОЕ ВАЖНОЕ!):
- Квиз в блоке 4 проверяет ТОЛЬКО материал из блоков 2-3
- Квиз в блоке 7 проверяет ТОЛЬКО материал из блоков 5-6
- ЗАПРЕЩЕНО спрашивать то, что ещё не было объяснено!
- Каждый вопрос квиза должен быть ответим на основе ПРОЧИТАННОГО материала

### ПРАВИЛО ВВОДНОГО БЛОКА (блок 1):
- Скажи "В этом уроке вы узнаете..." и перечисли 2-3 конкретных пункта через badge
- Объясни ЗАЧЕМ это нужно знать (мотивация)

### ПРАВИЛО ИТОГОВОГО БЛОКА (блок 10):
- Подведи итоги: "В этом уроке мы узнали..."
- Перечисли навыки через badge
- Если есть следующий урок — добавь тизер: "Далее мы разберём..."

### ПРАВИЛО ПОТОКА ИНФОРМАЦИИ:
- Блок 2 вводит новое понятие (определение, объяснение)
- Блок 3 раскрывает это же понятие глубже (пример, нюанс)
- Блок 4 (квиз) проверяет это понятие
- Блок 5 вводит СЛЕДУЮЩЕЕ понятие (логически вытекающее из предыдущего!)
- И так далее — каждый блок ПРОДОЛЖАЕТ предыдущий

## ВСЕ ТИПЫ БЛОКОВ И ИХ СТРУКТУРА:

### ========== DESIGN BLOCK (главный для контента!) ==========
Составной слайд с массивом subBlocks.

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
  "content": "Текст (МАКС 120 символов! ОДНА мысль = ОДИН text блок!)",
  "textAlign": "left|center|right",
  "textSize": "small|medium|large",
  "fontWeight": "normal|medium|semibold|bold",
  "backdrop": "none|light|dark|primary|blur",
  "backdropRounded": true,
  "highlight": "none|marker|underline|wavy",
  "padding": "none|small|medium|large"
}

⚠️ КРИТИЧЕСКИЕ ПРАВИЛА ДЛЯ TEXT:
- МАКС 120 символов включая теги!
- ОДНА мысль = ОДИН text блок
- Форматирование (<b>, <u>, <mark>) — МАКСИМУМ 1-2 слова на блок
- ❌ ПЛОХО: "<b>Ошибки:</b> <u>мелкий помол</u>, <u>быстрое опускание</u>"
- ✅ ХОРОШО: "Слишком <b>мелкий помол</b> — кофе просочится через фильтр"

### 🎨 ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА ВИЗУАЛЬНОГО ОФОРМЛЕНИЯ TEXT:

#### Подложки (backdrop):
- Используй backdrop в 40-60% текстовых блоков! Это делает контент визуально интереснее
- "light" — для обычных определений и фактов
- "primary" — для ключевых тезисов и важных выводов
- "dark" — для контрастных акцентов и предупреждений
- "blur" — для дополнительной информации и примечаний
- Всегда ставь "backdropRounded": true при использовании backdrop
- ❌ НЕ ставь backdrop: "none" на ВСЕ текстовые блоки — это скучно!

#### Маркеры (highlight):
- Используй highlight в 30-50% текстовых блоков для выделения ключевой мысли!
- "marker" — как жёлтый маркер, для самых важных определений и терминов
- "underline" — для акцента на действиях или процессах
- "wavy" — для интересных фактов и необычных утверждений
- ❌ НЕ ставь highlight: "none" на ВСЕ текстовые блоки!
- Комбинируй: backdrop + highlight вместе создают мощный визуальный акцент

#### Примеры правильного оформления:
✅ { "type": "text", "content": "<b>Фотосинтез</b> — процесс превращения света в энергию", "backdrop": "primary", "backdropRounded": true, "highlight": "none" }
✅ { "type": "text", "content": "Растения поглощают <mark>углекислый газ</mark> из воздуха", "backdrop": "none", "highlight": "marker" }
✅ { "type": "text", "content": "Без света этот процесс невозможен!", "backdrop": "light", "backdropRounded": true, "highlight": "wavy" }

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
    {"id": "1", "text": "Урок 1", "iconType": "lucide", "iconValue": "BookOpen"}
  ],
  "badgeVariant": "square|oval|contrast|pastel",
  "badgeSize": "small|medium|large",
  "badgeLayout": "horizontal|vertical",
  "textAlign": "left|center|right",
  "padding": "none|small|medium|large"
}

ВАЖНО для бейджей: используй ТОЛЬКО iconType: "lucide" или "none"!

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

**Пример ВВОДНОГО design блока:**
{
  "type": "design",
  "subBlocks": [
    { "type": "badge", "order": 1, "badges": [{"id": "1", "text": "Урок 1", "iconType": "lucide", "iconValue": "BookOpen"}], "badgeVariant": "oval", "textAlign": "center", "padding": "small" },
    { "type": "heading", "order": 2, "content": "Добро пожаловать!", "textAlign": "center", "textSize": "xlarge", "fontWeight": "bold" },
    { "type": "text", "order": 3, "content": "В этом уроке вы узнаете основы", "textAlign": "center", "textSize": "medium", "backdrop": "light", "backdropRounded": true, "highlight": "none" },
    { "type": "image", "order": 4, "imageDescription": "A welcoming illustration of a person starting a new learning journey", "imageSize": "medium", "textAlign": "center", "padding": "small" }
  ]
}

**Пример ИТОГОВОГО design блока:**
{
  "type": "design",
  "subBlocks": [
    { "type": "heading", "order": 1, "content": "Отлично!", "textAlign": "center", "textSize": "xlarge", "fontWeight": "bold" },
    { "type": "text", "order": 2, "content": "Вы освоили ключевые навыки этого урока!", "textAlign": "center", "textSize": "medium", "backdrop": "primary", "backdropRounded": true, "highlight": "marker" },
    { "type": "badge", "order": 3, "badges": [{"id": "1", "text": "Навык 1", "iconType": "lucide", "iconValue": "CheckCircle"}, {"id": "2", "text": "Навык 2", "iconType": "lucide", "iconValue": "Star"}], "badgeVariant": "contrast", "badgeLayout": "horizontal", "textAlign": "center", "padding": "small" },
    { "type": "image", "order": 4, "imageDescription": "A celebratory illustration with a trophy and confetti", "imageSize": "medium", "textAlign": "center", "padding": "small" }
  ]
}

### ========== КВИЗЫ ==========

#### SINGLE_CHOICE (один ответ)
{
  "type": "single_choice",
  "content": "Вопрос?",
  "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
  "correctAnswer": "Правильный вариант",
  "explanation": "Объяснение почему это правильно",
  "explanationCorrect": "Молодец! Это верный ответ.",
  "explanationPartial": null
}

#### MULTIPLE_CHOICE (несколько ответов)
{
  "type": "multiple_choice",
  "content": "Выберите все правильные варианты:",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": ["A", "C"],
  "explanation": "Объяснение",
  "explanationCorrect": "Отлично! Все верно!",
  "explanationPartial": "Частично верно. Есть ещё правильные варианты."
}

#### TRUE_FALSE (да/нет)
{
  "type": "true_false",
  "content": "Утверждение для проверки",
  "correctAnswer": true,
  "explanation": "Объяснение"
}

#### FILL_BLANK (заполни пропуск)
{
  "type": "fill_blank",
  "content": "Текст с ___ пропуском для слова",
  "blankWord": "пропущенное",
  "explanation": "Объяснение"
}

#### MATCHING (соедини пары)
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

#### ORDERING (расставь по порядку)
{
  "type": "ordering",
  "content": "Расставьте шаги в правильном порядке:",
  "orderingItems": ["Шаг 1", "Шаг 2", "Шаг 3", "Шаг 4"],
  "correctOrder": ["Шаг 1", "Шаг 2", "Шаг 3", "Шаг 4"],
  "explanation": "Объяснение порядка"
}

#### SLIDER (выбери число)
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
- МИНИМУМ 4-5 саб-блоков на design слайд
- МАКСИМУМ 5-6 саб-блоков на design слайд
- heading: МАКС 45 символов
- text: МАКС 120 символов (1-2 предложения)
- table: МАКС 4 колонки, 5 строк
- Для backdrop ВСЕГДА backdropRounded: true
- НЕ генерируй animation блоки!

## ⚠️ КАРТИНКА В КАЖДОМ DESIGN БЛОКЕ:
- Если нет table — последний саб-блок = image!
- Если есть table — картинка не нужна

## ⚠️ ЧЕРЕДОВАНИЕ САБ-БЛОКОВ:
- НИКОГДА 2+ текстовых блока подряд без визуального элемента!
- ❌: heading → text → text → text
- ✅: heading → text → image → text → badge
- ✅: badge → heading → text → divider → text → image

## СТРУКТУРА КАЖДОГО УРОКА (10 БЛОКОВ):
1. БЛОК 1 = design ВВЕДЕНИЕ (badge + heading + "чему научимся" + image)
2. БЛОКИ 2-3 = теория A (раскрывают ОДНУ мысль)
3. БЛОК 4 = КВИЗ (проверяет ТОЛЬКО блоки 2-3!)
4. БЛОКИ 5-6 = теория Б (раскрывают СЛЕДУЮЩУЮ мысль)
5. БЛОК 7 = КВИЗ (проверяет ТОЛЬКО блоки 5-6!)
6. БЛОКИ 8-9 = теория В (раскрывают ЕЩЁ ОДНУ мысль)
7. БЛОК 10 = design ИТОГИ (вывод + badge навыков + тизер следующего урока)

## ВЫБОР ТИПА КВИЗА:
- Если в теории ввели ТЕРМИН → fill_blank
- Если объяснили ПРОЦЕСС/ШАГИ → ordering
- Если сравнивали ПОНЯТИЯ → matching
- Если дали ФАКТ → true_false или single_choice
- Используй РАЗНЫЕ типы квизов в рамках курса!

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

    const { userMessage, agentRole, mode } = requestData;

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
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.CONFIG_ERROR }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Using Gemini 3 Flash Preview model (newest, fast + smart)
    const MODEL = "gemini-3-flash-preview";
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
          maxOutputTokens: 65536,
        }
      }),
    });
    
    if (!response.ok) {
      const status = response.status;
      console.error("Google Gemini API error:", status);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.RATE_LIMIT }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 403 || status === 400) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.CONFIG_ERROR }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.API_ERROR }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});