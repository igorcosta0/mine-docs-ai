import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentType, formData, useKnowledge = true } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Autorização necessária");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Buscar conhecimento do usuário se solicitado
    let contextKnowledge = "";
    if (useKnowledge) {
      const { data: knowledge } = await supabase
        .from('document_knowledge')
        .select('title, content, keywords')
        .eq('user_id', user.id)
        .eq('document_type', documentType)
        .order('confidence_score', { ascending: false })
        .limit(5);

      if (knowledge && knowledge.length > 0) {
        contextKnowledge = knowledge.map(k => 
          `${k.title}:\n${k.content}\n---`
        ).join('\n\n');
      }
    }

    // Buscar documentos similares
    const { data: similarDocs } = await supabase
      .from('lake_items')
      .select('title, description')
      .eq('user_id', user.id)
      .eq('doc_type', documentType)
      .order('created_at', { ascending: false })
      .limit(3);

    let similarContext = "";
    if (similarDocs && similarDocs.length > 0) {
      similarContext = similarDocs.map(d => 
        `- ${d.title}: ${d.description || 'Sem descrição'}`
      ).join('\n');
    }

    // Construir prompt melhorado
    const documentLabels: Record<string, string> = {
      'especificacao': 'Especificação Técnica',
      'folha-dados': 'Folha de Dados',
      'memorial': 'Memorial Descritivo'
    };

    const prompt = `Você é um especialista em engenharia de projetos industriais (mineração).

Gere um documento completo de ${documentLabels[documentType]} em português técnico profissional.

DADOS DO DOCUMENTO:
${Object.entries(formData).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

${contextKnowledge ? `CONHECIMENTO TÉCNICO APLICÁVEL:\n${contextKnowledge}\n` : ''}

${similarContext ? `DOCUMENTOS SIMILARES (referência):\n${similarContext}\n` : ''}

INSTRUÇÕES:
1. Estruture com seções claras, hierarquia de títulos e listas numeradas
2. Inclua tabelas quando apropriado para dados técnicos
3. ${documentType === 'especificacao' ? 'Inclua: requisitos técnicos, critérios de aceitação, inspeção e testes, instalação, operação e manutenção' : ''}
4. ${documentType === 'folha-dados' ? 'Estruture campos chave em tabelas. Inclua especificações técnicas detalhadas' : ''}
5. ${documentType === 'memorial' ? 'Inclua: contexto, objetivos, metodologias, justificativas técnicas, escopo detalhado, e cronograma resumido' : ''}
6. Use terminologia técnica adequada e seja específico com os dados fornecidos
7. NÃO invente dados que não foram fornecidos
8. Mantenha coerência com normas citadas

Gere o documento completo agora:`;

    // Chamar Ollama local ou usar API OpenAI como fallback
    let content = "";
    const ollamaUrl = "http://host.docker.internal:11434/api/generate";
    
    try {
      const ollamaResponse = await fetch(ollamaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3:8b",
          prompt: prompt,
          stream: false,
        }),
      });

      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        content = ollamaData.response;
      }
    } catch (ollamaError) {
      console.log("Ollama não disponível, usando OpenAI...");
    }

    // Fallback para OpenAI se Ollama falhar
    if (!content) {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiKey) {
        throw new Error("Nenhuma API de IA disponível");
      }

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Você é um especialista em engenharia industrial." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      const openaiData = await openaiResponse.json();
      content = openaiData.choices[0].message.content;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        content,
        usedKnowledge: useKnowledge && contextKnowledge.length > 0,
        similarDocsCount: similarDocs?.length || 0
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
