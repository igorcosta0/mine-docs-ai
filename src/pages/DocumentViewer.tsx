import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDocument, upsertDocument } from "@/lib/storage";
import { exportToDocx, exportToPDF } from "@/lib/exporters";
import { DocumentAnalyzer } from "@/components/documents/DocumentAnalyzer";
import { DocumentExporter } from "@/components/documents/DocumentExporter";
import { DocumentTemplates } from "@/components/documents/DocumentTemplates";
import { toast } from "sonner";

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
    toast.success("Documento salvo com sucesso!");
  }

  const handleTemplateSelect = (content: string) => {
    setText(content);
    toast.success("Template aplicado com sucesso!");
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-6">
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Editor Avançado de Documentos
            </CardTitle>
            <p className="text-muted-foreground">
              Crie, edite, analise e exporte documentos técnicos com ferramentas profissionais
            </p>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  📝 Editor
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  📊 Análise
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  📄 Templates
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  📤 Exportar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Título do Documento
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Digite o título do documento..."
                      className="text-lg font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Conteúdo
                    </label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-[500px] font-mono text-sm leading-relaxed"
                      placeholder="Digite o conteúdo do documento..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={save} className="flex-1">
                      💾 Salvar Alterações
                    </Button>
                    <Button 
                      onClick={() => exportToDocx(title || "documento", text)} 
                      variant="outline"
                      className="flex-1"
                    >
                      📄 Exportar DOCX
                    </Button>
                    <Button 
                      onClick={() => exportToPDF(title || "documento", text)} 
                      variant="outline"
                      className="flex-1"
                    >
                      📋 Exportar PDF
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analysis">
                <DocumentAnalyzer document={doc} />
              </TabsContent>

              <TabsContent value="templates">
                <DocumentTemplates onTemplateSelect={handleTemplateSelect} />
              </TabsContent>

              <TabsContent value="export">
                <DocumentExporter document={doc} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DocumentViewer;