import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

export interface ExportMetadata {
  exportDate: string;
  exportVersion: string;
  userId: string;
  totalDocuments: number;
  totalKnowledge: number;
  totalExpertise: number;
  totalConversations: number;
  totalStructuredDocs: number;
  totalFolhaDados: number;
  totalMemorial: number;
  totalEspecificacao: number;
  topManufacturers: string[];
  topNorms: string[];
  documentTypes: string[];
}

export interface KnowledgeExport {
  metadata: ExportMetadata;
  documentKnowledge: any[];
  aiExpertise: any[];
  conversations: any[];
  lakeItems: any[];
  structuredDocuments: {
    folhaDados: any[];
    memorial: any[];
    especificacao: any[];
    documents: any[];
  };
  userProfile: any;
  analytics: {
    manufacturerFrequency: Record<string, number>;
    normFrequency: Record<string, number>;
    documentTypeDistribution: Record<string, number>;
    yearlyDistribution: Record<string, number>;
    knowledgeByType: Record<string, number>;
    expertiseByArea: Record<string, number>;
  };
}

/**
 * Calcula frequências e estatísticas agregadas
 */
function calculateAnalytics(data: {
  lakeItems: any[];
  documentKnowledge: any[];
  aiExpertise: any[];
  folhaDados: any[];
  memorial: any[];
  especificacao: any[];
  documents: any[];
}) {
  const analytics = {
    manufacturerFrequency: {} as Record<string, number>,
    normFrequency: {} as Record<string, number>,
    documentTypeDistribution: {} as Record<string, number>,
    yearlyDistribution: {} as Record<string, number>,
    knowledgeByType: {} as Record<string, number>,
    expertiseByArea: {} as Record<string, number>,
  };

  // Análise de fabricantes
  [...data.lakeItems, ...data.folhaDados].forEach(item => {
    if (item.manufacturer) {
      analytics.manufacturerFrequency[item.manufacturer] = 
        (analytics.manufacturerFrequency[item.manufacturer] || 0) + 1;
    }
  });

  // Análise de normas
  [...data.lakeItems, ...data.folhaDados, ...data.memorial, ...data.documents].forEach(item => {
    const norms = item.norms || item.normas || [];
    norms.forEach((norm: string) => {
      analytics.normFrequency[norm] = (analytics.normFrequency[norm] || 0) + 1;
    });
  });

  // Distribuição por tipo de documento
  data.lakeItems.forEach(item => {
    if (item.doc_type) {
      analytics.documentTypeDistribution[item.doc_type] = 
        (analytics.documentTypeDistribution[item.doc_type] || 0) + 1;
    }
  });

  // Distribuição por ano
  data.lakeItems.forEach(item => {
    if (item.year) {
      const year = item.year.toString();
      analytics.yearlyDistribution[year] = (analytics.yearlyDistribution[year] || 0) + 1;
    }
  });

  // Conhecimento por tipo
  data.documentKnowledge.forEach(item => {
    if (item.knowledge_type) {
      analytics.knowledgeByType[item.knowledge_type] = 
        (analytics.knowledgeByType[item.knowledge_type] || 0) + 1;
    }
  });

  // Expertise por área
  data.aiExpertise.forEach(item => {
    if (item.expertise_area) {
      analytics.expertiseByArea[item.expertise_area] = 
        (analytics.expertiseByArea[item.expertise_area] || 0) + 1;
    }
  });

  return analytics;
}

/**
 * Exporta todo o conhecimento da IA do usuário em formato JSON completo e enriquecido
 */
