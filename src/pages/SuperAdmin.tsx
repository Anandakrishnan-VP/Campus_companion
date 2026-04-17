import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Building2, Users, Activity, Trash2, Ban, CheckCircle2, Clock, Check, X, KeyRound, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SuperAdmin = () => {
  const { user, loading: authLoading, signOut } = useAuth("super_admin");
  const { data: tenants, refetch: refetchTenants } = useRealtimeTable("tenants" as any);
  const { data: memberships } = useRealtimeTable("tenant_memberships" as any);

  // Credential creation state
  const [credentialTenantId, setCredentialTenantId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [creatingCreds, setCreatingCreds] = useState(false);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground font-display">Loading...</p></div>;

  const pendingTenants = tenants.filter((t: any) => t.status === "pending");
  const activeTenants = tenants.filter((t: any) => t.status !== "pending");
  const getMemberCount = (tenantId: string) => memberships.filter((m: any) => m.tenant_id === tenantId).length;

  const approveTenant = async (id: string) => {
    await supabase.from("tenants").update({ status: "active" } as any).eq("id", id);
    refetchTenants();
    toast({ title: "✅ Tenant approved" });
    // Open credential creation form
    setCredentialTenantId(id);
    setAdminId("");
    setAdminPassword("");
    setAdminEmail("");
  };

  const rejectTenant = async (id: string) => {
    if (!confirm("Reject and delete this registration request?")) return;
    await supabase.from("tenants").delete().eq("id", id);
    refetchTenants();
    toast({ title: "Registration rejected" });
  };

  const toggleStatus = async (id: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    const action = newStatus === "suspended" ? "SUSPEND" : "RESTART";
    if (!confirm(`${action} service for "${name}"?\n\n${newStatus === "suspended" ? "The kiosk will become inaccessible to all students until you restart it." : "The kiosk will become accessible again."}`)) return;
    await supabase.from("tenants").update({ status: newStatus } as any).eq("id", id);
    refetchTenants();
    toast({ title: newStatus === "suspended" ? "🛑 Service suspended" : "✅ Service restarted", description: name });
  };

  const deleteTenant = async (id: string) => {
    if (!confirm("Delete this tenant and ALL its data? This cannot be undone.")) return;
    await supabase.from("tenants").delete().eq("id", id);
    refetchTenants();
    toast({ title: "Tenant deleted" });
  };

  const createCredentials = async () => {
    if (!credentialTenantId || !adminId.trim() || !adminPassword.trim()) {
      toast({ title: "Missing fields", description: "Admin ID and password are required", variant: "destructive" });
      return;
    }
    if (adminPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" });
      return;
    }
    setCreatingCreds(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("create-admin-credentials", {
        body: {
          tenant_id: credentialTenantId,
          admin_id: adminId.trim(),
          password: adminPassword,
          admin_email: adminEmail.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "✅ Admin credentials created!", description: `Login ID: ${adminId.trim()} — share these with the college admin.` });
      setCredentialTenantId(null);
      setAdminId("");
      setAdminPassword("");
      setAdminEmail("");
      refetchTenants();
    } catch (err: any) {
      toast({ title: "Failed to create credentials", description: err.message, variant: "destructive" });
    }
    setCreatingCreds(false);
  };

  const getTenantName = (id: string) => {
    const t = tenants.find((t: any) => t.id === id);
    return t?.name || "Unknown";
  };

  const inputCls = "w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-body";

  const TenantCard = ({ t, showActions }: { t: any; showActions: "pending" | "active" }) => (
    <motion.div key={t.id} layout className="glass-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display font-bold" style={{ backgroundColor: (t.primary_color || "#6366f1") + "20", color: t.primary_color || "#6366f1" }}>
            {(t.abbreviation || t.name)?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-foreground text-sm">{t.name}</p>
            <p className="text-xs text-muted-foreground">
              {t.abbreviation || t.slug} · {getMemberCount(t.id)} users · {t.website_url || "No website"}
            </p>
            {t.abbreviation && (
              <p className="text-[10px] text-primary">{t.abbreviation}.clgai.lovable.app</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-display font-medium ${
            t.subscription_status === "active" ? "bg-emerald-500/20 text-emerald-400" :
            t.subscription_status === "canceled" ? "bg-orange-500/20 text-orange-400" :
            "bg-muted text-muted-foreground"
          }`}>{t.subscription_status === "active" ? "💳 Subscribed" : t.subscription_status === "canceled" ? "💳 Canceled" : "💳 No Plan"}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-display font-medium ${
            t.status === "active" ? "bg-green-500/20 text-green-400" :
            t.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
            t.status === "suspended" ? "bg-destructive/20 text-destructive" :
            "bg-muted text-muted-foreground"
          }`}>{t.status}</span>

          {showActions === "pending" ? (
            <>
              <button onClick={() => approveTenant(t.id)} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20" title="Approve">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => rejectTenant(t.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Reject">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {getMemberCount(t.id) === 0 && (
                <button onClick={() => { setCredentialTenantId(t.id); setAdminId(""); setAdminPassword(""); setAdminEmail(""); }} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="Create Admin Credentials">
                  <KeyRound className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => toggleStatus(t.id, t.status)} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground" title={t.status === "active" ? "Suspend" : "Activate"}>
                {t.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteTenant(t.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <Link to="/" className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-foreground">🛡️ Super Admin</h1>
          <p className="text-xs text-muted-foreground">Platform Management</p>
        </div>
        <button onClick={signOut} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><LogOut className="w-5 h-5" /></button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <Building2 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-display font-bold text-foreground">{tenants.length}</p>
            <p className="text-xs text-muted-foreground font-display">Total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-display font-bold text-foreground">{pendingTenants.length}</p>
            <p className="text-xs text-muted-foreground font-display">Pending</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-display font-bold text-foreground">{activeTenants.filter((t: any) => t.status === "active").length}</p>
            <p className="text-xs text-muted-foreground font-display">Active</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-display font-bold text-foreground">{memberships.length}</p>
            <p className="text-xs text-muted-foreground font-display">Users</p>
          </div>
        </div>

        {/* Credential Creation Modal */}
        {credentialTenantId && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6 border-2 border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-foreground">Create Admin Credentials for {getTenantName(credentialTenantId)}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-display text-muted-foreground mb-1 block">Admin Login ID *</label>
                <input className={inputCls} value={adminId} onChange={e => setAdminId(e.target.value)} placeholder="e.g. abc001" required />
              </div>
              <div>
                <label className="text-xs font-display text-muted-foreground mb-1 block">Password *</label>
                <input type="text" className={inputCls} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Min 6 chars" required />
              </div>
              <div>
                <label className="text-xs font-display text-muted-foreground mb-1 block">Admin Email (for notification)</label>
                <input type="email" className={inputCls} value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@college.ac.in" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={createCredentials} disabled={creatingCreds}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm disabled:opacity-50">
                {creatingCreds ? "Creating..." : "Create & Share Credentials"}
              </button>
              <button onClick={() => setCredentialTenantId(null)}
                className="px-4 py-2 rounded-xl bg-secondary/50 text-muted-foreground font-display text-sm hover:text-foreground">
                Cancel
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">The college admin will use this ID and password to log in, pay the subscription, and access their dashboard.</p>
          </motion.div>
        )}

        {/* Pending Requests */}
        {pendingTenants.length > 0 && (
          <>
            <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" /> Pending Requests ({pendingTenants.length})
            </h2>
            <div className="space-y-3 mb-8">
              {pendingTenants.map((t: any) => <TenantCard key={t.id} t={t} showActions="pending" />)}
            </div>
          </>
        )}

        {/* Active/Suspended Institutions */}
        <h2 className="text-lg font-display font-bold text-foreground mb-4">All Institutions</h2>
        <div className="space-y-3">
          {activeTenants.map((t: any) => <TenantCard key={t.id} t={t} showActions="active" />)}
          {activeTenants.length === 0 && <p className="text-sm text-muted-foreground">No approved institutions yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
