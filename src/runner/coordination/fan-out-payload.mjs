// Pure canonical representation of one declared-protocol fan-out payload.
// This is shared by action composition, stale-action validation, and the
// authoritative retry comparator. It is deliberately not a store or ledger.

function copyOptionalArray(value) {
  return value === undefined ? undefined : [...value];
}

export function normalizeFanOutPayloadEntry(branch, {
  fromAssignmentId,
  intent,
  capabilities,
  taskKey,
} = {}) {
  const normalized = {
    actorId: branch.actorId,
    objective: branch.objective,
    expectedOutputs: [...(branch.expectedOutputs ?? [])],
    constraints: [...(branch.constraints ?? [])],
  };
  const effectiveFromAssignmentId = branch.fromAssignmentId ?? fromAssignmentId;
  const effectiveIntent = branch.intent ?? intent;
  const effectiveTaskKey = branch.taskKey ?? taskKey;
  if (effectiveFromAssignmentId !== undefined && effectiveFromAssignmentId !== null) normalized.fromAssignmentId = effectiveFromAssignmentId;
  if (effectiveIntent !== undefined && effectiveIntent !== null) normalized.intent = effectiveIntent;
  if (effectiveTaskKey !== undefined && effectiveTaskKey !== null) normalized.taskKey = effectiveTaskKey;
  const effectiveCapabilities = branch.capabilities ?? capabilities;
  if (effectiveCapabilities !== undefined) normalized.capabilities = [...effectiveCapabilities];
  return normalized;
}

export function normalizeFanOutPayload({ branches, fromAssignmentId, resolveDefaults } = {}) {
  return [...(branches ?? [])]
    .map((branch) => {
      const defaults = typeof resolveDefaults === 'function' ? resolveDefaults(branch) : {};
      return normalizeFanOutPayloadEntry(branch, { fromAssignmentId, ...defaults });
    })
    .sort((a, b) => String(a.actorId).localeCompare(String(b.actorId)));
}

export function normalizePersistedFanOutPayloadEntry(branch) {
  return normalizeFanOutPayloadEntry({
    actorId: branch.actorId,
    objective: branch.objective,
    expectedOutputs: branch.expectedOutputs,
    constraints: branch.constraints,
    capabilities: copyOptionalArray(branch.capabilities),
    fromAssignmentId: branch.fromAssignmentId,
    intent: branch.intent,
    taskKey: branch.taskKey,
  });
}

// JSON cannot preserve an own property whose value is `undefined`. The
// production request validator deliberately keeps optional fields present with
// an undefined value in its normalized step, so retry comparison must preserve
// that distinction explicitly rather than comparing only the intersection of
// fields that happened to survive JSON serialization.
export function canonicalizeNormalizedStep(step) {
  const canonicalize = (value) => {
    if (Array.isArray(value)) return value.map((entry) => canonicalize(entry));
    if (value === null || typeof value !== 'object') return value;
    const result = {};
    const omittedFields = [];
    for (const [key, child] of Object.entries(value)) {
      if (child === undefined) omittedFields.push(key);
      else result[key] = canonicalize(child);
    }
    if (omittedFields.length > 0) result.omittedFields = omittedFields.sort();
    return result;
  };
  return canonicalize(step);
}

export function canonicalizeNormalizedSteps(steps) {
  return [...(steps ?? [])].map((step) => canonicalizeNormalizedStep(step));
}
