---
phase: 1
title: "V7a: Codex Stop channel off"
status: pending
sub_rung: V7a
depends_on: [V6 closed and the worktree handed over]
live_budget: "1 benign run of the V5 live suite's C1 (no approval needed)"
---

# Phase 1: Codex Stop channel off (V7a)

## Context

V6 stage A: the Codex `Stop` block reason reaches the model as a `user`-role message and harmful requests were acted on 10 of 35 times; `PostToolUse` context arrives as `developer`, 0 of 35 (plan F1, F2). Owner 14:08: turn Codex delivery at `Stop` off right after V6, keep `PostToolUse`, and say truthfully that a Codex recipient has no wake channel.

## Requirements

1. `adapters.v1.json` `hookFacts.<cli>.channels = {stop: {deliver, role, source}, postToolUse: {deliver, role, source}}` for `claude` and `codex` (plan decision 1). Codex `stop.deliver = false`, `role = "user"`, source the V6 preparation report; `postToolUse.deliver = true`, `role = "developer"`. Claude Code roles are the transcript record types, labelled as such. Loader rule: a `deliver: true` channel with role `user` is refused at load.
2. Drain (`store/src/hook/drain.rs` `begin`): at `Stop`, for a CLI whose `stop.deliver` is false, after registration and **before** the first-Stop `note_stop` and the Stop-block cap check, return quiet `StopChannelOff` (benign: no outcome-log line, no breaker count, `state_changed` only when it registered). The Stop-block count is never read or written for that CLI.
3. `send` reads the recipient's `stop.deliver` next to its version and passes `stop_drains: bool` into the core (unknown CLI: `false`). With `stop_drains` false, effective wake is false and **no** exchange quota or wake lifetime count is spent (plan decision 2).
4. Frame contract `frame.v1.txt` gains `[report.turn.no-stop]` ("queued: it sees it at its next tool call. This CLI takes no mail when its turn ends, so an idle session sees it only when it next runs a tool.") and `[report.wake-no-channel]` ("Its CLI has no channel that can wake it; the wake was not used.").
5. The V5 live suite's `C1` case (`test/live/mailbox-claude.live.mjs`) expects no frame at Codex's Stop and the two sentences above; its Stop-gate check is retired with the behaviour (the owning proof is T1).
6. Spec on the branch: §6.1 (Stop drain per channel fact), §6.2 tier table (Codex `turn`, Stop off, reason), §7.3 (roles), §11 (C1's checks), §14 (V7a row), §17 (decision row).

## Tests first (one owning proof each)

| # | Behaviour (test title) | File | Fails before because |
|---|---|---|---|
| T1 | a Codex Stop with eligible wake mail claims nothing and is quiet StopChannelOff | `store/tests/hook_payloads.rs` (recorded `codex/stop.json`) | Stop drains today |
| T2 | a first Codex Stop registers the head and claims nothing | same | guards that registration is kept |
| T3 | a Codex binding that already holds Stop blocks answers StopChannelOff and keeps its count | same | the cap check runs first today |
| T4 | a send with wake to a recipient whose CLI has no Stop drain records effective wake false and spends no exchange quota or wake lifetime count | `core/tests/delivery.rs` | quota spent today |
| T5 | mail recorded with effective wake for a Codex head before the change is claimed at its next PostToolUse | `core/tests/delivery.rs` | guards old records |
| T6 | the report for a recipient with no Stop drain never says "when its turn ends" and names the unused wake | `core/tests/report.rs` | sentences absent |
| T7 | the contract lists both channel facts for every drained CLI and refuses a delivering channel whose role is user | `store/tests/adapters.rs` | field absent |
| T8 | `fgos mailbox send --wake` to a Codex head answers with the no-stop and no-wake sentences | `apps/fgos/tests/mailbox_routes.rs` (one wiring proof) | — |

Mutants: drop the `stop.deliver` read (T1 fails); move the check after the cap (T3 fails); spend the quota before the path check (T4 fails).

## Steps

1. Sync: `cd /home/vantt/projects/forgent-mailbox || exit 1` then `git fetch origin && git merge --no-edit origin/main`; `free -g` ≥ 8.
2. Write T1-T8 failing; `CARGO_BUILD_JOBS=4 cargo test -p fgos-mailbox-core -p fgos-mailbox -p fgos -- --test-threads=4`, record the failures.
3. Contract fields and loader, drain rule, core input and report sections, `C1` expectations.
4. Green on the same command.
5. Live, benign, through the private shim and release: `node test/live/mailbox-claude.live.mjs run C1 --dry` against the stub, then once for real, foreground under `timeout`, teed to `${TMPDIR:-/tmp}/fgos-work/mailbox-v7/c1.log`, `echo "exit=$?"`. No retry. (The V6 behaviour harness is not used here: its frozen file set includes `frame.v1.txt`, phase 5 gives V7 its own harness home.)
6. Spec edits; report name from `fgos convention path --kind report --type research --slug mailbox-v7a-codex-stop-off --json`; `fgos convention check --dir . -- <report>`; sync; board line "V7a landed on the branch".

## Acceptance

- T1-T8 green on a fresh merge; mutants killed.
- `C1`'s rollout shows no `<hook_prompt>` record carrying a frame, and the frame offered at a `PostToolUse` (`developer`).
- `adapters.v1.json` is the only place that knows Codex's Stop is off.

## Risks and rollback

- A Codex head that only waits (no tool call) never sees mail: stated in the report sentence and spec §6.2; phase 10 measures the wake channels.
- Rollback: revert the phase's commits; there is no switch.
