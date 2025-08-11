import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DOC_TYPES, buildPrompt } from "@/config/documentTypes";
import { generateWithOllama } from "@/lib/ollama";
import { BaseFields, DocumentRecord, DocumentType } from "@/types";
import { upsertDocument } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";

const NewDocument = () => {
  const { type } = useParams();
  const nav = useNavigate();
  const [model, setModel] = useState("llama3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const def = useMemo(() => DOC_TYPES[(type as DocumentType) ?? "especificacao"], [type]);

  useEffect(() => {
    document.title = `Novo — ${def?.label ?? "Documento"} — MinerDocs`;
  }, [def]);

  if (!def) return <div>Tipo inválido</div>;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const base: BaseFields = {
      titulo: String(form.get("titulo") || "Documento Técnico"),
      autor: String(form.get("autor") || ""),
      data: String(form.get("data") || new Date().toISOString().slice(0, 10)),
      normas: String(form.get("normas") || ""),
      descricao: String(form.get("descricao") || ""),
    };

    const technical: Record<string, string> = {};
    def.technical.forEach((f) => (technical[f.label] = String(form.get(f.name) || "")));

    const prompt = buildPrompt(type as DocumentType, base, technical);

    try {
      const response = await generateWithOllama(model, prompt);
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id ?? null;
      const now = new Date().toISOString();
      const doc: DocumentRecord = {
        id: crypto.randomUUID(),
        userId,
        tipo: (type as DocumentType) ?? "especificacao",
        titulo: base.titulo,
        conteudo: response,
        createdAt: now,
        updatedAt: now,
      };
      upsertDocument(doc);
      nav(`/doc/${doc.id}`);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Novo — {def.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <fieldset className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input name="titulo" required />
                </div>
                <div className="space-y-2">
                  <Label>Autor</Label>
                  <Input name="autor" required />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" name="data" defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Normas aplicáveis</Label>
                  <Input name="normas" placeholder="ABNT, ISO, ASTM..." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição do projeto</Label>
                  <Textarea name="descricao" />
                </div>
              </fieldset>

              <fieldset className="grid md:grid-cols-2 gap-4">
                {def.technical.map((f) => (
                  <div key={f.name} className={`space-y-2 ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
                    <Label>{f.label}</Label>
                    {f.type === "textarea" ? (
                      <Textarea name={f.name} placeholder={f.placeholder} />
                    ) : (
                      <Input name={f.name} placeholder={f.placeholder} />
                    )}
                  </div>
                ))}
              </fieldset>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <Label>Modelo Ollama</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="llama3, mistral..." />
                </div>
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading ? "Gerando..." : "Gerar Documento"}
                </Button>
                {error && <div className="text-destructive text-sm">{error}</div>}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewDocument;
