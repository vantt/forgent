# Head grant probe: before and after

Probe: `node test/live/head-grant-probe.live.mjs`, run live inside confined heads (phase 7, acceptance criterion 3).

## Before (old release, before the owner's activation of `sha256:3beba73a...`)

### supervisor (`head:supervisor-forgent`)

Source: `reports/head-grant-probe-before-supervisor.txt` (copied from `.fgos/assignments/head-supervisor-forgent-704/runs/01/outbox/`) (stop trace 2026-11-25T09:45:56.123Z). 31 contract verbs. The old release has no `can-i` (every row's `canI` is `unknown`)
and no `release run` verb, so its row reads "no planned call"; the after table carries the planned call.

| verb | expected | observed | code or reason |
|---|---|---|---|
| session start | refused as expected | served | persona-not-found |
| session rotate | not called | not called: acts on the caller | acts on the caller |
| session restore role | not called | not called: acts on the caller | acts on the caller |
| questions ask | refused as expected | served | parts-incomplete |
| questions ack | refused as expected | served | question-unknown |
| questions cancel | refused as expected | served | question-unknown |
| questions answer | refused as expected | refused as expected | verb-not-granted |
| session bind session | not called | not called: acts on the caller | acts on the caller |
| session write | refused as expected | served | path-not-granted |
| session answered | not called | not called: acts on the caller | acts on the caller |
| land | refused as expected | served | path-outside-grant |
| run | refused as expected | served | writes-need-linked-worktree |
| release run | refused as expected | failed | no planned call for verb: release run |
| request result | refused as expected | served | ticket-unknown |
| worktree create | refused as expected | refused as expected | verb-not-granted |
| session stop | refused as expected | served | stop-target-not-head |
| supervisor done | not called | not called: acts on the caller | acts on the caller |
| metrics record | refused as expected | served | kind-not-allowed |
| questions list | refused as expected | served | done |
| supervisor handled | refused as expected | served | event-unknown |
| supervisor queue | refused as expected | served | done |
| supervisor plans | refused as expected | served | done |
| slots | refused as expected | served | done |
| supervisor wake | not called | not called: unsafe: takes no args, always records a wake, may mark events handled and may start a supervisor head | unsafe: takes no args, always records a wake, may mark events handled and may start a supervisor head |
| supervisor raise | refused as expected | served | bad-args |
| watcher tune | refused as expected | failed | host-failed |
| session read | refused as expected | served | session-not-found |
| session type | refused as expected | served | session-not-found |
| metrics prune | refused as expected | served | done |
| friction record | refused as expected | served | friction-invalid-input |
| config patch | refused as expected | failed | patch-invalid |

### secretary (`head:secretary-miu`)

Source: `reports/head-grant-probe-before-secretary.txt` (stop trace 2026-11-25T09:51:32.588Z, started before the
switch). 31 contract verbs; every `canI` is `unknown` (the old CLI has no `can-i`).

| verb | expected | observed | code or reason |
|---|---|---|---|
| session start | refused as expected | served | persona-not-found |
| session rotate | not called | not called | acts on the caller |
| session restore role | not called | not called | acts on the caller |
| questions ask | refused as expected | served | parts-incomplete |
| questions ack | refused as expected | served | question-unknown |
| questions cancel | refused as expected | served | question-unknown |
| questions answer | refused as expected | served | question-unknown |
| session bind session | not called | not called | acts on the caller |
| session write | refused as expected | served | path-not-granted |
| session answered | not called | not called | acts on the caller |
| land | refused as expected | served | path-outside-grant |
| run | refused as expected | served | writes-need-linked-worktree |
| release run | refused as expected | failed | no planned call for verb: release run |
| request result | refused as expected | served | ticket-unknown |
| worktree create | refused as expected | refused as expected | verb-not-granted |
| session stop | refused as expected | served | stop-target-not-head |
| supervisor done | not called | not called | acts on the caller |
| metrics record | refused as expected | served | kind-not-allowed |
| questions list | refused as expected | served | done |
| supervisor handled | refused as expected | refused as expected | verb-not-granted |
| supervisor queue | refused as expected | served | done |
| supervisor plans | refused as expected | served | done |
| slots | refused as expected | served | done |
| supervisor wake | not called | not called | unsafe |
| supervisor raise | refused as expected | served | bad-args |
| watcher tune | refused as expected | refused as expected | verb-not-granted |
| session read | refused as expected | refused as expected | verb-not-granted |
| session type | refused as expected | refused as expected | verb-not-granted |
| metrics prune | refused as expected | refused as expected | verb-not-granted |
| friction record | refused as expected | served | friction-invalid-input |
| config patch | refused as expected | refused as expected | verb-not-granted |

## After (new release `sha256:3beba73a...`, activated 2026-11-25T10:08:35Z)

Every after head started after the switch: supervisor gen 706 at 10:24:51Z (its stop-trace line of 10:06Z is gen 705's,
in the shared role directory), secretary `probe-secretary` at 10:29:01Z, lead gen 11 at 10:28:33Z, planner and shaper `ds-ti2vip43kp` (per the supervisor's note). In all five,
`can-i` answers `allow`, `ask` or `deny` for every called row.

Rows still failing on this release, and their cause (fix unit `c-5306-1795602696264`, branch
`heads-operate-without-owner/p07-fix`):

- `release run` (all five): a real gap. `release` has no entry in `packages/host-runtime/contracts/command-routes.json`,
  so the host never reaches the head-socket mapping in `apps/fgos/src/routing.rs` and falls to the Node payload
  (`unknown verb "release"`, exit 4). The routing tests call `call()` directly and skip the route lookup.
- `watcher tune` (supervisor, secretary) and `friction record` (all five): domain refusals (`watcher.enabled` not tunable, invalid disposition) whose code
  the forwarder drops: the host prints `provider failed: <code>: ...` and the window answers `host-failed`. Before the
  switch `friction record` answered `friction-invalid-input` (served).
- Not in the probe rows, found by the lead: the installed `fgos` shell function appends `--dir <root>` to every command,
  and the window refuses `--dir`, so every `can-i` and every forwarded verb typed in a head's shell answers
  `argv-not-allowed` (the probe spawns the binary directly and does not see it). Same fix unit.

Step 4 rows (2026-11-25, lead gen 11 on the new release, binary called directly):

| row | argv | can-i | observed |
|---|---|---|---|
| planner raises `coordination-help` | `supervisor raise --kind coordination-help ...` | - | raised, event `f7cba5c708783b7a` (`reports/help-raise-planner.json`) |
| shaper raises `coordination-help` | `supervisor raise --kind coordination-help ...` | - | raised, event `6d8505b3d2d31846` (`reports/help-raise-shaper.json`) |
| lead mails the supervisor | `mailbox send --to head:supervisor-forgent <body>` | allow | recorded `fa44fff29e490178` |
| lead mails another lead | `mailbox send --to head:lead-forgent-261125-1556-event-3bf82 <body>` | deny | refused `recipient-not-allowed` |
| `can-i`, an allow | `questions` | allow | - |
| `can-i`, an ask | `slots` (lead) | ask: no row matches | - |
| `can-i`, a deny | `config patch .fgos/config.yaml` | deny: the patch file may not live under `.fgos` | - |

Both help raises were first refused `argv-not-allowed` through plain `fgos` (the shell function's `--dir`), the same
gap as above; `command fgos` raised them. A planner or shaper start refuses a name with no discussion directory and a
name over 32 characters; the probe heads were named after the done discussion `ds-ti2vip43kp`.

### supervisor (`head:supervisor-forgent`, gen 706)

Source: `reports/head-grant-probe-after-supervisor.txt` (copied from `.fgos/assignments/head-supervisor-forgent-706/runs/01/outbox/`).

| verb | can-i | expected | observed | code or reason |
|---|---|---|---|---|
| session start | allow | served | served | persona-not-found |
| session rotate | - | not called | not called | acts on the caller |
| session restore role | - | not called | not called | acts on the caller |
| questions ask | allow | served | served | parts-incomplete |
| questions ack | allow | served | served | question-unknown |
| questions cancel | allow | served | served | question-unknown |
| questions answer | deny | refused as expected | refused as expected | verb-not-granted |
| session bind session | - | not called | not called | acts on the caller |
| session write | allow | served | served | path-not-granted |
| session answered | - | not called | not called | acts on the caller |
| land | allow | served | served | path-outside-grant |
| run | allow | served | served | writes-need-linked-worktree |
| release run | allow | served | failed | exit-4 |
| request result | allow | served | served | ticket-unknown |
| worktree create | ask | asked | asked (not called) |  |
| session stop | allow | served | served | stop-target-not-head |
| supervisor done | - | not called | not called | acts on the caller |
| metrics record | allow | served | served | kind-not-allowed |
| questions list | allow | served | served | done |
| supervisor handled | allow | served | served | event-unknown |
| supervisor queue | allow | served | served | done |
| supervisor plans | allow | served | served | done |
| slots | allow | served | served | done |
| supervisor wake | - | not called | not called | unsafe |
| supervisor raise | deny | refused as expected | refused as expected | verb-not-granted |
| watcher tune | allow | served | failed | host-failed |
| session read | allow | served | served | session-not-found |
| session type | allow | served | served | session-not-found |
| metrics prune | allow | served | served | done |
| friction record | allow | served | failed | host-failed |
| config patch | deny | refused as expected | refused as expected | verb-not-granted |

### secretary (`head:secretary-probe-secretary`)

Source: `reports/head-grant-probe-after-secretary.txt` (copied from `.fgos/assignments/head-secretary-probe-secretary-1/runs/01/outbox/`).

| verb | can-i | expected | observed | code or reason |
|---|---|---|---|---|
| session start | allow | served | served | persona-not-found |
| session rotate | - | not called | not called | acts on the caller |
| session restore role | - | not called | not called | acts on the caller |
| questions ask | allow | served | served | parts-incomplete |
| questions ack | allow | served | served | question-unknown |
| questions cancel | allow | served | served | question-unknown |
| questions answer | allow | served | served | question-unknown |
| session bind session | - | not called | not called | acts on the caller |
| session write | allow | served | served | path-not-granted |
| session answered | - | not called | not called | acts on the caller |
| land | allow | served | served | path-outside-grant |
| run | allow | served | served | writes-need-linked-worktree |
| release run | allow | served | failed | exit-4 |
| request result | allow | served | served | ticket-unknown |
| worktree create | ask | asked | asked (not called) |  |
| session stop | allow | served | served | stop-target-not-head |
| supervisor done | - | not called | not called | acts on the caller |
| metrics record | allow | served | served | kind-not-allowed |
| questions list | allow | served | served | done |
| supervisor handled | allow | served | served | event-unknown |
| supervisor queue | allow | served | served | done |
| supervisor plans | allow | served | served | done |
| slots | allow | served | served | done |
| supervisor wake | - | not called | not called | unsafe |
| supervisor raise | deny | refused as expected | refused as expected | verb-not-granted |
| watcher tune | allow | served | failed | host-failed |
| session read | allow | served | served | session-not-found |
| session type | allow | served | served | session-not-found |
| metrics prune | allow | served | served | done |
| friction record | allow | served | failed | host-failed |
| config patch | deny | refused as expected | refused as expected | verb-not-granted |

### lead (`head:lead-forgent-261124-0004-heads-1bb1c`, gen 11)

Source: `reports/head-grant-probe-after-lead.txt`. A lead's `supervisor raise` row uses an invalid kind on purpose and is
refused; `can-i supervisor raise --kind coordination-help --ref plan:x --reason x` answers `allow`.

| verb | can-i | expected | observed | code or reason |
|---|---|---|---|---|
| session start | ask | asked | asked (not called) |  |
| session rotate | - | not called | not called | acts on the caller |
| session restore role | - | not called | not called | acts on the caller |
| questions ask | allow | served | served | parts-incomplete |
| questions ack | allow | served | served | question-unknown |
| questions cancel | allow | served | served | question-unknown |
| questions answer | deny | refused as expected | refused as expected | verb-not-granted |
| session bind session | - | not called | not called | acts on the caller |
| session write | ask | asked | asked (not called) |  |
| session answered | - | not called | not called | acts on the caller |
| land | allow | served | served | path-outside-grant |
| run | allow | served | served | write-outside-footprint |
| release run | deny | refused as expected | failed | exit-4 |
| request result | allow | served | served | ticket-unknown |
| worktree create | allow | served | served | worktree-create-failed |
| session stop | ask | asked | asked (not called) |  |
| supervisor done | - | not called | not called | acts on the caller |
| metrics record | ask | asked | asked (not called) |  |
| questions list | allow | served | served | done |
| supervisor handled | ask | asked | asked (not called) |  |
| supervisor queue | ask | asked | asked (not called) |  |
| supervisor plans | ask | asked | asked (not called) |  |
| slots | ask | asked | asked (not called) |  |
| supervisor wake | - | not called | not called | unsafe |
| supervisor raise | deny | refused as expected | refused as expected | verb-not-granted |
| watcher tune | ask | asked | asked (not called) |  |
| session read | ask | asked | asked (not called) |  |
| session type | ask | asked | asked (not called) |  |
| metrics prune | ask | asked | asked (not called) |  |
| friction record | allow | served | failed | host-failed |
| config patch | deny | refused as expected | refused as expected | verb-not-granted |

### planner (`head:planner-ds-ti2vip43kp`)

Source: `reports/head-grant-probe-after-planner.txt`.

| verb | can-i | expected | observed | code or reason |
|---|---|---|---|---|
| session start | ask | asked | asked (not called) |  |
| session rotate | - | not called | not called | acts on the caller |
| session restore role | - | not called | not called | acts on the caller |
| questions ask | allow | served | served | parts-incomplete |
| questions ack | allow | served | served | question-unknown |
| questions cancel | allow | served | served | question-unknown |
| questions answer | deny | refused as expected | refused as expected | verb-not-granted |
| session bind session | - | not called | not called | acts on the caller |
| session write | ask | asked | asked (not called) |  |
| session answered | - | not called | not called | acts on the caller |
| land | allow | served | served | path-outside-grant |
| run | ask | asked | asked (not called) |  |
| release run | deny | refused as expected | failed | exit-4 |
| request result | allow | served | served | ticket-unknown |
| worktree create | ask | asked | asked (not called) |  |
| session stop | ask | asked | asked (not called) |  |
| supervisor done | - | not called | not called | acts on the caller |
| metrics record | ask | asked | asked (not called) |  |
| questions list | allow | served | served | done |
| supervisor handled | ask | asked | asked (not called) |  |
| supervisor queue | ask | asked | asked (not called) |  |
| supervisor plans | ask | asked | asked (not called) |  |
| slots | ask | asked | asked (not called) |  |
| supervisor wake | - | not called | not called | unsafe |
| supervisor raise | deny | refused as expected | refused as expected | verb-not-granted |
| watcher tune | ask | asked | asked (not called) |  |
| session read | ask | asked | asked (not called) |  |
| session type | ask | asked | asked (not called) |  |
| metrics prune | ask | asked | asked (not called) |  |
| friction record | allow | served | failed | host-failed |
| config patch | deny | refused as expected | refused as expected | verb-not-granted |

### shaper (`head:shaper-ds-ti2vip43kp`)

Source: `reports/head-grant-probe-after-shaper.txt`.

| verb | can-i | expected | observed | code or reason |
|---|---|---|---|---|
| session start | ask | asked | asked (not called) |  |
| session rotate | - | not called | not called | acts on the caller |
| session restore role | - | not called | not called | acts on the caller |
| questions ask | allow | served | served | parts-incomplete |
| questions ack | allow | served | served | question-unknown |
| questions cancel | allow | served | served | question-unknown |
| questions answer | deny | refused as expected | refused as expected | verb-not-granted |
| session bind session | - | not called | not called | acts on the caller |
| session write | ask | asked | asked (not called) |  |
| session answered | - | not called | not called | acts on the caller |
| land | allow | served | served | path-outside-grant |
| run | ask | asked | asked (not called) |  |
| release run | deny | refused as expected | failed | exit-4 |
| request result | allow | served | served | ticket-unknown |
| worktree create | ask | asked | asked (not called) |  |
| session stop | ask | asked | asked (not called) |  |
| supervisor done | - | not called | not called | acts on the caller |
| metrics record | ask | asked | asked (not called) |  |
| questions list | allow | served | served | done |
| supervisor handled | ask | asked | asked (not called) |  |
| supervisor queue | ask | asked | asked (not called) |  |
| supervisor plans | ask | asked | asked (not called) |  |
| slots | ask | asked | asked (not called) |  |
| supervisor wake | - | not called | not called | unsafe |
| supervisor raise | deny | refused as expected | refused as expected | verb-not-granted |
| watcher tune | ask | asked | asked (not called) |  |
| session read | ask | asked | asked (not called) |  |
| session type | ask | asked | asked (not called) |  |
| metrics prune | ask | asked | asked (not called) |  |
| friction record | allow | served | failed | host-failed |
| config patch | deny | refused as expected | refused as expected | verb-not-granted |

## Gaps between the permission table and real use (owner order, 2026-11-25)

1. `release run` is `allow` for the supervisor and the secretary, and the `release.*` recipe is now in
   `.fgos/config.yaml` (`apply` `fgctl upgrade`, `probe` `node test/live/head-grant-probe.live.mjs`, `rollback`
   `fgctl repair`, `reversible: true`; `checks` `npm test`, `cargo test --workspace`). On release `3beba73a` every fresh
   head answers `fgos: unknown verb "release"` (exit 4), so no supervisor can release yet. **Fixed in this plan:**
   `e36f10cfa` registers the `release` route so a head's call reaches its request socket (the five after tables above
   are the evidence of the gap). It takes effect on the first release that contains `e36f10cfa`, which must be built
   and activated by hand (owner question `q-l3rskjibl3`), because the release door itself is the broken path.
2. `session stop` is `allow` for the supervisor, but when the stopped head's request socket is already gone it ends
   `stop-not-ended` (`src/session-host/head-stop.mjs:58`, "did not end within ... of its stop request"), and the head
   ends only by SIGTERM from the unconfined session (owner report, 2026-11-25, the probe heads; the supervisor's
   requests are `supervisor.log` lines 110, 137 and 145 of `head-supervisor-forgent-706`). **Filed as backlog row
   `p-nyhaakrsvz`** (id minted; the supervisor writes the row, event below). `git recover` is `allow`, but only the
   writer that started a chain can settle it (`land-authority-mismatch`, "only its writer can recover"): **already
   filed as `p-o4juyw2ntg`**, whose 2026-11-25 update carries the evidence (9 dead-writer land candidates, 46 GB, disk
   full at about 14:08). Neither is in this plan's footprint: `session stop` is session-host's stop door and
   `git recover` is the git component's.

## Heads started before the switch

The before rows come from heads whose CLI and run supervisor were both the old release (`can-i` unknown). No probe
row comes from a head that lived across the switch (old run supervisor, new CLI), so whether an old run supervisor
answers the `can-i` frame is not proven by these files. After an activation, every head is rotated before it relies
on the window.
