# Phase 4: A lead waiting outside does not hold a working slot

Closes `p-tyowvhthul` in code. The owner answered question `q-eoxlvo7i4r` on 2026-11-24: "a waiting lead
does not hold a working slot".

This rule is the interim. The owner's direction is that a head with nothing to do for a long time is shut down and
woken at the right moment: plan `261122-0056-orchestration-skeleton` phase 6 (sleep and wake, with phases 16 and 17)
stops an idle lead whose records all wait and holds no lane while it sleeps. Once that lands, a waiting lead is no
longer live, `leadsWaiting` is always zero, and that phase retires this rule (L10). So this phase uses the same
meaning of "waits" and adds nothing that phase 6 would have to migrate.

## Inputs

- `plans/backlog/p-tyowvhthul-*.md`: `maxLeads` 2, one lead in a measurement window with no unit running, a ready
  plan not admitted.
- `packages/supervision/rust/src/supervisor.rs` (`plans`, `leads_live`, `max_leads`) and
  `packages/supervision/rust/src/portfolio.rs` (`Plan.phases`, the phase table reader).
- `core/skills/fgos-lead/SKILL.md`: how a lead parks a phase on another party (the phase table entry with its
  reason, and the `coordination-help` raise).
- `core/config-standard/supervisor.yaml` (`maxLeads`).
- The answered owner question `q-eoxlvo7i4r`.
- `plans/261122-0056-orchestration-skeleton/phase-05-sources-and-needs.md` and `phase-06-sleep-and-wake.md`: the
  `waitingOn` meaning and the sleep rule that later replaces this one.

## Footprint

- `packages/supervision/rust/src/supervisor.rs`
- `packages/supervision/rust/src/portfolio.rs`
- `packages/supervision/rust/tests/wake.rs`
- `apps/fgos/src/wiring/supervision.rs`
- `apps/fgos/tests/supervision_verbs.rs`

## Steps

1. A running plan "waits outside" when every phase that is not `done` is parked in its phase table on another party
   (the lead's existing park record), read from the plan file at each wake.
2. `plans` counts a live lead of such a plan in a new `leadsWaiting` count and not in `leadsLive`; admission
   compares `leadsLive` with `maxLeads` as today. The JSON view carries `leadsWaiting`.
3. When the lead unparks a phase, its plan counts as working again at the next wake; nothing is stopped to make room.
4. Read the plan source of `261122-0056-orchestration-skeleton` phase 5 (`waitingOn` from a parked phase) before
   writing step 1; if that phase has landed, call its reader instead of writing a second one.

Owning proof: one test drives two live leads, one whose plan waits outside, with `maxLeads` 2 and one ready plan,
and shows the ready plan admitted; a second case with both leads working shows it not admitted.

## Verify

```bash
cargo test -p fgos-supervision
cargo test -p fgos --test supervision_verbs
```

## Rollback

Revert the phase commit. Every live lead counts against `maxLeads` again.
