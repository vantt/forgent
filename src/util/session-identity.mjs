// Node facade over the writer identity: the rule lives in the Rust crate fgos-identity and is read in process
// through the native door (docs/platform/identity/spec.md §7a). This module decides nothing about the id; when the
// door cannot load, the caller gets a WriterIdentityError (exit 2), never a guessed id and never a second resolver.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { nativeDoor } from '../native/door.mjs';

export class WriterIdentityError extends Error {
  constructor(code, message) {
    super(`writer identity (${code}): ${message}`);
    this.name = 'WriterIdentityError';
    this.code = code;
    this.category = 'precondition';
  }
}

function door() {
  try {
    return nativeDoor().sessionIdentity;
  } catch (err) {
    throw new WriterIdentityError('host-missing', `${err.message}; run through the \`fgos\` command of an activated workspace, or from a checkout through \`npm run fgos:dev\``);
  }
}

/** `{ id, source }` for this process; `fgosDir` is the `.fgos` directory whose sessions.json may confirm an env id (source registry). */
export function resolveWriterIdentity(fgosDir) {
  return door().resolve(fgosDir ? path.resolve(fgosDir) : null);
}

/** `att-<attemptId>`, minted by the Rust crate, a pure function of the attempt id. */
export function mintAttemptWriterId(attemptId) {
  if (typeof attemptId !== 'string' || attemptId.includes('\0')) throw new WriterIdentityError('invalid-attempt-id', 'the attempt id must be a string without NUL');
  const { mintAttempt } = door();
  try {
    return mintAttempt(attemptId);
  } catch (err) {
    if (String(err.message).startsWith('invalid-attempt-id')) throw new WriterIdentityError('invalid-attempt-id', `${JSON.stringify(attemptId)} is not a usable attempt id`);
    throw err;
  }
}

/** Asks the host binary `bin` through `fgos identity` for this process's answer, so doctor can test each candidate
 * activation. The child writes no invocation record. Codes: host-missing, host-version-mismatch, host-error. */
export function probeIdentity(bin, fgosDir) {
  const env = { ...process.env };
  delete env.FGOS_INVOCATION_RECORD_PATH;
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
