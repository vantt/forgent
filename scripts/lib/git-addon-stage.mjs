// The staged Git addon and the host binary a checkout's tests run with. A leaf: the test launcher
// (run-tests.mjs) and every script that needs the addon import it, so none of them imports the launcher.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { nativeAddonLibraryName } from '../build-rust-distribution.mjs';
import { devHostEnv, devHostManifest } from './dev-host-manifest.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Fingerprint every input of the staged addon and host (every Cargo workspace member) so a direct test never reuses stale bytes. */
export function gitAddonSourceDigest(cwd = REPO_ROOT) {
  const hash = createHash('sha256');
  const files = ['Cargo.toml', 'Cargo.lock'];
  const workspace = fs.readFileSync(path.join(cwd, 'Cargo.toml'), 'utf8').match(/^members\s*=\s*\[([^\]]*)\]/m)[1];
  const walk = (relative) => {
    for (const entry of fs.readdirSync(path.join(cwd, relative), { withFileTypes: true })) {
      const file = path.join(relative, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(rs|toml|json)$/.test(entry.name)) files.push(file);
    }
  };
  for (const member of new Set([...workspace.matchAll(/"([^"]+)"/g)].map(m => m[1]))) walk(member);
  for (const file of files.sort()) hash.update(file).update('\0').update(fs.readFileSync(path.join(cwd, file)));
  return hash.digest('hex');
}
/** Sidecar of the staged addon directory: the source digest the staged bytes were built from. */
export const GIT_ADDON_SOURCE_DIGEST_FILE = 'source-digest';
export function gitAddonDirectory(cwd = REPO_ROOT) {
  // Linked checkouts can share .fgos, but their source payloads and manifests cannot.
  const checkout = createHash('sha256').update(fs.realpathSync(cwd)).digest('hex').slice(0, 16);
  return path.join(cwd, '.fgos/runtime/git-addon', checkout);
}

export function ensureGitAddon(env = process.env, cwd = REPO_ROOT, locked = true) {
  const dir = path.resolve(cwd, env.CARGO_TARGET_DIR || 'target');
  const cargoEnv = { ...env, CARGO_TARGET_DIR: dir };
  execFileSync('cargo', ['build', ...(locked ? ['--locked'] : []), '-p', 'fgos-node-addon'], { cwd, env: cargoEnv, stdio: 'inherit' });
  const library = nativeAddonLibraryName();
  const addonDir = gitAddonDirectory(cwd);
  fs.mkdirSync(addonDir, { recursive: true });
  const addon = path.join(addonDir, 'fgos.node');
  const temporaryAddon = `${addon}.${process.pid}.tmp`;
  const bytes = fs.readFileSync(path.join(dir, 'debug', library));
  if (!fs.existsSync(addon) || !fs.readFileSync(addon).equals(bytes)) {
    fs.writeFileSync(temporaryAddon, bytes);
    fs.renameSync(temporaryAddon, addon);
  }
  // Never an inherited FGOS_HOST_BIN: a release host predates this checkout's sources.
  const sourceHost = ensureHostBin({ ...env, FGOS_HOST_BIN: '' }, cwd);
  const hostBin = path.join(addonDir, process.platform === 'win32' ? 'fgos.exe' : 'fgos');
  const hostBytes = fs.readFileSync(sourceHost);
  if (!fs.existsSync(hostBin) || !fs.readFileSync(hostBin).equals(hostBytes)) {
    const temporaryHost = `${hostBin}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryHost, hostBytes, { mode: 0o755 });
    fs.renameSync(temporaryHost, hostBin);
  }
  // The complete release manifest of the staged host, the same shape `npm run fgos:dev` writes; the
  // host's legacy route and the Node addon loader both read it through the one variable pair.
  const manifest = path.join(addonDir, 'manifest.json');
  const manifestBytes = `${JSON.stringify(devHostManifest({ checkoutRoot: cwd, fgosBin: hostBin, addonFile: addon }), null, 2)}\n`;
  if (!fs.existsSync(manifest) || fs.readFileSync(manifest, 'utf8') !== manifestBytes) {
    fs.writeFileSync(`${manifest}.${process.pid}.tmp`, manifestBytes);
    fs.renameSync(`${manifest}.${process.pid}.tmp`, manifest);
  }
  fs.writeFileSync(path.join(addonDir, GIT_ADDON_SOURCE_DIGEST_FILE), gitAddonSourceDigest(cwd));
  Object.assign(env, devHostEnv({}, { fgosBin: hostBin, checkoutRoot: cwd, manifestPath: manifest }));
  return { addon, manifest, hostBin, cargoEnv };
}

/**
 * Ensures FGOS_HOST_BIN is available and points to a runnable host binary.
 * If FGOS_HOST_BIN is already set and runnable, returns it without building.
 * Otherwise, builds fgos with cargo (debug incremental) using checkout's CARGO_TARGET_DIR.
 */
export function ensureHostBin(env = process.env, cwd = REPO_ROOT) {
  if (env.FGOS_HOST_BIN) {
    try {
      if (fs.existsSync(env.FGOS_HOST_BIN)) {
        execFileSync(env.FGOS_HOST_BIN, ['version'], { stdio: 'ignore' });
        return env.FGOS_HOST_BIN;
      }
    } catch {}
  }

  try {
    execFileSync('cargo', ['--version'], { stdio: 'ignore' });
  } catch {
    throw new Error('cargo is required to build fgos host binary for testing, but was not found on PATH');
  }

  const targetDir = env.CARGO_TARGET_DIR || path.join(cwd, 'target');
  const binName = process.platform === 'win32' ? 'fgos.exe' : 'fgos';
  const binPath = path.join(targetDir, 'debug', binName);

  execFileSync('cargo', ['build', '-p', 'fgos'], {
    cwd,
    env: { ...env, CARGO_TARGET_DIR: targetDir },
    stdio: 'inherit',
  });

  return binPath;
}
