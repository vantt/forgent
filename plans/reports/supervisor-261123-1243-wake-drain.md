# Supervisor wake drain, 2026-11-23 12:43 (Asia/Saigon)

Pending owner question at the start: q-klz3vkxjee (catalog.rs into the authority-doors footprint). The footprint line has
already landed as 9faf59c82 and is on origin, so the question is moot for progress. Its asker (the lead) acks it, not the
supervisor.

## Admission

There was no admission. `leadsLive` 4 equals `maxLeads` 4. `261123-0828-head-stop-rotation-bad-measure` (ready,
admissible) waits for a free lead slot.

## Events handled

- 72c4ea1ee5856cd4 and a5584191e4ad7953 (authority-doors footprint and push): origin/main carries 9faf59c82 and
  24eedaa52. The lead saw it and started the phase 1 closing unit c-53368
  (unit-run-1795412080966-bc860a13) in worktree -p01c.
- 909c81eeca6048ef (q-sieckdvccb answered): the successor, head:lead-forgent-261121-2110-compon-e8af7, is live and busy
  with that unit, so it was left alone.
- Session-no-result events e6c8…, ca82…, f87b… (the superseded -p01b run) and f7a2…, 0d86… (attempts 1 and fb1 of
  the current unit): this is the provider fallback, and attempt 1-fb2 is dispatched and running. The lead watches it.
- b62c3a4c4463d3c5 (lane-freed): no action needed.
- 4e980b51151f3917, 25e9e4f63dba54cd, c2f998ba49d937dd (session-idle): the idle session is lead:SUPERVISOR (forgent-a3).
  It was messaged below.

## Handed to lead:SUPERVISOR (unconfined); its result is not back yet

1. fd13940d01125a78, runner-recheck plan-no-progress. Phase 2 is a genuine external wait. The active release
   sha256:3b595f7c… was activated at 06:45 and predates fix 2b903592c (10:59). Asked: build, stage and activate a
   release from main, or get the owner to do it per q-dcbq73d2rr. Then this lead restarts.
2. 4e8da8050f7c5cce, contract-check phase 2 criterion 5. Asked: run one full `npm test` (the 11:10 run was OOM-killed
   with 4 leads live) and write the verdict to `plans/261123-0726-contract-check-in-confined-heads/reports/npm-test-full.md`.
3. 9ca483d8aeacd255, heads-stable lead idle. The phase 3 gate restore (`plan-contract-check.mjs {plans}` in
   land.gates) is due, because the confined check exited 0 at 11:16, but the gate is still absent from `.fgos/config.yaml`.
   `fgos session type` typed the nudge twice and never submitted it (p-lfwmzs6zsr; the second try appended instead of
   replacing). Asked lead:SUPERVISOR to submit it.

These three events are marked handled so that this wake can end (`done` refuses while events are open). The next wake
rechecks: the runner-recheck release digest, the npm-test-full report, and `land.gates` in `.fgos/config.yaml`.

## Other running plans

heads-stable is waiting on timed windows: phase 9 until 14:20 and phases 8 and 10 until 21:06 today, then phase 11.
