# reclaim-refuse-live-session-worktree — plan.md

## Mode

**high-risk** (hard-gate: data loss — the whole item is about preventing
destructive removal of a live, in-use worktree).

Flag count for the record (10-flag checklist, `fgos-coding-planning`'s own mode
gate):

| Flag | Applies? |
|---|---|
| auth | no |
| authorization | no |
| data model | no |
| audit/security | no |
| external systems | no |
| public contracts | yes — extends `approve`'s observable refusal-error contract for a new refusal case |
| cross-platform | no |
| existing covered behavior | yes — `reclaimOrphanedCheckout` already has 5 direct tests in `test/runner/worktree.test.mjs` that must keep passing unchanged |
| weak proof around the area | no — area is well-tested, incident-driven (tsk-1os, tsk-k8u, tsk-3lx all added guard tests here) |
| multi-domain | no |

Count = 2 → would be `standard` on count alone, but the explicit hard-gate
(**data loss**) escalates to `high-risk` regardless of count, per this
skill's own mode-gate rule.

## Approach

**Chosen:** add an explicit `callerCwd` guard to `reclaimOrphanedCheckout`
(`src/runner/worktree.mjs`) — a third, optional parameter defaulting to
`process.cwd()` — that refuses (throws `WorktreeError`, same shape as the
two existing guards in this function) when the checkout about to be
force-removed is the CALLING session's own live worktree:

- **exact-match case** (the literal incident): `path.resolve(orphanPath)
  === path.resolve(callerCwd)` — the session ran `fgos approve` from
  inside the very worktree checked out on the branch being reclaimed
  (this is exactly what happens under the documented tsk-424
  chained-`EnterWorktree` pattern: a session `cd`s — logically, via
  `EnterWorktree` — into a claimed item's own worktree, then runs
  `fgos approve` on it or on its root from there).
- **nested case** (defense-in-depth, not the literal incident but the same
  class of bug): `callerCwd` is a path-descendant of `orphanPath`
  (`callerCwd` starts with `orphanPath + path.sep`) — covers a
  genuinely-nested worktree layout, mirroring how thorough the existing
  REPO-ROOT GUARD already is for its own single case.

No new parameter threads through `cleanupMergedBranch` or any `bin/
fgos.mjs` call site — defaulting to `process.cwd()` inside
`reclaimOrphanedCheckout` itself means production behavior is correct with
zero caller changes (the real `fgos approve` process's cwd IS the live
session's cwd in exactly the scenario this item cares about). The optional
param exists only so tests can inject a simulated "session is standing
here" path without mutating the real global `process.cwd()`.

Error message includes the phrase **"the calling session's own live
checkout"** — deliberate, concrete wording chosen now (not left to
`fgos-coding-implement` to improvise) so `CONTEXT.md`'s own verify command
(`rg -n 'live session|isLiveSessionWorktree' -i ...`) has something real to
match once this lands.

