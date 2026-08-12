# Merge bug root-cause clusters (260812)

Read-only survey of every open/wontfix/decompose merge-titled item the team lead handed off, plus the done set, clustered by *mechanism*, not symptom. 7 themes. Item status legend: `todo/doing` = not fixed yet; `cleanup`/`retrospective` = fix already landed on main, item just hasn't finished fgOS's own closeout bookkeeping; `wontfix` = dropped; `done` = closed and stable.

## Theme 1 — "already-merged" no-op mishandled per call site (whack-a-mole)

**Mechanism**: `git merge --no-commit --no-ff` on a branch already an ancestor of its target is a genuine no-op — no `MERGE_HEAD`, nothing staged. Every different call site that runs this pattern handles the no-op differently, and each one had to be discovered and patched independently instead of the check being centralized once.

- `tsk-2j9` (done) — `mergeRunnerItem` (`src/runner/merge.mjs`, ~line 335) unconditionally calls `git merge --abort` after a failed post-merge verify; on a no-op there's no `MERGE_HEAD` to abort, crash instead of the defined `verify-fail` outcome.
- `tsk-3yl` (done, the actual fix) — added `isAlreadyMerged()` guard (`merge.mjs:683`, via `git merge-base --is-ancestor`) before the merge, short-circuits to outcome `merged`. This is the root fix, landed for `mergeRunnerItem` only.
- `tsk-k7i` (done) — same bug, same shape, on `fgos catchup`'s own merge call site (opposite direction: target-into-item). `tsk-3yl`'s guard was never mirrored there — sibling call site missed on the first pass.
- `tsk-rrw` (wontfix) — explicitly named by its own author "sibling to tsk-2j9 (abort-crash) and tsk-480 (moveWork-throws-after-success)": third distinct failure point (the `git commit --no-edit` step itself, not the abort) for the same underlying already-merged condition. Permanent, no retry escape. Dropped rather than fixed generally.
- `tsk-2ib` (wontfix) — earlier occurrence of the same `tsk-2j9` shape (crash on re-run of an already-merged branch, abort-recovery also fails), worked around by hand-moving the item to `done` instead of waiting for the general fix.

**Count**: 5 items on one mechanism, 1 real fix that didn't cover its own sibling call site. **Class**: code bug, but the recurring pattern is a design gap — no single "is this merge a no-op" utility shared across `approve`/`catchup`/(future `sync-root`) call sites.

## Theme 2 — `checkMergeStillResolves` false-positive family (cleanup-stage merge verification)

**Mechanism**: `checkMergeStillResolves` (`src/state/cleanup-harness.mjs`) proves a returned item's content really landed by checking ancestry of a recorded sha against a target ref. The function has accumulated **5 separately-discovered failure shapes**, documented candidly in `docs/explanation/why-checkmergestillresolves-can-false-positive-after-a-root-branch-prune.md`:

