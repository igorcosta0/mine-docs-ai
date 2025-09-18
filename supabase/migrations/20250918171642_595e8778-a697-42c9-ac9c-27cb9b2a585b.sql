-- Adicionar campo checksum_sha256 na tabela lake_items para detecção de duplicatas
ALTER TABLE public.lake_items ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT;

-- Criar índice para otimizar busca por checksum
CREATE INDEX IF NOT EXISTS idx_lake_items_checksum ON public.lake_items(checksum_sha256, user_id);