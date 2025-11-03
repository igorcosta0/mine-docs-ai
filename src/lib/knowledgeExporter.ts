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
}

export interface KnowledgeExport {
  metadata: ExportMetadata;
  documentKnowledge: any[];
  aiExpertise: any[];
  conversations: any[];
  lakeItems: any[];
}

/**
 * Exporta todo o conhecimento da IA do usuário em formato JSON
 */
export async function exportKnowledgeAsJSON(): Promise<KnowledgeExport> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Buscar todos os dados do usuário
  const [knowledgeResult, expertiseResult, conversationsResult, lakeItemsResult] = await Promise.all([
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
      .order('created_at', { ascending: false })
  ]);

  const documentKnowledge = knowledgeResult.data || [];
  const aiExpertise = expertiseResult.data || [];
  const conversations = conversationsResult.data || [];
  const lakeItems = lakeItemsResult.data || [];

  const metadata: ExportMetadata = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    userId: user.id,
    totalDocuments: lakeItems.length,
    totalKnowledge: documentKnowledge.length,
    totalExpertise: aiExpertise.length,
    totalConversations: conversations.length
  };

  return {
    metadata,
    documentKnowledge,
    aiExpertise,
    conversations,
    lakeItems
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
  
  // Adicionar um README explicativo
  const readme = `# Exportação do Conhecimento da IA - Data Lake

## Estrutura da Exportação

Este arquivo contém todo o conhecimento extraído e processado pela IA do seu Data Lake.

### Arquivos Incluídos:

1. **metadata.json**: Metadados da exportação (data, versão, estatísticas)
2. **document_knowledge.json**: Todo conhecimento técnico extraído dos documentos
3. **ai_expertise.json**: Áreas de expertise geradas pela IA
4. **conversations.json**: Histórico de consultas ao especialista
5. **lake_items.json**: Metadados dos documentos do Data Lake

### Data da Exportação: ${exportData.metadata.exportDate}

### Estatísticas:
- Total de Documentos: ${exportData.metadata.totalDocuments}
- Total de Conhecimento Extraído: ${exportData.metadata.totalKnowledge}
- Total de Áreas de Expertise: ${exportData.metadata.totalExpertise}
- Total de Conversas: ${exportData.metadata.totalConversations}

### Formato dos Dados:

Todos os arquivos estão em formato JSON válido e podem ser:
- Importados para outros sistemas de IA
- Processados por scripts Python/JavaScript
- Analisados manualmente
- Re-importados para o sistema

### Preservação de Dados:

Esta exportação preserva 100% dos dados, incluindo:
- Conteúdo completo do conhecimento
- Metadados (datas, IDs, scores de confiança)
- Estrutura hierárquica
- Relacionamentos entre documentos
- Tags e palavras-chave
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