1. Revert-after-merge (function's own original docstring caveat, still open/accepted).
2. `tsk-577` (in scope, `cleanup`) — root branch pruned by `loop.mjs:391-393`'s zero-ahead orphan sweep while a leaf descendant still needed that ref; 14 items false-blocked in one sweep.
3. `tsk-3ft` (referenced, not in the handed-off set) — branch genuinely reset/diverged after return; true positive, but needed a diagnostic-vs-auto-recover framing.
4. `tsk-psb` (in scope, `cleanup`) — decomposed item's own `branchHeadAtReturn` is structurally never an ancestor of anything (its children merged forward, not it); check was reading the wrong sha entirely, deterministically, every decompose.
5. `tsk-5j0` (in scope, `retrospective`) — `tsk-psb`'s own fix replaced the parent-sha check with children-recursion for **any** item with children, but for a decompose **root** specifically that replacement is total: the root's own branch (`fgw/<rootId>`) never gets checked against `main` at all. Confirmed live on `tsk-4b2`: never merged into main, two failed approves, yet `cleanup` reported only a TTL nag.

**Count**: 5 documented cases, 4 with landed fixes, the newest (`tsk-5j0`) just fixed and pending retro-synthesis. This is the single clearest "we fixed this and it came back" signal in the whole set — every fix narrowed the function's blind spot instead of closing it, because each fix targeted the *symptom shape it was shown*, not the general claim "prove this ref's content is really on that ref." **Class**: design gap — the function's contract (ancestry-of-one-sha) doesn't match the actual topology space (leaf/root/decomposed-root/pruned/reset) it's asked to verify.

## Theme 3 — nested leaf→root→main branch-tree drift & dead-root routing (largest cluster)

**Mechanism**: fgOS's branch topology is leaf merges into `fgw/<root>`, root separately merges into `main` later. Nothing continuously verifies the root actually re-synced after each leaf lands, and nothing checks whether a root is even still "alive" (not yet resolved/dead) before routing a leaf into it. `tsk-3bn`'s own description names this outright: "KHÔNG PHẢI bug thuần túy ... đây là GAP HỆ THỐNG."

- `tsk-3bn` (done, milestone) — root item; spawned `tsk-5m7` (`driftStatus` read-only ahead/behind check + `fgos doctor` wiring, done), `tsk-62y` (wire drift check into root/milestone close-out, done), `tsk-2u0` (mergeReadiness v2: clustering/blockedOnSync/mergeTier/mergeAfter, done).
- `tsk-40y` (todo) — even with `tsk-2u0`'s `blockedOnSync` bucket landed, `fgos approve`'s `case 'approve'` block (`bin/fgos.mjs`) has **zero references** to `needsSync`/`driftStatus`/`mergeReadiness`/`blockedOnSync` — the manual door (`approve`) and the automated door (`merge list`/`merge next`) disagree about mergeability, causing a real deadlock (`tsk-2sr` blocked on `fgw/tsk-3cx` needing sync, sync itself blocked by content only the leaf fixed).
- `tsk-173` (cleanup) — same disagreement symptom: a root awaiting-approval with `needsSync:true` isn't surfaced by `merge-next`, requiring manual resolution.
- `tsk-66t` (cleanup) — `sync-root` merges straight into the shared main checkout with **no** clean-tree gate (`isMainTreeClean` guards `approve`'s branch at `bin/fgos.mjs:2930` but has zero hits in the `sync-root` case starting at `:3256`) — an unattended session's staged changes can get silently swept into a sync-root commit.
- `tsk-4qu` (cleanup) + `tsk-4s0` (cleanup, the prevention half, split by design) — a leaf approved after its root already resolved (delivered/retrospective/cleanup/done) still routes into `fgw/<root>`, a branch nobody will ever merge onward; `driftStatus`'s `needsSync: aheadOfTarget > 0 && !isResolvedStatus(rootItem)` (`drift-status.mjs:93`) deliberately excludes resolved roots from `blockedOnSync`, so the orphaned commits are invisible to every bucket. Happened twice for real (`tsk-4ns`→`fgw/tsk-5wz`, `tsk-53n`→`fgw/tsk-1o7`), both escaped only via a manual `fgos sync-root` call.
- `tsk-2cd` (cleanup) — **same root line as Theme 4's `tsk-46a`**: `withMergeEphemeralWorktree`'s `git branch -f <branch> <endCommit>` (`src/runner/worktree.mjs:652`) advances `fgw/<rootId>` in the shared `.git` dir without touching any other worktree already checked out on that branch — a root's own long-lived claim worktree silently runs `verify` against stale files after any child merges into it.
- `tsk-2x9k` (done) — landed `mergeTree()` (parent-grouped, recursively sorted) partially answering `tsk-3cs`'s ask.
- `tsk-3cs` (cleanup, but description still poses an open question) — herdr-plugin wants bottleneck-first ordering (item unblocking the most other items merges first) layered on top of `mergeTree`; unresolved whether `graph-harness`'s sort is sufficient yet.
- `tsk-3hk` (wontfix) — "Merge Harness v2," broader topology-aware clustering layer, explicitly deferred/superseded by the narrower items above.
- `tsk-4dy` (todo, audit) — checking whether a specific retrospective-synthesis commit accidentally absorbed a stray self-sync merge, same shape as a previously-fixed corruption bug (`tsk-2oy`'s root cause) — not yet confirmed benign or real loss.

**Count**: 11 items (3 done as a batch, 6 landed-but-cleanup, 1 wontfix/deferred, 1 still-open audit, 1 still-open deadlock). **Class**: design gap — the topology itself has no drift invariant; every item here re-derives one more corner of "when is a root really synced/alive" from scratch.

## Theme 4 — shared main checkout: sessions clobber each other

**Mechanism**: the main checkout is one shared working tree; not every mutation against it is covered by `.fgos/main-checkout.lock`, and the lock itself has gaps.

- `tsk-4l8` (cleanup) — root cause found via `tsk-36i`'s scan: `main-checkout-lock.mjs:80`'s `DEFAULT_TTL_MS = 180_000` is **shorter** than the window it must protect. `held = pidLive && withinTtl` (`:201-205`) means a live holder's lock is reported not-held once its age exceeds TTL and gets unlinked (`:236`). `mergeRunnerItem` acquires once (`merge.mjs:660`) and holds through `runGoalCheck` (`:893`) with **no heartbeat**. Measured `npm test` at 184.93s > 180s TTL — two concurrent `git merge --no-commit` on the same tree. This is named as the root of the `MERGE_HEAD` guard patches (`tsk-18a`, `tsk-2j9`).
- `tsk-4hj` (cleanup) — direct consequence: `approve` can't distinguish a pre-existing `MERGE_HEAD` left by a **different in-flight session's item** from a genuine conflict of its own branch. Reproduced live on `tsk-55h`: reported conflict twice despite a clean independent verify, because `tsk-4qu`/`tsk-5td`'s concurrent merges owned the real `MERGE_HEAD`. The bug then **auto-aborts the other session's in-progress merge** and blames the innocent item — a genuine cross-session data-loss vector (no loss confirmed this time only because the other branch's content survived independently).
- `tsk-1cp` (cleanup) — defensive fix landed alongside `tsk-4hj`'s D4: `sync-root`'s `runAndReport` had no fallback branch for unrecognized `mergeRunnerItem` outcomes and would fall through to reporting `synced` even when nothing merged — same bug shape `tsk-18a` had already missed once when `tsk-18a`'s own new outcome was added, i.e. this exact class of gap ("new outcome value, forgot to update every switch") has bitten twice.
- `tsk-18a` (done) — `merge.mjs`'s raw git subprocess calls race concurrent processes on the shared checkout; lock only serializes fgOS's *own* state writes, not the git calls. Live repro: `merge next` conflict recovery's own `git merge --abort` failed (no `MERGE_HEAD`), correlated with two other concurrent sessions doing real git ops on the same checkout at the same moment.
- `tsk-46a` (cleanup) — **same root line as Theme 3's `tsk-2cd`**: `worktree.mjs:652`'s `git branch -f` runs completely outside any lock with no compare-and-swap against the branch's live tip. Two concurrent leaf approves into the same root: whichever session's `branch -f` runs second silently discards the first session's merge, no error, both report success. Verified empirically with a real git repro script.
- `tsk-598` (done) — the opposite-direction failure: `isWorkingTreeClean`/`isFgosOnlyStatusLine` (`merge.mjs:109-124`) blocks `return`/`approve` on **any** dirty file anywhere in the tree, including files that belong to a totally different concurrent session's unrelated item — reproduced twice in one session, no workaround but manually moving the other session's files aside.
- `tsk-x5r` (cleanup, partial) — `footprintDiffHits` (`bin/fgos.mjs` return verb) flags `.fgos/*` on the main-source path as unexpected footprint when a *concurrent* session's `.fgos` commit lands inside this item's `doing` window — same "another session's activity gets misattributed to me" shape as `tsk-4hj`, different subsystem.

**Count**: 7 items, one root line (`worktree.mjs:652`) responsible for two of them (`tsk-46a`, `tsk-2cd`) across two different clusters. **Class**: design gap — the concurrency model conflates "no other fgOS *state* writer" with "no other *git* mutator," and the one primitive built for the former (`main-checkout.lock`) has its own TTL-vs-workload mismatch.

## Theme 5 — merge conflicts require a human instead of agent self-resolution

**Mechanism**: `fgos catchup` (the verb that would resolve a conflict by merging the target into the item's branch, re-verifying, and landing) already exists and is well-behaved — but skills/agents are not instructed to use it, so a human gets paged on every conflict even when the mechanical fix is routine.

- `tsk-60h` (todo) — explicit: `catchup` already exists and recognizes `merge-conflict` in `CATCHUP_REASONS` (`bin/fgos.mjs:3747-3783`); what's missing is the **skill behavior** telling an agent to run it instead of asking a person. Named as one of exactly two chokepoints requiring a human to sit and watch (the other: batching questions — out of this scope). Split out of `tsk-2sj`'s shaping session.
- `tsk-3mv` (done, +children) — direct precedent that agent-driven conflict self-resolution works well when built: `tsk-3mv-1` auto-resolves decision-ID collision conflicts in `merge.mjs`; `tsk-3mv-2` has `merge-loop` agent-diagnose a verify-fail-post-merge before it counts toward the stop rule, instead of hard-stopping blind.
- `tsk-2qx` (wontfix) — earlier, broader ask ("upgrade merge-loop to intelligently gather evidence and self-resolve on Iron Law") — superseded by the narrower, already-shipped `tsk-3mv` children rather than built as originally scoped.
- `tsk-5t3` (done) — collects Iron-Law evidence live during work so a centralized merge process can find and use it later, supporting the self-resolution direction.

**Count**: 4 items, 1 concrete existing precedent (`tsk-3mv`) proving the shape works, 1 clear next step (`tsk-60h`) not yet built. **Class**: process/skill gap, not a code capability gap — the mechanism (`catchup`) already exists.

## Theme 6 — verify-gate design flaws around merge

**Mechanism**: several independent ways the pass/fail signal `approve`/`merge` trusts is either too narrow, too aggregate, or misattributed.

- `tsk-516` (cleanup) — `approve`'s `runGoalCheck` only re-runs the **item's own** narrow verify command, never the full `npm test` AGENTS.md's own DoD requires; confirmed regression escaped to main this way (`tsk-1m0`'s new file broke `architecture.test.mjs`, only caught later by an unrelated commit).
- `tsk-3wn` (cleanup) — a single flaky concurrency test (`test/state/events.test.mjs:225`, 20-process/40-append stampede against a 2s lock timeout) nondeterministically fails under load and blames **whatever unrelated item** happened to be merging at the time; confirmed live on two separate unrelated items (`tsk-4qu`, `tsk-104`).
- `tsk-5mc` (cleanup) — the merged verify command for `tsk-4sz` is still vulnerable to the documented vacuous-pass trap: aggregate pass-count across a 12-file glob can't tell "12 real tests passed" from "12 files each produced one synthetic zero-match wrapper pass" if a named test is ever renamed/deleted — worse than the single-file case the existing doc names since the wrapper-count scales with file count.
- `tsk-15k` (done) — the engine's "verify-only" merge mode can mark an item `done` without actually merging when there's divergence — noted for a later engine-layer fix.
- `tsk-107` (cleanup) — a **fix creating a new bug in the same family**: `branchContentMismatch` (`merge.mjs`, added for `tsk-15k`) compares a branch's introduced paths against current `HEAD` to catch discarded content, but if a *later, unrelated* merge (`tsk-15k` itself) touches the same file, an already-correctly-merged branch (`tsk-2eq`) gets false-flagged `verify-fail-post-merge` on re-approval. Fix direction: compare against `firstMerge^1` instead of live `HEAD`.

**Count**: 5 items, one direct case (`tsk-107`) of a merge-safety fix (`tsk-15k`) immediately producing its own false positive. **Class**: mixed — `tsk-3wn`/`tsk-107` are code bugs; `tsk-516`/`tsk-5mc` are a design gap in what "verify passed" is allowed to mean at merge time.

## Theme 7 — orchestration/pane lifecycle & lock-wait ergonomics

**Mechanism**: unattended merge automation (herdr panes, loop skills) doesn't fully close its own loop — a human still has to notice and intervene.

- `tsk-5d4` (todo) + `tsk-1ytv` (todo) — herdr's auto-merge launcher pane never self-closes when `merge-loop` finishes naturally (frontier empty), because `--autoClose` (`pick.rs::loop_run_argv`, tagged "tsk-358 D1 is discover-only") was only ever wired for `/fgOS:discover`, not `/fgOS:merge-loop`/`retro-loop`/`cleanup-loop`. Depends on `tsk-3fk` retiring `fg:operation`'s fixed-2-pane invariant first.
- `tsk-328` (cleanup) — `fgos merge next`/`approve` already forward `--wait`/`--no-wait`/`--timeout` at the CLI layer, but the `/fgOS:merge-next`/`/fgOS:merge-loop` **skill** wrappers never exposed it, forcing a person to hand-type the raw CLI call under sustained lock contention instead of just widening the retry budget.
- `tsk-2xt` (cleanup, broader scope) — herdr-orchestrator auto-launch toggles for all 4 domains (discover/merge/retro/cleanup); merge is one of four, not merge-specific design.

**Count**: 3 items directly merge-scoped. **Class**: process/ergonomics gap.

---

## Direct answers

**(a) Merge taking a long time**
- Theme 3: `blockedOnSync` deadlocks (`tsk-40y`, `tsk-173`) force a manual `sync-root` detour.
- Theme 6: narrow/vacuous verify (`tsk-516`, `tsk-5mc`) and the flaky concurrency test (`tsk-3wn`) cause spurious re-attempts and re-verification.
- Theme 7: lock-wait timeout not exposed at the skill layer (`tsk-328`) forces manual CLI fallback under contention.

**(b) Sessions stepping on each other**
- Theme 4 is this question, in full: TTL-vs-workload mismatch (`tsk-4l8`) → `MERGE_HEAD` misclassification across sessions (`tsk-4hj`, `tsk-18a`) → unlocked branch force-move race (`tsk-46a`, same line also drifting a root's own claim worktree in `tsk-2cd`) → over-broad dirty-tree gate blocking on another session's unrelated files (`tsk-598`) → footprint misattribution across sessions (`tsk-x5r`).

**(c) A human having to sit and watch**
- Theme 5: merge conflicts default to paging a human even though `catchup` can already resolve them mechanically (`tsk-60h`); `tsk-3mv` proves the self-resolve shape works when actually built.
- Theme 7: automation panes that don't self-close after a natural finish (`tsk-5d4`, `tsk-1ytv`) leave a person to notice and close them by hand.
- Theme 2/3: false-positive blocks (`checkMergeStillResolves` family, dead-root routing) require a person to manually investigate and confirm "content is really safe" before unblocking, by design (diagnostic-only, never auto-recover) — a deliberate trade-off, not an oversight, but still a standing source of human intervention.

## Cross-cutting pattern worth flagging to the design discussion

Two independent bugs (`tsk-46a`, `tsk-2cd`) trace to the **same single line** — `src/runner/worktree.mjs:652`'s `git branch -f <branch> <endCommit>` — because that line is both unlocked (race between concurrent sessions) and unaware of other worktrees checked out on the branch it moves (stale files for whoever else is sitting in it). A fix there (CAS check, already locked as D1 in `docs/history/merge-ephemeral-branch-force-race/CONTEXT.md`) plus a worktree-refresh guard (D3 in `docs/history/root-worktree-drift-after-child-merge/CONTEXT.md`) closes both at once — a good candidate for "attack the cause, not the two symptoms."

Similarly, `checkMergeStillResolves` (Theme 2) has absorbed 5 fixes without ever changing its underlying contract (single-sha ancestry check) — worth asking in the design discussion whether the function's contract itself should change (e.g., "prove this item's declared file set is present on the target ref" instead of "prove one recorded sha is an ancestor") rather than continuing to patch topology cases one at a time.
