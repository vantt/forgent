# Plan: root worktree resync guard (tsk-2cd)

Mode: standard

Flag count: 2 — existing covered behavior (`createClaimWorktree`/
`worktree.mjs` is exercised by `test/runner/worktree.test.mjs` and is a
shared primitive several call sites depend on), weak proof around the area
(this exact module already burned once on an adjacent worktree-checkout
bug — see Canonical references in CONTEXT.md). No hard-gate flag applies
(no auth/authorization/data-loss/external-provider/removed-validation) —
git commits are never lost by this bug, only a worktree's on-disk files
go stale, so this stays `standard` rather than `high-risk`. Direct-entry:
this session reached `decompose` via `fgos-coding-exploring`'s own hand-off
(pick → coding-driving → exploring → here), never through
`fgos-routing`'s Orient step, so per this skill's Bootstrap direct-entry
fallback the lane above was derived fresh from `fgos-routing`'s own
Mode-gate table rather than carried over from an earlier hand-off.

No split: one guard primitive, one wiring point, one comment correction,
all in the same two files, all proven by the same test file. Proceeds as
itself.

## Approach

**Chosen path.** Add a pure decision function (mirrors the existing
`assertSafeMainCheckoutReset` shape in
`src/runner/main-checkout-reset-guard.mjs` — a boolean-in, throw-or-return
decision with no git access of its own, unit-testable without a real repo)
plus a git-shelling caller in `src/runner/worktree.mjs`, wired into
`createClaimWorktree`'s existing `reused: true` reattach branch
(`worktree.mjs:575-586`). Also corrects the stale inline comment at
`bin/fgos.mjs:2836-2845` (CONTEXT.md D2 — corrected during `fgos-
validating`'s repo-fit check from the item's own original `2798-2804`
citation; re-grep before editing).

