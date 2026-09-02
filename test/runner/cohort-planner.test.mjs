// Phase 04 (P04.1) Cohort Planner V1 -- R1-R4 behavior tests, per
// phase-04-research-cohort-planner.md's own "Tests First" list (the R1-R4
// subset). R5-R9 (fan-out execution, isolation/fan-in, evidence handling,
// live proofs) are explicitly out of scope for this cell -- not tested
// here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

import {
  CohortPlanningError,
  buildCandidateInventory,
  matchCandidateToRequirement,
  planCohort,
  verifyPlannedAllocationAgainstCurrentConfig,
} from '../../src/runner/coordination/cohort-planner.mjs';
import { validateFlowDefinition } from '../../src/runner/definitions/schema.mjs';
import { resolveExecutorConfig } from '../../src/runner/dispatch/resolve.mjs';

// ─── Fixtures ───────────────────────────────────────────────────────────

/** Two agent-kind executors, same providerModel table, minimal shape --
 * used across most synthetic tests so each test only varies the ONE
 * dimension it means to exercise. */
function baseRunnerConfig(overrides = {}) {
  return {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      'exec-claude-a': {
        kind: 'agent',
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['{prompt}'] }],
      },
      'exec-claude-b': {
        kind: 'agent',
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['{prompt}'] }],
      },
      'exec-gemini-a': {
        kind: 'agent',
        providerModel: 'gemini',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy', args: ['{prompt}'] }],
      },
      'exec-tool-a': {
        kind: 'tool',
        for: ['impact-analysis'],
        invocations: [{ via: 'mcp', command: 'mcp:tool-a' }],
      },
    },
    modelPolicies: {
      claude: { lightweight: 'haiku', standard: 'sonnet', creative: 'sonnet', analytical: 'sonnet', critical: 'opus' },
      gemini: { lightweight: 'gemini-flash' },
    },
    timeoutMs: 900000,
    ...overrides,
  };
}

function twoActorDefinition({ minTier = 'lightweight', distinctProviderFamilies = 2, requiredCapabilities, actorPolicy } = {}) {
  const raw = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'test.cohort-planner.two-actor', version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        cohort: { count: 2, distinctProviderFamilies, requiredRoles: ['researcher'], independence: 'isolated-until-fan-in' },
      },
      graph: {
        entry: 'n1',
        nodes: [
          {
            id: 'n1',
            operations: [
              { ref: 'op-alpha', actor: 'alpha' },
              { ref: 'op-beta', actor: 'beta' },
            ],
            transitions: [],
          },
        ],
      },
      roles: ['researcher'],
      actors: [
        { id: 'alpha', role: 'researcher', ...(actorPolicy ? { policy: actorPolicy } : {}) },
        { id: 'beta', role: 'researcher' },
      ],
      operations: [
        {
          id: 'op-alpha',
          role: 'researcher',
          policy: { minTier },
          ...(requiredCapabilities ? { capabilities: requiredCapabilities } : {}),
        },
        { id: 'op-beta', role: 'researcher', policy: { minTier } },
      ],
    },
  };
  return validateFlowDefinition(raw);
}

// ─── R1/R2: stable allocation under permuted object insertion order ──────

test('buildCandidateInventory produces identical output regardless of runnerConfig.executors insertion order', () => {
  const cfg = baseRunnerConfig();
  const executorsInOrderA = cfg.executors;
  const executorsInOrderB = {
    'exec-tool-a': executorsInOrderA['exec-tool-a'],
    'exec-gemini-a': executorsInOrderA['exec-gemini-a'],
    'exec-claude-b': executorsInOrderA['exec-claude-b'],
    'exec-claude-a': executorsInOrderA['exec-claude-a'],
  };

  const inventoryA = buildCandidateInventory({ ...cfg, executors: executorsInOrderA });
  const inventoryB = buildCandidateInventory({ ...cfg, executors: executorsInOrderB });

  assert.deepEqual(inventoryA, inventoryB);
  assert.deepEqual(
    inventoryA.map((c) => c.executorId),
    ['exec-claude-a', 'exec-claude-b', 'exec-gemini-a'],
    'sorted ascending by executorId regardless of source object key order; kind:"tool" excluded entirely',
  );
});

