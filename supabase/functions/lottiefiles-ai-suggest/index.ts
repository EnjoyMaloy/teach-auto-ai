import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standard error messages
const ERROR_MESSAGES = {
  INTERNAL_ERROR: 'Unable to process request. Please try again.',
  INVALID_INPUT: 'Invalid request data.',
  AUTH_REQUIRED: 'Authentication required.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  EXTERNAL_SERVICE: 'AI service temporarily unavailable.',
  CONFIG_ERROR: 'Service configuration error.'
};

// Input validation
function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { context } = data;
  
  if (typeof context !== 'string' || context.length === 0 || context.length > 5000) {
    return { valid: false, error: 'Context must be a string between 1 and 5000 characters' };
  }
  
  return { valid: true };
}

// Helper function to verify user authentication
async function verifyAuth(req: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.AUTH_REQUIRED }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    return {
      user: null,
      error: new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.AUTH_REQUIRED }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  return { user, error: null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return authError;
  }

  try {
    // Parse and validate input
    let requestData;
    try {
      requestData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateInput(requestData);
    if (!validation.valid) {
      console.error("Input validation failed:", validation.error);
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { context } = requestData;

    console.log('AI suggesting animation for context:', context.slice(0, 100));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.CONFIG_ERROR }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are an expert at finding perfect Lottie animations for educational content.
Given the context of a slide or lesson content, suggest ONE English search keyword (1-2 words max) 
that would find the most relevant and visually appealing animation on LottieFiles.

Focus on:
- Abstract concepts that can be illustrated (success, growth, loading, celebration)
- Common icons and symbols (rocket, checkmark, star, brain)
- Actions and states (thinking, working, presenting)

ONLY respond with the keyword, nothing else. Just the word(s).
Examples: "rocket", "success", "brain thinking", "celebration", "data chart"`
          },
          {
            role: 'user',
            content: `Find a Lottie animation keyword for this educational content:\n\n${context.slice(0, 500)}`
          }
        ],
        max_tokens: 20,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error('AI API error:', status);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: ERROR_MESSAGES.RATE_LIMIT }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.EXTERNAL_SERVICE }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const keyword = data.choices?.[0]?.message?.content?.trim()?.toLowerCase() || '';

    console.log('AI suggested keyword:', keyword);

    if (!keyword) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, keyword }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in AI suggest:', error);
    return new Response(
      JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
