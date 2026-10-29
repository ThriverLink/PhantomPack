/**
 * PHANTOM asset manifest. Every visual is procedural and local, so the
 * experience works offline after the page loads.
 */

import { AssetType, defineAssets } from '@iwsdk/core';
import { createBodyHologram } from './scene-assets/body.scene-asset.js';
import { createBrandFrame } from './scene-assets/branding.scene-asset.js';
import { createEmber, createFxRoot } from './scene-assets/ember.scene-asset.js';
import { createRoom } from './scene-assets/room.scene-asset.js';
import { createBin, createWallet } from './scene-assets/shop.scene-asset.js';
import {
  createAshtray,
  createCigarette,
  createCigarettePack,
  createLamp,
  createLighter,
  createTable,
} from './scene-assets/table.scene-asset.js';

const publicAssetUrl = (filePath: string): string =>
  `${import.meta.env.BASE_URL}${filePath.replace(/^\/+/u, '')}`;

const uikitml = (fileName: string, name: string) => ({
  url: publicAssetUrl(`ui/${fileName}`),
  type: AssetType.UIKitML,
  name,
});

export default defineAssets({
  room: createRoom(),
  'brand-frame': createBrandFrame(),
  table: createTable(),
  pack: createCigarettePack(),
  cigarette: createCigarette(),
  ashtray: createAshtray(),
  lighter: createLighter(),
  lamp: createLamp(),
  wallet: createWallet(),
  bin: createBin(),
  'body-hologram': createBodyHologram(),
  ember: createEmber(),
  'fx-root': createFxRoot(),
  blobby: {
    url: publicAssetUrl('models/blobby.glb'),
    type: AssetType.GLTF,
    name: 'Blobby',
  },
  'main-panel': uikitml('main.uikitml', 'Main Panel'),
  'fact-panel': uikitml('fact.uikitml', 'Fact Panel'),
  'receipt-panel': uikitml('receipt.uikitml', 'Receipt Panel'),
  'end-panel': uikitml('end.uikitml', 'End Panel'),
  'hint-panel': uikitml('hint.uikitml', 'Hint Panel'),
  'price-tag': uikitml('price-tag.uikitml', 'Price Tag'),
});
