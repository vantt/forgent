# pkm graph code vs fgOS: what is borrowable for a work-agnostic overlap/wave core

Date: 2026-11-18. Read-only review of /home/vantt/projects/pkm (crates/pkm-core and docs). Paths below are relative to pkm/crates/pkm-core/src unless stated.

## Verdict up front

pkm has little graph logic that is better than fgOS for the planned core. It is a SQLite-backed note graph, and almost every algorithm is a faithful Rust port of Python (`scripts/kg/*.py`), with results frozen by parity snapshots. It has no topological order, no wave scheduling, no critical path, no path-containment or prefix-tree logic, and no inverted index. Its similarity detection is O(n^2) pairwise (`pairs.rs:236-252`), which is what fgOS already does for footprints. fgOS `graph-metrics.mjs` is ahead of pkm on scheduling and metrics.

What is worth borrowing is small: a budgeted, deterministic cycle enumerator built on SCC pruning; a named hard cap plus wall-clock budget with an actionable error; a layered "core is generic, vault specifics sit behind a trait" boundary; and the golden-snapshot plus proptest test habit. None of it touches path overlap, which must be designed by us (see "Gap" below).

## Top 5 borrowable ideas, ranked for a work-agnostic overlap/wave core

1. **SCC-pruned, deterministic cycle enumeration with a budget.** `query.rs:1144-1209` runs an iterative Tarjan (`query.rs:1776-1828`, explicit work stack, no recursion), then runs a DFS from each start node only inside that node's component (`query.rs:1736`, `comp.get(s.to) != self.cs` skip). Each cycle is reported once, rooted at its smallest id (`query.rs:1752`, only extends to `s.to > start`), starts are sorted (`query.rs:1178`), and the walk is capped by `max_len` and a deadline (`query.rs:1728`). Replaces: fgOS Tarjan SCC in `graph-metrics.mjs` returns components but, per the brief, not the concrete cycles as ordered paths. For a planner the useful output is "cycle A->B->C->A" with a stable canonical rotation, which pkm gives and fgOS may not. Value: high, cheap to port (about 80 lines of Rust), and the canonical-rotation rule makes output diff-stable.

2. **Hard cap plus wall-clock budget with a self-explaining error.** `MAX_LEN_CAP = 12` and `WALK_BUDGET = 10 s` (`query.rs:65-75`), env override read only by the shell, never by the core (`query.rs:71` comment, `walk_budget_from` at `query.rs:278-285`), and the error text names the knob to turn (`query.rs:287-296`: "query too expensive: stopped after N s; lower max_len or narrow rels"). Replaces: nothing in fgOS bounds work today. The shared core should accept `max_pairs`/`max_cycle_len`/`deadline` as parameters and return a typed truncation reason instead of hanging on adversarial plans. Value: high for robustness, trivial cost.

3. **Pagination by summary-plus-handle for long results.** The MCP tool description says long results return `count`, `by_type`, the first items and a handle for `more` (`tools/defs.rs:11`, session state in `service/layer.rs:57-69`). Replaces: fgOS CLI output that dumps whole overlap lists. For a planner agent, "top 20 overlaps by size, count total, handle for the rest" saves tokens. Value: medium; only worth it if the core is exposed through MCP or CLI to agents.

4. **Generic-core boundary through a small trait plus versioned published views.** The core is not generic over node type (see Q1), but the extension point is a clean 6-method trait with defaults (`adapter.rs:16-50`: `hidden`, `instructions`, `digest`, `edges`), and cross-crate contracts are versioned SQL views listed in `graph_views(name, version)` (`index.rs:94-100`, docs/architecture/05-do-thi.md:5.4). Replaces: the current welding of fgOS graph code to `view.work`. Our core should take plain `{id, deps, footprint}` input, which is simpler than pkm's design; the borrowable part is only the versioned-contract habit (bump a version when a column changes meaning). Value: medium.

