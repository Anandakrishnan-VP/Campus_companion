import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ThumbsUp, ThumbsDown, Plus, X, Send, Filter, CheckCircle2, Clock, TrendingUp, AlertTriangle, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import NotificationPanel from "@/components/kiosk/NotificationPanel";

const CATEGORIES = ["General", "Facilities", "Academics", "Administration", "Hostel", "WiFi", "Transport", "Canteen", "Library", "Other"];

function getDeviceId(): string {
  let id = localStorage.getItem("kiosk_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("kiosk_device_id", id);
  }
  return id;
}

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

interface Vote {
  issue_id: string;
  vote_type: string;
}

const Issues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("All");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  const deviceId = getDeviceId();

  const fetchData = useCallback(async () => {
    const [{ data: issueRows }, { data: voteRows }] = await Promise.all([
      supabase.from("student_issues").select("*").order("upvotes", { ascending: false }),
      supabase.from("issue_votes").select("issue_id, vote_type").eq("device_id", deviceId),
    ]);
    setIssues((issueRows as Issue[]) || []);
    setVotes((voteRows as Vote[]) || []);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("issues-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "student_issues" } as any, () => fetchData())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "issue_votes" } as any, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const submitIssue = async () => {
    if (!title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    if (!desc.trim()) { toast({ title: "Description is required", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("student_issues").insert({
      title: title.trim(),
      description: desc.trim(),
      category,
      device_id: deviceId,
    } as any);
    setSubmitting(false);
    if (error) { toast({ title: "Failed to submit", variant: "destructive" }); return; }
    setShowForm(false);
    setTitle("");
    setDesc("");
    setCategory("General");
    toast({ title: "Issue submitted!" });
    fetchData();
  };

  const handleVote = async (issueId: string, voteType: "up" | "down") => {
    const existing = votes.find(v => v.issue_id === issueId);
    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote
        await supabase.from("issue_votes").delete().eq("issue_id", issueId).eq("device_id", deviceId);
      } else {
        // Change vote
        await supabase.from("issue_votes").update({ vote_type: voteType } as any).eq("issue_id", issueId).eq("device_id", deviceId);
      }
    } else {
      await supabase.from("issue_votes").insert({ issue_id: issueId, device_id: deviceId, vote_type: voteType } as any);
    }
    fetchData();
  };

  const getMyVote = (issueId: string) => votes.find(v => v.issue_id === issueId)?.vote_type || null;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const activeIssues = issues.filter(i => i.status === "active");
  const resolvedIssues = issues.filter(i => i.status === "solved");
  const displayIssues = showResolved ? resolvedIssues : activeIssues;
  const filtered = filterCat === "All" ? displayIssues : displayIssues.filter(i => i.category === filterCat);

  const getHeatLevel = (upvotes: number) => {
    if (upvotes >= 20) return "🔥🔥🔥";
    if (upvotes >= 10) return "🔥🔥";
    if (upvotes >= 5) return "🔥";
    return "";
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground font-display animate-pulse">Loading issues...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
              Student <span className="text-primary glow-text">Voice</span>
            </h1>
            <p className="text-xs text-muted-foreground">Report & vote on campus issues</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationPanel />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-display font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Report Issue
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 pb-24">
        {/* Stats Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 glass-card p-3 text-center">
            <p className="text-2xl font-display font-bold text-foreground">{activeIssues.length}</p>
            <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Active</p>
          </div>
          <div className="flex-1 glass-card p-3 text-center">
            <p className="text-2xl font-display font-bold text-primary">{resolvedIssues.length}</p>
            <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Resolved</p>
          </div>
          <div className="flex-1 glass-card p-3 text-center">
            <p className="text-2xl font-display font-bold text-accent-foreground">{issues.reduce((s, i) => s + i.upvotes, 0)}</p>
            <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Total Votes</p>
          </div>
        </div>

        {/* Tab toggle & Filter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex rounded-xl bg-secondary/50 p-1">
            <button
              onClick={() => setShowResolved(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-display font-medium transition-all ${!showResolved ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Active
            </button>
            <button
              onClick={() => setShowResolved(true)}
              className={`px-4 py-1.5 rounded-lg text-sm font-display font-medium transition-all ${showResolved ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Resolved
            </button>
          </div>
          <div className="flex-1 overflow-x-auto flex gap-1">
            {["All", ...CATEGORIES].map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`px-3 py-1 rounded-full text-xs font-display whitespace-nowrap transition-all ${filterCat === c ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Issue Cards */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground font-display">
                  {showResolved ? "No resolved issues yet" : "No active issues — campus is running great! 🎉"}
                </p>
              </motion.div>
            ) : (
              filtered.map((issue, idx) => {
                const myVote = getMyVote(issue.id);
                const total = issue.upvotes + issue.downvotes;
                const ratio = total > 0 ? (issue.upvotes / total) * 100 : 50;
                const heat = getHeatLevel(issue.upvotes);
                return (
                  <motion.div
                    key={issue.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className="glass-card overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {issue.category}
                            </span>
                            {issue.status === "solved" && (
                              <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Resolved
                              </span>
                            )}
                            {heat && <span className="text-xs">{heat}</span>}
                          </div>
                          <h3 className="font-display font-semibold text-foreground text-sm">{issue.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{issue.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{timeAgo(issue.created_at)}</span>
                          </div>
                        </div>

                        {/* Voting */}
                        {issue.status === "active" && (
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleVote(issue.id, "up")}
                              className={`p-2 rounded-lg transition-all ${myVote === "up" ? "bg-primary text-primary-foreground scale-110" : "bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-display font-bold text-foreground">{issue.upvotes}</span>
                            <button
                              onClick={() => handleVote(issue.id, "down")}
                              className={`p-2 rounded-lg transition-all ${myVote === "down" ? "bg-destructive text-destructive-foreground scale-110" : "bg-secondary/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] text-muted-foreground">{issue.downvotes}</span>
                          </div>
                        )}
                      </div>

                      {/* Upvote ratio bar */}
                      {total > 0 && (
                        <div className="mt-3">
                          <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 text-right">{Math.round(ratio)}% agree</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Submit Issue Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full"
            >
              <div className="glass-card rounded-t-2xl sm:rounded-2xl p-6 space-y-4 mx-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-display font-bold text-foreground">Report an Issue</h2>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-display text-muted-foreground mb-1 block">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 font-body"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-display text-muted-foreground mb-1 block">Issue Title *</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. WiFi not working in Block B"
                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-body"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="text-xs font-display text-muted-foreground mb-1 block">Description *</label>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-body resize-none"
                    maxLength={1000}
                  />
                </div>

                <button
                  onClick={submitIssue}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-display font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting..." : "Submit Issue"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Issues;
