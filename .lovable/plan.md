

# Auto-Scroll to Target Element in Admin Dashboard

## What
After an admin adds or edits an item (faculty, event, location, department, knowledge entry, emergency contact), the page will automatically smooth-scroll to the newly created/updated item in the list.

## How

### 1. Add refs for each list section
Add `useRef` anchors for each section's list container (faculty list, events list, locations list, etc.) in `Admin.tsx`.

### 2. Scroll after successful save
In each save function (`saveFaculty`, `saveEvent`, `saveLocation`, `saveDepartment`, `saveKBEntry`, and emergency contact save), after the successful insert/update and refetch, call `scrollIntoView` on the relevant list container or use a short `setTimeout` to let the DOM update, then scroll.

### 3. Scroll when toggling forms
When the "Add" button is clicked and the form appears, scroll to the form so the admin doesn't have to manually find it.

### Technical approach
- Create a `useScrollTo` utility or simply use `ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })`.
- After each successful save: close form → refetch → scroll to the list (the new item will be at the top or bottom depending on sort order).
- After clicking "Add New": scroll to the form that just appeared.
- Use `setTimeout(..., 100)` to allow AnimatePresence/motion animations to render before scrolling.

### Files modified
- **`src/pages/Admin.tsx`** — Add refs for form sections and list sections, add scroll calls after save operations and form toggles.

