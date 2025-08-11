import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocument, upsertDocument } from "@/lib/storage";
import { exportToDocx, exportToPDF } from "@/lib/exporters";
import { supabase } from "@/integrations/supabase/client";

const DocumentViewer = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const doc = useMemo(() => (id ? getDocument(id) : undefined), [id]);

  useEffect(() => {
    if (!doc) return;
    document.title = `${doc.titulo} — MinerDocs`;
    setText(doc.conteudo);
    setTitle(doc.titulo);
  }, [doc]);

  if (!doc) return <div className="p-6">Documento não encontrado</div>;

  async function save() {
    const now = new Date().toISOString();
    const updated = { ...doc, titulo: title, conteudo: text, updatedAt: now };
    upsertDocument(updated);

    // Tenta salvar no Supabase (tabela 'documents' quando existir)
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (userId) {
        await supabase.from("documents").upsert({
          id: updated.id,
          user_id: userId,
          type: updated.tipo,
          title: updated.titulo,
          content: updated.conteudo,
          updated_at: now,
          created_at: doc.createdAt,
        });
      }
    } catch (e) {
      // Silencia erro caso tabela não exista ainda
      // eslint-disable-next-line no-console
      console.warn("Supabase save skipped:", e);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent outline-none text-2xl font-semibold"
              />
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => exportToDocx(title || "documento", text)} variant="secondary">Exportar .docx</Button>
              <Button onClick={() => exportToPDF(title || "documento", text)} variant="secondary">Exportar .pdf</Button>
              <Button onClick={save} variant="hero">Salvar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[60vh] bg-background rounded-md border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DocumentViewer;
