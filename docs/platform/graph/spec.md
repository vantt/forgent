# Graph Component Specification

```txt
Document type: BA-grade area specification
Audience: Owner, maintainer, implementation agent
Purpose: One authority for deterministic facts about a directed graph with typed edges and exclusion pairs: cycles with their paths, layers, layering under exclusions, the critical path and independent groups
Design status: Settled by the owner in the discussion of plans/261119-0030-resource-referee-graph-write-scope-stack (decisions 1, 3, 7, 9, 16, 18, 26, 27); the numeric limits were measured in phase 1
Implementation: Spec and contract only (plan phase 1). The crate packages/graph/rust is a skeleton from phase 2 and is filled in phase 4; the addon binding is phase 7
Canonical: Yes for the scope below, from the day the plan lands
Owner: Graph component (proposed)
Source (planned): packages/graph/rust (crate fgos-graph)
Contracts: packages/graph/contracts/graph.v1.json
Provenance: plans/261119-0030-resource-referee-graph-write-scope-stack/plan.md, reports/facts.md and plans/reports/research-261118-1704-pkm-graph-algorithms-for-shared-overlap-core.md at base 40949614f077844005a986ca1f0f75c0c5e8f508 (2026-11-19)
Writer type: Agent draft writer
Canonical for: The graph input, the edge-kind registry, the outputs and their tie-break rules, the split between refusals and results, the limits, and how the package differs from the Work verb `fgos graph`
Use this when: Asking which layers a set of units fits in, what the critical path is, which units are independent, or what cycle blocks an order
Do not use this for: What a path scope means (write-scope), whether a layout is acceptable (resource-referee), Work state or the Work frontier (Work layer), event ordering (Event Store)
Last reviewed: 2026-11-19
Related:
- plans/261119-0030-resource-referee-graph-write-scope-stack/plan.md
- plans/261119-0030-resource-referee-graph-write-scope-stack/reports/facts.md
- packages/graph/contracts/graph.v1.json
- docs/platform/write-scope/spec.md
- docs/platform/resource-referee/spec.md
- docs/platform/component-boundary.md
```

## 1. Purpose and owned decisions

Several places in fgOS need the same few facts about "things that wait for other things, and some pairs
that must not run together": the Work scheduler, the plan check, plan-lint, instruction composition, the
workflow step order. Each wrote its own ordering and cycle code (section 8). This component computes those
facts once, with no knowledge of what a node is.

It owns:

1. **The input vocabulary:** nodes, typed edges with a registry that says whether a kind orders, exclusion pairs and an optional priority (section 3).
2. **The outputs:** cycles with paths, layers, layering under exclusions with the evidence of each delay, the critical path, independent groups, dangling references (section 4).
3. **The tie-break rules** wherever several answers are valid (section 5). The caller supplies the priority order as data; the package holds no policy.
4. **The split between refusals and results** (section 6) and the **limits** (section 7).

It has no domain meaning: no path, no Work status, no plan, no clock, no file system, no process. A caller
maps its own entities to nodes and edges and reads the facts back.

## 2. Shared entities

| Entity | Meaning |
|---|---|
| Node | An id. Ids are non-empty strings, unique within one input, at most `maxIdBytes` long |
| Ordering edge | `{ from, to, kind }`: `from` cannot start before `to` is done. `to` sits in an earlier layer than `from` |
| Edge kind | A name from the registry in `graph.v1.json`: `depends-on`, `parent-child`, `waits-for` (all order) and `related` (does not order) |
| Exclusion pair | `{ a, b }`: the two nodes may not share a layer. Unordered |
| Layer | A set of nodes that may run together. Layer 0 waits for nothing |
| Component | A strongly connected component of the ordering edges; non-trivial when it has more than one node or a self-edge |
| Group | A set of nodes connected, ignoring direction, through edges whose kind joins groups and through exclusion pairs |

## 3. Input

The input is one object: `nodes` (required), `edges`, `exclusions` and `priority` (optional). The exact
fields, kinds and refusals are in `packages/graph/contracts/graph.v1.json`; unknown fields are refused by
name at every level. Node order, and the order of edges leaving one node, are part of the input: the output
is a pure function of it, so the same input hashes the same on every rebuild.

An ordering edge points from the waiting node to the node it waits for. Callers that store the opposite
direction (a parent that waits for its child, as Work does) reverse it when they build the edge.

An edge kind that is not in the registry is refused by name. The registry has one flag that matters to the
algorithms, `orders`, and one for grouping, `groups`. The three ordering kinds are behaviourally identical;
they exist so a cycle report can say which relation closes the loop, which matters because Work mixes
`blocks`, parent and `mergeAfter` edges in one graph.

