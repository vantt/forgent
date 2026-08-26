# Iron Law Evidence — tsk-46v

## Matched Flags
- `data loss`

## Verification Command
`node --test test/state/events-jsonl-truncation-guard.test.mjs`

## Failing-test-first proof

Reverse-applied the `src/state/events-jsonl-truncation-guard.mjs` +
`scripts/events-jsonl-truncation-guard.mjs` half of commit `e5febe85`
(keeping the new tests and doc fix), then ran the file against the pre-fix
code — the module fails to even load, since the new tests import the not-
yet-existing export:

```
file:///.../test/state/events-jsonl-truncation-guard.test.mjs:14
  forceRebaselineTruncationGuard,
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/state/events-jsonl-truncation-guard.mjs' does not provide an export named 'forceRebaselineTruncationGuard'
...
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

Re-applied the source/script change (tree returned to exactly the
committed state, confirmed via `git status --short`), reran the full
file:

```
ℹ tests 31
ℹ suites 0
ℹ pass 31
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 238.687129
```

All 31 cases pass, including every pre-existing test proving
`advanceEventsJsonlTruncationGuard` still never moves past a real break —
unchanged by this fix.

## Live-remediation cross-check

Independent of this test suite: this item's own discovery/RESEARCH.md
round already manually force-rebaselined the REAL main-checkout guard
sidecar (`.fgos/runtime/events-jsonl.truncation-guard.json`) using the
same computation this new code now performs, and confirmed live via `fgos
doctor` that `events-jsonl-not-truncated` passes
(`"truncation guard holds across events.jsonl + 49 per-writer file(s)"`).
This commit's own code is the same operation made repeatable and
committed, not a new untested mechanism.
