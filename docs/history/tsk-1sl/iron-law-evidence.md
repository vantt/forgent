# Iron Law evidence — tsk-1sl

`classifyIronLaw` (run after commit `efc4ea97`, per the "watch out for" note
in `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`):

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": []
}
```

`required: true` fired on the description-keyword match ("audit" —
`src/intake/risk-keywords.mjs`'s `HEAVY_KEYWORDS`), with `matchedModules`
empty — the committed diff (`docs/architect/doing-coordination-redesign.md`
only) touches nothing on `src/evolve/iron-law.mjs`'s `MODULE_RULES` list.
This is the exact shape `docs/how-to/produce-failing-test-first-proof-for-an-
iron-law-gated-diff.md`'s "a comment-only, behavior-neutral diff has no red
state to honestly produce" section (tsk-bc7 precedent) describes: the gate
fired on subject matter (this item audits a doc), not on self-modifying
capability code. The committed change is a markdown status-header edit —
zero identifier, control flow, or runtime string changed — so there is no
red state to honestly get to, and inventing one would be fabrication.

## Proof for a behavior-neutral diff: before/after full-suite results

Per the same how-to doc, the correct proof here is identical (or
demonstrably-unrelated) test results before and after, not a
stash-and-restore red/green cycle.

**Before** (`docs/architect/doing-coordination-redesign.md` checked out at
its pre-edit content via `git checkout HEAD~1 -- <file>`, full repo
otherwise at commit `efc4ea97`):

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
ℹ tests 4144
ℹ pass 4139
ℹ fail 0
ℹ skipped 5
ℹ duration_ms 157818.181954
EXIT:0
```

**After, run 1** (real committed state, `efc4ea97`):

```
ℹ tests 4144
ℹ pass 4138
ℹ fail 1
ℹ skipped 5
ℹ duration_ms 149917.697602
EXIT:1

failing: test/runner/dispatch.test.mjs:4897
  "fanoutBatchExecutorCli fires candidates in batch concurrently with
  overlapping execution windows"
  AssertionError: Expected execution windows to overlap, but candidate 1:
  [1787730993391, 1787730994726] and candidate 2: [1787730994987,
  1787730995799]
```

**After, run 2** (same committed state, no code changed in between):

```
ℹ tests 4144
ℹ pass 4134
ℹ fail 5
ℹ skipped 5
ℹ duration_ms 389475.338459
EXIT:1

failing (different set than run 1): test/runner/session.test.mjs:207
  "concurrent createSession from real separate OS processes never loses a
  registry entry" — SessionError: timed out acquiring sessions.lock after
  10000ms (held by another pid), plus 4 other lock/worker-timeout-shaped
  failures. None overlap with run 1's failure, and none touch
  docs/architect/doing-coordination-redesign.md or anything that reads it.
```

**Isolated confirmation** — the one test that failed in run 1, re-run alone
(no concurrent full-suite load) at the real committed state, twice:

```
node --test --test-name-pattern "fires candidates in batch concurrently with overlapping execution windows" test/runner/dispatch.test.mjs
✔ fanoutBatchExecutorCli fires candidates in batch concurrently with overlapping execution windows (1289.497591ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```
(repeated once more: same result, 1354.735616ms)

## Conclusion

The two post-edit full-suite runs failed on two entirely different, disjoint
sets of tests (a dispatch-batch timing-window assertion, then a set of
session-lock/worker-timeout assertions) — never the same failure twice,
never a test that reads or depends on `docs/architect/
doing-coordination-redesign.md`. The one specific test that did fail in run
1 passes cleanly and immediately when run in isolation, away from
full-suite concurrency load. This is the signature of environment-level
timing flakiness in this machine's concurrent test run, not a regression
introduced by a one-paragraph markdown status-header edit — which changes
no identifier, no control flow, and no runtime string anywhere in `src/`.
Per RUL2 (token/time efficiency), a third full-suite run chasing a
byte-identical pass count was judged not worth the additional ~5-6 minutes
given the evidence above already isolates the cause to system load, not this
diff — re-running until a lucky clean match appears would be cherry-picking,
not stronger proof.
