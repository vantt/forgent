// Regression coverage for choke-point-take-vs-pick-claim-eligibility
// (docs/decisions/0022-fgos-choke-point-survey.md, candidate #1): `take` and
// `pick` used to disagree on whether an item still at stage `clarify`/
// `decompose` is claimable — `take --id <id>` hard-rejected it while
// `pick --id <id>` allowed it, even though `fgos-routing`'s own "Claim"
// section instructs a reader to use `take --id <id>` for exactly that case.
//
// The fix: `take`'s explicit `--id` branch now checks deps-done +
// no-open-descendant only (`isDepsAndLineageReady`, frontier.mjs), the same
// stage-independent stance `pick`'s explicit `--id` branch already took —
// while still refusing a genuinely-blocked item (unmet dep, or anchored by
// an open decomposed child) exactly as before. This file locks that in so
// the two verbs cannot silently re-diverge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { addWork } from '../../src/state/store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function tmpCwd() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-take-pick-'));
  assert.equal(run(cwd, ['init']).status, 0, 'tmpCwd(): "fgos init" failed to bootstrap .fgos/');
  return cwd;
}

// `take` operates on the real host repo directly (never a worktree) — same
// reason fgos.test.mjs's own `initGitCwd` exists.
function initGitCwd() {
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/state.json\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd });
  return cwd;
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'state.json'), 'utf8'));
}

function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

test('take --id claims a status:todo item at stage clarify — matches pick, no longer rejected', () => {
  const cwd = initGitCwd();
  const id = envelopeData(run(cwd, ['submit', 'Fuzzy request needing discovery']).stdout).id;
  assert.equal(stateView(cwd).work[id].stage, 'clarify');

  const result = run(cwd, ['take', '--id', id]);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  assert.equal(stateView(cwd).work[id].status, 'doing');
  assert.equal(stateView(cwd).work[id].stage, 'clarify', 'take claims the item without touching its stage');
});

test('take --id claims a status:todo item at stage decompose — matches pick, no longer rejected', () => {
  const cwd = initGitCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'decompose-stage-item',
    title: 'Already-shaped item awaiting proof',
    kind: 'task',
    status: 'todo',
    stage: 'decompose',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'true',
  });

  const result = run(cwd, ['take', '--id', 'decompose-stage-item']);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  assert.equal(stateView(cwd).work['decompose-stage-item'].status, 'doing');
});

test('take --id on a clarify-stage item with an unmet dep is still rejected — the stage relaxation never dropped the deps guard', () => {
  const cwd = initGitCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'unmet-dep-source', title: 'Dep', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' });
  addWork(dir, {
    id: 'clarify-with-unmet-dep',
    title: 'Clarify item blocked on a dep',
    kind: 'task',
    status: 'todo',
    stage: 'clarify',
    deps: ['unmet-dep-source'],
    risk: 'low',
    refs: [],
    verify: 'true',
  });
  const before = fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8').split('\n').filter(Boolean).length;

  const result = run(cwd, ['take', '--id', 'clarify-with-unmet-dep']);
  assert.equal(result.status, 4, 'an unmet dep must still reject the claim regardless of stage');
  assert.equal(
    fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8').split('\n').filter(Boolean).length,
    before,
    'a rejected take never claims and never writes an event',
  );
  assert.equal(stateView(cwd).work['clarify-with-unmet-dep'].status, 'todo');
});

test('take --id on an item anchored by an open decomposed child is still rejected — the stage relaxation never dropped the lineage guard', () => {
  const cwd = initGitCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'lineage-root', title: 'Root', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' });
  addWork(dir, {
    id: 'lineage-open-child',
    title: 'Child still open',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'true',
    parent: 'lineage-root',
  });

  const result = run(cwd, ['take', '--id', 'lineage-root']);
  assert.equal(result.status, 4, 'a root with an open decomposed child must still reject the claim');
  assert.equal(stateView(cwd).work['lineage-root'].status, 'todo');
});

test('take --id not found is still rejected exactly as before (unchanged path)', () => {
  const cwd = initGitCwd();
  const result = run(cwd, ['take', '--id', 'no-such-item']);
  assert.equal(result.status, 4);
});

test('take with no --id still only opens the frontier head — the relaxation applies to the explicit --id branch alone (D1 unchanged)', () => {
  const cwd = initGitCwd();
  run(cwd, ['submit', 'Fuzzy request never taken by id']); // stage clarify, never in the frontier
  const result = run(cwd, ['take']);
  assert.notEqual(result.status, 0, 'the frontier is empty — a clarify-stage item must not be silently auto-taken');
});
