# SEAT lane state before compaction

Written 2026-10-23 11:28 (Asia/Saigon) by `SEAT` (`claude-lcpq@design-lap`, registered with role `lead:SEAT`). The original brief is [the SEAT handoff](handoff-261022-1031-seat-lead-mpb1-close-post-land-fixes-seat-trim.md). This file records where the lane stands, so the same session can continue after compaction. Board: rows SEAT, SEAT-TRIM and MP-B1, and `log.md`.

## Done

- **MP-B1:** closed 10-22 10:50. mdview and mcp-skill-hub got the model refresh.
- **Three landings on design-lap** (mdview, mcp-skill-hub, forgentX):

  | Release | Main | When | Report |
  |---|---|---|---|
  | `9508f457` | `96a673725` | 10-22 12:05 | [landing-261022-1207](landing-261022-1207-seat-fix-git-fence-owner-machine.md) |
  | `2ce473d4` (T1 + SEAT fixes) | `7833d5df1` | 10-23 01:30 | [landing-261023-0133](landing-261023-0133-t1-and-seat-owner-machine.md) |
  | `94e26894` (IDENT 04/07) | `7b36e7e70` | 10-23 11:08 | [landing-261023-1112](landing-261023-1112-identity-04-07-owner-machine.md) |

  - Active now: `94e26894`. Rollback target: `2ce473d4`.
  - Backups are in `.fgos/runtime/landing-261023-ident/` of each workspace.
- **SEAT-TRIM batch 1 on main** (`0243824a9`):
  - one tier-ladder contract file;
  - inline-lead moved into the crate;
  - 19 duplicate tests retired;
  - one convention identifier evaluator. The JS evaluator stays, because the compat channels have no addon.
- **Run door fix on main** (`94c73d338`): `fgos run --capability`/`--persona` are no longer refused as a raise. The capability and seat selectors were removed from Node and the crate; the persona selector stays, since overrides feed it.
- **Fixes along the way:**
  - the 3 TEST-reported reds;
  - the seat-binding client EPIPE;
  - two YAML-lane citation lints;
  - the pending WAL op from a linked-worktree suite run, reconciled.
- **`docs:write` routing:** the codex pin was removed. Docs turns run on openai pi-herdr `gpt-6.1-sol` at flagship. The earlier "pi fails" diagnosis was wrong; the real cause was the pane race, which the COOK fix closes.
- **Disk cleanups:** about 35G and about 27G freed.

## In flight

- **Lead `seat-conversion`** (worktree `.claude/worktrees/agent-a848895baf727f214`, branch `worktree-agent-a848895baf727f214`, head `d7d786e9a` before rebase) is running its one full `npm test` after the land.
  - The change deletes the config-conversion code, the drain row, and the fence and refusal tests and fixtures: −3,094 / +81 lines.
  - It keeps `dropRetiredGlobalKeys`, because the global `~/.fgos/config.json` still has `runner.rigorToTier`.
  - Report: `plans/reports/phase-lead-261023-1010-seat-trim-conversion-removal.md` in that worktree.
  - **Next:**
    1. Verify it myself on a merged verify branch: targeted files plus the full suite, serialized.
    2. Merge to main with fast-forward.
    3. Remove the worktree.
    4. Record SEAT-TRIM on the board.

## Waiting on others

- **CFG:** fix the 5 `unresolved-binary` census sites from `03c99bc61`. `git-mutation-one-door` is red on all three machines until then. After the fix, do a small land on design-lap.
- **IDENT 05/06:** SEAT lands them on design-lap when they reach main (owner, via DOC, 10-23 10:37).
- **"SEAT stable" declaration:** still missing one real Land/approve through the GIT fence door on the new release. Every other criterion is met.
- **Owner decision (not asked yet; low priority):** removing `runner.rigorToTier` from `~/.fgos/config.json` on all machines would let `dropRetiredGlobalKeys` go.
- **Not SEAT's:** project ids for mdview and mcp-skill-hub (`fgos identity project --init`) belong to IDENT or the owner.

## Working rules learned

- The machine has a QLC SSD (Micron 2400) that saturates under parallel suites and cargo builds. Run suites and builds one at a time; ask DOC (`forgentx-5f`) for a quiet window; DOC parks on "stopping now" and resumes on "done".
- **Land recipe:**
  1. Detached worktree with its own `CARGO_TARGET_DIR`, then `npm test`, then a solo rerun of reds through a wrapper using `buildTestEnv` + `ensureReleaseArtifacts`. `scripts/run-tests.mjs` ignores file args.
  2. `cargo build --release` plus `build-rust-distribution.mjs`.
  3. Stop. Run `doctor --fix` with the old release, back up, `cargo install fgctl`, then `fgctl stage` + `upgrade` from cwd `/tmp`.
  4. Restore `distribution.json`, check hashes, `fgctl verify`.
  5. `doctor --fix`, `setup`, doctor.
  6. Smoke, including one real git commit in the main checkout.
- Known non-SEAT reds: `fgctl-upgrade`, `fgctl-init-download-sources`, `dev-host`, plus load timeouts (`run`, `loop`, `run-provider-failover`, `crash-matrix-adopt-resume`, `worktree`).
- Never run a suite whose fixtures can reach a real repository's WAL. A linked worktree shares the git common dir.
