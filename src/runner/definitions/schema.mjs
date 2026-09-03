// definitions/schema.mjs — pure validator for the FlowDefinition IR: the
// shared, versioned graph/operation/policy shape both the `Workflow` and
// `CoordinationProtocol` profiles project onto, per
// docs/architect/agent-coordination/contracts/flow-definition.md (ADR-009).
//
// Pure data module: no fs, no store writes, no network, no execution --
// mirrors coordination/schema.mjs's own "pure validator, fails closed on
// anything outside the contract's exact field table" shape one layer over.
// FlowDefinition is a distinct, neutral kernel with zero dependency on
// CoordinationSession internals: this module does not import from
// coordination/schema.mjs, and coordination/schema.mjs does not import
// this one either.
//
// Scope: this cell (phase-02 R1-R4) is schema + validators only. It does
// NOT build the Workflow projection adapter, the CoordinationProtocol
// loader, fixture files, or setup/doctor registration -- those are a later
// cell (R5-R8) once this pure kernel is proven correct in isolation.

export const API_VERSION = 'fgos.dev/v1alpha1';
export const KIND = 'FlowDefinition';

export const PROFILE_KINDS = Object.freeze(['Workflow', 'CoordinationProtocol']);

// Order is significant: index is the monotonicity rank PolicyPatch's
// `minTier` uses (contract's PolicyPatch section: "a more specific scope
// may raise the floor, never lower it below a less specific scope's
// requirement") -- ascending strictness, left to right, matching the
// contract's own enum listing order verbatim.
export const MIN_TIER_VALUES = Object.freeze(['lightweight', 'standard', 'creative', 'analytical', 'critical']);
const MIN_TIER_RANK = new Map(MIN_TIER_VALUES.map((tier, index) => [tier, index]));

export const VISIBILITY_VALUES = Object.freeze(['headless', 'visible']);
export const RESULT_KIND_VALUES = Object.freeze(['advisory', 'gate-verdict', 'work-product']);
export const EVIDENCE_REQUIRED_VALUES = Object.freeze(['reported', 'verified']);
export const COMPLETION_MODE_VALUES = Object.freeze(['synthesize', 'all-required', 'explicit-partial']);

// Cognitive aggregation is declared SEPARATELY from `completion.mode`, never
// as another mode value: phase-07's whole point is that completion
// eligibility (mode) and cognitive validation (aggregation) are different
// questions with different authorities. One method only in MVP7 -- "prove one
// honest synthesis method before introducing voting or convergence
// machinery."
export const AGGREGATION_METHOD_VALUES = Object.freeze(['evidence-preserving-synthesis']);
export const CONTEXT_VISIBILITY_VALUES = Object.freeze(['mediated', 'isolated-until-fan-in', 'broadcast']);
export const COHORT_INDEPENDENCE_VALUES = Object.freeze(['isolated-until-fan-in']);

// ADR-008 Decision 5, reaffirmed for FlowDefinition by the contract's own
// "Forbidden Fields Summary" table: no FlowDefinition document carries a
// `missionId` field anywhere, at any nesting depth. Mission stays
// deferred-preserved.
const FORBIDDEN_FIELD_NAMES = new Set(['missionId']);

const ROOT_FIELDS = new Set(['apiVersion', 'kind', 'metadata', 'spec']);
const METADATA_FIELDS = new Set(['id', 'version']);
const SPEC_FIELDS = new Set(['profile', 'graph', 'roles', 'actors', 'operations', 'policy']);

const GRAPH_FIELDS = new Set(['entry', 'nodes']);
// Deliberately no `kind` -- node Stage/Phase identity is DERIVED from
// spec.profile.kind, never a stored field on the node object (ADR-009
// Decision 3). Any explicit `kind` key here is rejected by the whitelist.
const NODE_FIELDS = new Set(['id', 'operations', 'transitions']);
const NODE_OPERATION_REF_FIELDS = new Set(['ref', 'actor', 'activation', 'contextAccess']);
const ACTIVATION_FIELDS = new Set(['mode', 'maxInvocations']);

// `activation` is scoped to the node-operation BINDING, never to the
// reusable `spec.operations[]` template: the same operation id may be
// `required` at one graph position and `driver-authorized` at another
// (contract: flow-definition.md "Activation"). `required` is the default
// whenever `mode` itself is absent -- whether `activation` is omitted
// entirely or present without a `mode` key.
export const ACTIVATION_MODE_VALUES = Object.freeze(['required', 'driver-authorized']);
export const DEFAULT_ACTIVATION_MODE = 'required';

// Deliberately no `purpose` -- V1 omits it on purpose (ADR-009 Decision 5);
// any explicit `purpose` key here is rejected by the whitelist below.
const OPERATION_FIELDS = new Set(['id', 'role', 'capabilities', 'task', 'policy', 'result']);
const OPERATION_TASK_FIELDS = new Set(['taskSpec', 'contractTemplate']);
const OPERATION_RESULT_FIELDS = new Set(['kind', 'evidenceRequired']);

// SessionActor shape (ADR-008): id, declared role, optional persona,
// optional PolicyPatch.
const ACTOR_FIELDS = new Set(['id', 'role', 'persona', 'policy']);

const POLICY_PATCH_FIELDS = new Set(['minTier', 'preferPersona', 'preferExecutor', 'fallbackExecutors', 'visibility']);

const WORKFLOW_PROFILE_FIELDS = new Set(['kind', 'work']);
const WORKFLOW_WORK_FIELDS = new Set(['baseStepMap']);

