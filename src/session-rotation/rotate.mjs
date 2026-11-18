// rotate.mjs -- replaces a long-lived head session by a fresh one in two steps, never one.
//
// The successor is started next to the old session (`placeHead`, the one launch path of a head) while the old one
// still holds the role. The successor takes the role only by answering: its own hook reports its first turn through
// the request socket (`head answered`), which lands in `markSuccessorAnswered` below, and its own supervisor then moves
// the role in Identity. The executor ends the old session only after it sees the answer on disk, Identity naming the
// successor as the holder, and the answer naming the question the old session had pending. A session is ended by asking
// its own supervisor to stop it (`cancel-requested.json`): the supervisor stops the agent and its release step closes
// the pane, which the Session Host's `retire` cannot do while an agent is the pane's foreground. Any failure ends the
// successor and leaves the old session alone, with one incident line under the lineage folder.
//
// Authority: Identity alone says who holds the role; this module owns the two-step replacement and the lineage files;
// the run supervisor only transports the verbs that reach it (`head-request.mjs`); `placeHead` starts the head.
//
// Files under `.fgos/runtime/session-rotation/<persona>-<name>/` (the folder the handoffs and the placement live in):
// `rotation.json` (the pending rotation: its id, successor key and generation, reason, the old session, its pending question),
// `answered.json` (the successor's first answer), `incidents.jsonl`, `rotation.log`, and `request-<id>.json` while a
// request waits for its executor. One lock per lineage (`session-rotation`) admits one rotation at a time.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { replaceDurably } from '../native/door.mjs';
import { readConfig } from '../config/facade.mjs';
import { acquireSync, createLockScope, probe } from '../holder-lock/index.mjs';
import { requestCancel } from '../run-supervisor/cancel-registry.mjs';
import {
  assertHeadArgs, headKeyOf, headRoleOf, identityHolder, lineageDirOf, nextHeadGeneration, placeHead, readHeadPlacement, writeHeadPlacement,
} from '../session-host/head-start.mjs';
import { spawnDetachedCli } from '../util/spawn-detached-fgos.mjs';
import { redactText, writeHandoff } from './handoff-store.mjs';

export const ROTATION_REASONS = Object.freeze(['soft', 'hard', 'manual']);
export const ROTATION_LOCK = 'session-rotation';
const ENTRY = fileURLToPath(import.meta.url);
const FILE_MODE = 0o600;
const POLL_MS = 1000;
const MAX_TEXT = 8000;
const MAX_LIST = 50;
const DEFAULT_ANSWER_WAIT_MS = 120_000;
const STOP_FACT_KEYS = ['sessionId', 'portfolio', 'delta', 'lastAssistantMessage', 'pendingQuestion'];

export class RotationError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'RotationError';
    this.code = code;
    Object.assign(this, extra);
  }
}

const fail = (code, message) => { throw new RotationError(code, message); };

/** `{ sessionId?, portfolio?, delta?, lastAssistantMessage?, pendingQuestion? }` checked and bounded; anything else is refused. */
export function checkStopFacts(facts) {
  if (facts === undefined || facts === null) return {};
  if (typeof facts !== 'object' || Array.isArray(facts)) fail('bad-stop-facts', 'stopFacts must be an object');
  const out = {};
  for (const [key, value] of Object.entries(facts)) {
    if (!STOP_FACT_KEYS.includes(key)) fail('bad-stop-facts', `unknown stop fact ${JSON.stringify(key)}`);
    if (key === 'portfolio') {
      if (!Array.isArray(value) || value.length > MAX_LIST || value.some((p) => typeof p !== 'string' || p === '' || p.length > 300)) fail('bad-stop-facts', `portfolio must be at most ${MAX_LIST} paths`);
    } else if (value !== null && (typeof value !== 'string' || value.length > MAX_TEXT)) {
      fail('bad-stop-facts', `${key} must be a string of at most ${MAX_TEXT} characters`);
    }
    out[key] = value;
  }
  return out;
}

function checkRequest({ persona, name, reason, stopFacts, projectRoot }) {
  try { assertHeadArgs({ persona, name, projectRoot }); } catch (err) { fail(err.code ?? 'bad-args', err.message); }
  if (!ROTATION_REASONS.includes(reason)) fail('bad-reason', `reason must be one of ${ROTATION_REASONS.join(', ')}, got ${JSON.stringify(reason)}`);
  return { persona, name, reason, projectRoot, stopFacts: checkStopFacts(stopFacts) };
}

// ---- the token the answer must echo ---------------------------------------------------------------

