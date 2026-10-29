/**
 * The ThriverLink brand frame: a walnut molding with a recessed poster card
 * and a brass nameplate, hung on the quiet room's back wall. The poster shows
 * the official ThriverLink logo, registered as the `thriver-link-logo`
 * texture; the runtime assigns it to the `BrandPosterLogo` plane, so this
 * module stays deterministic and free of asset loads.
 *
 * Origin: centre of the frame's back face; front faces +Z; contact plane is
 * the wall.
 */

import {
  Color,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
} from '@iwsdk/core';
import { darkWood, palette, paper, textTexture } from './materials.js';

function mesh(
  geometry: ConstructorParameters<typeof Mesh>[0],
  material: ConstructorParameters<typeof Mesh>[1],
  name: string,
): Mesh {
  const result = new Mesh(geometry, material);
  result.name = name;
  return result;
}

const brandBrass = new MeshStandardMaterial({
  color: new Color(palette.brass),
  metalness: 0.82,
  roughness: 0.28,
  envMapIntensity: 1.6,
});

/** Neutral placeholder until the runtime assigns the logo texture. */
const posterLogoPlaceholder = new MeshBasicMaterial({
  color: new Color('#EFE7D8'),
  toneMapped: false,
});

function roundedRectPath(
  shape: Shape,
  width: number,
  height: number,
  radius: number,
): void {
  const x = width / 2;
  const y = height / 2;
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + radius);
  shape.lineTo(x, y - radius);
  shape.quadraticCurveTo(x, y, x - radius, y);
  shape.lineTo(-x + radius, y);
  shape.quadraticCurveTo(-x, y, -x, y - radius);
  shape.lineTo(-x, -y + radius);
  shape.quadraticCurveTo(-x, -y, -x + radius, -y);
}

/** Square rounded rectangle, centred on the origin, extruded along +Z. */
function roundedRect(
  width: number,
  height: number,
  radius: number,
  depth: number,
): ExtrudeGeometry {
  const shape = new Shape();
  roundedRectPath(shape, width, height, radius);
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 8,
  });
}

/** Rounded rectangle ring: outer rect minus an inset rounded-rect hole. */
function roundedRectRing(
  width: number,
  height: number,
  radius: number,
  border: number,
  depth: number,
): ExtrudeGeometry {
  const shape = new Shape();
  roundedRectPath(shape, width, height, radius);
  const hole = new Shape();
  roundedRectPath(
    hole,
    width - 2 * border,
    height - 2 * border,
    Math.max(0.002, radius - border),
  );
  shape.holes.push(hole);
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 8,
  });
}

export function createBrandFrame(): Group {
  const frame = new Group();
  frame.name = 'ThriverLinkFrame';

  // Poster card: paper face recessed 14 mm behind the molding lip.
  const card = mesh(roundedRect(0.532, 0.472, 0.05, 0.02), paper, 'PosterCard');
  frame.add(card);

  // Logo plane; the runtime fills it with the `thriver-link-logo` texture.
  // Aspect matches the supplied mark (1000x1000, square).
  const logo = mesh(
    new PlaneGeometry(0.27, 0.27),
    posterLogoPlaceholder,
    'BrandPosterLogo',
  );
  logo.position.set(0, 0.02, 0.0204);
  frame.add(logo);

  // Walnut molding wrapping the poster.
  const molding = mesh(
    roundedRectRing(0.58, 0.52, 0.07, 0.03, 0.034),
    darkWood,
    'FrameMolding',
  );
  frame.add(molding);

  // Brass nameplate on the molding's bottom bar, proud of the front face.
  const plate = mesh(
    roundedRect(0.3, 0.024, 0.008, 0.0016),
    brandBrass,
    'BrandPlate',
  );
  plate.position.set(0, -0.245, 0.0345);
  frame.add(plate);

  const plateText = mesh(
    new PlaneGeometry(0.21, 0.0226),
    new MeshBasicMaterial({
      map: textTexture('THRIVERLINK', 4),
      transparent: true,
      color: new Color('#241509'),
      toneMapped: false,
    }),
    'BrandPlateText',
  );
  plateText.position.set(0, -0.245, 0.0366);
  frame.add(plateText);

  return frame;
}