// `work`/`baseStepMap` absent from this whitelist closes "CoordinationProtocol
// forbidden: profile.work, baseStepMap" structurally, not by naming them.
const PROTOCOL_PROFILE_FIELDS = new Set(['kind', 'completion', 'topology', 'cohort']);
const PROTOCOL_COMPLETION_FIELDS = new Set(['mode', 'aggregation']);
const PROTOCOL_COMPLETION_AGGREGATION_FIELDS = new Set(['method', 'outputOperationRef', 'sourceOperationRefs', 'requiredDisclosures']);
const PROTOCOL_TOPOLOGY_FIELDS = new Set(['contextVisibility', 'edges', 'visibilityWindows']);
const PROTOCOL_TOPOLOGY_EDGE_FIELDS = new Set(['from', 'to', 'intents', 'maxRounds']);
const PROTOCOL_COHORT_FIELDS = new Set(['count', 'distinctProviderFamilies', 'requiredRoles', 'independence']);

// Visibility windows (Step 09 MVP6, candidate contract --
// docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md
// §3 -- schema-shaped only, no runtime enforcement here). Legal only under
// `CoordinationProtocol` because `visibilityWindows` lives inside
// `topology`, and `topology` is already absent from WORKFLOW_PROFILE_FIELDS
// -- a `Workflow` profile carrying `topology.visibilityWindows` is rejected
// as an unknown `topology` field before this shape is ever inspected.
const VISIBILITY_WINDOW_FIELDS = new Set(['id', 'opensAfter', 'permits']);
const VISIBILITY_WINDOW_OPENS_AFTER_FIELDS = new Set(['milestone', 'operationRefs']);
const VISIBILITY_WINDOW_PERMITS_FIELDS = new Set(['sourceOperationRefs', 'delivery']);
export const VISIBILITY_WINDOW_MILESTONE_VALUES = Object.freeze(['listed-results-linked']);
export const VISIBILITY_WINDOW_DELIVERY_VALUES = Object.freeze(['artifact-refs']);

// `contextAccess` is a graph.nodes[].operations[] binding field (same
// binding scope as `activation`), never a spec.operations[] template field.
const CONTEXT_ACCESS_FIELDS = new Set(['visibilityWindowRef']);

/**
 * Error raised by this module. `category` is a stable, caller-inspectable
 * reason -- always `'validation'` today (this module has no replay/store
 * layer to carry a second category), kept as a field rather than a fixed
 * literal so a future category (e.g. a loader-side `'not-found'`) can be
 * added in P02.2 without changing this class's shape.
 */
export class FlowDefinitionError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'FlowDefinitionError';
    this.category = category;
  }
}

function fail(reason) {
  throw new FlowDefinitionError('validation', `flow-definition: ${reason}`);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function assertOnlyAcceptedFields(obj, accepted, label) {
  for (const key of Object.keys(obj)) {
    if (!accepted.has(key)) fail(`${label} has unknown field "${key}"`);
  }
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) {
    fail(`${label} must be an array of non-empty strings`);
  }
}

/**
 * Recursively scan `value` (plain objects and arrays only -- strings,
 * numbers, booleans, null are leaves) for any object key in
 * FORBIDDEN_FIELD_NAMES, at any nesting depth. Mirrors
 * coordination/schema.mjs's assertNoForbiddenFieldsDeep -- same "at any
 * nesting level" requirement, independently implemented so this module
 * carries zero import from coordination/schema.mjs.
 */
function assertNoForbiddenFieldsDeep(value, label, seen = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) assertNoForbiddenFieldsDeep(item, label, seen);
    return;
  }
  if (!isPlainObject(value)) return;
  if (seen.has(value)) return; // defensive: never loop forever on a cyclic input
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_FIELD_NAMES.has(key)) {
      fail(`${label} carries a forbidden field "${key}" -- rejected at validation (ADR-008 Decision 5 / flow-definition.md "Forbidden Fields Summary")`);
    }
    assertNoForbiddenFieldsDeep(value[key], label, seen);
  }
}

function assertMinTierNotLowered(floorTier, candidateTier, label) {
  if (floorTier === undefined || candidateTier === undefined) return;
  if (MIN_TIER_RANK.get(candidateTier) < MIN_TIER_RANK.get(floorTier)) {
    fail(`${label}.minTier ("${candidateTier}") would lower the floor already set by a less specific scope ("${floorTier}") -- PolicyPatch minTier is monotonic (raise only)`);
  }
}

/**
 * Validate one PolicyPatch fragment against the contract's exact field
 * table. Returns a frozen, normalized copy -- never the input object.
 * Throws FlowDefinitionError on an unknown field or an invalid value.
 */
function validatePolicyPatch(policy, label) {
  if (!isPlainObject(policy)) fail(`${label} must be an object`);
  assertOnlyAcceptedFields(policy, POLICY_PATCH_FIELDS, label);

  const result = {};

  if (policy.minTier !== undefined) {
    if (!MIN_TIER_RANK.has(policy.minTier)) fail(`${label}.minTier must be one of ${MIN_TIER_VALUES.join(' | ')}`);
    result.minTier = policy.minTier;
  }
  if (policy.preferPersona !== undefined) {
    if (!isNonEmptyString(policy.preferPersona)) fail(`${label}.preferPersona must be a non-empty string when provided`);
    result.preferPersona = policy.preferPersona;
  }
  if (policy.preferExecutor !== undefined) {
    if (!isNonEmptyString(policy.preferExecutor)) fail(`${label}.preferExecutor must be a non-empty string when provided`);
    result.preferExecutor = policy.preferExecutor;
  }
  if (policy.fallbackExecutors !== undefined) {
    // `reserved-not-executed` in V1 (contract): parseable, never a flag
    // implying automatic failover. Validated as a plain string list only --
    // no execution-intent field exists anywhere in this shape to carry
    // that implication.
    assertStringArray(policy.fallbackExecutors, `${label}.fallbackExecutors`);
    result.fallbackExecutors = Object.freeze([...policy.fallbackExecutors]);
  }
  if (policy.visibility !== undefined) {
    if (!VISIBILITY_VALUES.includes(policy.visibility)) fail(`${label}.visibility must be one of ${VISIBILITY_VALUES.join(' | ')}`);
    result.visibility = policy.visibility;
  }

  return Object.freeze(result);
}