5. **Golden-snapshot parity tool (`tools/parity`) as the regression net for a port.** Snapshot of CLI/MCP/table output, `check` compares, `bless` regenerates atomically into a temp dir then swaps, and a test proves bless reproduces the committed snapshot byte for byte (tools/parity/README.md "Đổi đầu ra có chủ ý"). Replaces: ad hoc JS-vs-Rust comparison when we port `computeSchedule` and overlap logic. Run both implementations over the same corpus of real plan DAGs, snapshot the output, and keep the JS version as the oracle until retired. Value: high for the migration itself, low afterwards.

Dropped because not better than fgOS: PPR push ranking, Louvain, cosine pairs, recursive-CTE reach (details in Q2).

## Q1. Graph model and the note boundary

- Storage: SQLite file `graph.db`, rebuilt from the vault. Nodes are note paths as TEXT ids (`index.rs:58-60`, `nodes(id TEXT PRIMARY KEY, ...)`). Edges are one table `edges(src, rel, dst, status, valid_from, valid_to, asserted_at, origin, confidence, score, ...)` with indexes on `(src, rel)` and `(dst, rel)` (`index.rs:75-79`). Edge kinds come from a merged YAML schema (core plus packs plus vault pack, docs/architecture/05-do-thi.md 5.2). Edge lifecycle is a status layer: accepted, superseded, proposed, rejected (`query.rs:44-60`).
- Incremental: only files with changed mtime or size, plus "racy" files written within 2 s of read, are re-read; same hash means no write; links and edges are recomputed from parsed data because renaming one note changes link resolution for others (`index.rs:15-21`). Only `index::build` writes; all readers open read-only (docs/architecture/05-do-thi.md 5.4).
- Independent of "note"? No, not generically. `Graph` holds a `rusqlite::Connection` and builds SQL strings over `edges`, `schema_edge`, `nodes` (`query.rs:313-380`, `reach` at `query.rs:972-1025`). Node identity is a vault path string. The algorithms that matter, `scc` and `Cycles` (`query.rs:1776`, `1712`), are pure over `IndexMap<String, Vec<Step>>` and could run over any string-keyed graph, but they are private functions inside `query.rs` with `Step` carrying note-specific fields (`rel`, `pol`, `status`, `query.rs:1705-1709`). `related.rs` `ppr_push` takes an `Adjacency` struct, again with note-specific weights.
- Boundary mechanism: not generics. The boundary is (a) schema-by-configuration (roles, packs, `extends`, docs/architecture/05-do-thi.md 5.3), (b) the `Adapter` trait for vault-specific edges (`adapter.rs:16`; only one builtin implementation, `e11`, `adapter.rs:49`), (c) separate crates for vault IO, search, embedding (`crates/` listing). So pkm answers "domain vocabulary varies" but not "node type varies". Our extraction is a different, simpler problem and gains little from pkm's structure.

## Q2. Algorithms

| Capability | pkm implementation | Complexity | Determinism | Bounding |
|---|---|---|---|---|
| Reachability | SQL recursive CTE with UNION dedupe, `reach` `query.rs:972-1025` | O(V+E) in SQLite | rows sorted in Rust (`query.rs:1021`) | optional `max_depth` |
| Simple paths, loops through a node | SQL recursive CTE, `paths` `query.rs:1030`, `loops` `query.rs:1083` | exponential in length | order from CTE, "shortest first" | `MAX_LEN_CAP=12`, 10 s budget via SQLite progress handler every 1000 VM ops (`query.rs:76`, `PROGRESS_OPS`) |
| All cycles | iterative Tarjan then per-component DFS, `query.rs:1146`, `1776` | SCC O(V+E); enumeration exponential in cycle count | sorted starts, canonical rotation at min id | `max_len`, deadline checked per DFS step |
| Related notes ranking | personalized PageRank, ACL local push, `ppr_push` `related.rs:208-280` (alpha 0.15, eps 1e-6, K 15) | O(1/(eps*alpha)) pushes, independent of graph size | FIFO queue plus insertion-ordered maps to match Python to 1e-6 (`related.rs:8-10`) | `MAX_PUSHES = 2_000_000` (`related.rs:32`), `MAX_HOPS = 4` (`related.rs:36`) |
| Shortest path explanation | multi-source BFS, heavier edges first within a depth, `via` `related.rs:282-343` | O(V+E) | stable sort by weight | `MAX_HOPS = 4` |
| Community clustering | Louvain with Mersenne Twister seed 7 shuffle, large communities re-split, `zones.rs:224-318`, `327` | roughly O(E log V) in practice | fixed seed reproduces Python `random.Random(7)` (`zones.rs:8-10`) | recursion on oversized communities only |
| Duplicate/near-duplicate | cosine over embedding vectors, `similar_pairs` `pairs.rs:236-272`, `knn` `pairs.rs:284-319` | O(n^2 d) all pairs | stable sort, ties by input order, round to 3 digits like JS | `min` 0.85, `max` 60 pairs, `per_note` 2, `min_words` 40 (`pairs.rs:212-221`) |

