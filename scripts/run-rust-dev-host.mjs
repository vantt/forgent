#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { nativeAddonLibraryName } from './build-rust-distribution.mjs';
import { devHostEnv, devHostManifest } from './lib/dev-host-manifest.mjs';
import { gitAddonDirectory } from './lib/git-addon-stage.mjs';
import { processesInside } from '../src/runner/dispatch/stop-processes-inside.mjs';
import { scan } from '../src/runner/dispatch/process-identity.mjs';

const checkoutRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Scratch artifacts must satisfy the same no-symlink contract as release files.
function assertLocalPath(relativePath) {
  let current = checkoutRoot;
  for (const segment of relativePath.split('/')) {
    current = path.join(current, segment);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) {
        throw new Error(`Refusing symlink in development artifact path: ${current}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

function atomicWrite(destination, writeTemporary) {
  const temporary = `${destination}.${process.pid}.tmp`;
  let created = false;
  try {
    // Exclusive creation also refuses a pre-existing temporary symlink.
    const fd = fs.openSync(temporary, 'wx', 0o755);
    created = true;
    fs.closeSync(fd);
    writeTemporary(temporary);
    fs.renameSync(temporary, destination);
  } finally {
    if (created) fs.rmSync(temporary, { force: true });
  }
}
const HOST_ENV_KEYS = ['FGOS_HOST_BIN'];
// A staged run directory left behind is pruned only once it is this old, so a run still being staged
// by a concurrent invocation (no process runs from it yet) is never taken from under it.
export const STALE_RUN_DIR_MS = 10 * 60 * 1000;

/**
 * Remove one invocation's staged host, unless a process still runs from it: a detached run supervisor
 * (or its gate) started by the host keeps executing it, and its attempt steps run it again by path. A
 * detached `node bin/fgos.mjs` child (the event-store seal and publish children) runs nothing from it
 * yet, but its FGOS_HOST_BIN names the staged host it will call.
 * Where the door cannot scan (`unsupported`: Windows, macOS) nothing proves the directory unused, so it is kept;
 * `pruneRunDirs` removes it once it is stale.
 * A view the scan could not read (`unreadable`) is not treated as a holder: it belongs to another user (permission
 * denied; on Linux most views are such), and the detached child of this launcher always runs as our own user.
 * @param {string} runtimeDir
 * @param {object[]|'unsupported'} [views] a scan already taken with `HOST_ENV_KEYS`, shared across directories
 * @returns {boolean} whether the directory was removed
 */
export function releaseRunDir(runtimeDir, views = scan({ envKeys: HOST_ENV_KEYS })) {
  if (views === 'unsupported') return false;
  if (processesInside(runtimeDir, { envKeys: HOST_ENV_KEYS, views }).length > 0) return false;
  fs.rmSync(runtimeDir, { recursive: true, force: true });
  return true;
}

/**
 * Remove the staged run directories that were kept for a process which has since ended. `views` is the process scan
 * (taken here, once, when the first stale directory is found, unless the caller supplies one). A removal that fails
 * leaves its directory for the next prune and never throws.
 */
export function pruneRunDirs(runtimeBase, { now = Date.now(), staleMs = STALE_RUN_DIR_MS, views = null } = {}) {
  let names;
  try { names = fs.readdirSync(runtimeBase); } catch { return; }
  for (const name of names.filter((n) => n.startsWith('run-'))) {
    const dir = path.join(runtimeBase, name);
    let stat;
    try { stat = fs.lstatSync(dir); } catch { continue; }
    if (!stat.isDirectory() || now - stat.mtimeMs < staleMs) continue;
    views ??= scan({ envKeys: HOST_ENV_KEYS });
    try {
      // Without a scan only age speaks: a directory this old (stale) is removed.
      if (views === 'unsupported') fs.rmSync(dir, { recursive: true, force: true });
      else releaseRunDir(dir, views);
    } catch { /* kept for the next prune (a host still running from it holds its files on Windows) */ }
  }
}

function forwardResult(result, description) {
  if (result.error) {
    throw new Error(`${description}: ${result.error.message}`);
  }
  if (result.signal) {
    process.kill(process.pid, result.signal);
    return 1;
  }
  return result.status ?? 1;
}

/**
 * Point this launcher's own environment at a persistent staged copy of the addon and host that cargo just built,
 * so the process door loads from a directory the launcher never deletes (a per-run copy is removed at the end,
 * which a loaded addon forbids on Windows). Nothing is built here; unchanged bytes are not rewritten.
 */
export function stageLauncherDoor(targetDir = path.resolve(checkoutRoot, process.env.CARGO_TARGET_DIR ?? 'target')) {
  const dir = gitAddonDirectory(checkoutRoot);
  assertLocalPath(path.relative(checkoutRoot, dir).split(path.sep).join('/'));
  fs.mkdirSync(dir, { recursive: true });
  const stage = (name, source, mode) => {
    const destination = path.join(dir, name);
    const bytes = fs.readFileSync(source);
    if (!fs.existsSync(destination) || !fs.readFileSync(destination).equals(bytes)) {
      atomicWrite(destination, (temporary) => {
        fs.writeFileSync(temporary, bytes);
        fs.chmodSync(temporary, mode);
      });
    }
    return destination;
  };
  const fgosBin = stage(process.platform === 'win32' ? 'fgos.exe' : 'fgos', path.join(targetDir, 'debug', process.platform === 'win32' ? 'fgos.exe' : 'fgos'), 0o755);
  const addonFile = stage('fgos.node', path.join(targetDir, 'debug', nativeAddonLibraryName()), 0o644);
  const manifestPath = path.join(dir, 'manifest.json');
  const manifestBytes = `${JSON.stringify(devHostManifest({ checkoutRoot, fgosBin, addonFile }), null, 2)}\n`;
  if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, 'utf8') !== manifestBytes) {
    atomicWrite(manifestPath, (temporary) => {
      fs.writeFileSync(temporary, manifestBytes);
      fs.chmodSync(temporary, 0o644);
    });
  }
  Object.assign(process.env, devHostEnv({}, { fgosBin, checkoutRoot, manifestPath }));
}

function main() {
  const build = spawnSync('cargo', ['build', '--locked', '--package', 'fgos', '--package', 'fgos-node-addon'], {
    cwd: checkoutRoot,
    stdio: 'inherit',
    env: process.env,
  });
  const buildStatus = forwardResult(build, 'Failed to run cargo build');
  if (buildStatus !== 0) return buildStatus;

  const targetDir = path.resolve(checkoutRoot, process.env.CARGO_TARGET_DIR ?? 'target');
  const binaryName = process.platform === 'win32' ? 'fgos.exe' : 'fgos';
  const selectedBinary = path.join(targetDir, 'debug', binaryName);
  const runtimeBaseRelative = '.fgos/runtime/dev-host';
  assertLocalPath(runtimeBaseRelative);
  assertLocalPath('bin/fgos.mjs');
  const runtimeBase = path.join(checkoutRoot, runtimeBaseRelative);
  fs.mkdirSync(runtimeBase, { recursive: true });
  stageLauncherDoor(targetDir);
  pruneRunDirs(runtimeBase);
  const runtimeDir = fs.mkdtempSync(path.join(runtimeBase, 'run-'));
  let child;
  const binaryRelative = `${runtimeBaseRelative}/${path.basename(runtimeDir)}/${binaryName}`;
  const fgosBin = path.join(runtimeDir, binaryName);
  try {
    assertLocalPath(binaryRelative);
    atomicWrite(fgosBin, (temporary) => {
      fs.copyFileSync(selectedBinary, temporary);
      fs.chmodSync(temporary, 0o755);
    });

    const addonRelative = `${runtimeBaseRelative}/${path.basename(runtimeDir)}/fgos.node`;
    const addonFile = path.join(runtimeDir, 'fgos.node');
    assertLocalPath(addonRelative);
    atomicWrite(addonFile, (temporary) => {
      fs.copyFileSync(path.join(targetDir, 'debug', nativeAddonLibraryName()), temporary);
      fs.chmodSync(temporary, 0o644);
    });
    const manifest = devHostManifest({ checkoutRoot, fgosBin, addonFile });
    const manifestPath = path.join(runtimeDir, 'manifest.json');
    assertLocalPath(`${runtimeBaseRelative}/${path.basename(runtimeDir)}/manifest.json`);
    atomicWrite(manifestPath, (temporary) => {
      fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
      fs.chmodSync(temporary, 0o644);
    });

    child = spawnSync(fgosBin, process.argv.slice(2), {
      cwd: process.env.INIT_CWD ?? process.cwd(),
      stdio: 'inherit',
      env: devHostEnv(process.env, { fgosBin, checkoutRoot, manifestPath }),
    });
  } finally {
    // Remove only this invocation's artifacts, never another run or user file, and not while a
    // process it started still runs from them; a later invocation prunes them once it has ended.
    releaseRunDir(runtimeDir);
  }
  // In particular, forward a child signal only after cleaning its run directory.
  return forwardResult(child, `Failed to execute ${fgosBin}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
