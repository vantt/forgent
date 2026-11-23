# Supervisor wake, 2026-11-23 23:53

## Events

- `30a87f2b4683560e` session-no-result, unit `adhoc-phase-11-step-1-regression-fix…` (heads-stable). Its fix is already on main as `896340551`. Handled, no action.
- `38af731776d8b14e` session-no-result, unit `adhoc-fix-round-2-for-phase-8-slice-1…` (component-authority-doors). The lead consumed it and is now landing `component-authority-doors/p8`. Handled, no action.
- `6651ac0004954653` coordination-help, heads-stable phase 11 parked. The waits are recorded in the phase file (`f23573f1e`): a green full suite on main, Miu's probe JSON, and `q-2vehh564d2` (CHANGELOG). No `lead:SUPERVISOR` is live, so the suite run went to the owner as `q-5v6jpbmbcy`. Handled.

## Running plans

| Plan | Lead | State |
|------|------|-------|
| 261121-2110-component-authority-doors | live, busy | Retrying the p8 land through main contention. Phase 8 owns the 9 instruction-registry and decision-index reds. Open questions: `q-lnjt5zzbfq` (p6) and `q-aanvfxaopa` (p8). |
| 261122-0118-heads-stable-and-able | live, idle | Phase 11 waits on things outside the lead (listed above). This is a verified external wait, so no nudge was sent. |
| 261123-0828-head-stop-rotation-bad-measure | live, idle | Phase 1 waits on a green main (report `8aa837387`). It also needs the suite run in `q-5v6jpbmbcy`. |

No plan can be admitted: leadsLive 3 = maxLeads 3.

## Gaps

- About 7 reds on main have no owning plan: guide-schema x2, domain-registry without deps, terminal group title, convention, case-close, and 2 colored exit codes. They need a backlog row through the secretary.
