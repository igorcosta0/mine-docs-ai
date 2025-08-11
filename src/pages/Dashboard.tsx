import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listDocuments } from "@/lib/storage";
import { getCurrentUserId } from "@/lib/auth";
import { checkOllama } from "@/lib/ollama";
import { Link } from "react-router-dom";
import OllamaAssistant from "@/components/ollama/OllamaAssistant";

const Dashboard = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [ollamaOk, setOllamaOk] = useState<boolean>(false);

  useEffect(() => {
    document.title = "Dashboard — MinerDocs";
    setUserId(getCurrentUserId());
    checkOllama().then(setOllamaOk);
  }, []);

  const docs = useMemo(() => listDocuments(userId), [userId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Documentos</h1>
              <p className="text-muted-foreground">Gere, edite e exporte documentos técnicos.</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Ollama: {ollamaOk ? "Conectado" : "Indisponível"}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <OllamaAssistant />
        </section>

        <section className="grid md:grid-cols-3 gap-4 mb-10">
          <Card>
            <CardHeader><CardTitle>Especificação Técnica</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between gap-4">
              <p className="text-sm text-muted-foreground">Requisitos, critérios de aceitação, testes.</p>
              <Button asChild variant="hero"><Link to="/new/especificacao">Gerar</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Folha de Dados</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between gap-4">
              <p className="text-sm text-muted-foreground">Material, dimensões, capacidades.</p>
              <Button asChild variant="hero"><Link to="/new/folha-dados">Gerar</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Memorial Descritivo</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between gap-4">
              <p className="text-sm text-muted-foreground">Metodologia, justificativas, escopo.</p>
              <Button asChild variant="hero"><Link to="/new/memorial">Gerar</Link></Button>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Histórico</h2>
          {docs.length === 0 ? (
            <p className="text-muted-foreground">Nenhum documento ainda.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {docs.map((d) => (
                <Link key={d.id} to={`/doc/${d.id}`} className="rounded-lg border p-4 hover:bg-accent/10 transition">
                  <div className="text-sm text-muted-foreground">{new Date(d.updatedAt).toLocaleString()}</div>
                  <div className="text-base font-medium">{d.titulo}</div>
                  <div className="text-sm">{d.tipo}</div>
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
