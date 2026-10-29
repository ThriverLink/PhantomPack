/**
 * A translucent body scan. The shell is a calm cyan wireframe; the brain,
 * heart, lungs and bloodstream are separately named so the experience can
 * light up one system at a time while a fact is on screen.
 */

import {
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from '@iwsdk/core';
import {
  hologramRing,
  hologramShell,
  hologramWire,
  palette,
} from './materials.js';

function shellMesh(
  geometry: ConstructorParameters<typeof Mesh>[0],
  name: string,
): Group {
  const group = new Group();
  group.name = name;
  const solid = new Mesh(geometry, hologramShell);
  solid.name = `${name}Shell`;
  const wire = new Mesh(geometry, hologramWire);
  wire.name = `${name}Wire`;
  group.add(solid, wire);
  return group;
}

function organMaterial(color: string, intensity: number): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color(color).multiplyScalar(0.18),
    emissive: new Color(color),
    emissiveIntensity: intensity,
    transparent: true,
    opacity: 0.82,
    roughness: 0.45,
    metalness: 0.05,
    depthWrite: false,
  });
}

function tube(
  points: Vector3[],
  radius: number,
  material: ConstructorParameters<typeof Mesh>[1],
  name: string,
): Mesh {
  const curve = new CatmullRomCurve3(points);
  const result = new Mesh(
    new TubeGeometry(curve, 24, radius, 6, false),
    material,
    );
  result.name = name;
  return result;
}

