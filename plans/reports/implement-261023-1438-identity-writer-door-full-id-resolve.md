# Identity writer door and full-id resolve

Branch `ident/writer-door`, worktree `/home/vantt/projects/forgent-worktrees/identity-writer-door`.

## Public Rust signatures (crate `fgos-identity`)
- `resolve::WriterKey<'a> { pub source: &'a str, pub value: &'a str }` (Copy), `WriterKey::checked(&self) -> Option<(&'static str, &'a str)>`; exported at crate root. `env_identity` now uses `checked` (one validity rule).
- `session::key_local(&WriterKey) -> Option<Local>` (shares `env_local` with `session::local`).
- `current::session_for(state_root: &Path, key: &WriterKey) -> Result<CurrentSession, Refusal>` (`CurrentSession {local, info{id, handle}}`); `current_session` and `session_for` share `named(machine, local)`. Re-exported at crate root.
- `directory::register_writer(state_root: &Path, clone_dir: Option<&Path>, key: &WriterKey, head_pid: u32, roles: &[String], take: bool) -> Result<Listed, Refusal>` (feature `directory`).
- `register_current` unchanged signature, now a thin wrapper over private `register_session` (same body as `register_writer`).
- `directory::resolve(root, query, judge)` accepts `<machine-id>/<local id>`.

## Refusal codes added
- `invalid-writer-key`: source not in `ENV_ORDER`, or value not usable (empty, >200 chars, chars outside `[A-Za-z0-9._-]`).
- `head-not-live`: head pid unreadable or judged not alive.
- `machine-id-missing`: as before (also for a full-id resolve with no machine id).
- Full id of another machine / unknown / dead: `not-found` (other machine: detail mentions the shared directory).

## Files changed
- packages/identity/rust/src/{resolve,session,current,directory,lib,provider}.rs
- packages/identity/rust/tests/{session,directory}.rs (extended)
- apps/fgos/tests/cli_tests.rs (full-id wiring in the existing directory CLI test)
- packages/identity/contracts/identity.read.v1.json (description)
- docs/platform/identity/spec.md (section 5 doors, trust boundary, resolve; section 6 Mailbox row), CHANGELOG.md
- Not touched: mint.rs, sequence.rs, the writer-id rule.

## Proof
- `cargo test -p fgos-identity -j 4`: all green (session: key vs env vectors incl. codex/claude/worker/fgos + invalid keys; directory: codex key registers codex handle, invalid key refused, dead and unreadable head refused with no entry, full-id this/other machine).
- `cargo test -p fgos --test cli_tests identity`: 8 passed.
- `cargo test -p fgos-host-runtime catalog`: green.
- Full workspace and npm test left to the IDENT lead. mutation-census.v1.json untouched.

## Notes
- `head-not-live` tests use real pids (own pid; an exited child; u32::MAX), since `register_writer` reads OS facts itself.
