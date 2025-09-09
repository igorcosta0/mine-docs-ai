-- Criar tabelas separadas para cada tipo de documento de engenharia

-- Tabela para Especificações Técnicas
CREATE TABLE public.documentos_especificacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  autor TEXT,
  data DATE,
  normas TEXT,
  descricao TEXT,
  -- Campos específicos para especificações
  escopo TEXT,
  materiais JSONB,
  dimensoes JSONB,
  tolerancias TEXT,
  acabamento TEXT,
  ensaios TEXT,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Folhas de Dados
CREATE TABLE public.documentos_folha_dados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  autor TEXT,
  data DATE,
  normas TEXT,
  descricao TEXT,
  -- Campos específicos para folha de dados
  equipamento TEXT,
  modelo TEXT,
  fabricante TEXT,
  parametros_operacionais JSONB,
  caracteristicas_tecnicas JSONB,
  capacidade TEXT,
  potencia TEXT,
  voltagem TEXT,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Memorial Descritivo
CREATE TABLE public.documentos_memorial (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  autor TEXT,
  data DATE,
  normas TEXT,
  descricao TEXT,
  -- Campos específicos para memorial descritivo
  projeto_referencia TEXT,
  localização TEXT,
  objetivo TEXT,
  metodologia TEXT,
  cronograma JSONB,
  recursos JSONB,
  responsaveis JSONB,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.documentos_especificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_folha_dados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_memorial ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para documentos_especificacao
CREATE POLICY "Usuários podem ver suas próprias especificações" 
ON public.documentos_especificacao 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias especificações" 
ON public.documentos_especificacao 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias especificações" 
ON public.documentos_especificacao 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias especificações" 
ON public.documentos_especificacao 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para documentos_folha_dados
CREATE POLICY "Usuários podem ver suas próprias folhas de dados" 
ON public.documentos_folha_dados 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias folhas de dados" 
ON public.documentos_folha_dados 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias folhas de dados" 
ON public.documentos_folha_dados 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias folhas de dados" 
ON public.documentos_folha_dados 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para documentos_memorial
CREATE POLICY "Usuários podem ver seus próprios memoriais" 
ON public.documentos_memorial 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios memoriais" 
ON public.documentos_memorial 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios memoriais" 
ON public.documentos_memorial 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios memoriais" 
ON public.documentos_memorial 
FOR DELETE 
USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_documentos_especificacao_updated_at
BEFORE UPDATE ON public.documentos_especificacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_folha_dados_updated_at
BEFORE UPDATE ON public.documentos_folha_dados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_memorial_updated_at
BEFORE UPDATE ON public.documentos_memorial
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_documentos_especificacao_user_id ON public.documentos_especificacao(user_id);
CREATE INDEX idx_documentos_especificacao_created_at ON public.documentos_especificacao(created_at DESC);
CREATE INDEX idx_documentos_especificacao_titulo ON public.documentos_especificacao(titulo);

CREATE INDEX idx_documentos_folha_dados_user_id ON public.documentos_folha_dados(user_id);
CREATE INDEX idx_documentos_folha_dados_created_at ON public.documentos_folha_dados(created_at DESC);
CREATE INDEX idx_documentos_folha_dados_titulo ON public.documentos_folha_dados(titulo);

CREATE INDEX idx_documentos_memorial_user_id ON public.documentos_memorial(user_id);
CREATE INDEX idx_documentos_memorial_created_at ON public.documentos_memorial(created_at DESC);
CREATE INDEX idx_documentos_memorial_titulo ON public.documentos_memorial(titulo);