# Worker isolation — Phase 01 blocking question, first answer

Date: 2026-09-06 | Branch: `worker-isolation-herdr-socket` | herdr 0.8.2
Scripts: `env-probe.sh`, `socket-probe.sh` (both read-only w.r.t. fgOS state, no agent, no tokens)

## Question

Can a dispatched worker be prevented from driving the operator's herdr cockpit —
specifically, from listing and typing into the operator's own panes, including one
sitting at `awaiting-human`?

P7 (2026-09-06) established the danger and found two ways in: the `HERDR_SOCKET_PATH`
herdr injects into every pane it creates, and the `$HOME/.config/herdr/herdr.sock`
fallback the client uses when that variable is absent. The proposed fix was a private
HOME per Run. This measures whether that fix actually works.

## Measured

| # | Probe | Result | Meaning |
|---|---|---|---|
| A | `tab create --env HOME=<private>` | took effect | `--env` **does** work for a non-herdr variable, unlike `HERDR_*` |
| B | cockpit reachable from that pane | `COCKPIT=REACHABLE` | private HOME alone does **not** close the hole |
| C | same, with `HERDR_SOCKET_PATH` unset | `VIA_HOME_FALLBACK=BLOCKED` | private HOME **does** close the `$HOME` fallback — the fix works, for that path only |
| D | `--env HERDR_SOCKET_PATH=/nonexistent/herdr.sock` | pane reports `SOCKIS=/home/vantt/.config/herdr/herdr.sock` | herdr **overwrites** the variable with the real cockpit socket even when the override is non-empty |
| E | cockpit reachable with that bogus override | `COCKPIT_WITH_BOGUS_SOCK=REACHABLE` | follows from D |

C is also the indirect proof of A: had HOME stayed the operator's, C would have found
the real socket through the fallback and succeeded, exactly as P7 measured.

## Answer

**Half the fix works, and the half that does not cannot be fixed with environment
variables at all.**

- Private HOME closes the `$HOME/.config/herdr` fallback. Keep it — it is also the
  private-scratch that P00.1's Known Limitation already required for bwrap, so one
  mechanism settles two open problems.
- `HERDR_SOCKET_PATH` is injected by herdr and cannot be cleared or redirected through
  `--env`. Proven twice: empty value (P7) and non-empty bogus path (D here). As long as
  a worker runs in a pane of the operator's own herdr session, it can reach the cockpit.

So worker isolation is **not an environment problem, it is a session-topology problem**.
This supersedes the assumption written into Phase 01 R6, which treated a private HOME
as sufficient.

## Three real options, ranked by cost

1. **Separate herdr session for workers** (`herdr --session <name>`). The socket handed
   to a worker then belongs to a session containing only worker panes, so the operator's
   cockpit is not merely hidden but absent from that server's world. Cheapest, uses a
   feature herdr already ships. Unverified: whether a named session can be started
   headlessly without attaching a TUI, and whether `agent start` works across it.
2. **Mount namespace** (`bwrap`), binding nothing at the socket path. OS-level, does not
   depend on herdr behaviour, and P00.1 already proved the mount boundary holds. Its own
   known limitation — the agent CLI cannot initialise private state under a read-only
   mount — is exactly what the private HOME from C now answers.
3. **Separate OS user** for workers. Airtight, and the only option that also survives a
   worker that finds some other path to the socket. Heaviest by far: credentials, file
   ownership, and worktree permissions all become cross-user problems.

## What this changes

- Phase 01 R6 must be rewritten: private HOME is necessary but not sufficient, and the
  sufficiency argument moves to session topology.
- Until one of the three options is proven, `herdr-spawn`'s capability profile carries
  `unsafe: worker-can-drive-cockpit`, and the mechanism is not admissible for an
  executor the operator does not already trust.
- Phase 06's "worker thử vượt rào" case gets a concrete shape: from inside a worker
  pane, attempt `herdr pane list` and an actual write into an operator pane, and require
  both to fail.

## Not measured

- Whether a named herdr session can be created headlessly. Starting a second herdr
  server changes the operator's machine state, so it waits for an explicit decision.
- Whether `herdr agent start` behaves the same inside a non-default session.
- Whether an agent CLI actually starts and works with a private HOME — separate question
  from isolation, still open, and the reason Phase 01 keeps its own step 4.
