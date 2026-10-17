# Handoff: Git G0 spec first, then the Git plan, then the event store plan

Written 2026-10-17 19:01 by session `ac420727` (second machine, `~/projects/forgent`) before compaction, so the next session or another machine can continue without the chat. Rows **GIT** and **ES** on the [program board](../261017-1313-fgos-platform-program-board/plan.md).

## Where things stand

- **Event store: signed.** The owner signed D-ADR0055 on 2026-10-17 (supersedes L3 clauses 1 and 4 and the D-ADR0003 layout). The contract is [docs/platform/event-store/spec.md](../../docs/platform/event-store/spec.md) (canonical). Evidence: [V-SPAWN-01](experiment-261017-1431-event-store-v-spawn-01.md), [reopen council packet](council-261017-1513-event-store-reopen-final-packet.md), [model check](experiment-261017-1527-event-store-model-check-reader-seal.md), [model check on the corrected rules](experiment-261017-1545-event-store-model-recheck-corrected.md), [git ref experiment](experiment-261017-1527-event-store-git-ref-mechanics.md). No implementation plan yet.
- **Claim fan-out fixed** on main (`a4b1278ae`): `readClaims` no longer spawns git per open claim.
- **Plan 4.3:** 4.3-R landed 18:28 on the owner's machine (main `56f87bf5b`); **this machine has not landed it yet** (owner picks the time; stop every writer first). 4.3-S runs as wave S from main on the owner's machine ([brief](brief-261017-1823-main-door-state-recut-after-event-store.md), plan 4.3 block "CẮT LẠI 18:50"); plan 4.3 closes when wave S lands.
- **Git component: no spec yet.** Inputs exist: [roadmap](roadmap-261016-2212-fgos-cook-and-git-component.md), [frozen lessons catalogue, 234 entries](research-261017-1032-git-lessons-catalogue.md), council direction A (Rust live core, no `integrate.mjs` patch, council run `wf-run-1792170289706-0e3ce52d`).

## Owner decision 2026-10-17 19:01

The owner prioritises **Git over the event store** and approved the order proposed by this session:

1. **Now: an architecture council writes the Git G0 spec** (`fgos workflow start architecture-advisory`, openai and gemini pinned to account `tetcu72`, rigor high). Inputs: the catalogue minus the `.fgos` families that the event store retires (event store spec section 20 lists them by G-number), the 4.3-R locks reused unchanged (main checkout 50, merge slot 20, worktree-admin 40, fd borrowing, fences), the council 10-16 decisions, the owner's seven design tenets, and the **publication port the event store needs** (write objects, compare-and-swap a ref, read a chain, fetch, push on `refs/fgos/*`). G0 states that the `.fgos` checkpoint stays a detachable adapter and that Git does not re-implement any `.fgos` event mechanism. The six missing-expertise areas of the 10-16 council are mandatory G0 topics. Follow with proofs as for the event store (experiments, model check where a protocol is involved).
2. **Owner approves the G0 spec, then the Git plan is written with `ak:plan`.** Its first phase is the publication port, because the event store uses it from the start (this resolves the council dissent "Git component as a precondition" in the critic's favour and removes the event store's temporary second git caller).
3. **Then the event store plan, also with `ak:plan`**, consuming Git's publication port instead of a crate-internal driver. Its Work cutover phase waits for wave S.

Collision to respect: Git implementation that touches the claim path (`src/runner/claim-port.mjs`, `take` creating a worktree) waits for wave S S3 (P04 owns that file) or rebases after it. The G0 spec itself touches no code.

## Next action for the session that resumes

Start the G0 council (step 1), update the GIT row to running with the run id, and report to the owner. Do not start steps 2 or 3 before the owner approves G0.
