// Node facade over the writer identity: the rule lives in the Rust crate fgos-identity, read in process through the
// native door (docs/platform/identity/spec.md §7a). It decides nothing about the id; no door means WriterIdentityError.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { nativeDoor } from '../native/door.mjs';
import { routeEnv } from './host-bin-path.mjs';

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

/** Doctor's probe: asks host binary `bin` (`fgos identity`) for this process's answer. Codes: host-missing, host-version-mismatch, host-error. */
export function probeIdentity(bin, fgosDir) {
  const env = routeEnv();
  const args = ['identity', '--pid', String(process.pid), ...(fgosDir ? ['--fgos-dir', path.resolve(fgosDir)] : [])];
  let stdout;
  try {
    stdout = execFileSync(bin, args, { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 2000, killSignal: 'SIGKILL', maxBuffer: 64 * 1024, windowsHide: true });
  } catch (err) {
    const stderr = String(err.stderr ?? '').trim();
    if (err.code === 'ENOENT' || err.code === 'EACCES') throw new WriterIdentityError('host-missing', `cannot run ${bin} (${err.code})`);
    if (err.status === 4 && stderr.includes('unknown verb "identity"')) throw new WriterIdentityError('host-version-mismatch', `${bin} has no "identity" verb: the active release is older than this payload; restage/activate it (fgctl), or run a plain \`git commit\` with FGOS_HOST_BIN pointing at a host built from this checkout`);
    const how = err.code ? `error ${err.code}` : err.signal ? `signal ${err.signal}` : `exit ${err.status}`;
    throw new WriterIdentityError('host-error', `${bin} identity failed (${how})${stderr ? `: ${stderr.slice(0, 500)}` : ''}`);
  }
  let data;
  try { const envelope = JSON.parse(stdout); data = envelope?.contract === 'fgos.v1' ? envelope.data : undefined; } catch { /* the shape check below names it */ }
  const named = typeof data?.id === 'string' && data.id.length > 0 && (data.source === 'registry' || data.source === 'env');
  const numbered = Number.isInteger(data?.id) && data.id > 0 && (data.source === 'pid' || data.source === 'unresolved');
  if (!named && !numbered) throw new WriterIdentityError('host-error', `${bin} identity printed an unexpected answer: ${String(stdout).slice(0, 200)}`);
  return { id: data.id, source: data.source };
}
