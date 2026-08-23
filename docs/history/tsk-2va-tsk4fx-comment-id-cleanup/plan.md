# tsk-2va — plan.md

Mode: tiny

Flag count: 0. Pure comment-wording change, 4 lines across 2 test files
already named in the item's own text.

## Approach

Reword the 4 comment lines in `test/state/store.test.mjs` (49, 710) and
`test/state/porting-store.test.mjs` (36, 284) that currently cite
"tsk-4fx" as a bare label — replace with a direct explanation of the
invariant (why `batchSize` exists, why the flaky call sites pass `4`),
per the repo's stable-code-artifacts rule (explain the invariant
directly, don't cite a plan/finding ID). The doc-path references at
`store.test.mjs:57` / `porting-store.test.mjs:42`
(`docs/history/tsk-4fx-concurrency-test-lock-timeout-flake/RESEARCH.md`)
stay unchanged — a real, permanent file path, not a bare label.

No alternatives to weigh — this is a direct rewording with a single
correct target text, confirmed by re-grepping the current file state
(`grep -n "tsk-4fx"` — 6 hits, 2 of which are the doc path and correctly
kept).

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| 4 comment lines, 2 test files | light | Pure comment text — no executable change. `npm test` green proves nothing broke; a grep assertion proves every remaining "tsk-4fx" occurrence is the doc-path reference, not a bare label. |

**Impact-analysis posture:** Not applicable — no code symbol touched,
comment-only change.

## Shape

Single piece, no split.

Verify (unchanged from discovery):
```
npm test && ! (grep -E "tsk-4fx" test/state/store.test.mjs test/state/porting-store.test.mjs | grep -v "tsk-4fx-concurrency-test-lock-timeout-flake")
```

## Outstanding questions

None
