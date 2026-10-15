// host-bin-path.mjs -- the one Node rule for "which Rust host binary does an
// activated workspace run", identical to the fgctl shim
// (packages/distribution/rust/src/shim.rs): `.fgos/installation/activation.json`
// with `status: "ready"` and a `releasePath`, binary at
// `<releasePath>/bin/fgos` (`.exe` on Windows), executable, and really inside
// the release (a symlink escaping the release root is refused, like
// e36fcc861 did for the manifest path).
//
// Leaf module: node:fs and node:path only, so the session-identity facade
// can import it without the 18 ms import graph of host-bin.mjs and without
// the import cycle through paths/worktree/store.

import fs from 'node:fs';
import path from 'node:path';

const INSTALLATION = path.join('.fgos', 'installation');

function isExecutableFile(file) {
  try {
    if (!fs.statSync(file).isFile()) return false;
    if (process.platform !== 'win32') fs.accessSync(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function insideRoot(file, root) {
  try {
    const realFile = fs.realpathSync(file);
    const realRoot = fs.realpathSync(root);
    return realFile === realRoot || realFile.startsWith(realRoot + path.sep);
  } catch {
    return false;
  }
}

/** Binary of the release `<installationDir>/activation.json` activates, or
 * null when there is no ready activation or its entry is not a usable file
 * inside the release. */
export function hostBinFromActivation(installationDir) {
  let activation;
  try {
    activation = JSON.parse(fs.readFileSync(path.join(installationDir, 'activation.json'), 'utf8'));
  } catch {
    return null;
  }
  if (activation?.status !== 'ready') return null;
  const releasePath = activation.releasePath;
  if (typeof releasePath !== 'string' || !releasePath) return null;
  const base = path.resolve(releasePath);
  const candidates = [path.join(base, 'bin', 'fgos'), path.join(base, 'bin', 'fgos.exe')];
  for (const candidate of candidates) {
    if (isExecutableFile(candidate) && insideRoot(candidate, base)) return candidate;
  }
  return null;
}

/**
 * resolveActiveHostBin({ fgosDir, cwd, ignoreEnv }) -> { bin, tried }
 *
 * Order: FGOS_HOST_BIN (unless ignoreEnv) -> the activation next to
 * `fgosDir` (its parent's `.fgos/installation`; the store's fgosDir is
 * already the main `.fgos`, even from a /tmp `fgos pick` worktree) -> the
 * nearest activation walking up from `cwd`, as ~/.local/bin/fgos does.
 * `bin` is null when nothing resolves; `tried` names every place looked at.
 */
export function resolveActiveHostBin({ fgosDir, cwd = process.cwd(), ignoreEnv = false } = {}) {
  const tried = [];
  const fromEnv = process.env.FGOS_HOST_BIN;
  if (!ignoreEnv && fromEnv) {
    const candidate = path.resolve(fromEnv);
    tried.push(`FGOS_HOST_BIN=${candidate}`);
    if (isExecutableFile(candidate)) return { bin: candidate, tried };
  }
  if (typeof fgosDir === 'string' && fgosDir) {
    const installationDir = path.join(path.dirname(path.resolve(fgosDir)), INSTALLATION);
    tried.push(path.join(installationDir, 'activation.json'));
    const bin = hostBinFromActivation(installationDir);
    if (bin) return { bin, tried };
  }
  for (let dir = path.resolve(cwd); ; dir = path.dirname(dir)) {
    const installationDir = path.join(dir, INSTALLATION);
    if (fs.existsSync(path.join(installationDir, 'activation.json'))) {
      tried.push(path.join(installationDir, 'activation.json'));
      const bin = hostBinFromActivation(installationDir);
      if (bin) return { bin, tried };
      break;
    }
    if (path.dirname(dir) === dir) {
      tried.push(`no ${INSTALLATION}/activation.json above ${path.resolve(cwd)}`);
      break;
    }
  }
  return { bin: null, tried };
}
