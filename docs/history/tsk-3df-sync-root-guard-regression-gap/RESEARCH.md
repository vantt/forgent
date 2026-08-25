# tsk-3df — RESEARCH.md

## Round 1 (2026-08-23, discovery stage)

**Asked:** three points from the item's own description — (1) exact
current state of `sync-root.mjs`'s outcome guard and the full set of
outcomes `mergeRunnerItem` can return today, (2) whether the item's claim
of "zero test protection today" holds, and where the stale doc citation
(`test/cli/fgos.test.mjs:6374`) actually points now, (3) which test file
is the correct home for a new/expanded regression test and what technique
is available to trigger an unrecognized outcome from a CLI-level test.

**Checked:**

- `src/verbs/merge/sync-root.mjs:147-167` (read directly) — the guard is
  exactly as described: `if (result.outcome !== 'merged')`, deliberately
  generic (no named outcome strings), sets
  `errorClass: 'sync-root-unhandled-outcome'`, returns
  `{ outcome: 'blocked', reason: result.outcome, ... }`. Explicitly named
  branches above it handle `'conflict'`, `'fgos-write-rejected'`,
  `'verify-fail'` only.
- `rg -n "outcome:\s*'" src/runner/merge.mjs` — `mergeRunnerItem`
  (`src/runner/merge.mjs`) can return `'verify-fail'`, `'merged'`,
  `'merge-blocked-other-item'` (line 1212), `'merge-failed-unclassified'`
  (lines 1261/1270), `'conflict'` (1267), `'fgos-write-rejected'` (1290),
  `'lock-lost-mid-merge'` (1352, added by tsk-2qp). Of these,
  `sync-root.mjs` explicitly names only 3; the other 3
  (`merge-blocked-other-item`, `merge-failed-unclassified`,
  `lock-lost-mid-merge`) fall through to the guard.
- `src/verbs/merge/approve.mjs:586-599,768-783` — unlike `sync-root.mjs`,
  `approve.mjs` DOES give `lock-lost-mid-merge` its own named branch
  (`errorClass: 'lock-lost-mid-merge'`, reason `lock-lost-mid-merge`).
  `sync-root.mjs` has no equivalent named branch, so for `sync-root`
  specifically, `lock-lost-mid-merge` is a genuinely still-unhandled-by-
  name outcome today, not a hypothetical.
- `grep -rl "sync-root-unhandled-outcome" test/` → no hits (confirms the
  item's own claim: no test asserts this specific `errorClass` string
  anywhere).
- **But** a behavioral regression test for the guard DOES exist and
  survived a file split: `test/cli/fgos-merge.test.mjs:1123` —
  `test('sync-root never reports outcome "synced" when mergeRunnerItem
  returns an outcome it does not explicitly handle -- proves the
  defensive guard closes the false-success gap D4 found', ...)`. This is
  the exact test tsk-4hj originally added at
  `test/cli/fgos.test.mjs:6374` (confirmed via `git show fc59e7d9 --
  test/cli/fgos.test.mjs`, same test body, same fixture
  `sync-root-blocked-other`) — `test/cli/fgos.test.mjs` was later split
  into per-verb files (e.g. `fgos-merge.test.mjs`) and this test moved
  with it, but the doc citation was never updated to follow.
  - This existing test only exercises ONE unhandled outcome
    (`merge-blocked-other-item`) and only asserts on the response shape
    (`outcome`/`reason`/git state/absence of a `merged` decision) — it
    never reads `frictions` and never asserts
    `errorClass === 'sync-root-unhandled-outcome'`.
  - It does not cover `lock-lost-mid-merge` (added by tsk-2qp, after this
    test was written) or `merge-failed-unclassified`.
- `docs/history/tsk-1cp-sync-root-unrecognized-outcome-guard/CONTEXT.md`
  (D3, lines 27/42/47) — tsk-1cp's own doc explicitly planned a "final
  pass... replacing the branch-relative citations with the merged-commit
  ones" once tsk-4hj merged to main. `git log --all --grep tsk-4hj` shows
  tsk-4hj's fix commit `fc59e7d9` IS on `main` — but that final pass (D3)
  was never done: the citation still reads `test/cli/fgos.test.mjs:6374`,
  a file that no longer exists.
- `docs/history/tsk-2qp-approve-lock-merge-commit-guard/plan.md:151`
  already named this exact gap in passing ("the citation in tsk-1cp's own
  doc... is stale... Pre-existing gap, unrelated to this item's own
  scope") — confirms this is a real, previously-noticed, never-fixed gap,
  not a new invention.
- `test/runner/merge.test.mjs:533` — the existing unit-level technique for
  triggering `lock-lost-mid-merge`: pass a `verify` command that
  overwrites `.fgos/main-checkout.lock` with a different pid mid-run
  (`FGOS_HEARTBEAT_INTERVAL_MS` shortened so a heartbeat tick observes the
  change before commit). This is reusable at the CLI level: the existing
  `makeDriftedRoot(cwd, id, { verify })` helper
  (`test/cli/helpers/fgos-cli-harness.mjs:605`) already accepts an
  arbitrary `verify` command and is exactly what the surviving
  `fgos-merge.test.mjs:1123` test uses — the same lock-overwriter script
  can be passed as `verify` there to make `mergeRunnerItem` return
  `lock-lost-mid-merge` for a `sync-root` call, which is NOT named in
  `sync-root.mjs` and so genuinely falls into the guard.

**Found (summary):**

1. The guard is real, generic, and correctly located.
2. The item's "zero test protection" premise is partially wrong: a
   behavioral regression test for the guard already exists
   (`test/cli/fgos-merge.test.mjs:1123`, survived from tsk-4hj's original
   `test/cli/fgos.test.mjs:6374` through a file split) — but it (a) never
   asserts the `errorClass` the guard actually sets, and (b) only covers
   one of the three outcomes that currently fall through to the guard.
   `lock-lost-mid-merge` — added later, and already given a named branch
   in `approve.mjs` but NOT in `sync-root.mjs` — is the one outcome with
   no test coverage of the guard behavior at all today.
3. The stale doc citation is real and located precisely:
   `docs/history/tsk-1cp-sync-root-unrecognized-outcome-guard/CONTEXT.md`
   lines 42 and 47, still citing the pre-split file path/line. tsk-1cp's
   own D3 already anticipated this correction as a "final pass" that
   never happened.
4. A ready-to-reuse technique for a new CLI-level regression test exists
   (`test/runner/merge.test.mjs:533`'s lock-overwriter script, portable to
   `makeDriftedRoot`'s `verify` option), so a new test asserting both the
   `errorClass` and coverage of `lock-lost-mid-merge` is straightforward,
   no new harness needed.

**Still open:** none — every point the calling skill asked about is
resolved with direct file:line evidence. No question for a person.