test('planCohort produces an identical allocation regardless of runnerConfig.executors insertion order', () => {
  const definition = twoActorDefinition();
  const cfgA = baseRunnerConfig();
  const cfgB = { ...cfgA, executors: Object.fromEntries(Object.entries(cfgA.executors).reverse()) };

  const planA = planCohort({ definition, runnerConfig: cfgA });
  const planB = planCohort({ definition, runnerConfig: cfgB });

  assert.deepEqual(planA, planB);
});

test('buildCandidateInventory resolves an agentType-only executor entry (no own command/invocations) to the global executor.command instead of crashing, matching resolveExecutorConfig\'s own derivation', () => {
  const cfg = {
    executor: { command: 'pi', args: ['{prompt}'] },
    executors: { 'agent-x': { kind: 'agent', agentType: 'some-agent' } },
    modelPolicies: { claude: { standard: 'sonnet' }, pi: { standard: 'pi-model' } },
  };

  const inventory = buildCandidateInventory(cfg);

  assert.equal(inventory.length, 1);
  const [candidate] = inventory;
  assert.equal(candidate.resolvedCommand, 'pi');
  assert.equal(candidate.invocationMechanism, 'agent-type');

  // Ground truth: resolveExecutorConfig (resolve.mjs) is the real
  // cross-provider governance gate this module's own derivation must never
  // independently drift from (the "two call sites disagree" bug class
  // this fix closes). It resolves the SAME "pi" family here since
  // buildAgentTypeExecutor's resolved command is always the runner's
  // global executor.command, never a literal "claude".
  const resolved = resolveExecutorConfig(cfg, undefined, 'agent-x', undefined, 'repo-content');
  assert.equal(resolved.governance.providerFamily, 'pi');
  assert.equal(candidate.providerFamily, resolved.governance.providerFamily);
  assert.equal(candidate.governanceEligible, true);
});

// ─── R3: candidate rejection matrix (5 distinct, specifically-worded reasons) ─

const claudeCandidate = Object.freeze({
  executorId: 'exec-claude-a',
  providerFamily: 'claude',
  resolvedCommand: 'claude',
  invocationMechanism: 'cli',
  supportedTiers: Object.freeze(['lightweight', 'standard']),
  capabilities: Object.freeze(['fgos-coding-implement']),
  persona: undefined,
  tools: undefined,
  contextLimit: undefined,
  governanceEligible: true,
  governanceReason: undefined,
  egressKind: 'same-provider',
});

test('rejection-by-executor-mismatch: candidate is not the pinned executorId', () => {
  const result = matchCandidateToRequirement(claudeCandidate, { role: 'researcher', executorId: 'exec-claude-b' });
  assert.equal(result.ok, false);
  assert.equal(result.field, 'executor');
  assert.match(result.reason, /pinned to executor "exec-claude-b"/);
  assert.match(result.reason, /exec-claude-a/);
});

test('rejection-by-provider-mismatch: candidate resolves to a different provider family than required', () => {
  const result = matchCandidateToRequirement(claudeCandidate, { role: 'researcher', providerFamily: 'gemini' });
  assert.equal(result.ok, false);
  assert.equal(result.field, 'provider');
  assert.match(result.reason, /requires provider family "gemini"/);
  assert.match(result.reason, /resolves to provider family "claude"/);
});

test('rejection-by-tier-mismatch: candidate does not support the required minTier', () => {
  const result = matchCandidateToRequirement(claudeCandidate, { role: 'researcher', minTier: 'critical' });
  assert.equal(result.ok, false);
  assert.equal(result.field, 'tier');
  assert.match(result.reason, /needs tier "critical"/);
  assert.match(result.reason, /only supports \[lightweight, standard\]/);
});

