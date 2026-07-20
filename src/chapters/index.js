import * as THREE from 'three';

/** @typedef {{ id:number, title:string, hint:string, fog:number, sky:number, sand:number, sun:THREE.Color, spawn:THREE.Vector3, goal:THREE.Vector3, bounds:object, glyphs:THREE.Vector3[], checkpoints:THREE.Vector3[], pillars?:THREE.Vector3[], windScale:number, heightFn:(x:number,z:number)=>number }} ChapterDef */

function duneHeight(x, z, amp = 2.2) {
  return (
    Math.sin(x * 0.09) * amp +
    Math.cos(z * 0.07) * amp * 0.7 +
    Math.sin((x + z) * 0.05) * amp * 0.4
  );
}

/** @type {ChapterDef[]} */
export const CHAPTERS = [
  {
    id: 1,
    title: '沙丘启程',
    hint: '走向远方光门 · 鸣叫可汲取风',
    fog: 0xe8b87a,
    sky: 0xe8b87a,
    sand: 0xc4783a,
    sun: new THREE.Color(0xffe2b0),
    spawn: new THREE.Vector3(0, 0, 18),
    goal: new THREE.Vector3(0, 0, -42),
    bounds: { minX: -40, maxX: 40, minZ: -55, maxZ: 30 },
    glyphs: [
      new THREE.Vector3(-6, 0, 8),
      new THREE.Vector3(5, 0, -4),
      new THREE.Vector3(-3, 0, -18),
      new THREE.Vector3(8, 0, -28),
    ],
    checkpoints: [
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(0, 0, -8),
      new THREE.Vector3(0, 0, -28),
    ],
    windScale: 0.4,
    heightFn: (x, z) => duneHeight(x, z, 1.8),
  },
  {
    id: 2,
    title: '风桥遗迹',
    hint: '沿旗帜找风道 · 蓄力滑翔过桥',
    fog: 0xd4a06a,
    sky: 0xd9a56f,
    sand: 0xb86a32,
    sun: new THREE.Color(0xffd9a0),
    spawn: new THREE.Vector3(0, 0, 20),
    goal: new THREE.Vector3(0, 0, -48),
    bounds: { minX: -35, maxX: 35, minZ: -60, maxZ: 28 },
    glyphs: [
      new THREE.Vector3(-10, 0, 5),
      new THREE.Vector3(0, 0, -8),
      new THREE.Vector3(10, 0, -22),
    ],
    checkpoints: [
      new THREE.Vector3(0, 0, 20),
      new THREE.Vector3(0, 0, -12),
      new THREE.Vector3(0, 0, -32),
    ],
    pillars: [
      new THREE.Vector3(-8, 0, -5),
      new THREE.Vector3(8, 0, -5),
      new THREE.Vector3(-8, 0, -25),
      new THREE.Vector3(8, 0, -25),
    ],
    windScale: 0.9,
    heightFn: (x, z) => {
      const bridge = Math.abs(x) < 4 && z < -5 && z > -40 ? 3.5 : 0;
      return duneHeight(x, z, 1.2) + bridge;
    },
  },
  {
    id: 3,
    title: '沉落城墟',
    hint: '跟随光符穿过甬道',
    fog: 0x4a3040,
    sky: 0x3a2838,
    sand: 0x5a3a48,
    sun: new THREE.Color(0xaa8866),
    spawn: new THREE.Vector3(0, 0, 16),
    goal: new THREE.Vector3(0, 0, -50),
    bounds: { minX: -22, maxX: 22, minZ: -60, maxZ: 24 },
    glyphs: [
      new THREE.Vector3(0, 0, 4),
      new THREE.Vector3(-4, 0, -10),
      new THREE.Vector3(4, 0, -22),
      new THREE.Vector3(0, 0, -36),
    ],
    checkpoints: [
      new THREE.Vector3(0, 0, 16),
      new THREE.Vector3(0, 0, -14),
      new THREE.Vector3(0, 0, -34),
    ],
    pillars: [
      new THREE.Vector3(-6, 0, -8),
      new THREE.Vector3(6, 0, -8),
      new THREE.Vector3(-6, 0, -28),
      new THREE.Vector3(6, 0, -28),
    ],
    windScale: 0.25,
    heightFn: (x, z) => {
      const trench = Math.abs(x) < 7 ? -1.5 : 2.5;
      return trench + Math.sin(z * 0.1) * 0.4;
    },
  },
  {
    id: 4,
    title: '神殿机关',
    hint: '对石碑鸣叫，延长披风',
    fog: 0xc9955a,
    sky: 0xd4a060,
    sand: 0xa8622e,
    sun: new THREE.Color(0xffcc88),
    spawn: new THREE.Vector3(0, 0, 18),
    goal: new THREE.Vector3(0, 0, -46),
    bounds: { minX: -30, maxX: 30, minZ: -55, maxZ: 26 },
    glyphs: [
      new THREE.Vector3(-12, 0, 0),
      new THREE.Vector3(12, 0, 0),
      new THREE.Vector3(0, 0, -16),
      new THREE.Vector3(-8, 0, -30),
      new THREE.Vector3(8, 0, -30),
    ],
    checkpoints: [
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(0, 0, -10),
      new THREE.Vector3(0, 0, -30),
    ],
    pillars: [
      new THREE.Vector3(-12, 0, 0),
      new THREE.Vector3(12, 0, 0),
      new THREE.Vector3(0, 0, -16),
    ],
    windScale: 0.55,
    heightFn: (x, z) => duneHeight(x, z, 0.9) + (Math.abs(x) < 10 && z < -5 ? 1.2 : 0),
  },
  {
    id: 5,
    title: '暴风雪脊',
    hint: '逆风耗能 · 躲进岩影蓄力',
    fog: 0xb8c4d0,
    sky: 0x9aabbc,
    sand: 0xd8e0e8,
    sun: new THREE.Color(0xeef4ff),
    spawn: new THREE.Vector3(0, 0, 20),
    goal: new THREE.Vector3(0, 0, -52),
    bounds: { minX: -28, maxX: 28, minZ: -62, maxZ: 28 },
    glyphs: [
      new THREE.Vector3(-5, 0, 6),
      new THREE.Vector3(6, 0, -12),
      new THREE.Vector3(-4, 0, -28),
    ],
    checkpoints: [
      new THREE.Vector3(0, 0, 20),
      new THREE.Vector3(0, 0, -14),
      new THREE.Vector3(-4, 0, -34),
    ],
    pillars: [
      new THREE.Vector3(-7, 0, -6),
      new THREE.Vector3(7, 0, -20),
      new THREE.Vector3(-5, 0, -36),
    ],
    windScale: 1.6,
    heightFn: (x, z) => Math.abs(x) * 0.15 + z * -0.04 + Math.sin(x * 0.2) * 0.8,
  },
  {
    id: 6,
    title: '峰顶升华',
    hint: '长滑翔 · 把能量留给最后一口气',
    fog: 0xf2e6d4,
    sky: 0xf7efe4,
    sand: 0xe8d8c4,
    sun: new THREE.Color(0xfff6e8),
    spawn: new THREE.Vector3(0, 8, 10),
    goal: new THREE.Vector3(0, 18, -40),
    bounds: { minX: -40, maxX: 40, minZ: -55, maxZ: 20 },
    glyphs: [
      new THREE.Vector3(0, 0, -4),
      new THREE.Vector3(-10, 0, -16),
      new THREE.Vector3(10, 0, -16),
      new THREE.Vector3(0, 0, -28),
    ],
    checkpoints: [
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(0, 0, -12),
      new THREE.Vector3(0, 0, -26),
    ],
    windScale: 1.2,
    heightFn: (x, z) => 6 + Math.sin(x * 0.08) * 1.5 + (z < -20 ? 8 : 0),
  },
  {
    id: 7,
    title: '归途星河',
    hint: '下行 · 不必赶路',
    fog: 0x1a1830,
    sky: 0x12101f,
    sand: 0x2a2440,
    sun: new THREE.Color(0x8899ff),
    spawn: new THREE.Vector3(0, 20, -5),
    goal: new THREE.Vector3(0, 0, 35),
    bounds: { minX: -30, maxX: 30, minZ: -20, maxZ: 45 },
    glyphs: [
      new THREE.Vector3(-8, 0, 8),
      new THREE.Vector3(8, 0, 16),
      new THREE.Vector3(0, 0, 26),
    ],
    checkpoints: [
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(0, 0, 12),
      new THREE.Vector3(0, 0, 26),
    ],
    windScale: 0.7,
    heightFn: (x, z) => 16 - z * 0.35 + Math.sin(x * 0.1) * 0.5,
  },
];

export function zoneFor(chapter, position) {
  if (position.z > 5) return 'start';
  if (position.z < -25) return 'goal';
  return 'mid';
}
