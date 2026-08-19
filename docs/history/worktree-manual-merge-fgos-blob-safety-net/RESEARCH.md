# Research log — worktree-manual-merge-fgos-blob-safety-net (tsk-5pb)

## Round 1 — 2026-08-19

**Asked:** Does fgOS's existing ADR0020 "fgos-write-rejected" guard already
catch the scenario tsk-5pb describes — a person manually running
`git merge --no-commit --no-ff main` inside an fgOS worktree to resolve a
real content conflict, ending up with `.fgos/config.json` /
`.fgos/events.jsonl` staged as Modified (reverted to stale pre-merge blobs)?
Or does that manual-resolution path bypass the guard and hit a raw git
"local changes would be overwritten by merge" error instead? Is there any
existing mechanical guard (pre-commit hook, engine check) that catches a
`.fgos/*` file staged as Modified (not Deleted) with stale content?

**Checked (repo, cited):**

- `src/runner/merge.mjs:1218-1231` (`mergeRunnerItemLocked`) — the real
  ADR0020 guard. It runs `git merge --no-commit --no-ff branch` itself
  (the fgOS *engine's own* controlled merge, invoked by `fgos
  approve`/`fgos sync-root` against the live main checkout), then reads
  `git diff --name-only --cached` and aborts (`outcome:
  'fgos-write-rejected'`) if any staged path is under `.fgos/`. This DOES
  fire on a Modified path, not only Deleted — it inspects the staged diff
  after its own merge attempt, regardless of whether the change originated
  from the branch's prior commits or from git's own 3-way materialization.
  **But this guard only runs when the fgOS engine itself performs the
  merge.** It never runs for a merge a person executes by hand
  (`git merge` typed directly in a worktree) — that path never calls
  `mergeRunnerItemLocked` at all.
- `.githooks/pre-commit` (tsk-56u's own header comment, confirmed against
  its detection code) — the "STAGED-FGOS-DELETION" guard refuses a commit
  that stages a **deletion** under `.fgos/`. It has no equivalent check for
  a `.fgos/*` path staged as **Modified** with stale/reverted content — a
  manual merge commit that reverts `.fgos/events.jsonl` to an older blob
  passes this hook silently (it is a Modified path, not a Deleted one).
  **Confirmed: no existing mechanical guard catches the Modified-with-
  stale-content case tsk-5pb describes**, at either the pre-commit-hook
  layer or the engine layer, for a merge run outside `fgos
  approve`/`sync-root`'s own controlled path.
- AGENTS.md's own ADR0020 doc comments (`src/runner/worktree.mjs:563-566`,
  `609-613`) — confirm the root-cause mechanism tsk-5pb's own description
  already states correctly: a linked worktree keeps `.fgos/` *tracked in
  its git index* (never `git rm`'d) but *physically stripped from the
  working directory* right after `git worktree add`. When a manual 3-way
  merge needs to reconcile a `.fgos/*` blob that changed on both sides,
  git must materialize the merged content into the working tree to
  complete the merge — which is exactly why the file reappears as
  Modified, not Deleted, contradicting the worktree-stripped convention
  without violating it mechanically (the merge algorithm doesn't know
  about the convention at all).
- Live evidence for why the *main-checkout*-side raw git error
  ("Your local changes... would be overwritten by merge") is a routine
  condition, not a one-off: no writer in `src/state/*.mjs` (checked
  `dep-graph.mjs`, `events.mjs`, `store.mjs`, etc.) commits
  `.fgos/events.jsonl` on every event append — commits only happen via
  periodic `chore(fgos): sync events log` sweeps (visible in this repo's
  own recent commit history). This session's own opening `git status`
  showed `.fgos/events.jsonl` sitting Modified/uncommitted in the main
  checkout at conversation start — confirming the main checkout routinely
  carries dirty `.fgos/` state between syncs, which is the precondition
  for git's own "local changes would be overwritten" failure when a
  branch carrying a conflicting `.fgos/*` blob is merged in.

**Precedent (kind/risk classification, `fgos list --all --json`):**
tsk-3au (`main-checkout-destructive-git-safety-net`) is `kind: bug, risk:
heavy, tier: heavy`, `status: done` — doc-only AGENTS.md safety-net rule,
no mechanical guard. tsk-56u (`commit-time-fgos-deletion-guard`) is `kind:
bug, risk: standard, tier: standard` — added BOTH a doc rule AND a real
pre-commit-hook mechanical guard (the deletion-only guard tsk-5pb's own
scenario falls outside of). tsk-56u is the closer precedent in shape:
same `.fgos/` safety-net area, same "doc rule + optional narrow mechanical
guard" scope.

**Still open (for planning, not discovery):** whether tsk-5pb's own fix
should ship the doc rule alone (matching tsk-3au's shape) or also extend
the mechanical guard to the Modified case (matching tsk-56u's shape, and
covering the gap this round confirmed is real) is a scope decision for
`fgos-coding-planning`, not `discovery` — the evidence above is sufficient
to unblock planning either way; nothing left is scout-answerable.

**Verdict:** `clear`. The item's own root-cause narrative is independently
confirmed against actual code (`merge.mjs`, `.githooks/pre-commit`,
`worktree.mjs`'s ADR0020 comments) and live repo state (dirty
`.fgos/events.jsonl` in the main checkout at this very session's start).
No named gap remains that only a person could resolve — the remaining
question (doc-only vs. doc+guard) is an ordinary scope call for planning,
not evidence a person needs to supply.

Real verify: `grep -n "modified.*\.fgos\|Modified.*\.fgos" AGENTS.md` should
find the new rule once planning/executing lands it (a rule about a
**Modified**, not Deleted, `.fgos/*` path during manual merge resolution
does not exist in AGENTS.md today — confirmed by reading its current
`.fgos/` safety-net section, which only covers `git reset --hard`,
`git add -A`, and `git stash`, none of them the manual-merge-modify case).
