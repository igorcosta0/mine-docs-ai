import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DOC_TYPES, buildPrompt } from "@/config/documentTypes";
import { generateWithOllama } from "@/lib/ollama";
import { BaseFields, DocumentRecord, DocumentType } from "@/types";
import { upsertDocument } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { FileText, Loader2, Sparkles, Bot, Lightbulb } from "lucide-react";
import OllamaAssistant from "@/components/ollama/OllamaAssistant";
import { DocumentAIAssistant } from "@/components/ai/DocumentAIAssistant";
import { useSmartFormData } from "@/hooks/useSmartFormData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NewDocument = () => {
  const { type } = useParams();
  const nav = useNavigate();
  const [model, setModel] = useState("qwen2.5:7b");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BaseFields & Record<string, string>>>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // Refs para os campos do formulário
  const formRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});

  const def = useMemo(() => DOC_TYPES[(type as DocumentType) ?? "especificacao"], [type]);
  const { suggestions, loading: smartLoading } = useSmartFormData(type as DocumentType);

  useEffect(() => {
    document.title = `Novo — ${def?.label ?? "Documento"} — MinerDocs`;
  }, [def]);

  // Auto-preencher com dados inteligentes
  useEffect(() => {
    if (!smartLoading && suggestions) {
      if (suggestions.autor && formRefs.current['autor']) {
        formRefs.current['autor'].value = suggestions.autor;
        handleFormChange('autor', suggestions.autor);
      }
      if (suggestions.normas && formRefs.current['normas']) {
        formRefs.current['normas'].value = suggestions.normas;
        handleFormChange('normas', suggestions.normas);
      }
    }
  }, [smartLoading, suggestions]);

  if (!def) return <div>Tipo inválido</div>;

  // Atualizar dados do formulário para o assistente IA
  const handleFormChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Aplicar sugestão da IA
  const handleAISuggestionApply = (field: string, suggestion: string) => {
    const fieldRef = formRefs.current[field];
    if (fieldRef) {
      fieldRef.value = suggestion;
      handleFormChange(field, suggestion);
    }
  };

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

    try {
      // Tentar edge function inteligente primeiro
      const { data: smartData, error: smartError } = await supabase.functions.invoke('smart-document-generation', {
        body: {
          documentType: type as DocumentType,
          formData: { ...base, ...technical },
          useKnowledge: true
        }
      });

      let response: string;
      let usedSmartGeneration = false;

      if (!smartError && smartData?.content) {
        response = smartData.content;
        usedSmartGeneration = true;
        if (smartData.usedKnowledge) {
          toast.success("Documento gerado usando seu conhecimento do Data Lake!");
        }
      } else {
        // Fallback para geração local com Ollama
        const prompt = buildPrompt(type as DocumentType, base, technical);
        response = await generateWithOllama(model, prompt);
      }

      const user = await getCurrentUser();
      const now = new Date().toISOString();
      const doc: DocumentRecord = {
        id: crypto.randomUUID(),
        userId: user?.id || null,
        tipo: (type as DocumentType) ?? "especificacao",
        titulo: base.titulo,
        conteudo: response,
        createdAt: now,
        updatedAt: now,
      };
      upsertDocument(doc);
      
      toast.success(usedSmartGeneration ? "Documento gerado com IA inteligente!" : "Documento gerado com sucesso!");
      nav(`/doc/${doc.id}`);
    } catch (err: any) {
      setError(err.message || String(err));
      toast.error(err.message || "Erro ao gerar documento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <section className="max-w-4xl mx-auto">
          <OllamaAssistant />
        </section>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Formulário Principal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <FileText className="h-4 w-4" />
                  Geração de Documento
                </div>
                <h1 className="text-3xl font-bold mb-2">Novo {def.label}</h1>
                <p className="text-muted-foreground">{def.description}</p>
                
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                    className="gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    {showAIAssistant ? 'Ocultar' : 'Mostrar'} Assistente IA
                  </Button>
                </div>
              </div>

              <Card className="shadow-lg border-2">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Informações do Documento
                    <Badge variant="outline" className="ml-auto">
                      {def.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Sugestões Inteligentes */}
                  {suggestions.similarDocuments.length > 0 && (
                    <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm">Documentos similares encontrados</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.similarDocuments.map((doc) => (
                          <Badge key={doc.id} variant="secondary" className="text-xs">
                            {doc.titulo}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        A IA usará esses documentos como referência para gerar conteúdo mais preciso
                      </p>
                    </div>
                  )}

                  <form onSubmit={onSubmit} className="space-y-6">
                    <fieldset className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input 
                          name="titulo" 
                          required 
                          className="focus:ring-2 focus:ring-primary/20"
                          ref={(el) => (formRefs.current['titulo'] = el)}
                          onChange={(e) => handleFormChange('titulo', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Autor {smartLoading && <span className="text-xs text-muted-foreground">(auto-preenchendo...)</span>}
                        </Label>
                        <Input 
                          name="autor" 
                          required 
                          className="focus:ring-2 focus:ring-primary/20"
                          ref={(el) => (formRefs.current['autor'] = el)}
                          onChange={(e) => handleFormChange('autor', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data</Label>
                        <Input 
                          type="date" 
                          name="data" 
                          defaultValue={new Date().toISOString().slice(0, 10)} 
                          className="focus:ring-2 focus:ring-primary/20"
                          ref={(el) => (formRefs.current['data'] = el)}
                          onChange={(e) => handleFormChange('data', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Normas aplicáveis</Label>
                        <Input 
                          name="normas" 
                          placeholder="ABNT, ISO, ASTM..." 
                          className="focus:ring-2 focus:ring-primary/20"
                          ref={(el) => (formRefs.current['normas'] = el)}
                          onChange={(e) => handleFormChange('normas', e.target.value)}
                        />
                        {suggestions.recentManufacturers.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Fabricantes recentes: {suggestions.recentManufacturers.join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Descrição do projeto</Label>
                        <Textarea 
                          name="descricao" 
                          className="focus:ring-2 focus:ring-primary/20"
                          ref={(el) => (formRefs.current['descricao'] = el)}
                          onChange={(e) => handleFormChange('descricao', e.target.value)}
                        />
                      </div>
                    </fieldset>

                    <fieldset className="grid md:grid-cols-2 gap-4">
                      {def.technical.map((f) => (
                        <div key={f.name} className={`space-y-2 ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
                          <Label>{f.label}</Label>
                          {f.type === "textarea" ? (
                            <Textarea 
                              name={f.name} 
                              placeholder={f.placeholder} 
                              className="focus:ring-2 focus:ring-primary/20"
                              ref={(el) => (formRefs.current[f.name] = el)}
                              onChange={(e) => handleFormChange(f.name, e.target.value)}
                            />
                          ) : (
                            <Input 
                              name={f.name} 
                              placeholder={f.placeholder} 
                              className="focus:ring-2 focus:ring-primary/20"
                              ref={(el) => (formRefs.current[f.name] = el)}
                              onChange={(e) => handleFormChange(f.name, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </fieldset>

                    <div className="pt-4 border-t space-y-4">
                      <div className="space-y-2">
                        <Label>Modelo Ollama</Label>
                        <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="llama3, mistral..." className="focus:ring-2 focus:ring-primary/20" />
                      </div>
                      
                      <Button type="submit" disabled={loading} className="w-full h-12 text-base font-medium">
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Gerando documento...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Gerar {def.label}
                          </>
                        )}
                      </Button>
                      
                      {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                          <strong>Erro:</strong> {error}
                        </div>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Assistente IA - Sidebar */}
            {showAIAssistant && (
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <DocumentAIAssistant
                    documentType={type as DocumentType}
                    formData={formData}
                    onSuggestionApply={handleAISuggestionApply}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NewDocument;