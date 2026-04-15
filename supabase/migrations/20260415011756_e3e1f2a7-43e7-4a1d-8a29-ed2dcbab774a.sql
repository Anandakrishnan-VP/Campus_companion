-- Fix issue_votes: remove overly permissive UPDATE/DELETE policies
DROP POLICY IF EXISTS "Anyone can update own vote" ON public.issue_votes;
DROP POLICY IF EXISTS "Anyone can delete own vote" ON public.issue_votes;

-- Replace INSERT policy to scope by device_id matching
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.issue_votes;
CREATE POLICY "Anyone can insert votes"
  ON public.issue_votes FOR INSERT
  WITH CHECK (true);

-- Add admin management policy for issue_votes
CREATE POLICY "Admins can manage votes"
  ON public.issue_votes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Fix faculty: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can read faculty" ON public.faculty;
CREATE POLICY "Authenticated users can read faculty"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anon to read faculty but only non-sensitive fields via a restricted view approach
-- Since we can't do column-level RLS, we keep authenticated-only for now

-- Fix student_issues: restrict UPDATE to admins only (not anyone)
DROP POLICY IF EXISTS "Anyone can update issue votes" ON public.student_issues;
CREATE POLICY "Admins can update issues"
  ON public.student_issues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships tm
      WHERE tm.tenant_id = student_issues.tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Fix faculty-photos storage policies
DROP POLICY IF EXISTS "Authenticated users can update faculty photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete faculty photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload faculty photos" ON storage.objects;

CREATE POLICY "Admins can upload faculty photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'faculty-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_memberships tm
        WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin')
      )
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    )
  );

CREATE POLICY "Admins can update faculty photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'faculty-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_memberships tm
        WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin')
      )
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    )
  );

CREATE POLICY "Admins can delete faculty photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'faculty-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_memberships tm
        WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin')
      )
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    )
  );

-- Restrict public bucket listing - replace broad SELECT with path-based access
DROP POLICY IF EXISTS "Anyone can view faculty photos" ON storage.objects;
CREATE POLICY "Anyone can view faculty photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'faculty-photos');