import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { devHostEnv } from '../../scripts/lib/dev-host-manifest.mjs';
import { pruneRunDirs, releaseRunDir, STALE_RUN_DIR_MS } from '../../scripts/run-rust-dev-host.mjs';

// The staged dev host outlives its invocation while a detached process (a run supervisor) still runs
// from it, and goes once that process has ended. A real executable copied into the run directory
// stands in for the staged host; /proc is what decides.
const linuxOnly = process.platform !== 'linux' && 'reads /proc';

function stagedRun(base, name) {
  const dir = path.join(base, name);
  fs.mkdirSync(dir, { recursive: true });
  // Keep the name `sleep`: a coreutils multi-call binary dispatches on argv[0].
  const host = path.join(dir, 'sleep');
  fs.copyFileSync(fs.realpathSync('/bin/sleep'), host);
  fs.chmodSync(host, 0o755);
  return { dir, host };
}

const exited = (child) => new Promise((resolve) => (child.exitCode !== null || child.signalCode !== null ? resolve() : child.once('exit', resolve)));

test('a staged host a detached process still runs from is kept, and pruned once that process has ended', { skip: linuxOnly }, async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-host-'));
  const { dir, host } = stagedRun(base, 'run-held');
  const supervisor = spawn(host, ['300'], { detached: true, stdio: 'ignore' });
  try {
    assert.equal(releaseRunDir(dir), false, 'a running process keeps its staged host');
    assert.ok(fs.existsSync(host));

    // Old enough to prune, but still in use: a later invocation leaves it alone.
    pruneRunDirs(base, { now: Date.now() + STALE_RUN_DIR_MS + 1000 });
    assert.ok(fs.existsSync(host));
  } finally {
    supervisor.kill('SIGKILL');
    await exited(supervisor);
  }
  pruneRunDirs(base, { now: Date.now() + STALE_RUN_DIR_MS + 1000 });
  assert.equal(fs.existsSync(dir), false, 'pruned once nothing runs from it');
});

test('an unused staged host is removed at once, and a young one is never pruned by another invocation', { skip: linuxOnly }, () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-host-'));
  const done = stagedRun(base, 'run-done');
  assert.equal(releaseRunDir(done.dir), true);
  assert.equal(fs.existsSync(done.dir), false);

  // Being staged by a concurrent invocation: nothing runs from it yet, but it is young.
  const young = stagedRun(base, 'run-young');
  pruneRunDirs(base);
  assert.ok(fs.existsSync(young.host));
  // Only `run-*` directories of the dev door are ever touched.
  const other = path.join(base, 'manifest.json');
  fs.writeFileSync(other, '{}');
  pruneRunDirs(base, { now: Date.now() + STALE_RUN_DIR_MS + 1000 });
  assert.ok(fs.existsSync(other));
  assert.equal(fs.existsSync(young.dir), false);
});

test('the dev door points FGOS_HOST_BIN at the staged host, replacing any inherited host', () => {
  const env = devHostEnv(
    { FGOS_HOST_BIN: '/activated/bin/fgos', KEEP: '1' },
    { fgosBin: '/stage/run-x/fgos', checkoutRoot: '/checkout', manifestPath: '/stage/run-x/manifest.json' },
  );
  assert.equal(env.FGOS_HOST_BIN, '/stage/run-x/fgos');
  assert.equal(env.FGOS_ACTIVE_RELEASE_PATH, '/checkout');
  assert.equal(env.FGOS_ACTIVE_MANIFEST_PATH, '/stage/run-x/manifest.json');
  assert.equal(env.KEEP, '1');
});

test('the launcher scans for processes inside a run directory that does not exist yet, with no host variables inherited, and restaging an unchanged door rewrites nothing', { skip: linuxOnly }, () => {
  const env = { ...process.env };
  for (const name of Object.keys(env)) if (name.startsWith('FGOS_')) delete env[name];
  const launcher = fileURLToPath(new URL('../../scripts/run-rust-dev-host.mjs', import.meta.url));
  const stop = fileURLToPath(new URL('../../src/runner/dispatch/stop-processes-inside.mjs', import.meta.url));
  const script = `import { stageLauncherDoor } from ${JSON.stringify(launcher)};
    import { processesInside } from ${JSON.stringify(stop)};
    import fs from 'node:fs';
    stageLauncherDoor();
    const first = fs.statSync(process.env.FGOS_ACTIVE_MANIFEST_PATH).mtimeMs;
    stageLauncherDoor();
    const second = fs.statSync(process.env.FGOS_ACTIVE_MANIFEST_PATH).mtimeMs;
    console.log(JSON.stringify({ unchanged: first === second }));
    console.log(JSON.stringify(processesInside('/nonexistent-fgos-run-dir')));`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], { env, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const lines = run.stdout.trim().split('\n');
  // The store leak check of npm test compares mtime and size, so an identical manifest must not be rewritten.
  assert.deepEqual(JSON.parse(lines.at(-2)), { unchanged: true });
  assert.deepEqual(JSON.parse(lines.at(-1)), []);
});