test('rejection-by-capability-mismatch: candidate is missing a required capability', () => {
  const result = matchCandidateToRequirement(claudeCandidate, { role: 'researcher', requiredCapabilities: ['impact-analysis'] });
  assert.equal(result.ok, false);
  assert.equal(result.field, 'capability');
  assert.match(result.reason, /missing \[impact-analysis\]/);
});

test('rejection-by-governance: candidate is not governance-eligible', () => {
  const ungoverned = { ...claudeCandidate, governanceEligible: false, governanceReason: 'cross-provider egress refused: allowCrossProvider not set' };
  const result = matchCandidateToRequirement(ungoverned, { role: 'researcher' });
  assert.equal(result.ok, false);
  assert.equal(result.field, 'governance');
  assert.match(result.reason, /not governance-eligible/);
  assert.match(result.reason, /allowCrossProvider not set/);
});

test('rejection-by-context: candidate declares no contextLimit against a declared minContext requirement (never assumed satisfied)', () => {
  const result = matchCandidateToRequirement(claudeCandidate, { role: 'researcher', minContext: 100000 });
  assert.equal(result.ok, false);
  assert.equal(result.field, 'context');
  assert.match(result.reason, /declares no contextLimit/);
});

test('matchCandidateToRequirement returns ok:true when every declared dimension is satisfied', () => {
  const result = matchCandidateToRequirement(claudeCandidate, { role: 'researcher', minTier: 'lightweight', requiredCapabilities: ['fgos-coding-implement'] });
  assert.deepEqual(result, { ok: true });
});

// ─── R3: hard-unsatisfied case ────────────────────────────────────────────

test('planCohort hard-fails naming the actor/field/candidate and what tier support IS available, when required minTier is not configured for any candidate', () => {
  // No family in this fixture configures "critical" at all (claude stops at
  // "standard", gemini is lightweight-only) -- genuinely unsatisfiable.
  const cfg = baseRunnerConfig({
    modelPolicies: {
      claude: { lightweight: 'haiku', standard: 'sonnet' },
      gemini: { lightweight: 'gemini-flash' },
    },
  });
  const definition = twoActorDefinition({ minTier: 'critical' });

  const plan = planCohort({ definition, runnerConfig: cfg });

  assert.equal(plan.status, 'hard-failed');
  assert.equal(plan.failure.actorId, 'alpha');
  assert.equal(plan.failure.role, 'researcher');
  assert.equal(plan.failure.field, 'tier');
  assert.match(plan.failure.reason, /actor "alpha"/);
  assert.match(plan.failure.reason, /needs tier "critical"/);
  // "what support IS available" -- names which family (claude) IS
  // configured for a WEAKER tier, and that none supports "critical" at all.
  assert.match(plan.failure.availableSupport, /no candidate currently configures that tier/);
  assert.deepEqual(plan.allocations, []);
});

test('planCohort hard-fails naming which provider family IS configured for the required tier, when only a subset of candidates qualify', () => {
  const cfg = baseRunnerConfig();
  // "standard" is configured only for the "claude" family in this fixture
  // (gemini is lightweight-only) -- once both claude candidates are
  // consumed by other actors, the example wording from R3
  // ("role X needs tier Y; only Z is configured for any candidate") must
  // be reproducible.
  const definition = {
    ...twoActorDefinition({ minTier: 'standard', distinctProviderFamilies: 1 }),
  };
  // Force exhaustion: reduce the candidate pool to gemini-only so "standard"
  // has literally zero configured support anywhere in the pool.
  const geminiOnlyCfg = { ...cfg, executors: { 'exec-gemini-a': cfg.executors['exec-gemini-a'] } };

  const plan = planCohort({ definition, runnerConfig: geminiOnlyCfg });

  assert.equal(plan.status, 'hard-failed');
  assert.equal(plan.failure.field, 'tier');
  assert.match(plan.failure.availableSupport, /no candidate currently configures that tier for any provider family/);
});

