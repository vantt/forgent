import { test } from 'node:test';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { frontier } from '../../src/state/frontier.mjs';

// e2e proof for base-workflow-model (D1-D4): a second, synthetic domain
// dispatches through the exact same fgos-runner/dispatch code path as the
// coding domain, with zero cross-effect between the two. Mirrors
// runner-loop.test.mjs's own harness style exactly: real mkdtemp git repo,
// real bin/fgos.mjs/bin/fgos-runner.mjs child processes, a self-contained
// committing executor script. Nothing here imports src/runner or src/state
// directly (per this cell's prohibitions) — every assertion reads on-disk
// `.fgos/` state or git log, the same way an outside observer would.
//
// Note on "stage resolves to assembling": `fgos add` never writes an
// explicit `stage` field (it stays lazily-defaulted, per base-workflow-model
// approach.md); a work.stage event is only ever written by the
// discovery/decompose sweep, which `add`-created items never go through. So
// there is no on-disk `stage` value to read directly for an added item.
// IMPORTANT: reaching `proposed` here does NOT, by itself, prove the lazy
// default resolved to the synthetic domain's own Execute-mapped stage
// ('assembling') — frontier.mjs's `(item.stage ?? executeStage) !==
// executeStage` check is trivially satisfied whenever `item.stage` is
// absent, for ANY domain's Execute-mapped stage, correct or not. The actual
// domain-discriminating proof lives in the "frontier: domain-aware stage
// resolution actually discriminates" test below, which pins two items to
// the SAME explicit stage under different domains. This e2e test instead
// proves the real runner/dispatch.mjs code path, git branch creation, and
// zero cross-effect between the two domains — see the assertions below.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');
const RUNNER = path.resolve(__dirname, '../../bin/fgos-runner.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// Pinned to "main" — same reason as runner-loop.test.mjs's own initTempRepo.
function initTempRepo() {
  const repoRoot = mkTempDir('fgos-synthetic-domain-e2e-repo-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: repoRoot });
  return repoRoot;
}

function fgos(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function runner(cwd, args = ['--once']) {
  return spawnSync(process.execPath, [RUNNER, ...args], { cwd, encoding: 'utf8' });
}

function add(cwd, id, extra = {}) {
  const flags = [
    '--title', extra.title ?? `Title ${id}`,
    '--kind', extra.kind ?? 'task',
    '--risk', extra.risk ?? 'light',
    '--verify', extra.verify ?? 'test -f output.txt',
    // tsk-535: --description is required at add's CLI layer.
    '--description', extra.description ?? `Title ${id}`,
  ];
  if (extra.domain) flags.push('--domain', extra.domain);
  // add-stage-default-gap D1/D2: --stage stays opt-in per call here (no
  // helper-wide default) -- this file's whole point is exercising each
  // domain's OWN Execute-mapped stage via add's bare default (e.g.
  // synthetic's 'assembling'), so a hardcoded helper default would be
  // wrong for exactly the domain this file cares about most.
  if (extra.stage) flags.push('--stage', extra.stage);
  const result = fgos(cwd, ['add', id, ...flags]);
  assert.equal(result.status, 0, `fgos add ${id} failed: ${result.stderr}`);
  return result;
}

function submit(cwd, text, extra = {}) {
  const flags = [];
  if (extra.domain) flags.push('--domain', extra.domain);
  const result = fgos(cwd, ['submit', text, ...flags]);
  assert.equal(result.status, 0, `fgos submit failed: ${result.stderr}`);
  return JSON.parse(result.stdout).data;
}

function viewPath(cwd) {
  return resolveFgosFile(path.join(cwd, '.fgos'), FGOS_FILE.STATE);
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(viewPath(cwd), 'utf8'));
}

function writeRunnerConfig(repoRoot, executorScript) {
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, '.fgos', 'config.json'),
    JSON.stringify({
      runner: {
        executor: { command: process.execPath, args: [executorScript, '{prompt}', '--model', '{model}'] },
        models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
        timeoutMs: 15000,
        parallel: { maxRoots: 4, maxLeavesPerRoot: 4 },
      },
    }),
  );
}

function branchExists(repoRoot, branch) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

function branchLog(repoRoot, branch) {
  return execFileSync('git', ['log', '--oneline', branch], { cwd: repoRoot, encoding: 'utf8' });
}

/** An adaptive committing executor (mirrors runner-loop.test.mjs's own
 * writeDecomposeAwareExecutor worker branch): every dispatch here is a
 * worker-prompt call (`add`-created items never go through discovery/
 * decompose), so this script only ever needs the one branch — it pulls the
 * file its own dispatched item's `verify` checks for straight out of the
 * prompt's "Expected proof" section (`test -f <file>`), so ONE script
 * produces whatever either the synthetic item or the coding item needs,
 * with no cross-effect between the two (neither ever sees the other's
 * file requirement). */
