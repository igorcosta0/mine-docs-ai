import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { deleteLakeItem, type LakeItem } from "@/lib/datalake";
import { FileText, Trash2, Eye } from "lucide-react";

interface ItemsTableProps {
  items: LakeItem[];
  onRefresh: () => void;
}

const ItemsTable = ({ items, onRefresh }: ItemsTableProps) => {
  const { toast } = useToast();

  const handleDelete = async (item: LakeItem) => {
    const confirmed = window.confirm(
      `Remover "${item.title}" do Data Lake?\n\nEsta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    const { ok, error } = await deleteLakeItem(item);
    if (!ok) {
      toast({ 
        title: "Erro ao remover", 
        description: error, 
        variant: "destructive" 
      });
      return;
    }
    
    toast({ title: "Item removido com sucesso" });
    onRefresh();
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos no Data Lake
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground">
              Faça upload do primeiro PDF técnico para começar a usar o Data Lake.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos no Data Lake ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Planta/Sistema</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="flex gap-1 flex-wrap">
                        {item.doc_type && (
                          <Badge variant="secondary" className="text-xs">
                            {item.doc_type}
                          </Badge>
                        )}
                        {item.revision_version && (
                          <Badge variant="outline" className="text-xs">
                            {item.revision_version}
                          </Badge>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          item.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))
                        )}
                        {item.tags && item.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.equipment_model && (
                        <div className="font-medium text-sm">{item.equipment_model}</div>
                      )}
                      {item.serial_number && (
                        <div className="text-xs text-muted-foreground">SN: {item.serial_number}</div>
                      )}
                      {item.year && (
                        <div className="text-xs text-muted-foreground">{item.year}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.manufacturer && (
                        <div className="text-sm">{item.manufacturer}</div>
                      )}
                      {item.norm_source && (
                        <div className="text-xs text-muted-foreground">{item.norm_source}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.plant_unit && (
                        <div className="text-sm">{item.plant_unit}</div>
                      )}
                      {item.system_area && (
                        <div className="text-xs text-muted-foreground">{item.system_area}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(item.updated_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.updated_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemsTable;