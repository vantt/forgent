// Phase 08 (executor-policy-dispatch-seams) production binder proof for
// read-only redirect EXECUTOR selection -- the companion to Phase 07's
// model-selection proof (placement-policy-matrix-coverage.test.mjs).
//
// The read-only redirect pool's real selection algorithm
// (assignment-runner.mjs's stableIndex: SHA-256(seed) % size) is a
// deterministic, assignment-seeded distribution across a candidate pool --
// this file independently reproduces that exact formula (never imports
// assignment-runner.mjs's own copy) to prove placement-policy.mjs's
// stablePoolIndex agrees byte-for-byte, across many seeds and pool sizes,
// not just the one single-candidate pool the live .fgos/config.json
// happens to declare today.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  stablePoolIndex,
  selectPlacementPolicyRedirectExecutor,
  resolveVerifiedRedirectExecutor,
} from '../../src/runner/dispatch/placement-policy.mjs';

// Independent reproduction of assignment-runner.mjs's stableIndex -- if the
// two ever drift, this test (not a shared import) is what catches it.
function referenceStableIndex(seed, size) {
  if (!Number.isInteger(size) || size <= 0) return 0;
  const hash = crypto.createHash('sha256').update(String(seed)).digest();
  return hash.readUInt32BE(0) % size;
}

function runnerConfig() {
  return {
    executors: {
      claude: { command: 'claude' },
      'codex-bwrap': { command: 'codex' },
      'claude-reviewer': { command: 'claude' },
      'pi-herdr': { command: 'pi' },
    },
  };
}

test('Phase 08: stablePoolIndex agrees byte-for-byte with an independently-reproduced copy of the legacy stableIndex formula, across many seeds and pool sizes', () => {
  const seeds = [
    'review-candidate:asgn_001', 'review-candidate:asgn_002', 'red-team-candidate:asgn_003',
    'shape-plan:asgn_tsk_456_001', ':', 'x', '', 'a-very-long-seed-string-with-unicode-🎯-in-it',
  ];
  for (const seed of seeds) {
    for (let size = 1; size <= 8; size++) {
      assert.equal(stablePoolIndex(seed, size), referenceStableIndex(seed, size), `mismatch for seed=${JSON.stringify(seed)} size=${size}`);
    }
  }
});

test('Phase 08: stablePoolIndex handles the degenerate size<=0 case the same way the legacy formula does', () => {
  assert.equal(stablePoolIndex('anything', 0), 0);
  assert.equal(stablePoolIndex('anything', -1), 0);
  assert.equal(stablePoolIndex('anything', NaN), 0);
});

test('Phase 08: selectPlacementPolicyRedirectExecutor reproduces the REAL live config\'s single-candidate redirect (claude -> codex-bwrap) exactly', () => {
  const cfg = runnerConfig();
  // Matches the live .fgos/config.json shape verbatim: placementPolicy.readOnlyRedirects.claude.default = ["codex-bwrap"].
  const result = selectPlacementPolicyRedirectExecutor({ cfg, sourceExecutorId: 'claude', candidatePool: ['codex-bwrap'], seed: 'review-candidate:asgn_real_001' });
  assert.equal(result, 'codex-bwrap');
});

test('Phase 08: selectPlacementPolicyRedirectExecutor distributes across a multi-candidate pool exactly like the legacy formula, for 200 distinct seeds', () => {
  const cfg = runnerConfig();
  const pool = ['codex-bwrap', 'claude-reviewer', 'pi-herdr'];
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const seed = `op-${i}:asgn_${i}`;
    const placementResult = selectPlacementPolicyRedirectExecutor({ cfg, sourceExecutorId: 'claude', candidatePool: pool, seed });
    const legacyIndex = referenceStableIndex(seed, pool.length);
    assert.equal(placementResult, pool[legacyIndex], `divergence at seed ${seed}`);
    seen.add(placementResult);
  }
  // Sanity: a real distribution across 200 seeds should actually touch more
  // than one candidate (rules out an accidentally-constant "always index 0"
  // implementation passing this test for the wrong reason).
  assert.ok(seen.size > 1, 'expected the stable-hash distribution to actually vary across candidates for 200 distinct seeds');
});

