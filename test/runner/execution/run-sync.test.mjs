// test/runner/execution/run-sync.test.mjs — a Unit that first merges a base ref into its branch.
//
// The runner, never the worker, runs `git merge`: a confined worker cannot write the gitdir. A clean
// merge is committed by the runner before the worker runs; a conflicted one leaves the conflicted
// paths for the worker (added to the write scope), and the runner finishes the merge commit after a
// passing round, refusing while a conflict marker is left.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { runUnit } from '../../../src/runner/execution/run.mjs';
import { validateUnit } from '../../../src/runner/execution/unit.mjs';
import { RunnerConfigError } from '../../../src/runner/dispatch/config.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';

seedFileLocalBwrapRegistry();

const gitIn = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const headOf = (cwd) => gitIn(cwd, 'rev-parse', 'HEAD').trim();
const mergeHeadOf = (cwd) => {
  try { return gitIn(cwd, 'rev-parse', '-q', '--verify', 'MERGE_HEAD').trim(); } catch { return null; }
};
const unitRecordOf = (repoRoot, id) => JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', id, 'unit.json'), 'utf8'));

function commitFile(cwd, rel, content, message) {
  fs.mkdirSync(path.dirname(path.join(cwd, rel)), { recursive: true });
  fs.writeFileSync(path.join(cwd, rel), content);
  gitIn(cwd, 'add', '--', rel);
  gitIn(cwd, 'commit', '-q', '-m', message);
}

/**
 * A repository with `main` and a linked worktree on `wt-branch`, both with a commit of their own
 * after the fork. `worker` is the body of the worker script: it runs with `files` (path -> content
 * to write), `prompt` and `runDir` (where its result goes) in scope.
 */
function setup({ mainFiles = { 'base.txt': 'from main\n' }, branchFiles = { 'mine.txt': 'from branch\n' } } = {}) {
  const repoRoot = makeFixtureDir('fgos-sync-');
  gitIn(repoRoot, 'init', '-q', '-b', 'main');
  gitIn(repoRoot, 'config', 'user.name', 'Sync Test');
  gitIn(repoRoot, 'config', 'user.email', 'sync@test.local');
  commitFile(repoRoot, 'README.md', 'line one\nline two\nline three\n', 'initial');
  const worktree = makeFixtureDir('fgos-sync-wt-');
  fs.rmSync(worktree, { recursive: true, force: true });
  gitIn(repoRoot, 'worktree', 'add', '-q', '-b', 'wt-branch', worktree);
  for (const [rel, content] of Object.entries(mainFiles)) commitFile(repoRoot, rel, content, `main: ${rel}`);
  for (const [rel, content] of Object.entries(branchFiles)) commitFile(worktree, rel, content, `branch: ${rel}`);

  const script = path.join(repoRoot, 'sync-worker.mjs');
  const command = path.join(repoRoot, 'alpha-bin');
  fs.symlinkSync(process.execPath, command);
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      defaultExecutor: 'alpha',
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      modelPolicies: { alpha: { standard: 'alpha-std' } },
      executors: {
        alpha: {
          kind: 'agent', allowCrossProvider: true, command, args: [script, '{prompt}'], providerModel: 'alpha',
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args: [script, '{prompt}'] }],
        },
      },
      capabilities: { 'docs:write': { prefer: [{ executor: 'alpha' }], rigor: 'standard' } },
      patterns: { defaultRule: { mutatingMinRigor: 'standard' } },
    },
  }, null, 2));
  return { repoRoot, worktree, script };
}

/** The worker writes `files`, then settles as done (or not at all when `settle` is false). */
function writeWorker(script, { files = {}, settle = true } = {}) {
  fs.writeFileSync(script, `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    for (const [rel, content] of Object.entries(${JSON.stringify(files)})) {
      fs.mkdirSync(path.dirname(rel), { recursive: true });
      fs.writeFileSync(rel, content);
    }
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match && ${JSON.stringify(settle)}) {
      const claimDir = path.dirname(match[1]);
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe prompt this worker was given, kept for the test:\\n' + prompt + '\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'docs: write the page', assessment: { verdict: 'pass' } }));
    }
  `);
}

function producerSpawns(repoRoot, unitRunId) {
  const roleDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId, 'producer');
  if (!fs.existsSync(roleDir)) return 0;
  let n = 0;
  for (const attempt of fs.readdirSync(roleDir)) {
    const runs = path.join(roleDir, attempt, 'runs');
    if (fs.existsSync(runs)) n += fs.readdirSync(runs).filter((r) => fs.existsSync(path.join(runs, r, 'result.json'))).length;
  }
  return n;
}

