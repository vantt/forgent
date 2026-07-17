// dep-graph.mjs — pure cycle detector over the `deps` relation, extended
// (work-graph-intelligence S2a, D f176c18a / D 2ccf9804 mandated roadmap
// step 5) into a DERIVED unified typed-edge graph over `deps` + `parent`.
// Sibling of fsm/frontier/replay: no fs, no appendEvent, no import of
// store.mjs (Domain->Kernel only, never Domain->Infra — an upward import
// here would break test/architecture.test.mjs's one-way-down check).
//
// `deps` is a flat id-array (work.mjs:128-133); `validateDeps` (work.mjs:205)
// only checks that every dep id exists, never that the graph it forms stays
// acyclic. S1 closed that gap for `deps` alone: `findDepCycle` scans a whole
// work view for any cycle already present; `assertNoCycle` checks a
// candidate add/edit against the rest of the view *before* it is admitted
// (wired at the write door in store.mjs). Both S1 exports are UNCHANGED
// below — behavior and signature identical — so store.mjs's existing
// wiring and its tests stay green.
//
// S2a adds a SECOND, unified graph: `deps`+`parent` projected as typed edges
// {from, to, kind} — `deps` entries become `blocks` edges, `parent` becomes
// a `parent-child` edge. This is a DERIVED read-projection over the existing
// fields, never a stored `edges[]` field (no schema change, SCHEMA_VERSION
// unchanged). It formally supersedes the "deps and parent are deliberately
// separate relations" design (work.mjs:164-166, decision 0002): `parent` now
// participates in the acyclic guarantee alongside `deps` (decision record +
// architecture-map update land in a later cell of this slice; this module is
// pure Domain law only).
//
// EDGE DIRECTION is load-bearing and non-obvious: a `deps` entry `d` on item
// `I` yields edge `I -> d` (kind `blocks` — I waits for d). A child `C` with
// `parent` `P` yields edge `P -> C` (kind `parent-child`), derived from
// `C.parent` but pointing FROM the parent TO the child — because frontier.mjs
// (`hasOpenDescendant`) blocks a parent until every descendant under it is
// done: the parent waits for the child, not the reverse. The naive
// child -> parent direction would make a mixed blocks/parent-child cycle
// undetectable.
//
// `waits-for` and `discovered-from` are declared vocabulary only (no
// producer exists yet, see CONTEXT.md) — they contribute NO edge here; that
// is S2b's job once a real stored form + producer exist.
import { WorkValidationError } from './work.mjs';

// Build an id -> deps[] adjacency view from a work map (an object keyed by
// id, same shape as `view.work` — see frontier.mjs). Items with a
// non-array/missing `deps` are treated as having no deps (defensive; shape
// validation is work.mjs's job, not this module's).
function buildAdjacency(workMap) {
  const adjacency = new Map();
  for (const id of Object.keys(workMap ?? {})) {
    const deps = workMap[id]?.deps;
    adjacency.set(id, Array.isArray(deps) ? deps : []);
  }
  return adjacency;
}

// Depth-first walk from `startId` looking for a cycle reachable from it. A
// dep id with no adjacency entry (unknown/not-yet-written) is a dead end,
// not a cycle — existence of dep ids is validateDeps's concern, not this
// module's. Returns the cycle as an array of ids (e.g. ['a', 'b', 'a']) or
// null when no cycle is reachable from `startId`.
function findCycleFrom(startId, adjacency) {
  const onStack = new Set();
  const visited = new Set();
  const path = [];

  function walk(id) {
    visited.add(id);
    onStack.add(id);
    path.push(id);
    for (const dep of adjacency.get(id) ?? []) {
      if (onStack.has(dep)) {
        const startIdx = path.indexOf(dep);
        return path.slice(startIdx).concat(dep);
      }
      if (!visited.has(dep) && adjacency.has(dep)) {
        const found = walk(dep);
        if (found) return found;
      }
    }
    onStack.delete(id);
    path.pop();
    return null;
  }

  return walk(startId);
}

/**
 * Scan a whole work view for any dependency cycle already present. `workMap`
 * is an object keyed by id (e.g. `view.work`), each value carrying a `deps`
 * id-array. Returns the first cycle found as an array of ids (self-loop:
 * `[id, id]`; A<->B: `[a, b, a]`; etc.) or `null` when the graph is acyclic.
 */
export function findDepCycle(workMap) {
  const adjacency = buildAdjacency(workMap);
  for (const id of adjacency.keys()) {
    const cycle = findCycleFrom(id, adjacency);
    if (cycle) return cycle;
  }
  return null;
}

/**
 * Guard a not-yet-admitted `candidate` (a work item with `id` and `deps`)
 * against closing a dependency cycle once merged into `workMap`. Builds the
 * graph from `workMap` plus `candidate` — `candidate` overrides any existing
 * entry for `candidate.id` in `workMap`, so an in-flight edit is checked
 * against its *proposed* deps, not its stored ones — then walks only from
 * `candidate.id` (the sole node whose deps just changed; every other edge in
 * `workMap` was already cycle-free or this guard would have rejected it
 * earlier). Throws `WorkValidationError` (single-arg, per work.mjs:14) with
 * the cycle path composed into the message; returns nothing on success.
 */
