import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Check, ArrowLeft, LogOut } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const FEATURES = [
  "AI-powered campus kiosk",
  "Faculty directory & attendance",
  "Student issue tracking",
  "Real-time notifications",
  "Knowledge base management",
  "Custom branding & subdomain",
];

const Subscribe = () => {
  const { tenant, tenantId } = useTenant();
  const { user, signOut } = useAuth("admin");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!tenant || !tenantId) return null;

  if (tenant.subscription_status === "active") {
    navigate("/admin", { replace: true });
    return null;
  }

  const handlePayment = async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mock-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ tenant_id: tenantId, action: "activate" }),
        }
      );
      if (resp.ok) {
        navigate("/subscription/success");
      } else {
        toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Payment failed", description: "Network error.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/login")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={signOut} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        <div className="glass-card p-8">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">Campus AI Pro</h1>
            <p className="text-sm text-muted-foreground text-center">
              Activate your institution's AI kiosk for <strong>{tenant.name}</strong>
            </p>
          </div>

          <div className="text-center mb-6">
            <span className="text-4xl font-display font-bold text-foreground">₹999</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="space-y-3 mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm disabled:opacity-50 transition-opacity"
          >
            {loading ? "Processing..." : "Pay & Activate"}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-3">(Mock payment — instant activation for testing)</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Subscribe;
