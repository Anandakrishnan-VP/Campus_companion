import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface Faculty {
  id: string;
  name: string;
  department: string;
  office_location: string | null;
  photo_url: string | null;
  is_present: boolean | null;
}

interface FacultyDirectoryProps {
  open: boolean;
  onClose: () => void;
}

const FacultyDirectory = ({ open, onClose }: FacultyDirectoryProps) => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    fetchFaculty();
  }, [open]);

  const fetchFaculty = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("faculty_public" as any)
      .select("id, name, department, office_location, photo_url, is_present")
      .order("name");
    setFaculty((data as unknown as Faculty[]) || []);
    setLoading(false);
  };

  const filtered = faculty.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.department.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-3xl max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-xl font-display font-bold text-foreground">Faculty Directory</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or department..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-secondary/30 border-border"
                />
              </div>
            </div>

            {/* Faculty Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-xl bg-secondary/30 h-48" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-display">No faculty found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filtered.map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group relative rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-all overflow-hidden"
                    >
                      {/* Photo */}
                      <div className="relative aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                        {f.photo_url ? (
                          <img
                            src={f.photo_url}
                            alt={f.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <User className="w-12 h-12 text-muted-foreground/30" />
                        )}

                        {/* Presence indicator */}
                        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-card ${f.is_present ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-sm font-display font-semibold text-foreground truncate">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{f.department}</p>
                        {f.office_location && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">📍 {f.office_location}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FacultyDirectory;
