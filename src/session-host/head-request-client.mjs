// head-request-client.mjs -- the client end of a head session's request socket, and nothing else.
//
// A leaf: the request socket's frame codec, the one `requestHead` call and its four verbs. `head-request.mjs` (the
// supervisor's route entry and the per-verb branches) and `rotate.mjs` (which asks the old head's supervisor to restore
// its role) both import it, so neither imports the other.

import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import { HEAD_REQUEST_SOCKET_ENV } from './head-grants.mjs';

export const PROTOCOL = 1;
export const MAX_FRAME_BYTES = 65_536;
export const HEAD_START_VERB = 'head start';
export const HEAD_ROTATE_VERB = 'head rotate';
export const HEAD_ANSWERED_VERB = 'head answered';
export const HEAD_RESTORE_VERB = 'head restore role';
/** A reply may take as long as the supervisor lets the verb run (60 s) plus its own overhead. */
const DEFAULT_REPLY_TIMEOUT_MS = 70_000;

export class HeadRequestError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'HeadRequestError';
    this.code = code;
    Object.assign(this, extra);
  }
}

// ---- the client ---------------------------------------------------------------------------------

function encodeFrame(frame) {
  const body = Buffer.from(JSON.stringify(frame), 'utf8');
  if (body.length > MAX_FRAME_BYTES) throw new HeadRequestError('request-too-large', `a request frame is at most ${MAX_FRAME_BYTES} bytes`);
  const head = Buffer.alloc(4);
  head.writeUInt32BE(body.length);
  return Buffer.concat([head, body]);
}

/** One frame off `buffer`, or null while it is partial. Throws on a length or body the contract refuses. */
function decodeFrame(buffer) {
  if (buffer.length < 4) return null;
  const length = buffer.readUInt32BE(0);
  if (length > MAX_FRAME_BYTES) throw new HeadRequestError('bad-reply', 'the reply frame is over the size limit');
  if (buffer.length < 4 + length) return null;
  let frame;
  try { frame = JSON.parse(buffer.subarray(4, 4 + length).toString('utf8')); } catch { frame = null; }
  if (frame === null || typeof frame !== 'object' || Array.isArray(frame)) throw new HeadRequestError('bad-reply', 'the reply frame is not one JSON object');
  return frame;
}

/**
 * Asks for `verb` over the request socket and returns its `data`. A refusal throws `HeadRequestError` with the
 * supervisor's code (`verb-not-granted`, `role-not-held`, `busy`, `verb-failed` with the entry's own code in `detail`,
 * ...); a socket that is gone is `request-socket-unavailable`. The socket file must belong to this user.
 */
export function requestHead(verb, args, { socketPath = process.env[HEAD_REQUEST_SOCKET_ENV], timeoutMs = DEFAULT_REPLY_TIMEOUT_MS } = {}) {
  if (typeof socketPath !== 'string' || socketPath === '') {
    return Promise.reject(new HeadRequestError('no-request-socket', `${HEAD_REQUEST_SOCKET_ENV} is not set: this session has no request socket, so it holds no verbs`));
  }
  let stat;
  try { stat = fs.statSync(socketPath); } catch (err) {
    return Promise.reject(new HeadRequestError('request-socket-unavailable', `the request socket ${socketPath} is gone (${err.code ?? err.message}); its supervisor has ended, restart this session`));
  }
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) {
    return Promise.reject(new HeadRequestError('request-socket-foreign', `the request socket ${socketPath} is not owned by this user`));
  }
  const id = crypto.randomBytes(8).toString('hex');
  const request = encodeFrame({ type: 'REQUEST', id, verb, args });
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);
    let received = Buffer.alloc(0);
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      fn(value);
    };
    const timer = setTimeout(() => finish(reject, new HeadRequestError('reply-timeout', `no reply within ${timeoutMs} ms`)), timeoutMs);
    socket.on('connect', () => socket.write(request));
    socket.on('data', (chunk) => {
      received = Buffer.concat([received, chunk]);
      let reply;
      try { reply = decodeFrame(received); } catch (err) { finish(reject, err); return; }
      if (reply === null) return;
      if (reply.type !== 'REPLY' || (reply.id !== id && reply.id !== null)) {
        finish(reject, new HeadRequestError('bad-reply', `unexpected reply ${JSON.stringify({ type: reply.type, id: reply.id })}`));
      } else if (reply.result === 'done') {
        finish(resolve, reply.data ?? {});
      } else {
        finish(reject, new HeadRequestError(String(reply.code ?? 'refused'), `${verb} was refused: ${reply.code ?? 'no code'}${reply.detail ? ` (${reply.detail})` : ''}`, { detail: reply.detail ?? null }));
      }
    });
    socket.on('error', (err) => finish(reject, new HeadRequestError('request-socket-unavailable', `the request socket ${socketPath} did not answer (${err.code ?? err.message})`)));
    socket.on('close', () => finish(reject, new HeadRequestError('bad-reply', 'the supervisor closed the connection without a reply')));
  });
}

/** `head start` over the socket. */
export const requestHeadStart = (args, options) => requestHead(HEAD_START_VERB, args, options);
/** `head rotate` over the socket: the old head asks for its own rotation; `args` is `{ persona, name, reason, stopFacts? }`. */
export const requestHeadRotate = (args, options) => requestHead(HEAD_ROTATE_VERB, args, options);
/** `head answered` over the socket: the successor reports its first turn; `args` is `{ persona, name, sessionId, rotationId, message }`. */
export const requestHeadAnswered = (args, options) => requestHead(HEAD_ANSWERED_VERB, args, options);

/** `head restore role` over the socket: asks that head's supervisor to register its role again (the effect is the supervisor's). */
export const requestHeadRestoreRole = (args, options) => requestHead(HEAD_RESTORE_VERB, args, options);
