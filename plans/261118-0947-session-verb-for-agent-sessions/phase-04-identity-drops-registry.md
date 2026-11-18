# Phase 4: Identity stops reading sessions.json

Decision: SV-6. Depends on phase 3 (`session.rs` was the last other caller of `resolve_current(Some(dir))`). Evidence: scan report §1, §4.

## Inputs (read first)
- `packages/identity/rust/src/{resolve,current,directory,provider}.rs` (`registry_confirms`, `REGISTRY_FILE`, `Source::Registry`, every `fgos_dir`), `packages/identity/rust/tests/session.rs`, contracts `identity.writer.v1.json` (`x-registryFile`, `x-sessionRegistry`, `registry` variants) and `identity.writer.golden.v1.json`; the node-addon binding of `sessionIdentity.resolve`.
- `src/util/session-identity.mjs` and every caller of `resolveWriterIdentity(` (`rg -l "resolveWriterIdentity\(" src bin test`, 13 source files at base).
- Rust callers: `apps/fgos/src/wiring/mailbox_verbs.rs:638`, `apps/fgos/src/wiring/doctor/identity.rs:163`, `apps/fgos/src/cli_projector.rs` (`identity` options), `rg -n "resolve_current|fgos_dir" apps packages --glob '*.rs'`.
- `--fgos-dir` in `src/cli/command-registry.mjs` (`identity`, `identity session`) and `docs/platform/identity/spec.md` (lines ~115, 177, 186, 197, 201).

## Files this phase may write
See the phase table footprint in plan.md.

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
