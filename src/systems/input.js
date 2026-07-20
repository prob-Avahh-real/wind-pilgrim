export class InputSystem {
  constructor() {
    this.move = { x: 0, y: 0 };
    this.keys = new Set();
    this.wantChirp = false;
    this.wantBoost = false;
    this.steer = { x: 0, y: 0 };
    this._bindKeyboard();
    this._bindJoystick();
    this._bindChirpBtn();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyF') this.wantChirp = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.wantBoost = true;
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  _bindJoystick() {
    const base = document.getElementById('stick-base');
    const knob = document.getElementById('stick-knob');
    if (!base || !knob) return;
    const maxR = 36;
    let active = false;
    let origin = { x: 0, y: 0 };

    const setKnob = (dx, dy) => {
      const len = Math.hypot(dx, dy) || 1;
      const cl = Math.min(len, maxR);
      const nx = (dx / len) * cl;
      const ny = (dy / len) * cl;
      knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
      this.move.x = nx / maxR;
      this.move.y = -ny / maxR;
    };

    const onDown = (e) => {
      active = true;
      const t = e.touches ? e.touches[0] : e;
      const rect = base.getBoundingClientRect();
      origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setKnob(t.clientX - origin.x, t.clientY - origin.y);
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!active) return;
      const t = e.touches ? e.touches[0] : e;
      setKnob(t.clientX - origin.x, t.clientY - origin.y);
      e.preventDefault();
    };
    const onUp = () => {
      active = false;
      knob.style.transform = 'translate(-50%, -50%)';
      this.move.x = 0;
      this.move.y = 0;
    };

    base.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    base.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }

  _bindChirpBtn() {
    document.getElementById('chirp-btn')?.addEventListener('pointerdown', () => {
      this.wantChirp = true;
    });
  }

  consumeChirp() {
    if (!this.wantChirp) return false;
    this.wantChirp = false;
    return true;
  }

  consumeBoost() {
    if (!this.wantBoost) return false;
    this.wantBoost = false;
    return true;
  }

  sample() {
    let x = this.move.x;
    let y = this.move.y;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;

    if (Math.abs(this.steer.x) > 0.08 || Math.abs(this.steer.y) > 0.08) {
      x += this.steer.x;
      y += -this.steer.y;
    }

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }
}