const ROTATION_ID_PREFIX = 'Rotation id: ';
const ROTATION_ID_PATTERN = /^[a-f0-9]{16}$/;

/** The line of a handoff that carries the rotation id; the successor reads its id from it and echoes it exactly. */
export const rotationIdLine = (id) => `${ROTATION_ID_PREFIX}${id}`;

/** The rotation id a handoff text carries, or null. */
export function rotationIdOf(handoffText) {
  const match = new RegExp(`^${ROTATION_ID_PREFIX}([a-f0-9]{16})$`, 'm').exec(String(handoffText));
  return match ? match[1] : null;
}

// ---- lineage files ---------------------------------------------------------------------------------

const readJson = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) {
    if (err.code === 'ENOENT' || err instanceof SyntaxError) return null;
    throw err;
  }
};
const writeJson = (dir, file, value) => {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  replaceDurably(dir, file, `${JSON.stringify(value)}\n`, FILE_MODE);
};
const incident = (dir, line) => {
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.appendFileSync(path.join(dir, 'incidents.jsonl'), `${JSON.stringify({ at: new Date().toISOString(), ...line })}\n`, { mode: FILE_MODE });
  } catch { /* the incident line is best effort; the returned reason is the record that matters */ }
};

// ---- the successor's answer ------------------------------------------------------------------------

/**
 * Records the first answer of the successor, the one fact the executor waits for. Called through the request socket
 * (`head answered`) with the successor's own `key` (its attempt's unit run id, from the envelope, never from the
 * sandbox). Refused `no-rotation-pending` when this lineage has no rotation waiting for that key (the executor removes
 * `rotation.json` before it gives up, so a late answer is refused), and `answer-mismatch` when `rotationId` is not
 * exactly the pending rotation's id; the role does not move in either case. This is the one place the answer is
 * checked. `{ sessionId, rotationId, message }` are the successor's Identity session id, the id it read from its
 * handoff (`rotationIdLine`) and its last assistant message, kept as evidence.
 */
export function markSuccessorAnswered({ projectRoot, persona, name, key, sessionId, rotationId, message }, { now = () => new Date() } = {}) {
  try { assertHeadArgs({ persona, name, projectRoot }); } catch (err) { fail(err.code ?? 'bad-args', err.message); }
  if (typeof sessionId !== 'string' || sessionId === '' || sessionId.length > 200) fail('bad-args', 'sessionId must be a non-empty string');
  if (typeof rotationId !== 'string' || !ROTATION_ID_PATTERN.test(rotationId)) fail('bad-args', 'rotationId must be the 16 hex characters of the handoff\'s rotation id line');
  if (typeof message !== 'string' || message.trim() === '' || message.length > MAX_TEXT) fail('bad-args', `message must be a non-empty string of at most ${MAX_TEXT} characters`);
  const dir = lineageDirOf(projectRoot, persona, name);
  const pending = readJson(path.join(dir, 'rotation.json'));
  if (!pending || pending.successorKey !== key) fail('no-rotation-pending', `${headRoleOf(persona, name)} has no rotation waiting for ${key}`);
  if (rotationId !== pending.id) fail('answer-mismatch', 'rotationId is not the id of the pending rotation');
  const record = { gen: pending.gen, key, sessionId, message: redactText(message), answeredAt: now().toISOString() };
  writeJson(dir, 'answered.json', record);
  return { accepted: true, gen: pending.gen };
}

// ---- default ports ---------------------------------------------------------------------------------

const lockParams = (projectRoot, persona, name) => ({ fgosDir: path.join(projectRoot, '.fgos'), id: `${persona}-${name}` });

/** Whether a rotation of this lineage holds its lock right now (a shared try on the lock file; nothing is taken). */
export function rotationHolds({ projectRoot, persona, name }) {
  return probe(ROTATION_LOCK, lockParams(projectRoot, persona, name)).result === 'held';
}

/** The lock of one lineage, taken without waiting: `{ release }` or null when a rotation already holds it. */
function takeLock({ projectRoot, persona, name }) {
  const answer = acquireSync(createLockScope(ROTATION_LOCK), ROTATION_LOCK, lockParams(projectRoot, persona, name));
  return answer.result === 'acquired' ? { release: () => answer.handle.release() } : null;
}

function readRotationConfig(projectRoot) {
  return readConfig({ projectRoot, sections: ['sessionRotation'] }).value.sessionRotation;
}

const realClock = { now: () => Date.now(), sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)) };

