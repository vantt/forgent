# tsk-70l — Iron Law evidence

`classifyIronLaw({ filesChanged, description })` on this item's real diff
(`changedFiles(repoRoot, item)` against trunk) returned:

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/main-checkout-lock.mjs","src/runner/merge.mjs"]}
```

Matched modules: `src/runner/main-checkout-lock.mjs`, `src/runner/merge.mjs`
— both gated, matching no risk keyword flag.

## Test command

```
node --test --test-name-pattern "fanout bug tsk-70l closes|REAL different live process|reclaims the lock immediately|FGOS_MAIN_LOCK_HOLDER_PID lets the hook self-recognize" test/runner/merge.test.mjs test/e2e/main-checkout-lock-hook.test.mjs
```

(the item's own full verify is `npm test`; this is the narrower command
that isolates the four new proof-point cases for the failing-before/
passing-after pair below. Captured by checking out the pre-fix versions
of `.githooks/pre-commit`, `src/runner/main-checkout-lock.mjs`,
`src/runner/merge.mjs` from this branch's own parent commit — `git
checkout 9159b839 -- <files>` — running the already-committed new tests
against them, then restoring `git checkout HEAD -- <files>`. Real
transcripts below, not fabricated.)

## Failing before (pre-fix `merge.mjs`/`main-checkout-lock.mjs`/hook, same tests)

```
✖ FGOS_MAIN_LOCK_HOLDER_PID lets the hook self-recognize a real live holder pid its own session id would never match (55.196031ms)
✖ mergeRunnerItem refuses a REAL second root->main merge sharing the same inherited env session id — the fanout bug tsk-70l closes (159.734974ms)
✖ mergeRunnerItem refuses when a REAL different live process holds the main-checkout lock (35.594215ms)
✔ mergeRunnerItem reclaims the lock immediately (never waiting out the TTL) when its recorded pid belongs to an already-exited process (61.173793ms)
ℹ tests 4
ℹ pass 1
ℹ fail 3

✖ failing tests:

test at test/e2e/main-checkout-lock-hook.test.mjs:406:1
✖ FGOS_MAIN_LOCK_HOLDER_PID lets the hook self-recognize a real live holder pid its own session id would never match (55.196031ms)
  AssertionError [ERR_ASSERTION]: commit refused: another session appears to be actively working in this checkout.
  1 !== 0
    code: 'ERR_ASSERTION', actual: 1, expected: 0, operator: 'strictEqual'

test at test/runner/merge.test.mjs:799:1
✖ mergeRunnerItem refuses a REAL second root->main merge sharing the same inherited env session id — the fanout bug tsk-70l closes (159.734974ms)
  AssertionError [ERR_ASSERTION]: Missing expected rejection.
    code: 'ERR_ASSERTION', actual: undefined, operator: 'rejects'

test at test/runner/merge.test.mjs:853:1
✖ mergeRunnerItem refuses when a REAL different live process holds the main-checkout lock (35.594215ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /main checkout is locked by pid 844238\b/. Input:
  'cannot merge "fgw/demo-item": main checkout is locked by another live session (844238, held 0s, expires in 2m59s).'
    expected: /main checkout is locked by pid 844238\b/, operator: 'match'
```

**The second failure ("Missing expected rejection") is the bug itself,
reproduced live**: two real forked processes sharing the same inherited
`BEE_SESSION_ID`, contending on the same `main-checkout.lock` via
`mergeRunnerItem`'s root→main path — pre-fix, the second one wrongly
self-recognized the first's held lock as its own and proceeded to merge
into its own separate repo (`CHILD_OUTCOME:merged` printed for the
child, and the parent's own call also returned `merged` instead of
throwing). Exactly the concurrent-write exclusion hole this item closes.

**The first failure** is the hook's own new `FGOS_MAIN_LOCK_HOLDER_PID`
recognition path, absent pre-fix — the hook falls back to its normal
resolution, sees the constructed lock record as held by someone else, and
correctly (for pre-fix code) refuses.

**The third failure is wording-only, not behavioral** — pre-fix already
correctly refuses a different real live pid (via the existing numeric
liveness branch, never itself buggy); only the message text changed
(`"another live session"` → `"pid X"`, to stop describing a now-numeric
holder as a "session"). Kept as a regression guard, not part of the bug's
own behavioral proof.

**The fourth test passes both before and after** — in a bare `node --test`
process (no `BEE_SESSION_ID` set), `resolveWriterIdentity`'s own fallback
already resolves a numeric ancestor pid, so the existing
liveness-check path was already exercised pre-fix too in this harness. Kept
as an integration regression guard for `886`'s wiring, not claimed as a
discriminating proof point.

## Passing after (post-fix, same tests, same command)

```
✔ FGOS_MAIN_LOCK_HOLDER_PID lets the hook self-recognize a real live holder pid its own session id would never match (61.02867ms)
✔ mergeRunnerItem refuses a REAL second root->main merge sharing the same inherited env session id — the fanout bug tsk-70l closes (146.344672ms)
✔ mergeRunnerItem refuses when a REAL different live process holds the main-checkout lock (33.414366ms)
✔ mergeRunnerItem reclaims the lock immediately (never waiting out the TTL) when its recorded pid belongs to an already-exited process (67.508539ms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

## Full suite

`npm test`: 3122 tests, 3117 pass, 0 fail, 5 skipped (pre-existing skips,
unrelated to this change).
