// Unit I21 -- pure per-node dispatch binding tests (binding.mjs), per
// phase-05-unit-i21-per-node-binding.md's own "Steps" list: the four-step
// precedence order, fallback capability derivation, diversity
// preferred/required, and override precedence.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { bindOperations, deriveOperationCapability, BindingError } from '../../src/verbs/coordination/binding.mjs';
import { composeStartRequest, composeCoordinationActionRequest } from '../../src/verbs/coordination/composers.mjs';
import { validateFlowDefinition } from '../../src/runner/definitions/schema.mjs';
import { loadCoordinationProtocol } from '../../src/runner/definitions/protocol-loader.mjs';

/** Read the committed `.fgos/config.json`'s `runner` section directly via
 * `git show HEAD:...` -- never `fs.readFileSync` off the working tree --
 * matching `test/runner/cohort-planner.test.mjs`'s own `committedRunnerConfig()`
 * helper exactly (same rationale: proves the repo's committed content, not
 * whatever happens to be sitting on this machine's disk). */
function committedRunnerConfig() {
  const worktreeRoot = path.resolve(import.meta.dirname, '..', '..');
  const raw = execFileSync('git', ['show', 'HEAD:.fgos/config.json'], { cwd: worktreeRoot, encoding: 'utf8' });
  return JSON.parse(raw).runner;
}

function baseRunnerConfig(overrides = {}) {
  return {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      'agy': {
        kind: 'agent',
        providerModel: 'gemini',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy', args: ['{prompt}'] }],
      },
      'claude-default': {
        kind: 'agent',
        for: ['review'],
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['{prompt}'] }],
      },
      'claude-readonly': {
        kind: 'agent',
        invocations: [
          { id: 'default', via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['{prompt}'] },
          { id: 'confined', via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['--read-only', '{prompt}'] },
        ],
      },
    },
    capabilities: {
      'code:implement': { prefer: 'agy' },
      'code:review': { prefer: [{ executor: 'claude-readonly', invocation: 'confined' }, { executor: 'claude-default' }] },
      review: {},
    },
    modelPolicies: {
      claude: { standard: 'sonnet', flagship: 'sonnet', frontier: 'opus' },
      gemini: { standard: 'gemini-pro' },
    },
    timeoutMs: 900000,
    ...overrides,
  };
}

/** Mirrors standalone-master-coordination-loop.yaml's own doer/reviewer/red-team shape,
 * minus fixer/recheck (not needed to exercise the four-step order). */
function produceReviewRedTeamDefinition({ reviewDistinctProviderFrom, redTeamDistinctProviderFrom, produceCapability = 'code:implement', reviewCapability = 'code:review' } = {}) {
  produceCapability = produceCapability === null ? undefined : produceCapability;
  reviewCapability = reviewCapability === null ? undefined : reviewCapability;
  const raw = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'test.binding.produce-review-red-team', version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['doer', 'reviewer', 'red-team'],
      actors: [
        { id: 'doer', role: 'doer' },
        { id: 'reviewer', role: 'reviewer' },
        { id: 'red-team', role: 'red-team' },
      ],
      operations: [
        {
          id: 'produce-candidate',
          role: 'doer',
          ...(produceCapability ? { policy: { capability: produceCapability } } : {}),
          result: { kind: 'work-product', evidenceRequired: 'reported' },
        },
        {
          id: 'review-candidate',
          role: 'reviewer',
          policy: {
            ...(reviewCapability ? { capability: reviewCapability } : {}),
            ...(reviewDistinctProviderFrom ? { distinctProviderFrom: reviewDistinctProviderFrom } : {}),
          },
          result: { kind: 'advisory', evidenceRequired: 'reported' },
        },
        {
          id: 'red-team-candidate',
          role: 'red-team',
          policy: {
            ...(reviewCapability ? { capability: reviewCapability } : {}),
            ...(redTeamDistinctProviderFrom ? { distinctProviderFrom: redTeamDistinctProviderFrom } : {}),
          },
          result: { kind: 'advisory', evidenceRequired: 'reported' },
        },
      ],
      graph: {
        entry: 'phase-produce',
        nodes: [
          { id: 'phase-produce', operations: [{ ref: 'produce-candidate', actor: 'doer' }], transitions: ['phase-review'] },
          {
            id: 'phase-review',
            operations: [
              { ref: 'review-candidate', actor: 'reviewer' },
              { ref: 'red-team-candidate', actor: 'red-team' },
            ],
            transitions: [],
          },
        ],
      },
    },
  };
  return validateFlowDefinition(raw);
}

