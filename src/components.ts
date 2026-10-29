/**
 * Authorable state for PHANTOM. The session node owns the high-level phase;
 * the cigarette, hologram and Ember carry their own small visual state.
 */

import { createComponent, defineComponents, Types } from '@iwsdk/core';

export const Phase = {
  Shop: 'shop',
  Bought: 'bought',
  Opened: 'opened',
  Closed: 'closed',
  Smoke: 'smoke',
  Receipt: 'receipt',
  Thrown: 'thrown',
  End: 'end',
} as const;
export type Phase = (typeof Phase)[keyof typeof Phase];

export const Organ = {
  None: 'none',
  Brain: 'brain',
  Heart: 'heart',
  Lungs: 'lungs',
  Blood: 'blood',
} as const;
export type Organ = (typeof Organ)[keyof typeof Organ];

export const Mood = {
  Calm: 'calm',
  Warm: 'warm',
  Concerned: 'concerned',
  Bright: 'bright',
} as const;
export type Mood = (typeof Mood)[keyof typeof Mood];

export const Session = createComponent('Session', {
  phase: { type: Types.Enum, default: Phase.Shop, enum: Phase },
  bought: { type: Types.Boolean, default: false },
  opened: { type: Types.Boolean, default: false },
  puffs: { type: Types.Int32, default: 0 },
  streak: { type: Types.Int32, default: 0 },
  wins: { type: Types.Int32, default: 0 },
  craving: { type: Types.Int32, default: 5 },
  lastFact: { type: Types.Int32, default: -1 },
});

export const Cigarette = createComponent('Cigarette', {
  puffs: { type: Types.Int32, default: 0 },
  burn: { type: Types.Float32, default: 0 },
  lit: { type: Types.Boolean, default: false },
  crushed: { type: Types.Boolean, default: false },
});

export const Hologram = createComponent('Hologram', {
  active: { type: Types.Boolean, default: false },
  organ: { type: Types.Enum, default: Organ.None, enum: Organ },
  intensity: { type: Types.Float32, default: 0 },
});

export const EmberState = createComponent('EmberState', {
  mood: { type: Types.Enum, default: Mood.Calm, enum: Mood },
  pulse: { type: Types.Float32, default: 0 },
});

export default defineComponents([Session, Cigarette, Hologram, EmberState]);
