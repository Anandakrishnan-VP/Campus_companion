import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Upload, User, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface Faculty {
  id: string;
  name: string;
  department: string;
  office_location: string | null;
  phone: string | null;
  email: string | null;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchFaculty();
    checkAdmin();
  }, [open]);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      setIsAdmin(roles?.some(r => r.role === "admin" || r.role === "professor") ?? false);
    }
  };

  const fetchFaculty = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("faculty")
      .select("id, name, department, office_location, phone, email, photo_url, is_present")
      .order("name");
    setFaculty((data as Faculty[]) || []);
    setLoading(false);
  };

  const handleUploadClick = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFacultyId) return;

    setUploadingId(selectedFacultyId);
    const ext = file.name.split(".").pop();
    const path = `${selectedFacultyId}.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("faculty-photos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setUploadingId(null);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("faculty-photos")
      .getPublicUrl(path);

    // Update faculty record
    await supabase
      .from("faculty")
      .update({ photo_url: urlData.publicUrl })
      .eq("id", selectedFacultyId);

    setUploadingId(null);
    setSelectedFacultyId(null);
    e.target.value = "";
    fetchFaculty();
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

                        {/* Upload overlay for admins */}
                        {isAdmin && (
                          <button
                            onClick={() => handleUploadClick(f.id)}
                            disabled={uploadingId === f.id}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          >
                            {uploadingId === f.id ? (
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-white">
                                <Camera className="w-6 h-6" />
                                <span className="text-[10px] font-medium">Upload Photo</span>
                              </div>
                            )}
                          </button>
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

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FacultyDirectory;
