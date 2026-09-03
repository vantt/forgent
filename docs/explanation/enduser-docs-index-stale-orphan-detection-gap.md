---
authoritative_for: enduser-docs-index-stale doctor check one-directional blind spot, orphan index entry detection
---

# Why `enduser-docs-index-stale` used to miss orphan entries, and how it was widened

`fgos doctor`'s `enduser-docs-index-stale` check
(`checkEnduserDocsIndexStale`, `src/setup/registrations.mjs`) exists to
catch drift between `docs/enduser-docs-index.json` and the real end-user
docs on disk. Until tsk-uky, that comparison only ran in one direction.

## The gap

The check originally computed a single `missing` count: on-disk docs whose
`docPath` was not yet in the index. It never checked the reverse — index
entries whose `docPath` no longer exists on disk at all (an **orphan**).

This was a deliberate, explicitly-scoped decision at the time
(`docs/history/doctor-check-enduser-docs-index-stale/CONTEXT.md` D2):
measured drift on 2026-08-08 and 2026-08-09 showed zero orphans in
practice, so the narrower one-directional check shipped with the condition
"a future item can add [orphan detection] if orphans are ever observed."

That condition was met. `tsk-1lv-4` retired 35 `docs/decisions/*.md` files
as part of a documentation corpus cleanup. Its own declared footprint
(`docs/decisions`, `docs/specs`, `src/runner/merge.mjs`, two drift-check
scripts, one test file) never touched `docs/enduser-docs-index.json`, so
nothing in that item's own scope or verify could have caught the 35 stale
index entries it left behind. Because the doctor check could only see
"missing from index," not "orphaned in index," those 35 entries — plus one
more from an unrelated drift — sat silently wrong until this session found
them by diffing the index against a fresh `computeEnduserDocsIndex` run.

The sibling check, `decision-index-stale` (same file), never had this
blind spot: it diffs the *entire* previous content against freshly
computed content, so any drift in either direction already shows up.
`enduser-docs-index-stale`'s narrower "missing" scan was the only one of
the two with a one-directional hole.

## The fix

`checkEnduserDocsIndexStale` now computes both directions from the same
already-available data (`entries` — the fresh on-disk set — and
`indexedPaths`/`parsedIndex` — the last-written index):

```js
const missing = entries.filter((e) => !indexedPaths.has(e.docPath)).length;
const orphans = parsedIndex.filter((e) => !freshPaths.has(e.docPath)).length;
if (missing === 0 && orphans === 0) { /* passed */ }
```

The fix path (`fixEnduserDocsIndexStale` → `generateEnduserDocsIndex`)
needed no change at all: it already does a full overwrite of the index
whenever content differs, which drops orphans and adds missing entries in
one call. Confirmed live before this item was even scoped — running `fgos
docs-index` dropped all 36 stale entries and added the 1 missing one in a
single commit (`ecb2f3c9`). Only the *check's own* comparison had the
blind spot; the generator was always bidirectional.

## Takeaway for future doctor checks

A "does the index match the source" check needs a real two-way diff (like
`decision-index-stale`'s full-content comparison) or an explicit two-way
scan (like this one, once widened) — a single-direction "missing from"
scan will silently miss the opposite kind of drift, and nothing will alert
until someone happens to compare by hand.
