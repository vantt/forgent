// Phase 05 R1-R4 tests (cell P05.1) for
// core/coordination-protocols/group-cognition-framework.yaml -- the first
// Group Cognition framework, declared entirely as FlowDefinition config.
//
// Scope discipline (matches this cell's own non-goal list verbatim): every
// test here stays at the DECLARATION/VALIDATION level -- loading and
// structurally inspecting the already-validated FlowDefinition document,
// or feeding a mutated CLONE of it back through the REAL, unmodified
// `validateFlowDefinition`/`mergePolicyStack` (src/runner/definitions/
// schema.mjs). No test in this file opens a CoordinationSession or calls
// any `coordination/session-engine.mjs` export (dispatchDeclaredOperation,
// dispatchResearchFanOut, synthesizeResearchFanIn, openDeclaredProtocolSession,
// ...) -- R1-R4 is pure declaration/contract work, no execution wiring, and
// this cell's own phase-05.md "Tests First" list is explicit that the
// branch-independence proof stays "at the DECLARATION level ... not yet a
// live execution proof." A later cell (P05.2) wires real dispatch through
// this fixture's ALREADY-PROVEN primitives (dispatchResearchFanOut,
// synthesizeResearchFanIn, declared-consult's own single-edge shape).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { loadCoordinationProtocol, discoverCoordinationProtocols } from '../../src/runner/definitions/protocol-loader.mjs';
import { validateFlowDefinition, mergePolicyStack, FlowDefinitionError, MIN_TIER_VALUES } from '../../src/runner/definitions/schema.mjs';
import { MODEL_POLICY_TIERS } from '../../src/runner/dispatch/config.mjs';

const require = createRequire(import.meta.url);
// Same 'yaml' package protocol-loader.mjs itself uses (require(), not
// import -- mirrors that module's own module-load pattern exactly).
const parseYaml = require('yaml').parse;

const DEFINITION_ID = 'core.coordination-protocol.group-cognition-framework';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, '..', '..', 'core', 'coordination-protocols', 'group-cognition-framework.yaml');

const EXPLORER_ACTOR_IDS = ['explorer-a', 'explorer-b', 'explorer-c'];

/** Deep-clone through the loaded, frozen definition's own JSON shape (never
 * mutates the shared loaded singleton) so each negative test can mutate its
 * own private copy before re-validating. */
function cloneRawFixture(definition) {
  return JSON.parse(JSON.stringify(definition));
}

function loadDefinition() {
  return loadCoordinationProtocol(DEFINITION_ID);
}

// ─── R1: framework definition -- 6 named phases, declared purely as config ─

