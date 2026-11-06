// omp-natives-checks.mjs -- the doctor readiness row `omp-natives-present`.
// `registrations.mjs` registers it; the body lives here.
//
// omp extracts its native addon on first start into `<natives dir>/<version>/`. A
// confined seat sees that directory read-only, so an omp that was updated and never
// started outside the sandbox cannot load its addon. The row only reads: it resolves the
// directory the way omp does, asks the installed omp for its version and looks for the
// addon file. It repairs nothing.
//
// Levels follow the doctor convention: `passed: false` fails, a message that starts with
// `warning:` warns, anything else passes.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const VERSION_TIMEOUT_MS = 10_000;
const FIX_HINT = 'run omp once outside the sandbox after every update';

/** The ids of the executors that run omp (an invocation's own command, else the executor's). */
export function ompExecutorsOf(runnerCfg = {}) {
  const runsOmp = (command) => typeof command === 'string' && path.basename(command) === 'omp';
  return Object.entries(runnerCfg.executors ?? {})
    .filter(([, executor]) => runsOmp(executor?.command) || (executor?.invocations ?? []).some((inv) => runsOmp(inv?.command ?? executor?.command)))
    .map(([id]) => id);
}

/** omp's own natives directory rule: `PI_NATIVES_DIR` (absolute, `~` expanded), else
 * `$XDG_DATA_HOME/omp/natives` once `$XDG_DATA_HOME/omp` exists, else `~/.omp/natives`. */
function ompNativesDir({ env = process.env, home = os.homedir() } = {}) {
  let pinned = env.PI_NATIVES_DIR?.trim();
  if (pinned) {
    if (pinned === '~') pinned = home;
    else if (pinned.startsWith('~/') || pinned.startsWith('~\\')) pinned = home + pinned.slice(1);
    if (path.isAbsolute(pinned)) return path.normalize(pinned);
  }
  const xdg = env.XDG_DATA_HOME;
  if (xdg && fs.existsSync(path.join(xdg, 'omp'))) return path.join(xdg, 'omp', 'natives');
  return path.join(home, '.omp', 'natives');
}

/** The addon file names omp loads for this platform, in omp's own order (x64 has CPU variants). */
function addonNames(platform, arch) {
  const tag = `${platform}-${arch}`;
  const plain = `pi_natives.${tag}.node`;
  return arch === 'x64' ? [`pi_natives.${tag}-modern.node`, `pi_natives.${tag}-baseline.node`, plain] : [plain];
}

/**
 * omp-natives-present. `ompExecutors` is the list of executors that run omp, or null when the
 * runner config could not be read (treated as none: the row then only warns).
 */
export function checkOmpNativesPresent({ ompExecutors = [], env = process.env, home = os.homedir(), platform = process.platform, arch = process.arch } = {}) {
  const users = ompExecutors ?? [];
  let version;
  try {
    const out = execFileSync('omp', ['--version'], { env, encoding: 'utf8', timeout: VERSION_TIMEOUT_MS, stdio: ['ignore', 'pipe', 'ignore'] });
    version = /(\d+\.\d+\.\d+\S*)/.exec(out)?.[1];
  } catch (err) {
    const used = users.length > 0 ? `, but executor(s) ${users.join(', ')} run it` : '';
    return { passed: true, message: `warning: omp is not installed or did not answer --version (${err.code ?? err.message})${used}` };
  }
  if (!version) return { passed: true, message: 'warning: omp --version printed no version, so its native addon cannot be located' };
  const dir = path.join(ompNativesDir({ env, home }), version);
  const names = addonNames(platform, arch);
  const found = names.find((name) => fs.existsSync(path.join(dir, name)));
  if (found) return { passed: true, message: `omp ${version} has its native addon ${path.join(dir, found)}` };
  const missing = `omp ${version} has no native addon in ${dir} (looked for ${names.join(', ')})`;
  if (users.length === 0) return { passed: true, message: `warning: ${missing}; no executor runs omp; ${FIX_HINT}` };
  return { passed: false, message: `${missing}; executor(s) ${users.join(', ')} run omp, and a confined omp cannot extract it: ${FIX_HINT}` };
}
