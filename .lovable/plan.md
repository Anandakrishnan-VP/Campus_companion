

# Plan: Include Schedule Change Details in Chat Responses

## Problem
When a professor marks "Schedule Changed" with temporary availability details (stored as JSON in `attendance.note`), the campus chat AI currently only shows the status as "schedule_changed" but doesn't include the temporary schedule details (time, room, note).

## Changes

### 1. Update `supabase/functions/campus-chat/index.ts`

**Faculty info builder (line 44-48)**: Parse the `note` field when status is `schedule_changed` and append the temporary schedule details to the faculty context string.

```
- Parse `todayAttendance.note` as JSON when status is "schedule_changed"
- Extract `tempFrom`, `tempTo`, `tempRoom`, `tempNote` fields
- Append to faculty line: e.g., "SCHEDULE CHANGED: Available 10:00-12:00 in Room 204 (Note: Lab moved)"
```

**System prompt rules (around line 70-85)**: Add a rule instructing the AI to proactively mention schedule changes when someone asks about a professor whose status is "schedule_changed", including the temporary time, room, and any notes.

### 2. No database or schema changes needed
The `note` field already stores the JSON with temporary schedule data.