test('R1: the fixture validates cleanly through the REAL, unmodified validateFlowDefinition, both via loadCoordinationProtocol (discovery path) and directly on a freshly parsed copy (unit path)', () => {
  const viaLoader = loadDefinition();
  assert.equal(viaLoader.spec.profile.kind, 'CoordinationProtocol');

  const discovered = discoverCoordinationProtocols().find((e) => e.definition.metadata.id === DEFINITION_ID);
  assert.ok(discovered, 'group-cognition-framework.yaml must be discoverable through the real core-tier scan');
  assert.equal(discovered.tier, 'core');

  // Direct unit-level call: parse the raw YAML ourselves (same 'yaml'
  // package protocol-loader.mjs uses) and validate it a second, independent
  // way, never trusting the loader alone.
  const raw = parseYaml(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  const validated = validateFlowDefinition(raw);
  assert.equal(validated.metadata.id, DEFINITION_ID);
});

test('R1: golden determinism -- loading the fixture twice produces deep-equal, byte-for-byte identical normalized documents', () => {
  const first = loadDefinition();
  const second = loadDefinition();
  assert.deepEqual(first, second);

  const clone1 = cloneRawFixture(first);
  const clone2 = cloneRawFixture(first);
  const revalidated1 = validateFlowDefinition(clone1);
  const revalidated2 = validateFlowDefinition(clone2);
  assert.deepEqual(revalidated1, revalidated2, 'validateFlowDefinition itself is deterministic given the same input twice');
});

test('R1: declares exactly the 6 required phases, in the exact required order, entry-reachable via a single linear transitions chain', () => {
  const definition = loadDefinition();
  const expectedOrder = [
    'phase-divergent-exploration',
    'phase-cluster-deduplicate',
    'phase-critical-challenge',
    'phase-evidence-review',
    'phase-convergent-synthesis',
    'phase-recommendation-with-dissent',
  ];
  assert.equal(definition.spec.graph.nodes.length, expectedOrder.length);
  assert.deepEqual(
    definition.spec.graph.nodes.map((n) => n.id),
    expectedOrder,
  );
  assert.equal(definition.spec.graph.entry, expectedOrder[0]);

  // Walk entry -> transitions and confirm the SAME order is genuinely
  // reachable (not just coincidentally listed in that order in the array).
  const nodesById = new Map(definition.spec.graph.nodes.map((n) => [n.id, n]));
  const walked = [];
  let current = definition.spec.graph.entry;
  while (current) {
    walked.push(current);
    const node = nodesById.get(current);
    assert.ok(node.transitions.length <= 1, `phase "${current}" must transition linearly (0 or 1 target) for this fixture's own single-path design`);
    current = node.transitions[0];
  }
  assert.deepEqual(walked, expectedOrder);
  assert.deepEqual(nodesById.get('phase-recommendation-with-dissent').transitions, [], 'the final phase is a genuine terminal node');
});

test('R1: every phase wires the actor(s)/role(s) that phase actually requires -- required-actor gates', () => {
  const definition = loadDefinition();
  const opsById = new Map(definition.spec.operations.map((op) => [op.id, op]));
  const actorsById = new Map(definition.spec.actors.map((a) => [a.id, a]));
  const nodesById = new Map(definition.spec.graph.nodes.map((n) => [n.id, n]));

  const expectedRolesByPhase = {
    'phase-divergent-exploration': new Set(['facilitator', 'explorer']),
    'phase-cluster-deduplicate': new Set(['clusterer']),
    'phase-critical-challenge': new Set(['critic']),
    'phase-evidence-review': new Set(['evidence-reviewer']),
    'phase-convergent-synthesis': new Set(['synthesizer']),
    'phase-recommendation-with-dissent': new Set(['synthesizer']),
  };

  for (const [phaseId, expectedRoles] of Object.entries(expectedRolesByPhase)) {
    const node = nodesById.get(phaseId);
    assert.ok(node.operations.length > 0, `phase "${phaseId}" must wire at least one operation`);
    const actualRoles = new Set(node.operations.map((ref) => actorsById.get(ref.actor).role));
    assert.deepEqual(actualRoles, expectedRoles, `phase "${phaseId}" must wire exactly roles [${[...expectedRoles].join(', ')}]`);
    for (const ref of node.operations) {
      assert.equal(opsById.get(ref.ref).role, actorsById.get(ref.actor).role, `operation "${ref.ref}" role must match its bound actor "${ref.actor}"'s declared role`);
    }
  }

  // Divergent exploration specifically requires all 3 explorer actors
  // present, not merely "the explorer role" in the abstract.
  const explorationActors = nodesById
    .get('phase-divergent-exploration')
    .operations.filter((ref) => actorsById.get(ref.actor).role === 'explorer')
    .map((ref) => ref.actor)
    .sort();
  assert.deepEqual(explorationActors, [...EXPLORER_ACTOR_IDS].sort());
});

test('R1: no operation declares result.kind other than "advisory" -- never gate-verdict, never work-product, matching R4\'s "recommendation is advisory" for every phase in this framework', () => {
  const definition = loadDefinition();
  for (const op of definition.spec.operations) {
    assert.equal(op.result.kind, 'advisory', `operation "${op.id}" must declare result.kind: advisory`);
  }
});

// ─── R2: cognitive policy -- creative/analytical/critical tier floors ──────

test('R2: activity-level tier floors are declared via policy.minTier and exercise all three named tiers (creative, analytical, critical) across distinct activities', () => {
  const definition = loadDefinition();
  const tierByOp = Object.fromEntries(definition.spec.operations.map((op) => [op.id, op.policy?.minTier]));

  assert.equal(tierByOp['divergent-exploration'], 'creative');
  assert.equal(tierByOp['cluster-deduplicate'], 'analytical');
  assert.equal(tierByOp['critical-challenge'], 'critical');
  assert.equal(tierByOp['evidence-review'], 'analytical');
  assert.equal(tierByOp['convergent-synthesis'], 'analytical');
  assert.equal(tierByOp['recommend-with-dissent'], 'critical');

  const declaredTiers = new Set(Object.values(tierByOp).filter(Boolean));
  assert.ok(declaredTiers.has('creative') && declaredTiers.has('analytical') && declaredTiers.has('critical'));

  // Every declared tier is drawn from the SAME real vocabulary
  // dispatch/config.mjs's MODEL_POLICY_TIERS defines -- never a
  // fixture-invented tier name.
  for (const tier of declaredTiers) {
    assert.ok(MODEL_POLICY_TIERS.includes(tier), `tier "${tier}" must be one of MODEL_POLICY_TIERS`);
    assert.ok(MIN_TIER_VALUES.includes(tier), `tier "${tier}" must be one of schema.mjs's own MIN_TIER_VALUES`);
  }
});

test('R2: capabilities/persona requirements -- every actor declares a persona; no operation declares a "capabilities" pin (avoids the already-documented cohort-planner unplannable-config gap the sibling fixture\'s own header records)', () => {
  const definition = loadDefinition();
  for (const actor of definition.spec.actors) {
    assert.ok(typeof actor.persona === 'string' && actor.persona.length > 0, `actor "${actor.id}" must declare a persona`);
  }
  for (const op of definition.spec.operations) {
    assert.equal(op.capabilities, undefined, `operation "${op.id}" must not declare a capabilities pin`);
  }
});

test('R2: activity tier floors remain monotonic through the actor policy scope stack -- reuses mergePolicyStack\'s EXISTING (raise-only) enforcement, never a second implementation', () => {
  const definition = loadDefinition();
  const opsById = new Map(definition.spec.operations.map((op) => [op.id, op]));

  // A legal stack (operation declares the floor, actor declares nothing
  // stronger) resolves without throwing, at exactly the operation's floor.
  const criticalChallengeOp = opsById.get('critical-challenge');
  const criticActor = definition.spec.actors.find((a) => a.id === 'critic-actor');
  const legalStack = [
    { scope: 'operation', source: criticalChallengeOp.id, policy: criticalChallengeOp.policy ?? {} },
    { scope: 'actor', source: criticActor.id, policy: criticActor.policy ?? {} },
  ];
  const merged = mergePolicyStack(legalStack);
  assert.equal(merged.minTier, 'critical');

  // An actor-scope attempt to LOWER the operation-declared floor is
  // rejected, not silently clamped -- proves this fixture's own operation/
  // actor pairing genuinely exercises mergePolicyStack's real monotonicity
  // guard rather than merely being compatible with it by accident.
  assert.throws(
    () =>
      mergePolicyStack([
        { scope: 'operation', source: criticalChallengeOp.id, policy: { minTier: 'critical' } },
        { scope: 'actor', source: criticActor.id, policy: { minTier: 'lightweight' } },
      ]),
    (err) => err instanceof FlowDefinitionError && /monotonic/.test(err.message),
  );
});

test('R2: portable config (spec.policy, every operation.policy, every actor.policy) carries no literal executor/model pin anywhere in the document -- the assertNoPortableExecutorPin invariant this fixture must never violate', () => {
  const definition = loadDefinition();
  assert.equal(definition.spec.policy, undefined, 'no definition-scope policy at all, so certainly no preferExecutor there');
  for (const op of definition.spec.operations) {
    assert.equal(op.policy?.preferExecutor, undefined, `operation "${op.id}" must not pin a literal executor`);
    assert.equal(op.policy?.fallbackExecutors, undefined, `operation "${op.id}" must not declare fallbackExecutors`);
  }
  for (const actor of definition.spec.actors) {
    assert.equal(actor.policy?.preferExecutor, undefined, `actor "${actor.id}" must not pin a literal executor`);
  }

  // Defense in depth: a raw, recursive scan of the RAW parsed YAML text
  // (never the loader's own normalized output) for the literal key
  // "preferExecutor" anywhere at all -- never relies solely on knowing
  // every scope a PolicyPatch can appear at today.
  const rawDocument = parseYaml(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  assertNoKeyDeep(rawDocument, 'preferExecutor');
});

function assertNoKeyDeep(value, key, seen = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) assertNoKeyDeep(item, key, seen);
    return;
  }
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const [k, v] of Object.entries(value)) {
    assert.notEqual(k, key, `document must never carry a "${key}" key anywhere (found at a nested path)`);
    assertNoKeyDeep(v, key, seen);
  }
}

