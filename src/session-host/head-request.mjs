// head-request.mjs -- a head session asks the host for a verb through its one request socket.
//
// A confined head cannot reach herdr, so it cannot start another session itself, and it cannot write the rotation
// files either. Its own run supervisor listens on one socket that the sandbox gets read-only
// (`packages/run-supervisor/contracts/head-request.v1.json`), checks who asks and what the role may ask for, and runs
// the verb outside the sandbox through `fgos internal head-request`, which execs `runHeadRequest` below. Both ends of
// the transport live here: the client the head calls (`requestHead` and its three verbs), the one branch a caller
// uses per verb (`startHead`, `rotateHead`: through the socket when confined, otherwise straight into the use case)
// and the payload entry the supervisor's route child runs. `startHeadSession` stays the one place a head is started
// and `requestRotation` the one entry that asks for a rotation; the socket is only a way to reach them.

import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFINED_MARKER_ENV } from '../config/facade.mjs';
import { HEAD_REQUEST_SOCKET_ENV } from './head-grants.mjs';
import { headRoleOf, startHeadSession } from './head-start.mjs';
import { markSuccessorAnswered, requestRotation, rotationHolds } from '../session-rotation/rotate.mjs';

const PROTOCOL = 1;
const MAX_FRAME_BYTES = 65_536;
const HEAD_START_VERB = 'head start';
const HEAD_ROTATE_VERB = 'head rotate';
const HEAD_ANSWERED_VERB = 'head answered';
const HEAD_RESTORE_VERB = 'head restore role';
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

const confined = (env) => env[CONFINED_MARKER_ENV] === '1';

/**
 * The one door to start a head, whoever asks. A confined session (`FGOS_CONFINED=1`, which the launch door sets in
 * every sandboxed agent) sends the request through its socket; anyone else calls `startHeadSession` directly. The
 * confinement fact is that marker alone, never the socket variable or a masked path: a confined worker has no socket
 * and is refused `no-request-socket`. `args` is `{ persona, name, beside?, projectRoot? }`; `projectRoot` is used only
 * outside the sandbox (the supervisor starts a confined caller's head in its own project).
 */
export async function startHead({ persona, name, beside = null, projectRoot } = {}, { env = process.env, ports = {}, request = requestHeadStart } = {}) {
  if (confined(env)) {
    return request({ persona, name, ...(beside ? { beside } : {}) }, { socketPath: env[HEAD_REQUEST_SOCKET_ENV] });
  }
  return startHeadSession({ persona, name, beside, projectRoot }, ports);
}

/**
 * The one door to ask for a rotation, whoever asks: a confined head sends `head rotate` through its socket, anyone else
 * calls `requestRotation` directly (`projectRoot` is then required). Returns `{ started, ... }` as `requestRotation` does.
 */
export async function rotateHead({ persona, name, reason, stopFacts, projectRoot } = {}, { env = process.env, ports = {}, request = requestHeadRotate } = {}) {
  if (confined(env)) {
    return request({ persona, name, reason, ...(stopFacts ? { stopFacts } : {}) }, { socketPath: env[HEAD_REQUEST_SOCKET_ENV] });
  }
  return requestRotation({ persona, name, reason, stopFacts, projectRoot }, ports);
}

// ---- the payload entry the supervisor's route child runs ------------------------------------------

const emit = (line) => process.stdout.write(`${JSON.stringify({ v: 1, protocol: PROTOCOL, ...line })}\n`);

function readEnvelope(runDir) {
  const envelope = JSON.parse(fs.readFileSync(path.join(runDir, 'envelope.json'), 'utf8'));
  if (envelope?.v !== 3 || typeof envelope.cwd !== 'string' || envelope.session == null) throw Object.assign(new Error('the envelope is not a session attempt'), { code: 'envelope-invalid' });
  return envelope;
}

const badArgs = (message) => Object.assign(new Error(message), { code: 'bad-args' });

