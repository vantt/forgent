import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHandoff } from '../../src/state/handoff.mjs';
import { DOMAINS, roleGraphFor, legalCallEdges } from '../../src/state/workflow-stage-graphs.mjs';

const coding = DOMAINS.coding;
const synthetic = DOMAINS.synthetic;

test('roleGraphFor: coding declares one, synthetic does not', () => {
  assert.ok(roleGraphFor(coding));
  assert.equal(roleGraphFor(synthetic), undefined);
});

test('legalCallEdges: empty for a domain with no roleGraph', () => {
  assert.deepEqual(legalCallEdges(synthetic, 'assembling', 'implementer'), []);
});

// tsk-2t9c D14: discovery is machine-alone (no human interaction) but it
// DOES call fgos-researching for real -- this edge was a genuine gap in
// the original roleGraph, found while wiring fgos-coding-discovering.
test('legal call: implementer --consult--> researcher at discovery (D14 correction)', () => {
  const result = evaluateHandoff({
    domain: coding,
    stage: 'discovery',
    fromRole: 'implementer',
    toRole: 'researcher',
    reason: 'consult',
  });
  assert.equal(result.ok, true);
  assert.equal(result.edge.mode, 'sync');
});

test('discovery declares ONLY consult -- no advise, since discovery never asks a human directly', () => {
  const result = evaluateHandoff({
    domain: coding,
    stage: 'discovery',
    fromRole: 'implementer',
    toRole: 'human-advisor',
    reason: 'advise',
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.legalEdges.map((e) => e.reason), ['consult']);
});

test('legal call: implementer --review--> reviewer at executing', () => {
  const result = evaluateHandoff({
    domain: coding,
    stage: 'executing',
    fromRole: 'implementer',
    toRole: 'reviewer',
    reason: 'review',
  });
  assert.equal(result.ok, true);
  assert.equal(result.edge.mode, 'async');
});

test('off-graph refusal lists the legal edges for the caller (chặn và dạy)', () => {
  const result = evaluateHandoff({
    domain: coding,
    stage: 'executing',
    fromRole: 'helper',
    toRole: 'reviewer',
    reason: 'review',
  });
  assert.equal(result.ok, false);
  assert.match(result.refusal, /no legal call edges/);
  // helper has no edges declared at executing at all
  assert.deepEqual(result.legalEdges, []);
});

test('wrong-stage refusal returns that stage\'s own legal edges', () => {
  const result = evaluateHandoff({
    domain: coding,
    stage: 'exploring',
    fromRole: 'implementer',
    toRole: 'reviewer',
    reason: 'review',
  });
  assert.equal(result.ok, false);
  const reasons = result.legalEdges.map((e) => e.reason).sort();
  assert.deepEqual(reasons, ['advise', 'consult']);
});

test('nested async call under the cap succeeds, at the cap is refused', () => {
  const under = evaluateHandoff({
    domain: coding,
    stage: 'executing',
    fromRole: 'reviewer',
    toRole: 'human-advisor',
    reason: 'advise',
    openCallDepth: 2,
  });
  assert.equal(under.ok, true);

  const atCap = evaluateHandoff({
    domain: coding,
    stage: 'executing',
    fromRole: 'reviewer',
    toRole: 'human-advisor',
    reason: 'advise',
    openCallDepth: 3,
  });
  assert.equal(atCap.ok, false);
  assert.match(atCap.refusal, /callstack cap/);
});

test('sync call has no callstack cap applied', () => {
  const result = evaluateHandoff({
    domain: coding,
    stage: 'executing',
    fromRole: 'implementer',
    toRole: 'researcher',
    reason: 'consult',
    openCallDepth: 999,
  });
  assert.equal(result.ok, true);
});

test('domain with no roleGraph refuses with a domain-level message, never crashes', () => {
  const result = evaluateHandoff({
    domain: synthetic,
    stage: 'assembling',
    fromRole: 'implementer',
    toRole: 'reviewer',
    reason: 'review',
  });
  assert.equal(result.ok, false);
  assert.match(result.refusal, /no roleGraph/);
});

test('unknown fromRole never throws, just yields no legal edges', () => {
  const result = evaluateHandoff({
    domain: coding,
    stage: 'executing',
    fromRole: 'nonexistent-role',
    toRole: 'reviewer',
    reason: 'review',
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.legalEdges, []);
});

test('pure function: same inputs, same output, no fs/config dependency', () => {
  const args = {
    domain: coding,
    stage: 'executing',
    fromRole: 'implementer',
    toRole: 'reviewer',
    reason: 'review',
  };
  const a = evaluateHandoff(args);
  const b = evaluateHandoff(args);
  assert.deepEqual(a, b);
});
