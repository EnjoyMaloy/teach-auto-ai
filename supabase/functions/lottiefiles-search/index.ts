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
  EXTERNAL_SERVICE: 'External service temporarily unavailable.'
};

interface LottieFilesAnimation {
  id: string;
  name: string;
  jsonUrl: string;
  gifUrl?: string;
  bgColor?: string;
  createdBy?: {
    name: string;
  };
}

interface SearchResult {
  id: string;
  name: string;
  previewUrl: string;
  lottieUrl: string;
  author?: string;
}

// Input validation
function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { query, limit, cursor } = data;
  
  if (typeof query !== 'string' || query.length === 0 || query.length > 200) {
    return { valid: false, error: 'Query must be a string between 1 and 200 characters' };
  }
  
  if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 50)) {
    return { valid: false, error: 'Limit must be a number between 1 and 50' };
  }
  
  if (cursor !== undefined && typeof cursor !== 'string') {
    return { valid: false, error: 'Cursor must be a string' };
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

    const { query, limit = 12, cursor } = requestData;

    console.log('Searching LottieFiles for:', query, cursor ? `(cursor: ${cursor})` : '');

    // LottieFiles public GraphQL API with cursor pagination
    const graphqlQuery = `
      query SearchAnimations($query: String!, $limit: Int!, $after: String) {
        searchPublicAnimations(
          query: $query
          first: $limit
          after: $after
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              name
              jsonUrl
              gifUrl
              bgColor
              createdBy {
                name
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://graphql.lottiefiles.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { query, limit, after: cursor || null },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('LottieFiles API error:', data.errors);
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.EXTERNAL_SERVICE }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchResult = data.data?.searchPublicAnimations;
    const animations: SearchResult[] = searchResult?.edges?.map(
      (edge: { node: LottieFilesAnimation }) => ({
        id: edge.node.id,
        name: edge.node.name,
        previewUrl: edge.node.gifUrl || '',
        lottieUrl: edge.node.jsonUrl,
        author: edge.node.createdBy?.name || 'Unknown',
      })
    ) || [];

    console.log(`Found ${animations.length} animations, hasNext: ${searchResult?.pageInfo?.hasNextPage}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: animations,
        nextCursor: searchResult?.pageInfo?.hasNextPage ? searchResult?.pageInfo?.endCursor : null,
        hasMore: searchResult?.pageInfo?.hasNextPage || false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching LottieFiles:', error);
    return new Response(
      JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