/**
 * Merge an ordered stack of PolicyPatch fragments -- least-specific scope
 * first, most-specific scope last, per the contract's own provenance scope
 * order (`runner < definition < node < operation < role < actor <
 * assignment < cli < governance`) -- into one resolved PolicyPatch.
 * `minTier` is monotonic: a later (more specific) entry may only raise it,
 * never lower it below what an earlier entry already established; every
 * other field is most-specific-wins. Pure; throws FlowDefinitionError on a
 * lowering attempt. Exported for reuse by a later execution-time policy
 * resolver (out of this cell's scope, which only validates the PolicyPatch
 * input shape itself -- provenance recording is not implemented here).
 *
 * @param {{scope: string, source?: string, policy: object}[]} scopedPatches
 * @returns {Readonly<object>} the resolved PolicyPatch
 */
export function mergePolicyStack(scopedPatches) {
  if (!Array.isArray(scopedPatches)) fail('mergePolicyStack expects an array of { scope, source, policy } entries');

  const resolved = {};
  let resolvedMinTierLabel = null;

  for (const entry of scopedPatches) {
    if (!isPlainObject(entry)) fail('mergePolicyStack entries must be objects');
    if (!isNonEmptyString(entry.scope)) fail('mergePolicyStack entry.scope must be a non-empty string');
    const label = `policy stack entry (scope: "${entry.scope}"${isNonEmptyString(entry.source) ? `, source: "${entry.source}"` : ''})`;
    const validated = validatePolicyPatch(entry.policy ?? {}, label);

    if (validated.minTier !== undefined) {
      if (resolved.minTier !== undefined && MIN_TIER_RANK.get(validated.minTier) < MIN_TIER_RANK.get(resolved.minTier)) {
        fail(`${label} sets minTier "${validated.minTier}", lower than the floor "${resolved.minTier}" already set by ${resolvedMinTierLabel} -- PolicyPatch minTier is monotonic (raise only)`);
      }
      resolved.minTier = validated.minTier;
      resolvedMinTierLabel = label;
    }
    for (const key of ['preferPersona', 'preferExecutor', 'visibility']) {
      if (validated[key] !== undefined) resolved[key] = validated[key];
    }
    if (validated.fallbackExecutors !== undefined) resolved.fallbackExecutors = validated.fallbackExecutors;
  }

  return Object.freeze(resolved);
}

function validateMetadata(metadata) {
  if (!isPlainObject(metadata)) fail('metadata must be a non-null object');
  assertOnlyAcceptedFields(metadata, METADATA_FIELDS, 'metadata');
  if (!isNonEmptyString(metadata.id)) fail('metadata.id must be a non-empty string');

  const result = { id: metadata.id };
  // `version` is required "for reusable/reference-stable" definitions per
  // the contract -- a context-dependent rule this pure schema cannot
  // decide on its own, so it stays optional here and is only type-checked
  // when present. A future loader (P02.2) that knows whether a given
  // definition is being loaded as a reusable reference can enforce the
  // stronger rule at that point.
  if (metadata.version !== undefined) {
    if (!isNonEmptyString(metadata.version)) fail('metadata.version must be a non-empty string when provided');
    result.version = metadata.version;
  }
  return Object.freeze(result);
}

function validateTopologyEdge(edge, label) {
  if (!isPlainObject(edge)) fail(`${label} must be an object`);
  assertOnlyAcceptedFields(edge, PROTOCOL_TOPOLOGY_EDGE_FIELDS, label);
  if (!isNonEmptyString(edge.from)) fail(`${label}.from must be a non-empty string`);
  if (!isNonEmptyString(edge.to)) fail(`${label}.to must be a non-empty string`);

  const result = { from: edge.from, to: edge.to };
  if (edge.intents !== undefined) {
    assertStringArray(edge.intents, `${label}.intents`);
    result.intents = Object.freeze([...edge.intents]);
  }
  if (edge.maxRounds !== undefined) {
    if (!isPositiveInteger(edge.maxRounds)) fail(`${label}.maxRounds must be a positive integer when provided`);
    result.maxRounds = edge.maxRounds;
  }
  return Object.freeze(result);
}

/**
 * Validate one `spec.profile.topology.visibilityWindows[]` entry against
 * its exact field table. Cross-referential checks (operationRefs/
 * sourceOperationRefs resolving to a real spec.operations[] id, duplicate
 * window id) happen after this shape check -- the former needs `operations`,
 * which is not computed yet at profile-validation time (see validateSpec).
 */
function validateVisibilityWindow(window, label) {
  if (!isPlainObject(window)) fail(`${label} must be an object`);
  assertOnlyAcceptedFields(window, VISIBILITY_WINDOW_FIELDS, label);
  if (!isNonEmptyString(window.id)) fail(`${label}.id must be a non-empty string`);

  if (!isPlainObject(window.opensAfter)) fail(`${label}.opensAfter must be an object`);
  assertOnlyAcceptedFields(window.opensAfter, VISIBILITY_WINDOW_OPENS_AFTER_FIELDS, `${label}.opensAfter`);
  if (!VISIBILITY_WINDOW_MILESTONE_VALUES.includes(window.opensAfter.milestone)) {
    fail(`${label}.opensAfter.milestone must be one of ${VISIBILITY_WINDOW_MILESTONE_VALUES.join(' | ')}`);
  }
  assertStringArray(window.opensAfter.operationRefs, `${label}.opensAfter.operationRefs`);

  if (!isPlainObject(window.permits)) fail(`${label}.permits must be an object`);
  assertOnlyAcceptedFields(window.permits, VISIBILITY_WINDOW_PERMITS_FIELDS, `${label}.permits`);
  assertStringArray(window.permits.sourceOperationRefs, `${label}.permits.sourceOperationRefs`);
  if (!VISIBILITY_WINDOW_DELIVERY_VALUES.includes(window.permits.delivery)) {
    fail(`${label}.permits.delivery must be one of ${VISIBILITY_WINDOW_DELIVERY_VALUES.join(' | ')}`);
  }

  return Object.freeze({
    id: window.id,
    opensAfter: Object.freeze({
      milestone: window.opensAfter.milestone,
      operationRefs: Object.freeze([...window.opensAfter.operationRefs]),
    }),
    permits: Object.freeze({
      sourceOperationRefs: Object.freeze([...window.permits.sourceOperationRefs]),
      delivery: window.permits.delivery,
    }),
  });
}

