// Role results handed to a later role become the context refs that role is told to read.

import test from 'node:test';
import assert from 'node:assert/strict';

import { contextRefsFromRoleResults } from '../../../src/runner/execution/role-input-refs.mjs';

const ROOT = '/main/checkout';
const withArtifacts = (...artifacts) => ({ role: 'panelist-1', runResult: { evidence: { artifacts } } });

test('a role result contributes the absolute path of its report', () => {
  const refs = contextRefsFromRoleResults(
    [withArtifacts('.fgos/assignments/u/panelist-1/1/runs/01/outbox/report-1.md', '.fgos/assignments/u/panelist-1/1/runs/01/outbox/result-1.json')],
    ROOT,
  );
  assert.deepEqual(refs, ['/main/checkout/.fgos/assignments/u/panelist-1/1/runs/01/outbox/report-1.md']);
});

test('the legacy report name is recognised too', () => {
  const refs = contextRefsFromRoleResults([withArtifacts('.fgos/a/runs/01/agent-report.md')], ROOT);
  assert.deepEqual(refs, ['/main/checkout/.fgos/a/runs/01/agent-report.md']);
});

test('without a report the result claim stands in for it', () => {
  const refs = contextRefsFromRoleResults([withArtifacts('.fgos/a/runs/01/outbox/result-2.json')], ROOT);
  assert.deepEqual(refs, ['/main/checkout/.fgos/a/runs/01/outbox/result-2.json']);
});

test('input order is kept and the same path is listed once', () => {
  const a = withArtifacts('.fgos/a/outbox/report-1.md');
  const b = withArtifacts('.fgos/b/outbox/report-1.md');
  assert.deepEqual(contextRefsFromRoleResults([a, b, a], ROOT), [
    '/main/checkout/.fgos/a/outbox/report-1.md',
    '/main/checkout/.fgos/b/outbox/report-1.md',
  ]);
});

test('an absolute artifact path is kept as it is', () => {
  assert.deepEqual(contextRefsFromRoleResults([withArtifacts('/elsewhere/outbox/report-1.md')], ROOT), ['/elsewhere/outbox/report-1.md']);
});

test('results with no evidence, and non-results, contribute nothing', () => {
  assert.deepEqual(contextRefsFromRoleResults([{ role: 'x' }, { runResult: {} }, null, undefined, withArtifacts()], ROOT), []);
  assert.deepEqual(contextRefsFromRoleResults(undefined, ROOT), []);
});

test('files that are neither a report nor a claim are ignored', () => {
  assert.deepEqual(contextRefsFromRoleResults([withArtifacts('.fgos/a/stdout.log', 'notes.txt')], ROOT), []);
});
