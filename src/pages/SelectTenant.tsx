import { motion } from "framer-motion";
import { Building2, ArrowRight } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { Link } from "react-router-dom";

const SelectTenant = () => {
  const { allTenants, setTenantBySlug } = useTenant();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-lg mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Campus AI Kiosk</h1>
          <p className="text-sm text-muted-foreground mt-2">Select your institution to continue</p>
        </div>

        <div className="space-y-3">
          {allTenants.map(t => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTenantBySlug(t.slug)}
              className="w-full glass-card p-4 flex items-center gap-4 text-left hover:border-primary/30 transition-colors"
            >
              {t.logo_url ? (
                <img src={t.logo_url} alt={t.name} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-display font-bold" style={{ backgroundColor: t.primary_color + "20", color: t.primary_color }}>
                  {t.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="font-display font-bold text-foreground">{t.name}</p>
                {t.website_url && <p className="text-xs text-muted-foreground">{t.website_url.replace(/https?:\/\//, "")}</p>}
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link to="/register" className="text-sm text-primary hover:underline font-display">
            Register your institution →
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SelectTenant;
