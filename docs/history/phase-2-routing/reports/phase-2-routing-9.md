# phase-2-routing-9 — S3: e2e full loop + chain-handoff contract doc

Status: [DONE]

Outcome: `test/e2e/runner-loop.test.mjs` drives the real `bin/fgos-runner.mjs`
and `bin/fgos.mjs` binaries as child processes in disposable temp git repos
(self-contained fake executors, self-contained item verifies, no mocked fs)
through all three required cases: (1) full two-item journey — item1 ->
`proposed` with exactly one worker commit on `fgw/item1`, runner-run
goal-check evidence in stdout, events chain add/add/doing/proposed all
carrying `v`, item2 held closed while its dep sits at `proposed`, second
`--once` idle with no new event; (2) verify-red — a wrong-commit worker is
retried per the matrix then parked `blocked`, never `proposed`; (3)
crash-idempotency — the runner genuinely SIGKILLed mid-item by its own fake
executor, second `--once` reaps to a defined state with exactly one worker
commit and zero leaked worktrees. `docs/routing-handoff-contract.md` (78
lines) captures the agent↔agent prose-handoff contract per L4/`14ebeea9`:
4-part prompt frame, entry-router table, standard handoff sentences, and a
"Ranh giới tin cậy" section, D-IDs cited. README gained one pointer line.
Verify: `npm test` — 234/234.

History: the first attempt on this cell returned `[BLOCKED]` because the
crash-idempotency case exposed a real bug in `startupReap` (orphaned branch
checkout collides with the reap's own throwaway worktree, uncaught crash).
That bug was fixed by cell `phase-2-routing-10` (commit `3f4f141`); this
cell's e2e file was not modified for the rescue and now passes unchanged —
it stands as the regression test for that fix. The genuine red run is
recorded on this cell's trace.

Files touched:

- `test/e2e/runner-loop.test.mjs` (new)
- `docs/routing-handoff-contract.md` (new)
- `README.md` (one pointer line added)

Full trace and verification evidence: `.bee/cells/phase-2-routing-9.json`.
Commit: `06df497`.
