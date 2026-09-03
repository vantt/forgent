// Phase 03 (Step 09 P03.1) R8: a REAL dispatch proof (not a config read)
// that standalone-master-coordination-loop.yaml's own `policy.minTier` per
// role operation actually changes what `dispatchDeclaredOperation`
// resolves at dispatch time -- exercised through the real, shipped fixture
// (loaded via `loadCoordinationProtocol`, never a hand-typed copy) and the
// real `resolveAssignmentDispatchPolicy` resolver, same fake-executor
// pattern as coordination-declared-consult.test.mjs (a real Node
// subprocess, never a JS-level stub over executeAssignment).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
} from '../../src/runner/coordination/session-engine.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

const DEFINITION_ID = 'core.coordination-protocol.standalone-master-coordination-loop';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-role-tiers-test-'));
}

// Same shape as coordination-declared-consult.test.mjs's own fakeExecutor():
// a real subprocess that writes agent-report.md/agent-result.json into
// whichever run dir the real executeExecutorCli path created.
function fakeExecutor(tempDir, { status = 'done', summary = 'Validated.' } = {}) {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n${summary}\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: '${status}', summary: '${summary}' }));
          }
        }
      }
    }
    process.stdout.write('${summary}\\n');
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    // A distinct model string per policy tier (never coincidentally equal)
    // so a resolved `runResult.policy.model` unambiguously proves WHICH
    // tier actually won, the same real `modelPolicies` shape this repo's
    // own committed .fgos/config.json uses (tsk-5tm-5 D9) -- deliberately
    // missing "critical" for the fail-closed test below.
    modelPolicies: {
      claude: {
        lightweight: 'test-model-lightweight',
        standard: 'test-model-standard',
        creative: 'test-model-creative',
        analytical: 'test-model-analytical',
        critical: 'test-model-critical',
      },
    },
    timeoutMs: 5000,
  };
}

// A runnerConfig whose "claude" provider table declares no "critical" tier
// at all -- mirrors this repo's own real, committed `.fgos/config.json`
// "z-ai" provider entry (genuinely partial coverage, `lightweight` only),
// used here to prove a missing-critical-tier scenario fails closed rather
// than silently resolving a weaker model.
function fakeExecutorMissingCriticalTier(tempDir) {
  const cfg = fakeExecutor(tempDir);
  const { critical, ...restTiers } = cfg.modelPolicies.claude;
  return { ...cfg, modelPolicies: { claude: restTiers } };
}

function openSessionWithConfig(coordinationId, tempDir, overrides = {}) {
  return openDeclaredProtocolSession(
    {
      definitionId: DEFINITION_ID,
      coordinationId,
      objective: 'Prove role-tier separation resolves through the real dispatch path.',
      writerId: 'coordinator-1',
      ...overrides,
    },
    { cwd: tempDir },
  );
}

async function dispatchProduce(coordinationId, tempDir, runnerConfig, overrides = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'produce-candidate',
      targetActorId: 'doer',
      objective: 'Produce a candidate.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
      ...overrides,
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
}

async function dispatchFirstPass(coordinationId, tempDir, runnerConfig, operationId, fromAssignmentId, overrides = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId,
      objective: `Assess the candidate (${operationId}).`,
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
      fromAssignmentId,
      ...overrides,
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
}

// ─── R2-R6: role-tier separation actually resolves through real dispatch ──

test('R8: produce-candidate (Doer) resolves the fixture-declared "standard" minTier through a real dispatch, not "analytical"/"critical"', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_role_tiers_doer', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  const { runResult } = await dispatchProduce('coord_role_tiers_doer', tempDir, runnerConfig);

  assert.equal(runResult.policy.tier, 'standard');
  assert.equal(runResult.policy.model, 'test-model-standard');
});

test('R8: review-candidate and red-team-candidate (Reviewer/Red-Team) resolve the fixture-declared "analytical" minTier through a real dispatch', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_role_tiers_first_pass', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  const produce = await dispatchProduce('coord_role_tiers_first_pass', tempDir, runnerConfig);
  const review = await dispatchFirstPass('coord_role_tiers_first_pass', tempDir, runnerConfig, 'review-candidate', produce.assignment.assignmentId);
  const redTeam = await dispatchFirstPass('coord_role_tiers_first_pass', tempDir, runnerConfig, 'red-team-candidate', produce.assignment.assignmentId);

  assert.equal(review.runResult.policy.tier, 'analytical');
  assert.equal(review.runResult.policy.model, 'test-model-analytical');
  assert.equal(redTeam.runResult.policy.tier, 'analytical');
  assert.equal(redTeam.runResult.policy.model, 'test-model-analytical');

  // Reviewer/Red-Team/Recheck "prefer a read-only-capable executor" (R5) is
  // already structurally satisfied at the session-engine layer, for every
  // role in this fixture, not only these two -- `runExecutorAttempt`
  // (session-engine.mjs) unconditionally passes `isReadOnlyMode: true` for
  // every declared-operation dispatch, and `buildReadOnlyContract` always
  // stamps `mutation: 'read-only'` -- proven here via the persisted
  // contract rather than re-asserted as a new behavior this phase adds.
  assert.equal(review.assignment.mutation, 'read-only');
  assert.equal(redTeam.assignment.mutation, 'read-only');
});

test('R8: Red-Team escalation to "critical" for a named high-risk round resolves via a caller-supplied assignment-scope PolicyPatch, raising above the fixture\'s own "analytical" floor', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_role_tiers_escalation', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  const produce = await dispatchProduce('coord_role_tiers_escalation', tempDir, runnerConfig);
  const redTeam = await dispatchFirstPass(
    'coord_role_tiers_escalation',
    tempDir,
    runnerConfig,
    'red-team-candidate',
    produce.assignment.assignmentId,
    // The coordinator's own per-round judgment call (R4/R6): this round
    // touches a named high-risk category (e.g. a concurrency/dispatch-
    // resolution invariant), so it escalates THIS dispatch only -- the
    // fixture itself stays at "analytical" for every other round.
    { assignmentPolicy: { minTier: 'critical' } },
  );

  assert.equal(redTeam.runResult.policy.tier, 'critical');
  assert.equal(redTeam.runResult.policy.model, 'test-model-critical');
});

test('R8: a missing critical-tier provider fails closed (RunnerConfigError) rather than silently resolving a weaker model, and records no completed Assignment', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_role_tiers_fail_closed', tempDir);
  const runnerConfig = fakeExecutorMissingCriticalTier(tempDir);

  const produce = await dispatchProduce('coord_role_tiers_fail_closed', tempDir, runnerConfig);

  await assert.rejects(
    dispatchFirstPass(
      'coord_role_tiers_fail_closed',
      tempDir,
      runnerConfig,
      'red-team-candidate',
      produce.assignment.assignmentId,
      { assignmentPolicy: { minTier: 'critical' } },
    ),
    (err) => err instanceof RunnerConfigError && /no model configured for policy tier "critical"/.test(err.message),
  );

  // Fail-closed, not silently downgraded: no result.json exists for the
  // rejected red-team-candidate Assignment (a downgrade would have let it
  // settle with a weaker model instead of never spawning at all).
  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  const redTeamRuns = fs
    .readdirSync(assignmentsDir)
    .filter((id) => id !== produce.assignment.assignmentId)
    .flatMap((id) => {
      const runsDir = path.join(assignmentsDir, id, 'runs');
      return fs.existsSync(runsDir) ? fs.readdirSync(runsDir) : [];
    });
  assert.equal(redTeamRuns.length, 0, 'a fail-closed missing-critical-tier dispatch must never produce a settled run');
});
