import { useEffect, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseUser, listLakeItems, type LakeItem } from "@/lib/datalake";
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
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <div className="card-elegant rounded-xl p-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              Data Lake Técnico
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Repositório inteligente de documentos técnicos para referência e análise na geração de novos documentos
            </p>
          </div>
        </header>

        {!supaUserId && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Autenticação Supabase necessária</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Para gravar e listar itens com segurança via RLS, é necessário ativar o login do Supabase no app.
                Posso implementar agora (e-mail OTP, magic link, OAuth). Diga-me sua preferência.
              </p>
            </CardContent>
          </Card>
        )}

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
      </main>
    </div>
  );
};

export default DataLake;
