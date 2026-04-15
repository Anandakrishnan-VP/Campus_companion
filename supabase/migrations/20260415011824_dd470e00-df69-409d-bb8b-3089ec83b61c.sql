-- The kiosk is a public-facing app that needs to read faculty data
-- Re-add public SELECT since the kiosk relies on it
DROP POLICY IF EXISTS "Authenticated users can read faculty" ON public.faculty;
CREATE POLICY "Anyone can read faculty"
  ON public.faculty FOR SELECT
  USING (true);