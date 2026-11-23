# Phase 3: Help channel and mail to the two hands

Capability: `code:implement`.

Builds PC-D5 (one help channel, Miu takes over) and PC-D8 (leads and planners mail the two hands and only them).

## Inputs

- The discussion, §4 PC-D1, PC-D5, PC-D8; §5 23:40 and 23:50; §6 "Kênh liên lạc".
- `packages/session-host/contracts/head-permissions.v1.json` and `packages/session-host/rust/src/permissions.rs`
  (the `args` limit on a flag's value) as phase 2 left them; this phase only adds rows, no Rust logic.
- `packages/run-supervisor/contracts/head-request.v1.json`: `supervisor raise` already accepts `coordination-help`.
- `core/skills/fgos-secretary/SKILL.md` "Start ritual" (the 15-minute tick) and `core/skills/fgos-supervisor/SKILL.md`,
  as phase 1 left them.
- `core/config-standard/secretary.yaml`, `core/config-schema/secretary.schema.yaml`.
- The mailbox send path: `fgos mailbox send` from a head with `mailbox: true` writes the record inside the sandbox
  (`docs/platform/agent-mailbox/spec.md`).

## Footprint

`packages/session-host/contracts/head-permissions.v1.json`, `packages/session-host/rust/tests/permissions.rs`,
`packages/session-host/rust/tests/forwarder.rs`,
`core/config-standard/secretary.yaml`, `core/config-schema/secretary.schema.yaml`,
`core/skills/fgos-secretary/SKILL.md`, `core/skills/fgos-supervisor/SKILL.md`, regenerated `.agents/skills/**`,
`plugins/fgOS/skills/**`, `.claude/skills/**`, `docs/platform/supervision/spec.md`.

## Decisions taken in this phase (planner's, within PC-D8)

- A recipient limit cannot be enforced where the sandbox writes the mail record itself. So lead and planner do **not**
  get the writable mailbox binding for sending: their send goes through the window as the argv
  `fgos mailbox send --to <role>` with a table row whose `args` limit allows it only when `--to` is a
  `head:secretary-*` or `head:supervisor-*` role (any other recipient: `deny`, code `recipient-not-allowed`). Receiving keeps today's
  delivery path; if a lead or planner cannot read its inbox without the writable binding, bind the inbox read-only and
  say so in the commit. The `mailbox: true` flag stays only for the personas that already hold it.

## Steps

1. Table rows: `supervisor raise` for the `head` base persona, so every persona inherits it; an `args` limit holds
   it to the `coordination-help` kind for personas below the supervisor. The mail row for
   lead and planner as decided above.
2. Config: add `secretary.help.staleMinutes` (minutes a `coordination-help` event may stay unhandled before Miu takes
   over; default 30, minimum 5) to `core/config-standard/secretary.yaml` and its schema. No default anywhere else.
3. Secretary skill, Start ritual tick: two more checks after the existing ones, in order:
   1. Is a supervisor head alive? (`fgos supervisor queue --json` / `slots` say so; no new verb.)
   2. Is a `coordination-help` event older than `secretary.help.staleMinutes`?
   If either is true, she takes over (PC-D1): wakes or starts the supervisor (`supervisor wake`, `session start`), and
   if it still does not come up, handles the waiting help events herself through the window, then reports to the owner
   in one batch. Name the stop condition: the supervisor is live and the help queue has nothing past the threshold.
4. Supervisor skill: help events are an input of every wake; how to answer one (act through the window, or file an
   owner question when the table says `ask`).
5. `docs/platform/supervision/spec.md`: one line in the charter section that the threshold key exists.
6. Tests: extend `packages/session-host/rust/tests/permissions.rs` (every persona holds `supervisor raise`; lead and
   planner mail rows) and `tests/forwarder.rs` (a planner's `coordination-help` raise is allowed; another kind from a
   planner is refused; a lead's mail to `head:supervisor-x` is allowed and to `head:lead-y` is refused
   `recipient-not-allowed`).
7. `npm run build:skills`.

## Verify

```bash
cargo test -p fgos-session-host
npm run build:skills
node --test test/config
```

Pass: green, and the build leaves no diff on a second run. The live proof (a shaper and a planner raise help, a lead
mails the supervisor) is a row of phase 7's probe.

## Rollback

`git revert` the phase's commits and rerun `npm run build:skills`.
