# merge-standardization — CONTEXT

## Feature boundary

`tsk-4j9` ("Chuẩn hóa merge"). Today an item that finishes in a worktree
reaches `status: proposed` via `fgos return <id>`, and a person decides by
hand which `proposed` item to merge next and runs `fgos approve <id>`
(local git-merge path) or `approve --github --pr <n>` — no ordering tool,
no dependency-wait enforcement, no automation.

This item adds:

1. An ordering/selection layer over the existing `proposed` set: items
   whose `deps` are not yet merged wait; free items are ordered by impact.
2. A new agent-facing skill (working name `fgOS:merge next`, final name
   open) that selects the best next item per that ordering and drives the
   merge itself, through forgent's existing standard merge process/gate
   (`approve`, CTR005) — not a parallel merge mechanism.

Explicitly OUT of scope for `tsk-4j9` itself: renaming the `proposed`
status literal. A full rename (schema + event replay + 259 cross-repo
references) is wanted, but deferred to a separate child item, done only
after this item's merge functionality ships (user's own sequencing call).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | State model: reuse `status === 'proposed'` exactly as-is — no new state/artifact for "ready to merge." The existing `fgos return <id>` flow (commit + idempotent move to `proposed`) already covers subtask 1 ("finish in worktree → commit → register, skip if already done"); no new code needed for that part. |
| D2 | A full literal rename of `proposed` to a clearer name (user's framing: "proposed" reads too generic for what is really a merge-pending state) is wanted, but is explicitly **out of scope for this item** — sequenced as a separate follow-up child item, started only after this item's merge functionality lands. The new literal name is an open question for that follow-up item (see below), not this one. |
| D3 | Impact ranking for ordering free (non-conflicting, dependency-clear) items: reuse `rankImpact` (`src/state/impact.mjs`, already exposed via `fgos triage`) as-is, whatever its real ordering does — no new scoring metric, no re-derived sort. **Correction (found at `fgos-coding-implement`, `tsk-4j9-2`):** this D3 row previously said "blocking-fan-out count, then goalTier" — backwards from the actual comparator (`src/state/impact.mjs:98-103`): `goalTier` (mvp > milestone > none) is the PRIMARY key, blocking-fan-out descending is second, component size third, id last. The reuse decision itself is unaffected (`mergeReadiness` in `src/state/graph-harness.mjs` calls `rankImpact(view)` directly and filters its real output — it never reimplements the sort), only this row's prose description of the ordering was wrong. |
| D4 | ~~Conflict detection for "not conflicting": reuse `footprintConflicts` (already exposed via `fgos conflicts`, declared file-footprint overlap) as-is.~~ **Revised at `fgos-coding-validating`** (empirical check: `frontier()` in `src/state/frontier.mjs:80` only includes `status === 'todo'` items; `footprintOverlap()`/`footprintConflicts()` in `src/state/graph-metrics.mjs:509`/`src/state/store.mjs:771` only compares pairs within that frontier result. `proposed` items are never `todo`, so `footprintConflicts` as it exists today is structurally empty for any merge-ready set — literal reuse is not buildable). **D4-revised**: `test/state/graph-metrics.test.mjs:433-478` (4 existing tests) call `footprintOverlap(view)` directly and assert its internal frontier-filtering as part of its contract — changing its own parameter to a pre-filtered candidate list would break that call convention. Instead: extract the pure pairwise shared-path comparison already inside `footprintOverlap` (`src/state/graph-metrics.mjs:509-524`) into its own reusable function taking an explicit candidate list (name is an implementation choice, not locked here); `footprintOverlap(view)` becomes a thin wrapper calling it with `frontier(view)` — byte-for-byte unchanged behavior, all 4 existing tests untouched, `footprintConflicts`/`fgos conflicts` untouched; the new merge-ordering function calls the same extracted comparison with the proposed-ready set instead. One shared overlap algorithm, no duplication, zero regression risk to the existing frontier-conflict feature. No additional pre-check signal beyond it — a real git-level conflict a footprint check misses already fails safe today (`approve`'s local-merge path runs `git merge --no-commit --no-ff`, aborts on conflict, parks the item `blocked` reason `merge-conflict`, main untouched). Missing a conflict costs one wasted auto-merge attempt, never main integrity — accepted as sufficient; adding a stronger pre-check would only be an efficiency gain, not a safety one. |
| D5 | Semantic/business-logic conflict (two changes conflicting in intent, not in files) has no mechanical detector anywhere in this codebase today and is out of scope to build one for this item — not reusable, not newly built here. |
| D6 | `merge next`'s action: it does not just recommend — it selects the best next ready item per D3/D4/dependency-wait ordering and **performs the merge itself**, by invoking the existing standard merge process (`approve`'s mechanics / CTR005 gate), never a parallel bespoke merge path. If the existing process needs improving to serve unattended/agent-driven invocation, improve that process in place rather than building a second one. Runs unattended, driven by an agent, not requiring a person to click through per-merge — CTR005's `role: 'human'` attribution is already structural in the `approve` verb itself (hardcoded at the call site, `moveWork(..., { role: 'human' })`) regardless of what process invokes it, so an agent-driven skill calling `approve` satisfies the existing gate as-is; this item does not touch or weaken that attribution. |
| D7 | **Added at `fgos-coding-implement`, `tsk-4j9-4`.** `merge next`'s implementation recurses into the exact same `approve` code path (via `runVerb('approve', ...)`, a pure dispatcher with no side effects of its own) rather than duplicating any merge logic — literal fulfillment of D6. This surfaced a second, separate safety gate `approve` already has beyond CTR005: the Iron Law (D16/D17), which refuses a runner-sourced diff touching a self-modifying-capable module without `--acknowledge-iron-law`, specifically because that flag is meant to confirm a HUMAN verified failing-test-first proof. Decided (confirmed with the user): `merge next` **never** passes `--acknowledge-iron-law` itself and never falls through to the next-ranked item when the top pick trips it — it reports which item and why, merges nothing, and stops. Auto-acknowledging would defeat the Iron Law gate for exactly the unattended-automation case it exists to guard against. |

## Pinned terms

- **"Ready to merge"** — an item at `status: proposed` whose every `deps`
  entry is itself already `done` (merged). An item with an unmerged
  dependency is not ready, regardless of its own state.
- **"Free item"** — a ready-to-merge item with no `footprintConflicts`
  pairing against another ready-to-merge item.
- **"Impact"** — exactly `rankImpact`'s existing blocking-fan-out + goalTier
  signal (D3); not a new metric, not `priority`/`intent` (separate,
  still-proposed schema fields per `impact.mjs`'s own comments).

## Scout evidence cited

- `docs/platform-foundations.md` L9 ("Thang hoàn tất của MỘT việc: run ≠
  merge ≠ durable"): `proposed` = run-complete; `done` via the merge gate
  (CTR005) = merge-complete. This item's automation sits on top of that
  gate, never replaces it (D6).
- `bin/fgos.mjs` `case 'approve'` (~line 1610 onward): current preconditions
  are `status === 'proposed'` and structural worktree/main-checkout guards;
  no check today that an item's `deps` are themselves merged first — the
  dependency-wait behavior this item adds is genuinely new, not a
  reformalization of existing behavior.
- `src/state/impact.mjs` (`rankImpact`, P21): blocking-fan-out ranking
  already exists, already excludes `done` items on both sides, already
  tie-breaks by `goalTier`. Reused as-is per D3.
- `fgos conflicts` (`footprintConflicts`): declared file-footprint overlap
  between ready items, already exists. Reused as-is per D4.
- `rg -c "'proposed'|\"proposed\""` across `src/`, `bin/`, `test/`, `docs/`:
  259 total references, including `test/state/backward-compat.test.mjs` —
  concrete blast-radius evidence behind deferring the rename (D2).

## Child item resolutions

- **`tsk-4j9-1`** ("worktree return path: auto-commit + register merge-list
  entry, idempotent") — the engine's own decompose judgment spun this out
  as a buildable child, but it restates D1 exactly: `fgos return <id>`
  already commits, moves the item to `proposed`, and is already idempotent
  by construction (`return` requires `status === 'doing'`; calling it
  again on an already-`proposed` item errors "nothing to return" rather
  than double-registering, `bin/fgos.mjs:1373-1375`). Confirmed with the
  user at `fgos-coding-implement` time: closed as a no-op, no new code. This note
  is the item's own artifact/evidence for its `return`.

## Outstanding questions deferred to planning / the follow-up rename item

- Exact new literal name for `proposed` (the deferred rename item, D2) —
  not decided here; that item's own `fgos-coding-exploring` pass should lock it.
- Whether the rename, when it happens, is a hard literal migration
  (touching all 259 references + event-replay backward-compat) or some
  softer transition — user said "làm full" (do the full/real rename), so
  the answer leans toward a real literal migration, but the follow-up
  item should confirm this explicitly rather than inherit it silently.
- Sizing/splitting of `tsk-4j9`'s own remaining scope (ordering logic +
  `merge next` skill + any graph-harness service function) is
  `fgos-coding-planning`'s job, not locked here.
