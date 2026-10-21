import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture } from '../git/worktree-fixture.mjs';
import { createGitInspect } from '../../src/git/inspect.mjs';
import { createGitSafeRestore } from '../../src/git/restore.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';

test('Worktree uses borrowed admin authority and Inspect returns checkout and branch facts', () => {
  const f = fixture(); let admin;
  try {
    admin = acquireSync(createLockScope(), 'worktree-admin', { fgosDir: f.fgosDir });
    assert.equal(admin.result, 'acquired');
    const worker = path.join(f.temp, 'worker');
    f.port.create({ path: worker, branch: 'fgw/topic', base: f.tip, operationId: 'borrowed-create' }, [admin.handle]);
    admin.handle.release(); admin = null;
    const inspect = createGitInspect({ ...f.options, repoPath: worker }, f.loader);
    assert.deepEqual(inspect.listBranches({ prefix: 'refs/heads/fgw/' }), ['refs/heads/fgw/topic']);
    const facts = inspect.checkoutFacts({ revision: f.tip });
    assert.equal(facts.lastSynced, f.tip);
    assert.deepEqual(facts.delta, []);
    fs.writeFileSync(path.join(worker, 'file'), 'edited');
    assert.deepEqual(Buffer.from(inspect.checkoutFacts({ revision: f.tip }).delta).toString(), 'file\0');
    const comparison = inspect.compareCommits({ left: f.tip, right: f.tip });
    assert.deepEqual(comparison, { mergeBase: f.tip, left: 0, right: 0, commits: [] });
  } finally { admin?.handle.release(); f.cleanup(); }
});

test('SafeRestore binds a stale checkout baseline and reapplies only its actual staged delta', () => {
  const f = fixture('files', true); let custody;
  try {
    const worker = path.join(f.temp, 'worker');
    f.port.create({ path: worker, branch: 'fgw/topic', base: f.tip, operationId: 'create' });
    fs.writeFileSync(path.join(f.repoPath, 'incoming'), 'incoming');
    f.git('add', 'incoming'); f.git('commit', '-qm', 'incoming');
    const target = f.git('rev-parse', 'HEAD');
    f.git('update-ref', 'refs/heads/fgw/topic', target, f.tip);
    const git = (...args) => execFileSync('git', ['-C', worker, ...args], { encoding: 'utf8' }).trim();
    fs.writeFileSync(path.join(worker, 'local'), 'staged bytes'); git('add', 'local');
    custody = acquireSync(createLockScope(), 'dispatch-cwd', { fgosDir: f.fgosDir, cwd: worker });
    assert.equal(custody.result, 'acquired');
    const port = createGitSafeRestore({ ...f.options, repoPath: worker }, f.loader);
    const request = { expectedHead: target, target, checkoutBaseline: f.tip, reason: 'resync stale checkout', reapplyLocalDelta: true, requireStagedOnly: true };
    assert.throws(() => port.apply({ request: { ...request, reapplyLocalDelta: false, requireCleanBaseline: true }, operationId: 'dirty-auto-resync' }, [custody.handle]), /baseline-dirty/);
    assert.equal(fs.existsSync(path.join(worker, 'incoming')), false);
    fs.writeFileSync(path.join(worker, 'stray'), 'unstaged');
    assert.throws(() => port.apply({ request, operationId: 'stray-resync' }, [custody.handle]), /stray-dirt/);
    fs.unlinkSync(path.join(worker, 'stray'));
    const out = port.apply({ request, operationId: 'stale-restore' }, [custody.handle]);
    assert.equal(out.outcome.state, 'restored');
    assert.deepEqual(out.warnings, []);
    assert.equal(fs.readFileSync(path.join(worker, 'incoming'), 'utf8'), 'incoming');
    assert.equal(git('show', ':local'), 'staged bytes');
    assert.equal(git('diff', '--cached', '--name-only'), 'local');
    assert.equal(fs.existsSync(path.join(worker, '.fgos')), false);
    assert.throws(() => port.preview({ request: { ...request, checkoutBaseline: '0'.repeat(40) } }, [custody.handle]), /baseline-mismatch/);
  } finally { custody?.handle.release(); f.cleanup(); }
});

