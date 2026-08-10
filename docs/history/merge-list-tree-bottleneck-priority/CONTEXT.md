# CONTEXT.md — tsk-3cs: merge-list tree view + bottleneck-priority merge order

## Feature boundary

herdr-plugin's MERGE LIST box today mirrors `fgos merge list --json`'s
`ready`/`waiting`/`blockedOnSync` as three flat lists
(`herdr-plugin/src/fgos.rs:127-145`, `app.rs`). This item replaces that
with a tree: root-to-main items at the top level, leaf-to-root children
nested under their parent, every level sorted by the same
bottleneck-priority rule. The ordering signal must live in the JS state
layer (`src/state/`), not in Rust, because `merge next`/`merge-loop`
(the real, sequential merge executor) reads that same engine's output
directly (`mergeReadiness(view).ready[0]`) — the tree the human sees and
the order automation actually executes must be the same computation, not
two independent guesses.

Out of scope: automating *who* triggers merges (that is tsk-2xt's own
locked scope — a dedicated auto-launched `merge-loop` pane). This item
only makes sure the order that pane will execute is correct and
observable. No dependency edge needed between tsk-3cs and tsk-2xt — each
stands alone; tsk-3cs's engine-level ordering improvement automatically
upgrades whatever automation tsk-2xt eventually launches, with zero
changes required on tsk-2xt's side.

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | Only one execution model exists for real merges: every item, leaf or root, goes through the same `approve` verb (`bin/fgos.mjs:2689`), which resolves its own target branch dynamically via `resolveRoot`/`branchNameFor` on every call (leaf → `fgw/<root>`, root → `main`). No separate "parent merges its children" mechanism exists or needs to be built — `src/state/cleanup-harness.mjs:115-116` states this directly: "decompose-into-children never itself merges `fgw/<id>` into anything -- its children's own branches merge directly into the same resolved root." |
| D2 | The tree displays every item across ALL of `mergeReadiness`'s buckets — `ready`, `waiting`, `blockedOnSync`, every id inside `mergeSets`, and `supersededOut` — not just `ready`. A stuck child still has to eventually merge into its parent, so hiding it defeats the point of a bottleneck-visualizing view. |
| D3 | Bottleneck-priority sort ordering applies recursively at every nesting level (each parent's own children group, and the top-level root set), not only at the top level. |
| D4 | The tree-construction and sort logic lives entirely in the JS state layer (`src/state/graph-harness.mjs` or a sibling module), never in herdr-plugin's Rust rendering code. Rust only parses and displays what the JS engine already computed. Rationale: `merge next`/`merge-loop` read `mergeReadiness(view).ready[0]` directly — if sort logic existed only in Rust, the tree the human sees and the order automation actually executes could silently diverge. |
| D5 | The real cause of "multiple processes racing into merge / having to babysit approve prompts across terminals" (reported from the requester's lived experience) is manual: the same person running `/fgOS:merge-next` or approving by hand across several terminals at once — not a conflict between two automated mechanisms. An initial hypothesis blaming `fgos-fanout`'s documented leaf-auto-approve behavior was checked against real event-log evidence (`capacity.dispatch` = 0 events in the entire repo history, i.e. the runner's automated dispatch path has never fired for real) and retracted. Consequence: no code fix is needed here for "who is allowed to merge" — today, structurally, a human is already the only real actor; tsk-2xt's job is to automate that role, this item's job is only to make the order that role (automated or not) should follow correct and visible. |
| D6 | The "bottleneck" signal used for sorting is `rankImpact`'s existing `blocks` field (count of every OPEN item, any status, that directly depends on this one) — reused as-is, no new metric invented. A narrower alternative (counting only items sitting in `mergeReadiness`'s own `waiting` bucket specifically because of this item) was considered and rejected: real data at scout time showed `waiting` was empty (0 items), so that narrower signal would almost always be zero and never actually change sort order. `blocks` is also already reused by `priority-formula.mjs`'s `computeImpact` for the general `priority`/triage ranking — consistent with the rest of the system, not a bespoke merge-only concept. |
| D7 | A blocked/conflicted node in the tree shows the specific reason and counterpart item, not just a coarse status word (e.g. "conflicted with tsk-xxx over `src/foo.mjs`", "blocked: root needs sync"), not merely a bare `blocked`/`conflicted` badge. Cost noted: for footprint/shared-root conflicts this is nearly free (`mergeSets`' `reason` field and `conflicts`' `{a, b, shared, suggestions}` shape already carry this detail); for sync-drift blocks it requires new wiring — `graph-harness.mjs:121-122`'s `blockedOnSync.push(item.id)` only pushes the bare id today, `drift[root]`'s detail is checked but never attached to what's returned. Task 1 (below) must add that wiring, not just reuse the existing bare-id array. |

## Pinned terms

- **root-to-main** — a work item with no `parent`; its `mergeTier` (`graph-harness.mjs:207-210`) resolves to `'root-to-main'`; its real merge target is `main`.
- **leaf-to-root** — a work item with a `parent`; `mergeTier` resolves to `'leaf-to-root'`; its real merge target is `fgw/<its resolved root's id>`, never `main` directly.
- **bottleneck-priority** — sort order where, among candidates otherwise clear to merge, the one with the highest `blocks` count (D6) merges first, ties broken by `goalTier` then id (`rankImpact`'s existing tie-break, unchanged) — applied recursively per tree level (D3).

## Scout evidence

- `herdr-plugin/src/fgos.rs:127-145` + `app.rs` — today's flat `MergeListSummary` (`ready`/`waiting`/`blocked_on_sync`), a direct field mapping of `fgos merge list --json`, no `parent`/`mergeTier` read.
- `src/state/graph-harness.mjs:94` (`mergeReadiness`) — already computes `mergeTier: {[id]: 'leaf-to-root'|'root-to-main'}` and sorts `ready` via `rankImpact` (blocks desc, tie-break goalTier then id), but as one flat list, never grouped by parent.
- `src/state/impact.mjs:88` (`rankImpact`) — `blocks` field: count of open items directly depending on this one, sorted descending already.
- `plugins/fgOS/skills/merge-loop/SKILL.md` + `merge-next/SKILL.md` — confirms `merge next` reads `mergeReadiness(view).ready[0]` fresh on every call; improving the engine's order changes automation's real behavior with zero changes to these skills.
- tsk-2xt (`doing`/`decompose`) — locked auto-launch-pane architecture for `auto-merge`; explicitly keeps "pick logic" (the ranking/ordering itself) out of its own scope.
- `src/state/priority-formula.mjs:63` — `computeImpact` already reuses `rankImpact`'s `blocks` for general `priority`/triage ranking, a second consumer of the same signal (D6).
- `bin/fgos.mjs:2689` (`approve`) + `src/state/cleanup-harness.mjs:115-116` — confirms the single-execution-path finding (D1).
- Real `fgos merge list --json` output at scout time: `ready: 11`, `waiting: 0`, `blockedOnSync: 1` — grounds D6's rejection of the narrower bottleneck signal.
- `.fgos/events.jsonl`: `grep -c '"type":"capacity.dispatch"'` = 0 across the entire repo history — grounds D5's retraction of the fanout hypothesis.
- `.claude/skills/fgos-fanout/SKILL.md:94-106` — documents leaf-auto-approve behavior in prose, but with no corroborating runtime evidence it has ever fired (D5).
- `src/state/graph-harness.mjs:117-126` — `blockedOnSync`'s construction, confirming it carries only bare ids today (D7's cost note).
- Full live discussion, all scouting, and every round of Q&A: `docs/history/merge-list-tree-bottleneck-priority/DISCUSSION.md`.
- Impact-analysis capability posture (`CLAUDE.md` gate): `degraded` — GitNexus is registered and `status: present` (`fgos tool query --capability impact-analysis --status present`), but this session's own hook output flagged the index as stale (`last indexed: 4ce7a96`, behind current HEAD) partway through this session. Blast radius for the real code changes (Task 1/Task 2 below) is not confirmed fresh by GitNexus as of this writing; re-run `gitnexus analyze` before relying on it during planning/implementation.

## Canonical references

- `docs/history/merge-list-tree-bottleneck-priority/DISCUSSION.md` — full design discussion, D1-D7, §6 synthesis (with data-flow diagram), §7 task breakdown (`#task-merge-tree-engine`, `#task-merge-tree-render`).
- tsk-2xt — related, independent, auto-launch-pane architecture this item's ordering improvement feeds into without any code change on that side.

## Outstanding questions

None
