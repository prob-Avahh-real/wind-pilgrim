import * as THREE from 'three';

/** Remote pilgrim with interpolation + scarf. */
export class Companion {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    const mat = new THREE.MeshStandardMaterial({ color: 0xa83228, roughness: 0.85 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.7, 4, 8), mat);
    body.position.y = 0.9;
    this.group.add(body);

    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat,
    );
    hood.position.set(0, 1.45, 0.05);
    hood.rotation.x = 0.35;
    this.group.add(hood);

    this.scarfMeshes = [];
    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0xe8c898,
      roughness: 0.55,
      emissive: 0x442200,
      emissiveIntensity: 0.2,
    });
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.06 - i * 0.004, 6, 6), scarfMat);
      m.position.set(0, 1.15, -0.25 - i * 0.14);
      this.group.add(m);
      this.scarfMeshes.push(m);
    }

    this.target = new THREE.Vector3();
    this.yaw = 0;
    this.energy = 0.4;
    this.gliding = false;
    this.present = false;
    this.lastSeen = 0;
    this.position = this.group.position;
  }

  show() {
    this.present = true;
    this.group.visible = true;
    this.lastSeen = performance.now();
  }

  hide() {
    this.present = false;
    this.group.visible = false;
  }

  applyState(s) {
    this.target.set(s.x, s.y, s.z);
    this.yaw = s.yaw;
    this.energy = s.energy ?? this.energy;
    this.gliding = !!s.gliding;
    this.show();
    if (this.group.position.lengthSq() < 0.01) this.group.position.copy(this.target);
  }

  update(dt) {
    if (!this.present) return;
    if (performance.now() - this.lastSeen > 4000) {
      this.hide();
      return;
    }
    this.group.position.lerp(this.target, 1 - Math.exp(-10 * dt));
    const cur = this.group.rotation.y;
    let diff = this.yaw - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.group.rotation.y = cur + diff * (1 - Math.exp(-10 * dt));
    this.group.rotation.x = THREE.MathUtils.lerp(
      this.group.rotation.x,
      this.gliding ? -0.25 : 0,
      1 - Math.exp(-6 * dt),
    );

    const len = 4 + Math.floor(this.energy * 4);
    const t = performance.now() * 0.003;
    for (let i = 0; i < this.scarfMeshes.length; i++) {
      const m = this.scarfMeshes[i];
      m.visible = i < len;
      m.position.set(
        Math.sin(t + i) * 0.08 * (1 + this.energy),
        1.15 - i * 0.02,
        -0.25 - i * (0.12 + this.energy * 0.06),
      );
    }
  }
}
