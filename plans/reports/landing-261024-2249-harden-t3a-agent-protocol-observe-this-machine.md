# Landing: HARDEN T3 part 04a, agent protocol and Observe, on the second machine

Activated 2026-10-24 22:45 (Asia/Saigon) in workspace `/home/vantt/projects/forgent` (machine `fg-server2`) by `lead:HARDEN` (`claude-p74h@fg-server2`). This was a self-landing under the owner's standing approval and owner decision 32 (after the Work cutover), in a quiet window that WORK (`forgent-cd`) and TEST (`test-wa-d1`) both confirmed.

## Outcome

- **Active release:** `sha256:874af08f3ce5b660ee4bbbf0bdd7d8a7c38af553fedef54be7a5712c9026087d`. It was built from main `48a45a5f5` (merge "HARDEN T3 part 04a, agent protocol and Observe hardened"), 858 files.
- **Rollback release:** the Work cutover release `sha256:882b8df676cda24e7d0a2837a7c97aea485faffe8500c5737e10cb4e21863fb6` stays staged for rollback.
- **Sources:**
  - [arbitration](council-261024-1947-harden-t3a-arbitration.md);
  - [sub-plan](../261024-2035-harden-t3a-agent-protocol-observe/plan.md);
  - the phase reports in that plan's `reports/` folder.

**What changed for users:**
- **Agent protocol.**
  - A terminal agent that stops on a used-up quota is named `terminal:blocked:usage-limit`, not `needs-human`.
  - Result files are read no-follow, as regular files only, and capped at 16 MiB, so a FIFO or a huge file no longer stalls the supervisor.
  - Login wording on screens matches only at line start.
  - The Node settle step still re-reads the screen. That moves in T4.
- **Observe.**
  - Friction, case, eval and snapshot all go through one shard door. A bad byte or a torn line no longer breaks a store or swallows the next record, and symlinked shards or directories are refused.
  - `friction record` and `friction resolve` no longer run the legacy migration. `friction migrate` locks and fails closed.
  - Settlement compares instants.
  - The observe lock wait is 4 s, below Node's 5 s host timeout.
  - The Node friction client shrank from 194 to about 80 lines.
- **Metrics.** `metrics coverage` and `metrics runs` take 0.17 s instead of about 1.0 s, with byte-identical output. They now read only the `result.json` keys they use.
- **Doctor.** `observe-run-coverage` no longer re-judges run admission in Node (owner decision 31), and costs about 0.18 s instead of about 1.5 s. `observe-host-resolvable` now reads the store.
- **Tests.** Observe `cargo test` takes about 6 s instead of 35 s; the 31 s sleep test of a removed expiry is retired.

## Verification before the merge

- **Gate:** the full suite ran on the track tip `e81f5c1b4` (main merged in, census regenerated), with a private Cargo target and session variables unset.
  - `cargo test --workspace --no-fail-fast`: 1 614 pass, 0 fail.
  - `npm test`: 8 573 pass, 5 fail, 33 skipped. The same 5 fail on clean main `b71676053`; I re-ran the four files there and got the same 5. They come from the cutover's cut commit `51bee6b53` (TEST F17, owned by WORK), not from this branch:
    - `test/event-store/migrate.test.mjs` legacy fold;
    - two cases in `test/runner/merge.test.mjs` (stale deleted-shard catch-up and land);
    - `test/state/events-legacy-absence.test.mjs`;
    - `test/state/events-shard-gitattributes-union-merge.test.mjs`.
- **Cross-target:** `cargo check --all-targets` passes on `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` for `fgos-durable-file`, `fgos-observe`, `fgos-agent-protocol`, `fgos-run-result` and `fgos-run-supervisor`. This is a compile check only; the code has never run on Windows or a Mac.
  - The only warnings come from the third-party `arraydeque` and from warnings `fgos-run-supervisor` already had on main. Those are recorded for T4.
