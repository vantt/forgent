# Supervisor wake, 2026-11-24 09:14 +07

No owner question was pending at start. Four events were drained.

- **dde8a9642bee8cfe (coordination-help, plan 261121-2110-component-authority-doors).** Phase 12a step 4 adds the crate
  edge fgos-holder-lock -> fgos-host-runtime, which makes `apps/fgos-gateway/Cargo.lock` and `herdr-dashboard/Cargo.lock`
  stale. Both paths were added to the plan footprint and to the 12a row, with a note under the phase table. Only this
  plan is running, so no footprint overlaps. Landed on main d73d2f96b. A mailbox note to the lead was refused
  (`event-store-unavailable`: the confined session's git-floor probe hit a read-only file system). The lead is busy
  starting 12b and will see the widened footprint when it lands 12a.
- **0302ff3fe8d426f8 (coordination-chore).** The owner wants `sessionRotation.personas.secretary.soft` raised from 0.15
  to 0.30. `fgos config set` refused with `config-write-confined`, and no `lead:SUPERVISOR` session is live, so the owner
  was asked once: q-ozu6l2ioxa (recommended: the owner runs the one command). The project config file also holds the
  owner's uncommitted `maxLeads: 3` edit, which will land with it.
- **a967123780257516 (session-no-result).** Unit unit-run-1795486160897-6d3125a4 is the lead's own 12a unit. It settled
  `pass` (sonnet, 49 s); only the token usage was missing (`transcript-not-found`). No action was needed.
- **a887e32e7ae2b49f (lane-freed).** No plan was admissible (1 of 3 leads in use, 3 lanes free), so nothing was started.

Running plans: only 261121-2110-component-authority-doors, with its lead live and busy (12a under review, 12b starting).

## Open questions

- q-ozu6l2ioxa: who applies the secretary rotation config change.
- A confined head cannot send mailbox mail (`git-floor-probe-failed` on a read-only file system). This looks like a
  confinement bind gap for the supervisor's mailbox grant and should go to the secretary as a backlog item.
