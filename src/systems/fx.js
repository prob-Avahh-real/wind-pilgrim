import * as THREE from 'three';

/** Chirp rings + drifting sand/snow particles. */
export class FxSystem {
  constructor(scene) {
    this.scene = scene;
    this.rings = [];
    this.particles = null;
    this.particleVel = null;
    this.mode = 'sand';
  }

  setMode(mode) {
    this.mode = mode; // sand | snow | star
    this._rebuildParticles();
  }

  _rebuildParticles() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.particles = null;
    }
    const count = 400;
    const positions = new Float32Array(count * 3);
    this.particleVel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 28;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
      this.particleVel[i * 3] = (Math.random() - 0.5) * 2;
      this.particleVel[i * 3 + 1] = this.mode === 'snow' ? -0.8 - Math.random() : (Math.random() - 0.5) * 0.4;
      this.particleVel[i * 3 + 2] = -1.5 - Math.random() * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const color =
      this.mode === 'snow' ? 0xe8f0ff : this.mode === 'star' ? 0xc8d0ff : 0xe8c090;
    const mat = new THREE.PointsMaterial({
      color,
      size: this.mode === 'star' ? 0.18 : 0.12,
      transparent: true,
      opacity: this.mode === 'sand' ? 0.35 : 0.55,
      depthWrite: false,
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  spawnChirp(position, remote = false) {
    const geo = new THREE.RingGeometry(0.2, 0.35, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: remote ? 0xffcc88 : 0xffe6b0,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(position);
    mesh.position.y += 0.4;
    mesh.userData = { age: 0, life: 0.9, remote };
    this.scene.add(mesh);
    this.rings.push(mesh);
  }

  update(dt, followPos) {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.userData.age += dt;
      const t = r.userData.age / r.userData.life;
      const s = 1 + t * 8;
      r.scale.set(s, s, s);
      r.material.opacity = 0.85 * (1 - t);
      if (t >= 1) {
        this.scene.remove(r);
        r.geometry.dispose();
        r.material.dispose();
        this.rings.splice(i, 1);
      }
    }

    if (!this.particles || !followPos) return;
    const pos = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3] += this.particleVel[i * 3] * dt;
      pos[i * 3 + 1] += this.particleVel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += this.particleVel[i * 3 + 2] * dt;
      // Recycle around player
      if (
        Math.abs(pos[i * 3] - followPos.x) > 40 ||
        pos[i * 3 + 1] < followPos.y - 2 ||
        pos[i * 3 + 1] > followPos.y + 30 ||
        Math.abs(pos[i * 3 + 2] - followPos.z) > 45
      ) {
        pos[i * 3] = followPos.x + (Math.random() - 0.5) * 70;
        pos[i * 3 + 1] = followPos.y + Math.random() * 22;
        pos[i * 3 + 2] = followPos.z + (Math.random() - 0.5) * 70;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    for (const r of this.rings) {
      this.scene.remove(r);
      r.geometry.dispose();
      r.material.dispose();
    }
    this.rings.length = 0;
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.particles = null;
    }
  }
}
