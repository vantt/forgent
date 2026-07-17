// dep-graph.mjs — pure cycle detector over the `deps` relation (per
// work-graph-intelligence S1, D f176c18a foundation slice, mandated order
// D 2ccf9804). Sibling of fsm/frontier/replay: no fs, no appendEvent, no
// import of store.mjs (Domain->Kernel only, never Domain->Infra — an upward
// import here would break test/architecture.test.mjs's one-way-down check).
//
// `deps` is a flat id-array (work.mjs:165-166); `validateDeps` (work.mjs:205)
// only checks that every dep id exists, never that the graph it forms stays
// acyclic. This module closes that gap: `findDepCycle` scans a whole work
// view for any cycle already present; `assertNoCycle` checks a candidate
// add/edit against the rest of the view *before* it is admitted, so a
// cycle-creating write never lands (the write-door wiring itself is the next
// cell, work-graph-intelligence-2).
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
