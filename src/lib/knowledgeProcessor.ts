import { generateWithOllama } from '@/lib/ollama';
import { supabase } from '@/integrations/supabase/client';
import { LakeItem } from '@/lib/datalake';

export type KnowledgeType = 'concept' | 'procedure' | 'standard' | 'specification' | 'example';

export interface DocumentKnowledge {
  id: string;
  user_id: string;
  source_document_id: string;
  knowledge_type: KnowledgeType;
  title: string;
  content: string;
  keywords: string[];
  confidence_score: number;
  document_type?: string;
  technical_area?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractedKnowledge {
  type: KnowledgeType;
  title: string;
  content: string;
  keywords: string[];
  confidence: number;
  technicalArea: string;
}

export async function processDocumentWithOllama(
  document: LakeItem, 
  documentContent: string,
  model: string = 'llama3'
): Promise<ExtractedKnowledge[]> {
  const prompt = `Você é um especialista em extração de conhecimento técnico avançado. Extraia conhecimento ESPECÍFICO e REUTILIZÁVEL:

DOCUMENTO FONTE:
Título: ${document.title}
Tipo: ${document.doc_type || 'Não especificado'}
Descrição: ${document.description || 'Não informada'}
Equipamento: ${document.equipment_model || 'Não informado'}
Fabricante: ${document.manufacturer || 'Não informado'}
Normas: ${document.norm_source || 'Não informadas'}

CONTEÚDO COMPLETO: ${documentContent.substring(0, 6000)}

EXTRAIA conhecimento TÉCNICO ESPECÍFICO categorizando por:

1. PADRÕES_NOMENCLATURA - nomenclaturas técnicas exatas e específicas
2. ESPECIFICAÇÕES_TÉCNICAS - parâmetros, dimensões, capacidades específicas
3. NORMAS_APLICÁVEIS - normas técnicas específicas por área/equipamento
4. PROCEDIMENTOS_MÉTODO - métodos e procedimentos específicos detalhados
5. MATERIAIS_COMPONENTES - materiais/componentes específicos por aplicação
6. REQUISITOS_FUNCIONAIS - requisitos específicos e critérios de aceitação
7. DADOS_PERFORMANCE - dados de performance, eficiência, limites operacionais

DIRETRIZES CRÍTICAS:
- Extraia valores NUMÉRICOS e ESPECÍFICOS (não genéricos)
- Use TERMINOLOGIA EXATA do documento original
- Foque em conhecimento REUTILIZÁVEL em documentos similares
- Priorize informações que identificam PADRÕES repetíveis
- Para cada item, determine área técnica específica (elétrica, mecânica, civil, etc.)
- Confiança 0.95-1.0 para dados específicos extraídos diretamente
- Confiança 0.8-0.9 para interpretações técnicas baseadas no contexto

FORMATO OBRIGATÓRIO (use exatamente):

CONHECIMENTO_START
TIPO: [categoria_específica_acima]
TÍTULO: [descrição_técnica_específica_do_conhecimento]
CONTEÚDO: [conhecimento_detalhado_mínimo_150_caracteres]
PALAVRAS_CHAVE: [termo1, termo2, termo3, termo4]
CONFIANÇA: [0.8-1.0]
ÁREA_TÉCNICA: [elétrica/mecânica/civil/química/automação/etc]
CONHECIMENTO_END

Extraia entre 5 e 12 itens de conhecimento técnico específico e reutilizável.
ÁREA_TÉCNICA: [mechanical/electrical/civil/chemical/industrial/software]
CONHECIMENTO_END

Extraia 6-8 conhecimentos ESPECÍFICOS e TÉCNICOS para reutilização.`;

  try {
    const response = await generateWithOllama(model, prompt);
    return parseKnowledgeResponse(response);
  } catch (error) {
    console.error('Erro ao processar documento com Ollama:', error);
    return [];
  }
}

function parseKnowledgeResponse(response: string): ExtractedKnowledge[] {
  const knowledgeItems: ExtractedKnowledge[] = [];
  const regex = /CONHECIMENTO_START([\s\S]*?)CONHECIMENTO_END/g;
  let match;

  while ((match = regex.exec(response)) !== null) {
    const block = match[1];
    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
    
    let tipo = '';
    let titulo = '';
    let conteudo = '';
    let palavrasChave: string[] = [];
    let confianca = 0.5;
    let areaTecnica = '';

    for (const line of lines) {
      if (line.startsWith('TIPO:')) {
        tipo = line.replace('TIPO:', '').trim();
      } else if (line.startsWith('TÍTULO:')) {
        titulo = line.replace('TÍTULO:', '').trim();
      } else if (line.startsWith('CONTEÚDO:')) {
        conteudo = line.replace('CONTEÚDO:', '').trim();
      } else if (line.startsWith('PALAVRAS_CHAVE:')) {
        const keywords = line.replace('PALAVRAS_CHAVE:', '').trim();
        palavrasChave = keywords.split(',').map(k => k.trim()).filter(k => k);
      } else if (line.startsWith('CONFIANÇA:')) {
        confianca = parseFloat(line.replace('CONFIANÇA:', '').trim()) || 0.5;
      } else if (line.startsWith('ÁREA_TÉCNICA:')) {
        areaTecnica = line.replace('ÁREA_TÉCNICA:', '').trim();
      }
    }

    if (titulo && conteudo && isValidKnowledgeType(tipo)) {
      knowledgeItems.push({
        type: tipo as KnowledgeType,
        title: titulo,
        content: conteudo,
        keywords: palavrasChave,
        confidence: Math.min(1.0, Math.max(0.1, confianca)),
        technicalArea: areaTecnica
      });
    }
  }

  return knowledgeItems;
}

function isValidKnowledgeType(type: string): boolean {
  return ['concept', 'procedure', 'standard', 'specification', 'example'].includes(type);
}

export async function saveKnowledgeToDatabase(
  documentId: string,
  knowledgeItems: ExtractedKnowledge[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const knowledgeRecords = knowledgeItems.map(item => ({
      user_id: user.user.id,
      source_document_id: documentId,
      knowledge_type: item.type,
      title: item.title,
      content: item.content,
      keywords: item.keywords,
      confidence_score: item.confidence,
      technical_area: item.technicalArea,
      document_type: 'data_lake_document'
    }));

    const { error } = await supabase
      .from('document_knowledge')
      .insert(knowledgeRecords);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar conhecimento:', error);
    return { success: false, error: 'Erro interno ao salvar conhecimento' };
  }
}

export async function getDocumentContent(document: LakeItem): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('datalake')
      .download(document.file_path);