test('planCohort names which family IS configured for the required tier when at least one candidate anywhere supports it', () => {
  const cfg = baseRunnerConfig();
  const definition = twoActorDefinition({ minTier: 'standard', distinctProviderFamilies: 1 });
  // Only claude supports "standard"; allocate a 3rd actor once both claude
  // candidates are already used so the failure surfaces with claude
  // candidates exhausted but still nameable as "configured."
  const threeActorRaw = JSON.parse(JSON.stringify(definition));
  threeActorRaw.spec.profile.cohort.count = 3;
  threeActorRaw.spec.actors.push({ id: 'gamma', role: 'researcher' });
  threeActorRaw.spec.operations.push({ id: 'op-gamma', role: 'researcher', policy: { minTier: 'standard' } });
  threeActorRaw.spec.graph.nodes[0].operations.push({ ref: 'op-gamma', actor: 'gamma' });
  const threeActorDefinition = validateFlowDefinition(threeActorRaw);

  const plan = planCohort({ definition: threeActorDefinition, runnerConfig: cfg });

  assert.equal(plan.status, 'hard-failed');
  assert.equal(plan.failure.field, 'tier');
  assert.match(plan.failure.availableSupport, /needs tier "standard"; only \[claude\] is configured for any candidate/);
});

// ─── R3: explicit soft-fallback case ───────────────────────────────────────

test('planCohort hard-fails a diversity shortfall when no fallback rule is declared', () => {
  const cfg = baseRunnerConfig();
  // distinctProviderFamilies: 3, but only "claude"/"gemini" families exist
  // in the whole candidate pool -- unsatisfiable without a fallback rule.
  const definition = twoActorDefinition({ distinctProviderFamilies: 3 });

  const plan = planCohort({ definition, runnerConfig: cfg });

  assert.equal(plan.status, 'hard-failed');
  assert.equal(plan.failure.field, 'diversity');
  assert.match(plan.failure.reason, /requires 3 distinct provider families/);
  assert.match(plan.failure.reason, /no declared fallback rule permits the shortfall/);
});

test('planCohort degrades diversity ONLY when a declared fallback rule permits it, and records the degradation in the output (never silent)', () => {
  const cfg = baseRunnerConfig();
  const definition = twoActorDefinition({ distinctProviderFamilies: 3 });
  const fallbackRules = [{ id: 'allow-two-family-shortfall', appliesTo: 'distinctProviderFamilies', reason: 'only claude/gemini configured in this fixture' }];

  const plan = planCohort({ definition, runnerConfig: cfg, fallbackRules });

  assert.equal(plan.status, 'allocated');
  assert.equal(plan.allocations.length, 2);
  assert.equal(plan.diversity.required, 3);
  assert.equal(plan.diversity.achieved, 2);
  assert.equal(plan.diversity.satisfied, false);
  assert.equal(plan.diversity.degraded, true);
  assert.deepEqual(plan.diversity.fallbackRuleApplied, fallbackRules[0]);
  assert.match(plan.explanation, /DEGRADED/);
  assert.match(plan.explanation, /allow-two-family-shortfall/);
});

test('planCohort satisfies diversity without degradation when the candidate pool provides enough distinct families', () => {
  const cfg = baseRunnerConfig();
  const definition = twoActorDefinition({ distinctProviderFamilies: 2 });

  const plan = planCohort({ definition, runnerConfig: cfg });

  assert.equal(plan.status, 'allocated');
  assert.equal(plan.diversity.achieved, 2);
  assert.equal(plan.diversity.satisfied, true);
  assert.equal(plan.diversity.degraded, false);
  assert.equal(plan.diversity.fallbackRuleApplied, null);
  const families = new Set(plan.allocations.map((a) => a.providerFamily));
  assert.deepEqual([...families].sort(), ['claude', 'gemini']);
});

test('planCohort emits a per-actor PolicyPatch in the exact shape mergePolicyStack/validatePolicyPatch accepts', () => {
  const cfg = baseRunnerConfig();
  const definition = twoActorDefinition({ distinctProviderFamilies: 2 });

  const plan = planCohort({ definition, runnerConfig: cfg });

  for (const allocation of plan.allocations) {
    assert.equal(allocation.policyPatch.minTier, 'lightweight');
    assert.equal(allocation.policyPatch.preferExecutor, allocation.executorId);
    assert.ok(Object.isFrozen(allocation.policyPatch));
    // Only the documented PolicyPatch fields ever appear.
    for (const key of Object.keys(allocation.policyPatch)) {
      assert.ok(['minTier', 'preferPersona', 'preferExecutor', 'fallbackExecutors', 'visibility'].includes(key));
    }
  }
});

