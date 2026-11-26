# Phase 4 result: mail through the request socket

Phase 4 landed on main at da6d7c42e (branch `head-communication-agent-to-agent/p04b`, commits 33866f766 and
92365e661). Land gates passed: architecture, git-mutation-census, doc-health, decision-citation drift,
mailbox-behaviour, command-routes, fgos-manifest, `cargo fmt --check`, git one-door scan, command selectors.

## What landed

- `head-permissions.v1.json`: one `mailbox inbox` allow row on the base `head` persona (forwarded, not a read row).
- `apps/fgos/src/routing.rs`: the head window forwards `inbox` beside `send` (one arm and its existing test, per owner
  answer q-vqyxe5oi6j; footprint widened by the supervisor at dece50514).
- `head_request.rs`: the host child runs as the role holder Identity names for the envelope's role; its environment
  comes from `fgos_identity::launcher_env`, so the confined caller cannot name another head.
- `forwarder.rs`: a host verb's refusal code reaches the caller in every printed form found; bare `host-failed` only
  when the host printed nothing, naming the exit or signal; new code `host-output-unreadable` for output with no code.
- Tests: permissions (send and inbox per persona), forwarder (refusal forms), mailbox_routes (one confined send, one
  confined `inbox --claim` through a real listener). Worker run: 24 forwarder, 14 permissions, 54 mailbox_routes
  green, none ignored.

## How it went

- First unit (ticket c-2947, worktree `-p04`) stopped at the provider's output limit with an uncommitted partial diff.
  A second unit in a fresh worktree `-p04b` applied that diff and finished (c-5238).
- Review (reader subagent): no blocking findings; it could not run tests (build lock not writable from its sandbox).
- First land refused by the door check "writer and session id environment": head_request.rs named
  `FGOS_SESSION_ID` directly. Fix unit c-10446 moved it onto `launcher_env`; second land passed after two
  `merge-slot-busy` retries.

## Non-blocking review notes (not fixed, outside this phase's acceptance)

- head_request.rs ~1536: the mail caller's state root is read from the step env `FGOS_STATE_ROOT`, not kept in
  `Config`; if they ever differ the caller is looked up in the wrong directory.
- forwarder.rs ~549-556: the "provider failed:" match scans all of stdout when no JSON document is present, and the
  stderr `code: message` fallback accepts any code-shaped word (e.g. `config`).
- `host-output-unreadable` and the new fallback are not in any spec or CHANGELOG yet. Phase 6's brief now names them
  for the mailbox spec; the CHANGELOG line and the run-supervisor spec history are outside this plan's footprint.

## Leftovers

- Worktree `forgent-worktrees/261125-2313-head-communication-agent-to-agent-p04` holds the dead partial diff of
  c-2947; handed to the supervisor for removal.
