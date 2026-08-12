import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeEntropy, computeCounts, FINAL_STATUSES } from '../../src/report/entropy.mjs';

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
    outcomes: { a: { actual: { outcome: 'awaiting-approval', passed: true } } },
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

test("computeEntropy weighs an item still sitting at its domain's entry stage at ×3", () => {
  const view = { work: { a: { id: 'a', status: 'todo', stage: 'discovery' } } };
  const { score, parts } = computeEntropy(view);
  assert.equal(score, 3);
  assert.equal(parts.find((p) => p.label === 'stage-entry').count, 1);
});

test('computeEntropy does not flag an item whose stage has already advanced past the entry stage', () => {
  const view = { work: { a: { id: 'a', status: 'todo', stage: 'executing' } } };
  assert.equal(computeEntropy(view).score, 0);
});

// tsk-2t3: this signal used to filter on the literal stage name 'clarify'.
// That stage was retired outright for the coding domain (gone from `stages`,
// `skillMap` and `stepMap`), so the filter silently reported 0 forever while
// every open item genuinely waiting at coding's real entry stage --
// `discovery`, i.e. `stages[0]` -- went uncounted. The signal now resolves
// each item's OWN domain entry stage, so a leftover `clarify` on a coding
// item is a historical artifact, not a live signal.
test('computeEntropy does not flag a coding item still carrying the retired stage "clarify"', () => {
  const view = { work: { a: { id: 'a', status: 'todo', stage: 'clarify' } } };
  const { parts } = computeEntropy(view);
  assert.equal(parts.find((p) => p.label === 'stage-entry').count, 0);
});

// Per-domain resolution, not a global rename of one literal to another:
// 'fixture-marketing' really does declare 'clarify' as its own entry stage
// and 'triage' declares 'triage' -- an item at its own domain's entry stage
// counts no matter which literal that domain chose.
test("computeEntropy flags an item at its own domain's entry stage even when that literal differs per domain", () => {
  const view = {
    work: {
      a: { id: 'a', status: 'todo', domain: 'fixture-marketing', stage: 'clarify' },
      b: { id: 'b', status: 'todo', domain: 'triage', stage: 'triage' },
      c: { id: 'c', status: 'todo', stage: 'discovery' },
    },
  };
  const { parts } = computeEntropy(view);
  assert.equal(parts.find((p) => p.label === 'stage-entry').count, 3);
});

test("computeEntropy does not flag an item sitting at ANOTHER domain's entry stage name", () => {
  const view = {
    work: {
      a: { id: 'a', status: 'todo', domain: 'triage', stage: 'discovery' },
      b: { id: 'b', status: 'todo', domain: 'fixture-marketing', stage: 'discovery' },
    },
  };
  const { parts } = computeEntropy(view);
  assert.equal(parts.find((p) => p.label === 'stage-entry').count, 0);
});

// wontfix-terminal-status-filter-consistency D3: status is never reset by a
// stage transition and vice versa -- an item closed done/wontfix while
// still carrying the entry stage must not inflate this signal, since
// nothing further will ever happen at that stage for a resolved item.
for (const status of ['done', 'wontfix']) {
  test(`computeEntropy does not flag a "${status}" item still carrying the entry stage -- resolved items are no longer waiting anywhere (D3)`, () => {
    const view = { work: { a: { id: 'a', status, stage: 'discovery' } } };
    const { parts } = computeEntropy(view);
    assert.equal(parts.find((p) => p.label === 'stage-entry').count, 0);
  });
}

for (const status of ['todo', 'doing', 'blocked', 'awaiting-human']) {
  test(`computeEntropy still flags a "${status}" item at the entry stage (D3 does not over-broaden past done/wontfix)`, () => {
    const view = { work: { a: { id: 'a', status, stage: 'discovery' } } };
    const { parts } = computeEntropy(view);
    assert.equal(parts.find((p) => p.label === 'stage-entry').count, 1);
  });
}

// tsk-38t-4 (decision record 0027, D2): the entry-stage count reads
// isResolvedStatus(item), a hybrid of literal tail-status + statusCategory
// === 'canceled', instead of a flat RESOLVED_STATUSES.has(item.status) Set
// -- this is the whole point of the migration: a domain that relabels its
// wontfix-equivalent status away from the literal string 'wontfix' must
// still be recognized as resolved, via the frozen-at-write-time
// statusCategory field, not a literal string match.
test("computeEntropy does not flag an entry-stage item with a DIFFERENT domain's canceled-equivalent label + statusCategory 'canceled' (proves category-based recognition, not a literal 'wontfix' match)", () => {
  const view = { work: { a: { id: 'a', status: 'declined', statusCategory: 'canceled', stage: 'discovery' } } };
  const { parts } = computeEntropy(view);
  assert.equal(parts.find((p) => p.label === 'stage-entry').count, 0);
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
      c: { id: 'c', status: 'todo', stage: 'discovery' },
    },
  };
  assert.equal(computeEntropy(view).score, 5 + 2 + 3);
});

// tsk-38t-4 (decision record 0027's audit §2): FINAL_STATUSES used to be a
// local Set in this file that OMITTED the four tail-segment statuses
// (delivered/retrospective/cleanup), even though this file's own
// countMissingActual doc comment claims to mirror bin/fgos.mjs's
// formatMissingOutcomeNag rule -- which already included them. That drift
// was a real bug (0027's audit): an item that reached e.g. 'delivered' via
// the sync-root/catchup mechanical reconcile path (never going through the
// normal doing -> awaiting-approval addOutcome stamp) could sit there
// forever with a missing actual half and never get flagged by entropy,
// even though the CLI's own outcome-backfill nag already caught it. These
// tests lock the widened (bug-fixed), now-shared set.
test('FINAL_STATUSES (shared with bin/fgos.mjs) includes every tail-segment status, not just the front-segment pair', () => {
  assert.deepEqual(
    [...FINAL_STATUSES].sort(),
    ['awaiting-approval', 'blocked', 'cleanup', 'delivered', 'done', 'retrospective'].sort(),
  );
});

for (const status of ['delivered', 'retrospective', 'cleanup']) {
  test(`computeEntropy now flags a "${status}" item missing its actual half at ×5 (bug fix: entropy.mjs's own FINAL_STATUSES used to omit the tail segment)`, () => {
    const view = {
      work: { a: { id: 'a', status } },
      outcomes: { a: { predicted: { tier: 'standard' } } }, // no actual half yet
    };
    const { score, parts } = computeEntropy(view);
    assert.equal(score, 5);
    assert.equal(parts.find((p) => p.label === 'missing-actual').count, 1);
  });
}

test('computeCounts on an empty view returns all-zero counts', () => {
  assert.deepEqual(computeCounts({ work: {}, decisions: [] }), { outcomes: 0, frictions: 0, settlements: 0 });
});

test('computeCounts counts only outcomes with an actual half recorded, not predicted-only entries', () => {
  const view = {
    outcomes: {
      a: { predicted: { tier: 'standard' } },
      b: { predicted: { tier: 'light' }, actual: { outcome: 'awaiting-approval', passed: true } },
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
