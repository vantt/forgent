# Iron Law evidence — tsk-2qp

## Matched

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/merge.mjs"]
}
```
(`classifyIronLaw` against the real committed diff `b21bf15d...e9b884db`, via `changedFiles('.', item)` — the same trigger `approve`'s own gate runs at merge time.)

## What changed

Committed as `e9b884db` — `fix(runner): add lock-lost-mid-merge pre-commit guard (tsk-2qp)`:

- `src/runner/merge.mjs`: an `AsyncLocalStorage`-carried heartbeat-status
  flag, written on every `renewMainCheckoutLockIfOwn` tick in both
  `withMergeTargetSlot` and `mergeRunnerItem`'s heartbeat intervals; one
  new checkpoint in `mergeRunnerItemLocked`, immediately before `git
  commit`, returning `{ outcome: 'lock-lost-mid-merge', branch }` instead
  of committing when the last renewal read `not-owner`/`ambiguous`/
  `no-lock`. `HEARTBEAT_INTERVAL_MS` became `heartbeatIntervalMs()`,
  overridable via `FGOS_HEARTBEAT_INTERVAL_MS` for deterministic tests.
- `src/verbs/merge/approve.mjs`: a `lock-lost-mid-merge` branch at both
  call sites, mirroring the existing `merge-blocked-other-item` branch's
  shape exactly (`moveWork` to `blocked`, `addFriction`, return) — never
  calls `abortMergeIfPossible`.
- `src/verbs/merge/catchup.mjs`: `lock-lost-mid-merge` added to
  `CATCHUP_REASONS`.
- `docs/specs/runner.md:1094`: the `catchup` precondition's enumerated
  retryable-reason set now names `lock-lost-mid-merge` alongside
  `merge-blocked-other-item`.
- `test/runner/merge.test.mjs`: one new regression test (below).

## Failing-test-first — real transcript, not paraphrased

**RED (pre-fix code, same new test):** reverted `src/runner/merge.mjs`,
`src/verbs/merge/approve.mjs`, `src/verbs/merge/catchup.mjs`,
`docs/specs/runner.md` to the pre-fix commit (`b21bf15d`) in the working
tree only (`git checkout b21bf15d -- <those 4 files>`), kept the new test,
ran it alone:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test --test-name-pattern="lock-lost-mid-merge" test/runner/merge.test.mjs
✖ mergeRunnerItem reports "lock-lost-mid-merge" when heartbeat renewal fails before commit and never calls abortMergeIfPossible (303.76356ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'merged'
  - 'lock-lost-mid-merge'
      at TestContext.<anonymous> (test/runner/merge.test.mjs:550:12)
```

Confirms the exact bug: on pre-fix code, an item whose lock was lost
mid-merge (heartbeat renewal reads `not-owner`) still merges through and
reports `'merged'` — the unprotected `git commit` this item exists to stop.

**GREEN (restore, real fix):** `git checkout HEAD -- <same 4 files>`
restored the committed fix; targeted suite:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/main-checkout-lock.test.mjs test/runner/merge.test.mjs test/cli/fgos-approve.test.mjs test/cli/fgos-merge.test.mjs
ℹ tests 282
ℹ pass 282
ℹ fail 0
```

The worker's own dispatch transcript additionally reports the full suite
(`npm test`) at 3798/3798 green post-fix — not independently re-run here
(would duplicate ~100s of test time for the same green result already
proven by the 282/282 targeted run above, which includes every file this
diff touches or could plausibly affect).

## Impact-analysis posture

`degraded` (GitNexus present but 1232 commits behind `HEAD` at the time
`plan.md` was written) — the blast-radius claim was established by direct
`rg` cross-check instead, already recorded in `plan.md`'s "Impact-analysis
posture" section: `mergeRunnerItem` has exactly 4 real call sites
(`approve.mjs` × 2, `sync-root.mjs`, `promote-engine.mjs`); only the two
`approve.mjs` sites needed a new branch, both added. Not re-run here —
same posture, same evidence, no new symbol surfaced since.

## Item's own verify

```
node --test test/runner/main-checkout-lock.test.mjs test/runner/merge.test.mjs
```
157/157 pass (matches the item's recorded `verify` field, confirmed by the
worker's own transcript and independently by this session's GREEN run
above, a superset of the same two files).