    if (error) {
      throw error;
    }

    // Try to extract text content based on file type
    const fileName = document.file_path.toLowerCase();
    
    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      return await data.text();
    } else if (fileName.endsWith('.pdf')) {
      // For PDF, we'll just return metadata for now since we don't have PDF parsing
      return `Documento PDF: ${document.title}\nDescrição: ${document.description || 'Sem descrição'}\nTipo: ${document.doc_type || 'Não especificado'}`;
    } else {
      // For other file types, return document metadata
      return `Documento: ${document.title}\nDescrição: ${document.description || 'Sem descrição'}\nTipo: ${document.doc_type || 'Não especificado'}\nEquipamento: ${document.equipment_model || 'Não informado'}\nFabricante: ${document.manufacturer || 'Não informado'}`;
    }
  } catch (error) {
    console.error('Erro ao obter conteúdo do documento:', error);
    return `Documento: ${document.title}\nDescrição: ${document.description || 'Erro ao processar conteúdo'}`;
  }
}

// Função auxiliar para calcular similaridade semântica
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / Math.max(union.length, 1);
}

// Função auxiliar para busca por sinônimos técnicos
function expandTechnicalTerms(keywords: string[]): string[] {
  const technicalSynonyms: { [key: string]: string[] } = {
    'concreto': ['betão', 'estrutural', 'armado', 'cimento'],
    'aço': ['steel', 'metalico', 'estrutura', 'ferro'],
    'elétrico': ['eletrica', 'energia', 'potencia', 'voltagem'],
    'hidráulico': ['agua', 'fluido', 'pressao', 'bomba'],
    'mecânico': ['maquina', 'equipamento', 'motor', 'acionamento'],
    'soldagem': ['solda', 'welding', 'união', 'junta'],
    'válvula': ['registro', 'controle', 'bloqueio', 'gaveta'],
    'bomba': ['recalque', 'succao', 'centrifuga', 'rotor'],
    'motor': ['acionamento', 'drive', 'rotacao', 'rpm'],
    'transformador': ['trafo', 'tensao', 'primario', 'secundario'],
    'memorial': ['descritivo', 'calculo', 'projeto', 'especificação'],
    'folha': ['dados', 'especificacao', 'datasheet', 'parametros']
  };
  
  const expanded = [...keywords];
  keywords.forEach(keyword => {
    const key = keyword.toLowerCase();
    Object.keys(technicalSynonyms).forEach(synonym => {
      if (key.includes(synonym) || synonym.includes(key)) {
        expanded.push(...technicalSynonyms[synonym]);
      }
    });
  });
  
  return [...new Set(expanded)];
}

