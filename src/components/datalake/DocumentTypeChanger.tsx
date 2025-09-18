import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateLakeItemDocType, type LakeItem } from "@/lib/datalake";
import { Edit, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DocumentTypeChangerProps {
  item: LakeItem;
  onUpdate: () => void;
}

const documentTypes = [
  { value: "memorial-descritivo", label: "Memorial Descritivo", route: "/new-document?tipo=memorial" },
  { value: "memoria-calculo", label: "Memória de Cálculo", route: "/new-document?tipo=memorial" },
  { value: "especificacao-tecnica", label: "Especificação Técnica", route: "/new-document?tipo=especificacao" },
  { value: "folha-dados", label: "Folha de Dados", route: "/new-document?tipo=folha-dados" },
];

const DocumentTypeChanger = ({ item, onUpdate }: DocumentTypeChangerProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>(item.doc_type || "");
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!selectedType || selectedType === item.doc_type) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    const { ok, error } = await updateLakeItemDocType(item.id, selectedType);
    
    if (!ok) {
      toast({
        title: "Erro ao alterar tipo",
        description: error,
        variant: "destructive"
      });
      setIsUpdating(false);
      return;
    }

    toast({
      title: "Tipo alterado com sucesso",
      description: "Redirecionando para a página do documento..."
    });

    // Encontrar a rota correspondente ao novo tipo
    const docTypeConfig = documentTypes.find(dt => dt.value === selectedType);
    
    setIsUpdating(false);
    setIsOpen(false);
    onUpdate();

    // Redirecionar após um breve delay para mostrar o toast
    setTimeout(() => {
      if (docTypeConfig) {
        navigate(docTypeConfig.route);
      }
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
          title="Alterar tipo de documento"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Alterar Tipo de Documento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Documento: <span className="font-medium">{item.title}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Tipo atual: <span className="font-medium">{item.doc_type || "Não definido"}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Novo tipo:</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo tipo" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsOpen(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleUpdate}
              disabled={!selectedType || selectedType === item.doc_type || isUpdating}
            >
              {isUpdating ? (
                "Alterando..."
              ) : (
                <>
                  Alterar <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentTypeChanger;