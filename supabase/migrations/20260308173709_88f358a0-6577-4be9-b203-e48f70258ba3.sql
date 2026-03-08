
-- Student Issues table
CREATE TABLE public.student_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  status text NOT NULL DEFAULT 'active',
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  device_id text NOT NULL DEFAULT '',
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.student_issues ENABLE ROW LEVEL SECURITY;

-- Anyone can read active issues
CREATE POLICY "Anyone can read issues" ON public.student_issues FOR SELECT USING (true);
-- Anyone can insert issues (public kiosk)
CREATE POLICY "Anyone can submit issues" ON public.student_issues FOR INSERT WITH CHECK (true);
-- Anyone can update (for vote counts) - we'll handle logic in app
CREATE POLICY "Anyone can update issue votes" ON public.student_issues FOR UPDATE USING (true);
-- Admins can delete issues
CREATE POLICY "Admins can delete issues" ON public.student_issues FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Issue Votes table (tracks per-device votes)
CREATE TABLE public.issue_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.student_issues(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  vote_type text NOT NULL DEFAULT 'up',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(issue_id, device_id)
);

ALTER TABLE public.issue_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes" ON public.issue_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.issue_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own vote" ON public.issue_votes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete own vote" ON public.issue_votes FOR DELETE USING (true);

-- Trigger to update counts
CREATE OR REPLACE FUNCTION public.update_issue_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.student_issues SET
      upvotes = (SELECT count(*) FROM public.issue_votes WHERE issue_id = NEW.issue_id AND vote_type = 'up'),
      downvotes = (SELECT count(*) FROM public.issue_votes WHERE issue_id = NEW.issue_id AND vote_type = 'down'),
      updated_at = now()
    WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.student_issues SET
      upvotes = (SELECT count(*) FROM public.issue_votes WHERE issue_id = OLD.issue_id AND vote_type = 'up'),
      downvotes = (SELECT count(*) FROM public.issue_votes WHERE issue_id = OLD.issue_id AND vote_type = 'down'),
      updated_at = now()
    WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER issue_votes_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.issue_votes
FOR EACH ROW EXECUTE FUNCTION public.update_issue_vote_counts();

-- Updated at trigger for student_issues
CREATE TRIGGER update_student_issues_updated_at BEFORE UPDATE ON public.student_issues
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_votes;
