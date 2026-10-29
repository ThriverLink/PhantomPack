/**
 * The shop props: a wallet for the spend tab, and the bin the pack can be
 * thrown into. Both are procedural and deterministic so the editor and the
 * runtime build identical prototypes.
 */

import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from '@iwsdk/core';
import { bevelBox, makeRandom } from './lib/hardsurface.js';
import { ash, brass, darkMetal, palette, paper } from './materials.js';

function mesh(
  geometry: ConstructorParameters<typeof Mesh>[0],
  material: ConstructorParameters<typeof Mesh>[1],
  name: string,
): Mesh {
  const result = new Mesh(geometry, material);
  result.name = name;
  return result;
}

const leather = new MeshStandardMaterial({
  color: new Color('#3A2118'),
  roughness: 0.52,
  metalness: 0.05,
});

const leatherEdge = new MeshStandardMaterial({
  color: new Color('#1D0F0B'),
  roughness: 0.62,
});

const note = new MeshStandardMaterial({
  color: new Color('#B8C7B2'),
  roughness: 0.78,
});

const noteInk = new MeshStandardMaterial({
  color: new Color('#5B7560'),
  roughness: 0.8,
});

export function createWallet(): Group {
  const wallet = new Group();
  wallet.name = 'Wallet';

  const body = mesh(
    bevelBox(0.115, 0.014, 0.085, 0.003, 0.004, 3),
    leather,
    'WalletBody',
  );
  body.position.y = 0.007;
  wallet.add(body);

  const fold = mesh(
    new BoxGeometry(0.112, 0.0016, 0.006),
    leatherEdge,
    'WalletFold',
  );
  fold.position.set(0, 0.0145, 0.012);
  wallet.add(fold);

  const flap = mesh(
    bevelBox(0.05, 0.003, 0.07, 0.0015, 0.002, 2),
    leather,
    'WalletFlap',
  );
  flap.position.set(0.032, 0.015, 0);
  wallet.add(flap);

  const random = makeRandom(1977);
  for (let index = 0; index < 4; index += 1) {
    const bill = mesh(
      new BoxGeometry(0.1, 0.0014, 0.052),
      note,
      `FakeBill${index + 1}`,
    );
    bill.position.set(
      -0.006 + (random() - 0.5) * 0.006,
      0.016 + index * 0.0018,
      (random() - 0.5) * 0.012,
    );
    bill.rotation.y = (random() - 0.5) * 0.16;
    wallet.add(bill);

    const stripe = mesh(
      new BoxGeometry(0.008, 0.0016, 0.04),
      noteInk,
      `FakeBillStripe${index + 1}`,
    );
    stripe.position.set(0.038, 0.0168 + index * 0.0018, 0);
    stripe.rotation.y = bill.rotation.y;
    wallet.add(stripe);
  }

  const card = mesh(
    new BoxGeometry(0.06, 0.0012, 0.036),
    new MeshStandardMaterial({
      color: new Color('#1B3A40'),
      roughness: 0.34,
      metalness: 0.3,
    }),
    'WalletCard',
  );
  card.position.set(-0.012, 0.024, 0.002);
  card.rotation.y = -0.12;
  wallet.add(card);

  const clasp = mesh(
    new TorusGeometry(0.006, 0.0015, 6, 16),
    brass,
    'WalletClasp',
  );
  clasp.rotation.x = Math.PI / 2;
  clasp.position.set(0.056, 0.016, 0);
  wallet.add(clasp);

  return wallet;
}

export function createBin(): Group {
  const bin = new Group();
  bin.name = 'Bin';

  const shellMaterial = new MeshStandardMaterial({
    color: new Color('#222B30'),
    metalness: 0.55,
    roughness: 0.38,
    side: DoubleSide,
  });

  const shell = mesh(
    new CylinderGeometry(0.135, 0.105, 0.36, 36, 1, true),
    shellMaterial,
    'BinShell',
  );
  shell.position.y = 0.18;
  bin.add(shell);

  const bottom = mesh(
    new CylinderGeometry(0.105, 0.105, 0.008, 36),
    darkMetal,
    'BinBottom',
  );
  bottom.position.y = 0.006;
  bin.add(bottom);

  const rim = mesh(
    new TorusGeometry(0.134, 0.005, 8, 48),
    brass,
    'BinRim',
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.359;
  bin.add(rim);

  const random = makeRandom(8842);
  for (let index = 0; index < 5; index += 1) {
    const ball = mesh(
      new SphereGeometry(0.018 + random() * 0.008, 10, 8),
      index % 2 === 0 ? paper : ash,
      `BinPaper${index + 1}`,
    );
    ball.scale.set(1, 0.82, 1);
    ball.position.set(
      (random() - 0.5) * 0.14,
      0.08 + random() * 0.16,
      (random() - 0.5) * 0.14,
    );
    ball.rotation.set(random() * 3, random() * 3, random() * 3);
    bin.add(ball);
  }

  const label = mesh(
    new BoxGeometry(0.05, 0.003, 0.001),
    new MeshStandardMaterial({
      color: new Color(palette.amber),
      roughness: 0.4,
      metalness: 0.2,
    }),
    'BinAccent',
  );
  label.position.set(0, 0.27, 0.128);
  label.rotation.x = -0.1;
  bin.add(label);

  return bin;
}
