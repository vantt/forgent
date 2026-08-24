# Research: tsk-2xg — manual-merge-forced `.fgos/*` deadlock between the pre-commit hook and `fgos-write-rejected`

## Round 1 — 2026-08-24 (discovery stage)

**Asked:** does the repo's actual current code, plus the real incident cited
in the item (`fgw/tsk-3ve`), back up tsk-2xg's claimed structural deadlock —
that once a worker branch needs a manual `git merge main` to resolve a real
(non-`.fgos`) textual conflict, no single `.fgos/*` snapshot can satisfy
both the pre-commit hook (worker branch: zero tolerance for any staged
`.fgos/*` change) and approve's `fgos-write-rejected` check (merge into
main: zero tolerance for any staged `.fgos/*` diff vs main's current HEAD)
at once, for a `.fgos/*.jsonl` file that keeps growing on main without a
`merge=union` driver?

**Checked (repo search + real incident data, all read directly, not from
memory):**

1. `src/runner/merge.mjs:1457-1516` `performCatchUp` — confirmed
   all-or-nothing: runs `git merge --no-commit --no-ff target` inside an
   ephemeral worktree; on ANY conflict (`.fgos/*` or not — `git diff
   --name-only --diff-filter=U` is only used to report which files, not to
   discriminate), it runs `git merge --abort` and returns `{outcome:
   'conflict', conflictedFiles}` — never a partial/manual-assist path.
   Confirms the item's "abort toàn bộ ngay khi gặp bất kỳ conflict textual
   nào (all-or-nothing)" claim exactly.
