# Landing: main on the second machine, 2026-10-24

Activated 2026-10-24 09:37 (Asia/Saigon) in workspace `/home/vantt/projects/forgent` (machine `fg-server2`) by `lead:OPC` (`claude-muyt@fg-server2`). The owner asked for it at 09:18 ("land feature moi tu cac may khác"). This was a self-landing under the standing approval for this machine. The quiet window ran from 09:36, after WORK's measurement window ended; HARDEN (`forgent-a8`), TEST (`forgent-f8`) and WORK (`forgent-cd`) each confirmed they held.

## Outcome

Release `sha256:d6d3d08224e56894becb095d69a572a3255e5272bd94b37eb6988d39f93344c0` is active. It was built from main `8387c8177` (858 files). The previous release, `sha256:ae20f16fcd7f45e16bfcf74262ebe332b875798bdd11ddac7edcdcdf794d72f5` (HARDEN T2, 2026-10-23 22:09), stays staged for rollback.

The product change since `084da2df7` is small: eight files in 33 commits.
- **IDENT.** Session registration is cheaper: `388f01c20` and `57d21f904`.
- **HARDEN R9.** The lock fence waits for a killed holder's lock to free (`8a9e3fb79`).
- **TEST.** Two fixes:
  - F10 (`50d6ae857`): the mutation checkout builds into a Cargo target of its own.
  - F13 (`32d3ad95b`): the commit-death hook is stopped, and a run that leaves processes fails.
- **Lock-race test** (`a5d4497d2`).

## Steps and checks

1. **Build.**
   - A clean detached worktree at `8387c8177`, with a fresh private `CARGO_TARGET_DIR` on ext4.
   - `cargo build --locked --release --workspace` exited 0.
   - `scripts/build-rust-distribution.mjs` staged 858 files.
   - `fgctl` was replaced with the one from this build; the previous one is kept as `fgctl.prev`.
   - `fgctl stage` succeeded.
2. **Land gates.**
   - `cargo check -p fgos-process -p fgos-holder-lock --target x86_64-pc-windows-msvc` exited 0.
   - `cargo clippy --workspace --all-targets -- -D warnings` exited 0; the only warnings come from the third-party `arraydeque`.
   - The one-door census shows exactly CFG's 5 `unresolved-binary` sites.
3. **Stale census on main.**
   - The release build rewrote `packages/git/contracts/mutation-census.v1.json`. The IDENT commits had changed four `packages/identity` files without regenerating it, so only hashes moved.
   - The regenerated file, byte-identical to the release copy, was committed on main as `f67862e28`. Without it, `active-release-matches-checkout` failed with changed=1.
4. **Backups and activation.**
   - Backups are in `.fgos/runtime/tmp/landing-opc-261024/`:
     - `distribution.json`, `project-config.json`, and `global-config.json` (mode 600);
     - `refspecs.txt`, `instruction-hashes.txt`, `fgctl.prev`;
     - `activation.json`;
     - the doctor, setup and upgrade outputs.
   - The stop check found no fgOS process running and no open file under `.fgos`.
   - `fgctl upgrade` ran, then `distribution.json` was restored, and `fgctl verify` passed.
5. **Instruction files.**
   - `CLAUDE.md` and `.claude/settings.json` are unchanged.
   - The `AGENTS.md` hash changed. The setup inside the upgrade rewrote the uncommitted AgentKit (omp) block. The block is still there exactly once (367 lines), and the committed part equals HEAD, so it is kept as the owner decided.
6. **Setup and doctor.**
   - `fgos doctor --fix` exited 0.
   - `fgos setup --json` added no config key, global or project.
   - The refspecs are unchanged.
   - The main checkout was fast-forwarded to `f67862e28`.
   - `fgos doctor --json` has 140 rows, 10 not passed. All ten are the known ones from the previous landing:
     - `executor-skills-installed`, `tool-registry-configured`, `executor-profile-warnings`, `confined-pane-accounts`, `agent-cli-project-trusted`;
     - `work-step-vocabulary`, `run-attempts-stuck`;
     - `doc-current-path-missing`, `doc-source-conservation`;
     - `git-mutation-one-door` (CFG's 5 sites).
   - `active-release-matches-checkout` passes (changed 0), and so do `identity-machine-key`, `process-containment` and `lock-holders`.
   - `git-operation-journal` passes with its retention warning: 392 finished operations, 2 625 KiB, oldest 5.1 days. That is backlog `p-djrgdijd2c`.
7. **Smoke.**
   - `fgos dispatch decide` answered.
   - `fgos identity` has source `env`.
   - `lead:OPC` resolves to this session and is alive.
   - `fgos worktree create --detach` took 3.1 s, and `fgos worktree remove` 1.0 s.
   - No prunable registration is left.

## Not in this release

- WORK's Event Store cutover (`work/es-cutover`). It waits for the owner's performance decision.
- HARDEN's phase 8 census slices (`harden/t2-p08-census-slices`). They wait for a zero census on all three machines.

## Owner machine

Nothing here is specific to this machine. The owner machine takes the same main whenever the owner picks; its last landing is recorded in `7be8f6714`.

## Rollback

Stop everything, then:
1. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:ae20f16fcd7f45e16bfcf74262ebe332b875798bdd11ddac7edcdcdf794d72f5`.
2. Restore `.fgos/distribution.json`, `.fgos/config.json` and `~/.fgos/config.json` from the backup folder.
3. `cp .fgos/runtime/tmp/landing-opc-261024/fgctl.prev ~/.local/bin/fgctl`.

No on-disk format changed between the two releases.