test('Unit I21: step 2 binds doer/reviewer/red-team via capabilities.<cap>.prefer with no hand roster', () => {
  const definition = produceReviewRedTeamDefinition();
  const runnerConfig = baseRunnerConfig();
  const { bindings } = bindOperations(definition, {}, runnerConfig);

  const doer = bindings.find((b) => b.actorId === 'doer');
  assert.equal(doer.bindingSource, 'capability.prefer');
  assert.equal(doer.cliPolicy.preferExecutor, 'agy');
  assert.equal(doer.providerFamily, 'gemini');

  const reviewer = bindings.find((b) => b.actorId === 'reviewer');
  assert.equal(reviewer.bindingSource, 'capability.prefer');
  assert.equal(reviewer.cliPolicy.preferExecutor, 'claude-readonly');
  assert.equal(reviewer.cliPolicy.preferInvocation, 'confined');
});

test('Unit I21: step 1 (Lead override) wins over step 2 (capability.prefer) and is left untouched', () => {
  const definition = produceReviewRedTeamDefinition();
  const runnerConfig = baseRunnerConfig();
  const { bindings } = bindOperations(definition, { actors: [{ id: 'doer', executor: 'claude-default' }] }, runnerConfig);

  const doer = bindings.find((b) => b.actorId === 'doer');
  assert.equal(doer.bindingSource, 'override');
  assert.deepEqual(doer.cliPolicy, {});
  // Untouched roster entry is honored downstream by the caller (composers.mjs),
  // this module only records that it declined to compute anything.
  const reviewer = bindings.find((b) => b.actorId === 'reviewer');
  assert.equal(reviewer.bindingSource, 'capability.prefer');
});

test('Unit I21: fallback capability derivation -- work-product uses facts.primaryCapability, advisory falls back to domain:review then review (round 2 correction: "review" has no .prefer, so it is unbound, never a capability.for match)', () => {
  const definition = produceReviewRedTeamDefinition({ produceCapability: null, reviewCapability: null });
  const runnerConfig = baseRunnerConfig();

  const noFacts = bindOperations(definition, {}, runnerConfig);
  const doerNoFacts = noFacts.bindings.find((b) => b.actorId === 'doer');
  assert.equal(doerNoFacts.bindingSource, 'unbound');
  assert.equal(doerNoFacts.capability, null);

  const withFacts = bindOperations(definition, {}, runnerConfig, { primaryCapability: 'code:implement', domain: 'code' });
  const doerWithFacts = withFacts.bindings.find((b) => b.actorId === 'doer');
  assert.equal(doerWithFacts.capability, 'code:implement');
  assert.equal(doerWithFacts.cliPolicy.preferExecutor, 'agy');

  const reviewerWithFacts = withFacts.bindings.find((b) => b.actorId === 'reviewer');
  assert.equal(reviewerWithFacts.capability, 'code:review');
  assert.equal(reviewerWithFacts.cliPolicy.preferExecutor, 'claude-readonly');

  // Round 2 correction (Decision 1.2 only ever names capabilities.<cap>.prefer
  // as valid): the generic "review" capability has no .prefer in
  // baseRunnerConfig -- it only reaches "claude-default" (which declares
  // `for: ['review']`) through decide --for's own orphan-executor
  // reverse-mapping, refused per H4 below. This actor must be unbound, NOT
  // silently pinned to whichever executor happens to declare a matching
  // "for" entry.
  const withUnregisteredDomain = bindOperations(definition, {}, runnerConfig, { primaryCapability: 'code:implement', domain: 'docs' });
  const reviewerUnregisteredDomain = withUnregisteredDomain.bindings.find((b) => b.actorId === 'reviewer');
  assert.equal(reviewerUnregisteredDomain.capability, 'review');
  assert.equal(reviewerUnregisteredDomain.bindingSource, 'unbound');
  assert.deepEqual(reviewerUnregisteredDomain.cliPolicy, {});
});

