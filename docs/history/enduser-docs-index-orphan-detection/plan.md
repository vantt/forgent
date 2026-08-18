# plan: widen enduser-docs-index-stale to detect orphan index entries (tsk-uky)

Mode: tiny

Flag count: 1 (auth: no, authorization: no, data model: no, audit/security:
no, external systems: no, public contracts: no — internal doctor
check/fix, no consumer-facing contract, cross-platform: no, existing
covered behavior: **yes** — `checkEnduserDocsIndexStale` already has 6
tests in `test/setup/checks.test.mjs:644-713`, so this widens tested
behavior rather than adding untested surface, weak-proof area: no —
mirrors the already-tested comparison shape the same function already
uses, multi-domain: no). 1 flag, a couple of files, one direct
comparison-widening task, no gray areas — `tiny`, lighter than the
sibling item (`tsk-1m0`, `docs/history/doctor-check-enduser-docs-index-
stale/plan.md`, landed `small`) that built this check from scratch across
4 branches; this item only adds one more comparison direction to an
already-built, already-tested function.

`fgos graph --json` (`tsk-uky`): isolated component, no `deps`, no
parent, no children — no split candidate, proceeds as one item.

`fgos tool query --capability impact-analysis --status present`: GitNexus
present → `impact-analysis: full`. Not load-bearing here — the change adds
a new comparison branch inside `checkEnduserDocsIndexStale` without
altering `fixEnduserDocsIndexStale` or any caller's contract (confirmed by
research below: the fix already regenerates bidirectionally via full
overwrite), so no proof point leans on blast-radius evidence.

## Approach

**Chosen path**: widen `checkEnduserDocsIndexStale` (`src/setup/
registrations.mjs:1858-1879`) to compute a second count — index entries
whose `docPath` is no longer among the freshly-enumerated on-disk `entries`
— alongside the existing `missing` count, and fail when either is nonzero.
Confirmed live in this session (see `RESEARCH.md`, 2026-08-18 round):

- `checkEnduserDocsIndexStale` today only computes `missing = entries.
  filter((e) => !indexedPaths.has(e.docPath))` — one direction.
- `fixEnduserDocsIndexStale` → `generateEnduserDocsIndex`
  (`src/report/enduser-index-generate.mjs:105-118`) already writes the
  freshly-computed `entries` as a full overwrite whenever it differs from
  `previousContent` — it already drops orphans and adds missing entries in
  one call. **No change needed to the fix path.**
- This item's description cites `docs/history/doctor-check-enduser-docs-
  index-stale/CONTEXT.md` D2 as the original one-directional scoping
  decision, explicitly conditioned on "no orphans observed yet" — that
  condition is now met (36 orphans observed 2026-08-18, confirmed and
  already cleaned up as a one-off, commit `ecb2f3c9`). D2 lives in the
  sibling feature's own `CONTEXT.md`; this item does not reopen or edit it
  — it acts on the condition D2 itself named for a future item to widen
  scope.

**Alternatives rejected**:
- A second doctor check id for orphans — rejected: same check already
  reads both `entries` (fresh on-disk) and `indexedPaths` (from-index) in
  one place; splitting into two checks doubles the `computeEnduserDocsIndex`
  call and the message surface for no benefit, and the sibling check
  `decision-index-stale` already proves the "diff both directions in one
  check" shape works fine here (per the item's own description, contrasting
  the two checks).
- Reimplementing the fix's regeneration to explicitly special-case orphans
  — rejected: research confirmed `generateEnduserDocsIndex` already does a
  full overwrite, so orphans are already dropped; adding special-case logic
  would duplicate what a full overwrite already does for free.

**Risk map**:

| Component | Risk | Proof point |
|---|---|---|
| Orphan-direction comparison duplicating the fix's own overwrite logic | low — pure read-only `Array.filter`/`Set.has`, same primitives the existing `missing` computation already uses | Test: an index entry whose `docPath` is not among on-disk `entries` → check fails, message reports an orphan count |
| Message wording change breaking an existing test's regex match | low — existing tests assert `/\d+\/\d+/` and `doesNotMatch(/second\.md/)` (count-only, no path list); a widened message keeping the same count-style shape satisfies both | Existing 6 tests in `checks.test.mjs:644-713` still pass unmodified after the change |
| No-drift path now needing to consider both counts as zero | low — same `if (missing === 0)`-style guard, just widened to `missing === 0 && orphans === 0` | Test: index already matches on-disk docs exactly (no missing, no orphans) → `passed: true`, unchanged from today |

**Files touched**:
- `src/setup/registrations.mjs` — widen `checkEnduserDocsIndexStale`
  (lines 1858-1879) to also compute the orphan count and fold it into the
  pass/fail decision and message. No change to `fixEnduserDocsIndexStale`
  (confirmed already-bidirectional above).
- `test/setup/checks.test.mjs` — add a new test case: an index entry with
  no matching on-disk doc → check fails, message reports the orphan
  count, not a path list (mirrors the existing "reports a count, not a
  path list" test at line 653). Extend the existing "up to date" test's
  intent implicitly (no on-disk drift AND no orphan already passes once
  the new branch is added, since both counts are zero there) — no new test
  needed for that case, the existing one already covers it once the
  function change lands.

**Order**: no ordering question — one function change, one new test, no
dependencies, no split.

## Shape

Tiny mode — one direct pass:

1. Widen `checkEnduserDocsIndexStale` in `registrations.mjs` to compute
   an orphan count in the reverse direction and fail/report on either
   count being nonzero.
2. Add one new test case to `test/setup/checks.test.mjs` covering the
   orphan-only-drift case.
3. Run `node --test test/setup/checks.test.mjs` — the item's own verify.

**Cases to prove** (tiny-mode depth):
- Orphan-only drift: index has an entry whose doc was deleted from disk,
  on-disk set otherwise matches → check fails, message reports the orphan
  count, no path list.
- Existing 6 tests (missing-manifest, one-doc-missing, up-to-date, alias,
  fix-regenerates, fix-idempotent) still pass unmodified — regression
  guard for the widened comparison.

## Outstanding questions

None
