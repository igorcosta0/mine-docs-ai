import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, FileText, Calendar } from "lucide-react";
import { searchDocuments, getDocumentDownloadUrl, type Document, type SearchParams } from "@/lib/datalakeDocuments";
import { toast } from "sonner";

interface DocumentsTableProps {
  refreshTrigger?: number;
}

export function DocumentsTable({ refreshTrigger }: DocumentsTableProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [searchText, setSearchText] = useState('');

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const result = await searchDocuments(searchParams);
      if ('error' in result) {
        toast.error(result.error);
        setDocuments([]);
      } else {
        setDocuments(result);
      }
    } catch (error) {
      toast.error('Erro ao carregar documentos');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [searchParams, refreshTrigger]);

  const handleSearch = () => {
    setSearchParams({
      ...searchParams,
      text: searchText || undefined,
    });
  };

  const handleDownload = async (document: Document) => {
    try {
      const result = await getDocumentDownloadUrl(document.id);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        window.open(result.download_url, '_blank');
      }
    } catch (error) {
      toast.error('Erro ao baixar documento');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos do Data Lake
        </CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por título ou projeto..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Button onClick={handleSearch} variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Carregando documentos...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum documento encontrado
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{doc.doc_number}</div>
                        <Badge variant="outline" className="text-xs">
                          Rev. {doc.rev}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={doc.title}>
                        {doc.title}
                      </div>
                    </TableCell>
                    <TableCell>{doc.customer || '-'}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={doc.project || ''}>
                        {doc.project || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {doc.issue_date ? formatDate(doc.issue_date) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          doc.status === 'ingested'
                            ? 'default'
                            : doc.status === 'processing'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {doc.status === 'ingested'
                          ? 'Ingerido'
                          : doc.status === 'processing'
                          ? 'Processando'
                          : 'Erro'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}