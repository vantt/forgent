# Iron Law evidence — tsk-2t6

`classifyIronLaw` (`src/evolve/iron-law.mjs`) on this item's own changed
file set (`changedFiles`, `src/runner/merge.mjs`, computed against the
committed branch diff — `fgw/tsk-2t6` vs `main`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Where the module match actually comes from

`src/runner/dispatch.mjs` is a real `MODULE_RULES` match (`src/runner/`
prefix), not a keyword false positive. But this item (`tsk-2t6`) never
edited `dispatch.mjs` directly — the only diff to that file on this branch
is the one `tsk-2k1` authored, merged in via commit `259ae88` ("Merge
branch 'fgw/tsk-2k1' into fgw/tsk-2t6"). `tsk-2t6`'s own commits
(`02bb2f2`, `49c3bc4`, `31a0a53`) are `CONTEXT.md`/`plan.md` only —
zero lines of `dispatch.mjs`.

The real failing-test-first proof for that `dispatch.mjs` change already
exists, and is still present in this branch's own tree (merged in along
with the code itself, never stripped or summarized):
`docs/history/tsk-2k1/iron-law-evidence.md` — its own genuine
failing-before (133/137, the 4 tests this item's real work added) /
passing-after (137/137) transcript against
`node --test test/runner/dispatch.test.mjs`.

Writing a second, independent failing-test-first transcript here for the
same lines of code `tsk-2k1` already proved would not be new evidence —
it would be re-running the identical test suite against the identical
diff and pasting the identical result, which is not what the
"failing-test-first proof" discipline
(`docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D1) asks
for. This file exists to satisfy `approve`'s own mechanical check for
`docs/history/tsk-2t6/iron-law-evidence.md` (`bin/fgos.mjs:163`) with an
honest pointer, not a fabricated duplicate.

## This item's own actual diff

Doc-only: `CONTEXT.md`, `plan.md` under
`docs/history/two-layer-dispatch/`. No code, no test file, nothing
`classifyIronLaw`'s own module rules would flag on their own merits.

## Verify

This item's own `verify` (unchanged by this item — a check against
already-delivered work):

```
grep -q "Lớp 1 — cell (ghi file)" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "Lớp 2 — I/O worker" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "GHI file/mutate git thì phải có danh tính" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "cell KHÔNG phải backlog item" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "bee:fan-out-cost-tiering-rubric" docs/distillery/porting-log.md && grep -q "R3 E2 F2" docs/distillery/porting-log.md
```

Passing at time of writing.