test('Unit I21: distinctProviderFrom "preferred" binds a diverse candidate when available and warns (not refuses) when not', () => {
  const definition = produceReviewRedTeamDefinition({
    reviewDistinctProviderFrom: { roles: ['doer'], strength: 'preferred' },
  });
  const runnerConfig = baseRunnerConfig();
  const { bindings } = bindOperations(definition, {}, runnerConfig);

  const doer = bindings.find((b) => b.actorId === 'doer');
  assert.equal(doer.providerFamily, 'gemini');
  const reviewer = bindings.find((b) => b.actorId === 'reviewer');
  // claude-readonly (reviewer's own top preference) is already provider "claude", distinct from doer's "gemini".
  assert.notEqual(reviewer.diversity, null);
  assert.equal(reviewer.diversity.strength, 'preferred');
  assert.equal(reviewer.diversity.satisfied, true);
  assert.equal(reviewer.providerFamily, 'claude');
});

test('Unit I21: distinctProviderFrom "required" refuses with binding.diversity-unsatisfiable when every candidate collides, names roles and families', () => {
  const definition = produceReviewRedTeamDefinition({
    reviewDistinctProviderFrom: { roles: ['doer'], strength: 'required' },
  });
  // Every review candidate is provider "claude" -- force a collision by making the doer ALSO "claude".
  const runnerConfig = baseRunnerConfig({
    capabilities: {
      'code:implement': { prefer: 'claude-default' },
      'code:review': { prefer: [{ executor: 'claude-readonly', invocation: 'confined' }, { executor: 'claude-default' }] },
      review: {},
    },
  });

  assert.throws(
    () => bindOperations(definition, {}, runnerConfig),
    (err) => err instanceof BindingError && err.category === 'binding.diversity-unsatisfiable'
      && /doer/.test(err.message) && /claude/.test(err.message),
  );

  // Lead's explicit allow flag lets the Lead proceed anyway, recorded in provenance.
  const { bindings } = bindOperations(definition, {}, runnerConfig, { allowDiversityUnsatisfiable: ['doer'] });
  const reviewer = bindings.find((b) => b.actorId === 'reviewer');
  assert.equal(reviewer.diversity.satisfied, false);
  assert.equal(reviewer.diversity.overridden, true);
});

test('Unit I21: an actor whose capability resolves to nothing registered is left unbound, never thrown', () => {
  const definition = produceReviewRedTeamDefinition({ produceCapability: 'code:nonexistent' });
  const runnerConfig = baseRunnerConfig();
  const { bindings } = bindOperations(definition, {}, runnerConfig);
  const doer = bindings.find((b) => b.actorId === 'doer');
  assert.equal(doer.bindingSource, 'unbound');
  assert.equal(doer.capability, 'code:nonexistent');
});

test('Unit I21: rejects a non-CoordinationProtocol definition and a missing runnerConfig', () => {
  assert.throws(() => bindOperations({ spec: { profile: { kind: 'Workflow' } } }, {}, {}), BindingError);
  assert.throws(() => bindOperations(produceReviewRedTeamDefinition(), {}, undefined), BindingError);
});