/**
 * Validate `spec.profile.completion.aggregation` -- the cognitive-aggregation
 * declaration, which is INDEPENDENT of `completion.mode`. Declaring it changes
 * nothing about how `mode` is validated, defaulted, or interpreted; a
 * definition that omits it produces a byte-identical `completion` object to
 * the one this schema produced before aggregation existed.
 *
 * Cross-referential checks (every operation ref resolving to a real
 * `spec.operations[]` id) happen after `operations` is computed, in
 * `assertAggregationReferencesRealOperations` -- the same split
 * `validateVisibilityWindow` already uses for the same reason.
 *
 * `sourceOperationRefs` must be NON-EMPTY, and `outputOperationRef` must not
 * appear among them. An aggregate declaring zero sources, or declaring itself
 * as one of its own sources, is self-validated truth by construction -- it
 * would let a synthesis operation's own output stand as the evidence that
 * validates it. Refused here at the earliest possible layer, so no session
 * ever gets the chance to record such an aggregation as validated.
 */
function validateAggregationDeclaration(aggregation, label) {
  if (!isPlainObject(aggregation)) fail(`${label} must be an object when provided`);
  assertOnlyAcceptedFields(aggregation, PROTOCOL_COMPLETION_AGGREGATION_FIELDS, label);

  if (!AGGREGATION_METHOD_VALUES.includes(aggregation.method)) {
    fail(`${label}.method must be one of ${AGGREGATION_METHOD_VALUES.join(' | ')}`);
  }
  if (!isNonEmptyString(aggregation.outputOperationRef)) {
    fail(`${label}.outputOperationRef must be a non-empty string`);
  }
  assertStringArray(aggregation.sourceOperationRefs, `${label}.sourceOperationRefs`);
  if (aggregation.sourceOperationRefs.length === 0) {
    fail(`${label}.sourceOperationRefs must name at least one source operation -- an aggregation with no declared sources is self-validated truth`);
  }
  if (aggregation.sourceOperationRefs.includes(aggregation.outputOperationRef)) {
    fail(
      `${label}.outputOperationRef "${aggregation.outputOperationRef}" also appears in ${label}.sourceOperationRefs -- an aggregation may not cite its own output operation as one of its own sources`,
    );
  }
  assertStringArray(aggregation.requiredDisclosures, `${label}.requiredDisclosures`);

  return Object.freeze({
    method: aggregation.method,
    outputOperationRef: aggregation.outputOperationRef,
    sourceOperationRefs: Object.freeze([...aggregation.sourceOperationRefs]),
    requiredDisclosures: Object.freeze([...aggregation.requiredDisclosures]),
  });
}

function validateWorkflowProfile(profile) {
  assertOnlyAcceptedFields(profile, WORKFLOW_PROFILE_FIELDS, 'spec.profile');
  const result = { kind: 'Workflow' };

  if (profile.work !== undefined) {
    if (!isPlainObject(profile.work)) fail('spec.profile.work must be an object when provided');
    assertOnlyAcceptedFields(profile.work, WORKFLOW_WORK_FIELDS, 'spec.profile.work');
    const work = {};
    if (profile.work.baseStepMap !== undefined) {
      if (!isPlainObject(profile.work.baseStepMap)) fail('spec.profile.work.baseStepMap must be an object when provided');
      // Built on a null-prototype object, not `{}` -- a stageId of
      // "__proto__" (or any other Object.prototype-shadowing key) would
      // otherwise hit the inherited `__proto__` accessor setter on plain
      // `{}` instead of creating an own property. Since the assigned value
      // is always a string, that setter silently no-ops, and the entry
      // would vanish from the frozen output with no error thrown --
      // contradicting this module's fail-closed invariant. A null
      // prototype has no such accessor, so bracket assignment always
      // creates a real own property regardless of key name.
      const baseStepMap = Object.create(null);
      for (const [stageId, baseStepId] of Object.entries(profile.work.baseStepMap)) {
        if (!isNonEmptyString(stageId) || !isNonEmptyString(baseStepId)) {
          fail('spec.profile.work.baseStepMap keys and values must be non-empty strings');
        }
        baseStepMap[stageId] = baseStepId;
      }
      work.baseStepMap = Object.freeze(baseStepMap);
    }
    result.work = Object.freeze(work);
  }

  return Object.freeze(result);
}

