import { supabase } from "@/integrations/supabase/client";
import { LakeItem } from "./datalake";

// Função para calcular SHA-256 hash de um arquivo
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Verificar se já existe um arquivo com o mesmo hash
export async function checkForDuplicates(
  fileHash: string, 
  excludeId?: string
): Promise<{ isDuplicate: boolean; duplicates: LakeItem[]; error?: string }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { isDuplicate: false, duplicates: [], error: "Usuário não autenticado" };
    }

    let query = supabase
      .from("lake_items")
      .select("*")
      .eq("user_id", userData.user.id)
      .eq("checksum_sha256", fileHash);
    
    // Excluir um ID específico da busca (útil para atualizações)
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;
    
    if (error) {
      return { isDuplicate: false, duplicates: [], error: error.message };
    }

    const duplicates = (data as LakeItem[]) || [];
    return {
      isDuplicate: duplicates.length > 0,
      duplicates,
      error: undefined
    };
  } catch (error) {
    console.error('Erro ao verificar duplicatas:', error);
    return { 
      isDuplicate: false, 
      duplicates: [], 
      error: 'Erro interno ao verificar duplicatas' 
    };
  }
}

// Buscar documentos similares por nome e tamanho (fallback para arquivos sem hash)
export async function findSimilarDocuments(
  fileName: string, 
  fileSize: number,
  excludeId?: string
): Promise<{ similar: LakeItem[]; error?: string }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { similar: [], error: "Usuário não autenticado" };
    }

    // Buscar por título similar (removendo extensões e normalizando)
    const baseName = fileName.replace(/\.[^/.]+$/, "").toLowerCase();
    
    let query = supabase
      .from("lake_items")
      .select("*")
      .eq("user_id", userData.user.id)
      .ilike("title", `%${baseName}%`);
    
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.limit(10);
    
    if (error) {
      return { similar: [], error: error.message };
    }

    return {
      similar: (data as LakeItem[]) || [],
      error: undefined
    };
  } catch (error) {
    console.error('Erro ao buscar documentos similares:', error);
    return { 
      similar: [], 
      error: 'Erro interno ao buscar documentos similares' 
    };
  }
}

export type DuplicateAction = 'replace' | 'keep_both' | 'cancel';

export interface DuplicateCheckResult {
  hasExactDuplicate: boolean;
  hasSimilar: boolean;
  duplicates: LakeItem[];
  similar: LakeItem[];
  fileHash: string;
}

// Verificação completa de duplicatas e documentos similares
export async function performDuplicateCheck(
  file: File,
  excludeId?: string
): Promise<{ result: DuplicateCheckResult; error?: string }> {
  try {
    // Calcular hash do arquivo
    const fileHash = await calculateFileHash(file);
    
    // Verificar duplicatas exatas por hash
    const duplicateCheck = await checkForDuplicates(fileHash, excludeId);
    if (duplicateCheck.error) {
      return { result: null as any, error: duplicateCheck.error };
    }
    
    // Buscar documentos similares por nome
    const similarCheck = await findSimilarDocuments(file.name, file.size, excludeId);
    if (similarCheck.error) {
      return { result: null as any, error: similarCheck.error };
    }
    
    const result: DuplicateCheckResult = {
      hasExactDuplicate: duplicateCheck.isDuplicate,
      hasSimilar: similarCheck.similar.length > 0,
      duplicates: duplicateCheck.duplicates,
      similar: similarCheck.similar,
      fileHash
    };
    
    return { result, error: undefined };
  } catch (error) {
    console.error('Erro na verificação completa de duplicatas:', error);
    return { 
      result: null as any, 
      error: 'Erro ao verificar duplicatas do arquivo' 
    };
  }
}