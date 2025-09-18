import React from 'react';
import { DocumentProcessor, DocumentUtils } from '@/lib/documentProcessor';
import { DocumentRecord } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Info, FileText, Clock, Users } from 'lucide-react';

interface DocumentAnalyzerProps {
  document: DocumentRecord;
}

export const DocumentAnalyzer: React.FC<DocumentAnalyzerProps> = ({ document }) => {
  const processor = new DocumentProcessor(document);
  const validation = processor.validate();
  const metadata = processor.extractMetadata();
  const quality = DocumentUtils.analyzeContentQuality(document.conteudo || '');

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Precisa Melhorar';
  };

  return (
    <div className="space-y-6">
      {/* Status de Validação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Status de Validação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validation.isValid ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Documento válido e pronto para uso.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Problemas encontrados:</strong>
                <ul className="list-disc list-inside mt-2">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Análise de Qualidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Análise de Qualidade
          </CardTitle>
          <CardDescription>
            Avaliação da qualidade e completude do conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pontuação Geral</span>
            <Badge variant="secondary" className={getQualityColor(quality.score)}>
              {quality.score}% - {getQualityLabel(quality.score)}
            </Badge>
          </div>
          
          <Progress value={quality.score} className="w-full" />
          
          {quality.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Sugestões de Melhoria
              </h4>
              <ul className="space-y-1">
                {quality.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informações do Documento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Palavras
              </div>
              <div className="text-2xl font-bold">{metadata.wordCount.toLocaleString()}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Páginas
              </div>
              <div className="text-2xl font-bold">{metadata.pageCount}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Criado
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(metadata.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Atualizado
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(metadata.updatedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tipo de Documento</span>
              <Badge variant="outline">{metadata.type}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};