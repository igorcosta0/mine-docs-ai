-- Storage policies for 'datalake' bucket so authenticated users can manage their own files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view their own datalake files'
  ) THEN
    CREATE POLICY "Users can view their own datalake files"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'datalake'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to their datalake folder'
  ) THEN
    CREATE POLICY "Users can upload to their datalake folder"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'datalake'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own datalake files'
  ) THEN
    CREATE POLICY "Users can update their own datalake files"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'datalake'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own datalake files'
  ) THEN
    CREATE POLICY "Users can delete their own datalake files"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'datalake'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;