export async function exportKnowledgeAsJSON(): Promise<KnowledgeExport> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Buscar todos os dados do usuário em paralelo
  const [
    knowledgeResult, 
    expertiseResult, 
    conversationsResult, 
    lakeItemsResult,
    folhaDadosResult,
    memorialResult,
    especificacaoResult,
    documentsResult,
    profileResult
  ] = await Promise.all([
    supabase
      .from('document_knowledge')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('ai_data_lake_expertise')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('ai_specialist_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('lake_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('documentos_folha_dados')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('documentos_memorial')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('documentos_especificacao')
      .select('*')
      .eq('uploader', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('documents')
      .select('*')
      .eq('uploader', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
  ]);

  const documentKnowledge = knowledgeResult.data || [];
  const aiExpertise = expertiseResult.data || [];
  const conversations = conversationsResult.data || [];
  const lakeItems = lakeItemsResult.data || [];
  const folhaDados = folhaDadosResult.data || [];
  const memorial = memorialResult.data || [];
  const especificacao = especificacaoResult.data || [];
  const documents = documentsResult.data || [];
  const userProfile = profileResult.data || null;

  // Calcular analytics
  const analytics = calculateAnalytics({
    lakeItems,
    documentKnowledge,
    aiExpertise,
    folhaDados,
    memorial,
    especificacao,
    documents
  });

  // Top manufacturers e normas
  const topManufacturers = Object.entries(analytics.manufacturerFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name]) => name);

  const topNorms = Object.entries(analytics.normFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name]) => name);

  const documentTypes = [...new Set(lakeItems.map(item => item.doc_type).filter(Boolean))];

  const metadata: ExportMetadata = {
    exportDate: new Date().toISOString(),
    exportVersion: '2.0',
    userId: user.id,
    totalDocuments: lakeItems.length,
    totalKnowledge: documentKnowledge.length,
    totalExpertise: aiExpertise.length,
    totalConversations: conversations.length,
    totalStructuredDocs: folhaDados.length + memorial.length + especificacao.length + documents.length,
    totalFolhaDados: folhaDados.length,
    totalMemorial: memorial.length,
    totalEspecificacao: especificacao.length,
    topManufacturers,
    topNorms,
    documentTypes
  };

  return {
    metadata,
    documentKnowledge,
    aiExpertise,
    conversations,
    lakeItems,
    structuredDocuments: {
      folhaDados,
      memorial,
      especificacao,
      documents
    },
    userProfile,
    analytics
  };
}

/**
 * Exporta o conhecimento em um arquivo JSON único
 */
