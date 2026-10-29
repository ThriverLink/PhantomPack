# Phantom Pack

**A ThriverLink VR Rehearsal** · _This pack is fake. The cost isn't._

Phantom Pack is a five-minute, seated, hands-only VR experience for Meta Quest.
You buy a fake pack of cigarettes with unlimited fake money, learn what a pack
a day really costs, rehearse the smoking gesture with a cigarette that can't
hurt you, and leave with a damage receipt — or a confetti-backed decision to
throw the pack away. The public campaign hook is **"Rehearse the urge."**

## Is this AR or VR?

**VR, not AR.** The app runs a fully immersive WebXR session (`world.xr.mode:
"vr"` in `iwsdk.config.json`) with a synthetic room, sky dome, and table.
Passthrough, scene understanding, and depth sensing are explicitly disabled —
nothing from the real world is blended in. Input is **hand tracking only**:
pinch-grab to pick up the cigarette, filter-to-mouth proximity plus a short
dwell to register a puff. No controllers, no buttons, no locomotion.

For Meta VR Glasses (gaze + pinch) support, see the roadmap at the bottom.

## Stack

- **IWSDK 1.1** (WebXR framework, ECS, managed dev server) + **Three.js** + **TypeScript**
- **UIKitML** (Horizon-style spatial UI) panels rendered in world space
- 100% procedural art and materials — no imported models or textures
- Synthesized audio (Web Audio), custom particle systems, `localStorage` persistence
- No backend, no account, works offline after load

## Requirements

- Node.js `20.19–21.x` or `22.12+` or `24+` (`.nvmrc` pins the exact version)
- A desktop browser for development (experiences run emulated via IWER)
- A Meta Quest headset with **hand tracking enabled** for on-device testing
- Headset and computer on the same Wi-Fi network

## Develop locally

```sh
npm install
npm run dev
```

`npm run dev` starts the CLI-managed Vite dev server and opens a managed
Chromium window running the experience on an emulated Meta Quest 3 (IWER).
Use the **Runtime / Editor** toggle in that window to switch between the
running experience and the authored scene. Editing `iwsdk.config.json`
restarts the server in place.

The expected certificate warning in the managed window comes from the local
HTTPS dev certificate — it's safe to accept.

Other commands:

```sh
npm run dev:status    # server + managed browser state, network URLs
npm run dev:down      # stop the dev server
npm run typecheck     # tsc --noEmit — always green before testing anything
```

## Build

```sh
npm run build       # vite build → dist/
npm run preview     # serve dist/ locally to sanity-check the production build
```

Typecheck before building. The output is plain static assets with relative
paths (`base: './'`), so it deploys anywhere without extra configuration.
Note: the production bundle is **not** runnable from the local file system —
WebXR requires HTTPS.

## Test on a Meta Quest

1. Start the dev server: `npm run dev`
2. Get the headset URL: `npm run dev:status` → `data.runtimeUrls.network`
   (something like `https://192.168.x.x:8081/`)
3. Open that URL in the Quest's browser (same Wi-Fi), accept the certificate
   warning, and launch the experience in immersive mode.
4. Sit down, put your hands where the headset can see them, and follow the
   prompts: buy → open or throw → smoke → receipt → end.

## Deploy

The production build is a static site — deploy the `dist/` folder to any
HTTPS-capable static host:

```sh
npm run build
# any ONE of the following:
npx vercel deploy --prod
npx netlify-cli deploy --prod --dir dist
# …or upload dist/ to S3/CloudFront, nginx, GitHub Pages, etc.
```

Hard requirements for the deployed site:

- **HTTPS** with a valid certificate (WebXR will not run otherwise)
- The site must be reachable from the headset's browser
- Serve over HTTP/2 or better; the bundle is small (procedural assets) but
  UIKitML panels load at runtime from `ui/*.uikitml`

The ThriverLink funnel assumes this URL becomes the campaign landing page:
headset users launch the VR rehearsal, mobile users read about it and
continue in the ThriverLink app.

## Horizon Store packaging (roadmap)

The app can be packaged as a **PWA → TWA** with a web app manifest, icons,
and an auto-enter-XR launch mode, then published to the Meta Horizon Store.
That packaging (manifest, icons, bubblewrap, Digital Asset Links, signing) is
not wired up in this repository yet — see it in the "What's next" section of
`SUBMISSION.md`.

## Project layout

```
iwsdk.config.json      project authority: scene, assets, components, XR, emulator
src/index.ts           World.create() + system registration
src/assets.ts          procedural asset + UI catalog (deterministic — runs in two realms)
src/components.ts      ECS component declarations (Session, Cigarette, Hologram, EmberState)
src/phantom.ts         PhantomSystem — the whole state machine
src/scene-assets/      procedural models (room, table, pack, body hologram, ember, wallet, bin)
src/particles.ts       smoke / sparks / confetti
src/audio.ts           synthesized audio cues
public/scenes/         scene composition (manifest IDs only, never URLs)
public/ui/             UIKitML panels (main, fact, receipt, end, hint, price tag)
```