- **Clippy and census:** clippy `-D warnings` is clean on every touched crate. The one-door census shows 5 undeclared sites.
- **Reviews:**
  - OPC: MERGE on the census and the Windows `open_no_reparse` helper.
  - Every phase was verified independently by the big lead: focused Rust and Node tests rerun, and byte identity of the `metrics` output checked against the previously active release.

## Steps and checks

1. **Build.**
   - Clean detached worktree at `48a45a5f5` with a fresh ext4 Cargo target.
   - `cargo build --locked --release --workspace`: exit 0.
   - `scripts/build-rust-distribution.mjs`: 858 files staged.
   - The build left no change in the worktree; the census was already current.
2. **Backups** went to `.fgos/runtime/tmp/landing-harden-t3a-here/`: `distribution.json`, `project-config.json`, `global-config.json` (mode 600), `refspecs.txt`, `instruction-hashes.txt`, `activation.json` and `fgctl.prev`.
3. **Activation.**
   - `fgctl` was reinstalled from the release worktree.
   - `fgctl stage`, then `fgctl upgrade` (exit 0).
   - `distribution.json` was restored from the backup.
   - The `AGENTS.md`, `CLAUDE.md` and `.claude/settings.json` hashes are unchanged, and the AgentKit block is there once.
   - `fgctl verify` passed. The refspecs are unchanged.
4. **Setup and doctor.**
   - `fgos doctor --fix`: exit 0.
   - `fgos setup --json`: `configAddedKeys` and `globalConfigAddedKeys` are both empty.
   - `fgos doctor --json`: 148 rows, 10 not passed. They are the same known ten as at the T2 landing: `executor-skills-installed`, `tool-registry-configured`, `work-step-vocabulary`, `run-attempts-stuck`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `confined-pane-accounts`, `agent-cli-project-trusted` and `git-mutation-one-door` (CFG's 5 sites).
   - All of these pass:
     - `observe-dir-writable`;
     - `observe-host-resolvable`;
     - `observe-run-coverage` (535 directories on both sides);
     - `observe-friction-migrated` (752);
     - `active-release-matches-checkout` (changed 0).
5. **Smoke.**
   - `fgos dispatch decide` answers `in-process`.
   - `fgos friction list` reads 752 records, and `friction rank --limit 1` reads.
   - `metrics coverage` and `metrics runs` take 0.17 s each.

## Not in this landing

- **Owner Q3** (removing the constant or always-zero `metrics harness` sections) is still open. Its gated phase 07 lands separately once the owner answers.
- **T4 work.** The Node screen re-read in `settle-attempt.mjs` (red test RT-01 on `origin/harden/t3a-red-tests`) and the wiring of `classify` belong to T4. T4 also needs captured claude and codex quota screens first.

## Other machines

fg-server, design-lap and the owner machine have not taken the Work cutover yet, and WORK has asked that nobody pull main there before its guide is out. HARDEN asked WORK to build that guide's release from main at or after `48a45a5f5`, so those machines take T3-04a in the same upgrade. The T3-04a checks for that guide:
- the four `observe-*` doctor rows pass;
- `fgos metrics coverage` takes under 0.5 s;
- `fgos friction list` reads.

## Rollback

Stop every fgOS writer, then:
1. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:882b8df676cda24e7d0a2837a7c97aea485faffe8500c5737e10cb4e21863fb6`.
2. Restore `.fgos/distribution.json` from the backup folder.
3. `cp fgctl.prev ~/.local/bin/fgctl`.

On main, revert merge `48a45a5f5` (`-m 1`) only while no lane has built on it, and check the board first.

The previous release reads every on-disk format this one writes:
- friction, case, eval and snapshot shards keep the same JSONL record shape;
- a healed torn tail is plain JSONL;
- receipts may now carry `terminal:blocked:usage-limit`, which the old settle step treats like any other `terminal:blocked:*` reason.
