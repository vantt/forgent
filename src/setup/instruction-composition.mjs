// instruction-composition.mjs — Effective instruction-set composition (P4)
// (docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md,
//  sections 5-9).
//
// Takes instruction units discovered by instruction-registry.mjs (P3) and composes
// them into a stable, machine-readable effective instruction set for one audience
// (repo, domain-<name>, or component-<name>) and one host (`*` = portable set).
//
// Composition order (section 7):
//   laws -> boundaries -> procedures broad-to-narrow -> preferences broad-to-narrow
//   -> host adapters last.
// Explicit relationships (dependsOn, refines) are honoured inside that order; a
// relationship that would need the reverse order is a conflict, never a reorder.
//
// Relationship semantics (section 5, 6, 8):
//   - `supersedes: [id]` retires the named unit. A law may only be superseded by a
//     platform-authority law; anything else needs the same owner or platform authority.
//     A unit may list its own id to supersede an older copy that shares the id.
//   - `refines: [id]` names the rule(s) this unit acts on; `mode` says how:
//       refine   -> target stays effective, this unit is ordered after it;
//       override -> target's effect is replaced (only `preference` targets, only from a
//                   strictly narrower scope);
//       forbid   -> target's effect is removed (same permission rules as override).
//   - `conflictsWith: [id]` declares mutual exclusion; both active = conflict.
//
// Composition fails (never last-write-wins) on: duplicate active ids without
// supersession, incompatible boundary authority, illegal law override, illegal
// override of a non-overridable rule, missing dependency, incompatible ordering
// without supersession, and mutually exclusive instructions.
//
// This module emits the intermediate representation only. Rendering to AGENTS.md /
// host files, the projection ledger, and doctor projection repair are P5.

import { INSTRUCTION_KINDS, DEFAULT_SCOPE_SPECIFICITY } from './instruction-registry.mjs';

export const EFFECTIVE_SET_SCHEMA_VERSION = 1;

/** Target directory shape from contract section 9; P5 materializes files here. */
export const EFFECTIVE_INSTRUCTIONS_DIR = '.fgos/instructions/effective';

/** Kind rank drives primary ordering (section 7). */
export const COMPOSITION_KIND_ORDER = Object.freeze([
  'law',
  'boundary',
  'procedure',
  'preference',
  'host-adapter',
]);

export const COMPOSITION_CONFLICT_CODES = Object.freeze([
  'DUPLICATE_ACTIVE_ID',
  'INCOMPATIBLE_BOUNDARY_AUTHORITY',
  'ILLEGAL_LAW_OVERRIDE',
  'ILLEGAL_OVERRIDE',
  'MISSING_DEPENDENCY',
  'INCOMPATIBLE_ORDERING',
  'MUTUALLY_EXCLUSIVE',
]);

export const PORTABLE_HOST = '*';

const AUTHORITY_ORDER = Object.freeze({ platform: 0, component: 1, domain: 2 });

const AUTHORITY_SCOPE_RULES = Object.freeze({
  platform: new Set(['repo', 'platform', 'component', 'domain', 'workspace', 'project', 'command', 'skill', 'host', 'session']),
  component: new Set(['component', 'workspace', 'project', 'command', 'skill', 'host', 'session']),
  domain: new Set(['domain', 'workspace', 'project', 'command', 'skill', 'host', 'session']),
});

/** Kinds whose effect an `override`/`forbid` operation may replace. */
const OVERRIDABLE_KINDS = new Set(['preference']);

export class InstructionCompositionError extends Error {
  constructor(message, { code = 'COMPOSITION_CONFLICT', conflicts = [] } = {}) {
    super(message);
    this.name = 'InstructionCompositionError';
    this.code = code;
    this.conflicts = conflicts;
  }
}

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

/**
 * Normalize a composition target to `{ kind, name }`.
 * Accepts `'repo'`, `'domain:coding'`, `'component:x'`, or `{ kind, name }`.
 */
