# Why the retrospective content gate checked the wrong fields

`checkRetrospectiveContent` (`src/state/cleanup-harness.mjs`) is the
`cleanup -> done` gate that exists to catch a crashed or partial
retrospective run — one that transitioned an item's status without ever
producing real synthesis output. D8 of
`work-item-status-delivered-retrospective-cleanup` names exactly what
counts as evidence of that: "a genuine outcome/docType record exists."
The implementation read different fields entirely.

## What the code actually checked

```js
hasOutcome = Boolean(outcome.actual || outcome.predicted)
hasDecision = decisionsById[id].length > 0
```

`outcome.actual` and `outcome.predicted` are written by `addOutcome` at
ordinary claim/return time — they exist for every item that went through
a normal work lifecycle, whether or not `fgos-coding-compounding` ever ran
against it. The gate was measuring "did this item get claimed and
returned," not "did retrospective produce anything." D8 named `docType`
specifically; the code never read it.

## The wrongness ran in both directions

A real-data audit on 2026-08-05, across the 55 items then sitting at
status `cleanup`, found both failure shapes:

- **3 false passes** — `tsk-3nx`, `tsk-4c05`, `tsk-3uj` had no
  `docType`/`docPath` at all (retrospective had never produced anything
  for them), but passed anyway because `predicted` existed from the
  ordinary claim flow. This is precisely the crashed/partial-run case D8
  exists to catch, and the check let all three through.
- **2 false fails** — `tsk-3go-2`, `tsk-3go-3` had a real `docType:
  how-to` and a real `docPath` on disk, but were blocked because they
  lacked `predicted`/`actual` — fields that have nothing to do with
  whether synthesis happened.

Neither miss was rare or one-off: 5 of 55 items were misjudged, in both
directions, by a check whose two branches simply named the wrong data.

## A recorded path is not evidence the file exists

Reading `docType`/`docPath` correctly is still not sufficient on its own.
A sibling defect (retro-loop sweep documents landing on orphaned branches
— see `why-retrospective-documents-vanished-on-orphaned-branches.md`)
proved that `docPath` can be recorded on an item's outcome while the file
it names never actually lands in the working tree. So the fix pairs the
field-name correction with a real file-existence check
(`fs.existsSync`, resolved against the repo root) — a recorded path alone
is not accepted as proof; the file has to actually be there.

## The fix, and what stayed the same

- `checkRetrospectiveContent` now reads `outcome.docType`/`outcome.docPath`
  instead of `outcome.actual`/`outcome.predicted`, matching D8's own named
  field.
- When `docType`/`docPath` are present, the check also confirms the file
  exists on disk before passing.
- A `docType`/`docPath` recorded but the file missing from disk is a
  genuine content-integrity failure, landed in the same `failed` bucket
  as the check's other two conditions — not a softer "not ready yet"
  outcome.
- The `hasDecision` branch (at least one decision record exists) stays a
  valid alternate pass, unchanged — some items genuinely don't produce an
  end-user document, and a decision record is legitimate evidence that
  retrospective still did real work.

This check fires at the `cleanup -> done` gate — seven days after
`delivered`, by design (TTL). It is deliberately kept as defence in
depth, not the primary guard against document loss: the primary guard is
the write-then-tag invariant enforced earlier, at `fgos compound` itself
(see the sibling document above). A check that only fires this late can
still catch what slips past that earlier guard, but a park at this stage
is a remedy, not a repair — recovering the pre-existing false
passes/fails this audit found (`tsk-3nx`, `tsk-4c05`, `tsk-3uj`,
`tsk-3go-2`, `tsk-3go-3`) is separate manual follow-up, not something
this fix does automatically.
