import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankCandidates } from '../../src/evolve/candidates.mjs';
import { computeEntropy, WEIGHTS } from '../../src/report/entropy.mjs';

// rankCandidates is pure over a hand-built view (same shape replay.mjs's
// foldEvents produces: view.frictions[id] = array of records, each carrying
// its payload fields + a `ts`), never a real store/log.

function friction(id, ts, extra = {}) {
  return { id, ts, disposition: 'parked', errorClass: 'worker-timeout', layer: 'environment', attempts: 1, detail: 'boom', ...extra };
}

test('rankCandidates on an empty view returns an empty list, not an error', () => {
  assert.deepEqual(rankCandidates({ work: {}, decisions: [] }), []);
});

test('rankCandidates ignores an id whose every friction has since settled', () => {
  const view = {
    frictions: { a: [friction('a', '2026-07-16T00:00:00.000Z')] },
    settlements: { a: [{ kind: 'close', ts: '2026-07-16T01:00:00.000Z' }] },
  };
  assert.deepEqual(rankCandidates(view), []);
});

test('rankCandidates emits one candidate per unsettled id with every human-facing field', () => {
  const view = {
    frictions: { a: [friction('a', '2026-07-16T00:00:00.000Z')] },
  };
  const [c] = rankCandidates(view);
  assert.deepEqual(c, {
    id: 'a',
    disposition: 'parked',
    errorClass: 'worker-timeout',
    layer: 'environment',
    detail: 'boom',
    attempts: 1,
    score: 1 * WEIGHTS.frictionUnsettled,
  });
});

test('rankCandidates is deterministic: same view always yields the same ordered output', () => {
  const view = {
    frictions: {
      a: [friction('a', '2026-07-16T00:00:00.000Z')],
      b: [friction('b', '2026-07-16T00:00:00.000Z'), friction('b', '2026-07-16T01:00:00.000Z')],
      c: [friction('c', '2026-07-16T00:00:00.000Z')],
    },
  };
  assert.deepEqual(rankCandidates(view), rankCandidates(view));
});

test('rankCandidates orders by score descending', () => {
  const view = {
    frictions: {
      low: [friction('low', '2026-07-16T00:00:00.000Z')],
      high: [
        friction('high', '2026-07-16T00:00:00.000Z'),
        friction('high', '2026-07-16T01:00:00.000Z'),
        friction('high', '2026-07-16T02:00:00.000Z'),
      ],
    },
  };
  assert.deepEqual(rankCandidates(view).map((c) => c.id), ['high', 'low']);
});

test('rankCandidates breaks equal-score ties by ascending id', () => {
  const view = {
    frictions: {
      zed: [friction('zed', '2026-07-16T00:00:00.000Z')],
      alpha: [friction('alpha', '2026-07-16T00:00:00.000Z')],
      mid: [friction('mid', '2026-07-16T00:00:00.000Z')],
    },
  };
  assert.deepEqual(rankCandidates(view).map((c) => c.id), ['alpha', 'mid', 'zed']);
});

test('multi-record id: displayed fields come from the latest record by ts, score sums ALL unsettled records', () => {
  const view = {
    frictions: {
      a: [
        friction('a', '2026-07-16T00:00:00.000Z', { errorClass: 'worker-timeout', layer: 'environment', attempts: 1, detail: 'first' }),
        friction('a', '2026-07-16T02:00:00.000Z', { errorClass: 'verify-miss', layer: 'verification', attempts: 3, detail: 'latest' }),
        friction('a', '2026-07-16T01:00:00.000Z', { errorClass: 'task-spec', layer: 'task-spec', attempts: 2, detail: 'middle' }),
      ],
    },
  };
  const [c] = rankCandidates(view);
  assert.equal(c.errorClass, 'verify-miss', 'fields come from the latest ts, not log order');
  assert.equal(c.layer, 'verification');
  assert.equal(c.attempts, 3);
  assert.equal(c.detail, 'latest');
  assert.equal(c.score, 3 * WEIGHTS.frictionUnsettled, 'score counts all three unsettled records, not just the latest');
});

test('multi-record id: a settlement between records drops only the records before it from the score', () => {
  const view = {
    frictions: {
      a: [
        friction('a', '2026-07-16T00:00:00.000Z'),
        friction('a', '2026-07-16T02:00:00.000Z'),
      ],
    },
    settlements: { a: [{ kind: 'close', ts: '2026-07-16T01:00:00.000Z' }] },
  };
  const [c] = rankCandidates(view);
  assert.equal(c.score, 1 * WEIGHTS.frictionUnsettled, 'only the post-settlement record stays unsettled');
});

test('equal-ts tie: the later-in-array record wins the displayed fields, matching log/append order', () => {
  const view = {
    frictions: {
      a: [
        friction('a', '2026-07-16T00:00:00.000Z', { errorClass: 'first-in-array', layer: 'environment', attempts: 1, detail: 'first' }),
        friction('a', '2026-07-16T00:00:00.000Z', { errorClass: 'second-in-array', layer: 'verification', attempts: 2, detail: 'second' }),
      ],
    },
  };
  const [c] = rankCandidates(view);
  assert.equal(c.errorClass, 'second-in-array', 'on an exact ts tie, the later-encountered record wins');
  assert.equal(c.layer, 'verification');
  assert.equal(c.attempts, 2);
  assert.equal(c.detail, 'second');
});

test('cross-module regression: candidate scores sum to entropy.mjs\'s own unsettled-friction count for the same view', () => {
  const view = {
    work: { a: { id: 'a', status: 'todo' }, b: { id: 'b', status: 'todo' } },
    frictions: {
      a: [friction('a', '2026-07-16T00:00:00.000Z'), friction('a', '2026-07-16T01:00:00.000Z')],
      b: [friction('b', '2026-07-16T00:00:00.000Z')],
      settled: [friction('settled', '2026-07-16T00:00:00.000Z')],
    },
    settlements: { settled: [{ kind: 'close', ts: '2026-07-16T05:00:00.000Z' }] },
  };
  const candidateUnsettledTotal = rankCandidates(view).reduce(
    (sum, c) => sum + c.score / WEIGHTS.frictionUnsettled,
    0,
  );
  const entropyUnsettledCount = computeEntropy(view).parts.find((p) => p.label === 'friction-unsettled').count;
  assert.equal(candidateUnsettledTotal, entropyUnsettledCount);
  assert.equal(entropyUnsettledCount, 3);
});
