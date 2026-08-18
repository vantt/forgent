# tsk-1q1 — Cleanup stage decision drift (root)

This root item's own decomposition already happened, and is already fully
realized: 3 children (`tsk-4jf`, `tsk-1p9`, `tsk-558`) — all with
`parent: tsk-1q1` — have each been independently clarified, planned,
validated, implemented, verified, and merged into this item's own branch
(`fgw/tsk-1q1`). This item's `stage` field lagged behind that reality
(still read `clarify`, never advanced), which this CONTEXT.md and the
`fgos discover`/`fgos plan` calls that follow correct mechanically —
`resolveDecompose`'s own idempotent `hasChildren` path
(`src/intake/plan.mjs:533-546`) is exactly the mechanism designed for
this: detect the existing children and advance the root straight to
`executing` without re-creating anything.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The 3-way split into `tsk-4jf`/`tsk-1p9`/`tsk-558` (already realized) is the root's own decomposition — not reopened, not redecided here. |
| D2 | This root item's own "work" is the aggregate of its 3 children's changes, already on `fgw/tsk-1q1` — no new code is written for the root itself. |
| D3 | Once mechanically advanced to `executing`, the root is returned and approved directly (its own `verify`, `npm test`, already green per every child's own full-suite run). |

## Test plan

- `npm test` (the root's own recorded verify) — already run and green
  after each child's merge into `fgw/tsk-1q1`; re-run once more at
  `return` time as the engine's own proof, not asserted.
