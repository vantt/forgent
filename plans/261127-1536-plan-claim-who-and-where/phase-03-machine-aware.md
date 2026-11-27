# Phase 3: Machine-aware admission and watching

Decisions D2, D4, D8 and D9 of
[ds-izibwo45vm](../discussions/ds-izibwo45vm-plan-claim-who-and-where/DISCUSSION.md). Needs phase 2 (`Plan.host`,
`placement`, the new `admitted_text` signature).

## Inputs

- `packages/supervision/rust/src/wake.rs` `admit_ready` (hold reasons, `ports.admission.admit`, `Ports`) and the
  `Admission` and `Identity` traits.
- `packages/supervision/rust/src/supervisor.rs` (the `supervisor plans` view: `lead_live`, `lead_unnamed`,
  `leadLive`/`leadUnnamed` JSON).
- `packages/supervision/rust/src/keeper.rs` `decide` and `NeedKind::Role`; find whether a keeper role need can ever
  resolve to a `head:lead-*` role of a running plan, and from which wiring in `apps/fgos/src/wiring/supervision.rs`.
- `apps/fgos/src/wiring/supervision.rs` `HostAdmission::admit` and `HostIdentity`.
- `core/skills/fgos-supervisor/SKILL.md` (restart only a running plan whose `leadLive` is `false`),
  `core/skills/fgos-secretary/SKILL.md` (portfolio lands), `domains/coding/skills/fgos-coding-planning/SKILL.md`
  ("No claimed item: the plan path").

## Files it may write

`packages/supervision/rust/src/supervisor.rs`, `packages/supervision/rust/src/wake.rs`,
`packages/supervision/rust/tests/wake.rs`, `packages/supervision/rust/src/keeper.rs`,
`packages/supervision/rust/tests/keeper.rs`, `apps/fgos/src/wiring/supervision.rs`,
`core/skills/fgos-supervisor/SKILL.md`, `core/skills/fgos-secretary/SKILL.md`,
`domains/coding/skills/fgos-coding-planning/SKILL.md`,
`plans/261127-1536-plan-claim-who-and-where/reports/keeper-lead-start.md`.

## Steps

1. Give the wake ports this machine's Identity machine id, read by the adapter the same way phase 2's
   `HostAdmission::admit` reads it (reuse that read, do not copy it). A missing id admits nothing.
2. `admit_ready`: before capacity, a ready plan whose `placement` answers `held-other-machine:<host>` is held with
   that reason. It is not a judgement case and is not raised.
3. `supervisor plans` view: a running plan with `host` equal to M is unchanged (`leadLive`). A running plan whose
   `host` is another machine carries `runningElsewhere: <host>`, no `leadLive`, and is not counted in `leadsLive`. A
   running plan with no `host` is M's only while its lead is live here. Otherwise it carries `hostUnnamed: true` and
   no `leadLive: false`, so the supervisor never restarts it. The wake raises it once for judgement, through the
   same raise path `leadUnnamed` uses.
4. Keeper: if the reading of `keeper.rs` and its wiring (Inputs) shows a role need can start a `head:lead-*` role, refuse that start when the role's
   plan runs elsewhere or is `host-unnamed`. If it cannot, record that finding in
   `reports/keeper-lead-start.md` and leave `keeper.rs` untouched.
5. Skills: the supervisor restarts only `leadLive: false` (unchanged wording) and never acts on `runningElsewhere`
   or `hostUnnamed` beyond reporting. The secretary may set or change `host` on a `ready` plan through its
   `land --paths` of `plan.md`, never on a `running` one. The planner writes `host: <machine id>` only when the
   discussion or the owner names a machine.
6. Tests in `tests/wake.rs`: held-other-machine for a ready plan pinned elsewhere; a ready plan pinned here and an
   unpinned one are admitted with `host` written; a running plan elsewhere is never started, even with its lead not
   live here; a running plan with no `host` and no live lead is held `host-unnamed` and raised, never started.

## Verify

`cargo test -p fgos-supervision --test wake`, `cargo test -p fgos-supervision --test keeper` and
`cargo test -p fgos --test supervision_verbs`.

## Rollback

Revert the phase commit. Admission then ignores `host` again, and plans already admitted keep a harmless `host` key.