function reportsOf(repoRoot, unitRunId) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name === 'agent-report.md') found.push(fs.readFileSync(p, 'utf8'));
    }
  };
  walk(path.join(repoRoot, '.fgos', 'assignments', unitRunId));
  return found.join('\n');
}

const parentsOf = (cwd, rev = 'HEAD') => gitIn(cwd, 'rev-list', '--parents', '-n', '1', rev).trim().split(' ').slice(1);
const subjectOf = (cwd, rev = 'HEAD') => gitIn(cwd, 'log', '-1', '--format=%s', rev).trim();

// ---------------------------------------------------------------------------------------------
// The Unit contract

test('syncBase needs writes, names a ref git can read, and without an objective makes a sync-only unit', () => {
  assert.throws(() => validateUnit({ id: 'u', objective: 'x', capability: 'c', syncBase: 'main' }), /syncBase needs writes/);
  for (const bad of ['', ' ', '-main', 'a..b', 'main@{1}', 'ma in', 'main^', 'main:x', 42]) {
    assert.throws(() => validateUnit({ id: 'u', objective: 'x', capability: 'c', writes: ['docs'], syncBase: bad }), RunnerConfigError, String(bad));
  }
  assert.throws(() => validateUnit({ id: 'u', capability: 'c', writes: ['docs'] }), /objective must be a non-empty string/);
  const syncOnly = validateUnit({ id: 'u', capability: 'c', writes: ['docs'], syncBase: 'origin/main' });
  assert.equal(syncOnly.syncBase, 'origin/main');
  assert.equal(syncOnly.syncOnly, true);
  assert.match(syncOnly.objective, /origin\/main/);
  // A stored sync-only unit reads back the same (a resume validates unit.json again).
  assert.deepEqual(validateUnit(JSON.parse(JSON.stringify(syncOnly))), syncOnly);
  assert.throws(() => validateUnit({ id: 'u', objective: 'x', capability: 'c', writes: ['docs'], syncOnly: true }), /syncOnly needs syncBase/);
  const withWork = validateUnit({ id: 'u', objective: 'Write docs', capability: 'c', writes: ['docs'], syncBase: 'main' });
  assert.equal(withWork.syncOnly, undefined);
});

// ---------------------------------------------------------------------------------------------
// Clean merges

