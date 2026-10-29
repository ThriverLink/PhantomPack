# Phantom Pack

**A ThriverLink VR Rehearsal**
_This pack is fake. The cost isn't._

- **Track:** Productivity
- **Division:** New Experience
- **Platform:** Meta Quest, hand tracking, seated, WebXR
- **Length:** about 5 minutes

**Elevator pitch:** Phantom Pack is a five-minute VR rehearsal for quitting smoking. You buy a fake pack with fake money, hold a cigarette that can't hurt you, watch what each puff would do inside your body, and then choose to throw it away — and keep practicing in ThriverLink.

---

## Inspiration

ThriverLink is built on a simple idea: big changes come from small reps. Most quit-smoking tools ignore that. They give you a warning, a counter, a graph — and none of it is there at 9pm when your hand is already reaching for a pack.

We kept coming back to one line a smoker told us: _"Opening the packet is a sign of an urge. The strong ones don't. The weak ones will smoke."_ That isn't a character flaw. It's a cue, a habit loop, and a moment you can practice. VR is the one medium where you can stand inside that moment, pick up the pack, feel the weight of it, and choose something else — without spending a dollar or damaging a lung.

So Phantom Pack isn't a quit simulator. It's a rehearsal space for the two seconds that decide everything.

## What it does

You sit at a table with a wallet of unlimited fake money and a pack that costs $8. You buy it. The price tag flips: $8 a pack, $2,920 a year, about 101 days of life. That's the first trick — the pack is fake, the arithmetic isn't.

Then you decide what to do with it. Open the lid and the pack tells you what opening really means: an urge, not a verdict. Throw it in the bin and confetti goes off; that's a win, and it's saved. Open it anyway and nothing scolds you — you get a cigarette and an invitation: show me the habit.

You pinch the cigarette, bring the filter to your mouth, and hold. Each puff is read from hand position and a short dwell, no controllers and no buttons. Smoke curls, the ember brightens, a body hologram lights the organ you're affecting, and a card tells you what just happened: tar in the airways, carbon monoxide in the blood, two minutes of life. After four puffs you get a damage receipt — a readable record of what the rehearsal cost you, which is nothing. Then you can crush the cigarette, throw the pack away, and see your streak.

Every path ends the same way: a decision you made with your hands, not a lecture you scrolled past.

## How we built it

Phantom Pack runs in the browser on Quest with IWSDK 1.1, Three.js, and TypeScript. There are no imported models or textures — every object is procedural geometry and material built in code: the room, table, pack with a hinged lid, cigarette with filter and ember, ashtray, lighter, lamp, wallet, bin, body hologram, and Ember, a small companion that reacts to your choices.

The interface is UIKitML panels placed in world space, so the copy lives next to the object it's about. The whole journey is one ECS system, `PhantomSystem`, driven by a small phase machine: shop → bought → opened / closed / thrown → smoke → receipt → end. Hand tracking uses pinch grab plus a filter-to-mouth proximity check with a short dwell per puff. Audio is synthesized with Web Audio, particles are custom, and streaks and wins are stored in localStorage. No backend, no account, no download.

## Challenges we ran into

**Hands only.** No controller, no laser pointer, no menu. Every action had to be a physical object you'd reach for anyway. Most of the work went into affordance: making the pack obviously openable, the cigarette obviously grabbable, the bin obviously a target — and making all of it forgiving enough for real hand tracking.

**The cigarette problem.** A cigarette is about 8mm wide. A grab collider that small is a bad joke in VR. We had to tune grab volumes, attach points, and the mouth zone until it felt like holding a cigarette instead of fighting a physics engine.

**Tone.** A smoking experience slides easily into an ad or a scolding. Every fact had to arrive at the exact moment it meant something — the price at purchase, the urge message at the lid, the body facts during the puff — and never twice.

**Two realms, one asset file.** IWSDK evaluates the asset module in both the runtime and the editor, so it has to be deterministic and side-effect free. Procedural models had to be pure functions, not shared mutable state.

**Legibility in a headset.** Panels have to sit at the right distance, angle, and size without covering the object you're interacting with. We rebuilt the panel scale and placement more than once.

## Accomplishments that we're proud of

- **A complete loop with no dead ends.** Buy, open or throw, smoke, receipt, decision, restart — every branch lands somewhere intentional.
- **Zero external art.** The whole world is code, so it loads fast, works offline, and can be reskinned for a campaign in an afternoon.
- **The receipt.** It's the piece we're proudest of. It turns "smoking is bad" into a small document about your own behavior, with your own numbers on it.
- **The reframe holds.** Opening the pack is treated as an urge, not a failure, and throwing it away is celebrated without being childish.
- **Hands-first interaction a first-timer can read.** The objects explain themselves; nobody has to be taught a menu.

## What we learned

- **People don't need more information about smoking. They need somewhere to practice the moment.** The fact that lands hardest isn't a statistic — it's the price tag flipping after the purchase.
- **The gesture is the trigger.** Once someone is holding the cigarette, the rest of the experience almost runs itself.
- **Constraints are a design tool.** Hands-only forced us to delete every abstract menu and replace it with an object. The experience got simpler and better.
- **Compassion scales further than shame.** "This isn't about character, it's about reps" makes people willing to keep going instead of backing out of the demo.
- **Five minutes is the right length.** Long enough to feel something, short enough to do it twice.

## What's next for Phantom Pack

- **The ThriverLink handoff.** The receipt and streak become the first entry in the mobile app. The headset gives you the moment; ThriverLink gives you the method.
- **Your numbers, not ours.** Your pack price, your cigarettes per day, your own cost on the receipt.
- **More rehearsals.** The 9pm craving, the coffee trigger, the friend who offers one — short scenes that reuse the same gesture vocabulary.
- **Glasses support.** Gaze and pinch input for Meta VR Glasses, where the interaction is a look and a pinch rather than a full hand.
- **Store packaging and a pilot.** Ship as a PWA/TWA for the Horizon Store, then run a small pilot with a cessation program to see whether rehearsal changes real-world quit attempts.

---

## Adapted or Significantly Updated Experiences

Phantom Pack is the VR arm of ThriverLink, adapted from the mobile app's tiny-habits method into a five-minute, hands-first rehearsal. During the competition period we built it end to end:

- **New interaction model.** Replaced tap-through screens with physical objects. You buy a fake pack, open or bin it, pinch-grab a cigarette, and hold the filter to your mouth to puff — no controllers, no menus.
- **New choice-driven flow.** Shop → buy → open / close / throw → smoke → receipt → end, with a compassionate reframe at the lid ("an urge, not a verdict") and a confetti-backed win for throwing the pack away.
- **New body feedback.** Each puff lights the affected organ on a procedural hologram and surfaces one fact at the exact moment of the gesture.
- **New takeaway.** A damage receipt built from your own puff count and cost math, plus a persisted streak and win count.
- **New content and craft.** A fully procedural room, props, and companion; synthesized audio; custom smoke, spark, and confetti; UIKitML panels placed in world space.

Built with IWSDK 1.1, Three.js, and TypeScript. No backend, no external art, no account.

**Links:** [Demo video] · [Screenshots] · [Quest Store / PWA link]
