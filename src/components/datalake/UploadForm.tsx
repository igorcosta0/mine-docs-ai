import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { uploadLakeFile, uploadLakeFileWithDuplicateCheck, replaceLakeItem, type UploadLakeFileOptions } from "@/lib/datalake";
import { processDocumentAutomatically } from "@/lib/pdfProcessor";
import { DuplicateAlert } from "./DuplicateAlert";
import { DuplicateAction, DuplicateCheckResult } from "@/lib/duplicateDetection";
import { Upload, Brain, FileText, FolderUp, Zap, CheckCircle2, XCircle, Clock } from "lucide-react";

interface UploadFormProps {
  onSuccess: () => void;
  canUpload: boolean;
}

const UploadForm = ({ onSuccess, canUpload }: UploadFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [autoMode, setAutoMode] = useState(true);
  const [quickMode, setQuickMode] = useState(false);
  
  // Estados para controle de duplicatas
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingOptions, setPendingOptions] = useState<UploadLakeFileOptions | null>(null);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  
  // Estados de progresso detalhado
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    currentFile: "",
    startTime: 0,
  });
  
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
    setUploadStats({
      total: 0,
      current: 0,
      success: 0,
      failed: 0,
      currentFile: "",
      startTime: 0,
    });
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

  const processBatch = async (batch: File[], batchIndex: number, totalBatches: number) => {
    const results = { success: 0, failed: 0 };
    
    for (let i = 0; i < batch.length; i++) {
      const file = batch[i];
      const globalIndex = batchIndex * 10 + i;
      
      setUploadStats(prev => ({
        ...prev,
        current: globalIndex + 1,
        currentFile: file.name,
      }));
      
      try {
        let options: UploadLakeFileOptions;
        
        if (quickMode) {
          // Modo rápido: sem processamento IA
          options = {
            title: file.name.replace('.pdf', ''),
            docType: docType || 'documento',
            tags: docType ? [docType] : ['documento'],
          };
        } else {
          // Modo inteligente: com IA
          const metadata = await processDocumentAutomatically(file);
          options = {
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
        }

        // Upload direto sem verificação de duplicata em lote (para velocidade)
        const result = await uploadLakeFile(file, options);
        
        if (result.ok) {
          results.success++;
          setUploadStats(prev => ({ ...prev, success: prev.success + 1 }));
        } else {
          results.failed++;
          setUploadStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      } catch (error) {
        results.failed++;
        setUploadStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
    }
    
    return results;
  };

  const handleBulkUpload = async (files: File[]) => {
    setProcessing(true);
    const BATCH_SIZE = 10;
    const batches = Math.ceil(files.length / BATCH_SIZE);
    
    setUploadStats({
      total: files.length,
      current: 0,
      success: 0,
      failed: 0,
      currentFile: "",
      startTime: Date.now(),
    });
    
    try {
      for (let i = 0; i < batches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, files.length);
        const batch = files.slice(start, end);
        
        await processBatch(batch, i, batches);
        
        // Pequeno delay entre batches para não sobrecarregar
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      const elapsed = ((Date.now() - uploadStats.startTime) / 1000).toFixed(0);
      
      toast({
        title: "Upload em massa concluído",
        description: `✅ ${uploadStats.success} sucesso | ❌ ${uploadStats.failed} falhas | ⏱️ ${elapsed}s`,
      });
      
      resetForm();
      onSuccess();
      
    } catch (error) {
      toast({
        title: "Erro no processamento em lote",
        description: "Falha durante o upload em massa.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    setFiles(selectedFiles);
    
    // Upload em massa automático se tiver mais de 5 arquivos
    if (selectedFiles.length > 5 && autoMode) {
      await handleBulkUpload(selectedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    
    // Se tiver muitos arquivos, usar processamento em lote
    if (files.length > 5) {
      await handleBulkUpload(files);
      return;
    }
    
    setLoading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
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
    }
  };

  const isValidUpload = canUpload && files.length > 0;

  const progressPercentage = uploadStats.total > 0 
    ? Math.round((uploadStats.current / uploadStats.total) * 100) 
    : 0;

  const estimatedTimeLeft = uploadStats.current > 0 && uploadStats.startTime > 0
    ? Math.round(((Date.now() - uploadStats.startTime) / uploadStats.current) * (uploadStats.total - uploadStats.current) / 1000)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {processing ? (
            <Brain className="h-5 w-5 animate-pulse text-primary" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          Upload em Massa de PDFs
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Switch
              checked={autoMode}
              onCheckedChange={setAutoMode}
              disabled={processing}
            />
            <Brain className="h-4 w-4" />
            <span>Upload automático (mais de 5 arquivos)</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Switch
              checked={quickMode}
              onCheckedChange={setQuickMode}
              disabled={processing}
            />
            <Zap className="h-4 w-4" />
            <span>Modo rápido (sem processamento IA)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload do arquivo */}
          <div className="space-y-3">
            <Label>Selecionar Arquivos *</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Selecionar Arquivos</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => folderInputRef.current?.click()}
                disabled={processing}
              >
                <FolderUp className="h-6 w-6" />
                <span className="text-sm">Selecionar Pasta</span>
              </Button>
            </div>
            <Input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              disabled={processing}
              className="hidden"
            />
            <Input 
              ref={folderInputRef}
              type="file" 
              accept=".pdf"
              multiple
              {...({ webkitdirectory: "" } as any)}
              onChange={handleFileChange}
              disabled={processing}
              className="hidden"
            />
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

          {/* Barra de progresso detalhada */}
          {processing && uploadStats.total > 0 && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progresso do Upload</span>
                  <span className="text-muted-foreground">
                    {uploadStats.current} / {uploadStats.total} arquivos
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {progressPercentage}% concluído
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{uploadStats.success}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Sucesso</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">{uploadStats.failed}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Falhas</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{estimatedTimeLeft}s</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Restante</p>
                </div>
              </div>
              
              {uploadStats.currentFile && (
                <div className="flex items-center gap-2 text-sm animate-pulse">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="truncate">{uploadStats.currentFile}</span>
                </div>
              )}
            </div>
          )}

          {/* Preview dos arquivos selecionados */}
          {files.length > 0 && !processing && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Arquivos Selecionados ({files.length})
              </Label>
              {files.length > 10 ? (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">{files.length} arquivos PDF</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
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
              )}
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