# Why merge-standardization (`tsk-4j9`) reuses existing mechanisms instead of building new ones

`tsk-4j9` ("Chuẩn hóa merge") added an ordering/selection layer over the
existing `proposed` set and a `merge next` skill that picks the best
ready item and merges it. The recurring shape of its locked decisions
(`docs/history/merge-standardization/CONTEXT.md`) is reuse-first: every
piece the feature needed already existed somewhere in the codebase, and
the real work was wiring to it correctly rather than building a parallel
mechanism.

## State model: no new "ready to merge" state

> D1 | State model: reuse `status === 'proposed'` exactly as-is — no new
> state/artifact for "ready to merge." The existing `fgos return <id>`
> flow (commit + idempotent move to `proposed`) already covers subtask 1
> ("finish in worktree → commit → register, skip if already done"); no
> new code needed for that part.

The instinct to build a registration mechanism for "this item is done and
ready to merge" was checked against the actual FSM and found redundant:
`proposed` already means exactly that (`docs/platform-foundations.md` L9,
cited in CONTEXT.md: "Thang hoàn tất của MỘT việc: run ≠ merge ≠
durable").

## Ordering: the existing impact ranker, not a new score

> D3 | Impact ranking for ordering free (non-conflicting, dependency-clear)
> items: reuse `rankImpact` (`src/state/impact.mjs`, already exposed via
> `fgos triage`) as-is, whatever its real ordering does — no new scoring
> metric, no re-derived sort.

This decision survived a correction mid-build: the CONTEXT.md row
originally described the comparator backwards ("blocking-fan-out count,
then goalTier"), and `fgos-coding-implement` on `tsk-4j9-2` found the real order
is `goalTier` primary, blocking-fan-out second. The reuse decision itself
did not change — `mergeReadiness` (`src/state/graph-harness.mjs`) calls
`rankImpact(view)` directly and filters its real output rather than
reimplementing the sort — only the prose describing the existing order was
wrong and got fixed.

## Conflict detection: extract, don't reimplement

D4 started as "reuse `footprintConflicts` as-is" and had to be revised
after an empirical check showed it was structurally unbuildable that way:

> `frontier()` in `src/state/frontier.mjs:80` only includes `status ===
> 'todo'` items; `footprintOverlap()`/`footprintConflicts()` ... only
> compares pairs within that frontier result. `proposed` items are never
> `todo`, so `footprintConflicts` as it exists today is structurally empty
> for any merge-ready set — literal reuse is not buildable.

The resolution kept reuse as the goal while respecting an existing test
contract (`test/state/graph-metrics.test.mjs:433-478` asserts
`footprintOverlap`'s frontier-filtering behavior directly): the pure
pairwise shared-path comparison already inside `footprintOverlap` got
extracted into its own function taking an explicit candidate list, with
`footprintOverlap(view)` becoming a thin wrapper over it —
"byte-for-byte unchanged behavior, all 4 existing tests untouched... one
shared overlap algorithm, no duplication, zero regression risk."

## `merge next` drives the existing merge gate, never a parallel one

> D6 | `merge next`'s action: it does not just recommend — it selects the
> best next ready item per D3/D4/dependency-wait ordering and **performs
> the merge itself**, by invoking the existing standard merge process
> (`approve`'s mechanics / CTR005 gate), never a parallel bespoke merge
> path.

This is the same reuse principle applied to the mutating half of the
feature, not just the read-only ranking half.

## Where reuse meets a safety gate it must not weaken

Recursing `merge next` into `approve` (D7) surfaced a second gate beyond
CTR005 — the Iron Law, which blocks a runner-sourced diff touching a
self-modifying-capable module without `--acknowledge-iron-law`. The
resolution drew a hard line at what reuse is allowed to do to a safety
gate:

> Decided (confirmed with the user): `merge next` **never** passes
> `--acknowledge-iron-law` itself and never falls through to the
> next-ranked item when the top pick trips it — it reports which item and
> why, merges nothing, and stops. Auto-acknowledging would defeat the Iron
> Law gate for exactly the unattended-automation case it exists to guard
> against.

## The general shape

Across D1, D3, D4, and D6, the same move repeats: check whether the
mechanism already exists before building one, and when it does, reuse it
literally rather than reimplementing a parallel version — but reuse never
extends to weakening a gate the reused code path already enforces (D7).
Where reuse turned out not to be literally buildable (D4), the fix was to
extract the truly shared logic rather than duplicate it, keeping one
algorithm instead of two.
