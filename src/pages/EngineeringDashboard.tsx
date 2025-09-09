import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentType } from "@/types";
import { getDocumentService } from "@/lib/documentStorage";
import { FileText, Database, BookOpen, Plus, ArrowRight } from "lucide-react";

const documentTypes = [
  {
    type: 'especificacao' as DocumentType,
    label: 'Especificações Técnicas',
    icon: FileText,
    description: 'Documentos que detalham especificações técnicas de projetos, materiais e processos.',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    type: 'folha-dados' as DocumentType,
    label: 'Folhas de Dados',
    icon: Database,
    description: 'Informações técnicas de equipamentos, componentes e suas características operacionais.',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    type: 'memorial' as DocumentType,
    label: 'Memoriais Descritivos',
    icon: BookOpen,
    description: 'Documentos que descrevem metodologias, cronogramas e descrições detalhadas de projetos.',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  }
];

const EngineeringDashboard = () => {
  const navigate = useNavigate();
  const [documentCounts, setDocumentCounts] = useState<Record<DocumentType, number>>({
    'especificacao': 0,
    'folha-dados': 0,
    'memorial': 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocumentCounts = async () => {
      try {
        setLoading(true);
        const counts = await Promise.all(
          documentTypes.map(async ({ type }) => {
            try {
              const service = getDocumentService(type);
              const documents = await service.list();
              return { type, count: documents.length };
            } catch (error) {
              console.error(`Erro ao contar documentos do tipo ${type}:`, error);
              return { type, count: 0 };
            }
          })
        );

        const countsMap = counts.reduce((acc, { type, count }) => {
          acc[type] = count;
          return acc;
        }, {} as Record<DocumentType, number>);

        setDocumentCounts(countsMap);
      } catch (error) {
        console.error('Erro ao carregar contadores:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocumentCounts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Documentos de Engenharia</h1>
          <p className="text-muted-foreground">
            Gerencie seus documentos técnicos organizados por tipo e categoria
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {documentTypes.map(({ type, label, icon: Icon, description, color }) => (
            <Card key={type} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{label}</CardTitle>
                      {!loading && (
                        <Badge variant="secondary" className="mt-1">
                          {documentCounts[type]} documento{documentCounts[type] !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {description}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/documentos/${type}`)}
                    className="flex-1"
                  >
                    Ver Todos
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/novo-documento?tipo=${type}`)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Novo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                onClick={() => navigate('/novo-documento?tipo=especificacao')}
                className="flex items-center gap-2 h-auto p-4"
              >
                <FileText className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Nova Especificação</div>
                  <div className="text-xs text-muted-foreground">Criar especificação técnica</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/novo-documento?tipo=folha-dados')}
                className="flex items-center gap-2 h-auto p-4"
              >
                <Database className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Nova Folha de Dados</div>
                  <div className="text-xs text-muted-foreground">Documentar equipamento</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/novo-documento?tipo=memorial')}
                className="flex items-center gap-2 h-auto p-4"
              >
                <BookOpen className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Novo Memorial</div>
                  <div className="text-xs text-muted-foreground">Descrever metodologia</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/datalake')}
                className="flex items-center gap-2 h-auto p-4"
              >
                <Database className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Data Lake</div>
                  <div className="text-xs text-muted-foreground">Arquivos e dados</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EngineeringDashboard;