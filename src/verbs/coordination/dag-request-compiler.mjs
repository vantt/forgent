// DAG request compilation is deliberately pure: validation finishes before
// run.mjs can open a schema-3 session or append a resume event.
import { StoreError } from '../../state/store.mjs';
import { normalizeDagDeclaration } from '../../runner/coordination/dag-declaration.mjs';

function fail(reason) {
  throw new StoreError('validation', `coordination DAG request: ${reason}`);
}

function refLabel(value) {
  if (typeof value !== 'string' || !value.startsWith('$ref:')) return null;
  return value.slice(5).split('.')[0];
}

function addReferenceEdge(edges, value) {
  const source = refLabel(value);
  if (source) edges.add(source);
  return source;
}

function withoutUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, candidate]) => candidate !== undefined));
}

function stable(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function assertAlias(seen, identity, step, name) {
  const payload = stable(withoutUndefined(Object.fromEntries(Object.entries(step).filter(([key]) => key !== 'as' && key !== 'dependsOn'))));
  const prior = seen.get(identity);
  if (prior !== undefined && prior !== payload) fail(`conflicting duplicate ${name} "${identity}" in one DAG request`);
  seen.set(identity, payload);
  return prior !== undefined;
}

// Build the one immutable declaration used by both new-session admission and
// resume equivalence.  `dependsOn` is control precedence; all $ref fields and
// ledger lineage are data precedence. Bare identities are admission-time
// facts: each must be produced by this request or already exist in the
// resumed session's ledger. This keeps an unresolved token from becoming a
// silently missing edge.
export function compileDagRequest(request, { durableLedgerIds = [] } = {}) {
  if (!request.dag) return null;
  if (request.kind !== 'declared-protocol') fail('DAG mode is available only for declared-protocol requests');

  const labels = new Set(request.steps.map((step) => step.as));
  const producerByBareId = new Map();
  const durable = new Set(durableLedgerIds);
  for (const step of request.steps) {
    for (const id of [step.as, ...(step.type === 'contribution' ? [step.contributionId] : step.type === 'human-turn' ? [step.turnId] : [])]) {
      if (producerByBareId.has(id)) fail(`bare ledger identity "${id}" has more than one request producer`);
      producerByBareId.set(id, step.as);
    }
  }

  const nodes = request.steps.map((step) => {
    if (step.type === 'fan-out') fail(`step "${step.as}" is fan-out; fan-out is not admitted in DAG mode`);
    // 'human-turn' included alongside the other step types --
    // the schema door (validateCoordinationRequest) already refuses
    // 'mutation' on a human-turn step (it is not in
    // HUMAN_TURN_STEP_ALLOWED_KEYS), but this compiler is also callable
    // directly without that door running first, so the same rule is
    // re-asserted here in depth.
    if (['operation', 'authorize', 'disposition', 'contribution', 'human-turn'].includes(step.type) && step.mutation !== undefined && step.mutation !== 'read-only') fail(`step "${step.as}" mutation "${String(step.mutation)}" must be exactly "read-only" when present; DAG mode admits read-only steps only`);
    const dependencies = new Set(step.dependsOn ?? []);
    const refs = [];
    if (step.type === 'operation') refs.push(...(step.contextRefs ?? []), step.fromAssignmentId);
    if (step.type === 'authorize') refs.push(...(step.grantedContextRefs ?? []), step.targetArtifactRef);
    if (step.type === 'disposition') refs.push(step.targetRef, ...(step.evidenceRefs ?? []));
    if (step.type === 'contribution') refs.push(step.assignmentId);
    for (const value of refs) {
      if (value === undefined) continue;
      const source = addReferenceEdge(dependencies, value);
      if (!source && !producerByBareId.has(value) && !durable.has(value)) fail(`bare ledger identity "${value}" referenced by step "${step.as}" does not resolve to this request or the resumed session ledger`);
      if (!source && producerByBareId.has(value)) dependencies.add(producerByBareId.get(value));
    }
    // Contribution and human-turn lineage tokens are bare identifiers.  A
    // token produced in this request creates an edge; a durable token is
    // checked by its existing session ledger door when it is not local.
    if (step.type === 'contribution') {
      for (const bare of [...(step.anchors ?? []), step.respondsTo].filter(Boolean)) {
        if (producerByBareId.has(bare)) dependencies.add(producerByBareId.get(bare));
        else if (!durable.has(bare)) fail(`bare ledger identity "${bare}" referenced by step "${step.as}" does not resolve to this request or the resumed session ledger`);
      }
    }
    if (step.type === 'human-turn') {
      for (const bare of step.respondsToRefs ?? []) {
        if (producerByBareId.has(bare)) dependencies.add(producerByBareId.get(bare));
        else if (!durable.has(bare)) fail(`bare ledger identity "${bare}" referenced by step "${step.as}" does not resolve to this request or the resumed session ledger`);
      }
      const earlier = request.steps.find((candidate) => candidate.type === 'human-turn' && candidate.turnOrdinal === step.turnOrdinal - 1);
      if (earlier) dependencies.add(earlier.as);
    }
    const { as, dependsOn, ...rawSemantics } = step;
    const semantics = withoutUndefined(rawSemantics);
    return { id: `node-${as}`, displayLabel: as, semantics, dependsOn: [...dependencies].map((label) => `node-${label}`) };
  });

  // Labels are public request identity. Validate target existence before
  // handing the normalized node ids to the DAG cycle/identity primitive.
  for (const node of nodes) {
    for (const dependency of node.dependsOn) {
      const label = dependency.slice('node-'.length);
      if (!labels.has(label)) fail(`step "${node.displayLabel}" has unknown dependency "${label}"`);
      if (dependency === node.id) fail(`step "${node.displayLabel}" depends on itself`);
    }
  }

  validateAuthorizationAlternation(request.steps, nodes);
  for (const node of nodes) node.dependsOn = [...new Set(node.dependsOn)];
  try {
    return normalizeDagDeclaration({ nodes, continuationPolicy: { mode: 'explicit-contract-required' } });
  } catch (err) {
    fail(err.message);
  }
}

function validateAuthorizationAlternation(steps, nodes) {
  const binding = new Map();
  const taskKeys = new Map();
  const authorizationIds = new Map();
  const invocationKeys = new Map();
  const nodeByLabel = new Map(nodes.map((node) => [node.displayLabel, node]));
  for (const step of steps) {
    if (step.type === 'authorize') {
      let alias = false;
      for (const [name, seen] of [['authorizationId', authorizationIds], ['invocationKey', invocationKeys]]) {
        alias ||= assertAlias(seen, step[name], step, name);
      }
      if (alias) continue;
      const key = `${step.operationId}\u0000${step.targetActorId ?? ''}`;
      const state = binding.get(key) ?? { outstanding: null, lastOperation: null };
      if (state.outstanding) fail(`authorization "${step.as}" creates a second outstanding grant for binding (${step.operationId}, ${step.targetActorId ?? 'default'}); source-order alternation requires ${state.outstanding} -> operation first`);
      state.outstanding = step.as;
      binding.set(key, state);
    }
    if (step.type === 'operation') {
      const taskIdentity = step.taskKey ?? `declared:${step.operationId}`;
      if (assertAlias(taskKeys, taskIdentity, step, 'operation task identity')) continue;
      const candidates = [...binding.entries()].filter(([key, state]) => {
        const [operationId, actorId] = key.split('\u0000');
        return state.outstanding && operationId === step.operationId && (actorId === '' || step.targetActorId === undefined || actorId === step.targetActorId);
      });
      if (candidates.length > 1) fail(`operation "${step.as}" has ambiguous outstanding authorization binding for "${step.operationId}"`);
      const [key, state] = candidates[0] ?? [`${step.operationId}\u0000${step.targetActorId ?? ''}`, binding.get(`${step.operationId}\u0000${step.targetActorId ?? ''}`)];
      if (state?.outstanding) {
        nodeByLabel.get(step.as).dependsOn.push(`node-${state.outstanding}`);
        if (state.lastOperation) nodeByLabel.get(state.outstanding).dependsOn.push(`node-${state.lastOperation}`);
        state.lastOperation = step.as;
        state.outstanding = null;
      }
    }
  }
}
