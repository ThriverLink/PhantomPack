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

> Revised for voice on the `voice-review` branch. The existing MP3s still carry the
> old lines and need re-recording to match.

### `shop.mp3` — Shop phase (first arrival)
> "Welcome to Phantom Pack. You can pick this pack up and set it down as often as you like. You're only rehearsing."

### `opened.mp3` — Pack opened, cigarette available
> "A cigarette right in front of you makes the urge harder to sit with. That's normal, and it passes on its own. What you do next is your choice."

### `smoke.mp3` — First puff / smoke phase
> "Bring the filter to your mouth when you're ready. After each puff, you'll see what a real cigarette would do inside your body."

### `receipt.mp3` — Receipt shown
> "Here's what a real one would cost. You can stop here; the choice is yours."

### `end.mp3` — End screen (any outcome)
> "The urge will show up again. When it does, this same practice is here to use."

### `thankyou.mp3` — Thank-you card (after "Done")
> "You can take the headset off now. The pack was fake, but the pause you took instead of smoking was real."

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
