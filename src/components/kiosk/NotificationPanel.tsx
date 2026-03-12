import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Megaphone, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_by_name: string;
  priority: string;
  created_at: string;
}

const priorityConfig: Record<string, {icon: typeof Info;color: string;bg: string;}> = {
  normal: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
  important: { icon: Megaphone, color: "text-accent", bg: "bg-accent/10" },
  urgent: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" }
};

const NotificationPanel = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeen, setLastSeen] = useState<string>(
    () => localStorage.getItem("notif_last_seen") || "2000-01-01T00:00:00Z"
  );

  const fetchNotifications = async () => {
    const { data } = await supabase.
    from("notifications").
    select("*").
    order("created_at", { ascending: false }).
    limit(50);
    if (data) {
      setNotifications(data as Notification[]);
      const unseen = data.filter((n: any) => n.created_at > lastSeen).length;
      setUnreadCount(unseen);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase.
    channel("notifications-realtime").
    on("postgres_changes" as any, { event: "*", schema: "public", table: "notifications" } as any, () => {
      fetchNotifications();
    }).
    subscribe();

    return () => {supabase.removeChannel(channel);};
  }, [lastSeen]);

  const handleOpen = () => {
    setOpen(true);
    const now = new Date().toISOString();
    setLastSeen(now);
    localStorage.setItem("notif_last_seen", now);
    setUnreadCount(0);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
        
        <Bell className="w-5 h-5 text-yellow-300" />
        {unreadCount > 0 &&
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
          
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        }
      </button>

      <AnimatePresence>
        {open &&
        <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)} />
          
            <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[400px] z-50 max-h-[80vh] flex flex-col glass-card overflow-hidden">
            
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-display font-bold text-foreground">Notifications</h2>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {notifications.length === 0 ?
              <div className="py-12 text-center">
                    <Bell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div> :

              notifications.map((n) => {
                const cfg = priorityConfig[n.priority] || priorityConfig.normal;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl p-4 ${cfg.bg} border border-border/20`}>
                    
                        <div className="flex items-start gap-3">
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-sm text-foreground">{n.title}</p>
                            {n.message && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-muted-foreground font-display">{n.created_by_name}</span>
                              <span className="text-[10px] text-muted-foreground/50">·</span>
                              <span className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>);

              })
              }
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>
    </>);

};

export default NotificationPanel;