test('SafeRestore retry keeps its snapshot before discarding local bytes and returning to an ancestor', () => {
  const f = fixture(); let custody;
  try {
    const worker = path.join(f.temp, 'worker');
    f.port.create({ path: worker, branch: 'fgw/topic', base: f.tip, operationId: 'create' });
    const git = (...args) => execFileSync('git', ['-C', worker, ...args], { encoding: 'utf8' }).trim();
    git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
    fs.writeFileSync(path.join(worker, 'committed'), 'attempt'); git('add', 'committed'); git('commit', '-qm', 'attempt');
    const expectedHead = git('rev-parse', 'HEAD');
    fs.writeFileSync(path.join(worker, 'untracked'), 'keep in snapshot');
    custody = acquireSync(createLockScope(), 'dispatch-cwd', { fgosDir: f.fgosDir, cwd: worker });
    assert.equal(custody.result, 'acquired');
    const port = createGitSafeRestore({ ...f.options, repoPath: worker }, f.loader);
    const out = port.apply({ operationId: 'retry', request: { expectedHead, target: f.tip, reason: 'retry own attempt', discardLocalDelta: true } }, [custody.handle]);
    assert.equal(out.outcome.state, 'restored');
    assert.equal(git('rev-parse', 'HEAD'), f.tip);
    assert.equal(fs.existsSync(path.join(worker, 'untracked')), false);
    const saved = JSON.parse(fs.readFileSync(path.join(f.repoPath, '.git/fgos/git/restore-snapshots', out.snapshot)));
    assert.equal(Buffer.from(saved.paths.untracked.File[0]).toString(), 'keep in snapshot');
    assert.equal(git('rev-parse', 'refs/fgos/git-operations/retry/candidate'), expectedHead);
    port.acknowledge({ operationId: 'retry' }, [custody.handle]);
    assert.throws(() => git('rev-parse', '--verify', 'refs/fgos/git-operations/retry/candidate'));
  } finally { custody?.handle.release(); f.cleanup(); }
});


test('SafeRestore retains a detached session HEAD through cleanup and dirty baselines refuse before reset', () => {
  const f = fixture(); let custody;
  try {
    const worker = path.join(f.temp, 'detached');
    f.port.createDetached({ path: worker, base: f.tip, operationId: 'create-detached' });
    const git = (...args) => execFileSync('git', ['-C', worker, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    fs.writeFileSync(path.join(worker, 'session'), 'unique session bytes');
    git('add', 'session'); git('commit', '-qm', 'session');
    const expectedHead = git('rev-parse', 'HEAD');
    custody = acquireSync(createLockScope(), 'dispatch-cwd', { fgosDir: f.fgosDir, cwd: worker });
    assert.equal(custody.result, 'acquired');
    const port = createGitSafeRestore({ ...f.options, repoPath: worker }, f.loader);
    const request = { expectedHead, target: f.tip, reason: 'retain session before cleanup', discardLocalDelta: true, requireCleanBaseline: true };
    fs.writeFileSync(path.join(worker, 'dirty'), 'keep');
    assert.throws(() => port.apply({ operationId: 'dirty-session', request }, [custody.handle]), /baseline-dirty/);
    assert.equal(git('rev-parse', 'HEAD'), expectedHead);
    assert.equal(fs.readFileSync(path.join(worker, 'dirty'), 'utf8'), 'keep');
    fs.unlinkSync(path.join(worker, 'dirty'));
    const saved = port.apply({ operationId: 'retain-session', request }, [custody.handle]);
    assert.equal(saved.outcome.state, 'restored');
    assert.equal(git('rev-parse', 'HEAD'), f.tip);
    assert.equal(git('rev-parse', 'refs/fgos/git-operations/retain-session/candidate'), expectedHead);
    assert.equal(port.recover({ operationId: 'retain-session' }, [custody.handle]).outcome.state, 'restored');
    custody.handle.release(); custody = null;
    f.port.remove({ path: worker, expectedTip: f.tip, deliveredTo: f.tip, evidenceDigest: 'a'.repeat(64), operationId: 'remove-session' });
    assert.equal(fs.existsSync(worker), false);
    assert.equal(f.git('show', 'refs/fgos/git-operations/retain-session/candidate:session'), 'unique session bytes');
    assert.ok(fs.existsSync(path.join(f.repoPath, '.git/fgos/git/restore-snapshots', saved.snapshot)));
  } finally { custody?.handle.release(); f.cleanup(); }
});


test('Worktree creation preserves branch reservations hidden by detached rebase and bisect HEADs', () => {
  for (const marker of ['rebase-merge/head-name', 'BISECT_START']) {
    const f = fixture();
    try {
      const worker = path.join(f.temp, 'worker'), blocked = path.join(f.temp, 'blocked');
      f.port.create({ path: worker, branch: 'fgw/topic', base: f.tip, operationId: 'create' });
      const git = (...args) => execFileSync('git', ['-C', worker, ...args], {encoding:'utf8',stdio:'pipe'}).trim();
      git('checkout', '--detach', '-q');
      const file = path.join(git('rev-parse', '--absolute-git-dir'), marker);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const reservation = marker === 'BISECT_START' ? 'fgw/topic' : 'refs/heads/fgw/topic';
      fs.writeFileSync(file, reservation + '\n');
      assert.throws(() => f.port.create({ path: blocked, branch: 'fgw/topic', base: f.tip, operationId: 'blocked' }), /branch-in-use/);
      assert.equal(fs.existsSync(blocked), false);
      assert.equal(fs.readFileSync(file, 'utf8'), reservation + '\n');
      assert.equal(f.git('rev-parse', 'refs/heads/fgw/topic'), f.tip);
    } finally { f.cleanup(); }
  }
});