// ---- the executor ----------------------------------------------------------------------------------

/**
 * Rotates the head session of `persona` and `name` into a successor and returns `{ rotated: true, key, gen }`, or
 * `{ rotated: false, reason }` with the old session still alive. `reason` is `soft`, `hard` or `manual`; `stopFacts`
 * are what the old session's last stop knew (`sessionId`, `portfolio`, `delta`, `lastAssistantMessage`,
 * `pendingQuestion`) and go into the handoff, which also carries the rotation id the successor must echo.
 *
 * `ports` (all optional, for tests): `end(runDir) -> boolean` (asks that session attempt's supervisor to stop it),
 * `identity({ role, projectRoot }) -> { live, session }`, `lock(lineage) -> { release } | null`, `place` (`placeHead`),
 * `placePorts` (its ports), `config(projectRoot)`, `clock { now, sleep }`, `pollMs`. A rotation already running for the lineage is a no-op (`rotation-in-progress`).
 */
export async function rotateHeadSession(request, ports = {}) {
  const { persona, name, reason, projectRoot, stopFacts } = checkRequest(request);
  const role = headRoleOf(persona, name);
  const dir = lineageDirOf(projectRoot, persona, name);
  const lock = (ports.lock ?? takeLock)({ projectRoot, persona, name });
  if (!lock) return { rotated: false, reason: 'rotation-in-progress' };
  const end = ports.end ?? ((runDir) => requestCancel(runDir, 'session-rotation'));
  const recordPlacement = ports.recordPlacement ?? writeHeadPlacement;
  const clock = ports.clock ?? realClock;
  const whoHolds = ports.identity ?? ((ask) => identityHolder(ask.role, ask.projectRoot));
  const pendingFile = path.join(dir, 'rotation.json');
  let old = null;
  let gen = null;
  let successorKey = null;
  let successor = null;

  // The successor holds the role from here on and is never ended by this path: each step reports its own failure as an
  // incident and the next one still runs.
  const complete = (answered, how) => {
    const step = (name_, fn) => {
      try { return fn(); } catch (err) {
        incident(dir, { event: 'step-failed', step: name_, role, detail: String(err.message ?? err).slice(0, 300) });
        return false;
      }
    };
    step('record-placement', () => recordPlacement(dir, { role, gen, placement: successor.placement, runDir: successor.runDir, persona: successor.persona, startedAt: new Date(clock.now()).toISOString() }));
    step('clear-pending', () => fs.rmSync(pendingFile, { force: true }));
    const oldEnded = step('end-old', () => end(old.runDir)) === true;
    if (!oldEnded) incident(dir, { event: 'old-not-ended', role, code: 'cancel-unwritable', detail: `no stop request could be written for ${old.runDir}` });
    if (how) incident(dir, { event: 'rotation-completed', role, how, session: answered.sessionId });
    return { rotated: true, key: successor.key, gen, oldEnded };
  };

  // Identity is the authority on who holds the role: a deadline that passed while the role was moving finishes the
  // rotation instead of ending the role holder. rotation.json goes first, so no later `head answered` is accepted.
  const abandon = async (code, detail) => {
    fs.rmSync(pendingFile, { force: true });
    if (successor) {
      let holder = null;
      try { holder = await whoHolds({ role, projectRoot }); } catch (err) {
        incident(dir, { event: 'rotation-failed', role, code, detail, successor: 'kept', why: `Identity could not say who holds the role (${err.code ?? err.message}), so nothing was ended` });
        return { rotated: false, reason: code, detail, successor: 'kept' };
      }
      const answered = readJson(path.join(dir, 'answered.json'));
      if (holder.live && answered?.gen === gen && answered.key === successorKey && holder.session === answered.sessionId) {
        return complete(answered, `${code}, but Identity already named the successor holder`);
      }
      if (!end(successor.runDir)) incident(dir, { event: 'successor-not-ended', code, detail: `no stop request could be written for ${successor.runDir}` });
    }
    incident(dir, { event: 'rotation-failed', role, code, detail, successor: successor ? 'ended' : 'none' });
    return { rotated: false, reason: code, detail };
  };

  try {
    old = readHeadPlacement(dir);
    if (!old?.runDir) return await abandon('placement-unknown', `${role} has no recorded placement with its run directory under ${dir}`);
    const holder = await whoHolds({ role, projectRoot });
    if (!holder.live) return await abandon('old-not-live', `${role} is not held by a live session, there is nothing to rotate`);
    const config = (ports.config ?? readRotationConfig)(projectRoot);
    const bound = config.answerWaitMs ?? DEFAULT_ANSWER_WAIT_MS;

    const id = crypto.randomBytes(8).toString('hex');
    const handoff = writeHandoff({
      fgosDir: path.join(projectRoot, '.fgos'), persona, name, sessionId: stopFacts.sessionId ?? old.placement.key,
      rotate: reason === 'soft' ? 'soft' : 'hard', keep: config.keep, portfolio: stopFacts.portfolio ?? [],
      delta: `${rotationIdLine(id)}\n${stopFacts.delta ?? ''}`,
      lastAssistantMessage: stopFacts.lastAssistantMessage ?? null, pendingQuestion: stopFacts.pendingQuestion ?? null,
    });

    gen = nextHeadGeneration(projectRoot, persona, name);
    successorKey = headKeyOf(persona, name, gen);
    fs.rmSync(path.join(dir, 'answered.json'), { force: true });
    writeJson(dir, 'rotation.json', {
      id, successorKey, gen, reason, handoff: handoff.file, oldKey: old.placement.key, oldSession: holder.session ?? null,
      pendingQuestion: stopFacts.pendingQuestion ?? null, startedAt: new Date(clock.now()).toISOString(),
    });
    try {
      successor = await (ports.place ?? placeHead)({ persona, name, projectRoot, beside: old.placement.key, gen }, ports.placePorts ?? {});
    } catch (err) {
      return await abandon(err.code ?? 'start-refused', String(err.message ?? err));
    }

    const deadline = clock.now() + bound;
    let answered = null;
    for (;;) {
      const record = readJson(path.join(dir, 'answered.json'));
      if (record && record.gen === gen && record.key === successorKey) {
        const now = await whoHolds({ role, projectRoot });
        if (now.live && now.session === record.sessionId) { answered = record; break; }
      }
      if (clock.now() >= deadline) return await abandon('no-answer', `no valid answer from ${successorKey} within ${bound} ms`);
      await clock.sleep(ports.pollMs ?? POLL_MS);
    }
    return complete(answered, null);
  } catch (err) {
    return await abandon(err.code ?? 'internal', String(err.message ?? err).slice(0, 500));
  } finally {
    lock.release();
  }
}