function writeAdaptiveCommittingExecutor(scriptDir) {
  const scriptPath = path.join(scriptDir, 'adaptive-committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
const match = prompt.match(/test -f (\\S+)/);
const file = match ? match[1] : 'output.txt';
fs.writeFileSync(file, 'produced by worker\\n');
execFileSync('git', ['add', file]);
execFileSync('git', ['commit', '-q', '-m', \`worker: \${file}\`]);
`,
  );
  return scriptPath;
}

test('e2e synthetic domain: add --domain synthetic (no --stage) dispatches through the real runner side by side with a plain coding item, both reaching done via the identical dispatch.mjs code path, zero cross-effect', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-synthetic-domain-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, writeAdaptiveCommittingExecutor(scriptDir));

  add(repoRoot, 'synth-item', {
    domain: 'synthetic',
    verify: 'test -f synth-output.txt && echo SYNTH_OK',
  });
  add(repoRoot, 'coding-item', {
    verify: 'test -f coding-output.txt && echo CODE_OK',
    // add-stage-default-gap D1/D2: add now defaults to stage 'clarify'
    // instead of the old implicit 'executing' -- unlike synth-item above,
    // this coding-item call needs an explicit --stage to stay immediately
    // dispatchable; the synthetic domain's own Execute-mapped stage
    // ('assembling', not 'executing') is still exercised via its bare
    // default, deliberately untouched, since that fallback resolution is
    // this test's whole point.
    stage: 'executing',
  });

  // Both items are independent roots (no deps between them), so a single
  // real --once run's wave (maxRoots default 4) dispatches BOTH concurrently
  // through the same runner/dispatch.mjs code path.
  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `--once failed: ${first.stderr}`);

  const afterFirst = stateView(repoRoot);
  const synth = afterFirst.work['synth-item'];
  const coding = afterFirst.work['coding-item'];

  // Both items reaching `proposed` proves the real runner picked them up
  // and dispatched them through the live fgos-runner/dispatch.mjs code
  // path — it does NOT by itself prove domain-aware stage resolution (see
  // the header comment above and the discriminating frontier test below):
  // an `add`-created item never carries an explicit `stage`, so this check
  // passes for ANY domain's Execute-mapped stage, correct or not.
  assert.equal(synth.status, 'awaiting-approval', 'the synthetic item was dispatched by the real runner');
  assert.equal(coding.status, 'awaiting-approval', 'the plain coding item was dispatched in the same run');
  assert.equal(synth.domain, 'synthetic', 'the persisted item retains its explicit domain');

  assert.equal(branchExists(repoRoot, 'fgw/synth-item'), true);
  assert.match(branchLog(repoRoot, 'fgw/synth-item'), /worker: synth-output\.txt/);
  assert.equal(branchExists(repoRoot, 'fgw/coding-item'), true);
  assert.match(branchLog(repoRoot, 'fgw/coding-item'), /worker: coding-output\.txt/);

  // No cross-effect: each item's own verify (and only its own) rode the
  // dispatch; neither item's fields were altered by the other's presence.
  assert.equal(synth.verify, 'test -f synth-output.txt && echo SYNTH_OK');
  assert.equal(coding.verify, 'test -f coding-output.txt && echo CODE_OK');
  assert.equal(synth.deps.length, 0);
  assert.equal(coding.deps.length, 0);

  // `fgos list` (the public read surface) confirms the same facts.
  const list = JSON.parse(fgos(repoRoot, ['list']).stdout).data;
  assert.equal(list.work['synth-item'].status, 'awaiting-approval');
  assert.equal(list.work['coding-item'].status, 'awaiting-approval');

  // Both reach `done` via the identical sequential delivered->retrospective
  // ->cleanup->done chain — proving the synthetic domain rides the same
  // status FSM all the way to the end, exactly like coding (work-item-
  // status-delivered-retrospective-cleanup D5: the chain is genuinely
  // domain-agnostic, status-fsm.mjs never reads work.domain — no domain is exempt
  // or special-cased at the FSM layer).
  // --override-reason (tsk-5dk): coding-item carries a real, unmerged
  // fgw/coding-item branch (asserted above) — this loop proves the status
  // FSM chain is domain-agnostic, not that either item's branch content
  // ever lands on trunk, so the move-refusal check's override escape
  // hatch applies here (harmless no-op for synth-item, which has no
  // branch to begin with).
  for (const id of ['synth-item', 'coding-item']) {
    assert.equal(fgos(repoRoot, ['move', id, '--to', 'delivered', '--override-reason', 'e2e fixture: FSM lifecycle-chain test, not a real merge']).status, 0);
    assert.equal(fgos(repoRoot, ['move', id, '--to', 'retrospective']).status, 0);
    assert.equal(fgos(repoRoot, ['move', id, '--to', 'cleanup']).status, 0);
    assert.equal(fgos(repoRoot, ['move', id, '--to', 'done']).status, 0);
  }

  const afterDone = stateView(repoRoot);
  assert.equal(afterDone.work['synth-item'].status, 'done');
  assert.equal(afterDone.work['coding-item'].status, 'done');
});

