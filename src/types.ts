export type DocumentType = "especificacao" | "folha-dados" | "memorial";

export interface BaseFields {
  titulo: string;
  autor: string;
  data: string;
  normas: string;
  descricao: string;
}

export interface DocumentRecord {
  id: string;
  userId?: string | null;
  tipo: DocumentType;
  titulo: string;
  conteudo: string;
  createdAt: string;
  updatedAt: string;
}