## 4. Outputs

| Output | Definition |
|---|---|
| `cycles` | One entry per non-trivial component, ordered by its smallest id. Each carries the component's members, its induced ordering edges, **one canonical shortest cycle** through the smallest member as an id list with the edge kind of each step, rooted at that member |
| `cycle_through(id)` | A bounded query: the shortest cycle through a chosen member, in the same shape, or null when the id is on no cycle. Linear in the component's size |
| `dangling` | Every edge or exclusion pair that names an id that is not a node, with the absent ids. Never turned into a node, never part of a computation |
| `layers` | Topological layers by earliest possible layer, then adjusted for exclusions (section 5). Null when a cycle exists |
| `deferrals` | For each node placed later than its earliest possible layer, the layers it was held out of and the first excluded node already in each. Null when `layers` is null |
| `criticalPath` | The longest chain of waits, unweighted: `{ depth, path }` with `depth` the number of nodes and `path` listing them from the deepest node down through the dependency it waits on longest. Null when a cycle exists |
| `groups` | Independent groups: nodes in different groups share no dependency, no `related` edge and no exclusion pair, so they can be worked entirely in parallel |

**Why one canonical cycle, with the component beside it.** Reporting every cycle needs a step cap and a
truncation apparatus, and the output must hash the same on every rebuild. A person who must act on a loop
needs one cycle with its path and enough context to break it. When the canonical cycle cannot be broken
because one of its edges belongs to a plan the planner does not control, the component's members and induced
edges show the other ways round, and `cycle_through(id)` shows the shortest loop through any member of
interest. All three are linear, so there is no cap and no truncation. All cycles are not enumerated (plan
decisions 7, 27; the pkm survey took only the idea of pruning by component and rooting at the smallest id).

## 5. Tie-break rules

Where several answers are valid, the rule is written here and in the contract and the choice is data from the
caller, never a heuristic of the package.

- **Smallest id** is smallest by UTF-8 byte order.
- **Cycle.** Breadth-first search from the root (the smallest member) over the component's ordering edges,
  neighbours in ascending id order. The closing step comes from the in-neighbour of the root found at the
  smallest distance, ties by the smaller id. The result is the lexicographically smallest of the shortest
  cycles through the root. A self-edge is a cycle of that one node.
- **Layers without exclusions.** A node's layer is 0 when it waits for nothing, otherwise one more than the
  greatest layer among the nodes it waits for.
- **Layers under exclusions.** Layers are filled one at a time. In layer *n*, the nodes whose dependencies
  are all placed in earlier layers are offered in priority order; each is placed unless an already placed
  node of that layer is excluded with it, in which case it is deferred to the next layer and the blocking
  partner is recorded. The priority is the caller's `priority` list, then input order for ids not listed;
  because every node has one input position no two nodes tie. Nothing is ever refused for an exclusion: a
  conflicting node waits, as `computeSchedule` does today.
- **Critical path.** The first strict maximum wins, over nodes in input order and, for one node, over its
  dependencies in edge input order (the rule of `src/state/graph-metrics.mjs:152`).
- **Groups.** Ordered by the input position of the first member; members in input order.

## 6. Refusals and results

| Class | What | Behaviour |
|---|---|---|
| Refusal | Malformed input: wrong shape, unknown field, empty or non-string or overlong id, duplicate id, malformed edge, unknown edge kind, an exclusion of a node with itself, a duplicate or unknown id in `priority`, input beyond a limit | Nothing is computed. The error names the code, the field or limit, and the index of the first offending item, and quotes no more than the id-length limit |
| Result | A fact about well-formed input: cycles, dangling references, layers, deferrals, critical path, groups | Always returned |

A cycle is a result, not a refusal: it is the thing the caller asked to know about. When one exists,
`layers`, `deferrals` and `criticalPath` are null because an order does not exist; the cycles are the
answer. Dangling references are results for the same reason: Work already has the live gap of an edge to an
id that is not an item (`src/state/dep-graph.mjs`), and a refusal there would hide every other fact.

## 7. Limits

| Limit | Value | Basis |
|---|---|---|
| Nodes | 20000 | Work walks every item regardless of status; 13 open items today, 270 table lines in `docs/backlog.md`; the largest plan table has 27 phases |
| Edges | 200000 | the largest phase `dependsOn` cell today lists a handful of ids |
| Exclusion pairs | 100000 | equals the emitted-pairs cap of write-scope, the usual producer |
| Id length | 256 bytes | plan phase ids are at most 3 characters; Work ids are short |
| Input bytes (JSON text a binding receives) | 4 MiB | 32 times the largest `plan.md` read today (128519 bytes) |

