# tsk-1cp — CONTEXT.md

## Feature boundary

`fgos sync-root`'s `runAndReport` path (`bin/fgos.mjs`) had no branch for
an outcome from `mergeRunnerItem` other than the explicitly named ones —
any unrecognized outcome fell through to the success block and reported
`{ outcome: 'synced' }` even though no merge had actually completed. This
was found and fixed as an in-scope addition (D4) during `tsk-4hj`'s own
validating pass, committed on branch `fgw/tsk-4hj` (not yet merged to
`main`; tsk-4hj is `awaiting-approval`).

tsk-1cp's own scope is narrow and entirely documentation: give this
specific finding its own independently-traceable record, separate from
tsk-4hj's own decision log, and link it to tsk-4hj's real `main` commit
once tsk-4hj is approved and merged. **No code changes belong to tsk-1cp**
— the guard and its test are already written and committed on
`fgw/tsk-4hj`; tsk-1cp's own branch (`fgw/tsk-1cp`) never touches
`bin/fgos.mjs` or `test/cli/fgos.test.mjs`.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | tsk-1cp's deliverable is a standalone record at `docs/history/tsk-1cp-sync-root-unrecognized-outcome-guard/` (this doc + RESEARCH.md) — no source or test changes. The guard/test already exist on `fgw/tsk-4hj`. |
| D2 | This item cannot verify-pass (`node --test test/cli/fgos.test.mjs`) until tsk-4hj's commits are present on `fgw/tsk-1cp`'s ancestry — i.e., until tsk-4hj merges to `main` and this item's own branch catches up. This is explicit in the item's own submitted text ("chỉ cần gắn liền với commit thực tế của tsk-4hj khi được approve/merge") — not a new judgment call, restated here as a locked decision so `fgos-coding-planning`/`fgos-coding-validating` don't re-derive it. |
| D3 | The record cites `fgw/tsk-4hj`'s branch-relative evidence now (commit `fc59e7d9`, `bin/fgos.mjs:3404`, `test/cli/fgos-merge.test.mjs:1123`, `docs/history/tsk-4hj-stale-merge-head-misclassified-as-conflict/iron-law-evidence.md`) and gets a final pass, once tsk-4hj's real `main` merge commit SHA is known, replacing the branch-relative citations with the merged-commit ones. |

## Pinned terms

- **"unrecognized outcome"** — any string `mergeRunnerItem` (`src/runner/
  merge.mjs`) can return that the `sync-root` call site in `bin/fgos.mjs`
  does not explicitly branch on by name (today: anything other than
  `'merged'`, `'merge-blocked-other-item'`, `'fgos-write-rejected'`, and
  the conflict/verify-fail outcomes already handled above the guard).

## Scout evidence

- `bin/fgos.mjs:3404` (branch `fgw/tsk-4hj`, commit `fc59e7d9`) — the
  guard: `if (result.outcome !== 'merged')` before the success block,
  `errorClass: 'sync-root-unhandled-outcome'`.
- `test/cli/fgos-merge.test.mjs:1123` (branch `fgw/tsk-4hj`) — the regression
  test proving it. (tsk-3df: originally written at `test/cli/fgos.test.mjs:6374`;
  this is its current location after `test/cli/fgos.test.mjs` was later
  split into per-verb files. A second, independent regression test for
  the guard's `lock-lost-mid-merge` case — a gap `fgw/tsk-4hj` did not
  cover — was added at `test/cli/fgos-merge.test.mjs:1160` by `tsk-3df`
  itself, not part of this item's own original evidence.)
- `docs/history/tsk-4hj-stale-merge-head-misclassified-as-conflict/
  iron-law-evidence.md` (branch `fgw/tsk-4hj`) — fail-before/pass-after
  proof, this exact test included.
- `rg -- "sync-root-unhandled-outcome" src bin test docs` on `fgw/tsk-1cp`
  (this item's own worktree, based on `main`) returns nothing but this
  item's own new docs — confirms tsk-4hj's fix genuinely isn't present
  here yet, consistent with D2 above.
- impact-analysis capability: `full` — GitNexus registered and `present`
  (`fgos tool query --capability impact-analysis --status present`).
  Not applicable to this item in practice: it touches no code symbols,
  documentation-only.

## Canonical references

- `docs/history/tsk-4hj-stale-merge-head-misclassified-as-conflict/
  CONTEXT.md` / `iron-law-evidence.md` (branch `fgw/tsk-4hj`)

## Outstanding questions

None
