import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocument, upsertDocument } from "@/lib/storage";
import { exportToDocx, exportToPDF } from "@/lib/exporters";

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
  }

  return (
    <AppLayout>
      <div className="p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent outline-none text-2xl font-semibold focus:ring-2 focus:ring-primary/20 rounded-md px-2 py-1"
                placeholder="Título do documento"
              />
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => exportToDocx(title || "documento", text)} variant="secondary">Exportar .docx</Button>
              <Button onClick={() => exportToPDF(title || "documento", text)} variant="secondary">Exportar .pdf</Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-96 resize-y bg-muted/30 border border-border rounded-lg p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all"
              placeholder="Conteúdo do documento..."
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DocumentViewer;