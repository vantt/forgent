// verbs/coordination/binding.mjs -- Unit I21: pure per-node dispatch binding
// for a declared CoordinationProtocol. Computes, once per actor reachable in
// a FlowDefinition's graph, which executor/invocation a composer should place
// into the request's own `actors[]` roster (the existing, already-trusted
// `cliPolicy` channel `src/verbs/coordination/run.mjs`'s `actorPolicyFields`
// and `src/runner/coordination/session-engine.mjs`'s `dispatchDeclaredOperation`
// already carry to every declared step) -- never a second dispatch mechanism,
// never a decision made inside session-engine.mjs itself.
//
// Precedence per actor (design record §12 item 1, phase-05 Unit I21 Decision
// 1), most specific first:
//   1. an explicit Lead override already present in the caller-supplied
//      `request.actors[]` roster for this actorId -- left untouched here.
//   2. the operation's own `policy.capability` (declared, or derived from
//      `result.kind` when absent) resolved against
//      `runnerConfig.capabilities.<name>.prefer` via the SAME
//      `resolveExecutorAndOverrides` (dispatch/resolve.mjs) a real dispatch
//      re-resolves at execution time -- never a second, independently
//      drifting capability-lookup.
//   3/4. `policy.rigor` (raise-only) and `placementPolicy.readOnlyRedirects`
//      are NOT computed here -- both already apply at their own existing
//      scopes (the operation's own portable `policy.rigor`, and the
//      read-only-redirect gate inside `assignment-runner.mjs`) whenever this
//      module leaves `cliPolicy` empty for an actor, so they remain the
//      safety net underneath an unbound actor exactly as they do today.
//
// Purity: reuses `buildCandidateInventory` (coordination/cohort-planner.mjs)
// for provider-family lookups and `resolveExecutorAndOverrides`
// (dispatch/resolve.mjs) for capability resolution -- never reimplements
// either. No filesystem I/O, no mutation: `runnerConfig` is the caller's
// already-loaded, already-validated runner config section.

import { buildCandidateInventory } from '../../runner/coordination/cohort-planner.mjs';
import { resolveExecutorAndOverrides } from '../../runner/dispatch/resolve.mjs';
import { RunnerConfigError } from '../../runner/dispatch/config.mjs';
import { deriveOperationCapability } from '../../runner/operation-capability.mjs';
export { deriveOperationCapability } from '../../runner/operation-capability.mjs';

export class BindingError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'BindingError';
    this.category = category;
  }
}

function fail(category, message) {
  throw new BindingError(category, message);
}

/**
 * Walk `definition.spec.graph.nodes[]` in declared array order and return
 * one entry per actorId at its FIRST encounter -- `{nodeId, operationId,
 * actorId}`. A `specialistSlotRef` binding (no static `actor`) is skipped:
 * specialist bindings resolve live, at authorize time, never here. Encounter
 * order is what lets `distinctProviderFrom` compare against an
 * ALREADY-BOUND role without a second, explicit dependency graph -- a
 * protocol whose producer role's operation is wired into an earlier node
 * than its reviewer role's (true of every shipped `core/coordination-
 * protocols/*.yaml` fixture today) gets a correctly-ordered binding pass for
 * free. A role wired only into a LATER node than the operation naming it in
 * `distinctProviderFrom` is a documented, accepted limitation (see
 * `resolveDistinctProviderFrom` below), not silently miscomputed.
 */
function discoverFirstActorBindings(definition) {
  const seen = new Set();
  const out = [];
  for (const node of definition.spec.graph.nodes) {
    for (const opRef of node.operations) {
      if (!opRef.actor || seen.has(opRef.actor)) continue;
      seen.add(opRef.actor);
      out.push({ nodeId: node.id, operationId: opRef.ref, actorId: opRef.actor });
    }
  }
  return out;
}


/**
 * Resolve `policy.distinctProviderFrom` (Decision 3) against the provider
 * families already bound earlier in this SAME `bindOperations` call (see
 * `discoverFirstActorBindings`'s own doc comment for the ordering
 * assumption this relies on). A role named in `distinctProviderFrom.roles`
 * that has not been bound yet (a forward reference) cannot be diversified
 * against and is silently skipped -- a real, accepted limitation of this
 * single-pass resolver, not a silent miscomputation: nothing claims to have
 * checked it.
 *
 * @returns {{excludedFamilies: Set<string>, declared: boolean, strength: string|null, roles: string[]}}
 */
