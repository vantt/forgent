// identity-checks.mjs -- the doctor check and the setup fix of the Identity
// component's machine id (docs/platform/identity/spec.md, section 5).
// `registrations.mjs` registers them; the bodies live here.
//
// The check asks the host (`fgos identity machine --json`) instead of reading
// the file, so the one validator of the id's shape stays in the Rust crate.
// The fix mints through the same N-API door Event Store's migration uses
// (`fixEventStoreMachineId`), never a second implementation.
// Levels follow the doctor convention: `passed: false` fails, a message that
// starts with `warning:` warns, anything else passes.

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';
import { fixEventStoreMachineId } from './event-store-fixes.mjs';

const TIMEOUT_MS = 2000;
const MISSING_REASON = '[machine-id-missing]';

/** pass when the machine id is minted and valid, warn when it is absent, fail when it is unreadable. */
export function checkIdentityMachineId(cwd, { hostBin } = {}) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const bin = hostBin ?? resolveActiveHostBin({ fgosDir: path.join(root, '.fgos'), cwd }).bin;
  if (!bin) return { passed: true, message: 'warning: no host binary to ask for the machine id -- run fgctl init/repair, or set FGOS_HOST_BIN' };
  const env = { ...process.env };
  delete env.FGOS_INVOCATION_RECORD_PATH;
  let stdout;
  try {
    stdout = execFileSync(bin, ['identity', 'machine', '--json'], {
      env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: TIMEOUT_MS, killSignal: 'SIGKILL', windowsHide: true,
    });
  } catch (err) {
    const stderr = String(err.stderr ?? '').trim();
    if (err.status === 65 && stderr.includes(MISSING_REASON)) {
      return { passed: true, message: 'warning: no machine id minted yet; run `fgos doctor --fix`' };
    }
    if (err.status === 4) {
      return { passed: true, message: `warning: ${bin} has no "identity machine" subcommand: the active release is older than this payload` };
    }
    return { passed: false, message: `${bin} identity machine failed (${err.code ?? `exit ${err.status}`})${stderr ? `: ${stderr.slice(0, 300)}` : ''}` };
  }
  let data;
  try {
    data = JSON.parse(stdout).data;
  } catch {
    return { passed: false, message: `${bin} identity machine printed something that is not JSON` };
  }
  if (typeof data?.id !== 'string' || typeof data?.handle !== 'string') {
    return { passed: false, message: `${bin} identity machine printed an unexpected answer: ${stdout.slice(0, 200)}` };
  }
  return { passed: true, message: `machine ${data.id}, handle ${data.handle}${data.alias ? ' (alias)' : ''}` };
}

/** identity-machine-id (setup): mint the machine id once; never replaces an existing one. */
export function fixIdentityMachineId(cwd, options = {}) {
  try {
    const { changed, machineId } = fixEventStoreMachineId(cwd, options);
    return { changed, message: changed ? `minted machine id ${machineId}` : `machine id ${machineId} already minted` };
  } catch (err) {
    return { changed: false, message: `machine id not minted: ${err.message}` };
  }
}