function exactKeys(args, allowed) {
  for (const key of Object.keys(args)) if (!allowed.includes(key)) throw badArgs(`unknown argument ${JSON.stringify(key)}`);
}

/** A lineage verb names `persona` and `name`; they must spell the envelope's own role, so a head acts on its lineage only. */
function ownLineage(args, envelope) {
  if (headRoleOf(args.persona, args.name) !== envelope.session.role) {
    throw Object.assign(new Error(`persona and name do not name this session's role ${envelope.session.role}`), { code: 'role-mismatch' });
  }
}

/**
 * Runs the verb of one request for the attempt in `runDir`, in this attempt's project: `head start`, `head rotate`,
 * `head answered` or `head restore role` (which only checks its arguments: the supervisor registers the role). Returns `{ exit, line }`: the one JSON line to print, `{result: 'done', data}` or
 * `{result: 'error', code, message}`, and the exit code (0 done, 70 error). Who may ask and for what was decided by
 * the supervisor before it ran this; the verb arguments are re-checked here because they come from the sandbox.
 * `head rotate` returns at once (the rotation runs detached); `head answered` is the one verb of a successor that does
 * not hold the role yet: it records the answer, and the supervisor moves the role after this line says done.
 */
export async function runHeadRequest({ runDir, request }, ports = {}) {
  try {
    const envelope = readEnvelope(runDir);
    const args = request?.args;
    if (args === null || typeof args !== 'object' || Array.isArray(args)) throw badArgs('args must be an object');
    const projectRoot = envelope.cwd;
    let data;
    switch (request?.verb) {
      case HEAD_START_VERB:
        exactKeys(args, ['persona', 'name', 'beside']);
        if (args.beside !== undefined && typeof args.beside !== 'string') throw badArgs('beside must be a string');
        data = await startHeadSession({ persona: args.persona, name: args.name, beside: args.beside ?? null, projectRoot }, {
          rotationHolds: (lineage) => rotationHolds({ projectRoot, ...lineage }), ...ports,
        });
        break;
      case HEAD_ROTATE_VERB: {
        exactKeys(args, ['persona', 'name', 'reason', 'stopFacts']);
        ownLineage(args, envelope);
        data = requestRotation({ persona: args.persona, name: args.name, reason: args.reason, stopFacts: args.stopFacts, projectRoot }, ports.rotation ?? {});
        break;
      }
      case HEAD_ANSWERED_VERB:
        exactKeys(args, ['persona', 'name', 'sessionId', 'rotationId', 'message']);
        ownLineage(args, envelope);
        data = markSuccessorAnswered({ projectRoot, persona: args.persona, name: args.name, key: envelope.unitRunId, sessionId: args.sessionId, rotationId: args.rotationId, message: args.message });
        break;
      case HEAD_RESTORE_VERB:
        exactKeys(args, ['persona', 'name']);
        ownLineage(args, envelope);
        data = {};
        break;
      default:
        throw Object.assign(new Error(`unknown verb ${JSON.stringify(request?.verb)}`), { code: 'unknown-verb' });
    }
    return { exit: 0, line: { result: 'done', data } };
  } catch (err) {
    return { exit: 70, line: { result: 'error', code: String(err?.code ?? 'internal'), message: String(err?.message ?? err).slice(0, 500) } };
  }
}

async function readStdin() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > MAX_FRAME_BYTES) throw new Error('the request is over the size limit');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  const at = process.argv.indexOf('--run-dir');
  const runDir = at > 0 ? process.argv[at + 1] : undefined;
  if (!runDir) {
    process.stderr.write('usage: head-request.mjs --run-dir <attemptDir>\n');
    process.exitCode = 2;
  } else {
    let request;
    try { request = await readStdin(); } catch (err) {
      emit({ result: 'error', code: 'bad-frame', message: String(err.message).slice(0, 500) });
      process.exitCode = 70;
    }
    if (request !== undefined) {
      const { exit, line } = await runHeadRequest({ runDir: path.resolve(runDir), request });
      emit(line);
      process.exitCode = exit;
    }
  }
}
