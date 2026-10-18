# Terminal mode and launcher identity (plan 6.3): stop-everything landing

Date 2026-10-18, 16:55–17:15, on the owner's machine, under the owner's 10-18 delegation ("em tự điều phối để các lane làm việc cho tới khi xong nhé. cần land thì em tự land").

- **Plan:** [plan.md](../261016-1351-terminal-mode-and-launcher-identity/plan.md).
- **Section A:** [P09A report](phase-lead-261018-1443-terminal-mode-p09a-integration-and-real-herdr.md) (integration, full suite, real herdr per CLI, landing steps) and its [independent review](phase-lead-261018-1443-terminal-mode-p09a-independent-review.md).
- **Decision:** D-ADR0059 recorded with `fgos decision` (`touches:f87c11eb`, the D-ADR0056 record), `docs/decisions/index.md` regenerated. D-ADR0057 and D-ADR0058 belong to Git (second machine); the id was reserved on the program board at 15:40.

## Proof before landing
- **Real herdr (P09A):** five product defects that the fake herdr could not show, all fixed with tests: launch never identified, `exec` killed retained panes, codex long paste and working flash, codex v0.163 late folder dialog, a test-harness contamination. One settled round per CLI, all `completed-pass`: claude, codex, agy, pi, omp. This closes 6.5's open criterion 6. T8 hB/hC/hD and 12.3 (supervisor killed before and after the agent start) were run on real panes.
- **Full `npm test`** on integration `401f7d464` (main `80fd884f4` merged in), host and `target` from a private release build, `--test-concurrency=4`: 8091 tests, 7995 pass, 2 fail, 29 skipped.
  - `terminal-cutover` "confined read-only unit": the harness still picked the newest confinement home of any test on the machine. Fixed in the test only (`dec1ee7e0`): it reads a home only if that home's agent ran in the test's own repository. Proof: with a planted foreign home that has the newest mtime, the old harness fails and the new one passes. The four terminal files run in parallel: 30/30, twice.
  - `skill-wrappers`: a known failure that happens only in worktrees (the generated wrapper exists only untracked in the main checkout).
- **CI `process-containment` and `holder-lock-cross-platform`** on `5f0d05471`: Linux and Windows green. macOS red in `fgos-process` `a_thousand_fast_exits_are_normal_spawns`, which comes from main (`47436619b`, Git lane), not from this plan; `packages/process` is identical to main.
  - The first red was `/bin/true` (macOS has none). Fixed on main `f4cac3a2b`.
  - What is still red is a real gap in the macOS driver: `SpawnFailed("gate left before its identity was read")` (`containment/macos.rs:62`). It is reported to the Git lane on the program board (16:45). No workspace runs on macOS.
- **Rust:** cargo tests of the touched crates green on every phase. Workspace tests after the main merge fail only in `fgos-git`, which needs git ≥ 2.53 (this machine has 2.34.1).

## Result
- **Old-release pass (P09A step 2):** with release `e95c130d…` still active, `fgos doctor --fix` in mdview and mcp-skill-hub (16:35) and in forgentX (17:05).
  - It ran in forgentX only after the doc lane's Doer run (`unit-run-1792312429461-1743019e`) had settled.
  - Its v1 pane home (`disp_1792312431504_4157cfac`) was removed.
  - Afterwards no orphaned confinement resource and no stuck attempt in any workspace.
- **main:** `274de6172`, a fast-forward from `terminal-mode/integration` (main merged into it first).
- **Release:** `sha256:a6bcdc29000d359ac9de82eeeaf325ef664db77a90fc59394958296882b96c08`.
- **fgctl:** reinstalled (`fd70f877…`, it links `fgos-process` and holder-lock, both changed on main). The previous one is kept at `.fgos/runtime/tmp/landing-6.3/fgctl.prev`.
- **Activation:** `fgctl upgrade --from <tree>` in mdview, mcp-skill-hub and forgentX, all exit 0. `.fgos/distribution.json` restored. `fgos setup` exit 0 in each.
- **Fences:** forgentX 2551/2551 after placing 68 new unit-run lock paths; mdview 219/219; mcp-skill-hub 20/20.

