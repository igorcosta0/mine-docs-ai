import React, { useState } from 'react';
import { DocumentProcessor } from '@/lib/documentProcessor';
import { DocumentRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Code, Globe } from 'lucide-react';

interface DocumentExporterProps {
  document: DocumentRecord;
}

type ExportFormat = 'txt' | 'md' | 'html' | 'docx' | 'pdf';

export const DocumentExporter: React.FC<DocumentExporterProps> = ({ document }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const processor = new DocumentProcessor(document);

  const formatOptions = [
    { value: 'txt' as ExportFormat, label: 'Texto (.txt)', icon: FileText, description: 'Formato de texto simples' },
    { value: 'md' as ExportFormat, label: 'Markdown (.md)', icon: Code, description: 'Formato Markdown para GitHub/Wiki' },
    { value: 'html' as ExportFormat, label: 'HTML (.html)', icon: Globe, description: 'Página web' },
    { value: 'docx' as ExportFormat, label: 'Word (.docx)', icon: FileText, description: 'Microsoft Word' },
    { value: 'pdf' as ExportFormat, label: 'PDF (.pdf)', icon: FileText, description: 'Documento PDF' }
  ];

  const handleExport = async () => {
    if (!document.conteudo) {
      toast({
        title: "Erro",
        description: "Documento sem conteúdo para exportar",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      let content: string;
      let mimeType: string;
      let fileName: string;

      const sanitizedTitle = document.titulo.replace(/[^a-zA-Z0-9]/g, '_');

      switch (selectedFormat) {
        case 'txt':
          content = processor.exportToFormat('txt');
          mimeType = 'text/plain';
          fileName = `${sanitizedTitle}.txt`;
          break;
          
        case 'md':
          content = processor.exportToFormat('md');
          mimeType = 'text/markdown';
          fileName = `${sanitizedTitle}.md`;
          break;
          
        case 'html':
          content = generateHTMLDocument(processor.exportToFormat('html'));
          mimeType = 'text/html';
          fileName = `${sanitizedTitle}.html`;
          break;
          
        case 'docx':
          // Para DOCX, usaremos a funcionalidade existente
          const { exportToDocx } = await import('@/lib/exporters');
          await exportToDocx(document.titulo, processor.formatForDisplay());
          toast({
            title: "Sucesso",
            description: "Documento exportado como DOCX"
          });
          return;
          
        case 'pdf':
          // Para PDF, usaremos a funcionalidade existente
          const { exportToPDF } = await import('@/lib/exporters');
          await exportToPDF(document.titulo, processor.formatForDisplay());
          toast({
            title: "Sucesso",
            description: "Documento exportado como PDF"
          });
          return;
          
        default:
          throw new Error('Formato não suportado');
      }

      // Download do arquivo
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: `Documento exportado como ${selectedFormat.toUpperCase()}`
      });
      
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro",
        description: "Falha ao exportar o documento",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateHTMLDocument = (content: string): string => {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.titulo}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .document-content {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1, h2, h3 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        hr {
            border: none;
            border-top: 3px solid #2563eb;
            margin: 30px 0;
        }
        ul, ol {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .metadata {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-top: 40px;
            border-left: 4px solid #2563eb;
        }
        @media print {
            body { background: white; }
            .document-content { box-shadow: none; }
        }
    </style>
</head>
<body>
    ${content}
    <div class="metadata">
        <strong>Documento gerado em:</strong> ${new Date().toLocaleString('pt-BR')}<br>
        <strong>Título:</strong> ${document.titulo}<br>
        <strong>ID:</strong> ${document.id}
    </div>
</body>
</html>
    `.trim();
  };

  const selectedFormatOption = formatOptions.find(opt => opt.value === selectedFormat);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Documento
        </CardTitle>
        <CardDescription>
          Exporte o documento formatado em diferentes formatos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Formato de Exportação</label>
          <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um formato" />
            </SelectTrigger>
            <SelectContent>
              {formatOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFormatOption && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <selectedFormatOption.icon className="h-4 w-4" />
              <strong>{selectedFormatOption.label}</strong>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedFormatOption.description}
            </p>
          </div>
        )}

        <Button 
          onClick={handleExport}
          disabled={isExporting || !document.conteudo}
          className="w-full"
        >
          {isExporting ? (
            <>Exportando...</>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar como {selectedFormat.toUpperCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};