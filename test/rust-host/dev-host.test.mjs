import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { listLegacyNodeSourceFiles, hashFile, computeArtifactDigest } from '../../scripts/build-rust-distribution.mjs';
import { initStore, addWork } from '../../src/state/store.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const binaryName = process.platform === 'win32' ? 'fgos.exe' : 'fgos';
const nativeBinary = path.join(repoRoot, 'target', 'release', binaryName);
const cleanEnv = () => {
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  delete env.CARGO_TARGET_DIR;
  delete env.INIT_CWD;
  delete env.FGOS_ACTIVE_RELEASE_PATH;
  delete env.FGOS_ACTIVE_MANIFEST_PATH;
  return env;
};

function fixture() {
  assert.ok(fs.existsSync(nativeBinary), `Build the release fgos host before this suite: ${nativeBinary}`);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dev-host-'));
  const checkout = path.join(root, 'checkout');
  const workspace = path.join(root, 'workspace');
  const subdir = path.join(workspace, 'nested');
  fs.mkdirSync(subdir, { recursive: true });
  fs.mkdirSync(path.join(root, 'home'));
  fs.mkdirSync(path.join(root, 'state'));
  for (const relative of listLegacyNodeSourceFiles(repoRoot)) {
    const destination = path.join(checkout, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, relative), destination);
  }
  // Real production dependencies, copied rather than symlinked into the payload.
  fs.cpSync(path.join(repoRoot, 'node_modules'), path.join(checkout, 'node_modules'), { recursive: true, dereference: true });
  const session = process.env.CLAUDE_CODE_SESSION_ID;
  const stateHome = process.env.FGOS_STATE_HOME;
  process.env.FGOS_STATE_HOME = path.join(root, 'state');
  delete process.env.CLAUDE_CODE_SESSION_ID;
  try {
    const dir = path.join(subdir, '.fgos');
    initStore(dir);
    addWork(dir, { id: 'dev-consumer', title: 'Workspace selected by runtime cwd', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  } finally {
    if (session !== undefined) process.env.CLAUDE_CODE_SESSION_ID = session;
    if (stateHome === undefined) delete process.env.FGOS_STATE_HOME;
    else process.env.FGOS_STATE_HOME = stateHome;
  }
  const builderDir = path.join(root, 'builder');
  fs.mkdirSync(builderDir);
  // Only Cargo is substituted: it installs an existing
  // compiled native host. Every command below executes that real host, its
  // unchanged manifest verifier, and the actual checkout Node consumer.
  const builder = `#!${process.execPath}\nimport fs from 'node:fs';\nimport path from 'node:path';\nif (process.env.DEV_TEST_BUILD_FAIL) process.exit(Number(process.env.DEV_TEST_BUILD_FAIL));\nconst target = path.resolve(process.cwd(), process.env.CARGO_TARGET_DIR ?? 'target');\nfs.mkdirSync(path.join(target, 'debug'), { recursive: true });\nfs.copyFileSync(process.env.DEV_TEST_NATIVE_BINARY, path.join(target, 'debug', ${JSON.stringify(binaryName)}));\nfs.chmodSync(path.join(target, 'debug', ${JSON.stringify(binaryName)}), 0o755);\n`;
  fs.writeFileSync(path.join(builderDir, 'cargo'), builder, { mode: 0o755 });
  fs.writeFileSync(path.join(builderDir, 'package.json'), '{"type":"module"}\n');
  const env = {
    ...cleanEnv(),
    PATH: `${builderDir}${path.delimiter}${process.env.PATH}`,
    DEV_TEST_NATIVE_BINARY: nativeBinary,
    FGOS_STATE_HOME: path.join(root, 'state'),
    HOME: path.join(root, 'home'),
  };
  const run = (args, extraEnv = {}, cwd = checkout) => spawnSync(process.execPath, [path.join(checkout, 'scripts/run-rust-dev-host.mjs'), ...args], {
    cwd, env: { ...env, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 30000,
  });
  return { root, checkout, workspace, subdir, env, run, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

for (const layout of ['default', 'shared-default', 'relative', 'absolute']) {
  test(`dev door runs the real Node consumer from INIT_CWD with ${layout} Cargo output`, { skip: process.platform === 'win32' }, () => {
    const f = fixture();
    try {
      const extraEnv = { INIT_CWD: f.subdir };
      if (layout === 'shared-default') {
        const sharedTarget = path.join(f.root, 'shared-target');
        fs.mkdirSync(sharedTarget);
        fs.symlinkSync(sharedTarget, path.join(f.checkout, 'target'), 'dir');
      }
      if (layout === 'relative' || layout === 'absolute') {
        extraEnv.CARGO_TARGET_DIR = layout === 'relative' ? 'custom-target' : path.join(f.root, 'external-target');
        const stale = path.join(f.checkout, 'target/debug', binaryName);
        fs.mkdirSync(path.dirname(stale), { recursive: true });
        fs.writeFileSync(stale, 'stale default is not executable');
      }
      const result = f.run(['list', '--id', 'dev-consumer', '--json'], extraEnv);
      assert.equal(result.status, 0, `${result.error ?? ''}\n${result.stderr}`);
      assert.match(result.stdout, /Workspace selected by runtime cwd/);
      const runtime = path.join(f.checkout, '.fgos/runtime/dev-host');
      assert.deepEqual(fs.readdirSync(runtime), [], 'completed invocation cleans its artifacts');
      // No INIT_CWD falls back to the invoking process's actual cwd.
      const fallbackEnv = extraEnv.CARGO_TARGET_DIR === undefined ? {} : { CARGO_TARGET_DIR: extraEnv.CARGO_TARGET_DIR };
      const fallback = f.run(['list', '--id', 'dev-consumer', '--json'], fallbackEnv, f.subdir);
      assert.equal(fallback.status, 0, fallback.stderr);
      assert.match(fallback.stdout, /Workspace selected by runtime cwd/);
      const failedConsumer = f.run(['list', '--id'], extraEnv);
      const directFailure = spawnSync(process.execPath, [path.join(f.checkout, 'bin/fgos.mjs'), 'list', '--id'], {
        cwd: f.subdir, env: f.env, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 30000,
      });
      assert.equal(directFailure.error, undefined);
      assert.notEqual(directFailure.status, 0);
      assert.equal(failedConsumer.status, directFailure.status, failedConsumer.stderr);
      assert.match(failedConsumer.stderr, /list --id requires/);
    } finally { f.cleanup(); }
  });
}

for (const relative of ['.fgos', '.fgos/runtime', '.fgos/runtime/dev-host', 'bin/fgos.mjs']) {
  test(`dev door refuses symlink segment ${relative} without modifying its target`, { skip: process.platform === 'win32' }, () => {
    const f = fixture();
    try {
      const destination = path.join(f.checkout, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      const outside = path.join(f.root, 'outside');
      const isFile = relative.endsWith(binaryName) || relative.endsWith('.json') || relative.endsWith('.mjs');
      if (isFile) fs.writeFileSync(outside, 'untouched');
      else fs.mkdirSync(outside);
      fs.rmSync(destination, { recursive: true, force: true });
      fs.symlinkSync(outside, destination, isFile ? 'file' : 'dir');
      const result = f.run(['list', '--json'], { INIT_CWD: f.subdir });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Refusing symlink/);
      if (isFile) assert.equal(fs.readFileSync(outside, 'utf8'), 'untouched');
      else assert.deepEqual(fs.readdirSync(outside), []);
    } finally { f.cleanup(); }
  });
}

test('dev door propagates Cargo failure without materializing or executing a host', { skip: process.platform === 'win32' }, () => {
  const f = fixture();
  try {
    const result = f.run(['list', '--json'], { DEV_TEST_BUILD_FAIL: '23', INIT_CWD: f.subdir });
    assert.equal(result.status, 23);
    assert.equal(fs.existsSync(path.join(f.checkout, '.fgos/runtime/dev-host')), false);
  } finally { f.cleanup(); }
});

test('concurrent dev consumers with distinct Cargo targets keep independent verified artifacts', { skip: process.platform === 'win32' }, async () => {
  const f = fixture();
  const runs = [];
  try {
    // Pause only the real Node consumer after the native host has verified its
    // manifest. The consumer still executes the production list command.
    const gate = path.join(f.root, 'consumer-gate.cjs');
    fs.writeFileSync(gate, `
const fs = require('node:fs');
const path = require('node:path');
if (process.argv[1] === path.join(process.env.DEV_TEST_CHECKOUT, 'bin', 'fgos.mjs')) {
  fs.writeFileSync(process.env.DEV_TEST_READY, 'ready');
  const deadline = Date.now() + 20000;
  while (!fs.existsSync(process.env.DEV_TEST_RELEASE)) {
    if (Date.now() > deadline) throw new Error('Timed out waiting to release real consumer');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
  }
}
`);
    const runtime = path.join(f.checkout, '.fgos/runtime/dev-host');
    fs.mkdirSync(runtime, { recursive: true });
    const userFile = path.join(runtime, 'user-owned');
    fs.writeFileSync(userFile, 'preserve');
    for (const name of ['first', 'second']) {
      const ready = path.join(f.root, `${name}.ready`);
      const release = path.join(f.root, `${name}.release`);
      const child = spawn(process.execPath, [path.join(f.checkout, 'scripts/run-rust-dev-host.mjs'), 'list', '--id', 'dev-consumer', '--json'], {
        cwd: f.checkout,
        env: {
          ...f.env,
          INIT_CWD: f.subdir,
          CARGO_TARGET_DIR: path.join(f.root, `${name}-target`),
          NODE_OPTIONS: `--require=${gate}`,
          DEV_TEST_CHECKOUT: f.checkout,
          DEV_TEST_READY: ready,
          DEV_TEST_RELEASE: release,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
      });
      let stdout = '';
      let stderr = '';
      child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
      child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
      const done = new Promise((resolve) => {
        child.on('error', (error) => resolve({ error, stdout, stderr }));
        child.on('close', (status, signal) => resolve({ status, signal, stdout, stderr }));
      });
      runs.push({ ready, release, done });
    }
    const deadline = Date.now() + 20000;
    while (!runs.every((run) => fs.existsSync(run.ready))) {
      assert.ok(Date.now() < deadline, 'both real Node consumers must reach the live-artifact barrier');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    const runDirs = fs.readdirSync(runtime).filter((name) => name.startsWith('run-'));
    assert.equal(runDirs.length, 2, 'concurrent consumers have distinct confined run directories');
    for (const runDir of runDirs) {
      const directory = path.join(runtime, runDir);
      const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
      const entry = manifest.entries.fgos;
      assert.equal(path.resolve(f.checkout, entry), path.join(directory, binaryName));
      assert.equal(hashFile(path.join(directory, binaryName)), hashFile(nativeBinary));
      assert.equal(manifest.files.find((file) => file.class === 'native-host').digest, hashFile(nativeBinary));
      const { artifactDigest, ...withoutDigest } = manifest;
      assert.equal(artifactDigest, computeArtifactDigest(withoutDigest));
    }
    fs.writeFileSync(runs[0].release, 'release');
    const first = await runs[0].done;
    assert.equal(first.status, 0, `${first.error ?? ''}\n${first.stderr}`);
    assert.match(first.stdout, /Workspace selected by runtime cwd/);
    assert.equal(fs.readdirSync(runtime).filter((name) => name.startsWith('run-')).length, 1, 'one completed run never cleans the other live consumer');
    fs.writeFileSync(runs[1].release, 'release');
    const second = await runs[1].done;
    assert.equal(second.status, 0, `${second.error ?? ''}\n${second.stderr}`);
    assert.match(second.stdout, /Workspace selected by runtime cwd/);
    assert.deepEqual(fs.readdirSync(runtime), ['user-owned']);
    assert.equal(fs.readFileSync(userFile, 'utf8'), 'preserve');
  } finally {
    for (const run of runs) fs.writeFileSync(run.release, 'release');
    await Promise.all(runs.map((run) => run.done));
    f.cleanup();
  }
});
