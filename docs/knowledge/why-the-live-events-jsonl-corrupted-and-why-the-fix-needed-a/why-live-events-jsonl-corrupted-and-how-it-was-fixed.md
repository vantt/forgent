---
type: explanation
title: Why the live events.jsonl corrupted, and why the fix needed a split
tags: []
timestamp: 2026-07-30T00:00:00.000Z
source_capture_ids: [tsk-n4i]
framework: diataxis
mode: explanation
---
# Why the live events.jsonl corrupted, and why the fix needed a split

`tsk-n4i` was filed after `tsk-66l`'s dry run of
`scripts/migrate-status-proposed-to-awaiting-approval.mjs` refused to run
against the shared live `.fgos/events.jsonl`, tripping its own
seq-contiguity guard. This explains what actually caused that, why it
wasn't the race `events.lock` already guards against, and why the repair
ended up as two separate items instead of one.

## The corruption was a merge-conflict artifact, not a lock bug

`events.lock` (commit `3adfb3f`, 2026-07-17) already closes the race window
`src/state/events.mjs`'s own design comment calls "spike-confirmed
duplicate-seq corruption" — two processes reading the same last `seq` and
both writing `N+1`. It was tempting to assume the live store's corruption
was a lingering instance of exactly that. `git blame` on the corrupted
lines said otherwise:

> "Root cause is ad hoc git-merge-conflict hand-resolution on tracked
> `.fgos/events.jsonl` (commits `aa9ae156`, `9e3fb469`, both 2026-07-28),
> not an appendEvent race -- events.lock (commit `3adfb3f`) predates the
> corruption by 11 days."
> — real locked decision D1, `docs/history/live-events-seq-corruption/CONTEXT.md`

The two commits used two *different* ad hoc resolution strategies in the
same session:

> `fix: resolve events.jsonl merge conflict - keep both sides sorted by timestamp`
> `fix: merge tsk-3oa events (keep theirs, rebuild)`
> — real commit messages, quoted in the same CONTEXT.md's evidence section

Neither strategy re-numbers `seq`. Sorting by timestamp or picking "theirs"
both leave whatever duplicate/out-of-order values each branch already had.
This is why the fix (`tsk-n4i-2`) is a *fast-fail check*, not a smarter
merge strategy: correctly 3-way-merging an ordered append-only log is
itself nontrivial new logic, and the actual observed failure rate (two
conflicts, one session) didn't justify that complexity. Catching the break
immediately — instead of it sitting silent for days, as it did here — was
the higher-leverage fix.

## The corruption was mostly harmless, which shaped the fix's scope

Before deciding how much to fix, the blast radius mattered:

> "Blast radius is contained to the two migrate scripts. `readEvents`
> validates only that each line parses as JSON -- no seq check.
> `replay.mjs` folds events in file/array order, never sorts or dedups by
> `seq` value. `cursor.mjs` pagination is explicitly seq-independent by
> design."
> — real locked decision D2, `docs/history/live-events-seq-corruption/CONTEXT.md`

So the live store had been quietly running correctly on top of corrupted
`seq` numbers the whole time — only the two migrate scripts' own
contiguity guards ever noticed. This meant the repair (`tsk-n4i-1`) was
safe to do as a mechanical renumber, and the prevention half (`tsk-n4i-2`)
only needed to *detect* future breaks fast, not re-derive a new ordering
guarantee nothing downstream actually depended on.

## Why the repair itself had to split into two items

The original plan expected one item, split into a repair and a prevention
piece for shaping reasons. Execution found a deeper reason they also had
to be *mechanically* separate:

> "Piece A's first execution pass committed the renumbered
> `.fgos/events.jsonl` onto `fgw/tsk-n4i-1` itself. `fgos merge next`
> correctly rejected that merge (`fgos-write-rejected`) -- a worker branch
> must never carry a change under `.fgos/`; the store's one write door is
> the `fgos` CLI run directly against the main checkout, never a worker's
> own commit."
> — real correction note, `docs/history/live-events-seq-corruption/plan.md`

This is the same ADR0020 one-door-write rule
`docs/explanation/worktree-isolation-axis-decision.md` documents from the
worktree-checkout side; this item hit it from the merge side instead. The
practical consequence: an item whose whole point is fixing `.fgos/`
content can only ever prove its *code* changes (comments, docs, a new
check script) through the normal branch/verify/merge path — the actual
`.fgos/events.jsonl` data fix has to be applied directly against the main
checkout as a separate, direct operator action, verified independently:

> `lines: 1542 lastSeq: 1542 breaks: 0`
> — real post-fix verification, run directly against the live main
> checkout's `.fgos/events.jsonl`

## Related

- `docs/how-to/fix-fgos-write-rejected-merge-block.md` — the concrete
  recipe for the one-door-write rejection this item hit.
- `docs/how-to/resolve-an-events-jsonl-merge-conflict.md` — the recipe for
  correctly resolving the underlying git-merge conflict this item traced.
- `docs/history/live-events-seq-corruption/` — the full CONTEXT.md/plan.md
  record this explanation summarizes.

## Document history (compound-learn capture linkage)

This doc's path
(`docs/explanation/why-live-events-jsonl-corrupted-and-how-it-was-fixed.md`)
is linked to a real compound-learn capture, gathered via `fgos doc-sources
docs/explanation/why-live-events-jsonl-corrupted-and-how-it-was-fixed.md`:

> ```json
> {
>   "id": "tsk-n4i",
>   "predicted": {"tier":"heavy","deps":0,"priorVisits":0,"role":"session","branchHeadAtTake":"f60ae43160a75e8fadd3ccbbc29d472bf45046f5"},
>   "actual": {"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":1},
>   "docType": "explanation",
>   "docPath": "docs/explanation/why-live-events-jsonl-corrupted-and-how-it-was-fixed.md"
> }
> ```
> — real `work.outcome` capture, id `tsk-n4i`

That capture's own work item is the root bug report that started this
whole investigation:

> "Kho .fgos song mang du lieu seq bi loi (trung + nhay/lui, phat hien qua dry-run tsk-66l)"
> — real work item title, id `tsk-n4i`

If a later item traces back to this same root cause, the export skill
accumulates its capture here too, additively, without losing this section
or anything above it.
