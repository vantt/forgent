import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import * as gitPorts from '../../src/git/index.mjs';
import { root } from '../../scripts/git-addon.mjs';
import { fixture } from './phase07-fixture.mjs';
import { trackedLegacy } from './phase08-fixture.mjs';
import { migrateUseCase, checkStopped } from '../../src/verbs/events/migrate.mjs';
import { ensureHostBin } from '../../scripts/lib/git-addon-stage.mjs';
const hostBin = ensureHostBin();
const namespaceRefusal = "the scan runs inside a PID namespace that hides the host's processes; run it from the host";
function hostScan(t, scan) {
  if (scan.status === 'clean') return true;
  if (scan.status === 'needs-attest' && scan.blockers.length === 0 && scan.scans.every(s => s.result === 'unavailable' && s.detail === namespaceRefusal)) {
    t.skip(namespaceRefusal); return false;
  }
  assert.fail(`a process is working inside the fixture workspace before migration: ${JSON.stringify(scan)}`);
}


test('migrate --check runs real quiesce/setup/parity without publishing a ref or changing HEAD', async t => {
  const f = fixture(t, { machine: false }); trackedLegacy(f);
  const head = f.git('rev-parse', 'HEAD');
  const scan = checkStopped({ workspaces: [f.repo], hostBin });
  if (scan.status !== 'clean' && typeof gitPorts.createGitScopedCommit === 'function') { hostScan(t, scan); return; }
  if (scan.status !== 'clean') {
    await assert.rejects(migrateUseCase({ ...f.ctx, hostBin }, { check: true }), { code: 'event-store-writers-active' });
    assert.equal(f.git('for-each-ref', 'refs/fgos/legacy'), '');
    t.diagnostic(`Real quiesce correctly refused: ${scan.detail}; successful command-level check needs a host scan`);
    return;
  }
  const result = await migrateUseCase({ ...f.ctx, hostBin }, { check: true });
  assert.equal(result.parity.equal, true); assert.equal(result.check, true);
  assert.equal(f.git('for-each-ref', 'refs/fgos/legacy'), ''); assert.equal(f.git('rev-parse', 'HEAD'), head);
  assert.ok(result.plan.deletions.includes('docs/distillery/state/porting/state.json'));
  assert.ok(result.plan.deletions.includes('.fgos/events.jsonl.backup-two'));
});

test('real Git 05 hook migration and second-run no-op', { skip: typeof gitPorts.createGitScopedCommit !== 'function' ? 'Requires Git 05 merge and activated release; no substitute Git writer' : false }, async t => {
  const f = fixture(t); trackedLegacy(f);
  fs.appendFileSync(path.join(f.repo, '.gitattributes'), 'other-events/*.jsonl merge=union\n');
  f.git('add', '.gitattributes'); f.git('commit', '-qm', 'unrelated union rule');
  const scan = checkStopped({ workspaces: [f.repo], hostBin });
  if (!hostScan(t, scan)) return;
  const oldHost = process.env.FGOS_HOST_BIN, oldState = process.env.FGOS_STATE_ROOT;
  process.env.FGOS_HOST_BIN = hostBin; process.env.FGOS_STATE_ROOT = f.stateRoot;
  t.after(() => {
    if (oldHost === undefined) delete process.env.FGOS_HOST_BIN; else process.env.FGOS_HOST_BIN = oldHost;
    if (oldState === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = oldState;
  });
  f.git('config', 'core.hooksPath', path.join(root, '.githooks'));
  const result = await migrateUseCase({ ...f.ctx, hostBin, writer: 'fixture' });
  assert.equal(result.commit.status, 'committed');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.repo, '.fgos/events'))), result.pin);
  for (const p of result.plan.deletions) assert.equal(fs.existsSync(path.join(f.repo, p)), false, p);
  assert.equal(fs.readFileSync(path.join(f.repo, '.gitattributes'), 'utf8'), '*.txt text\nother-events/*.jsonl merge=union\n');
  assert.equal((await migrateUseCase({ ...f.ctx, hostBin, writer: 'fixture' })).unchanged, true);
  assert.throws(() => fs.writeFileSync(path.join(f.repo, '.fgos/events/old-release.jsonl'), ''), { code: 'ENOTDIR' });
});

