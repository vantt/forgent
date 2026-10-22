# Land the SEAT dispatch fix and the Git fence doors on the owner machine

Landed 2026-10-22 11:50–12:05 (Asia/Saigon) by `SEAT` (session `forgentx-22`). This is the landing [the SEAT handoff](handoff-261022-1031-seat-lead-mpb1-close-post-land-fixes-seat-trim.md) assigns to SEAT. The stop was coordinated with `forgentx-5f` (DOC); no other session ran fgOS on this machine. It follows [the previous landing](landing-261022-0311-seat-git-durability-t0-owner-machine.md) step by step.

## Result

- **Release:** `sha256:9508f457d1ec11814de34149c6b19ce01ffbf237060ee6093fbaf442fac4b511`. It was built in a clean detached worktree with its own Cargo dir (`.fgos/runtime/landing-261022b/`) from `b7be8795c`, plus the census the build regenerates. That tree equals main `96a673725`.
  - `fgctl` was reinstalled from the same tree; the previous binary is kept as `fgctl.prev`.
- **Active** in mdview, mcp-skill-hub and forgentX. Before the land, all three ran `a2b19d78…`.
- **Contents beyond `a2b19d78…` (main `f315b99c7`):**
  - `00e028b5d`: `decideExecutorCli` registers the default executor (merged in `b52c2c238`);
  - GIT `e23e34688`: every Land WAL door requires the activation fence;
  - GIT `2c184ea1e`: the Git journal doctor row reports a missing fence;
  - the config-test fix `4fea2954c`;
  - documentation.
  - From `f315b99c7` on, eight code files changed: Git fence, census, `dispatch/cli.mjs`, and `setup/{git-checks,registrations}.mjs`.

## Steps

1. **Verify** in the detached worktree at `8a4df0f8e`. From there to `96a673725` only docs and the census changed.
   - **`npm test`:** 33 failures out of 8 680, run under heavy load (wall time 1 494 s against a 202 s baseline; four files hit the 600 s per-file timeout).
     - 19 are the known non-SEAT reds: `fgctl-upgrade` 15, `fgctl-init-download-sources` 2, `dev-host` 2.
     - Rerun alone with the addon and release artifacts staged (`buildTestEnv` + `ensureReleaseArtifacts`), every other file passed except `check-decision-citation-drift`.
     - Its two findings came from `3c4930691` (the YAML Document lane): a bare `RUL101` in `docs/specs/reading-map.md` and a document-local `D7` in `docs/backlog.md`. Fixed in `043ceaafb` and `b7be8795c`; the test now passes 31/31 on a clean tree.
   - **`cargo test --workspace --no-fail-fast`:** exit 0.
2. **Canonical JSON corpus check:** skipped. No canonical JSON code changed since the T0 land, which ran this check (`all equal`).
3. **Full stop:** no `fgos`, `fgctl` or gateway process, and no open fd under `.fgos` or `~/.local/state/fgos`.
4. **`fgos doctor --fix` with the old release:**
   - `lock-holders` showed 0 held and `run-attempts-stuck` none, in all three.
   - mdview and mcp-skill-hub had `git-operation-journal` `pendingCount` 0. forgentX had **1** (Findings); it was reconciled through the Git Recovery port, after which `pendingCount` was 0.
5. **Backups** went to `.fgos/runtime/landing-261022b/` in each workspace:
   - `distribution.json` and `activation.json` (rollback digest `a2b19d78…`);
   - refspecs and config/instruction hashes;
   - `~/.fgos/config.json` (mode 600) and `fgctl.prev`, in forgentX's folder only.
6. **Build:**
   - `cargo build --locked --release --workspace`;
   - `scripts/build-rust-distribution.mjs`;
   - `cargo install fgctl`, run from `/tmp`.
   - The census the build rewrote is committed as `96a673725`.
