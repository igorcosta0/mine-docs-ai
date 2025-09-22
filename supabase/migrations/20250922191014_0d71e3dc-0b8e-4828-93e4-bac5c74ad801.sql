-- Criar tabela para embeddings de documentos do Data Lake
CREATE TABLE public.document_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  chunk_id INTEGER NOT NULL,
  content_chunk TEXT NOT NULL,
  embedding VECTOR(1536), -- Para embeddings OpenAI
  chunk_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own embeddings" 
ON public.document_embeddings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own embeddings" 
ON public.document_embeddings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings" 
ON public.document_embeddings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings" 
ON public.document_embeddings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para timestamps
CREATE TRIGGER update_document_embeddings_updated_at
BEFORE UPDATE ON public.document_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para otimização
CREATE INDEX idx_document_embeddings_user_id ON public.document_embeddings(user_id);
CREATE INDEX idx_document_embeddings_document_id ON public.document_embeddings(document_id);

-- Tabela para especialização da IA em Data Lake
CREATE TABLE public.ai_data_lake_expertise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expertise_area TEXT NOT NULL,
  knowledge_summary TEXT NOT NULL,
  document_count INTEGER DEFAULT 0,
  confidence_level DECIMAL(3,2) DEFAULT 0.0,
  last_training TIMESTAMP WITH TIME ZONE DEFAULT now(),
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ai_data_lake_expertise ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own AI expertise" 
ON public.ai_data_lake_expertise 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI expertise" 
ON public.ai_data_lake_expertise 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI expertise" 
ON public.ai_data_lake_expertise 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI expertise" 
ON public.ai_data_lake_expertise 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para timestamps
CREATE TRIGGER update_ai_data_lake_expertise_updated_at
BEFORE UPDATE ON public.ai_data_lake_expertise
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_ai_expertise_user_id ON public.ai_data_lake_expertise(user_id);
CREATE INDEX idx_ai_expertise_area ON public.ai_data_lake_expertise(expertise_area);