function validateProtocolProfile(profile) {
  assertOnlyAcceptedFields(profile, PROTOCOL_PROFILE_FIELDS, 'spec.profile');
  const result = { kind: 'CoordinationProtocol' };

  if (profile.completion !== undefined) {
    if (!isPlainObject(profile.completion)) fail('spec.profile.completion must be an object when provided');
    assertOnlyAcceptedFields(profile.completion, PROTOCOL_COMPLETION_FIELDS, 'spec.profile.completion');
    if (!COMPLETION_MODE_VALUES.includes(profile.completion.mode)) {
      fail(`spec.profile.completion.mode must be one of ${COMPLETION_MODE_VALUES.join(' | ')}`);
    }
    const completion = { mode: profile.completion.mode };
    if (profile.completion.aggregation !== undefined) {
      completion.aggregation = validateAggregationDeclaration(profile.completion.aggregation, 'spec.profile.completion.aggregation');
    }
    result.completion = Object.freeze(completion);
  }

  if (profile.topology !== undefined) {
    if (!isPlainObject(profile.topology)) fail('spec.profile.topology must be an object when provided');
    assertOnlyAcceptedFields(profile.topology, PROTOCOL_TOPOLOGY_FIELDS, 'spec.profile.topology');
    const topology = {};
    if (profile.topology.contextVisibility !== undefined) {
      if (!CONTEXT_VISIBILITY_VALUES.includes(profile.topology.contextVisibility)) {
        fail(`spec.profile.topology.contextVisibility must be one of ${CONTEXT_VISIBILITY_VALUES.join(' | ')}`);
      }
      topology.contextVisibility = profile.topology.contextVisibility;
    }
    if (profile.topology.edges !== undefined) {
      if (!Array.isArray(profile.topology.edges)) fail('spec.profile.topology.edges must be an array when provided');
      topology.edges = Object.freeze(
        profile.topology.edges.map((edge, i) => validateTopologyEdge(edge, `spec.profile.topology.edges[${i}]`)),
      );
    }
    if (profile.topology.visibilityWindows !== undefined) {
      if (!Array.isArray(profile.topology.visibilityWindows)) {
        fail('spec.profile.topology.visibilityWindows must be an array when provided');
      }
      const seenWindowIds = new Set();
      topology.visibilityWindows = Object.freeze(
        profile.topology.visibilityWindows.map((window, i) => {
          const validated = validateVisibilityWindow(window, `spec.profile.topology.visibilityWindows[${i}]`);
          if (seenWindowIds.has(validated.id)) {
            fail(`spec.profile.topology.visibilityWindows carries duplicate window id "${validated.id}"`);
          }
          seenWindowIds.add(validated.id);
          return validated;
        }),
      );
    }
    result.topology = Object.freeze(topology);
  }

  if (profile.cohort !== undefined) {
    if (!isPlainObject(profile.cohort)) fail('spec.profile.cohort must be an object when provided');
    assertOnlyAcceptedFields(profile.cohort, PROTOCOL_COHORT_FIELDS, 'spec.profile.cohort');
    const cohort = {};
    if (profile.cohort.count !== undefined) {
      if (!isPositiveInteger(profile.cohort.count)) fail('spec.profile.cohort.count must be a positive integer when provided');
      cohort.count = profile.cohort.count;
    }
    if (profile.cohort.distinctProviderFamilies !== undefined) {
      if (!isPositiveInteger(profile.cohort.distinctProviderFamilies)) {
        fail('spec.profile.cohort.distinctProviderFamilies must be a positive integer when provided');
      }
      cohort.distinctProviderFamilies = profile.cohort.distinctProviderFamilies;
    }
    if (profile.cohort.requiredRoles !== undefined) {
      assertStringArray(profile.cohort.requiredRoles, 'spec.profile.cohort.requiredRoles');
      cohort.requiredRoles = Object.freeze([...profile.cohort.requiredRoles]);
    }
    if (profile.cohort.independence !== undefined) {
      if (!COHORT_INDEPENDENCE_VALUES.includes(profile.cohort.independence)) {
        fail(`spec.profile.cohort.independence must be one of ${COHORT_INDEPENDENCE_VALUES.join(' | ')}`);
      }
      cohort.independence = profile.cohort.independence;
    }
    result.cohort = Object.freeze(cohort);
  }

  return Object.freeze(result);
}

function validateProfile(profile) {
  if (!isPlainObject(profile)) fail('spec.profile must be a non-null object');
  if (!PROFILE_KINDS.includes(profile.kind)) fail(`spec.profile.kind must be one of ${PROFILE_KINDS.join(' | ')}`);
  return profile.kind === 'Workflow' ? validateWorkflowProfile(profile) : validateProtocolProfile(profile);
}

function validateRoles(roles) {
  if (!Array.isArray(roles)) fail('spec.roles must be an array of role ids');
  const seen = new Set();
  const result = roles.map((roleId, i) => {
    if (!isNonEmptyString(roleId)) fail(`spec.roles[${i}] must be a non-empty string`);
    if (seen.has(roleId)) fail(`spec.roles carries duplicate role id "${roleId}"`);
    seen.add(roleId);
    return roleId;
  });
  return Object.freeze(result);
}

function validateActors(actors, roleSet) {
  if (actors === undefined) return undefined;
  if (!Array.isArray(actors)) fail('spec.actors must be an array when provided');

  const seenIds = new Set();
  const result = actors.map((actor, i) => {
    const label = `spec.actors[${i}]`;
    if (!isPlainObject(actor)) fail(`${label} must be an object`);
    assertOnlyAcceptedFields(actor, ACTOR_FIELDS, label);
    if (!isNonEmptyString(actor.id)) fail(`${label}.id must be a non-empty string`);
    if (seenIds.has(actor.id)) fail(`spec.actors carries duplicate actor id "${actor.id}"`);
    seenIds.add(actor.id);
    if (!isNonEmptyString(actor.role)) fail(`${label}.role must be a non-empty string`);
    // No implicit Role creation from an actor declaration (contract,
    // "Both profiles reject ... a spec.actors[] entry whose role is not
    // declared in spec.roles").
    if (!roleSet.has(actor.role)) fail(`${label}.role "${actor.role}" is not declared in spec.roles`);

    const entry = { id: actor.id, role: actor.role };
    if (actor.persona !== undefined) {
      if (!isNonEmptyString(actor.persona)) fail(`${label}.persona must be a non-empty string when provided`);
      entry.persona = actor.persona;
    }
    if (actor.policy !== undefined) {
      entry.policy = validatePolicyPatch(actor.policy, `${label}.policy`);
    }
    return Object.freeze(entry);
  });

  return Object.freeze(result);
}

