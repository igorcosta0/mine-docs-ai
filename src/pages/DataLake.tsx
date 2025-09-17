import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseUser, listLakeItems, type LakeItem } from "@/lib/datalake";
import { Database, Upload, FileText, Sparkles } from "lucide-react";
import UploadForm from "@/components/datalake/UploadForm";
import ItemsTable from "@/components/datalake/ItemsTable";

const DataLake = () => {
  const { toast } = useToast();
  const [supaUserId, setSupaUserId] = useState<string | null>(null);
  const [items, setItems] = useState<LakeItem[]>([]);

  useEffect(() => {
    document.title = "Data Lake — MinerDocs";
    refresh();
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
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <Badge variant={supaUserId ? "default" : "secondary"} className="px-4 py-2">
                <Upload className="h-4 w-4 mr-2" />
                {supaUserId ? "Upload Ativo" : "Login Necessário"}
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <FileText className="h-4 w-4 mr-2" />
                {items.length} documentos
              </Badge>
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
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
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
        </div>
      </div>
    </AppLayout>
  );
};

export default DataLake;
