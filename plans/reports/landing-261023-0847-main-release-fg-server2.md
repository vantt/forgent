# Landing: main `199d85223` release on this machine (fg-server2)

Landed 2026-10-23 08:54-08:57 (Asia/Saigon) in workspace `/home/vantt/projects/forgent`, the only fgOS workspace on this machine, at the owner's request ("land main on this machine"). The steps follow `landing-261022-1018-seat-t0-release-this-machine.md`; `landing-261023-0133-t1-and-seat-owner-machine.md` was read for IDENT and T1 specifics. HARDEN, TEST and OPC had said no hold; no `fgos`, `fgctl` or gateway process was running.

## Outcome

Release `sha256:c91242ea839639eda9ff435c7f1f6db62c91fcacd05c71847e3596f07c4147ff` has been active since 08:57, built from `origin/main` `199d852236582675a92d183f04ea19ac0ed83369` (829 staged files). The previous release `sha256:a424fc0f0c431ebd85b882c44dcb923184f814e64292a717e89fe718a95c691d` (main `c56f1eae3`, active since 2026-10-22 19:55) stays in the store for rollback.

It adds the 86 commits since `c56f1eae3`, among them IDENT 04/07 (`fgos identity mint` door), the terminal writer-id fix, COOK's pane fix and TEST fixes.

## Steps and checks

1. **No pull.** The main checkout was left untouched (it holds another session's uncommitted `AGENTS.md` and `.claude/settings.json` edits). `git fetch origin` only, then `fgos worktree create /home/vantt/projects/forgent-worktrees/land-261023 --detach --base origin/main` (tip `199d85223`).
2. **Build** in that worktree with `CARGO_TARGET_DIR=/home/vantt/projects/.cargo-out-land-261023`: `cargo build --locked --release --workspace` (finished), then `node scripts/build-rust-distribution.mjs --out /home/vantt/projects/.fgos-staged-261023`, digest as above.
3. **Canonical JSON check (required by the T0 guide).** `canonical-corpus.mjs` over `/home/vantt/projects/forgent/.fgos`: 15,259 files, 25,934 documents, 4,622,508 subtrees, 0 mismatches, 9 skipped (over 8 MiB). `canonical-corpus: all equal`.
4. **Cleanup with the old release.** `fgos doctor --fix`: exit 0. `lock-holders` 0 held of 234 lock files, `git-operation-journal` pendingCount 0. `run-attempts-stuck` reports 1 old attempt (`unit-run-1792482363495-797e4401`, written by a removed dev-host release; pre-existing, adopt cannot run it).
5. **Backups** in `.fgos/runtime/landing-261023/`: `distribution.json`, `activation.json`, `project-config.json`, `global-config.json` (mode 600), `refspecs.txt`, `hashes.txt` (`.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `~/.fgos/config.json`), `active-digest.txt`, `fgctl.prev`.
6. **Activate.** `fgctl` reinstalled from the build tree (`cargo install --locked --path apps/fgctl --root ~/.local`, run from `/tmp`), `fgctl stage` ok, `fgctl upgrade` 08:54:14 to 08:57:03 exit 0, `distribution.json` restored from backup, all five protected hashes equal, `fgctl verify` exit 0.
7. **New release `fgos doctor --fix` and `fgos setup`:** both exit 0. `configAddedKeys` and `globalConfigAddedKeys` empty, refspecs unchanged, hashes of the five protected files unchanged afterwards.
8. **Doctor through the shim:** 143 checks, 10 not passed. The 24 required rows that exist in this release (`lock-*`, `terminal-*`, `seat-binding-*`, `identity-*`, `git-*`, `process-containment`, `run-supervisor-route`) all pass except `git-mutation-one-door` (below). `identity-machine-id`: machine `fg-server2-jdp2bv`, handle `fg-server2`; `identity-project-id` and `identity-ids-unique` pass. There is no `state-root` row in this release.
9. **Smoke:**
   - Gateway `start`, `status` (`running` true, `reachable` true, port 4170), `stop` (no gateway process left).
   - `fgos identity machine --json`: `{"id":"fg-server2-jdp2bv","handle":"fg-server2","alias":null}`.
   - Read-only `fgos run "Reply with exactly the word OK"`: pass on gemini (claim "Completed objective: OK.").
   - The writing smoke in a scratch worktree was not asked for this time and was not run.

## Doctor rows not passed

- `git-mutation-one-door`: 5 `unresolved-binary` Git spawn sites (`bin/fgos.mjs:3472`, `bin/fgos.mjs:3616`, `src/runner/merge.mjs:940`, `src/runner/merge.mjs:970`, `src/runner/worktree.mjs:146`). Not a regression: the old release `a424fc0f…` reported the same 5 sites (line numbers shifted), and the owner accepted this red at the 2026-10-23 01:20 landing until CFG fixes the census sites. Flagged for the controller because the brief listed every `git-*` row as required.
- `active-release-matches-checkout`: passes (changed=0, missing=0, extra=0). The expected stale-checkout flag did not appear, so the main checkout's Node payload matches the new release.
- Not related to this landing (all present before): `executor-skills-installed` (`.agents/skills/ak-cook/SKILL.md` missing), `tool-registry-configured` (0/2 present, never checked), `work-step-vocabulary` (`tsk-5db`), `run-attempts-stuck` (1 old attempt), `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings` (informational), `confined-pane-accounts`, `agent-cli-project-trusted` (codex has no trust entry for this folder).

## Left on disk

- `/home/vantt/projects/forgent-worktrees/land-261023` (426 MB, detached at `199d85223`). `fgos worktree remove ... --delivered-to origin/main` refused with `worktree-ignored-bytes-preserved` (ignored `.fgos/runtime/tmp` and `.fgos/runtime/git-addon`). Not force-removed. Remove it once the controller has reviewed the ignored bytes.
- `/home/vantt/projects/forgent/.fgos/runtime/landing-261023/` (backups, keep until the release is accepted).
- `/home/vantt/projects/forgent/apps/fgos-gateway/target/release/fgos-gateway`, from `fgos gateway start`.
- Removed: the staged directory `/home/vantt/projects/.fgos-staged-261023` and the Cargo target `/home/vantt/projects/.cargo-out-land-261023`.
- The main checkout's pre-existing uncommitted edits and untracked files were not touched; `.fgos/config.json.pre-seat-binding-20261022T015850445Z` was already there before this landing.

## Rollback

Stop everything, then:
1. From cwd `/tmp`: `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:a424fc0f0c431ebd85b882c44dcb923184f814e64292a717e89fe718a95c691d`.
2. Restore `.fgos/distribution.json` and `.fgos/config.json` from `.fgos/runtime/landing-261023/` (`distribution.json`, `project-config.json`), and `~/.fgos/config.json` from `global-config.json`.
3. `cp .fgos/runtime/landing-261023/fgctl.prev ~/.local/bin/fgctl`, then `fgctl verify`.
