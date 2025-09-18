-- Create table to store extracted knowledge from documents
CREATE TABLE public.document_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_document_id UUID REFERENCES public.lake_items(id) ON DELETE CASCADE,
  knowledge_type TEXT NOT NULL, -- 'concept', 'procedure', 'standard', 'specification', 'example'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  document_type TEXT, -- type of the original document
  technical_area TEXT, -- mechanical, electrical, civil, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own knowledge"
ON public.document_knowledge
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own knowledge"
ON public.document_knowledge
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge"
ON public.document_knowledge
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge"
ON public.document_knowledge
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_document_knowledge_user_id ON public.document_knowledge(user_id);
CREATE INDEX idx_document_knowledge_type ON public.document_knowledge(knowledge_type);
CREATE INDEX idx_document_knowledge_area ON public.document_knowledge(technical_area);
CREATE INDEX idx_document_knowledge_keywords ON public.document_knowledge USING GIN(keywords);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_document_knowledge_updated_at
BEFORE UPDATE ON public.document_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();