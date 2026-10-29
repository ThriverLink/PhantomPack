/**
 * The table and the objects on it: pack, cigarette, ashtray, lighter and the
 * pendant lamp. The cigarette's parts are named so the runtime can burn it
 * down and read the filter tip position.
 */

import {
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from '@iwsdk/core';
import { bevelBox } from './lib/hardsurface.js';
import {
  ash,
  brass,
  ceramic,
  cork,
  darkMetal,
  darkWood,
  emberCore,
  paper,
  palette,
  stone,
  textTexture,
  walnut,
} from './materials.js';

function mesh(
  geometry: ConstructorParameters<typeof Mesh>[0],
  material: ConstructorParameters<typeof Mesh>[1],
  name: string,
): Mesh {
  const result = new Mesh(geometry, material);
  result.name = name;
  return result;
}

export function createTable(): Group {
  const table = new Group();
  table.name = 'Table';

  const base = mesh(
    new CylinderGeometry(0.27, 0.3, 0.035, 48),
    darkMetal,
    'Base',
  );
  base.position.y = 0.0175;
  table.add(base);

  const baseRing = mesh(
    new TorusGeometry(0.285, 0.004, 8, 64),
    brass,
    'BaseRing',
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.036;
  table.add(baseRing);

  const column = mesh(
    new LatheGeometry(
      [
        new Vector2(0.001, 0),
        new Vector2(0.16, 0),
        new Vector2(0.12, 0.03),
        new Vector2(0.07, 0.12),
        new Vector2(0.055, 0.34),
        new Vector2(0.052, 0.52),
        new Vector2(0.065, 0.61),
        new Vector2(0.1, 0.665),
        new Vector2(0.13, 0.69),
        new Vector2(0.001, 0.69),
      ],
      40,
    ),
    walnut,
    'Pedestal',
  );
  column.position.y = 0.035;
  table.add(column);

  const top = mesh(
    new LatheGeometry(
      [
        new Vector2(0.001, 0),
        new Vector2(0.49, 0),
        new Vector2(0.515, 0.004),
        new Vector2(0.52, 0.012),
        new Vector2(0.52, 0.034),
        new Vector2(0.51, 0.04),
        new Vector2(0.001, 0.04),
      ],
      72,
    ),
    walnut,
    'Tabletop',
  );
  top.position.y = 0.7;
  table.add(top);

  const edge = mesh(
    new TorusGeometry(0.515, 0.003, 8, 72),
    brass,
    'TableEdge',
  );
  edge.rotation.x = Math.PI / 2;
  edge.position.y = 0.741;
  table.add(edge);

  const inlay = mesh(
    new TorusGeometry(0.34, 0.0018, 6, 64),
    brass,
    'TableInlay',
  );
  inlay.rotation.x = Math.PI / 2;
  inlay.position.y = 0.7405;
  table.add(inlay);

  return table;
}

export function createCigarettePack(): Group {
  const pack = new Group();
  pack.name = 'Pack';

  const bodyMaterial = new MeshStandardMaterial({
    color: new Color('#161D21'),
    metalness: 0.16,
    roughness: 0.3,
    envMapIntensity: 1.5,
  });
  const body = mesh(
    bevelBox(0.09, 0.06, 0.022, 0.002, 0.0015, 2),
    bodyMaterial,
    'PackBody',
  );
  body.position.y = 0.03;
  pack.add(body);

  const band = mesh(
    new BoxGeometry(0.092, 0.007, 0.024),
    new MeshStandardMaterial({
      color: new Color('#3A2417'),
      metalness: 0.55,
      roughness: 0.35,
    }),
    'PackBand',
  );
  band.position.y = 0.012;
  pack.add(band);

  const lidPivot = new Group();
  lidPivot.name = 'LidPivot';
  lidPivot.position.set(0, 0.061, -0.011);
  const lid = mesh(
    bevelBox(0.09, 0.009, 0.022, 0.0015, 0.001, 2),
    bodyMaterial,
    'PackLid',
  );
  lid.position.set(0, 0.003, 0.011);
  lidPivot.add(lid);
  pack.add(lidPivot);

  const hinge = mesh(
    new CylinderGeometry(0.0018, 0.0018, 0.086, 8),
    brass,
    'PackHinge',
  );
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 0.061, -0.011);
  pack.add(hinge);

  const tray = mesh(
    new BoxGeometry(0.08, 0.006, 0.018),
    new MeshStandardMaterial({
      color: new Color('#0B1012'),
      roughness: 0.75,
    }),
    'PackTray',
  );
  tray.position.set(0, 0.061, 0);
  pack.add(tray);

  const foil = mesh(
    new TorusGeometry(0.032, 0.0025, 6, 32),
    new MeshStandardMaterial({
      color: new Color('#B9C4C6'),
      metalness: 0.9,
      roughness: 0.28,
    }),
    'PackFoil',
  );
  foil.rotation.x = Math.PI / 2;
  foil.scale.z = 0.35;
  foil.position.set(0, 0.064, 0);
  pack.add(foil);

  const label = mesh(
    new BoxGeometry(0.06, 0.0105, 0.0008),
    new MeshBasicMaterial({
      map: textTexture('PHANTOM', 4),
      color: new Color(palette.amber),
      transparent: true,
      toneMapped: false,
    }),
    'PackLabel',
  );
  label.position.set(0, 0.039, 0.0115);
  pack.add(label);

  const count = mesh(
    new BoxGeometry(0.014, 0.006, 0.0008),
    new MeshBasicMaterial({
      map: textTexture('20', 3),
      color: new Color('#D9D2C2'),
      transparent: true,
      toneMapped: false,
    }),
    'PackCount',
  );
  count.position.set(0, 0.024, 0.0115);
  pack.add(count);

  const accent = mesh(
    new BoxGeometry(0.07, 0.0016, 0.0008),
    new MeshBasicMaterial({
      color: new Color(palette.amber),
      toneMapped: false,
    }),
    'PackAccent',
  );
  accent.position.set(0, 0.052, 0.0115);
  pack.add(accent);

  return pack;
}

export function createCigarette(): Group {
  const cigarette = new Group();
  cigarette.name = 'Cigarette';

  const paperMesh = mesh(
    new CylinderGeometry(0.0045, 0.0045, 0.075, 16),
    paper,
    'Paper',
  );
  paperMesh.rotation.x = Math.PI / 2;
  paperMesh.position.z = -0.0125;
  cigarette.add(paperMesh);

  const filter = mesh(
    new CylinderGeometry(0.0048, 0.0048, 0.03, 16),
    cork,
    'Filter',
  );
  filter.rotation.x = Math.PI / 2;
  filter.position.z = 0.04;
  cigarette.add(filter);

  const band = mesh(
    new CylinderGeometry(0.0049, 0.0049, 0.003, 16),
    brass,
    'FilterBand',
  );
  band.rotation.x = Math.PI / 2;
  band.position.z = 0.025;
  cigarette.add(band);

  const emberMaterial = new MeshStandardMaterial({
    color: new Color('#2A0E07'),
    emissive: new Color('#FF6B2A'),
    emissiveIntensity: 0.35,
    roughness: 0.6,
  });
  const ember = mesh(new SphereGeometry(0.0047, 12, 8), emberMaterial, 'Ember');
  ember.scale.set(1, 1, 0.7);
  ember.position.z = -0.052;
  cigarette.add(ember);

  const ashTip = mesh(
    new CylinderGeometry(0.0043, 0.0043, 0.005, 12),
    ash,
    'Ash',
  );
  ashTip.rotation.x = Math.PI / 2;
  ashTip.position.z = -0.048;
  ashTip.visible = false;
  cigarette.add(ashTip);

  const filterAnchor = new Group();
  filterAnchor.name = 'FilterAnchor';
  filterAnchor.position.z = 0.056;
  cigarette.add(filterAnchor);

  const smokeAnchor = new Group();
  smokeAnchor.name = 'SmokeAnchor';
  smokeAnchor.position.z = -0.056;
  cigarette.add(smokeAnchor);

  return cigarette;
}

export function createAshtray(): Group {
  const ashtray = new Group();
  ashtray.name = 'Ashtray';

  const base = mesh(
    new CylinderGeometry(0.075, 0.078, 0.018, 40),
    ceramic,
    'TrayBase',
  );
  base.position.y = 0.009;
  ashtray.add(base);

  const bowl = mesh(
    new CylinderGeometry(0.062, 0.062, 0.007, 40),
    ash,
    'TrayBowl',
  );
  bowl.position.y = 0.014;
  ashtray.add(bowl);

  const rim = mesh(
    new TorusGeometry(0.071, 0.008, 8, 48),
    ceramic,
    'TrayRim',
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  ashtray.add(rim);

  const stub = new Group();
  stub.name = 'Stub1';
  const stubPaper = mesh(
    new CylinderGeometry(0.0042, 0.0042, 0.045, 12),
    paper,
    'StubPaper',
  );
  stubPaper.rotation.x = Math.PI / 2;
  stubPaper.position.z = -0.005;
  stub.add(stubPaper);
  const stubFilter = mesh(
    new CylinderGeometry(0.0045, 0.0045, 0.018, 12),
    cork,
    'StubFilter',
  );
  stubFilter.rotation.x = Math.PI / 2;
  stubFilter.position.z = 0.026;
  stub.add(stubFilter);
  const stubAsh = mesh(
    new SphereGeometry(0.0045, 8, 6),
    ash,
    'StubAsh',
  );
  stubAsh.scale.set(1, 1, 0.6);
  stubAsh.position.z = -0.028;
  stub.add(stubAsh);
  stub.position.set(-0.012, 0.026, 0);
  stub.rotation.y = 0.5;
  ashtray.add(stub);

  const stub2 = stub.clone(true);
  stub2.name = 'Stub2';
  stub2.position.set(0.018, 0.027, 0.006);
  stub2.rotation.set(0.1, -0.9, 0.12);
  ashtray.add(stub2);

  const pile = mesh(new SphereGeometry(0.022, 12, 8), ash, 'AshPile');
  pile.scale.set(1.4, 0.22, 1);
  pile.position.y = 0.018;
  ashtray.add(pile);

  return ashtray;
}

export function createLighter(): Group {
  const lighter = new Group();
  lighter.name = 'Lighter';

  const body = mesh(
    bevelBox(0.032, 0.052, 0.013, 0.0015, 0.001, 2),
    darkMetal,
    'LighterBody',
  );
  body.position.y = 0.026;
  lighter.add(body);

  const cap = mesh(
    new BoxGeometry(0.032, 0.009, 0.013),
    brass,
    'LighterCap',
  );
  cap.position.y = 0.0565;
  lighter.add(cap);

  const wheel = mesh(
    new CylinderGeometry(0.0055, 0.0055, 0.009, 12),
    brass,
    'LighterWheel',
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0.009, 0.061, 0);
  lighter.add(wheel);

  const flame = mesh(
    new SphereGeometry(0.006, 10, 8),
    new MeshBasicMaterial({
      color: new Color('#FFD08A'),
      transparent: true,
      opacity: 0.9,
      toneMapped: false,
    }),
    'LighterFlame',
  );
  flame.scale.set(0.65, 1.8, 0.65);
  flame.position.set(0, 0.074, 0);
  flame.visible = false;
  lighter.add(flame);

  const band = mesh(
    new BoxGeometry(0.034, 0.004, 0.015),
    new MeshStandardMaterial({
      color: new Color('#3A2417'),
      roughness: 0.5,
    }),
    'LighterBand',
  );
  band.position.y = 0.012;
  lighter.add(band);

  return lighter;
}

export function createLamp(): Group {
  const lamp = new Group();
  lamp.name = 'PendantLamp';

  const canopy = mesh(
    new CylinderGeometry(0.06, 0.06, 0.018, 24),
    brass,
    'LampCanopy',
  );
  canopy.position.y = -0.009;
  lamp.add(canopy);

  const cable = mesh(
    new CylinderGeometry(0.0035, 0.0035, 0.82, 8),
    darkMetal,
    'LampCable',
  );
  cable.position.y = -0.43;
  lamp.add(cable);

  const shadeMaterial = new MeshStandardMaterial({
    color: new Color('#1A2226'),
    metalness: 0.55,
    roughness: 0.42,
    side: DoubleSide,
  });
  const shade = mesh(
    new LatheGeometry(
      [
        new Vector2(0.19, 0),
        new Vector2(0.215, 0.015),
        new Vector2(0.22, 0.08),
        new Vector2(0.2, 0.14),
        new Vector2(0.13, 0.175),
        new Vector2(0.055, 0.19),
        new Vector2(0.001, 0.192),
      ],
      48,
    ),
    shadeMaterial,
    'LampShade',
  );
  shade.position.y = -0.95;
  lamp.add(shade);

  const glow = mesh(
    new CircleGeometry(0.17, 32),
    new MeshBasicMaterial({
      color: new Color('#FFC98A'),
      transparent: true,
      opacity: 0.75,
      side: DoubleSide,
      toneMapped: false,
    }),
    'LampGlow',
  );
  glow.rotation.x = Math.PI / 2;
  glow.position.y = -0.945;
  lamp.add(glow);

  const bulb = mesh(
    new SphereGeometry(0.028, 16, 12),
    new MeshBasicMaterial({ color: new Color('#FFE2B8'), toneMapped: false }),
    'LampBulb',
  );
  bulb.position.y = -0.94;
  lamp.add(bulb);

  const light = new PointLight(new Color('#FFB25C'), 3.2, 3.4, 2);
  light.name = 'LampLight';
  light.position.y = -0.98;
  lamp.add(light);

  return lamp;
}
