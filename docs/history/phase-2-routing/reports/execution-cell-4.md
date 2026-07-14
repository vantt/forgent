# Execution report — phase-2-routing-4

**Worker:** Norbert · **Cell:** phase-2-routing-4 · **Title:** S2: frontier query thuần — todo + deps done + FIFO seq

## What was built

`src/state/frontier.mjs` — a pure function `frontier(view)` that derives the
"ready to start" work items from a state view (as produced by
`replay.mjs`'s `foldEvents`/`rebuildView`, or a literal view in tests):

- Ready = `status === 'todo'` AND every dep's status is `'done'` (per D5 —
  a dep at `proposed`/`doing`/`blocked` does not unblock its dependents).
- Order: FIFO by `view.work` insertion (declaration) order — no sort by id.
  Reliance is spelled out in a code comment: `foldEvents` inserts keys in
  `work.add` order, `work.move` only mutates `status` on the existing entry
  (never re-inserts), and every id is kebab-case (never an all-numeric key
  the JS spec would reorder ahead of insertion order).
- Defensive: a dangling dep id (`work[dep]` missing) is treated as not-done
  via `work[dep]?.status`, never throws.
- No `fs` import, no mutation of the input view.

`test/state/frontier.test.mjs` — 16 new tests: empty view (with/without
`work` key), no-deps item ready, dep at `proposed` blocks, dep at `done`
unlocks, multi-tier chains (both the fully-done and the stuck-mid-chain
case), each non-`todo` status excluded (`blocked`/`doing`/`proposed`/`done`),
a FIFO test using non-lexical declaration order (`zeta` before `alpha`) to
distinguish insertion-order from an accidental id sort, a FIFO-survives-move
test, empty `deps` array, dangling dep guard, and a no-mutation assertion.

## Verification

- Red/before: confirmed `src/state/frontier.mjs` did not exist (`import()`
  threw `Cannot find module`) before implementation.
- `npm test`: 132/132 passing (116 baseline + 16 new), 0 failures.
- `npm run`-equivalent full verify (`npm test && node
  .claude/skills/distill/scripts/distill.mjs check`): green, all 6 distill
  sources OK.

## Deviations

None from the cell spec — implemented within `files` bounds
(`src/state/frontier.mjs` new, `test/state/frontier.test.mjs` new); did not
touch `replay.mjs`, `store.mjs`, or `bin/`.

## Commit

`044db0d` — `feat(routing): derive frontier query from work-state view (phase-2-routing-4)`

Status: DONE
Summary: Pure frontier(view) query implemented and tested (16 new tests, 132/132 green); cell capped with recorded verify output; one commit.
Concerns/Blockers: none.