Not present: topological order, wave or level scheduling, critical path, betweenness or other centrality, connected components as a standalone function (the `grep` hits for "topolog", "community" are in docs strings or the Louvain code; no Kahn or DFS post-order exists). Evidence: whole-crate grep found Tarjan only at `query.rs:1144,1776`, BFS only in `related.rs:280`.

Bounding style worth noting: every unbounded-looking routine has a named constant cap, and the caps are documented next to the reason (exponential path count, `query.rs:65-66`).

## Q3. Overlap, similarity, duplication

- pkm's "similar" is embedding cosine between note vectors from the OHS search service, not a graph property (`pairs.rs:1-11`, docs/architecture/05-do-thi.md row for `pairs`, `zones`: "from the vector of search, not from graph.db"). The all-pairs loop at `pairs.rs:238-247` skips pairs in the same folder group (`group` takes first 3 path segments, `pairs.rs:195-197`) and keeps those at or above 0.85. This is a quadratic scan with a cheap filter, not an index.
- Greedy selection by score with a per-node quota (`pairs.rs:254-267`) is a useful pattern for "report at most k overlaps per phase" but is about output volume, not detection.
- Path containment: `structure/paths.rs:51` has `path.strip_prefix(dir)...starts_with('/')`, a single-pair directory-membership test. No prefix tree, no glob handling, no interval structure, no inverted index anywhere in pkm-core.
- Applicability to footprint overlap: none directly. The only transferable pieces are the per-node cap on reported pairs and the stable tie-break ordering. For the footprint problem the efficient design is ours to make: normalize each footprint entry to (fixed prefix, is_glob), insert into a path-segment trie, and report a pair when one entry's node is an ancestor-or-equal of another's, which makes the cost proportional to total entries plus reported overlaps instead of n^2. That is not in pkm and I did not find it in a vendored crate either (see limitations).

## Q4. API and contract design

- Typed errors with a kind and message: `QueryError::new(kind, message)` (`query.rs:96`), with `too_expensive` carrying the knob names (`query.rs:287`). The kinds mimic Python exception names (`TimeoutError`, `AttributeError`, `query.rs:1166`), a parity artifact we should not copy; a Rust enum is better.
- Shared filter struct for every traversal: `rels`, `as_of`, `statuses`, `system` (`query.rs:5-14` doc, `Filter` used in `neighbors`, `reach`, `all_loops`). One filter type applied uniformly is good API shape for a core that has several outputs (overlaps, waves, cycles).
- Direction enum `Dir::{Out, In}` parsed from text (`query.rs:151`), reverse edges named by schema inverse (`query.rs:16-17`).
- Result shape: JSON objects with explicit `kind`, `layer`, `negatives` fields for cycles (`query.rs:1746-1750`), so callers branch on data, not message text. This fits fgOS's "agents are customers, explicit contracts" rule.
- Truncation: `LIMIT_DESC` in `tools/defs.rs:11` states "count, by_type, first items, handle for more". Tool descriptions are part of the contract and held verbatim, with intentional deviations logged in docs/MCP-CHANGELOG.md (`tools/defs.rs:5-7`).
- Agent discovery: tool descriptions in `tools/defs.rs`, adapter-contributed `instructions` appended to the MCP server's instructions (`adapter.rs:34`), and read-only agent SQL views `v_note`, `v_edge`, `v_issue` etc. listed in `agent_views(name, version)` (docs/architecture/05-do-thi.md 5.4, docs/agent-views.md). I did not find a pkm `doctor` verb in the Rust sources (grep returned nothing), so there is nothing to copy there.

