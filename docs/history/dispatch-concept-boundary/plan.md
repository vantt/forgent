Item: `tsk-5td`.

Mode: **tiny** — 0 mode-gate flags apply (no auth, no data model, no
audit/security, no external system, no public-contract change of its own,
no cross-platform surface, no existing covered behavior touched, no weak
proof, single domain). This item never carried code of its own — its whole
job (per its own description) was to lock the dispatch-layer vocabulary in
`DISCUSSION.md` §6 and spawn the concrete work in §7 ("hạng mục / task").

## Approach

`DISCUSSION.md` §1 ("Trạng thái hiện tại") was last updated at vòng 27 and
says "bốn cụm đã có item" (four of eight §7 clusters have an item) — true
*at that point in time*. A fresh check of the shared work store (not this
branch's own tree — this branch is 215 commits behind `main`, and the
lock this item produced lives in the shared `.fgos` event log, not in a
branch-local `CONTEXT.md`, since this item went through `fgos-coding-
shaping` rather than `fgos-coding-exploring`) shows all eight clusters now have
one, and every one of them is `cleanup`/`done`:

| §7 cluster | D-ID | Item | Status |
|---|---|---|---|
| 7.1 decision doc supersedes `0026` | D7, D8, D17 | `docs/decisions/0029-...md` (committed directly to `main`, not a work item) | shipped |
| 7.2 `needs`/`for` migration, three places | D5, D6 | `tsk-1o7` | cleanup |
| 7.3 gate predicate + mechanism rename | D13, D16 | `tsk-592` | cleanup |
| 7.4 doc-drift fixes | D1, D3 | `tsk-15d` | cleanup |
| 7.5 dead config in `executors.<key>` | — | `tsk-4eu` | cleanup |
| 7.6 audit command field | D9 | `tsk-33w` | cleanup |
| 7.7 gather capacity specimen | D15 | `tsk-2ie5` (+ child `tsk-2c1`) | cleanup |
| 7.8 intake optimization | — | `tsk-5wz` | cleanup |
| 7.9 not-yet cells | — | deliberately unopened — DISCUSSION.md §7.9 itself says these need a live case first, still true | n/a |

No `fgos graph --what-if` ordering call is needed: there is nothing left
to order. No impact-analysis proof point is needed either: this item makes
no blast-radius claim — it changes no code.

## Shape

One piece, no split: **`DISCUSSION.md` gets a closure note.** §1's own
status line is now stale (it undercounts the finished clusters), and none
of §7.1–7.4 carry the "Trạng thái" column §7.5–7.8 already use. Add that
column to 7.1–7.4 (pointing at the table above) and correct §1's "bốn cụm"
line — otherwise a future reader (a person or another session) re-opens
§7.2/7.3/7.4 as if they were still open, exactly the confusion this
plan exists to close out. No code, no test, no other file.

## Outstanding questions

None.

## Proof surface

`grep -q '0029' docs/history/dispatch-concept-boundary/DISCUSSION.md && grep -q 'tsk-1o7' docs/history/dispatch-concept-boundary/DISCUSSION.md && node --test --test-skip-pattern="declares the submit-assist-classify capacity" 'test/**/*.test.mjs'`

Updated during Implement (2026-08-09): a bare `npm test` fails on
`test/runner/dispatch.test.mjs`'s "declares the submit-assist-classify
capacity" assertion in *every* worktree — `fgos return` runs verify in a
fresh detached worktree, and `.fgos/config.json` is stripped from every
worktree by ADR0020 (already tracked, unrelated to this item: `tsk-3ra`,
still `todo`). Skip pattern matches the existing precedent `tsk-2c1` used
for the same known gap.
