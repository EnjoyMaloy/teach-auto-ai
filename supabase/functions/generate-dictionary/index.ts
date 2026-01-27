import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Crypto and finance terms to generate
const TERMS = [
  { term: "Bitcoin", category: "crypto", definition: "Первая и крупнейшая децентрализованная криптовалюта, созданная в 2009 году под псевдонимом Сатоши Накамото" },
  { term: "Blockchain", category: "crypto", definition: "Технология распределённого реестра, хранящая данные в виде цепочки связанных блоков" },
  { term: "DeFi", category: "crypto", definition: "Децентрализованные финансы — экосистема финансовых приложений на блокчейне без посредников" },
  { term: "NFT", category: "crypto", definition: "Невзаимозаменяемый токен — уникальный цифровой актив, подтверждающий право владения" },
  { term: "Стейкинг", category: "crypto", definition: "Блокировка криптовалюты для поддержки сети блокчейн с получением вознаграждения" },
  { term: "Смарт-контракт", category: "crypto", definition: "Самоисполняющийся программный код на блокчейне, автоматизирующий выполнение условий договора" },
  { term: "Альткоин", category: "crypto", definition: "Любая криптовалюта, кроме Bitcoin — от Ethereum до мем-монет" },
  { term: "Волатильность", category: "finance", definition: "Степень изменчивости цены актива за определённый период времени" },
  { term: "Ликвидность", category: "finance", definition: "Способность актива быстро продаваться по рыночной цене без значительных потерь" },
  { term: "Капитализация", category: "finance", definition: "Общая стоимость всех выпущенных токенов или акций компании" },
  { term: "Диверсификация", category: "finance", definition: "Стратегия распределения инвестиций между разными активами для снижения рисков" },
  { term: "HODL", category: "crypto", definition: "Стратегия долгосрочного удержания криптовалюты вне зависимости от колебаний цены" },
  { term: "Газ (Gas)", category: "crypto", definition: "Комиссия за выполнение транзакций и смарт-контрактов в сети Ethereum" },
  { term: "Кошелёк (Wallet)", category: "crypto", definition: "Программа или устройство для хранения приватных ключей и управления криптовалютой" },
  { term: "Майнинг", category: "crypto", definition: "Процесс создания новых блоков и подтверждения транзакций с помощью вычислительной мощности" },
  { term: "Токен", category: "crypto", definition: "Цифровой актив, созданный на существующем блокчейне, представляющий ценность или право" },
  { term: "Деривативы", category: "finance", definition: "Производные финансовые инструменты, цена которых зависит от базового актива" },
  { term: "Хедж", category: "finance", definition: "Стратегия защиты инвестиций от рисков путём открытия противоположных позиций" },
  { term: "ROI", category: "finance", definition: "Return on Investment — показатель рентабельности инвестиций в процентах" },
  { term: "FUD", category: "crypto", definition: "Fear, Uncertainty, Doubt — распространение негатива для манипуляции рынком" }
];

// Generate slides for different difficulty levels
function generateSlides(term: string, definition: string, difficulty: 'easy' | 'medium' | 'hard') {
  const slides = [];
  
  if (difficulty === 'easy') {
    slides.push({
      type: 'info',
      content: `**${term}**\n\n${definition}`
    });
    slides.push({
      type: 'quiz',
      question: `Что такое ${term}?`,
      options: [definition, 'Это не относится к криптовалютам', 'Неизвестный термин', 'Устаревшее понятие'],
      correctAnswer: 0
    });
  } else if (difficulty === 'medium') {
    slides.push({
      type: 'info',
      content: `**${term}** — важный термин в мире криптовалют и финансов.\n\n${definition}\n\nЗапомните ключевые особенности этого понятия.`
    });
    slides.push({
      type: 'fill_blank',
      content: `Дополните определение:\n\n___ — ${definition.split(' ').slice(0, 5).join(' ')}...`,
      blankWord: term.toLowerCase()
    });
    slides.push({
      type: 'quiz',
      question: `Выберите правильное утверждение о понятии "${term}":`,
      options: [
        definition,
        'Это традиционный банковский инструмент',
        'Это физический актив',
        'Это государственная валюта'
      ],
      correctAnswer: 0
    });
  } else {
    slides.push({
      type: 'info',
      content: `**${term}**\n\n${definition}\n\nЭтот термин играет ключевую роль в современной финансовой экосистеме.`
    });
    slides.push({
      type: 'fill_blank',
      content: `Вставьте пропущенный термин:\n\n___ — ${definition}`,
      blankWord: term.toLowerCase()
    });
    slides.push({
      type: 'quiz',
      question: `Какое определение наиболее точно описывает "${term}"?`,
      options: [
        definition,
        `${term} — это устаревший финансовый инструмент`,
        `${term} — это только теоретическая концепция`,
        `${term} — это синоним Bitcoin`
      ],
      correctAnswer: 0
    });
    slides.push({
      type: 'quiz',
      question: `В каком контексте чаще всего используется "${term}"?`,
      options: [
        'В криптовалютной и финансовой сфере',
        'Только в программировании',
        'Только в бухгалтерии',
        'В медицине'
      ],
      correctAnswer: 0
    });
  }
  
  return { slides };
}

// Generate minimalist flat image via Gemini
async function generateImage(term: string, geminiKey: string, supabase: any): Promise<string | null> {
  try {
    const prompt = `Minimalist flat design illustration for crypto/finance term "${term}". Simple geometric shapes, solid colors, clean lines, no text, modern fintech style, abstract representation, gradient background, icon-like composition. Ultra high resolution.`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["image", "text"],
            responseMimeType: "text/plain"
          }
        })
      }
    );
    
    if (!response.ok) {
      console.error('Gemini image generation failed:', await response.text());
      return null;
    }
    
    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `dictionary/${crypto.randomUUID()}.${extension}`;
        
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const { error: uploadError } = await supabase.storage
          .from('course-images')
          .upload(fileName, binaryData, {
            contentType: mimeType,
            upsert: true
          });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          return null;
        }
        
        const { data: urlData } = supabase.storage
          .from('course-images')
          .getPublicUrl(fileName);
        
        return urlData.publicUrl;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing words
    const { data: existingWords } = await supabase
      .from('dictionary_words')
      .select('term');
    
    const existingTerms = new Set((existingWords || []).map((w: any) => w.term.toLowerCase()));

    const wordsToInsert = [];
    
    for (const termData of TERMS) {
      if (existingTerms.has(termData.term.toLowerCase())) {
        console.log(`Skipping existing term: ${termData.term}`);
        continue;
      }
      
      console.log(`Generating content for: ${termData.term}`);
      
      // Generate image
      const imageUrl = await generateImage(termData.term, geminiKey, supabase);
      
      // Generate slides for each difficulty
      const easyContent = generateSlides(termData.term, termData.definition, 'easy');
      const mediumContent = generateSlides(termData.term, termData.definition, 'medium');
      const hardContent = generateSlides(termData.term, termData.definition, 'hard');
      
      wordsToInsert.push({
        term: termData.term,
        definition: termData.definition,
        category: termData.category,
        image_url: imageUrl,
        difficulty_easy_content: easyContent,
        difficulty_medium_content: mediumContent,
        difficulty_hard_content: hardContent
      });
    }

    if (wordsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('dictionary_words')
        .insert(wordsToInsert);
      
      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: wordsToInsert.length,
        message: `Generated ${wordsToInsert.length} new dictionary words`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
