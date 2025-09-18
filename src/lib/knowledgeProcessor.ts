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
  documentContent: string
): Promise<ExtractedKnowledge[]> {
  const prompt = `Você é um especialista em análise de documentos técnicos industriais. Analise o seguinte documento e extraia conhecimento estruturado:

DOCUMENTO:
Título: ${document.title}
Tipo: ${document.doc_type || 'Não especificado'}
Descrição: ${document.description || 'Não informada'}
Equipamento: ${document.equipment_model || 'Não informado'}
Fabricante: ${document.manufacturer || 'Não informado'}
Normas: ${document.norm_source || 'Não informadas'}

CONTEÚDO:
${documentContent.substring(0, 4000)} ${documentContent.length > 4000 ? '...' : ''}

INSTRUÇÕES:
Extraia diferentes tipos de conhecimento deste documento. Para cada item de conhecimento encontrado, forneça no formato EXATO:

CONHECIMENTO_START
TIPO: [concept/procedure/standard/specification/example]
TÍTULO: [título descritivo do conhecimento]
CONTEÚDO: [explicação detalhada do conhecimento extraído]
PALAVRAS_CHAVE: [palavra1,palavra2,palavra3]
CONFIANÇA: [0.1 a 1.0]
ÁREA_TÉCNICA: [mechanical/electrical/civil/chemical/industrial/software]
CONHECIMENTO_END

Foque em extrair:
- Conceitos técnicos importantes
- Procedimentos operacionais
- Especificações técnicas
- Referências a normas
- Exemplos práticos
- Parâmetros de equipamentos
- Critérios de qualidade

Extraia entre 3-8 itens de conhecimento relevantes.`;

  try {
    const response = await generateWithOllama('llama3', prompt);
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

    let query = supabase
      .from('document_knowledge')
      .select('*')
      .eq('user_id', user.user.id)
      .order('confidence_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (documentType) {
      query = query.ilike('title', `%${documentType}%`);
    }

    if (technicalArea) {
      query = query.eq('technical_area', technicalArea);
    }

    if (keywords && keywords.length > 0) {
      query = query.overlaps('keywords', keywords);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar conhecimento:', error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      knowledge_type: item.knowledge_type as KnowledgeType
    }));
  } catch (error) {
    console.error('Erro ao buscar conhecimento do usuário:', error);
    return [];
  }
}