test('Unit I21: composeStartRequest fills every node\'s actors[] entry from bindOperations when runnerConfig/definition are supplied, and stays byte-identical when absent', () => {
  const definition = produceReviewRedTeamDefinition();
  const runnerConfig = baseRunnerConfig();

  const withoutBinding = composeStartRequest({
    writerId: 'driver-1', objective: 'obj', protocolId: definition.metadata.id, definition,
    steps: [{ as: 's1', type: 'operation', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'obj', expectedOutputs: ['x'] }],
  });
  assert.deepEqual(withoutBinding.actors, []);

  const withBinding = composeStartRequest({
    writerId: 'driver-1', objective: 'obj', protocolId: definition.metadata.id, definition, runnerConfig,
    steps: [{ as: 's1', type: 'operation', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'obj', expectedOutputs: ['x'] }],
  });
  const doerEntry = withBinding.actors.find((a) => a.id === 'doer');
  assert.equal(doerEntry.executor, 'agy');
  const reviewerEntry = withBinding.actors.find((a) => a.id === 'reviewer');
  assert.equal(reviewerEntry.executor, 'claude-readonly');
  assert.equal(reviewerEntry.invocation, 'confined');

  // Lead's own explicit roster entry is untouched (Decision 1 step 1).
  const withOverride = composeStartRequest({
    writerId: 'driver-1', objective: 'obj', protocolId: definition.metadata.id, definition, runnerConfig,
    actors: [{ id: 'doer', executor: 'claude-default' }],
    steps: [{ as: 's1', type: 'operation', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'obj', expectedOutputs: ['x'] }],
  });
  assert.equal(withOverride.actors.find((a) => a.id === 'doer').executor, 'claude-default');
});

test('Red-team round 2, M (tier-only partial roster entry): a roster entry naming ONLY tier/persona (no executor) still gets its capability-computed executor layered on top, never suppressed', () => {
  const definition = produceReviewRedTeamDefinition();
  const runnerConfig = baseRunnerConfig();

  const withPartialOverride = composeStartRequest({
    writerId: 'driver-1', objective: 'obj', protocolId: definition.metadata.id, definition, runnerConfig,
    actors: [{ id: 'doer', tier: 'flagship' }],
    steps: [{ as: 's1', type: 'operation', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'obj', expectedOutputs: ['x'] }],
  });
  const doerEntry = withPartialOverride.actors.find((a) => a.id === 'doer');
  assert.equal(doerEntry.tier, 'flagship', 'the roster\'s own tier must survive');
  assert.equal(doerEntry.executor, 'agy', 'the capability-computed executor must still apply -- a tier-only entry is not an executor override');

  // A real executor override on the SAME actor is still left completely untouched (Decision 1 step 1, unaffected by this fix).
  const withRealOverride = composeStartRequest({
    writerId: 'driver-1', objective: 'obj', protocolId: definition.metadata.id, definition, runnerConfig,
    actors: [{ id: 'doer', executor: 'claude-default', tier: 'flagship' }],
    steps: [{ as: 's1', type: 'operation', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'obj', expectedOutputs: ['x'] }],
  });
  const doerRealOverride = withRealOverride.actors.find((a) => a.id === 'doer');
  assert.equal(doerRealOverride.executor, 'claude-default');
  assert.equal(doerRealOverride.tier, 'flagship');
});

test('Unit I21: composeCoordinationActionRequest fills actors[] for the whole graph when definition/runnerConfig are supplied', () => {
  const definition = produceReviewRedTeamDefinition();
  const runnerConfig = baseRunnerConfig();
  const manifest = { coordinationId: 'coord_i21_test', objective: 'obj', definitionRef: { id: definition.metadata.id, version: '1.0.0' } };

  const req = composeCoordinationActionRequest({
    manifest,
    definition,
    runnerConfig,
    action: { kind: 'dispatch-operation', target: { nodeId: 'phase-review', operationId: 'review-candidate', actorId: 'reviewer' } },
    precondition: {
      actionKey: 'sha256:abc',
      kind: 'dispatch-operation',
      writerId: 'driver-1',
      inputPayload: { objective: 'Execute review', expectedOutputs: ['review.md'] },
    },
  });
  const reviewerEntry = req.actors.find((a) => a.id === 'reviewer');
  assert.equal(reviewerEntry.executor, 'claude-readonly');

  // Backward-compatible: absent definition/runnerConfig -> actors stays [].
  const legacyReq = composeCoordinationActionRequest({
    manifest,
    action: { kind: 'dispatch-operation', target: { nodeId: 'phase-review', operationId: 'review-candidate', actorId: 'reviewer' } },
    precondition: {
      actionKey: 'sha256:abc',
      kind: 'dispatch-operation',
      writerId: 'driver-1',
      inputPayload: { objective: 'Execute review', expectedOutputs: ['review.md'] },
    },
  });
  assert.deepEqual(legacyReq.actors, []);
});

