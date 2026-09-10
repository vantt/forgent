#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const checkoutRoot = path.resolve(__dirname, '..');

// 1. Run cargo build (debug profile)
const buildResult = spawnSync('cargo', ['build'], {
  cwd: checkoutRoot,
  stdio: 'inherit',
  env: process.env,
});

if (buildResult.error) {
  console.error(`Failed to run cargo build: ${buildResult.error.message}`);
  process.exit(1);
}

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

// 2. Write dev manifest JSON to a scratch path under target/
const targetDir = path.join(checkoutRoot, 'target');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const manifestPath = path.join(targetDir, 'dev-manifest.json');
const devManifest = {
  schemaVersion: 1,
  root: '.',
  entry: 'bin/fgos.mjs',
  entries: {
    fgos: 'target/debug/fgos',
  },
  components: {
    legacyNode: {
      root: '.',
      entry: 'bin/fgos.mjs',
    },
  },
};

fs.writeFileSync(manifestPath, JSON.stringify(devManifest, null, 2) + '\n');

// 3. Set environment variables and exec target/debug/fgos with forwarded arguments
const fgosBin = path.join(checkoutRoot, 'target', 'debug', 'fgos');
const child = spawnSync(fgosBin, process.argv.slice(2), {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    FGOS_ACTIVE_RELEASE_PATH: checkoutRoot,
    FGOS_ACTIVE_MANIFEST_PATH: manifestPath,
  },
});

if (child.error) {
  console.error(`Failed to execute ${fgosBin}: ${child.error.message}`);
  process.exit(1);
}

if (child.status !== null) {
  process.exit(child.status);
}

if (child.signal) {
  process.kill(process.pid, child.signal);
}
