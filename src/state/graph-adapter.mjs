// graph-adapter.mjs — the Work side of the `graph` and `write-scope` packages.
//
// It maps a folded Work view (or a candidate list) to the packages' input, calls them in process through the
// kernel door (`src/native/door.mjs`, the only import), and maps the answers back to the shapes graph-metrics.mjs
// has always returned. It owns no overlap rule and no graph algorithm: what two footprints share is the
// `write-scope` package's answer, and layers, cycles, components and the critical path are the `graph` package's.
//
// Failure policy (docs: resource-check door plan, decisions 7 and 17):
//   - a truncated pair scan, or an input a package refuses, throws a named `GraphAdapterError`; nothing here
//     treats a partial answer as complete, and nothing falls back to a second implementation. An addon without
//     the namespaces is refused by name by the door itself (`git-addon-unavailable`).
//   - a candidate whose footprint is missing or empty has made no claim and never conflicts (Work footprints
//     are optional); a footprint entry that does not canonicalize makes that one candidate conflict with every
//     other candidate, because its claim cannot be read.

import { nativeDoor } from '../native/door.mjs';
import { buildUnifiedEdges } from './dep-graph.mjs';

/** A package answer this adapter will not use: a refusal, or a pair scan that stopped early. */
export class GraphAdapterError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = 'GraphAdapterError';
    this.code = code;
  }
}

// Work's edge kinds in the graph package's vocabulary (same direction: `from` waits for `to`).
const EDGE_KIND = Object.freeze({ blocks: 'depends-on', 'parent-child': 'parent-child', 'waits-for': 'waits-for' });

function analyze(input) {
  try {
    return JSON.parse(nativeDoor().graph.analyze(JSON.stringify(input)));
  } catch (error) {
    let refusal = null;
    try { refusal = JSON.parse(error.message); } catch { /* not a package refusal: the door's own named error */ }
    if (!refusal?.id) throw error;
    throw new GraphAdapterError('graph-refused', `${refusal.id}${refusal.path ? ` at ${refusal.path}` : ''}`);
  }
}

// Nodes in declaration order and the unified edges between them, known ids only (a dangling `parent`/`dep` is
// never a phantom node). `scope`, when given, keeps only the ids in it.
function workGraph(work, scope = null) {
  const ids = Object.keys(work).filter((id) => scope === null || scope.has(id));
  const known = new Set(ids);
  const edges = buildUnifiedEdges(work)
    .filter(({ from, to }) => known.has(from) && known.has(to))
    .map(({ from, to, kind }) => ({ from, to, kind: EDGE_KIND[kind] }));
  return { nodes: ids.map((id) => ({ id })), edges };
}

/**
 * The critical path of the unified graph over `work`, or of the sub-graph on `scope` (an id Set closed under what
 * its members wait for). A graph with a cycle has no critical path: it answers `{ depth: 0, path: [] }`, and the
 * cycle is `workCycles`' answer.
 * @returns {{ depth: number, path: string[] }}
 */
export function workCriticalPath(work, scope = null) {
  const { criticalPath } = analyze(workGraph(work, scope));
  return criticalPath ?? { depth: 0, path: [] };
}

/** Independent groups of the undirected unified graph, in declaration order. */
export function workComponents(work) {
  const { groups } = analyze(workGraph(work)).groups;
  return { componentCount: groups.length, components: groups.map(({ size, nodes }) => ({ size, items: nodes })) };
}

/** Every non-trivial strongly connected component of the unified graph (a self-edge is its own), as id lists. */
export function workCycles(work) {
  return analyze(workGraph(work)).cycles.map(({ members }) => members);
}

const isEntry = (entry) => typeof entry === 'string';

/**
 * Every pair of `candidates` ({id, footprint}) whose footprints may touch the same path, in candidate order
 * (i < j), with the shared entries as declared by the first of the pair. A candidate with an unreadable entry
 * (not a string, or one the package cannot canonicalize) is paired with every other candidate, its unreadable
 * entries as the shared ones.
 * @returns {Array<{ a: string, b: string, shared: string[] }>}
 */
export function collidingFootprints(candidates) {
  const position = new Map();
  const items = [];
  const unreadable = new Map(); // candidate position -> entries that could not be read
  candidates.forEach((candidate, index) => {
    if (!position.has(candidate.id)) position.set(candidate.id, index);
    const footprint = Array.isArray(candidate.footprint) ? candidate.footprint : [];
    if (footprint.length === 0) return; // no claim
    const bad = footprint.filter((entry) => !isEntry(entry)).map(String);
    if (bad.length > 0) unreadable.set(index, bad);
    items.push({ id: candidate.id, scopes: footprint.filter(isEntry) });
  });

  const found = nativeDoor().writeScope('collidingPairs', { items });
  if (found.truncated) {
    throw new GraphAdapterError('footprint-scan-truncated', `the pair scan stopped at its ${found.truncated.reason} (${found.truncated.limit}); the overlaps are not complete`);
  }
  for (const problem of found.problems) {
    if (problem.code === 'scope-empty') continue; // only footprints of non-string entries: already unreadable
    const index = position.get(problem.item);
    const entries = unreadable.get(index) ?? [];
    // `scope-too-large` names no entry: the whole footprint is the claim that could not be compared.
    unreadable.set(index, [...entries, ...(problem.entry === undefined ? candidates[index].footprint.map(String) : [problem.entry])]);
  }

  const pairs = new Map(); // `${i}:${j}` -> { a, b, shared }
  const add = (i, j, shared) => {
    const key = `${i}:${j}`;
    const known = pairs.get(key);
    if (known) known.shared.push(...shared.filter((entry) => !known.shared.includes(entry)));
    else pairs.set(key, { i, j, a: candidates[i].id, b: candidates[j].id, shared: [...shared] });
  };
  for (const { a, b, shared } of found.pairs) add(position.get(a), position.get(b), shared);
  for (const [index, entries] of unreadable) {
    for (let other = 0; other < candidates.length; other += 1) {
      if (other !== index) add(Math.min(index, other), Math.max(index, other), [...new Set(entries)]);
    }
  }
  return [...pairs.values()].sort((x, y) => x.i - y.i || x.j - y.j).map(({ a, b, shared }) => ({ a, b, shared }));
}

/**
 * Pack `candidates` into waves by the `graph` package's layering: walked in candidate order, each goes into the
 * earliest wave with no conflicting member (`conflicts`: `{a, b}` pairs), and a conflicting one is deferred to a
 * later wave, never refused. `waves[0]` is everything that can start in parallel.
 * @returns {string[][]}
 */
export function packWaves(candidates, conflicts) {
  const ids = candidates.map((candidate) => candidate.id);
  const { layers } = analyze({ nodes: ids.map((id) => ({ id })), exclusions: conflicts.map(({ a, b }) => ({ a, b })), priority: ids });
  return layers.map(({ nodes }) => nodes);
}
