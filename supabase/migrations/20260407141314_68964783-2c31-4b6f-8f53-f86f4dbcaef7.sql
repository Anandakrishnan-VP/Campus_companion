
-- Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#6366f1',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tenants" ON public.tenants FOR SELECT USING (status = 'active');
CREATE POLICY "Super admins can manage all tenants" ON public.tenants FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create tenant_memberships table
CREATE TABLE public.tenant_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own memberships" ON public.tenant_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all memberships" ON public.tenant_memberships FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Tenant admins can manage memberships in their tenant" ON public.tenant_memberships FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = tenant_memberships.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);

-- Helper function
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_memberships WHERE user_id = _user_id LIMIT 1
$$;

-- Add tenant_id to all data tables
ALTER TABLE public.faculty ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.timetable ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.locations ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.knowledge_base ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.departments ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.emergency_contacts ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.student_issues ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create default tenant
INSERT INTO public.tenants (id, name, slug, website_url) VALUES ('00000000-0000-0000-0000-000000000001', 'NCERC', 'ncerc', 'https://ncerc.ac.in');

-- Migrate existing data
UPDATE public.faculty SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.timetable SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.events SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.locations SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.attendance SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.notifications SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.knowledge_base SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.departments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.emergency_contacts SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.student_issues SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL
ALTER TABLE public.faculty ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.timetable ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.locations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.attendance ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.knowledge_base ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.departments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.emergency_contacts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.student_issues ALTER COLUMN tenant_id SET NOT NULL;

-- Migrate existing admin to super_admin and create tenant membership
DO $$
DECLARE admin_user_id uuid;
BEGIN
  SELECT user_id INTO admin_user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'super_admin') ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role) VALUES ('00000000-0000-0000-0000-000000000001', admin_user_id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create memberships for existing professors
INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', f.user_id, 'professor'
FROM public.faculty f WHERE f.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Drop old RLS policies and create tenant-scoped ones

-- FACULTY
DROP POLICY IF EXISTS "Admins can manage faculty" ON public.faculty;
DROP POLICY IF EXISTS "Anyone can read faculty" ON public.faculty;
DROP POLICY IF EXISTS "Professors can update their own record" ON public.faculty;

CREATE POLICY "Tenant admins can manage faculty" ON public.faculty FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = faculty.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "Professors can update own record" ON public.faculty FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all faculty" ON public.faculty FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- TIMETABLE
DROP POLICY IF EXISTS "Admins can manage timetable" ON public.timetable;
DROP POLICY IF EXISTS "Anyone can read timetable" ON public.timetable;
DROP POLICY IF EXISTS "Professors can manage their own timetable" ON public.timetable;

CREATE POLICY "Tenant admins can manage timetable" ON public.timetable FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = timetable.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read timetable" ON public.timetable FOR SELECT USING (true);
CREATE POLICY "Professors can manage own timetable" ON public.timetable FOR ALL USING (
  EXISTS (SELECT 1 FROM public.faculty WHERE faculty.id = timetable.faculty_id AND faculty.user_id = auth.uid())
);
CREATE POLICY "Super admins can manage all timetable" ON public.timetable FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- EVENTS
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Anyone can read events" ON public.events;

CREATE POLICY "Tenant admins can manage events" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = events.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Super admins can manage all events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- LOCATIONS
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can read locations" ON public.locations;

CREATE POLICY "Tenant admins can manage locations" ON public.locations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = locations.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Super admins can manage all locations" ON public.locations FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- ATTENDANCE
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Anyone can read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Professors can manage their own attendance" ON public.attendance;

CREATE POLICY "Tenant admins can manage attendance" ON public.attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = attendance.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Professors can manage own attendance" ON public.attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.faculty WHERE faculty.id = attendance.faculty_id AND faculty.user_id = auth.uid())
);
CREATE POLICY "Super admins can manage all attendance" ON public.attendance FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Professors can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Professors can insert notifications" ON public.notifications;

CREATE POLICY "Tenant admins can manage notifications" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = notifications.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Professors can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Professors can insert notifications" ON public.notifications FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'professor')
);
CREATE POLICY "Super admins can manage all notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- KNOWLEDGE_BASE
DROP POLICY IF EXISTS "Admins can manage knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Anyone can read knowledge_base" ON public.knowledge_base;

CREATE POLICY "Tenant admins can manage knowledge_base" ON public.knowledge_base FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = knowledge_base.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read knowledge_base" ON public.knowledge_base FOR SELECT USING (true);
CREATE POLICY "Super admins can manage all knowledge_base" ON public.knowledge_base FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- DEPARTMENTS
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can read departments" ON public.departments;

CREATE POLICY "Tenant admins can manage departments" ON public.departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = departments.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Super admins can manage all departments" ON public.departments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- EMERGENCY_CONTACTS
DROP POLICY IF EXISTS "Admins can manage emergency contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Anyone can read emergency contacts" ON public.emergency_contacts;

CREATE POLICY "Tenant admins can manage emergency_contacts" ON public.emergency_contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = emergency_contacts.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read emergency_contacts" ON public.emergency_contacts FOR SELECT USING (true);
CREATE POLICY "Super admins can manage all emergency_contacts" ON public.emergency_contacts FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- STUDENT_ISSUES
DROP POLICY IF EXISTS "Admins can delete issues" ON public.student_issues;
DROP POLICY IF EXISTS "Anyone can read issues" ON public.student_issues;
DROP POLICY IF EXISTS "Anyone can submit issues" ON public.student_issues;
DROP POLICY IF EXISTS "Anyone can update issue votes" ON public.student_issues;

CREATE POLICY "Tenant admins can delete issues" ON public.student_issues FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships tm WHERE tm.tenant_id = student_issues.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin')
);
CREATE POLICY "Anyone can read issues" ON public.student_issues FOR SELECT USING (true);
CREATE POLICY "Anyone can submit issues" ON public.student_issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update issue votes" ON public.student_issues FOR UPDATE USING (true);
CREATE POLICY "Super admins can manage all issues" ON public.student_issues FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Indexes
CREATE INDEX idx_faculty_tenant ON public.faculty(tenant_id);
CREATE INDEX idx_timetable_tenant ON public.timetable(tenant_id);
CREATE INDEX idx_events_tenant ON public.events(tenant_id);
CREATE INDEX idx_locations_tenant ON public.locations(tenant_id);
CREATE INDEX idx_attendance_tenant ON public.attendance(tenant_id);
CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX idx_knowledge_base_tenant ON public.knowledge_base(tenant_id);
CREATE INDEX idx_departments_tenant ON public.departments(tenant_id);
CREATE INDEX idx_emergency_contacts_tenant ON public.emergency_contacts(tenant_id);
CREATE INDEX idx_student_issues_tenant ON public.student_issues(tenant_id);
CREATE INDEX idx_tenant_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenant_memberships;