test('Red-team: a portable operation cannot smuggle preferExecutor under policy.capability through bindOperations', () => {
  // `validatePolicyPatch` (schema.mjs) shape-checks each field independently
  // of scope -- it is NOT the enforcement boundary for a literal executor
  // pin at a portable scope (`assertNoPortableExecutorPin`,
  // session-engine.mjs, is, unaffected by this unit -- see
  // test/runner/coordination-nominal-group-lite.test.mjs's own R2 case,
  // still green). So a malicious portable YAML declaring BOTH `capability`
  // and `preferExecutor` on one operation still PARSES -- the real
  // assertion here is that `bindOperations` (this unit's own new code path)
  // never reads or forwards that `preferExecutor` value into its computed
  // `cliPolicy` at all; only the resolved capability candidate ever reaches
  // `cliPolicy.preferExecutor`.
  const definition = produceReviewRedTeamDefinition();
  const smuggled = JSON.parse(JSON.stringify(definition));
  const doerOp = smuggled.spec.operations.find((op) => op.id === 'produce-candidate');
  doerOp.policy.preferExecutor = 'attacker-controlled-executor';
  const revalidated = validateFlowDefinition(smuggled);
  assert.equal(revalidated.spec.operations.find((op) => op.id === 'produce-candidate').policy.preferExecutor, 'attacker-controlled-executor');

  const runnerConfig = baseRunnerConfig();
  const { bindings } = bindOperations(revalidated, {}, runnerConfig);
  const doer = bindings.find((b) => b.actorId === 'doer');
  assert.equal(doer.cliPolicy.preferExecutor, 'agy', 'bindOperations must resolve via capability.prefer, never echo the smuggled preferExecutor value');
  assert.notEqual(doer.cliPolicy.preferExecutor, 'attacker-controlled-executor');
});

test('Red-team round 1, H1: policy.capability naming a literal registered executor id (not a real capability) must NOT bind to that executor', () => {
  // "agy" is a registered executor id (baseRunnerConfig) but is never a
  // capability key -- resolveExecutorAndOverrides's own first-checked
  // branch (cfg.executors[name]) matches it directly, returning
  // `configured: true, bindingSource: 'executor-id'` even though no
  // `capabilities.agy.prefer` exists. bindOperations must refuse to treat
  // that as a real capability resolution (the same class of attack as
  // smuggling a literal `preferExecutor`, just via `policy.capability`'s own
  // string instead).
  const definition = produceReviewRedTeamDefinition({ produceCapability: 'agy' });
  const runnerConfig = baseRunnerConfig();
  const { bindings } = bindOperations(definition, {}, runnerConfig);
  const doer = bindings.find((b) => b.actorId === 'doer');
  assert.equal(doer.bindingSource, 'unbound', 'a literal executor-id match under policy.capability must never resolve as a valid capability binding');
  assert.deepEqual(doer.cliPolicy, {});
  assert.notEqual(doer.bindingSource, 'executor-id');

  // M2 confirmed as a side effect of the H1 fix: since bindOperations never
  // accepts the "executor-id" branch as a real resolution at all, it can
  // never present a binding that skipped capabilityEntry.overrides while
  // claiming a genuine capability match -- there is no longer any code path
  // where that mismatch could occur.
});

