import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeEntropy, computeCounts } from '../../src/report/entropy.mjs';

// computeEntropy/computeCounts are pure over a hand-built view (per this
// cell's must_haves: no fs, no side effects) — every test below constructs
// its own minimal view shape, the same shape replay.mjs's foldEvents
// produces, never a real store/log.

test('computeEntropy on an empty view scores 0 with every part at zero count', () => {
  const { score, parts } = computeEntropy({ work: {}, decisions: [] });
  assert.equal(score, 0);
  assert.ok(parts.length > 0, 'parts must explain the (zero) score, never a bare number');
  assert.ok(parts.every((p) => p.count === 0 && p.points === 0));
});

test('computeEntropy weighs a final-status item missing its actual half at ×5', () => {
  const view = {
    work: { a: { id: 'a', status: 'done' } },
    outcomes: { a: { predicted: { tier: 'standard' } } }, // no actual half yet
  };
  const { score, parts } = computeEntropy(view);
  assert.equal(score, 5);
  const row = parts.find((p) => p.label === 'missing-actual');
  assert.equal(row.count, 1);
  assert.equal(row.weight, 5);
  assert.equal(row.points, 5);
});

test('computeEntropy does not flag a final-status item that already has its actual half recorded', () => {
  const view = {
    work: { a: { id: 'a', status: 'done' } },
    outcomes: { a: { actual: { outcome: 'proposed', passed: true } } },
  };
  assert.equal(computeEntropy(view).score, 0);
});

test('computeEntropy does not flag a non-final-status item with no outcome at all (predicted->actual loop has not closed yet, not silent)', () => {
  const view = { work: { a: { id: 'a', status: 'todo' } } };
  assert.equal(computeEntropy(view).score, 0);
});

test('computeEntropy weighs a "doing" item (stale-suspect, per this cell\'s action) at ×5', () => {
  const view = { work: { a: { id: 'a', status: 'doing' } } };
  const { score, parts } = computeEntropy(view);
  assert.equal(score, 5);
  assert.equal(parts.find((p) => p.label === 'stale-doing').count, 1);
});

test('computeEntropy weighs an "awaiting-human" item at ×2', () => {
  const view = { work: { a: { id: 'a', status: 'awaiting-human' } } };
  const { score, parts } = computeEntropy(view);
  assert.equal(score, 2);
  assert.equal(parts.find((p) => p.label === 'awaiting-human').count, 1);
});

test('computeEntropy weighs an item still sitting in stage "clarify" at ×3', () => {
  const view = { work: { a: { id: 'a', status: 'todo', stage: 'clarify' } } };
  const { score, parts } = computeEntropy(view);
  assert.equal(score, 3);
  assert.equal(parts.find((p) => p.label === 'stage-clarify').count, 1);
});

test('computeEntropy does not flag an item whose stage has already advanced past clarify', () => {
  const view = { work: { a: { id: 'a', status: 'todo', stage: 'executing' } } };
  assert.equal(computeEntropy(view).score, 0);
});

test('computeEntropy weighs a friction record with no later settlement on the same id at ×2', () => {
  const view = {
    work: { a: { id: 'a', status: 'todo' } },
    frictions: { a: [{ id: 'a', ts: '2026-07-16T00:00:00.000Z', layer: 'environment', errorClass: 'worker-timeout' }] },
  };
  const { score, parts } = computeEntropy(view);
  assert.equal(score, 2);
  assert.equal(parts.find((p) => p.label === 'friction-unsettled').count, 1);
});

test('computeEntropy does not flag a friction record that a LATER settlement on the same id resolved', () => {
  const view = {
    work: { a: { id: 'a', status: 'todo' } },
    frictions: { a: [{ id: 'a', ts: '2026-07-16T00:00:00.000Z' }] },
    settlements: { a: [{ kind: 'close', ts: '2026-07-16T00:00:01.000Z' }] },
  };
  assert.equal(computeEntropy(view).score, 0);
});

test('computeEntropy still flags a friction record whose only settlement on that id happened BEFORE it', () => {
  const view = {
    work: { a: { id: 'a', status: 'todo' } },
    frictions: { a: [{ id: 'a', ts: '2026-07-16T01:00:00.000Z' }] },
    settlements: { a: [{ kind: 'answer', ts: '2026-07-16T00:00:00.000Z' }] },
  };
  assert.equal(computeEntropy(view).score, 2);
});

test('computeEntropy counts a friction record on one id as unsettled even when a DIFFERENT id has a later settlement', () => {
  const view = {
    work: { a: { id: 'a', status: 'todo' }, b: { id: 'b', status: 'todo' } },
    frictions: { a: [{ id: 'a', ts: '2026-07-16T00:00:00.000Z' }] },
    settlements: { b: [{ kind: 'close', ts: '2026-07-16T01:00:00.000Z' }] },
  };
  assert.equal(computeEntropy(view).score, 2);
});

test('computeEntropy sums multiple contributing signals across different items into one score', () => {
  const view = {
    work: {
      a: { id: 'a', status: 'doing' },
      b: { id: 'b', status: 'awaiting-human' },
      c: { id: 'c', status: 'todo', stage: 'clarify' },
    },
  };
  assert.equal(computeEntropy(view).score, 5 + 2 + 3);
});

test('computeCounts on an empty view returns all-zero counts', () => {
  assert.deepEqual(computeCounts({ work: {}, decisions: [] }), { outcomes: 0, frictions: 0, settlements: 0 });
});

test('computeCounts counts only outcomes with an actual half recorded, not predicted-only entries', () => {
  const view = {
    outcomes: {
      a: { predicted: { tier: 'standard' } },
      b: { predicted: { tier: 'light' }, actual: { outcome: 'proposed', passed: true } },
    },
  };
  assert.equal(computeCounts(view).outcomes, 1);
});

test('computeCounts flattens friction and settlement records across every id', () => {
  const view = {
    frictions: { a: [{}, {}], b: [{}] },
    settlements: { a: [{}], b: [{}, {}] },
  };
  const counts = computeCounts(view);
  assert.equal(counts.frictions, 3);
  assert.equal(counts.settlements, 3);
});
