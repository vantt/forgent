// An earlier role's work reaches a later role as the absolute path of its report.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

import { reportRefOf, reportRefsOf, resolveUnitInputs, anonymousInputName, HandoffRefError } from '../../../src/runner/execution/handoff-refs.mjs';

const resolveRefs = (inputs, root, options) => resolveUnitInputs(inputs, root, options).refs;
const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');

function makeRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-handoff-'));
}

/** Write one settled attempt of `role` in `unitRunId`, the way the runner leaves it. */
function settleAttempt(root, unitRunId, role, attemptDir, { report, claim, result = {}, worktree }) {
  const unitDir = path.join(root, '.fgos', 'assignments', unitRunId);
  const runDir = path.join(unitDir, role, attemptDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  if (worktree) fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify({ worktree }));
  const rel = (file) => path.relative(root, path.join(runDir, file));
  const runResult = { evidence: { artifacts: [] }, settleReports: [], ...result };
  if (report !== undefined) {
    fs.writeFileSync(path.join(runDir, 'report.md'), report);
    runResult.settleReports.push({ path: rel('report.md'), sha256: sha(report) });
    runResult.evidence.artifacts.push(rel('report.md'));
  }
  if (claim !== undefined) {
    fs.writeFileSync(path.join(runDir, 'claim.json'), claim);
    runResult.evidence.artifacts.push(rel('claim.json'));
  }
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(runResult));
  return { runDir, runResult };
}

test('a settled report is handed over as an absolute path', () => {
  const root = makeRoot();
  const { runDir, runResult } = settleAttempt(root, 'unit-run-a', 'producer', '1', { report: '# done\n', claim: '{}' });
  assert.equal(reportRefOf({ role: 'producer', round: 1, runResult }, { mainRoot: root }), path.join(runDir, 'report.md'));
});

test('a report edited after settlement is refused', () => {
  const root = makeRoot();
  const { runDir, runResult } = settleAttempt(root, 'unit-run-a', 'producer', '1', { report: '# done\n' });
  fs.writeFileSync(path.join(runDir, 'report.md'), '# something else\n');
  assert.throws(
    () => reportRefOf({ role: 'producer', round: 1, runResult }, { mainRoot: root }),
    (err) => err instanceof HandoffRefError && err.reason === 'report-changed-after-settle',
  );
});

test('without a settled report the claim stands in for it', () => {
  const root = makeRoot();
  const { runDir, runResult } = settleAttempt(root, 'unit-run-a', 'producer', '1', { claim: '{}' });
  assert.equal(reportRefOf({ role: 'producer', round: 1, runResult }, { mainRoot: root }), path.join(runDir, 'claim.json'));
});

test('an inline record hands over its evidence refs, relative to the unit worktree', () => {
  const root = makeRoot();
  const worktree = path.join(root, 'wt');
  const ref = reportRefOf({ role: 'producer', round: 1, runResult: { evidenceRefs: ['docs/out.md'] } }, { mainRoot: root, worktree });
  assert.equal(ref, path.join(worktree, 'docs/out.md'));
});

test('a record that left nothing is refused rather than skipped', () => {
  const root = makeRoot();
  for (const runResult of [{}, { evidence: { artifacts: [] }, settleReports: [] }, undefined]) {
    assert.throws(
      () => reportRefOf({ role: 'producer', round: 1, runResult }, { mainRoot: root }),
      (err) => err instanceof HandoffRefError && err.reason === 'no-report',
    );
  }
});

test('in-run refs keep input order and list the same path once', () => {
  const root = makeRoot();
  const a = settleAttempt(root, 'unit-run-a', 'panelist-1', '1', { report: 'one\n' });
  const b = settleAttempt(root, 'unit-run-a', 'panelist-2', '1', { report: 'two\n' });
  const recA = { role: 'panelist-1', round: 1, runResult: a.runResult };
  const recB = { role: 'panelist-2', round: 1, runResult: b.runResult };
  assert.deepEqual(reportRefsOf([recA, recB, recA], { mainRoot: root }), [path.join(a.runDir, 'report.md'), path.join(b.runDir, 'report.md')]);
  assert.deepEqual(reportRefsOf(undefined, { mainRoot: root }), []);
});

