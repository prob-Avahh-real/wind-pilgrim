const DEFAULT_URL = import.meta.env.VITE_WS_URL || `ws://${location.hostname || 'localhost'}:8787`;

export class NetClient {
  constructor({ onStatus, onMatched, onPeerLeft, onState, onChirp }) {
    this.url = DEFAULT_URL;
    this.onStatus = onStatus;
    this.onMatched = onMatched;
    this.onPeerLeft = onPeerLeft;
    this.onState = onState;
    this.onChirp = onChirp;
    this.ws = null;
    this.anonId = null;
    this.peerId = null;
    this.chapter = 1;
    this._sendTimer = 0;
    this.enabled = true;
    this._reconnectDelay = 1500;
  }

  connect() {
    if (!this.enabled) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.onStatus('离线朝圣');
      return;
    }

    this.ws.onopen = () => this.onStatus('寻路人…');
    this.ws.onclose = () => {
      this.peerId = null;
      this.onStatus('离线朝圣');
      setTimeout(() => this.connect(), this._reconnectDelay);
    };
    this.ws.onerror = () => this.onStatus('离线朝圣');
    this.ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      this._handle(msg);
    };
  }

  _send(obj) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }

  _handle(msg) {
    switch (msg.type) {
      case 'hello':
        this.anonId = msg.anonId;
        this.enter(this.chapter);
        break;
      case 'matched':
        this.peerId = msg.peerId;
        this.onStatus('同行 · 匿名旅人');
        this.onMatched(msg.peerId);
        break;
      case 'peer_left':
        this.peerId = null;
        this.onStatus('寻路人…');
        this.onPeerLeft();
        break;
      case 'state':
        this.onState(msg.state);
        break;
      case 'chirp':
        this.onChirp(msg.pitch ?? 1);
        break;
      case 'queued':
        if (!this.peerId) this.onStatus('寻路人…');
        break;
      default:
        break;
    }
  }

  /** Match by chapter only — stay paired across zones within a chapter. */
  enter(chapter) {
    const next = Number(chapter) || 1;
    if (this.chapter === next && this.peerId) return;
    const chapterChanged = this.chapter !== next;
    this.chapter = next;
    if (chapterChanged) this.peerId = null;
    this._send({ type: 'enter', chapter: next });
  }

  maybeSendState(dt, state) {
    this._sendTimer += dt;
    if (this._sendTimer < 1 / 12) return;
    this._sendTimer = 0;
    if (!this.peerId) return;
    this._send({ type: 'state', state });
  }

  chirp(pitch) {
    this._send({ type: 'chirp', pitch });
  }
}
