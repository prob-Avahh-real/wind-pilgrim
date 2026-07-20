import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = Number(process.env.PORT || 8787);

/** @type {Map<string, {ws: import('ws').WebSocket, anonId: string, chapter: number|null, peerId: string|null}>} */
const clients = new Map();
/** chapter -> anonIds waiting */
const queues = new Map();

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function dequeue(chapter, exceptId) {
  const q = queues.get(chapter);
  if (!q) return null;
  while (q.length) {
    const id = q.shift();
    if (id === exceptId) continue;
    const c = clients.get(id);
    if (c && !c.peerId && c.ws.readyState === 1 && c.chapter === chapter) return c;
  }
  return null;
}

function enqueue(chapter, anonId) {
  if (!queues.has(chapter)) queues.set(chapter, []);
  const q = queues.get(chapter);
  if (!q.includes(anonId)) q.push(anonId);
}

function leaveQueue(anonId) {
  for (const q of queues.values()) {
    const i = q.indexOf(anonId);
    if (i >= 0) q.splice(i, 1);
  }
}

function unpair(c) {
  if (!c?.peerId) return;
  const peer = clients.get(c.peerId);
  c.peerId = null;
  if (peer) {
    peer.peerId = null;
    send(peer.ws, { type: 'peer_left' });
  }
}

function tryMatch(c) {
  if (c.peerId || c.chapter == null) return;
  const other = dequeue(c.chapter, c.anonId);
  if (!other) {
    enqueue(c.chapter, c.anonId);
    send(c.ws, { type: 'queued' });
    return;
  }
  leaveQueue(c.anonId);
  leaveQueue(other.anonId);
  c.peerId = other.anonId;
  other.peerId = c.anonId;
  send(c.ws, { type: 'matched', peerId: other.anonId });
  send(other.ws, { type: 'matched', peerId: c.anonId });
}

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`wind-pilgrim matchmaker ok · ${clients.size} online\n`);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  const anonId = Math.random().toString(36).slice(2, 10);
  const client = { ws, anonId, chapter: null, peerId: null };
  clients.set(anonId, client);
  send(ws, { type: 'hello', anonId });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    switch (msg.type) {
      case 'enter': {
        const next = Number(msg.chapter) || 1;
        // Same chapter + already paired: keep companion
        if (client.peerId && client.chapter === next) break;
        unpair(client);
        leaveQueue(anonId);
        client.chapter = next;
        tryMatch(client);
        break;
      }
      case 'state': {
        if (!client.peerId) break;
        const peer = clients.get(client.peerId);
        if (peer) send(peer.ws, { type: 'state', state: msg.state });
        break;
      }
      case 'chirp': {
        if (!client.peerId) break;
        const peer = clients.get(client.peerId);
        if (peer) send(peer.ws, { type: 'chirp', pitch: msg.pitch ?? 1 });
        break;
      }
      default:
        break;
    }
  });

  ws.on('close', () => {
    unpair(client);
    leaveQueue(anonId);
    clients.delete(anonId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`wind-pilgrim matchmaker on :${PORT}`);
});
