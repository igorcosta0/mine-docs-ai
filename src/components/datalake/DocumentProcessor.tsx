import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  processDocumentWithOllama, 
  saveKnowledgeToDatabase, 
  getDocumentContent,
  ExtractedKnowledge 
} from '@/lib/knowledgeProcessor';
import { LakeItem } from '@/lib/datalake';
import { Brain, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface DocumentProcessorProps {
  documents: LakeItem[];
  onProcessComplete?: () => void;
}

export const DocumentProcessor: React.FC<DocumentProcessorProps> = ({
  documents,
  onProcessComplete
}) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalKnowledge, setTotalKnowledge] = useState(0);
  const [currentDocument, setCurrentDocument] = useState<string>('');

  const processAllDocuments = async () => {
    if (documents.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum documento disponível para processar",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setProcessedCount(0);
    setTotalKnowledge(0);

    let totalExtracted = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      setCurrentDocument(doc.title);
      
      try {
        // Obter conteúdo do documento
        const content = await getDocumentContent(doc);
        
        // Processar com Ollama
        const extractedKnowledge = await processDocumentWithOllama(doc, content);
        
        if (extractedKnowledge.length > 0) {
          // Salvar no banco
          const result = await saveKnowledgeToDatabase(doc.id, extractedKnowledge);
          
          if (result.success) {
            totalExtracted += extractedKnowledge.length;
            setTotalKnowledge(totalExtracted);
          } else {
            console.error('Erro ao salvar conhecimento:', result.error);
          }
        }
        
        setProcessedCount(i + 1);
        
        // Pequena pausa entre documentos
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Erro ao processar documento ${doc.title}:`, error);
      }
    }

    setProcessing(false);
    setCurrentDocument('');
    
    toast({
      title: "Processamento Concluído",
      description: `${totalExtracted} itens de conhecimento extraídos de ${documents.length} documentos`,
    });

    if (onProcessComplete) {
      onProcessComplete();
    }
  };

  const progress = documents.length > 0 ? (processedCount / documents.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Processador de Conhecimento IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {documents.length} documentos disponíveis
            </div>
            <div className="text-xs text-muted-foreground">
              Extrair conhecimento usando Ollama (offline)
            </div>
          </div>
          
          <Button 
            onClick={processAllDocuments}
            disabled={processing || documents.length === 0}
            className="flex items-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Processar Todos
              </>
            )}
          </Button>
        </div>

        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso</span>
              <span>{processedCount}/{documents.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {currentDocument && (
              <div className="text-xs text-muted-foreground">
                Processando: {currentDocument}
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {processedCount} processados
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                {totalKnowledge} conhecimentos extraídos
              </Badge>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>O processamento extrai conceitos, procedimentos, especificações e exemplos</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>O conhecimento extraído é usado para melhorar sugestões na criação de documentos</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Processamento offline usando Ollama local (nenhum dado é enviado para a internet)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};