**Why `createClaimWorktree`'s reattach path, not `fgos-coding-implement`'s
Orient step (CONTEXT.md's other named candidate).** Scout during this
planning pass (not available to `fgos-coding-exploring`, which correctly deferred
the choice) found the deciding evidence: `decompose.mjs`'s
`releaseClaimOnExecuting()` (`src/intake/plan.mjs:488-496`) releases
an item's claim back to `todo` on **every** `decompose → executing`
transition — both the split path (line 527, `already-decomposed`) and the
non-split pass-through path (line 583) call it unconditionally. So by the
time ANY coding item reaches `executing`, its claim has already been
released; the session must re-claim it before `fgos-coding-implement` can
run, and for a worktree-backed domain that re-claim always goes through
`createClaimWorktree`. Concretely for this bug's own repro: a root
item's claim releases the moment it decomposes into children (even while
still anchored/unworkable); children get merged into `fgw/<root>` one at a
time via separate `fgos approve` calls, each landing a `git branch -f`
that advances the root's branch ref without touching the root's own
worktree files (CONTEXT.md D1); once every child clears, driving the root
again re-claims it — `createClaimWorktree` finds the branch already
checked out at the original `.claude/worktrees/<root>-<hash>` path
(`reattachableCheckout`) and, today, "gets that same checkout back,
untouched" (the function's own docstring) — exactly the stale hand-off
into `fgos-coding-implement`'s Implement/Verify steps that the incident
describes. Guarding here means the check runs exactly once, right before
work starts, for every worktree-backed item, split or not — no second copy
of this logic needed at `fgos-coding-implement`'s own Orient step, matching
the sibling item's own lesson (`docs/history/merge-worktree-reclaim-
clobbers-kept-checkout/CONTEXT.md`: "a correct fix belongs at the shared
primitive, not one call site").

**Rejected alternative:** guard at the head of `fgos-coding-implement`
(CONTEXT.md's other named candidate). Rejected because it would be
redundant once the primitive-level guard exists (every route into that
skill already passes through the re-claim above first), and because a
skill-prose check is agent-followed, not deterministically enforced by
`npm test` the way a guard living inside `worktree.mjs` is.

**Algorithm — corrected during Implement (tsk-2cd), CONTEXT.md D3's intent
preserved, its literal `git rev-parse HEAD`/`isCheckoutDirty` mechanics
were not.** Empirically tested this session (real scratch repo,
reproducing the exact production mechanism: a normal checkout on branch
`fgw/x`, a second DETACHED checkout advances and force-moves the branch
via `git branch -f`, exactly like `withMergeEphemeralWorktree`):

- `git -C worktreePath rev-parse HEAD` is **not usable** as "what commit
  is this worktree's checkout actually at" — `HEAD` is a symbolic ref
  that resolves live through the shared branch ref, so it reports the
  MOVED tip immediately, same as the incident's own reported symptom
  (`git rev-parse HEAD` "looked current"). Confirmed: after the scratch
  repo's branch was force-moved, `rev-parse HEAD` in the untouched
  worktree returned the NEW commit, not the worktree's real last-synced
  one.
- `isCheckoutDirty` (worktree.mjs:168, `git status --porcelain` against
  live HEAD) is **not usable either** for the same reason — since the
  index still holds the OLD tree while HEAD now says the NEW commit,
  `git status` reports the diff between them as fake modified/added/
  deleted entries (confirmed: `M  f` for a file that was never actually
  edited), indistinguishable from real dirt without a different signal.
- The real "last commit this worktree's files were actually synced to"
  lives in the worktree's own PER-WORKTREE `HEAD` reflog (`.git/worktrees/
  <name>/logs/HEAD`, separate from the shared branch ref's own reflog) —
  a plain `git branch -f` from elsewhere never appends to it, since no
  operation touched THAT worktree's HEAD. Confirmed: `git -C worktreePath
  reflog show HEAD -n 1 --format=%H` returned the ORIGINAL commit,
  unaffected by the external `git branch -f`, and correctly updated to
  the new tip after this guard's own `git reset --hard` ran.
- Genuine uncommitted work needs TWO checks against that reflog-derived
  `lastSynced` commit, not one: `git diff --quiet <lastSynced>` for
  tracked-file changes (confirmed clean when nothing was actually edited,
  despite the fake HEAD-vs-index noise), plus a plain `git status
  --porcelain` scan for `??` (untracked) lines, since `git diff <commit>`
  never reports untracked files (confirmed: a genuinely new untracked
  file was invisible to `diff --quiet` but correctly caught as `??`).

```
resyncClaimWorktree(repoRoot, worktreePath, branch):
  branchTip = git rev-parse branch                                    # repoRoot
  lastSynced = git -C worktreePath reflog show HEAD -n 1 --format=%H
  if lastSynced is empty/unreadable: throw WorktreeError (fail closed —
    never assume a sync point that can't be read)
  if lastSynced == branchTip: return { resynced: false }               # nothing to do

  isAncestor = (git merge-base --is-ancestor lastSynced branchTip)     # exit 0/1, never throws on 1
  isDirty = (git -C worktreePath diff --quiet lastSynced -- ':!.fgos'  # tracked changes vs lastSynced
             exits nonzero)
         OR (git -C worktreePath status --porcelain -- ':!.fgos'       # untracked files, HEAD-agnostic
             has any '??' line)

  if isAncestor && !isDirty:
    git -C worktreePath reset --hard branchTip
    return { resynced: true, from: lastSynced, to: branchTip }

  throw WorktreeError(refuse — names worktreePath, lastSynced, branchTip,
    and which check failed (dirty tree / not an ancestor), same message
    shape isCheckoutDirty's sibling refusals already use in this file)
```

`isAncestor && !isDirty` is still the same boolean pair
`assertSafeMainCheckoutReset` already models as `{dirty, confirmed}` —
same shape, same "pure decision, unit-testable without a real repo" split
between decision and git-shelling caller; only the two booleans'
*derivation* changed, not the shape of the decision itself.

**Proof surface.** `impact-analysis: full` (GitNexus present, freshly
checked this session via `fgos tool query --capability impact-analysis
--status present`) — `fgos-coding-implement`'s own Step 2 will run
`impact({target: "createClaimWorktree", direction: "upstream"})` before
editing it, per `CLAUDE.md`'s MUST rule; not re-run here, this plan only
records the posture.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| New resync-decision logic (ancestor+clean → resync vs refuse, derived from the worktree's own HEAD reflog rather than live `rev-parse HEAD`) | medium — subtle git semantics; CONFIRMED empirically this session that the originally-planned `rev-parse HEAD`/`isCheckoutDirty`-against-HEAD design does not work (both resolve/compare against the live, already-moved ref) — the reflog-based `lastSynced` replacement was validated end-to-end in a real scratch repo before writing any code | Unit tests in `test/runner/worktree.test.mjs` covering: same-tip no-op (`lastSynced == branchTip`), ancestor+clean auto-resync, dirty-and-behind refuses, non-ancestor (diverged) refuses, dirty-but-NOT-behind still succeeds unchanged — simulating the real mechanism by advancing a branch via `git branch -f` from a second DETACHED checkout while the first stays behind, the same operation `withMergeEphemeralWorktree` performs in production |
| Wiring into `createClaimWorktree`'s `reused: true` branch | medium — this is a shared primitive (`pick`'s CLI case and any other reattach caller); found during `fgos-coding-validating`: an existing test (`test/runner/worktree.test.mjs:527`, "createClaimWorktree reattaches a DIRTY checkout with its uncommitted work intact") asserts a dirty reattach must still succeed — the new guard must never regress it | Traced: that test never moves `fgw/reattach-dirty`'s branch ref (no external merge happens in it), so `worktreeHead === branchTip` holds and the guard's own first check (no-op when the worktree's HEAD already equals the branch tip) returns before the dirty/ancestor check is ever reached — the guard is provably a no-op on that exact test. Add an explicit new test alongside it (not just rely on the trace): a THIRD checkout of the same branch, detached (same technique `withMergeEphemeralWorktree` uses in production, empirically confirmed this session — see below), commits and force-moves the branch ref forward while the claim worktree is left dirty and behind — asserts the guard refuses rather than silently resyncing over real uncommitted work. |
| `bin/fgos.mjs:2798-2804` comment correction | low — text only | Read-diff at review; no functional check needed |

## Files likely touched

- `src/runner/worktree.mjs` — add the resync-decision + git-shelling
  functions; call the resync from `createClaimWorktree`'s `reused: true`
  branch before returning the existing checkout.
- `bin/fgos.mjs` — correct the stale comment at lines 2836-2845 (CONTEXT.md
  D2); no behavior change in this file.
- `test/runner/worktree.test.mjs` — new tests for the resync guard:
  same-tip no-op, ancestor+clean auto-resync (branch force-moved forward
  by a separate detached checkout, same mechanism `withMergeEphemeralWorktree`
  uses — `git branch -f` after a detached `git worktree add --detach`,
  confirmed constructible this session, see Assumptions), dirty-and-behind
  refuses, diverged (non-ancestor) refuses, and dirty-but-NOT-behind
  (`worktreeHead === branchTip`) still succeeds unchanged — the exact
  shape of the existing `reattach-dirty` test at line 527, added as a new
  case rather than relying on the trace alone.

Order: guard logic + its own tests first (self-contained, no wiring
dependency), then wire into `createClaimWorktree`, then the comment fix
(independent, can land in the same commit or be reordered freely — no
ordering dependency exists between it and the other two). `fgos graph
--json`/`--what-if` were not run for cross-item ordering — `tsk-2cd` has no
`deps` and this plan does not split it into separate items, so there is
no multi-item ordering decision for graph output to inform here.

## Assumptions

- `git merge-base --is-ancestor` exits non-zero (not an error/exception —
  a plain exit 1) when the first commit is NOT an ancestor of the second,
  and exit 0 when it is. CONFIRMED empirically during `fgos-coding-validating`
  (real git binary, this machine): built a 3-commit scratch repo (linear
  c1->c2, and a diverged c3 off c1), ran `git merge-base --is-ancestor c1
  c2` (exit 0) and `git merge-base --is-ancestor c3 c2` (exit 1, clean,
  no thrown error) — matches the algorithm's assumption exactly.
- Two checkouts of the same branch can coexist as long as one is detached
  (`git worktree add --detach <path> <commit>`), with the branch ref then
  force-moved (`git branch -f <branch> <newCommit>`) from the repo root
  without touching the OTHER (non-detached) checkout's files — this is the
  exact mechanism `withMergeEphemeralWorktree` already uses in production
  (`worktree.mjs:610-658`) and this bug's own D1 root cause; the new tests
  reproduce it deliberately to exercise the guard, not as a novel claim.
- A worktree's own per-worktree `HEAD` reflog (`git -C worktreePath
  reflog show HEAD -n 1 --format=%H`) reports the last commit a REAL
  operation run inside that specific worktree actually recorded, immune
  to an external `git branch -f` on the branch it's checked out on — this
  is the corrected replacement for the originally-planned `rev-parse
  HEAD` (which resolves the shared ref live and would always show the
  moved tip, defeating the guard entirely). CONFIRMED empirically this
  session in the same scratch repo used for the ancestor-exit-code check
  above: reflog stayed at the original commit after an external
  `branch -f`, then correctly advanced after this guard's own `reset
  --hard`. See the Approach section's corrected Algorithm for the full
  trace.
- The item's own verify command (`npm test`, set below) is sufficient
  proof for both the guard and the comment fix — the comment fix itself
  has no automated check, covered instead by review reading the diff.

## Verify

```
npm test
```

Full suite — `createClaimWorktree` is a shared primitive with existing
coverage elsewhere in the suite beyond just `worktree.test.mjs`; per this
repo's own DoD (`AGENTS.md` L5 §5) this is the same bar every state/runner
change in this repo is held to.
