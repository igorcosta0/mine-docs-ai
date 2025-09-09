import { supabase } from "@/integrations/supabase/client";
import { DocumentType } from "@/types";

// Interfaces para cada tipo de documento
export interface EspecificacaoTecnica {
  id?: string;
  user_id?: string;
  titulo: string;
  autor?: string;
  data?: string;
  normas?: string;
  descricao?: string;
  escopo?: string;
  materiais?: Record<string, any>;
  dimensoes?: Record<string, any>;
  tolerancias?: string;
  acabamento?: string;
  ensaios?: string;
  conteudo: string;
  created_at?: string;
  updated_at?: string;
}

export interface FolhaDados {
  id?: string;
  user_id?: string;
  titulo: string;
  autor?: string;
  data?: string;
  normas?: string;
  descricao?: string;
  equipamento?: string;
  modelo?: string;
  fabricante?: string;
  parametros_operacionais?: Record<string, any>;
  caracteristicas_tecnicas?: Record<string, any>;
  capacidade?: string;
  potencia?: string;
  voltagem?: string;
  conteudo: string;
  created_at?: string;
  updated_at?: string;
}

export interface MemorialDescritivo {
  id?: string;
  user_id?: string;
  titulo: string;
  autor?: string;
  data?: string;
  normas?: string;
  descricao?: string;
  projeto_referencia?: string;
  localização?: string;
  objetivo?: string;
  metodologia?: string;
  cronograma?: Record<string, any>;
  recursos?: Record<string, any>;
  responsaveis?: Record<string, any>;
  conteudo: string;
  created_at?: string;
  updated_at?: string;
}

type DocumentData = EspecificacaoTecnica | FolhaDados | MemorialDescritivo;

// ===== ESPECIFICAÇÕES TÉCNICAS =====
export const especificacaoService = {
  async list(): Promise<EspecificacaoTecnica[]> {
    const { data, error } = await supabase
      .from('documentos_especificacao')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as EspecificacaoTecnica[];
  },

  async getById(id: string): Promise<EspecificacaoTecnica | null> {
    const { data, error } = await supabase
      .from('documentos_especificacao')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as EspecificacaoTecnica | null;
  },

  async create(documento: Omit<EspecificacaoTecnica, 'id' | 'created_at' | 'updated_at'>): Promise<EspecificacaoTecnica> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('documentos_especificacao')
      .insert([{ ...documento, user_id: userData.user.id }])
      .select()
      .single();

    if (error) throw error;
    return data as EspecificacaoTecnica;
  },

  async update(id: string, updates: Partial<Omit<EspecificacaoTecnica, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<EspecificacaoTecnica> {
    const { data, error } = await supabase
      .from('documentos_especificacao')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as EspecificacaoTecnica;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documentos_especificacao')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ===== FOLHAS DE DADOS =====
export const folhaDadosService = {
  async list(): Promise<FolhaDados[]> {
    const { data, error } = await supabase
      .from('documentos_folha_dados')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as FolhaDados[];
  },

  async getById(id: string): Promise<FolhaDados | null> {
    const { data, error } = await supabase
      .from('documentos_folha_dados')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as FolhaDados | null;
  },

  async create(documento: Omit<FolhaDados, 'id' | 'created_at' | 'updated_at'>): Promise<FolhaDados> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('documentos_folha_dados')
      .insert([{ ...documento, user_id: userData.user.id }])
      .select()
      .single();

    if (error) throw error;
    return data as FolhaDados;
  },

  async update(id: string, updates: Partial<Omit<FolhaDados, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<FolhaDados> {
    const { data, error } = await supabase
      .from('documentos_folha_dados')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FolhaDados;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documentos_folha_dados')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ===== MEMORIAIS DESCRITIVOS =====
export const memorialService = {
  async list(): Promise<MemorialDescritivo[]> {
    const { data, error } = await supabase
      .from('documentos_memorial')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as MemorialDescritivo[];
  },

  async getById(id: string): Promise<MemorialDescritivo | null> {
    const { data, error } = await supabase
      .from('documentos_memorial')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as MemorialDescritivo | null;
  },

  async create(documento: Omit<MemorialDescritivo, 'id' | 'created_at' | 'updated_at'>): Promise<MemorialDescritivo> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('documentos_memorial')
      .insert([{ ...documento, user_id: userData.user.id }])
      .select()
      .single();

    if (error) throw error;
    return data as MemorialDescritivo;
  },

  async update(id: string, updates: Partial<Omit<MemorialDescritivo, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<MemorialDescritivo> {
    const { data, error } = await supabase
      .from('documentos_memorial')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MemorialDescritivo;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documentos_memorial')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ===== FUNÇÕES GENÉRICAS =====
export function getDocumentService(tipo: DocumentType) {
  switch (tipo) {
    case 'especificacao':
      return especificacaoService;
    case 'folha-dados':
      return folhaDadosService;
    case 'memorial':
      return memorialService;
    default:
      throw new Error(`Tipo de documento não suportado: ${tipo}`);
  }
}

// Funções de conveniência para compatibilidade
export async function listDocumentsByType<T extends DocumentData>(tipo: DocumentType): Promise<T[]> {
  const service = getDocumentService(tipo);
  return service.list() as Promise<T[]>;
}

export async function getDocumentByType<T extends DocumentData>(tipo: DocumentType, id: string): Promise<T | null> {
  const service = getDocumentService(tipo);
  return service.getById(id) as Promise<T | null>;
}

export async function createDocument<T extends DocumentData>(
  tipo: DocumentType,
  documento: Omit<T, 'id' | 'created_at' | 'updated_at'>
): Promise<T> {
  const service = getDocumentService(tipo);
  return service.create(documento as any) as Promise<T>;
}

export async function updateDocument<T extends DocumentData>(
  tipo: DocumentType,
  id: string,
  updates: Partial<Omit<T, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<T> {
  const service = getDocumentService(tipo);
  return service.update(id, updates as any) as Promise<T>;
}

export async function deleteDocument(tipo: DocumentType, id: string): Promise<void> {
  const service = getDocumentService(tipo);
  return service.delete(id);
}