test('planCohort hard-fails naming the missing role when cohort.requiredRoles has no matching declared actor', () => {
  const raw = JSON.parse(JSON.stringify(twoActorDefinition()));
  raw.spec.profile.cohort.requiredRoles = ['researcher', 'auditor'];
  const definition = validateFlowDefinition(raw);

  const plan = planCohort({ definition, runnerConfig: baseRunnerConfig() });

  assert.equal(plan.status, 'hard-failed');
  assert.equal(plan.failure.field, 'requiredRole');
  assert.match(plan.failure.reason, /\[auditor\]/);
  assert.deepEqual(plan.allocations, []);
});

test('planCohort throws CohortPlanningError for structurally invalid input (no spec.profile.cohort block)', () => {
  const raw = JSON.parse(JSON.stringify(twoActorDefinition()));
  delete raw.spec.profile.cohort;
  const definition = validateFlowDefinition(raw);

  assert.throws(() => planCohort({ definition, runnerConfig: baseRunnerConfig() }), CohortPlanningError);
});

// ─── R4: resolver handoff / mismatch-aborts-before-spawn ──────────────────

test('verifyPlannedAllocationAgainstCurrentConfig aborts when the planned executor is no longer registered', () => {
  const cfg = baseRunnerConfig();
  const definition = twoActorDefinition({ distinctProviderFamilies: 1 });
  const plan = planCohort({ definition, runnerConfig: cfg });
  assert.equal(plan.status, 'allocated');

  const drifted = { ...cfg, executors: { ...cfg.executors } };
  const [firstAllocation] = plan.allocations;
  delete drifted.executors[firstAllocation.executorId];

  const verified = verifyPlannedAllocationAgainstCurrentConfig(firstAllocation, drifted);

  assert.equal(verified.ok, false);
  assert.equal(verified.abort, true);
  assert.match(verified.reason, new RegExp(firstAllocation.executorId));
});

test('verifyPlannedAllocationAgainstCurrentConfig aborts when the planned tier is no longer supported by the current config', () => {
  const cfg = baseRunnerConfig();
  const definition = twoActorDefinition({ minTier: 'standard', distinctProviderFamilies: 1 });
  const plan = planCohort({ definition, runnerConfig: cfg });
  assert.equal(plan.status, 'allocated');
  const [firstAllocation] = plan.allocations;
  assert.equal(firstAllocation.providerFamily, 'claude');

  const drifted = {
    ...cfg,
    modelPolicies: {
      ...cfg.modelPolicies,
      claude: { lightweight: 'haiku' }, // "standard" removed from the live config since planning time
    },
  };

  const verified = verifyPlannedAllocationAgainstCurrentConfig(firstAllocation, drifted);

  assert.equal(verified.ok, false);
  assert.equal(verified.abort, true);
  assert.match(verified.reason, /standard/);
});

test('verifyPlannedAllocationAgainstCurrentConfig aborts when the executor now resolves to a different provider family', () => {
  const cfg = baseRunnerConfig();
  const definition = twoActorDefinition({ distinctProviderFamilies: 1 });
  const plan = planCohort({ definition, runnerConfig: cfg });
  const claudeAllocation = plan.allocations.find((a) => a.providerFamily === 'claude');
  assert.ok(claudeAllocation);

  const drifted = {
    ...cfg,
    executors: {
      ...cfg.executors,
      [claudeAllocation.executorId]: { ...cfg.executors[claudeAllocation.executorId], providerModel: 'gemini' },
    },
  };

  const verified = verifyPlannedAllocationAgainstCurrentConfig(claudeAllocation, drifted);

  assert.equal(verified.ok, false);
  assert.equal(verified.abort, true);
  assert.match(verified.reason, /provider: planned "claude", re-resolved "gemini"/);
});

