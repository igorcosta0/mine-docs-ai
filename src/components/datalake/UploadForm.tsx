import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { uploadLakeFile, uploadLakeFileWithDuplicateCheck, replaceLakeItem, type UploadLakeFileOptions } from "@/lib/datalake";
import { processDocumentAutomatically } from "@/lib/pdfProcessor";
import { DuplicateAlert } from "./DuplicateAlert";
import { DuplicateAction, DuplicateCheckResult } from "@/lib/duplicateDetection";
import { Upload, Brain, FileText } from "lucide-react";

interface UploadFormProps {
  onSuccess: () => void;
  canUpload: boolean;
}

const UploadForm = ({ onSuccess, canUpload }: UploadFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [autoMode, setAutoMode] = useState(true);
  const [processingProgress, setProcessingProgress] = useState("");
  
  // Estados para controle de duplicatas
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingOptions, setPendingOptions] = useState<UploadLakeFileOptions | null>(null);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  
  // Apenas campos essenciais
  const [docType, setDocType] = useState("");

  const docTypes = [
    { value: "especificacao-tecnica", label: "Especificação Técnica (ET)" },
    { value: "memoria-calculo", label: "Memória de Cálculo (MC)" },
    { value: "memorial-descritivo", label: "Memorial Descritivo (MD)" },
    { value: "manual", label: "Manual" },
    { value: "desenho", label: "Desenho Técnico" },
    { value: "norma", label: "Norma/Procedimento" },
    { value: "certificado", label: "Certificado" },
    { value: "relatorio", label: "Relatório" },
    { value: "outros", label: "Outros" }
  ];

  const resetForm = () => {
    setFiles([]);
    setDocType("");
    setProcessingProgress("");
    // Reset estados de duplicata
    setShowDuplicateAlert(false);
    setPendingFile(null);
    setPendingOptions(null);
    setDuplicateResult(null);
  };

  // Função auxiliar para processar upload com verificação de duplicatas
  const processUploadWithDuplicateCheck = async (file: File, options: UploadLakeFileOptions): Promise<{
    ok: boolean;
    error?: string;
    needsDecision?: boolean;
  }> => {
    const result = await uploadLakeFileWithDuplicateCheck(file, options);
    
    if (result.needsUserDecision && result.duplicateCheck) {
      // Mostrar alerta de duplicata
      setPendingFile(file);
      setPendingOptions(options);
      setDuplicateResult(result.duplicateCheck);
      setShowDuplicateAlert(true);
      return { ok: true, needsDecision: true };
    }
    
    return { 
      ok: result.ok, 
      error: result.error,
      needsDecision: false
    };
  };

  // Handler para decisões de duplicata
  const handleDuplicateAction = async (action: DuplicateAction, replacedItemId?: string) => {
    if (!pendingFile || !pendingOptions) return;
    
    try {
      setShowDuplicateAlert(false);
      
      if (action === 'cancel') {
        // Cancelar upload
        setPendingFile(null);
        setPendingOptions(null);
        setDuplicateResult(null);
        return;
      }
      
      if (action === 'replace' && replacedItemId) {
        // Substituir arquivo existente
        const result = await replaceLakeItem(pendingFile, pendingOptions, replacedItemId);
        if (!result.ok) {
          throw new Error(result.error);
        }
        toast({
          title: "Arquivo substituído",
          description: "O documento foi substituído com sucesso.",
        });
      } else if (action === 'keep_both') {
        // Manter ambos - fazer upload normal
        const result = await uploadLakeFile(pendingFile, pendingOptions);
        if (!result.ok) {
          throw new Error(result.error);
        }
        toast({
          title: "Upload concluído",
          description: "O documento foi adicionado ao Data Lake.",
        });
      }
      
      // Limpar estados
      setPendingFile(null);
      setPendingOptions(null);
      setDuplicateResult(null);
      onSuccess();
      
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAutoProcess = async (files: File[]) => {
    setProcessing(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingProgress(`Processando ${i + 1} de ${files.length}: ${file.name}`);
        
        const metadata = await processDocumentAutomatically(file);
        
        // Para múltiplos arquivos, usar o tipo detectado automaticamente
        const options = {
          title: metadata.title,
          docType: metadata.docType,
          equipmentModel: metadata.equipmentModel,
          manufacturer: metadata.manufacturer,
          year: metadata.year,
          normSource: metadata.normSource,
          description: metadata.description,
          serialNumber: metadata.serialNumber,
          plantUnit: metadata.plantUnit,
          systemArea: metadata.systemArea,
          revisionVersion: metadata.revisionVersion,
          tags: metadata.tags,
        };

        // Verificar duplicatas antes do upload
        const result = await processUploadWithDuplicateCheck(file, options);
        
        if (result.needsDecision) {
          // Interromper processamento para decisão do usuário
          setProcessing(false);
          return;
        }
        
        if (!result.ok) {
          throw new Error(result.error);
        }
      }
      
      toast({
        title: "Upload concluído",
        description: `${files.length} arquivo(s) processado(s) e enviado(s) com sucesso.`,
      });
      
      resetForm();
      onSuccess();
      
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Falha ao processar alguns documentos.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
      setProcessingProgress("");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    
    if (selectedFiles.length > 0 && autoMode) {
      await handleAutoProcess(selectedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    
    setLoading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingProgress(`Enviando ${i + 1} de ${files.length}: ${file.name}`);
        
        const options: UploadLakeFileOptions = {
          title: file.name.replace('.pdf', ''),
          docType: docType || 'documento',
          tags: docType ? [docType] : ['documento'],
        };

        // Verificar duplicatas antes do upload
        const result = await processUploadWithDuplicateCheck(file, options);
        
        if (result.needsDecision) {
          // Interromper processamento para decisão do usuário
          setLoading(false);
          return;
        }
        
        if (!result.ok) {
          throw new Error(result.error);
        }
      }
      
      toast({ 
        title: "Upload concluído", 
        description: `${files.length} arquivo(s) enviado(s) com sucesso.` 
      });
      
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast({ 
        title: "Falha no upload", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
      setProcessingProgress("");
    }
  };

  const isValidUpload = canUpload && files.length > 0;

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
              multiple
              onChange={handleFileChange}
              disabled={processing}
              className="cursor-pointer"
            />
            {processing && (
              <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                <Brain className="h-4 w-4" />
                <span>{processingProgress || "Analisando documentos com IA..."}</span>
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

          {/* Preview dos arquivos selecionados */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Arquivos Selecionados ({files.length})
              </Label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            type="submit" 
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

        {/* Modal de alerta de duplicatas */}
        {showDuplicateAlert && duplicateResult && pendingFile && (
          <DuplicateAlert
            isOpen={showDuplicateAlert}
            onClose={() => setShowDuplicateAlert(false)}
            onAction={handleDuplicateAction}
            fileName={pendingFile.name}
            duplicateResult={duplicateResult}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default UploadForm;