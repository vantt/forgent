# Iron Law evidence: tsk-25r (parent, rollup)

`classifyIronLaw` result against the real committed diff (`main...fgw/tsk-25r`
— this item's own trunk really is `main`, unlike its children which diffed
against `fgw/tsk-25r` as their own parent root):

```json
{"required":true,"matchedFlags":["audit"],"matchedModules":["bin/fgos.mjs","src/runner/claim-liveness.mjs","src/runner/claim-port.mjs","src/runner/loop.mjs","src/runner/merge.mjs","src/runner/worktree.mjs"]}
```

## No new code at this level — this is a rollup index, not a fresh transcript

This item's own `planning`→`executing` pass introduced zero new code: every
line of the actual fix for all 9 findings already landed via the 9
children, each with its own full discovery→planning→validating→executing
cycle and its own real evidence (`docs/history/<tsk-id>/iron-law-evidence.md`,
where required). Fabricating a new failing-before/passing-after transcript
here — for a diff this item never itself wrote — would be exactly the kind
of "assertion, not evidence" this whole discipline exists to rule out.

Instead: every module `classifyIronLaw` matched at THIS item's own
(aggregate, `main`-relative) diff is already covered by at least one
child's own real, already-recorded transcript:

| Matched module | Covered by (real transcript already on record) |
|---|---|
| `bin/fgos.mjs` | `docs/history/tsk-ikd/iron-law-evidence.md` (the `return` main-worktree guard), `docs/history/tsk-386/iron-law-evidence.md` (the `approve` leaf-path `detectTrunk` fallback) |
| `src/runner/claim-liveness.mjs` | `docs/history/tsk-f8f/iron-law-evidence.md` |
| `src/runner/claim-port.mjs` | `docs/history/tsk-1mn/iron-law-evidence.md` |
| `src/runner/loop.mjs` | `docs/history/tsk-386/iron-law-evidence.md` — `loop.mjs`'s own change is a pure simplification (drop the redundant `{baseRef: 'main'}` override) inheriting `createBranchRef`'s corrected default; that default's own failing-before/passing-after proof is the same transcript covering `worktree.mjs` below, and `loop.mjs` carries no logic of its own beyond that inherited default |
| `src/runner/merge.mjs` | `docs/history/tsk-18k/iron-law-evidence.md`, `docs/history/tsk-2iz/iron-law-evidence.md`, `docs/history/tsk-4yv/iron-law-evidence.md` |
| `src/runner/worktree.mjs` | `docs/history/tsk-1mn/iron-law-evidence.md`, `docs/history/tsk-4yv/iron-law-evidence.md`, `docs/history/tsk-386/iron-law-evidence.md` |

Two of the nine children's own diffs (`tsk-4bh`, `tsk-2jn`) were correctly
classified `required: false` at their own, narrower diff scope
(`src/state/cleanup-harness.mjs`/`src/state/frontier.mjs`,
`src/state/graph-metrics.mjs` respectively) — neither module appears in
THIS item's own `matchedModules` list either, consistent, not a gap.

## Real proof this item's own pass DID produce

The combined test run across all 9 findings' own test files, confirming
they hold together as one merged tree (not just individually, in each
child's own isolated worktree) — `docs/history/tsk-25r-worktree-merge-
cleanup-audit/RESEARCH.md` round 1:

```
node --test test/runner/merge.test.mjs test/runner/merge-target-slot-multiprocess.test.mjs test/runner/main-checkout-lock.test.mjs test/runner/worktree-callsite-wrapper.test.mjs test/runner/worktree.test.mjs test/runner/claim-port.test.mjs test/state/cleanup-harness.test.mjs test/state/frontier.test.mjs test/state/graph-metrics.test.mjs test/cli/fgos-return.test.mjs test/cli/fgos-approve.test.mjs test/runner/loop.test.mjs test/runner/claim-liveness.test.mjs

ℹ tests 627
ℹ pass 627
ℹ fail 0
```
