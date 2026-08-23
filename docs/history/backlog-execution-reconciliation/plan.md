# backlog-execution-reconciliation — plan

Item: `tsk-3vv` (kind `bug`, risk `light`, no deps, no dependents).

Mode: small

## Lane, and why not a bigger or smaller one

Flag count against the ten triage flags (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain): **1**
— *weak proof around the area*. That single flag is the item's own premise:
the strategic backlog layer's status column has never been reconciled
against the execution layer, so no existing record can be trusted as proof
and every verdict has to come from reading real code. No hard-gate flag
applies: nothing here touches auth, deletes data, changes a public
contract, or removes a validation.

1 flag would allow `tiny`, but `tiny` ("a couple of files, one direct
task") understates the work: 30 dense PBI rows each need an independent
code read, and the output needs a re-runnable coverage check so the same
drift is detectable next time rather than re-discovered by hand a third
time. `standard` would overstate it: there are no gray areas, no product
decisions left open, one deliverable shape, and no cross-module blast
radius. `small` — a few files, no gray areas — is the honest size.

No `CONTEXT.md` exists for this item and none is required:
`docs/history/context-md-enforcement-scope/CONTEXT.md` D1 exempts an item
that is `risk: light`, carries no `acceptance`, and has never been through
an `ask`/`answer` round trip. `tsk-3vv` is all three.

## What the item is asking for

Cross-check every PBI row still marked `proposed` in `docs/backlog.md`
against the execution layer (`.fgos/state.json`) **and against real code**,
and produce an evidence-linked verdict per row: PBI id → the fgOS item(s)
that already resolved it → a `file:line` that proves it. Do **not** flip
any PBI status; that is out of scope until a person approves the list.

The item's own worked example is the proof this drift is real: PBI
`p-73d99989` is labelled CRITICAL and still `proposed`, but its complaint
(`reclaimOrphanedCheckout` force-removing any checkout without checking for
a live session) is already patched four ways at
`src/runner/worktree.mjs:201` by `tsk-1os`, `tsk-k8u`, and `tsk-1tm`.

## Measured baseline (2026-08-08, this worktree)

- `docs/backlog.md` — 31 data rows: **30 `proposed`**, 1 `in-flight`
  (`STR73`), 0 `done`. Matches the item's own "0/31".
- `docs/backlog.md` is a **generated file** ("do not hand-edit", rendered
  by `bee backlog render` from `.bee/backlog.jsonl`).
- **`.bee/` does not exist in this repo.** The renderer's source of truth
  is not present here, so this item could not flip a PBI status even if it
  wanted to — the only writable artifact is a separate reconciliation doc.
  This also corrects the item's recorded `footprint` (`docs/backlog.md`),
  which is read-only for this work; the real footprint is the two files
  below.
- `fgos graph`: `tsk-3vv` appears in neither `criticalPath` nor
  `topUnblock` — no dependency ordering constrains it.

## Approach

Two artifacts, one item:

1. **`docs/history/backlog-execution-reconciliation/RECONCILIATION.md`** —
   one row per `proposed` PBI, each carrying a verdict and its evidence.
   Verdict vocabulary, fixed so it stays machine-checkable:
   - `resolved` — real code/state already satisfies the row's CoS. Must
     carry ≥1 fgOS item id **and** ≥1 `path:line` citation.
   - `partial` — some claims of the row are satisfied, some are not. Same
     evidence requirement, plus a plain statement of what remains.
   - `open` — nothing in the execution layer addresses it; the row is
     honestly still `proposed`.
   - `stale` — the row's premise no longer exists (the code or mechanism it
     complains about is gone). Requires a `path:line` or a commit sha.

2. **`scripts/check-backlog-reconciliation.mjs`** — the item's verify.
   It re-derives the `proposed` id set from `docs/backlog.md` itself and
   asserts: every such id appears in `RECONCILIATION.md` exactly once; every
   row carries one of the four verdicts; every `resolved`/`partial` row
   carries both an item id and a `path:line`; every `stale` row carries a
   `path:line` or a sha. It exits non-zero on the first violation and names
   the offending id.

   The script re-reading `docs/backlog.md` (rather than hard-coding today's
   30 ids) is deliberate: that is what makes it catch *future* drift — a
   newly added `proposed` row starts failing the check until someone
   reconciles it, which is precisely the gap this item exists to close.

### Alternatives rejected

- **Flip the PBI statuses directly.** Rejected twice over: the item's own
  scope forbids it without approval, and `.bee/` is absent so the generated
  file cannot legitimately be regenerated from here.
