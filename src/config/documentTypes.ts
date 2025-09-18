import { BaseFields, DocumentType } from "@/types";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number";
  placeholder?: string;
};

export const DOC_TYPES: Record<
  DocumentType,
  { label: string; description: string; technical: FieldDef[] }
> = {
  "especificacao": {
    label: "Especificação Técnica",
    description: "Documento técnico que define requisitos, tolerâncias e critérios de aceitação para projetos industriais",
    technical: [
      { name: "requisitos", label: "Requisitos Técnicos", type: "textarea", placeholder: "Requisitos de desempenho, materiais, segurança..." },
      { name: "tolerancias", label: "Tolerâncias", type: "textarea", placeholder: "Tolerâncias dimensionais e operacionais" },
    ],
  },
  "folha-dados": {
    label: "Folha de Dados",
    description: "Documento com especificações técnicas detalhadas de equipamentos e materiais",
    technical: [
      { name: "material", label: "Material", type: "text", placeholder: "Aço ASTM A36, Inox 304..." },
      { name: "dimensoes", label: "Dimensões", type: "text", placeholder: "Comprimento x Largura x Altura / DN / espessura" },
      { name: "capacidade", label: "Capacidade", type: "text", placeholder: "Ex.: 500 tph, 200 m³, 45 kW" },
    ],
  },
  "memorial": {
    label: "Memorial Descritivo",
    description: "Documento que descreve metodologias, justificativas técnicas e escopo do projeto",
    technical: [
      { name: "metodologia", label: "Metodologia", type: "textarea", placeholder: "Procedimentos, etapas, premissas" },
      { name: "justificativas", label: "Justificativas Técnicas", type: "textarea", placeholder: "Critérios de projeto, alternativas avaliadas" },
      { name: "escopo", label: "Escopo", type: "textarea", placeholder: "Delimitação do fornecimento e interfaces" },
    ],
  },
};

export function buildPrompt(
  tipo: DocumentType,
  base: BaseFields,
  technical: Record<string, string>
) {
  const header = `Gere um documento de ${DOC_TYPES[tipo].label} para engenharia de projetos industriais (mineração).
Saída em português técnico, estruturada com seções, listas e tabelas quando apropriado.
Seja objetivo e coerente com dados fornecidos. Evite alucinações.`;

  const baseBlock = `Dados gerais:\n- Título: ${base.titulo}\n- Autor: ${base.autor}\n- Data: ${base.data}\n- Normas aplicáveis: ${base.normas}\n- Descrição do projeto: ${base.descricao}`;

  const techBlock = Object.entries(technical)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const extras =
    tipo === "especificacao"
      ? "Inclua requisitos técnicos, critérios de aceitação, inspeção e testes, instalação, operação e manutenção."
      : tipo === "folha-dados"
      ? "Estruture campos chave em formato de tabela quando possível."
      : "Inclua contexto, objetivos, metodologias, justificativas técnicas e escopo detalhado.";

  return `${header}\n\n${baseBlock}\n\nDados técnicos:\n${techBlock}\n\nInstruções adicionais: ${extras}`;
}