export function normalizeCompositionTarget(target) {
  if (target === undefined || target === null || target === 'repo') {
    return Object.freeze({ kind: 'repo', name: null });
  }
  let kind;
  let name;
  if (typeof target === 'string') {
    const idx = target.indexOf(':');
    kind = idx === -1 ? target : target.slice(0, idx);
    name = idx === -1 ? null : target.slice(idx + 1);
  } else if (target && typeof target === 'object') {
    kind = target.kind;
    name = target.name ?? null;
  }
  if (kind === 'repo' && !name) return Object.freeze({ kind: 'repo', name: null });
  if ((kind === 'domain' || kind === 'component') && typeof name === 'string' && name.trim()) {
    return Object.freeze({ kind, name: name.trim() });
  }
  throw new InstructionCompositionError(
    `Invalid composition target: ${JSON.stringify(target)}. Expected "repo", "domain:<name>", or "component:<name>".`,
    { code: 'INVALID_TARGET' },
  );
}

/** Stable key: `repo`, `domain-<name>`, `component-<name>` (section 9 file stems). */
export function effectiveSetKey(target) {
  const t = normalizeCompositionTarget(target);
  return t.kind === 'repo' ? 'repo' : `${t.kind}-${t.name}`;
}

export function effectiveSetRelativePath(target) {
  return `${EFFECTIVE_INSTRUCTIONS_DIR}/${effectiveSetKey(target)}.json`;
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

function assertUnitShape(unit) {
  if (
    !unit ||
    typeof unit.id !== 'string' ||
    !INSTRUCTION_KINDS.includes(unit.kind) ||
    !unit.authority ||
    !(unit.authority.type in AUTHORITY_ORDER) ||
    typeof unit.owner !== 'string' ||
    !Array.isArray(unit.appliesTo)
  ) {
    throw new InstructionCompositionError(
      `Instruction unit is not a registry-compiled unit: ${JSON.stringify(unit && unit.id)}`,
      { code: 'INVALID_UNIT' },
    );
  }
}

function unitBelongsToTarget(unit, target) {
  if (unit.authority.type === 'platform') return true;
  return target.kind !== 'repo'
    && unit.authority.type === target.kind
    && unit.authority.name === target.name;
}

function unitAppliesToHost(unit, host) {
  if (unit.appliesTo.includes(PORTABLE_HOST)) return true;
  return host !== PORTABLE_HOST && unit.appliesTo.includes(host);
}

/** Two units co-apply when some host is covered by both `appliesTo` lists. */
function coApplies(a, b) {
  if (a.appliesTo.includes(PORTABLE_HOST) || b.appliesTo.includes(PORTABLE_HOST)) return true;
  return a.appliesTo.some((h) => b.appliesTo.includes(h));
}

function kindRank(unit) {
  return COMPOSITION_KIND_ORDER.indexOf(unit.kind);
}

function scopeRank(unit) {
  return DEFAULT_SCOPE_SPECIFICITY[unit.scope] ?? 0;
}

function authorityCanClaimScope(unit) {
  return Boolean(AUTHORITY_SCOPE_RULES[unit.authority.type]?.has(unit.scope));
}

/** Deterministic base ordering: kind, scope, priority, authority, sourcePath, id. */
function compareUnits(a, b) {
  return (kindRank(a) - kindRank(b))
    || (scopeRank(a) - scopeRank(b))
    || (a.specificity - b.specificity)
    || (AUTHORITY_ORDER[a.authority.type] - AUTHORITY_ORDER[b.authority.type])
    || (a.sourcePath < b.sourcePath ? -1 : a.sourcePath > b.sourcePath ? 1 : 0)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/** True when `before` may legally precede `after` under kind + broad-to-narrow order. */
function orderPermits(before, after) {
  const kd = kindRank(before) - kindRank(after);
  if (kd !== 0) return kd < 0;
  const sd = scopeRank(before) - scopeRank(after);
  if (sd !== 0) return sd < 0;
  return before.specificity <= after.specificity;
}

function operationOf(unit) {
  if (unit.mode === 'append') return unit.refines.length ? 'refine' : 'append';
  return unit.mode;
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

/**
 * Evaluate composition for one target/host. Never throws on conflicts; returns
 * `{ ok, conflicts, effectiveSet }` where `effectiveSet` is null when `ok` is false.
 *
 * Options:
 *   - target: 'repo' | 'domain:<name>' | 'component:<name>' | { kind, name } (default repo)
 *   - host: host id or '*' for the portable set (default '*')
 */
export function evaluateInstructionComposition(units, options = {}) {
  const target = normalizeCompositionTarget(options.target);
  const host = typeof options.host === 'string' && options.host.trim() ? options.host.trim() : PORTABLE_HOST;
  const targetKey = effectiveSetKey(target);
  const validSupersessionDecisions = new Set(options.validSupersessionDecisions ?? []);

  const all = [...units];
  for (const u of all) assertUnitShape(u);
  const registryIds = new Set(all.map((u) => u.id));

  const conflicts = [];
  const conflictKeys = new Set();
  const conflict = (code, involved, message) => {
    const ids = [...new Set(involved.map((u) => u.id))].sort();
    const sources = [...new Set(involved.map((u) => u.sourcePath))].sort();
    const key = `${code}|${ids.join(',')}|${message}`;
    if (conflictKeys.has(key)) return;
    conflictKeys.add(key);
    conflicts.push(Object.freeze({ code, target: targetKey, ids, sources, message }));
  };

  // 1. Audience + host selection.
  const inactive = new Map(); // unit -> { reason, by: Set<unit> }
  const deactivate = (unit, reason, by) => {
    if (!inactive.has(unit)) inactive.set(unit, { reason, by: new Set() });
    if (by) inactive.get(unit).by.add(by);
  };
  const candidates = [];
  for (const u of all) {
    if (!unitBelongsToTarget(u, target)) continue;
    if (!authorityCanClaimScope(u)) {
      conflict('ILLEGAL_OVERRIDE', [u], `"${u.id}" authority ${u.authority.toString()} cannot claim scope "${u.scope}"`);
      continue;
    }
    if (!unitAppliesToHost(u, host)) {
      deactivate(u, 'not-applicable', null);
      continue;
    }
    candidates.push(u);
  }
  candidates.sort(compareUnits);

  const candidatesById = new Map();
  for (const u of candidates) {
    if (!candidatesById.has(u.id)) candidatesById.set(u.id, []);
    candidatesById.get(u.id).push(u);
  }

  // 2. Supersession — retires units before any other relationship is read.
  const supersededBy = new Map(); // unit -> Set<unit>
  for (const u of candidates) {
    for (const targetId of u.supersedes) {
      if (!registryIds.has(targetId)) {
        conflict('MISSING_DEPENDENCY', [u], `"${u.id}" supersedes unknown instruction "${targetId}"`);
        continue;
      }
      if (!candidatesById.has(targetId)) {
        conflict('MISSING_DEPENDENCY', [u], `"${u.id}" supersedes "${targetId}", which is not effective in ${targetKey} (host ${host})`);
        continue;
      }
      for (const t of (candidatesById.get(targetId) ?? []).filter((c) => c !== u)) {
        if (t.kind === 'law' && !(u.kind === 'law' && u.authority.type === 'platform')) {
          conflict('ILLEGAL_LAW_OVERRIDE', [u, t],
            `law "${t.id}" may only be superseded by a platform-authority law; "${u.id}" is ${u.kind} under ${u.authority}`);
          continue;
        }
        if (
          t.kind === 'law' &&
          !(u.supersessionDecisionVerified || validSupersessionDecisions.has(u.supersessionDecision))
        ) {
          conflict('ILLEGAL_LAW_OVERRIDE', [u, t],
            `law "${t.id}" may only be superseded with a verified supersessionDecision; "${u.id}" has ${u.supersessionDecision || 'none'}`);
          continue;
        }
        if (t.kind !== 'law' && u.authority.type !== 'platform' && u.owner !== t.owner) {
          conflict('ILLEGAL_OVERRIDE', [u, t],
            `"${u.id}" (${u.authority}) cannot supersede "${t.id}" owned by ${t.authority}`);
          continue;
        }
        if (!supersededBy.has(t)) supersededBy.set(t, new Set());
        supersededBy.get(t).add(u);
      }
    }
  }
  for (const [t, supers] of supersededBy) {
    for (const u of supers) {
      if (supersededBy.get(u)?.has(t)) {
        conflict('INCOMPATIBLE_ORDERING', [u, t], `"${u.id}" and "${t.id}" supersede each other`);
      }
    }
    for (const u of supers) deactivate(t, 'superseded', u);
  }

  let active = candidates.filter((u) => !inactive.has(u));

  // 3. Duplicate active ids.
  const activeById = new Map();
  for (const u of active) {
    if (!activeById.has(u.id)) activeById.set(u.id, []);
    activeById.get(u.id).push(u);
  }
  const ambiguousIds = new Set();
  for (const [id, list] of activeById) {
    if (list.length > 1) {
      ambiguousIds.add(id);
      conflict('DUPLICATE_ACTIVE_ID', list, `instruction id "${id}" is active from ${list.length} sources without supersession`);
    }
  }
  // Resolve an id to its single active unit; null when absent or ambiguous.
  const resolveActive = (id) => {
    if (ambiguousIds.has(id)) return null;
    const list = activeById.get(id);
    return list && list.length === 1 && !inactive.has(list[0]) ? list[0] : null;
  };
  const missing = (u, relation, targetId) => {
    if (!registryIds.has(targetId)) {
      conflict('MISSING_DEPENDENCY', [u], `"${u.id}" ${relation} unknown instruction "${targetId}"`);
    } else if (!ambiguousIds.has(targetId)) {
      conflict('MISSING_DEPENDENCY', [u], `"${u.id}" ${relation} "${targetId}", which is not effective in ${targetKey} (host ${host})`);
    }
  };

  // 4. Override / forbid — narrow-first so a replaced unit's own overrides lapse.
  for (const u of [...active].sort((a, b) => (scopeRank(b) - scopeRank(a)) || (b.specificity - a.specificity))) {
    if (inactive.has(u)) continue;
    const op = operationOf(u);
    if (op !== 'override' && op !== 'forbid') continue;
    if (u.refines.length === 0) {
      conflict('MISSING_DEPENDENCY', [u], `"${u.id}" declares mode "${op}" but names no target in refines`);
      continue;
    }
    for (const targetId of u.refines) {
      const t = resolveActive(targetId);
      if (!t) { missing(u, `${op}s`, targetId); continue; }
      if (t.kind === 'law') {
        conflict('ILLEGAL_LAW_OVERRIDE', [u, t], `"${u.id}" (${u.scope}) attempts to ${op} law "${t.id}"; laws cannot be overridden by narrower scopes`);
        continue;
      }
      if (t.kind === 'boundary') {
        conflict('INCOMPATIBLE_BOUNDARY_AUTHORITY', [u, t], `"${u.id}" attempts to ${op} boundary "${t.id}"; boundary authority conflicts fail instead of picking a winner`);
        continue;
      }
      if (u.kind === 'host-adapter') {
        conflict('ILLEGAL_OVERRIDE', [u, t], `host adapter "${u.id}" cannot ${op} "${t.id}"; host adapters cannot change semantic meaning`);
        continue;
      }
      if (!OVERRIDABLE_KINDS.has(t.kind)) {
        conflict('ILLEGAL_OVERRIDE', [u, t], `"${u.id}" attempts to ${op} ${t.kind} "${t.id}"; only preferences permit override`);
        continue;
      }
      if (scopeRank(u) <= scopeRank(t)) {
        conflict('INCOMPATIBLE_ORDERING', [u, t], `"${u.id}" (scope ${u.scope}) ${op}s "${t.id}" (scope ${t.scope}) at equal or broader scope; no ordered winner without supersession`);
        continue;
      }
      deactivate(t, op === 'override' ? 'overridden' : 'forbidden', u);
    }
  }
  active = active.filter((u) => !inactive.has(u));

  // 5. Refine, dependsOn, conflictsWith against the final active set.
  const edges = new Map(active.map((u) => [u, new Set()])); // before -> Set<after>
  const refinedBy = new Map(active.map((u) => [u, []]));
  const addEdge = (before, after, relation) => {
    if (before === after) {
      conflict('INCOMPATIBLE_ORDERING', [after], `"${after.id}" ${relation} itself`);
      return;
    }
    if (!orderPermits(before, after)) {
      conflict('INCOMPATIBLE_ORDERING', [before, after],
        `"${after.id}" (${after.kind}, specificity ${after.specificity}) ${relation} "${before.id}" (${before.kind}, specificity ${before.specificity}) but composition order places "${after.id}" first`);
      return;
    }
    edges.get(before).add(after);
  };
  const exclusionPairs = new Set();
  for (const u of active) {
    const op = operationOf(u);
    if (op === 'refine') {
      if (u.refines.length === 0) {
        conflict('MISSING_DEPENDENCY', [u], `"${u.id}" declares mode "refine" but names no target in refines`);
      }
      for (const targetId of u.refines) {
        const t = resolveActive(targetId);
        if (!t) { missing(u, 'refines', targetId); continue; }
        if (t.kind === 'boundary' && t.owner !== u.owner) {
          conflict('INCOMPATIBLE_BOUNDARY_AUTHORITY', [u, t], `"${u.id}" (${u.authority}) attempts to refine boundary "${t.id}" owned by ${t.authority}`);
          continue;
        }
        refinedBy.get(t).push(u.id);
        addEdge(t, u, 'refines');
      }
    }
    for (const depId of u.dependsOn) {
      const t = resolveActive(depId);
      if (!t) { missing(u, 'depends on', depId); continue; }
      addEdge(t, u, 'depends on');
    }
    for (const otherId of u.conflictsWith) {
      if (!registryIds.has(otherId)) {
        conflict('MISSING_DEPENDENCY', [u], `"${u.id}" conflicts with unknown instruction "${otherId}"`);
        continue;
      }
      const t = resolveActive(otherId);
      if (!t || t === u || !coApplies(u, t)) continue;
      const pairKey = [u.id, t.id].sort().join('|');
      if (exclusionPairs.has(pairKey)) continue;
      exclusionPairs.add(pairKey);
      if (u.kind === 'boundary' && t.kind === 'boundary') {
        conflict('INCOMPATIBLE_BOUNDARY_AUTHORITY', [u, t], `boundaries "${u.id}" (${u.authority}) and "${t.id}" (${t.authority}) assign incompatible authority`);
      } else {
        conflict('MUTUALLY_EXCLUSIVE', [u, t], `"${u.id}" and "${t.id}" are mutually exclusive and both effective in ${targetKey} (host ${host})`);
      }
    }
  }

  // 6. Ordering — Kahn's algorithm, smallest base key first. Every edge already
  //    points forward in (kind, specificity), so the result honours section 7.
  const indegree = new Map(active.map((u) => [u, 0]));
  for (const afters of edges.values()) for (const a of afters) indegree.set(a, indegree.get(a) + 1);
  const ordered = [];
  const pending = [...active]; // already in compareUnits order
  while (pending.length) {
    const idx = pending.findIndex((u) => indegree.get(u) === 0);
    if (idx === -1) break;
    const [u] = pending.splice(idx, 1);
    ordered.push(u);
    for (const a of edges.get(u)) indegree.set(a, indegree.get(a) - 1);
  }
  if (pending.length) {
    conflict('INCOMPATIBLE_ORDERING', pending, `dependency cycle among: ${pending.map((u) => u.id).sort().join(', ')}`);
  }

  conflicts.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0)
    || (a.ids.join(',') < b.ids.join(',') ? -1 : a.ids.join(',') > b.ids.join(',') ? 1 : 0)
    || (a.message < b.message ? -1 : a.message > b.message ? 1 : 0));

  if (conflicts.length) {
    return { ok: false, conflicts: Object.freeze(conflicts), effectiveSet: null };
  }

  // 7. Intermediate representation — fixed key order so serialization is stable.
  const rules = ordered.map((u) => ({
    id: u.id,
    kind: u.kind,
    mode: u.mode,
    operation: operationOf(u),
    owner: u.owner,
    authority: u.authority.toString(),
    scope: u.scope,
    specificity: u.specificity,
    appliesTo: [...u.appliesTo],
    title: u.title,
    effectiveText: u.body,
    sources: [u.sourcePath],
    dependsOn: [...u.dependsOn],
    refines: [...u.refines],
    refinedBy: [...refinedBy.get(u)].sort(),
    supersedes: [...u.supersedes],
    conflictsWith: [...u.conflictsWith],
    renderHints: { ...u.renderHints },
  }));
  const inactiveRules = [...inactive.entries()]
    .sort(([a], [b]) => compareUnits(a, b))
    .map(([u, state]) => ({
      id: u.id,
      kind: u.kind,
      owner: u.owner,
      sources: [u.sourcePath],
      reason: state.reason,
      by: [...state.by].map((b) => b.id).sort(),
    }));

  const effectiveSet = {
    schemaVersion: EFFECTIVE_SET_SCHEMA_VERSION,
    key: targetKey,
    target: { kind: target.kind, name: target.name },
    host,
    rules,
    inactive: inactiveRules,
  };
  return { ok: true, conflicts: Object.freeze([]), effectiveSet };
}

/**
 * Compose one effective instruction set; throws InstructionCompositionError
 * carrying every detected conflict when composition fails.
 */
export function composeInstructionSet(units, options = {}) {
  const result = evaluateInstructionComposition(units, options);
  if (!result.ok) throw conflictError(result.conflicts);
  return result.effectiveSet;
}

/**
 * Compose every audience the registry implies: `repo`, one set per domain owner,
 * one set per component owner. Returns sets keyed by `effectiveSetKey`; throws
 * with all conflicts across every audience when any audience fails.
 */
export function composeAllInstructionSets(units, options = {}) {
  const all = [...units];
  const targets = [normalizeCompositionTarget('repo')];
  const seen = new Set();
  for (const u of all) {
    assertUnitShape(u);
    if (u.authority.type === 'platform') continue;
    const key = `${u.authority.type}:${u.authority.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push(normalizeCompositionTarget(key));
  }
  targets.sort((a, b) => effectiveSetKey(a).localeCompare(effectiveSetKey(b)));

  const sets = new Map();
  const conflicts = [];
  for (const target of targets) {
    const result = evaluateInstructionComposition(all, { ...options, target });
    if (result.ok) sets.set(result.effectiveSet.key, result.effectiveSet);
    else conflicts.push(...result.conflicts);
  }
  if (conflicts.length) throw conflictError(conflicts);
  return sets;
}

function conflictError(conflicts) {
  const lines = conflicts.map((c) => ` - [${c.code}] ${c.target}: ${c.message}`);
  return new InstructionCompositionError(
    `Instruction composition failed with ${conflicts.length} conflict(s):\n${lines.join('\n')}`,
    { code: 'COMPOSITION_CONFLICT', conflicts },
  );
}

/** Stable JSON form of an effective set (fixed key order, 2-space indent, trailing newline). */
export function serializeEffectiveInstructionSet(effectiveSet) {
  return `${JSON.stringify(effectiveSet, null, 2)}\n`;
}
