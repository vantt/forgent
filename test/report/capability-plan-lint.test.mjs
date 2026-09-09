// capability-plan-lint.test.mjs — P3 static/read-only harness proof
// (docs/history/agent-coordination-foundation/plan.md): every check runs
// against plain text, writes nothing, and never touches Work/.fgos state.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lintPlanCapabilityAnnotations } from '../../src/report/capability-plan-lint.mjs';
import { DEFAULT_CAPABILITY_SLOTS } from '../../src/setup/registrations.mjs';

const REGISTERED = [...Object.keys(DEFAULT_CAPABILITY_SLOTS), 'impact-analysis', 'pane-labeling'];

test('a plan with valid, registered, unpinned units passes clean', () => {
  const text = `# Plan

- unit: apply the fix to src/foo.mjs
  capability: code:implement
- unit: independent review of the fix
  capability: code:review
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
  assert.equal(result.units.length, 2);
  assert.equal(result.units[0].capability, 'code:implement');
});

test('a unit with no capability line is flagged', () => {
  const text = `- unit: apply the fix to src/foo.mjs
  action: just do it
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.findings.length, 1);
  assert.match(result.findings[0].message, /has no "capability:" line/);
});

test('an invalid capability shape (not generic, not domain:capability) is flagged', () => {
  const text = `- unit: apply the fix
  capability: Code Implement
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.match(result.findings[0].message, /not a valid canonical shape/);
});

test('a syntactically valid but unregistered capability is flagged, naming the register-first remedy', () => {
  const text = `- unit: apply the fix
  capability: code:teleport
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.match(result.findings[0].message, /not registered/);
  assert.match(result.findings[0].message, /DEFAULT_CAPABILITY_SLOTS/);
});

test('a capability explicitly marked "unresolved" is never flagged as unregistered', () => {
  const text = `- unit: apply the fix
  capability: unresolved (needs a new capability, not yet registered)
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
});

test('a unit pinning executor/provider/model/tier is flagged per pinned field, syntax stays valid', () => {
  const text = `- unit: apply the fix
  capability: code:implement
  executor: agy
  model: sonnet
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.findings.length, 2);
  assert.ok(result.findings.every((f) => /never pins provider\/model\/executor\/tier/.test(f.message)));
  assert.deepEqual(
    result.findings.map((f) => f.message.match(/pins "(\w+)"/)[1]),
    ['executor', 'model'],
  );
});

test('provider/executor/model prose OUTSIDE a unit block is never flagged (scoped to unit blocks only, not whole-file)', () => {
  const text = `# Plan

This plan discusses provider/model/executor selection as a concept, never
as a literal pin: execution-time decide chooses the provider and model.

- unit: apply the fix
  capability: code:implement
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
});

test('a real doctrine document (executor-dispatch-fallback.md-shaped prose, no "- unit:" lines at all) lints clean -- zero units, zero findings', () => {
  const text = `# Shared fragment

This fragment never uses the "- unit:" convention -- it is dispatch prose,
not a plan. provider, model, executor, tier are all discussed in prose.
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
  assert.deepEqual(result.units, []);
});

test('multiple units are each linted independently -- one bad unit does not swallow a good sibling', () => {
  const text = `- unit: first
  capability: code:implement
- unit: second
  capability: code:teleport
- unit: third
  capability: code:review
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.units.length, 3);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].unit, 'second');
});