- **Prose-only report, no checker.** Rejected: a one-off list decays the
  same way the backlog already did. The item was itself created because a
  record nobody re-checks stops being true — a report with no re-runnable
  check would reproduce that exact failure.
- **Hard-code the 30 ids in the checker.** Rejected: it would pass forever
  while the backlog grows, which is the drift, not a check for it.
- **Split into per-batch children.** Rejected — see below.

## Risk map

| Component | Risk | What would prove it |
|---|---|---|
| Verdict correctness per PBI row (is it *really* resolved?) | **Medium** — the item exists because plausible-looking records were wrong twice in one day | Each `resolved`/`partial` verdict cites a `path:line` read in this worktree, not a state field or a prior report. `fgos-coding-validating` spot-proves a sample, starting with the item's own worked case `p-73d99989` → `src/runner/worktree.mjs:201`. |
| Checker parsing `docs/backlog.md` | **Medium** (upgraded from Low at the reality gate — proven, not hypothetical) | Run it against today's file: it must find exactly 30 `proposed` ids. See the binding constraint below. |
| Scope creep into flipping PBI status | Low | Footprint contains no backlog/`.bee` write path; the deliverable is additive only. |

impact-analysis: **full** (`fgos tool query --capability impact-analysis
--status present` → gitnexus, `present`, checked 2026-08-08). Recorded for
completeness; blast radius is near-nil here — the item adds two new files
and edits no existing symbol, so no caller graph is disturbed. A `present`
status is not a freshness guarantee (tsk-j7y), which does not matter at
this blast radius.

## Binding constraint from the reality gate (2026-08-08)

Measured in this worktree, not assumed: a naive `line.split('|')[3]` status
lookup extracts **29** `proposed` rows, while a whole-file scan for the
literal `| proposed |` finds **30**. The row for `STR70b` carries a literal
`|` inside its Story cell (6 cells, not 5), so its status lands past index 3
and the row is silently dropped.

A checker written that way would report green while never checking one of
the 30 — the exact class of quietly-untrue record this item exists to end.

The checker therefore MUST:

1. Read the status cell **counting from the right** (or otherwise tolerate
   pipe-bearing cells), never a fixed left-hand index.
2. Cross-check its own extraction: the count of rows it classified
   `proposed` must equal a whole-file `| proposed |` scan. A mismatch is a
   hard failure naming both numbers — a parser that disagrees with itself
   must never produce a passing run.

The ID column is safe as `cells[0]`: all 30 extracted ids match
`^[A-Za-z0-9-]+$` with no exceptions.

## Cases worth proving against

- A `proposed` row whose PBI id appears nowhere in `RECONCILIATION.md` →
  checker fails, naming that id.
- A `resolved` row citing an item id but no `path:line` → checker fails.
- Zero `proposed` ids extracted (backlog format changed) → checker fails
  loudly rather than passing on an empty set.
- A row with a literal `|` inside a cell (`STR70b` today) → still
  classified and still required to be covered, per the binding constraint
  above.
- `STR73`, the one `in-flight` row, is out of the checked set — it is not
  `proposed`, and the item's own text says this work is *input to* STR73,
  not a duplicate of it.

## Order

1. Write `scripts/check-backlog-reconciliation.mjs` first — the checker
   fixes the doc's format contract, so the doc is written to a known shape
   instead of retrofitted to one.
2. Fill `RECONCILIATION.md`, one PBI row at a time, each verdict backed by
   a code read in this worktree.
3. Run `node scripts/check-backlog-reconciliation.mjs` until green.

## Split decision: none

This is one honest piece of work. A split by batches (e.g. 10 rows each)
would give every child the same all-30 coverage verify, which cannot pass
until the last child lands — a verify that is structurally red is not a
verify. Splitting checker from content is worse still: the checker alone
has nothing true to assert. The item proceeds as itself.

## Assumptions

- **A1** — The reconciliation doc lives under
  `docs/history/backlog-execution-reconciliation/` rather than
  `plans/reports/`. Grounded in this repo's own convention that a settled
  fact belongs in a durable doc, not a dated report; not material to the
  item's outcome, so pinned rather than asked.
- **A2** — "PBI row" means a row of the rendered table in
  `docs/backlog.md`, keyed by its `ID` column (`p-*` and `STR*` alike).
  There is no other backlog surface present in this repo to disambiguate
  against.

## Proof surface

`node scripts/check-backlog-reconciliation.mjs`

## Open questions

- Whether any PBI row this pass marks `resolved` should then actually be
  flipped, and by what mechanism given `.bee/` is absent from this repo, is
  deliberately left to the person reviewing the output — the item's own
  text forbids deciding it here.
