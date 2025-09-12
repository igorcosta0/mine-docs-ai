import { generateWithOllama } from './ollama';

export interface ExtractedMetadata {
  title: string;
  docType: string;
  equipmentModel?: string;
  manufacturer?: string;
  year?: number;
  normSource?: string;
  description?: string;
  serialNumber?: string;
  plantUnit?: string;
  systemArea?: string;
  revisionVersion?: string;
  tags: string[];
}

export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        // Para simplificar, vamos usar o nome do arquivo e deixar o Ollama processar
        // Em uma implementação real, usaríamos pdf-parse no servidor
        resolve(`Arquivo PDF: ${file.name}\nTamanho: ${file.size} bytes`);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export async function analyzeDocumentWithAI(
  filename: string,
  extractedText: string
): Promise<ExtractedMetadata> {
  const prompt = `Você é um especialista em classificação de documentos técnicos industriais. Analise este documento PDF e extraia as informações em formato JSON.

NOME DO ARQUIVO: ${filename}
CONTEÚDO: ${extractedText}

PRIORIDADE MÁXIMA - DETECÇÃO DE TIPO:
1. Se o nome do arquivo contém "MD" = "memorial-descritivo"
2. Se o nome do arquivo contém "MC" = "memoria-calculo"
3. Se o nome do arquivo contém "ET" = "especificacao-tecnica"
4. Se o conteúdo menciona "memorial descritivo" = "memorial-descritivo"
5. Se o conteúdo menciona "memória de cálculo" = "memoria-calculo"
6. Se o conteúdo menciona "especificação técnica" = "especificacao-tecnica"
7. Se tem fórmulas/cálculos matemáticos = "memoria-calculo"
8. Se tem especificações/parâmetros técnicos = "especificacao-tecnica"
9. Se tem descrição de processo/método = "memorial-descritivo"

Retorne APENAS este JSON:
{
  "title": "título limpo do documento",
  "docType": "memorial-descritivo|memoria-calculo|especificacao-tecnica|manual|desenho|norma|certificado|relatorio|outros",
  "equipmentModel": "modelo do equipamento se identificado",
  "manufacturer": "fabricante se identificado", 
  "year": ano_numerico_se_identificado,
  "normSource": "normas técnicas mencionadas",
  "description": "descrição do documento baseada no conteúdo",
  "serialNumber": "número de série se identificado",
  "plantUnit": "unidade/planta se mencionada",
  "systemArea": "área/sistema se mencionado",
  "revisionVersion": "versão/revisão se identificada",
  "tags": ["tipo_documento", "palavras-chave", "relevantes"]
}

IMPORTANTE: Seja preciso na classificação do tipo. Use as siglas MD, MC, ET como pistas principais.`;

  try {
    const response = await generateWithOllama('llama3', prompt);
    
    // Tentar extrair JSON da resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const metadata = JSON.parse(jsonMatch[0]);
      
      // Garantir que os campos obrigatórios existam
      return {
        title: metadata.title || filename.replace('.pdf', ''),
        docType: metadata.docType || 'documento',
        equipmentModel: metadata.equipmentModel || undefined,
        manufacturer: metadata.manufacturer || undefined,
        year: metadata.year ? parseInt(String(metadata.year)) : undefined,
        normSource: metadata.normSource || undefined,
        description: metadata.description || undefined,
        serialNumber: metadata.serialNumber || undefined,
        plantUnit: metadata.plantUnit || undefined,
        systemArea: metadata.systemArea || undefined,
        revisionVersion: metadata.revisionVersion || undefined,
        tags: Array.isArray(metadata.tags) ? metadata.tags : []
      };
    }
    
    // Fallback se não conseguir extrair JSON
    return {
      title: filename.replace('.pdf', ''),
      docType: 'documento',
      tags: ['documento', 'técnico']
    };
    
  } catch (error) {
    console.error('Erro ao analisar documento:', error);
    
    // Fallback em caso de erro
    return {
      title: filename.replace('.pdf', ''),
      docType: 'documento',
      description: 'Documento processado automaticamente',
      tags: ['documento', 'técnico']
    };
  }
}

export async function processDocumentAutomatically(file: File): Promise<ExtractedMetadata> {
  try {
    // Extrair texto do PDF
    const extractedText = await extractTextFromPDF(file);
    
    // Analisar com IA
    const metadata = await analyzeDocumentWithAI(file.name, extractedText);
    
    return metadata;
  } catch (error) {
    console.error('Erro no processamento automático:', error);
    
    // Retornar metadados básicos em caso de erro
    return {
      title: file.name.replace('.pdf', ''),
      docType: 'documento',
      description: 'Erro no processamento automático',
      tags: ['documento']
    };
  }
}