# Landing: main `88f3ecf06` release on fg-server

Landed 2026-10-23 12:40-13:45 (Asia/Saigon) by `claude-5v7u@fg-server` (IDENT lead) in `/home/vantt/projects/forgent`, the only activated workspace on this machine. Steps follow `landing-261023-1040-main-release-fg-server-identity.md`.

## Outcome

Release `sha256:e5b640fc2e40c254794802020b2d5ff95163d5a443315b6850c94e86bd147f91` active since 13:40, built from `origin/main` `88f3ecf06` (829 staged files). It carries `3cee85c9a`: the identity library doors for MAIL (`current_session`, `register_current`, `drop_role`), `fgos identity session --drop-role`, typed refusal candidates and refusals as JSON on stdout under `--json`. Previous release `sha256:8514ec4bdf7251988775151ee753ce1adffe0291136db6ddde88e577c126b4e4` stays in the store for rollback.

## Steps and checks

1. `fgos worktree create /home/vantt/projects/forgent-worktrees/land-261023-lib --detach --base origin/main`.
2. `cargo build --locked --release --workspace -j 4` and `node scripts/build-rust-distribution.mjs --out .fgos/runtime/landing-261023-lib/staged`: exit 0.
3. Canonical JSON check over `/home/vantt/projects/forgent/.fgos`: `canonical-corpus: all equal`.
4. Old release `fgos doctor --fix`: exit 0. Backups in `.fgos/runtime/landing-261023-lib/` (distribution, activation, project and global config, refspecs, protected hashes, active digest, previous `fgctl`).
5. `fgctl` reinstalled from the build tree, `fgctl stage` exit 0. The first `fgctl upgrade` was refused with `git-predecessor-writer-live`: the COOK session's `fgos workflow start architecture-advisory --foreground` was running on the old release. The old release stayed intact (`fgctl verify` 0, hashes equal). The lead waited on that process id until it exited (about an hour), then `fgctl upgrade` exited 0.
6. `distribution.json` restored, protected hashes equal, `fgctl verify` 0, `fgos doctor --fix` 0, `fgos setup`: no added keys, refspecs unchanged, hashes unchanged.
7. Doctor: 142 checks, 132 passed. The 10 not passed were all present before: `tool-registry-configured`, `work-step-vocabulary`, `run-attempts-stuck`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `confined-pane-accounts`, `agent-cli-project-trusted`, `active-release-matches-checkout`, `git-mutation-one-door`. The three identity rows pass.
8. Smoke: `fgos identity resolve nobody-zzzz --json` prints `{"error":…,"reason":"not-found","candidates":[]}` on stdout with exit 65; `--drop-role lead:NOPE --json` refuses `role-not-held`; `resolve lead:IDENT` returns this session; gateway start, status (running, reachable), stop, nothing left running; read-only `fgos run "Reply with exactly the word OK"` → pass.

## Rollback

Stop everything, then from cwd `/tmp`: `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:8514ec4bdf7251988775151ee753ce1adffe0291136db6ddde88e577c126b4e4`; restore `.fgos/distribution.json`, `.fgos/config.json` and `~/.fgos/config.json` from the backups; `cp .fgos/runtime/landing-261023-lib/fgctl.prev ~/.local/bin/fgctl`; `fgctl verify`.
