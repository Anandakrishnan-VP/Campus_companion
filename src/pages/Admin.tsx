import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Clock, Calendar, MapPin, Plus, Trash2, Edit2, X, Check, LogOut, UserPlus, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationManager from "@/components/NotificationManager";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Tab = "faculty" | "timetable" | "events" | "locations" | "notifications";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth("admin");
  const [activeTab, setActiveTab] = useState<Tab>("faculty");

  const { data: faculty, refetch: refetchFaculty } = useRealtimeTable("faculty");
  const { data: timetable, refetch: refetchTimetable } = useRealtimeTable("timetable");
  const { data: events, refetch: refetchEvents } = useRealtimeTable("events");
  const { data: locations, refetch: refetchLocations } = useRealtimeTable("locations");

  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [showTimetableForm, setShowTimetableForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showCreateProfessor, setShowCreateProfessor] = useState(false);

  // Faculty form
  const [fName, setFName] = useState(""); const [fAliases, setFAliases] = useState("");
  const [fDept, setFDept] = useState(""); const [fOffice, setFOffice] = useState("");
  const [fEmail, setFEmail] = useState(""); const [fPhone, setFPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Timetable form
  const [tFacultyId, setTFacultyId] = useState(""); const [tDay, setTDay] = useState("Monday");
  const [tStart, setTStart] = useState("09:00"); const [tEnd, setTEnd] = useState("10:00");
  const [tSubject, setTSubject] = useState(""); const [tRoom, setTRoom] = useState("");

  // Event form
  const [eName, setEName] = useState(""); const [eDesc, setEDesc] = useState("");
  const [eLoc, setELoc] = useState(""); const [eDate, setEDate] = useState("");
  const [eStart, setEStart] = useState(""); const [eEnd, setEEnd] = useState("");

  // Location form
  const [lName, setLName] = useState(""); const [lType, setLType] = useState("Room");
  const [lFloor, setLFloor] = useState(""); const [lBlock, setLBlock] = useState("");
  const [lDesc, setLDesc] = useState(""); const [lLandmarks, setLLandmarks] = useState("");

  // Create professor account
  const [profId, setProfId] = useState(""); const [profPassword, setProfPassword] = useState("");
  const [profFacultyId, setProfFacultyId] = useState("");

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground font-display">Loading...</p></div>;

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "faculty", label: "Faculty", icon: Users },
    { key: "timetable", label: "Timetable", icon: Clock },
    { key: "events", label: "Events", icon: Calendar },
    { key: "locations", label: "Locations", icon: MapPin },
  ];

  const resetFacultyForm = () => { setFName(""); setFAliases(""); setFDept(""); setFOffice(""); setFEmail(""); setFPhone(""); setEditingId(null); setShowFacultyForm(false); };

  const saveFaculty = async () => {
    if (!fName.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    const payload = { name: fName.trim(), aliases: fAliases, department: fDept, office_location: fOffice, email: fEmail, phone: fPhone };
    if (editingId) {
      await supabase.from("faculty").update(payload).eq("id", editingId);
    } else {
      await supabase.from("faculty").insert(payload);
    }
    resetFacultyForm();
    refetchFaculty();
  };

  const editFaculty = (f: any) => {
    setFName(f.name); setFAliases(f.aliases || ""); setFDept(f.department); setFOffice(f.office_location || ""); setFEmail(f.email || ""); setFPhone(f.phone || ""); setEditingId(f.id); setShowFacultyForm(true);
  };

  const deleteFaculty = async (id: string) => { await supabase.from("faculty").delete().eq("id", id); refetchFaculty(); };

  const saveTimetable = async () => {
    if (!tFacultyId || !tSubject.trim()) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    await supabase.from("timetable").insert({ faculty_id: tFacultyId, day_of_week: tDay, start_time: tStart, end_time: tEnd, subject: tSubject, room: tRoom });
    setShowTimetableForm(false); setTSubject(""); setTRoom(""); refetchTimetable();
  };

  const deleteTimetable = async (id: string) => { await supabase.from("timetable").delete().eq("id", id); refetchTimetable(); };

  const saveEvent = async () => {
    if (!eName.trim() || !eDate) { toast({ title: "Title and date required", variant: "destructive" }); return; }
    await supabase.from("events").insert({ title: eName, description: eDesc, location: eLoc, event_date: eDate, start_time: eStart || null, end_time: eEnd || null });
    setShowEventForm(false); setEName(""); setEDesc(""); setELoc(""); setEDate(""); setEStart(""); setEEnd(""); refetchEvents();
  };

  const deleteEvent = async (id: string) => { await supabase.from("events").delete().eq("id", id); refetchEvents(); };

  const saveLocation = async () => {
    if (!lName.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    await supabase.from("locations").insert({ name: lName, type: lType, floor: lFloor, block: lBlock, description: lDesc, nearby_landmarks: lLandmarks });
    setShowLocationForm(false); setLName(""); setLType("Room"); setLFloor(""); setLBlock(""); setLDesc(""); setLLandmarks(""); refetchLocations();
  };

  const deleteLocation = async (id: string) => { await supabase.from("locations").delete().eq("id", id); refetchLocations(); };

  const createProfessorAccount = async () => {
    if (!profId.trim() || !profPassword || !profFacultyId) {
      toast({ title: "Fill all fields", variant: "destructive" }); return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("create-professor", {
        body: { professor_id: profId.trim(), password: profPassword, faculty_id: profFacultyId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Professor account created!" });
      setShowCreateProfessor(false); setProfId(""); setProfPassword(""); setProfFacultyId("");
      refetchFaculty();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const inputCls = "w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-body";
  const labelCls = "text-xs font-display text-muted-foreground mb-1 block";

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <Link to="/" className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">{user?.email?.replace("@campus.local", "")}</p>
        </div>
        <button onClick={() => setShowCreateProfessor(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/20 text-accent text-xs font-display font-medium hover:bg-accent/30 transition-colors">
          <UserPlus className="w-4 h-4" /> Create Professor
        </button>
        <button onClick={signOut} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><LogOut className="w-5 h-5" /></button>
      </header>

      <div className="flex gap-1 px-6 py-3 border-b border-border/30 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* FACULTY TAB */}
        {activeTab === "faculty" && (
          <Section title="Faculty Members">
            {showFacultyForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Name *</label><input className={inputCls} value={fName} onChange={e => setFName(e.target.value)} placeholder="Dr. Name" /></div>
                  <div><label className={labelCls}>Aliases</label><input className={inputCls} value={fAliases} onChange={e => setFAliases(e.target.value)} placeholder="Prof Name, Name Sir" /></div>
                  <div><label className={labelCls}>Department</label><input className={inputCls} value={fDept} onChange={e => setFDept(e.target.value)} placeholder="CS" /></div>
                  <div><label className={labelCls}>Office</label><input className={inputCls} value={fOffice} onChange={e => setFOffice(e.target.value)} placeholder="Room 204, Block A" /></div>
                  <div><label className={labelCls}>Email</label><input className={inputCls} value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="email@univ.edu" /></div>
                  <div><label className={labelCls}>Phone</label><input className={inputCls} value={fPhone} onChange={e => setFPhone(e.target.value)} /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={resetFacultyForm} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Cancel</button>
                  <button onClick={saveFaculty} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold">{editingId ? "Update" : "Add"}</button>
                </div>
              </motion.div>
            )}
            <div className="space-y-3">
              {faculty.map((f: any) => (
                <div key={f.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Aliases: {f.aliases || "—"} · Dept: {f.department || "—"}</p>
                    <p className="text-xs text-muted-foreground">Office: {f.office_location || "—"} · {f.user_id ? "✅ Has login" : "❌ No login"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editFaculty(f)} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteFaculty(f.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {!showFacultyForm && <AddButton label="Add Faculty" onClick={() => setShowFacultyForm(true)} />}
            </div>
          </Section>
        )}

        {/* TIMETABLE TAB */}
        {activeTab === "timetable" && (
          <Section title="Timetable">
            {showTimetableForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Faculty *</label>
                    <select className={inputCls} value={tFacultyId} onChange={e => setTFacultyId(e.target.value)}>
                      <option value="">Select faculty</option>
                      {faculty.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Day *</label>
                    <select className={inputCls} value={tDay} onChange={e => setTDay(e.target.value)}>
                      {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Start Time</label><input type="time" className={inputCls} value={tStart} onChange={e => setTStart(e.target.value)} /></div>
                  <div><label className={labelCls}>End Time</label><input type="time" className={inputCls} value={tEnd} onChange={e => setTEnd(e.target.value)} /></div>
                  <div><label className={labelCls}>Subject *</label><input className={inputCls} value={tSubject} onChange={e => setTSubject(e.target.value)} placeholder="Data Structures" /></div>
                  <div><label className={labelCls}>Room</label><input className={inputCls} value={tRoom} onChange={e => setTRoom(e.target.value)} placeholder="Room 301" /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowTimetableForm(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Cancel</button>
                  <button onClick={saveTimetable} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold">Add</button>
                </div>
              </motion.div>
            )}
            <div className="space-y-3">
              {timetable.map((t: any) => {
                const fac = faculty.find((f: any) => f.id === t.faculty_id);
                return (
                  <div key={t.id} className="glass-card p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-foreground">{t.subject} {t.is_cancelled && <span className="text-destructive text-xs">(Cancelled)</span>}</p>
                      <p className="text-xs text-muted-foreground mt-1">{fac?.name || "Unknown"} · {t.day_of_week} · {t.start_time?.slice(0,5)}–{t.end_time?.slice(0,5)} · {t.room}</p>
                    </div>
                    <button onClick={() => deleteTimetable(t.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                  </div>
                );
              })}
              {!showTimetableForm && <AddButton label="Add Timetable Slot" onClick={() => setShowTimetableForm(true)} />}
            </div>
          </Section>
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <Section title="Events">
            {showEventForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Title *</label><input className={inputCls} value={eName} onChange={e => setEName(e.target.value)} /></div>
                  <div><label className={labelCls}>Location</label><input className={inputCls} value={eLoc} onChange={e => setELoc(e.target.value)} /></div>
                  <div><label className={labelCls}>Date *</label><input type="date" className={inputCls} value={eDate} onChange={e => setEDate(e.target.value)} /></div>
                  <div><label className={labelCls}>Description</label><input className={inputCls} value={eDesc} onChange={e => setEDesc(e.target.value)} /></div>
                  <div><label className={labelCls}>Start Time</label><input type="time" className={inputCls} value={eStart} onChange={e => setEStart(e.target.value)} /></div>
                  <div><label className={labelCls}>End Time</label><input type="time" className={inputCls} value={eEnd} onChange={e => setEEnd(e.target.value)} /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowEventForm(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Cancel</button>
                  <button onClick={saveEvent} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold">Add</button>
                </div>
              </motion.div>
            )}
            <div className="space-y-3">
              {events.map((e: any) => (
                <div key={e.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">📍 {e.location || "—"} · 📅 {e.event_date} · 🕐 {e.start_time?.slice(0,5) || "—"}–{e.end_time?.slice(0,5) || "—"}</p>
                    {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                  </div>
                  <button onClick={() => deleteEvent(e.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {!showEventForm && <AddButton label="Add Event" onClick={() => setShowEventForm(true)} />}
            </div>
          </Section>
        )}

        {/* LOCATIONS TAB */}
        {activeTab === "locations" && (
          <Section title="Locations">
            {showLocationForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Name *</label><input className={inputCls} value={lName} onChange={e => setLName(e.target.value)} placeholder="AI Lab" /></div>
                  <div><label className={labelCls}>Type</label>
                    <select className={inputCls} value={lType} onChange={e => setLType(e.target.value)}>
                      {["Room","Lab","Hall","Office","Other"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Floor</label><input className={inputCls} value={lFloor} onChange={e => setLFloor(e.target.value)} placeholder="2nd Floor" /></div>
                  <div><label className={labelCls}>Block</label><input className={inputCls} value={lBlock} onChange={e => setLBlock(e.target.value)} placeholder="Block B" /></div>
                  <div><label className={labelCls}>Description</label><input className={inputCls} value={lDesc} onChange={e => setLDesc(e.target.value)} placeholder="Near east staircase" /></div>
                  <div><label className={labelCls}>Nearby Landmarks</label><input className={inputCls} value={lLandmarks} onChange={e => setLLandmarks(e.target.value)} /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowLocationForm(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Cancel</button>
                  <button onClick={saveLocation} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold">Add</button>
                </div>
              </motion.div>
            )}
            <div className="space-y-3">
              {locations.map((l: any) => (
                <div key={l.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground">{l.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{l.type} · {l.floor || "—"} · {l.block || "—"}</p>
                    {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
                  </div>
                  <button onClick={() => deleteLocation(l.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {!showLocationForm && <AddButton label="Add Location" onClick={() => setShowLocationForm(true)} />}
            </div>
          </Section>
        )}
      </div>

      {/* Create Professor Modal */}
      {showCreateProfessor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-foreground">Create Professor Account</h2>
              <button onClick={() => setShowCreateProfessor(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div><label className={labelCls}>Link to Faculty *</label>
              <select className={inputCls} value={profFacultyId} onChange={e => setProfFacultyId(e.target.value)}>
                <option value="">Select faculty member</option>
                {faculty.filter((f: any) => !f.user_id).map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Professor ID *</label><input className={inputCls} value={profId} onChange={e => setProfId(e.target.value)} placeholder="e.g. prof_john" /></div>
            <div><label className={labelCls}>Password *</label><input type="password" className={inputCls} value={profPassword} onChange={e => setProfPassword(e.target.value)} placeholder="min 6 characters" /></div>
            <button onClick={createProfessorAccount} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm">Create Account</button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <h2 className="text-lg font-display font-bold text-foreground mb-4">{title}</h2>
    {children}
  </motion.div>
);

const AddButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full py-3 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 font-display">
    <Plus className="w-4 h-4" />{label}
  </button>
);

export default Admin;