test('verifyPlannedAllocationAgainstCurrentConfig confirms ok:true, abort:false when the config has not drifted', () => {
  const cfg = baseRunnerConfig();
  const definition = twoActorDefinition({ distinctProviderFamilies: 1 });
  const plan = planCohort({ definition, runnerConfig: cfg });
  const [firstAllocation] = plan.allocations;

  const verified = verifyPlannedAllocationAgainstCurrentConfig(firstAllocation, cfg);

  assert.equal(verified.ok, true);
  assert.equal(verified.abort, false);
  assert.equal(verified.resolvedPolicy.executorId, firstAllocation.executorId);
  assert.equal(verified.resolvedPolicy.providerModel, firstAllocation.providerFamily);
  assert.equal(verified.resolvedPolicy.tier, firstAllocation.tier);
});

// ─── Grounding: buildCandidateInventory against the REAL committed config ──

/** Read the committed `.fgos/config.json`'s `runner` section directly via
 * `git show HEAD:...` -- never `fs.readFileSync` off the working tree --
 * matching `test/runner/dispatch.test.mjs`'s own `committedRunnerConfig()`
 * helper exactly (same rationale: proves the repo's committed content, not
 * whatever happens to be sitting on this machine's disk). */
function committedRunnerConfig() {
  const worktreeRoot = path.resolve(import.meta.dirname, '..', '..');
  const raw = execFileSync('git', ['show', 'HEAD:.fgos/config.json'], { cwd: worktreeRoot, encoding: 'utf8' });
  return JSON.parse(raw).runner;
}

test('buildCandidateInventory against the real committed .fgos/config.json: only kind:"agent" executors become candidates, provider families/tiers are read (never guessed) from the real config', () => {
  const cfg = committedRunnerConfig();
  const inventory = buildCandidateInventory(cfg);

  // gitnexus/herdr are kind:"tool" -- never candidates.
  assert.ok(!inventory.some((c) => c.executorId === 'gitnexus'));
  assert.ok(!inventory.some((c) => c.executorId === 'herdr'));

  const byId = Object.fromEntries(inventory.map((c) => [c.executorId, c]));
  assert.equal(byId['agy-cli'].providerFamily, 'gemini');
  assert.deepEqual(byId['agy-cli'].supportedTiers, ['lightweight', 'standard', 'creative', 'analytical', 'critical']);
  assert.equal(byId['codex-pi'].providerFamily, 'openai-codex');
  assert.deepEqual(byId['codex-pi'].supportedTiers, ['lightweight', 'standard', 'creative', 'analytical', 'critical']);
  assert.equal(byId['glm-cli'].providerFamily, 'z-ai');
  assert.deepEqual(byId['glm-cli'].supportedTiers, ['lightweight']);
  assert.equal(byId['claude'].providerFamily, 'claude');
  assert.deepEqual(byId['claude'].supportedTiers, ['lightweight', 'standard', 'creative', 'analytical', 'critical']);

  // Explicit stable order: ascending by executorId.
  const ids = inventory.map((c) => c.executorId);
  assert.deepEqual(ids, [...ids].sort());

  // distinctProviderFamilies is COUNTED only, never ranked/scored (R1 non-goal).
  const distinctFamilies = new Set(inventory.map((c) => c.providerFamily));
  assert.ok(distinctFamilies.size >= 3);
});

test('planCohort against the real committed .fgos/config.json allocates 2 actors requiring lightweight tier across 2 distinct provider families', () => {
  const cfg = committedRunnerConfig();
  const definition = twoActorDefinition({ minTier: 'lightweight', distinctProviderFamilies: 2 });

  const plan = planCohort({ definition, runnerConfig: cfg });

  assert.equal(plan.status, 'allocated');
  assert.equal(plan.diversity.satisfied, true);
  const families = new Set(plan.allocations.map((a) => a.providerFamily));
  assert.equal(families.size, 2);
});
