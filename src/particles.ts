/**
 * Small CPU particle systems for PHANTOM: cigarette smoke, ember sparks and
 * the confetti burst when the pack is thrown away. Everything is preallocated;
 * update() does not create objects or arrays.
 */

import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  Points,
  PointsMaterial,
  Quaternion,
  Euler,
  Vector3,
} from '@iwsdk/core';
import { radialTexture } from './scene-assets/materials.js';

const CONFETTI_COUNT = 110;
const CONFETTI_COLORS = [
  '#FFB25C',
  '#6FE3D2',
  '#FF6B57',
  '#C7A6FF',
  '#F2E8D6',
  '#8FBF7A',
];

export class PhantomParticles {
  private readonly smokeCount = 64;
  private readonly smokePositions: Float32Array;
  private readonly smokeColors: Float32Array;
  private readonly smokeVelocity: Float32Array;
  private readonly smokeLife: Float32Array;
  private readonly smokeMaxLife: Float32Array;
  private readonly smokeGeometry: BufferGeometry;
  private readonly smokePoints: Points;

  private readonly sparkCount = 40;
  private readonly sparkPositions: Float32Array;
  private readonly sparkColors: Float32Array;
  private readonly sparkVelocity: Float32Array;
  private readonly sparkLife: Float32Array;
  private readonly sparkMaxLife: Float32Array;
  private readonly sparkGeometry: BufferGeometry;
  private readonly sparkPoints: Points;

  private readonly confetti: InstancedMesh;
  private readonly confettiPositions: Float32Array;
  private readonly confettiVelocity: Float32Array;
  private readonly confettiLife: Float32Array;
  private readonly confettiMaxLife: Float32Array;
  private readonly confettiRotation: Float32Array;
  private readonly confettiSpin: Float32Array;
  private readonly confettiColor = new Color();

  private readonly matrix = new Matrix4();
  private readonly quaternion = new Quaternion();
  private readonly euler = new Euler();
  private readonly scale = new Vector3();
  private readonly origin = new Vector3();

  private smokeCursor = 0;
  private sparkCursor = 0;
  private confettiCursor = 0;
  private smokeAlive = false;
  private sparksAlive = false;
  private confettiAlive = false;