7. **Activate:** in each workspace, `fgctl upgrade --from <staged>`, run from a script with cwd `/tmp` whose argv does not name Git. Then `distribution.json` was restored, the hashes were confirmed unchanged and `fgctl verify` returned 0. No `git-predecessor-writer-live` refusal this time.
8. **`fgos doctor --fix`, `fgos setup`, `fgos doctor` with the new release:**
   - Exit 0 everywhere. `configAddedKeys` and `globalConfigAddedKeys` were empty, and the config hashes were unchanged after setup.
   - Every `seat-binding-*`, `tier-fallback`, `git-*`, `lock-*`, `terminal-*`, `process-containment`, `run-supervisor-route` and `state-root` row passes in all three. The one exception is forgentX `git-worktree-recovery`, which failed before the land with the same issues: stale agent worktrees kept dirty under `.claude/worktrees`.
   - `git-mutation-one-door` passes (964 files, payload digest `98a6bc3ab722`).
   - `seat-binding-dry-bind`: 62 seats in forgentX, 59 in mdview and 59 in mcp-skill-hub.
   - The other failing rows are unchanged from before: mdview has five, mcp-skill-hub two, forgentX seven (`tool-registry-configured`, `work-step-vocabulary`, `root-drift`, `main-checkout-guard-warnings`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`).
9. **Smoke in forgentX:**
   - (a) gateway `start` (running, reachable), `status` and `stop` ok;
   - (b) `fgos lock fence gateway --yes` ok;
   - (c) a read-only `fgos run` passed: `unit-run-1792645442265-527f574e`, gemini, `gemini-3.8-flash-high` at advanced;
   - (d) a writing `fgos run` in `fgos worktree create … --branch smoke/seat-land2` passed. Commit `committed` `21e3cdbcc` through ScopedCommit (`unit-run-1792645548220-ecdca547`).
     - A first attempt wrote the smoke file at the repo root, and the root-file allowlist hook refused the commit (`unit-run-1792645483194-06e04e73`). That was correct behaviour, caused by my smoke design.
   - (e) `fgos worktree remove --delivered-to smoke/seat-land2` ok; branch deleted.

## Findings

- **A test fixture wrote into the real forgentX Git WAL.**
  - **What was pending:** operation `f0082ded-4c1c-4655-ac36-1456058abcd0`, `WorktreeCreate` of `/tmp/fgos-test-run-n15DBd/…/verify-BHxSgR`, base `379e44239` (DOC's branch head), at about 10:28.
  - **Writer identity:** `2631400`, the parent shell of DOC's session.
  - **Disk state:** the worktree, its registration and the `/tmp` tree were all absent.
  - **Fix:** `GitRecovery.reconcile` ended it terminal, `effect-not-observed`.
  - **Cause (DOC's account, 12:10):** not an env leak. DOC ran `env -u CLAUDE_CODE_SESSION_ID node scripts/run-tests.mjs <3 files>` in `forgentX-s8-review`, a linked worktree of the real repo. `run-tests.mjs` ignored the file arguments and ran the whole suite. A fixture whose `WorktreeCreate` targets the repository found through cwd reached the shared git common dir, so it wrote the real Git WAL.
  - **Follow-up:** two hermeticity faults go to TEST: (1) a fixture must never reach the WAL of the repository the suite runs from; (2) `scripts/run-tests.mjs` silently ignores file arguments. This land's own verification also ran the suite from a linked worktree; it left no pending operation (`pendingCount` 0 after), but the fault applies to it too.
- **The suite under load** produces the timeouts above. The three SEAT-TRIM leads were held off heavy runs until after the land.

## Rollback

1. Stop everything.
2. In each workspace, run `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:a2b19d78900265cd6eb60b3b4f0868f47a6f134ae3d744644ef7bf024d21f3d3` from cwd `/tmp`.
3. Restore `distribution.json` from `.fgos/runtime/landing-261022b/`. The config needs no restore: it is unchanged, and `a2b19d78…` reads it.
4. `cp fgctl.prev ~/.local/bin/fgctl` (forgentX backup folder), then `fgctl verify`.
