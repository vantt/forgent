import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

// e2e proof for the Compound-learn stage + done-gate (D2/D3), driven end to
// end through the real fgos binary: a coding item cannot reach `done` without
// taking the deliberate compound-learn transition first, and the full happy
// path take -> return -> compound -> approve -> done closes green. Mirrors
// pr-gate.test.mjs's harness exactly — real mkdtemp git repo, real
// bin/fgos.mjs child process, on-disk `.fgos/` state as the only observation.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function initTempRepo() {
  const repoRoot = mkTempDir('fgos-compound-lifecycle-e2e-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), '.fgos/state.json\n');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: repoRoot });
  return repoRoot;
}

function fgos(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function gitAt(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

function add(cwd, id, extra = {}) {
  const result = fgos(cwd, [
    'add', id,
    '--title', extra.title ?? `Title ${id}`,
    '--kind', extra.kind ?? 'task',
    '--risk', extra.risk ?? 'low',
    '--verify', extra.verify ?? 'true',
  ]);
  assert.equal(result.status, 0, `fgos add ${id} failed: ${result.stderr}`);
  return result;
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'state.json'), 'utf8'));
}

function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

// Drive a pull-door item from todo to proposed: take it, land its proof on
// main with a real commit, and return it (verify runs green on the way back).
function toProposedPull(repoRoot, id, proofFile) {
  assert.equal(fgos(repoRoot, ['take', '--id', id]).status, 0);
  fs.writeFileSync(path.join(repoRoot, proofFile), 'done by hand\n');
  gitAt(repoRoot, ['add', '-A']);
  gitAt(repoRoot, ['commit', '-q', '-m', `human: ${proofFile}`]);
  assert.equal(fgos(repoRoot, ['return', id]).status, 0);
  assert.equal(stateView(repoRoot).work[id].status, 'proposed');
}

test('e2e compound-learn happy path: take -> return -> compound -> approve -> done, closes green with the item at stage compound-learn', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'lifecycle-ok', { verify: 'test -f lifecycle-ok-proof.txt' });

  toProposedPull(repoRoot, 'lifecycle-ok', 'lifecycle-ok-proof.txt');

  // The deliberate compound-learn transition (executing -> compound-learn).
  const compound = fgos(repoRoot, ['compound', 'lifecycle-ok']);
  assert.equal(compound.status, 0, `compound failed: ${compound.stderr}`);
  assert.equal(envelopeData(compound.stdout).to, 'compound-learn');
  assert.equal(stateView(repoRoot).work['lifecycle-ok'].stage, 'compound-learn');

  const approve = fgos(repoRoot, ['approve', 'lifecycle-ok']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  assert.equal(envelopeData(approve.stdout).to, 'done');

  const view = stateView(repoRoot);
  assert.equal(view.work['lifecycle-ok'].status, 'done');
  assert.equal(view.work['lifecycle-ok'].stage, 'compound-learn', 'the item closes from the compound-learn stage');
});

test('e2e compound-learn gate: approve is blocked when the compound-learn stage is skipped — the item stays proposed, exit 2', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'lifecycle-skip', { verify: 'test -f lifecycle-skip-proof.txt' });

  toProposedPull(repoRoot, 'lifecycle-skip', 'lifecycle-skip-proof.txt');

  // No `compound` step: approve must refuse to close the item to done.
  const approve = fgos(repoRoot, ['approve', 'lifecycle-skip']);
  assert.equal(approve.status, 2, `expected a precondition refusal, got: ${approve.stdout}${approve.stderr}`);
  assert.match(approve.stderr, /compound-learn/);
  assert.equal(stateView(repoRoot).work['lifecycle-skip'].status, 'proposed', 'a blocked close leaves the item proposed');
});