function validateOperations(operations, roleSet, profileKind) {
  if (!Array.isArray(operations) || operations.length === 0) fail('spec.operations must be a non-empty array');

  const seenIds = new Set();
  const result = operations.map((op, i) => {
    const label = `spec.operations[${i}]`;
    if (!isPlainObject(op)) fail(`${label} must be an object`);
    // `activation` gets its own named rejection rather than falling through
    // to the generic unknown-field message below: the contract states the
    // rule positively ("activation on the shared operation template itself
    // is not a legal field and must be rejected"), and a reader hitting it
    // needs to know WHERE the field does belong.
    if (op.activation !== undefined) {
      fail(`${label} declares "activation", which is scoped to a graph.nodes[].operations[] binding, never to a reusable spec.operations[] template`);
    }
    // Whitelist excludes `purpose` -- an operation declaring it is
    // rejected here as an unknown field (ADR-009 Decision 5).
    assertOnlyAcceptedFields(op, OPERATION_FIELDS, label);
    if (!isNonEmptyString(op.id)) fail(`${label}.id must be a non-empty string`);
    if (seenIds.has(op.id)) fail(`spec.operations carries duplicate operation id "${op.id}"`);
    seenIds.add(op.id);
    if (!isNonEmptyString(op.role)) fail(`${label}.role must be a non-empty string`);
    if (!roleSet.has(op.role)) fail(`${label}.role "${op.role}" is not declared in spec.roles`);

    const result0 = { id: op.id, role: op.role };

    if (op.capabilities !== undefined) {
      assertStringArray(op.capabilities, `${label}.capabilities`);
      result0.capabilities = Object.freeze([...op.capabilities]);
    }

    if (op.task !== undefined) {
      if (!isPlainObject(op.task)) fail(`${label}.task must be an object when provided`);
      assertOnlyAcceptedFields(op.task, OPERATION_TASK_FIELDS, `${label}.task`);
      const task = {};
      if (op.task.taskSpec !== undefined) {
        if (!isNonEmptyString(op.task.taskSpec)) fail(`${label}.task.taskSpec must be a non-empty string when provided`);
        task.taskSpec = op.task.taskSpec;
      }
      if (op.task.contractTemplate !== undefined) {
        if (!isNonEmptyString(op.task.contractTemplate)) fail(`${label}.task.contractTemplate must be a non-empty string when provided`);
        task.contractTemplate = op.task.contractTemplate;
      }
      result0.task = Object.freeze(task);
    }

    if (op.policy !== undefined) {
      result0.policy = validatePolicyPatch(op.policy, `${label}.policy`);
    }

    if (op.result !== undefined) {
      if (!isPlainObject(op.result)) fail(`${label}.result must be an object when provided`);
      assertOnlyAcceptedFields(op.result, OPERATION_RESULT_FIELDS, `${label}.result`);
      if (!RESULT_KIND_VALUES.includes(op.result.kind)) {
        fail(`${label}.result.kind must be one of ${RESULT_KIND_VALUES.join(' | ')}`);
      }
      // `gate-verdict` is legal only under the Workflow profile (contract's
      // Profiles + Forbidden Fields Summary).
      if (op.result.kind === 'gate-verdict' && profileKind !== 'Workflow') {
        fail(`${label}.result.kind "gate-verdict" is legal only under the Workflow profile (profile is "${profileKind}")`);
      }
      const resultShape = { kind: op.result.kind };
      if (op.result.evidenceRequired !== undefined) {
        if (!EVIDENCE_REQUIRED_VALUES.includes(op.result.evidenceRequired)) {
          fail(`${label}.result.evidenceRequired must be one of ${EVIDENCE_REQUIRED_VALUES.join(' | ')}`);
        }
        resultShape.evidenceRequired = op.result.evidenceRequired;
      }
      result0.result = Object.freeze(resultShape);
    }

    return Object.freeze(result0);
  });

  return Object.freeze(result);
}

function validateActivation(activation, label) {
  if (!isPlainObject(activation)) fail(`${label} must be an object when provided`);
  assertOnlyAcceptedFields(activation, ACTIVATION_FIELDS, label);

  const result = { mode: DEFAULT_ACTIVATION_MODE };
  if (activation.mode !== undefined) {
    if (!ACTIVATION_MODE_VALUES.includes(activation.mode)) {
      fail(`${label}.mode must be one of ${ACTIVATION_MODE_VALUES.join(' | ')}`);
    }
    result.mode = activation.mode;
  }
  if (activation.maxInvocations !== undefined) {
    if (!isPositiveInteger(activation.maxInvocations)) fail(`${label}.maxInvocations must be a positive integer when provided`);
    result.maxInvocations = activation.maxInvocations;
  }
  return Object.freeze(result);
}

/**
 * The activation mode governing one node-operation binding, applying the
 * contract's default rule in exactly one place: `required` whenever `mode`
 * itself is absent (no `activation` at all, or an `activation` object with
 * no `mode` key). Accepts either a validated binding from
 * `validateFlowDefinition` or a raw one, so a caller never has to re-derive
 * the default and drift from it.
 */
export function activationModeOf(binding) {
  return binding?.activation?.mode ?? DEFAULT_ACTIVATION_MODE;
}

/**
 * `contextAccess.visibilityWindowRef` is a CoordinationProtocol-only
 * binding field -- rejected explicitly on any other profile kind rather
 * than left to fall through to "unknown window ref" (windowIds is always
 * empty for a non-CoordinationProtocol profile, so the fallthrough would
 * still reject, but with a message that hides the real reason).
 */