test('real hook rejection restores baseline-only inputs and rerun uses a fresh WAL attempt', { skip: typeof gitPorts.createGitScopedCommit !== 'function' ? 'Requires Git 05 merge and activated release; no substitute Git writer' : false }, async t => {
  const f = fixture(t); const files = trackedLegacy(f, { porting: false, shards: false });
  if (!hostScan(t, checkStopped({ workspaces: [f.repo], hostBin }))) return;
  fs.writeFileSync(path.join(f.repo, '.gitattributes'), '.fgos/events*.jsonl merge=union\n');
  f.git('add', '.gitattributes'); f.git('commit', '-qm', 'only event attributes');
  const head = f.git('rev-parse', 'HEAD');
  const hooks = path.join(f.temp, 'reject-hooks'); fs.mkdirSync(hooks);
  fs.writeFileSync(path.join(hooks, 'pre-commit'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  f.git('config', 'core.hooksPath', hooks);
  let rejected;
  await assert.rejects(migrateUseCase({ ...f.ctx, hostBin, writer: 'fixture' }), error => { rejected = error; return error.code === 'commit-rejected'; });
  assert.equal(f.git('rev-parse', 'HEAD'), head);
  for (const [p, bytes] of Object.entries(files).filter(([p]) => p !== '.gitattributes')) assert.equal(fs.readFileSync(path.join(f.repo, p), 'utf8'), bytes);
  assert.equal(f.git('diff', '--cached', '--name-only'), '');
  fs.unlinkSync(path.join(hooks, 'pre-commit'));
  const result = await migrateUseCase({ ...f.ctx, hostBin, writer: 'fixture' });
  assert.notEqual(result.operationId, rejected.operationId);
  assert.equal(result.commit.status, 'committed');
  assert.notEqual(f.git('rev-parse', 'HEAD'), head);
  assert.equal(fs.existsSync(path.join(f.repo, '.gitattributes')), false);
  assert.deepEqual(JSON.parse(f.git('show', 'HEAD:.fgos/events')), result.pin);
});

// Real OS process classification and refusal, using a waiting Node payload so the
// process stays observable independently of migration/ScopedCommit availability.
// A linked worktree lives outside the main root, so only the listing of the
// repository's worktrees attributes a process working there to this workspace.
test('a process working inside the fixture workspace or one of its linked worktrees blocks migrate before any Git or ref effect', async t => {
  const f = fixture(t); trackedLegacy(f);
  const linked = path.join(f.temp, 'linked');
  f.git('worktree', 'add', '-q', '--detach', linked);
  if (!hostScan(t, checkStopped({ workspaces: [{ root: f.repo, worktrees: [linked] }], hostBin }))) return;
  const head = f.git('rev-parse', 'HEAD');
  for (const cwd of [f.repo, linked]) {
    const child = spawn(process.execPath, ['-e', "process.stdout.write('ready\\n'); setInterval(() => {}, 1000)", path.join(root, 'bin/fgos.mjs'), 'events', 'migrate'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    try {
      await once(child.stdout, 'data');
      const scan = checkStopped({ workspaces: [{ root: f.repo, worktrees: [linked] }], hostBin });
      assert.equal(scan.status, 'blocked', JSON.stringify(scan));
      assert.ok(scan.blockers.some(p => p.pid === child.pid), JSON.stringify(scan));
      await assert.rejects(migrateUseCase({ ...f.ctx, hostBin, writer: 'fixture' }), error => {
        assert.equal(error.code, 'event-store-writers-active', cwd);
        assert.ok(error.message.includes(String(child.pid)), error.message);
        return true;
      });
      assert.equal(f.git('rev-parse', 'HEAD'), head);
      assert.equal(f.git('for-each-ref', 'refs/fgos/legacy'), '');
      assert.equal(fs.existsSync(path.join(f.repo, '.fgos/events.jsonl')), true);
    } finally { child.kill(); await once(child, 'exit'); }
  }
});

test('pre-commit filesystem failure restores deleted inputs without naming a Git record', { skip: typeof gitPorts.createGitScopedCommit !== 'function' ? 'Requires Git 05 merge and activated release; no substitute Git writer' : false }, async t => {
  const f = fixture(t); const files = trackedLegacy(f);
  if (!hostScan(t, checkStopped({ workspaces: [f.repo], hostBin }))) return;
  const head = f.git('rev-parse', 'HEAD');
  // Empty directories are invisible to Git's clean-tree check. This real
  // filesystem obstruction makes rmdir fail after the tracked deletions.
  fs.mkdirSync(path.join(f.repo, '.fgos/events/empty'));
  await assert.rejects(migrateUseCase({ ...f.ctx, hostBin, writer: 'fixture' }), error => {
    assert.equal(error.code, 'ENOTEMPTY');
    assert.equal(error.message.includes('inspect Git ScopedCommit record'), false);
    return true;
  });
  assert.equal(f.git('rev-parse', 'HEAD'), head);
  assert.equal(f.git('diff', '--cached', '--name-only'), '');
  for (const [name, bytes] of Object.entries(files)) assert.equal(fs.readFileSync(path.join(f.repo, name), 'utf8'), bytes);
});

test('checkStopped does not count a pid the caller declares as its own, and counts every other matching pid', async t => {
  const f = fixture(t, { machine: false });
  if (!hostScan(t, checkStopped({ workspaces: [f.repo], hostBin }))) return;
  // boundary: the host's quiesce-scan route decides what a process is; only a real process shows that checkStopped passes --exclude-pid through to it.
  const child = spawn(process.execPath, ['-e', "process.stdout.write('ready\\n'); setInterval(() => {}, 1000)", path.join(root, 'bin/fgos.mjs')], { cwd: f.repo, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await once(child.stdout, 'data');
    const counted = checkStopped({ workspaces: [f.repo], hostBin });
    assert.ok(counted.blockers.some(p => p.pid === child.pid), JSON.stringify(counted));
    const excluded = checkStopped({ workspaces: [f.repo], hostBin, excludePids: [child.pid] });
    assert.ok(!excluded.blockers.some(p => p.pid === child.pid), JSON.stringify(excluded));
  } finally { child.kill(); await once(child, 'exit'); }
});

test('checkStopped counts a process working in a linked worktree only when the caller lists that worktree', async t => {
  const f = fixture(t, { machine: false }); trackedLegacy(f);
  const linked = path.join(f.temp, 'linked-listing');
  f.git('worktree', 'add', '-q', '--detach', linked);
  if (!hostScan(t, checkStopped({ workspaces: [{ root: f.repo, worktrees: [linked] }], hostBin }))) return;
  // boundary: only a real process with its cwd in a worktree shows that checkStopped passes the listed --dir values through to the host's quiesce-scan.
  const sleeper = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: linked, stdio: 'ignore' });
  try {
    const unlisted = checkStopped({ workspaces: [f.repo], hostBin });
    assert.ok(!unlisted.blockers.some(p => p.pid === sleeper.pid), JSON.stringify(unlisted));
    const listed = checkStopped({ workspaces: [{ root: f.repo, worktrees: [linked] }], hostBin });
    const found = listed.blockers.find(p => p.pid === sleeper.pid);
    assert.ok(found, JSON.stringify(listed));
    assert.equal(found.matched, 'cwd');
  } finally { sleeper.kill(); await once(sleeper, 'exit'); }
});

test('checkStopped reports unreadable process entries as a blocker of their own', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-es-unreadable-host-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const host = path.join(dir, 'unreadable-host.sh');
  fs.writeFileSync(host, `#!/bin/sh
printf '%s' '{"v":1,"protocol":1,"result":"processes","processes":[],"unreadable":2}'
exit 10
`, { mode: 0o755 });
  const scan = checkStopped({ workspaces: [dir], hostBin: host });
  assert.equal(scan.status, 'blocked');
  assert.deepEqual(scan.blockers, [{ kind: 'unreadable', workspace: dir, count: 2 }]);
});
