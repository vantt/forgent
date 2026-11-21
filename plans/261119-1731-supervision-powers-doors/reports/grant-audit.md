# Grant audit

Run 2026-11-21 on release 092224c3 in the fixture project `/home/vantt/projects/doors-audit-fixture` (empty portfolio, one
draft plan, a local bare remote, one trivial land gate), from two throwaway heads started by the supervisor:
`head:secretary-doors-audit-sec` and `head:supervisor-doors-audit-sup`. Each head ran its commands from its own sandbox
through the request socket. Commands are listed in `grant-audit-runbook.md`; grant source is `GRANTS` in
`src/session-host/head-grants.mjs`. Both heads were stopped at the end.

## Secretary head

| Power | Command | Exit | Result |
|---|---|---|---|
| supervisor queue | `supervisor queue --json` | 0 | `{"events":[]}` |
| supervisor plans | `supervisor plans --json` | 0 | lists the draft plan (after the fixture got a project id; the first call refused `project-id-missing`) |
| slots | `slots --json` | 0 | lane view returned |
| supervisor raise | `supervisor raise --kind coordination-chore ...` | 0 | event raised |
| supervisor wake | `supervisor wake --json` | 0 | `nothing-unhandled` (nothing to wake); the door is reachable from the sandbox |
| run | `run "print the word audit" --json` | 0 | ticket, read-only unit |
| run, writes outside a linked worktree | `run "x" --writes docs/x.md` | 1 | refused `writes-need-linked-worktree` |
| metrics record, coordination kind | subject as `{"kind","id"}` struct | 0 | written |
| metrics record, other kind | kind `fgos.other` | 1 | refused `kind-not-allowed` |
| backlog write (portfolio file) | `session write docs/backlog.md --base <blob>` | 0 | accepted and published (the fixture needed a git remote and one land gate first) |
| write outside the grant | `session write src/x` | 2 | refused `path-not-granted` |
| session stop of a live head | `session stop supervisor --name doors-audit-sup` | 0 | `stopped: true` |

## Supervisor head

| Power | Command | Exit | Result |
|---|---|---|---|
| supervisor raise | `supervisor raise --kind coordination-chore ...` | 0 | event raised |
| session read | `session read head:secretary-doors-audit-sec --lines 20` | 0 | screen lines returned |
| session type, no event | `session type ... --text "audit ping"` | 1 | refused `target-not-stuck` |
| session type, event naming the target | same, after an open event named it | 0 | typed; "audit ping" appeared on the target's screen |
| watcher tune arm and disarm | `watcher tune session-idle --arm`, `--disarm` | 0 | applied |
| watcher tune in bounds | `--set activeIntervalSec=30` | 0 | applied |
| watcher tune below the minimum | `--set activeIntervalSec=-5` | 1 | refused by the schema |
| run | `run "print the word audit" --json` | 0 | ticket |
| metrics record, coordination kind | `metrics record --json -` (records only from stdin) | 0 | written |
| metrics record, other kind | kind `fgos.other` | 1 | refused `kind-not-allowed` |
| metrics prune dry run and apply | `metrics prune`, `metrics prune --apply` | 0 | scanned 16, prunable 9 (the apply pruned 0: the prunable records were not yet old enough) |
| session stop of a non-live name | `session stop lead --name audit-nonexistent` | 0 | `stopped: false, not-live` |
| mailbox | `mailbox inbox`, `list`, `status` | 0 | answered |

## Findings

1. **`watcher tune` had no upper bound.** The audit set `activeIntervalSec` to 99999999, which stops the watcher, and the
   head could not undo it. Fixed: the watcher schema and its standard file now carry a maximum for every tunable key, and the
   verb test proves a value above the maximum is refused.
2. **`session type` could never reach a session a watcher event named.** A watcher event names a session by the agent CLI's
   own id without the machine part, while the gate compared the whole id and the handle. Fixed: the gate also matches the CLI
   id and the id after the machine part; the verb test proves it.
3. **Fixture needs.** A confined backlog write needs a git remote and at least one land gate in the project; a project
   without them refuses `write-catch-up-refused` or `write-not-published`. These are project setup, not grant failures.
4. **`peers` is a sandbox capability, not a verb** (the head keeps the host pid space and reads the session registry), so it
   has no command to run; `mailbox list` showed the live peer sessions.

## Not proven live, and why

- **Refusals of verbs a persona is not granted** (`supervisor handled`, `session read`, `session type`, `watcher tune`,
  `metrics prune` for the secretary): the secretary head declined to attempt them on a peer's request, since they are verbs
  its persona must never run. They are proven by the grant table in `test/session-host/head-grants.test.mjs`.
- **`stop-target-not-head`:** the fixture had no live non-head session to name; proven by the head-request test and the
  supervision verb test.
- **`--override` carrying a `tier` key:** the secretary and supervisor `run` started a ticket (exit 0, state running), so the
  runner accepted the request; the unit's tier was not read back.
- **Run ceiling refusal** (a longer `maxMinutes`): the CLI verb has no such flag; the ceiling is proven by the head-request
  test.
- **Reply size of a control-heavy screen:** not exercised.

No power was removed from the grant: every added power has a passing live proof or a named owning test above.
