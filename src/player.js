import * as THREE from 'three';

const CLOTH = 0xc23b2a;
const TRIM = 0xf0d7a8;

export class Player {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.7, 4, 8),
      new THREE.MeshStandardMaterial({ color: CLOTH, roughness: 0.85 }),
    );
    body.position.y = 0.9;
    body.castShadow = true;
    this.group.add(body);

    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: CLOTH, roughness: 0.9 }),
    );
    hood.position.set(0, 1.45, 0.05);
    hood.rotation.x = 0.35;
    this.group.add(hood);

    this.scarfPoints = [];
    this.scarfMeshes = [];
    this.scarfMax = 14;
    const scarfMat = new THREE.MeshStandardMaterial({ color: TRIM, roughness: 0.6, emissive: 0x331100, emissiveIntensity: 0.15 });
    for (let i = 0; i < this.scarfMax; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07 - i * 0.003, 6, 6), scarfMat);
      m.castShadow = true;
      this.group.add(m);
      this.scarfMeshes.push(m);
      this.scarfPoints.push({
        pos: new THREE.Vector3(0, 1.2, -0.2 - i * 0.18),
        prev: new THREE.Vector3(0, 1.2, -0.2 - i * 0.18),
      });
    }

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.energy = 0.35;
    this.maxEnergy = 1;
    this.gliding = false;
    this.onGround = true;
    this.chirpPulse = 0;
    this.groundY = 0;
  }

  setPose(x, y, z, yaw) {
    this.position.set(x, y, z);
    this.yaw = yaw;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
  }

  addEnergy(n) {
    this.energy = Math.min(this.maxEnergy, this.energy + n);
  }

  tryGlide() {
    if (this.energy < 0.12) return false;
    this.gliding = true;
    return true;
  }

  /**
   * @param {number} dt
   * @param {{x:number,y:number}} move
   * @param {{ heightAt:(x:number,z:number)=>number, wind:(x:number,z:number)=>{x:number,z:number,lift:number}, bounds:{minX:number,maxX:number,minZ:number,maxZ:number} }} world
   * @param {boolean} boost
   */
  update(dt, move, world, boost) {
    if (boost) this.tryGlide();

    const speed = this.gliding ? 9.5 : 5.2;
    const turn = move.x * 2.4 * dt;
    this.yaw -= turn;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const wish = forward.multiplyScalar(move.y * speed);

    if (this.gliding) {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, wish.x, 1 - Math.exp(-3 * dt));
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, wish.z, 1 - Math.exp(-3 * dt));
      this.energy = Math.max(0, this.energy - dt * 0.18);
      const wind = world.wind(this.position.x, this.position.z);
      this.velocity.x += wind.x * dt;
      this.velocity.z += wind.z * dt;
      this.velocity.y += (wind.lift - 2.2) * dt;
      if (this.energy <= 0.01) this.gliding = false;
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, wish.x, 1 - Math.exp(-8 * dt));
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, wish.z, 1 - Math.exp(-8 * dt));
      this.velocity.y -= 18 * dt;
    }

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.position.y += this.velocity.y * dt;

    const b = world.bounds;
    this.position.x = THREE.MathUtils.clamp(this.position.x, b.minX, b.maxX);
    this.position.z = THREE.MathUtils.clamp(this.position.z, b.minZ, b.maxZ);

    this.groundY = world.heightAt(this.position.x, this.position.z);
    if (this.position.y <= this.groundY) {
      this.position.y = this.groundY;
      this.velocity.y = 0;
      this.onGround = true;
      this.gliding = false;
    } else {
      this.onGround = false;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
    if (this.gliding) this.group.rotation.x = -0.25;
    else this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, 0, 1 - Math.exp(-6 * dt));

    this._updateScarf(dt);
    if (this.chirpPulse > 0) this.chirpPulse = Math.max(0, this.chirpPulse - dt);
  }

  _updateScarf(dt) {
    const active = Math.max(5, Math.floor(5 + this.energy * (this.scarfMax - 5)));
    const anchor = new THREE.Vector3(0, 1.25, -0.15);
    anchor.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    anchor.add(this.position);

    const windPull = new THREE.Vector3(
      Math.sin(performance.now() * 0.002 + this.yaw) * (0.4 + this.energy),
      this.gliding ? 0.15 : -0.2,
      Math.cos(performance.now() * 0.002 + this.yaw) * (0.4 + this.energy),
    );

    for (let i = 0; i < this.scarfPoints.length; i++) {
      const mesh = this.scarfMeshes[i];
      mesh.visible = i < active;
      if (i >= active) continue;

      const p = this.scarfPoints[i];
      const target = i === 0 ? anchor : this.scarfPoints[i - 1].pos;
      const temp = p.pos.clone();
      p.pos.add(p.pos.clone().sub(p.prev).multiplyScalar(0.92));
      p.pos.y -= 2.5 * dt;
      p.pos.add(windPull.clone().multiplyScalar(dt * (0.3 + i * 0.05)));
      const diff = p.pos.clone().sub(target);
      const dist = diff.length() || 0.001;
      const rest = 0.14 + this.energy * 0.04;
      if (dist > rest) p.pos.copy(target.clone().add(diff.multiplyScalar(rest / dist)));
      p.prev.copy(temp);
      mesh.position.copy(p.pos.clone().sub(this.position));
      mesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.yaw);
    }
  }

  netState() {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      yaw: this.yaw,
      energy: this.energy,
      gliding: this.gliding,
    };
  }
}
