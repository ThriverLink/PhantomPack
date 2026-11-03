/**
 * PHANTOM's session director.
 *
 * One ECS system owns the whole five-minute loop: buy a fake pack, learn what
 * the habit costs, open or close it, rehearse the smoking gesture with a tracked
 * hand, read the body facts, and leave with a receipt instead of a cigarette.
 */

import {
  AssetManager,
  BoxGeometry,
  Color,
  Entity,
  Grabbed,
  GrabSystem,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OneHandGrabbable,
  PointLight,
  Pressed,
  Quaternion,
  RayInteractable,
  SRGBColorSpace,
  UIKit,
  UIKitMLAsset,
  Vector3,
  VisibilityState,
  createSystem,
} from '@iwsdk/core';
import { PhantomAudio } from './audio.js';
import {
  Cigarette,
  EmberState,
  Hologram,
  Mood,
  Organ,
  Phase,
  Session,
} from './components.js';
import { PhantomParticles } from './particles.js';

const PACK_HOME = new Vector3(-0.2, 0.9, -0.8);
const BIN_TARGET = new Vector3(0.68, 0.4, -0.92);
const ASHTRAY_TARGET = new Vector3(0.22, 0.95, -0.84);
const MAIN_SCALE = 0.19;
const FACT_SCALE = 0.18;
const RECEIPT_SCALE = 0.17;
const END_SCALE = 0.18;
const HINT_SCALE = 0.13;
const TAG_SCALE = 0.12;
const HOLOGRAM_SCALE = 0.62;
const MOUTH_RADIUS = 0.14;
const PUFF_DWELL = 0.38;
const PUFF_COOLDOWN = 0.9;
const VOICE_TRACKS: Partial<Record<Phase, string>> = {
  [Phase.Shop]: 'shop',
  [Phase.Opened]: 'opened',
  [Phase.Smoke]: 'smoke',
  [Phase.Receipt]: 'receipt',
  [Phase.End]: 'end',
};
const UP = new Vector3(0, 1, 0);
/** The cigarette's local +Z: the filter anchor side. */
const FILTER_AXIS = new Vector3(0, 0, 1);

type EndKind = 'thrown' | 'crushed' | 'declined' | 'stopped' | 'closed';

interface BodyFact {
  organ: Organ;
  eyebrow: string;
  title: string;
  body1: string;
  body2: string;
  body3: string;
  foot: string;
}

const FACTS: BodyFact[] = [
  {
    organ: Organ.Brain,
    eyebrow: 'PUFF 1 OF 4 · BRAIN',
    title: 'Ten seconds to the brain',
    body1: 'Nicotine reaches your brain in about ten seconds.',
    body2:
      'Dopamine rises with it, which is the lift you feel.',
    body3: 'Then it fades within a few minutes, and the wanting comes back.',
    foot: "Right now you're holding a prop, and the urge showed up anyway.",
  },
  {
    organ: Organ.Heart,
    eyebrow: 'PUFF 2 OF 4 · HEART',
    title: 'The heart speeds up',
    body1:
      'Within a minute, your heart rate and blood pressure climb.',
    body2:
      'The blood vessels narrow at the same time.',
    body3: 'So your heart works harder to move the same oxygen.',
    foot: "You're sitting still in a rehearsal, so your heart keeps its own steady pace.",
  },
  {
    organ: Organ.Lungs,
    eyebrow: 'PUFF 3 OF 4 · LUNGS',
    title: 'Tar in the airways',
    body1: 'A whole cigarette leaves about 10 to 20 mg of tar in your airways.',
    body2:
      'The cilia that sweep the lungs clean slow down, and mucus builds up.',
    body3: "Over time that's where a smoker's cough comes from.",
    foot: "You're breathing clean air as you practice this.",
  },
  {
    organ: Organ.Blood,
    eyebrow: 'PUFF 4 OF 4 · BLOOD',
    title: 'Less oxygen to carry',
    body1:
      'A cigarette puts about 10 to 20 mg of carbon monoxide into your blood.',
    body2:
      'Carbon monoxide grabs onto hemoglobin about 200 times harder than oxygen does.',
    body3: "So your blood carries less oxygen while it's there.",
    foot: 'You practiced the motion without taking any of that in.',
  },
];

const BUTTON_STYLES = {
  primary: {
    backgroundColor: '#FFB25C',
    color: '#101A1F',
    borderColor: '#FFB25C',
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: '#17262D',
    color: '#EAF2F3',
    borderColor: '#38525B',
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: '#0D171C',
    color: '#9CB0B7',
    borderColor: '#0D171C',
    borderWidth: 1,
  },
} as const;

type ButtonStyle = keyof typeof BUTTON_STYLES;

