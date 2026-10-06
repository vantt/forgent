# Acceptance: confinement credential hygiene, pane safety, runner-commit

Date: 2026-10-03. Binary: `bin/fgos.mjs` of branch `fix/confinement-hygiene-integration`, run inside a live herdr session (herdr 0.9.1-vantt.1, bwrap `/usr/bin/bwrap`). Executors are fake scripts (no API, no credential): `/var/tmp/hyg-accept/fake-agent.sh` (works: reads the brief typed at it, writes `src/feature.txt` and the outbox files, never commits) and `fake-limit.sh` (prints a provider-limit screen). Store `/var/tmp/hyg-accept/store` (apart from the workspace worktrees `wt`…`wt6`). Evidence copies: `reports/evidence/{a,b}/`. No credential content exists in any of it; modes and paths only.

## Owner decision applied

Confined workers never write git metadata; the runner commits (`src/runner/execution/commit-unit-work.mjs`). See plan.md "Decisions".

## Case (a): ordinary round: **Accepted**

Run `unit-run-1790991390730-761228f7` (`fgos run --unit unit-a.json --pattern solo`, capability `acc:write`, executor `fake-agent`, transport herdr, `visibility.confinement.status: confined-bwrap`, outcome `settled`).

| Check | Observed |
|---|---|
| Home mode during the run | dispatch `disp_1790991390827_c841e261`: `<dispatchId>/` **700**, `home/` **700**, root `/tmp/fgos-confinement` **700** (sampled every 0.5 s: `evidence/a/home-modes-during-run.txt`) |
| After the run | `/tmp/fgos-confinement/disp_1790991390827_c841e261` does not exist |
| Worker cannot write git | inside the sandbox `git add src/feature.txt` was refused (worker's own report: `evidence/a/report-1.md`) |
| Runner commit | `b49ec8ba9795494009d4d520929a8da45af80d6c` "Add src/feature.txt from the fake agent" on branch `unit-wt` (subject = agent summary); `unit.json` binding records `commit.status: committed`, files `["src/feature.txt"]`; worktree clean |
| `main` of the store | `5b52ac27…` before and after |

## Case (b): provider limit, pane kept, reap: **Accepted** (with one separate defect, below)

Chain script `run-b3.sh`, log `evidence/b/chain.log`. Run 1 `unit-run-1790991666426-52077593` (capability `acc:limit`, `prefer: [fake-limit, fake-agent]`).

1. Run 1: `fake-limit` shows the limit screen → `provider-limit`; pane `wS:p3WP` **left open**. Failure record (`evidence/b/stderr.log`, `result.json` `runnerNote`) names the home: `/tmp/fgos-confinement/disp_1790991666530_a1df15fe/home`. Modes **700 / 700**. Marker carries `paneId`.
2. Run 2 (`unit-a.json`, another worktree) started **while the pane was open**: home still present (kept: its pane is open).
3. `herdr pane close wS:p3WP`.
4. Run 3 (`fgos run`, another worktree): `disp_1790991666530_a1df15fe` is **gone** (reaped at run start).

Not covered by the above: a manual `fgos run` with no unit is refused before the reaper runs; the reap happens when a real unit run starts (as in run 3).

## Defect found, not fixed (separate item)

After `provider-limit`, the fallback to the next candidate (`fake-agent`) is **refused for a mutating Unit**: `executeAssignment … binding mismatch: recomputed { executor: "fake-limit" } does not match assignment { executor: "fake-agent" } -- refused` (`assignment-runner.mjs` mutating gate recomputes `bind()` without the recorded fallback). The same fallback works for read-only roles. So a producer cannot fall back after a limit today. Reproduce: case (b) config, run 1 above; stderr of run 1 in `/var/tmp/hyg-accept/b3-run1.err`.

## Automated

- Full `npm test` on the integration branch before this change: 6516 pass, 0 fail (8 skipped, 65 todo). Re-run after the runner-commit change and the architecture-manifest row: **6517 pass, 0 fail, 8 skipped** (`npm test`, exit 0). An earlier run of the same tree had one timing flake (`fanoutBatchExecutorCli … overlapping execution windows`, green alone) and two real failures (new file missing from `docs/architecture-manifest.json`), the latter fixed.
- New tests: `test/runner/dispatch-confinement-credential-hygiene.test.mjs`, `dispatch-trust-store.test.mjs`, `herdr-prompt-ready.test.mjs`, `workflow-runner.test.mjs`, `execution/run.test.mjs` (runner commit), real-bwrap `dispatch-confinement-backend-p03.test.mjs` (worker cannot add/commit/move refs/touch hooks or config; runner commits; `refs/heads/main` unchanged).

## Unresolved

- Fix of the mutating fallback gate (above) needs its own item.
- `allowedTools` of the default claude executor (`Bash(git add:*),Bash(git commit:*)`) is unchanged; a confined worker still cannot write git, an unconfined one still could.
