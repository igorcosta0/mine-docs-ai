import { supabase } from "@/integrations/supabase/client";

export type DocumentType = 'especificacao_tecnica';
export type DocumentStatus = 'ingested' | 'processing' | 'error';

export interface Document {
  id: string;
  doc_type: DocumentType;
  doc_number: string;
  rev: string;
  title: string;
  customer?: string;
  project?: string;
  contractor?: string;
  issue_date?: string;
  classification?: string;
  disciplines?: string[];
  norms?: string[];
  location?: string;
  figures_tables?: string[];
  extra: Record<string, any>;
  storage_path: string;
  checksum_sha256: string;
  status: DocumentStatus;
  uploader: string;
  created_at: string;
  updated_at: string;
}

export interface IngestDocumentParams {
  file: File;
  doc_type: DocumentType;
  doc_number: string;
  rev: string;
  title: string;
  customer?: string;
  project?: string;
  contractor?: string;
  issue_date?: string;
  classification?: string;
  disciplines?: string[];
  norms?: string[];
  location?: string;
  figures_tables?: string[];
  extra?: Record<string, any>;
  overwrite?: boolean;
}

export interface SearchParams {
  doc_type?: DocumentType;
  doc_number?: string;
  rev?: string;
  issue_date_from?: string;
  issue_date_to?: string;
  text?: string;
}

export async function ingestDocument(params: IngestDocumentParams): Promise<{
  id: string;
  storage_path: string;
  checksum_sha256: string;
  status: DocumentStatus;
} | { error: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'User not authenticated' };
    }

    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('doc_type', params.doc_type);
    formData.append('doc_number', params.doc_number);
    formData.append('rev', params.rev);
    formData.append('title', params.title);
    
    if (params.customer) formData.append('customer', params.customer);
    if (params.project) formData.append('project', params.project);
    if (params.contractor) formData.append('contractor', params.contractor);
    if (params.issue_date) formData.append('issue_date', params.issue_date);
    if (params.classification) formData.append('classification', params.classification);
    if (params.location) formData.append('location', params.location);
    
    if (params.disciplines) formData.append('disciplines', JSON.stringify(params.disciplines));
    if (params.norms) formData.append('norms', JSON.stringify(params.norms));
    if (params.figures_tables) formData.append('figures_tables', JSON.stringify(params.figures_tables));
    if (params.extra) formData.append('extra', JSON.stringify(params.extra));

    const url = new URL(`https://injihzgvpbnzwswshigt.supabase.co/functions/v1/ingest-pdf`);
    if (params.overwrite) {
      url.searchParams.set('overwrite', 'true');
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to ingest document' };
    }

    return result;
  } catch (error) {
    console.error('Error ingesting document:', error);
    return { error: 'Network error' };
  }
}

export async function getDocument(id: string): Promise<Document | { error: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'User not authenticated' };
    }

    const response = await fetch(
      `https://injihzgvpbnzwswshigt.supabase.co/functions/v1/docs-api/docs/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to get document' };
    }

    return result;
  } catch (error) {
    console.error('Error getting document:', error);
    return { error: 'Network error' };
  }
}

export async function searchDocuments(params: SearchParams = {}): Promise<Document[] | { error: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'User not authenticated' };
    }

    const url = new URL(`https://injihzgvpbnzwswshigt.supabase.co/functions/v1/docs-api/docs/search`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value.toString());
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to search documents' };
    }

    return result;
  } catch (error) {
    console.error('Error searching documents:', error);
    return { error: 'Network error' };
  }
}

export async function getDocumentDownloadUrl(id: string): Promise<{ download_url: string } | { error: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'User not authenticated' };
    }

    const response = await fetch(
      `https://injihzgvpbnzwswshigt.supabase.co/functions/v1/docs-api/docs/${id}/download`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to get download URL' };
    }

    return result;
  } catch (error) {
    console.error('Error getting download URL:', error);
    return { error: 'Network error' };
  }
}