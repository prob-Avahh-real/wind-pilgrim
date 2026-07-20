import * as THREE from 'three';
import { Player } from './player.js';
import { Companion } from './companion.js';
import { World } from './world.js';
import { CHAPTERS } from './chapters/index.js';
import { InputSystem } from './systems/input.js';
import { AudioSystem } from './systems/audio.js';
import { FxSystem } from './systems/fx.js';
import { NetClient } from './net/client.js';
import { WearableInput } from './wearable-input.js';

const canvas = document.getElementById('game');
const chapterTitleEl = document.getElementById('chapter-title');
const netStatusEl = document.getElementById('net-status');
const hintEl = document.getElementById('hint');
const energyFg = document.getElementById('energy-fg');
const titleScreen = document.getElementById('title-screen');
const endScreen = document.getElementById('end-screen');
const endNote = document.getElementById('end-note');
const fadeEl = document.getElementById('fade');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 220);
const hemi = new THREE.HemisphereLight(0xffe6c0, 0x6a3a20, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2b0, 1.1);
sun.position.set(30, 50, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

let chapterIndex = 0;
let world = null;
let player = null;
let companion = null;
let running = false;
let transitioning = false;
let metCompanion = false;
let hintTimer = 0;
let goalLock = 0;

const input = new InputSystem();
const audio = new AudioSystem();
const fx = new FxSystem(scene);

const net = new NetClient({
  onStatus: (t) => {
    netStatusEl.textContent = t;
  },
  onMatched: () => {
    metCompanion = true;
    companion?.show();
    flashHint('有人与你同行');
  },
  onPeerLeft: () => {
    companion?.hide();
    flashHint('旅人远去');
  },
  onState: (s) => companion?.applyState(s),
  onChirp: (pitch) => {
    audio.chirp(pitch, true);
    if (companion) {
      companion.lastSeen = performance.now();
      fx.spawnChirp(companion.position.clone(), true);
      if (world?.shareChirpEnergy(player, companion)) {
        flashHint('风从同伴处来', 1600);
      }
    }
  },
});

const wearable = new WearableInput({
  onGesture: (name, detail = {}) => {
    if (name === 'steer') input.steer = detail;
    if (name === 'chirp') input.wantChirp = true;
    if (name === 'boost' || name === 'shake') input.wantBoost = true;
  },
  onBadge: (kind, text, active) => {
    const el = document.getElementById(`${kind}-badge`);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('active', active);
  },
});

function flashHint(text, ms = 2800) {
  hintEl.textContent = text;
  hintEl.classList.add('show');
  hintTimer = ms / 1000;
}

function particleModeFor(ch) {
  if (ch.id === 5) return 'snow';
  if (ch.id === 7) return 'star';
  return 'sand';
}

function setAtmosphere(ch) {
  scene.background = new THREE.Color(ch.sky);
  scene.fog = new THREE.Fog(ch.fog, 18, ch.id === 3 ? 55 : 95);
  sun.color.copy(ch.sun);
  hemi.color = new THREE.Color(ch.sky);
  hemi.groundColor = new THREE.Color(ch.sand);
  fx.setMode(particleModeFor(ch));
}

function loadChapter(index) {
  chapterIndex = index;
  const ch = CHAPTERS[index];
  world?.dispose();
  if (player) scene.remove(player.group);
  if (companion) scene.remove(companion.group);

  setAtmosphere(ch);
  world = new World(scene, ch);
  player = new Player(scene);
  companion = new Companion(scene);

  const hy = world.heightAt(ch.spawn.x, ch.spawn.z);
  const facing =
    ch.id === 7 ? 0 : Math.PI; // final chapter walks toward +Z goal
  player.setPose(ch.spawn.x, hy, ch.spawn.z, facing);
  player.energy = index === 0 ? 0.4 : Math.min(0.7, 0.45 + index * 0.03);

  chapterTitleEl.textContent = `${ch.id} · ${ch.title}`;
  flashHint(ch.hint, 3500);
  goalLock = 1.2;

  net.enter(ch.id);

  // Soft camera reset behind player
  const back = new THREE.Vector3(Math.sin(player.yaw) * 7, 3.8, Math.cos(player.yaw) * 7);
  camera.position.copy(player.position).add(back);
  camera.lookAt(player.position.x, player.position.y + 1.2, player.position.z);
}

function updateEnergyUI() {
  if (!player || !energyFg) return;
  const len = 100;
  const offset = len * (1 - player.energy);
  energyFg.setAttribute('stroke-dasharray', String(len));
  energyFg.setAttribute('stroke-dashoffset', String(offset));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function advanceOrEnd() {
  if (transitioning) return;
  transitioning = true;
  running = false;
  fadeEl?.classList.add('on');
  await sleep(750);

  if (chapterIndex >= CHAPTERS.length - 1) {
    endNote.textContent = metCompanion
      ? '你曾与无名旅人并肩。风记得这件事。'
      : '风停了。山还在。';
    endScreen.classList.remove('hidden');
    fadeEl?.classList.remove('on');
    transitioning = false;
    return;
  }

  loadChapter(chapterIndex + 1);
  fadeEl?.classList.remove('on');
  await sleep(200);
  running = true;
  transitioning = false;
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

document.getElementById('start-btn')?.addEventListener('click', () => {
  audio.resume();
  titleScreen.classList.add('hidden');
  wearable.setupRing();
  wearable.setupCane();
  net.connect();
  loadChapter(0);
  running = true;
});

document.getElementById('restart-btn')?.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  metCompanion = false;
  loadChapter(0);
  running = true;
});

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!running || !player || !world) {
    if (player) fx.update(dt, player.position);
    renderer.render(scene, camera);
    return;
  }

  if (hintTimer > 0) {
    hintTimer -= dt;
    if (hintTimer <= 0) hintEl.classList.remove('show');
  }
  if (goalLock > 0) goalLock -= dt;

  const move = input.sample();
  const boost = input.consumeBoost();
  player.update(dt, move, world, boost);
  const newCp = world.update(dt, player);
  if (newCp) flashHint('足迹留下', 1400);
  if (world.needsRespawn(player)) {
    world.respawnPlayer(player);
    flashHint('风把你送回', 1600);
  }
  companion.update(dt);
  fx.update(dt, player.position);

  if (input.consumeChirp()) {
    player.chirpPulse = 0.45;
    const pitch = 1 + player.energy * 0.3;
    audio.chirp(pitch, false);
    net.chirp(pitch);
    fx.spawnChirp(player.position.clone(), false);
    // Chirping near companion also shares warmth
    if (world.shareChirpEnergy(player, companion)) {
      flashHint('同行共鸣', 1400);
    }
  }

  net.maybeSendState(dt, player.netState());
  audio.setWindIntensity(CHAPTERS[chapterIndex].windScale * (player.gliding ? 1 : 0.45));
  updateEnergyUI();

  const camDist = player.gliding ? 9 : 7;
  const camH = player.gliding ? 4.4 : 3.8;
  const back = new THREE.Vector3(Math.sin(player.yaw) * camDist, camH, Math.cos(player.yaw) * camDist);
  const desired = player.position.clone().add(back);
  camera.position.lerp(desired, 1 - Math.exp(-4 * dt));
  const look = player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
  camera.lookAt(look);

  if (goalLock <= 0 && world.reachedGoal(player)) advanceOrEnd();

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

camera.position.set(8, 6, 16);
camera.lookAt(0, 1, 0);
