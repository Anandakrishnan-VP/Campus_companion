

## Plan: Rename to "Yukti" and Add Uniform with Nameplate

### Changes

**1. Rename "Zoya" to "Yukti" everywhere**
- `src/pages/Index.tsx` — Update welcome message from "Zoya" to "Yukti"
- `supabase/functions/campus-chat/index.ts` — Update system prompt name from "Zoya" to "Yukti"

**2. Redesign outfit as a professional uniform (`Avatar3D.tsx`)**
- Replace the current teal dress with a **formal uniform**: white collared shirt (upper torso) with a navy/dark blazer over it, and a contrasting accent tie/scarf
- Add **collar detail** meshes (two small angled planes at the neckline)
- Add **blazer lapels** using thin box geometries on each side of the chest
- Change color palette: `blazerColor` (navy #1a2744), `shirtColor` (white #f0eff4), `tieColor` (accent teal #0d8a94)

**3. Add "YUKTI" nameplate on the uniform**
- Use `@react-three/drei`'s `Text` component to render "YUKTI" in 3D on the left chest area of the blazer
- Position at approximately `[-0.12, -0.05, 0.28]` on the torso
- Small gold/metallic background plate (thin box geometry) behind the text to simulate a pin-on nameplate
- Text styling: small font size (~0.03), white or gold color with slight emissive glow

### Files Modified
- `src/components/kiosk/Avatar3D.tsx` — Uniform redesign + nameplate
- `src/pages/Index.tsx` — Name change in welcome message
- `supabase/functions/campus-chat/index.ts` — Name change in AI prompt

