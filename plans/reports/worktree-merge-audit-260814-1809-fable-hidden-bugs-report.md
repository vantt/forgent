# Worktree/Merge Lifecycle Audit — Hidden Bugs (fable review)

**Parent task:** tsk-25r | **Date:** 2026-08-14 | **HEAD at review:** 2cc12348

## Method

1. `haiku`-model agent scanned all fgOS work-items (`fgos list --json --all`), source
   (`src/runner/`, `src/state/`, `bin/fgos.mjs`), skills, `AGENTS.md`/`CLAUDE.md`, and
   `docs/history/`+`docs/decisions/` for everything already touching git-worktree
   claim/isolation and merge handling. Found ~85 already-tracked work items and 80+
   incident/decision docs (full inventory:
   `/tmp/claude-1000/-home-vantt-projects-forgentX/199f1963-62ac-45b4-807a-18c4f3173924/scratchpad/worktree-merge-scan.md`,
   not committed — scratch only).
2. `fable`-model agent read the core mechanics in full (`worktree.mjs`, `merge.mjs`,
   `cleanup-harness.mjs`, `dep-graph.mjs`, `graph-metrics.mjs`, `frontier.mjs`,
   `main-checkout-lock.mjs`, `claim-port.mjs`, `claim-liveness.mjs`, `cleanup-pool.mjs`,
   and the relevant `bin/fgos.mjs` verb cases) looking for NEW hidden issues not
   already in the scan's inventory, cross-checking every candidate against it before
   reporting.
3. I (orchestrator) spot-verified findings 1, 2, and 6 directly against current source
   (quoted lines below match `git show HEAD:<file>` at the time of review) before
   turning any of them into work items — the rest carry the same evidence-with-line-
   numbers standard but were not independently re-read line-by-line by me.

Each finding below became a child work item under **tsk-25r** (`fgos submit --parent
tsk-25r`), kind `bug`. None have been fixed yet — this report is the "what to change"
record; the child items are where implementation gets tracked.

---

## Finding 1 — tsk-18k (severity: high)
**Merge-target-slot lock's string-identity release/renew can delete a sibling session's live lock after a TTL reclaim.**

`src/runner/merge.mjs:776-810`, `src/runner/main-checkout-lock.mjs:475-504,539-565`

`withMergeTargetSlot` acquires the per-target slot under a **string** identity shared
across processes (`resolveWriterIdentity(fgosDir).id`), with `allowSelfRecognition:
false` — but that flag only affects the *acquire* path (tsk-1wr). `release()` →
`releaseMainCheckoutLockIfOwn` and the heartbeat's `renewMainCheckoutLockIfOwn` both
match on `record.pid === identity` — plain string equality, with no way to tell which
of two fanout siblings (which legitimately can share the same session-id string)
actually wrote the record.

**Failure scenario:** sibling A holds the slot; its heartbeat starves past TTL because
the hold spans a synchronous `npm ci` inside `provisionDependencies` (run twice per
leaf approve — catchup worktree + merge worktree) that can exceed 180s on a cold
cache/slow registry. Sibling B sees the record as stale, reclaims, writes its own
record with the **same string identity**. A finishes and releases — which matches B's
live record and deletes it. A third session C can now acquire while B is still
mid-merge: the slot no longer provides mutual exclusion, and every resulting collision
shows up only as a confusing "tip changed since this merge started" retry, never as
the real cause.

