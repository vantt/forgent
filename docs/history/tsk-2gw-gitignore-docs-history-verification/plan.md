# tsk-2gw — gitignore-docs-history-verification — plan

Mode: tiny

Single verification task: confirm a prior fix (`.gitignore` un-ignoring
`docs/history/`, landed `fgw/tsk-1wd` commit `ffd211a`) still holds on
`main`, add an automated check for it, and close the corresponding static
backlog row (`docs/backlog.md`, id `p-4b7dd2ed`). No design decisions, no
gray areas — a re-scan of already-known facts.

## Approach

Re-scanned current `main` per this item's own `[MUST khi bắt đầu]` note:
`.gitignore` no longer excludes `docs/history/` (`git check-ignore -v
docs/history/some-feature/CONTEXT.md` exits 1 — not ignored). Live
corroborating evidence from the same night: `tsk-1i3`'s own
`CONTEXT.md`/`plan.md`/`RESEARCH.md` committed cleanly to `fgw/tsk-1i3`
with zero friction. The item's original claim (dogfood incident,
`tsk-1wd`, 2026-07-28) is confirmed still resolved — no rework needed,
only verification + closing the record.

Files touched: one new test file (automates the check so it never
silently regresses again), one annotation in `docs/backlog.md`'s existing
row (that file is a frozen snapshot from a `bee` toolchain no longer
present in this repo — no `bee` binary, no `.bee/backlog.jsonl` — so its
own "status" column has no established closed-state vocabulary to reuse;
appending a closing note inline, matching the row's own existing
"Đã fix tại..." convention, is safer than inventing a new status value
for machinery that no longer runs here).

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| `.gitignore` claim | Low — directly verified by running `git check-ignore` on the real current tree, not assumed | The new test itself, run as this item's verify |

## Shape

Direct note, no phased plan needed at this size. Concrete case: the new
test asserts `docs/history/`, a `CONTEXT.md`, a `plan.md`, and a
`RESEARCH.md` path under it are all NOT git-ignored — the exact shape
`fgos-coding-exploring`'s own hard rule needs to keep holding.

## Split decision

No split. One piece: a verification test + a doc annotation.

## Verify

`node --test test/setup/gitignore-docs-history-not-excluded.test.mjs`

## Outstanding questions

None
