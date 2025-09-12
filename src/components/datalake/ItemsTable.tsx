import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { deleteLakeItem, type LakeItem } from "@/lib/datalake";
import { FileText, Trash2, Search, Filter } from "lucide-react";
import DocumentViewer from "./DocumentViewer";

interface ItemsTableProps {
  items: LakeItem[];
  onRefresh: () => void;
}

const ItemsTable = ({ items, onRefresh }: ItemsTableProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

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

  // Filtrar itens por busca
  const filteredItems = items.filter(item => {
    const searchFields = [
      item.title,
      item.description,
      item.equipment_model,
      item.manufacturer,
      item.plant_unit,
      item.system_area,
      ...(item.tags || [])
    ].filter(Boolean);

    return searchFields.some(field => 
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Separar por tipo de documento
  const memorialDescritivo = filteredItems.filter(item => 
    item.doc_type === 'memorial-descritivo' || 
    item.doc_type === 'memorial'
  );
  
  const memoriaCalculo = filteredItems.filter(item => 
    item.doc_type === 'memoria-calculo'
  );
  
  const especificacaoTecnica = filteredItems.filter(item => 
    item.doc_type === 'especificacao-tecnica' || 
    item.doc_type === 'especificacao'
  );
  
  const outros = filteredItems.filter(item => 
    !['memorial-descritivo', 'memorial', 'memoria-calculo', 'especificacao-tecnica', 'especificacao'].includes(item.doc_type || '')
  );

  const getTabItems = (tab: string) => {
    switch (tab) {
      case 'memorial': return memorialDescritivo;
      case 'calculo': return memoriaCalculo;
      case 'especificacao': return especificacaoTecnica;
      case 'outros': return outros;
      default: return filteredItems;
    }
  };

  const getDocTypeColor = (docType: string) => {
    switch (docType) {
      case 'memorial-descritivo':
      case 'memorial':
        return 'bg-blue-100 text-blue-800';
      case 'memoria-calculo':
        return 'bg-green-100 text-green-800';
      case 'especificacao-tecnica':
      case 'especificacao':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTable = (items: LakeItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Tente ajustar os termos da busca." : "Faça upload de documentos para começar."}
          </p>
        </div>
      );
    }

    return (
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
                        <Badge className={`text-xs ${getDocTypeColor(item.doc_type)}`}>
                          {item.doc_type === 'memorial-descritivo' ? 'MD' : 
                           item.doc_type === 'memoria-calculo' ? 'MC' :
                           item.doc_type === 'especificacao-tecnica' ? 'ET' :
                           item.doc_type}
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
                    <DocumentViewer item={item} />
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
    );
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
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, equipamento, fabricante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="todos" className="text-xs">
              Todos ({filteredItems.length})
            </TabsTrigger>
            <TabsTrigger value="memorial" className="text-xs">
              MD ({memorialDescritivo.length})
            </TabsTrigger>
            <TabsTrigger value="calculo" className="text-xs">
              MC ({memoriaCalculo.length})
            </TabsTrigger>
            <TabsTrigger value="especificacao" className="text-xs">
              ET ({especificacaoTecnica.length})
            </TabsTrigger>
            <TabsTrigger value="outros" className="text-xs">
              Outros ({outros.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-4">
            {renderTable(filteredItems)}
          </TabsContent>
          
          <TabsContent value="memorial" className="mt-4">
            {renderTable(memorialDescritivo)}
          </TabsContent>
          
          <TabsContent value="calculo" className="mt-4">
            {renderTable(memoriaCalculo)}
          </TabsContent>
          
          <TabsContent value="especificacao" className="mt-4">
            {renderTable(especificacaoTecnica)}
          </TabsContent>
          
          <TabsContent value="outros" className="mt-4">
            {renderTable(outros)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ItemsTable;