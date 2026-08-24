# RESEARCH — tsk-5et

Item: `fgos catchup`/`performCatchUp`'s ephemeral-worktree merge can
spuriously refuse a merge with `error: Entry '<path>' not uptodate. Cannot
merge.` on a path the branch never touched since its merge-base.

## Round 1 — 2026-08-24 (discovery stage, fgos-coding-discovering)

Three independent questions, each checked directly against the repo.

### Q1 — is the "near-content-free `.fgos` merge=union checkpoint commits
interacting with git rename-detection" theory plausible for the SPECIFIC
failing path (`.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md`)?

Checked:
- `.gitattributes` (repo root): only `.fgos/approve-post-success-faults.jsonl`,
  `.fgos/invocation-faults.jsonl`, `.fgos/main-checkout-guard-warnings.jsonl`,
  `.fgos/changelog-nag-history.jsonl`, `.fgos/entropy-history.jsonl`, and
  `.fgos/events/*.jsonl` are declared `merge=union`. The failing path is
  `.agents/skills/...` — not under `.fgos/` at all, and not declared
  `merge=union`.
- `git log --oneline --follow --diff-filter=R -- .agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md`
  on `main`: 0 rename commits found (10 total commits touch the file, none
  are renames).
- Merge-base of `main`/`fgw/tsk-25b` (still present locally):
  `30455c2d2e1c1387779ad810e2df9a63c0805bf8`. `git log --oneline
  <merge-base>..main -- <path>` = 0 commits. `git log --oneline
  <merge-base>..fgw/tsk-25b -- <path>` = 0 commits (matches the item's own
  claim that the branch never touched it, but ALSO shows main never
  touched it either).

**Finding: the working theory does not fit this specific path.** The
failing file is not `merge=union`, has no rename history on either side,
and was untouched by BOTH sides since the merge-base — there is nothing
for a rename-detection pass or a union-merge interaction to act on for
this exact path. Whatever caused the "not uptodate" refusal on this file
is a different mechanism than the one the item's working theory names.

`{clear: true, verify: "n/a — this is a discovery-stage plausibility check,
not a runnable command"}` — the question "is the theory plausible for this
path" is answered (no), even though the real root cause is still open.

### Q2 — does the repo already have reusable throwaway-repo/fixture tooling
for the item's requested reproduction?

Checked: `rg` across `test/`, `scripts/` for git-repo-builder patterns.
`test/runner/merge.test.mjs:37-62` already has exactly this shape:
- `initRepo()` (`merge.test.mjs:37`) — `fs.mkdtempSync` + `git init -q -b
  main` + seed commit.
- `git(repoRoot, args)` (`merge.test.mjs:48`) — thin `execFileSync` wrapper.
- `headOf(repoRoot)` (`merge.test.mjs:52`).
- `makeBranchWithCommit(repoRoot, branch, filename, content)`
  (`merge.test.mjs:56-62`) — branches off `main`, commits one file, returns
  to `main`.
- The file already imports `withMergeEphemeralWorktree` and `performCatchUp`
  directly from `src/runner/worktree.mjs`/`src/runner/merge.mjs`
  (`merge.test.mjs:28`), i.e. the exact real code path the item's "Needs"
  section asks to replay.

**Finding: no need to build repro scaffolding from scratch** — a plan for
this item can extend `test/runner/merge.test.mjs`'s existing helpers
(many small `merge=union`-attributed commits on `main`, one branch forked
far behind, replay `performCatchUp`) instead of hand-rolling a throwaway
repo.

`{clear: true, verify: "n/a — inventory question, not a runnable command"}`.

### Q3 — does `performCatchUp`/`withMergeEphemeralWorktree` at current HEAD
still match the item's description?

Checked: `src/runner/merge.mjs:1634-1699` (`performCatchUp`) and
`src/runner/worktree.mjs:1255` (`withMergeEphemeralWorktree`, signature
only inspected, not read in full this round).

- `performCatchUp` still runs `execFileSync('git', ['merge', '--no-commit',
  '--no-ff', target], ...)` inside the ephemeral worktree
  (`merge.mjs:1658`), matching the item's description exactly.
- The `.fgos/` strip described in the item ("raw `fs.rmSync`, not `git
  rm`") is real and lives in `worktree.mjs` (e.g. `worktree.mjs:606`,
  `:909`), confirming the ADR0020 "worker branches never carry `.fgos/`"
  mechanism the item refers to.
- `merge-base --is-ancestor` pre-check: present at `merge.mjs:1639`
  (`already-caught-up` short-circuit), matching the item's own description
  of a "merge-base ancestor pre-check" in its reproduction sequence.
- **New finding beyond the original ask**: `performCatchUp`'s catch block
  (`merge.mjs:1656-1668`) treats EVERY failure of the initial `git merge`
  call the same way — it calls `resolveFgosOnlyConflict`, which reads
  `git diff --name-only --diff-filter=U` to find conflicted paths
  (`merge.mjs:1213-1218`) and returns `false` immediately when that list is
  empty. A `not uptodate` refusal is a **pre-merge refusal** (git refuses
  before staging anything), not a content conflict — nothing is ever
  staged as conflicted, so `resolveFgosOnlyConflict` always short-circuits
  `false` on this failure shape, `conflicted` is set `true`, and the code
  then attempts `git merge --abort` (`merge.mjs:1679`) with no merge
  actually in progress. Whether that abort itself throws (no `MERGE_HEAD`
  to abort) was not tested this round — flagged as the next concrete
  thing a repro should check, since it would explain why the observed
  failure took 116s (per the item's own GIT_TRACE numbers) and produce a
  secondary, more confusing error on top of the original "not uptodate"
  one.

`{clear: true, verify: "n/a — code-currency check, not a runnable command"}`.

## Still open (not resolved this round)

- The actual git-internals mechanism causing `not uptodate` on a
  never-touched, non-union path — this needs the isolated repro the item's
  own "Needs" section already asks for (now unblocked by Q2's finding:
  reuse `test/runner/merge.test.mjs`'s existing fixtures rather than
  building new ones).
- Whether `performCatchUp`'s abort-after-non-conflict-failure path
  (`merge.mjs:1679`) itself throws or silently no-ops on a pre-merge
  refusal — a concrete, cheap thing to check as part of that repro.
