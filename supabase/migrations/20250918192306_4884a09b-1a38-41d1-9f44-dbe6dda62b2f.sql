-- Criar edge function para verificar disponibilidade das APIs
CREATE OR REPLACE FUNCTION check_ai_availability()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  -- Esta função será implementada via Supabase Edge Function
  -- Retorna status das APIs disponíveis
  SELECT json_build_object(
    'openai', CASE WHEN current_setting('app.openai_key', true) IS NOT NULL THEN true ELSE false END,
    'claude', CASE WHEN current_setting('app.claude_key', true) IS NOT NULL THEN true ELSE false END
  ) INTO result;
  
  RETURN result;
END;
$$;