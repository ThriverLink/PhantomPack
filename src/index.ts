/**
 * PHANTOM entry point. IWSDK owns the renderer, XR session and ECS world; the
 * session director is the only application system this experience needs.
 */

import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { PhantomSystem } from './phantom.js';

World.create(
  document.getElementById('scene-container') as HTMLDivElement,
  projectOptions,
).then((world) => {
  world.registerSystem(PhantomSystem);
});