Input beyond a limit is refused by name and never answered partially. A caller whose graph is refused fails
with the named error; it does not degrade silently (plan decision 7). The numbers and what they were
measured against are in `reports/facts.md`, section 4, and in `graph.v1.json`. The graph reports no
item-level findings: its one per-item bound, the id length, is a refusal, because no answer about a node
that cannot be named is possible.

## 8. Boundaries and what it replaces

`graph` is below the door and below the Work adapter and imports nothing from either (design principle 2).
The door plan adds `src/state/graph-adapter.mjs` in the `domain` layer, which reaches the package through the
kernel door `src/native/door.mjs` and maps Work items to this input.

The ordering and cycle code in the repository today, and what this plan does with it:

| Copy | Where | Fate |
|---|---|---|
| `connectedComponents`, `criticalPath`, `detectCycles`, `computeSchedule`, `longestChain` | `src/state/graph-metrics.mjs` | Exports survive as the Work adapter surface (plan decision 18); bodies call this package in the door plan. `longestChain` is deleted so one critical-path rule remains |
| `findDepCycle`, `findUnifiedCycle`, `buildUnifiedEdges` | `src/state/dep-graph.mjs` | The edge builder stays Work's; the cycle search is not replaced in these plans |
| Unit dependency cycle | `src/report/capability-plan-lint.mjs:400` | Moves with plan-lint in the door plan |
| Kahn ordering | `src/setup/instruction-composition.mjs:428` | Not a target; recorded follow-up |
| `dependencyOrder` | `src/workflow/steps.mjs:12` | Not a target; recorded follow-up |
| Event ordering | `packages/event-store/rust/src/order.rs` | Not a target; event store stability comes first |

**Intended differences from `src/state/graph-metrics.mjs`** (each is listed by name in the phase-4 port of
`test/state/graph-metrics.test.mjs`):

1. **One canonical cycle path per component.** `detectCycles` returns each component as a vertex set in
   Tarjan pop order and a self-edge as `[id]`; it never names a path.
2. **Layers cover the whole graph and honour dependencies.** `computeSchedule` packs only the ready frontier
   and ignores everything that is not ready; this package layers every node by its dependencies first.
3. **Exclusion evidence.** A deferred node says which exclusion held it out of which layer.
4. **Dangling references are reported**, where Work drops them silently.
5. **Groups join exclusion pairs and `related` edges**, where `connectedComponents` joins only blocks and
   parent-child edges; the Work adapter passes none of the extra kinds, so its groups are unchanged.
6. **No recursion.** `detectCycles` and `longestChain` recurse; the crate is iterative.

**How `graph` differs from the Work verb `fgos graph`.** The verb (`src/cli/command-registry.mjs:1103`,
`packages/host-runtime/contracts/command-routes.json:622`) reads Work state and prints Work's metrics; this
is a library with no state. Neither calls the other. The component is named `graph` in the packages
directory and in the crate (`fgos-graph`) and is never exposed as a verb of that name (plan decision 26).

## 9. Non-goals

- Weighted critical paths, all-cycle enumeration, a wall-clock budget, a graph database or query language.
- A binding for event ordering, instruction composition or workflow steps.
- Any notion of status, priority classes, plans, paths or time; the caller supplies priority as an id list.
- A web or MCP surface.

## 10. Lịch sử quyết định

| Id | Decision | Where it lands here |
|---|---|---|
| plan decision 1 | Three packages with the names `write-scope`, `graph`, `resource-referee` | sections 1, 8 |
| plan decision 3 | Deterministic results, no policy, no domain meaning; tie-break rules written down; priority is data from the caller | sections 1, 5 |
| plan decision 7 | Refuse oversize input by name, no partial answer; cycle reporting is linear | sections 6, 7 |
| plan decision 9 | "Layer" is the neutral word; the planner adapter maps it to "wave" | section 2 |
| plan decision 16 | Node reaches the package in process through the native addon | section 8 |
| plan decision 18 | The export names of `graph-metrics.mjs` survive as the Work adapter surface; one critical-path rule | section 8 |
| plan decision 26 | The package keeps the name `graph`; it is not a verb and differs from `fgos graph` | section 8 |
| plan decision 27 | One canonical shortest cycle per component, with members, induced edges and `cycle_through(id)`; all cycles are not enumerated | section 4 |
| phase 1 | The edge-kind registry has three ordering kinds and one non-ordering kind; limits were fixed from measured maxima | sections 3, 7 |
