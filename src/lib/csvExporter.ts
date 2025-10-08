import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";

// Converte array de objetos para CSV
function convertToCSV(data: any[], tableName: string): string {
  if (!data || data.length === 0) {
    return `${tableName},Sem dados disponíveis\n`;
  }

  // Pega todas as colunas únicas
  const headers = Array.from(
    new Set(data.flatMap(obj => Object.keys(obj)))
  );

  // Cria header
  let csv = headers.join(",") + "\n";

  // Cria linhas
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      
      // Trata valores especiais
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      if (typeof value === "string" && value.includes(",")) return `"${value.replace(/"/g, '""')}"`;
      
      return value;
    });
    csv += values.join(",") + "\n";
  });

  return csv;
}

export async function exportAllDataToZip(): Promise<Blob> {
  const zip = new JSZip();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  // Lista de tabelas para exportar
  const tables = [
    { name: "lake_items", query: supabase.from("lake_items").select("*").eq("user_id", userId) },
    { name: "document_knowledge", query: supabase.from("document_knowledge").select("*").eq("user_id", userId) },
    { name: "ai_data_lake_expertise", query: supabase.from("ai_data_lake_expertise").select("*").eq("user_id", userId) },
    { name: "ai_specialist_conversations", query: supabase.from("ai_specialist_conversations").select("*").eq("user_id", userId) },
    { name: "documentos_memorial", query: supabase.from("documentos_memorial").select("*").eq("user_id", userId) },
    { name: "documentos_folha_dados", query: supabase.from("documentos_folha_dados").select("*").eq("user_id", userId) },
    { name: "documentos_especificacao", query: supabase.from("documentos_especificacao").select("*").eq("uploader", userId) }
  ];

  // Exporta cada tabela
  for (const table of tables) {
    try {
      const { data, error } = await table.query;
      
      if (error) {
        console.error(`Erro ao exportar ${table.name}:`, error);
        zip.file(`${table.name}.csv`, `Erro ao exportar: ${error.message}\n`);
        continue;
      }

      const csv = convertToCSV(data || [], table.name);
      zip.file(`${table.name}.csv`, csv);
    } catch (err) {
      console.error(`Erro ao processar ${table.name}:`, err);
      zip.file(`${table.name}.csv`, `Erro ao processar tabela\n`);
    }
  }

  // Adiciona arquivo README
  const readme = `Exportação de Dados - MinerDocs
================================
Data da exportação: ${new Date().toLocaleString("pt-BR")}
User ID: ${userId}

Tabelas exportadas:
- lake_items: Documentos do Data Lake
- document_knowledge: Conhecimento extraído dos documentos
- ai_data_lake_expertise: Expertise gerada pela IA
- ai_specialist_conversations: Conversas com o especialista IA
- documentos_memorial: Memoriais descritivos
- documentos_folha_dados: Folhas de dados técnicas
- documentos_especificacao: Especificações técnicas

Formato: CSV (Comma-Separated Values)
Encoding: UTF-8
`;

  zip.file("README.txt", readme);

  // Gera o ZIP
  return await zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