test('a unit-run input resolves to the report of that role', () => {
  const root = makeRoot();
  const { runDir } = settleAttempt(root, 'unit-run-a', 'producer', '1', { report: '# done\n' });
  assert.deepEqual(resolveRefs(['unit-run:unit-run-a/producer'], root), [path.join(runDir, 'report.md')]);
});

test('repo-relative inputs pass through unchanged and each ref is listed once', () => {
  const root = makeRoot();
  const { runDir } = settleAttempt(root, 'unit-run-a', 'producer', '1', { report: '# done\n' });
  assert.deepEqual(
    resolveRefs(['docs/a.md', 'unit-run:unit-run-a/producer', 'docs/a.md', 'unit-run:unit-run-a/producer'], root),
    ['docs/a.md', path.join(runDir, 'report.md')],
  );
  assert.deepEqual(resolveRefs(undefined, root), []);
});

test('a unit-run input names its failure: no such run, no such role, no report', () => {
  const root = makeRoot();
  settleAttempt(root, 'unit-run-a', 'producer', '1', { report: '# done\n' });
  settleAttempt(root, 'unit-run-empty', 'producer', '1', {});

  const reasonOf = (input) => {
    try {
      resolveRefs([input], root);
    } catch (err) {
      assert.ok(err instanceof HandoffRefError, String(err));
      assert.ok(err.message.includes(`handoff-ref-unresolved: ${input}: ${err.reason}`), err.message);
      return err.reason;
    }
    return null;
  };
  assert.equal(reasonOf('unit-run:unit-run-missing/producer'), 'no-such-run');
  assert.equal(reasonOf('unit-run:../producer/producer'), 'no-such-run');
  assert.equal(reasonOf('unit-run:unit-run-a/reviewer'), 'no-such-role');
  assert.equal(reasonOf('unit-run:unit-run-empty/producer'), 'no-report');
});

test('the highest round of a role wins, and within a round the latest fallback attempt', () => {
  const root = makeRoot();
  settleAttempt(root, 'unit-run-a', 'producer', '1', { report: 'round one\n' });
  const second = settleAttempt(root, 'unit-run-a', 'producer', '2', { report: 'round two\n' });
  assert.deepEqual(resolveRefs(['unit-run:unit-run-a/producer'], root), [path.join(second.runDir, 'report.md')]);

  settleAttempt(root, 'unit-run-b', 'reviewer', '1', { report: 'first binding\n' });
  const fallback = settleAttempt(root, 'unit-run-b', 'reviewer', '1-fb1', { report: 'after the provider limit\n' });
  assert.deepEqual(resolveRefs(['unit-run:unit-run-b/reviewer'], root), [path.join(fallback.runDir, 'report.md')]);
});

