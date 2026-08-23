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
- Read `.claude/skills/fgos-coding-compounding/SKILL.md` step 3 (lines ~121-128):
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
  sequence. **`fgos-coding-compounding`'s step 3 acquires no lock, checks no
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
2. **Root cause located (requirement 2):** `fgos-coding-compounding` step 3's raw
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
  `fgos-coding-compounding` step 3, (b) route the docs commit through a proper
  one-door verb instead of raw `git commit`, or (c) both — this is a design
  decision for `fgos-coding-exploring`/`fgos-coding-planning`, not this round's call.
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

## Round 2 — 2026-08-18 (fgos-researching, stage `discovery`, tsk-3u8)

**Asked:** tsk-3u8's own per-instance follow-up for the `d984e9ed`
(`docs(tsk-1vi): retrospective synthesis`) row of Round 1's table — parent 1
`93a9859b` (tsk-57q's own prior retrospective-synthesis), parent 2
`8dd4b5be` (`docs(tsk-66t): add Iron Law failing-test-first evidence`).
Two open questions per the item: (1) is tsk-66t's Iron Law evidence doc
genuinely intact on main today, (2) did tsk-1vi's own retrospective-
synthesis doc write survive in the same commit and get properly tagged via
`fgos compound`, or was it silently dropped?

### Checked

- `git diff 93a9859b d984e9ed --stat` → the merge added exactly 7 files
  beyond parent1: `bin/fgos.mjs`, `docs/explanation/gate-bypass-design.md`,
  `docs/explanation/why-merge-next-auto-syncs-blockedonsync-roots.md`,
  `docs/history/tsk-66t-sync-root-clean-tree-gate/iron-law-evidence.md`,
  `docs/history/tsk-66t-sync-root-clean-tree-gate/plan.md`,
  `docs/reference/fgos-sync-root-outcome-shape.md`, `test/cli/fgos.test.mjs`.
- `git diff 8dd4b5be72751c50396cceef367c25ce27b0f51b:docs/history/tsk-66t-sync-root-clean-tree-gate/iron-law-evidence.md main:docs/history/tsk-66t-sync-root-clean-tree-gate/iron-law-evidence.md`
  → **empty diff**. tsk-66t's Iron Law evidence doc is byte-identical on
  `main` today to the original `8dd4b5be` commit. Requirement (1) resolved:
  **intact, no corruption.**
- Same empty-diff check on `docs/history/tsk-66t-sync-root-clean-tree-gate/plan.md`
  found two later cosmetic renames (`fgos-exploring`→`fgos-coding-exploring`,
  `fgos-validating`→`fgos-coding-validating`), part of this repo's later
  skill-namespace rename, not corruption.
- `git diff 93a9859b d984e9ed -- bin/fgos.mjs` → the merge's 21-line
  `bin/fgos.mjs` addition was tsk-66t's own sync-root dirty-tree gate
  (`StoreError ... 'is not clean'` check + `{picked, blocked: 'dirty-tree',
  ...}` shape). `grep -n "tsk-66t" bin/fgos.mjs` on main today → no hits
  (expected: this repo's own rule bans plan/task IDs in code comments, a
  later cleanup stripped the token, not the code). `grep -n "is not
  clean\"|dirty-tree\|buildOwnFileSet\|isMainTreeClean" bin/fgos.mjs` and
  `src/verbs/merge/*.mjs` on main today → both pieces of logic present,
  relocated by a later verb-extraction refactor into
  `src/verbs/merge/sync-root.mjs:249-251` (the dirty-tree gate itself) and
  `src/verbs/merge/merge.mjs:139-146` (the `dirty-tree` blocked-shape
  catch, `tsk-66t` comment token still present there verbatim). Functional
  behavior intact, only the module location moved.
- `fgos show tsk-66t --json` → item status `cleanup`/stage `executing` (a
  live, non-orphaned item — consistent with its work having actually
  landed and progressed through the normal lifecycle since).
- `git diff 93a9859b d984e9ed -- docs/explanation/gate-bypass-design.md`
  and the same diff against parent2 (`8dd4b5be`) → **identical 59-line
  addition on both sides**: the merge added a new
  `## A mechanical check is only as live as the branch importing it
  (D7/D8, tsk-1vi)` section plus `tsk-1vi` added to the frontmatter
  `source_capture_ids: [tsk-6bx, tsk-1ds, tsk-1vi]`. This is tsk-1vi's own
  retrospective-synthesis content, genuinely written into the merge
  commit, not one side's pre-existing content silently winning over the
  other's loss.
- `git show main:docs/explanation/gate-bypass-design.md` vs. the commit
  version → same D7/D8 section present verbatim on `main` today.
- `fgos show tsk-1vi --json` → `outcome.docType: "explanation"`,
  `outcome.docPath: "docs/explanation/gate-bypass-design.md"` — the fgOS
  state itself records this exact file as tsk-1vi's compounded doc,
  confirming it was tagged via `fgos compound`, not silently dropped.
  Requirement (2) resolved: **doc write survived and is properly tagged.**
- `grep -rl "tsk-66t" test/` → tsk-66t's own test coverage (originally in
  the single `test/cli/fgos.test.mjs` the merge touched) survives today,
  redistributed by a later, unrelated commit (`a20c69ef`, tsk-3um: "split
  the CLI suite into ten files") into `test/cli/fgos-merge.test.mjs`,
  `fgos-approve.test.mjs`, `fgos-return.test.mjs`, `fgos-move.test.mjs`,
  and `test/cli/helpers/fgos-cli-harness.mjs`. Not lost, just relocated by
  routine repo maintenance unrelated to the merge-corruption pattern.

### Findings

Both open questions from tsk-3u8's description resolve to **non-issue**:
the suspicious 2-parent merge shape (same stray-`MERGE_HEAD`-absorption
class tsk-2oy's root-cause fix addressed) did **not** actually cause
content loss in this specific instance, unlike the `tsk-4v6`/`687abfb8`
and `tsk-2x9`/`tsk-1r3` instances Round 1 confirmed as real losses. Every
file the merge is supposed to carry (tsk-66t's evidence doc + its
functional code, tsk-1vi's own D7/D8 write) is present and correct on
`main` today, with only routine later refactors (verb extraction,
skill-namespace rename, test-suite split) moving code/tests around —
never dropping content.

### Still open

None for this instance. The wider audit Round 1 flagged (every
`delivered`/`retrospective`/`cleanup`/`done` item's `branchHeadAtReturn`
vs. main ancestry) remains separate, real follow-on work tracked
elsewhere, not this item's scope.

## Verdict

**Clear.** Both requirement (1) and requirement (2) from tsk-3u8's own
description are answered from direct evidence (`git diff`/`git show`
against real commit SHAs, `fgos show` against live state) — no assumption,
no plausibility reasoning. This is a confirmed non-issue: close as
resolved/verified, not a code fix.

```
verify: npm test
```