function validateContextAccess(contextAccess, label, windowIds) {
  if (!isPlainObject(contextAccess)) fail(`${label} must be an object`);
  assertOnlyAcceptedFields(contextAccess, CONTEXT_ACCESS_FIELDS, label);

  const result = {};
  if (contextAccess.visibilityWindowRef !== undefined) {
    if (!isNonEmptyString(contextAccess.visibilityWindowRef)) {
      fail(`${label}.visibilityWindowRef must be a non-empty string when provided`);
    }
    if (!windowIds.has(contextAccess.visibilityWindowRef)) {
      fail(`${label}.visibilityWindowRef "${contextAccess.visibilityWindowRef}" does not reference a declared spec.profile.topology.visibilityWindows[] id`);
    }
    result.visibilityWindowRef = contextAccess.visibilityWindowRef;
  }
  return Object.freeze(result);
}

function validateNodeOperationRef(opRef, label, operationIds, actorIds, profileKind, windowIds) {
  if (!isPlainObject(opRef)) fail(`${label} must be an object`);
  assertOnlyAcceptedFields(opRef, NODE_OPERATION_REF_FIELDS, label);
  if (!isNonEmptyString(opRef.ref)) fail(`${label}.ref must be a non-empty string`);
  if (!operationIds.has(opRef.ref)) fail(`${label}.ref "${opRef.ref}" does not reference a declared spec.operations[] id`);

  const result = { ref: opRef.ref };
  if (opRef.actor !== undefined) {
    if (!isNonEmptyString(opRef.actor)) fail(`${label}.actor must be a non-empty string when provided`);
    if (!actorIds.has(opRef.actor)) fail(`${label}.actor "${opRef.actor}" does not reference a declared spec.actors[] id`);
    result.actor = opRef.actor;
  }
  if (opRef.activation !== undefined) {
    result.activation = validateActivation(opRef.activation, `${label}.activation`);
  }
  if (opRef.contextAccess !== undefined) {
    if (profileKind !== 'CoordinationProtocol') {
      fail(`${label}.contextAccess is legal only under the CoordinationProtocol profile (profile is "${profileKind}")`);
    }
    result.contextAccess = validateContextAccess(opRef.contextAccess, `${label}.contextAccess`, windowIds);
  }
  return Object.freeze(result);
}

function validateGraph(graph, operations, actors, profileKind, windowIds) {
  if (!isPlainObject(graph)) fail('spec.graph must be a non-null object');
  assertOnlyAcceptedFields(graph, GRAPH_FIELDS, 'spec.graph');
  if (!isNonEmptyString(graph.entry)) fail('spec.graph.entry must be a non-empty string');
  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) fail('spec.graph.nodes must be a non-empty array');

  const operationIds = new Set(operations.map((op) => op.id));
  const actorIds = new Set((actors ?? []).map((actor) => actor.id));
  const nodeIds = new Set();

  const nodes = graph.nodes.map((node, i) => {
    const label = `spec.graph.nodes[${i}]`;
    if (!isPlainObject(node)) fail(`${label} must be an object`);
    // Whitelist excludes `kind` -- a node declaring its own `kind` field is
    // rejected here regardless of value (ADR-009 Decision 3).
    assertOnlyAcceptedFields(node, NODE_FIELDS, label);
    if (!isNonEmptyString(node.id)) fail(`${label}.id must be a non-empty string`);
    if (nodeIds.has(node.id)) fail(`spec.graph.nodes carries duplicate node id "${node.id}"`);
    nodeIds.add(node.id);

    let nodeOperations = [];
    if (node.operations !== undefined) {
      if (!Array.isArray(node.operations)) fail(`${label}.operations must be an array when provided`);
      nodeOperations = node.operations.map((opRef, j) => validateNodeOperationRef(opRef, `${label}.operations[${j}]`, operationIds, actorIds, profileKind, windowIds));
    }

    let transitions = [];
    if (node.transitions !== undefined) {
      if (!Array.isArray(node.transitions)) fail(`${label}.transitions must be an array when provided`);
      transitions = node.transitions.map((t, j) => {
        if (!isNonEmptyString(t)) fail(`${label}.transitions[${j}] must be a non-empty string`);
        return t;
      });
    }

    return Object.freeze({ id: node.id, operations: Object.freeze(nodeOperations), transitions: Object.freeze(transitions) });
  });

  if (!nodeIds.has(graph.entry)) fail(`spec.graph.entry "${graph.entry}" does not reference a declared node id`);
  nodes.forEach((node, i) => {
    node.transitions.forEach((target, j) => {
      if (!nodeIds.has(target)) fail(`spec.graph.nodes[${i}].transitions[${j}] "${target}" does not reference a declared node id`);
    });
  });

  return Object.freeze({ entry: graph.entry, nodes: Object.freeze(nodes) });
}

/**
 * `completion.mode: synthesize` requires at least one operation with
 * `result.kind: advisory` reachable from `spec.graph.entry` (contract's
 * CoordinationProtocol section). Reachability here is plain graph
 * reachability from entry across `transitions` -- not a full every-path
 * cut-vertex analysis; the task instructions for this cell describe the
 * requirement as "no reachable advisory operation," which this satisfies
 * directly. A stronger "on every completion path" reading is a legitimate
 * future tightening, not a regression from this cell's scope.
 */
