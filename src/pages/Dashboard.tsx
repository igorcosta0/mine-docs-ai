import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listDocuments } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { checkOllama } from "@/lib/ollama";
import { Link } from "react-router-dom";
import OllamaAssistant from "@/components/ollama/OllamaAssistant";

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
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="card-elegant rounded-xl p-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              Centro de Documentos Técnicos
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Gere, edite e exporte documentos técnicos profissionais com inteligência artificial
            </p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              ollamaOk 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${ollamaOk ? 'bg-green-500' : 'bg-amber-500'}`} />
              Ollama: {ollamaOk ? "Conectado" : "Indisponível"}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <OllamaAssistant />
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="card-elegant group">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary">Especificação Técnica</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground leading-relaxed">
                Requisitos detalhados, critérios de aceitação e procedimentos de testes
              </p>
              <Button asChild variant="hero" className="btn-glow group-hover:scale-105 transition-transform">
                <Link to="/new/especificacao">Gerar Documento</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="card-elegant group">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary">Folha de Dados</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground leading-relaxed">
                Informações técnicas, materiais, dimensões e capacidades operacionais
              </p>
              <Button asChild variant="hero" className="btn-glow group-hover:scale-105 transition-transform">
                <Link to="/new/folha-dados">Gerar Documento</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="card-elegant group">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary">Memorial Descritivo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground leading-relaxed">
                Metodologia de trabalho, justificativas técnicas e definição de escopo
              </p>
              <Button asChild variant="hero" className="btn-glow group-hover:scale-105 transition-transform">
                <Link to="/new/memorial">Gerar Documento</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Histórico de Documentos</h2>
          {docs.length === 0 ? (
            <Card className="card-elegant">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg text-muted-foreground">Nenhum documento criado ainda</p>
                <p className="text-sm text-muted-foreground mt-2">Comece gerando seu primeiro documento técnico</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {docs.map((d) => (
                <Link 
                  key={d.id} 
                  to={`/doc/${d.id}`} 
                  className="card-elegant rounded-xl p-6 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-sm text-muted-foreground">
                      {new Date(d.updatedAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {d.tipo}
                    </div>
                  </div>
                  <div className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">
                    {d.titulo}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Última modificação: {new Date(d.updatedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
