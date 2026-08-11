# RESEARCH.md — retrospective-synthesis-merge-corruption (tsk-2oy)

## Round 1 — 2026-08-11 (fgos-researching, stage `discovery`)

**Asked:** Is tsk-2oy's claim correct — that tsk-4v6's real code fix never
reached main, and that the root cause is in the retrospective-synthesis/merge
pipeline letting an unrelated item's branch land under tsk-4v6's own commit
message? Is the intent (what needs fixing) clear enough to move forward?

### Checked

- `git branch -a | grep tsk-4v6` → `fgw/tsk-4v6` still exists.
- `git merge-base --is-ancestor 687abfb8 main` → **NO** (exit 1). tsk-4v6's
  real fix commit is not on main.
- `git log --all --oneline -S parseVerdictBlock -- src/runner/loop.mjs` →
  exactly one commit, `687abfb8`, unreachable from main.
- `git log -1 --format="%H %P %s" 4481721d` → merge commit, message
  `docs(tsk-4v6): retrospective synthesis`, parents `a2fdf31b` (tsk-4hb's own
  retrospective-synthesis commit, the real prior tip) and `8a2d0783`
  (`docs(tsk-104): Iron Law evidence for the description-keyword false
  positive` — confirmed unrelated to tsk-4v6).
- `git show --stat 4481721d` → touches only docs/decisions files and
  `plugins/fgOS/skills/cook/SKILL.md` — none of tsk-4v6's own files
  (`src/runner/loop.mjs`). Confirms tsk-4v6's own docs-synthesis change is
  NOT what actually landed in this commit's diff; tsk-104's content is.
- Read `.claude/skills/fgos-compounding/SKILL.md` step 3 (lines ~121-128):
  the retrospective-synthesis flow's ONLY git write is a plain, non-merge
  commit:
  ```bash
  git -C "$root" add "docs/<quadrant>/<file>.md"
  git -C "$root" commit -m "docs(<id>): retrospective synthesis"
  ```
  No `git merge` anywhere in this skill. **A plain `git commit` only ever
  produces a 2-parent commit when the checkout already has a `MERGE_HEAD`
  staged from an earlier, uncommitted `git merge`** — i.e., this step
  silently completes and mislabels whatever merge another process (most
  likely a concurrent/crashed `fgos approve` → `mergeRunnerItem` in
  `src/runner/merge.mjs`, which does `git merge --no-commit --no-ff
  <branch>` then either commits or aborts) left staged in the SAME shared
  main checkout.
- Read `src/runner/merge.mjs`'s `mergeRunnerItem`: it acquires
  `.fgos/main-checkout.lock` (`acquireMainCheckoutLock`) before its own
  `git merge --no-commit --no-ff` / `git commit` / `git merge --abort`
  sequence. **`fgos-compounding`'s step 3 acquires no lock, checks no
  `MERGE_HEAD`, and checks no working-tree-clean state before its own
  `git commit`** — the two paths are not mutually exclusive.
- Confirmed this is a **systemic pattern, not a one-off**:
  `git log --all --min-parents=2 --grep="retrospective synthesis" --oneline`
  finds 5 such commits, each a 2-parent merge whose second parent is
  another item's unrelated work:
  | synthesis commit | absorbed second parent |
  |---|---|
  | `7bf76aaa` docs(tsk-648) | `docs(tsk-5nj): plan.md -- split into tsk-4mx + tsk-49e` |
  | `4481721d` docs(tsk-4v6) | `docs(tsk-104): Iron Law evidence ...` |
  | `a23ec8a1` docs(tsk-1q5) | `Merge branch 'main' into fgw/tsk-13m` |
  | `d984e9ed` docs(tsk-1vi) | `docs(tsk-66t): add Iron Law failing-test-first evidence` |
  | `45aa107f` docs(tsk-2x9) | `fix(tsk-1r3): explicit semanticRelatedness:0 in decompose's refined priority pass` |

  The `tsk-2x9`/`tsk-1r3` case is the most severe: a genuine CODE fix
  (`fix(tsk-1r3): ...`) got absorbed and buried under an unrelated docs
  commit's message — the exact same failure shape as tsk-4v6, on a second,
  independently-discovered item. This is strong evidence the audit named in
  requirement (3) of tsk-2oy's own description will find more instances if
  extended beyond this literal-grep pass (this search only matches items
  whose synthesis commit message is exactly "retrospective synthesis" and
  is reachable via `--all`; it does not itself prove these are the only 5).

### Findings

1. **tsk-4v6's real fix (`687abfb8`) is confirmed missing from main.**
   Requirement (1) of the item — merge `fgw/tsk-4v6`'s real tip into main —
   is a real, necessary fix, not a false alarm.
2. **Root cause located (requirement 2):** `fgos-compounding` step 3's raw
   `git commit` on the shared main checkout has no `MERGE_HEAD` guard, no
   `main-checkout.lock` acquisition, and no working-tree-clean precondition
   — unlike every other main-checkout writer in this repo
   (`mergeRunnerItem`, the `.githooks/pre-commit` hook). When a concurrent
   or crashed `fgos approve` leaves a merge staged-but-uncommitted, this
   step's plain commit silently finishes it under the WRONG item's message,
   burying that other item's real diff.
3. **Scope is wider than tsk-4v6 (requirement 3, partial):** at least 5
   synthesis commits show this exact 2-parent shape; one of them
   (`45aa107f`/tsk-2x9) buried a genuine code fix, not just docs. A full
   audit (every `delivered`/`cleanup`/`done` item's `branchHeadAtReturn`
   vs. ancestry on main) is still open — this round only found the ones
   with the literal "retrospective synthesis" message reachable via
   `--all`, which is a lower bound, not a completed audit.

### Still open (for `exploring`/`decompose`)

- Whether the fix is (a) add a `MERGE_HEAD`/lock guard to
  `fgos-compounding` step 3, (b) route the docs commit through a proper
  one-door verb instead of raw `git commit`, or (c) both — this is a design
  decision for `fgos-exploring`/`fgos-planning`, not this round's call.
  All 5 confirmed instances of the bug ARE the evidence such a guard would
  have caught (a `MERGE_HEAD`-present precondition check on the plain
  commit step would refuse in every one of these 5 cases).
- The full audit of every `delivered`/`retrospective`/`cleanup`/`done`
  item's `branchHeadAtReturn` vs. main ancestry (item's own requirement 3)
  is real, scoped work, not yet done — left for the next stage.

## Verdict

**Clear.** The claim is fully verified against real repo evidence (git
history, the exact commit hashes named), the root cause is located with a
concrete mechanism (unlocked/unguarded `git commit` absorbing a stray
`MERGE_HEAD`), and the fix scope is well-bounded even though the audit
itself is unfinished — that audit is real follow-on work, not a blocker
to understanding what to build.

```
verify: git merge-base --is-ancestor 687abfb8 main && npm test
```
