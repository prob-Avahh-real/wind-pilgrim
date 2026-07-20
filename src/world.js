import * as THREE from 'three';

export class World {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./chapters/index.js').ChapterDef} chapter
   */
  constructor(scene, chapter) {
    this.scene = scene;
    this.chapter = chapter;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.glyphs = [];
    this.pillars = [];
    this.checkpoints = [];
    this.activeCheckpoint = null;
    this.goalMesh = null;
    this._build();
  }

  dispose() {
    this.scene.remove(this.root);
    this.root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }

  _build() {
    const ch = this.chapter;
    const sandMat = new THREE.MeshStandardMaterial({
      color: ch.sand,
      roughness: 0.95,
      flatShading: true,
    });

    const geo = new THREE.PlaneGeometry(120, 140, 64, 64);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, ch.heightFn(x, z));
    }
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, sandMat);
    ground.receiveShadow = true;
    this.root.add(ground);

    // Soft dunes / rocks
    for (let i = 0; i < 18; i++) {
      const r = new THREE.Mesh(
        new THREE.ConeGeometry(1.5 + Math.random() * 2, 2 + Math.random() * 3, 5),
        new THREE.MeshStandardMaterial({ color: ch.sand, roughness: 1, flatShading: true }),
      );
      const x = (Math.random() - 0.5) * 70;
      const z = (Math.random() - 0.5) * 90;
      r.position.set(x, ch.heightFn(x, z), z);
      r.rotation.y = Math.random() * Math.PI;
      r.castShadow = true;
      this.root.add(r);
    }

    const glyphMat = new THREE.MeshStandardMaterial({
      color: 0xf4d6a0,
      emissive: 0xaa7722,
      emissiveIntensity: 0.65,
      roughness: 0.4,
    });
    for (const g of ch.glyphs) {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), glyphMat.clone());
      const y = ch.heightFn(g.x, g.z) + 1.1;
      mesh.position.set(g.x, y, g.z);
      mesh.userData.taken = false;
      mesh.userData.baseY = y;
      this.root.add(mesh);
      this.glyphs.push(mesh);
    }

    if (ch.pillars) {
      const pMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.9, flatShading: true });
      const clothMat = new THREE.MeshStandardMaterial({
        color: 0xc23b2a,
        roughness: 0.7,
        side: THREE.DoubleSide,
        emissive: 0x3a1008,
        emissiveIntensity: 0.15,
      });
      for (const p of ch.pillars) {
        const h = 4 + Math.random() * 3;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 1.2), pMat.clone());
        mesh.position.set(p.x, ch.heightFn(p.x, p.z) + h / 2, p.z);
        mesh.castShadow = true;
        mesh.userData.activated = false;
        this.root.add(mesh);
        this.pillars.push(mesh);

        // Cloth banners (wind-bridge feel)
        if (ch.id === 2 || ch.id === 4) {
          const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.2, 1, 4), clothMat.clone());
          cloth.position.set(p.x + 0.8, ch.heightFn(p.x, p.z) + h * 0.55, p.z);
          cloth.userData.banner = true;
          cloth.userData.baseX = cloth.rotation.x;
          this.root.add(cloth);
        }
      }
    }

    const cpMat = new THREE.MeshStandardMaterial({
      color: 0xd4b896,
      emissive: 0x886644,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.7,
    });
    for (const cp of ch.checkpoints || []) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 6, 20), cpMat.clone());
      const y = ch.heightFn(cp.x, cp.z) + 0.15;
      ring.position.set(cp.x, y, cp.z);
      ring.rotation.x = Math.PI / 2;
      ring.userData = {
        activated: false,
        x: cp.x,
        z: cp.z,
        yaw: ch.id === 7 ? 0 : Math.PI,
      };
      this.root.add(ring);
      this.checkpoints.push(ring);
    }
    // Spawn is always the first checkpoint
    if (this.checkpoints[0]) {
      this.checkpoints[0].userData.activated = true;
      this.checkpoints[0].material.emissiveIntensity = 0.7;
      this.checkpoints[0].material.color.setHex(0xffe6a8);
      this.activeCheckpoint = this.checkpoints[0].userData;
    }

    const goalMat = new THREE.MeshStandardMaterial({
      color: 0xffe6a8,
      emissive: 0xffcc66,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    this.goalMesh = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 8, 32), goalMat);
    const gy = ch.heightFn(ch.goal.x, ch.goal.z) + 2.2;
    this.goalMesh.position.set(ch.goal.x, gy, ch.goal.z);
    this.goalMesh.rotation.x = Math.PI / 2;
    this.root.add(this.goalMesh);

    const lightCol = new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.25 });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1.4, 6, 12, 1, true), lightCol);
    beam.position.set(ch.goal.x, gy + 2, ch.goal.z);
    this.root.add(beam);
  }

  heightAt(x, z) {
    return this.chapter.heightFn(x, z);
  }

  wind(x, z) {
    const s = this.chapter.windScale;
    const t = performance.now() * 0.001;
    // Chapter 5 blizzard pushes backward hard
    const back = this.chapter.id === 5 ? 4.5 * s : 0;
    // Shelter near pillars
    let shelter = 1;
    for (const p of this.pillars) {
      if (p.position.distanceTo(new THREE.Vector3(x, p.position.y, z)) < 4) shelter = 0.25;
    }
    return {
      x: Math.sin(t + z * 0.05) * 1.2 * s * shelter,
      z: (-0.8 * s - back) * shelter + Math.cos(t * 0.7) * 0.4 * s,
      lift: (this.chapter.id === 2 || this.chapter.id === 6 ? 3.2 : 1.4) * s * (0.5 + shelter * 0.5),
    };
  }

  get bounds() {
    return this.chapter.bounds;
  }

  update(dt, player) {
    const t = performance.now() * 0.001;
    this.root.traverse((o) => {
      if (o.userData?.banner) {
        o.rotation.y = Math.sin(t * 2 + o.position.x) * 0.35;
        o.rotation.z = Math.sin(t * 3 + o.position.z) * 0.15;
      }
    });

    for (const g of this.glyphs) {
      if (g.userData.taken) continue;
      g.rotation.y += dt * 1.5;
      g.position.y = g.userData.baseY + Math.sin(performance.now() * 0.003 + g.position.x) * 0.15;
      if (g.position.distanceTo(player.position) < 1.6) {
        g.userData.taken = true;
        g.visible = false;
        player.addEnergy(0.22);
      }
    }

    // Chirp near pillars activates & grants energy (chapter 4 focus)
    if (player.chirpPulse > 0) {
      for (const p of this.pillars) {
        if (p.userData.activated) continue;
        if (p.position.distanceTo(player.position) < 5) {
          p.userData.activated = true;
          p.material.emissive = new THREE.Color(0xffaa44);
          p.material.emissiveIntensity = 0.5;
          player.addEnergy(0.28);
        }
      }
    }

    let newlyActivated = null;
    for (const cp of this.checkpoints) {
      cp.rotation.z += dt * 0.5;
      const dx = player.position.x - cp.position.x;
      const dz = player.position.z - cp.position.z;
      if (!cp.userData.activated && Math.hypot(dx, dz) < 1.8) {
        cp.userData.activated = true;
        cp.material.emissiveIntensity = 0.75;
        cp.material.color.setHex(0xffe6a8);
        this.activeCheckpoint = cp.userData;
        newlyActivated = cp;
        player.addEnergy(0.08);
      }
    }

    if (this.goalMesh) {
      this.goalMesh.rotation.z += dt * 0.8;
      this.goalMesh.material.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.3;
    }

    return newlyActivated;
  }

  /** Fall off map / void → last checkpoint. */
  needsRespawn(player) {
    const ground = this.heightAt(player.position.x, player.position.z);
    if (player.position.y < ground - 12) return true;
    if (player.position.y < -25) return true;
    const b = this.bounds;
    // Soft kill if stuck far outside after clamp failures
    if (
      player.position.x < b.minX - 2 ||
      player.position.x > b.maxX + 2 ||
      player.position.z < b.minZ - 2 ||
      player.position.z > b.maxZ + 2
    ) {
      return true;
    }
    return false;
  }

  respawnPlayer(player) {
    const cp = this.activeCheckpoint || {
      x: this.chapter.spawn.x,
      z: this.chapter.spawn.z,
      yaw: this.chapter.id === 7 ? 0 : Math.PI,
    };
    const y = this.heightAt(cp.x, cp.z);
    player.velocity.set(0, 0, 0);
    player.gliding = false;
    player.setPose(cp.x, y, cp.z, cp.yaw ?? Math.PI);
    player.energy = Math.max(player.energy, 0.25);
  }

  /** Nearby companion chirp gifts a little scarf energy. */
  shareChirpEnergy(player, companion) {
    if (!companion?.present) return false;
    if (player.position.distanceTo(companion.position) > 10) return false;
    player.addEnergy(0.12);
    return true;
  }

  reachedGoal(player) {
    if (!this.goalMesh) return false;
    const dx = player.position.x - this.goalMesh.position.x;
    const dz = player.position.z - this.goalMesh.position.z;
    return Math.hypot(dx, dz) < 2.4;
  }
}
