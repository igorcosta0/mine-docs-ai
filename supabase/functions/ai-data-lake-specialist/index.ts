import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, data } = await req.json();
    console.log(`AI Data Lake Specialist - Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'analyze_data_lake':
        return await analyzeDataLake(supabase, user.id);
      
      case 'generate_expertise':
        return await generateExpertise(supabase, user.id, data);
      
      case 'consult_specialist':
        return await consultSpecialist(supabase, user.id, data);
      
      case 'get_specialized_context':
        return await getSpecializedContext(supabase, user.id, data);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in ai-data-lake-specialist:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Verifique se você tem documentos no Data Lake e se a chave OpenAI está configurada' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeDataLake(supabase: any, userId: string) {
  console.log('Analyzing Data Lake for user:', userId);
  
  // Buscar todos os documentos do Data Lake do usuário
  const { data: lakeItems, error: lakeError } = await supabase
    .from('lake_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (lakeError) throw lakeError;

  // Buscar conhecimento existente
  const { data: knowledge, error: knowledgeError } = await supabase
    .from('document_knowledge')
    .select('*')
    .eq('user_id', userId)
    .order('confidence_score', { ascending: false });

  if (knowledgeError) throw knowledgeError;

  // Análise com IA especializada
  const prompt = `Você é um ESPECIALISTA EM ANÁLISE DE DATA LAKE TÉCNICO.

DADOS DO DATA LAKE:
- ${lakeItems.length} documentos totais
- Tipos de documentos: ${[...new Set(lakeItems.map(i => i.doc_type).filter(Boolean))].join(', ')}
- Fabricantes identificados: ${[...new Set(lakeItems.map(i => i.manufacturer).filter(Boolean))].join(', ')}
- Equipamentos: ${[...new Set(lakeItems.map(i => i.equipment_model).filter(Boolean))].join(', ')}

CONHECIMENTO EXTRAÍDO:
- ${knowledge.length} itens de conhecimento processados
- Áreas técnicas cobertas: ${[...new Set(knowledge.map(k => k.technical_area).filter(Boolean))].join(', ')}
- Níveis de confiança: Alta (${knowledge.filter(k => k.confidence_score >= 0.9).length}), Média (${knowledge.filter(k => k.confidence_score >= 0.7 && k.confidence_score < 0.9).length}), Baixa (${knowledge.filter(k => k.confidence_score < 0.7).length})

ANÁLISE ESPECIALIZADA REQUERIDA:

1. MAPEAMENTO DE EXPERTISE: Identifique as ÁREAS DE ESPECIALIZAÇÃO mais fortes do Data Lake
2. GAPS DE CONHECIMENTO: Identifique lacunas e áreas que precisam de mais documentação
3. QUALIDADE DO CONHECIMENTO: Avalie a profundidade técnica disponível
4. RECOMENDAÇÕES ESTRATÉGICAS: Como melhorar o Data Lake para assistência de IA mais eficaz

FORMATO DE RESPOSTA (JSON):
{
  "expertise_areas": [
    {
      "area": "nome_da_area",
      "strength": "alta/media/baixa",
      "document_count": numero,
      "knowledge_quality": "excelente/boa/regular/fraca",
      "key_topics": ["topico1", "topico2"],
      "confidence_level": 0.0-1.0
    }
  ],
  "knowledge_gaps": [
    {
      "area": "area_carente",
      "severity": "critica/alta/media/baixa",
      "recommendation": "acao_sugerida"
    }
  ],
  "overall_assessment": {
    "readiness_score": 0.0-1.0,
    "strengths": ["ponto_forte1", "ponto_forte2"],
    "weaknesses": ["fraqueza1", "fraqueza2"],
    "strategic_recommendations": ["recomendacao1", "recomendacao2"]
  }
}

Análise TÉCNICA e ESPECÍFICA baseada nos dados reais fornecidos:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  const aiResponse = await response.json();
  const analysis = aiResponse.choices[0].message.content;

  console.log('Data Lake Analysis completed');

  return new Response(JSON.stringify({
    analysis,
    data_lake_stats: {
      total_documents: lakeItems.length,
      knowledge_items: knowledge.length,
      document_types: [...new Set(lakeItems.map(i => i.doc_type).filter(Boolean))],
      manufacturers: [...new Set(lakeItems.map(i => i.manufacturer).filter(Boolean))],
      technical_areas: [...new Set(knowledge.map(k => k.technical_area).filter(Boolean))]
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateExpertise(supabase: any, userId: string, data: any) {
  console.log('Generating specialized expertise for user:', userId);
  
  const { expertise_area, documents_focus } = data;

  // Buscar documentos relevantes para a área de expertise
  let query = supabase
    .from('lake_items')
    .select('*')
    .eq('user_id', userId);

  if (documents_focus && documents_focus.length > 0) {
    query = query.in('id', documents_focus);
  }

  const { data: relevantDocs, error: docsError } = await query;
  if (docsError) throw docsError;

  // Buscar conhecimento relacionado
  const { data: relatedKnowledge, error: knowledgeError } = await supabase
    .from('document_knowledge')
    .select('*')
    .eq('user_id', userId)
    .ilike('technical_area', `%${expertise_area}%`)
    .order('confidence_score', { ascending: false })
    .limit(50);

  if (knowledgeError) throw knowledgeError;

  const prompt = `Você é um ESPECIALISTA SÊNIOR em ${expertise_area.toUpperCase()}.

MISSÃO: Criar uma ESPECIALIZAÇÃO DE IA AVANÇADA baseada nos documentos específicos do Data Lake.

DOCUMENTOS ANALISADOS (${relevantDocs.length} itens):
${relevantDocs.slice(0, 10).map(doc => 
  `- ${doc.title} (${doc.doc_type || 'Não especificado'}) - ${doc.manufacturer || 'N/A'} ${doc.equipment_model || ''}`
).join('\n')}

CONHECIMENTO TÉCNICO EXTRAÍDO (${relatedKnowledge.length} itens):
${relatedKnowledge.slice(0, 15).map(k => 
  `- ${k.title}: ${k.content.substring(0, 150)}... (Confiança: ${k.confidence_score})`
).join('\n')}

ESPECIALIZAÇÃO REQUERIDA:

1. CONSOLIDAÇÃO DO CONHECIMENTO: Sintetize os padrões técnicos mais importantes
2. CRIAÇÃO DE EXPERTISE: Desenvolva conhecimento especializado reutilizável
3. IDENTIFICAÇÃO DE PADRÕES: Encontre padrões repetíveis e aplicáveis
4. GERAÇÃO DE INSIGHTS: Crie insights técnicos únicos para esta área

FORMATO DE RESPOSTA ESPECIALIZADA (JSON):
{
  "expertise_summary": "resumo_detalhado_da_especialização_criada",
  "key_insights": [
    {
      "insight": "insight_técnico_específico",
      "supporting_evidence": "evidência_dos_documentos",
      "confidence": 0.0-1.0,
      "applicability": "onde_pode_ser_aplicado"
    }
  ],
  "technical_patterns": [
    {
      "pattern": "padrão_identificado",
      "frequency": "comum/raro/único",
      "technical_details": "detalhes_técnicos_específicos",
      "use_cases": ["caso1", "caso2"]
    }
  ],
  "specialized_knowledge": {
    "area_strength": 0.0-1.0,
    "coverage_topics": ["tópico1", "tópico2"],
    "expert_recommendations": ["recomendação1", "recomendação2"],
    "knowledge_gaps": ["gap1", "gap2"]
  }
}

Gere uma especialização TÉCNICA e PROFUNDA na área de ${expertise_area}:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2500,
    }),
  });

  const aiResponse = await response.json();
  const expertiseData = aiResponse.choices[0].message.content;

  // Salvar expertise no banco
  const { data: savedExpertise, error: saveError } = await supabase
    .from('ai_data_lake_expertise')
    .insert({
      user_id: userId,
      expertise_area,
      knowledge_summary: expertiseData,
      document_count: relevantDocs.length,
      confidence_level: relatedKnowledge.length > 10 ? 0.85 : 0.65,
      keywords: [
        ...new Set([
          expertise_area,
          ...relevantDocs.map(d => d.doc_type).filter(Boolean),
          ...relevantDocs.map(d => d.manufacturer).filter(Boolean),
          ...relatedKnowledge.flatMap(k => k.keywords).filter(Boolean)
        ])
      ].slice(0, 20)
    })
    .select()
    .single();

  if (saveError) throw saveError;

  console.log('Expertise generated and saved:', savedExpertise.id);

  return new Response(JSON.stringify({
    expertise: savedExpertise,
    analysis: expertiseData,
    source_documents: relevantDocs.length,
    knowledge_items: relatedKnowledge.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function consultSpecialist(supabase: any, userId: string, data: any) {
  console.log('Consulting AI specialist for user:', userId);
  
  const { question, context, document_type } = data;

  // Buscar expertise relevante
  let expertiseQuery = supabase
    .from('ai_data_lake_expertise')
    .select('*')
    .eq('user_id', userId)
    .order('confidence_level', { ascending: false });

  if (context?.technical_area) {
    expertiseQuery = expertiseQuery.ilike('expertise_area', `%${context.technical_area}%`);
  }

  const { data: expertise, error: expertiseError } = await expertiseQuery.limit(3);
  if (expertiseError) throw expertiseError;

  // Buscar conhecimento específico baseado na pergunta
  const questionKeywords = question.toLowerCase().split(' ')
    .filter(word => word.length > 3)
    .slice(0, 5);

  const { data: relevantKnowledge, error: knowledgeError } = await supabase
    .from('document_knowledge')
    .select('*')
    .eq('user_id', userId)
    .or(questionKeywords.map(word => `title.ilike.%${word}%,content.ilike.%${word}%`).join(','))
    .order('confidence_score', { ascending: false })
    .limit(10);

  if (knowledgeError) throw knowledgeError;

  const prompt = `Você é um CONSULTOR IA ESPECIALISTA em Data Lake Técnico.

PERGUNTA DO USUÁRIO: "${question}"

EXPERTISE DISPONÍVEL (${expertise.length} especializações):
${expertise.map(exp => 
  `ÁREA: ${exp.expertise_area} (Confiança: ${exp.confidence_level})
   RESUMO: ${exp.knowledge_summary.substring(0, 500)}...
   DOCUMENTOS: ${exp.document_count} processados
   `
).join('\n---\n')}

CONHECIMENTO ESPECÍFICO APLICÁVEL (${relevantKnowledge.length} itens):
${relevantKnowledge.map(k => 
  `- ${k.title} (${k.technical_area || 'Geral'}): ${k.content.substring(0, 200)}... [Confiança: ${k.confidence_score}]`
).join('\n')}

CONTEXTO ADICIONAL:
${context ? JSON.stringify(context, null, 2) : 'Nenhum contexto adicional fornecido'}

INSTRUÇÕES PARA CONSULTA ESPECIALIZADA:

1. ANÁLISE ESPECIALIZADA: Use a expertise específica do Data Lake do usuário
2. RESPOSTA TÉCNICA: Seja específico e técnico baseado no conhecimento disponível
3. REFERÊNCIAS: Cite especificamente os documentos/conhecimento que está usando
4. LIMITAÇÕES: Seja honesto sobre limitações do conhecimento disponível
5. RECOMENDAÇÕES: Sugira ações específicas baseadas na expertise

FORMATO DE RESPOSTA:
{
  "specialist_response": "resposta_detalhada_e_técnica",
  "confidence_level": 0.0-1.0,
  "knowledge_sources": [
    {
      "source": "nome_do_documento_ou_conhecimento",
      "relevance": "alta/media/baixa",
      "technical_area": "área_técnica"
    }
  ],
  "recommendations": [
    {
      "action": "ação_recomendada",
      "priority": "alta/media/baixa",
      "rationale": "justificativa_técnica"
    }
  ],
  "limitations": "limitações_da_resposta_baseada_no_conhecimento_disponível"
}

Forneça uma consulta especializada TÉCNICA e PRECISA:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  const aiResponse = await response.json();
  const consultation = aiResponse.choices[0].message.content;

  // Salvar conversa
  const { data: savedConversation, error: saveError } = await supabase
    .from('ai_specialist_conversations')
    .insert({
      user_id: userId,
      conversation_type: 'expertise_consultation',
      context_data: { question, context, document_type },
      messages: [
        { role: 'user', content: question, timestamp: new Date().toISOString() },
        { role: 'specialist', content: consultation, timestamp: new Date().toISOString() }
      ],
      specialist_insights: {
        expertise_used: expertise.length,
        knowledge_items_referenced: relevantKnowledge.length,
        technical_areas_covered: [...new Set(expertise.map(e => e.expertise_area))]
      }
    })
    .select()
    .single();

  if (saveError) throw saveError;

  console.log('Specialist consultation completed:', savedConversation.id);

  return new Response(JSON.stringify({
    consultation,
    conversation_id: savedConversation.id,
    expertise_used: expertise.length,
    knowledge_referenced: relevantKnowledge.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getSpecializedContext(supabase: any, userId: string, data: any) {
  console.log('Getting specialized context for user:', userId);
  
  const { document_type, technical_area, keywords } = data;

  // Buscar expertise relevante
  let expertiseQuery = supabase
    .from('ai_data_lake_expertise')
    .select('*')
    .eq('user_id', userId);

  if (technical_area) {
    expertiseQuery = expertiseQuery.ilike('expertise_area', `%${technical_area}%`);
  }

  const { data: expertise, error: expertiseError } = await expertiseQuery
    .order('confidence_level', { ascending: false })
    .limit(5);

  if (expertiseError) throw expertiseError;

  // Buscar conhecimento por palavras-chave
  let knowledgeQuery = supabase
    .from('document_knowledge')
    .select('*')
    .eq('user_id', userId);

  if (keywords && keywords.length > 0) {
    knowledgeQuery = knowledgeQuery.overlaps('keywords', keywords);
  }

  if (document_type) {
    knowledgeQuery = knowledgeQuery.ilike('document_type', `%${document_type}%`);
  }

  const { data: specializedKnowledge, error: knowledgeError } = await knowledgeQuery
    .order('confidence_score', { ascending: false })
    .limit(20);

  if (knowledgeError) throw knowledgeError;

  return new Response(JSON.stringify({
    specialized_context: {
      expertise_areas: expertise,
      relevant_knowledge: specializedKnowledge,
      context_strength: expertise.length > 0 ? 'high' : specializedKnowledge.length > 5 ? 'medium' : 'low',
      recommendations: {
        use_expertise: expertise.length > 0,
        knowledge_confidence: specializedKnowledge.length > 0 ? 
          specializedKnowledge.reduce((acc, k) => acc + k.confidence_score, 0) / specializedKnowledge.length : 0,
        suggested_approach: expertise.length > 0 ? 'specialist_consultation' : 'general_knowledge'
      }
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}