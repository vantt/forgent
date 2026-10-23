# Phase 21: Live migration of this repository and the final gates

Depends on 20 and G-C1 for the build machine. Suggested executor: sonnet with the lead present; **independent sonnet review of the migration report before it is committed**. Slice D's G-D1 answer A put this step here (confirm from D's plan and its phase 16 rehearsal report; if G-D1 was not A, stop and report).

## Context

The new snapshot refuses this repository's project file (`gateway` on a `global-only` node, the dead `lock.predecessorKillWaitMs`; 1,557 lines, `runner.capabilities` 42 entries, `runner.executors` 8, `runner.$comment`). D built and rehearsed `fgos config migrate`; this is the first real run, on the branch that already holds every reader move, so the tombstone cannot break a Node verb here.

## Steps (in `cfg/slice-c`, linked worktree)

1. Merge `origin/main`; re-pin D's rehearsal input if `.fgos/config.json` changed upstream (SEAT, MP-B1, TEST edit it regularly): `git log -3 -- .fgos/config.json`.
2. `fgos config migrate --dry-run` (the dev host: `npm run fgos:dev -- config migrate --dry-run`): the report must match D's rehearsal (counts; `gateway` dropped as equal to the standard; `lock.predecessorKillWaitMs` dropped as retired; `runner.$comment` converted; machine-override paths listed). Review; re-run phase 09 Part 1 on the result: only expected differences.
3. `fgos config migrate [--accept-machine-overrides]` (the flag only if the owner reads and accepts the listed paths). Expect `.fgos/config.yaml` added and `.fgos/config.json` holding exactly `moved to .fgos/config.yaml; upgrade fgOS`; backup `.fgos/runtime/config-migrate/<rev16>-config.json` (git-ignored).
4. `fgos config check`, `fgos doctor` (no failure from config rows), `fgos config show --path runner.capabilities` equals the pre-migration value (Canonical JSON, one-off script in scratch), D's `tombstone-older-reader.test.mjs` against the real file.
5. Commit alone, message naming the report counts and the backup path (conventional commit, no AI reference); `git diff --stat` shows only `.fgos/config.json` and `.fgos/config.yaml`.
6. Final gates, sequential, each followed by reading the exit code on the next statement, `free -g` first: `cargo test --workspace --jobs 4`; `npm test`; `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --jobs 4`; `cargo test --manifest-path herdr-dashboard/Cargo.toml --jobs 4`; `cargo clippy` (`-D warnings`), `cargo fmt --check`, `cargo deny ... check advisories bans sources`. Budget counts (Rust added, Node added and removed excluding the vendored file) reported.

## Owning proofs

D's migration goldens and tombstone test; here only the live evidence.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| The tracked file changed since the rehearsal | M x M | step 1 and a fresh dry run |
| Other worktrees hold edits to `.fgos/config.json` | M x M | phase 20 line 10; they rebase after landing |
| Effective values change on a machine through its global file | M x M | the report lists them; `--accept-machine-overrides` is the owner's explicit yes |

## Rollback

`git revert <migration commit>` (or the backup copy, see the plan's table); nothing outside `.fgos/config.*` changes.
