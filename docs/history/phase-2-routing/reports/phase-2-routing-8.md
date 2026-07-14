# phase-2-routing-8 — S3: sequential runner loop `bin/fgos-runner.mjs`

Status: [DONE]

Outcome: the sequential runner loop (per D2/D3/D4/D5, A1) is live — startup reap (stale-doing resolution + orphan `fgw/` prune) before the frontier, FIFO head with anti-loop gate (park via the existing `todo -> blocked` edge, item truly leaves the frontier), CAS claim, isolated fresh worktree per attempt on a reused branch, runner-run goal-check (the item's own `verify`, in the worktree cwd), `doing -> proposed` on pass, park/halt routed through the recovery matrix, `removeWorktree` in a `finally` on every path including halt, CAS conflict on the runner's own write -> clean halt exit 3, repo root always derived from cwd. `src/state/store.mjs` gained exactly one read-only accessor, `readRawEvents(dir)` (decision 14396a5c). Verify: `npm test` — 227/227 (baseline 214 + 13 new loop tests, fake executors in temp git repos only).

Files touched:

- `src/runner/loop.mjs` (new)
- `bin/fgos-runner.mjs` (new)
- `test/runner/loop.test.mjs` (new)
- `src/state/store.mjs` (readRawEvents accessor only)

Notes: worker/verify output is surfaced on the console only, never persisted to a committed path — the optional `.fgos/runs/` file sink was not needed, so no `.gitignore` change was made. Full trace and verification evidence: `.bee/cells/phase-2-routing-8.json`. Commit: `783a50a`.
