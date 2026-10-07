#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { computeArtifactDigest, hashFile } from './build-rust-distribution.mjs';

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

function main() {
  const build = spawnSync('cargo', ['build', '--package', 'fgos'], {
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

    const legacyNodeDigest = hashFile(path.join(checkoutRoot, 'bin/fgos.mjs'));
    const fgosDigest = hashFile(fgosBin);
    const manifestWithoutDigest = {
      schemaVersion: 1,
      entries: { fgos: binaryRelative },
      components: {
        legacyNode: { root: '.', entry: 'bin/fgos.mjs', digest: legacyNodeDigest },
      },
      requires: { node: '>=18' },
      target: { os: process.platform, arch: process.arch },
      stateSchemas: { read: ['2'], write: ['2'], migrations: [] },
      files: [
        { path: 'bin/fgos.mjs', kind: 'file', digest: legacyNodeDigest, mode: '755', class: 'legacy-node' },
        { path: binaryRelative, kind: 'file', digest: fgosDigest, mode: '755', class: 'native-host' },
      ],
    };
    const manifest = {
      ...manifestWithoutDigest,
      artifactDigest: computeArtifactDigest(manifestWithoutDigest),
    };
    const manifestPath = path.join(runtimeDir, 'manifest.json');
    assertLocalPath(`${runtimeBaseRelative}/${path.basename(runtimeDir)}/manifest.json`);
    atomicWrite(manifestPath, (temporary) => {
      fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
      fs.chmodSync(temporary, 0o644);
    });

    child = spawnSync(fgosBin, process.argv.slice(2), {
      cwd: process.env.INIT_CWD ?? process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        FGOS_ACTIVE_RELEASE_PATH: checkoutRoot,
        FGOS_ACTIVE_MANIFEST_PATH: manifestPath,
      },
    });
  } finally {
    // Remove only this invocation's artifacts, never another run or user file.
    fs.rmSync(runtimeDir, { recursive: true, force: true });
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
