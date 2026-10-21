#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { nativeAddonLibraryName } from './build-rust-distribution.mjs';
import { devHostEnv, devHostManifest } from './lib/dev-host-manifest.mjs';
import { ensureGitAddon } from './lib/git-addon-stage.mjs';
import { processesInside } from '../src/runner/dispatch/stop-processes-inside.mjs';

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
// A staged run directory left behind is pruned only once it is this old, so a run still being staged
// by a concurrent invocation (no process runs from it yet) is never taken from under it.
export const STALE_RUN_DIR_MS = 10 * 60 * 1000;

/**
 * Remove one invocation's staged host, unless a process still runs from it: a detached run supervisor
 * (or its gate) started by the host keeps executing it, and its attempt steps run it again by path.
 * @returns {boolean} whether the directory was removed
 */
export function releaseRunDir(runtimeDir) {
  if (processesInside(runtimeDir).length > 0) return false;
  fs.rmSync(runtimeDir, { recursive: true, force: true });
  return true;
}

/** Remove the staged run directories that were kept for a process which has since ended. */
export function pruneRunDirs(runtimeBase, { now = Date.now(), staleMs = STALE_RUN_DIR_MS } = {}) {
  let names;
  try { names = fs.readdirSync(runtimeBase); } catch { return; }
  for (const name of names.filter((n) => n.startsWith('run-'))) {
    const dir = path.join(runtimeBase, name);
    let stat;
    try { stat = fs.lstatSync(dir); } catch { continue; }
    if (!stat.isDirectory() || now - stat.mtimeMs < staleMs) continue;
    releaseRunDir(dir);
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

/** Stage this checkout's addon and host and point the launcher's own environment at them. */
export function stageLauncherDoor() {
  ensureGitAddon(process.env, checkoutRoot);
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
  // The launcher has no manifest of its own: load the process door from the persistent staged addon, never
  // from a per-run copy that is about to be deleted.
  stageLauncherDoor();
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
