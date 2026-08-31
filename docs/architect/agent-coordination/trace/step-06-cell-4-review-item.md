# Cell 6.4 — executing.review-item fake executor

Status: done
Date opened: 2026-08-31

## Scope

Audit + gap-fill `executing.review-item` fake-executor coverage against
step-06-work-attached-team-adoption.md §3/§5/§6. See `trace/current-cell.md`
for full contract and the audit question that must be answered first.

## Audit answer

**Finding: by design, not a gap.** The `lastRunResult` self-fetch asymmetry
between `chooseStageOperation`'s planning branch (self-fetches via
`findLatestAssignmentRunResult`, `operation-choice.mjs:719-721`) and its
executing/`review-item` branch (no self-fetch; only reads the `lastRunResult`
param the caller supplies, `operation-choice.mjs:854`) does not create a real
production gap, for three independent reasons, each confirmed by reading the
actual code paths (not inferred):

1. **Every real call site dispatches and interprets review-item in ONE call,
   never in two.** `executeDriverOperationChoice`'s `dispatch === 'assignment'`
   branch (`operation-choice.mjs:1943-1984`) calls `buildAssignment` →
   `executeAssignment` (awaits the executor to completion) →
   `interpretAssignmentRunResult`, all inline, in the same function call. There
   are exactly three call sites of `chooseStageOperation` in the whole repo
   (grepped `src/`, `bin/`, excluding tests): `loop.mjs:898` (per-claim
   executing-stage dispatch — the only one that ever reaches the
   `review-item` branch), `loop.mjs:1519` (plan-sweep, planning stage only),
   and `bin/fgos.mjs:1393` (`fgos plan` CLI verb, hardcoded to `validate-plan`
   only, `bin/fgos.mjs:1404-1428`). None of the three ever passes
   `lastRunResult` in, and only `loop.mjs:898` ever produces a `review-item`
   choice — so a "later, separate `runOnce` call passes in a stale
   `lastRunResult`" scenario is structurally unreachable for review-item: the
   parameter that would carry it is never populated by any caller, for any
   operation, and review-item's own dispatch+interpret round-trip never spans
   two calls to begin with.