// ─── R3: independence and bounded exchange ──────────────────────────────────

test('R3: divergent-exploration branches (explorer-a/b/c) have NO topology edge among themselves -- every edge touching an explorer actor originates ONLY from facilitator-actor, so no branch can read a sibling\'s output before the declared cluster/fan-in point', () => {
  const definition = loadDefinition();
  const explorerSet = new Set(EXPLORER_ACTOR_IDS);
  const edges = definition.spec.profile.topology.edges;

  const siblingEdge = edges.find((e) => explorerSet.has(e.from) && explorerSet.has(e.to));
  assert.equal(siblingEdge, undefined, 'no edge may exist directly between two explorer actors');

  const explorerIncomingEdges = edges.filter((e) => explorerSet.has(e.to));
  assert.equal(explorerIncomingEdges.length, EXPLORER_ACTOR_IDS.length, 'exactly one incoming edge per explorer actor');
  for (const edge of explorerIncomingEdges) {
    assert.equal(edge.from, 'facilitator-actor', `explorer actor "${edge.to}"'s only incoming edge must originate from the facilitator, never a sibling`);
  }
});

test('R3: cluster-deduplicate, convergent-synthesis, and recommend-with-dissent (the three fan-in-style phases) have NO incoming topology edge at all -- fan-in is never expressed as a single privileged upstream "read" edge', () => {
  const definition = loadDefinition();
  const edges = definition.spec.profile.topology.edges;
  for (const actorId of ['clusterer-actor', 'synthesizer-actor']) {
    assert.equal(
      edges.find((e) => e.to === actorId),
      undefined,
      `actor "${actorId}" must have no incoming topology edge -- its operations are fan-in style, never a single-edge hand-off`,
    );
  }
});

