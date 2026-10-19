# Latest main landed on the second machine (Git 02 dormant, MP-B2 phase 06 config)

Date 2026-10-19, 10:39–10:51 (Asia/Saigon), second machine (`~/projects/forgent`), session `ac420727`. Follows [the 09:14 re-landing](landing-261019-0914-git-01-relanding-this-machine.md) and the procedure of [the owner-machine landing at 10:26](landing-261019-1026-git-01-and-cook-mpb2-owner-machine.md).

**Outcome: landed and kept.** Release `sha256:8c096e8fe8be8a0cf69f196da3dbabe233044650933a8733c5cf7be0ed0757f9` is active (previous `8d4b216e…`); `fgctl verify` passes.

## What is new against the previous release here

- The previous release (`8d4b216e…`, main `af1f2db2b`) already carried COOK P1+P3, the codex prompt door and MP-B2 phases 00–05. The only code difference is Git phase 02 (dormant; adds the `git-transport-config` doctor row).
- Built from origin/main `6abb0e8d3` (the owner-machine report commit; same code as the owner's `f85fc7d3f` plus docs). The digest differs from the owner's `4591f097…` because the tree is a later commit.

## MP-B2 config on this machine

- Project `.fgos/config.json` is tracked, so phases 04 and 06 arrive by git. Phase 04 (`4f6fc44d7`) was already here before this landing. Phase 06 (`4f7050d7f`, drop `resourceBindings` and `env[homeEnv]` where `credentialStore` is declared) reached origin/main during this landing and was fast-forwarded in after activation, which is its gate. 10 invocations declare `credentialStore`, 0 keep `resourceBindings`. Both this release and the rollback release read `credentialStore`, so the rollback stays safe.
- Global `~/.fgos/config.json`: no invocation carries `resourceBindings` or `credentialStore` (one unconfined `pi` invocation under `openai`; accounts declared under `providers.<p>.accounts.<a>.credentialSources`). Nothing to change; the MP-C note about 13 global `resourceBindings` applies to the owner machine only.
- No config value was printed. Backups before activation: `.fgos/runtime/tmp/landing-latest-main-this-machine/` (`global-config.json` mode 600, `project-config.json`, `distribution.json.main`, `before.sha`, fetch refspecs, `fgctl.prev` `ed821504…`).

## Steps as run

1. **Quiesce:** no `fgos`, `fgctl` or gateway process, no file open under `.fgos/` or the state root. Other herdr panes were idle user sessions, left alone and excluded from fencing by cwd. No leftover pane of ours.
2. **Old-release `fgos doctor --fix`:** `run-attempts-stuck` adopted 0; 279 open, none stuck.
3. **Build:** clean detached worktree of origin/main at `/home/vantt/.claude/jobs/e1505f04/tmp/land3/wt` with its own fresh `CARGO_TARGET_DIR` (`land3/tgt`, 270 crates compiled), `cargo build --locked --release --workspace`, then `scripts/build-rust-distribution.mjs`: 748 staged files with `libexec/native/fgos.node`.
4. **fgctl:** reinstalled from the same worktree (sha256 `e1f56bcd…`).
5. **Activation:** `fgctl stage` and `fgctl upgrade --from <tree>`; `.fgos/distribution.json` restored; `AGENTS.md`, `.claude/settings.json`, `CLAUDE.md` and both configs unchanged by activation (hash check).
6. **Fences:** `fixLockFences` from the new payload, run from `/tmp`: 7 placed after activation, 4 more for the smoke units; `lock-fences` 364/364.
7. **`fgos setup`:** exit 0, no config keys added. `git-driver-directories` already safe; `git-wal-dir` "Git WAL initialized and trusted"; `git-publication-refspecs` "no fetch mapping change needed". It regenerated `docs/decisions/index.md` from this machine's event log (5 decisions missing); restored with `git checkout`, as before.
8. **Git remote:** `+refs/heads/*`, `+refs/fgos/events/*`, glob `+refs/fgos/legacy*:refs/fgos/remotes/origin/legacy*`; no exact legacy line. `git fetch origin` exit 0; `git pull --ff-only` to `51c61af64`.

## Doctor through the shim

| Check | Result |
|---|---|
| `git-component-compatible` | pass (napi 8; gitPort 1, receipt 1, walRecord 1, eventStore 4; floor 2.53.0) |
| `git-transport-config` | pass (no repository-local transport settings) |
| `git-trust-topology`, `git-operation-journal`, `git-native-locks`, `git-publication-refspecs`, `git-durability-capability` | pass |
| `run-attempts-stuck` / `legacy-attempts-stuck` / `cancel-wait` | pass (279 open, none stuck / none / 15000 default) |
| `units-awaiting-resume` | warning: the old abandoned unit `unit-run-1792328096425-79e2470b` (06:59, harmless) |
| `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `lock-fences`, `lock-record-unreadable`, `lock-predecessor-kill-wait`, `state-root` | pass |
| `confinement-orphaned-resources-reaped`, `credential-copies-retained` | pass |
| `active-release-matches-checkout` | fail: changed=0, 4 missing, all under the git-ignored `.agents/skills/instruction-audit/` (same as every landing here) |

Total 139 checks, 10 failing, the same set as at 09:14: the row above plus `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary`, `decision-index-stale`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `agent-cli-project-trusted` (the default `~/.codex` home has no trust entry; the leased account homes do), `confined-pane-accounts` (account `tetnu` declares no `pi` credential source for `pi-cli-bwrap`).

## Smoke (this workspace, read-only, no work item)

- **claude through herdr:** `unit-run-1792381576372-acdd4514`, adapter `herdr-spawn`, outcome `pass` ("README.md has 205 lines").
- **codex through herdr:** `unit-run-1792381605862-68434263`, `--provider openai --account tetnu`, invocation `codex-herdr`, outcome `pass`; brief acknowledged in the first round (prompt door). Both `tetnu` and `tetcu72` homes trust this repo. This round ran on the phase 06 config (no `resourceBindings`, no `CODEX_HOME` env), so it is also the codex proof of phase 06 on this machine.
- **6.4 Ctrl-C and resume:** `unit-run-1792381639980-4e151991`, prompt with a 60 s wait. SIGINT after 25 s: exit 130 with `chờ resume: fgos run --resume …`, attempt 01 receipt `cancelled`. `fgos run --resume`: `runs/02` with `supersedesRunId` = attempt 01, unit outcome `pass`. The retained pane `w6:p7F` of attempt 01 was closed by hand.

## Rollback (not used)

`/home/vantt/.claude/jobs/e1505f04/tmp/land3/rollback.sh`: stop check, `fgctl upgrade --from` the stored `8d4b216e…` release, restore `.fgos/distribution.json`, `git checkout -- .fgos/config.json`, restore the global config backup, verify hashes and `git fetch`.

The temporary build worktree was removed after landing; the release stays in the state root.

No component-boundary change.
