import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Register = () => {
  const [collegeName, setCollegeName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim() || !abbreviation.trim() || !email.trim()) return;
    if (!/^[a-z0-9]+$/.test(abbreviation)) {
      toast({ title: "Invalid abbreviation", description: "Use only lowercase letters and numbers", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("register-tenant", {
        body: {
          college_name: collegeName.trim(),
          abbreviation: abbreviation.trim().toLowerCase(),
          website_url: websiteUrl.trim(),
          admin_name: adminName.trim(),
          email: email.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "🎉 Registration submitted!", description: "Your request has been sent for approval. The platform admin will create your login credentials and notify you." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message || "Please try again", variant: "destructive" });
    }
    setLoading(false);
  };

  const inputCls = "w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-body";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md mx-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="glass-card p-8">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">Register Your College</h1>
            <p className="text-xs text-muted-foreground text-center">Submit a request — admin credentials will be created by the platform admin</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-display text-muted-foreground mb-1 block">College Name *</label>
              <input className={inputCls} value={collegeName} onChange={e => setCollegeName(e.target.value)} placeholder="e.g. ABC Engineering College" required />
            </div>
            <div>
              <label className="text-xs font-display text-muted-foreground mb-1 block">Abbreviation * <span className="text-muted-foreground/60">(used for subdomain)</span></label>
              <input className={inputCls} value={abbreviation} onChange={e => setAbbreviation(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))} placeholder="e.g. ncerc, abc" required maxLength={20} minLength={2} />
              {abbreviation && (
                <p className="text-xs text-muted-foreground mt-1">
                  Your kiosk will be at: <span className="text-primary font-medium">{abbreviation}.clgai.lovable.app</span>
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-display text-muted-foreground mb-1 block">College Website</label>
              <input className={inputCls} value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://example.ac.in" />
            </div>
            <div>
              <label className="text-xs font-display text-muted-foreground mb-1 block">Contact Person Name</label>
              <input className={inputCls} value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="text-xs font-display text-muted-foreground mb-1 block">Contact Email *</label>
              <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@college.ac.in" required />
            </div>
            <div>
              <label className="text-xs font-display text-muted-foreground mb-1 block">Note to Admin</label>
              <textarea className={inputCls + " min-h-[80px] resize-none"} value={message} onChange={e => setMessage(e.target.value)} placeholder="Any message or request for the platform admin..." />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm disabled:opacity-50 transition-opacity">
              {loading ? "Submitting..." : "Submit Registration"}
            </button>

            <p className="text-[11px] text-muted-foreground text-center">After approval, the platform admin will create your login credentials and send them to your email.</p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
