import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DocumentType } from "@/types";
import { getDocumentService, EspecificacaoTecnica, FolhaDados, MemorialDescritivo } from "@/lib/documentStorage";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Search } from "lucide-react";

const documentTypeLabels: Record<DocumentType, string> = {
  'especificacao': 'Especificações Técnicas',
  'folha-dados': 'Folhas de Dados',
  'memorial': 'Memoriais Descritivos'
};

const DocumentsByType = () => {
  const { tipo } = useParams<{ tipo: DocumentType }>();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  if (!tipo || !documentTypeLabels[tipo]) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-center">Tipo de documento não encontrado</h1>
              <p className="text-center mt-4">
                <Button onClick={() => navigate('/app')} variant="outline">
                  Voltar ao Dashboard
                </Button>
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const service = getDocumentService(tipo);
      const data = await service.list();
      setDocuments(data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este documento?')) return;
    
    try {
      const service = getDocumentService(tipo);
      await service.delete(id);
      toast.success('Documento deletado com sucesso');
      loadDocuments();
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      toast.error('Erro ao deletar documento');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.autor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    loadDocuments();
  }, [tipo]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSpecificFields = (doc: any) => {
    switch (tipo) {
      case 'especificacao':
        return (
          <>
            {doc.escopo && <Badge variant="outline">Escopo: {doc.escopo}</Badge>}
            {doc.tolerancias && <Badge variant="outline">Tolerâncias: {doc.tolerancias}</Badge>}
          </>
        );
      case 'folha-dados':
        return (
          <>
            {doc.equipamento && <Badge variant="outline">Equipamento: {doc.equipamento}</Badge>}
            {doc.fabricante && <Badge variant="outline">Fabricante: {doc.fabricante}</Badge>}
            {doc.potencia && <Badge variant="outline">Potência: {doc.potencia}</Badge>}
          </>
        );
      case 'memorial':
        return (
          <>
            {doc.projeto_referencia && <Badge variant="outline">Projeto: {doc.projeto_referencia}</Badge>}
            {doc.localização && <Badge variant="outline">Local: {doc.localização}</Badge>}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl">{documentTypeLabels[tipo]}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Gerencie seus documentos de {documentTypeLabels[tipo].toLowerCase()}
                </p>
              </div>
              <Button 
                onClick={() => navigate(`/novo-documento?tipo=${tipo}`)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Documento
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por título, descrição ou autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p>Carregando documentos...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum documento encontrado com os critérios de busca.' : 'Nenhum documento encontrado.'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => navigate(`/novo-documento?tipo=${tipo}`)}
                    variant="outline" 
                    className="mt-4"
                  >
                    Criar primeiro documento
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{doc.titulo}</p>
                            {doc.descricao && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {doc.descricao}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{doc.autor || '-'}</TableCell>
                        <TableCell>{doc.data ? formatDate(doc.data) : '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getSpecificFields(doc)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(doc.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/documento/${doc.id}?tipo=${tipo}`)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                              className="flex items-center gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                              Deletar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DocumentsByType;