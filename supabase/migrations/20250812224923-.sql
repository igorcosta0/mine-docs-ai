-- Create datalake bucket if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'datalake') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('datalake', 'datalake', false);
  END IF;
END $$;

-- Create table for Data Lake items
CREATE TABLE IF NOT EXISTS public.lake_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  doc_type TEXT,
  tags TEXT[] DEFAULT '{}',
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lake_items ENABLE ROW LEVEL SECURITY;

-- Policies for lake_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lake_items' AND policyname = 'Users can view their own lake items'
  ) THEN
    CREATE POLICY "Users can view their own lake items" ON public.lake_items FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lake_items' AND policyname = 'Users can insert their own lake items'
  ) THEN
    CREATE POLICY "Users can insert their own lake items" ON public.lake_items FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lake_items' AND policyname = 'Users can update their own lake items'
  ) THEN
    CREATE POLICY "Users can update their own lake items" ON public.lake_items FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lake_items' AND policyname = 'Users can delete their own lake items'
  ) THEN
    CREATE POLICY "Users can delete their own lake items" ON public.lake_items FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Timestamp trigger function (idempotent create)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for lake_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_lake_items_updated_at'
  ) THEN
    CREATE TRIGGER update_lake_items_updated_at
    BEFORE UPDATE ON public.lake_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lake_items_user_id ON public.lake_items(user_id);
CREATE INDEX IF NOT EXISTS idx_lake_items_created_at ON public.lake_items(created_at);

-- Storage policies for bucket 'datalake'
-- Allow users to manage files only within their own folder (first path segment is user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'datalake select own'
  ) THEN
    CREATE POLICY "datalake select own" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'datalake' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'datalake insert own'
  ) THEN
    CREATE POLICY "datalake insert own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'datalake' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'datalake update own'
  ) THEN
    CREATE POLICY "datalake update own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'datalake' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'datalake delete own'
  ) THEN
    CREATE POLICY "datalake delete own" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'datalake' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;