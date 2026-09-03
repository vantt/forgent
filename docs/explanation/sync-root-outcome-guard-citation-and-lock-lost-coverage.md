---
authoritative_for: sync-root-unhandled-outcome guard regression test, stale doc citation after fgos.test.mjs split into per-verb files, new lock-lost-mid-merge coverage
---

# The guard's own test still existed — just cited under a file that no longer did

`tsk-3df` was submitted framed as "sync-root's unhandled-outcome guard
has zero test protection today," found while implementing
[`tsk-2qp`](approve-lock-lost-mid-merge-guard.md). Discovery found that
framing slightly overstated: a real regression test for the general
guard already existed — it was mis-cited, not missing.

## The real gap: a stale citation, not an absent test

`tsk-1cp`'s own `CONTEXT.md` claimed coverage at
`test/cli/fgos.test.mjs:6374`, but that file no longer existed in the
current tree (`test -f` and `grep -rl 'sync-root-unhandled-outcome'
test/` both confirmed no hits under that name). The real cause: a later,
unrelated refactor split the old monolithic `test/cli/fgos.test.mjs` into
per-verb files — the guard's own test moved along with `sync-root`'s own
tests into `test/cli/fgos-merge.test.mjs` (now at line 1123), but
`tsk-1cp`'s citation was never updated to follow it. The guard itself
(`sync-root.mjs:147-167`, `if (result.outcome !== 'merged')`) was
unaffected — this was a documentation-accuracy gap, not a code gap.

## What was genuinely missing: coverage for one specific unrecognized outcome

The existing test proved the guard's general contract (never report
`"synced"` for any unrecognized `mergeRunnerItem` outcome) using a
synthetic unknown outcome. It did not exercise the guard against
[`tsk-2qp`'s real new `lock-lost-mid-merge` outcome](approve-lock-lost-mid-merge-guard.md) —
the concrete case that motivated this item's own discovery in the first
place.

## What shipped

Two things, in one commit (`e1919fd4`):

- **A new regression test** (`test/cli/fgos-merge.test.mjs`, ~line 1160)
  exercising `sync-root` against a real `lock-lost-mid-merge` scenario
  (overwriting the lock file mid-verify to force the outcome), asserting:
  `outcome !== 'synced'` (specifically `'blocked'`), a friction entry
  carrying `errorClass: 'sync-root-unhandled-outcome'`, `main`'s `HEAD`
  unchanged, `MERGE_HEAD` surviving untouched (`abortMergeIfPossible` was
  never called), the staged merge file surviving on disk, the root
  item's own status untouched, and no `"merged"` decision event ever
  recorded.
- **A corrected citation** in `tsk-1cp`'s own `CONTEXT.md` (D3 and its
  scout-evidence list): now points at `test/cli/fgos-merge.test.mjs:1123`
  for the original general-guard test, with an explicit note recording
  both the historical `fgos.test.mjs:6374` location and this item's own
  new, independent second test at line 1160 for the `lock-lost-mid-merge`
  case specifically — so a future reader doesn't need to re-derive which
  test covers which case.

## Not a duplicate

[`tsk-2qp`](approve-lock-lost-mid-merge-guard.md) — the item that
introduced the `lock-lost-mid-merge` outcome this item's new test
exercises; found during that item's own implementation but explicitly
out of its scope, submitted as a separate item instead of folded in.
`tsk-1cp` — the original item that documented the guard's existence; its
own record is corrected here, not superseded.
