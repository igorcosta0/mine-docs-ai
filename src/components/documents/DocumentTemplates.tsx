import React, { useState } from 'react';
import { DocumentUtils } from '@/lib/documentProcessor';
import { DocumentType } from '@/types';
import { DOC_TYPES } from '@/config/documentTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Copy, FileText, Sparkles } from 'lucide-react';

interface DocumentTemplatesProps {
  onTemplateSelect: (content: string) => void;
}

export const DocumentTemplates: React.FC<DocumentTemplatesProps> = ({ onTemplateSelect }) => {
  const [selectedType, setSelectedType] = useState<DocumentType>('especificacao');
  const [previewContent, setPreviewContent] = useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    if (selectedType) {
      const template = DocumentUtils.generateTemplate(selectedType);
      setPreviewContent(template);
    }
  }, [selectedType]);

  const handleUseTemplate = () => {
    if (previewContent) {
      onTemplateSelect(previewContent);
      toast({
        title: "Template aplicado",
        description: "O template foi aplicado ao documento. Você pode editá-lo conforme necessário."
      });
    }
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
      toast({
        title: "Template copiado",
        description: "O template foi copiado para a área de transferência."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o template.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates de Documentos
          </CardTitle>
          <CardDescription>
            Selecione um template para começar seu documento com estrutura profissional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Documento</label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as DocumentType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key as DocumentType}>
                    <div>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-muted-foreground">{config.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleUseTemplate} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Usar Template
            </Button>
            <Button variant="outline" onClick={handleCopyTemplate}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visualização do Template</CardTitle>
          <CardDescription>
            {selectedType && DOC_TYPES[selectedType].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={previewContent}
            readOnly
            className="min-h-[400px] font-mono text-sm"
            placeholder="Selecione um tipo de documento para visualizar o template"
          />
        </CardContent>
      </Card>

      {/* Guia rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Guia de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">1.</span>
              <span>Selecione o tipo de documento apropriado para seu projeto</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">2.</span>
              <span>Visualize o template na área de preview</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">3.</span>
              <span>Clique em "Usar Template" para aplicar ao documento atual</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">4.</span>
              <span>Substitua os campos entre colchetes com suas informações específicas</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">5.</span>
              <span>Use o analisador de qualidade para melhorar seu documento</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};