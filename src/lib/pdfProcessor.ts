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
  const prompt = `Analise este documento PDF técnico industrial e extraia as seguintes informações em formato JSON:

Arquivo: ${filename}
Conteúdo: ${extractedText}

Extraia e retorne APENAS um JSON válido com:
{
  "title": "título do documento",
  "docType": "tipo (especificacao, folha-dados, memorial, manual, desenho, etc)",
  "equipmentModel": "modelo do equipamento se mencionado",
  "manufacturer": "fabricante se mencionado", 
  "year": ano se mencionado (número),
  "normSource": "normas técnicas mencionadas",
  "description": "descrição breve do documento",
  "serialNumber": "número de série se mencionado",
  "plantUnit": "unidade/planta se mencionada",
  "systemArea": "área/sistema se mencionado",
  "revisionVersion": "versão/revisão se mencionada",
  "tags": ["palavras-chave", "relevantes", "do", "documento"]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`;

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