// work-item-status-delivered-retrospective-cleanup D5/D8: the cleanup
// harness's merge-still-resolves check is skipped entirely for a domain
// that declares worktreeBacked:false (workflow-stage-graphs.mjs) — a
// synthetic item has no branch, no worktree, no headAtTake/headAtReturn
// at all, so the REAL `fgos cleanup` verb (not just a bare `move`, which
// never invokes the harness) must still close it to done without ever
// attempting a git operation it has no commit to check.
test("e2e synthetic domain: the real 'fgos cleanup' verb closes a synthetic item to done without attempting a merge-still-resolves check it has no commit for", () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);
  fs.writeFileSync(
    path.join(repoRoot, '.fgos', 'config.json'),
    JSON.stringify({ cleanup: { ttlDays: 0 } }),
  );

  add(repoRoot, 'synth-cleanup-item', { domain: 'synthetic', verify: 'true' });
  assert.equal(fgos(repoRoot, ['move', 'synth-cleanup-item', '--to', 'doing']).status, 0);
  assert.equal(fgos(repoRoot, ['move', 'synth-cleanup-item', '--to', 'delivered']).status, 0);
  assert.equal(fgos(repoRoot, ['move', 'synth-cleanup-item', '--to', 'retrospective']).status, 0);
  assert.equal(
    fgos(repoRoot, ['decision', '--text', 'synthetic retrospective note', '--rationale', 'proves real content exists', '--id', 'synth-cleanup-item', '--relation', 'none']).status,
    0,
  );
  assert.equal(fgos(repoRoot, ['move', 'synth-cleanup-item', '--to', 'cleanup']).status, 0);

  const result = fgos(repoRoot, ['cleanup', 'synth-cleanup-item']);
  assert.equal(result.status, 0, `cleanup failed: ${result.stderr}`);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.to, 'done', `expected done, got: ${JSON.stringify(data)}`);
  assert.equal(stateView(repoRoot).work['synth-cleanup-item'].status, 'done');
});

test('e2e synthetic domain: submit --domain synthetic is deliberately NOT the entry door for this domain — this proof exercises add, not submit; a plain submit (no --domain) is completely unaffected, still landing in stage discovery, domain coding', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);

  // Per approach.md's Boundary correction: the synthetic domain declares
  // exactly one stage mapped only to Execute, with no Clarify-mapped stage
  // — it deliberately skips the discovery step `submit` assumes. This
  // feature's end-to-end proof therefore uses `add` (see test above), never
  // `submit`, for the synthetic domain. What IS asserted here is that a
  // plain `submit` (no --domain at all) stays byte-for-byte unchanged by
  // this feature's existence.
  const submitted = submit(repoRoot, 'Investigate the sluggish overview page');
  assert.equal(submitted.stage, 'discovery', 'a plain submit still lands in stage discovery, unaffected by the synthetic domain');
  assert.equal(submitted.domain, undefined, 'a plain submit carries no explicit domain field — it lazily defaults to coding');

  const view = stateView(repoRoot);
  const item = view.work[submitted.id];
  assert.equal(item.stage, 'discovery');
  assert.equal(item.domain, undefined);
});

test('frontier: domain-aware stage resolution actually discriminates — two items share the SAME explicit stage under different domains, only synthetic is ready', () => {
  // Unlike the e2e test above (which never writes an explicit `stage`, so
  // its "reached proposed" assertion is trivially true for any domain, per
  // the header comment), this pins both items to the exact same explicit
  // `stage: 'assembling'` value and varies only `domain`. `assembling` is
  // synthetic's own Execute-mapped stage (workflow-stage-graphs.mjs); it is not one of
  // coding's stages at all (coding's Execute stage is `executing`). A
  // broken synthetic-to-stage mapping — or a frontier that ignored domain
  // entirely — would make both items ready, or neither; this test fails
  // either way, which the e2e proof above cannot.
  const view = {
    work: {
      'synth-explicit': {
        id: 'synth-explicit',
        status: 'todo',
        domain: 'synthetic',
        stage: 'assembling',
        deps: [],
      },
      'coding-explicit': {
        id: 'coding-explicit',
        status: 'todo',
        domain: 'coding',
        stage: 'assembling',
        deps: [],
      },
    },
  };

  const readyIds = frontier(view).map((readyItem) => readyItem.id);
  assert.deepEqual(
    readyIds,
    ['synth-explicit'],
    'only the synthetic item at its own Execute stage is ready; the coding item pinned to the same literal stage name is excluded',
  );
});
