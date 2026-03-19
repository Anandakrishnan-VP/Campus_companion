
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS photo_url text DEFAULT '';

INSERT INTO storage.buckets (id, name, public)
VALUES ('faculty-photos', 'faculty-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view faculty photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'faculty-photos');

CREATE POLICY "Authenticated users can upload faculty photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'faculty-photos');

CREATE POLICY "Authenticated users can update faculty photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'faculty-photos');

CREATE POLICY "Authenticated users can delete faculty photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'faculty-photos');
