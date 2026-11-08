// test/workflow/case-close.test.mjs — owning proof of retiring finished cases: what goes, what stays and why

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { pruneFinishedCases } from '../../src/workflow/case-close.mjs';
import { bindingsDir } from '../../src/workflow/case-bindings.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { acquireDispatchCwdLock } from '../../src/run-supervisor/cwd-lock.mjs';
import { acquireUnitControl } from '../../src/runner/execution/unit-control.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { isCaseId } from '../../src/runner/execution/case-run-paths.mjs';
import { readWorkflowEvents } from '../../src/workflow/store.mjs';
import { append, openCase, withHold } from '../helpers/workflow-case-fixture.mjs';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const iso = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();
const pruneUnchecked = (repoRoot, extra = {}) => pruneFinishedCases({ mainRoot: repoRoot, olderThanMs: 14 * DAY, now: NOW, ...extra });
/** Every Unit run a ledger on disk names, by case. A ledger that does not fold stays by rule and names nothing here. */
function namedByLedgers(repoRoot) {
  const root = path.join(repoRoot, '.fgos', 'workflow-runs');
  const named = [];
  for (const caseId of (fs.existsSync(root) ? fs.readdirSync(root) : []).filter(isCaseId)) {
    let events = [];
    try { events = readWorkflowEvents({ repoRoot, workflowRunId: caseId }); } catch (err) { if (err.code !== 'workflow-ledger-corrupt') throw err; }
    for (const event of events) if (event.payload?.unitRunId) named.push({ caseId, unitRunId: event.payload.unitRunId });
  }
  return named;
}
// A ledger that stays never names a Unit run directory that is gone: a case goes whole or keeps every run it names.
const prune = (repoRoot, extra = {}) => {
  const result = pruneUnchecked(repoRoot, extra);
  for (const { caseId, unitRunId } of namedByLedgers(repoRoot)) {
    assert.equal(fs.existsSync(path.join(assignmentsOf(repoRoot), unitRunId)), true, `ledger of ${caseId} names the removed Unit run ${unitRunId}`);
  }
  return result;
};
const ids = (kept) => Object.fromEntries(kept.map((k) => [k.id, k.reason]));

const assignmentsOf = (repoRoot) => path.join(repoRoot, '.fgos', 'assignments');
const caseDir = (run) => path.join(run.repoRoot, '.fgos', 'workflow-runs', run.caseId);

/** A Unit run of `caseId` on disk: a record naming the case, and a summary unless it is meant to be unsettled. */
function unitRun(repoRoot, unitRunId, caseId, { settled = true, worktree } = {}) {
  const dir = path.join(assignmentsOf(repoRoot), unitRunId);
  fs.mkdirSync(path.join(dir, 'outbox'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'outbox', 'report.md'), 'x'.repeat(1000));
  fs.writeFileSync(path.join(dir, 'unit.json'), JSON.stringify({ workflow: { caseId, activity: 'scout', reservationId: 'r1' }, ...(worktree ? { worktree } : {}) }));
  if (settled) fs.writeFileSync(path.join(dir, 'unit-summary.json'), JSON.stringify({ outcome: 'pass' }));
  return dir;
}

/** A case whose ledger names `units` and, when `closedDaysAgo` is given, was closed then. */
function caseNaming(repoRoot, units, { closedDaysAgo } = {}) {
  const run = openCase({ repoRoot });
  withHold(run, (hold) => {
    units.forEach((unitRunId, i) => append(run, hold, 'settle', { reservationId: `r${i}`, outcome: 'pass', unitRunId }));
    if (closedDaysAgo !== undefined) append(run, hold, 'case.closed', { closedAt: iso(closedDaysAgo) });
  });
  return run;
}

