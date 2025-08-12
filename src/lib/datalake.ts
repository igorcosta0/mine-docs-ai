import { supabase } from "@/integrations/supabase/client";

export type LakeItem = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  file_path: string;
  title: string;
  doc_type: string | null;
};

export async function getSupabaseUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function listLakeItems(): Promise<{ items: LakeItem[]; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { items: [], error: "Usuário do Supabase não autenticado." };
  }
  const { data, error } = await supabase
    .from("lake_items")
    .select("id,user_id,created_at,updated_at,tags,file_path,title,doc_type")
    .order("updated_at", { ascending: false });
  if (error) return { items: [], error: error.message };
  return { items: (data as LakeItem[]) ?? [] };
}

export async function uploadLakeFile(
  file: File,
  opts: { title: string; tags?: string[]; docType?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Faça login no Supabase para enviar arquivos." };

  const ext = file.name.split(".").pop() || "bin";
  const fileId = crypto.randomUUID();
  const path = `${user.id}/${fileId}.${ext}`;

  const { error: upErr } = await supabase.storage.from("datalake").upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: insErr } = await supabase.from("lake_items").insert({
    user_id: user.id,
    file_path: path,
    title: opts.title || file.name,
    tags: opts.tags ?? [],
    doc_type: opts.docType ?? null,
  });
  if (insErr) return { ok: false, error: insErr.message };
  return { ok: true };
}

export async function deleteLakeItem(item: LakeItem): Promise<{ ok: boolean; error?: string }> {
  // Delete row first (RLS checks ownership)
  const { error: delErr } = await supabase.from("lake_items").delete().eq("id", item.id);
  if (delErr) return { ok: false, error: delErr.message };

  // Then delete file (path-scoped by user folder)
  const { error: fileErr } = await supabase.storage.from("datalake").remove([item.file_path]);
  if (fileErr) return { ok: false, error: fileErr.message };

  return { ok: true };
}
