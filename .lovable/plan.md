

## Switch TTS to ElevenLabs

### What changes
Replace the browser's `speechSynthesis` in `use-speech.ts` with ElevenLabs TTS via a new edge function. Keep the browser's Speech Recognition (STT) as-is since it works well and is free.

### Steps

**1. Connect ElevenLabs**
Use the ElevenLabs connector to link an API key to this project. The connector will store `ELEVENLABS_API_KEY` as a secret.

**2. Create edge function `elevenlabs-tts`**
- New file: `supabase/functions/elevenlabs-tts/index.ts`
- Accepts `{ text, voiceId }` in POST body
- Calls `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128` with the `ELEVENLABS_API_KEY`
- Returns raw audio bytes with `Content-Type: audio/mpeg`
- Includes CORS headers and OPTIONS handler
- Uses model `eleven_turbo_v2_5` for low latency
- Default voice: **Sarah** (`EXAVITQu4vr4xnSDxMaL`) — natural female voice

**3. Update `supabase/config.toml`**
Add `[functions.elevenlabs-tts]` with `verify_jwt = false`.

**4. Update `src/hooks/use-speech.ts`**
- Replace the `speak()` function: instead of `speechSynthesis`, fetch audio from the edge function, create a `Blob`, play via `new Audio(URL.createObjectURL(blob))`
- Track the `Audio` element in a ref for `stopSpeaking()` (call `audio.pause()`)
- Update `supported` to always be true for TTS (no longer depends on `speechSynthesis`), keep STT check
- Keep `startListening`/`stopListening` unchanged (browser Speech Recognition)
- Add fallback: if ElevenLabs call fails, fall back to browser `speechSynthesis`

### Technical notes
- Using `fetch()` with `.blob()` instead of `supabase.functions.invoke()` since we need binary audio data
- `eleven_turbo_v2_5` model chosen for lowest latency (real-time kiosk use)
- Sarah voice selected for natural, clear female voice matching the Yukti assistant persona

