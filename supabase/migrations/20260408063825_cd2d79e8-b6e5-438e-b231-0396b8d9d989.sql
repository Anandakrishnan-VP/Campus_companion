
-- Add abbreviation column to tenants
ALTER TABLE public.tenants ADD COLUMN abbreviation text;

-- Update RLS: let super admins read ALL tenants (including pending)
DROP POLICY IF EXISTS "Anyone can read active tenants" ON public.tenants;
CREATE POLICY "Anyone can read active tenants" ON public.tenants
  FOR SELECT USING (status = 'active' OR has_role(auth.uid(), 'super_admin'::app_role));
