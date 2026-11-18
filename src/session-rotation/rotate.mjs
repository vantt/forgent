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
// `rotation.json` (the pending rotation: successor key and generation, reason, the old session, its pending question),
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

// ---- the question the answer must name -----------------------------------------------------------

const words = (text) => new Set(String(text).toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []);

/**
 * Whether the successor's first message names the question the old session left pending. With no pending question any
 * non-empty message passes (the start ritual asks for one line saying that none is pending). With one, at least half of
 * the question's words of four letters or more must appear in the message: a paraphrase passes, a message about
 * something else does not.
 */
export function answerNamesQuestion(message, pendingQuestion) {
  if (typeof message !== 'string' || message.trim() === '') return false;
  if (typeof pendingQuestion !== 'string' || pendingQuestion.trim() === '') return true;
  const wanted = words(pendingQuestion);
  if (wanted.size === 0) return true;
  const have = words(message);
  let hits = 0;
  for (const word of wanted) if (have.has(word)) hits += 1;
  return hits * 2 >= wanted.size;
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
 * sandbox). Refused `no-rotation-pending` when this lineage has no rotation waiting for that key, and
 * `answer-mismatch` when the message does not name the pending question; the role does not move in either case.
 * `{ sessionId, message }` are the successor's Identity session id and its last assistant message.
 */
export function markSuccessorAnswered({ projectRoot, persona, name, key, sessionId, message }, { now = () => new Date() } = {}) {
  try { assertHeadArgs({ persona, name, projectRoot }); } catch (err) { fail(err.code ?? 'bad-args', err.message); }
  if (typeof sessionId !== 'string' || sessionId === '' || sessionId.length > 200) fail('bad-args', 'sessionId must be a non-empty string');
  if (typeof message !== 'string' || message.trim() === '' || message.length > MAX_TEXT) fail('bad-args', `message must be a non-empty string of at most ${MAX_TEXT} characters`);
  const dir = lineageDirOf(projectRoot, persona, name);
  const pending = readJson(path.join(dir, 'rotation.json'));
  if (!pending || pending.successorKey !== key) fail('no-rotation-pending', `${headRoleOf(persona, name)} has no rotation waiting for ${key}`);
  if (!answerNamesQuestion(message, pending.pendingQuestion)) fail('answer-mismatch', 'the first message does not name the question the old session left pending');
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
 * `pendingQuestion`) and go into the handoff.
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
  const clock = ports.clock ?? realClock;
  const whoHolds = ports.identity ?? ((ask) => identityHolder(ask.role, ask.projectRoot));
  let successor = null;
  const abandon = (code, detail) => {
    if (successor && !end(successor.runDir)) incident(dir, { event: 'successor-not-ended', code, detail: `no stop request could be written for ${successor.runDir}` });
    fs.rmSync(path.join(dir, 'rotation.json'), { force: true });
    incident(dir, { event: 'rotation-failed', role, code, detail });
    return { rotated: false, reason: code, detail };
  };
  try {
    const old = readHeadPlacement(dir);
    if (!old?.runDir) return abandon('placement-unknown', `${role} has no recorded placement with its run directory under ${dir}`);
    const holder = await whoHolds({ role, projectRoot });
    if (!holder.live) return abandon('old-not-live', `${role} is not held by a live session, there is nothing to rotate`);
    const config = (ports.config ?? readRotationConfig)(projectRoot);
    const bound = config.answerWaitMs ?? DEFAULT_ANSWER_WAIT_MS;

    const handoff = writeHandoff({
      fgosDir: path.join(projectRoot, '.fgos'), persona, name, sessionId: stopFacts.sessionId ?? old.placement.key,
      rotate: reason === 'soft' ? 'soft' : 'hard', keep: config.keep, portfolio: stopFacts.portfolio ?? [], delta: stopFacts.delta ?? '',
      lastAssistantMessage: stopFacts.lastAssistantMessage ?? null, pendingQuestion: stopFacts.pendingQuestion ?? null,
    });

    const gen = nextHeadGeneration(projectRoot, persona, name);
    const successorKey = headKeyOf(persona, name, gen);
    fs.rmSync(path.join(dir, 'answered.json'), { force: true });
    writeJson(dir, 'rotation.json', {
      successorKey, gen, reason, handoff: handoff.file, oldKey: old.placement.key, oldSession: holder.session ?? null,
      pendingQuestion: stopFacts.pendingQuestion ?? null, startedAt: new Date(clock.now()).toISOString(),
    });
    try {
      successor = await (ports.place ?? placeHead)({ persona, name, projectRoot, beside: old.placement.key, gen }, ports.placePorts ?? {});
    } catch (err) {
      return abandon(err.code ?? 'start-refused', String(err.message ?? err));
    }

    const deadline = clock.now() + bound;
    for (;;) {
      const answered = readJson(path.join(dir, 'answered.json'));
      if (answered && answered.gen === gen && answered.key === successorKey) {
        if (!answerNamesQuestion(answered.message, stopFacts.pendingQuestion ?? null)) return abandon('answer-mismatch', 'the first message does not name the pending question');
        const now = await whoHolds({ role, projectRoot });
        if (now.live && now.session === answered.sessionId) break;
      }
      if (clock.now() >= deadline) return abandon('no-answer', `no valid answer from ${successorKey} within ${bound} ms`);
      await clock.sleep(ports.pollMs ?? POLL_MS);
    }

    // The role is the successor's: record where it lives first, then let the old session go.
    writeHeadPlacement(dir, { role, gen, placement: successor.placement, runDir: successor.runDir, persona: successor.persona, startedAt: new Date(clock.now()).toISOString() });
    fs.rmSync(path.join(dir, 'rotation.json'), { force: true });
    const oldEnded = end(old.runDir);
    if (!oldEnded) incident(dir, { event: 'old-not-ended', role, code: 'cancel-unwritable', detail: `no stop request could be written for ${old.runDir}` });
    return { rotated: true, key: successor.key, gen, oldEnded };
  } catch (err) {
    return abandon(err.code ?? 'internal', String(err.message ?? err).slice(0, 500));
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
