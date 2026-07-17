import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  createSession,
  endSession,
  listSessions,
  reclaimOrphanedSessions,
  acquireSessionsLock,
  SessionError,
} from '../../src/runner/session.mjs';

// Every test builds its own disposable git repo (git init in a mkdtemp dir)
// and points session worktrees at a separate mkdtemp base — no test ever
// touches THIS repo (forgent itself) or the real product checkout.

const SESSION_MOD_PATH = fileURLToPath(new URL('../../src/runner/session.mjs', import.meta.url));

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-session-test-repo-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  // seed .fgos with a real committed store file, as the product repo has
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '');
  return repoRoot;
}

// Like initTempRepo, but COMMITS .fgos content into HEAD — mirroring the real
// product repo, where .fgos/events.jsonl (and friends) are git-tracked. This
// makes `git worktree add --detach` check out a real .fgos/ dir into the new
// worktree, the condition the gitignored-.fgos fixtures never exercised.
function initTempRepoWithCommittedFgos() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-session-test-repo-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seed":true}\n');
  execFileSync('git', ['add', '-A'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init with committed .fgos'], { cwd: repoRoot });
  return repoRoot;
}

function mkSessionsDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-session-test-wt-'));
}

function cleanup(repoRoot, sessionsDir) {
  try {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  } catch {
    /* throwaway */
  }
  if (sessionsDir) {
    try {
      fs.rmSync(sessionsDir, { recursive: true, force: true });
    } catch {
      /* throwaway */
    }
  }
}

function branchCount(repoRoot) {
  const out = execFileSync('git', ['branch', '--list'], { cwd: repoRoot, encoding: 'utf8' });
  return out.split('\n').filter((l) => l.trim()).length;
}

function readRegistry(repoRoot) {
  const p = path.join(repoRoot, '.fgos', 'sessions.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeRegistry(repoRoot, entries) {
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'sessions.json'), `${JSON.stringify(entries, null, 2)}\n`);
}

function commitInside(worktreePath) {
  fs.appendFileSync(path.join(worktreePath, 'seed.txt'), 'diverge\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'commit from inside session'], { cwd: worktreePath });
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreePath, encoding: 'utf8' }).trim();
}

/** A pid guaranteed dead: a child spawned and reaped synchronously. */
function deadPid() {
  return spawnSync(process.execPath, ['-e', 'process.exit(0)']).pid;
}

test('createSession makes exactly one detached worktree with zero new branches', () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  try {
    const before = branchCount(repoRoot);
    const sess = createSession(repoRoot, { sessionId: 'sess-a', sessionsDir });

    assert.equal(sess.sessionId, 'sess-a');
    assert.ok(fs.existsSync(path.join(sess.worktreePath, 'seed.txt')));
    assert.equal(branchCount(repoRoot), before, 'no new branch created by --detach');

    // genuinely detached HEAD: symbolic-ref fails inside the worktree
    assert.throws(() =>
      execFileSync('git', ['symbolic-ref', '-q', 'HEAD'], { cwd: sess.worktreePath, stdio: 'ignore' }),
    );

    // exactly one worktree beyond the main checkout is registered for the session
    const listed = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
    const detachedCount = listed.split('\n').filter((l) => l === 'detached').length;
    assert.equal(detachedCount, 1);
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});

test('.fgos inside the session worktree is a symlink to the shared store, not a copy', () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  try {
    const sess = createSession(repoRoot, { sessionId: 'sess-link', sessionsDir });
    const link = path.join(sess.worktreePath, '.fgos');
    assert.ok(fs.lstatSync(link).isSymbolicLink(), '.fgos is a symlink');

    // write through the session symlink, read from the main worktree's real .fgos
    fs.writeFileSync(path.join(link, 'probe.txt'), 'from-session\n');
    assert.equal(fs.readFileSync(path.join(repoRoot, '.fgos', 'probe.txt'), 'utf8'), 'from-session\n');

    // and the reverse: write in main, read through the session symlink (same inode)
    fs.writeFileSync(path.join(repoRoot, '.fgos', 'probe2.txt'), 'from-main\n');
    assert.equal(fs.readFileSync(path.join(link, 'probe2.txt'), 'utf8'), 'from-main\n');
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});

