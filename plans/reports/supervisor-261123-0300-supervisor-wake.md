# Supervisor wake 2026-11-23 03:00

- Queue: one `session-idle` event (404380910c1ac9ff) for `claude-b7gj@fg-server2`, which holds the program-lane role `lead:SUPERVISOR`, not a plan-lead head. Its screen shows it waiting on two owner questions it asked in its own chat: open a release window now so the heads-rotate code reaches the active release (f75c3a69 lacks it), and delete four superseded worktrees (work-data-model-p05k, heads-rotate-p03, component-authority-p03, heads-stable-p02/p06). This is a real wait on the owner. No type was sent. Handled.
- Running plans:
  - 261121-2109-component-authority: lead live and busy, polling units c-30213 (phase 4) and c-30221 (phase 5), started 02:45. Left alone.
  - 261122-0118-heads-stable-and-able: lead live. Phases 8, 9 and 10 are parked on measure windows that end 2026-11-23 14:20 (phase 9) and 21:06 (phases 8 and 10). Phase 11 waits on them. This is a recorded external wait.
- Admission: leadsLive 2 of 4, 2 lanes free. The only `ready` plan, 261122-1950-owner-communication-standard, returns `admissible: false`, so nothing was admitted.
- Owner questions still open: q-rfxqncjrax (Miu quota probe) and q-zcileomdpa (heads-rotate host gate). The plan behind q-zcileomdpa is done (fc3305c3d), so the question is now stale. Only the owner or Miu can close it.