test('a case closed long ago goes with the Unit runs it names, and a recent or open one stays', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const old = caseNaming(repoRoot, ['u-old-1', 'u-old-2'], { closedDaysAgo: 30 });
  const oldUnits = ['u-old-1', 'u-old-2'].map((id) => unitRun(repoRoot, id, old.caseId));
  const recent = caseNaming(repoRoot, ['u-recent'], { closedDaysAgo: 2 });
  const recentUnit = unitRun(repoRoot, 'u-recent', recent.caseId);
  const open = caseNaming(repoRoot, ['u-open']);
  const openUnit = unitRun(repoRoot, 'u-open', open.caseId);
  const plain = unitRun(repoRoot, 'plain-run', 'no-case');

  const result = prune(repoRoot, { apply: true });

  assert.deepEqual(result.cases, [old.caseId]);
  assert.deepEqual(result.unitRuns.sort(), ['u-old-1', 'u-old-2']);
  assert.ok(result.bytes >= 2000);
  assert.equal(fs.existsSync(caseDir(old)), false);
  for (const dir of oldUnits) assert.equal(fs.existsSync(dir), false);
  for (const dir of [recentUnit, openUnit, plain]) assert.equal(fs.existsSync(dir), true);
  assert.equal(fs.existsSync(caseDir(recent)), true);
  assert.deepEqual(ids(result.kept)[recent.caseId], 'too-recent');
  assert.deepEqual(ids(result.kept)[open.caseId], 'not-finished');
});

test('a dry run reports what would go and removes nothing', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const old = caseNaming(repoRoot, ['u1'], { closedDaysAgo: 30 });
  const unit = unitRun(repoRoot, 'u1', old.caseId);

  const result = prune(repoRoot);

  assert.deepEqual(result.cases, [old.caseId]);
  assert.deepEqual(result.unitRuns, ['u1']);
  assert.ok(result.bytes > 0);
  assert.equal(fs.existsSync(caseDir(old)), true);
  assert.equal(fs.existsSync(unit), true);
});

test('a failed run that was never closed stays, because it may be reopened', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const run = openCase({ repoRoot });
  withHold(run, (hold) => append(run, hold, 'workflow.fail', { reason: 'x' }));
  assert.equal(prune(repoRoot, { apply: true, now: NOW + 100 * DAY }).cases.length, 0);
  assert.equal(fs.existsSync(caseDir(run)), true);
});

test('a Unit run an open case names stays while the closed case that also names it goes', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const old = caseNaming(repoRoot, ['shared', 'mine'], { closedDaysAgo: 30 });
  const shared = unitRun(repoRoot, 'shared', old.caseId);
  const mine = unitRun(repoRoot, 'mine', old.caseId);
  caseNaming(repoRoot, ['shared']);

  const result = prune(repoRoot, { apply: true });

  assert.deepEqual(result.unitRuns, ['mine']);
  assert.equal(fs.existsSync(shared), true);
  assert.equal(fs.existsSync(mine), false);
  assert.equal(ids(result.kept).shared, 'named-by-other-case');
});

test('a closed case an open case inherits from or reads an answer of stays', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const source = caseNaming(repoRoot, [], { closedDaysAgo: 30 });
  const answered = caseNaming(repoRoot, [], { closedDaysAgo: 30 });
  const heir = openCase({ repoRoot });
  withHold(heir, (hold) => {
    append(heir, hold, 'case.opened.note', { inherits: { fromCase: source.caseId } });
    append(heir, hold, 'route', { refs: [`gate-answer:${answered.caseId}/step-a`] });
  });

  const result = prune(repoRoot, { apply: true });

  assert.deepEqual(result.cases, []);
  assert.equal(ids(result.kept)[source.caseId], 'named-by-other-case');
  assert.equal(ids(result.kept)[answered.caseId], 'named-by-other-case');
});

test('a case a worktree binding names stays', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const old = caseNaming(repoRoot, [], { closedDaysAgo: 30 });
  fs.mkdirSync(bindingsDir(repoRoot), { recursive: true });
  fs.writeFileSync(path.join(bindingsDir(repoRoot), 'k1.json'), JSON.stringify({ caseId: old.caseId, generation: 1, state: 'committed' }));

  const result = prune(repoRoot, { apply: true });

  assert.deepEqual(result.cases, []);
  assert.equal(ids(result.kept)[old.caseId], 'binding-held');
});

