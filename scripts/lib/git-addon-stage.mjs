// The staged Git addon and the host binary a checkout's tests run with. A leaf: the test launcher
// (run-tests.mjs) and every script that needs the addon import it, so none of them imports the launcher.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { nativeAddonLibraryName, hashFile } from '../build-rust-distribution.mjs';
import { devHostEnv, devHostManifest } from './dev-host-manifest.mjs';
import { loadNativeAddon } from '../../src/native/door.mjs';
import { ensureOrtStatic } from '../ort-static.mjs';

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

/**
 * Reuses this checkout's staged addon when it is fresh, setting the caller env through devHostEnv,
 * or returns undefined if missing, stale, or unloadable.
 */
export function reuseGitAddon(env = process.env, cwd = REPO_ROOT) {
  const directory = gitAddonDirectory(cwd);
  const manifest = path.join(directory, 'manifest.json');
  try {
    if (fs.readFileSync(path.join(directory, GIT_ADDON_SOURCE_DIGEST_FILE), 'utf8') === gitAddonSourceDigest(cwd)) {
      const value = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      loadNativeAddon({ descriptor: { manifest: value, releaseRoot: cwd } });
      const hostBin = path.join(cwd, value.entries.fgos);
      if (!fs.existsSync(hostBin)) throw new Error('staged host missing');
      // bin/fgos.mjs is part of the manifest; a stale digest rebuilds it below.
      if (value.components.legacyNode.digest !== hashFile(path.join(cwd, 'bin/fgos.mjs'))) throw new Error('legacy payload changed');
      Object.assign(env, devHostEnv({}, { fgosBin: hostBin, checkoutRoot: cwd, manifestPath: manifest }));
      return { manifest, hostBin, addon: path.join(cwd, value.components.nativeAddon.path) };
    }
  } catch {}
  return undefined;
}

/**
 * Cargo build of the addon crate. Stdout always shows; with captureStderr the stderr is echoed
 * (after the build) and attached to the thrown error so a caller can recognise why cargo failed.
 */