test('R3: exactly ONE topology edge carries a "critique" intent, capped at maxRounds: 1 -- the single declared critique/rebuttal round', () => {
  const definition = loadDefinition();
  const critiqueEdges = definition.spec.profile.topology.edges.filter((e) => e.intents?.includes('critique'));
  assert.equal(critiqueEdges.length, 1);
  assert.equal(critiqueEdges[0].from, 'clusterer-actor');
  assert.equal(critiqueEdges[0].to, 'critic-actor');
  assert.equal(critiqueEdges[0].maxRounds, 1);
});

test('R3: every declared topology edge caps maxRounds at exactly 1 -- no edge anywhere in this framework permits more than one round, structurally ruling out an unbounded back-and-forth dialogue on any edge', () => {
  const definition = loadDefinition();
  const edges = definition.spec.profile.topology.edges;
  assert.ok(edges.length > 0);
  for (const edge of edges) {
    assert.equal(edge.maxRounds, 1, `edge "${edge.from}" -> "${edge.to}" must declare maxRounds: 1`);
  }
});

test('R3: cohort declares isolated-until-fan-in independence and the explorer role as a hard requirement, with no cohort.count mismatch trap (omitted, matching the already-documented planCohort fix)', () => {
  const definition = loadDefinition();
  const cohort = definition.spec.profile.cohort;
  assert.equal(cohort.independence, 'isolated-until-fan-in');
  assert.deepEqual(cohort.requiredRoles, ['explorer']);
  assert.equal(cohort.count, undefined, 'cohort.count must stay omitted -- planCohort requires it to equal spec.actors.length (8), not just the explorer cohort size');
  assert.ok(Number.isInteger(cohort.distinctProviderFamilies) && cohort.distinctProviderFamilies >= 2);
});

test('R3: vote-as-truth / majority-based evidence confidence has no expressible field anywhere in this schema -- injecting a voting/consensus field at cohort, topology-edge, or operation scope is rejected by the REAL validateFlowDefinition', () => {
  const definition = loadDefinition();

  const cohortVariant = cloneRawFixture(definition);
  cohortVariant.spec.profile.cohort.votingRule = 'majority';
  assert.throws(() => validateFlowDefinition(cohortVariant), (err) => err instanceof FlowDefinitionError && /unknown field "votingRule"/.test(err.message));

  const edgeVariant = cloneRawFixture(definition);
  edgeVariant.spec.profile.topology.edges[0].voteWeight = 2;
  assert.throws(() => validateFlowDefinition(edgeVariant), (err) => err instanceof FlowDefinitionError && /unknown field "voteWeight"/.test(err.message));

  const opVariant = cloneRawFixture(definition);
  opVariant.spec.operations[0].consensusThreshold = 0.5;
  assert.throws(() => validateFlowDefinition(opVariant), (err) => err instanceof FlowDefinitionError && /unknown field "consensusThreshold"/.test(err.message));

  const completionVariant = cloneRawFixture(definition);
  completionVariant.spec.profile.completion.mode = 'majority-vote';
  assert.throws(() => validateFlowDefinition(completionVariant), (err) => err instanceof FlowDefinitionError && /completion\.mode/.test(err.message));
});