**Suggested direction (fable's raw output):** key the slot on `process.pid` instead of
the shared session string, or stamp a per-acquisition nonce into the record and match
release/renew on that instead of identity alone.

**DECIDED DIRECTION (reconciled against prior locked decisions, post-review discussion
2026-08-14):** nonce, not `process.pid`. Two prior decisions already cover this exact
call site and neither is reopened by this finding:

- **tsk-1wr** (`docs/history/tsk-1wr/plan.md`) locked "targeted fix, not a wider
  identity-model change" for this exact slot and explicitly **rejected** switching it
  to per-process identity: *"the item's own text already flagged that
  `isPidAlive`/stale-reclaim assume a numeric identity, a wider blast radius for a
  narrower gain."* That reasoning has nothing to do with this finding's failure mode
  — nothing here reopens it. (Correction to the paragraph above: tsk-70l's own fix for
  the *different* `:886` call site was not a bare `process.pid` swap either — it used
  a pid-liveness-checkable identity plus an explicit env-var reentrancy channel,
  specifically to preserve a legitimate same-session retry case that `:778` doesn't
  have. `:778` was marked out of scope by tsk-70l, not fixed by it.)
- **tsk-70l** (`docs/history/main-checkout-lock-fanout-self-recognition-gap/CONTEXT.md`)
  separately reviewed `:778` and marked it "out of scope — needs no change", reasoning
  the slot is "always released within the same call that acquired it." This finding's
  TTL-starvation-during-`npm ci` scenario is new evidence that this assumption fails
  in a concrete, reachable case — that's what justifies reopening scope for `:778`
  specifically, without touching tsk-1wr's identity-model decision.

Fix: stamp a per-acquisition nonce into the lock record; match release/renew on the
nonce instead of identity. Implement together with **tsk-1mn** (shrink the lock hold
across `npm ci`) — two different layers, neither substitutes for the other: the nonce
closes the correctness gap outright, shrinking the hold time reduces how often the
TTL-starvation window is even reachable.

**Round 2 (2026-08-14, later same day) — "should we just switch to pid instead, long
term?"** Orchestrator hypothesis: since `main-checkout-lock.mjs`'s numeric/string
dual-mode branch (`:268-283`) predates tsk-1wr's 2026-08-12 rejection by three weeks
(commit `b31b5637`, 2026-07-23) and `fgos unlock` (`bin/fgos.mjs:4887-4890`) already
handles both types cleanly, tsk-1wr's stated "wider blast radius" cost looked stale —
worth reconsidering pid as the root fix. A second `fable` pass independently
re-verified this and pushed back on two points:

- The chronology/dual-mode claim holds (re-verified against code + `git log -L`), and
  no test/skill/doctor consumer pins string identity for this slot. tsk-1wr's stated
  rationale genuinely is stale.
- But the "pid fixes the root cause" hypothesis is **wrong**: `held = pidLive &&
  withinTtl` (`main-checkout-lock.mjs:270-272`) still reclaims a live-but-TTL-expired
  numeric holder exactly like a string one. Pid identity only closes the same
  release/renew collision a nonce closes — equally, not better. The actual
  frequency-reducer is tsk-1mn, unaffected by which identity model tsk-18k picks.
- The ABA-risk-transfer argument (borrowing tsk-70l's accepted PID-reuse risk) also
  overstates: tsk-70l accepted a false-*exclusion* risk (safe, extra wait). tsk-18k's
  actual failure is false-*release* → two live holders — a different, worse shape.
  Under that shape, `withMergeEphemeralWorktree`'s CAS guard (`worktree.mjs:1007-1041`,
  re-verified directly: reads `liveTip`, checks it against `startCommit`, THEN runs
  `git branch -f` — a check-then-act with no atomicity between the two) is not
  provably safe: two live holders can both pass the tip check before either
  force-moves, and the second force-move silently discards the first's merge. The
  "fails loudly, no silent loss" property this finding's own failure-scenario leaned
  on only holds when the lock actually serializes callers — which is exactly what
  tsk-18k's bug breaks.

**Verdict: no separate item filed.** tsk-18k's own planning stage owns the nonce-vs-pid
implementation choice (functionally equivalent for the filed bug; pid additionally
lets `allowSelfRecognition: false` be dropped as a simplification). Folded into
tsk-18k's description as a close-out condition instead: verify the `worktree.mjs:
1007-1041` CAS guard (already shipped via **tsk-46a**, now `cleanup`/merged — not
reopened by this review, only cross-referenced) still holds once two holders can be
momentarily live under this bug; if not, harden via atomic `git update-ref <ref> <new>
<old>` instead of read-then-force-move.

---

## Finding 2 — tsk-1mn (severity: medium)
**`claimWork` holds the main-checkout lock across `npm ci` with no heartbeat.**

`src/runner/claim-port.mjs:105,356-364`; `src/runner/worktree.mjs:97-105`

`claimWork` acquires `main-checkout.lock` (`ttlMs: 180s`) and only releases it in its
`finally`. In between, the `isolate` path runs `createClaimWorktree` →
`createWorktree` → `finishWorktreeSetup` → `provisionDependencies`, a **synchronous**
`npm ci`/`npm install`. Unlike `mergeRunnerItem` (which got a heartbeat once its hold
was measured to exceed the 180s TTL, tsk-4l8), `claimWork` has none — and being fully
synchronous, a timer-based heartbeat couldn't fire during it anyway.

**Failure scenario:** a `pick`/`take` on a cold npm cache exceeds 180s. A concurrent
writer (another `take`/`pick`, or the pre-commit hook) evaluates the still-live claim
as stale and proceeds — the exact concurrent-writer race (STR65) this lock exists to
prevent, and it's silent: the first claim's later `release()` correctly no-ops as
`not-owner`, so nothing ever surfaces the breach.

**Suggested direction:** release (or renew) the lock before the provisioning step —
the durable state mutation (`moveWork`) is already committed by then and worktree
provisioning doesn't need the checkout lock — or run provisioning after release.

---

## Finding 3 — tsk-2iz (severity: medium)
**Decision-index auto-resolve can mint duplicate decision IDs, and a throw mid-resolve skips the merge abort.**

`src/runner/merge.mjs:584-595` (`nextFreeDecisionId`), `:682-709`
(`autoResolveDecisionIndexCollision`), `:1179-1204` (call site)

`nextFreeDecisionId(repoRoot, 'HEAD')` computes the next free id from **HEAD's tree
only** — the merging branch's own new, non-colliding decision files above HEAD's max
are never consulted. Separately, `autoResolveDecisionIndexCollision` runs inside the
merge attempt's `catch`; on real propagation (its documented contract) the
`abortMergeIfPossible` cleanup is skipped, leaving `MERGE_HEAD` and partial renames in
the shared main checkout.

**Failure scenario:** branch forked when HEAD's max decision was 0040; branch author
wrote 0041 and 0042. Main independently landed its own 0041 → collision on 0041.
`nextFreeDecisionId(HEAD)` returns 0042 and renames the branch's 0041 to
`0042-<slug>.md` — colliding with the branch's own already-clean `0042-<other-slug>.md`.
Two files/index rows now claim 0042, committed and verified green (no uniqueness
check). Separately, any real fs/git failure inside the resolve step leaves the shared
main checkout mid-merge; every later `approve` then parks as the misleading
`merge-blocked-other-item` until someone runs `git merge --abort` by hand.

**Suggested direction:** compute the next id as `max(HEAD ∪ branch decision files)`;
wrap the auto-resolve attempt so any throw still falls through to the same
abort-and-report path as every other exit.

---

## Finding 4 — tsk-ikd (severity: medium)
**`return`'s main-source path has no main-worktree guard — `approve`/`sync-root`/`promote-to-component` all refuse, `return` doesn't.**

`bin/fgos.mjs:2913` (case `return`), `:3021-3072`

`return`'s main-source branch (no `branchHeadAtTake`) reads `currentHead(process.cwd())`,
runs the clean-tree check, verify, and records `headAtReturn` against whatever `cwd`
happens to be — with no `isMainWorktree` check anywhere in the case, unlike `approve`
(`:3307-3333`), `sync-root` (`:4016-4021`), and `promote-to-component`
(`:4231-4236`), which all refuse from a linked worktree for exactly this hazard class
(P44: verifying a stale/divergent tree while claiming it verified on main).

**Failure scenario:** an item claimed via `take` (main-source) gets `return`ed from
inside a leftover `fgw/*` linked worktree instead of main. The worktree's HEAD is past
`headAtTake` → progress gate passes; verify runs on the worktree's tree → passes;
`headAtReturn` records a sha that was never on main. The item reaches
`awaiting-approval`, `approve`'s verify-only mode re-verifies on main and finds it
green, and the item goes `delivered` with its real content never on main. It only
surfaces days later when cleanup's ancestry check fails — misdiagnosed as a
force-push/history-rewrite loss.

**Suggested direction:** apply the same `isMainWorktree(repoRoot)` refusal to
`return`'s main-source branch (the branch-source `return` path legitimately runs from
anywhere and needs no guard).

---

## Finding 5 — tsk-4bh (severity: medium)
**`checkMergeStillResolves` never skips wontfix/canceled children — permanent cleanup block on a decomposed root.**

`src/state/cleanup-harness.mjs:141-183`

The decomposed-parent path collects children via `item.parent === id` and requires
**every** child's recorded sha to be an ancestor of the target ref — no status filter.
Elsewhere the codebase's own settled rule (`wontfix-terminal-status-filter-consistency`
D1, applied in `claim-port.mjs:167-175` and `frontier.mjs`'s `isResolvedStatus`) is
that a canceled/wontfix item never had content to merge and must not be waited on.

**Failure scenario:** a root decomposes into 3 children; one `return`s (recording a
branch tip) then gets rejected to `wontfix` — its branch never merges anywhere. The
other two merge; the root merges to main and reaches `cleanup`.
`assessCleanupReadiness` recurses into the wontfixed child, whose recorded sha isn't
an ancestor of main → `ok: false` with the misleading detail "the merge may have been
force-pushed away or history rewritten" → the root parks `cleanup -> blocked`
**permanently**, re-checked and re-failing forever.

**Suggested direction:** skip children whose status is canceled/wontfix (reuse
`isResolvedStatus`'s canceled branch) in `checkChildrenResolve`.

---

## Finding 6 — tsk-2jn (severity: medium-low)
**`footprintOverlapAmong` compares raw declared paths without `normalizePath` — differently-spelled footprints dodge parallel-dispatch conflict detection.**

`src/state/graph-metrics.mjs:598-612`; contrast `src/runner/merge.mjs:200-206` and
`src/runner/frozen-judge.mjs:57-61`

`footprintOverlapAmong` does raw `Set`/`filter` membership on the hand-declared
`footprint` field. Every other consumer of that same field normalizes first —
`buildOwnFileSet` explicitly maps through `normalizePath` "so a path reported by git
status matches regardless of a stray `./` or `\`", and `frozenJudgeHits` does the
same on both sides.

**Failure scenario:** item A declares `./src/runner/merge.mjs`, item B declares
`src/runner/merge.mjs` (hand-filled at different times/by different sessions — the
exact weak-signal case the code's own comments acknowledge). `fgos conflicts` reports
zero pairs and `computeSchedule` packs A and B into the same parallel-dispatch wave;
the fanout runs both in worktrees editing the same file, producing exactly the merge
conflict the footprint mechanism exists to prevent. Distinct from tsk-11v (deps
edges) and tsk-4so (step scoping).

**Suggested direction:** normalize both footprints through `normalizePath` inside
`footprintOverlapAmong` — a single choke-point all callers inherit.

---

## Finding 7 — tsk-4yv (severity: low)
**A `finishWorktreeSetup` failure leaks a registered worktree; detached merge worktrees are never reclaimed by anything.**

`src/runner/worktree.mjs:472-497,977-1005,1007-1046`

In both `createWorktree` and `createDetachedMergeWorktree`, `finishWorktreeSetup`
(which can throw from `rmSync` or from `provisionDependencies`'s `npm ci`) runs after
the try/catch that cleans up the mkdtemp dir — nothing removes the just-registered
worktree on that failure. `withMergeEphemeralWorktree` calls
`createDetachedMergeWorktree` **before** its own try/finally, so its `removeWorktree`
never runs for this failure either.

**Failure scenario:** an npm registry flake during `approve` → the detached checkout
(`git worktree add --detach` already succeeded) stays registered and on disk
indefinitely. `reclaimOrphanedCheckout`/`findCheckoutPath` are branch-keyed and skip
`detached` stanzas, so nothing ever reclaims it. Repeated flakes accumulate full
checkouts under tmp. (The branch-attached `createWorktree` variant mostly self-heals
via the relocate/reattach paths — this is specifically the detached-merge-worktree
case.)

**Suggested direction:** wrap `finishWorktreeSetup` at both sites so its failure
force-removes the just-created worktree before rethrowing.

---

## Finding 8 — tsk-386 (severity: low)
**`baseRef: 'main'` hardcodes survive in `worktree.mjs` and `approve`'s root-branch fallback despite the trunk-detection work.**

`src/runner/worktree.mjs:376` (`createBranchRef` default), `:980`
(`createDetachedMergeWorktree` fallback); `bin/fgos.mjs:3546` (approve leaf-path
fallback)

`merge.mjs`'s own trunk hardcode was already removed via `detectTrunk` (done item
`bo-hardcode-ten-trunk-main-trong-merge-e-5i0`), but that fix was scoped to the merge
engine only — these branch-creation fallbacks still default to the literal `'main'`.

**Failure scenario:** fgOS is a platform meant to be installed into other repos (per
`docs/distribution-vision.md`); in a host project whose trunk is `master`, the first
session-driven root merge hits `createDetachedMergeWorktree`'s fallback →
`git branch fgw/<id> main` fails → `WorktreeError` crashes the approve. Latent here
(this repo's trunk is `main`), but real for the distribution story. Possibly partial
overlap with the done trunk-hardcode item — flagged separately because that item's
title scopes itself to `src/runner/merge`.

**Suggested direction:** default these fallbacks through `detectTrunk(repoRoot)`
instead of the literal `'main'`.

---

## Finding 9 — tsk-f8f (severity: low)
**`lastActivityAt` mis-parses git-quoted paths — activity on space/special-char filenames is invisible to the stale-claim reclaim check.**

`src/runner/claim-liveness.mjs:60-74`

The porcelain scan takes `trimmed.split(/\s+/).pop()` as the file path. `git status
--porcelain` quotes paths containing spaces/special characters (`?? "my file.txt"`),
so `pop()` yields a fragment like `file.txt"`, `statSync` fails, and the entry is
silently skipped rather than aborting the whole signal — that file's mtime never
contributes to the activity signal.

**Failure scenario:** a session's only recent activity is edits to untracked/dirty
files with spaces in their names (draft docs, exported reports), and its last commit
predates the reclaim threshold. `lastActivityAt` reads only the stale commit time →
`isReclaimEligible` returns true → another `pick` silently releases the live
session's claim and can reattach a second session into the same still-in-use
checkout. This fails in the destructive direction (reclaim despite real activity),
the opposite of the guard's documented fail-closed stance.

**Suggested direction:** unquote porcelain paths (or use `git status --porcelain -z`)
before `statSync`.

---

## Already tracked — not reported as new findings

- footprintOverlapAmong ignoring **deps edges** (distinct from Finding 6's
  normalization gap) → tsk-11v.
- branchContentMismatch false positive after unrelated later merges → tsk-107.
- sync-root missing clean-tree gate → tsk-66t (fix already visible in code).
- ephemeral-merge `branch -f` overwrite race → tsk-46a (CAS guard already present).
- leaf approved after its root resolved (incl. TOCTOU variant) →
  leaf-merge-into-resolved-root / tsk-4s0.
- reattached claim worktree missing newly-declared deps after resync → documented
  scope exclusion (tsk-2vd D2).
- pre-commit hook lock lingering / TTL split → tsk-1d9.
- merge lock scope full-repo vs target-ref → tsk-xyr (open).
- worktree `.fgos/` staleness / strip discipline → tsk-1an-*, tsk-1d7.
- no-op-merge failure modes → tsk-15k / tsk-2j9 / tsk-rrw.

## Work items created

| id | title | severity |
|---|---|---|
| tsk-25r (parent) | Audit and fix hidden bugs in fgOS worktree claim/merge/cleanup lifecycle found by fable code review | — |
| tsk-18k | Merge-target-slot lock string-identity release/renew deletes sibling's live lock | high |
| tsk-1mn | claimWork holds main-checkout lock across npm ci with no heartbeat | medium |
| tsk-2iz | Decision-index auto-resolve can mint duplicate IDs / skip abort on throw | medium |
| tsk-ikd | return's main-source path has no main-worktree guard | medium |
| tsk-4bh | checkMergeStillResolves never skips wontfix/canceled children | medium |
| tsk-2jn | footprintOverlapAmong skips normalizePath | medium-low |
| tsk-4yv | finishWorktreeSetup failure leaks registered/detached worktrees | low |
| tsk-386 | baseRef 'main' hardcodes outside merge.mjs | low |
| tsk-f8f | lastActivityAt mis-parses quoted porcelain paths | low |

None of the 9 have been implemented yet — each is `todo`/`discovery`, ready to be
picked up individually (`/fgOS:pick tsk-18k`, etc.) or driven as a batch under the
parent.

## Unresolved questions

1. Findings 3 and 5 both touch the decomposed-parent merge/cleanup path — worth
   confirming whether a fix to one changes the reproduction shape of the other before
   implementing either.
2. Finding 8's overlap with the already-done trunk-hardcode item wasn't fully
   resolved — worth a quick check of that item's original scope before implementing,
   in case it's meant to be reopened instead of duplicated.
3. Findings 3, 4, 7, and 8 were not independently re-verified line-by-line by the
   orchestrating session (only findings 1, 2, 6 were); each carries the review
   agent's quoted evidence but a fresh read before implementation is still warranted.
