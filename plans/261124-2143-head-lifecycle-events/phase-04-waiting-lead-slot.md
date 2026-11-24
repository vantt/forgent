# Phase 4: A lead waiting outside does not hold a working slot

Closes `p-tyowvhthul` in code. **Blocked** on the owner question listed in `plan.md` (Owner questions): the rule
shape is the owner's pick. Do not start before it is answered; build only the option the answer names.

## Inputs

- `plans/backlog/p-tyowvhthul-*.md`: `maxLeads` 2, one lead in a measurement window with no unit running, a ready
  plan not admitted.
- `packages/supervision/rust/src/supervisor.rs` (`plans`, `leads_live`, `max_leads`) and
  `packages/supervision/rust/src/portfolio.rs` (`Plan.phases`, the phase table reader).
- `core/skills/fgos-lead/SKILL.md`: how a lead parks a phase on another party (the phase table entry with its
  reason, and the `coordination-help` raise).
- `core/config-standard/supervisor.yaml` (`maxLeads`).
- The answered owner question.

## Footprint

- `packages/supervision/rust/src/supervisor.rs`
- `packages/supervision/rust/src/portfolio.rs`
- `packages/supervision/rust/tests/wake.rs`
- `apps/fgos/src/wiring/supervision.rs`
- `apps/fgos/tests/supervision_verbs.rs`

## Steps

If the answer is "a waiting lead does not hold a working slot" (recommended):

1. A running plan "waits outside" when every phase that is not `done` is parked in its phase table on another party
   (the lead's existing park record), read from the plan file at each wake.
2. `plans` counts a live lead of such a plan in a new `leadsWaiting` count and not in `leadsLive`; admission
   compares `leadsLive` with `maxLeads` as today. The JSON view carries `leadsWaiting`.
3. When the lead unparks a phase, its plan counts as working again at the next wake; nothing is stopped to make room.

If the answer is "raise the lane count from measured capacity": stop and report to the supervisor. That option needs
inputs (provider seats, free memory, free disk) this phase does not have, and its shape is replanned.

Owning proof: one test drives two live leads, one whose plan waits outside, with `maxLeads` 2 and one ready plan,
and shows the ready plan admitted; a second case with both leads working shows it not admitted.

## Verify

```bash
cargo test -p fgos-supervision
cargo test -p fgos --test supervision_verbs
```

## Rollback

Revert the phase commit. Every live lead counts against `maxLeads` again.