test('R3: recursive task graph / dynamic subgraph spawning has no expressible field -- injecting a spawn-shaped field on a graph node is rejected by the REAL validateFlowDefinition', () => {
  const definition = loadDefinition();
  const variant = cloneRawFixture(definition);
  variant.spec.graph.nodes[0].spawnSubgraph = { definitionId: 'core.coordination-protocol.group-cognition-framework' };
  assert.throws(() => validateFlowDefinition(variant), (err) => err instanceof FlowDefinitionError && /unknown field "spawnSubgraph"/.test(err.message));
});

test('R3: unrestricted peer chat has no expressible field -- an operation-level "chat"/"broadcast" field is rejected, and this fixture\'s own declared topology never grants a role-to-role edge outside the 5 named, single-round edges above', () => {
  const definition = loadDefinition();
  const variant = cloneRawFixture(definition);
  variant.spec.operations[0].chatChannel = 'open';
  assert.throws(() => validateFlowDefinition(variant), (err) => err instanceof FlowDefinitionError && /unknown field "chatChannel"/.test(err.message));

  assert.equal(definition.spec.profile.topology.edges.length, 5, 'exactly the 5 named edges this fixture declares -- no additional, undeclared channel exists');
});

// ─── R4: synthesis contract ─────────────────────────────────────────────────

test('R4: recommend-with-dissent is the terminal phase, bound to the synthesizer actor, declared advisory with evidenceRequired "reported" (never asserting the recommendation itself is verified fact)', () => {
  const definition = loadDefinition();
  const op = definition.spec.operations.find((o) => o.id === 'recommend-with-dissent');
  assert.equal(op.result.kind, 'advisory');
  assert.equal(op.result.evidenceRequired, 'reported');
  assert.equal(op.role, 'synthesizer');

  const finalNode = definition.spec.graph.nodes.find((n) => n.id === 'phase-recommendation-with-dissent');
  assert.deepEqual(finalNode.transitions, []);
  assert.equal(finalNode.operations[0].ref, 'recommend-with-dissent');
});

test('R4: evidenceRequired is restricted to the honest {reported, verified} vocabulary -- no third "auto-verified"/upgraded value is expressible; an invalid value is rejected by the REAL validateFlowDefinition', () => {
  const definition = loadDefinition();
  const variant = cloneRawFixture(definition);
  const recommendOp = variant.spec.operations.find((o) => o.id === 'recommend-with-dissent');
  recommendOp.result.evidenceRequired = 'auto-verified';
  assert.throws(() => validateFlowDefinition(variant), (err) => err instanceof FlowDefinitionError && /evidenceRequired must be one of/.test(err.message));
});

test('R4: the synthesis contract\'s 9 required output fields are documented directly alongside the recommend-with-dissent operation declaration (decision criteria, accepted evidence refs, unsupported claims, alternatives, risks, unresolved questions, minority/dissenting positions, missing/failed actors, proposed next action)', () => {
  const raw = fs.readFileSync(FIXTURE_PATH, 'utf8');
  const requiredPhrases = [
    'decision criteria',
    'accepted evidence refs',
    'unsupported claims',
    'alternatives',
    'risks',
    'unresolved questions',
    'minority/dissenting positions',
    'missing/failed actors',
    'a proposed next action',
  ];
  for (const phrase of requiredPhrases) {
    assert.ok(raw.includes(phrase), `fixture must document the required synthesis-contract field: "${phrase}"`);
  }
  assert.ok(/never upgrad|never promote/.test(raw), 'fixture must document the no-evidence-upgrade discipline');
  assert.ok(/never erase/.test(raw), 'fixture must document the no-dissent-erasure discipline');
  assert.ok(/consensus from branch count/.test(raw), 'fixture must document the no-consensus-from-branch-count discipline');
});

test('R4: completion.mode "synthesize" resolves against a real reachable advisory operation (recommend-with-dissent itself, the last node in the chain) -- the schema\'s own reachability requirement is genuinely exercised, not vacuous', () => {
  const definition = loadDefinition();
  assert.equal(definition.spec.profile.completion.mode, 'synthesize');
  // Removing every advisory result.kind from the definition must make the
  // schema's own assertAdvisoryReachableFromEntry check fail -- proves this
  // fixture is not accidentally valid for an unrelated reason.
  const variant = cloneRawFixture(definition);
  for (const op of variant.spec.operations) {
    op.result.kind = 'work-product';
  }
  assert.throws(() => validateFlowDefinition(variant), (err) => err instanceof FlowDefinitionError && /result\.kind "advisory"/.test(err.message));
});
