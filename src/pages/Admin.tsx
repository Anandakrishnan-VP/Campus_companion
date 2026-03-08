import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Clock, Calendar, MapPin, Plus, Trash2, Edit2, Save } from "lucide-react";
import { Link } from "react-router-dom";

type Tab = "faculty" | "timetable" | "events" | "locations";

interface Faculty { id: string; name: string; aliases: string; office: string; department: string; }
interface Event { id: string; title: string; location: string; date: string; time: string; description: string; }
interface Location { id: string; name: string; type: string; floor: string; block: string; description: string; }

const Admin = () => {
  const [activeTab, setActiveTab] = useState<Tab>("faculty");

  // Mock data
  const [faculty, setFaculty] = useState<Faculty[]>([
    { id: "1", name: "Dr. Swathy", aliases: "Swathy Mam, Prof Swathy", office: "Room 204, Block A", department: "CS" },
    { id: "2", name: "Dr. Ramesh Kumar", aliases: "Ramesh Sir", office: "Room 310, Block B", department: "AI & DS" },
  ]);
  const [events, setEvents] = useState<Event[]>([
    { id: "1", title: "AI Workshop", location: "Seminar Hall", date: "2026-03-08", time: "14:00", description: "Hands-on AI workshop" },
  ]);
  const [locations, setLocations] = useState<Location[]>([
    { id: "1", name: "AI Lab", type: "Lab", floor: "2nd Floor", block: "Block B", description: "Near east staircase" },
    { id: "2", name: "Seminar Hall", type: "Hall", floor: "1st Floor", block: "Block A", description: "Main corridor, left side" },
  ]);

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "faculty", label: "Faculty", icon: Users },
    { key: "timetable", label: "Timetable", icon: Clock },
    { key: "events", label: "Events", icon: Calendar },
    { key: "locations", label: "Locations", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <Link to="/" className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-display font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Manage kiosk data</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-3 border-b border-border/30 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {activeTab === "faculty" && (
          <DataSection title="Faculty Members">
            <div className="space-y-3">
              {faculty.map((f) => (
                <div key={f.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Aliases: {f.aliases}</p>
                    <p className="text-xs text-muted-foreground">Office: {f.office} · Dept: {f.department}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <AddButton label="Add Faculty" />
            </div>
          </DataSection>
        )}

        {activeTab === "timetable" && (
          <DataSection title="Timetable Management">
            <div className="glass-card p-6 text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Timetable management will be available once the database is connected.</p>
              <p className="text-xs text-muted-foreground mt-1">Connect Lovable Cloud to enable full CRUD operations.</p>
            </div>
          </DataSection>
        )}

        {activeTab === "events" && (
          <DataSection title="Events">
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">📍 {e.location} · 📅 {e.date} · 🕐 {e.time}</p>
                    <p className="text-xs text-muted-foreground">{e.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <AddButton label="Add Event" />
            </div>
          </DataSection>
        )}

        {activeTab === "locations" && (
          <DataSection title="Locations">
            <div className="space-y-3">
              {locations.map((l) => (
                <div key={l.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground">{l.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{l.type} · {l.floor} · {l.block}</p>
                    <p className="text-xs text-muted-foreground">{l.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <AddButton label="Add Location" />
            </div>
          </DataSection>
        )}
      </div>
    </div>
  );
};

const DataSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <h2 className="text-lg font-display font-bold text-foreground mb-4">{title}</h2>
    {children}
  </motion.div>
);

const AddButton = ({ label }: { label: string }) => (
  <button className="w-full py-3 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 font-display">
    <Plus className="w-4 h-4" />
    {label}
  </button>
);

export default Admin;
