# Research log — doctor-check-enduser-docs-index-stale

## 2026-08-18 — tsk-uky discovery: confirm current shape before widening the check bidirectionally

**Asked:** Does `checkEnduserDocsIndexStale`/`fixEnduserDocsIndexStale`/
`computeEnduserDocsIndex` still match the item description's claims (exact
function bodies, one-directional comparison, message wording, and whether
the fix path already regenerates bidirectionally)? Where does the existing
test coverage for this check live?

**Checked:**
- `src/setup/registrations.mjs:1858-1894` — `checkEnduserDocsIndexStale`,
  `fixEnduserDocsIndexStale`.
- `src/report/enduser-index-generate.mjs:73-119` — `computeEnduserDocsIndex`,
  `generateEnduserDocsIndex`.
- `test/setup/checks.test.mjs:644-713` — existing test cases for this check
  id.
- `docs/history/doctor-check-enduser-docs-index-stale/CONTEXT.md:25` — D2,
  the original one-directional scoping decision this item's description
  cites.

**Found:**
- `checkEnduserDocsIndexStale` (`src/setup/registrations.mjs:1869-1871`)
  builds `indexedPaths` from `previousContent` (last-written index) and only
  computes `missing = entries.filter((e) => !indexedPaths.has(e.docPath))`
  — confirmed one-directional exactly as the item describes and D2 recorded.
  No orphan-direction computation exists in this function today.
- Message wording is `` `${missing}/${total} tài liệu end-user chưa có
  trong index -- chạy fgos docs-index` `` on fail,
  `` `${total}/${total} tài liệu end-user có trong index -- up to date` ``
  on pass — both single-count, no room for a second (orphan) count without
  a wording change.
- `fixEnduserDocsIndexStale` calls `generateEnduserDocsIndex`, which (per
  `enduser-index-generate.mjs:105-118`) writes the freshly-computed
  `entries` (from `enumerateDocEntries`, real on-disk scan) unconditionally
  replacing `previousContent` whenever they differ — this is a full
  overwrite, not a merge, so it already drops orphans and adds missing
  entries in one call. Confirms the item's claim that the fix path needs no
  change, only the check's own comparison + message.
- `test/setup/checks.test.mjs` already has 6 tests for this check id
  (644-713: missing-manifest, one-doc-missing, up-to-date, alias-quadrant,
  fix-regenerates, fix-idempotent) using `writeEnduserDoc`/
  `writeEnduserManifest` helpers from
  `test/setup/helpers/setup-checks-harness.mjs`. This is the verify surface
  a widened check must extend with an orphan-direction case — same file,
  same helpers, no new test infra needed.
- D2 (`CONTEXT.md:25`) is the exact decision this item's own description
  cites as now-superseded ("a future item can add it if orphans are ever
  observed" — condition met, 36 orphans observed 2026-08-18).

**Still open:** nothing — evidence fully confirms the item's own stated fix
direction and root cause. No further research needed before `clear`.
