# Land Git 07–08 on the owner machine

Landed 2026-10-21 08:27–08:41 (Asia/Saigon) by `forgentx-95`, owner 08:27 "em land đi nhé". Followed [the owner-machine guide](guide-261021-0606-owner-machine-git07-08-landing.md).

## Result

- Release `sha256:653affd6610924ea67b240e50980f1205d49485f3c018fbec2c45528a4ad4061`, built from main `831ea9f06` in a clean detached worktree with its own Cargo dir (`.fgos/runtime/landing-r5/`). `manifest.json` carries `git-wal-v1`. `fgctl` reinstalled from the same tree (previous kept as `.fgos/runtime/landing-r5/fgctl.prev`).
- Active in mdview, mcp-skill-hub, forgentX (activated 08:31:49–08:32:12, back to back). Lock protocol 2 everywhere on this machine.
- Main-checkout commits work again (they had been refused since 06:10 with `host-version-mismatch`; nothing held the lock, the old host could not answer the protocol 2 probe).

## Steps

0. `/tmp` cleanup; inodes 23%.
1. Git identity from `~/.gitconfig` only; git 2.55.0.
2. Full stop: the doc-plan lane (`forgentx-5f`) stopped its one run (`unit-run-1792543767069-260b3786`); the SEAT phase 06 verify suite was stopped; an orphan test-fixture `bwrap` (pid 3907661, 16 h old) was killed. No fgOS process, no open fd under any `.fgos/` or `~/.local/state/fgos`.
3. `fgos doctor --fix` with the old release: `lock-holders` 0 held, `run-attempts-stuck` none stuck, in all three.
4. Backups in `.fgos/runtime/landing-r5/`: each workspace's `distribution.json`, fetch refspecs, hashes of `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`; `~/.fgos/config.json` (mode 600); `fgctl.prev`.
5. `cargo build --locked --release --workspace`, `scripts/build-rust-distribution.mjs`, `cargo install fgctl`.
6. Skipped (optional; the second machine ran the suite on the same code).
7. `fgctl stage` + `upgrade` + `distribution.json` restored + hashes unchanged + `fgctl verify` 0, per workspace.
8. `fgos doctor --fix` with the new release: exit 0 in all three.
9. `fgos setup`: exit 0, `configAddedKeys` and `globalConfigAddedKeys` empty; refspecs unchanged; `git fetch` 0; forgentX `git pull --ff-only` 0.
10. Doctor through the shim: all 21 required rows (`git-*`, `lock-*`, `terminal-*`, `run-supervisor-route`, `state-root`) pass in all three; `git-mutation-one-door` scanned 939 files (payload digest `72d7218b7f4e`). Remaining fails are config rows that predate this land: mdview `model-policy-tier-coverage`, `executor-family-unique`, `tool-registry-configured`, `doc-source-conservation`, `executor-profile-warnings`, `blind-steps-use-proven-pools`; mcp-skill-hub `model-policy-tier-coverage`, `executor-family-unique`, `executor-profile-warnings`; forgentX `tool-registry-configured`, `work-step-vocabulary`, `root-drift`, `main-checkout-guard-warnings`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`.
11. Smoke in forgentX: (a) `fgos worktree create` ok; (b) claude writing run `unit-run-1792546780565-5fa8d640` pass, commit `committed` (`5f9be8faa`), no `index.lock`, pane closed itself; (c) read-only runs of claude and openai (codex) pass; (d) `fgos worktree remove --delivered-to smoke/git07` ok, branch deleted; (e) skipped, no real merge pending.

## Findings

- **Stale mutation census on main.** `cef8b532e` changed `scripts/build-rust-distribution.mjs` without regenerating `packages/git/contracts/mutation-census.v1.json`, so the release build rewrote it and `active-release-matches-checkout` failed on that one file. Committed the regenerated census on main (`293898dc0`). The second machine's report already names the churn (its line 38); the counts of untracked "outside the product" files make every new plan file change the census.
- **`active-release-matches-checkout` still fails after the land, for drift only:** the ES lane pushed `516f068ef` and `70a56032d` (three `scripts/event-store/*` files) after the build. Expected; the next land picks them up.

## Rollback

Per the guide: stop all, `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:4efa6e15a14a5fbd1c060d46dcf26f7151bf092492adbc66d4f8ac5078537612` in each workspace, restore `distribution.json` and `~/.fgos/config.json` from `.fgos/runtime/landing-r5/`, `fgctl verify`. Run `fgos doctor --fix` with the new release first so `git-operation-journal` shows `pendingCount: 0`.
