// Phase 04 R5-R9 tests for coordination/session-engine.mjs's independent
// research fan-out/fan-in extension (dispatchResearchFanOut /
// synthesizeResearchFanIn), exercised against the real, already-shipped
// `core/coordination-protocols/independent-research-fan-out-fan-in.yaml`
// fixture (loaded through `loadCoordinationProtocol`, never faked/inlined).
//
// Same fake-executor pattern as coordination-declared-consult.test.mjs's
// own tests: a real Node subprocess, never a JS-level stub over
// executeAssignment/createSessionAssignment/createSessionAssignment's own
// concurrency checks.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  dispatchResearchFanOut,
  synthesizeResearchFanIn,
} from '../../src/runner/coordination/session-engine.mjs';
import { readManifest, readSessionEvents } from '../../src/runner/coordination/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

const DEFINITION_ID = 'core.coordination-protocol.independent-research-fan-out-fan-in';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-fanout-test-'));
}

/**
 * A minimal, real (never faked/JS-stubbed) 3-provider-family runner config:
 * three "agent"-kind executors, each a distinct providerModel family, each
 * spawning `process.execPath` against a real fake-executor script (the same
 * "real subprocess writes agent-report.md/agent-result.json into the run
 * dir executeExecutorCli created" shape every other test file in this
 * track uses). Every family configures BOTH `lightweight` and `standard`
 * (see the modelPolicies comment below for why `standard` matters even for
 * a `lightweight`-declared operation).
 */
// Default summary text must pass assignment-runner.mjs's
// isSubstantiveReportText() heuristic (rejects reports whose only words are
// generic/boilerplate, e.g. "OK"/"Report"/"Done") -- otherwise the real
// classifier settles at confidence:'no-evidence' instead of 'reported',
// unrelated to anything this cell's own fan-out logic controls.
function fakeCohortRunnerConfig(tempDir, { delayMs, status = 'done', summary = 'Research findings collected.' } = {}) {
  const executorScript = path.join(tempDir, `fake-cohort-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    function settle() {
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
    }
    ${delayMs ? `setTimeout(settle, ${delayMs});` : 'settle();'}
    `,
  );

  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    executors: {
      'exec-family-a': {
        kind: 'agent',
        providerModel: 'family-a',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [executorScript, '{prompt}'] }],
      },
      'exec-family-b': {
        kind: 'agent',
        providerModel: 'family-b',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [executorScript, '{prompt}'] }],
      },
      'exec-family-c': {
        kind: 'agent',
        providerModel: 'family-c',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [executorScript, '{prompt}'] }],
      },
    },
    // Every family configures BOTH lightweight and standard (a deliberate
    // divergence from the real .fgos/config.json, documented in this
    // cell's own report): resolveAssignmentDispatchPolicy's tier FLOOR
    // (assignment-policy.mjs's `opPolicy.minTier || 'standard'`) can only
    // ever be RAISED by a cliOverride, never lowered, because inline
    // Assignments (execution-contract.mjs's whitelist, assignment.mjs's
    // INLINE_ASSIGNMENT_PARAM_WHITELIST) have no `policy` field at all --
    // so EVERY real dispatch through session-engine.mjs's inline-contract
    // path resolves to AT LEAST 'standard', regardless of what tier an
    // operation/cliPolicy declares. These fan-out MECHANICS tests (R5-R7)
    // are not re-testing that tier-floor behavior (already real,
    // pre-existing, out of this cell's file ownership) -- they configure
    // 'standard' for every synthetic family so a real dispatch can settle
    // and the fan-out/isolation/evidence logic itself gets exercised. The
    // SAME constraint is why R8's real .fgos/config.json live proof cannot
    // reach a genuine second, non-claude provider family -- see this
    // cell's report.
    modelPolicies: {
      claude: { lightweight: 'test-model', standard: 'test-model' },
      'family-a': { lightweight: 'test-model', standard: 'test-model' },
      'family-b': { lightweight: 'test-model', standard: 'test-model' },
      'family-c': { lightweight: 'test-model', standard: 'test-model' },
    },
    timeoutMs: 5000,
  };
}

