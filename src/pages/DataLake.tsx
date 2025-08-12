import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { deleteLakeItem, getSupabaseUser, listLakeItems, uploadLakeFile, type LakeItem } from "@/lib/datalake";

const DataLake = () => {
  const { toast } = useToast();
  const [supaUserId, setSupaUserId] = useState<string | null>(null);
  const [items, setItems] = useState<LakeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    document.title = "Data Lake — MinerDocs";
    refresh();
  }, []);

  async function refresh() {
    const user = await getSupabaseUser();
    setSupaUserId(user?.id ?? null);
    const { items, error } = await listLakeItems();
    if (error) {
      // Non-blocking; just show message
      toast({ title: "Aviso", description: error });
    }
    setItems(items);
  }

  const canUpload = useMemo(() => !!supaUserId && !!file && (title || file?.name), [supaUserId, file, title]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const { ok, error } = await uploadLakeFile(file, { title: title || file.name, docType: docType || null });
    setLoading(false);
    if (!ok) {
      toast({ title: "Falha no upload", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Arquivo enviado", description: "Item adicionado ao Data Lake." });
    setTitle("");
    setDocType("");
    setFile(null);
    await refresh();
  }

  async function onDelete(it: LakeItem) {
    const confirmed = window.confirm("Remover item e arquivo do Data Lake?");
    if (!confirmed) return;
    const { ok, error } = await deleteLakeItem(it);
    if (!ok) {
      toast({ title: "Erro ao remover", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Item removido" });
    await refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Data Lake</h1>
          <p className="text-muted-foreground">Envie arquivos privados para o bucket seguro do Supabase e catalogue-os.</p>
        </header>

        {!supaUserId && (
          <Card className="mb-6">
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

        <section className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Novo upload</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do arquivo" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo do documento (opcional)</Label>
                  <Input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="ex.: desenho, especificacao, anexo" />
                </div>
                <div className="space-y-2">
                  <Label>Arquivo</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                <Button type="submit" variant="hero" disabled={!canUpload || loading}>
                  {loading ? "Enviando..." : "Enviar"}
                </Button>
                {!supaUserId && (
                  <p className="text-xs text-muted-foreground">Faça login no Supabase para habilitar o upload.</p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Seus itens</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Atualizado</TableHead>
                        <TableHead className="w-[1%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-medium">{it.title}</TableCell>
                          <TableCell>{it.doc_type || "—"}</TableCell>
                          <TableCell>{new Date(it.updated_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button size="sm" variant="secondary" onClick={() => onDelete(it)}>Remover</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default DataLake;
