import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Calendar, Clock, Check, X, Edit2, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationManager from "@/components/NotificationManager";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Professor = () => {
  const { user, loading: authLoading, signOut, facultyId } = useAuth("professor");
  const [activeTab, setActiveTab] = useState<"attendance" | "timetable" | "notifications">("attendance");
  const [todayStatus, setTodayStatus] = useState<string | null>(null);

  const { data: myTimetable, refetch: refetchTimetable } = useRealtimeTable("timetable", facultyId ? { column: "faculty_id", value: facultyId } : undefined);
  const { data: myAttendance } = useRealtimeTable("attendance", facultyId ? { column: "faculty_id", value: facultyId } : undefined);
  const { data: facultyData } = useRealtimeTable("faculty");

  const myFaculty = facultyData.find((f: any) => f.id === facultyId);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const todayRecord = myAttendance.find((a: any) => a.date === today);
    setTodayStatus(todayRecord?.status || null);
  }, [myAttendance, today]);

  // Edit timetable
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState(""); const [editRoom, setEditRoom] = useState("");
  const [editStart, setEditStart] = useState(""); const [editEnd, setEditEnd] = useState("");

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground font-display">Loading...</p></div>;

  if (!facultyId) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm mx-4">
        <p className="text-foreground font-display font-semibold mb-2">No Faculty Record</p>
        <p className="text-sm text-muted-foreground">Your account is not linked to a faculty record. Please contact the admin.</p>
        <button onClick={signOut} className="mt-4 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Sign Out</button>
      </div>
    </div>
  );

  const markAttendance = async (status: "present" | "absent" | "leave") => {
    const existing = myAttendance.find((a: any) => a.date === today);
    if (existing) {
      await supabase.from("attendance").update({ status }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({ faculty_id: facultyId, date: today, status });
    }
    // Also update is_present on faculty
    await supabase.from("faculty").update({ is_present: status === "present" }).eq("id", facultyId);
    setTodayStatus(status);
    toast({ title: `Marked as ${status}` });
  };

  const toggleCancel = async (id: string, current: boolean) => {
    await supabase.from("timetable").update({ is_cancelled: !current }).eq("id", id);
    refetchTimetable();
  };

  const startEdit = (slot: any) => {
    setEditingSlot(slot.id); setEditSubject(slot.subject); setEditRoom(slot.room);
    setEditStart(slot.start_time?.slice(0, 5)); setEditEnd(slot.end_time?.slice(0, 5));
  };

  const saveEdit = async () => {
    if (!editingSlot) return;
    await supabase.from("timetable").update({ subject: editSubject, room: editRoom, start_time: editStart, end_time: editEnd }).eq("id", editingSlot);
    setEditingSlot(null); refetchTimetable();
    toast({ title: "Schedule updated" });
  };

  const inputCls = "w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground font-body focus:outline-none focus:border-primary/50";
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <Link to="/" className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-foreground">{myFaculty?.name || "Professor"}</h1>
          <p className="text-xs text-muted-foreground">ID: {user?.email?.replace("@campus.local", "")} · {myFaculty?.department}</p>
        </div>
        <button onClick={signOut} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><LogOut className="w-5 h-5" /></button>
      </header>

      <div className="flex gap-1 px-6 py-3 border-b border-border/30">
        <button onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all ${activeTab === "attendance" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}>
          <Calendar className="w-4 h-4" />Attendance
        </button>
        <button onClick={() => setActiveTab("timetable")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all ${activeTab === "timetable" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}>
          <Clock className="w-4 h-4" />My Timetable
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {activeTab === "attendance" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6 text-center">
              <h2 className="text-lg font-display font-bold text-foreground mb-2">Today's Attendance</h2>
              <p className="text-sm text-muted-foreground mb-4">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              {todayStatus && (
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-display font-semibold mb-4 ${todayStatus === "present" ? "bg-green-500/20 text-green-400" : todayStatus === "absent" ? "bg-destructive/20 text-destructive" : "bg-yellow-500/20 text-yellow-400"}`}>
                  Currently: {todayStatus.charAt(0).toUpperCase() + todayStatus.slice(1)}
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <button onClick={() => markAttendance("present")} className={`px-6 py-3 rounded-xl text-sm font-display font-semibold transition-all ${todayStatus === "present" ? "bg-green-500 text-background" : "bg-secondary text-secondary-foreground hover:bg-green-500/20"}`}>
                  <Check className="w-4 h-4 inline mr-1" />Present
                </button>
                <button onClick={() => markAttendance("absent")} className={`px-6 py-3 rounded-xl text-sm font-display font-semibold transition-all ${todayStatus === "absent" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground hover:bg-destructive/20"}`}>
                  <X className="w-4 h-4 inline mr-1" />Absent
                </button>
                <button onClick={() => markAttendance("leave")} className={`px-6 py-3 rounded-xl text-sm font-display font-semibold transition-all ${todayStatus === "leave" ? "bg-yellow-500 text-background" : "bg-secondary text-secondary-foreground hover:bg-yellow-500/20"}`}>
                  On Leave
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-display font-bold text-foreground mb-3">Recent Attendance</h3>
              <div className="space-y-2">
                {myAttendance.slice(0, 7).map((a: any) => (
                  <div key={a.id} className="glass-card px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-foreground font-body">{a.date}</span>
                    <span className={`text-xs font-display font-semibold px-3 py-1 rounded-full ${a.status === "present" ? "bg-green-500/20 text-green-400" : a.status === "absent" ? "bg-destructive/20 text-destructive" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "timetable" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg font-display font-bold text-foreground mb-4">My Schedule</h2>
            {days.map(day => {
              const slots = myTimetable.filter((t: any) => t.day_of_week === day).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
              if (slots.length === 0) return null;
              return (
                <div key={day} className="mb-4">
                  <h3 className="text-sm font-display font-semibold text-muted-foreground mb-2">{day}</h3>
                  <div className="space-y-2">
                    {slots.map((slot: any) => (
                      <div key={slot.id} className={`glass-card p-4 ${slot.is_cancelled ? "opacity-50" : ""}`}>
                        {editingSlot === slot.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input className={inputCls} value={editSubject} onChange={e => setEditSubject(e.target.value)} placeholder="Subject" />
                              <input className={inputCls} value={editRoom} onChange={e => setEditRoom(e.target.value)} placeholder="Room" />
                              <input type="time" className={inputCls} value={editStart} onChange={e => setEditStart(e.target.value)} />
                              <input type="time" className={inputCls} value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingSlot(null)} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-display">Cancel</button>
                              <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display font-semibold">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-display font-semibold text-foreground text-sm">{slot.subject} {slot.is_cancelled && <span className="text-destructive">(Cancelled)</span>}</p>
                              <p className="text-xs text-muted-foreground mt-1">{slot.start_time?.slice(0,5)}–{slot.end_time?.slice(0,5)} · {slot.room}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => startEdit(slot)} className="p-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => toggleCancel(slot.id, slot.is_cancelled)} className={`px-2 py-1.5 rounded-lg text-xs font-display ${slot.is_cancelled ? "bg-green-500/20 text-green-400" : "bg-destructive/10 text-destructive"}`}>
                                {slot.is_cancelled ? "Restore" : "Cancel"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {myTimetable.length === 0 && (
              <div className="glass-card p-6 text-center">
                <p className="text-muted-foreground text-sm">No timetable slots assigned yet. Contact admin to set up your schedule.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Professor;
