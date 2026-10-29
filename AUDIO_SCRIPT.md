# Phantom Pack — Voiceover Script

Record these 6 short clips with an AI voice (ElevenLabs, OpenAI TTS, etc.).
Drop the resulting MP3s into `public/audio/vo/` with the exact filenames below.
The app plays them automatically per phase; missing files fail silently.

## Voice direction
- **Tone:** calm, warm, low — a coach, not an announcer.
- **Pace:** slow, with pauses. Let the words breathe.
- **Length:** 5–10 seconds each. Short beats the flow; long narration fights it.
- **Format:** mono, 44.1 kHz, ~64–96 kbps (keeps them small for the web).

## Clips

### 1. `shop.mp3` — Shop phase (first arrival)
> "Welcome to Phantom Pack. This is a rehearsal — not a cigarette."

### 2. `opened.mp3` — Pack opened, cigarette lit
> "Open the pack. Light it. Take your time — there's no rush here."

### 3. `smoke.mp3` — First puff / smoke phase
> "Bring the filter to your mouth. Each puff shows what a real one is doing inside you."

### 4. `receipt.mp3` — Damage receipt shown
> "That's the cost of one pack. Now imagine a year of them."

### 5. `end.mp3` — End screen (any outcome)
> "Sometimes this is how you win. The urge will come back — and so will you."

### 6. `thankyou.mp3` — Thank-you card (after "Done")
> "You can take the headset off now. The pack was fake. The pause was real."

## Optional (not wired yet)
- `puff.mp3` — a single whispered "breathe" played on each puff (could feel intrusive; test before adding).
- Ambient bed music — a low, slow drone under the whole session (separate file, looped).

## Notes
- Filenames must match exactly (case-sensitive) — the loader looks for `audio/vo/shop.mp3`, etc.
- The app works with zero clips present, so you can ship before recording.
- If you change a script line, update the matching `setText` copy in `src/phantom.ts` so the panel and the voice agree.
EOF
echo done