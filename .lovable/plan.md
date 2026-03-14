

## Bulk CSV Import Feature

### How It Works (User Perspective)

1. Admin opens the Faculty or Locations tab and clicks "Import CSV"
2. A file picker dialog opens -- admin selects a `.csv` file from their computer
3. A preview table appears showing the parsed rows, highlighting which fields are filled and which will use defaults
4. Admin reviews, optionally removes bad rows, then clicks "Import"
5. Records are created in the database; a summary toast shows "12 imported, 2 skipped"

### Technical Implementation

**1. CSV Parser Component** (`src/components/admin/CsvImporter.tsx`)
- Uses the browser's built-in `FileReader` API to read the CSV file -- no external library needed
- Splits by newlines, then by commas (handling quoted values)
- Maps CSV column headers to database column names using a configurable field mapping
- Accepts a `tableConfig` prop defining: required fields, optional fields, and their defaults

**2. Field Mapping & Defaults**

For **Faculty CSV**, accepts these columns (only `name` required):
| CSV Column | DB Column | Default if missing |
|---|---|---|
| name | name | *required* |
| aliases | aliases | `""` |
| department | department | `""` |
| office_location | office_location | `""` |
| phone | phone | `""` |
| email | email | `""` |

For **Locations CSV**, accepts these columns (only `name` required):
| CSV Column | DB Column | Default if missing |
|---|---|---|
| name | name | *required* |
| type | type | `"Room"` |
| block | block | `""` |
| floor | floor | `""` |
| directions | directions | `""` |
| nearby_landmarks | nearby_landmarks | `""` |
| description | description | `""` |

**3. Preview & Validation Step**
- Shows a table with all parsed rows before importing
- Rows missing the required `name` field are flagged red and excluded
- Duplicate names (matching existing DB records) are warned
- Admin can remove individual rows before confirming

**4. Batch Insert**
- Uses `supabase.from("faculty").insert(rows)` / `supabase.from("locations").insert(rows)` for bulk insert
- Handles errors per-batch and shows results via toast
- Calls `refetch` to update the realtime table hook

**5. Integration into Admin.tsx**
- Add an "Import CSV" button next to existing "Add Faculty" / "Add Location" buttons
- Opens `CsvImporter` as a dialog with the appropriate table config
- No database schema changes needed -- all existing columns have defaults already

### Files to Create/Modify
- **Create**: `src/components/admin/CsvImporter.tsx` -- reusable CSV import component with preview table
- **Modify**: `src/pages/Admin.tsx` -- add Import CSV buttons for faculty and locations tabs, wire up the importer dialog

