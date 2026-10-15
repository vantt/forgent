// session-identity.mjs -- Node facade over the Session Identity component.
//
// The single authority for "who is the writer of this process, and how far
// can that id be trusted" is the Rust crate fgos-session-identity, reached
// through the native verb `fgos identity`
// (docs/platform/session-identity/spec.md). This module decides nothing about
// the id: it finds the host binary, runs the verb for this process, checks
// the answer's shape, and remembers it. When no host binary can answer, the
// caller gets a WriterIdentityError (exit 2) -- never a guessed id and never
// a second resolver in Node.
//
// Exec happens at most once per process for a given session env (pid-branch
// answers) or per session env and fgos dir (env/registry answers), and never
// while this process holds events.lock or claims.lock: the lock helpers prime
// the cache before taking the lock and report each lock they hold here, and
// probeIdentity refuses to exec while any is held.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveActiveHostBin } from './host-bin-path.mjs';

export const REGISTRY = 'registry';
export const ENV = 'env';
export const PID = 'pid';
export const UNRESOLVED = 'unresolved';

/** The env variables the identity rule reads, in its order
 * (session-identity.resolve.v1.json x-envOrder). Used here only as the
 * cache key: a different session env is a different answer. */
export const IDENTITY_ENV_KEYS = Object.freeze(['FGOS_SESSION_ID', 'CODEX_THREAD_ID', 'CLAUDE_CODE_SESSION_ID']);

const TIMEOUT_MS = 2000;
const MAX_OUTPUT_BYTES = 64 * 1024;
const NO_DIR = '\0no-fgos-dir';
const SOURCES = new Set([REGISTRY, ENV, PID, UNRESOLVED]);

export class WriterIdentityError extends Error {
  constructor(code, message) {
    super(`writer identity (${code}): ${message}`);
    this.name = 'WriterIdentityError';
    this.code = code;
    this.category = 'precondition';
  }
}

let heldLocks = 0;

/** Called by withEventsLock/withClaimsLock right after taking a lock. */
export function noteLockHeld() {
  heldLocks += 1;
}

/** Called by withEventsLock/withClaimsLock exactly once when that lock is
 * really released. */
export function noteLockReleased() {
  heldLocks = Math.max(0, heldLocks - 1);
}

function parseIdentity(stdout, bin) {
  let envelope;
  try {
    envelope = JSON.parse(stdout);
  } catch {
    throw new WriterIdentityError('bad-output', `${bin} identity printed something that is not JSON`);
  }
  const data = envelope?.data;
  const shapeOk = envelope?.contract === 'fgos.v1'
    && typeof envelope.generated_at === 'string'
    && typeof envelope.data_hash === 'string'
    && data !== null && typeof data === 'object'
    && SOURCES.has(data.source)
    && ((data.source === REGISTRY || data.source === ENV)
      ? typeof data.id === 'string' && data.id.length > 0
      : Number.isInteger(data.id) && data.id > 0);
  if (!shapeOk) {
    throw new WriterIdentityError('bad-output', `${bin} identity printed an unexpected answer: ${String(stdout).slice(0, 200)}`);
  }
  return { id: data.id, source: data.source };
}

function classifyExecError(err, bin) {
  const stderr = String(err.stderr ?? '').trim();
  if (err.code === 'ENOENT' || err.code === 'EACCES') {
    return new WriterIdentityError('host-missing', `cannot run ${bin} (${err.code})`);
  }
  if (err.code === 'ETIMEDOUT') {
    return new WriterIdentityError('timeout', `${bin} identity did not answer within ${TIMEOUT_MS} ms and was killed`);
  }
  if (err.status === 4 && stderr.includes('unknown verb "identity"')) {
    return new WriterIdentityError(
      'host-version-mismatch',
      `${bin} has no "identity" verb: the active release is older than this payload; restage/activate it (fgctl), or run a plain \`git commit\` with FGOS_HOST_BIN pointing at a host built from this checkout`,
    );
  }
  const how = err.code ? `error ${err.code}` : err.signal ? `signal ${err.signal}` : `exit ${err.status}`;
  return new WriterIdentityError('host-error', `${bin} identity failed (${how})${stderr ? `: ${stderr.slice(0, 500)}` : ''}`);
}

/**
 * probeIdentity(bin, fgosDir) -> { id, source }
 *
 * The one place that runs the verb: no cache, so doctor can ask each
 * candidate binary directly. Refuses to exec while this process holds an
 * events/claims lock. The child gets this process's env minus
 * FGOS_INVOCATION_RECORD_PATH, so the verb writes nothing.
 */
export function probeIdentity(bin, fgosDir) {
  if (heldLocks > 0) {
    throw new WriterIdentityError(
      'identity-in-lock',
      'resolving the writer identity would exec the host while events.lock/claims.lock is held; resolve before taking the lock',
    );
  }
  const env = { ...process.env };
  delete env.FGOS_INVOCATION_RECORD_PATH;
  const args = ['identity', '--pid', String(process.pid)];
  if (typeof fgosDir === 'string' && fgosDir) args.push('--fgos-dir', path.resolve(fgosDir));
  let stdout;
  try {
    stdout = execFileSync(bin, args, {
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: TIMEOUT_MS,
      killSignal: 'SIGKILL',
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true,
    });
  } catch (err) {
    throw classifyExecError(err, bin);
  }
  return parseIdentity(stdout, bin);
}

/** Cache key for a dir: the realpath of its deepest existing ancestor joined
 * with the part that does not exist yet, so the key stays the same when a
 * lock helper creates the directory between priming and use. */
function dirKey(fgosDir) {
  if (typeof fgosDir !== 'string' || !fgosDir) return NO_DIR;
  let existing = path.resolve(fgosDir);
  const missing = [];
  while (!fs.existsSync(existing) && path.dirname(existing) !== existing) {
    missing.unshift(path.basename(existing));
    existing = path.dirname(existing);
  }
  try {
    existing = fs.realpathSync(existing);
  } catch {
    // keep the lexical path
  }
  return path.join(existing, ...missing);
}

const pidAnswers = new Map();
const envAnswers = new Map();

/**
 * resolveWriterIdentity(fgosDir) -> { id, source }
 *
 * `fgosDir` is the `.fgos` directory whose sessions.json may confirm an env
 * id (source registry); omit it to skip that confirmation. Throws
 * WriterIdentityError when no host binary can answer.
 */
export function resolveWriterIdentity(fgosDir) {
  const envKey = JSON.stringify(IDENTITY_ENV_KEYS.map((key) => process.env[key] ?? null));
  const pidAnswer = pidAnswers.get(envKey);
  if (pidAnswer) return { ...pidAnswer };
  const answerKey = `${envKey}\n${dirKey(fgosDir)}`;
  const envAnswer = envAnswers.get(answerKey);
  if (envAnswer) return { ...envAnswer };

  const { bin, tried } = resolveActiveHostBin({ fgosDir });
  if (!bin) {
    throw new WriterIdentityError(
      'host-missing',
      `no fgos host binary found (tried: ${tried.join('; ')}); run through the \`fgos\` command of an activated workspace, or set FGOS_HOST_BIN to a host binary`,
    );
  }
  const answer = probeIdentity(bin, fgosDir);
  if (answer.source === PID || answer.source === UNRESOLVED) pidAnswers.set(envKey, answer);
  else envAnswers.set(answerKey, answer);
  return { ...answer };
}