test('a sync-only unit whose merge is clean is committed by the runner and passes without any worker', async () => {
  const { repoRoot, worktree, script } = setup();
  writeWorker(script, { files: { 'docs/never.md': 'x\n' } });
  const before = headOf(worktree);
  const mainSha = headOf(repoRoot);
  const res = await runUnit({ unitData: { id: 'u-sync', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.equal(res.outcome, 'pass');
  assert.equal(producerSpawns(repoRoot, res.unitRunId), 0, 'no worker for a sync with nothing to resolve');
  assert.deepEqual(parentsOf(worktree), [before, mainSha]);
  assert.equal(subjectOf(worktree), 'chore(sync): merge main');
  assert.equal(fs.readFileSync(path.join(worktree, 'base.txt'), 'utf8'), 'from main\n');
  assert.equal(res.sync.status, 'merged');
  assert.equal(res.sync.sha, mainSha);
  assert.equal(res.results.at(-1).role, 'sync');
  assert.equal(res.results.at(-1).commit.status, 'committed');
  assert.equal(res.results.at(-1).commit.sha, headOf(worktree));
  assert.equal(res.sync.commit.sha, headOf(worktree));
  const record = unitRecordOf(repoRoot, res.unitRunId);
  assert.equal(record.sync.status, 'merged');
  assert.equal(record.settlement.outcome, 'pass');
  assert.equal(mergeHeadOf(worktree), null);
});

test('a unit with an objective and a clean sync gets the merge commit first, then the worker commit', async () => {
  const { repoRoot, worktree, script } = setup();
  writeWorker(script, { files: { 'docs/page.md': 'page\n' } });
  const mainSha = headOf(repoRoot);
  const res = await runUnit({ unitData: { id: 'u-sync-work', objective: 'Write the page', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.equal(res.outcome, 'pass');
  assert.equal(producerSpawns(repoRoot, res.unitRunId), 1);
  assert.equal(res.results[0].commit.status, 'committed');
  assert.deepEqual(res.results[0].commit.files, ['docs/page.md']);
  assert.equal(parentsOf(worktree).length, 1, 'the worker commit is an ordinary commit');
  const mergeCommit = parentsOf(worktree)[0];
  assert.equal(parentsOf(worktree, mergeCommit)[1], mainSha);
  assert.equal(res.sync.commit.sha, mergeCommit);
});

test('a sync-only unit already holding the base is up to date: no commit, no worker', async () => {
  const { repoRoot, worktree, script } = setup({ mainFiles: {} });
  writeWorker(script);
  const before = headOf(worktree);
  const res = await runUnit({ unitData: { id: 'u-sync-up', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.equal(res.outcome, 'pass');
  assert.equal(res.sync.status, 'up-to-date');
  assert.equal(headOf(worktree), before);
  assert.equal(producerSpawns(repoRoot, res.unitRunId), 0);
});

// ---------------------------------------------------------------------------------------------
// Conflicts

const conflicting = () => setup({
  mainFiles: { 'README.md': 'line one\nmain says two\nline three\n' },
  branchFiles: { 'README.md': 'line one\nbranch says two\nline three\n' },
});

test('conflicted paths enter the write scope and the brief; the runner finishes the merge after the worker resolves them', async () => {
  const { repoRoot, worktree, script } = conflicting();
  writeWorker(script, { files: { 'README.md': 'line one\nboth say two\nline three\n' } });
  const before = headOf(worktree);
  const mainSha = headOf(repoRoot);
  const res = await runUnit({ unitData: { id: 'u-sync-c', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]?.commit ?? res.results[0]?.refused));
  assert.equal(producerSpawns(repoRoot, res.unitRunId), 1);
  const record = unitRecordOf(repoRoot, res.unitRunId);
  // The conflicted path was in scope only to conclude the merge; a later round cannot write it.
  assert.deepEqual(record.writeScope, ['docs']);
  assert.deepEqual(record.sync.scopeAdded, ['README.md']);
  assert.deepEqual(record.sync.conflicts, ['README.md']);
  const assignment = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'producer', '1', 'assignment.json'), 'utf8'));
  assert.deepEqual(assignment.writes, ['docs', 'README.md'], 'the seat that resolved the conflict had it in scope');
  assert.equal(record.sync.status, 'merged');
  const brief = reportsOf(repoRoot, res.unitRunId);
  assert.match(brief, /conflict/i);
  assert.match(brief, /README\.md/);
  assert.match(brief, /never run git/i);
  assert.deepEqual(parentsOf(worktree), [before, mainSha]);
  assert.equal(subjectOf(worktree), 'chore(sync): merge main');
  assert.equal(gitIn(worktree, 'show', 'HEAD:README.md'), 'line one\nboth say two\nline three\n');
  assert.equal(mergeHeadOf(worktree), null);
  assert.equal(gitIn(worktree, 'status', '--porcelain'), '');
  assert.equal(res.results[0].commit.sync.status, 'committed');
});

test('a worker that passes with markers left gets no commit; fixing them and resuming commits only', async () => {
  const { repoRoot, worktree, script } = conflicting();
  // It edits the file but leaves one side's marker in it.
  writeWorker(script, { files: { 'README.md': 'line one\n<<<<<<< HEAD\nhalf done\nline three\n' } });
  const before = headOf(worktree);
  const first = await runUnit({ unitData: { id: 'u-sync-m', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.equal(first.outcome, 'execution-failure');
  assert.equal(first.results[0].commit.status, 'failed');
  assert.equal(first.results[0].commit.reason, 'conflict-markers');
  assert.deepEqual(first.results[0].commit.paths, ['README.md']);
  assert.equal(headOf(worktree), before, 'nothing committed');
  assert.equal(mergeHeadOf(worktree), headOf(repoRoot), 'the merge is kept for the resume');
  assert.equal(unitRecordOf(repoRoot, first.unitRunId).sync.status, 'conflicted');

  fs.writeFileSync(path.join(worktree, 'README.md'), 'line one\nfixed by hand\nline three\n');
  const resumed = await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktree });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1, 'commit-only resume');
  assert.deepEqual(parentsOf(worktree), [before, headOf(repoRoot)]);
  assert.equal(gitIn(worktree, 'show', 'HEAD:README.md'), 'line one\nfixed by hand\nline three\n');
});

test('a worker that fails over a conflicted merge leaves the merge for the resume, which runs the worker again', async () => {
  const { repoRoot, worktree, script } = conflicting();
  writeWorker(script, { settle: false });
  const first = await runUnit({ unitData: { id: 'u-sync-f', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.notEqual(first.outcome, 'pass');
  assert.equal(mergeHeadOf(worktree), headOf(repoRoot));
  assert.equal(first.sync.status, 'conflicted');
  assert.deepEqual(first.sync.conflicts, ['README.md']);

  writeWorker(script, { files: { 'README.md': 'line one\nresolved\nline three\n' } });
  const resumed = await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktree });
  assert.equal(resumed.outcome, 'pass', JSON.stringify(resumed.results.at(-1)));
  assert.equal(parentsOf(worktree).length, 2);
  assert.equal(mergeHeadOf(worktree), null);
});

test('a conflict under .fgos/ takes the base side and never reaches the worker', async () => {
  const { repoRoot, worktree, script } = setup({
    mainFiles: { '.fgos/tracked.json': '{"from":"main"}\n' },
    branchFiles: { '.fgos/tracked.json': '{"from":"branch"}\n' },
  });
  writeWorker(script);
  const res = await runUnit({ unitData: { id: 'u-sync-fgos', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.equal(res.outcome, 'pass');
  assert.equal(producerSpawns(repoRoot, res.unitRunId), 0);
  assert.equal(gitIn(worktree, 'show', 'HEAD:.fgos/tracked.json'), '{"from":"main"}\n');
});

// ---------------------------------------------------------------------------------------------
// Refusals

test('a merge git refuses (a dirty file it would overwrite) leaves the worktree as it was', async () => {
  const { repoRoot, worktree, script } = setup({ mainFiles: { 'README.md': 'changed on main\n' }, branchFiles: {} });
  writeWorker(script);
  fs.writeFileSync(path.join(worktree, 'README.md'), 'a person is editing\n');
  const before = headOf(worktree);
  const res = await runUnit({ unitData: { id: 'u-sync-r', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.equal(res.outcome, 'policy-refusal');
  assert.equal(res.results[0].refused.reason, 'merge-refused');
  assert.equal(headOf(worktree), before);
  assert.equal(mergeHeadOf(worktree), null);
  assert.equal(fs.readFileSync(path.join(worktree, 'README.md'), 'utf8'), 'a person is editing\n');
  assert.equal(producerSpawns(repoRoot, res.unitRunId), 0);
});

test('a merge someone else left in the worktree is refused, by a sync unit and by any writing unit', async () => {
  const { repoRoot, worktree, script } = conflicting();
  writeWorker(script, { files: { 'docs/a.md': 'a\n' } });
  try { gitIn(worktree, 'merge', '--no-commit', 'main'); } catch { /* conflicts */ }
  const sync = await runUnit({ unitData: { id: 'u-sync-x', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.equal(sync.outcome, 'policy-refusal');
  assert.equal(sync.results[0].refused.reason, 'merge-in-progress');
  const plain = await runUnit({ unitData: { id: 'u-plain', objective: 'Write', capability: 'docs:write', writes: ['docs'] }, repoRoot, cwd: worktree });
  assert.equal(plain.outcome, 'policy-refusal');
  assert.match(plain.results[0].refused.reason, /merge-in-progress|foreign-staged-index/);
  assert.equal(producerSpawns(repoRoot, plain.unitRunId), 0);
});

test('a sync ref that names no commit, or a sync from the main checkout, is refused before any unit run exists', async () => {
  const { repoRoot, worktree } = setup();
  const runs = () => (fs.existsSync(path.join(repoRoot, '.fgos', 'assignments')) ? fs.readdirSync(path.join(repoRoot, '.fgos', 'assignments')) : []);
  await assert.rejects(
    () => runUnit({ unitData: { id: 'u', capability: 'docs:write', writes: ['docs'], syncBase: 'no-such-branch' }, repoRoot, cwd: worktree }),
    (e) => e instanceof RunnerConfigError && /no-such-branch/.test(e.message),
  );
  await assert.rejects(
    () => runUnit({ unitData: { id: 'u', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: repoRoot }),
    (e) => e instanceof RunnerConfigError && /linked worktree/.test(e.message),
  );
  assert.deepEqual(runs(), []);
});

test('a writing unit without a sync whose worker only rewrites a file already dirty in scope still has no evidence', async () => {
  const { repoRoot, worktree, script } = setup({ mainFiles: {}, branchFiles: { 'docs/page.md': 'committed\n' } });
  writeWorker(script, { files: { 'docs/page.md': 'the worker rewrote it\n' } });
  fs.writeFileSync(path.join(worktree, 'docs', 'page.md'), 'a person is half way through this\n');
  const res = await runUnit({ unitData: { id: 'u-dirt', objective: 'Edit the page', capability: 'docs:write', writes: ['docs'] }, repoRoot, cwd: worktree });
  assert.equal(res.outcome, 'execution-failure');
  assert.equal(res.results[0].runResult.evidence.editedSyncConflicts, undefined);
});

test('a conflicted path a scope cannot name exactly (surrounding whitespace) aborts the merge', async () => {
  const { repoRoot, worktree, script } = setup({ mainFiles: { ' padded.txt': 'main\n' }, branchFiles: { ' padded.txt': 'branch\n' } });
  writeWorker(script);
  const res = await runUnit({ unitData: { id: 'u-ws', capability: 'docs:write', writes: ['docs'], syncBase: 'main' }, repoRoot, cwd: worktree });
  assert.equal(res.outcome, 'policy-refusal');
  assert.equal(res.results[0].refused.reason, 'unscopable-conflict-path');
  assert.equal(mergeHeadOf(worktree), null);
});
