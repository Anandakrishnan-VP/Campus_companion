
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_by_name text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can read notifications (kiosk is public)
CREATE POLICY "Anyone can read notifications" ON public.notifications
FOR SELECT USING (true);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications" ON public.notifications
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Professors can insert notifications
CREATE POLICY "Professors can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (has_role(auth.uid(), 'professor'::app_role));

-- Professors can delete their own notifications
CREATE POLICY "Professors can delete own notifications" ON public.notifications
FOR DELETE USING (auth.uid() = created_by);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