test('Phase 08: selectPlacementPolicyRedirectExecutor excludes the source executor itself and any unregistered candidate, matching legacy admissibility rules', () => {
  const cfg = runnerConfig();
  const result = selectPlacementPolicyRedirectExecutor({
    cfg,
    sourceExecutorId: 'claude',
    candidatePool: ['claude', 'not-a-registered-executor', 'codex-bwrap'],
    seed: 'x',
  });
  assert.equal(result, 'codex-bwrap', 'only codex-bwrap is admissible -- claude (self) and the unregistered id must be filtered out');
});

test('Phase 08: selectPlacementPolicyRedirectExecutor returns sourceExecutorId unchanged when the pool is empty or nothing is admissible', () => {
  const cfg = runnerConfig();
  assert.equal(selectPlacementPolicyRedirectExecutor({ cfg, sourceExecutorId: 'claude', candidatePool: [], seed: 'x' }), 'claude');
  assert.equal(selectPlacementPolicyRedirectExecutor({ cfg, sourceExecutorId: 'claude', candidatePool: ['claude'], seed: 'x' }), 'claude');
  assert.equal(selectPlacementPolicyRedirectExecutor({ cfg, sourceExecutorId: 'claude', candidatePool: ['not-registered'], seed: 'x' }), 'claude');
});

test('Phase 08 PRODUCTION BINDER proof: resolveVerifiedRedirectExecutor is PlacementPolicy-sourced (not falling back) whenever it genuinely agrees with the legacy value, for the real config shape and a synthetic multi-candidate pool', () => {
  const cfg = runnerConfig();

  const realShape = resolveVerifiedRedirectExecutor({
    cfg,
    sourceExecutorId: 'claude',
    candidatePool: ['codex-bwrap'],
    seed: 'review-candidate:asgn_real_002',
    legacyExecutorId: 'codex-bwrap', // what selectReadOnlyRedirectExecutor would have computed
  });
  assert.equal(realShape.executorId, 'codex-bwrap');
  assert.equal(realShape.source, 'placement-policy');
  assert.equal(realShape.divergence, null);

  const pool = ['codex-bwrap', 'claude-reviewer', 'pi-herdr'];
  for (let i = 0; i < 50; i++) {
    const seed = `multi-op-${i}:asgn_${i}`;
    const legacyExecutorId = pool[referenceStableIndex(seed, pool.length)];
    const result = resolveVerifiedRedirectExecutor({ cfg, sourceExecutorId: 'claude', candidatePool: pool, seed, legacyExecutorId });
    assert.equal(result.executorId, legacyExecutorId);
    assert.equal(result.source, 'placement-policy', `expected PlacementPolicy to be trusted (not fall back) at seed ${seed}`);
    assert.equal(result.divergence, null);
  }
});

test('Phase 08 PRODUCTION BINDER proof: a genuine divergence falls back to the legacy value and is reported, never silently applied', () => {
  const cfg = runnerConfig();
  // A legacyExecutorId that could not possibly be what the real formula
  // produces for this seed/pool -- simulates a real algorithm drift.
  const result = resolveVerifiedRedirectExecutor({
    cfg,
    sourceExecutorId: 'claude',
    candidatePool: ['codex-bwrap'],
    seed: 'x',
    legacyExecutorId: 'claude-reviewer', // deliberately wrong for this pool
  });
  assert.equal(result.executorId, 'claude-reviewer', 'must fall back to the caller-supplied legacy value, never the unverified PlacementPolicy one');
  assert.equal(result.source, 'legacy');
  assert.ok(result.divergence);
  assert.equal(result.divergence.legacyExecutorId, 'claude-reviewer');
  assert.equal(result.divergence.placementExecutorId, 'codex-bwrap');
});