2. **No code path builds a review-item Assignment without also executing and
   interpreting it in the same call.** `buildAssignment` is invoked from
   exactly one place (`operation-choice.mjs:1944`, inside
   `executeDriverOperationChoice`'s assignment branch), immediately followed
   by `executeAssignment` and `interpretAssignmentRunResult` in the same
   function body. The generic `dispatch.mjs execute --assignment <id>` CLI
   path (`dispatch/cli.mjs:859-878`) that COULD run an assignment out-of-band
   requires an `assignment.json` to already exist on disk — nothing in the
   repo creates one for `review-item` independently of that same inline
   dispatch+interpret call. So there is no way, today, for a review-item
   Assignment to exist on disk in a "dispatched but not yet interpreted"
   state for a later `runOnce` to discover.

3. **A review-item stop already removes the item from automatic re-sweeping,
   via a different mechanism than caching — and that mechanism is the
   correct one for this operation.** When `interpretAssignmentRunResult`
   returns `stop: true` for review-item (e.g. missing evidence, insufficient
   confidence), `loop.mjs:916-927` sets `finalStatus = 'blocked'` (because
   `isSecondary` is true for `review-item`, `loop.mjs:918`) via
   `settleClaim`. A `blocked` item drops out of `readyWork`'s automatic
   frontier scan — it does NOT get re-swept every tick the way a
   still-`todo` planning item does. This is why `validate-plan`'s self-fetch
   exists and `review-item`'s doesn't: a planning item that fails
   validate-plan and stays `todo`/`planning` (Work lifecycle explicitly
   "untouched" per `loop.mjs:1536`) gets re-evaluated by the plan sweep on
   EVERY subsequent tick with `planExists && validationDue` still true
   (`operation-choice.mjs:784-795`) — without the self-fetch + plan-hash
   freshness check (`operation-choice.mjs:693-717`), that would re-dispatch a
   brand new validate-plan Assignment every tick forever, an unbounded
   per-tick cost leak against unchanged `plan.md` content. Review-item has no
   equivalent unbounded-resweep exposure: a stop parks the item at
   `blocked`, and resuming from `blocked` (a human/driver clearing the
   blocker) should legitimately re-review against whatever new diff/verify
   evidence exists at that point, not replay a stale cached verdict — so a
   self-fetch here would risk the opposite failure mode (reusing an outdated
   review verdict against changed evidence, since diff/verify freshness has
   no single-file mtime/hash analogous to `plan.md`'s).

Conclusion: the asymmetry is intentional given the two operations' different
lifecycle-loop shapes (planning items can be re-swept indefinitely while
`todo`; review-item stops always park at `blocked`), not an unwired
production gap. No code change made; no STOP/report-to-coordinator triggered.

## Gap analysis vs step-06 §6 test list

Of the 7 scenarios in §6, the two that are Cell 6.4's actual scope
(`review-item`-specific) plus the two cross-cutting ones that name
`review-item` implicitly:

| §6 scenario | Status for `review-item` | Evidence |
|---|---|---|
| "executing review-item reject routes to fix operation" | **Already covered** (Cell 6.0) | `loop.test.mjs:2390` (REJECT verdict + existing candidate routes to fix), `operation-choice.test.mjs:617` ("reject routes to fix operation without lifecycle...") |
| APPROVED + passing verify / failing verify (Slice 6.2 acceptance, not a literal §6 row but covered by the same evidence table row) | **Already covered** (Cell 6.0) | `loop.test.mjs:2469`, `loop.test.mjs:2540` |
| missing-evidence gate (Slice 6.2 "review Assignment reads diff/verify evidence refs") | **Already covered** (Cell 6.0) | `loop.test.mjs:2608`, `operation-choice.test.mjs:740` (bound-refs), `operation-choice.test.mjs:1600` |
| "governance-blocked executor returns a stop, not success" | **Already covered, and already review-item-specific** | `operation-choice.test.mjs:1351` — seeds `review-item` task-spec, `work.stage: 'executing'`, `secondaryOperation: 'review-item'`, asserts `outcome.reason === 'assignment-review-item-failed'` and Work status/stage untouched |
| "Herdr/visibility fields do not affect confidence" | **Gap found — was validate-plan-only** | Pre-existing `operation-choice.test.mjs:1381` ("Step 06 Herdr and visibility tracking fields do not alter confidence ladder judgment") only exercises `choice: { operation: 'validate-plan' }` and asserts `reason === 'validate-plan-ready'`. The `review-item` branch of `interpretAssignmentRunResult` (`operation-choice.mjs:1661-1729`) is a structurally distinct code path (different evidence-ref binding, different verdict vocabulary, different reason codes) — a validate-plan-only test gives no proof coverage that `herdrStatus`/`herdrPane`/`visibility` fields on a review-item `agentClaim` are similarly inert. Read the review-item branch to confirm it never references those fields (confirmed: only `evidenceRefs`, report text, and `verdict` drive the outcome) — this is exactly the kind of governance property (§4 "Do not trust Herdr pane status") that needs its own proof per operation, not one shared test. **Fixed below.** |
| "executing scout-blast-radius report does not mutate Work" | Out of scope — Cell 6.5's job (not review-item) | n/a |
| "scoped-subtask requires changed-file evidence" | Out of scope — Cell 6.6's job (not review-item) | n/a |

## New tests (if any)

One test added to `test/runner/operation-choice.test.mjs` (inserted right
after the existing "Step 06 executing.review-item approval is not a Work
lifecycle edge" test, ~line 697):

`'Step 06 executing.review-item Herdr and visibility tracking fields do not alter confidence ladder judgment'`

Mirrors the pre-existing validate-plan-only Herdr/visibility test's pattern,
but exercises the review-item branch directly via `interpretAssignmentRunResult`
with `operation: 'review-item'`, real bound diff/verify refs, and a
`agentClaim` carrying `herdrStatus`/`herdrPane`/`visibility` fields, for BOTH
verdict directions:

- APPROVED + herdr/visibility fields present → `canAdvanceEdge: false`,
  `stop: false`, `canProceed: true`, `reason: 'review-item-approved'`
  (unaffected by the extra fields).
- REJECT + herdr/visibility fields present → `canAdvanceEdge: false`,
  `stop: false`, `nextOperation: 'fix-verify-red'`,
  `reason: 'review-item-rejected-route-fix'` (unaffected by the extra
  fields).

No `loop.mjs`, `operation-choice.mjs`, or any other production file was
touched — this cell's finding was "no gap to fix," only a missing test.

## Regression battery

```
node --test test/runner/operation-choice.test.mjs test/runner/loop.test.mjs \
  test/runner/assignment-runresult.test.mjs test/runner/assignment-dispatch.test.mjs \
  test/e2e/runner-loop.test.mjs test/cli/fgos-stage.test.mjs
```

Result: `tests 293, pass 293, fail 0, cancelled 0, skipped 0`.

`operation-choice.test.mjs` alone: `tests 119, pass 119, fail 0` (118 pre-existing
+ 1 new).

## Status

done — audit resolved as by-design (no gap), one genuinely missing
review-item-specific Herdr/visibility test added and passing, full
regression battery green. No production code touched.
