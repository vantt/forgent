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
this session reached `decompose` via `fgos-exploring`'s own hand-off
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
`bin/fgos.mjs:2798-2804` (CONTEXT.md D2).

**Why `createClaimWorktree`'s reattach path, not `fgos-code-implement`'s
Orient step (CONTEXT.md's other named candidate).** Scout during this
planning pass (not available to `fgos-exploring`, which correctly deferred
the choice) found the deciding evidence: `decompose.mjs`'s
`releaseClaimOnExecuting()` (`src/intake/decompose.mjs:488-496`) releases
an item's claim back to `todo` on **every** `decompose → executing`
transition — both the split path (line 527, `already-decomposed`) and the
non-split pass-through path (line 583) call it unconditionally. So by the
time ANY coding item reaches `executing`, its claim has already been
released; the session must re-claim it before `fgos-code-implement` can
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
into `fgos-code-implement`'s Implement/Verify steps that the incident
describes. Guarding here means the check runs exactly once, right before
work starts, for every worktree-backed item, split or not — no second copy
of this logic needed at `fgos-code-implement`'s own Orient step, matching
the sibling item's own lesson (`docs/history/merge-worktree-reclaim-
clobbers-kept-checkout/CONTEXT.md`: "a correct fix belongs at the shared
primitive, not one call site").

**Rejected alternative:** guard at the head of `fgos-code-implement`
(CONTEXT.md's other named candidate). Rejected because it would be
redundant once the primitive-level guard exists (every route into that
skill already passes through the re-claim above first), and because a
skill-prose check is agent-followed, not deterministically enforced by
`npm test` the way a guard living inside `worktree.mjs` is.

**Algorithm** (CONTEXT.md D3, unchanged from what was already locked —
this is where it lands in code):

```
resyncClaimWorktree(repoRoot, worktreePath, branch):
  branchTip = git rev-parse branch          # in repoRoot
  worktreeHead = git -C worktreePath rev-parse HEAD
  if worktreeHead == branchTip: return { resynced: false }   # nothing to do

  isAncestor = git merge-base --is-ancestor worktreeHead branchTip   # exit 0/1, never throws on 1
  isClean = !isCheckoutDirty(repoRoot, worktreePath)   # already-exported helper, worktree.mjs:168

  if isAncestor && isClean:
    git -C worktreePath reset --hard branchTip
    return { resynced: true, from: worktreeHead, to: branchTip }

  throw WorktreeError(refuse — names worktreePath, worktreeHead, branchTip,
    and which check failed (dirty tree / not an ancestor), same message
    shape isCheckoutDirty's sibling refusals already use in this file)
```

`isAncestor && isClean` is the boolean pair `assertSafeMainCheckoutReset`
already models as `{dirty, confirmed}` — same shape, different two
booleans, same "pure decision, unit-testable without a real repo" split
between decision and git-shelling caller.

**Proof surface.** `impact-analysis: full` (GitNexus present, freshly
checked this session via `fgos tool query --capability impact-analysis
--status present`) — `fgos-code-implement`'s own Step 2 will run
`impact({target: "createClaimWorktree", direction: "upstream"})` before
editing it, per `CLAUDE.md`'s MUST rule; not re-run here, this plan only
records the posture.

## Risk map

| Component | Risk | Proof point (for `fgos-validating`) |
|---|---|---|
| New resync-decision logic (ancestor+clean → resync vs refuse) | medium — subtle git semantics, easy to get the ancestor direction backwards | Unit tests in `test/runner/worktree.test.mjs` covering: same-tip no-op, ancestor+clean auto-resync, dirty tree refuses, non-ancestor (diverged) refuses — simulating the real mechanism by advancing a branch via `git branch -f` from a second checkout while the first stays behind, the same operation `withMergeEphemeralWorktree` performs in production |
| Wiring into `createClaimWorktree`'s `reused: true` branch | medium — this is a shared primitive (`pick`'s CLI case and any other reattach caller) | Full `npm test` green — the existing reattach/tsk-65n test coverage in `test/runner/worktree.test.mjs` must keep passing unchanged for the ordinary (non-drifted) reattach case |
| `bin/fgos.mjs:2798-2804` comment correction | low — text only | Read-diff at review; no functional check needed |

## Files likely touched

- `src/runner/worktree.mjs` — add the resync-decision + git-shelling
  functions; call the resync from `createClaimWorktree`'s `reused: true`
  branch before returning the existing checkout.
- `bin/fgos.mjs` — correct the stale comment at lines 2798-2804 (CONTEXT.md
  D2); no behavior change in this file.
- `test/runner/worktree.test.mjs` — new tests for the resync guard
  (same-tip/ancestor-clean/dirty/diverged), plus a regression test that
  `createClaimWorktree`'s ordinary reattach path is unaffected.

Order: guard logic + its own tests first (self-contained, no wiring
dependency), then wire into `createClaimWorktree`, then the comment fix
(independent, can land in the same commit or be reordered freely — no
ordering dependency exists between it and the other two). `fgos graph
--json`/`--what-if` were not run for cross-item ordering — `tsk-2cd` has no
`deps` and this plan does not split it into separate items, so there is
no multi-item ordering decision for graph output to inform here.

## Assumptions

- `git merge-base --is-ancestor` exits non-zero (not an error) when the
  first commit is NOT an ancestor of the second — this is documented git
  behavior, not re-verified against this repo's own git binary here;
  `fgos-validating` should confirm it empirically as part of proving the
  unit tests above (a `spawnSync`/`execFileSync` call with a non-ancestor
  pair, checked for a clean non-throwing non-zero exit) since a wrong
  assumption here would make the guard either always refuse or never
  refuse.
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
