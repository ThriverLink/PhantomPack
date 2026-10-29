/**
 * Ember, the small companion that guides the session. A warm core, a soft
 * halo and two slow rings; the runtime moves and recolors it to match the
 * emotional beat.
 */

import {
  AdditiveBlending,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
} from '@iwsdk/core';
import {
  emberCore,
  emberHalo,
  emberLightColor,
  emberRing,
  radialTexture,
} from './materials.js';

export function createEmber(): Group {
  const ember = new Group();
  ember.name = 'Ember';

  const core = new Mesh(new SphereGeometry(0.026, 20, 16), emberCore);
  core.name = 'EmberCore';
  ember.add(core);

  const inner = new Mesh(
    new SphereGeometry(0.012, 14, 10),
    new MeshBasicMaterial({
      color: new Color('#FFF4D8'),
      toneMapped: false,
    }),
  );
  inner.name = 'EmberInner';
  ember.add(inner);

  const halo = new Sprite(
    new SpriteMaterial({
      map: radialTexture(64, 2.0),
      color: new Color('#FF9B4A'),
      transparent: true,
      opacity: 0.55,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  halo.name = 'EmberHalo';
  halo.scale.set(0.24, 0.24, 1);
  ember.add(halo);

  const ringA = new Mesh(new TorusGeometry(0.046, 0.0016, 6, 48), emberRing);
  ringA.name = 'RingA';
  ringA.rotation.set(1.1, 0.2, 0.3);
  ember.add(ringA);

  const ringB = new Mesh(new TorusGeometry(0.062, 0.0012, 6, 48), emberRing);
  ringB.name = 'RingB';
  ringB.rotation.set(0.4, 1.2, -0.4);
  ember.add(ringB);

  for (let index = 0; index < 3; index += 1) {
    const spark = new Mesh(new SphereGeometry(0.004, 8, 6), emberCore);
    spark.name = `Spark${index + 1}`;
    ember.add(spark);
  }

  const light = new PointLight(emberLightColor, 0.65, 1.5, 2);
  light.name = 'EmberLight';
  ember.add(light);

  return ember;
}

export function createFxRoot(): Group {
  const root = new Group();
  root.name = 'FxRoot';
  root.userData.iwsdkPreviewBounds = 'exclude';
  return root;
}