export function assertNoCycle(candidate, workMap) {
  const merged = { ...(workMap ?? {}), [candidate.id]: candidate };
  const adjacency = buildAdjacency(merged);
  const cycle = findCycleFrom(candidate.id, adjacency);
  if (cycle) {
    throw new WorkValidationError(
      `work "${candidate.id}" would close a dependency cycle: ${cycle.join(' -> ')}`,
    );
  }
}

// Build an id -> [target ids] adjacency view of the UNIFIED blocking graph
// (blocks + parent-child) from a work map. Every known id gets an entry (even
// with no outgoing edges) so `findCycleFrom` below can walk it; a `parent`
// id that is itself unknown to `workMap` (the live gap noted in CONTEXT.md —
// `validateDeps` checks `deps` existence but nothing checks `parent`
// existence) still gets an adjacency entry via `addEdge`'s auto-vivify, so a
// dangling-parent edge is walkable like any other rather than silently
// dropped. `findCycleFrom` is shared with the deps-only graph above: it only
// ever reads `adjacency.get`/`adjacency.has`, so it works unmodified over
// either adjacency shape.
function buildUnifiedAdjacency(workMap) {
  const adjacency = new Map();
  for (const id of Object.keys(workMap ?? {})) {
    adjacency.set(id, []);
  }
  const addEdge = (from, to) => {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
  };
  for (const id of Object.keys(workMap ?? {})) {
    const item = workMap[id];
    const deps = Array.isArray(item?.deps) ? item.deps : [];
    for (const dep of deps) addEdge(id, dep); // blocks: id -> dep
    const parent = item?.parent;
    if (parent) addEdge(parent, id); // parent-child: parent -> child (parent waits for child)
  }
  return adjacency;
}

/**
 * Project a work view into the unified typed-edge graph: one `{from, to,
 * kind}` entry per `deps` entry (`kind: 'blocks'`) and one per `parent`
 * (`kind: 'parent-child'`, `from` is the PARENT, `to` is the child — see the
 * module header on edge direction). A pure derived read-projection over the
 * existing `deps`/`parent` fields; produces no entry for `waits-for` or
 * `discovered-from` (declared vocabulary only, no producer yet).
 */
export function buildUnifiedEdges(workMap) {
  const edges = [];
  for (const id of Object.keys(workMap ?? {})) {
    const item = workMap[id];
    const deps = Array.isArray(item?.deps) ? item.deps : [];
    for (const dep of deps) {
      edges.push({ from: id, to: dep, kind: 'blocks' });
    }
    const parent = item?.parent;
    if (parent) {
      edges.push({ from: parent, to: id, kind: 'parent-child' });
    }
  }
  return edges;
}

/**
 * Scan a whole work view for any cycle in the UNIFIED blocking graph (blocks
 * + parent-child together) already present. Mirrors `findDepCycle` above but
 * over the unified adjacency, so it catches a pure-deps cycle (the S1 case),
 * a pure parent-child cycle (A parent B, B parent A), and a MIXED cycle (A
 * parent-of B plus B.deps=[A]) that the deps-only `findDepCycle` cannot see.
 * Returns the cycle as an array of ids, or `null` when the unified graph is
 * acyclic.
 */
export function findUnifiedCycle(workMap) {
  const adjacency = buildUnifiedAdjacency(workMap);
  for (const id of adjacency.keys()) {
    const cycle = findCycleFrom(id, adjacency);
    if (cycle) return cycle;
  }
  return null;
}

/**
 * Guard a not-yet-admitted `candidate` against closing a cycle in the
 * UNIFIED blocking graph (blocks + parent-child) once merged into `workMap`.
 * Mirrors `assertNoCycle`'s reasoning, extended to the unified graph: the
 * merged graph is rebuilt fresh from `workMap` plus `candidate` (so an
 * in-flight edit's proposed `deps`/`parent` are what get checked, not the
 * stored ones), then walked only from `candidate.id`. That single walk is
 * still sufficient over the unified graph: by induction every write admitted
 * so far kept the unified graph acyclic, so any NEW cycle must pass through
 * the node whose edges just changed — either a `blocks` edge candidate.id
 * now points out along (its own `deps`), or a `parent-child` edge
 * candidate.parent now points in along. A cycle using only the latter still
 * departs FROM candidate.id via some pre-existing outgoing edge to reach its
 * declared parent before returning — a DFS rooted at candidate.id over the
 * freshly rebuilt full adjacency traverses that outgoing edge regardless, so
 * it is found. Throws `WorkValidationError` (single-arg, per work.mjs:14)
 * with the cycle path composed into the message; returns nothing on success.
 * This is the NEW export the write-door wiring cell adopts in place of the
 * deps-only `assertNoCycle`; `assertNoCycle` itself is untouched above.
 */
export function assertNoUnifiedCycle(candidate, workMap) {
  const merged = { ...(workMap ?? {}), [candidate.id]: candidate };
  const adjacency = buildUnifiedAdjacency(merged);
  const cycle = findCycleFrom(candidate.id, adjacency);
  if (cycle) {
    throw new WorkValidationError(
      `work "${candidate.id}" would close a graph cycle: ${cycle.join(' -> ')}`,
    );
  }
}
