import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type LakeItem } from "@/lib/datalake";
import { Eye, Download, FileText, Calendar, Building, Wrench, Tag } from "lucide-react";

interface DocumentViewerProps {
  item: LakeItem;
}

const DocumentViewer = ({ item }: DocumentViewerProps) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase.storage
        .from('datalake')
        .download(item.file_path);

      if (error) throw error;
      if (!data) throw new Error('Arquivo não encontrado');

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.title + '.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: `Arquivo "${item.title}" baixado com sucesso.`
      });
    } catch (error: any) {
      toast({
        title: "Erro no download",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getDocTypeColor = (docType: string) => {
    switch (docType) {
      case 'memorial-descritivo': return 'bg-blue-100 text-blue-800';
      case 'memoria-calculo': return 'bg-green-100 text-green-800';
      case 'especificacao-tecnica': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocTypeLabel = (docType: string) => {
    switch (docType) {
      case 'memorial-descritivo': return 'Memorial Descritivo (MD)';
      case 'memoria-calculo': return 'Memória de Cálculo (MC)';
      case 'especificacao-tecnica': return 'Especificação Técnica (ET)';
      default: return docType;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Visualizar detalhes">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3 text-left">
            <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg leading-tight break-words">
                {item.title}
              </div>
              {item.doc_type && (
                <Badge className={`mt-2 ${getDocTypeColor(item.doc_type)}`}>
                  {getDocTypeLabel(item.doc_type)}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Descrição */}
          {item.description && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Descrição</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Informações do Equipamento */}
          {(item.equipment_model || item.manufacturer || item.serial_number || item.year) && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Informações do Equipamento
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {item.equipment_model && (
                  <div>
                    <span className="font-medium text-muted-foreground">Modelo: </span>
                    <span>{item.equipment_model}</span>
                  </div>
                )}
                {item.manufacturer && (
                  <div>
                    <span className="font-medium text-muted-foreground">Fabricante: </span>
                    <span>{item.manufacturer}</span>
                  </div>
                )}
                {item.serial_number && (
                  <div>
                    <span className="font-medium text-muted-foreground">Número de Série: </span>
                    <span>{item.serial_number}</span>
                  </div>
                )}
                {item.year && (
                  <div>
                    <span className="font-medium text-muted-foreground">Ano: </span>
                    <span>{item.year}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Localização */}
          {(item.plant_unit || item.system_area) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Localização
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {item.plant_unit && (
                    <div>
                      <span className="font-medium text-muted-foreground">Unidade/Planta: </span>
                      <span>{item.plant_unit}</span>
                    </div>
                  )}
                  {item.system_area && (
                    <div>
                      <span className="font-medium text-muted-foreground">Área/Sistema: </span>
                      <span>{item.system_area}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Normas e Revisão */}
          {(item.norm_source || item.revision_version) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Informações Técnicas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {item.norm_source && (
                    <div>
                      <span className="font-medium text-muted-foreground">Normas: </span>
                      <span>{item.norm_source}</span>
                    </div>
                  )}
                  {item.revision_version && (
                    <div>
                      <span className="font-medium text-muted-foreground">Revisão: </span>
                      <span>{item.revision_version}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h4>
                <div className="flex gap-1 flex-wrap">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Metadata
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Adicionado em: </span>
                {new Date(item.created_at).toLocaleString('pt-BR')}
              </div>
              <div>
                <span className="font-medium">Atualizado em: </span>
                {new Date(item.updated_at).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleDownload} 
              disabled={isDownloading}
              className="flex-1"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Baixando..." : "Baixar PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;