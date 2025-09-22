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

-- Tabela para conversas especializadas da IA
CREATE TABLE public.ai_specialist_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_type TEXT NOT NULL, -- 'data_lake_analysis', 'document_creation', 'expertise_consultation'
  context_data JSONB DEFAULT '{}',
  messages JSONB DEFAULT '[]',
  specialist_insights JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ai_specialist_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own AI conversations" 
ON public.ai_specialist_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI conversations" 
ON public.ai_specialist_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI conversations" 
ON public.ai_specialist_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI conversations" 
ON public.ai_specialist_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para timestamps
CREATE TRIGGER update_ai_specialist_conversations_updated_at
BEFORE UPDATE ON public.ai_specialist_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();