test('a Unit run that is unsettled, controlled or in custody stays and keeps its ledger', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const worktree = path.join(repoRoot, 'wt');
  fs.mkdirSync(worktree);
  const cases = {
    unsettled: caseNaming(repoRoot, ['u-unsettled', 'u-sibling'], { closedDaysAgo: 30 }),
    controlled: caseNaming(repoRoot, ['u-controlled', 'u-both'], { closedDaysAgo: 30 }),
    custody: caseNaming(repoRoot, ['u-custody'], { closedDaysAgo: 30 }),
  };
  unitRun(repoRoot, 'u-unsettled', cases.unsettled.caseId, { settled: false });
  const controlledDir = unitRun(repoRoot, 'u-controlled', cases.controlled.caseId);
  unitRun(repoRoot, 'u-custody', cases.custody.caseId, { worktree });
  const siblingDir = unitRun(repoRoot, 'u-sibling', cases.unsettled.caseId);
  const bothDir = unitRun(repoRoot, 'u-both', cases.controlled.caseId, { settled: false });
  const control = acquireUnitControl(controlledDir, 'u-controlled');
  const bothControl = acquireUnitControl(bothDir, 'u-both');
  const custody = acquireDispatchCwdLock(path.join(repoRoot, '.fgos'), worktree);
  try {
    const dry = prune(repoRoot);
    const result = prune(repoRoot, { apply: true });
    assert.deepEqual(result.cases, []);
    assert.deepEqual(result.unitRuns, []);
    assert.deepEqual(dry.unitRuns, []);
    assert.deepEqual(dry.kept, result.kept);
    const kept = ids(result.kept);
    assert.equal(kept['u-unsettled'], 'unsettled');
    assert.equal(kept['u-controlled'], 'controller-held');
    assert.equal(kept['u-custody'], 'custody-held');
    assert.equal(kept['u-both'], 'controller-held');
    assert.equal(kept['u-sibling'], 'case-kept');
    assert.equal(fs.existsSync(siblingDir), true);
    for (const run of Object.values(cases)) assert.equal(kept[run.caseId], 'unit-run-kept');
  } finally {
    control.release();
    bothControl.release();
    custody.release();
  }
});

test('a case whose advance is held stays', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const old = caseNaming(repoRoot, [], { closedDaysAgo: 30 });
  const hold = acquireAdvanceLock(repoRoot, old.caseId);
  try {
    const result = prune(repoRoot, { apply: true });
    assert.deepEqual(result.cases, []);
    assert.equal(ids(result.kept)[old.caseId], 'advance-held');
    assert.equal(fs.existsSync(caseDir(old)), true);
  } finally {
    hold.release();
  }
});

test('a symbolic link in place of a Unit run is kept and its target is untouched', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const old = caseNaming(repoRoot, ['linked'], { closedDaysAgo: 30 });
  const target = makeFixtureDir('fgos-prune-target-');
  fs.writeFileSync(path.join(target, 'precious.txt'), 'keep');
  fs.writeFileSync(path.join(target, 'unit.json'), JSON.stringify({ workflow: { caseId: old.caseId } }));
  fs.mkdirSync(assignmentsOf(repoRoot), { recursive: true });
  fs.symlinkSync(target, path.join(assignmentsOf(repoRoot), 'linked'));

  const result = prune(repoRoot, { apply: true });

  assert.deepEqual(result.cases, []);
  assert.equal(ids(result.kept).linked, 'link');
  assert.equal(fs.readFileSync(path.join(target, 'precious.txt'), 'utf8'), 'keep');
});

test('a ledger that names a Unit run whose record names another case does not delete it', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const old = caseNaming(repoRoot, ['theirs', 'mine'], { closedDaysAgo: 30 });
  const theirs = unitRun(repoRoot, 'theirs', 'some-other-case');
  const mine = unitRun(repoRoot, 'mine', old.caseId);

  const result = prune(repoRoot, { apply: true });

  assert.deepEqual(result.cases, [old.caseId]);
  assert.deepEqual(result.unitRuns, ['mine']);
  assert.equal(ids(result.kept).theirs, 'names-other-case');
  assert.equal(fs.existsSync(theirs), true);
  assert.equal(fs.existsSync(mine), false);
});

