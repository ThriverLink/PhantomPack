/**
 * Shared look for PHANTOM. Everything is procedural and deterministic so the
 * runtime and the editor can evaluate the manifest independently.
 */

import {
  AdditiveBlending,
  Color,
  createSceneMaterial,
  DataTexture,
  DoubleSide,
  LinearFilter,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from '@iwsdk/core';

export const palette = {
  ink: '#0A1115',
  deep: '#101A1F',
  panel: '#152229',
  teal: '#6FE3D2',
  amber: '#FFB25C',
  ember: '#FF7A3D',
  coral: '#FF6B57',
  violet: '#C7A6FF',
  paper: '#F2E8D6',
  cork: '#C08A57',
  ash: '#77736D',
  brass: '#D2A45C',
  leaf: '#3C6B4A',
  pot: '#4A3328',
  skin: '#B98C74',
} as const;

export const walnut = createSceneMaterial({
  id: 'phantom-walnut',
  model: 'standard',
  baseColor: '#4A2C1D',
  roughness: 0.5,
  textures: {
    albedo: {
      type: 'procedural',
      algorithm: 'periodic-fbm-v1',
      resolution: [256, 256],
      seed: 21,
      bands: [
        { frequency: [6, 46], amplitude: 0.62 },
        { frequency: [22, 120], amplitude: 0.38 },
      ],
      ramp: [
        { at: 0, color: '#24130C' },
        { at: 0.55, color: '#4B2A1B' },
        { at: 1, color: '#74462B' },
      ],
      sampler: { repeat: [2, 2] },
    },
    roughness: {
      type: 'procedural',
      algorithm: 'periodic-fbm-v1',
      resolution: [128, 128],
      seed: 22,
      bands: [{ frequency: [18, 80], amplitude: 1 }],
      range: [0.38, 0.62],
    },
  },
});

export const darkWood = createSceneMaterial({
  id: 'phantom-dark-wood',
  model: 'standard',
  baseColor: '#2A1A12',
  roughness: 0.62,
  textures: {
    albedo: {
      type: 'procedural',
      algorithm: 'periodic-fbm-v1',
      resolution: [256, 256],
      seed: 31,
      bands: [
        { frequency: [5, 40], amplitude: 0.7 },
        { frequency: [18, 110], amplitude: 0.3 },
      ],
      ramp: [
        { at: 0, color: '#160D09' },
        { at: 1, color: '#3D2618' },
      ],
      sampler: { repeat: [2, 2] },
    },
  },
});

export const plaster = createSceneMaterial({
  id: 'phantom-plaster',
  model: 'standard',
  baseColor: '#1A2429',
  roughness: 0.96,
  textures: {
    albedo: {
      type: 'procedural',
      algorithm: 'periodic-fbm-v1',
      resolution: [256, 256],
      seed: 41,
      bands: [
        { frequency: [40, 40], amplitude: 0.5 },
        { frequency: [120, 120], amplitude: 0.5 },
      ],
      ramp: [
        { at: 0, color: '#141D22' },
        { at: 1, color: '#202C32' },
      ],
      sampler: { repeat: [3, 3] },
    },
  },
});

export const stone = createSceneMaterial({
  id: 'phantom-stone',
  model: 'standard',
  baseColor: '#242A2E',
  roughness: 0.38,
  textures: {
    albedo: {
      type: 'procedural',
      algorithm: 'periodic-fbm-v1',
      resolution: [256, 256],
      seed: 51,
      bands: [
        { frequency: [22, 22], amplitude: 0.5 },
        { frequency: [64, 64], amplitude: 0.5 },
      ],
      ramp: [
        { at: 0, color: '#1C2226' },
        { at: 1, color: '#343B40' },
      ],
      sampler: { repeat: [2, 2] },
    },
  },
});

export const fabric = createSceneMaterial({
  id: 'phantom-fabric',
  model: 'standard',
  baseColor: '#132329',
  roughness: 1,
  textures: {
    albedo: {
      type: 'procedural',
      algorithm: 'periodic-fbm-v1',
      resolution: [128, 128],
      seed: 61,
      bands: [
        { frequency: [90, 4], amplitude: 0.5 },
        { frequency: [4, 90], amplitude: 0.5 },
      ],
      ramp: [
        { at: 0, color: '#0D1B20' },
        { at: 1, color: '#1B3038' },
      ],
      sampler: { repeat: [6, 6] },
    },
  },
});

export const brass = new MeshStandardMaterial({
  color: new Color(palette.brass),
  metalness: 0.86,
  roughness: 0.24,
  envMapIntensity: 1.8,
});

export const darkMetal = new MeshStandardMaterial({
  color: new Color('#161C1F'),
  metalness: 0.72,
  roughness: 0.34,
  envMapIntensity: 1.4,
});

export const ceramic = new MeshStandardMaterial({
  color: new Color('#1D2529'),
  metalness: 0.08,
  roughness: 0.22,
  envMapIntensity: 1.2,
});

export const paper = new MeshStandardMaterial({
  color: new Color(palette.paper),
  roughness: 0.88,
});

export const cork = new MeshStandardMaterial({
  color: new Color(palette.cork),
  roughness: 0.92,
});

export const ash = new MeshStandardMaterial({
  color: new Color(palette.ash),
  roughness: 1,
});

export const leaf = new MeshStandardMaterial({
  color: new Color(palette.leaf),
  roughness: 0.78,
  side: DoubleSide,
});

export const pot = new MeshStandardMaterial({
  color: new Color(palette.pot),
  roughness: 0.85,
});

export const glass = new MeshStandardMaterial({
  color: new Color('#7FB8C4'),
  metalness: 0.1,
  roughness: 0.08,
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
  side: DoubleSide,
});

export const hologramShell = new MeshBasicMaterial({
  color: new Color('#67D8D0'),
  transparent: true,
  opacity: 0.08,
  blending: AdditiveBlending,
  depthWrite: false,
  side: DoubleSide,
});

export const hologramWire = new MeshBasicMaterial({
  color: new Color('#7FE7DC'),
  transparent: true,
  opacity: 0.2,
  blending: AdditiveBlending,
  depthWrite: false,
  wireframe: true,
  side: DoubleSide,
});

export const hologramRing = new MeshBasicMaterial({
  color: new Color('#8FF4E6'),
  transparent: true,
  opacity: 0.55,
  blending: AdditiveBlending,
  depthWrite: false,
  side: DoubleSide,
});

export const emberCore = new MeshBasicMaterial({
  color: new Color('#FFD08A'),
  transparent: true,
  opacity: 1,
  blending: AdditiveBlending,
  depthWrite: false,
});

export const emberRing = new MeshBasicMaterial({
  color: new Color('#FFB25C'),
  transparent: true,
  opacity: 0.55,
  blending: AdditiveBlending,
  depthWrite: false,
  side: DoubleSide,
});

export const emberHalo = new MeshBasicMaterial({
  color: new Color('#FF9B4A'),
  transparent: true,
  opacity: 0.5,
  blending: AdditiveBlending,
  depthWrite: false,
  side: DoubleSide,
});

export const emberLightColor = new Color('#FF9A4A');

/** Soft radial alpha texture for halos, smoke and light bloom cards. */
export function radialTexture(size = 64, power = 1.8): DataTexture {
  const pixels = new Uint8Array(size * size * 4);
  const center = (size - 1) / 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - center) / center;
      const dy = (y - center) / center;
      const distance = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const alpha = Math.pow(1 - distance, power);
      const index = (y * size + x) * 4;
      pixels[index] = 255;
      pixels[index + 1] = 255;
      pixels[index + 2] = 255;
      pixels[index + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new DataTexture(
    pixels,
    size,
    size,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/** A tiny 5x7 bitmap font, enough for the pack label and small markings. */
const GLYPHS: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  ' ': [0, 0, 0, 0, 0, 0, 0],
};

/**
 * White-on-transparent pixel text. The caller tints it with a material color.
 * `scale` is texels per font pixel.
 */
export function textTexture(text: string, scale = 4): DataTexture {
  const gap = 1;
  const glyphWidth = 5;
  const glyphHeight = 7;
  const width = Math.max(
    1,
    text.length * (glyphWidth + gap) * scale - gap * scale,
  );
  const height = glyphHeight * scale;
  const pixels = new Uint8Array(width * height * 4);
  for (let index = 3; index < pixels.length; index += 4) {
    pixels[index] = 0;
  }
  let cursor = 0;
  for (const character of text.toUpperCase()) {
    const glyph = GLYPHS[character] ?? GLYPHS[' '];
    for (let row = 0; row < glyphHeight; row += 1) {
      const bits = glyph[row];
      for (let column = 0; column < glyphWidth; column += 1) {
        if ((bits & (1 << (glyphWidth - 1 - column))) === 0) {
          continue;
        }
        for (let py = 0; py < scale; py += 1) {
          for (let px = 0; px < scale; px += 1) {
            const x = cursor + column * scale + px;
            const y = row * scale + py;
            const index = (y * width + x) * 4;
            pixels[index] = 255;
            pixels[index + 1] = 255;
            pixels[index + 2] = 255;
            pixels[index + 3] = 255;
          }
        }
      }
    }
    cursor += (glyphWidth + gap) * scale;
  }
  const texture = new DataTexture(
    pixels,
    width,
    height,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/** Night-sky card for the window: a deep gradient with deterministic stars. */
export function nightSkyTexture(width = 256, height = 192): DataTexture {
  const pixels = new Uint8Array(width * height * 4);
  let seed = 0x9e3779b9;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < height; y += 1) {
    const t = y / (height - 1);
    const r = Math.round(8 + 10 * (1 - t));
    const g = Math.round(18 + 24 * (1 - t));
    const b = Math.round(34 + 48 * (1 - t));
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = 255;
    }
  }
  for (let star = 0; star < 140; star += 1) {
    const x = Math.floor(random() * width);
    const y = Math.floor(random() * height * 0.8);
    const brightness = 0.4 + random() * 0.6;
    const radius = random() < 0.08 ? 2 : 1;
    for (let oy = -radius; oy <= radius; oy += 1) {
      for (let ox = -radius; ox <= radius; ox += 1) {
        const px = x + ox;
        const py = y + oy;
        if (px < 0 || py < 0 || px >= width || py >= height) {
          continue;
        }
        if (ox * ox + oy * oy > radius * radius) {
          continue;
        }
        const index = (py * width + px) * 4;
        const glow = brightness * (1 - Math.sqrt(ox * ox + oy * oy) / (radius + 0.5));
        pixels[index] = Math.min(255, Math.round(210 * glow + pixels[index]));
        pixels[index + 1] = Math.min(255, Math.round(230 * glow + pixels[index + 1]));
        pixels[index + 2] = Math.min(255, Math.round(255 * glow + pixels[index + 2]));
      }
    }
  }
  const texture = new DataTexture(
    pixels,
    width,
    height,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
