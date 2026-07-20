/**
 * Wearable input — ring steers; cane chirps / boosts.
 */
export class WearableInput {
  /**
   * @param {{
   *   onGesture: (gesture: string, detail?: object) => void,
   *   onBadge?: (kind: string, text: string, active: boolean) => void
   * }} opts
   */
  constructor(opts) {
    this.onGesture = opts.onGesture;
    this.onBadge = opts.onBadge ?? (() => {});
    this.ringActive = false;
    this.caneActive = false;
    this.ringFrame = 0;
    this.caneFrame = 0;
    this.ringPrevBeta = null;
    this.ringPrevGamma = null;
    this.caneLastAccel = { x: 0, y: 0, z: 0 };
    this.canePrevGamma = null;
    this.lastHitAt = 0;
  }

  setupRing() {
    if (typeof DeviceOrientationEvent === 'undefined') return;
    this.onBadge('ring', '戒指 · 点击启用', false);

    const enable = async () => {
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm !== 'granted') return;
        }
        this.ringActive = true;
        this.onBadge('ring', '戒指 · 已连接', true);
        window.addEventListener('deviceorientation', (e) => this.handleRing(e));
      } catch {
        this.onBadge('ring', '戒指 · 不支持', false);
      }
    };

    document.getElementById('ring-badge')?.addEventListener('click', enable, { once: true });
    if (typeof DeviceOrientationEvent.requestPermission !== 'function') enable();
  }

  setupCane() {
    if (typeof DeviceMotionEvent === 'undefined') return;
    this.onBadge('cane', '手杖 · 点击启用', false);

    const enable = async () => {
      try {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          const perm = await DeviceMotionEvent.requestPermission();
          if (perm !== 'granted') return;
        }
        this.caneActive = true;
        this.onBadge('cane', '手杖 · 已连接', true);
        window.addEventListener('devicemotion', (e) => this.handleCane(e));
      } catch {
        this.onBadge('cane', '手杖 · 不支持', false);
      }
    };

    document.getElementById('cane-badge')?.addEventListener('click', enable, { once: true });
    if (typeof DeviceMotionEvent.requestPermission !== 'function') enable();
  }

  handleRing(e) {
    if (!this.ringActive) return;
    this.ringFrame++;

    const beta = e.beta || 0;
    const gamma = e.gamma || 0;

    if (this.ringFrame % 2 === 0) {
      const x = clamp(gamma / 35, -1, 1);
      const y = clamp((beta - 45) / 35, -1, 1);
      this.onGesture('steer', { x, y });
    }

    if (this.ringFrame % 8 !== 0) return;
    if (this.ringPrevBeta === null) {
      this.ringPrevBeta = beta;
      this.ringPrevGamma = gamma;
      return;
    }

    const dBeta = beta - this.ringPrevBeta;
    const dGamma = gamma - this.ringPrevGamma;
    this.ringPrevBeta = beta;
    this.ringPrevGamma = gamma;

    if (Math.abs(dBeta) > 20 || Math.abs(dGamma) > 20) {
      this.onGesture('shake', {});
    }
  }

  handleCane(e) {
    if (!this.caneActive) return;
    this.caneFrame++;
    if (this.caneFrame % 6 !== 0) return;

    const a = e.accelerationIncludingGravity || e.acceleration || { x: 0, y: 0, z: 0 };
    const dax = Math.abs((a.x || 0) - this.caneLastAccel.x);
    const day = Math.abs((a.y || 0) - this.caneLastAccel.y);
    const daz = Math.abs((a.z || 0) - this.caneLastAccel.z);
    this.caneLastAccel = { x: a.x || 0, y: a.y || 0, z: a.z || 0 };

    if (dax > 8 || day > 8 || daz > 8) {
      const now = Date.now();
      if (now - this.lastHitAt < 220) return;
      this.lastHitAt = now;
      this.onGesture('chirp', { pitch: Math.min(1.25, Math.max(dax, day, daz) / 14) });
      return;
    }

    const rot = e.rotationRate || { gamma: 0 };
    const gamma = rot.gamma || 0;
    if (this.canePrevGamma !== null && Math.abs(gamma - this.canePrevGamma) > 3) {
      const now = Date.now();
      if (now - this.lastHitAt < 180) {
        this.canePrevGamma = gamma;
        return;
      }
      this.lastHitAt = now;
      this.onGesture('boost', { velocity: Math.min(1.2, Math.abs(gamma - this.canePrevGamma) / 12) });
    }
    this.canePrevGamma = gamma;
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
