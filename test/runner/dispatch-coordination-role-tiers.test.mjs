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
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';

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
    // missing "frontier" for the fail-closed test below.
    modelPolicies: {
      claude: {
        nano: 'test-model-nano',
        standard: 'test-model-standard',
        advanced: 'test-model-advanced',
        flagship: 'test-model-flagship',
        frontier: 'test-model-frontier',
      },
    },
    timeoutMs: 5000,
  };
}

// A runnerConfig whose "claude" provider table declares no "frontier" tier
// at all -- mirrors this repo's own real, committed `.fgos/config.json`
// "z-ai" provider entry (genuinely partial coverage, `nano` only),
// used here to prove a missing-frontier-tier scenario fails closed rather
// than silently resolving a weaker model.
function fakeExecutorMissingFrontierTier(tempDir) {
  const cfg = fakeExecutor(tempDir);
  const { frontier, ...restTiers } = cfg.modelPolicies.claude;
  return { ...cfg, modelPolicies: { claude: restTiers } };
}

function argvRecordingExecutor(tempDir, label) {
  const scriptPath = path.join(tempDir, `${label}-coord-executor.mjs`);
  const argvCapturePath = path.join(tempDir, `${label}-argv.json`);
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    fs.writeFileSync(${JSON.stringify(argvCapturePath)}, JSON.stringify(process.argv.slice(2)));
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n${label} completed.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: '${label} done' }));
          }
        }
      }
    }
    process.exit(0);
    `,
  );
  return { scriptPath, argvCapturePath };
}

function fakeCrossProviderRedirectConfig(tempDir) {
  const claude = argvRecordingExecutor(tempDir, 'claude');
  const reviewer = argvRecordingExecutor(tempDir, 'claude-reviewer');
  const codex = argvRecordingExecutor(tempDir, 'codex-bwrap');
  return {
    captures: { claude, reviewer, codex },
    runnerConfig: {
      placementPolicy: {
        readOnlyRedirects: {
          claude: {
            default: [{ executor: 'codex-bwrap', crossProvider: true }],
            operations: {
              'red-team-candidate': [{ executor: 'codex-bwrap', crossProvider: true }],
            },
          },
        },
      },
      executors: {
        claude: {
          command: process.execPath,
          args: [claude.scriptPath, '{prompt}', '--model', '{model}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
          allowCrossProvider: true,
        },
        'claude-reviewer': {
          command: process.execPath,
          args: [reviewer.scriptPath, '{prompt}', '--model', '{model}'],
          allowCrossProvider: true,
        },
        'codex-bwrap': {
          command: process.execPath,
          args: [codex.scriptPath, '{prompt}', '--model', '{model}'],
          providerModel: 'openai-codex',
          allowCrossProvider: true,
        },
      },
      modelPolicies: {
        claude: {
          nano: 'haiku',
          standard: 'sonnet',
          advanced: 'sonnet',
          flagship: 'opus',
          frontier: 'opus',
        },
        'openai-codex': {
          nano: 'gpt-test-nano',
          standard: 'gpt-test-standard',
          advanced: 'gpt-test-standard',
          flagship: 'gpt-test-flagship',
          frontier: 'gpt-test-frontier',
        },
      },
      timeoutMs: 5000,
    },
  };
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

test('R8: produce-candidate (Doer) resolves the fixture-declared "standard" minTier through a real dispatch, not "flagship"/"frontier"', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_role_tiers_doer', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  const { runResult } = await dispatchProduce('coord_role_tiers_doer', tempDir, runnerConfig);

  assert.equal(runResult.policy.tier, 'standard');
  assert.equal(runResult.policy.model, 'test-model-standard');
});

test('R8: review-candidate and red-team-candidate (Reviewer/Red-Team) resolve the fixture-declared "flagship" minTier through a real dispatch', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_role_tiers_first_pass', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  const produce = await dispatchProduce('coord_role_tiers_first_pass', tempDir, runnerConfig);
  const review = await dispatchFirstPass('coord_role_tiers_first_pass', tempDir, runnerConfig, 'review-candidate', produce.assignment.assignmentId);
  const redTeam = await dispatchFirstPass('coord_role_tiers_first_pass', tempDir, runnerConfig, 'red-team-candidate', produce.assignment.assignmentId);

  assert.equal(review.runResult.policy.tier, 'flagship');
  assert.equal(review.runResult.policy.model, 'test-model-flagship');
  assert.equal(redTeam.runResult.policy.tier, 'flagship');
  assert.equal(redTeam.runResult.policy.model, 'test-model-flagship');

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

test('read-only red-team-candidate pinned to claude can redirect to codex-bwrap with a provider-correct model', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_role_tiers_redteam_redirect', tempDir);
  const { runnerConfig, captures } = fakeCrossProviderRedirectConfig(tempDir);

  const produce = await dispatchProduce('coord_role_tiers_redteam_redirect', tempDir, runnerConfig);
  const redTeam = await dispatchFirstPass(
    'coord_role_tiers_redteam_redirect',
    tempDir,
    runnerConfig,
    'red-team-candidate',
    produce.assignment.assignmentId,
    { assignmentPolicy: { preferExecutor: 'claude' } },
  );

  assert.equal(redTeam.assignment.mutation, 'read-only');
  assert.equal(redTeam.runResult.executorId, 'codex-bwrap');
  assert.equal(redTeam.runResult.executorRedirected, true);
  assert.equal(redTeam.runResult.policy.executorPreference[0], 'claude');
  assert.equal(redTeam.runResult.policy.providerModel, 'openai-codex');
  assert.equal(redTeam.runResult.policy.model, 'gpt-test-flagship');
  assert.equal(fs.existsSync(captures.reviewer.argvCapturePath), false, 'red-team override must not fall through to claude-reviewer');

  const codexArgs = JSON.parse(fs.readFileSync(captures.codex.argvCapturePath, 'utf8'));
  assert.ok(codexArgs.includes('gpt-test-flagship'), 'red-team argv must use the target provider model');
  assert.ok(!codexArgs.includes('opus'), 'Claude model literals must not leak into the redirected red-team executor');
});

test('R8: Red-Team escalation to "frontier" for a named high-risk round resolves via a caller-supplied assignment-scope PolicyPatch, raising above the fixture\'s own "flagship" floor', async () => {
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
    // fixture itself stays at "flagship" for every other round.
    { assignmentPolicy: { minTier: 'frontier' } },
  );

  assert.equal(redTeam.runResult.policy.tier, 'frontier');
  assert.equal(redTeam.runResult.policy.model, 'test-model-frontier');
});

test('R8: a missing frontier-tier provider fails closed (RunnerConfigError) rather than silently resolving a weaker model, and records no completed Assignment', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_role_tiers_fail_closed', tempDir);
  const runnerConfig = fakeExecutorMissingFrontierTier(tempDir);

  const produce = await dispatchProduce('coord_role_tiers_fail_closed', tempDir, runnerConfig);

  await assert.rejects(
    dispatchFirstPass(
      'coord_role_tiers_fail_closed',
      tempDir,
      runnerConfig,
      'red-team-candidate',
      produce.assignment.assignmentId,
      { assignmentPolicy: { minTier: 'frontier' } },
    ),
    (err) => err instanceof RunnerConfigError && /no model configured for policy tier "frontier"/.test(err.message),
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
  assert.equal(redTeamRuns.length, 0, 'a fail-closed missing-frontier-tier dispatch must never produce a settled run');
});

// ─── model-tier-vocabulary-and-coordination-fallback (2026-09-17): ────────
// actors[].fallbackExecutors plumbing ───────────────────────────────────────
//
// The retry-on-failure mechanism itself (Provider Capacity Rotator,
// attemptProviderCapacityFallback) is already proven end to end by
// assignment-dispatch.test.mjs's own "Phase B" battery. What is proven HERE
// is the one thing that was missing before this change: that a REQUEST-level
// actors[].fallbackExecutors override (the shape a coordination request
// like fgos-code-panel's own actually declares) genuinely reaches
// resolveAssignmentDispatchPolicy's executorPreference -- through
// runCoordinationUseCase's real actorPolicyFields plumbing (run.mjs), not a
// hand-built cliOverride. Triggering a REAL provider-capacity refusal here
// would need a live ~/.fgos/runtime/provider-capacity account/quarantine
// fixture that runCoordinationUseCase has no way to redirect to an isolated
// test directory (a separate, pre-existing gap, not this test's concern) --
// so this proves the wire via the SAME executorPreference array
// resolveAssignmentDispatchPolicy always computes up front, unconditionally,
// regardless of whether the primary ever actually fails
// (assignment-policy.test.mjs's own "narrow executor preference" test
// asserts the identical shape for opPolicy.fallbackExecutors).
test('R8/Phase 2: a request-level actors[].fallbackExecutors override reaches resolveAssignmentDispatchPolicy\'s executorPreference through runCoordinationUseCase (not just dispatchDeclaredOperation\'s own cliPolicy param)', async () => {
  const tempDir = mkTempDir();
  // Deliberately NOT fakeCrossProviderRedirectConfig -- its
  // placementPolicy.readOnlyRedirects.claude.default fires for EVERY
  // read-only operation on claude (every declared-protocol dispatch is
  // read-only-mode, regardless of result.kind -- runExecutorAttempt always
  // passes isReadOnlyMode: true), which would make codex spawn via the
  // UNRELATED redirect mechanism and contaminate this test's proof that
  // fallbackExecutors alone drives executorPreference.
  const claude = argvRecordingExecutor(tempDir, 'claude-fallback-plumbing-primary');
  const codex = argvRecordingExecutor(tempDir, 'claude-fallback-plumbing-candidate');
  const runnerConfig = {
    executors: {
      claude: { command: process.execPath, args: [claude.scriptPath, '{prompt}', '--model', '{model}'], allowCrossProvider: true },
      'codex-bwrap': { command: process.execPath, args: [codex.scriptPath, '{prompt}', '--model', '{model}'], providerModel: 'openai-codex', allowCrossProvider: true },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, 'openai-codex': { standard: 'gpt-test-standard' } },
    timeoutMs: 5000,
  };
  const captures = { codex };

  const data = await runCoordinationUseCase(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    {
      requestObject: {
        kind: 'declared-protocol',
        objective: 'Prove actors[].fallbackExecutors reaches executorPreference.',
        writerId: 'coordinator-fallback-plumbing',
        protocolRef: { id: DEFINITION_ID },
        actors: [{ id: 'doer', executor: 'claude', fallbackExecutors: ['codex-bwrap'] }],
        steps: [
          {
            type: 'operation',
            as: 'produce',
            operationId: 'produce-candidate',
            targetActorId: 'doer',
            objective: 'Produce a candidate.',
            expectedOutputs: ['agent-result.json (status, summary)'],
          },
        ],
      },
    },
  );

  const produce = data.steps.find((step) => step.as === 'produce');
  assert.equal(produce.executor, 'claude', 'the primary executor actually dispatched -- no refusal, no substitution');
  assert.equal(fs.existsSync(captures.codex.argvCapturePath), false, 'the undeclared-failure case must never spawn the fallback');

  const dispatchPlanPath = path.join(tempDir, '.fgos', 'assignments', produce.assignmentId, 'runs', '01', 'dispatch-plan.json');
  const dispatchPlan = JSON.parse(fs.readFileSync(dispatchPlanPath, 'utf8'));
  assert.deepEqual(
    dispatchPlan.policy.executorPreference,
    ['claude', 'codex-bwrap'],
    'actors[].fallbackExecutors must compose into executorPreference exactly like opPolicy.fallbackExecutors already does -- the new plumbing this change adds, not a new mechanism',
  );
});
