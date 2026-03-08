import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Request browser notification permission on first call.
 */
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/**
 * Show a browser notification (if allowed) + an in-app toast.
 */
function notify(title: string, body: string, icon?: string) {
  // In-app toast
  toast(title, { description: body, duration: 6000 });

  // Browser notification
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: icon || "/pwa-192x192.png", badge: "/pwa-192x192.png" });
    } catch {
      // Silent fail on environments that don't support Notification constructor
    }
  }
}

/**
 * Hook that subscribes to Supabase Realtime for:
 * 1. New student issues submitted
 * 2. Issues resolved by admin (status changed to 'resolved')
 * 3. New admin notifications posted
 */
export function useKioskNotifications() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    requestNotificationPermission();

    // Channel for student_issues
    const issuesChannel = supabase
      .channel("kiosk-issues-notify")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "student_issues" },
        (payload) => {
          const issue = payload.new as any;
          notify(
            "🗳️ New Student Voice Issue",
            `"${issue.title}" was just submitted. Head to Student Voice to vote!`
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "student_issues" },
        (payload) => {
          const issue = payload.new as any;
          const old = payload.old as any;
          if (issue.status === "resolved" && old.status !== "resolved") {
            notify(
              "✅ Issue Resolved",
              `"${issue.title}" has been addressed by the administration.`
            );
          }
        }
      )
      .subscribe();

    // Channel for notifications
    const notifChannel = supabase
      .channel("kiosk-admin-notify")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const notif = payload.new as any;
          const priority = notif.priority === "urgent" ? "🚨 " : "📢 ";
          notify(
            `${priority}${notif.title}`,
            notif.message || "New notification from administration."
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(issuesChannel);
      supabase.removeChannel(notifChannel);
    };
  }, []);
}
