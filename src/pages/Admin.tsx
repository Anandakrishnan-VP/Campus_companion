import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Clock, Calendar, MapPin, Plus, Trash2, Edit2, X, LogOut, UserPlus, Bell, Copy, CheckCheck } from "lucide-react";
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

  // Faculty form
  const [fName, setFName] = useState(""); const [fAliases, setFAliases] = useState("");
  const [fDept, setFDept] = useState(""); const [fOffice, setFOffice] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Timetable form
  const [tFacultyId, setTFacultyId] = useState(""); const [tDay, setTDay] = useState("Monday");
  const [tStart, setTStart] = useState("09:00"); const [tEnd, setTEnd] = useState("10:00");
  const [tSubject, setTSubject] = useState(""); const [tRoom, setTRoom] = useState("");

  // Event form
  const [eName, setEName] = useState(""); const [eDesc, setEDesc] = useState("");
  const [eVenue, setEVenue] = useState(""); const [eDate, setEDate] = useState("");
  const [eStart, setEStart] = useState(""); const [eEnd, setEEnd] = useState("");

  // Location form
  const [lName, setLName] = useState(""); const [lType, setLType] = useState("Room");
  const [lFloor, setLFloor] = useState(""); const [lBlock, setLBlock] = useState("");
  const [lDesc, setLDesc] = useState(""); const [lLandmarks, setLLandmarks] = useState("");
  const [lDirections, setLDirections] = useState("");

  // Professor credentials modal
  const [creatingProf, setCreatingProf] = useState(false);
  const [profCredentials, setProfCredentials] = useState<{ id: string; password: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground font-display">Loading...</p></div>;

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "faculty", label: "Faculty", icon: Users },
    { key: "timetable", label: "Timetable", icon: Clock },
    { key: "events", label: "Events", icon: Calendar },
    { key: "locations", label: "Locations", icon: MapPin },
    { key: "notifications", label: "Notifications", icon: Bell },
  ];

  const resetFacultyForm = () => { setFName(""); setFAliases(""); setFDept(""); setFOffice(""); setFPhone(""); setEditingId(null); setShowFacultyForm(false); };

  const saveFaculty = async () => {
    if (!fName.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    const payload = { name: fName.trim(), aliases: fAliases, department: fDept, office_location: fOffice, phone: fPhone };
    if (editingId) {
      await supabase.from("faculty").update(payload).eq("id", editingId);
      resetFacultyForm();
      refetchFaculty();
    } else {
      const { data: newFac, error } = await supabase.from("faculty").insert(payload).select("id").single();
      if (error || !newFac) {
        toast({ title: "Error adding faculty", variant: "destructive" });
        return;
      }
      resetFacultyForm();
      refetchFaculty();
      setCreatingProf(true);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("create-professor", {
          body: { faculty_id: newFac.id },
        });
        if (fnErr) throw fnErr;
        if (data?.error) throw new Error(data.error);
        setProfCredentials({ id: data.professor_id, password: data.password, name: fName.trim() });
        refetchFaculty();
      } catch (err: any) {
        toast({ title: "Faculty added but account creation failed", description: err.message, variant: "destructive" });
      }
      setCreatingProf(false);
    }
  };

  const editFaculty = (f: any) => {
    setFName(f.name); setFAliases(f.aliases || ""); setFDept(f.department); setFOffice(f.office_location || ""); setFPhone(f.phone || ""); setEditingId(f.id); setShowFacultyForm(true);
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
    await supabase.from("events").insert({ title: eName, description: eDesc, location: eVenue, event_date: eDate, start_time: eStart || null, end_time: eEnd || null });
    setShowEventForm(false); setEName(""); setEDesc(""); setEVenue(""); setEDate(""); setEStart(""); setEEnd(""); refetchEvents();
  };

  const deleteEvent = async (id: string) => { await supabase.from("events").delete().eq("id", id); refetchEvents(); };

  const saveLocation = async () => {
    if (!lName.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    await (supabase.from("locations") as any).insert({ name: lName, type: lType, floor: lFloor, block: lBlock, description: lDesc, nearby_landmarks: lLandmarks, directions: lDirections });
    setShowLocationForm(false); setLName(""); setLType("Room"); setLFloor(""); setLBlock(""); setLDesc(""); setLLandmarks(""); setLDirections(""); refetchLocations();
  };

  const deleteLocation = async (id: string) => { await supabase.from("locations").delete().eq("id", id); refetchLocations(); };

  const copyCredentials = () => {
    if (!profCredentials) return;
    navigator.clipboard.writeText(`ID: ${profCredentials.id}\nPassword: ${profCredentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = "w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-body";
  const labelCls = "text-xs font-display text-muted-foreground mb-1 block";

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <Link to="/" className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">ID: 047</p>
        </div>
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
                  <div><label className={labelCls}>Aliases (nicknames)</label><input className={inputCls} value={fAliases} onChange={e => setFAliases(e.target.value)} placeholder="Prof Name, Name Sir" /></div>
                  <div><label className={labelCls}>Department *</label><input className={inputCls} value={fDept} onChange={e => setFDept(e.target.value)} placeholder="Computer Science" /></div>
                  <div><label className={labelCls}>Office Location *</label><input className={inputCls} value={fOffice} onChange={e => setFOffice(e.target.value)} placeholder="Room 204, Block A" /></div>
                  <div><label className={labelCls}>Phone Number *</label><input className={inputCls} value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="+91-XXXXX-XXXXX" /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={resetFacultyForm} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Cancel</button>
                  <button onClick={saveFaculty} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold">{editingId ? "Update" : "Add & Create Login"}</button>
                </div>
              </motion.div>
            )}
            <div className="space-y-3">
              {faculty.map((f: any) => (
                <div key={f.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Dept: {f.department || "—"} · Office: {f.office_location || "—"}</p>
                    <p className="text-xs text-muted-foreground">Phone: {f.phone || "—"} · {f.user_id ? `✅ Login ID: ${f.email?.replace("@campus.local", "") || "linked"}` : "❌ No login"}</p>
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
                  <div><label className={labelCls}>Start Time *</label><input type="time" className={inputCls} value={tStart} onChange={e => setTStart(e.target.value)} /></div>
                  <div><label className={labelCls}>End Time *</label><input type="time" className={inputCls} value={tEnd} onChange={e => setTEnd(e.target.value)} /></div>
                  <div><label className={labelCls}>Subject *</label><input className={inputCls} value={tSubject} onChange={e => setTSubject(e.target.value)} placeholder="Data Structures" /></div>
                  <div><label className={labelCls}>Room *</label><input className={inputCls} value={tRoom} onChange={e => setTRoom(e.target.value)} placeholder="Room 301" /></div>
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
                  <div><label className={labelCls}>Event Title *</label><input className={inputCls} value={eName} onChange={e => setEName(e.target.value)} placeholder="Tech Fest 2026" /></div>
                  <div><label className={labelCls}>Venue *</label><input className={inputCls} value={eVenue} onChange={e => setEVenue(e.target.value)} placeholder="Main Auditorium" /></div>
                  <div><label className={labelCls}>Date *</label><input type="date" className={inputCls} value={eDate} onChange={e => setEDate(e.target.value)} /></div>
                  <div><label className={labelCls}>Description</label><input className={inputCls} value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="Annual tech festival" /></div>
                  <div><label className={labelCls}>Start Time *</label><input type="time" className={inputCls} value={eStart} onChange={e => setEStart(e.target.value)} /></div>
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
                    <p className="text-xs text-muted-foreground mt-1">Venue: {e.location || "—"} · Date: {e.event_date} · Time: {e.start_time?.slice(0,5) || "—"}–{e.end_time?.slice(0,5) || "—"}</p>
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
          <Section title="Locations & Navigation">
            {showLocationForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Place Name *</label><input className={inputCls} value={lName} onChange={e => setLName(e.target.value)} placeholder="AI Lab" /></div>
                  <div><label className={labelCls}>Type</label>
                    <select className={inputCls} value={lType} onChange={e => setLType(e.target.value)}>
                      {["Room","Lab","Hall","Office","Library","Cafeteria","Washroom","Parking","Other"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Floor</label><input className={inputCls} value={lFloor} onChange={e => setLFloor(e.target.value)} placeholder="2nd Floor" /></div>
                  <div><label className={labelCls}>Block</label><input className={inputCls} value={lBlock} onChange={e => setLBlock(e.target.value)} placeholder="Block B" /></div>
                  <div className="col-span-2"><label className={labelCls}>How to Reach (Directions) *</label><input className={inputCls} value={lDirections} onChange={e => setLDirections(e.target.value)} placeholder="Enter main gate, turn left, take stairs to 2nd floor, 3rd room on right" /></div>
                  <div><label className={labelCls}>Description</label><input className={inputCls} value={lDesc} onChange={e => setLDesc(e.target.value)} placeholder="Computer lab with 60 seats" /></div>
                  <div><label className={labelCls}>Nearby Landmarks</label><input className={inputCls} value={lLandmarks} onChange={e => setLLandmarks(e.target.value)} placeholder="Next to library, opposite canteen" /></div>
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
                    {(l as any).directions && <p className="text-xs text-primary/80 mt-1">📍 How to reach: {(l as any).directions}</p>}
                    {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
                  </div>
                  <button onClick={() => deleteLocation(l.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {!showLocationForm && <AddButton label="Add Location" onClick={() => setShowLocationForm(true)} />}
            </div>
          </Section>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <NotificationManager user={user} displayName="Admin" />
        )}
      </div>

      {/* Professor Credentials Modal */}
      {(creatingProf || profCredentials) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-6 w-full max-w-sm mx-4 text-center space-y-4">
            {creatingProf ? (
              <>
                <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-display">Creating professor account...</p>
              </>
            ) : profCredentials ? (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCheck className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-lg font-display font-bold text-foreground">Professor Account Created!</h2>
                <p className="text-xs text-muted-foreground">Share these credentials with <strong>{profCredentials.name}</strong></p>
                
                <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-display">Login ID</span>
                    <span className="font-mono font-bold text-foreground text-lg">{profCredentials.id}</span>
                  </div>
                  <div className="border-t border-border/30" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-display">Password</span>
                    <span className="font-mono font-bold text-foreground">{profCredentials.password}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={copyCredentials} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-display font-medium hover:bg-secondary/80 transition-colors">
                    {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={() => setProfCredentials(null)} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-display font-semibold">
                    Done
                  </button>
                </div>
              </>
            ) : null}
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