  constructor(root: Object3D) {
    this.smokePositions = new Float32Array(this.smokeCount * 3);
    this.smokeColors = new Float32Array(this.smokeCount * 3);
    this.smokeVelocity = new Float32Array(this.smokeCount * 3);
    this.smokeLife = new Float32Array(this.smokeCount);
    this.smokeMaxLife = new Float32Array(this.smokeCount);
    this.smokeGeometry = new BufferGeometry();
    this.smokeGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(this.smokePositions, 3),
    );
    this.smokeGeometry.setAttribute(
      'color',
      new Float32BufferAttribute(this.smokeColors, 3),
    );
    this.smokePoints = new Points(
      this.smokeGeometry,
      new PointsMaterial({
        map: radialTexture(64, 1.5),
        size: 0.035,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.38,
        vertexColors: true,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.smokePoints.name = 'SmokeParticles';
    this.smokePoints.frustumCulled = false;
    this.smokePoints.visible = false;
    root.add(this.smokePoints);

    this.sparkPositions = new Float32Array(this.sparkCount * 3);
    this.sparkColors = new Float32Array(this.sparkCount * 3);
    this.sparkVelocity = new Float32Array(this.sparkCount * 3);
    this.sparkLife = new Float32Array(this.sparkCount);
    this.sparkMaxLife = new Float32Array(this.sparkCount);
    this.sparkGeometry = new BufferGeometry();
    this.sparkGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(this.sparkPositions, 3),
    );
    this.sparkGeometry.setAttribute(
      'color',
      new Float32BufferAttribute(this.sparkColors, 3),
    );
    this.sparkPoints = new Points(
      this.sparkGeometry,
      new PointsMaterial({
        map: radialTexture(32, 2),
        size: 0.022,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.95,
        vertexColors: true,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.sparkPoints.name = 'SparkParticles';
    this.sparkPoints.frustumCulled = false;
    this.sparkPoints.visible = false;
    root.add(this.sparkPoints);

    this.confettiPositions = new Float32Array(CONFETTI_COUNT * 3);
    this.confettiVelocity = new Float32Array(CONFETTI_COUNT * 3);
    this.confettiLife = new Float32Array(CONFETTI_COUNT);
    this.confettiMaxLife = new Float32Array(CONFETTI_COUNT);
    this.confettiRotation = new Float32Array(CONFETTI_COUNT * 3);
    this.confettiSpin = new Float32Array(CONFETTI_COUNT * 3);
    this.confetti = new InstancedMesh(
      new BoxGeometry(0.014, 0.002, 0.008),
      new MeshStandardMaterial({
        color: new Color('#FFFFFF'),
        roughness: 0.55,
        metalness: 0.1,
      }),
      CONFETTI_COUNT,
    );
    this.confetti.name = 'Confetti';
    this.confetti.frustumCulled = false;
    this.confetti.visible = false;
    this.confetti.castShadow = false;
    for (let index = 0; index < CONFETTI_COUNT; index += 1) {
      this.confettiColor.set(CONFETTI_COLORS[index % CONFETTI_COLORS.length]);
      this.confetti.setColorAt(index, this.confettiColor);
      this.scale.setScalar(0);
      this.matrix.compose(this.origin, this.quaternion.identity(), this.scale);
      this.confetti.setMatrixAt(index, this.matrix);
    }
    if (this.confetti.instanceColor) {
      this.confetti.instanceColor.needsUpdate = true;
    }
    this.confetti.instanceMatrix.needsUpdate = true;
    root.add(this.confetti);
  }

  trail(origin: Vector3): void {
    this.smokeAlive = true;
    this.smokePoints.visible = true;
    for (let count = 0; count < 2; count += 1) {
      const index = this.smokeCursor;
      this.smokeCursor = (this.smokeCursor + 1) % this.smokeCount;
      const i3 = index * 3;
      this.smokePositions[i3] = origin.x + (Math.random() - 0.5) * 0.006;
      this.smokePositions[i3 + 1] = origin.y + (Math.random() - 0.5) * 0.006;
      this.smokePositions[i3 + 2] = origin.z + (Math.random() - 0.5) * 0.006;
      this.smokeVelocity[i3] = (Math.random() - 0.5) * 0.04;
      this.smokeVelocity[i3 + 1] = 0.05 + Math.random() * 0.06;
      this.smokeVelocity[i3 + 2] = (Math.random() - 0.5) * 0.04;
      this.smokeLife[index] = 1.6 + Math.random() * 0.8;
      this.smokeMaxLife[index] = this.smokeLife[index];
    }
  }

  puff(origin: Vector3): void {
    this.smokeAlive = true;
    this.smokePoints.visible = true;
    for (let count = 0; count < 13; count += 1) {
      const index = this.smokeCursor;
      this.smokeCursor = (this.smokeCursor + 1) % this.smokeCount;
      const i3 = index * 3;
      this.smokePositions[i3] = origin.x + (Math.random() - 0.5) * 0.012;
      this.smokePositions[i3 + 1] = origin.y + (Math.random() - 0.5) * 0.012;
      this.smokePositions[i3 + 2] = origin.z + (Math.random() - 0.5) * 0.012;
      this.smokeVelocity[i3] = (Math.random() - 0.5) * 0.09;
      this.smokeVelocity[i3 + 1] = 0.09 + Math.random() * 0.13;
      this.smokeVelocity[i3 + 2] = (Math.random() - 0.5) * 0.09;
      this.smokeLife[index] = 1.1 + Math.random() * 1.2;
      this.smokeMaxLife[index] = this.smokeLife[index];
    }
  }

  sparks(origin: Vector3, count = 16): void {
    this.sparksAlive = true;
    this.sparkPoints.visible = true;
    for (let index = 0; index < count; index += 1) {
      const slot = this.sparkCursor;
      this.sparkCursor = (this.sparkCursor + 1) % this.sparkCount;
      const i3 = slot * 3;
      this.sparkPositions[i3] = origin.x;
      this.sparkPositions[i3 + 1] = origin.y;
      this.sparkPositions[i3 + 2] = origin.z;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.25 + Math.random() * 0.55;
      this.sparkVelocity[i3] = Math.cos(angle) * speed * 0.55;
      this.sparkVelocity[i3 + 1] = 0.35 + Math.random() * 0.8;
      this.sparkVelocity[i3 + 2] = Math.sin(angle) * speed * 0.55;
      this.sparkLife[slot] = 0.35 + Math.random() * 0.45;
      this.sparkMaxLife[slot] = this.sparkLife[slot];
    }
  }

  confettiBurst(origin: Vector3): void {
    this.confettiAlive = true;
    this.confetti.visible = true;
    for (let index = 0; index < CONFETTI_COUNT; index += 1) {
      const i3 = index * 3;
      this.confettiPositions[i3] = origin.x + (Math.random() - 0.5) * 0.16;
      this.confettiPositions[i3 + 1] = origin.y + Math.random() * 0.1;
      this.confettiPositions[i3 + 2] =
        origin.z + (Math.random() - 0.5) * 0.16;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 1.5;
      this.confettiVelocity[i3] = Math.cos(angle) * speed * 0.55;
      this.confettiVelocity[i3 + 1] = 1.4 + Math.random() * 2.2;
      this.confettiVelocity[i3 + 2] = Math.sin(angle) * speed * 0.55;
      this.confettiLife[index] = 2.4 + Math.random() * 2.2;
      this.confettiMaxLife[index] = this.confettiLife[index];
      this.confettiRotation[i3] = Math.random() * Math.PI * 2;
      this.confettiRotation[i3 + 1] = Math.random() * Math.PI * 2;
      this.confettiRotation[i3 + 2] = Math.random() * Math.PI * 2;
      this.confettiSpin[i3] = (Math.random() - 0.5) * 9;
      this.confettiSpin[i3 + 1] = (Math.random() - 0.5) * 9;
      this.confettiSpin[i3 + 2] = (Math.random() - 0.5) * 9;
      this.scale.setScalar(1);
      this.quaternion.identity();
      this.origin.set(
        this.confettiPositions[i3],
        this.confettiPositions[i3 + 1],
        this.confettiPositions[i3 + 2],
      );
      this.matrix.compose(this.origin, this.quaternion, this.scale);
      this.confetti.setMatrixAt(index, this.matrix);
    }
    this.confetti.instanceMatrix.needsUpdate = true;
  }

  update(delta: number): void {
    this.updateSmoke(delta);
    this.updateSparks(delta);
    this.updateConfetti(delta);
  }

  reset(): void {
    this.smokeLife.fill(0);
    this.sparkLife.fill(0);
    this.confettiLife.fill(0);
    this.smokePoints.visible = false;
    this.sparkPoints.visible = false;
    this.confetti.visible = false;
  }

  private updateSmoke(delta: number): void {
    if (!this.smokeAlive) {
      return;
    }
    let alive = 0;
    for (let index = 0; index < this.smokeCount; index += 1) {
      if (this.smokeLife[index] <= 0) {
        continue;
      }
      alive += 1;
      const i3 = index * 3;
      this.smokeLife[index] -= delta;
      if (this.smokeLife[index] <= 0) {
        this.smokePositions[i3 + 1] = -100;
        this.smokeColors[i3] = 0;
        this.smokeColors[i3 + 1] = 0;
        this.smokeColors[i3 + 2] = 0;
        continue;
      }
      const t = this.smokeLife[index] / this.smokeMaxLife[index];
      this.smokePositions[i3] += this.smokeVelocity[i3] * delta;
      this.smokePositions[i3 + 1] += this.smokeVelocity[i3 + 1] * delta;
      this.smokePositions[i3 + 2] += this.smokeVelocity[i3 + 2] * delta;
      this.smokeVelocity[i3] *= 0.985;
      this.smokeVelocity[i3 + 2] *= 0.985;
      this.smokeVelocity[i3 + 1] += 0.035 * delta;
      const fade = t * t;
      this.smokeColors[i3] = 0.5 * fade;
      this.smokeColors[i3 + 1] = 0.46 * fade;
      this.smokeColors[i3 + 2] = 0.42 * fade;
    }
    this.smokeGeometry.attributes.position.needsUpdate = true;
    this.smokeGeometry.attributes.color.needsUpdate = true;
    if (alive === 0) {
      this.smokeAlive = false;
      this.smokePoints.visible = false;
    }
  }

  private updateSparks(delta: number): void {
    if (!this.sparksAlive) {
      return;
    }
    let alive = 0;
    for (let index = 0; index < this.sparkCount; index += 1) {
      if (this.sparkLife[index] <= 0) {
        continue;
      }
      alive += 1;
      const i3 = index * 3;
      this.sparkLife[index] -= delta;
      if (this.sparkLife[index] <= 0) {
        this.sparkPositions[i3 + 1] = -100;
        this.sparkColors[i3] = 0;
        this.sparkColors[i3 + 1] = 0;
        this.sparkColors[i3 + 2] = 0;
        continue;
      }
      const t = this.sparkLife[index] / this.sparkMaxLife[index];
      this.sparkVelocity[i3 + 1] -= 2.6 * delta;
      this.sparkPositions[i3] += this.sparkVelocity[i3] * delta;
      this.sparkPositions[i3 + 1] += this.sparkVelocity[i3 + 1] * delta;
      this.sparkPositions[i3 + 2] += this.sparkVelocity[i3 + 2] * delta;
      this.sparkColors[i3] = 1 * t;
      this.sparkColors[i3 + 1] = 0.55 * t;
      this.sparkColors[i3 + 2] = 0.18 * t;
    }
    this.sparkGeometry.attributes.position.needsUpdate = true;
    this.sparkGeometry.attributes.color.needsUpdate = true;
    if (alive === 0) {
      this.sparksAlive = false;
      this.sparkPoints.visible = false;
    }
  }

  private updateConfetti(delta: number): void {
    if (!this.confettiAlive) {
      return;
    }
    let alive = 0;
    for (let index = 0; index < CONFETTI_COUNT; index += 1) {
      if (this.confettiLife[index] <= 0) {
        continue;
      }
      alive += 1;
      const i3 = index * 3;
      this.confettiLife[index] -= delta;
      if (this.confettiLife[index] <= 0) {
        this.scale.setScalar(0);
        this.origin.set(0, -100, 0);
        this.quaternion.identity();
        this.matrix.compose(this.origin, this.quaternion, this.scale);
        this.confetti.setMatrixAt(index, this.matrix);
        continue;
      }
      const t = this.confettiLife[index] / this.confettiMaxLife[index];
      this.confettiVelocity[i3 + 1] -= 2.8 * delta;
      this.confettiVelocity[i3] *= 0.995;
      this.confettiVelocity[i3 + 2] *= 0.995;
      this.confettiPositions[i3] += this.confettiVelocity[i3] * delta;
      this.confettiPositions[i3 + 1] += this.confettiVelocity[i3 + 1] * delta;
      this.confettiPositions[i3 + 2] += this.confettiVelocity[i3 + 2] * delta;
      this.confettiRotation[i3] += this.confettiSpin[i3] * delta;
      this.confettiRotation[i3 + 1] += this.confettiSpin[i3 + 1] * delta;
      this.confettiRotation[i3 + 2] += this.confettiSpin[i3 + 2] * delta;
      this.origin.set(
        this.confettiPositions[i3],
        this.confettiPositions[i3 + 1],
        this.confettiPositions[i3 + 2],
      );
      this.euler.set(
        this.confettiRotation[i3],
        this.confettiRotation[i3 + 1],
        this.confettiRotation[i3 + 2],
      );
      this.quaternion.setFromEuler(this.euler);
      this.scale.setScalar(t > 0.2 ? 1 : t / 0.2);
      this.matrix.compose(this.origin, this.quaternion, this.scale);
      this.confetti.setMatrixAt(index, this.matrix);
    }
    this.confetti.instanceMatrix.needsUpdate = true;
    if (alive === 0) {
      this.confettiAlive = false;
      this.confetti.visible = false;
    }
  }
}
