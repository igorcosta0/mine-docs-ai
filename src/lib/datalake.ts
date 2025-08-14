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
  equipment_model: string | null;
  manufacturer: string | null;
  year: number | null;
  norm_source: string | null;
  description: string | null;
  serial_number: string | null;
  plant_unit: string | null;
  system_area: string | null;
  revision_version: string | null;
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
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return { items: [], error: error.message };
  return { items: (data as LakeItem[]) ?? [] };
}

export type UploadLakeFileOptions = {
  title: string;
  tags?: string[];
  docType?: string | null;
  equipmentModel?: string;
  manufacturer?: string;
  year?: number;
  normSource?: string;
  description?: string;
  serialNumber?: string;
  plantUnit?: string;
  systemArea?: string;
  revisionVersion?: string;
};

export async function uploadLakeFile(
  file: File,
  opts: UploadLakeFileOptions
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
    equipment_model: opts.equipmentModel ?? null,
    manufacturer: opts.manufacturer ?? null,
    year: opts.year ?? null,
    norm_source: opts.normSource ?? null,
    description: opts.description ?? null,
    serial_number: opts.serialNumber ?? null,
    plant_unit: opts.plantUnit ?? null,
    system_area: opts.systemArea ?? null,
    revision_version: opts.revisionVersion ?? null,
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
