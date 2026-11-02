# Phantom Pack — Voiceover & Audio Script

All clips live in `public/audio/vo/` and are wired into the app. They play
automatically; a missing file fails silently, so the app still works without it.

## Files and when they play

| File | Trigger |
|---|---|
| `shop.mp3` | First user gesture (shop panel) |
| `opened.mp3` | Pack opened / cigarette lit |
| `smoke.mp3` | Smoke phase begins |
| `receipt.mp3` | Damage receipt appears |
| `end.mp3` | End screen (any outcome) |
| `thankyou.mp3` | Thank-you card (after "Done" / "Quit") |
| `puff.mp3` | Each puff |
| `ambient.mp3` | Loops quietly under the whole session (starts on first gesture) |

## Script

### `shop.mp3` — Shop phase (first arrival)
> "Welcome to Phantom Pack. This is a rehearsal — not a cigarette."

### `opened.mp3` — Pack opened, cigarette lit
> "Open the pack. Light it. Take your time — there's no rush here."

### `smoke.mp3` — First puff / smoke phase
> "Bring the filter to your mouth. Each puff shows what a real one is doing inside you."

### `receipt.mp3` — Damage receipt shown
> "That's the cost of one pack. Now imagine a year of them."

### `end.mp3` — End screen (any outcome)
> "Sometimes this is how you win. The urge will come back — and so will you."

### `thankyou.mp3` — Thank-you card (after "Done")
> "You can take the headset off now. The pack was fake. The pause was real."

## Voice direction
- Calm, warm, low — a coach, not an announcer. Slow, with pauses.
- 5–10 seconds each; short beats the flow.
- Mono, 44.1 kHz, ~64–96 kbps keeps them small for the web.
- Subtitles are not yet wired; keep lines short and literal so they read well if added.

## Mix levels (set in code)
- Voiceover: 0.85
- Puff SFX: 0.7
- Ambient bed: 0.18 (looped)

## Notes
- Filenames must match exactly (case-sensitive).
- If you change a script line, update the matching panel copy in `src/phantom.ts` so voice and text agree.