export class PhantomSystem extends createSystem({
  sessions: { required: [Session] },
  heldCigarette: { required: [Cigarette, Grabbed] },
  brandPress: { required: [RayInteractable, Pressed] },
}) {
  private sessionEntity!: Entity;
  private packObject!: Object3D;
  private blobbyObject!: Object3D;
  private readonly blobbyHome = new Vector3();
  private blobbyPop = 0;
  private blobbyBaseScale = 0.75;
  private voiceAudio: HTMLAudioElement | null = null;
  private smokeTrailTimer = 0;
  private shopVoicePlayed = false;
  private ambientAudio: HTMLAudioElement | null = null;
  private ambientStarted = false;
  private packContactObject!: Object3D;
  private brandFrameEntity!: Entity;
  private cigaretteEntity!: Entity;
  private cigaretteObject!: Object3D;
  private lidPivot!: Object3D;
  private filterAnchor!: Object3D;
  private smokeAnchor!: Object3D;
  private paperMesh!: Mesh;
  private emberMesh!: Mesh;
  private ashMesh!: Mesh;
  private emberMaterial!: MeshStandardMaterial;
  private hologramObject!: Object3D;
  private hologramEntity!: Entity;
  private scanRing!: Object3D;
  private brandFrameObject!: Object3D;
  private brandLogoMesh!: Mesh;
  private emberObject!: Object3D;
  private emberCoreMaterial!: MeshBasicMaterial;
  private emberLight!: PointLight;
  private walletObject!: Object3D;
  private walletTag!: UIKitMLAsset;
  private priceTag!: UIKitMLAsset;

  private mainPanel!: UIKitMLAsset;
  private factPanel!: UIKitMLAsset;
  private receiptPanel!: UIKitMLAsset;
  private endPanel!: UIKitMLAsset;
  private hintPanel!: UIKitMLAsset;

  private mainEyebrow!: UIKit.Text;
  private mainTitle!: UIKit.Text;
  private mainBody1!: UIKit.Text;
  private mainBody2!: UIKit.Text;
  private mainBody3!: UIKit.Text;
  private mainFoot!: UIKit.Text;
  private mainBtn1!: UIKit.Text;
  private mainBtn2!: UIKit.Text;
  private mainBtn3!: UIKit.Text;
  private enterButton!: UIKit.Text;

  private factEyebrow!: UIKit.Text;
  private factTitle!: UIKit.Text;
  private factBody1!: UIKit.Text;
  private factBody2!: UIKit.Text;
  private factBody3!: UIKit.Text;
  private factFoot!: UIKit.Text;
  private factDots: UIKit.Text[] = [];

  private receiptEyebrow!: UIKit.Text;
  private receiptTitle!: UIKit.Text;
  private receiptSubtitle!: UIKit.Text;
  private receiptStats: UIKit.Text[] = [];
  private receiptBody1!: UIKit.Text;
  private receiptBody2!: UIKit.Text;
  private receiptBody3!: UIKit.Text;
  private receiptCrush!: UIKit.Text;
  private receiptAnother!: UIKit.Text;
  private receiptDone!: UIKit.Text;

  private endEyebrow!: UIKit.Text;
  private endTitle!: UIKit.Text;
  private endBody1!: UIKit.Text;
  private endBody2!: UIKit.Text;
  private endFact!: UIKit.Text;
  private endCta!: UIKit.Text;
  private endBreathe!: UIKit.Text;
  private endDone!: UIKit.Text;
  private endQuit!: UIKit.Text;

  private hintText!: UIKit.Text;

  private priceTagEyebrow!: UIKit.Text;
  private priceTagTitle!: UIKit.Text;
  private priceTagBody!: UIKit.Text;
  private walletTagEyebrow!: UIKit.Text;
  private walletTagTitle!: UIKit.Text;
  private walletTagBody!: UIKit.Text;

  private particles!: PhantomParticles;
  private audio = new PhantomAudio();
  private grabSystem: GrabSystem | undefined;

  private currentPhase: Phase = Phase.Shop;
  private puffs = 0;
  private bought = false;
  private openedOnce = false;
  private shopMath = false;
  private held = false;
  private lit = false;
  private lidTarget = 0;
  private lidProgress = 0;
  private packScale = 0.001;
  private packScaleTarget = 0.001;
  private packContactScale = 0.001;
  private packContactTarget = 0.001;
  private hologramScale = 0.001;
  private hologramTarget = 0.001;
  private mouthTime = 0;
  private puffLatched = false;
  /** Desktop test mode: no hands available, so the cigarette floats held. */
  private desktopHeld = false;
  private puffCooldown = 0;
  private receiptDelay = -1;
  private endDelay = -1;
  private throwT = -1;
  private throwBurst = false;
  private crushT = -1;
  private pendingEnd: EndKind = 'stopped';

  private streak = 0;
  private wins = 0;
  private lastDay = '';
  private readonly todayKey = this.dayKey(new Date());
  private readonly yesterdayKey = this.dayKey(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
  );

  private cashT = -1;
  private cashBills: Mesh[] = [];
  private cashFrom: Vector3[] = [];
  private cashTo: Vector3[] = [];
  private cashSpins: number[] = [];

  private readonly headPosition = new Vector3();
  private readonly forward = new Vector3();
  private readonly mouthPosition = new Vector3();
  private readonly filterPosition = new Vector3();
  private readonly effectPosition = new Vector3();
  private readonly packPosition = new Vector3();
  private readonly crushStart = new Vector3();
  private readonly tempPosition = new Vector3();
  private readonly holdTarget = new Vector3();
  private readonly holdDir = new Vector3();
  private readonly holdRight = new Vector3();
  private readonly holdQuat = new Quaternion();

  private readonly organMaterials: Array<{
    organ: Organ;
    material: MeshStandardMaterial;
    base: number;
  }> = [];

  private readonly onMain1 = () => this.handleMain(1);
  private readonly onMain2 = () => this.handleMain(2);
  private readonly onMain3 = () => this.handleMain(3);
  private readonly onEnterVR = () => {
    this.audio.ensure();
    this.audio.click();
    this.world.launchXR();
  };
  private readonly onStop = () => this.stopSmoking();
  private readonly onCrush = () => this.crushCigarette();
  private readonly onAnother = () => this.lightAnother();
  private readonly onReceiptDone = () => this.finishReceipt();
  private readonly onBreathe = () => this.restart();
  private readonly onDone = () => this.showThankYou();
  private readonly onQuit = () => {
    this.audio.ensure();
    this.audio.click();
    this.world.exitXR();
    this.showThankYou();
  };

  init(): void {
    this.sessionEntity = this.world.requireSceneEntity('session');
    this.cigaretteEntity = this.world.requireSceneEntity('cigarette');
    this.hologramEntity = this.world.requireSceneEntity('body-hologram');

    this.packObject = this.world.requireSceneObject('pack');
    this.blobbyObject = this.world.requireSceneObject('blobby');
    this.blobbyHome.copy(this.blobbyObject.position);
    this.blobbyBaseScale = this.blobbyObject.scale.x || 0.75;
    this.packContactObject = this.world.requireSceneObject('pack-contact');
    this.cigaretteObject = this.world.requireSceneObject('cigarette');
    this.hologramObject = this.world.requireSceneObject('body-hologram');
    this.walletObject = this.world.requireSceneObject('wallet');
    this.emberObject = this.world.requireSceneObject('ember');
    // The floating "atom" companion (core + two rings) is decorative only;
    // hide its visible parts so it stops cluttering the view, but keep the
    // warm point light that lights the table.
    for (const child of this.emberObject.children) {
      if (!(child instanceof PointLight)) {
        child.visible = false;
      }
    }
    this.grabSystem = this.world.getSystem(GrabSystem);

    this.brandFrameObject = this.world.requireSceneObject('brand-frame');
    this.brandFrameEntity = this.world.requireSceneEntity('brand-frame');
    this.brandFrameEntity.addComponent(RayInteractable);
    this.queries.brandPress.subscribe('qualify', (entity) => {
      if (entity === this.brandFrameEntity) {
        const opened = window.open(
          'https://thriverlink.com/',
          '_blank',
          'noopener',
        );
        if (!opened) {
          window.location.href = 'https://thriverlink.com/';
        }
      }
    });

    this.lidPivot = this.requireChild(this.packObject, 'LidPivot');
    this.filterAnchor = this.requireChild(this.cigaretteObject, 'FilterAnchor');
    this.smokeAnchor = this.requireChild(this.cigaretteObject, 'SmokeAnchor');
    this.paperMesh = this.requireChild(this.cigaretteObject, 'Paper') as Mesh;
    this.emberMesh = this.requireChild(this.cigaretteObject, 'Ember') as Mesh;
    this.ashMesh = this.requireChild(this.cigaretteObject, 'Ash') as Mesh;
    this.emberMaterial = this.emberMesh.material as MeshStandardMaterial;
    this.scanRing = this.requireChild(this.hologramObject, 'ScanRing');
    this.emberCoreMaterial = (
      this.requireChild(this.emberObject, 'EmberCore') as Mesh
    ).material as MeshBasicMaterial;
    this.emberLight = this.requireChild(
      this.emberObject,
      'EmberLight',
    ) as PointLight;
    this.brandLogoMesh = this.requireChild(
      this.brandFrameObject,
      'BrandPosterLogo',
    ) as Mesh;
    AssetManager.loadTexture(
      `${import.meta.env.BASE_URL}branding/thriver-link-logo.png`,
    )
      .then((logo) => {
        logo.colorSpace = SRGBColorSpace;
        // Keep the chain links legible at glancing angles from the table.
        logo.anisotropy = 8;
        // Restyle this placed instance only; never mutate the shared
        // prototype material from a clone.
        this.brandLogoMesh.material = new MeshBasicMaterial({
          map: logo,
          transparent: true,
          toneMapped: false,
        });
      })
      .catch((cause: unknown) => {
        console.warn('ThriverLink logo texture unavailable', cause);
      });

    this.collectOrganMaterials();

    this.mainPanel = this.world.requireSceneObject<UIKitMLAsset>('main-panel');
    this.factPanel = this.world.requireSceneObject<UIKitMLAsset>('fact-panel');
    this.receiptPanel =
      this.world.requireSceneObject<UIKitMLAsset>('receipt-panel');
    this.endPanel = this.world.requireSceneObject<UIKitMLAsset>('end-panel');
    this.hintPanel = this.world.requireSceneObject<UIKitMLAsset>('hint-panel');
    this.priceTag = this.world.requireSceneObject<UIKitMLAsset>('price-tag');
    this.walletTag = this.world.requireSceneObject<UIKitMLAsset>('wallet-tag');

    this.cacheUI();
    this.bindUI();
    this.loadStreak();

    this.particles = new PhantomParticles(
      this.world.requireSceneObject('fx-root'),
    );
    this.createCashBills();

    this.packScale = 0.001;
    this.packContactScale = 0.001;
    this.packObject.scale.setScalar(this.packScale);
    this.packContactObject.scale.setScalar(this.packContactScale);
    this.cigaretteObject.scale.setScalar(0.001);
    this.cigaretteObject.visible = false;
    this.hidePanel(this.factPanel);
    this.hidePanel(this.receiptPanel);
    this.hidePanel(this.endPanel);
    this.hidePanel(this.hintPanel);
    this.hidePanel(this.priceTag);
    this.hidePanel(this.walletTag);
    this.hologramObject.scale.setScalar(0.001);

    this.world.visibilityState.subscribe((state) => {
      const flat = state === VisibilityState.NonImmersive;
      this.enterButton.setProperties({ display: flat ? 'flex' : 'none' });
    });
    this.enterButton.setProperties({
      display:
        this.world.visibilityState.value === VisibilityState.NonImmersive
          ? 'flex'
          : 'none',
    });

    this.enterPhase(Phase.Shop);
  }

  update(delta: number, time: number): void {
    if (this.puffCooldown > 0) {
      this.puffCooldown -= delta;
    }
    this.animatePack(delta);
    this.animateCigarette(delta, time);
    this.animateHologram(delta, time);
    this.animateEmber(time);
    this.animateCash(delta);
    this.animateCrush(delta);
    this.animateDesktopHold();
    this.animateBlobby(delta, time);
    if (this.currentPhase === Phase.Smoke && this.lit) {
      this.smokeTrailTimer -= delta;
      if (this.smokeTrailTimer <= 0) {
        this.smokeTrailTimer = 0.12;
        this.emberMesh.getWorldPosition(this.tempPosition);
        this.particles.trail(this.tempPosition);
      }
    }
    this.detectPuff(delta);
    this.particles.update(delta);

    if (this.receiptDelay > 0) {
      this.receiptDelay -= delta;
      if (this.receiptDelay <= 0) {
        this.receiptDelay = -1;
        this.enterPhase(Phase.Receipt);
      }
    }

    if (this.endDelay > 0) {
      this.endDelay -= delta;
      if (this.endDelay <= 0) {
        this.endDelay = -1;
        this.enterPhase(Phase.End);
      }
    }
  }

  private requireChild(parent: Object3D, name: string): Object3D {
    const child = parent.getObjectByName(name);
    if (!child) {
      throw new Error(`PHANTOM: "${name}" was not found under the placed asset`);
    }
    return child;
  }

  private cacheUI(): void {
    this.mainEyebrow = this.mainPanel.requireElementById<UIKit.Text>('eyebrow');
    this.mainTitle = this.mainPanel.requireElementById<UIKit.Text>('title');
    this.mainBody1 = this.mainPanel.requireElementById<UIKit.Text>('body1');
    this.mainBody2 = this.mainPanel.requireElementById<UIKit.Text>('body2');
    this.mainBody3 = this.mainPanel.requireElementById<UIKit.Text>('body3');
    this.mainFoot = this.mainPanel.requireElementById<UIKit.Text>('foot');
    this.mainBtn1 = this.mainPanel.requireElementById<UIKit.Text>('btn1');
    this.mainBtn2 = this.mainPanel.requireElementById<UIKit.Text>('btn2');
    this.mainBtn3 = this.mainPanel.requireElementById<UIKit.Text>('btn3');
    this.enterButton = this.mainPanel.requireElementById<UIKit.Text>('btnEnter');

    this.factEyebrow = this.factPanel.requireElementById<UIKit.Text>('eyebrow');
    this.factTitle = this.factPanel.requireElementById<UIKit.Text>('title');
    this.factBody1 = this.factPanel.requireElementById<UIKit.Text>('body1');
    this.factBody2 = this.factPanel.requireElementById<UIKit.Text>('body2');
    this.factBody3 = this.factPanel.requireElementById<UIKit.Text>('body3');
    this.factFoot = this.factPanel.requireElementById<UIKit.Text>('foot');
    for (let index = 1; index <= 4; index += 1) {
      this.factDots.push(
        this.factPanel.requireElementById<UIKit.Text>(`dot${index}`),
      );
    }

    this.receiptEyebrow =
      this.receiptPanel.requireElementById<UIKit.Text>('eyebrow');
    this.receiptTitle =
      this.receiptPanel.requireElementById<UIKit.Text>('title');
    this.receiptSubtitle =
      this.receiptPanel.requireElementById<UIKit.Text>('subtitle');
    for (let index = 1; index <= 4; index += 1) {
      this.receiptStats.push(
        this.receiptPanel.requireElementById<UIKit.Text>(`stat${index}`),
      );
    }
    this.receiptBody1 =
      this.receiptPanel.requireElementById<UIKit.Text>('body1');
    this.receiptBody2 =
      this.receiptPanel.requireElementById<UIKit.Text>('body2');
    this.receiptBody3 =
      this.receiptPanel.requireElementById<UIKit.Text>('body3');
    this.receiptCrush =
      this.receiptPanel.requireElementById<UIKit.Text>('btnCrush');
    this.receiptAnother =
      this.receiptPanel.requireElementById<UIKit.Text>('btnAnother');
    this.receiptDone =
      this.receiptPanel.requireElementById<UIKit.Text>('btnDone');

    this.endEyebrow = this.endPanel.requireElementById<UIKit.Text>('eyebrow');
    this.endTitle = this.endPanel.requireElementById<UIKit.Text>('title');
    this.endBody1 = this.endPanel.requireElementById<UIKit.Text>('body1');
    this.endBody2 = this.endPanel.requireElementById<UIKit.Text>('body2');
    this.endFact = this.endPanel.requireElementById<UIKit.Text>('factBody');
    this.endCta = this.endPanel.requireElementById<UIKit.Text>('cta');
    this.endBreathe = this.endPanel.requireElementById<UIKit.Text>('btnBreathe');
    this.endDone = this.endPanel.requireElementById<UIKit.Text>('btnDone');
    this.endQuit = this.endPanel.requireElementById<UIKit.Text>('btnQuit');

    this.hintText = this.hintPanel.requireElementById<UIKit.Text>('hintText');

    this.priceTagEyebrow =
      this.priceTag.requireElementById<UIKit.Text>('tagEyebrow');
    this.priceTagTitle =
      this.priceTag.requireElementById<UIKit.Text>('tagTitle');
    this.priceTagBody =
      this.priceTag.requireElementById<UIKit.Text>('tagBody');
    this.walletTagEyebrow =
      this.walletTag.requireElementById<UIKit.Text>('tagEyebrow');
    this.walletTagTitle =
      this.walletTag.requireElementById<UIKit.Text>('tagTitle');
    this.walletTagBody =
      this.walletTag.requireElementById<UIKit.Text>('tagBody');
  }

  private bindUI(): void {
    const bind = (element: UIKit.Text, handler: () => void): void => {
      element.addEventListener('click', handler);
      this.cleanupFuncs.push(() => element.removeEventListener('click', handler));
    };
    bind(this.mainBtn1, this.onMain1);
    bind(this.mainBtn2, this.onMain2);
    bind(this.mainBtn3, this.onMain3);
    bind(this.enterButton, this.onEnterVR);
    bind(this.factPanel.requireElementById<UIKit.Text>('btnStop'), this.onStop);
    bind(this.receiptCrush, this.onCrush);
    bind(this.receiptAnother, this.onAnother);
    bind(this.receiptDone, this.onReceiptDone);
    bind(this.endBreathe, this.onBreathe);
    bind(this.endDone, this.onDone);
    bind(this.endQuit, this.onQuit);

    this.queries.heldCigarette.subscribe('qualify', () => {
      this.held = true;
      this.audio.ensure();
      if (this.currentPhase === Phase.Opened) {
        this.beginSmoke();
      }
      if (this.currentPhase === Phase.Smoke) {
        this.showHint('Hold the filter near your mouth.');
      }
    });
    this.queries.heldCigarette.subscribe('disqualify', () => {
      this.held = false;
      if (this.currentPhase === Phase.Smoke) {
        this.showHint('Pinch it, then hold the filter near your mouth.');
      }
    });
    this.cleanupFuncs.push(() => {
      this.held = false;
    });

    // Autoplay policy: the shop line can only start after a real gesture.
    // The first pointer press anywhere unlocks audio and plays it once.
    const unlockVoice = () => {
      this.audio.ensure();
      this.startAmbient();
      if (!this.shopVoicePlayed) {
        this.shopVoicePlayed = true;
        this.playVoice(Phase.Shop);
      }
      window.removeEventListener('pointerdown', unlockVoice, true);
    };
    window.addEventListener('pointerdown', unlockVoice, true);
    this.cleanupFuncs.push(() => {
      window.removeEventListener('pointerdown', unlockVoice, true);
    });
  }

  private totalSpent = 0;

  private tabText(): string {
    return this.totalSpent > 0 ? `$${this.totalSpent.toFixed(2)}` : '$0.00';
  }

  private handleMain(button: number): void {
    this.audio.ensure();
    this.audio.click();
    switch (this.currentPhase) {
      case Phase.Shop:
        if (button === 1) {
          this.buyPack();
        } else if (button === 2) {
          this.shopMath = !this.shopMath;
          this.renderShopCopy();
        } else {
          this.pendingEnd = 'declined';
          this.recordWin();
          this.enterPhase(Phase.End);
        }
        break;
      case Phase.Bought:
        if (button === 1) {
          this.openPack();
        } else if (button === 2) {
          this.throwPack();
        } else {
          this.enterPhase(Phase.Closed);
        }
        break;
      case Phase.Opened:
        if (button === 1) {
          this.beginSmoke();
        } else if (button === 2) {
          this.closePack();
        } else {
          this.throwPack();
        }
        break;
      case Phase.Closed:
        if (button === 1) {
          this.openPack();
        } else if (button === 2) {
          this.throwPack();
        } else {
          this.pendingEnd = 'closed';
          this.recordWin();
          this.enterPhase(Phase.End);
        }
        break;
      case Phase.Smoke:
        if (button === 1) {
          this.buttonPuff();
        } else if (button === 2) {
          this.stopSmoking();
        }
        break;
      default:
        break;
    }
  }

  private buyPack(): void {
    this.audio.buy();
    this.totalSpent += 8;
    try {
      window.localStorage.setItem(
        'phantom.totalSpent',
        String(this.totalSpent),
      );
    } catch {
      // The session still works without persistence.
    }
    this.bought = true;
    this.sessionEntity.setValue(Session, 'bought', true);
    this.startCashFly();
    this.enterPhase(Phase.Bought);
  }

  private openPack(): void {
    this.audio.open();
    this.openedOnce = true;
    this.sessionEntity.setValue(Session, 'opened', true);
    this.enterPhase(Phase.Opened);
  }

  private closePack(): void {
    this.audio.close();
    this.enterPhase(Phase.Closed);
  }

  private beginSmoke(): void {
    this.audio.ensure();
    this.audio.light();
    this.puffs = 0;
    this.mouthTime = 0;
    this.puffLatched = false;
    this.puffCooldown = 0;
    this.sessionEntity.setValue(Session, 'puffs', 0);
    this.sessionEntity.setValue(Session, 'lastFact', -1);
    this.cigaretteEntity.setValue(Cigarette, 'puffs', 0);
    this.cigaretteEntity.setValue(Cigarette, 'burn', 0);
    this.cigaretteEntity.setValue(Cigarette, 'lit', true);
    this.cigaretteEntity.setValue(Cigarette, 'crushed', false);
    this.lit = true;
    this.applyBurn();
    this.enterPhase(Phase.Smoke);
    this.desktopHeld =
      this.world.visibilityState.value === VisibilityState.NonImmersive;
    this.smokeAnchor.getWorldPosition(this.effectPosition);
    this.particles.sparks(this.effectPosition, 12);
    this.showHint(
      this.desktopHeld
        ? 'Desktop rehearsal · press Take a puff'
        : this.held
          ? 'Filter to your mouth · hold'
          : 'Pinch the cigarette',
    );
  }

  private stopSmoking(): void {
    this.audio.click();
    if (this.puffs === 0) {
      this.pendingEnd = 'stopped';
      this.recordWin();
      this.enterPhase(Phase.End);
      return;
    }
    this.enterPhase(Phase.Receipt);
  }

  private finishReceipt(): void {
    this.pendingEnd = 'stopped';
    this.recordWin();
    this.enterPhase(Phase.End);
  }

  private lightAnother(): void {
    this.audio.ensure();
    this.audio.light();
    this.releaseCigarette();
    this.puffs = 0;
    this.sessionEntity.setValue(Session, 'puffs', 0);
    this.resetCigarette();
    this.placeCigaretteInPack();
    this.cigaretteEntity.setValue(Cigarette, 'lit', true);
    this.lit = true;
    this.applyBurn();
    this.enterPhase(Phase.Smoke);
    this.desktopHeld =
      this.world.visibilityState.value === VisibilityState.NonImmersive;
    this.showHint('Pinch the cigarette to pick it up.');
  }

  private crushCigarette(): void {
    this.audio.crush();
    this.pendingEnd = 'crushed';
    this.recordWin();
    this.releaseCigarette();
    this.cigaretteEntity.setValue(Cigarette, 'crushed', true);
    this.cigaretteObject.getWorldPosition(this.crushStart);
    this.crushT = 0;
    this.endDelay = 1.05;
    this.receiptDelay = -1;
    this.hidePanel(this.receiptPanel);
    this.hidePanel(this.factPanel);
    this.hidePanel(this.hintPanel);
    this.hidePanel(this.mainPanel);
    this.hologramTarget = 0.001;
    this.particles.sparks(this.crushStart, 18);
  }

  private throwPack(): void {
    this.audio.confetti();
    this.pendingEnd = 'thrown';
    this.recordWin();
    this.enterPhase(Phase.Thrown);
    this.packObject.position.copy(PACK_HOME);
    this.throwT = 0;
    this.throwBurst = false;
    this.packScaleTarget = 1;
    this.endDelay = 1.7;
  }

  private restart(): void {
    this.audio.ensure();
    this.audio.click();
    this.enterPhase(Phase.Shop);
  }

  private showThankYou(): void {
    this.audio.ensure();
    this.audio.chime();
    this.playTrack('thankyou');
    this.effectPosition.set(0, 1.2, -1.0);
    this.particles.confettiBurst(this.effectPosition);
    this.setText(this.endEyebrow, 'THANKS FOR SITTING WITH IT');
    this.setText(this.endTitle, 'You can take the headset off now.');
    this.setText(
      this.endBody1,
      'The pack was fake, but the pause you took instead of smoking was real.',
    );
    this.setText(
      this.endBody2,
      "The next urge will feel a little more familiar now that you've sat through this one.",
    );
    this.setText(this.endBreathe, 'One more round');
    this.endBreathe.setProperties({ display: 'flex' });
    this.endDone.setProperties({ display: 'none' });
    this.endQuit.setProperties({ display: 'none' });
    this.setText(
      this.endCta,
      'More help, for you or someone you care about, is at thriverlink.com.',
    );
  }

  private enterPhase(phase: Phase): void {
    if (phase !== Phase.Smoke) {
      this.desktopHeld = false;
    }
    this.currentPhase = phase;
    this.sessionEntity.setValue(Session, 'phase', phase);
    this.blobbyPop = 1;
    this.playVoice(phase);
    this.smokeTrailTimer = 0;

    switch (phase) {
      case Phase.Shop:
        this.bought = false;
        this.openedOnce = false;
        this.shopMath = false;
        this.puffs = 0;
        this.held = false;
        this.sessionEntity.setValue(Session, 'bought', false);
        this.sessionEntity.setValue(Session, 'opened', false);
        this.sessionEntity.setValue(Session, 'puffs', 0);
        this.sessionEntity.setValue(Session, 'lastFact', -1);
        this.releaseCigarette();
        this.resetCigarette();
        this.cigaretteObject.visible = false;
        this.cigaretteObject.scale.setScalar(0.001);
        this.packObject.visible = true;
        this.packContactObject.visible = true;
        this.packObject.position.copy(PACK_HOME);
        this.packObject.rotation.set(0, 0.31, 0);
        this.packScale = 0.001;
        this.packScaleTarget = 0.001;
        this.packObject.scale.setScalar(0.001);
        this.packContactScale = 0.001;
        this.packContactTarget = 0.001;
        this.packContactObject.scale.setScalar(0.001);
        this.lidTarget = 0;
        this.lidProgress = 0;
        this.lidPivot.rotation.x = 0;
        this.walletObject.visible = true;
        this.showPanel(this.mainPanel, MAIN_SCALE);
        this.hidePanel(this.factPanel);
        this.hidePanel(this.receiptPanel);
        this.hidePanel(this.endPanel);
        this.hidePanel(this.hintPanel);
        this.hidePanel(this.priceTag);
        this.showPanel(this.walletTag, TAG_SCALE);
        this.setTag(this.walletTag, 'YOUR TAB', this.tabText(), 'SO FAR · IT ONLY GROWS');
        this.hologramTarget = 0.001;
        this.hologramEntity.setValue(Hologram, 'active', false);
        this.hologramEntity.setValue(Hologram, 'organ', Organ.None);
        this.emberState(Mood.Calm);
        this.renderShopCopy();
        this.particles.reset();
        this.cashT = -1;
        for (const bill of this.cashBills) {
          bill.visible = false;
        }
        break;

      case Phase.Bought:
        this.bought = true;
        this.packObject.visible = true;
        this.packContactObject.visible = true;
        this.showPanel(this.mainPanel, MAIN_SCALE);
        this.showPanel(this.priceTag, TAG_SCALE);
        this.hidePanel(this.factPanel);
        this.hidePanel(this.receiptPanel);
        this.hidePanel(this.endPanel);
        this.hidePanel(this.hintPanel);
        this.showPanel(this.walletTag, TAG_SCALE);
        this.setTag(this.priceTag, 'PHANTOM PACK · 20', '$8.00', '1 day · 20 cigarettes');
        this.setTag(this.walletTag, 'YOUR TAB', `−$${this.totalSpent.toFixed(2)}`, 'THE TOTAL ONLY GROWS');
        this.packScaleTarget = 1;
        this.packContactTarget = 1;
        this.lidTarget = 0;
        this.hologramTarget = 0.001;
        this.emberState(Mood.Warm);
        this.setMain(
          'WHAT A YEAR COSTS',
          'A year of this adds up.',
          'A pack a day is 7,300 cigarettes in a year.',
          'That runs to about $2,920, and around 101 days of your life.',
          'You can still throw this pack away. Nothing here has cost you anything yet.',
          'You can take your time here.',
          ['Open the pack', true, 'primary'],
          ['Throw it away', true, 'secondary'],
          ['Put it back', true, 'ghost'],
        );
        break;

      case Phase.Opened:
        this.openedOnce = true;
        this.sessionEntity.setValue(Session, 'opened', true);
        this.showPanel(this.mainPanel, MAIN_SCALE);
        this.showPanel(this.priceTag, TAG_SCALE);
        this.hidePanel(this.factPanel);
        this.hidePanel(this.receiptPanel);
        this.hidePanel(this.endPanel);
        this.hidePanel(this.walletTag);
        this.setTag(this.priceTag, 'PHANTOM PACK · 20', '$8.00', 'OPEN · 20 LEFT');
        this.packScaleTarget = 1;
        this.packContactTarget = 1;
        this.lidTarget = 1;
        this.cigaretteObject.visible = true;
        this.cigaretteObject.scale.setScalar(1);
        this.placeCigaretteInPack();
        this.setGrabbable(true);
        this.hologramTarget = 0.001;
        this.emberState(Mood.Concerned);
        this.setMain(
          'THE URGE',
          'Wanting one is normal.',
          'A cigarette right in front of you makes the urge harder to sit with.',
          "An urge isn't a sign of a weak person: it rises, peaks, and passes on its own, usually within three to five minutes.",
          "If you've tried to quit before and it didn't hold, that wasn't a willpower problem. A plan you can lean on tends to carry you further than pushing harder does.",
          'The choice from here is yours.',
          ['Light it', true, 'primary'],
          ['Close the pack', true, 'secondary'],
          ['Throw it away', true, 'ghost'],
        );
        this.showHint('Pinch the cigarette to pick it up.');
        break;

      case Phase.Closed:
        this.showPanel(this.mainPanel, MAIN_SCALE);
        this.showPanel(this.priceTag, TAG_SCALE);
        this.hidePanel(this.factPanel);
        this.hidePanel(this.receiptPanel);
        this.hidePanel(this.endPanel);
        this.hidePanel(this.walletTag);
        this.setTag(this.priceTag, 'PHANTOM PACK · 20', '$8.00', 'CLOSED · STILL YOURS');
        this.packScaleTarget = 1;
        this.packContactTarget = 1;
        this.lidTarget = 0;
        this.releaseCigarette();
        this.cigaretteObject.visible = false;
        this.cigaretteObject.scale.setScalar(0.001);
        this.hologramTarget = 0.001;
        this.emberState(Mood.Calm);
        this.setMain(
          'THE PAUSE',
          'You closed the pack.',
          'You felt the urge and closed it instead of lighting up.',
          'No willpower required: you let the craving pass without acting on it.',
          "Next time will be a little easier, now that you've done it once.",
          'Open it again, throw it away, or stop here.',
          ['Open it again', true, 'primary'],
          ['Throw it away', true, 'secondary'],
          ["I'm done", true, 'ghost'],
        );
        this.hidePanel(this.hintPanel);
        break;

      case Phase.Smoke:
        this.showPanel(this.mainPanel, MAIN_SCALE);
        this.hidePanel(this.priceTag);
        this.hidePanel(this.walletTag);
        this.hidePanel(this.receiptPanel);
        this.hidePanel(this.endPanel);
        this.packScaleTarget = 1;
        this.packContactTarget = 1;
        this.lidTarget = 1;
        this.cigaretteObject.visible = true;
        this.cigaretteObject.scale.setScalar(1);
        this.setGrabbable(true);
        this.hologramTarget = HOLOGRAM_SCALE;
        this.hologramEntity.setValue(Hologram, 'active', true);
        this.emberState(Mood.Bright);
        this.setMain(
          'THE REHEARSAL · 4 PUFFS',
          'Bring the filter to your mouth.',
          'Pinch the cigarette, hold it near your mouth for a moment, then take the puff.',
          "After each puff, you'll see what a real one does inside the body.",
          'You can stop after any puff.',
          'Hands: pinch and hold. On web: press the button.',
          ['Take a puff', true, 'primary'],
          ['Stop here', true, 'secondary'],
          ['', false, 'ghost'],
        );
        this.showHint('Pinch it, then hold the filter near your mouth.');
        break;

      case Phase.Receipt:
        this.hidePanel(this.mainPanel);
        this.hidePanel(this.factPanel);
        this.hidePanel(this.hintPanel);
        this.hidePanel(this.priceTag);
        this.hidePanel(this.walletTag);
        this.hidePanel(this.endPanel);
        this.releaseCigarette();
        this.cigaretteObject.visible = false;
        this.hologramTarget = HOLOGRAM_SCALE;
        this.hologramEntity.setValue(Hologram, 'active', true);
        this.renderReceipt();
        this.showPanel(this.receiptPanel, RECEIPT_SCALE);
        break;

      case Phase.Thrown:
        this.hidePanel(this.mainPanel);
        this.hidePanel(this.factPanel);
        this.hidePanel(this.receiptPanel);
        this.hidePanel(this.endPanel);
        this.hidePanel(this.hintPanel);
        this.hidePanel(this.priceTag);
        this.hidePanel(this.walletTag);
        this.releaseCigarette();
        this.cigaretteObject.visible = false;
        this.hologramTarget = 0.001;
        this.emberState(Mood.Bright);
        break;

      case Phase.End:
        this.hidePanel(this.mainPanel);
        this.hidePanel(this.factPanel);
        this.hidePanel(this.receiptPanel);
        this.hidePanel(this.hintPanel);
        this.hidePanel(this.priceTag);
        this.hidePanel(this.walletTag);
        this.releaseCigarette();
        this.cigaretteObject.visible = false;
        this.cigaretteObject.scale.setScalar(0.001);
        this.hologramTarget = 0.001;
        this.hologramEntity.setValue(Hologram, 'active', false);
        this.hologramEntity.setValue(Hologram, 'organ', Organ.None);
        this.emberState(Mood.Bright);
        this.renderEnd();
        this.showPanel(this.endPanel, END_SCALE);
        break;

      default:
        break;
    }
  }

  private renderShopCopy(): void {
    if (this.shopMath) {
      this.setMain(
        'THE MATH',
        'A year, counted out',
        'A pack a day is 20 cigarettes, 365 days: 7,300 cigarettes in a year.',
        'Those cigarettes cost about $2,920, and roughly 101 days of your life.',
        this.totalSpent > 0
          ? `Your tab so far: $${this.totalSpent}. A real tab would keep adding up.`
          : 'Buy one pack a day and the total keeps growing: more money, more days gone.',
        'Back takes you to the counter.',
        ['Buy the pack', true, 'primary'],
        ['Back to the shop', true, 'secondary'],
        ['Not today', true, 'ghost'],
      );
      return;
    }
    if (this.totalSpent > 0) {
      this.setMain(
        'BACK AT THE COUNTER',
        'Another pack',
        `Your tab so far: $${this.totalSpent}.`,
        'At a pack a day, a year of this is about $2,920 and around 101 days of your life.',
        'Same counter, same practice, and the money is still make-believe.',
        'Seated, hands only, about five minutes.',
        ['Buy another', true, 'primary'],
        ['See the math', true, 'secondary'],
        ['Not today', true, 'ghost'],
      );
      return;
    }
    this.setMain(
      'THE SHOP',
      'A pack you can practice with',
      'A pack here costs the same as a real one: about $8 for 20 cigarettes.',
      'Over a year, a pack a day runs to about $2,920, and takes back around 101 days of your life.',
      "You're rehearsing, not smoking, so you can pick this pack up and set it down without it costing you anything.",
      'Seated, hands only, about five minutes.',
      ['Buy the pack', true, 'primary'],
      ['See the math', true, 'secondary'],
      ['Not today', true, 'ghost'],
    );
  }

  private setMain(
    eyebrow: string,
    title: string,
    body1: string,
    body2: string,
    body3: string,
    foot: string,
    button1: [string, boolean, ButtonStyle],
    button2: [string, boolean, ButtonStyle],
    button3: [string, boolean, ButtonStyle],
  ): void {
    this.setText(this.mainEyebrow, eyebrow);
    this.setText(this.mainTitle, title);
    this.setText(this.mainBody1, body1);
    this.setText(this.mainBody2, body2);
    this.setText(this.mainBody3, body3);
    this.setText(this.mainFoot, foot);
    this.setButton(this.mainBtn1, ...button1);
    this.setButton(this.mainBtn2, ...button2);
    this.setButton(this.mainBtn3, ...button3);
  }

  private setButton(
    element: UIKit.Text,
    label: string,
    visible: boolean,
    style: ButtonStyle,
  ): void {
    this.setText(element, label);
    element.setProperties({
      display: visible ? 'flex' : 'none',
      ...BUTTON_STYLES[style],
    });
  }

  /**
   * UIKitML gives the id to the layout container and puts the actual glyphs in
   * a Text child. Write both so a button/div label changes in every build.
   */
  private setText(element: UIKit.Text, text: string): void {
    element.setProperties({ text });
    for (const child of element.children) {
      if (child instanceof UIKit.Text) {
        child.setProperties({ text });
      }
    }
  }

  private setTag(
    panel: UIKitMLAsset,
    eyebrow: string,
    title: string,
    body: string,
  ): void {
    const isWallet = panel === this.walletTag;
    const eyebrowElement = isWallet
      ? this.walletTagEyebrow
      : this.priceTagEyebrow;
    const titleElement = isWallet ? this.walletTagTitle : this.priceTagTitle;
    const bodyElement = isWallet ? this.walletTagBody : this.priceTagBody;
    this.setText(eyebrowElement, eyebrow);
    this.setText(titleElement, title);
    this.setText(bodyElement, body);
  }

  private renderReceipt(): void {
    const puffs = Math.max(1, this.puffs);
    const life = puffs * 2;
    const tarLow = puffs;
    const tarHigh = puffs * 2;
    const nicLow = (puffs * 0.1).toFixed(1);
    const nicHigh = (puffs * 0.2).toFixed(1);
    this.setText(
      this.receiptSubtitle,
      `You sat through this one. You took ${puffs} puff${puffs === 1 ? '' : 's'}, about ${(puffs / 10).toFixed(1)} of a cigarette.`,
    );
    this.setText(this.receiptStats[0], `${life} min`);
    this.setText(this.receiptStats[1], `${tarLow}–${tarHigh} mg`);
    this.setText(this.receiptStats[2], `${tarLow}–${tarHigh} mg`);
    this.setText(this.receiptStats[3], `${nicLow}–${nicHigh} mg`);
    this.setText(
      this.receiptBody1,
      'A whole cigarette would cost closer to 20 minutes of life; the full pack is about 6.7 hours of life and 200 to 400 mg of tar, for your $8.',
    );
    this.setText(
      this.receiptBody2,
      'A pack a day for a year comes to about 101 days of your life and $2,920.',
    );
    this.setText(
      this.receiptBody3,
      "You can stop here. That's a real choice, and it's yours to make.",
    );
  }

  private renderEnd(): void {
    const day = Math.max(1, this.streak);
    const winWord = this.wins === 1 ? 'WIN' : 'WINS';
    this.setText(this.endEyebrow, `DAY ${day} · ${this.wins} ${winWord}`);
    this.setText(this.endBreathe, 'Go again');
    this.endBreathe.setProperties({ display: 'flex' });
    this.setText(this.endDone, 'Done');
    this.endDone.setProperties({ display: 'flex' });
    this.setText(this.endQuit, 'Quit');
    this.endQuit.setProperties({ display: 'flex' });
    this.setText(
      this.endCta,
      'If you or someone you care about wants a hand with this, thriverlink.com is there.',
    );
    this.setText(
      this.endFact,
      "Real recovery starts when you actually stop: heart rate begins to drop within 20 minutes, and carbon monoxide in your blood returns to normal within 12 hours (NHS). A rehearsal doesn't change your body.",
    );

    switch (this.pendingEnd) {
      case 'thrown':
        this.setText(this.endTitle, 'You threw it away.');
        this.setText(
          this.endBody1,
          'You felt the urge, picked up the pack, and got rid of it without lighting one.',
        );
        this.setText(this.endBody2, 'The urge will show up again, and when it does, this same practice is here to use.');
        break;
      case 'crushed':
        this.setText(this.endTitle, 'You crushed it.');
        this.setText(
          this.endBody1,
          'You tried a few puffs, then put it out. Stopping partway is a choice too.',
        );
        this.setText(this.endBody2, 'The urge will show up again, and when it does, this same practice is here to use.');
        break;
      case 'declined':
        this.setText(this.endTitle, 'You left it on the shelf.');
        this.setText(
          this.endBody1,
          'You stood at the counter and walked without buying.',
        );
        this.setText(this.endBody2, 'The urge will show up again, and when it does, this same practice is here to use.');
        break;
      case 'closed':
        this.setText(this.endTitle, 'You closed it.');
        this.setText(
          this.endBody1,
          'You had it open and chose to close it instead of lighting up.',
        );
        this.setText(this.endBody2, 'The urge will show up again, and when it does, this same practice is here to use.');
        break;
      case 'stopped':
        this.setText(
          this.endTitle,
          this.puffs === 0
            ? 'You stopped before the first puff.'
            : 'You stopped.',
        );
        this.setText(
          this.endBody1,
          this.puffs === 0
            ? 'You lit it and set it down before taking a puff.'
            : `You took ${this.puffs} puff${this.puffs === 1 ? '' : 's'} and then stopped. You can stop at any point.`,
        );
        this.setText(this.endBody2, 'The urge will show up again, and when it does, this same practice is here to use.');
        break;
      default:
        break;
    }
  }

  private showFact(fact: BodyFact, puff: number): void {
    this.setText(this.factEyebrow, fact.eyebrow);
    this.setText(this.factTitle, fact.title);
    this.setText(this.factBody1, fact.body1);
    this.setText(this.factBody2, fact.body2);
    this.setText(this.factBody3, fact.body3);
    this.setText(this.factFoot, fact.foot);
    for (let index = 0; index < this.factDots.length; index += 1) {
      this.factDots[index].setProperties({
        backgroundColor: index < puff ? '#FFB25C' : '#2A3E46',
      });
    }
    this.showPanel(this.factPanel, FACT_SCALE);
  }

  private showHint(text: string): void {
    this.setText(this.hintText, text);
    this.showPanel(this.hintPanel, HINT_SCALE);
  }

  private showPanel(panel: UIKitMLAsset, scale: number): void {
    panel.visible = true;
    panel.scale.setScalar(scale);
  }

  private hidePanel(panel: UIKitMLAsset): void {
    panel.visible = false;
    panel.scale.setScalar(0.001);
  }

  private setGrabbable(enabled: boolean): void {
    if (enabled) {
      if (!this.cigaretteEntity.hasComponent(OneHandGrabbable)) {
        this.cigaretteEntity.addComponent(OneHandGrabbable, {
          translate: true,
          rotate: true,
        });
      }
      return;
    }
    this.releaseCigarette();
    if (this.cigaretteEntity.hasComponent(OneHandGrabbable)) {
      this.cigaretteEntity.removeComponent(OneHandGrabbable);
    }
  }

  private releaseCigarette(): void {
    this.grabSystem?.forceRelease(this.cigaretteEntity);
    this.held = false;
  }

  private placeCigaretteInPack(): void {
    this.packObject.getWorldPosition(this.packPosition);
    this.cigaretteObject.position.set(
      this.packPosition.x,
      this.packPosition.y + 0.112,
      this.packPosition.z,
    );
    this.cigaretteObject.rotation.set(-Math.PI / 2 + 0.05, 0.3, 0.1);
  }

  private resetCigarette(): void {
    this.puffs = 0;
    this.mouthTime = 0;
    this.puffLatched = false;
    this.puffCooldown = 0;
    this.lit = false;
    this.cigaretteEntity.setValue(Cigarette, 'puffs', 0);
    this.cigaretteEntity.setValue(Cigarette, 'burn', 0);
    this.cigaretteEntity.setValue(Cigarette, 'lit', false);
    this.cigaretteEntity.setValue(Cigarette, 'crushed', false);
    this.paperMesh.scale.z = 1;
    this.paperMesh.position.z = -0.0125;
    this.emberMesh.position.z = -0.052;
    this.ashMesh.visible = false;
    this.ashMesh.position.z = -0.048;
    this.smokeAnchor.position.z = -0.056;
    this.emberMaterial.emissiveIntensity = 0.35;
    this.cigaretteObject.rotation.set(-Math.PI / 2 + 0.05, 0.3, 0.1);
  }

  private applyBurn(): void {
    const burn = Math.min(1, this.puffs / 4);
    this.paperMesh.scale.z = 1 - burn * 0.32;
    this.paperMesh.position.z = -0.0125 + burn * 0.018;
    this.emberMesh.position.z = -0.052 + burn * 0.034;
    this.ashMesh.visible = burn > 0.2;
    this.ashMesh.position.z = -0.048 + burn * 0.034;
    this.smokeAnchor.position.z = -0.056 + burn * 0.034;
    this.emberMaterial.emissiveIntensity = 0.5 + burn * 1.3;
  }

  private detectPuff(delta: number): void {
    if (this.currentPhase !== Phase.Smoke) {
      this.mouthTime = 0;
      return;
    }
    if (!this.cigaretteEntity.hasComponent(Grabbed)) {
      this.mouthTime = 0;
      return;
    }
    this.filterAnchor.getWorldPosition(this.filterPosition);
    this.world.camera.getWorldPosition(this.headPosition);
    this.world.camera.getWorldDirection(this.forward);
    this.mouthPosition
      .copy(this.headPosition)
      .addScaledVector(this.forward, 0.055);
    this.mouthPosition.y -= 0.055;
    const distance = this.filterPosition.distanceTo(this.mouthPosition);
    if (distance < MOUTH_RADIUS) {
      this.mouthTime += delta;
      if (
        this.mouthTime >= PUFF_DWELL &&
        !this.puffLatched &&
        this.puffCooldown <= 0
      ) {
        this.takePuff();
      }
      return;
    }
    this.mouthTime = 0;
    if (distance > MOUTH_RADIUS + 0.06) {
      this.puffLatched = false;
    }
  }

  private startAmbient(): void {
    if (this.ambientStarted) {
      return;
    }
    this.ambientStarted = true;
    const ambient = new Audio(
      `${import.meta.env.BASE_URL}audio/vo/ambient.mp3`,
    );
    ambient.loop = true;
    ambient.volume = 0.18;
    void ambient.play().catch(() => undefined);
    this.ambientAudio = ambient;
  }

  private playSfx(name: string): void {
    const sfx = new Audio(
      `${import.meta.env.BASE_URL}audio/vo/${name}.mp3`,
    );
    sfx.volume = 0.7;
    void sfx.play().catch(() => undefined);
  }

  private playVoice(phase: Phase): void {
    const track = VOICE_TRACKS[phase];
    if (track) {
      this.playTrack(track);
    }
  }

  private playTrack(track: string): void {
    if (this.voiceAudio) {
      this.voiceAudio.pause();
      this.voiceAudio = null;
    }
    const audio = new Audio(
      `${import.meta.env.BASE_URL}audio/vo/${track}.mp3`,
    );
    audio.volume = 0.85;
    void audio.play().catch(() => undefined);
    this.voiceAudio = audio;
  }

  /**
   * Blobby, the coach. One unified mesh with no rig, so the life comes from
   * whole-body motion: bob, sway, a look-at the player, a pop on every phase
   * change, a slump on the receipt, and a wobble of celebration at the end.
   */
  private animateBlobby(delta: number, time: number): void {
    if (!this.blobbyObject) {
      return;
    }
    if (this.blobbyPop > 0) {
      this.blobbyPop = Math.max(0, this.blobbyPop - delta * 1.4);
    }
    const pop = 1 + Math.sin(this.blobbyPop * Math.PI) * 0.22;

    // Look toward the player, with a gentle idle sway.
    this.blobbyObject.lookAt(this.world.camera.position);
    this.blobbyObject.rotateY(Math.sin(time * 0.7) * 0.06);
    this.blobbyObject.position.y =
      this.blobbyHome.y + Math.sin(time * 1.5) * 0.035;
    this.blobbyObject.scale.setScalar(this.blobbyBaseScale * pop);

    if (this.currentPhase === Phase.Receipt) {
      // Slump: flatten slightly, lean forward.
      this.blobbyObject.scale.y *= 0.86;
      this.blobbyObject.rotation.x = 0.18;
    } else if (this.currentPhase === Phase.End) {
      // Celebrate: wobble.
      this.blobbyObject.rotation.z = Math.sin(time * 4.2) * 0.16;
      this.blobbyObject.rotation.x = 0;
    } else {
      this.blobbyObject.rotation.x = 0;
      this.blobbyObject.rotation.z = 0;
    }
  }

  /**
   * Web desktop mode: no tracked hands, so the cigarette floats in a casual
   * held pose in front of the viewer and the panel's Take a puff button
   * drives the rehearsal. XR keeps the real hands-first interaction.
   */
  private animateDesktopHold(): void {
    if (
      !this.desktopHeld ||
      this.currentPhase !== Phase.Smoke ||
      this.cigaretteEntity.hasComponent(Grabbed)
    ) {
      return;
    }
    this.world.camera.getWorldPosition(this.headPosition);
    this.world.camera.getWorldDirection(this.forward);
    this.holdRight.crossVectors(this.forward, UP).normalize();
    this.holdTarget
      .copy(this.headPosition)
      .addScaledVector(this.forward, 0.3)
      .addScaledVector(this.holdRight, 0.075);
    this.holdTarget.y -= 0.09;
    this.holdDir.copy(this.holdTarget).sub(this.headPosition);
    this.holdDir.addScaledVector(this.forward, -0.055);
    this.holdDir.y -= 0.055;
    this.holdDir.normalize();
    this.holdQuat.setFromUnitVectors(FILTER_AXIS, this.holdDir);
    this.cigaretteObject.position.copy(this.holdTarget);
    this.cigaretteObject.quaternion.copy(this.holdQuat);
  }

  /** The Take a puff button: parity with a real mouth dwell, web only. */
  private buttonPuff(): void {
    if (this.currentPhase !== Phase.Smoke) {
      return;
    }
    if (this.puffCooldown > 0) {
      this.showHint('No rush: the next puff can wait as long as you like.');
      return;
    }
    this.desktopHeld =
      this.world.visibilityState.value === VisibilityState.NonImmersive;
    this.takePuff();
  }

  private takePuff(): void {
    this.puffs += 1;
    this.playSfx('puff');
    this.mouthTime = 0;
    this.puffLatched = true;
    this.puffCooldown = PUFF_COOLDOWN;
    this.sessionEntity.setValue(Session, 'puffs', this.puffs);
    this.sessionEntity.setValue(Session, 'lastFact', this.puffs - 1);
    this.cigaretteEntity.setValue(Cigarette, 'puffs', this.puffs);
    this.cigaretteEntity.setValue(Cigarette, 'burn', this.puffs / 4);
    this.applyBurn();
    this.smokeAnchor.getWorldPosition(this.effectPosition);
    this.particles.puff(this.effectPosition);
    this.audio.puff();
    const fact = FACTS[Math.min(this.puffs, FACTS.length) - 1];
    this.showFact(fact, this.puffs);
    this.hologramTarget = HOLOGRAM_SCALE;
    this.hologramEntity.setValue(Hologram, 'active', true);
    this.hologramEntity.setValue(Hologram, 'organ', fact.organ);
    this.hologramEntity.setValue(Hologram, 'intensity', 1);
    this.showHint(
      this.puffs >= 4 ? 'That was the fourth puff' : 'Keep going, or stop here',
    );
    if (this.puffs >= 4) {
      this.receiptDelay = 1.6;
    }
  }

  private animatePack(delta: number): void {
    this.lidProgress = MathUtils.damp(
      this.lidProgress,
      this.lidTarget,
      8,
      delta,
    );
    this.lidPivot.rotation.x = -1.18 * this.lidProgress;
    this.packScale = MathUtils.damp(
      this.packScale,
      this.packScaleTarget,
      9,
      delta,
    );
    this.packObject.scale.setScalar(this.packScale);
    this.packContactScale = MathUtils.damp(
      this.packContactScale,
      this.packContactTarget,
      9,
      delta,
    );
    this.packContactObject.scale.setScalar(this.packContactScale);

    if (this.throwT >= 0) {
      this.throwT += delta / 1.25;
      const t = Math.min(1, this.throwT);
      const eased = t * t * (3 - 2 * t);
      this.packObject.position.set(
        PACK_HOME.x + (BIN_TARGET.x - PACK_HOME.x) * eased,
        PACK_HOME.y +
          (BIN_TARGET.y - PACK_HOME.y) * eased +
          Math.sin(Math.PI * t) * 0.42,
        PACK_HOME.z + (BIN_TARGET.z - PACK_HOME.z) * eased,
      );
      this.packObject.rotation.y = 0.3 + t * 2.4;
      this.packObject.rotation.z = Math.sin(Math.PI * t) * 0.5;
      if (!this.throwBurst && t > 0.72) {
        this.throwBurst = true;
        this.effectPosition.copy(BIN_TARGET);
        this.effectPosition.y += 0.1;
        this.particles.confettiBurst(this.effectPosition);
      }
      if (this.throwT >= 1) {
        this.throwT = -1;
        this.packObject.visible = false;
        this.packScaleTarget = 0.001;
      }
    }
  }

  private animateCigarette(delta: number, time: number): void {
    if (
      this.cigaretteObject.visible &&
      !this.held &&
      (this.currentPhase === Phase.Opened || this.currentPhase === Phase.Smoke)
    ) {
      this.placeCigaretteInPack();
      this.cigaretteObject.rotation.z += Math.sin(time * 1.7) * 0.02;
    }
    if (this.lit && this.currentPhase === Phase.Smoke) {
      this.emberMaterial.emissiveIntensity =
        1.1 + Math.sin(time * 7.5) * 0.3 + this.puffs * 0.1;
    }
  }

  private animateHologram(delta: number, time: number): void {
    this.hologramScale = MathUtils.damp(
      this.hologramScale,
      this.hologramTarget,
      6,
      delta,
    );
    this.hologramObject.scale.setScalar(this.hologramScale);
    if (this.hologramScale < 0.01) {
      return;
    }
    this.scanRing.position.y = 0.12 + (Math.sin(time * 0.8) * 0.5 + 0.5) * 1.5;
    const active = this.hologramEntity.getValue(Hologram, 'organ') ?? Organ.None;
    for (const entry of this.organMaterials) {
      const isActive = entry.organ === active;
      entry.material.emissiveIntensity = isActive
        ? entry.base + 0.55 + Math.sin(time * 4.2) * 0.25
        : entry.base * 0.32;
    }
  }

  private animateEmber(time: number): void {
    const bob = Math.sin(time * 1.45) * 0.022;
    this.emberObject.position.y = 1.44 + bob;
    this.emberObject.position.x = 0.28 + Math.sin(time * 0.7) * 0.012;
    const ringA = this.emberObject.getObjectByName('RingA');
    const ringB = this.emberObject.getObjectByName('RingB');
    if (ringA) {
      ringA.rotation.x = 1.1 + Math.sin(time * 0.9) * 0.22;
      ringA.rotation.y = 0.2 + time * 0.24;
    }
    if (ringB) {
      ringB.rotation.y = 1.2 + time * 0.18;
      ringB.rotation.z = -0.4 + Math.sin(time * 0.7) * 0.18;
    }
    this.emberLight.intensity = 0.55 + Math.sin(time * 2.2) * 0.12;
  }

  private animateCash(delta: number): void {
    if (this.cashT < 0) {
      return;
    }
    this.cashT += delta / 0.85;
    const t = Math.min(1, this.cashT);
    const eased = t * t * (3 - 2 * t);
    for (let index = 0; index < this.cashBills.length; index += 1) {
      const bill = this.cashBills[index];
      bill.position.lerpVectors(this.cashFrom[index], this.cashTo[index], eased);
      bill.position.y += Math.sin(Math.PI * eased) * 0.18;
      bill.rotation.z += this.cashSpins[index] * delta;
      bill.rotation.x += this.cashSpins[index] * 0.4 * delta;
      if (t >= 1) {
        bill.visible = false;
      }
    }
    if (this.cashT >= 1) {
      this.cashT = -1;
    }
  }

  private animateCrush(delta: number): void {
    if (this.crushT < 0) {
      return;
    }
    this.crushT += delta / 0.9;
    const t = Math.min(1, this.crushT);
    const eased = t * t * (3 - 2 * t);
    this.cigaretteObject.position.lerpVectors(
      this.crushStart,
      ASHTRAY_TARGET,
      eased,
    );
    this.cigaretteObject.position.y += Math.sin(Math.PI * eased) * 0.08;
    this.cigaretteObject.rotation.z += 0.16;
    this.cigaretteObject.scale.setScalar(1 - eased * 0.55);
    if (this.crushT >= 1) {
      this.crushT = -1;
      this.cigaretteObject.visible = false;
    }
  }

  private createCashBills(): void {
    const geometry = new BoxGeometry(0.062, 0.0009, 0.032);
    const material = new MeshStandardMaterial({
      color: new Color('#B8C7B2'),
      roughness: 0.72,
      metalness: 0.04,
      emissive: new Color('#26382A'),
      emissiveIntensity: 0.35,
    });
    const root = this.world.requireSceneObject('fx-root');
    for (let index = 0; index < 6; index += 1) {
      const bill = new Mesh(geometry, material);
      bill.name = `CashBill${index + 1}`;
      bill.visible = false;
      root.add(bill);
      this.cashBills.push(bill);
      this.cashFrom.push(new Vector3());
      this.cashTo.push(new Vector3());
      this.cashSpins.push(4 + index * 0.7);
    }
  }

  private startCashFly(): void {
    this.walletObject.getWorldPosition(this.tempPosition);
    this.packObject.getWorldPosition(this.packPosition);
    for (let index = 0; index < this.cashBills.length; index += 1) {
      const bill = this.cashBills[index];
      bill.visible = true;
      bill.position.set(
        this.tempPosition.x + (index - 2.5) * 0.012,
        this.tempPosition.y + 0.03 + index * 0.004,
        this.tempPosition.z + (index % 2 === 0 ? 0.02 : -0.02),
      );
      bill.rotation.set(0, 0, index * 0.4);
      this.cashFrom[index].copy(bill.position);
      this.cashTo[index].set(
        this.packPosition.x + (index - 2.5) * 0.008,
        this.packPosition.y + 0.06,
        this.packPosition.z,
      );
    }
    this.cashT = 0;
  }

  private collectOrganMaterials(): void {
    const seen = new Set<MeshStandardMaterial>();
    const add = (organ: Organ, name: string): void => {
      const root = this.hologramObject.getObjectByName(name);
      if (!root) {
        return;
      }
      root.traverse((child) => {
        if (!(child instanceof Mesh)) {
          return;
        }
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const material of materials) {
          if (
            material instanceof MeshStandardMaterial &&
            !seen.has(material)
          ) {
            seen.add(material);
            this.organMaterials.push({
              organ,
              material,
              base: material.emissiveIntensity,
            });
          }
        }
      });
    };
    add(Organ.Brain, 'Brain');
    add(Organ.Heart, 'Heart');
    add(Organ.Lungs, 'LungLeft');
    add(Organ.Lungs, 'LungRight');
    add(Organ.Blood, 'Bloodstream');
  }

  private emberState(mood: Mood): void {
    const stateEntity = this.world.getSceneEntity('ember');
    stateEntity?.setValue(EmberState, 'mood', mood);
    const colors: Record<Mood, string> = {
      [Mood.Calm]: '#FFD08A',
      [Mood.Warm]: '#FFB25C',
      [Mood.Concerned]: '#FF8A5C',
      [Mood.Bright]: '#8FF4E6',
    };
    this.emberCoreMaterial.color.set(colors[mood]);
  }

  private loadStreak(): void {
    try {
      const wins = Number(window.localStorage.getItem('phantom.wins') ?? '0');
      const streak = Number(window.localStorage.getItem('phantom.streak') ?? '0');
      const lastDay = window.localStorage.getItem('phantom.lastDay') ?? '';
      const spent = Number(
        window.localStorage.getItem('phantom.totalSpent') ?? '0',
      );
      this.wins = Number.isFinite(wins) ? wins : 0;
      this.streak = Number.isFinite(streak) ? streak : 0;
      this.totalSpent = Number.isFinite(spent) ? spent : 0;
      this.lastDay = lastDay;
      if (lastDay !== this.todayKey && lastDay !== this.yesterdayKey) {
        this.streak = 0;
      }
    } catch {
      this.wins = 0;
      this.streak = 0;
      this.lastDay = '';
    }
    this.sessionEntity.setValue(Session, 'wins', this.wins);
    this.sessionEntity.setValue(Session, 'streak', this.streak);
  }

  private recordWin(): void {
    if (this.lastDay === this.todayKey) {
      this.wins += 1;
      this.streak = Math.max(1, this.streak);
    } else if (this.lastDay === this.yesterdayKey) {
      this.streak += 1;
      this.wins += 1;
    } else {
      this.streak = 1;
      this.wins += 1;
    }
    this.lastDay = this.todayKey;
    this.sessionEntity.setValue(Session, 'wins', this.wins);
    this.sessionEntity.setValue(Session, 'streak', this.streak);
    try {
      window.localStorage.setItem('phantom.wins', String(this.wins));
      window.localStorage.setItem('phantom.streak', String(this.streak));
      window.localStorage.setItem('phantom.lastDay', this.lastDay);
    } catch {
      // The session still works without persistence.
    }
  }

  private dayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
