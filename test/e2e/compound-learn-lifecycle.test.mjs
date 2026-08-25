import { test } from 'node:test';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
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
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), '.fgos/cache/\n');
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
    '--risk', extra.risk ?? 'light',
    '--verify', extra.verify ?? 'true',
    // tsk-535: --description is required at add's CLI layer.
    '--description', extra.description ?? `Title ${id}`,
  ]);
  assert.equal(result.status, 0, `fgos add ${id} failed: ${result.stderr}`);
  return result;
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(resolveFgosFile(path.join(cwd, '.fgos'), FGOS_FILE.STATE), 'utf8'));
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
  assert.equal(stateView(repoRoot).work[id].status, 'awaiting-approval');
}

// The stage-based compound-learn done-gate (RUL50) is RETIRED by
// work-item-status-delivered-retrospective-cleanup D1/D4/D11 — approve no
// longer checks stage at all, and reaches `delivered` (not `done` directly).
// `done` is now reached only via the sequential delivered->retrospective->
// cleanup->done chain (D1/D2/D10). The `compound` verb (stage move) itself
// still exists at this point in the sequence — its full retirement is a
// separate, later change — so it remains legal to call, just no longer
// gates anything.

test('e2e delivered/retrospective/cleanup happy path: take -> return -> approve -> delivered -> retrospective -> cleanup -> done, closes green', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'lifecycle-ok', { verify: 'test -f lifecycle-ok-proof.txt' });

  toProposedPull(repoRoot, 'lifecycle-ok', 'lifecycle-ok-proof.txt');

  const approve = fgos(repoRoot, ['approve', 'lifecycle-ok']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  assert.equal(envelopeData(approve.stdout).to, 'delivered');
  assert.equal(stateView(repoRoot).work['lifecycle-ok'].status, 'delivered');

  assert.equal(fgos(repoRoot, ['move', 'lifecycle-ok', '--to', 'retrospective']).status, 0);
  assert.equal(fgos(repoRoot, ['move', 'lifecycle-ok', '--to', 'cleanup']).status, 0);
  const done = fgos(repoRoot, ['move', 'lifecycle-ok', '--to', 'done']);
  assert.equal(done.status, 0, `move to done failed: ${done.stderr}`);

  const view = stateView(repoRoot);
  assert.equal(view.work['lifecycle-ok'].status, 'done');
});

test('e2e approve no longer requires the compound-learn stage — the retired RUL50 gate does not block reaching delivered', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'lifecycle-no-stage', { verify: 'test -f lifecycle-no-stage-proof.txt' });

  toProposedPull(repoRoot, 'lifecycle-no-stage', 'lifecycle-no-stage-proof.txt');

  // No `compound` step at all: approve must still succeed, reaching
  // delivered directly — the old stage-gate no longer applies.
  const approve = fgos(repoRoot, ['approve', 'lifecycle-no-stage']);
  assert.equal(approve.status, 0, `expected approve to succeed without a compound step: ${approve.stdout}${approve.stderr}`);
  assert.equal(envelopeData(approve.stdout).to, 'delivered');
  assert.equal(stateView(repoRoot).work['lifecycle-no-stage'].status, 'delivered');
});