function cargoBuildAddon(cargoEnv, cwd, locked, captureStderr) {
  const args = ['build', ...(locked ? ['--locked'] : []), '-p', 'fgos-node-addon'];
  if (!captureStderr) {
    execFileSync('cargo', args, { cwd, env: cargoEnv, stdio: 'inherit' });
    return;
  }
  const run = spawnSync('cargo', args, { cwd, env: cargoEnv, stdio: ['inherit', 'inherit', 'pipe'], encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (run.stderr) process.stderr.write(run.stderr);
  if (run.error) throw run.error;
  if (run.status !== 0) {
    const err = new Error(`cargo ${args.join(' ')} failed (${run.signal || `exit ${run.status}`})`);
    err.stderr = run.stderr || '';
    err.status = run.status;
    throw err;
  }
}

const ORT_STATIC_STEP = 'ort-static';

/** Always builds and stages the addon and host for this checkout (never reuses). */
export function ensureGitAddon(env = process.env, cwd = REPO_ROOT, locked = true, { captureStderr = false } = {}) {
  const dir = path.resolve(cwd, env.CARGO_TARGET_DIR || 'target');
  let ortEnv;
  try {
    ortEnv = ensureOrtStatic(env);
  } catch (err) {
    // The pre-cargo archive step writes the machine archive folder; its failure is named as its own step.
    err.step = ORT_STATIC_STEP;
    throw err;
  }
  const cargoEnv = { ...env, CARGO_TARGET_DIR: dir, ...ortEnv };
  cargoBuildAddon(cargoEnv, cwd, locked, captureStderr);
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
  // Written only when it changed, like the files above: a concurrent stage in this checkout must not move its mtime.
  const digestFile = path.join(addonDir, GIT_ADDON_SOURCE_DIGEST_FILE);
  const digest = gitAddonSourceDigest(cwd);
  if (!fs.existsSync(digestFile) || fs.readFileSync(digestFile, 'utf8') !== digest) {
    fs.writeFileSync(`${digestFile}.${process.pid}.tmp`, digest);
    fs.renameSync(`${digestFile}.${process.pid}.tmp`, digestFile);
  }
  Object.assign(env, devHostEnv({}, { fgosBin: hostBin, checkoutRoot: cwd, manifestPath: manifest }));
  return { addon, manifest, hostBin, cargoEnv };
}

/** One reuse-or-build door: reuses this checkout's staged addon if fresh, otherwise builds. */
export function ensureStagedOrBuiltGitAddon(env = process.env, cwd = REPO_ROOT, locked = true, options = {}) {
  const reused = reuseGitAddon(env, cwd);
  if (reused) return reused;
  return ensureGitAddon(env, cwd, locked, options);
}

const UNWRITABLE_CODES = ['EROFS', 'EACCES'];
const UNWRITABLE_TEXT = /os error (?:30|13)\b|\bEROFS\b|\bEACCES\b/;

/**
 * True only when the failure names a read-only or permission-denied cause (cargo's os error 30/13 or
 * EROFS/EACCES, or a failed ort-static step) and a write to the target directory confirms it. Anything unrecognised is not "unwritable".
 */
function isTargetUnwritable(env, cwd, err) {
  const text = `${err?.message || ''}\n${err?.stderr || ''}`;
  if (err?.step !== ORT_STATIC_STEP && !UNWRITABLE_CODES.includes(err?.code) && !UNWRITABLE_TEXT.test(text)) return false;
  let probeDir = path.resolve(cwd, env.CARGO_TARGET_DIR || 'target');
  while (!fs.existsSync(probeDir) && path.dirname(probeDir) !== probeDir) probeDir = path.dirname(probeDir);
  const probe = path.join(probeDir, `.probe-writable.${process.pid}.tmp`);
  try {
    fs.writeFileSync(probe, '');
    fs.rmSync(probe, { force: true });
    return false;
  } catch (probeErr) {
    return UNWRITABLE_CODES.includes(probeErr.code);
  }
}

/**
 * Whether the inherited FGOS_ACTIVE_MANIFEST_PATH names a release whose Node payload is this checkout. The
 * release root is FGOS_ACTIVE_RELEASE_PATH (the manifest's directory when unset); an activated release
 * elsewhere cannot serve this checkout, and an unreadable or malformed manifest serves nothing.
 */
function inheritedManifestServes(env, cwd) {
  const manifestPath = env.FGOS_ACTIVE_MANIFEST_PATH;
  if (!manifestPath) return false;
  try {
    const root = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).components.legacyNode.root;
    if (typeof root !== 'string') return false;
    const releaseRoot = env.FGOS_ACTIVE_RELEASE_PATH || path.dirname(manifestPath);
    return fs.realpathSync(path.resolve(releaseRoot, root)) === fs.realpathSync(cwd);
  } catch {
    return false;
  }
}

/**
 * Makes the addon loadable for a script that reads YAML from a checkout: every YAML parse goes through the
 * native door, which loads only through a staged manifest. Tries reuse first; builds if missing or stale.
 * If building fails because target is unwritable, throws a named cause.
 */
export function ensureAddonForScript(env = process.env, cwd = REPO_ROOT) {
  if (inheritedManifestServes(env, cwd)) return;
  try {
    ensureStagedOrBuiltGitAddon(env, cwd, true, { captureStderr: true });
  } catch (err) {
    if (isTargetUnwritable(env, cwd, err)) {
      throw new Error(
        `The staged addon for this checkout is missing or stale: ${gitAddonDirectory(cwd)}. Restage it from an unconfined session with node scripts/git-addon.mjs.`,
        { cause: err }
      );
    }
    throw err;
  }
}

// Answers this process already proved, so a caller that prepares two runs (the canary, the suite)
// starts one check, not two. A named host is keyed by its file identity, so a rebuilt binary is
// checked again; a build by checkout and target directory.
const provenHosts = new Map();
const fileIdentity = (file) => { const st = fs.statSync(file); return `${file}:${st.size}:${st.mtimeMs}`; };

/**
 * Ensures FGOS_HOST_BIN is available and points to a runnable host binary.
 * If FGOS_HOST_BIN is already set and runnable, returns it without building.
 * Otherwise, builds fgos with cargo (debug incremental) using checkout's CARGO_TARGET_DIR.
 * Each answer is proved once per process.
 */
export function ensureHostBin(env = process.env, cwd = REPO_ROOT) {
  if (env.FGOS_HOST_BIN) {
    try {
      if (fs.existsSync(env.FGOS_HOST_BIN)) {
        const key = `named:${fileIdentity(env.FGOS_HOST_BIN)}`;
        if (!provenHosts.has(key)) {
          execFileSync(env.FGOS_HOST_BIN, ['version'], { stdio: 'ignore' });
          provenHosts.set(key, env.FGOS_HOST_BIN);
        }
        return env.FGOS_HOST_BIN;
      }
    } catch {}
  }

  const targetDir = env.CARGO_TARGET_DIR || path.join(cwd, 'target');
  const binName = process.platform === 'win32' ? 'fgos.exe' : 'fgos';
  const binPath = path.join(targetDir, 'debug', binName);
  const key = `built:${cwd}:${targetDir}`;
  if (provenHosts.has(key)) return provenHosts.get(key);

  try {
    execFileSync('cargo', ['--version'], { stdio: 'ignore' });
  } catch {
    throw new Error('cargo is required to build fgos host binary for testing, but was not found on PATH');
  }

  execFileSync('cargo', ['build', '-p', 'fgos'], {
    cwd,
    env: { ...env, CARGO_TARGET_DIR: targetDir, ...ensureOrtStatic(env) },
    stdio: 'inherit',
  });

  provenHosts.set(key, binPath);
  return binPath;
}
