const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LottieFilesAnimation {
  id: string;
  name: string;
  lottieUrl: string;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 12 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching LottieFiles for:', query);

    // LottieFiles public GraphQL API
    const graphqlQuery = `
      query SearchAnimations($query: String!, $limit: Int!) {
        searchPublicAnimations(
          query: $query
          first: $limit
        ) {
          edges {
            node {
              id
              name
              lottieUrl
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
        variables: { query, limit },
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

    const animations: SearchResult[] = data.data?.searchPublicAnimations?.edges?.map(
      (edge: { node: LottieFilesAnimation }) => ({
        id: edge.node.id,
        name: edge.node.name,
        previewUrl: edge.node.gifUrl || '',
        lottieUrl: edge.node.lottieUrl,
        author: edge.node.createdBy?.name || 'Unknown',
      })
    ) || [];

    console.log(`Found ${animations.length} animations`);

    return new Response(
      JSON.stringify({ success: true, data: animations }),
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