export function createBodyHologram(): Group {
  const body = new Group();
  body.name = 'BodyHologram';

  const shell = new Group();
  shell.name = 'Shell';

  const head = shellMesh(new SphereGeometry(0.112, 24, 18), 'Head');
  head.scale.set(0.9, 1.12, 0.95);
  head.position.y = 1.62;
  shell.add(head);

  const neck = shellMesh(
    new CylinderGeometry(0.043, 0.055, 0.1, 16),
    'Neck',
  );
  neck.position.y = 1.49;
  shell.add(neck);

  const torso = shellMesh(new CapsuleGeometry(0.145, 0.32, 6, 16), 'Torso');
  torso.scale.set(1, 1, 0.62);
  torso.position.y = 1.18;
  shell.add(torso);

  const hips = shellMesh(new SphereGeometry(0.14, 20, 14), 'Hips');
  hips.scale.set(1.05, 0.72, 0.7);
  hips.position.y = 0.92;
  shell.add(hips);

  for (const side of [-1, 1]) {
    const upperArm = shellMesh(
      new CapsuleGeometry(0.032, 0.19, 4, 10),
      side < 0 ? 'UpperArmLeft' : 'UpperArmRight',
    );
    upperArm.position.set(side * 0.205, 1.27, 0);
    upperArm.rotation.z = side * 0.16;
    shell.add(upperArm);

    const forearm = shellMesh(
      new CapsuleGeometry(0.028, 0.18, 4, 10),
      side < 0 ? 'ForearmLeft' : 'ForearmRight',
    );
    forearm.position.set(side * 0.25, 1.03, 0.015);
    forearm.rotation.z = side * 0.08;
    shell.add(forearm);

    const hand = shellMesh(new SphereGeometry(0.038, 12, 10), side < 0 ? 'HandLeft' : 'HandRight');
    hand.scale.set(0.8, 1.1, 0.55);
    hand.position.set(side * 0.265, 0.89, 0.02);
    shell.add(hand);

    const thigh = shellMesh(
      new CapsuleGeometry(0.055, 0.26, 4, 10),
      side < 0 ? 'ThighLeft' : 'ThighRight',
    );
    thigh.position.set(side * 0.085, 0.64, 0);
    shell.add(thigh);

    const shin = shellMesh(
      new CapsuleGeometry(0.043, 0.27, 4, 10),
      side < 0 ? 'ShinLeft' : 'ShinRight',
    );
    shin.position.set(side * 0.09, 0.3, 0.005);
    shell.add(shin);

    const foot = shellMesh(new CapsuleGeometry(0.04, 0.1, 4, 8), side < 0 ? 'FootLeft' : 'FootRight');
    foot.rotation.x = Math.PI / 2;
    foot.position.set(side * 0.09, 0.06, 0.05);
    shell.add(foot);
  }

  body.add(shell);

  const brainMaterial = organMaterial(palette.violet, 1.15);
  const brain = new Mesh(new SphereGeometry(0.072, 20, 14), brainMaterial);
  brain.name = 'Brain';
  brain.scale.set(1, 0.86, 1.02);
  brain.position.set(0, 1.65, 0.012);
  body.add(brain);

  const heartMaterial = organMaterial(palette.coral, 1.25);
  const heart = new Mesh(new SphereGeometry(0.052, 18, 14), heartMaterial);
  heart.name = 'Heart';
  heart.scale.set(0.82, 1, 0.72);
  heart.position.set(0.035, 1.19, 0.045);
  body.add(heart);

  const lungMaterial = organMaterial('#FF8A74', 0.85);
  for (const side of [-1, 1]) {
    const lung = new Mesh(new SphereGeometry(0.075, 18, 14), lungMaterial);
    lung.name = side < 0 ? 'LungLeft' : 'LungRight';
    lung.scale.set(0.56, 1.05, 0.5);
    lung.position.set(side * 0.075, 1.19, 0.005);
    body.add(lung);
  }

  const airwayMaterial = organMaterial('#FFB7A6', 0.6);
  const trachea = new Mesh(
    new CylinderGeometry(0.012, 0.014, 0.15, 10),
    airwayMaterial,
  );
  trachea.name = 'Trachea';
  trachea.position.set(0, 1.34, 0.02);
  body.add(trachea);

  for (const side of [-1, 1]) {
    const bronchus = tube(
      [
        new Vector3(0, 1.28, 0.02),
        new Vector3(side * 0.03, 1.24, 0.015),
        new Vector3(side * 0.065, 1.2, 0.01),
      ],
      0.006,
      airwayMaterial,
      side < 0 ? 'BronchusLeft' : 'BronchusRight',
    );
    body.add(bronchus);
  }

  const bloodMaterial = organMaterial('#FF5E4D', 0.9);
  const bloodstream = new Group();
  bloodstream.name = 'Bloodstream';
  bloodstream.add(
    tube(
      [
        new Vector3(0.035, 1.19, 0.045),
        new Vector3(0.02, 1.35, 0.04),
        new Vector3(0.0, 1.48, 0.03),
        new Vector3(0.0, 1.59, 0.02),
      ],
      0.0045,
      bloodMaterial,
      'BloodToBrain',
    ),
  );
  for (const side of [-1, 1]) {
    bloodstream.add(
      tube(
        [
          new Vector3(0.035, 1.19, 0.045),
          new Vector3(side * 0.12, 1.27, 0.03),
          new Vector3(side * 0.2, 1.24, 0.02),
          new Vector3(side * 0.255, 1.03, 0.02),
          new Vector3(side * 0.265, 0.9, 0.02),
        ],
        0.004,
        bloodMaterial,
        side < 0 ? 'BloodToArmLeft' : 'BloodToArmRight',
      ),
    );
    bloodstream.add(
      tube(
        [
          new Vector3(0.035, 1.19, 0.045),
          new Vector3(side * 0.03, 0.95, 0.03),
          new Vector3(side * 0.08, 0.65, 0.01),
          new Vector3(side * 0.09, 0.28, 0.01),
        ],
        0.004,
        bloodMaterial,
        side < 0 ? 'BloodToLegLeft' : 'BloodToLegRight',
      ),
    );
  }
  body.add(bloodstream);

  const baseRing = new Mesh(new TorusGeometry(0.33, 0.004, 6, 64), hologramRing);
  baseRing.name = 'BaseRing';
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.015;
  body.add(baseRing);

  const scanRing = new Mesh(new TorusGeometry(0.3, 0.005, 8, 64), hologramRing);
  scanRing.name = 'ScanRing';
  scanRing.rotation.x = Math.PI / 2;
  scanRing.position.y = 0.18;
  body.add(scanRing);

  return body;
}
