# CONTEXT — re-claiming an item after the claim-lock §3b release

Item: `tsk-65n` (stage `clarify`, dep `tsk-2zv`). Friction surfaced while
working `tsk-598`.

## Feature boundary

In scope: what happens when a session re-claims an item that was already
claimed once, released back to `status: todo` by the claim-lock §3b
release at the `decompose → executing` boundary
(`src/intake/plan.mjs`'s `releaseClaimOnExecuting`), and whose
`fgw/<id>` branch — and often a live worktree checked out on it — still
stands.

Two behaviors inside that boundary:

1. `pick <id>` (the spec's own intended re-claim door) destroys or refuses
   the live worktree the calling session may still be sitting in.
2. `take --id <id>` silently claims the item as `source: main` even though
   its real work lives on `fgw/<id>`.

Out of scope: the `blocked` + branch-exists retake path (`isBranchTake`)
and its deliberate recompute of `branchHeadAtTake`; a new `reattach` verb;
the reclaim behavior of the runner-dispatch and merge-ephemeral worktree
call sites.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Ship the root-cause fix, not a doc-only note and not a new verb: `pick`'s branch-reuse path must reattach to an existing live checkout of `fgw/<id>` instead of force-removing it. This makes the re-claim door the runner spec already names (`pick <id>` again at stage `executing`) actually safe, so no `reattach` verb/flag is added and the `blocked` + `take` detour stops being necessary. A doc line covering the resume case follows the fix. |
| D2 | `take` stops silently mis-claiming: when a `todo` item's `fgw/<id>` branch already exists, `take` refuses with a non-zero exit and names `pick` as the correct door, instead of recording a `source: main` claim whose wrongness only surfaces later as a confusing `return` refusal. |
| D3 | D1's reattach applies to an existing registered checkout of `fgw/<id>` whether its working tree is clean or dirty. Cleanliness was only load-bearing because the next step was a destructive removal; nothing is removed on this path, and a dirty checkout is exactly the mid-work session that most needs to resume. The tsk-1os cleanliness guard stays fully intact for every other reclaim caller. |
| D4 | D2's refusal covers any `todo` item whose `fgw/<id>` branch exists — whatever put it back at `todo` (§3b release, reject, verify-fail park) — rather than only the `latestTodoReleaseTrigger === 'claim-lock-3b'` case. One rule, one message. `blocked` + branch-exists (`isBranchTake`) is untouched: that path is legitimately a main-checkout claim with branch source. |

## Pinned terms

- **claim-lock §3b release** — `releaseClaimOnExecuting`
  (`src/intake/plan.mjs`) putting an item held at stage `decompose`
  back to `status: todo` the moment it reaches `executing`, so the same or
  another session can claim it again for the executing phase on the same
  branch. Prose: `docs/specs/runner.md:163-168`.
- **branch-source vs main-source claim** — `claimWork`'s
  `useBranchSource = isolate || isBranchTake`
  (`src/runner/claim-port.mjs:206`). Branch-source records
  `branchHeadAtTake` + `source: 'branch'`; main-source records
  `headAtTake` (the main checkout's HEAD) + `source: 'main'`.
- **reattach** — used here strictly as the behavior inside `pick`'s
  existing branch-reuse path (D1), never as the name of a new verb (that
  option was considered and rejected).
- **live checkout** — a path present in `git worktree list --porcelain`
  for `fgw/<id>` that still exists on disk, regardless of working-tree
  cleanliness.

## Scout evidence

- `src/runner/claim-port.mjs:204-206` — `isBranchTake = item.status ===
  'blocked' && branchAlreadyExists`; `expectedStatus = isBranchTake ?
  'blocked' : 'todo'`; `useBranchSource = isolate || isBranchTake`. A
  `take` (always `isolate: false`) on a `todo` item whose branch exists
  therefore yields `useBranchSource === false` — the silent main-source
  claim D2 addresses. Confirms the item's premise as written.
- `bin/fgos.mjs:1691-1711` — the cost of that mis-claim lands at `return`:
  a main-source claim makes `return` require `item.headAtTake` present, a
  clean main checkout, and main HEAD advanced past `headAtTake`. The work
  is on `fgw/<id>`, so main HEAD never advances and `return` refuses
  ("HEAD has not advanced past headAtTake") — or gets pushed through with
  `--no-new-commits-ok`, which is worse.
- `docs/specs/runner.md:163-168` — the §3b release exists so a session
  "có thể gọi `pick <id>` lại ở stage `executing` với workspace cùng một
  branch". `pick`, not `take`, is the intended re-claim door; D1 fixes
  that door rather than adding another.
- `bin/fgos.mjs:1552-1558` + `1567-1575` — `pick` always calls `claimWork`
  with `isolate: true` and `worktreeDir` under `.claude/worktrees/`; the
  comment already states the branch-reuse intent for exactly the §3b case.
- `src/runner/worktree.mjs:254-270` — `createWorktree`'s reuse path calls
  `reclaimOrphanedCheckout(repoRoot, branch)` before `git worktree add`.
- `src/runner/worktree.mjs:168-181` — `reclaimOrphanedCheckout`'s tsk-1os
  data-loss guard: a **dirty** checkout throws ("refusing to reclaim
  checkout … it has uncommitted changes"); a **clean** one is removed with
  `git worktree remove --force`. This is the precise correction to the
  item's premise: re-`pick` is not unconditionally destructive — it
  destroys the live worktree only when clean, and hard-fails when dirty.
  Both outcomes break a session sitting in that worktree, which is why D1
  covers both (D3).
- `src/runner/worktree.mjs:305-340` — the three operation-type wrappers
  (`createClaimWorktree`, `withMergeEphemeralWorktree`,
  `createDispatchWorktree`, per `docs/decisions/0022` candidate #3) are
  the seam that lets D3 scope reattach to the claim-isolate shape only.
- `src/runner/loop.mjs:360, 641-643` — the runner reaches worktrees through
  `createDispatchWorktree`, and its retry path deliberately wants a
  **fresh** worktree on a reused branch (`loop.mjs:648`, `762`). D3's
  reattach must not reach it.
- `src/runner/claim-port.mjs:184-199` — `isClaimLockReclaim` preserves
  `branchHeadAtTake` only when `latestTodoReleaseTrigger(rawEvents, id)
  === 'claim-lock-3b'`; every other `todo`-with-branch shape recomputes to
  the live tip on purpose.
- `docs/history/claim-reclaim-branchhead-reset/CONTEXT.md` D2 — that
  recompute is a deliberate anti-cheat gate for the blocked-retake path,
  explicitly out of scope there and here. This is what makes the `move
  --to blocked` + `take` detour costly: it resets the progress baseline to
  the live branch tip, discarding the §3b preservation `tsk-2zv` bought.
- `rg reattach src bin` — no `reattach` verb or flag exists today; only
  prose comments (`src/intake/plan.mjs:287`, `bin/fgos.mjs:1557`).
- `docs/how-to/claim-a-clarify-or-decompose-stage-item.md` — covers the
  fresh-claim case and states outright "not to resuming an item you
  already claimed". The natural home for D1's doc line.

## Canonical references

- `docs/specs/runner.md` — §3b release lifecycle, row 4b's
  executing-phase-only visit scoping.
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` — a linked
  worktree never carries its own `.fgos/`.
- `docs/decisions/0022-fgos-choke-point-survey.md` — the worktree call-site
  wrapper split D3 relies on.
- `docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md`
  — the tsk-1os guard D3 must leave intact elsewhere.
- `docs/history/claim-reclaim-branchhead-reset/CONTEXT.md` — `tsk-2zv`
  (this item's dep), the §3b `branchHeadAtTake` preservation.

## Deferred to planning

- Where D1's reattach decision is made: inside `reclaimOrphanedCheckout`
  (new opt), inside `createWorktree`'s reuse path, or in
  `createClaimWorktree` alone. D3 only fixes *that it must not leak* to
  the dispatch/merge-ephemeral callers.
- The shape `pick` returns for a reattached worktree (today
  `{ path, branch, reused }` from a freshly-added checkout) and whether an
  existing-path reattach needs a distinct field for callers, including the
  `/fgOS:pick` skill's `EnterWorktree` hand-off.
- Whether the reattached path must satisfy the harness `EnterWorktree`
  constraint (under `.claude/worktrees/` of the same repo) and what `pick`
  does when an existing checkout sits outside it — e.g. the
  `os.tmpdir()/fgos-worktrees` default from an older claim.
- Exact wording and exit category of D2's refusal, and which existing
  tests assert today's silent main-source `take`.

## Deferred, not absorbed

- A standalone `reattach` verb/flag (the item's option 2) — rejected by D1.
- Changing the blocked-retake `branchHeadAtTake` recompute — deliberate
  gate, stays as is.
