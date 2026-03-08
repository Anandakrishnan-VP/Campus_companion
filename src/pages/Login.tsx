import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const toEmail = (id: string) => `${id.toLowerCase().trim()}@campus.local`;

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("user_roles").select("id").eq("role", "admin").limit(1);
      if (!data || data.length === 0) setShowSetup(true);
      setCheckingSetup(false);
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: toEmail(userId), password });
      if (error) throw error;

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        toast({ title: "Access Denied", description: "No role assigned.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const role = roles[0].role;
      navigate(role === "admin" ? "/admin" : "/professor");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim() || password.length < 6) {
      toast({ title: "Invalid", description: "ID and password (min 6 chars) required", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("setup-admin", {
        body: { admin_id: userId.trim(), password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Admin account created! Please sign in." });
      setShowSetup(false);
      setPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const inputCls = "w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-body";

  if (checkingSetup) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground font-display">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm mx-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Kiosk
        </Link>

        <div className="glass-card p-8">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${showSetup ? "bg-accent/20" : "bg-primary/10"}`}>
              {showSetup ? <ShieldCheck className="w-6 h-6 text-accent" /> : <Lock className="w-6 h-6 text-primary" />}
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {showSetup ? "Setup Admin" : "Staff Login"}
            </h1>
            <p className="text-xs text-muted-foreground text-center">
              {showSetup ? "Create the first admin account" : "Enter your ID and password"}
            </p>
          </div>

          <form onSubmit={showSetup ? handleSetupAdmin : handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-display text-muted-foreground mb-1 block">
                {showSetup ? "Admin ID" : "ID"}
              </label>
              <input type="text" className={inputCls} value={userId} onChange={e => setUserId(e.target.value)} placeholder={showSetup ? "admin" : "Your ID"} required />
            </div>
            <div>
              <label className="text-xs font-display text-muted-foreground mb-1 block">Password</label>
              <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" disabled={loading}
              className={`w-full py-3 rounded-xl font-display font-semibold text-sm disabled:opacity-50 transition-opacity ${showSetup ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
              {loading ? "Please wait..." : showSetup ? "Create Admin Account" : "Sign In"}
            </button>
          </form>

          {showSetup && (
            <button onClick={() => setShowSetup(false)} className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground text-center font-display">
              Already have an account? Sign in
            </button>
          )}
          {!showSetup && (
            <button onClick={() => setShowSetup(true)} className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground text-center font-display">
              First time? Setup admin
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
