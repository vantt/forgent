# Brief: the Git G0 spec council

Written 2026-10-17 19:07 for the architecture council that writes **G0**, the canonical spec of the Git component `fgos-git`. The owner set the order at 19:01: G0 spec first, then the Git plan, then the event store plan. Background and the owner's decision: [handoff-261017-1901-git-g0-and-event-store-plan-leads.md](handoff-261017-1901-git-g0-and-event-store-plan-leads.md).

## What to produce

A spec ready to be written to `docs/platform/git/spec.md`, in the same shape as [docs/platform/event-store/spec.md](../../docs/platform/event-store/spec.md): ownership boundary, layering and locks, typed operations, recovery, doctor checks, migration of current callers, verification vectors, and relations to other work. It must cover every topic below. The spec is a contract, not a plan; it names no phases or dates.

## Decisions already made (do not reopen)

- **Rust is the live core now** (owner, Q6 of the 10-16 council `wf-run-1792170289706-0e3ce52d`, direction A). Node keeps only thin adapters. `src/runner/integrate.mjs` is not patched in the meantime.
- **The shared floor of the 10-16 council:** Git is a component beside Workflow and Execution Core and the only authority for repo mutation and recovery. It exposes many typed operations, not one generic merge. The backend is a hardened Git CLI, not libgit2. All three current parallel cores (Workflow `integrate.mjs`, Work's own merge/worktree core, Unit's own commit/sync core) are deleted or turned into thin adapters that hold no policy or mutation. Done means: the product mutation allowlist is at zero, `docs/platform/component-boundary.md` has a Git row, and every verification vector has a real test.
- **Named defaults from that council that still hold:** lock order 20 → 40 → 50 → 60, and verify/build never runs under 50 or 60; no public `git(args)` door and no dual-run writer; remote push and GitHub PR merge must be classified by G0 into four layers (local ref, local worktree, remote send, GitHub API merge); `integrate.mjs` is deleted only after Git's land replaces it with tests; no publication CAS without a journal intent and recovery (G0 must settle where it is stored, its schema, owner and doctor check).
- **Carry over every lesson.** The frozen catalogue is [research-261017-1032-git-lessons-catalogue.md](research-261017-1032-git-lessons-catalogue.md) (234 entries, lane sources in [git-lessons-sweep-261017/](git-lessons-sweep-261017/)). G0 maps each entry to the operation, guard or vector that carries it, or names it retired with the reason.
- **The event store (D-ADR0055, spec canonical) retires whole `.fgos` families**, so G0 drops them: tracked event files dirtying checkouts (G-092, G-093, G-120, part of G-029), merges of append-only logs (G-089, G-121, G-170), truncation detection (G-210, G-211, half of G-184), event checkpoints and their cadence (G-118, G-212, G-213), file compaction (G-090, G-214). Lessons tied to other tracked `.fgos` files (G-054, G-069, G-086, G-088, the rest of G-166) stay in G0.
- **The 4.3-R locks are reused unchanged** (landed on both machines 2026-10-17): main checkout rank 50, merge slot 20, worktree-admin 40, fd borrowing into git children, fences. Contract: [docs/platform/holder-lock/spec.md](../../docs/platform/holder-lock/spec.md). The event store adds `event-seal` 58 and `event-append` 70; Git must stay compatible with both.
- **The `.fgos` checkpoint stays a detachable adapter.** Git does not re-implement any `.fgos` event mechanism.

## Mandatory topics

1. **Publication port for `refs/fgos/*`**, the first slice: write objects, compare-and-swap a ref, read a chain, fetch, push. Plumbing only: no index, no work tree, no HEAD, no main-checkout lock. The event store already specifies what it needs from it (event store spec sections 3, 4, 10 and 14: per-machine refs `refs/fgos/events/<machine-id>`, fetch into `refs/fgos/remotes/<remote>/events/*`, non-fast-forward resolved by a two-parent merge commit, never force). The port must serve that without a protocol change, and the Node-to-Rust route is an N-API addon with no exception to the exec guard under the `state` lock.
2. **The six missing-expertise areas of the 10-16 council**, each answered in the spec:
   - a consumer outside coding (business workflow, mission #2) checking domain neutrality against a real caller;
   - the durability layer (L1/L3/L7) for the publication journal intent;
   - packaging and distribution of the Rust host for the new component (release, activation);
   - IPC cost Node to Rust and the fd-borrow probe;
   - concurrent lock order across Node, Rust and git hooks (ladder, timeout, signals);
   - crash recovery at the git filesystem level (`index.lock`, orphaned `.git/worktrees`, a half-done CAS) without any `--force` that loses uncommitted work.
3. **The open dissents of the 10-16 council**, each closed with one owner and a reason: N7 (who holds custody of a worktree between a finished attempt and the runner's commit); the single owner of the RUL84 write-scope matcher (one implementation, one port, no copy); the test preservation scope (measure whether the current tests are black-box on a temp repo or internal unit tests); the order and date for deleting Workflow's lock-free merge path and any temporary adapter.
4. **Callers to migrate**: every current git mutation site in `src/` and `bin/`, with the operation that replaces it. The claim path (`src/runner/claim-port.mjs`, `take` creating a worktree) is being changed by plan 4.3 wave S step S3; G0 may specify its target but must say that work there waits for S3.

## Owner's design tenets (check every choice against them)

One door; strict bottom-up layering; hexagonal and pluggable; independent foundation components, Rust first; correctness and stability first, deciding from real OS and git state; fast, light, KISS and DRY; one authority and transparent docs (`core/instructions/design-principles.md`).

## Proof expected after the spec

As for the event store: experiments on a local repo for any claim about git behaviour, and a model check where a protocol is involved (publication CAS and its recovery, lock order). The council names which claims need which proof.

## Not in scope

No code, no plan phases, no change to the event store spec, no change to plan 4.3.
