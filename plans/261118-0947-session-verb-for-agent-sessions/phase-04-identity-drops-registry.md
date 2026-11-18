# Phase 4: Identity stops reading sessions.json

Decision: SV-6. Depends on phase 3 (`session.rs` was the last other caller of `resolve_current(Some(dir))`). Evidence: scan report §1, §4.

## Inputs (read first)
- `packages/identity/rust/src/{resolve,current,directory,provider}.rs` (`registry_confirms`, `REGISTRY_FILE`, `Source::Registry`, every `fgos_dir`), `packages/identity/rust/tests/session.rs`, contracts `identity.writer.v1.json` (`x-registryFile`, `x-sessionRegistry`, `registry` variants) and `identity.writer.golden.v1.json`; the node-addon binding of `sessionIdentity.resolve`; `packages/mailbox/rust/store/src/hook/resolve.rs` (`Source::Registry` at `:43`, S6a D1).
- `src/util/session-identity.mjs` and every caller of `resolveWriterIdentity(` (`rg -l "resolveWriterIdentity\(" src bin test`, 13 source files at base).
- Rust callers: `apps/fgos/src/wiring/mailbox_verbs.rs:638`, `apps/fgos/src/wiring/doctor/identity.rs:163`, `apps/fgos/src/cli_projector.rs` (`identity` options), `rg -n "resolve_current|fgos_dir" apps packages --glob '*.rs'`.
- `--fgos-dir` in `src/cli/command-registry.mjs` (`identity`, `identity session`) and `docs/platform/identity/spec.md` (lines ~115, 177, 186, 197, 201).

## Files this phase may write
See the phase table footprint in plan.md.

## Facts re-checked on main 6de11eaf0 (lead, 2026-11-19)
- Registry reader: `packages/identity/rust/src/resolve.rs` `REGISTRY_FILE` :22, `registry_confirms` :125,
  `Source::Registry` :151-152, `env_identity(lookup, fgos_dir)` :141, `resolve_current(fgos_dir)` :279; `lib.rs:68`
  re-export; `current.rs` :159/:169/:174; `provider.rs` `ResolveRequest.fgos_dir` :163 (:211, :502, :509, :523);
  `directory.rs` `register_current` :518, `drop_current_role` :924.
- Phase 7's identity code (`bind_agent_session`, `attempt_session`, `register_attempt_roles`, `caller_under_head`,
  `attempt_gate`) takes no `fgos_dir` and reads no registry: not affected.
- Callers outside the first footprint (now in row 4, all move in this phase, L10): `packages/questions/rust/src/caller.rs`
  :43/:54; `packages/git/node-addon/src/session_identity.rs:15`, `git.rs:248`, `config.rs:412` (the addon's
  `sessionIdentity.resolve` takes `fgos_dir` from Node); `apps/fgos/src/wiring/{mailbox_remote.rs:754,
  session_rotation_hook.rs:242, worktree.rs:232, git_incidents.rs:150, doctor/config.rs:211}`; `packages/config/rust`
  and `packages/observe/rust` pass `None` only. `identity.read.v1.json:13` carries `fgosDir`.
- Mailbox hook: `hook/resolve.rs:102` `resolve_current(Some(fgos_dir))`, :104 `Source::Env | Source::Registry`;
  `mailbox_verbs.rs:641`; `doctor/identity.rs` :165/:174-175 (`--fgos-dir`), :227 (`"registry" | "env"`), :237/:243.
- `cli_projector.rs` :449/:460/:464/:555; `command-registry.mjs` :1136/:1144/:1167; generated manifest regenerated.
- Node facade `src/util/session-identity.mjs:25-35` (dir-keyed cache) and 16 caller files of `resolveWriterIdentity(`.
- Tests: `tests/session.rs:83-89`, `tests/golden.rs` (registry cases, `x-sessionRegistry` :178-198),
  `cli_tests.rs:1534,1552`, `test/util/session-identity.test.mjs:88-110`; `test/state/replay.test.mjs:812` fixture string.
- Docs: `docs/architecture-manifest.json:744` sessions.json door row; identity spec 115-198.

## Steps
0. Re-grep the inputs; confirm no code branches on `source === 'registry'`.
1. Rust: delete `registry_confirms`, `REGISTRY_FILE`, `Source::Registry`; remove the `fgos_dir` argument from `env_identity`, `resolve_current`, `current_session` and the provider request; the env step returns `source: env`.
2. Contracts and golden: drop the registry fields and `registry` source; regenerate the golden through its own test door.
3. Node facade: `resolveWriterIdentity()` takes no argument; cache keyed by env only; move every caller in the same change.
4. CLI: drop `--fgos-dir` from `identity` and `identity session`; regenerate manifest and routes; doctor's cross-host identity probe stops passing it.
5. Spec: remove the registry confirmation rows and the `sessions.json` mention (keep the note that the machine directory is the session record).

## Verify
- `cargo test -p fgos-identity -p fgos` and clippy; `node --test test/util/session-identity.test.mjs test/git/inspect.test.mjs test/state/hot-lock-multiprocess.test.mjs` through `scripts/run-tests.mjs`.
- `rg -n "registry_confirms|Source::Registry|fgos-dir|resolveWriterIdentity\([^)]" packages apps src bin` finds nothing.

## Rollback
`git revert` the phase commit set; regenerate manifest and golden.