function openFanOutSession(coordinationId, tempDir, overrides = {}) {
  return openDeclaredProtocolSession(
    {
      definitionId: DEFINITION_ID,
      coordinationId,
      objective: 'Answer two independent, bounded research questions and synthesize accepted findings.',
      writerId: 'coordinator-1',
      ...overrides,
    },
    { cwd: tempDir },
  );
}

async function dispatchCoordinatorFanOut(coordinationId, tempDir, runnerConfig, overrides = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'dispatch-research',
      objective: 'Fan out two independent research questions.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
      ...overrides,
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
}

function twoBranches(fromAssignmentId, overrides = []) {
  return [
    {
      actorId: 'researcher-a',
      objective: 'Question A: what is the bounded evidence for claim A?',
      expectedOutputs: ['agent-result.json (status, summary)'],
      fromAssignmentId,
      ...(overrides[0] ?? {}),
    },
    {
      actorId: 'researcher-b',
      objective: 'Question B: what is the bounded evidence for claim B?',
      expectedOutputs: ['agent-result.json (status, summary)'],
      fromAssignmentId,
      ...(overrides[1] ?? {}),
    },
  ];
}

// ─── R5: independent fan-out ───────────────────────────────────────────────

test('R5: dispatchResearchFanOut materializes N branches as independent Assignments, records the intended actor set before ANY Assignment (actor-bound at session-open time), and appends one-way assignmentRefs for every branch', async () => {
  const tempDir = mkTempDir();
  const manifest = openFanOutSession('coord_fanout_r5_materialize', tempDir);
  // R5 "record the intended set before launch": every cohort actor is
  // already bound at session-open time, before any Assignment exists.
  assert.deepEqual(manifest.actors.map((a) => a.id).sort(), ['coordinator-actor', 'researcher-a', 'researcher-b']);
  assert.deepEqual(readManifest('coord_fanout_r5_materialize', { cwd: tempDir }).assignmentRefs, []);

  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r5_materialize', tempDir, runnerConfig);

  const result = await dispatchResearchFanOut(
    'coord_fanout_r5_materialize',
    { operationId: 'independent-research', branches: twoBranches(dispatch.assignment.assignmentId), writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );

  assert.equal(result.status, 'dispatched');
  assert.equal(result.branches.length, 2);
  assert.ok(result.branches.every((b) => b.status === 'fulfilled'));
  const branchAssignmentIds = result.branches.map((b) => b.result.assignment.assignmentId);
  assert.equal(new Set(branchAssignmentIds).size, 2, 'each branch gets its own distinct Assignment');

  const finalManifest = readManifest('coord_fanout_r5_materialize', { cwd: tempDir });
  assert.deepEqual(
    finalManifest.assignmentRefs.slice().sort(),
    [dispatch.assignment.assignmentId, ...branchAssignmentIds].sort(),
    'assignmentRefs is the one-way membership ledger for every branch, appended atomically',
  );

  // Each branch really resolved to its OWN named actor, not both silently
  // collapsing onto the first match (the resolveDeclaredOperationActor fix).
  assert.equal(result.branches.find((b) => b.actorId === 'researcher-a').result.assignment.role, 'researcher');
  const events = readSessionEvents('coord_fanout_r5_materialize', { cwd: tempDir });
  const createdActorIds = events.filter((e) => e.type === 'assignment-created').map((e) => e.payload.actorId);
  assert.deepEqual(createdActorIds.sort(), ['coordinator-actor', 'researcher-a', 'researcher-b'].sort());
});

test('R5: dispatchResearchFanOut allocates at least 2 distinct provider families across the researcher branches, using the SAME executor/tier the resolver re-confirms at real dispatch time', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r5_diversity', tempDir);
  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r5_diversity', tempDir, runnerConfig);

  const result = await dispatchResearchFanOut(
    'coord_fanout_r5_diversity',
    { operationId: 'independent-research', branches: twoBranches(dispatch.assignment.assignmentId), writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );

  assert.equal(result.status, 'dispatched');
  assert.equal(result.plan.diversity.satisfied, true);
  assert.ok(result.plan.diversity.achieved >= 2);

  // Diversity is an ALLOCATION-time property (planCohort's own output),
  // proven independently of real dispatch timing/outcome.
  const families = new Set(result.branches.map((b) => b.allocation.providerFamily));
  assert.ok(families.size >= 2, `expected >= 2 distinct provider families among researcher branches, got [${[...families].join(', ')}]`);

  // Real dispatch confirmation: this repo's own pre-existing main-checkout
  // dispatch lock (src/runner/main-checkout-lock.mjs, consumed
  // unconditionally by dispatch/cli.mjs's executeExecutorCli, tsk-64hk)
  // allows only ONE real out-of-process dispatch in flight per cwd at a
  // time -- concurrently DISPATCHED branches from the SAME cwd therefore
  // settle with at most one genuine subprocess success; every other branch
  // fails closed with an explicit RunResult (status/confidence: 'failed'),
  // never silently dropped, never a thrown rejection that aborts the whole
  // batch (see this cell's report for the full empirical trace). At least
  // ONE branch (deterministically the first dispatched, in-array-order,
  // since this runtime's synchronous call chain from
  // dispatchDeclaredOperation down to the lock acquire has no earlier
  // await point) must genuinely succeed and resolve to ITS OWN allocated
  // executor -- the resolver's OWN policy provenance confirms the
  // actually-resolved executor matches what the plan chose, never just
  // trusted from the plan alone.
  const succeeded = result.branches.filter((b) => b.result.runResult.status === 'done');
  assert.ok(succeeded.length >= 1, 'at least one branch genuinely dispatches and settles for real');
  for (const branch of succeeded) {
    assert.equal(branch.result.runResult.policy.provenance.executor.value, branch.allocation.executorId);
  }
  // Every branch that did NOT settle 'done' is explicit and honest -- a
  // real RunResult naming failure, never silently absent.
  for (const branch of result.branches) {
    if (branch.result.runResult.status !== 'done') {
      assert.equal(branch.result.runResult.status, 'failed');
      assert.equal(branch.result.runResult.confidence, 'failed');
    }
  }
});

test('R5: dispatchResearchFanOut rejects a definition declaring a topology edge between two named fan-out branch actors -- structural "no sibling edges" proof', async () => {
  const tempDir = mkTempDir();
  const projectDir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(
    path.join(projectDir, 'sibling-edge.yaml'),
    `
apiVersion: fgos.dev/v1alpha1
kind: FlowDefinition
metadata:
  id: test.coordination-protocol.sibling-edge-bad
  version: 1.0.0
spec:
  profile:
    kind: CoordinationProtocol
    topology:
      contextVisibility: isolated-until-fan-in
      edges:
        - from: researcher-a
          to: researcher-b
          intents: [leak]
    cohort:
      distinctProviderFamilies: 1
      independence: isolated-until-fan-in
  roles: [researcher]
  actors:
    - id: researcher-a
      role: researcher
    - id: researcher-b
      role: researcher
  operations:
    - id: independent-research
      role: researcher
      task:
        contractTemplate: x
      result:
        kind: advisory
        evidenceRequired: reported
  graph:
    entry: n1
    nodes:
      - id: n1
        operations:
          - ref: independent-research
            actor: researcher-a
          - ref: independent-research
            actor: researcher-b
        transitions: []
`,
  );

  openDeclaredProtocolSession(
    { definitionId: 'test.coordination-protocol.sibling-edge-bad', coordinationId: 'coord_fanout_r5_sibling', objective: 'Prove sibling edges are rejected.', writerId: 'coordinator-1' },
    { cwd: tempDir },
  );
  const runnerConfig = fakeCohortRunnerConfig(tempDir);

  await assert.rejects(
    dispatchResearchFanOut(
      'coord_fanout_r5_sibling',
      { operationId: 'independent-research', branches: twoBranches(undefined), writerId: 'coordinator-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /NO sibling edges/.test(err.message),
  );

  assert.deepEqual(readManifest('coord_fanout_r5_sibling', { cwd: tempDir }).assignmentRefs, [], 'zero Assignments launched when the sibling-edge check rejects the batch');
});

test('R5: dispatchResearchFanOut rejects duplicate/empty actorIds in branches before any Assignment is created', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r5_dupe', tempDir);
  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r5_dupe', tempDir, runnerConfig);

  await assert.rejects(
    dispatchResearchFanOut(
      'coord_fanout_r5_dupe',
      {
        operationId: 'independent-research',
        branches: [
          { actorId: 'researcher-a', objective: 'A', expectedOutputs: ['x'], fromAssignmentId: dispatch.assignment.assignmentId },
          { actorId: 'researcher-a', objective: 'A again', expectedOutputs: ['x'], fromAssignmentId: dispatch.assignment.assignmentId },
        ],
        writerId: 'coordinator-1',
      },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /distinct actorIds/.test(err.message),
  );
});

// ─── R4 (wired through the fan-out path for the first time): abort before dispatch ──

test('R4: dispatchResearchFanOut aborts the WHOLE batch, launching ZERO Assignments, when a planned allocation no longer re-resolves against the current runner config (executor deregistered between planning and the R4 re-verify, within the SAME call)', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r4_drift', tempDir);
  const stableConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r4_drift', tempDir, stableConfig);

  // Simulate a config that genuinely DRIFTS between planCohort's own reads
  // (buildCandidateInventory, called several times internally per
  // candidate) and verifyPlannedAllocationAgainstCurrentConfig's own LATER
  // re-resolution (resolveAssignmentDispatchPolicy) -- both happen INSIDE
  // the same dispatchResearchFanOut call, reading the SAME
  // `opts.runnerConfig` object reference. A getter keyed on WHICH call
  // frame is asking (via the real call stack, not a read counter -- a read
  // counter is too fragile: buildCandidateInventory alone reads
  // `.executors` many times per candidate) returns the FULL registry for
  // every planning-time read and a registry missing exec-family-b for
  // every verification-time read, reproducing a genuine "planned then
  // re-resolved differently" drift from OUTSIDE this function's own black
  // box, without touching cohort-planner.mjs itself.
  const fullExecutors = fakeCohortRunnerConfig(tempDir).executors;
  const driftingConfig = {
    ...stableConfig,
    get executors() {
      const stack = new Error().stack || '';
      if (stack.includes('resolveAssignmentDispatchPolicy') || stack.includes('verifyPlannedAllocationAgainstCurrentConfig')) {
        const { 'exec-family-b': _removed, ...rest } = fullExecutors;
        return rest;
      }
      return fullExecutors;
    },
  };

  const result = await dispatchResearchFanOut(
    'coord_fanout_r4_drift',
    { operationId: 'independent-research', branches: twoBranches(dispatch.assignment.assignmentId), writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: driftingConfig },
  );

  assert.equal(result.status, 'aborted');
  assert.match(result.reason, /aborting before spawn/);
  assert.deepEqual(readManifest('coord_fanout_r4_drift', { cwd: tempDir }).assignmentRefs, [dispatch.assignment.assignmentId], 'zero NEW Assignments beyond the coordinator dispatch that already existed -- the WHOLE batch aborts before even the first branch launches');
});

test('R4: dispatchResearchFanOut launches ZERO Assignments when planCohort itself cannot satisfy the declared role/diversity requirement (planning-failed)', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r4_impossible', tempDir);
  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r4_impossible', tempDir, runnerConfig);

  // Replace exec-family-b/exec-family-c with MORE family-a executors (so
  // there are enough distinct EXECUTORS for all 3 actors -- the shortfall
  // is genuinely a DIVERSITY failure, never merely running out of
  // executors to allocate): distinctProviderFamilies: 2 can no longer be
  // satisfied when every registered executor resolves to the SAME
  // provider family, and this fixture declares no fallback rule.
  delete runnerConfig.executors['exec-family-b'];
  delete runnerConfig.executors['exec-family-c'];
  runnerConfig.executors['exec-family-a-2'] = { ...runnerConfig.executors['exec-family-a'] };
  runnerConfig.executors['exec-family-a-3'] = { ...runnerConfig.executors['exec-family-a'] };

  const result = await dispatchResearchFanOut(
    'coord_fanout_r4_impossible',
    { operationId: 'independent-research', branches: twoBranches(dispatch.assignment.assignmentId), writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );

  assert.equal(result.status, 'planning-failed');
  assert.equal(result.plan.status, 'hard-failed');
  assert.equal(result.plan.failure.field, 'diversity');
  assert.deepEqual(readManifest('coord_fanout_r4_impossible', { cwd: tempDir }).assignmentRefs, [dispatch.assignment.assignmentId], 'zero NEW Assignments beyond the coordinator dispatch that already existed');
});

// ─── R5 concurrency: real overlapping fake executors, session cap enforced ──

test('R5 concurrency: dispatchResearchFanOut fanning out to 2 branches CONCURRENTLY, with aggregateBounds.maxConcurrency: 1, genuinely launches only 1 -- the second is REJECTED (not queued/retried) by the SAME lock-held cap createSessionAssignment already enforces', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r5_cap', tempDir, { aggregateBounds: { maxConcurrency: 1 } });
  const runnerConfig = fakeCohortRunnerConfig(tempDir, { delayMs: 400 });
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r5_cap', tempDir, runnerConfig);

  const start = Date.now();
  const result = await dispatchResearchFanOut(
    'coord_fanout_r5_cap',
    { operationId: 'independent-research', branches: twoBranches(dispatch.assignment.assignmentId), writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
  const elapsedMs = Date.now() - start;

  const fulfilled = result.branches.filter((b) => b.status === 'fulfilled');
  const rejected = result.branches.filter((b) => b.status === 'rejected');
  assert.equal(fulfilled.length, 1, 'exactly one branch launches under maxConcurrency: 1');
  assert.equal(rejected.length, 1, 'the other branch is rejected, never silently queued or duplicated');
  assert.match(rejected[0].error, /maxConcurrency/);
  // The rejection is near-instant (well under the in-flight executor's own
  // 400ms delay's own order of magnitude, generously bounded for a loaded
  // CI machine, never anywhere close to a "wait it out" shape) -- proves it
  // is a genuine hard reject at dispatch time, not a delayed/serialized
  // retry.
  assert.ok(elapsedMs < 400 * 3, `expected the rejected branch not to wait out the in-flight executor's delay (elapsed ${elapsedMs}ms)`);

  const manifest = readManifest('coord_fanout_r5_cap', { cwd: tempDir });
  assert.equal(manifest.assignmentRefs.length, 2, 'coordinator dispatch + exactly the ONE successfully launched branch');
});

test('R5 concurrency: with aggregateBounds.maxConcurrency: 2 (no tighter than branch count), BOTH branches are genuinely DISPATCHED concurrently at the session level (no session-cap rejection for either) -- this repo\'s own pre-existing per-cwd main-checkout dispatch lock (tsk-64hk) then allows only ONE real subprocess success, and the other settles with an EXPLICIT failed RunResult, never silently dropped or duplicated', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r5_cap2', tempDir, { aggregateBounds: { maxConcurrency: 2 } });
  const runnerConfig = fakeCohortRunnerConfig(tempDir, { delayMs: 300 });
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r5_cap2', tempDir, runnerConfig);

  const start = Date.now();
  const result = await dispatchResearchFanOut(
    'coord_fanout_r5_cap2',
    { operationId: 'independent-research', branches: twoBranches(dispatch.assignment.assignmentId), writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
  const elapsedMs = Date.now() - start;

  // BOTH branches were genuinely ADMITTED for dispatch by the session-level
  // cap (maxConcurrency: 2 >= 2 branches) -- neither is rejected by
  // createSessionAssignment's own lock-held check; both become real
  // session members with their own Assignment.
  assert.ok(result.branches.every((b) => b.status === 'fulfilled'), 'both branches are admitted for dispatch under a session cap wide enough for both');
  const manifest = readManifest('coord_fanout_r5_cap2', { cwd: tempDir });
  assert.equal(manifest.assignmentRefs.length, 3, 'coordinator dispatch + both researcher branches are real session members');

  // Real subprocess execution then hits this repo's OWN pre-existing
  // per-cwd main-checkout dispatch lock (main-checkout-lock.mjs, consumed
  // unconditionally by dispatch/cli.mjs's executeExecutorCli for EVERY
  // out-of-process dispatch, tsk-64hk "per-item dispatch concurrency
  // protection") -- held for a real dispatch's full subprocess duration,
  // so only ONE of the two concurrently-attempted branches can genuinely
  // settle 'done'; the other fails closed with an HONEST, explicit
  // RunResult (status/confidence: 'failed', agentClaim.summary naming
  // "already in flight") rather than hanging, silently retrying, or being
  // dropped from the result set.
  const settled = result.branches.map((b) => b.result.runResult.status);
  assert.equal(settled.filter((s) => s === 'done').length, 1, 'exactly one branch genuinely completes a real subprocess dispatch');
  assert.equal(settled.filter((s) => s === 'failed').length, 1, 'the other branch fails closed, explicitly, never silently');
  const loser = result.branches.find((b) => b.result.runResult.status === 'failed');
  assert.match(loser.result.runResult.agentClaim?.summary ?? '', /already in flight/);

  // Both branches were genuinely LAUNCHED close together (concurrent
  // DISPATCH ATTEMPT, not a serialized "wait for the first to fully
  // finish before even trying the second") -- the loser fails well within
  // the SAME order of magnitude as the winner's own 300ms delay (generously
  // bounded for a loaded CI machine), never anywhere close to a "wait it
  // out and retry" shape, so total elapsed stays close to a single delay
  // window rather than roughly doubling.
  assert.ok(elapsedMs < 300 * 3, `expected the losing branch to fail fast rather than wait/retry (elapsed ${elapsedMs}ms)`);
});

// ─── R6: context isolation before fan-in ───────────────────────────────────

test('R6: sentinel proof -- neither branch\'s persisted Assignment contextRefs/contract ever references the OTHER branch\'s sentinel or Assignment id', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r6_sentinel', tempDir);
  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r6_sentinel', tempDir, runnerConfig);

  const sentinelA = `sentinel-a-${Math.random().toString(36).slice(2)}-do-not-leak`;
  const sentinelB = `sentinel-b-${Math.random().toString(36).slice(2)}-do-not-leak`;

  const result = await dispatchResearchFanOut(
    'coord_fanout_r6_sentinel',
    {
      operationId: 'independent-research',
      branches: twoBranches(dispatch.assignment.assignmentId, [{ objective: `Question A. ${sentinelA}`, constraints: [sentinelA] }, { objective: `Question B. ${sentinelB}`, constraints: [sentinelB] }]),
      writerId: 'coordinator-1',
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );

  const branchA = result.branches.find((b) => b.actorId === 'researcher-a').result;
  const branchB = result.branches.find((b) => b.actorId === 'researcher-b').result;

  assert.deepEqual(branchA.assignment.contextRefs, [dispatch.assignment.assignmentId]);
  assert.deepEqual(branchB.assignment.contextRefs, [dispatch.assignment.assignmentId]);
  assert.ok(!branchA.assignment.contextRefs.includes(branchB.assignment.assignmentId));
  assert.ok(!branchB.assignment.contextRefs.includes(branchA.assignment.assignmentId));

  const onDiskA = fs.readFileSync(path.join(tempDir, '.fgos', 'assignments', branchA.assignment.assignmentId, 'assignment.json'), 'utf8');
  const onDiskB = fs.readFileSync(path.join(tempDir, '.fgos', 'assignments', branchB.assignment.assignmentId, 'assignment.json'), 'utf8');
  assert.ok(!onDiskA.includes(sentinelB), 'branch A must never carry branch B\'s sentinel');
  assert.ok(!onDiskB.includes(sentinelA), 'branch B must never carry branch A\'s sentinel');
  assert.ok(onDiskA.includes(sentinelA) && onDiskB.includes(sentinelB), 'sanity: each branch DOES carry its own sentinel');
});

test('R6: synthesizeResearchFanIn independently re-verifies isolation from disk and rejects a branch whose persisted contextRefs references a sibling branch Assignment', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r6_reverify', tempDir);
  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r6_reverify', tempDir, runnerConfig);

  const result = await dispatchResearchFanOut(
    'coord_fanout_r6_reverify',
    { operationId: 'independent-research', branches: twoBranches(dispatch.assignment.assignmentId), writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
  const branchA = result.branches.find((b) => b.actorId === 'researcher-a').result;
  const branchB = result.branches.find((b) => b.actorId === 'researcher-b').result;

  // Directly corrupt branch A's persisted contract to reference branch B's
  // Assignment -- simulates a sibling-leakage bug this function must catch
  // independently, not merely trust from dispatch-time construction.
  const assignmentJsonPath = path.join(tempDir, '.fgos', 'assignments', branchA.assignment.assignmentId, 'assignment.json');
  const parsed = JSON.parse(fs.readFileSync(assignmentJsonPath, 'utf8'));
  parsed.provenance.inline.contract.contextRefs = [dispatch.assignment.assignmentId, branchB.assignment.assignmentId];
  fs.writeFileSync(assignmentJsonPath, JSON.stringify(parsed, null, 2));

  assert.throws(
    () => synthesizeResearchFanIn('coord_fanout_r6_reverify', { branchActorIds: ['researcher-a', 'researcher-b'] }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /sibling visibility before fan-in is rejected/.test(err.message),
  );
});

// ─── R7: evidence, missing/failed branches, contradiction pass-through ─────

function writeFakeRunResult({ tempDir, assignmentId, runId = '01', confidence, status = 'done' }) {
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'result.json'),
    JSON.stringify({ runId: `run_${assignmentId}_${runId}`, assignmentId, status, confidence, summary: 'x' }, null, 2),
  );
}

/**
 * Dispatch the two standard research branches SEQUENTIALLY (one full
 * dispatchResearchFanOut call per branch, fully awaited before the next
 * starts) rather than in the same concurrent batch. R7's own tests are
 * about evidence-CLASSIFICATION logic, not concurrency (R5 already proves
 * concurrency separately) -- dispatching sequentially here sidesteps this
 * repo's own pre-existing per-cwd main-checkout dispatch lock (tsk-64hk,
 * see the R5 concurrency tests above), which allows only ONE real
 * subprocess in flight per cwd and would otherwise make the SECOND of two
 * concurrently-dispatched branches settle 'failed' regardless of this
 * cell's own logic -- an accurate, important behavior for R5, but noise
 * for R7's own evidence-handling assertions.
 */
async function dispatchTwoBranchesSequentially(coordinationId, tempDir, runnerConfig, fromAssignmentId) {
  const [branchAParams, branchBParams] = twoBranches(fromAssignmentId);
  const resultA = await dispatchResearchFanOut(
    coordinationId,
    { operationId: 'independent-research', branches: [branchAParams], writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
  const resultB = await dispatchResearchFanOut(
    coordinationId,
    { operationId: 'independent-research', branches: [branchBParams], writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
  return { status: 'dispatched', branches: [...resultA.branches, ...resultB.branches] };
}

test('R7: synthesizeResearchFanIn NEVER promotes a "reported"-confidence branch into accepted -- evidence-laundering negative test', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r7_laundering', tempDir);
  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r7_laundering', tempDir, runnerConfig);
  const result = await dispatchTwoBranchesSequentially('coord_fanout_r7_laundering', tempDir, runnerConfig, dispatch.assignment.assignmentId);

  // The REAL classifier already produced 'reported' (read-only ops can
  // never classify 'verified' -- see session-engine.mjs's doc comment on
  // synthesizeResearchFanIn); assert that starting condition directly.
  for (const branch of result.branches) {
    assert.equal(branch.result.runResult.confidence, 'reported');
  }

  const synthesis = synthesizeResearchFanIn('coord_fanout_r7_laundering', { branchActorIds: ['researcher-a', 'researcher-b'] }, { cwd: tempDir });
  assert.equal(synthesis.status, 'synthesized');
  assert.equal(synthesis.accepted.length, 0, 'nothing is accepted as verified material fact');
  assert.equal(synthesis.unverified.length, 2, 'both branches are recorded, explicitly, as unverified -- never silently dropped');
  assert.ok(!/consensus/i.test(synthesis.explanation) || /no accepted/.test(synthesis.explanation));
});

test('R7: synthesizeResearchFanIn accepts a genuinely "verified"-confidence branch (white-box: injected result.json), while a sibling "reported" branch stays unverified -- proves the accept path is real, not vacuously always-empty', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r7_accept', tempDir);
  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r7_accept', tempDir, runnerConfig);
  const result = await dispatchTwoBranchesSequentially('coord_fanout_r7_accept', tempDir, runnerConfig, dispatch.assignment.assignmentId);
  const branchA = result.branches.find((b) => b.actorId === 'researcher-a').result;

  // Overwrite branch A's ALREADY-LINKED run result on disk with a
  // confidence:'verified' value (simulating a future path -- e.g. a
  // mutating verification step -- that CAN legitimately reach 'verified';
  // this white-box test proves synthesizeResearchFanIn's OWN accept logic
  // works when given one, independent of whether today's real read-only
  // classifier can produce it).
  const resultPath = path.join(tempDir, '.fgos', 'assignments', branchA.assignment.assignmentId, 'runs', '01', 'result.json');
  const parsed = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  parsed.confidence = 'verified';
  fs.writeFileSync(resultPath, JSON.stringify(parsed, null, 2));

  const synthesis = synthesizeResearchFanIn('coord_fanout_r7_accept', { branchActorIds: ['researcher-a', 'researcher-b'] }, { cwd: tempDir });
  assert.equal(synthesis.status, 'synthesized');
  assert.equal(synthesis.accepted.length, 1);
  assert.equal(synthesis.accepted[0].actorId, 'researcher-a');
  assert.equal(synthesis.unverified.length, 1);
  assert.equal(synthesis.unverified[0].actorId, 'researcher-b');
});

test('R7: synthesizeResearchFanIn returns "incomplete" (zero accepted) while a required branch has not settled, and never fabricates a result for it -- required-branch-omission negative test', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r7_missing', tempDir);
  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r7_missing', tempDir, runnerConfig);

  // Dispatch only ONE branch -- researcher-b never gets an Assignment at
  // all (the "no Assignment was ever created" missing case).
  await dispatchDeclaredOperation(
    'coord_fanout_r7_missing',
    { operationId: 'independent-research', targetActorId: 'researcher-a', objective: 'Question A', expectedOutputs: ['x'], writerId: 'coordinator-1', fromAssignmentId: dispatch.assignment.assignmentId, taskKey: 'research-branch:researcher-a' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );

  const synthesis = synthesizeResearchFanIn('coord_fanout_r7_missing', { branchActorIds: ['researcher-a', 'researcher-b'] }, { cwd: tempDir });
  assert.equal(synthesis.status, 'incomplete');
  assert.equal(synthesis.accepted.length, 0);
  assert.equal(synthesis.missing.length, 1);
  assert.equal(synthesis.missing[0].actorId, 'researcher-b');

  const partial = synthesizeResearchFanIn('coord_fanout_r7_missing', { branchActorIds: ['researcher-a', 'researcher-b'], partial: true }, { cwd: tempDir });
  assert.equal(partial.status, 'synthesized');
  assert.equal(partial.missing.length, 1);
  assert.match(partial.explanation, /partial policy/);
});

test('R7: synthesizeResearchFanIn NEVER erases a caller-declared contradiction and never reports consensus while one is unresolved -- contradiction-erasure negative test', async () => {
  const tempDir = mkTempDir();
  openFanOutSession('coord_fanout_r7_contradiction', tempDir);
  const runnerConfig = fakeCohortRunnerConfig(tempDir);
  const dispatch = await dispatchCoordinatorFanOut('coord_fanout_r7_contradiction', tempDir, runnerConfig);
  const result = await dispatchTwoBranchesSequentially('coord_fanout_r7_contradiction', tempDir, runnerConfig, dispatch.assignment.assignmentId);
  // Force BOTH branches to 'verified' (white-box) so the accepted bucket is
  // non-empty and the "no consensus despite N accepted" rule is genuinely
  // exercised, not vacuous.
  for (const branch of result.branches) {
    const resultPath = path.join(tempDir, '.fgos', 'assignments', branch.result.assignment.assignmentId, 'runs', '01', 'result.json');
    const parsed = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    parsed.confidence = 'verified';
    fs.writeFileSync(resultPath, JSON.stringify(parsed, null, 2));
  }

  const declaredContradiction = [{ branchActorIds: ['researcher-a', 'researcher-b'], reason: 'Branch A and B report mutually exclusive claims.' }];
  const synthesis = synthesizeResearchFanIn(
    'coord_fanout_r7_contradiction',
    { branchActorIds: ['researcher-a', 'researcher-b'], contradictions: declaredContradiction },
    { cwd: tempDir },
  );

  assert.equal(synthesis.status, 'synthesized');
  assert.equal(synthesis.accepted.length, 2);
  assert.deepEqual(synthesis.contradictions, declaredContradiction, 'the declared contradiction is passed through unchanged, never erased');
  assert.match(synthesis.explanation, /no consensus is reported/);
});