## Doctor through the shim (all three workspaces)
These checks pass in all three workspaces: `terminal-control`, `terminal-config`, `terminal-allocations`, `runtime-socket-dir`, `run-attempts-stuck` (forgentX 2103 open attempts of old runs, none stuck), `run-supervisor-route`, `process-containment`, `writer-identity-resolvable`, `lock-fences`, `lock-holders`, `confinement-orphaned-resources-reaped`, `gate-kill-grace`. `active-release-matches-checkout` passes in forgentX with `changed=0`.

The failing set is owner config and old items, not this release:
- **forgentX:** `agent-cli-project-trusted`: `~/.codex-fgovn/config.toml` has no trust entry for forgentX. This is owner config; fgOS never edits it.
- **All three:** `executor-family-unique`, `model-policy-tier-coverage`, `provider-capacity-state`, `root-drift`, `doc-*`.

## Smoke (in the mdview clone `.fgos/runtime/tmp/smoke-6.2`, upgraded to the new release)
- **herdr:** `fgos run --provider xai --override {executor xai, invocation omp-herdr-vantt}`, read-only. Result: outcome `pass`, adapter `herdr-spawn`, `completed-pass`.
  - The envelope has `mode: terminal` and writer id `att-cmd_…`.
  - The receipt says `exited`.
  - The steps `settle-attempt`, `finalize-home`, `cleanup-trust` and `release-slot` (`close`) are all done, and the pane is gone.
- **cli:** `fgos run --provider claude`, read-only. Result: outcome `pass`, adapter `cli-spawn`, `completed-pass`.

## Open after landing
- **macOS:** the fast-exit spawn gap in `fgos-process` (Git lane, board 16:45).
- **`direct-crash-matrix` case 5:** failed under load in 2 of 3 full runs on P09A and passes alone. P09A's likely cause is a sweep while the dying gate still holds the lock; this is unproven.
- **agy:** a start-up announcement banner can keep Enter from submitting (one run in three on P09A). Not handled.
- **Main checkout config:** `gemini` and `glm` there have no herdr invocation (they exist only in `~/.fgos/config.json`), so `fgos run` from forgentX refuses them. Changing this is the owner's call.
- **Concurrent codex runs** on one account race on the folder dialog.
- **`adopt`** has no fallback when the envelope's `hostBin` was pruned.
- **`npm run fgos:dev -- run`** is unusable for controller-death tests (its dev host directory goes away with the controller). Use `FGOS_HOST_BIN` on a stable build.
- **The second machine** still lands this release.

## Rollback
1. With this release, `fgos doctor --fix` until `run-attempts-stuck` is clean.
2. Stop writers and revert the merge on main.
3. Copy `fgctl.prev` back.
4. Activate `sha256:e95c130d…` (`.fgos/runtime/tmp/landing-6.3/rollback-digests.txt`). After rollback the old release creates v1 pane homes again and its own reaper handles them; homes this release made carry the v2 marker, which the old release also reads.

## Next
- 6.4 (controller death: settle, `--resume`, clean-up) continues from P00 on `controller-death/integration`. First merge main into it and re-check P00r's "per terminal-mode/integration" facts.
- The deferred moves of the Git and ES lanes are unblocked: `publish.rs` and `store.rs` move onto `fgos-durable-file`, `envelope.rs` onto `fgos-canonical-json`, and Git phase 04 (`dispatch-cwd` lease through the runner commit) can start.
- MP-B2 is unblocked.

Component boundary: changed by this plan (gate half in the pane, session-identity mint for the supervisor), recorded in [component-boundary.md](../../docs/platform/component-boundary.md) by P08 and kept through the main merge; no further change here.
