import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Calendar, MapPin, Plus, Trash2, Edit2, X, LogOut, UserPlus, Bell, Copy, CheckCheck, Clock, ChevronDown, ChevronUp, Save, Brain, MessageSquare, Building2, Upload, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationManager from "@/components/NotificationManager";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import IssuesManager from "@/components/admin/IssuesManager";
import CsvImporter, { FACULTY_CSV_FIELDS, LOCATION_CSV_FIELDS } from "@/components/admin/CsvImporter";

type Tab = "faculty" | "events" | "locations" | "departments" | "brain" | "issues" | "notifications" | "emergency";

interface ScheduleSlot {
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: string;
  room: string;
}

interface DaySlotInput {
  start_time: string;
  end_time: string;
  room: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth("admin");
  const [activeTab, setActiveTab] = useState<Tab>("faculty");

  const { data: faculty, refetch: refetchFaculty } = useRealtimeTable("faculty");
  const { data: timetable, refetch: refetchTimetable } = useRealtimeTable("timetable");
  const { data: events, refetch: refetchEvents } = useRealtimeTable("events");
  const { data: locations, refetch: refetchLocations } = useRealtimeTable("locations");
  const { data: knowledgeBase, refetch: refetchKB } = useRealtimeTable("knowledge_base");
  const { data: departments, refetch: refetchDepts } = useRealtimeTable("departments");
  const { data: emergencyContacts, refetch: refetchEmergency } = useRealtimeTable("emergency_contacts");

  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showBrainForm, setShowBrainForm] = useState(false);
  const [showCsvFaculty, setShowCsvFaculty] = useState(false);
  const [showCsvLocations, setShowCsvLocations] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptHod, setDeptHod] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // Faculty form
  const [fName, setFName] = useState(""); const [fAliases, setFAliases] = useState("");
  const [fDept, setFDept] = useState(""); const [fOffice, setFOffice] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Inline schedule slots for new faculty - organized by day
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [daySlotInputs, setDaySlotInputs] = useState<Record<string, DaySlotInput>>({});
  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  // Expanded faculty card (to view/edit schedule)
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null);
  // Editing existing timetable slot
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [esDay, setEsDay] = useState(""); const [esStart, setEsStart] = useState("");
  const [esEnd, setEsEnd] = useState(""); const [esRoom, setEsRoom] = useState("");
  // Adding new slot to existing faculty
  const [addingSlotFor, setAddingSlotFor] = useState<string | null>(null);
  const [nsDay, setNsDay] = useState("Monday"); const [nsStart, setNsStart] = useState("09:00");
  const [nsEnd, setNsEnd] = useState("10:00"); const [nsRoom, setNsRoom] = useState("");

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
  const [bulkCredentials, setBulkCredentials] = useState<{ id: string; password: string; name: string }[]>([]);
  const [bulkCreatingCount, setBulkCreatingCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Brain (knowledge base) form
  const [kbCategory, setKbCategory] = useState("General");
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");

  // Emergency form
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [emLabel, setEmLabel] = useState("");
  const [emValue, setEmValue] = useState("");
  const [emType, setEmType] = useState("phone");
  const [editingEmId, setEditingEmId] = useState<string | null>(null);
  const [emSubmitting, setEmSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const BRAIN_CATEGORIES = ["General", "Admissions", "Courses", "Facilities", "History", "Placements", "Hostel", "Transport", "Fees", "Clubs & Activities", "Rules & Policies", "Other"];

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground font-display">Loading...</p></div>;

  const saveKBEntry = async () => {
    if (submitting) return;
    if (!kbTitle.trim() || !kbContent.trim()) { toast({ title: "Title and content required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("knowledge_base").insert({ category: kbCategory, title: kbTitle.trim(), content: kbContent.trim() });
      if (error) { toast({ title: "Error saving knowledge entry", description: error.message, variant: "destructive" }); return; }
      setShowBrainForm(false); setKbTitle(""); setKbContent(""); setKbCategory("General"); refetchKB();
      toast({ title: "Knowledge added to Brain" });
    } finally { setSubmitting(false); }
  };

  const deleteKBEntry = async (id: string) => {
    const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
    if (error) { toast({ title: "Error deleting entry", description: error.message, variant: "destructive" }); return; }
    refetchKB();
  };


  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "faculty", label: "Faculty & Schedule", icon: Users },
    { key: "events", label: "Events", icon: Calendar },
    { key: "locations", label: "Locations", icon: MapPin },
    { key: "departments", label: "Departments", icon: Building2 },
    { key: "brain", label: "Brain", icon: Brain },
    { key: "issues", label: "Issues", icon: MessageSquare },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "emergency", label: "Emergency", icon: AlertTriangle },
  ];

  // --- Faculty + Schedule helpers ---
  const resetFacultyForm = () => {
    setFName(""); setFAliases(""); setFDept(""); setFOffice(""); setFPhone("");
    setEditingId(null); setShowFacultyForm(false); setScheduleSlots([]);
    setDaySlotInputs({}); setExpandedDays([]);
  };

  const getDaySlotInput = (day: string): DaySlotInput => daySlotInputs[day] || { start_time: "09:00", end_time: "10:00", room: "" };

  const updateDaySlotInput = (day: string, field: keyof DaySlotInput, value: string) => {
    setDaySlotInputs(prev => ({ ...prev, [day]: { ...getDaySlotInput(day), [field]: value } }));
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const addSlotForDay = (day: string) => {
    const input = getDaySlotInput(day);
    setScheduleSlots(prev => [...prev, { day_of_week: day, start_time: input.start_time, end_time: input.end_time, subject: "", room: input.room }]);
    setDaySlotInputs(prev => ({ ...prev, [day]: { start_time: "09:00", end_time: "10:00", room: "" } }));
  };

  const removeSlotFromList = (idx: number) => {
    setScheduleSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const saveFaculty = async () => {
    if (submitting) return;
    if (!fName.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
    const payload = { name: fName.trim(), aliases: fAliases, department: fDept, office_location: fOffice, phone: fPhone };
    if (editingId) {
      await supabase.from("faculty").update(payload).eq("id", editingId);
      resetFacultyForm();
      refetchFaculty();
      toast({ title: "Faculty updated" });
    } else {
      const { data: newFac, error } = await supabase.from("faculty").insert(payload).select("id").single();
      if (error || !newFac) { toast({ title: "Error adding faculty", variant: "destructive" }); return; }

      // Insert schedule slots
      if (scheduleSlots.length > 0) {
        await supabase.from("timetable").insert(
          scheduleSlots.map(s => ({ ...s, faculty_id: newFac.id }))
        );
        refetchTimetable();
      }

      const savedName = fName.trim();
      resetFacultyForm();
      refetchFaculty();

      // Auto-create professor account
      setCreatingProf(true);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("create-professor", { body: { faculty_id: newFac.id } });
        setCreatingProf(false);
        if (fnErr) throw fnErr;
        if (data?.error) throw new Error(data.error);
        setProfCredentials({ id: data.professor_id, password: data.password, name: savedName });
        refetchFaculty();
      } catch (err: any) {
        setCreatingProf(false);
        toast({ title: "Faculty added but account creation failed", description: err.message, variant: "destructive" });
      }
    }
    } finally { setSubmitting(false); }
  };

  const editFaculty = (f: any) => {
    setFName(f.name); setFAliases(f.aliases || ""); setFDept(f.department);
    setFOffice(f.office_location || ""); setFPhone(f.phone || "");
    setEditingId(f.id); setShowFacultyForm(true); setScheduleSlots([]);
  };

  const deleteFaculty = async (id: string) => {
    await supabase.from("timetable").delete().eq("faculty_id", id);
    await supabase.from("faculty").delete().eq("id", id);
    refetchFaculty(); refetchTimetable();
  };

  // Existing timetable slot editing
  const startEditSlot = (slot: any) => {
    setEditingSlotId(slot.id); setEsDay(slot.day_of_week);
    setEsStart(slot.start_time?.slice(0, 5)); setEsEnd(slot.end_time?.slice(0, 5));
    setEsRoom(slot.room);
  };

  const saveEditSlot = async () => {
    if (!editingSlotId) return;
    await supabase.from("timetable").update({ day_of_week: esDay, start_time: esStart, end_time: esEnd, subject: "", room: esRoom }).eq("id", editingSlotId);
    setEditingSlotId(null); refetchTimetable();
    toast({ title: "Slot updated" });
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("timetable").delete().eq("id", id);
    refetchTimetable();
  };

  const addNewSlotToFaculty = async (facultyId: string) => {
    await supabase.from("timetable").insert({ faculty_id: facultyId, day_of_week: nsDay, start_time: nsStart, end_time: nsEnd, subject: "", room: nsRoom });
    setAddingSlotFor(null); setNsRoom("");
    refetchTimetable();
    toast({ title: "Slot added" });
  };

  // --- Event helpers ---
  const saveEvent = async () => {
    if (submitting) return;
    if (!eName.trim() || !eDate) { toast({ title: "Title and date required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("events").insert({ title: eName, description: eDesc, location: eVenue, event_date: eDate, start_time: eStart || null, end_time: eEnd || null });
      if (error) { toast({ title: "Error saving event", description: error.message, variant: "destructive" }); return; }
      setShowEventForm(false); setEName(""); setEDesc(""); setEVenue(""); setEDate(""); setEStart(""); setEEnd(""); refetchEvents();
      toast({ title: "Event added" });
    } finally { setSubmitting(false); }
  };
  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast({ title: "Error deleting event", description: error.message, variant: "destructive" }); return; }
    refetchEvents();
  };

  // --- Location helpers ---
  const saveLocation = async () => {
    if (submitting) return;
    if (!lName.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("locations").insert({ name: lName, type: lType, floor: lFloor, block: lBlock, description: lDesc, nearby_landmarks: lLandmarks, directions: lDirections });
      if (error) { toast({ title: "Error saving location", description: error.message, variant: "destructive" }); return; }
      setShowLocationForm(false); setLName(""); setLType("Room"); setLFloor(""); setLBlock(""); setLDesc(""); setLLandmarks(""); setLDirections(""); refetchLocations();
      toast({ title: "Location added" });
    } finally { setSubmitting(false); }
  };
  const deleteLocation = async (id: string) => {
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) { toast({ title: "Error deleting location", description: error.message, variant: "destructive" }); return; }
    refetchLocations();
  };

  // --- Department helpers ---
  const resetDeptForm = () => { setDeptName(""); setDeptHod(""); setDeptDesc(""); setEditingDeptId(null); setShowDeptForm(false); };

  const saveDepartment = async () => {
    if (submitting) return;
    if (!deptName.trim()) { toast({ title: "Department name required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const payload = { name: deptName.trim(), hod_name: deptHod.trim(), description: deptDesc.trim() };
      if (editingDeptId) {
        const { error } = await supabase.from("departments").update(payload).eq("id", editingDeptId);
        if (error) { toast({ title: "Error updating department", description: error.message, variant: "destructive" }); return; }
        toast({ title: "Department updated" });
      } else {
        const { error } = await supabase.from("departments").insert(payload);
        if (error) { toast({ title: "Error adding department", description: error.message, variant: "destructive" }); return; }
        toast({ title: "Department added" });
      }
      resetDeptForm(); refetchDepts();
    } finally { setSubmitting(false); }
  };

  const editDepartment = (d: any) => {
    setDeptName(d.name); setDeptHod(d.hod_name || ""); setDeptDesc(d.description || "");
    setEditingDeptId(d.id); setShowDeptForm(true);
  };

  const deleteDepartment = async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) { toast({ title: "Error deleting department", description: error.message, variant: "destructive" }); return; }
    refetchDepts();
  };

  const copyCredentials = () => {
    if (bulkCredentials.length > 0) {
      const text = bulkCredentials.map(c => `${c.name}: ID ${c.id}, Password ${c.password}`).join("\n");
      navigator.clipboard.writeText(text);
    } else if (profCredentials) {
      navigator.clipboard.writeText(`ID: ${profCredentials.id}\nPassword: ${profCredentials.password}`);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleFacultyCsvImported = async (insertedRows: any[]) => {
    if (!insertedRows || insertedRows.length === 0) return;
    setBulkCreatingCount(insertedRows.length);
    const creds: { id: string; password: string; name: string }[] = [];
    for (const row of insertedRows) {
      try {
        const { data, error } = await supabase.functions.invoke("create-professor", { body: { faculty_id: row.id } });
        if (!error && data && !data.error) {
          creds.push({ id: data.professor_id, password: data.password, name: row.name });
        }
      } catch (err) {
        console.error("Failed to create professor for", row.name, err);
      }
    }
    setBulkCreatingCount(0);
    refetchFaculty();
    if (creds.length > 0) {
      setBulkCredentials(creds);
    } else {
      toast({ title: "Faculty imported but account creation failed for all", variant: "destructive" });
    }
  };

  const inputCls = "w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-body";
  const labelCls = "text-xs font-display text-muted-foreground mb-1 block";

  const getFacultySchedule = (facultyId: string) =>
    timetable.filter((t: any) => t.faculty_id === facultyId).sort((a: any, b: any) => {
      const dayOrder = DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week);
      return dayOrder !== 0 ? dayOrder : a.start_time.localeCompare(b.start_time);
    });

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

        {/* ===== FACULTY & SCHEDULE TAB ===== */}
        {activeTab === "faculty" && (
          <Section title="Faculty Members & Schedules">
            {/* Add/Edit Faculty Form */}
            {showFacultyForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-4 mb-4 space-y-4">
                <p className="text-sm font-display font-semibold text-foreground">{editingId ? "Edit Faculty" : "Add New Faculty"}</p>

                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Name *</label><input className={inputCls} value={fName} onChange={e => setFName(e.target.value)} placeholder="Dr. Name" /></div>
                  <div><label className={labelCls}>Aliases (nicknames)</label><input className={inputCls} value={fAliases} onChange={e => setFAliases(e.target.value)} placeholder="Prof Name, Name Sir" /></div>
                  <div><label className={labelCls}>Department *</label><input className={inputCls} value={fDept} onChange={e => setFDept(e.target.value)} placeholder="Computer Science" /></div>
                  <div><label className={labelCls}>Office Location *</label><input className={inputCls} value={fOffice} onChange={e => setFOffice(e.target.value)} placeholder="Room 204, Block A" /></div>
                  <div><label className={labelCls}>Phone Number</label><input className={inputCls} value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="+91-XXXXX-XXXXX" /></div>
                </div>

                {/* Schedule section (only for new faculty) */}
                {!editingId && (
                  <div className="border-t border-border/30 pt-4">
                    <p className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Weekly Schedule
                    </p>

                    {/* Already added slots summary */}
                    {scheduleSlots.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {scheduleSlots.map((s, i) => (
                          <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                            <span className="text-xs text-foreground font-body">
                              {s.day_of_week} · {s.start_time}–{s.end_time} · {s.room || "No location"}
                            </span>
                            <button onClick={() => removeSlotFromList(i)} className="p-1 text-destructive hover:text-destructive/80"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Day-by-day slot builder */}
                    <div className="space-y-2">
                      {DAYS.map(day => {
                        const isOpen = expandedDays.includes(day);
                        const daySlotsCount = scheduleSlots.filter(s => s.day_of_week === day).length;
                        const input = getDaySlotInput(day);
                        return (
                          <div key={day} className="border border-border/30 rounded-lg overflow-hidden">
                            <button onClick={() => toggleDay(day)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-display font-medium text-foreground hover:bg-muted/30 transition-colors">
                              <span>{day} {daySlotsCount > 0 && <span className="text-primary ml-1">({daySlotsCount} slot{daySlotsCount > 1 ? "s" : ""})</span>}</span>
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                            </button>
                            {isOpen && (
                              <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/20">
                                {scheduleSlots.filter(s => s.day_of_week === day).map((s, i) => {
                                  const globalIdx = scheduleSlots.findIndex(sl => sl === s);
                                  return (
                                    <div key={i} className="flex items-center justify-between bg-muted/20 rounded px-2 py-1">
                                      <span className="text-xs text-foreground">{s.start_time}–{s.end_time} · {s.room || "No location"}</span>
                                      <button onClick={() => removeSlotFromList(globalIdx)} className="p-0.5 text-destructive hover:text-destructive/80"><X className="w-3 h-3" /></button>
                                    </div>
                                  );
                                })}
                                <div className="grid grid-cols-3 gap-2">
                                  <div><label className={labelCls}>Start Time</label><input type="time" className={inputCls} value={input.start_time} onChange={e => updateDaySlotInput(day, "start_time", e.target.value)} /></div>
                                  <div><label className={labelCls}>End Time</label><input type="time" className={inputCls} value={input.end_time} onChange={e => updateDaySlotInput(day, "end_time", e.target.value)} /></div>
                                  <div><label className={labelCls}>Location</label><input className={inputCls} value={input.room} onChange={e => updateDaySlotInput(day, "room", e.target.value)} placeholder="Room 301" /></div>
                                </div>
                                <button onClick={() => addSlotForDay(day)} className="w-full px-3 py-1.5 rounded-lg bg-accent/20 text-accent-foreground text-xs font-display font-medium hover:bg-accent/30 transition-colors flex items-center justify-center gap-1">
                                  <Plus className="w-3.5 h-3.5" /> Add Slot for {day}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={resetFacultyForm} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Cancel</button>
                  <button onClick={saveFaculty} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold">
                    {editingId ? "Update Info" : `Add Faculty${scheduleSlots.length > 0 ? ` with ${scheduleSlots.length} slot${scheduleSlots.length > 1 ? "s" : ""}` : ""}`}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Faculty list */}
            <div className="space-y-3">
              {faculty.map((f: any) => {
                const schedule = getFacultySchedule(f.id);
                const isExpanded = expandedFaculty === f.id;
                return (
                  <div key={f.id} className="glass-card overflow-hidden">
                    {/* Faculty header */}
                    <div className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedFaculty(isExpanded ? null : f.id)}>
                        <div className="flex items-center gap-2">
                          <p className="font-display font-semibold text-foreground">{f.name}</p>
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{schedule.length} slots</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Dept: {f.department || "—"} · Office: {f.office_location || "—"} · Phone: {f.phone || "—"}</p>
                        <p className="text-xs text-muted-foreground">{f.user_id ? `✅ Login ID: ${f.email?.replace("@campus.local", "") || "linked"}` : "❌ No login"}</p>
                      </div>
                      <div className="flex gap-1 items-center">
                        <button onClick={() => setExpandedFaculty(isExpanded ? null : f.id)} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => editFaculty(f)} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteFaculty(f.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Expanded schedule */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/30">
                          <div className="p-4 space-y-3">
                            <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Weekly Schedule
                            </p>

                            {schedule.length === 0 && (
                              <p className="text-xs text-muted-foreground italic">No schedule slots yet.</p>
                            )}

                            {DAYS.map(day => {
                              const daySlots = schedule.filter((t: any) => t.day_of_week === day);
                              if (daySlots.length === 0) return null;
                              return (
                                <div key={day}>
                                  <p className="text-xs font-display font-medium text-foreground mb-1">{day}</p>
                                  <div className="space-y-1">
                                    {daySlots.map((slot: any) => (
                                      <div key={slot.id}>
                                        {editingSlotId === slot.id ? (
                                          <div className="bg-muted/30 rounded-lg p-2 space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                              <select className={inputCls} value={esDay} onChange={e => setEsDay(e.target.value)}>
                                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                              </select>
                                              <input type="time" className={inputCls} value={esStart} onChange={e => setEsStart(e.target.value)} />
                                              <input type="time" className={inputCls} value={esEnd} onChange={e => setEsEnd(e.target.value)} />
                                              <input className={inputCls} value={esRoom} onChange={e => setEsRoom(e.target.value)} placeholder="Location" />
                                              <div className="flex gap-1 col-span-2">
                                                <button onClick={() => setEditingSlotId(null)} className="flex-1 px-2 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-display">Cancel</button>
                                                <button onClick={saveEditSlot} className="flex-1 px-2 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display font-semibold flex items-center justify-center gap-1"><Save className="w-3 h-3" />Save</button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                                            <span className="text-xs text-foreground font-body">
                                              {slot.start_time?.slice(0,5)}–{slot.end_time?.slice(0,5)} · {slot.room || "No location"}
                                              {slot.is_cancelled && <span className="text-destructive ml-1">(Cancelled)</span>}
                                            </span>
                                            <div className="flex gap-1">
                                              <button onClick={() => startEditSlot(slot)} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                                              <button onClick={() => deleteSlot(slot.id)} className="p-1 text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Add new slot to existing faculty */}
                            {addingSlotFor === f.id ? (
                              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-display font-medium text-foreground">Add New Slot</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <select className={inputCls} value={nsDay} onChange={e => setNsDay(e.target.value)}>
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                  <input type="time" className={inputCls} value={nsStart} onChange={e => setNsStart(e.target.value)} />
                                  <input type="time" className={inputCls} value={nsEnd} onChange={e => setNsEnd(e.target.value)} />
                                  <input className={inputCls} value={nsRoom} onChange={e => setNsRoom(e.target.value)} placeholder="Location" />
                                  <div className="flex gap-1 col-span-2">
                                    <button onClick={() => setAddingSlotFor(null)} className="flex-1 px-2 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-display">Cancel</button>
                                    <button onClick={() => addNewSlotToFaculty(f.id)} className="flex-1 px-2 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display font-semibold">Add</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setAddingSlotFor(f.id); setNsRoom(""); }}
                                className="w-full py-2 rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-1 font-display">
                                <Plus className="w-3.5 h-3.5" /> Add Schedule Slot
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {!showFacultyForm && !showCsvFaculty && (
                <div className="flex gap-2">
                  <AddButton label="Add Faculty" onClick={() => setShowFacultyForm(true)} />
                  <button onClick={() => setShowCsvFaculty(true)} className="w-full py-3 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 font-display">
                    <Upload className="w-4 h-4" />Import CSV
                  </button>
                </div>
              )}
              <AnimatePresence>
                {showCsvFaculty && (
                  <CsvImporter
                    table="faculty"
                    fields={FACULTY_CSV_FIELDS}
                    existingNames={faculty.map((f: any) => f.name)}
                    onComplete={() => { refetchFaculty(); }}
                    onImported={handleFacultyCsvImported}
                    onClose={() => setShowCsvFaculty(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </Section>
        )}

        {/* ===== EVENTS TAB ===== */}
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

        {/* ===== LOCATIONS TAB ===== */}
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
              {!showLocationForm && !showCsvLocations && (
                <div className="flex gap-2">
                  <AddButton label="Add Location" onClick={() => setShowLocationForm(true)} />
                  <button onClick={() => setShowCsvLocations(true)} className="w-full py-3 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 font-display">
                    <Upload className="w-4 h-4" />Import CSV
                  </button>
                </div>
              )}
              <AnimatePresence>
                {showCsvLocations && (
                  <CsvImporter
                    table="locations"
                    fields={LOCATION_CSV_FIELDS}
                    existingNames={locations.map((l: any) => l.name)}
                    onComplete={() => { refetchLocations(); }}
                    onClose={() => setShowCsvLocations(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </Section>
        )}

        {/* ===== DEPARTMENTS TAB ===== */}
        {activeTab === "departments" && (
          <Section title="Departments & HODs">
            {showDeptForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-4 mb-4 space-y-3">
                <p className="text-sm font-display font-semibold text-foreground">{editingDeptId ? "Edit Department" : "Add New Department"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Department Name *</label><input className={inputCls} value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="Computer Science & Engineering" /></div>
                  <div><label className={labelCls}>HOD Name *</label><input className={inputCls} value={deptHod} onChange={e => setDeptHod(e.target.value)} placeholder="Dr. John Doe" /></div>
                  <div className="col-span-2"><label className={labelCls}>Description</label><input className={inputCls} value={deptDesc} onChange={e => setDeptDesc(e.target.value)} placeholder="Offers B.Tech, M.Tech programs in CSE with specializations in AI & ML" /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={resetDeptForm} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Cancel</button>
                  <button onClick={saveDepartment} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold">{editingDeptId ? "Update" : "Add Department"}</button>
                </div>
              </motion.div>
            )}
            <div className="space-y-3">
              {departments.map((d: any) => (
                <div key={d.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">HOD: {d.hod_name || "—"}</p>
                    {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editDepartment(d)} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteDepartment(d.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {!showDeptForm && <AddButton label="Add Department" onClick={() => setShowDeptForm(true)} />}
            </div>
          </Section>
        )}

        {/* ===== BRAIN TAB ===== */}
        {activeTab === "brain" && (
          <Section title="🧠 Brain — College Knowledge Base">
            <p className="text-xs text-muted-foreground mb-4">Add information about the college here. The AI assistant will use this to answer student queries.</p>
            {showBrainForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Category</label>
                    <select className={inputCls} value={kbCategory} onChange={e => setKbCategory(e.target.value)}>
                      {BRAIN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Title *</label><input className={inputCls} value={kbTitle} onChange={e => setKbTitle(e.target.value)} placeholder="e.g. College Timings" /></div>
                  <div className="col-span-2">
                    <label className={labelCls}>Content *</label>
                    <textarea className={inputCls + " min-h-[100px] resize-y"} value={kbContent} onChange={e => setKbContent(e.target.value)} placeholder="The college operates from 9:00 AM to 4:30 PM, Monday to Saturday. Library hours are 8:00 AM to 8:00 PM..." />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowBrainForm(false); setKbTitle(""); setKbContent(""); }} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display">Cancel</button>
                  <button onClick={saveKBEntry} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold">Add to Brain</button>
                </div>
              </motion.div>
            )}
            <div className="space-y-3">
              {knowledgeBase.map((kb: any) => (
                <div key={kb.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{kb.category}</span>
                      <p className="font-display font-semibold text-foreground text-sm">{kb.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{kb.content}</p>
                  </div>
                  <button onClick={() => deleteKBEntry(kb.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {!showBrainForm && <AddButton label="Add Knowledge" onClick={() => setShowBrainForm(true)} />}
            </div>
          </Section>
        )}

        {/* ===== ISSUES TAB ===== */}
        {activeTab === "issues" && user && (
          <IssuesManager userId={user.id} />
        )}

        {/* ===== NOTIFICATIONS TAB ===== */}
        {activeTab === "notifications" && (
          <NotificationManager user={user} displayName="Admin" />
        )}

        {/* ===== EMERGENCY TAB ===== */}
        {activeTab === "emergency" && (
          <Section title="Emergency Contacts">
            <div className="space-y-3">
              {emergencyContacts.sort((a: any, b: any) => a.sort_order - b.sort_order).map((c: any) => (
                <motion.div key={c.id} layout className="glass-card p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-display">{c.type === "phone" ? "📞 Phone" : "ℹ️ Info"}</span>
                      <span className="text-xs text-muted-foreground font-display">Order: {c.sort_order}</span>
                    </div>
                    <p className="font-display font-bold text-foreground">{c.label}</p>
                    <p className="text-sm text-muted-foreground">{c.value}</p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button onClick={() => {
                      setEditingEmId(c.id); setEmLabel(c.label); setEmValue(c.value); setEmType(c.type); setShowEmergencyForm(true);
                    }} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={async () => {
                      await (supabase.from("emergency_contacts") as any).delete().eq("id", c.id);
                      refetchEmergency(); toast({ title: "Contact deleted" });
                    }} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}

              <AnimatePresence>
                {showEmergencyForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card p-4 space-y-3 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-foreground text-sm">{editingEmId ? "Edit Contact" : "Add Emergency Contact"}</h3>
                      <button onClick={() => { setShowEmergencyForm(false); setEditingEmId(null); setEmLabel(""); setEmValue(""); setEmType("phone"); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                    <input value={emLabel} onChange={e => setEmLabel(e.target.value)} placeholder="Label (e.g. Campus Security)" className="w-full bg-secondary/50 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 font-body" />
                    <input value={emValue} onChange={e => setEmValue(e.target.value)} placeholder="Phone number or instructions" className="w-full bg-secondary/50 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 font-body" />
                    <div className="flex gap-2">
                      <button onClick={() => setEmType("phone")} className={`flex-1 py-2 rounded-xl text-xs font-display font-medium border transition-all ${emType === "phone" ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary/50 text-muted-foreground border-border/20"}`}>📞 Phone</button>
                      <button onClick={() => setEmType("info")} className={`flex-1 py-2 rounded-xl text-xs font-display font-medium border transition-all ${emType === "info" ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary/50 text-muted-foreground border-border/20"}`}>ℹ️ Info/Text</button>
                    </div>
                    <button disabled={emSubmitting} onClick={async () => {
                      if (emSubmitting) return;
                      if (!emLabel.trim() || !emValue.trim()) { toast({ title: "Label and value required", variant: "destructive" }); return; }
                      setEmSubmitting(true);
                      try {
                        if (editingEmId) {
                          const { error } = await (supabase.from("emergency_contacts") as any).update({ label: emLabel.trim(), value: emValue.trim(), type: emType }).eq("id", editingEmId);
                          if (error) throw error;
                        } else {
                          // Fetch current max sort_order directly from DB to avoid stale state
                          const { data: existing } = await (supabase.from("emergency_contacts") as any).select("sort_order").order("sort_order", { ascending: false }).limit(1);
                          const maxOrder = existing?.[0]?.sort_order ?? -1;
                          const { error } = await (supabase.from("emergency_contacts") as any).insert({ label: emLabel.trim(), value: emValue.trim(), type: emType, sort_order: maxOrder + 1 });
                          if (error) throw error;
                        }
                        setShowEmergencyForm(false); setEditingEmId(null); setEmLabel(""); setEmValue(""); setEmType("phone");
                        refetchEmergency(); toast({ title: editingEmId ? "Contact updated" : "Contact added" });
                      } catch (err: any) {
                        console.error("Emergency contact save error:", err);
                        toast({ title: "Failed to save", description: err?.message || "Please try again", variant: "destructive" });
                      } finally {
                        setEmSubmitting(false);
                      }
                    }} className={`w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-display font-semibold ${emSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <Save className="w-4 h-4 inline mr-2" />{emSubmitting ? "Saving..." : editingEmId ? "Update" : "Add Contact"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showEmergencyForm && <AddButton label="Add Emergency Contact" onClick={() => setShowEmergencyForm(true)} />}
            </div>
          </Section>
        )}
      </div>

      {/* Professor Credentials Modal */}
      {(creatingProf || profCredentials || bulkCreatingCount > 0 || bulkCredentials.length > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => { if (!creatingProf && bulkCreatingCount === 0) { setProfCredentials(null); setBulkCredentials([]); } }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-6 w-full max-w-md mx-4 text-center space-y-4" onClick={e => e.stopPropagation()}>
            {(creatingProf || bulkCreatingCount > 0) ? (
              <>
                <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-display">
                  {bulkCreatingCount > 0 ? `Creating ${bulkCreatingCount} professor accounts...` : "Creating professor account..."}
                </p>
              </>
            ) : bulkCredentials.length > 0 ? (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCheck className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-lg font-display font-bold text-foreground">{bulkCredentials.length} Professor Accounts Created!</h2>
                <p className="text-xs text-muted-foreground">Share these credentials with each professor</p>
                <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-left max-h-60 overflow-y-auto">
                  {bulkCredentials.map((c, i) => (
                    <div key={i} className={`${i > 0 ? "border-t border-border/30 pt-2" : ""}`}>
                      <p className="text-xs font-display font-semibold text-foreground">{c.name}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>ID: <strong className="font-mono text-foreground">{c.id}</strong></span>
                        <span>Pass: <strong className="font-mono text-foreground">{c.password}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={copyCredentials} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-display font-medium hover:bg-secondary/80 transition-colors">
                    {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy All"}
                  </button>
                  <button onClick={() => setBulkCredentials([])} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-display font-semibold">Done</button>
                </div>
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
                  <button onClick={() => setProfCredentials(null)} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-display font-semibold">Done</button>
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
