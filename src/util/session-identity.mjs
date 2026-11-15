// Node facade over the writer identity: the rule lives in the Rust crate fgos-identity, read in process through the
// native door (docs/platform/identity/spec.md §7a). It decides nothing about the id; no door means WriterIdentityError.
import path from 'node:path';
import { nativeDoor } from '../native/door.mjs';

export class WriterIdentityError extends Error {
  constructor(code, message) {
    super(`writer identity (${code}): ${message}`);
    Object.assign(this, { name: 'WriterIdentityError', code, category: 'precondition' });
  }
}

const ENV_ORDER = ['FGOS_SESSION_ID', 'CODEX_THREAD_ID', 'PI_SESSION_ID', 'CLAUDE_CODE_SESSION_ID']; // what the rule reads: the cache key
const kept = new Map(); // answers only; a failure is never kept

/** The writer-identity namespace of the native door; a missing door is a `host-missing` WriterIdentityError. Shared with the mint facade. */
export function identityDoor() {
  try {
    return nativeDoor().sessionIdentity;
  } catch (err) {
    throw new WriterIdentityError('host-missing', `${err.message}; run through the \`fgos\` command of an activated workspace, or from a checkout through \`npm run fgos:dev\``);
  }
}

/** `{ id, source }` for this process; `fgosDir`'s sessions.json may confirm an env id (source registry). */
export function resolveWriterIdentity(fgosDir) {
  const dir = fgosDir ? path.resolve(fgosDir) : null, envKey = JSON.stringify(ENV_ORDER.map((key) => process.env[key] ?? null));
  const hit = kept.get(envKey) ?? kept.get(`${envKey}\n${dir}`);
  if (hit) return { ...hit };
  const answer = identityDoor().resolve(dir);
  // pid and unresolved answers depend on the env alone; env and registry answers also on the dir.
  kept.set(['pid', 'unresolved'].includes(answer.source) ? envKey : `${envKey}\n${dir}`, answer);
  return { ...answer };
}

/** `att-<attemptId>`, minted by the Rust crate. */
export function mintAttemptWriterId(attemptId) {
  if (typeof attemptId !== 'string' || attemptId.includes('\0')) throw new WriterIdentityError('invalid-attempt-id', 'the attempt id must be a string without NUL');
  const { mintAttempt } = identityDoor();
  try {
    return mintAttempt(attemptId);
  } catch (err) {
    if (String(err.message).startsWith('invalid-attempt-id')) throw new WriterIdentityError('invalid-attempt-id', `${JSON.stringify(attemptId)} is not a usable attempt id`);
    throw err;
  }
}

/** What a launcher does to an agent's environment, decided by the Rust crate: `{ set: [[name, value], ...], unset: [name, ...] }`. */
export function launcherEnv(writerId, parent = null) {
  const bad = (value) => typeof value !== 'string' || value.includes('\0');
  if (bad(writerId) || (parent != null && bad(parent))) throw new WriterIdentityError('invalid-writer-id', 'the writer id and its parent must be strings without NUL');
  try {
    return identityDoor().launcherEnv(writerId, parent ?? null);
  } catch (err) {
    if (String(err.message).startsWith('empty-writer-id')) throw new WriterIdentityError('empty-writer-id', "the agent's writer id must not be empty");
    throw err;
  }
}