test('createSession succeeds when .fgos is git-committed into HEAD, still yielding a transparent symlink', () => {
  const repoRoot = initTempRepoWithCommittedFgos();
  const sessionsDir = mkSessionsDir();
  try {
    const sess = createSession(repoRoot, { sessionId: 'committed-fgos', sessionsDir });

    const link = path.join(sess.worktreePath, '.fgos');
    assert.ok(fs.lstatSync(link).isSymbolicLink(), '.fgos is a symlink, not the checked-out copy');
    assert.equal(fs.realpathSync(link), fs.realpathSync(path.join(repoRoot, '.fgos')), 'symlink resolves to the shared store');

    // still transparent to the real store: a write through the session symlink
    // is immediately visible from the main worktree's real .fgos/.
    fs.writeFileSync(path.join(link, 'probe.txt'), 'from-session\n');
    assert.equal(fs.readFileSync(path.join(repoRoot, '.fgos', 'probe.txt'), 'utf8'), 'from-session\n');

    // the removal only touched the worktree copy — the real repoRoot store's
    // committed seed content is untouched.
    assert.equal(fs.readFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), 'utf8'), '{"seed":true}\n');
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});

test('createSession rejects a caller-supplied sessionId outside the safe charset, with no side effects', () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  try {
    for (const bad of ['../evil', 'a/b', 'has space', 'semi;colon', '']) {
      assert.throws(
        () => createSession(repoRoot, { sessionId: bad, sessionsDir }),
        (err) => err instanceof SessionError,
        `expected SessionError for id ${JSON.stringify(bad)}`,
      );
    }
    // nothing was created or registered
    assert.deepEqual(readRegistry(repoRoot), []);
    assert.equal(fs.readdirSync(sessionsDir).length, 0);
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});

test('createSession refuses to nest inside an existing session worktree (realpath-based)', () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  const origCwd = process.cwd();
  try {
    const outer = createSession(repoRoot, { sessionId: 'outer', sessionsDir });
    // realpath the worktree so the test's own cwd matches what the guard computes
    process.chdir(fs.realpathSync(outer.worktreePath));
    assert.throws(
      () => createSession(repoRoot, { sessionId: 'inner', sessionsDir }),
      (err) => err instanceof SessionError && /inside an existing session worktree/.test(err.message),
    );
    // only the outer session exists — no nested worktree was created
    assert.equal(readRegistry(repoRoot).length, 1);
  } finally {
    process.chdir(origCwd);
    cleanup(repoRoot, sessionsDir);
  }
});

test('concurrent createSession from real separate OS processes never loses a registry entry', async () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  try {
    const ids = ['p0', 'p1', 'p2', 'p3', 'p4'];
    const childScript = `
      const { pathToFileURL } = require('node:url');
      import(pathToFileURL(process.argv[1]).href)
        .then((m) => { m.createSession(process.argv[2], { sessionId: process.argv[3], sessionsDir: process.argv[4] }); process.exit(0); })
        .catch((e) => { console.error(e && e.stack || String(e)); process.exit(1); });
    `;
    function forkCreate(id) {
      return new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ['-e', childScript, SESSION_MOD_PATH, repoRoot, id, sessionsDir],
          { stdio: ['ignore', 'ignore', 'pipe'] },
        );
        let stderr = '';
        child.stderr.on('data', (d) => {
          stderr += d;
        });
        child.on('error', reject);
        child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`child ${id} exited ${code}: ${stderr}`))));
      });
    }

    // launch all children at once so their read-modify-write of sessions.json
    // genuinely races across processes
    await Promise.all(ids.map(forkCreate));

    const registry = readRegistry(repoRoot);
    const gotIds = registry.map((e) => e.sessionId).sort();
    assert.deepEqual(gotIds, [...ids].sort(), 'every concurrently-created session survived — no lost update');
    // each got a distinct worktree
    const paths = new Set(registry.map((e) => e.worktreePath));
    assert.equal(paths.size, ids.length);
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});

test('sessions.lock excludes a concurrent holder and reclaims a stale (dead-pid) lock', () => {
  const repoRoot = initTempRepo();
  try {
    const fgosDir = path.join(repoRoot, '.fgos');
    const held = acquireSessionsLock(fgosDir);
    assert.ok(fs.existsSync(path.join(fgosDir, 'sessions.lock')), 'lock file exists while held');
    // a second acquire cannot win while the first is held (live pid = us)
    assert.throws(
      () => acquireSessionsLock(fgosDir, { timeoutMs: 150, retryMs: 20 }),
      (err) => err instanceof SessionError && /timed out/.test(err.message),
    );
    held.release();
    assert.ok(!fs.existsSync(path.join(fgosDir, 'sessions.lock')), 'lock file gone after release');

    // a stale lock (dead pid) is reclaimed, not waited on forever
    fs.writeFileSync(path.join(fgosDir, 'sessions.lock'), String(deadPid()));
    const after = acquireSessionsLock(fgosDir, { timeoutMs: 2000 });
    assert.equal(after.lockPath, path.join(fgosDir, 'sessions.lock'));
    after.release();
  } finally {
    cleanup(repoRoot);
  }
});

