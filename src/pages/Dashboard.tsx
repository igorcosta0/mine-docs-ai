import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listDocuments } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { checkOllama } from "@/lib/ollama";
import { Link } from "react-router-dom";
import { FileText, Zap, TrendingUp, Clock, Plus, Sparkles, Activity, Brain } from "lucide-react";
import OllamaAssistant from "@/components/ollama/OllamaAssistant";
import { AISpecialistPanel } from "@/components/ai/AISpecialistPanel";

const Dashboard = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [ollamaOk, setOllamaOk] = useState<boolean>(false);

  useEffect(() => {
    document.title = "Dashboard — MinerDocs";
    getCurrentUser().then(user => setUserId(user?.id || null));
    checkOllama().then(setOllamaOk);
  }, []);

  const docs = useMemo(() => listDocuments(userId), [userId]);

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Sistema de Documentação Técnica
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Centro de Documentação
              <span className="text-primary block">Inteligente</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Gere, edite e organize documentos técnicos profissionais com o poder da inteligência artificial
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <Badge variant={ollamaOk ? "default" : "secondary"} className="px-4 py-2">
                <Activity className="h-4 w-4 mr-2" />
                Ollama: {ollamaOk ? "Conectado" : "Indisponível"}
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <FileText className="h-4 w-4 mr-2" />
                {docs.length} documentos
              </Badge>
            </div>
          </div>
        </section>

        {/* AI Assistant */}
        <section className="max-w-4xl mx-auto">
          <Tabs defaultValue="ollama" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ollama" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Ollama Local
              </TabsTrigger>
              <TabsTrigger value="specialist" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Especialista Data Lake
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ollama">
              <OllamaAssistant />
            </TabsContent>
            
            <TabsContent value="specialist">
              <AISpecialistPanel />
            </TabsContent>
          </Tabs>
        </section>

        {/* Document Types */}
        <section className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Tipos de Documentos</h2>
            <p className="text-muted-foreground">Escolha o tipo de documento que deseja gerar</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Especificação Técnica</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Requisitos detalhados, critérios de aceitação e procedimentos de testes técnicos
                </p>
                <Button asChild className="w-full group-hover:scale-[1.02] transition-transform">
                  <Link to="/new/especificacao">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Documento
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Folha de Dados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Informações técnicas, materiais, dimensões e capacidades operacionais
                </p>
                <Button asChild className="w-full group-hover:scale-[1.02] transition-transform">
                  <Link to="/new/folha-dados">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Documento
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Memorial Descritivo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Metodologia de trabalho, justificativas técnicas e definição de escopo
                </p>
                <Button asChild className="w-full group-hover:scale-[1.02] transition-transform">
                  <Link to="/new/memorial">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Documento
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Documents */}
        <section className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Documentos Recentes</h2>
              <p className="text-muted-foreground">Seus documentos criados recentemente</p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="h-4 w-4 mr-1" />
              {docs.length} total
            </Badge>
          </div>
          
          {docs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum documento criado</h3>
                <p className="text-muted-foreground mb-6">
                  Comece criando seu primeiro documento técnico usando um dos tipos acima
                </p>
                <Button asChild>
                  <Link to="/new/especificacao">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Documento
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.slice(0, 6).map((d) => (
                <Link 
                  key={d.id} 
                  to={`/doc/${d.id}`} 
                  className="block group"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {d.tipo}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(d.updatedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {d.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(d.updatedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Dashboard;