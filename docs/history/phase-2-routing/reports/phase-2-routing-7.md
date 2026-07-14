# phase-2-routing-7 — dispatch lib: prompt builder + tier→model config + worktree lifecycle

**Status:** [DONE]

**Outcome:** Added `src/runner/dispatch.mjs` (`buildPrompt` with the four
required framing sections, `loadRunnerConfig`/`modelForTier`/
`resolveExecutorCommand`, `spawnWorker` via argv-only `spawnSync`,
`shell: false` always) and `src/runner/worktree.mjs` (`createWorktree` with
branch-reuse-on-retry into a fresh directory, `removeWorktree` always run
from `repoRoot`, `listLeftovers` returning `{branch, aheadCount}`), plus the
committed `.fgos-runner.json` (3-tier model map: light/standard/heavy). 31
new tests (20 dispatch + 11 worktree), fake executors only (node scripts
written to mkdtemp at test time) — no real agent CLI spawned, no writes to
the main repo's `.fgos/`, and every worktree test uses its own disposable
`git init` temp repo. Suite is 214/214 green (baseline 183 + 31).

**Files touched:** `src/runner/dispatch.mjs`, `src/runner/worktree.mjs`,
`test/runner/dispatch.test.mjs`, `test/runner/worktree.test.mjs`,
`.fgos-runner.json`.

**Full trace/evidence:** `.bee/cells/phase-2-routing-7.json`
(`trace.verification_evidence`, `trace.verify_output`).

**Commit:** `91accdf` — `feat(phase-2-routing-7): add runner dispatch lib + worktree lifecycle`.
