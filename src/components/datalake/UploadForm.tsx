import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  
  // Campos básicos
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  
  // Campos técnicos
  const [equipmentModel, setEquipmentModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [year, setYear] = useState("");
  const [normSource, setNormSource] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [plantUnit, setPlantUnit] = useState("");
  const [systemArea, setSystemArea] = useState("");
  const [revisionVersion, setRevisionVersion] = useState("");

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDocType("");
    setTags("");
    setDescription("");
    setEquipmentModel("");
    setManufacturer("");
    setYear("");
    setNormSource("");
    setSerialNumber("");
    setPlantUnit("");
    setSystemArea("");
    setRevisionVersion("");
  };

  const handleAutoProcess = async (file: File) => {
    setProcessing(true);
    
    try {
      toast({
        title: "Processando documento",
        description: "Analisando PDF com IA para extrair metadados...",
      });

      const metadata = await processDocumentAutomatically(file);
      
      // Preencher campos automaticamente
      setTitle(metadata.title);
      setDocType(metadata.docType);
      setDescription(metadata.description || '');
      setEquipmentModel(metadata.equipmentModel || '');
      setManufacturer(metadata.manufacturer || '');
      setYear(metadata.year ? String(metadata.year) : '');
      setNormSource(metadata.normSource || '');
      setSerialNumber(metadata.serialNumber || '');
      setPlantUnit(metadata.plantUnit || '');
      setSystemArea(metadata.systemArea || '');
      setRevisionVersion(metadata.revisionVersion || '');
      setTags(metadata.tags.join(', '));
      
      toast({
        title: "Processamento concluído",
        description: "Metadados extraídos automaticamente. Revise e confirme.",
      });
      
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Falha ao processar documento. Preencha manualmente.",
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
      title: title || file.name,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      docType: docType || null,
      description: description || null,
      equipmentModel: equipmentModel || null,
      manufacturer: manufacturer || null,
      year: year ? parseInt(year) : null,
      normSource: normSource || null,
      serialNumber: serialNumber || null,
      plantUnit: plantUnit || null,
      systemArea: systemArea || null,
      revisionVersion: revisionVersion || null,
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

  const isValidUpload = canUpload && file && (title || file?.name);

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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Arquivo obrigatório */}
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo PDF *</Label>
            <Input 
              id="file"
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              disabled={processing}
            />
            {processing && (
              <p className="text-xs text-primary animate-pulse">
                🧠 Processando documento com IA...
              </p>
            )}
          </div>

          {/* Informações básicas */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input 
              id="title"
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Especificação do Equipamento XYZ"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="docType">Tipo do Documento</Label>
              <Input 
                id="docType"
                value={docType} 
                onChange={(e) => setDocType(e.target.value)} 
                placeholder="Ex: especificacao, manual, desenho"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revisionVersion">Revisão/Versão</Label>
              <Input 
                id="revisionVersion"
                value={revisionVersion} 
                onChange={(e) => setRevisionVersion(e.target.value)} 
                placeholder="Ex: Rev.01, V2.1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input 
              id="tags"
              value={tags} 
              onChange={(e) => setTags(e.target.value)} 
              placeholder="Ex: bomba, válvula, segurança (separadas por vírgula)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Descrição detalhada do documento..."
              rows={3}
            />
          </div>

          {/* Informações técnicas */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Informações Técnicas</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipmentModel">Modelo do Equipamento</Label>
                <Input 
                  id="equipmentModel"
                  value={equipmentModel} 
                  onChange={(e) => setEquipmentModel(e.target.value)} 
                  placeholder="Ex: Bomba XYZ-1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante</Label>
                <Input 
                  id="manufacturer"
                  value={manufacturer} 
                  onChange={(e) => setManufacturer(e.target.value)} 
                  placeholder="Ex: Sulzer, Grundfos"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input 
                  id="year"
                  type="number"
                  value={year} 
                  onChange={(e) => setYear(e.target.value)} 
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Número de Série</Label>
                <Input 
                  id="serialNumber"
                  value={serialNumber} 
                  onChange={(e) => setSerialNumber(e.target.value)} 
                  placeholder="Ex: SN123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="normSource">Norma/Fonte</Label>
                <Input 
                  id="normSource"
                  value={normSource} 
                  onChange={(e) => setNormSource(e.target.value)} 
                  placeholder="Ex: ABNT NBR 12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plantUnit">Planta/Unidade</Label>
                <Input 
                  id="plantUnit"
                  value={plantUnit} 
                  onChange={(e) => setPlantUnit(e.target.value)} 
                  placeholder="Ex: Usina 1, Concentrador A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemArea">Sistema/Área</Label>
                <Input 
                  id="systemArea"
                  value={systemArea} 
                  onChange={(e) => setSystemArea(e.target.value)} 
                  placeholder="Ex: Flotação, Britagem"
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            variant="hero" 
            disabled={!isValidUpload || loading || processing}
            className="w-full"
          >
            {loading ? "Enviando..." : processing ? "Processando..." : "Enviar PDF"}
          </Button>
          
          {!canUpload && (
            <p className="text-xs text-muted-foreground">
              Faça login no Supabase para habilitar o upload.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadForm;