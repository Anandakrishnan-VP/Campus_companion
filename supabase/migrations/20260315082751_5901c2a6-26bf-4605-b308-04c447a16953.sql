
CREATE TABLE public.emergency_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'phone',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read emergency contacts" ON public.emergency_contacts
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage emergency contacts" ON public.emergency_contacts
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.emergency_contacts (label, value, type, sort_order) VALUES
  ('Campus Security', '+91-XXX-XXX-1234', 'phone', 0),
  ('Medical Emergency', '+91-XXX-XXX-5678', 'phone', 1),
  ('Fire Emergency', '101', 'phone', 2),
  ('Evacuation', 'Proceed to the nearest exit. Assembly point: Main Ground.', 'info', 3);
