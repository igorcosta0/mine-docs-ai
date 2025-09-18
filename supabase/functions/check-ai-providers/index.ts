import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking AI provider availability...');
    
    const providers = {
      ollama: false,
      openai: false,
      models: {
        ollama: [],
        openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-5-mini-2025-08-07', 'gpt-5-2025-08-07']
      }
    };

    // Check Ollama availability
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        providers.ollama = true;
        providers.models.ollama = ollamaData.models?.map((m: any) => m.name) || [];
        console.log('Ollama is available with models:', providers.models.ollama);
      }
    } catch (error) {
      console.log('Ollama not available:', error.message);
    }

    // Check OpenAI availability
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (openAIApiKey) {
      try {
        // Test OpenAI API with a minimal request
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (openaiResponse.ok) {
          providers.openai = true;
          console.log('OpenAI is available');
        }
      } catch (error) {
        console.log('OpenAI API test failed:', error.message);
      }
    } else {
      console.log('OpenAI API key not configured');
    }

    // Determine best provider
    let bestProvider = 'none';
    if (providers.ollama) {
      bestProvider = 'ollama';
    } else if (providers.openai) {
      bestProvider = 'openai';
    }

    const result = {
      ...providers,
      bestProvider,
      available: providers.ollama || providers.openai
    };

    console.log('Provider check result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking AI providers:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      ollama: false,
      openai: false,
      bestProvider: 'none',
      available: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});