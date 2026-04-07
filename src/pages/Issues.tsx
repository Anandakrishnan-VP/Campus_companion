import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ThumbsUp, ThumbsDown, Plus, X, Send, CheckCircle2, Clock, AlertTriangle, Megaphone, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

const CATEGORIES = ["General", "Facilities", "Academics", "Administration", "Hostel", "WiFi", "Transport", "Canteen", "Library", "Other"];

const CATEGORY_EMOJI: Record<string, string> = {
  General: "📋", Facilities: "🏗️", Academics: "📚", Administration: "🏛️",
  Hostel: "🏠", WiFi: "📶", Transport: "🚌", Canteen: "🍽️", Library: "📖", Other: "💬",
};

function getDeviceId(): string {
  let id = localStorage.getItem("kiosk_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("kiosk_device_id", id); }
  return id;
}

interface Issue { id: string; title: string; description: string; category: string; status: string; upvotes: number; downvotes: number; created_at: string; }
interface Vote { issue_id: string; vote_type: string; }

const Issues = () => {
  const { tenantId } = useTenant();
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
    const { error } = await supabase.from("student_issues").insert({ title: title.trim(), description: desc.trim(), category, device_id: deviceId, tenant_id: tenantId! } as any);
    setSubmitting(false);
    if (error) { toast({ title: "Failed to submit", variant: "destructive" }); return; }
    setShowForm(false); setTitle(""); setDesc(""); setCategory("General");
    toast({ title: "🎉 Issue submitted! Your voice matters." }); fetchData();
  };

  const handleVote = async (issueId: string, voteType: "up" | "down") => {
    const existing = votes.find(v => v.issue_id === issueId);
    if (existing) {
      if (existing.vote_type === voteType) {
        await supabase.from("issue_votes").delete().eq("issue_id", issueId).eq("device_id", deviceId);
      } else {
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
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex flex-col items-center gap-3">
        <Megaphone className="w-10 h-10 text-primary" />
        <p className="text-muted-foreground font-display">Loading Student Voice...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/6 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-display font-bold hover:bg-accent/90 transition-all shadow-[0_0_20px_hsl(var(--accent)/0.3)]"
          >
            <Plus className="w-4 h-4" /> Report Issue
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 pb-6"
      >
        <div className="max-w-3xl mx-auto text-center mb-6">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-foreground text-xs font-display font-medium mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Your Campus, Your Rules
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-2">
            Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Voice</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Speak up about campus issues. Vote on what matters most. Make change happen together.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-3 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/15 p-4 text-center"
          >
            <AlertTriangle className="w-5 h-5 text-accent mx-auto mb-1.5 opacity-60" />
            <p className="text-2xl font-display font-bold text-foreground">{activeIssues.length}</p>
            <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Active Issues</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 p-4 text-center"
          >
            <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1.5 opacity-60" />
            <p className="text-2xl font-display font-bold text-primary">{resolvedIssues.length}</p>
            <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Resolved</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border/30 p-4 text-center"
          >
            <TrendingUp className="w-5 h-5 text-foreground mx-auto mb-1.5 opacity-60" />
            <p className="text-2xl font-display font-bold text-foreground">{issues.reduce((s, i) => s + i.upvotes, 0)}</p>
            <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Total Votes</p>
          </motion.div>
        </div>
      </motion.div>

      <main className="relative z-10 max-w-3xl mx-auto px-4 pb-24">
        {/* Tab toggle & Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          <div className="flex rounded-2xl bg-secondary/60 p-1 border border-border/20">
            <button
              onClick={() => setShowResolved(false)}
              className={`px-5 py-2 rounded-xl text-sm font-display font-semibold transition-all ${!showResolved ? "bg-accent text-accent-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              🔴 Active
            </button>
            <button
              onClick={() => setShowResolved(true)}
              className={`px-5 py-2 rounded-xl text-sm font-display font-semibold transition-all ${showResolved ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              ✅ Resolved
            </button>
          </div>
          <div className="flex-1 overflow-x-auto flex gap-1.5 pb-1">
            {["All", ...CATEGORIES].map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-display whitespace-nowrap transition-all border ${
                  filterCat === c
                    ? "bg-primary/15 text-primary font-semibold border-primary/30"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:border-border/30"
                }`}
              >
                {c !== "All" && <span className="mr-1">{CATEGORY_EMOJI[c]}</span>}{c}
              </button>
            ))}
          </div>
        </div>

        {/* Issue Cards */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {showResolved
                    ? <CheckCircle2 className="w-12 h-12 mx-auto text-primary/30 mb-3" />
                    : <Megaphone className="w-12 h-12 mx-auto text-accent/30 mb-3" />
                  }
                </motion.div>
                <p className="text-base font-display font-semibold text-foreground/60 mb-1">
                  {showResolved ? "No resolved issues yet" : "All clear! 🎉"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {showResolved ? "Issues resolved by admin will appear here" : "No active issues — campus is running great!"}
                </p>
                {!showResolved && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent/15 text-accent-foreground text-sm font-display font-medium hover:bg-accent/25 transition-all border border-accent/20"
                  >
                    <Megaphone className="w-4 h-4" /> Be the first to report
                  </button>
                )}
              </motion.div>
            ) : (
              filtered.map((issue, idx) => {
                const myVote = getMyVote(issue.id);
                const total = issue.upvotes + issue.downvotes;
                const ratio = total > 0 ? (issue.upvotes / total) * 100 : 50;
                const heat = getHeatLevel(issue.upvotes);
                const isHot = issue.upvotes >= 10;
                return (
                  <motion.div
                    key={issue.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`rounded-2xl border overflow-hidden transition-all ${
                      isHot
                        ? "bg-gradient-to-r from-accent/5 to-primary/5 border-accent/20 shadow-[0_0_15px_hsl(var(--accent)/0.08)]"
                        : "bg-card/60 border-border/20 hover:border-border/40"
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[11px] font-display font-semibold px-2.5 py-0.5 rounded-full bg-secondary border border-border/20 text-foreground/80">
                              {CATEGORY_EMOJI[issue.category] || "💬"} {issue.category}
                            </span>
                            {issue.status === "solved" && (
                              <span className="text-[11px] font-display font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1 border border-primary/20">
                                <CheckCircle2 className="w-3 h-3" /> Resolved
                              </span>
                            )}
                            {heat && <span className="text-sm">{heat}</span>}
                          </div>
                          <h3 className="font-display font-bold text-foreground text-base leading-snug">{issue.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{issue.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <Clock className="w-3 h-3 text-muted-foreground/60" />
                            <span className="text-[11px] text-muted-foreground/60 font-display">{timeAgo(issue.created_at)}</span>
                            {total > 0 && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="text-[11px] text-muted-foreground/60 font-display">{Math.round(ratio)}% agree</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Voting Column */}
                        {issue.status === "active" && (
                          <div className="flex flex-col items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={() => handleVote(issue.id, "up")}
                              className={`p-2.5 rounded-xl transition-all ${
                                myVote === "up"
                                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)] scale-110"
                                  : "bg-secondary/80 text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border/20"
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <span className={`text-lg font-display font-bold ${myVote === "up" ? "text-primary" : "text-foreground"}`}>
                              {issue.upvotes}
                            </span>
                            <button
                              onClick={() => handleVote(issue.id, "down")}
                              className={`p-2.5 rounded-xl transition-all ${
                                myVote === "down"
                                  ? "bg-destructive text-destructive-foreground scale-110"
                                  : "bg-secondary/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/20"
                              }`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Upvote ratio bar */}
                      {total > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/10">
                          <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${ratio}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
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

      {/* Floating Action Button (mobile) */}
      <motion.button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 z-40 sm:hidden w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-[0_4px_24px_hsl(var(--accent)/0.4)] flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Submit Issue Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none sm:px-4"
            >
              <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 space-y-5 border border-border/30 shadow-[0_-8px_40px_hsl(var(--accent)/0.1)] pointer-events-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-bold text-foreground">Report an Issue</h2>
                      <p className="text-[11px] text-muted-foreground">Your voice matters!</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-display font-medium text-muted-foreground mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-display font-medium transition-all border ${
                          category === c
                            ? "bg-accent/15 text-accent-foreground border-accent/30"
                            : "bg-secondary/50 text-muted-foreground border-border/20 hover:border-border/40"
                        }`}
                      >
                        {CATEGORY_EMOJI[c]} {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-display font-medium text-muted-foreground mb-1.5 block">Issue Title *</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. WiFi not working in Block B"
                    className="w-full bg-secondary/50 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 font-body"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="text-xs font-display font-medium text-muted-foreground mb-1.5 block">Description *</label>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Describe the issue in detail so others can understand..."
                    rows={4}
                    className="w-full bg-secondary/50 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 font-body resize-none"
                    maxLength={1000}
                  />
                </div>

                <button
                  onClick={submitIssue}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-accent text-accent-foreground text-sm font-display font-bold hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_16px_hsl(var(--accent)/0.3)]"
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