function assertAdvisoryReachableFromEntry(graph, operations) {
  const advisoryOperationIds = new Set(
    operations.filter((op) => op.result?.kind === 'advisory').map((op) => op.id),
  );
  if (advisoryOperationIds.size === 0) {
    fail('spec.profile.completion.mode "synthesize" requires at least one operation with result.kind "advisory" reachable from spec.graph.entry, but spec.operations declares none');
  }

  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const visited = new Set();
  const queue = [graph.entry];
  let reachable = false;

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    const node = nodesById.get(nodeId);
    if (!node) continue; // dangling refs already rejected upstream; defensive only
    if (node.operations.some((opRef) => advisoryOperationIds.has(opRef.ref))) {
      reachable = true;
      break;
    }
    for (const target of node.transitions) queue.push(target);
  }

  if (!reachable) {
    fail('spec.profile.completion.mode "synthesize" requires at least one operation with result.kind "advisory" reachable from spec.graph.entry, but none is reachable in spec.graph');
  }
}

/**
 * `visibilityWindows[].opensAfter.operationRefs[]` and
 * `.permits.sourceOperationRefs[]` must resolve to a real `spec.operations[]`
 * id declared elsewhere in the same definition -- checked here, after
 * `operations` is computed, rather than inside `validateProtocolProfile`
 * (which runs before `operations` exists in `validateSpec`'s own order).
 */
function assertVisibilityWindowsReferenceRealOperations(profile, operationIds) {
  const windows = profile.topology?.visibilityWindows;
  if (!windows) return;
  windows.forEach((window, i) => {
    const label = `spec.profile.topology.visibilityWindows[${i}]`;
    window.opensAfter.operationRefs.forEach((ref, j) => {
      if (!operationIds.has(ref)) {
        fail(`${label}.opensAfter.operationRefs[${j}] "${ref}" does not reference a declared spec.operations[] id`);
      }
    });
    window.permits.sourceOperationRefs.forEach((ref, j) => {
      if (!operationIds.has(ref)) {
        fail(`${label}.permits.sourceOperationRefs[${j}] "${ref}" does not reference a declared spec.operations[] id`);
      }
    });
  });
}

/**
 * `completion.aggregation`'s `outputOperationRef` and `sourceOperationRefs[]`
 * must resolve to real `spec.operations[]` ids -- checked here, after
 * `operations` is computed, exactly like
 * `assertVisibilityWindowsReferenceRealOperations` above and for the same
 * ordering reason.
 */
function assertAggregationReferencesRealOperations(profile, operationIds) {
  const aggregation = profile.completion?.aggregation;
  if (!aggregation) return;
  const label = 'spec.profile.completion.aggregation';
  if (!operationIds.has(aggregation.outputOperationRef)) {
    fail(`${label}.outputOperationRef "${aggregation.outputOperationRef}" does not reference a declared spec.operations[] id`);
  }
  aggregation.sourceOperationRefs.forEach((ref, i) => {
    if (!operationIds.has(ref)) {
      fail(`${label}.sourceOperationRefs[${i}] "${ref}" does not reference a declared spec.operations[] id`);
    }
  });
}

function validateSpec(spec) {
  if (!isPlainObject(spec)) fail('spec must be a non-null object');
  assertOnlyAcceptedFields(spec, SPEC_FIELDS, 'spec');

  const profile = validateProfile(spec.profile);
  const roles = validateRoles(spec.roles);
  const roleSet = new Set(roles);
  const actors = validateActors(spec.actors, roleSet);
  const operations = validateOperations(spec.operations, roleSet, profile.kind);
  const operationIds = new Set(operations.map((op) => op.id));
  assertVisibilityWindowsReferenceRealOperations(profile, operationIds);
  assertAggregationReferencesRealOperations(profile, operationIds);
  const windowIds = new Set((profile.topology?.visibilityWindows ?? []).map((w) => w.id));
  const graph = validateGraph(spec.graph, operations, actors, profile.kind, windowIds);
  const policy = spec.policy !== undefined ? validatePolicyPatch(spec.policy, 'spec.policy') : undefined;

  // Definition-scope (`spec.policy`) is the least-specific declared scope
  // in a static FlowDefinition document; operation-scope and actor-scope
  // are both more specific (contract's provenance scope order). Neither
  // may lower the floor `spec.policy.minTier` already set.
  if (policy?.minTier !== undefined) {
    operations.forEach((op, i) => {
      if (op.policy?.minTier !== undefined) {
        assertMinTierNotLowered(policy.minTier, op.policy.minTier, `spec.operations[${i}].policy`);
      }
    });
    (actors ?? []).forEach((actor, i) => {
      if (actor.policy?.minTier !== undefined) {
        assertMinTierNotLowered(policy.minTier, actor.policy.minTier, `spec.actors[${i}].policy`);
      }
    });
  }

  if (profile.kind === 'CoordinationProtocol' && profile.completion?.mode === 'synthesize') {
    assertAdvisoryReachableFromEntry(graph, operations);
  }

  const result = { profile, graph, roles, operations };
  if (actors !== undefined) result.actors = actors;
  if (policy !== undefined) result.policy = policy;
  return Object.freeze(result);
}

/**
 * Validate a full FlowDefinition document against the contract's exact
 * field table (Root Shape, Graph, Operation Primitive, both Profiles,
 * PolicyPatch). Returns a frozen, deeply-immutable, normalized structure
 * built from fresh objects -- never a reference into `input`, so `input`
 * itself is left untouched and unfrozen. Throws
 * `FlowDefinitionError('validation', ...)` on the first violation found,
 * naming the exact field path.
 */
export function validateFlowDefinition(input) {
  if (!isPlainObject(input)) fail('input must be a non-null object');
  assertNoForbiddenFieldsDeep(input, 'FlowDefinition');
  assertOnlyAcceptedFields(input, ROOT_FIELDS, 'FlowDefinition');

  if (input.apiVersion !== API_VERSION) fail(`apiVersion must be "${API_VERSION}"`);
  if (input.kind !== KIND) fail(`kind must be "${KIND}"`);

  const metadata = validateMetadata(input.metadata);
  const spec = validateSpec(input.spec);

  return Object.freeze({
    apiVersion: API_VERSION,
    kind: KIND,
    metadata,
    spec,
  });
}