export async function downloadKnowledgeJSON(): Promise<void> {
  const exportData = await exportKnowledgeAsJSON();
  
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-knowledge-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta o conhecimento em um ZIP com múltiplos arquivos JSON
 */
export async function downloadKnowledgeZIP(): Promise<void> {
  const exportData = await exportKnowledgeAsJSON();
  
  const zip = new JSZip();
  
  // Adicionar cada categoria em um arquivo separado
  zip.file('metadata.json', JSON.stringify(exportData.metadata, null, 2));
  zip.file('document_knowledge.json', JSON.stringify(exportData.documentKnowledge, null, 2));
  zip.file('ai_expertise.json', JSON.stringify(exportData.aiExpertise, null, 2));
  zip.file('conversations.json', JSON.stringify(exportData.conversations, null, 2));
  zip.file('lake_items.json', JSON.stringify(exportData.lakeItems, null, 2));
  zip.file('user_profile.json', JSON.stringify(exportData.userProfile, null, 2));
  zip.file('analytics.json', JSON.stringify(exportData.analytics, null, 2));
  
  // Documentos estruturados
  zip.file('structured_docs/folha_dados.json', JSON.stringify(exportData.structuredDocuments.folhaDados, null, 2));
  zip.file('structured_docs/memorial.json', JSON.stringify(exportData.structuredDocuments.memorial, null, 2));
  zip.file('structured_docs/especificacao.json', JSON.stringify(exportData.structuredDocuments.especificacao, null, 2));
  zip.file('structured_docs/documents.json', JSON.stringify(exportData.structuredDocuments.documents, null, 2));
  
  // Adicionar um README explicativo
  const readme = `# Exportação Completa do Conhecimento da IA - Data Lake

## Estrutura da Exportação

Esta exportação contém **TODO** o conhecimento e dados do seu Data Lake, incluindo documentos estruturados, análises agregadas e perfil do usuário.

### Arquivos Principais:

1. **metadata.json**: Metadados completos da exportação com estatísticas agregadas
2. **document_knowledge.json**: Conhecimento técnico extraído pela IA
3. **ai_expertise.json**: Áreas de expertise desenvolvidas pela IA
4. **conversations.json**: Histórico completo de consultas ao especialista
5. **lake_items.json**: Metadados de todos os documentos do Data Lake
6. **user_profile.json**: Perfil do usuário, preferências e configurações
7. **analytics.json**: Análises agregadas e estatísticas

### Documentos Estruturados (/structured_docs):

8. **folha_dados.json**: Folhas de dados técnicas (${exportData.metadata.totalFolhaDados} documentos)
9. **memorial.json**: Memoriais descritivos (${exportData.metadata.totalMemorial} documentos)
10. **especificacao.json**: Especificações técnicas (${exportData.metadata.totalEspecificacao} documentos)
11. **documents.json**: Documentos gerais estruturados

### Data da Exportação: ${exportData.metadata.exportDate}
### Versão: ${exportData.metadata.exportVersion}

### Estatísticas Gerais:
- **Total de Documentos no Data Lake**: ${exportData.metadata.totalDocuments}
- **Total de Documentos Estruturados**: ${exportData.metadata.totalStructuredDocs}
- **Total de Conhecimento Extraído**: ${exportData.metadata.totalKnowledge}
- **Total de Áreas de Expertise**: ${exportData.metadata.totalExpertise}
- **Total de Conversas**: ${exportData.metadata.totalConversations}

### Análises Agregadas:

#### Top 10 Fabricantes:
${exportData.metadata.topManufacturers.map((m, i) => `${i + 1}. ${m}`).join('\n')}

#### Top 10 Normas Técnicas:
${exportData.metadata.topNorms.map((n, i) => `${i + 1}. ${n}`).join('\n')}

#### Tipos de Documentos:
${exportData.metadata.documentTypes.join(', ')}

### Detalhamento das Análises (analytics.json):

O arquivo analytics.json contém:
- **manufacturerFrequency**: Frequência de cada fabricante nos documentos
- **normFrequency**: Frequência de cada norma técnica
- **documentTypeDistribution**: Distribuição por tipo de documento
- **yearlyDistribution**: Distribuição temporal dos documentos
- **knowledgeByType**: Conhecimento categorizado por tipo
- **expertiseByArea**: Expertise por área técnica

### Formato dos Dados:

Todos os arquivos estão em formato JSON válido e podem ser:
- Importados para outros sistemas de IA (ChatGPT, Claude, Gemini, etc.)
- Processados por scripts Python/JavaScript/R
- Analisados manualmente ou com ferramentas de BI
- Re-importados para este ou outros sistemas
- Usados para treinar modelos personalizados

### Preservação Completa de Dados:

Esta exportação preserva **100% dos dados**, incluindo:
- ✅ Conteúdo completo do conhecimento técnico
- ✅ Todos os metadados (datas, IDs, scores de confiança)
- ✅ Estrutura hierárquica completa
- ✅ Relacionamentos entre documentos
- ✅ Tags, palavras-chave e classificações
- ✅ Documentos estruturados (folhas de dados, memoriais, etc.)
- ✅ Perfil e preferências do usuário
- ✅ Análises e estatísticas agregadas
- ✅ Histórico completo de conversas

### Uso Recomendado:

1. **Backup**: Guarde esta exportação como backup completo
2. **Migração**: Use para migrar para outros sistemas de IA
3. **Análise**: Processe os dados com ferramentas externas
4. **Compartilhamento**: Compartilhe conhecimento com equipes
5. **Auditoria**: Revise todo o conhecimento extraído
`;

  zip.file('README.md', readme);
  
  // Gerar o ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-knowledge-complete-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
