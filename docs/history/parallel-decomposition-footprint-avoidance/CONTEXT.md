---
item: tsk-66o
stage: clarify
docsRef: docs/history/parallel-decomposition-footprint-avoidance/
---

# CONTEXT — tsk-66o: footprint-aware parallel decomposition (Planning/Validating)

## Feature boundary

`tsk-66o` answers its own title question ("Planning/Validating có khai
báo rõ footprint chưa? có dùng graph để phân chia task để không đụng
footprint?") by closing the two real gaps a full audit found, both
scoped to the **dispatch-time** side of forgentX's work-item lifecycle
(before an item starts executing, and around handing a coding-domain
item to an external agent executor):

1. A computed **parallel-wave schedule** at dispatch-time — which
   `frontier()`-ready items can run concurrently right now without
   footprint collision, vs. which must wait — a query layer, not a new
   coordination primitive.
2. An advisory **worktree-dispatch-attestation** layer for items
   executed by a cross-provider CLI executor (agy/opencode, always
   `cli/spawn` per decision `0026`) — identity capture before dispatch,
   and a broadened footprint-diff check after, both advisory-only
   (never blocks a merge or a claim).

**Explicitly out of scope** (deferred, not silently absorbed):

- The "decompose can drop a locked decision from every child's
  footprint" completeness gap (a different failure mode — no child
  claims responsibility for a decision, vs. two children colliding on
  the same file) — filed as `tsk-1gr`, a sibling item, not a child of
  `tsk-66o`.
- Levels 2 (hard-refusal-at-merge) and 3 (OS-level sandbox) of the
  attestation escalation ladder — level 1 (advisory-only) is this
  item's whole scope; level 3 is `tsk-49o`'s own scope (cross-reference
  note logged there, decision seq 6500).

## Locked decisions