## Q5. Test strategy

- Golden parity: `tools/parity` snapshots tables, fixture answer sets, tool outputs, MCP handshake and CLI output over a pinned fixture vault, `check`/`bless`/`compare`/`rust-dump` subcommands, exceptions file currently empty, CI runs `parity check` after `cargo test --workspace` (tools/parity/README.md). Since 2026-11-13 the Rust output is the spec and the Python-origin snapshot became self-owned.
- Numeric parity discipline: copy Python's evaluation order (Python 3.12 compensated `sum`, `py_sum` `related.rs:46`; MT19937 shuffle for Louvain, `zones.rs:142`) to match within 1e-6. Costly and only justified for a port; fgOS does not need it.
- Property tests: `proptest` exists only in `pkm-lang` (tokenizer invariants: non-overlapping, ordered, char-aligned, `pkm-lang/src/tokens/tests.rs:229-240`). No property tests on graph code; `query/tests.rs` and `related/tests.rs` are example-based. So the graph core's invariants (for example "every reported cycle is a real cycle rooted at its minimum id") are not property-checked. For our core, proptest would be a clear improvement over pkm: generate random DAGs and footprints, compare the trie result against the naive O(n^2) oracle, and assert waves respect deps.

## Q6. Where fgOS is already as good or better

- Scheduling: wave computation, critical path, top-k unblock, what-if are absent in pkm. fgOS is ahead.
- Typed-edge projection of `deps`, `parent`, `mergeAfter` (dep-graph.mjs) is a domain graph with known kinds; pkm's equivalent is a configurable schema layer that is heavier than we need.
- Tarjan: fgOS already has SCC detection; pkm's is equivalent in algorithm. Only the cycle enumeration around it is extra.
- Footprint overlap: fgOS `overlaps()` in `plan-contract-check.mjs` and `portfolio.rs` already handles equal, containment and glob-as-prefix, which pkm does not do at all. The weakness we share is O(n^2) pair scanning, and pkm offers no cure.
- PPR, Louvain, embeddings: wrong tool for a plan DAG; do not adopt.
- Boundary hygiene: pkm's "core independent of note" is weaker than the planned fgOS extraction, which makes the input plain data (`{id, deps[], footprint[]}`). Do not copy pkm's SQLite-welded design.

## Recommendation

Rank: (1) cycle enumeration with SCC pruning and canonical rotation, (2) cap plus deadline plus actionable typed error as parameters of the core, (5) golden-snapshot parity harness for the JS-to-Rust move, (3) summary-plus-handle pagination if exposed to agents, (4) versioned contracts. Then add what pkm lacks: a segment trie for footprint overlap (the real speedup) and proptest against the naive oracle. Cost of borrowing is low (about 150 lines of Rust plus harness); adoption risk is nil because nothing is a dependency, only patterns.

## Limitations

- I did not read `upstreams/`, `crates/pkm-search`, `pkm-vault`, `pkm-lifecycle`, or the unit tests in detail, nor measure performance. A vendored crate might hold a trie or interval structure; I did not check.
- I did not read the forgent sources myself; the fgOS-side comparisons rely on the description in the brief, so item 1's claim that fgOS lacks ordered cycle paths is unverified.
- Line numbers are from the current working tree of pkm (not pinned to a commit).

## Unresolved questions

1. Does fgOS `graph-metrics.mjs` already return concrete cycle paths, or only SCC membership? That decides whether idea 1 is a replacement or a no-op.
2. Should the core expose truncation as an error (pkm style) or as a partial result with a typed `truncated` reason? pkm errors out; for a planner a partial list is probably more useful.
3. Is the shared core going to be an MCP/CLI surface for agents (then idea 3 matters) or only a library called by `fgos` verbs (then skip it)?
4. How are glob footprints compared when both sides are globs (for example `src/**/a.rs` vs `src/x/*`)? The fixed-prefix rule over-reports; neither pkm nor fgOS defines a precise answer.
