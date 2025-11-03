import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseUser, listLakeItems, type LakeItem } from "@/lib/datalake";
import { Database, Upload, FileText, Sparkles, Brain, Activity, Download } from "lucide-react";
import UploadForm from "@/components/datalake/UploadForm";
import ItemsTable from "@/components/datalake/ItemsTable";

import { AISpecialistPanel } from "@/components/ai/AISpecialistPanel";
import { DataLakeAIAssistant } from "@/components/ai/DataLakeAIAssistant";
import { checkOllama } from "@/lib/ollama";
import { exportAllDataToZip, downloadBlob } from "@/lib/csvExporter";
import { downloadKnowledgeJSON, downloadKnowledgeZIP } from "@/lib/knowledgeExporter";

const DataLake = () => {
  const { toast } = useToast();
  const [supaUserId, setSupaUserId] = useState<string | null>(null);
  const [items, setItems] = useState<LakeItem[]>([]);
  const [ollamaOk, setOllamaOk] = useState<boolean>(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    document.title = "Data Lake — MinerDocs";
    refresh();
    checkOllama().then(setOllamaOk);
  }, []);

  async function refresh() {
    const user = await getSupabaseUser();
    setSupaUserId(user?.id ?? null);
    const { items, error } = await listLakeItems();
    if (error) {
      toast({ title: "Aviso", description: error });
    }
    setItems(items);
  }

  async function handleExport() {
    if (!supaUserId) {
      toast({
        title: "Login necessário",
        description: "Faça login para exportar seus dados",
        variant: "destructive"
      });
      return;
    }

    setExporting(true);
    try {
      const zipBlob = await exportAllDataToZip();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      downloadBlob(zipBlob, `minerdocs-export-${timestamp}.zip`);
      
      toast({
        title: "Exportação concluída!",
        description: "Todos os dados foram exportados em CSV"
      });
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleExportKnowledgeJSON() {
    if (!supaUserId) {
      toast({
        title: "Login necessário",
        description: "Faça login para exportar conhecimento",
        variant: "destructive"
      });
      return;
    }

    try {
      await downloadKnowledgeJSON();
      toast({
        title: "Conhecimento exportado!",
        description: "Arquivo JSON com todo conhecimento da IA foi baixado."
      });
    } catch (error) {
      console.error("Erro ao exportar conhecimento:", error);
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  }

  async function handleExportKnowledgeZIP() {
    if (!supaUserId) {
      toast({
        title: "Login necessário",
        description: "Faça login para exportar conhecimento",
        variant: "destructive"
      });
      return;
    }

    try {
      await downloadKnowledgeZIP();
      toast({
        title: "Conhecimento exportado!",
        description: "ZIP completo com todo conhecimento da IA foi baixado."
      });
    } catch (error) {
      console.error("Erro ao exportar conhecimento:", error);
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Database className="h-4 w-4" />
              Repositório Inteligente
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Data Lake
              <span className="text-primary block">Técnico</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Repositório inteligente de documentos técnicos para referência e análise na geração de novos documentos
            </p>
            
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="flex items-center justify-center gap-4">
                <Badge variant={supaUserId ? "default" : "secondary"} className="px-4 py-2">
                  <Upload className="h-4 w-4 mr-2" />
                  {supaUserId ? "Upload Ativo" : "Login Necessário"}
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <FileText className="h-4 w-4 mr-2" />
                  {items.length} documentos
                </Badge>
                <Badge variant={ollamaOk ? "default" : "secondary"} className="px-4 py-2">
                  <Activity className="h-4 w-4 mr-2" />
                  IA: {ollamaOk ? "Disponível" : "Offline"}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  onClick={handleExport}
                  disabled={!supaUserId || exporting}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Download className="h-5 w-5" />
                  {exporting ? "Exportando..." : "Exportar Dados (CSV)"}
                </Button>
                
                <Button 
                  onClick={handleExportKnowledgeJSON}
                  disabled={!supaUserId || items.length === 0}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Brain className="h-5 w-5" />
                  Exportar Conhecimento (JSON)
                </Button>
                
                <Button 
                  onClick={handleExportKnowledgeZIP}
                  disabled={!supaUserId || items.length === 0}
                  variant="default"
                  size="lg"
                  className="gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Exportar Conhecimento (ZIP)
                </Button>
              </div>
            </div>
          </div>
        </section>

        {!supaUserId && (
          <Card className="max-w-2xl mx-auto border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Sparkles className="h-5 w-5" />
                Autenticação Necessária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700">
                Para fazer upload e gerenciar documentos com segurança, é necessário estar autenticado.
                O sistema usa Row Level Security (RLS) para proteger seus dados.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="management" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Gerenciamento
              </TabsTrigger>
              <TabsTrigger value="ai-specialist" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                IA Especialista
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="management" className="space-y-6">
              <div className="grid lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <UploadForm 
                    onSuccess={refresh} 
                    canUpload={!!supaUserId} 
                  />
                </div>
                
                <div className="lg:col-span-3">
                  <ItemsTable 
                    items={items} 
                    onRefresh={refresh} 
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai-specialist">
              {supaUserId ? (
                <DataLakeAIAssistant documents={items} onRefresh={refresh} />
              ) : (
                <Card className="max-w-2xl mx-auto border-amber-200 bg-amber-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <Brain className="h-5 w-5" />
                      Assistente IA Indisponível
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-amber-700">
                      Para usar o Assistente IA do Data Lake, é necessário estar autenticado.
                      Faça login para acessar análises avançadas e consultas especializadas.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default DataLake;