test('endSession removes a non-diverged session via plain remove and clears its registry entry', () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  try {
    const sess = createSession(repoRoot, { sessionId: 'clean-end', sessionsDir });
    assert.equal(listSessions(repoRoot).length, 1);

    endSession(repoRoot, 'clean-end');

    assert.equal(listSessions(repoRoot).length, 0, 'registry empty after end');
    assert.ok(!fs.existsSync(sess.worktreePath), 'worktree removed');
    const listed = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
    assert.ok(!listed.includes('detached'), 'no session worktree remains registered in git');
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});

test('endSession refuses a diverged session without force, naming the dangling sha; force removes it', () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  try {
    const sess = createSession(repoRoot, { sessionId: 'diverged', sessionsDir });
    const danglingSha = commitInside(sess.worktreePath);

    assert.throws(
      () => endSession(repoRoot, 'diverged'),
      (err) =>
        err instanceof SessionError &&
        err.message.includes(danglingSha) &&
        /diverged/.test(err.message),
      'refusal names the exact dangling commit sha',
    );
    // nothing was removed or mutated
    assert.ok(fs.existsSync(sess.worktreePath), 'worktree still present after refusal');
    assert.equal(listSessions(repoRoot).length, 1, 'registry unchanged after refusal');

    // force removes it, knowingly discarding the dangling commit
    endSession(repoRoot, 'diverged', { force: true });
    assert.ok(!fs.existsSync(sess.worktreePath), 'worktree removed with force');
    assert.equal(listSessions(repoRoot).length, 0);
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});

test('endSession on an unknown or already-ended session id is a clean SessionError', () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  try {
    assert.throws(
      () => endSession(repoRoot, 'never-existed'),
      (err) => err instanceof SessionError && /unknown or already-ended/.test(err.message),
    );

    createSession(repoRoot, { sessionId: 'once', sessionsDir });
    endSession(repoRoot, 'once');
    // second end is a clean validation error, no crash, registry stays empty
    assert.throws(
      () => endSession(repoRoot, 'once'),
      (err) => err instanceof SessionError,
    );
    assert.equal(listSessions(repoRoot).length, 0);
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});

test('listSessions reflects the registry and is empty after every session ends', () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  try {
    assert.deepEqual(listSessions(repoRoot), []);
    createSession(repoRoot, { sessionId: 's1', sessionsDir });
    createSession(repoRoot, { sessionId: 's2', sessionsDir });
    assert.deepEqual(
      listSessions(repoRoot)
        .map((e) => e.sessionId)
        .sort(),
      ['s1', 's2'],
    );
    endSession(repoRoot, 's1');
    endSession(repoRoot, 's2');
    assert.deepEqual(listSessions(repoRoot), []);
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});

test('reclaimOrphanedSessions cleans a dead-pid orphan, keeps a live session, and spares a diverged orphan', () => {
  const repoRoot = initTempRepo();
  const sessionsDir = mkSessionsDir();
  try {
    const live = createSession(repoRoot, { sessionId: 'live', sessionsDir });
    const orphan = createSession(repoRoot, { sessionId: 'orphan', sessionsDir });
    const divergedOrphan = createSession(repoRoot, { sessionId: 'diverged-orphan', sessionsDir });
    const danglingSha = commitInside(divergedOrphan.worktreePath);

    // Mark the two orphans' recorded pids dead; leave the live one as us.
    const dead = deadPid();
    const registry = readRegistry(repoRoot).map((e) =>
      e.sessionId === 'orphan' || e.sessionId === 'diverged-orphan' ? { ...e, pid: dead } : e,
    );
    writeRegistry(repoRoot, registry);

    const result = reclaimOrphanedSessions(repoRoot);

    assert.deepEqual(result.reclaimed, ['orphan'], 'the clean dead-pid orphan is reclaimed');
    assert.deepEqual(result.skipped, ['diverged-orphan'], 'the diverged orphan is spared');

    const remaining = listSessions(repoRoot)
      .map((e) => e.sessionId)
      .sort();
    assert.deepEqual(remaining, ['diverged-orphan', 'live'], 'live + diverged-orphan kept; clean orphan dropped');
    assert.ok(!fs.existsSync(orphan.worktreePath), 'clean orphan worktree removed');
    assert.ok(fs.existsSync(divergedOrphan.worktreePath), 'diverged orphan worktree preserved (dangling commit kept)');
    assert.ok(fs.existsSync(live.worktreePath), 'live session worktree untouched');
    // sanity: the preserved dangling commit is still there
    assert.equal(
      execFileSync('git', ['rev-parse', 'HEAD'], { cwd: divergedOrphan.worktreePath, encoding: 'utf8' }).trim(),
      danglingSha,
    );
  } finally {
    cleanup(repoRoot, sessionsDir);
  }
});