/** Write the answer file of one gate the way the Workflow runner leaves it. */
function recordAnswer(root, workflowRunId, stepId, text = '# answer\n') {
  const dir = path.join(root, '.fgos', 'workflow-runs', workflowRunId, 'gate-answers');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${stepId}.md`);
  fs.writeFileSync(file, text);
  return file;
}

test('a gate-answer input resolves to the absolute path of the recorded answer', () => {
  const root = makeRoot();
  const file = recordAnswer(root, 'wf-run-1', 'voting-ranking');
  const { runDir } = settleAttempt(root, 'unit-run-a', 'producer', '1', { report: '# done\n' });
  assert.deepEqual(
    resolveRefs(['unit-run:unit-run-a/producer', 'gate-answer:wf-run-1/voting-ranking', 'gate-answer:wf-run-1/voting-ranking'], root),
    [path.join(runDir, 'report.md'), file],
  );
  assert.ok(path.isAbsolute(file));
});

test('a gate-answer input names its failure: no answer recorded, or an id that leaves the answers directory', () => {
  const root = makeRoot();
  recordAnswer(root, 'wf-run-1', 'voting-ranking');
  const reasonOf = (input) => {
    try {
      resolveRefs([input], root);
    } catch (err) {
      assert.ok(err instanceof HandoffRefError, String(err));
      assert.ok(err.message.includes(`handoff-ref-unresolved: ${input}: ${err.reason}`), err.message);
      return err.reason;
    }
    return null;
  };
  assert.equal(reasonOf('gate-answer:wf-run-1/other-step'), 'no-such-answer');
  assert.equal(reasonOf('gate-answer:wf-run-missing/voting-ranking'), 'no-such-answer');
  assert.equal(reasonOf('gate-answer:../wf-run-1/voting-ranking'), 'no-such-answer');
  assert.equal(reasonOf('gate-answer:wf-run-1/..'), 'no-such-answer');
  assert.equal(reasonOf('gate-answer:malformed'), 'no-such-answer');
});

test('anonymized inputs are copied under neutral names in input order, byte for byte, and only the copies are listed', () => {
  const root = makeRoot();
  const a = settleAttempt(root, 'unit-run-a', 'panelist-1', '1', { report: 'first opinion é\n' });
  const b = settleAttempt(root, 'unit-run-a', 'panelist-2', '1', { report: 'second opinion\n' });
  const answer = recordAnswer(root, 'wf-run-1', 'gate');
  const into = path.join(root, 'own-unit-dir', 'inputs');

  const { refs, inputMap } = resolveUnitInputs(
    ['docs/a.md', 'unit-run:unit-run-a/panelist-2', 'gate-answer:wf-run-1/gate', 'unit-run:unit-run-a/panelist-1'],
    root,
    { anonymizeInto: into },
  );

  // Other refs keep their form and order; the copies follow, A for the first unit-run input.
  assert.deepEqual(refs, ['docs/a.md', answer, path.join(into, 'seat-A.md'), path.join(into, 'seat-B.md')]);
  assert.ok(fs.readFileSync(path.join(into, 'seat-A.md')).equals(fs.readFileSync(path.join(b.runDir, 'report.md'))));
  assert.ok(fs.readFileSync(path.join(into, 'seat-B.md')).equals(fs.readFileSync(path.join(a.runDir, 'report.md'))));
  for (const ref of refs.filter((r) => r.startsWith(into))) {
    assert.ok(!/panelist|unit-run-a|runs/.test(ref), `no identity in ${ref}`);
  }
  assert.deepEqual(inputMap, [
    { name: 'seat-A.md', input: 'unit-run:unit-run-a/panelist-2', source: path.join(b.runDir, 'report.md') },
    { name: 'seat-B.md', input: 'unit-run:unit-run-a/panelist-1', source: path.join(a.runDir, 'report.md') },
  ]);
});

test('without the option nothing is copied and no mapping is made', () => {
  const root = makeRoot();
  const { runDir } = settleAttempt(root, 'unit-run-a', 'panelist-1', '1', { report: 'x\n' });
  const { refs, inputMap } = resolveUnitInputs(['unit-run:unit-run-a/panelist-1'], root);
  assert.deepEqual(refs, [path.join(runDir, 'report.md')]);
  assert.deepEqual(inputMap, []);
});

test('anonymizing still refuses an edited report and leaves no directory behind', () => {
  const root = makeRoot();
  const { runDir } = settleAttempt(root, 'unit-run-a', 'panelist-1', '1', { report: 'x\n' });
  fs.writeFileSync(path.join(runDir, 'report.md'), 'changed\n');
  const into = path.join(root, 'own-unit-dir', 'inputs');
  assert.throws(
    () => resolveUnitInputs(['unit-run:unit-run-a/panelist-1'], root, { anonymizeInto: into }),
    (err) => err instanceof HandoffRefError && err.reason === 'report-changed-after-settle',
  );
  assert.throws(
    () => resolveUnitInputs(['unit-run:unit-run-a/nobody'], root, { anonymizeInto: into }),
    (err) => err instanceof HandoffRefError && err.reason === 'no-such-role',
  );
  assert.equal(fs.existsSync(into), false);
});

test('a copy that cannot be made is a named hand-off failure', () => {
  const root = makeRoot();
  settleAttempt(root, 'unit-run-a', 'panelist-1', '1', { report: 'x\n' });
  const blocker = path.join(root, 'blocker');
  fs.writeFileSync(blocker, 'a file where a directory is needed');
  assert.throws(
    () => resolveUnitInputs(['unit-run:unit-run-a/panelist-1'], root, { anonymizeInto: path.join(blocker, 'inputs') }),
    (err) => err instanceof HandoffRefError && /^copy-failed/.test(err.reason),
  );
});

test('neutral names run on past Z', () => {
  assert.deepEqual([0, 1, 25, 26, 27].map(anonymousInputName), ['seat-A', 'seat-B', 'seat-Z', 'seat-AA', 'seat-AB']);
});
