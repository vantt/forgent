import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

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
// there is no on-disk `stage` value to read directly for an added item —
// the only observable proof that the lazy default resolved to the
// synthetic domain's Execute-mapped stage ('assembling') is that the item
// was actually picked up and dispatched by the real runner at all: if the
// domain-aware lazy default were broken, the item would simply sit at
// `todo` forever, never entering the frontier.

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
    '--risk', extra.risk ?? 'low',
    '--verify', extra.verify ?? 'test -f output.txt',
  ];
  if (extra.domain) flags.push('--domain', extra.domain);
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
  return path.join(cwd, '.fgos', 'state.json');
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(viewPath(cwd), 'utf8'));
}

function writeRunnerConfig(repoRoot, executorScript) {
  fs.writeFileSync(
    path.join(repoRoot, '.fgos-runner.json'),
    JSON.stringify({
      executor: { command: process.execPath, args: [executorScript, '{prompt}', '--model', '{model}'] },
      models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
      timeoutMs: 15000,
      parallel: { maxRoots: 4, maxLeavesPerRoot: 4 },
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
  });

  // Both items are independent roots (no deps between them), so a single
  // real --once run's wave (maxRoots default 4) dispatches BOTH concurrently
  // through the same runner/dispatch.mjs code path.
  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `--once failed: ${first.stderr}`);

  const afterFirst = stateView(repoRoot);
  const synth = afterFirst.work['synth-item'];
  const coding = afterFirst.work['coding-item'];

  // Truth: the synthetic item was recognized as ready and actually
  // dispatched to `proposed` with no --stage flag ever passed — the only
  // way this happens is if the lazy default resolved its stage to the
  // synthetic domain's own Execute-mapped stage ('assembling'); a broken
  // resolution would have left it sitting at `todo` forever (frontier.mjs).
  assert.equal(synth.status, 'proposed', 'the synthetic item was dispatched by the real runner');
  assert.equal(coding.status, 'proposed', 'the plain coding item was dispatched in the same run');

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
  const list = JSON.parse(fgos(repoRoot, ['list']).stdout);
  assert.equal(list.work['synth-item'].status, 'proposed');
  assert.equal(list.work['coding-item'].status, 'proposed');

  // Both reach `done` via the same normal human-close door — proving the
  // synthetic domain rides the identical status FSM all the way to the end,
  // exactly like coding (D3: a domain never touches the generic status FSM).
  assert.equal(fgos(repoRoot, ['move', 'synth-item', '--to', 'done']).status, 0);
  assert.equal(fgos(repoRoot, ['move', 'coding-item', '--to', 'done']).status, 0);

  const afterDone = stateView(repoRoot);
  assert.equal(afterDone.work['synth-item'].status, 'done');
  assert.equal(afterDone.work['coding-item'].status, 'done');
});

test('e2e synthetic domain: submit --domain synthetic is deliberately NOT the entry door for this domain — this proof exercises add, not submit; a plain submit (no --domain) is completely unaffected, still landing in stage clarify, domain coding', () => {
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
  assert.equal(submitted.stage, 'clarify', 'a plain submit still lands in stage clarify, unaffected by the synthetic domain');
  assert.equal(submitted.domain, undefined, 'a plain submit carries no explicit domain field — it lazily defaults to coding');

  const view = stateView(repoRoot);
  const item = view.work[submitted.id];
  assert.equal(item.stage, 'clarify');
  assert.equal(item.domain, undefined);
});
