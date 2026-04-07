import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Trash2, Filter, AlertTriangle, ThumbsUp, ThumbsDown, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

const CATEGORIES = ["All", "General", "Facilities", "Academics", "Administration", "Hostel", "WiFi", "Transport", "Canteen", "Library", "Other"];

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

interface Props {
  userId: string;
}

const IssuesManager = ({ userId }: Props) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("All");
  const [showResolved, setShowResolved] = useState(false);
  const [sortBy, setSortBy] = useState<"upvotes" | "recent">("upvotes");

  const fetchIssues = useCallback(async () => {
    const { data } = await supabase
      .from("student_issues")
      .select("*")
      .order(sortBy === "upvotes" ? "upvotes" : "created_at", { ascending: false });
    setIssues((data as Issue[]) || []);
    setLoading(false);
  }, [sortBy]);

  useEffect(() => {
    fetchIssues();
    const channel = supabase
      .channel("admin-issues")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "student_issues" } as any, () => fetchIssues())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchIssues]);

  const resolveIssue = async (issue: Issue) => {
    // Update issue status
    await supabase.from("student_issues").update({ status: "solved", resolved_at: new Date().toISOString(), resolved_by: userId } as any).eq("id", issue.id);

    // Create notification
    await supabase.from("notifications").insert({
      title: `Issue Resolved: ${issue.title}`,
      message: `"${issue.title}" has been addressed by the administration.`,
      priority: "important",
      created_by: userId,
      created_by_name: "Administration",
    });

    toast({ title: "Issue marked as resolved" });
    fetchIssues();
  };

  const deleteIssue = async (id: string) => {
    await supabase.from("student_issues").delete().eq("id", id);
    toast({ title: "Issue removed" });
    fetchIssues();
  };

  const activeIssues = issues.filter(i => i.status === "active");
  const resolvedIssues = issues.filter(i => i.status === "solved");
  const displayIssues = showResolved ? resolvedIssues : activeIssues;
  const filtered = filterCat === "All" ? displayIssues : displayIssues.filter(i => i.category === filterCat);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return <p className="text-sm text-muted-foreground animate-pulse">Loading issues...</p>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-lg font-display font-bold text-foreground mb-4">🗳️ Student Issues</h2>

      {/* Stats */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 glass-card p-3 text-center">
          <p className="text-xl font-display font-bold text-foreground">{activeIssues.length}</p>
          <p className="text-[10px] text-muted-foreground font-display uppercase">Active</p>
        </div>
        <div className="flex-1 glass-card p-3 text-center">
          <p className="text-xl font-display font-bold text-primary">{resolvedIssues.length}</p>
          <p className="text-[10px] text-muted-foreground font-display uppercase">Resolved</p>
        </div>
        <div className="flex-1 glass-card p-3 text-center">
          <p className="text-xl font-display font-bold text-accent-foreground">{issues.reduce((s, i) => s + i.upvotes, 0)}</p>
          <p className="text-[10px] text-muted-foreground font-display uppercase">Votes</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex rounded-lg bg-secondary/50 p-0.5">
          <button onClick={() => setShowResolved(false)} className={`px-3 py-1 rounded-md text-xs font-display font-medium transition-all ${!showResolved ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Active</button>
          <button onClick={() => setShowResolved(true)} className={`px-3 py-1 rounded-md text-xs font-display font-medium transition-all ${showResolved ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Resolved</button>
        </div>
        <div className="flex rounded-lg bg-secondary/50 p-0.5">
          <button onClick={() => setSortBy("upvotes")} className={`px-3 py-1 rounded-md text-xs font-display font-medium transition-all ${sortBy === "upvotes" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>Top Voted</button>
          <button onClick={() => setSortBy("recent")} className={`px-3 py-1 rounded-md text-xs font-display font-medium transition-all ${sortBy === "recent" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>Recent</button>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} className={`px-2 py-1 rounded-full text-[10px] font-display whitespace-nowrap ${filterCat === c ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground"}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Issue List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">{showResolved ? "No resolved issues" : "No active issues"}</p>
          </div>
        ) : (
          filtered.map(issue => {
            const total = issue.upvotes + issue.downvotes;
            const ratio = total > 0 ? Math.round((issue.upvotes / total) * 100) : 0;
            return (
              <div key={issue.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{issue.category}</span>
                      {issue.status === "solved" && (
                        <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </div>
                    <p className="font-display font-semibold text-foreground text-sm">{issue.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(issue.created_at)}</span>
                      <span className="text-[10px] text-primary flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{issue.upvotes}</span>
                      <span className="text-[10px] text-destructive flex items-center gap-1"><ThumbsDown className="w-3 h-3" />{issue.downvotes}</span>
                      {total > 0 && <span className="text-[10px] text-muted-foreground">{ratio}% agree</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {issue.status === "active" && (
                      <button onClick={() => resolveIssue(issue)} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20" title="Mark Resolved">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => deleteIssue(issue.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default IssuesManager;
