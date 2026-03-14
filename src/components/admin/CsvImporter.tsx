import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, AlertTriangle, CheckCircle, Trash2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CsvFieldConfig {
  dbColumn: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}

interface CsvImporterProps {
  table: "faculty" | "locations";
  fields: CsvFieldConfig[];
  existingNames: string[];
  onComplete: () => void;
  onClose: () => void;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current.trim());
        current = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(current.trim());
        if (row.some(c => c !== "")) rows.push(row);
        row = [];
        current = "";
      } else {
        current += ch;
      }
    }
  }
  row.push(current.trim());
  if (row.some(c => c !== "")) rows.push(row);
  return rows;
}

type RowStatus = "valid" | "missing_required" | "duplicate";

interface ParsedRow {
  data: Record<string, string>;
  status: RowStatus;
  warning?: string;
}

const CsvImporter = ({ table, fields, existingNames, onComplete, onClose }: CsvImporterProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const requiredFields = fields.filter(f => f.required);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        toast({ title: "CSV must have a header row and at least one data row", variant: "destructive" });
        return;
      }

      const headers = parsed[0].map(h => h.toLowerCase().replace(/\s+/g, "_"));
      const dataRows = parsed.slice(1);

      const existingLower = existingNames.map(n => n.toLowerCase());

      const mapped: ParsedRow[] = dataRows.map(cols => {
        const data: Record<string, string> = {};
        fields.forEach(field => {
          const idx = headers.indexOf(field.dbColumn.toLowerCase());
          const altIdx = headers.indexOf(field.label.toLowerCase().replace(/\s+/g, "_"));
          const val = cols[idx !== -1 ? idx : altIdx] ?? "";
          data[field.dbColumn] = val || (field.defaultValue ?? "");
        });

        // Check required
        const missingReq = requiredFields.some(f => !data[f.dbColumn]?.trim());
        if (missingReq) return { data, status: "missing_required" as RowStatus, warning: "Missing required field" };

        // Check duplicate
        const nameVal = data["name"]?.trim().toLowerCase();
        if (nameVal && existingLower.includes(nameVal)) {
          return { data, status: "duplicate" as RowStatus, warning: "Already exists in database" };
        }

        return { data, status: "valid" as RowStatus };
      });

      setRows(mapped);
    };
    reader.readAsText(file);
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const validRows = rows.filter(r => r.status === "valid");
  const duplicateRows = rows.filter(r => r.status === "duplicate");

  const handleImport = async () => {
    const toInsert = validRows.map(r => r.data);
    if (toInsert.length === 0) {
      toast({ title: "No valid rows to import", variant: "destructive" });
      return;
    }

    setImporting(true);
    const { error } = await supabase.from(table).insert(toInsert as any);
    setImporting(false);

    if (error) {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
      return;
    }

    const skipped = rows.length - validRows.length;
    toast({ title: `${validRows.length} imported${skipped > 0 ? `, ${skipped} skipped` : ""}` });
    onComplete();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-card p-4 mb-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          Import {table === "faculty" ? "Faculty" : "Locations"} from CSV
        </p>
        <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Info about expected columns */}
      <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
        <p className="font-display font-medium text-foreground mb-1">Expected CSV columns:</p>
        <p>{fields.map(f => f.label).join(", ")}</p>
        <p className="mt-1 text-primary/80">Only <strong>{requiredFields.map(f => f.label).join(", ")}</strong> {requiredFields.length === 1 ? "is" : "are"} required. Missing fields will use defaults.</p>
      </div>

      {/* File picker */}
      {rows.length === 0 && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
        >
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-display">Click to select a CSV file</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-display">📄 {fileName} — {rows.length} rows parsed</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {validRows.length} valid</span>
              {duplicateRows.length > 0 && <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /> {duplicateRows.length} duplicate</span>}
              {rows.filter(r => r.status === "missing_required").length > 0 && (
                <span className="flex items-center gap-1"><X className="w-3 h-3 text-destructive" /> {rows.filter(r => r.status === "missing_required").length} invalid</span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-border/30">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left font-display text-muted-foreground">Status</th>
                  {fields.map(f => (
                    <th key={f.dbColumn} className="px-2 py-1.5 text-left font-display text-muted-foreground">
                      {f.label}{f.required ? " *" : ""}
                    </th>
                  ))}
                  <th className="px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-t border-border/20 ${
                      row.status === "missing_required" ? "bg-destructive/5" :
                      row.status === "duplicate" ? "bg-yellow-500/5" : ""
                    }`}
                  >
                    <td className="px-2 py-1.5">
                      {row.status === "valid" && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                      {row.status === "missing_required" && (
                        <span className="flex items-center gap-1 text-destructive" title={row.warning}>
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {row.status === "duplicate" && (
                        <span className="flex items-center gap-1 text-yellow-500" title={row.warning}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                    {fields.map(f => (
                      <td key={f.dbColumn} className={`px-2 py-1.5 ${!row.data[f.dbColumn] && f.required ? "text-destructive" : "text-foreground"}`}>
                        {row.data[f.dbColumn] || <span className="text-muted-foreground italic">{f.defaultValue || "—"}</span>}
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeRow(idx)} className="p-0.5 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setRows([]); setFileName(""); }}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-display"
            >
              Clear
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold disabled:opacity-50"
            >
              {importing ? "Importing..." : `Import ${validRows.length} rows`}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export const FACULTY_CSV_FIELDS: CsvFieldConfig[] = [
  { dbColumn: "name", label: "Name", required: true },
  { dbColumn: "aliases", label: "Aliases", defaultValue: "" },
  { dbColumn: "department", label: "Department", defaultValue: "" },
  { dbColumn: "office_location", label: "Office Location", defaultValue: "" },
  { dbColumn: "phone", label: "Phone", defaultValue: "" },
  { dbColumn: "email", label: "Email", defaultValue: "" },
];

export const LOCATION_CSV_FIELDS: CsvFieldConfig[] = [
  { dbColumn: "name", label: "Name", required: true },
  { dbColumn: "type", label: "Type", defaultValue: "Room" },
  { dbColumn: "block", label: "Block", defaultValue: "" },
  { dbColumn: "floor", label: "Floor", defaultValue: "" },
  { dbColumn: "directions", label: "Directions", defaultValue: "" },
  { dbColumn: "nearby_landmarks", label: "Nearby Landmarks", defaultValue: "" },
  { dbColumn: "description", label: "Description", defaultValue: "" },
];

export default CsvImporter;
