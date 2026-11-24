# Supervisor wake, 2026-11-24 10:54

## Queue
- 98de4718ec32b83f (coordination-help, plan 261121-2110-component-authority-doors): the lead handed over the superseded
  p12b worktree. The supervisor has no worktree remove verb and no `lead:SUPERVISOR` is live, so the owner was asked
  once: q-v7o5temdml. Handled.
- a3943ced6a6d5c75 (raised this wake, head:lead-forgent-261121-2110-compon-e8af7): the lead sat idle after landing 12b
  (6f28b99d2) with phase 12d `ready` and no wait. Typed the check-the-wait prompt plus "run 12d now"; `session type`
  left the text unsubmitted, a second type of a carriage return submitted it. The lead is working. Handled.

## Plans
- Running: 261121-2110-component-authority-doors only (leadLive true); 12d in progress, 12c draft (waits on 261122-2108).
- Admissible: none. leadsLive 1 of maxLeads 3; lanes free 4 of 4.

## Open owner questions
- q-ozu6l2ioxa (secretary soft rotation config): still open. `config patch` is now granted but every config write is
  refused for a confined session, so it still needs the owner.
- q-v7o5temdml (remove the p12b worktree): new.

## For the secretary (outside the doors plan's scope)
- `fgos run` from a lead head drops `--sync`, `--plan`, `--phase` and `--timeout` (the ticket argv lacks them), and a
  sync-only run is refused `bad-args`. Recorded in the doors plan note of 2026-11-24 10:55; no backlog item exists.
- Tooling friction: `fgos session type` does not submit its text; a separate `--text $'\r'` was needed.
