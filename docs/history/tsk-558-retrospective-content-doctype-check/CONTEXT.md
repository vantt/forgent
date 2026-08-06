# tsk-558 — `checkRetrospectiveContent` reads the wrong fields and never verifies the file exists

Restore-to-decision, not a design change: D8 of
`work-item-status-delivered-retrospective-cleanup` describes this check as
"retrospective actually produced real content ... a genuine outcome/docType
record exists" — naming `docType` specifically. `checkRetrospectiveContent`
(`src/state/cleanup-harness.mjs:78`) currently reads `outcome.actual`/
`outcome.predicted` — fields `addOutcome` writes at claim/return time, part
of the ordinary work lifecycle, unrelated to whether retrospective itself
ran and produced anything.

## Scout evidence

- `src/state/cleanup-harness.mjs:75-89` (`checkRetrospectiveContent`):
  `hasOutcome = Boolean(outcome?.actual || outcome?.predicted)`,
  `hasDecision = (decisionsById[id]?.length ?? 0) > 0`. Neither reads
  `outcome.docType`/`outcome.docPath`, the fields D8 actually names.
- `src/state/store.mjs:814-830`: `docType` is a real, validated, optional
  field on the outcome record (`DIATAXIS_DOC_TYPES` enum) — confirms the
  field exists and is the right one to read.
- Item's own real-data audit (55 items at status `cleanup`, 2026-08-05):
  3 false passes (tsk-3nx, tsk-4c05, tsk-3uj — no docType/docPath at all,
  passed only because `predicted` exists from the ordinary claim flow) and
  2 false fails (tsk-3go-2, tsk-3go-3 — real `docType`/`docPath` present,
  blocked only because no `predicted`/`actual`). Both directions wrong,
  confirming the fix needs both a field-name correction AND a
  file-existence check, not just a rename.
- Cross-reference (this same session's own recent history, tsk-4jf/tsk-1p9):
  a related item on retro-loop doc orphaning already proved `docPath` can
  be recorded while the file itself never lands in the working tree —
  this item's own "file must actually exist on disk" requirement is not
  speculative, it is the same class of failure already observed for real.
- `checkRetrospectiveContent(view, id)` has no `repoRoot` parameter today
  — `assessCleanupReadiness` (the sole caller, confirmed by `rg`, 1 call
  site) already receives `repoRoot` and threads it into
  `checkMergeStillResolves`; the same threading pattern applies here for
  the new file-existence check.
- Sole caller confirmed: `rg "checkRetrospectiveContent\("` across
  `src/` and `bin/` returns exactly the definition and the one call inside
  `assessCleanupReadiness` — no other reader to update.
- `fgos tool query --capability impact-analysis --status present`:
  GitNexus registered and `present`, index still behind HEAD (`lastCommit:
  251d0b5`, unchanged from the sibling items this session already handled)
  → **impact-analysis: degraded**. `impact` will be run on
  `checkRetrospectiveContent` before it is edited, cross-checked with `rg`
  given the known stale-index gap.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `checkRetrospectiveContent` reads `outcome.docType`/`outcome.docPath` instead of `outcome.actual`/`outcome.predicted`, matching D8's own named field. |
| D2 | When `docType`/`docPath` are present, the check ALSO confirms the file actually exists on disk (`fs.existsSync`, resolved against the new `repoRoot` parameter) before passing — a recorded path alone is not accepted as evidence, per the item's own cited orphaning incident. |
| D3 | `hasDecision` (at least one decision record exists) remains a valid alternate pass — unchanged, per the item's own explicit instruction ("giữ nhánh hasDecision làm đường thay thế hợp lệ cho item không sinh doc"). |
| D4 | `checkRetrospectiveContent` gains a `repoRoot` parameter (threaded from `assessCleanupReadiness`, which already has one) — implementation detail of D2's file-existence check, not a product decision on its own. |
| D5 | A `docType`/`docPath` present but the file missing from disk is a genuine FAIL (not `notReadyYet` — this is a D8 content-integrity failure, same category as the existing two D8 checks, so it lands in `assessCleanupReadiness`'s `failed` array per tsk-4jf's D1/D2 split, never `notReadyYet`). |

## Pinned terms

- **retrospective content**: `outcome.docType` + `outcome.docPath` where
  the file at `docPath` exists on disk, OR at least one decision record
  for the item — never `outcome.actual`/`outcome.predicted` alone (those
  are claim-lifecycle fields, not retrospective-produced content).

## Test plan (already specified in the item, restated for traceability)

- Item with `predicted` but no real doc → FAIL.
- Item with a real doc (`docType`+`docPath`, file exists) but no
  `predicted`/`actual` → PASS.
- Item with `docPath` recorded but the file missing on disk → FAIL.
- Item with only a decision record (no doc at all) → PASS (D3).

## Outstanding / deferred

- Recovering the 3 currently-false-passing and 2 currently-false-failing
  real items (tsk-3nx, tsk-4c05, tsk-3uj, tsk-3go-2, tsk-3go-3) is manual
  operational follow-up once this fix ships — not this item's own code/test
  scope, mirroring tsk-4jf's D4 for the same class of pre-existing-data
  cleanup.