**Alternatives considered, rejected:**
- Directory-based ancestor-walking across a recorded history of every
  worktree a session ever chained through — over-engineered (YAGNI):
  `EnterWorktree` never nests worktree paths (siblings under
  `.claude/worktrees/`, per its own tool contract), so a single
  cwd-vs-orphanPath comparison at the moment of reclaim already covers
  both approvals in the tsk-424 incident (leaf approve run from the leaf's
  own worktree, root approve run from the root's own worktree) —  no
  cross-call session-history state needed.
- Checking `.fgos`/claim-lock session-role state ("is this item's
  `claimRole` still `doing`") instead of cwd — rejected: `worktree.mjs`
  has zero dependency on `state/store.mjs` today (a deliberate low-level/
  high-level layering this module's own header implies); a cwd comparison
  keeps that boundary intact and matches the existing REPO-ROOT GUARD's
  own simple `path.resolve` style exactly.

**Files touched:**
- `src/runner/worktree.mjs` — `reclaimOrphanedCheckout`'s signature and
  body (the guard itself).
- `test/runner/worktree.test.mjs` — new regression tests (see Proof
  surface below).

No other file needs to change — `cleanupMergedBranch` (`src/runner/
merge.mjs`) and every `bin/fgos.mjs` call site keep calling
`reclaimOrphanedCheckout(repoRoot, branch)` exactly as today.

**Impact-analysis gate** (`CLAUDE.md`): GitNexus registered and `present`,
but the harness flagged its index stale (last indexed `7d6ac91`) —
**degraded** posture per the updated gate. Cross-checked with a direct
`rg`/`git log` sweep instead of trusting the graph blindly: `grep -rn
"reclaimOrphanedCheckout" src bin` (repo-wide) and GitNexus's own `impact`
query for the symbol agree exactly — the only real caller is
`cleanupMergedBranch` (`src/runner/merge.mjs:931`), which itself is called
from three `bin/fgos.mjs` sites (leaf-into-root ~2536, root-into-main
~2647, the runner's own cleanup sweep ~1073) and one `createWorktree`-reuse
site that no longer applies (already switched to
`relocateOrphanedCheckout` by `tsk-3lx`, commit `95e9525`, today). Blast
radius is genuinely this narrow: one function, one direct caller.

**Order:** single piece, no dependency ordering needed (`fgos graph
--json` shows this item in its own isolated component — nothing else in
the graph blocks or is blocked by it).

## Proof surface (for `fgos-coding-validating` / `fgos-coding-implement`)

| Risk | How risky | Proof point |
|---|---|---|
| New guard fails to catch the exact incident shape | high (this is the whole point of the item) | new test: `reclaimOrphanedCheckout` throws `WorktreeError` and leaves the checkout untouched when `callerCwd === orphanPath` (mirrors the existing "uncommitted changes" test's exact structure — `createWorktree`, no `removeWorktree`, assert `assert.throws` + `fs.existsSync` still true) |
| Nested-worktree defense-in-depth case regresses silently if never covered | medium | new test: same shape, `callerCwd` set to a path nested one level under `orphanPath` |
| New guard breaks the 5 existing `reclaimOrphanedCheckout` tests (dirty-checkout, repo-root, no-op, force-remove, `.fgos`-only-diff) | medium — these are the area's existing covered behavior | run `node --test test/runner/worktree.test.mjs` unmodified-tests-still-green, no `callerCwd` override needed since `process.cwd()` during `npm test` is the real repo checkout, never any of the tests' own `mkdtemp`'d disposable repos — zero accidental collision |
| New guard over-triggers in the runner's own headless cleanup sweep (`bin/fgos.mjs` ~line 1073), which runs from `repoRoot`, not a worktree | low | reasoning proof (no new test needed): that call site's `callerCwd` (`process.cwd()`) is `repoRoot`, and `orphanPath` there is always some OTHER worktree being cleaned up — never `repoRoot` itself — so the two can never collide there |

Concrete cases sketch (high-risk mode depth): exact-match live session
worktree, nested live session worktree, unrelated `callerCwd` (must still
reclaim normally — regression), and the pre-existing repo-root/dirty-
checkout/`.fgos`-only-diff guards (must still take precedence/co-exist,
regression).

## Assumptions

- The real `fgos approve` process's `process.cwd()` at the moment it runs
  equals the interactive session's own live worktree path in the tsk-424
  chained scenario — true today because `fgos approve` is a plain
  synchronous CLI invocation from wherever the shell/session currently is,
  with `--dir`/`--git-common-dir` resolution handling `repoRoot`
  separately from `cwd` (confirmed: `bin/fgos.mjs`'s own `--dir` flag
  exists specifically because `cwd` and `repoRoot` already diverge in a
  linked worktree). Not re-verified against a live two-hop chained session
  in this plan — `fgos-coding-validating`'s reality check should confirm this
  assumption holds, since it is the one thing the whole fix leans on.

## Split

No split. One coherent piece — a single guard added to one already-tested
function.

## Verify

`rg -n 'live session|isLiveSessionWorktree' -i src/runner/worktree.mjs &&
node --test test/runner/worktree.test.mjs` (unchanged from `CONTEXT.md`) —
now concretely satisfiable: the implementation's own error message
literally contains "the calling session's own live checkout".
