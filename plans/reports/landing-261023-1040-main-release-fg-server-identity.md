# Landing: main `5f7825163` release on fg-server

Landed 2026-10-23 10:30-10:40 (Asia/Saigon) by `claude-5v7u@fg-server` (IDENT lead) in workspace `/home/vantt/projects/forgent`, the only activated fgOS workspace on this machine, at the owner's request (10:27: the IDENT lead's own machine still ran a release without IDENT phases 04 and 07). Steps follow `landing-261023-0847-main-release-fg-server2.md`. Announced on the board at 10:30; no `fgos`, `fgctl` or gateway process was running.

## Outcome

Release `sha256:8514ec4bdf7251988775151ee753ce1adffe0291136db6ddde88e577c126b4e4` active since 10:34, built from `origin/main` `5f7825163` (829 staged files). Previous release `sha256:fe017e043fe4bb09c326c9eddc8335507e6a21e3063711f851c06bac8326cec2` (activated 2026-10-23 00:53, carrying IDENT 00-03 only) stays in the store for rollback. The new release adds IDENT 07 (`fgos identity mint`) and 04 (`--register`, `--role`, `resolve`, `list`), with everything else landed on main since 00:53.

## Steps and checks

1. No pull of the main checkout (other sessions' uncommitted edits). `fgos worktree create /home/vantt/projects/forgent-worktrees/land-261023-fgs --detach --base origin/main`.
2. `cargo build --locked --release --workspace` (CARGO_BUILD_JOBS=4) and `node scripts/build-rust-distribution.mjs --out /home/vantt/projects/.fgos-staged-261023-fgs`: both exit 0.
3. Canonical JSON check (T0 guide script) over `/home/vantt/projects/forgent/.fgos`: 4,039 files, 14,458 documents, 741,570 subtrees, 0 mismatches, 3 skipped. `canonical-corpus: all equal`.
4. Old release `fgos doctor --fix`: exit 0.
5. Backups in `.fgos/runtime/landing-261023-fgs/`: `distribution.json`, `activation.json`, `project-config.json`, `global-config.json` (mode 600), `refspecs.txt`, `hashes.txt` (`.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `~/.fgos/config.json`), `active-digest.txt`, `fgctl.prev`.
6. `fgctl` reinstalled from the build tree (from `/tmp`), `fgctl stage` exit 0, `fgctl upgrade` 10:32:17-10:34:19 exit 0, `distribution.json` restored from backup, the five protected hashes equal, `fgctl verify` exit 0.
7. New release `fgos doctor --fix` exit 0; `fgos setup`: `configAddedKeys` and `globalConfigAddedKeys` empty, refspecs unchanged, protected hashes unchanged.
8. Doctor through the shim: 143 checks, 11 not passed. `identity-machine-id` (`fg-server-sqs7es`, handle `fg-server`), `identity-project-id` (`08b076572f6eff3a90c586a35f24e4bb`, `forgent`) and `identity-ids-unique` (59 backlog ids, 4 `D-ADR`) pass.
9. Smoke: gateway `start` / `status` (running, reachable, port 4170) / `stop`, no gateway process left; `fgos identity mint work` → `tsk-htloe4bwf3`; `fgos identity session --role lead:IDENT` then `fgos identity resolve lead:IDENT` → `fg-server-sqs7es/b8f192bf-7455-4dd2-880e-cd2a4bd995ce`; read-only `fgos run "Reply with exactly the word OK"` → pass.

## Doctor rows not passed

- `git-mutation-one-door`: the same 5 `unresolved-binary` sites as on the other machines (CFG's census fix pending, accepted by the owner 10-23 01:20).
- `active-release-matches-checkout`: changed=1, `packages/git/contracts/mutation-census.v1.json`. The main checkout moved to `a5176f398` after the build (another session's commit regenerated the census); `npm run fgos:dev` covers working-tree code until the next land.
- Present before this landing as well: `tool-registry-configured`, `work-step-vocabulary` (`tsk-5db`), `run-attempts-stuck`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings` (informational), `confined-pane-accounts`, `agent-cli-project-trusted` (codex), `git-worktree-recovery` (`cook-p6-tip`).

## Left on disk

- `/home/vantt/projects/forgent-worktrees/land-261023-fgs` (448 MB, detached at `5f7825163`): `fgos worktree remove --delivered-to origin/main` refused with `worktree-ignored-bytes-preserved` (generated `.agents/skills`, `.fgos/runtime`). Not force-removed, as on fg-server2.
- `.fgos/runtime/landing-261023-fgs/` (backups; keep until the release is accepted).
- Removed: the staged directory and the Cargo target.

## Rollback

Stop everything, then from cwd `/tmp`: `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:fe017e043fe4bb09c326c9eddc8335507e6a21e3063711f851c06bac8326cec2`; restore `.fgos/distribution.json`, `.fgos/config.json` and `~/.fgos/config.json` from the backups; `cp .fgos/runtime/landing-261023-fgs/fgctl.prev ~/.local/bin/fgctl`; `fgctl verify`.
