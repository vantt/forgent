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

Owner answer `q-kikgj6qaiu` (2026-11-26): "waits outside" is read from open owner questions per phase, not from the
phase table. Since `19f91c530` a lead parks by a `coordination-help` event and never lands the park in its plan file,
and a drained event no longer says the phase still waits, so the question store is the durable source.

## Steps

1. A running plan "waits outside" when every phase that is not `done` has an open owner question (state `open`, not
   answered, acked or cancelled) whose ref is `plan:<dir>#phase-NN` for that phase, or `plan:<dir>` (counts for every
   phase of the plan). Read at each wake through the question store; never cached.
2. The supervision crate defines the reading as a port, as it does for `Askers`; the adapter in
   `apps/fgos/src/wiring/supervision.rs` reads the question store (`fgos_questions::store`) the way `StoreAskers`
   does. An unreadable store answers "not waiting" (the lead keeps its slot, the safe side).
3. `plans` counts a live lead of such a plan in a new `leadsWaiting` count and not in `leadsLive`; admission
   compares `leadsLive` with `maxLeads` as today. The JSON view carries `leadsWaiting`.
4. When the question is answered or acked, the plan counts as working again at the next wake; nothing is stopped to
   make room.
5. Plan `261122-0056-orchestration-skeleton` phase 5 (`waitingOn: person` from a gate's question) has not landed;
   when it does, it replaces this reader (L10).

Owning proof: one test drives two live leads, one whose plan has an open question on each not-done phase, with
`maxLeads` 2 and one ready plan, and shows the ready plan admitted; a second case where the question is answered
shows it not admitted. One wiring proof in `apps/fgos/tests/supervision_verbs.rs` that the real adapter reads an
open question from the store.

## Verify

```bash
cargo test -p fgos-supervision
cargo test -p fgos --test supervision_verbs
```

## Rollback

Revert the phase commit. Every live lead counts against `maxLeads` again.
