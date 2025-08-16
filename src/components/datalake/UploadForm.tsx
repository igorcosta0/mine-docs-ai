import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { uploadLakeFile, type UploadLakeFileOptions } from "@/lib/datalake";
import { processDocumentAutomatically } from "@/lib/pdfProcessor";
import { Upload, Brain, FileText } from "lucide-react";

interface UploadFormProps {
  onSuccess: () => void;
  canUpload: boolean;
}

const UploadForm = ({ onSuccess, canUpload }: UploadFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [autoMode, setAutoMode] = useState(true);
  
  // Apenas campos essenciais
  const [docType, setDocType] = useState("");

  const docTypes = [
    { value: "especificacao", label: "Especificação Técnica" },
    { value: "folha-dados", label: "Folha de Dados" },
    { value: "memorial", label: "Memorial Descritivo" },
    { value: "manual", label: "Manual" },
    { value: "desenho", label: "Desenho Técnico" },
    { value: "norma", label: "Norma/Procedimento" },
    { value: "certificado", label: "Certificado" },
    { value: "relatorio", label: "Relatório" },
    { value: "outros", label: "Outros" }
  ];

  const resetForm = () => {
    setFile(null);
    setDocType("");
  };

  const handleAutoProcess = async (file: File) => {
    setProcessing(true);
    
    try {
      toast({
        title: "Processando documento",
        description: "Analisando PDF com IA para classificar tipo...",
      });

      const metadata = await processDocumentAutomatically(file);
      
      // Preencher apenas o tipo de documento
      setDocType(metadata.docType);
      
      toast({
        title: "Processamento concluído",
        description: `Documento classificado como: ${metadata.docType}`,
      });
      
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Falha ao processar documento. Selecione o tipo manualmente.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    if (selectedFile && autoMode) {
      await handleAutoProcess(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    
    const options: UploadLakeFileOptions = {
      title: file.name.replace('.pdf', ''),
      docType: docType || 'documento',
      tags: docType ? [docType] : ['documento'],
    };

    const { ok, error } = await uploadLakeFile(file, options);
    setLoading(false);
    
    if (!ok) {
      toast({ 
        title: "Falha no upload", 
        description: error, 
        variant: "destructive" 
      });
      return;
    }
    
    toast({ 
      title: "Arquivo enviado", 
      description: "PDF adicionado ao Data Lake com sucesso." 
    });
    
    resetForm();
    onSuccess();
  };

  const isValidUpload = canUpload && file;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {processing ? (
            <Brain className="h-5 w-5 animate-pulse text-primary" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          Upload Inteligente de PDF
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch
            checked={autoMode}
            onCheckedChange={setAutoMode}
            disabled={processing}
          />
          <FileText className="h-4 w-4" />
          <span>Processamento automático com IA</span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload do arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo PDF *</Label>
            <Input 
              id="file"
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              disabled={processing}
              className="cursor-pointer"
            />
            {processing && (
              <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                <Brain className="h-4 w-4" />
                <span>Analisando documento com IA...</span>
              </div>
            )}
          </div>

          {/* Tipo de documento */}
          <div className="space-y-2">
            <Label htmlFor="docType">Tipo de Documento *</Label>
            <Select value={docType} onValueChange={setDocType} disabled={processing}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview do arquivo selecionado */}
          {file && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            variant="hero" 
            disabled={!isValidUpload || loading || processing}
            className="w-full"
            size="lg"
          >
            {loading ? "Enviando..." : processing ? "Processando..." : "Adicionar ao Data Lake"}
          </Button>
          
          {!canUpload && (
            <p className="text-xs text-muted-foreground text-center">
              Faça login no Supabase para habilitar o upload.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadForm;