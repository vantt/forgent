# lead:SUPERVISOR handoff, 2026-11-22 22:50 (+07)

You are the manual project supervisor (`lead:SUPERVISOR`, owner-facing, Vietnamese, "anh/em", ≤10 lines, outcome first,
open questions last). Read `plans/handoffs/lead-supervisor-handoff-20261122-2105.md` for the standing duties (babysit
every ~30 min, never re-ask settled questions, delete-approval groups, push routine, config.yaml owner lines, disk).
This file only records what changed since then. The previous session (claude-ojhz, forgent-claude-4d) handed off
because its account `vantt` reached 97% of its weekly quota.

First steps:
1. `fgos identity session --role lead:SUPERVISOR --take`, then tell lead:OPC (forgent-67, SendMessage) your handle.
2. Set a CronCreate babysit tick (e.g. `17,47 * * * *`).
3. Set a one-shot CronCreate for 00:07 on 2026-11-23: re-enable claude tetcu (see "Accounts" below).

## Accounts (owner, 22:25-22:47)
- claude `tetcu` hit its weekly quota; it resets 2026-11-23 00:00 +07. It is **disabled** in
  `~/.fgos/private/accounts.yaml` (`fgos config set runner.llmAccounts.claude.tetcu.disabled true`, reason recorded)
  and quarantined until 00:05. After 00:00 run `fgos config unset runner.llmAccounts.claude.tetcu.disabled --reason
  "weekly quota reset"` and check `fgos dispatch inspect --provider-capacity`.
- claude `vantt` (the owner's own login used by manual sessions) is at 97% weekly. Usable pool accounts:
  `anhdvh`, `van.tran`.
- Bug to put in the backlog (via Miu): a head launch's seat ranking picked quarantined `tetcu` anyway (rotation refused
  `provider-capacity.lease-conflict ... is quarantined`, `.fgos/runtime/session-rotation/secretary-miu/rotation.log`
  line 43). `packages/seat-binding/rust/src/rank.rs` filters `quarantined_until`, so the account view fed to head
  launches likely lacks the quarantine. Disabling the account worked around it.

## Done tonight
- Release 0844a0a4 then **f75c3a69** active on fg-server2 (OPC). f75c3a69 is built from 245635f84 and carries the
  DOCOS recover fix and heads-stable p12c (lead successor answers in its first turn).
- **Miu** rotated twice: gen 30 onto the claude pool (tetcu), gen 32 onto `anhdvh` at 22:3x. Her head name is
  `head:secretary-miu` (mailbox: `fgos mailbox send --to head:secretary-miu`).
- **Heads-stable lead** (plan 261122-0118): gen 7 was a stop+start by the automated supervisor after my first rotation
  failed no-answer; gen 8 is a real soft rotation on f75c3a69 (`rotation.log`: rotated true, gen 8, oldEnded true) and
  the lead recorded it as phase 12 done-when item 3. Phase 9 measure ends 14:20 and phases 8/10 at 21:06 on
  2026-11-23; phase 11 runs after that. Pane at handoff: tab "lead: heads-stable-and-able".
- **DOCOS**: docos/build-order-locate-first landed 7aa3206d7; docos/recover-effect-present (OPC approved) landed
  245635f84. DOCOS confirmed on design-lap (release 13e90ba1) that `fgos git recover` cleared
  land-1103502-…-8. Still kept on design-lap and not ours: fe6b3535 (land-authority-mismatch, writer 937399ff…); OPC
  says it is not OPC's either, the design-lap operator must find that writer.
- Miu's question for DOCOS (component-authority boundary) was sent as mail f461aba0777c87a1; DOCOS answered and the
  planner recorded it (6c2e0833f).
- Planners run and stopped: p-24xw2cwdvo → plan 261122-2108-delete-dead-node-execution-closure (draft, blocked by 0118
  and 1950); coach → 261122-2110-coach-agent-and-observe-views (draft); component-authority refreshed (draft, waits on
  three newer plans, c89a56a3c); orchestration-skeleton planner also ran. Coach shaper stopped.
- Worktrees removed: heads-stable p12c, p02g, p06f. **Kept** p02 and p06: uncommitted edits and no land commit on main;
  asked the lead to confirm they are superseded before removal.

## Open items
- Planners report: nothing flips a blocked draft to ready when its blockers finish; `plan-contract-check.mjs` ignores
  `blockedBy` and cannot build inside a confined head; `fgos friction record` rejects `plan:<dir>` subjects. Sent to
  Miu for backlog rows.
- Coach shaper flagged: plan 1950 (owner-communication-standard) copies the owner's words verbatim into friction
  records, which are git-tracked and reach GitHub. Sent to Miu to route to 1950 before it runs.
- Heads-stable lead finding: the friction verb puts its refusal code only in the message text.
- Cross-machine mail fg-server2 → design-lap still unreliable (tsk-p2gcmfkwzv); relay DOCOS through the owner.

## Open owner questions
- None from me.
