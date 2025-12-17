-- Policy for SELECT (read access)
CREATE POLICY "Allow authenticated users to view highlights"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'highlights');

-- Policy for INSERT (upload access)
CREATE POLICY "Allow authenticated users to upload highlights"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'highlights');

-- Policy for UPDATE (modify access)
CREATE POLICY "Allow authenticated users to update highlights"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'highlights');

-- Policy for DELETE (remove access)
CREATE POLICY "Allow authenticated users to delete highlights"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'highlights');