test('a ledger that does not fold cleanly stays even when its close time is old', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const old = caseNaming(repoRoot, [], { closedDaysAgo: 30 });
  fs.appendFileSync(path.join(caseDir(old), 'events.jsonl'), '{"not":"an event"}\n');

  const result = prune(repoRoot, { apply: true });

  assert.deepEqual(result.cases, []);
  assert.equal(ids(result.kept)[old.caseId], 'unreadable');
  assert.equal(fs.existsSync(caseDir(old)), true);
});

test('a run that finished without any case events goes once it is old enough', () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const run = openCase({ repoRoot });
  // Strip the case events: what is left is a stored run that completed.
  const file = path.join(caseDir(run), 'events.jsonl');
  const start = fs.readFileSync(file, 'utf8').split('\n')[0];
  fs.writeFileSync(file, `${start}\n`);
  withHold(run, (hold) => append(run, hold, 'workflow.complete', { outcome: 'pass' }));

  assert.deepEqual(prune(repoRoot, { apply: true }).cases, []);
  assert.deepEqual(prune(repoRoot, { apply: true, now: NOW + 15 * DAY }).cases, [run.caseId]);
  assert.equal(fs.existsSync(caseDir(run)), false);
});

test('a Unit run that cannot be removed leaves the ledger to name what is still there', { skip: process.getuid?.() === 0 }, () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const old = caseNaming(repoRoot, ['first', 'second'], { closedDaysAgo: 30 });
  const first = unitRun(repoRoot, 'first', old.caseId);
  const second = unitRun(repoRoot, 'second', old.caseId);
  const stuck = path.join(second, 'outbox');
  fs.chmodSync(stuck, 0o500);
  try {
    // The one residual: a removal that fails midway leaves the ledger naming the run already gone.
    const result = pruneUnchecked(repoRoot, { apply: true });
    assert.deepEqual(result.cases, []);
    assert.equal(fs.existsSync(caseDir(old)), true);
    assert.equal(ids(result.kept)[old.caseId], 'unit-run-kept');
    assert.equal(fs.existsSync(first), false);
    assert.equal(fs.existsSync(second), true);
  } finally {
    fs.chmodSync(stuck, 0o700);
  }
  // The retry finds the first run gone; the second lost part of its record to the failed removal, so it stays and so does the ledger.
  const retry = pruneUnchecked(repoRoot, { apply: true });
  assert.deepEqual(retry.cases, []);
  assert.ok(['unsettled', 'unit-record-missing'].includes(ids(retry.kept).second));
});

test('two prunes at once remove each directory once and both finish', async () => {
  const repoRoot = makeFixtureDir('fgos-prune-');
  const olds = Array.from({ length: 4 }, (_, i) => caseNaming(repoRoot, [`c${i}`], { closedDaysAgo: 30 }));
  olds.forEach((run, i) => unitRun(repoRoot, `c${i}`, run.caseId));
  const script = `
    import { pruneFinishedCases } from ${JSON.stringify(path.resolve('src/workflow/case-close.mjs'))};
    const r = pruneFinishedCases({ mainRoot: ${JSON.stringify(repoRoot)}, olderThanMs: ${14 * DAY}, apply: true });
    console.log(JSON.stringify({ cases: r.cases, unitRuns: r.unitRuns }));`;
  const runOne = () => new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (c) => { out += c; });
    child.once('exit', (status) => resolve({ status, out: out.trim() }));
  });
  const [a, b] = await Promise.all([runOne(), runOne()]);
  assert.equal(a.status, 0);
  assert.equal(b.status, 0);
  const removed = [a, b].flatMap((r) => JSON.parse(r.out).cases);
  assert.deepEqual([...removed].sort(), olds.map((r) => r.caseId).sort());
  for (const run of olds) assert.equal(fs.existsSync(caseDir(run)), false);
  assert.deepEqual(fs.readdirSync(assignmentsOf(repoRoot)), []);
});

test('an age that is not a non-negative number is refused', () => {
  assert.throws(() => pruneFinishedCases({ mainRoot: makeFixtureDir('fgos-prune-'), olderThanMs: -1 }), { code: 'invalid-prune-age' });
});