test('Red-team round 2, H4: a generic capability with no .prefer must NOT silently bind through an executor\'s own declared "for" array', () => {
  // "review" (baseRunnerConfig) has no .prefer at all; "claude-default"
  // declares `for: ['review']`. Decision 1.2 only ever names
  // capabilities.<cap>.prefer as a valid operation-capability resolution --
  // decide --for's own orphan-executor reverse-mapping is a purpose-routing
  // fallback for a DIFFERENT caller shape, never a declared capability-catalog
  // resolution this module should trust. On the real committed
  // .fgos/config.json this exact shape (a "review"-less-.prefer capability
  // plus an executor declaring `for: [..., "review"]`) silently rebound every
  // architecture-advisory-panel-v1 actor onto an unconfined executor (H4) --
  // this is the minimal reproduction of that same shape.
  const definition = produceReviewRedTeamDefinition({ produceCapability: 'review' });
  const runnerConfig = baseRunnerConfig();
  const { bindings } = bindOperations(definition, {}, runnerConfig);
  const doer = bindings.find((b) => b.actorId === 'doer');
  assert.equal(doer.bindingSource, 'unbound', 'a capability.for match must never resolve as a valid capability binding');
  assert.deepEqual(doer.cliPolicy, {});
  assert.notEqual(doer.cliPolicy.preferExecutor, 'claude-default');
});

test('Red-team round 2, H4 (real config proof): architecture-advisory-panel-v1\'s generic "review" capability actors are unbound against the real committed .fgos/config.json, never pinned to an unconfined executor via "for"', () => {
  const runnerConfig = committedRunnerConfig();
  const repoRoot = path.resolve(import.meta.dirname, '..', '..');

  // Confirm the real config still has the exact shape H4 depends on: "review"
  // has no .prefer, and some executor declares "review" in its own "for".
  assert.equal(runnerConfig.capabilities.review?.prefer, undefined, 'this proof assumes "review" has no .prefer in the real config -- re-check H4 if this ever changes');
  const forExecutorId = Object.entries(runnerConfig.executors).find(([, e]) => Array.isArray(e.for) && e.for.includes('review'))?.[0];
  assert.ok(forExecutorId, 'this proof assumes some executor declares for: [..., "review"] in the real config -- re-check H4 if this ever changes');

  const definition = loadCoordinationProtocol('core.coordination-protocol.architecture-advisory-panel-v1', { cwd: repoRoot, packageRoot: repoRoot });
  const { bindings } = bindOperations(definition, {}, runnerConfig);

  const genericReviewBindings = bindings.filter((b) => b.capability === 'review');
  assert.ok(genericReviewBindings.length > 0, 'expected at least one actor to derive the generic "review" capability');
  for (const binding of genericReviewBindings) {
    assert.equal(binding.bindingSource, 'unbound', `actor "${binding.actorId}" must be unbound (falling through to readOnlyRedirects), never silently pinned to "${forExecutorId}" via capability.for`);
    assert.deepEqual(binding.cliPolicy, {});
    assert.notEqual(binding.cliPolicy.preferExecutor, forExecutorId);
  }
});

test('Red-team round 1, H2: a top-priority --executor CLI override is never outranked by a computed capability binding (composeStartRequest)', () => {
  const definition = produceReviewRedTeamDefinition();
  const runnerConfig = baseRunnerConfig();

  const withoutCliExecutor = composeStartRequest({
    writerId: 'driver-1', objective: 'obj', protocolId: definition.metadata.id, definition, runnerConfig,
    steps: [{ as: 's1', type: 'operation', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'obj', expectedOutputs: ['x'] }],
  });
  // Baseline (no CLI override): capability computation still injects "agy".
  assert.equal(withoutCliExecutor.actors.find((a) => a.id === 'doer').executor, 'agy');

  const withCliExecutor = composeStartRequest({
    writerId: 'driver-1', objective: 'obj', protocolId: definition.metadata.id, definition, runnerConfig,
    cliExecutor: 'claude-default',
    steps: [{ as: 's1', type: 'operation', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'obj', expectedOutputs: ['x'] }],
  });
  // With a CLI-level --executor override in effect, no computed actors[]
  // entry may be injected for ANY actor -- run.mjs's own globalExecutor
  // fallback (actorEntry?.executor ?? globalExecutor) is what must apply
  // "claude-default" uniformly, never a capability-computed "agy" masking it.
  assert.equal(withCliExecutor.actors.find((a) => a.id === 'doer'), undefined);
  assert.equal(withCliExecutor.actors.find((a) => a.id === 'reviewer'), undefined);
});

