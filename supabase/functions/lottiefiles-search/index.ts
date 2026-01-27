import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Helper function to verify user authentication
async function verifyAuth(req: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
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
        JSON.stringify({ success: false, error: "Invalid authentication" }),
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
    const { query, limit = 12, cursor } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        JSON.stringify({ success: false, error: 'LottieFiles API error' }),
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