export async function getUserKnowledge(
  documentType?: string, 
  technicalArea?: string,
  keywords?: string[]
): Promise<DocumentKnowledge[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return [];
    }

    let allResults: DocumentKnowledge[] = [];

    // Estratégia de busca multi-camadas
    if (keywords && keywords.length > 0) {
      
      // 1. Busca exata por palavras-chave (prioridade máxima)
      const exactKeywordQuery = supabase
        .from('document_knowledge')
        .select('*')
        .eq('user_id', user.user.id)
        .overlaps('keywords', keywords)
        .order('confidence_score', { ascending: false });

      const exactResult = await exactKeywordQuery;
      if (exactResult.data) {
        allResults.push(...exactResult.data.map(item => ({
          ...item,
          knowledge_type: item.knowledge_type as KnowledgeType,
          search_relevance: 1.0
        })));
      }

      // 2. Busca expandida com sinônimos técnicos
      const expandedTerms = expandTechnicalTerms(keywords);
      if (expandedTerms.length > keywords.length) {
        const synonymQuery = supabase
          .from('document_knowledge')
          .select('*')
          .eq('user_id', user.user.id)
          .overlaps('keywords', expandedTerms.slice(keywords.length))
          .order('confidence_score', { ascending: false });

        const synonymResult = await synonymQuery;
        if (synonymResult.data) {
          allResults.push(...synonymResult.data.map(item => ({
            ...item,
            knowledge_type: item.knowledge_type as KnowledgeType,
            search_relevance: 0.8
          })));
        }
      }

      // 3. Busca textual inteligente no título e conteúdo
      for (const keyword of keywords) {
        if (keyword.length > 2) {
          const textQuery = supabase
            .from('document_knowledge')
            .select('*')
            .eq('user_id', user.user.id)
            .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
            .order('confidence_score', { ascending: false })
            .limit(10);
          
          const textResult = await textQuery;
          if (textResult.data) {
            allResults.push(...textResult.data.map(item => ({
              ...item,
              knowledge_type: item.knowledge_type as KnowledgeType,
              search_relevance: calculateSimilarity(keyword, item.title + ' ' + item.content)
            })));
          }
        }
      }
    }

    // 4. Busca base por tipo de documento e área técnica
    let baseQuery = supabase
      .from('document_knowledge')
      .select('*')
      .eq('user_id', user.user.id)
      .order('confidence_score', { ascending: false })
      .order('created_at', { ascending: false });

    if (documentType) {
      baseQuery = baseQuery.or(`document_type.ilike.%${documentType}%,title.ilike.%${documentType}%`);
    }
    
    if (technicalArea) {
      baseQuery = baseQuery.eq('technical_area', technicalArea);
    }

    const baseResult = await baseQuery.limit(15);
    if (baseResult.data) {
      allResults.push(...baseResult.data.map(item => ({
        ...item,
        knowledge_type: item.knowledge_type as KnowledgeType,
        search_relevance: 0.3
      })));
    }

    // Remover duplicatas e processar resultados
    const uniqueResults = allResults.filter((item, index, array) => 
      array.findIndex(i => i.id === item.id) === index
    );

    // Ordenação inteligente por relevância e confiança
    const sortedResults = uniqueResults.sort((a, b) => {
      const relevanceA = (a as any).search_relevance || 0.3;
      const relevanceB = (b as any).search_relevance || 0.3;
      
      // Priorizar relevância de busca
      if (Math.abs(relevanceA - relevanceB) > 0.1) {
        return relevanceB - relevanceA;
      }
      
      // Depois ordenar por confiança
      return (b.confidence_score || 0) - (a.confidence_score || 0);
    });

    return sortedResults.slice(0, 25);

  } catch (error) {
    console.error('Erro ao buscar conhecimento do usuário:', error);
    return [];
  }
}