function resolveDistinctProviderFromExclusions(operation, actorRoleByActorId, boundProviderFamilyByActorId, actorIdByRole) {
  const dpf = operation.policy?.distinctProviderFrom;
  if (!dpf) return { excludedFamilies: new Set(), declared: false, strength: null, roles: [] };
  const excludedFamilies = new Set();
  for (const roleId of dpf.roles) {
    const otherActorId = actorIdByRole.get(roleId);
    if (otherActorId === undefined) continue;
    const family = boundProviderFamilyByActorId.get(otherActorId);
    if (family !== undefined) excludedFamilies.add(family);
  }
  return { excludedFamilies, declared: true, strength: dpf.strength, roles: dpf.roles };
}

/**
 * Pick a candidate from `pool` (an ordered `{executor, invocation?}[]`,
 * `resolveExecutorAndOverrides`'s own `candidates` shape) whose provider
 * family is NOT in `excludedFamilies`, per `providerFamilyByExecutorId`.
 * Falls back to `pool[0]` when every candidate collides (or provider family
 * is unknown for all of them) -- the caller decides what an unsatisfied
 * exclusion MEANS (refuse vs warn), this function only picks the candidate.
 */
function pickDiverseCandidate(pool, excludedFamilies, providerFamilyByExecutorId) {
  if (excludedFamilies.size === 0) return { chosen: pool[0], diversitySatisfied: true };
  const diverse = pool.find((c) => {
    const family = providerFamilyByExecutorId.get(c.executor);
    return family === undefined || !excludedFamilies.has(family);
  });
  if (diverse) return { chosen: diverse, diversitySatisfied: true };
  return { chosen: pool[0], diversitySatisfied: false };
}

/**
 * Compute one dispatch binding per actor reachable in `definition`'s graph
 * (Decision 1). Pure: throws `BindingError` only for malformed input or an
 * unsatisfiable `required` diversity declaration (`category:
 * 'binding.diversity-unsatisfiable'`); every other outcome (including "no
 * capability resolves for this actor") is returned, never thrown, so a
 * caller can always fall back to today's behavior (Risk/rollback: composer
 * falls back when this module has nothing to say for an actor).
 *
 * @param {object} definition A `validateFlowDefinition`-shaped CoordinationProtocol document.
 * @param {object} [request] `{actors?: Array<{id, executor?, tier?, persona?, invocation?}>}` -- the caller-supplied roster BEFORE this module's own additions; an existing per-actor `executor` is the Lead override (Decision 1 step 1) and is never recomputed.
 * @param {object} runnerConfig The validated runner config's own `runner` section (`executors`, `capabilities`).
 * @param {object} [facts] `{primaryCapability?, domain?, allowDiversityUnsatisfiable?: string[]}` -- caller-declared context this pure resolver cannot derive on its own; `allowDiversityUnsatisfiable` names roles the Lead has explicitly permitted to violate a `required` diversity declaration (Decision 3's own "explicit allow flag").
 * @returns {Readonly<{bindings: ReadonlyArray<object>}>}
 */