2. `.githooks/pre-commit:142-164` `stagedFgosChangesOnWorkerBranch` (tsk-5pb)
   — confirmed: on any `fgw/*` branch, refuses a commit if `git diff
   --cached --name-only` has ANY path under `.fgos/`, unconditionally — not
   compared to any specific value, just "is anything staged at all". This
   is what forces an operator who just ran a manual `git merge main` (which
   auto-stages any `.fgos/*` path that changed on main's side since the
   worker branch's fork point) to restore/unstage those paths before they
   can commit at all — confirms the item's "pre-commit hook (worker branch
   không được lệch .fgos/* so với first-parent của CHÍNH commit đó)" framing
   (a staged diff vs `HEAD`, for a non-merge-conflict commit, *is* a diff vs
   the first parent).
3. `src/runner/merge.mjs:704-715,1280-1290` `mergeRunnerItemLocked`'s
   `fgos-write-rejected` check — confirmed: checked on the STAGED diff
   after a clean `git merge --no-commit --no-ff branch` lands (i.e. no
   conflict), filtered to `.fgos/*` paths, relative to the checkout's
   CURRENT `HEAD` (main). Also confirmed (comment at 674-690, prior
   tsk-1lv review-fix F12) that ONE-sided drift (main moved, worker never
   touched the path) resolves with **zero** staged diff for that path —
   git's 3-way merge just adopts main's own already-current value, so
   nothing appears different from `HEAD`. This is why tsk-2f6's three live
   reproductions (`docs/history/catchup-approve-fgos-write-rejected-loop/
   RESEARCH.md`) all passed cleanly: none of them forced a worker-side
   *revert* of `.fgos/*` content, only plain one-sided drift.
4. `.gitattributes` — confirmed: exactly one entry, `.fgos/events.jsonl
   merge=union`. No entry for `.fgos/approve-post-success-faults.jsonl` or
   any other `.fgos/*.jsonl` file. Confirms the item's claim #4 gap
   precisely — `events.jsonl` is the only append-only `.fgos/*.jsonl` with
   union-merge protection.
5. **Why finding #2 + #3 combine into a real deadlock, not just two
   independent one-sided-drift-safe checks:** to satisfy check #2 (pre-commit,
   zero tolerance on the worker branch), the operator must restore
   `.fgos/approve-post-success-faults.jsonl` back to the worker branch's OWN
   pre-merge value in the same commit that also resolves the real conflict.
   That restoration is itself a content CHANGE relative to the merge base
   (base = main's state at manual-merge time, which already had the file
   grown past the worker's original fork-point value) — i.e. the worker's
   committed tree now DIVERGES from main on this path in the direction of
   "reverted", not "never touched". By the time `approve` later runs
   `mergeRunnerItemLocked`'s `git merge --no-commit --no-ff branch` against
   whatever main has grown to since, BOTH sides differ from the merge base
   for this path (main added lines, worker branch appears to have removed
   them) — no `merge=union` driver exists for this file, so git's default
   line-based 3-way merge does not cleanly re-adopt main's value the way
   finding #3's single-sided case does; the staged result differs from
   current `HEAD`, and `fgos-write-rejected` fires (real, cited below,
   3x in a row on the same content). No static `.fgos/*` snapshot — root
   branch point, pre-merge first parent, or current main — can be the
   worker's committed value: matching main "now" fails a beat later when
   main grows further (main never stops growing on this path since every
   approve on every item appends to it), and matching the worker's own
   frozen value is exactly what triggers `fgos-write-rejected` once main
   has moved at all past the merge-base point.
6. **Real incident, `fgw/tsk-3ve`** (`.fgos/events.jsonl`, seq 23977-24001;
   note: the item text says "2026-08-24 ~21:30-22:00 UTC" but the real
   events are timestamped **2026-08-23**, a one-day error in the item's own
   description, not in the underlying incident):
   - seq 23979/23980, 21:32:28Z — first approve attempt: `work.friction`
     `errorClass: "merge-conflict"`, detail `"cross-root integration drift
     ... git merge --no-commit --no-ff fgw/tsk-3ve conflicted; merge
     aborted, main unchanged"` — a real (non-`.fgos`) conflict at
     `mergeRunnerItemLocked`'s own merge attempt (this specific incident's
     first block came from `approve`'s own merge call hitting the conflict
     directly, not necessarily via a separate prior `fgos catchup` call —
     a minor imprecision in the item's phrasing, not in its mechanism,
     since both call sites share the identical all-or-nothing-abort-on-
     conflict code shape per findings #1/#3).
   - seq 23983/23984, 21:39:36Z — SECOND approve attempt (after the
     operator's manual conflict resolution, item moved `blocked → doing →
     awaiting-approval` in between): `errorClass: "fgos-write-blocked"`,
     detail `"fgw/tsk-3ve staged a change under .fgos/
     (.fgos/approve-post-success-faults.jsonl); merge aborted, main
     unchanged"`.
   - seq 23989/23990/23991, 21:45:11Z — THIRD attempt: identical
     `fgos-write-blocked` on the identical path, identical detail text.
   - seq 23996/23997/23998, 21:56:57Z — FOURTH attempt: identical again.
   - seq 23985, 23992, 24000 (`work.move blocked→doing`) all carry the
     exact same `branchHeadAtTake:
     "96f7071fa0fc1c0999d6b2e6e646626686092565"` — the branch tip never
     moved across all three `fgos-write-rejected` cycles, so each retry hit
     the identical rejection on the identical committed state (the same
     "same branch head, same rejection, retry never self-resolves" pattern
     tsk-2f6's `CONTEXT.md` documented for the unrelated `tsk-3ti`
     incident, but here for a genuinely different, structural root cause).
   - seq 23999, 21:58:45Z — tsk-2xg itself was filed immediately after the
     third consecutive identical rejection.
   - seq 24000, 23:43:20Z (the most recent tsk-3ve event as of this
     research round) — `tsk-3ve` moved `blocked → doing` again with the
     SAME `branchHeadAtTake`, i.e. still unresolved.
7. Existing test coverage for this area: `test/runner/merge.test.mjs` and
   `test/cli/fgos-approve.test.mjs` (also `test/cli/fgos-merge.test.mjs`,
   `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`) — none of
   these currently construct the two-sided-drift-after-forced-restore
   scenario found in points 5-6 above (grep for `approve-post-success-
   faults` and `merge=union` in `test/` returned no hits); the existing
   suite covers the single-sided-drift-is-safe case (matching tsk-2f6's
   own 3 reproductions) but not this narrower, real, unresolved case.

**Still open (belongs to planning, not discovery):** which of the item's
two proposed directions — (a) `.gitattributes merge=union`/`merge=ours` for
`.fgos/approve-post-success-faults.jsonl` and any other append-only
`.fgos/*.jsonl`, or (b) an unconditional `git checkout --ours`/`--theirs`
for all `.fgos/*` paths right after `git merge --no-commit` in
`performCatchUp`/`mergeRunnerItemLocked`, before the staged-diff check —
is the right fix, and whether `.fgos/*` has any other append-only `.jsonl`
files beyond `approve-post-success-faults.jsonl` that need the same
treatment (a full inventory of `.fgos/*.jsonl` files was not run against
the main checkout's actual current file list in this round — the worktree
this session runs in never carries `.fgos/`, per ADR0020, so that inventory
needs `--dir <mainRoot>` against the real store, a planning-stage input,
not a discovery-stage blocker: the mechanism is already proven with the one
concretely-named file).
