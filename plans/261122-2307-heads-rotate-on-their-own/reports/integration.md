# Integration report: heads rotate on their own (phase 4)

Phases 1, 2, and 3 are merged on this combined tree (`main`).

Combined tree commit: `5a41f0d5740a83a74a9c40e0574948e371945e55`

## Gate

pending: run by the lead

## Follow-ups outside the footprint

- `packages/run-supervisor/contracts/head-request.v1.json`: 'session rotate' `stopFacts` prose omits `sessionCrons`, `backgroundTasks` and `quota` (`checkStopFacts` in `src/session-rotation/rotate.mjs` is the enforced check).
- A real status-line payload recording is owed (the proof point report `plans/261122-2307-heads-rotate-on-their-own/reports/status-line-payload.md` was reconstructed from the installed CLI bundle).
