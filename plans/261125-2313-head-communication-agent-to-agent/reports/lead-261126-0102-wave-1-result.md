# Wave 1 result (phases 1, 2, 3)

Lead `head:lead-forgent-261125-2313-head-c-cdfd0`, 2026-11-26.

## What landed

- **Phase 1, diagnosis**: `reports/diagnose-confined-mail.md`, landed by a paths land. Both failures were
  reproduced live from this confined lead head.
  - `mailbox inbox` fails with `lock-unavailable` (EROFS on `.fgos/locks/mailbox.lock`), because the head window in
    `apps/fgos/src/routing.rs:660` forwards only `mailbox send`.
  - A send that the host verb rejects returns a bare `host-failed` (`packages/session-host/rust/src/forwarder.rs:509`).
- **Phase 3, composer state**: landed at `5f6ddd735` (branch `p03b`).
  - It took three review rounds. They fixed a false `Empty` for drafts starting with "try ", drafts with a blank
    first line, and drafts ending in `>`, and removed matches on fixture text from production code.
  - The last review found nothing blocking. Hand-over notes are in the phase 5 brief.
- **Phase 2, mail follows rotation**: landed at `723b3bf08` (branch `p02c`).
  - Role-addressed mail is offered once to the role's holder, as Identity names it. Handle-addressed mail keeps
    today's notice.
  - The snapshot stays at version 2 until a header carries a role.
  - The final review found nothing blocking.
- Phase 3 and phase 2 each passed the land gates. Each review ran the focused cargo suites; all were green.

## Waits

- **Phase 4** is parked on owner question `q-vqyxe5oi6j`: it needs `apps/fgos/src/routing.rs` added to the footprint.
  Phases 5, 6 and 7 depend on phase 4.

## Leftovers outside this plan's footprint (proposed items, not done)

1. `packages/mailbox/rust/store/src/verbs.rs` `inbox_claim` remains as a thin wrapper over
   `inbox_claim_with_roles`. So do the `|_, _| false` wrappers `MailboxState::claim`, `hook::begin` and `shell::run`.
   Their remaining callers are in `packages/mailbox/rust/store/tests/verbs.rs` and other tests, outside the footprint
   (L10).
2. A drain still scans the Identity directory under the mailbox lock, once per distinct role whose mail is pending
   for another head. Bound it or cache it.
3. The hand-written `MailboxState` serializer (`core/src/state.rs:159-185`) can drop a future field silently. A
   comment, or a round-trip test of every field, would guard it.

## Friction seen

- A unit that stops partway (provider limit, output limit) leaves the worktree dirty. The runner then excludes
  files that were dirty before launch, so the next unit in that worktree can never commit. The workaround was a
  fresh worktree per retry (`p02b`, `p02c`, `p03b`).
- A worker that ran workspace-wide cargo and npm filled the root disk, so one land failed with ENOSPC.
- The dead worktrees `p01`, `p02`, `p02b` and `p03` were raised to the supervisor for removal.
