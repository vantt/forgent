---
framework: diataxis
mode: how-to
---
# Reconcile a strategic backlog row against real execution state

## When to use

`docs/backlog.md`'s PBI rows (the strategic layer) and `.fgos/state.json`'s
work items (the execution layer) are two separate records that nobody
automatically keeps in sync. `tsk-3vv` found this drift was not theoretical:
0 of 31 PBI rows read `done` while 223 fgOS items already were, and reading
the rows against real code found 9 of 30 `proposed` rows already resolved or
made moot. One of the nine was labelled `[NGHIÊM TRỌNG — rủi ro mất dữ liệu
thật]` (CRITICAL — real data-loss risk) — exactly the row a reader picking
work by severity would grab first.

Use this recipe whenever a new `proposed` row is added to `docs/backlog.md`,
or periodically to catch rows the execution layer has since made moot.

## The recipe

1. **Run the checker**, which re-derives the `proposed` set from the real
   file on every run rather than trusting a stale list:
   ```
   node scripts/check-backlog-reconciliation.mjs
   ```
   It fails for any `proposed` row not yet cited in
   `docs/history/backlog-execution-reconciliation/RECONCILIATION.md` — this
   is what catches *future* drift, not just the drift that existed when this
   item ran.

2. **For each failing row, read real code — never a state field, never a
   prior report.** `tsk-3vv`'s own methodology, stated plainly: "Every
   `resolved`/`partial` citation below was read in this worktree. A state
   field or a prior report was never accepted as proof — that is the
   failure mode this item exists to end." A worked example: PBI row
   `p-73d99989` claimed `reclaimOrphanedCheckout force-removes ANY existing
   worktree checkout without checking if it is a live session`. Reading
   `src/runner/worktree.mjs:201` found the complaint patched four separate
   ways — a data-loss guard (`tsk-1os`, done), a repo-root guard (`tsk-k8u`,
   cleanup), a live-session guard (`tsk-1tm`, cleanup, the one that blocks
   exactly what the row complains about), plus an `isCheckoutDirty` check
   ahead of the force-remove. None of that showed up by reading the backlog
   row or the item record alone — only by reading the function itself.

3. **Assign one of four verdicts, each with its own evidence bar**:

   | Verdict | Means | Evidence required |
   |---|---|---|
   | `resolved` | Real code/state already satisfies the row's CoS | ≥1 fgOS item id **and** ≥1 `path:line` |
   | `partial` | Some claims satisfied, some not | Same, plus what remains |
   | `open` | Nothing in the execution layer addresses it | none — an honest "still proposed" |
   | `stale` | The mechanism the row complains about no longer exists | a `path:line` or a commit sha |

4. **Never flip the PBI's own status.** `docs/backlog.md` is a generated
   file (`bee backlog render` from `.bee/backlog.jsonl`), and `.bee/` does
   not exist in this repo — so editing a row's status here is not merely
   out of scope, it is not possible from this checkout. Record the verdict
   and its evidence; leave the decision of what to do with a `resolved`
   row to whoever reviews the reconciliation doc.

## Watch out for: a fixed left-hand column index breaks the moment a cell contains its own `|`

The checker's row parser deliberately does not trust a fixed index for the
status column. Measured directly on this repo's own backlog: indexing
`cells[3]` found 29 proposed rows where the file really has 30, because one
row's own Story cell carries a literal `|` inside its prose — shifting every
column after it by one, silently hiding a row from the scan entirely. The
fix reads the status column from the right (`cells[cells.length - 2]`),
which stays correct no matter how many pipes the prose between the id and
the status contains. Any table-row parser over `docs/backlog.md` should
assume prose cells can contain `|` and index from whichever side is
actually stable, not copy a fixed left-hand offset from a sample row that
happened not to have one.

## Result, last run (2026-08-08)

30 proposed rows: 7 resolved, 2 partial, 2 stale, 19 open. Full citations in
`docs/history/backlog-execution-reconciliation/RECONCILIATION.md`.