| D-ID | Summary | Rationale (short) |
|---|---|---|
| D1 | Children cover **≥ 2 themes** — `computed-parallel-wave-schedule`-shaped work + `worktree-dispatch-attestation`-shaped work (2 candidates from `docs/distillery/porting-log.md`, deep-dive `docs/distillery/deep-dives/parallel-decomposition-and-merge.md`). This is a THEME count, not a locked item count — whether either theme becomes 1 work item or splits further (e.g. `worktree-dispatch-attestation`'s two file-disjoint halves, `src/runner/dispatch.mjs` vs `src/runner/frozen-judge.mjs`, §7 of `DISCUSSION.md`) is `fgos-coding-planning`'s own shaping call, not decided here | User directed using this pre-existing item as root instead of submitting duplicates. Item-count NOT pinned here per this skill's own hard rule ("do not decide how big... or split it into pieces") |
| D2 | Wave-schedule algorithm is SEPARATE (Kahn layering + Tarjan cycle-detection), does NOT reuse `graph-harness.mjs`'s `mergeReadiness` connected-component+order logic | Different problem: dispatch needs "how many parallel right now", merge only needs "what order" |
| D3 | `worktree-dispatch-attestation` = level 1, advisory-only: capture `baseCommit`/`headRef` around `resolveExecutorConfig` before dispatch + broaden `frozen-judge.mjs` to flag ANY diff outside declared footprint (not just test/CI/lockfile/manifest) — flag only, never block | Real breakage is already caught by `merge.mjs`'s existing staged verify-gate; this targets a narrower risk (scope creep that still passes verify) where advisory (STR63 precedent) fits, not a hard gate |
| D4 | The completeness gap is OUT of `tsk-66o`'s scope, filed separately as `tsk-1gr` (sibling, no logical dep) | Different failure mode (no child claims a decision) than collision (two children fight over one file) |
| D5 | The NEW broadened diff-check exempts items with NO declared footprint entirely (no flags) — scoped ONLY to the new check, the existing narrow `FROZEN_JUDGE_PATTERNS` check (STR63, already shipped) is untouched | Ship Faster (`docs/decisions/0025`, scope clarified 2026-08-05: measures the speed of the project USING fgOS, not fgOS's own build cost) — flagging 100% of a diff when there is no declared baseline is not a signal, it is guaranteed noise; the existing verify-gate already covers real breakage regardless of this decision |

Full evidence and reasoning for each: `docs/history/parallel-decomposition-footprint-avoidance/DISCUSSION.md` §4/§6 (this file is the locked-decision record; that one is the living discussion this was distilled from).

## Pinned terms

- **wave** — a computed, dispatch-time grouping of `frontier()`-ready
  items that can be worked on concurrently right now without footprint
  collision. Derived-never-stored, same discipline `footprintOverlap`
  already uses.
- **advisory-only** — flags/logs a condition; never throws, never
  blocks a merge, a claim, or a dispatch. The whole shape of D3/D5.
- **level 1 / level 2 / level 3** — the escalation ladder named during
  this item's exploring round for `worktree-dispatch-attestation`:
  1 = advisory-only (chosen), 2 = hard-refusal-at-merge (deferred),
  3 = OS-level process sandbox (deferred, `tsk-49o`'s own scope).

## Scout evidence

- `src/state/graph-metrics.mjs` (`footprintOverlap`/`footprintConflicts`) — existing dispatch-time PAIR-only footprint-conflict advisory, runs over `frontier()`.
- `src/state/graph-harness.mjs` (`mergeReadiness`, tsk-4j9-2) — existing MERGE-time connected-component grouping + `rankImpact`-ordered serialize suggestion over `proposed` items; the direct precedent D2 deliberately does NOT reuse (different problem shape).
- `src/runner/dispatch.mjs` (`resolveExecutorConfig`) — the one adapter point every cross-provider dispatch (agy/opencode) goes through; D3's identity-capture insertion point.
- `src/runner/frozen-judge.mjs` (STR63 port) — existing narrow advisory (test/CI/lockfile/manifest patterns only); confirmed by reading the code that an absent `footprint` today makes EVERY matching file a hit (opposite convention from `footprintOverlap`'s "absent = never conflicts") — the exact fact D5 resolves, scoped only to the new broadened check.
- `src/runner/merge.mjs` — existing staged verify-gate (`git merge --no-commit --no-ff` → verify on the unstaged tree → commit only if green, clean abort on red/conflict) — the real breakage backstop D3/D5 do not duplicate.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` — confirms agy/opencode dispatch is always `cli/spawn` (rule 3, no exception today), through one adapter (`resolveExecutorConfig`); spawn mechanics inside the adapter are irrelevant to this item's design.
- `docs/reference/capacity-cross-provider-governance.md` — the separate `allowCrossProvider` gate on prompt CONTENT leaving Claude; orthogonal to this item's concern (diff/footprint after the fact, not content before dispatch).
- `docs/explanation/auto-decompose-can-drop-a-locked-decision-from-every-childs-footprint.md` — the concrete precedent (`tsk-2ta`) motivating D4's scope split.
- `docs/distillery/deep-dives/parallel-decomposition-and-merge.md` + `docs/distillery/porting-log.md` — the upstream (bee/beegog/symphony) research this item's two children originate from.
- Impact-analysis capability: `present` (GitNexus, `gitnexus` provider) — Full mode per `CLAUDE.md`'s gate, confirmed fresh this session (`fgos tool query --capability impact-analysis --status present`).

## Canonical references

- `docs/history/parallel-decomposition-footprint-avoidance/DISCUSSION.md` — full discussion this was distilled from (`#design` for the synthesized design + diagram, `#tasks` for the two children's own anchors plus `tsk-1gr`'s cross-reference entry).
- `tsk-1gr` — sibling item, the completeness-gap fix (D4).
- `tsk-49o` — sibling item, the OS-level sandbox (level 3), holds a cross-reference note about what it does NOT cover (D3's base/identity-check half).

## Outstanding questions deferred to planning

None material — D1-D5 cover the product shape completely; `refs` already
points `fgos-coding-planning` at `DISCUSSION.md`'s `#design` (parent) and each
child's own `#task-<slug>` anchor, which already carries a draft goal,
D-IDs, sibling relationships, and a draft verify sketch per task. Naming
choices (e.g. the exact CLI verb for the wave-schedule query) and other
implementation-level decisions belong to `fgos-coding-planning`, not here.
