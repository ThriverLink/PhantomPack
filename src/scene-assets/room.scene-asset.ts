/**
 * The quiet room: a dark, warm study with a window, a rug, a sideboard and a
 * plant. Built from primitives so the scene needs no downloaded assets.
 */

import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  PlaneGeometry,
  PointLight,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from '@iwsdk/core';
import {
  ash,
  brass,
  ceramic,
  darkMetal,
  darkWood,
  fabric,
  leaf,
  nightSkyTexture,
  palette,
  plaster,
  pot,
  radialTexture,
  stone,
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

function createNightWindow(): Group {
  const window = new Group();
  window.name = 'NightWindow';

  const sky = mesh(
    new PlaneGeometry(2.3, 1.9),
    new MeshBasicMaterial({
      map: nightSkyTexture(),
      toneMapped: false,
    }),
    'SkyCard',
  );
  sky.position.set(0.7, 1.65, -3.27);
  window.add(sky);

  const moon = mesh(
    new SphereGeometry(0.105, 24, 16),
    new MeshBasicMaterial({ color: new Color('#DCE7F2'), toneMapped: false }),
    'Moon',
  );
  moon.position.set(1.18, 2.02, -3.22);
  window.add(moon);

  const moonHalo = mesh(
    new PlaneGeometry(0.5, 0.5),
    new MeshBasicMaterial({
      map: radialTexture(64, 2.2),
      color: new Color('#AFCBE8'),
      transparent: true,
      opacity: 0.42,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
    'MoonHalo',
  );
  moonHalo.position.set(1.18, 2.02, -3.21);
  window.add(moonHalo);

  const skylineMaterial = new MeshStandardMaterial({
    color: new Color('#070C10'),
    roughness: 1,
  });
  const windowLight = new MeshBasicMaterial({
    color: new Color('#FFC478'),
    toneMapped: false,
  });
  const skyline = new Group();
  skyline.name = 'Skyline';
  const buildings = [
    { x: 0.05, y: 1.02, w: 0.28, h: 0.22, d: 0.1 },
    { x: 0.38, y: 1.0, w: 0.18, h: 0.12, d: 0.1 },
    { x: 0.62, y: 1.04, w: 0.22, h: 0.26, d: 0.1 },
    { x: 0.9, y: 1.0, w: 0.16, h: 0.16, d: 0.1 },
    { x: 1.12, y: 1.03, w: 0.3, h: 0.2, d: 0.1 },
  ];
  for (const [index, building] of buildings.entries()) {
    const block = mesh(
      new BoxGeometry(building.w, building.h, building.d),
      skylineMaterial,
      `Building${index + 1}`,
    );
    block.position.set(building.x, building.y, -3.23);
    skyline.add(block);
    for (let light = 0; light < 3; light += 1) {
      const windowMesh = mesh(
        new BoxGeometry(0.012, 0.018, 0.004),
        windowLight,
        `WindowLight${index + 1}-${light + 1}`,
      );
      windowMesh.position.set(
        building.x - building.w * 0.28 + light * 0.032,
        building.y - building.h * 0.18 + (light % 2) * 0.04,
        -3.174,
      );
      skyline.add(windowMesh);
    }
  }
  window.add(skyline);

  const frameMaterial = darkWood;
  const frame = new Group();
  frame.name = 'WindowFrame';
  const left = mesh(new BoxGeometry(0.06, 1.36, 0.08), frameMaterial, 'FrameLeft');
  left.position.set(-0.13, 1.65, -3.16);
  const right = mesh(new BoxGeometry(0.06, 1.36, 0.08), frameMaterial, 'FrameRight');
  right.position.set(1.53, 1.65, -3.16);
  const top = mesh(new BoxGeometry(1.72, 0.06, 0.08), frameMaterial, 'FrameTop');
  top.position.set(0.7, 2.33, -3.16);
  const sill = mesh(new BoxGeometry(1.78, 0.075, 0.18), frameMaterial, 'Sill');
  sill.position.set(0.7, 0.965, -3.1);
  const mullionV = mesh(new BoxGeometry(0.035, 1.36, 0.06), frameMaterial, 'MullionV');
  mullionV.position.set(0.7, 1.65, -3.15);
  const mullionH = mesh(new BoxGeometry(1.6, 0.035, 0.06), frameMaterial, 'MullionH');
  mullionH.position.set(0.7, 1.65, -3.15);
  frame.add(left, right, top, sill, mullionV, mullionH);
  window.add(frame);

  return window;
}

function createSideboard(): Group {
  const sideboard = new Group();
  sideboard.name = 'Sideboard';
  sideboard.position.set(2.35, 0, -3.0);

  const body = mesh(new BoxGeometry(1.1, 0.62, 0.36), darkWood, 'CabinetBody');
  body.position.y = 0.41;
  sideboard.add(body);

  const top = mesh(new BoxGeometry(1.16, 0.035, 0.42), stone, 'CabinetTop');
  top.position.y = 0.737;
  sideboard.add(top);

  for (const x of [-0.5, 0.5]) {
    for (const z of [-0.13, 0.13]) {
      const leg = mesh(
        new CylinderGeometry(0.018, 0.022, 0.1, 8),
        darkMetal,
        'CabinetLeg',
      );
      leg.position.set(x, 0.05, z);
      sideboard.add(leg);
    }
  }

  const doorMaterial = new MeshStandardMaterial({
    color: new Color('#332116'),
    roughness: 0.62,
  });
  for (const x of [-0.275, 0.275]) {
    const door = mesh(new BoxGeometry(0.52, 0.55, 0.02), doorMaterial, 'CabinetDoor');
    door.position.set(x, 0.41, 0.185);
    sideboard.add(door);
    const knob = mesh(new SphereGeometry(0.014, 12, 8), brass, 'CabinetKnob');
    knob.position.set(x + (x < 0 ? 0.18 : -0.18), 0.41, 0.202);
    sideboard.add(knob);
  }

  const vaseProfile = [
    new Vector2(0.001, 0),
    new Vector2(0.08, 0),
    new Vector2(0.11, 0.04),
    new Vector2(0.09, 0.16),
    new Vector2(0.055, 0.24),
    new Vector2(0.06, 0.27),
    new Vector2(0.001, 0.27),
  ];
  const vase = mesh(new LatheGeometry(vaseProfile, 32), ceramic, 'Vase');
  vase.position.set(-0.3, 0.755, 0);
  sideboard.add(vase);

  const stems = new Group();
  stems.name = 'VaseStems';
  const stemMaterial = new MeshStandardMaterial({
    color: new Color('#4B6B45'),
    roughness: 0.9,
  });
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const stem = mesh(
      new CylinderGeometry(0.003, 0.004, 0.24, 5),
      stemMaterial,
      'Stem',
    );
    stem.position.set(
      -0.3 + Math.cos(angle) * 0.025,
      1.12,
      Math.sin(angle) * 0.025,
    );
    stem.rotation.z = Math.cos(angle) * 0.24;
    stem.rotation.x = Math.sin(angle) * 0.24;
    stems.add(stem);
    const bloom = mesh(new SphereGeometry(0.03, 10, 8), brass, 'DriedBloom');
    bloom.scale.set(1, 0.7, 1);
    bloom.position.set(
      -0.3 + Math.cos(angle) * 0.085,
      1.25 + (index % 2) * 0.025,
      Math.sin(angle) * 0.085,
    );
    stems.add(bloom);
  }
  sideboard.add(stems);

  const candleJar = mesh(
    new CylinderGeometry(0.055, 0.05, 0.09, 20),
    new MeshStandardMaterial({
      color: new Color('#4B2A1C'),
      roughness: 0.45,
    }),
    'CandleJar',
  );
  candleJar.position.set(0.32, 0.8, 0.02);
  sideboard.add(candleJar);

  const flame = mesh(
    new SphereGeometry(0.012, 10, 8),
    new MeshBasicMaterial({ color: new Color('#FFD9A0'), toneMapped: false }),
    'CandleFlame',
  );
  flame.scale.set(0.7, 1.6, 0.7);
  flame.position.set(0.32, 0.865, 0.02);
  sideboard.add(flame);

  const candleLight = new PointLight(new Color('#FF9E5A'), 0.55, 1.6, 2);
  candleLight.name = 'CandleLight';
  candleLight.position.set(0.32, 0.9, 0.06);
  sideboard.add(candleLight);

  const books = new Group();
  books.name = 'Books';
  const bookColors = ['#29383E', '#4A2C22', '#3A3B2C'];
  for (let index = 0; index < 3; index += 1) {
    const book = mesh(
      new BoxGeometry(0.18, 0.024, 0.13),
      new MeshStandardMaterial({
        color: new Color(bookColors[index]),
        roughness: 0.85,
      }),
      `Book${index + 1}`,
    );
    book.position.set(0.03, 0.77 + index * 0.026, -0.02);
    book.rotation.y = index * 0.12;
    books.add(book);
  }
  sideboard.add(books);

  return sideboard;
}

function createPlant(): Group {
  const plant = new Group();
  plant.name = 'Plant';
  plant.position.set(-2.35, 0, -2.45);

  const planter = mesh(
    new LatheGeometry(
      [
        new Vector2(0.001, 0),
        new Vector2(0.15, 0),
        new Vector2(0.19, 0.06),
        new Vector2(0.2, 0.3),
        new Vector2(0.215, 0.32),
        new Vector2(0.19, 0.33),
        new Vector2(0.001, 0.33),
      ],
      32,
    ),
    pot,
    'Planter',
  );
  plant.add(planter);

  const soil = mesh(new CylinderGeometry(0.18, 0.18, 0.02, 24), ash, 'Soil');
  soil.position.y = 0.325;
  plant.add(soil);

  let seed = 1234567;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const stems = new Group();
  stems.name = 'Stems';
  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2 + random() * 0.3;
    const height = 0.45 + random() * 0.55;
    const lean = 0.08 + random() * 0.16;
    const stem = mesh(
      new CylinderGeometry(0.004, 0.007, height, 5),
      leaf,
      `Stem${index + 1}`,
    );
    stem.position.set(
      Math.cos(angle) * lean * 0.5,
      0.33 + height / 2,
      Math.sin(angle) * lean * 0.5,
    );
    stem.rotation.z = -Math.cos(angle) * lean * 0.7;
    stem.rotation.x = Math.sin(angle) * lean * 0.7;
    stems.add(stem);

    const leafCount = 2 + (index % 2);
    for (let leafIndex = 0; leafIndex < leafCount; leafIndex += 1) {
      const blade = mesh(new SphereGeometry(0.09, 10, 6), leaf, 'Leaf');
      blade.scale.set(0.42, 1.35, 0.11);
      blade.position.set(
        Math.cos(angle) * (lean + 0.06 + leafIndex * 0.03),
        0.56 + height * 0.55 + leafIndex * 0.12,
        Math.sin(angle) * (lean + 0.06 + leafIndex * 0.03),
      );
      blade.rotation.z = -Math.cos(angle) * (0.55 + leafIndex * 0.15);
      blade.rotation.x = Math.sin(angle) * (0.55 + leafIndex * 0.15);
      stems.add(blade);
    }
  }
  plant.add(stems);

  return plant;
}

export function createRoom(): Group {
  const room = new Group();
  room.name = 'QuietRoom';

  const floor = mesh(new BoxGeometry(6.4, 0.08, 6.4), darkWood, 'Floor');
  floor.position.y = -0.04;
  room.add(floor);

  const rug = mesh(new CylinderGeometry(1.3, 1.3, 0.014, 64), fabric, 'Rug');
  rug.position.set(0, 0.007, -0.72);
  room.add(rug);

  const rugBorder = mesh(
    new TorusGeometry(1.18, 0.008, 6, 64),
    brass,
    'RugBorder',
  );
  rugBorder.rotation.x = Math.PI / 2;
  rugBorder.position.set(0, 0.016, -0.72);
  room.add(rugBorder);

  const backWallShape = new Shape();
  backWallShape.moveTo(-3.2, 0);
  backWallShape.lineTo(3.2, 0);
  backWallShape.lineTo(3.2, 3.0);
  backWallShape.lineTo(-3.2, 3.0);
  backWallShape.lineTo(-3.2, 0);
  const windowHole = new Path();
  windowHole.moveTo(-0.1, 1.0);
  windowHole.lineTo(-0.1, 2.3);
  windowHole.lineTo(1.5, 2.3);
  windowHole.lineTo(1.5, 1.0);
  windowHole.lineTo(-0.1, 1.0);
  backWallShape.holes.push(windowHole);

  const backWall = mesh(
    new ExtrudeGeometry(backWallShape, {
      depth: 0.08,
      bevelEnabled: false,
      curveSegments: 1,
    }),
    plaster,
    'BackWall',
  );
  backWall.position.z = -3.28;
  room.add(backWall);

  const leftWall = mesh(new BoxGeometry(0.08, 3.0, 6.4), plaster, 'LeftWall');
  leftWall.position.set(-3.2, 1.5, 0);
  room.add(leftWall);

  const rightWall = mesh(new BoxGeometry(0.08, 3.0, 6.4), plaster, 'RightWall');
  rightWall.position.set(3.2, 1.5, 0);
  room.add(rightWall);

  const ceiling = mesh(new BoxGeometry(6.4, 0.08, 6.4), plaster, 'Ceiling');
  ceiling.position.y = 3.0;
  room.add(ceiling);

  const baseboardBack = mesh(
    new BoxGeometry(6.4, 0.11, 0.04),
    darkWood,
    'BaseboardBack',
  );
  baseboardBack.position.set(0, 0.055, -3.16);
  room.add(baseboardBack);

  for (const side of [-1, 1]) {
    const baseboard = mesh(
      new BoxGeometry(0.04, 0.11, 6.4),
      darkWood,
      side < 0 ? 'BaseboardLeft' : 'BaseboardRight',
    );
    baseboard.position.set(side * 3.16, 0.055, 0);
    room.add(baseboard);
  }

  room.add(createNightWindow());
  room.add(createSideboard());
  room.add(createPlant());

  return room;
}
