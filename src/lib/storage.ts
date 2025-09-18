import { DocumentRecord } from "@/types";

const KEY = "minerdocs_v1";

type Store = { docs: DocumentRecord[] };

function readStore(): Store {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { docs: [] };
  try {
    return JSON.parse(raw) as Store;
  } catch {
    return { docs: [] };
  }
}

function writeStore(data: Store) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function listDocuments(userId?: string | null): DocumentRecord[] {
  const s = readStore();
  return s.docs
    .filter((d) => (userId ? d.userId === userId : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertDocument(doc: DocumentRecord) {
  const s = readStore();
  const idx = s.docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) s.docs[idx] = doc; else s.docs.push(doc);
  writeStore(s);
}

export function getDocument(id: string): DocumentRecord | undefined {
  const s = readStore();
  return s.docs.find((d) => d.id === id);
}

export function deleteDocument(id: string): boolean {
  const s = readStore();
  const initialLength = s.docs.length;
  s.docs = s.docs.filter((d) => d.id !== id);
  const wasDeleted = s.docs.length < initialLength;
  if (wasDeleted) {
    writeStore(s);
  }
  return wasDeleted;
}