// ---- the one entry callers use ------------------------------------------------------------------------

/**
 * The one entry that asks for a rotation, for every caller (the request socket's `head rotate`, `fgos head rotate`, a
 * hook outside the sandbox): checks the request, writes it under the lineage folder and starts `rotateHeadSession`
 * as a detached process through the one detach door, then returns at once; a Stop hook never waits for a rotation.
 * Returns `{ started: true, pid }`, or `{ started: false, reason }` for `rotation-in-progress` or `spawn-failed`.
 */
export function requestRotation(request, ports = {}) {
  const checked = checkRequest(request);
  const dir = lineageDirOf(checked.projectRoot, checked.persona, checked.name);
  if ((ports.holds ?? rotationHolds)(checked)) return { started: false, reason: 'rotation-in-progress' };
  const file = path.join(dir, `request-${crypto.randomBytes(6).toString('hex')}.json`);
  writeJson(dir, path.basename(file), { ...checked, requestedAt: new Date().toISOString() });
  const spawned = (ports.spawn ?? spawnDetachedCli)({
    executable: process.execPath, args: [ENTRY, '--request', file], cwd: checked.projectRoot, env: ports.env ?? process.env, logPath: path.join(dir, 'rotation.log'),
  });
  if (spawned.pid === null) {
    fs.rmSync(file, { force: true });
    incident(dir, { event: 'rotation-not-started', code: 'spawn-failed', detail: spawned.error ?? null });
    return { started: false, reason: 'spawn-failed' };
  }
  return { started: true, pid: spawned.pid };
}

/** The detached process: reads its request file (and removes it), runs the executor and prints one result line. */
async function main(argv) {
  const at = argv.indexOf('--request');
  const file = at >= 0 ? argv[at + 1] : undefined;
  if (!file) { process.stderr.write('usage: rotate.mjs --request <file>\n'); return 2; }
  let request;
  try { request = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) {
    process.stdout.write(`${JSON.stringify({ rotated: false, reason: 'bad-request', detail: String(err.message) })}\n`);
    return 1;
  } finally {
    fs.rmSync(file, { force: true });
  }
  const result = await rotateHeadSession(request);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  return result.rotated || result.reason === 'rotation-in-progress' ? 0 : 1;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(ENTRY)) {
  process.exitCode = await main(process.argv.slice(2));
}
