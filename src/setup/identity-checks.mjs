// identity-checks.mjs -- the doctor checks of the Identity component's machine
// and project ids and the setup fix of the machine id
// (docs/platform/identity/spec.md, section 5).
// `registrations.mjs` registers them; the bodies live here.
//
// The checks ask the host (`fgos identity machine|project --json`) instead of
// reading the files, so the one validator of each id's shape stays in the Rust crate.
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

/**
 * Asks the host `fgos identity <verb> --json` from `cwd`. Answers `{ data }`, or
 * `{ result }` carrying the doctor result when the host cannot answer:
 * `missing` is the `[reason]` of a refusal the caller maps itself.
 */
function askIdentity(cwd, verb, { hostBin, missing, missingResult }) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const bin = hostBin ?? resolveActiveHostBin({ fgosDir: path.join(root, '.fgos'), cwd }).bin;
  if (!bin) return { result: { passed: true, message: `warning: no host binary to ask for the ${verb} id -- run fgctl init/repair, or set FGOS_HOST_BIN` } };
  const env = { ...process.env };
  delete env.FGOS_INVOCATION_RECORD_PATH;
  let stdout;
  try {
    stdout = execFileSync(bin, ['identity', verb, '--json'], {
      cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: TIMEOUT_MS, killSignal: 'SIGKILL', windowsHide: true,
    });
  } catch (err) {
    const stderr = String(err.stderr ?? '').trim();
    if (err.status === 65 && stderr.includes(missing)) return { result: missingResult };
    if (err.status === 4) {
      return { result: { passed: true, message: `warning: ${bin} has no "identity ${verb}" subcommand: the active release is older than this payload` } };
    }
    return { result: { passed: false, message: `${bin} identity ${verb} failed (${err.code ?? `exit ${err.status}`})${stderr ? `: ${stderr.slice(0, 300)}` : ''}` } };
  }
  let data;
  try {
    data = JSON.parse(stdout).data;
  } catch {
    return { result: { passed: false, message: `${bin} identity ${verb} printed something that is not JSON` } };
  }
  if (typeof data?.id !== 'string' || typeof data?.handle !== 'string') {
    return { result: { passed: false, message: `${bin} identity ${verb} printed an unexpected answer: ${stdout.slice(0, 200)}` } };
  }
  return { data };
}

/** pass when the machine id is minted and valid, warn when it is absent, fail when it is unreadable. */
export function checkIdentityMachineId(cwd, { hostBin } = {}) {
  const { data, result } = askIdentity(cwd, 'machine', {
    hostBin,
    missing: '[machine-id-missing]',
    missingResult: { passed: true, message: 'warning: no machine id minted yet; run `fgos doctor --fix`' },
  });
  return result ?? { passed: true, message: `machine ${data.id}, handle ${data.handle}${data.alias ? ' (alias)' : ''}` };
}

/**
 * pass when this repository carries a valid project id, warn when it has none, fail when the
 * file is unreadable. There is no fix: the id is minted once by hand on one machine, committed,
 * and pulled everywhere else (a fix on every machine would mint one id per clone).
 */
export function checkIdentityProjectId(cwd, { hostBin } = {}) {
  const { data, result } = askIdentity(cwd, 'project', {
    hostBin,
    missing: '[project-id-missing]',
    missingResult: { passed: true, message: 'warning: no project id yet; run `fgos identity project --init` once on one machine, commit, pull elsewhere' },
  });
  return result ?? { passed: true, message: `project ${data.id}, handle ${data.handle}` };
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
