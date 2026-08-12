# plan.md — tsk-xyr: merge queue keyed by target ref, inside `approve`

Mode: **high-risk** — 3 ordinary flags (public contract: `mergeRunnerItem`'s
option bag and `main-checkout-lock.mjs`'s exported surface; existing covered
behavior: `test/runner/merge.test.mjs` + `test/runner/main-checkout-lock.test.mjs`
plus the CLI merge/approve suites; weak proof around concurrency) plus **1
hard-gate flag**: *data loss* — this changes which lock protects the
`git branch -f` ref move that tsk-46a/tsk-2cd already lost work to. A
`standard` lane would let the concurrency claims through on reasoning; the
one place this can go wrong is exactly the place that costs real commits.

Locked decisions: `docs/history/merge-conductor-throughput-and-human-release/CONTEXT.md`
(D1–D7). Design: that feature's `DISCUSSION.md` §6 and §7 `task-merge-queue`.
Nothing below reopens any of them.

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` returns provider `gitnexus`, `status: present`; the index
was rebuilt this session (14 761 symbols at `79fead3`) and every commit since
on `fgw/tsk-51m` is docs-only.

## Graph signal

`fgos graph --json` (2026-08-12): `componentCount` 343, `topUnblock` skipped
by the frame, and the reported `criticalPath` does not pass through `tsk-xyr`.
Honest reading: the work graph gives **no ordering signal** for this item. The
only real ordering constraint is the one `CONTEXT.md` D5 already states —
`tsk-xyr` before `tsk-4ax`, because D3 depends on the invariant this item
creates.

## Blast radius (gitnexus, `direction: upstream`)

| Symbol | Risk | Direct callers | Processes |
|---|---|---|---|
| `acquireMainCheckoutLock` | **HIGH** | 2 (`claim-port.mjs`, `merge.mjs`) | `claimAndDispatch`, `claimWork`, `retargetMember` |
| `mergeRunnerItem` | LOW (reported 0) | — | — |

The `mergeRunnerItem` zero is **not** trustworthy and is not treated as one:
`grep` finds 4 real call sites, all in `bin/fgos.mjs` (`approve` leaf-to-root
:3150, `approve` root-to-main :3284, `sync-root` nested :3588, `sync-root`
top-level :3602) — the index does not carry the CLI's own dispatch edges.
Cross-checked by grep per `CLAUDE.md`'s capability gate.

The HIGH on `acquireMainCheckoutLock` is the reason for the shape below:
every change to that module is **additive with an unchanged default**, so
`claimWork` / the pre-commit hook / `retargetMember` keep byte-identical
behavior and are not re-proved by this item.

## Approach

### What is actually contended

Two merges collide over a **branch pointer**, not a directory. Evidence, all
read this session:

- `bin/fgos.mjs:3145` stands up a **detached** ephemeral worktree at
  `fgw/<rootId>`'s tip, merges there, and lands via `git branch -f`
  (`worktree.mjs:809`). Two leaves of the same root read the same
  `startCommit`, and the loser's commit is orphaned — today caught only
  *after the fact* by the CAS guard at `worktree.mjs:802-808`.
- `bin/fgos.mjs:3150` nonetheless passes `lockRoot: repoRoot`, so that merge
  takes the whole-repo `main-checkout.lock` — a resource it never touches.
- `.githooks/pre-commit:97` exits `0` immediately when the committing
  checkout is not the hook's own home checkout (`hookRunsAtHome`), so the
  ephemeral worktree's own merge commit never takes that lock either.
  Confirmed by reading the hook, not assumed.

So an ephemeral-worktree merge's only shared resource is the **target branch
ref**. A merge run directly on the main checkout (root-to-main) genuinely does
touch the shared working tree and index, and keeps needing
`main-checkout.lock`.

### The shape

1. **`main-checkout-lock.mjs` gains an optional `lockFile` on its existing
   primitives**, plus one pure helper `mergeSlotLockFile(targetRef)` mapping a
   ref to a lock filename (`fgw/tsk-51m` becomes `merge-slot--fgw-tsk-51m.lock`).
   Default `lockFile` is `LOCK_FILE`, so every existing caller is unchanged.
   This is lineage **reuse**, not a fifth instance: same wx-atomic-create,
   same stale reclaim, same self-recognition, same TTL semantics — only the
   filename varies. `CONTEXT.md`'s own wording for this item: "tái dùng
   lineage này, không phát minh primitive mới".
2. **`merge.mjs` gains `withMergeTargetSlot(lockRoot, targetRef, fn)`** — the
   heartbeat + `releaseOnExit` + `MergeError{code:'lock-held'}` shape
   `mergeRunnerItem` already implements for the main-checkout lock, lifted so
   a caller can hold a target's slot across a whole merge attempt. Throwing
   `code: 'lock-held'` is what buys acceptance 1 for free: `runMerge`
   (`bin/fgos.mjs:2839`) already wraps every merge in `withLockRetry`
   (`lock-wait.mjs:44`), which retries `lock-held` on a bounded budget and
   rethrows unchanged when the budget is spent.
3. **`mergeRunnerItem` gains `targetSlot`** — when set, the caller has already
   taken that target's slot and this merge runs in an ephemeral worktree, so
   `mergeRunnerItem` does **not** take `main-checkout.lock`. Omitted (the
   root-to-main and top-level `sync-root` call sites), behavior is exactly
   today's.
4. **`approve` and `sync-root` wrap their ephemeral branches in the slot**,
   outside `withMergeEphemeralWorktree` — this ordering is load-bearing, not
   cosmetic. `createDetachedMergeWorktree` reads `startCommit`
   (`worktree.mjs:751`) *before* `fn` runs; a slot taken inside that callback
   would leave the tip read unprotected and merely convert a race into a
   louder CAS failure instead of a queue.
5. **Picker skip (absorbs tsk-1zd)**: `merge next` walks the ranked `ready`
   list and skips any candidate that provably cannot progress this turn,
   reporting what it skipped. The only such condition today is a required
   Iron Law without `--acknowledge-iron-law`, and `classifyIronLaw`
   (`iron-law.mjs`) is a **pure** function of the item's own diff and
   description — the picker can decide it without attempting a merge and
   without persisting a skip list.

### For trunk, the slot IS `main-checkout.lock`

Deliberate, and stated rather than hidden: a merge whose target is the trunk
necessarily runs on the main checkout, so `main-checkout.lock` already is that
target's exclusive slot. Adding a second `merge-slot--main.lock` on top would
buy no invariant and add a deadlock ordering to get wrong. The queue is
therefore keyed by target ref with exactly one slot per target — the trunk's
slot just happens to be the lock that already existed.

### Rejected

- *A concurrency cap* — rejected by D7. Parallelism should emerge from the
  number of distinct targets with work.
- *Slot inside `merge next`* — rejected by D7/tsk-3cs D1: `approve` is the sole
  execution path, and a hand-typed `approve` must not be able to skip the
  queue. That hand-typed path is precisely the measured cause in tsk-3cs D5.
- *Slot inside `withMergeEphemeralWorktree`* — rejected: the tip is read
  before the callback, see step 4.
- *A persisted skip-list for the picker* — rejected: `classifyIronLaw` is
  pure and recomputable, so a state file would add a `fgos setup`/`fgos
  doctor` registration obligation (AGENTS.md's install/setup/doctor gate) and
  a staleness class, to store a value that is free to derive.
- *Falling through to the next candidate after a thrown Iron Law inside the
  same call* — rejected: `bin/fgos.mjs:2086-2088` records that as deliberate.
  Acceptance 4 asks for the item not to come back **next turn**; a pre-check
  that skips it satisfies that without touching the same-call semantics
  `merge list` promises.

## Risk map

| Component | Risk | What proves it |
|---|---|---|
| `mergeRunnerItem` no longer takes `main-checkout.lock` on the ephemeral path | **high — hard-gate data loss** | Test: two merges into the *same* target — the second waits and neither commit is orphaned. Test: two merges into *different* targets hold their slots simultaneously. Test: the tsk-46a CAS guard still refuses a stale-tip `branch -f` after the change. |
| `lockFile` option on the shared lock module (HIGH upstream) | **high** | Test: every existing primitive with no `lockFile` still resolves `main-checkout.lock`; two different `lockFile`s do not contend with each other. `claimWork`/hook call sites unchanged and their suites stay green. |
| Slot acquired outside the ephemeral worktree | medium | Test: while a slot for `T` is held, a second attempt on `T` fails/waits before `createDetachedMergeWorktree` ever reads a tip. |
| Picker skip | medium | Test: an Iron-Law-required ready item is skipped and a lower-ranked ready item is picked instead; the skip is reported. |
| "Nothing left" vs "stuck" | medium | Test: `{picked:null, reason:'nothing ready to merge'}` when `ready` is empty vs a distinct reason plus `skipped[]` when every ready item was skipped. |
| `sync-root` nested path | medium | Test: it takes the same slot as a leaf approve into that same parent branch. |

Every "high" row is a mandatory proof point for `fgos-coding-validating` and
must be a real test, not an argument.

## Cases worth proving

- **Boundary**: target ref that does not exist yet (`createDetachedMergeWorktree`
  falls back to `createBranchRef`, tsk-6ch); a ref name containing `/` and `-`
  producing a collision-free, filesystem-safe lock filename; an empty ready
  list.
- **Must not regress**: root-to-main still holds `main-checkout.lock`; the
  pre-commit hook's own acquire is untouched; `claimWork`'s acquire is
  untouched; the Iron Law gate still refuses; D1's "root that has not gathered
  its children" escalation is untouched.
- **Concurrent**: two leaves of the same root; two leaves of different roots; a
  leaf plus a root-to-main; a slot holder that dies mid-merge (TTL/`releaseOnExit`
  reclaim).
- **Partial failure**: slot acquired, merge conflicts — slot released, target
  untouched; slot acquired, process killed — next acquirer reclaims after TTL
  rather than deadlocking.

## Assumptions

- **`.fgos/merge-slot--*.lock` files need no `fgos setup`/`fgos doctor`
  registration.** They are runtime lock files under an existing gitignored
  directory, created on demand by the same module that already creates
  `main-checkout.lock` there — not a config default, env var, or new infra
  dependency. Same class as the existing lock, which `doctor` also does not
  register as a config surface. Flagged here for `fgos-coding-validating` to
  confirm against `src/setup/checks.mjs` rather than assumed silently.
- **The ephemeral merge worktree never mutates the main checkout.** Grounded in
  `.githooks/pre-commit:97`'s `hookRunsAtHome` early exit and in the detached
  worktree having its own index; to be re-proved by the different-targets
  concurrency test rather than left on reading alone.
- **A hand-typed `fgos approve` cannot bypass the queue** because the slot sits
  in `approve` itself (D7/tsk-3cs D1). Directly checked by where the code goes.

## Out of scope (named, not forgotten)

- Moving verify to the inbound gate — that is `tsk-4ax`, and this item must not
  loosen `mergedTreeAlreadyVerified`'s two conditions in either direction.
- Auto-catchup of leaves after a root syncs — D4 forbids it; `tsk-2ypd` owns
  the detection half.
- `worktree.mjs:652`'s unlocked `git branch -f` on the *non-merge* path, and
  `provisionDependencies`' fresh `npm ci` per ephemeral worktree — both listed
  as unowned in the parent plan; neither is touched here.
- The read-vs-write window where a root-to-main merge reads `fgw/<rootId>`'s tip
  while a leaf merge is moving it. No data is lost (nothing is overwritten);
  the worst case is a root landing without a leaf that was still in flight,
  which D1's own gathering rule already governs. Named so it is a known
  boundary rather than an oversight.

## Outstanding questions

None
