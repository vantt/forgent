# Supervisor wake 2026-11-23 01:28

Open owner question: q-rfxqncjrax (who runs the account probe for Miu's quota). It is still open and blocks only Miu's move to a fresh account.

## Events
- 3c0c793c94575df1 session-no-result (unit-run-1795371275497-cd54cdde): this was the phase 3 fix unit of heads-rotate-on-their-own. It settled `pass` at 18:25Z (gemini). The lead is now landing p03b. Handled.
- 9b92f0bc66eb4653 lane-freed fg-server2: no plan can be admitted. Handled.
- b5b5af00b1c65076 session-idle 39631fb7-…: this is the owner's interactive session, not a head, so the supervisor takes no action. Handled.

## Admission
leadsLive 3/4, lanes.free 3. The only ready plan, 261122-1950-owner-communication-standard, has `admissible: false` because its footprint overlaps a running plan. It was not admitted.

## Running plans
- 261121-2109-component-authority: the lead is busy. The phase 2 unit passed, review found no blockers, and fix unit c-15048-1795371631657 is running. Then it lands.
- 261122-0118-heads-stable-and-able: the lead is idle on purpose. Phases 8–10 are parked on recorded measure windows, which end 2026-11-23 14:20 (phase 9) and 21:06 (phases 8 and 10). Phase 11 depends on them. Left alone.
- 261122-2307-heads-rotate-on-their-own: the lead is busy landing phase 3 (p03b) after a green verify. Phase 4 comes next.
