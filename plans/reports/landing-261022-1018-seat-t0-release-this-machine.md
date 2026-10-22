# Landing: SEAT, Git fence and HARDEN T0 on this machine

Landed 2026-10-22 10:12 (Asia/Saigon) in workspace `/home/vantt/projects/forgent` by session `forgent-8e`, at the owner's request ("em pull code và land những thứ mới vào nhé"). This machine has one fgOS workspace (forgent); its release store held only `8522b6bd…`, so it is neither the second machine of `landing-261022-0904-harden-seat-release-this-machine.md` nor the three-workspace owner machine of `guide-261022-0011-owner-machine-git-durability-and-t0.md`. The steps follow that guide.

## Outcome

Release `sha256:ce430e51ec2f52f4f0131850e1417ab1d6f1886cc3a5b91fd3837c05886ad1f9` has been active since 10:12:18, built from main `8e27162e6` (827 files, `git-wal-v1`). The previous release `sha256:8522b6bd…` (staged 2026-10-21 10:41, before SEAT and T0) stays in the store for rollback.

What it adds over `8522b6bd…`: HARDEN T0 (process facts, durable file and canonical JSON through the native door), the Git durability work and the activation fence on the Land WAL doors, SEAT (seat binding, config in SEAT format), the decide-door default executor fix, and documentation commits.

## Steps and checks

1. **Pull.** Main was 12 commits behind origin; pulled to `8e27162e6`. Before pulling, `.fgos/config.json` carried `runner.rigorToTier` re-added at 09:14 by the old release (the same write-back the second machine saw at 08:51); it was saved to `.fgos/runtime/tmp/landing-261022-pull/` and reset to main. The autostash conflict in `docs/backlog.md` was resolved by taking origin's file and re-adding this session's four rows.
2. **Quiet window.** Five other sessions were asked and all answered ready: `forgent-0b` (lane MAIL parked; only a `cargo test` in the `forgent-mailbox` worktree ran), `forgent-e0` (a council run `wf-run-1792602194116-9d30a980` parked at its human gate, left untouched), `fg-dataware-house-a5`, `fg-dataware-house-3a`, `workshop-ecosystem-bb`. Checked: no `fgos`, `fgctl` or gateway process, no open fd under `.fgos` or `~/.local/state/fgos`, gateway stopped.
3. **Cleanup with the old release.** `fgos doctor --fix`: exit 0; `lock-holders` 0 held; `git-operation-journal` pendingCount 0; `run-attempts-stuck` none stuck. It re-added `rigorToTier` again (expected; removed in step 7).
4. **Backups** in `.fgos/runtime/landing-261022/`: `distribution.json`, project and global config (global mode 600), refspecs, hashes of `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `~/.fgos/config.json`, the active digest, and `fgctl.prev`.
5. **Build** in a clean detached worktree `forgent-worktrees/land-261022` at `8e27162e6`, Cargo target `/home/vantt/projects/.cargo-out-land-261022` (ext4): `cargo build --locked --release --workspace`, then `scripts/build-rust-distribution.mjs` to `/home/vantt/projects/.fgos-staged-261022`; `fgctl` reinstalled from the same tree.
6. **Canonical JSON check (T0, required).** `canonical-corpus.mjs` from the T0 guide over `/home/vantt/projects/forgent/.fgos`: 2,801 files, 13,185 documents, 613,555 subtrees, 0 mismatches, 3 skipped (over 8 MiB). `canonical-corpus: all equal`.
7. **Stage and activate.** `fgctl stage`, then `fgctl upgrade` from 10:10:20 to 10:12:18, exit 0; `distribution.json` restored from the backup; `fgctl verify` passed.
8. **Doctor and setup with the new release.** `fgos doctor --fix`: exit 0. `fgos setup`: `configAddedKeys` and `globalConfigAddedKeys` empty, refspecs unchanged; the SEAT conversion reported `converted`, deleting `runner.rigorToTier` (backup `.fgos/config.json.pre-seat-binding-20261022T031351856Z`), so `.fgos/config.json` equals main again. Hashes of all five protected files equal the backup.
9. **Doctor through the shim.** 144 checks, 8 not passed, none in the required set: every `git-*`, `lock-*`, `terminal-*` and `seat-binding-*` row, `process-containment`, `run-supervisor-route` and `state-root` pass; `coordination-abandoned-claims` is gone. The 8: `tool-registry-configured`, `work-step-vocabulary` (`tsk-5db` at a retired step), `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings` (informational), `confined-pane-accounts` (no `runner.providers.z-ai.accounts`), `agent-cli-project-trusted` (codex has no trust entry for this folder), `active-release-matches-checkout` (local edits in the working tree).
10. **Smoke.**
    - Gateway `start`, `status` (reachable), `stop`.
    - `fgos lock fence gateway --yes`: `free`, nothing terminated or killed.
    - Read-only `fgos run` ("Reply with exactly the word OK"): `pass` on gemini.
    - Writing `fgos run` in scratch worktree `smoke/land-261022`: the first attempt wrote a file at the repository root and ScopedCommit refused it with the pre-commit root allowlist (`hook-refused`), which is correct behaviour; the retry under `plans/reports/` passed and committed `1fd607c45` through ScopedCommit. Worktree removed with `fgos worktree remove --delivered-to`, branch deleted.
    - `forgent-e0`'s config checks after the SEAT conversion: openai invocations `codex-cli-bwrap > pi-herdr > codex-herdr > pi-cli-bwrap`; `tierFallback` flagship and frontier end with `xai, deepseek, z-ai`; global `llmAccounts` pools openrouter, thehive, openai (3 accounts), gemini, xai; `dispatch explain --for architecture:shape` walks openai, claude, gemini, xai, deepseek.

## Left on disk

- `/home/vantt/projects/forgent-worktrees/land-261022` (build worktree; removal refused while it holds the corpus script under `.fgos/runtime/tmp/`).
- `/home/vantt/projects/.cargo-out-land-261022` (2.1 GB) and `/home/vantt/projects/.fgos-staged-261022` (31 MB).
- `.fgos/config.json.pre-seat-binding-20261022T031351856Z` (untracked).
- The global `~/.fgos/config.json` still has `runner.rigorToTier`; the new release ignores it with a stderr note, because older releases may still read it.

## Rollback

Stop everything, then:
1. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:8522b6bd54f346ed86beae2d195631493acc3c1c5f50513a852576d46b7fd9cc`.
2. Restore `.fgos/distribution.json` and `.fgos/config.json` from `.fgos/runtime/landing-261022/` (`project-config.json`): the old release refuses the SEAT config.
3. `cp .fgos/runtime/landing-261022/fgctl.prev ~/.local/bin/fgctl`.
