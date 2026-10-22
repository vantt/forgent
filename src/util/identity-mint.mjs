// identity-mint.mjs -- Node facade over the Identity mint door.
//
// Every id that travels between machines comes from the Rust crate fgos-identity
// (docs/platform/identity/spec.md, section 4a), reached through the host verb
// `fgos identity mint <kind>`. This module decides nothing about an id: it runs
// the verb, checks the shape of the answer, and returns it. When no host binary
// can answer the caller gets a WriterIdentityError -- never a guessed id and
// never a second minting rule in Node.
//
// The exec never happens while this process holds a state lock (the host would
// wait behind it): mint the id before entering the transaction.

import { execFileSync } from 'node:child_process';
import { resolveActiveHostBin } from './host-bin-path.mjs';
import { WriterIdentityError } from './session-identity.mjs';
import { stateLockHeld } from './state-lock-held.mjs';

const TIMEOUT_MS = 2000;
const MAX_OUTPUT_BYTES = 64 * 1024;

/** What the verb must answer for a work item; the Rust crate is the only author of the id. */
const WORK_ID_SHAPE = /^tsk-[a-z2-7]{10}$/;

function execError(err, bin) {
  const stderr = String(err.stderr ?? '').trim();
  if (err.code === 'ENOENT' || err.code === 'EACCES') {
    return new WriterIdentityError('host-missing', `cannot run ${bin} (${err.code})`);
  }
  if (err.code === 'ETIMEDOUT') {
    return new WriterIdentityError('timeout', `${bin} identity mint did not answer within ${TIMEOUT_MS} ms and was killed`);
  }
  if (stderr.includes('unknown identity subcommand') || (err.status === 4 && stderr.includes('unknown verb'))) {
    return new WriterIdentityError(
      'host-version-mismatch',
      `${bin} has no "identity mint" verb: the active release is older than this payload; restage/activate it (fgctl), or point FGOS_HOST_BIN at a host built from this checkout`,
    );
  }
  const how = err.code ? `error ${err.code}` : err.signal ? `signal ${err.signal}` : `exit ${err.status}`;
  return new WriterIdentityError('host-error', `${bin} identity mint failed (${how})${stderr ? `: ${stderr.slice(0, 500)}` : ''}`);
}

/**
 * mintWorkId({ fgosDir, bin }) -> `tsk-<10 base32>`
 *
 * A new work item id. `bin` overrides the host binary lookup (tests);
 * `fgosDir` is the `.fgos` directory whose activation names the host.
 */
export function mintWorkId({ fgosDir, bin } = {}) {
  if (stateLockHeld()) {
    throw new WriterIdentityError(
      'identity-in-lock',
      'minting an id would exec the host while the state lock is held; mint before taking the lock',
    );
  }
  let hostBin = bin;
  if (!hostBin) {
    const found = resolveActiveHostBin({ fgosDir });
    if (!found.bin) {
      throw new WriterIdentityError(
        'host-missing',
        `no fgos host binary found (tried: ${found.tried.join('; ')}); run through the \`fgos\` command of an activated workspace, or set FGOS_HOST_BIN to a host binary`,
      );
    }
    hostBin = found.bin;
  }
  const env = { ...process.env };
  delete env.FGOS_INVOCATION_RECORD_PATH;
  let stdout;
  try {
    stdout = execFileSync(hostBin, ['identity', 'mint', 'work', '--json'], {
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: TIMEOUT_MS,
      killSignal: 'SIGKILL',
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true,
    });
  } catch (err) {
    throw execError(err, hostBin);
  }
  let id;
  try {
    id = JSON.parse(stdout)?.data?.id;
  } catch {
    // falls through to the shape check
  }
  if (typeof id !== 'string' || !WORK_ID_SHAPE.test(id)) {
    throw new WriterIdentityError('bad-output', `${hostBin} identity mint printed an unexpected answer: ${String(stdout).slice(0, 200)}`);
  }
  return id;
}