export function bindOperations(definition, request = {}, runnerConfig, facts = {}) {
  if (!definition || definition.spec?.profile?.kind !== 'CoordinationProtocol') {
    fail('validation', 'bindOperations requires a validated CoordinationProtocol FlowDefinition (spec.profile.kind must be "CoordinationProtocol")');
  }
  if (!runnerConfig || typeof runnerConfig !== 'object') {
    fail('validation', 'bindOperations requires a runnerConfig object (the validated runner section)');
  }

  const existingActors = Array.isArray(request.actors) ? request.actors : [];
  const existingActorById = new Map(existingActors.map((a) => [a.id, a]));

  const actorIdByRole = new Map(definition.spec.actors.map((a) => [a.role, a.id]));
  const roleByActorId = new Map(definition.spec.actors.map((a) => [a.id, a.role]));

  const candidateInventory = buildCandidateInventory(runnerConfig);
  const providerFamilyByExecutorId = new Map(candidateInventory.map((c) => [c.executorId, c.providerFamily]));

  const discovered = discoverFirstActorBindings(definition);
  const boundProviderFamilyByActorId = new Map();
  const allowDiversityUnsatisfiable = new Set(facts.allowDiversityUnsatisfiable ?? []);

  const bindings = [];

  for (const { nodeId, operationId, actorId } of discovered) {
    const operation = definition.spec.operations.find((op) => op.id === operationId);
    if (!operation) {
      fail('validation', `bindOperations: node "${nodeId}" wires actor "${actorId}" to operation "${operationId}", which is not declared in spec.operations`);
    }
    const role = roleByActorId.get(actorId);

    const existing = existingActorById.get(actorId);
    if (existing?.executor !== undefined) {
      const providerFamily = providerFamilyByExecutorId.get(existing.executor);
      if (providerFamily !== undefined) boundProviderFamilyByActorId.set(actorId, providerFamily);
      bindings.push(Object.freeze({
        actorId, nodeId, operationId, role,
        capability: null,
        bindingSource: 'override',
        cliPolicy: Object.freeze({}),
        providerFamily: providerFamily ?? null,
        diversity: null,
        explanation: `actor "${actorId}" already carries an explicit executor ("${existing.executor}") in the request's own actors[] roster -- left untouched (Decision 1 step 1: Lead override wins)`,
      }));
      continue;
    }

    const { name: capabilityName, source: capabilitySource } = deriveOperationCapability(operation, facts, runnerConfig);
    if (!capabilityName) {
      bindings.push(Object.freeze({
        actorId, nodeId, operationId, role,
        capability: null,
        bindingSource: 'unbound',
        cliPolicy: Object.freeze({}),
        providerFamily: null,
        diversity: null,
        explanation: `actor "${actorId}" (operation "${operationId}", result.kind "${operation.result?.kind ?? 'undeclared'}"): no policy.capability declared and no facts.primaryCapability supplied to derive a work-product fallback -- leaving this actor unbound (rigor/readOnlyRedirects remain the safety net)`,
      }));
      continue;
    }

    let resolved;
    try {
      resolved = resolveExecutorAndOverrides(runnerConfig, capabilityName);
    } catch (err) {
      if (err instanceof RunnerConfigError) {
        fail('validation', `bindOperations: actor "${actorId}" (operation "${operationId}") resolved capability "${capabilityName}" but its config entry is malformed: ${err.message}`);
      }
      throw err;
    }
    // Fix H1 (red-team round 1, corrected in round 2): `resolveExecutorAndOverrides`
    // has THREE resolution branches, only the middle one of which Decision
    // 1.2 ever names as valid ("the operation's own policy.capability
    // resolved against capabilities.<name>.prefer"):
    //   1. a LITERAL `cfg.executors[capabilityName]` entry, checked FIRST,
    //      before `cfg.capabilities` is ever consulted (`bindingSource:
    //      'executor-id'`) -- lets a portable operation's policy.capability
    //      smuggle a pin to any literally registered executor id, the same
    //      class of attack the module's own red-team coverage already
    //      guards against for the literal `preferExecutor` field, just
    //      reachable through a different string.
    //   2. `cfg.capabilities[capabilityName].prefer` (`bindingSource:
    //      'capability.prefer'`) -- the ONLY branch Decision 1.2 names.
    //   3. an executor's own `for` array happening to include
    //      `capabilityName` (`bindingSource: 'capability.for'`), reached
    //      only when neither of the above matches -- this is `decide --for`'s
    //      own orphan-executor reverse-mapping, a purpose-routing fallback
    //      for callers with no capability catalog entry to resolve against,
    //      never a declared capability-catalog resolution. On the real
    //      committed .fgos/config.json this silently rebound EVERY actor of
    //      architecture-advisory-panel-v1's generic "review" capability
    //      (which has no .prefer) onto whichever executor happens to
    //      declare `for: [..., "review"]` (xai's unconfined default
    //      invocation) -- a live confinement regression versus pre-I21
    //      behavior, where these actors were unbound and fell through to
    //      the `readOnlyRedirects` safety net instead (H4, red-team round 2).
    // Only branch 2 counts as a genuine capability resolution; branches 1
    // and 3 are refused the same way `!resolved.configured` already is --
    // fall through to "unbound" so rigor/readOnlyRedirects remain the
    // safety net, never thrown.
    if (!resolved.configured || resolved.bindingSource !== 'capability.prefer') {
      bindings.push(Object.freeze({
        actorId, nodeId, operationId, role,
        capability: capabilityName,
        bindingSource: 'unbound',
        cliPolicy: Object.freeze({}),
        providerFamily: null,
        diversity: null,
        explanation: resolved.bindingSource === 'executor-id'
          ? `actor "${actorId}" (operation "${operationId}"): capability "${capabilityName}" (${capabilitySource}) names a literal registered executor id directly (cfg.executors["${capabilityName}"]) rather than resolving through capabilities.${capabilityName}.prefer -- refusing to treat a bare executor-id match as a valid capability resolution (H1) -- leaving this actor unbound`
          : resolved.bindingSource === 'capability.for'
            ? `actor "${actorId}" (operation "${operationId}"): capability "${capabilityName}" (${capabilitySource}) resolves only through an executor's own declared "for" purpose array, never a declared capabilities.${capabilityName}.prefer -- refusing to treat decide --for's orphan-executor fallback as a valid capability resolution (H4) -- leaving this actor unbound`
            : `actor "${actorId}" (operation "${operationId}"): capability "${capabilityName}" (${capabilitySource}) resolves to nothing registered (no matching executor, no capabilities.${capabilityName}.prefer) -- leaving this actor unbound`,
      }));
      continue;
    }

    const pool = resolved.candidates ?? [{ executor: resolved.executorId, invocation: resolved.invocationId }];
    const exclusions = resolveDistinctProviderFromExclusions(operation, roleByActorId, boundProviderFamilyByActorId, actorIdByRole);
    const { chosen, diversitySatisfied } = pickDiverseCandidate(pool, exclusions.excludedFamilies, providerFamilyByExecutorId);

    if (!diversitySatisfied && exclusions.strength === 'required' && !exclusions.roles.some((r) => allowDiversityUnsatisfiable.has(r))) {
      fail(
        'binding.diversity-unsatisfiable',
        `bindOperations: actor "${actorId}" (role "${role}", operation "${operationId}") requires a provider family distinct from role(s) [${exclusions.roles.join(', ')}], but every candidate for capability "${capabilityName}" resolves to a provider family already used by [${[...exclusions.excludedFamilies].join(', ')}] -- pass facts.allowDiversityUnsatisfiable to override explicitly`,
      );
    }

    if (!runnerConfig.executors || !runnerConfig.executors[chosen.executor]) {
      fail('validation', `bindOperations: actor "${actorId}" (operation "${operationId}") resolved candidate executor "${chosen.executor}" for capability "${capabilityName}", but no such executor is registered`);
    }

    const providerFamily = providerFamilyByExecutorId.get(chosen.executor) ?? null;
    if (providerFamily !== null) boundProviderFamilyByActorId.set(actorId, providerFamily);

    const overriddenExplicitly = !diversitySatisfied && exclusions.strength === 'required' && exclusions.roles.some((r) => allowDiversityUnsatisfiable.has(r));

    bindings.push(Object.freeze({
      actorId, nodeId, operationId, role,
      capability: capabilityName,
      bindingSource: resolved.bindingSource,
      cliPolicy: Object.freeze({
        preferExecutor: chosen.executor,
        ...(chosen.invocation ? { preferInvocation: chosen.invocation } : {}),
      }),
      providerFamily,
      diversity: exclusions.declared
        ? Object.freeze({
            roles: Object.freeze([...exclusions.roles]),
            strength: exclusions.strength,
            satisfied: diversitySatisfied,
            overridden: overriddenExplicitly,
          })
        : null,
      explanation: `actor "${actorId}" (role "${role}", operation "${operationId}") bound to executor "${chosen.executor}" via capability "${capabilityName}" (${capabilitySource} -> ${resolved.bindingSource})${
        exclusions.declared
          ? diversitySatisfied
            ? `; provider-family diversity vs [${exclusions.roles.join(', ')}] satisfied`
            : `; provider-family diversity vs [${exclusions.roles.join(', ')}] NOT satisfied (strength "${exclusions.strength}"${overriddenExplicitly ? ', explicitly overridden by facts.allowDiversityUnsatisfiable' : ''})`
          : ''
      }`,
    }));
  }

  return Object.freeze({ bindings: Object.freeze(bindings) });
}
