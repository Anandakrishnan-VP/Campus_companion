import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User | null;
  displayName: string;
}

const NotificationManager = ({ user, displayName }: Props) => {
  const { tenantId } = useTenant();
  const { data: notifications, refetch } = useRealtimeTable("notifications" as any);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");

  const sendNotification = async () => {
    if (!title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (!user) return;

    const { error } = await supabase.from("notifications" as any).insert({
      title: title.trim(),
      message: message.trim(),
      priority,
      created_by: user.id,
      created_by_name: displayName,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Notification sent!" });
    setTitle(""); setMessage(""); setPriority("normal"); setShowForm(false);
    refetch();
  };

  const deleteNotification = async (id: string) => {
    await (supabase.from("notifications" as any) as any).delete().eq("id", id);
    refetch();
  };

  const inputCls = "w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-body";
  const labelCls = "text-xs font-display text-muted-foreground mb-1 block";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5" /> Notifications
        </h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-display font-medium hover:bg-primary/20 transition-colors">
            <Plus className="w-4 h-4" /> Push Notification
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className={labelCls}>Title *</label><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Class cancelled tomorrow" /></div>
              <div className="col-span-2"><label className={labelCls}>Message</label><textarea className={`${inputCls} resize-none`} rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="Additional details..." /></div>
              <div><label className={labelCls}>Priority</label>
                <select className={inputCls} value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowForm(false); setTitle(""); setMessage(""); }} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Cancel</button>
              <button onClick={sendNotification} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-muted-foreground">No notifications yet. Push one to alert students!</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div key={n.id} className="glass-card p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display font-semibold text-foreground text-sm">{n.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-display font-medium ${
                    n.priority === "urgent" ? "bg-destructive/20 text-destructive" :
                    n.priority === "important" ? "bg-accent/20 text-accent" :
                    "bg-secondary text-muted-foreground"
                  }`}>{n.priority}</span>
                </div>
                {n.message && <p className="text-xs text-muted-foreground mt-1">{n.message}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{n.created_by_name} · {new Date(n.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => deleteNotification(n.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationManager;