test('Red-team round 1, H2: a top-priority --executor CLI override is never outranked by a computed capability binding (composeCoordinationActionRequest)', () => {
  const definition = produceReviewRedTeamDefinition();
  const runnerConfig = baseRunnerConfig();
  const manifest = { coordinationId: 'coord_i21_h2_test', objective: 'obj', definitionRef: { id: definition.metadata.id, version: '1.0.0' } };

  const req = composeCoordinationActionRequest({
    manifest,
    definition,
    runnerConfig,
    cliExecutor: 'claude-default',
    action: { kind: 'dispatch-operation', target: { nodeId: 'phase-review', operationId: 'review-candidate', actorId: 'reviewer' } },
    precondition: {
      actionKey: 'sha256:abc',
      kind: 'dispatch-operation',
      writerId: 'driver-1',
      inputPayload: { objective: 'Execute review', expectedOutputs: ['review.md'] },
    },
  });
  assert.equal(req.actors.find((a) => a.id === 'reviewer'), undefined);
});

test('Red-team: distinctProviderFrom "required" refuses a single-provider-family config and names the roles', () => {
  const definition = produceReviewRedTeamDefinition({
    reviewDistinctProviderFrom: { roles: ['doer'], strength: 'required' },
    redTeamDistinctProviderFrom: { roles: ['doer'], strength: 'required' },
  });
  // Every registered executor resolves to provider "claude" -- no diversity possible at all.
  const singleProviderFamilyRunnerConfig = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      'claude-a': { kind: 'agent', invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['{prompt}'] }] },
      'claude-b': { kind: 'agent', invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['{prompt}'] }] },
    },
    capabilities: {
      'code:implement': { prefer: 'claude-a' },
      'code:review': { prefer: [{ executor: 'claude-b' }, { executor: 'claude-a' }] },
    },
    modelPolicies: { claude: { standard: 'sonnet', flagship: 'sonnet' } },
    timeoutMs: 900000,
  };

  assert.throws(
    () => bindOperations(definition, {}, singleProviderFamilyRunnerConfig),
    (err) => {
      assert.ok(err instanceof BindingError);
      assert.equal(err.category, 'binding.diversity-unsatisfiable');
      assert.match(err.message, /doer/);
      assert.match(err.message, /claude/);
      return true;
    },
  );
});

test('deriveOperationCapability: unit coverage for the three fallback branches', () => {
  const runnerConfig = baseRunnerConfig();
  assert.deepEqual(
    deriveOperationCapability({ policy: { capability: 'x:y' }, result: { kind: 'work-product' } }, {}, runnerConfig),
    { name: 'x:y', source: 'declared' },
  );
  assert.deepEqual(
    deriveOperationCapability({ result: { kind: 'work-product' } }, { primaryCapability: 'code:implement' }, runnerConfig),
    { name: 'code:implement', source: 'facade-primary' },
  );
  assert.deepEqual(
    deriveOperationCapability({ result: { kind: 'work-product' } }, {}, runnerConfig),
    { name: null, source: 'unbound' },
  );
  assert.deepEqual(
    deriveOperationCapability({ result: { kind: 'advisory' } }, {}, runnerConfig),
    { name: 'review', source: 'generic-review-fallback' },
  );
});
