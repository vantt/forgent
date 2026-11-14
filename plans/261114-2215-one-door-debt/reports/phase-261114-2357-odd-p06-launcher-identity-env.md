# Report: launcher identity environment decided once

Branch `one-door-debt/p06`, cut from origin/main 3cd0b8c41.

## Done

- `packages/identity/rust/src/launcher.rs`: `launcher_env(writer_id, parent) -> LauncherEnv { set, unset }` replaces the
  never-called `scrub_and_set` (deleted; re-export updated in `lib.rs`). `unset` is the scrub list, minus the parent name when
  it is set. Empty writer id refused.
- Addon `sessionIdentity.launcherEnv(writerId, parent)`; facade `launcherEnv` in `src/util/session-identity.mjs` (NUL and type
  guard, `empty-writer-id` mapped to `WriterIdentityError`).
- `withIdentityEnv` (`direct-launch.mjs`) applies the answer and names no variable. `terminalAgentArgs`
  (`assignment-runner.mjs`) builds codex's `shell_environment_policy.set` entries from the answer's `set`.
- `agent-hooks.test.mjs`: one test that the generated extension's `startsWith` literal equals the minted attempt prefix.
- `doors` row "writer and session id environment" added, no debt.

## Behaviour change

The gate runs `env_clear` and then applies the attempt's `env` and secrets (`gate/unix.rs:655`, `windows.rs:254-255`), which
are exactly what `withIdentityEnv` builds; it does not drop the session names itself. So an executor whose own `env:` block
declared `PI_SESSION_FILE`, `PI_SESSION_ID`, `CODEX_THREAD_ID` or `CLAUDE_CODE_SESSION_ID` used to pass it to the agent, and
now the scrub drops it. Accepted by the big lead: forwarding one fixed session id into every attempt would make attempts share
one agent session, which the scrub exists to prevent. Terminal-cutover tests pass unchanged.

## Doors row, final `allowed` (15 files, as found by the check)

Identity crate: `launcher.rs`, `resolve.rs`, `session.rs`. Facade/help: `src/util/session-identity.mjs`,
`src/cli/command-registry.mjs`. With reasons: `src/setup/agent-hooks.mjs`, `src/setup/registrations.mjs`,
`apps/fgos/examples/mailbox-ident-cost.rs`, and scripts `event-store/settle-host-proof.mjs`, `event-store/v-spawn-bench.mjs`,
`lib/mailbox-behaviour-run.mjs`, `lib/mailbox-live-cli.mjs`, `record-mailbox-hook-fixtures.mjs`,
`regenerate-observe-fixtures.mjs`, `stress-test-files.mjs`. `debt`: empty. `direct-launch.mjs` and
`assignment-runner.mjs` do not match. The patterns include `PI_SESSION_FILE` (the scrub list names it); only `launcher.rs` matched it. `retiredBy` is the Node-payload retirement. (15 files, not the ~21 the phase expected:
the mailbox heads and worker allowlist readers do not name these variables as JS/Rust strings.)

## Gates

fmt, clippy (`-D warnings`), `cargo test -p fgos-identity`, `cargo check` for windows-msvc and aarch64-apple-darwin: green.
Phase node gate list plus `rg -l "withIdentityEnv|session-identity" test`: 267 pass, 3 skipped, 0 fail.
`check-decision-citation-drift`: no new findings. `git-one-door-scan`: 0 undeclared sites; the census file
`packages/git/contracts/mutation-census.v1.json` was regenerated (`--write-census`) because it is digest-bound to the payload.

## CHANGELOG

`## [Unreleased]` line for the big lead: "An executor's env no longer passes PI_SESSION_FILE, PI_SESSION_ID, CODEX_THREAD_ID or CLAUDE_CODE_SESSION_ID to the agent; each attempt gets its own session."

## Lessons

- A census digest covers the whole payload: any product-file edit needs `--write-census`, or `git-mutation-census.test.mjs` fails.
- Passing `rg -l` output to run-tests includes non-`.mjs` files (`test/suite-baseline.json`); filter to `.mjs`.
- The doors check lists one failure per file, so an empty `allowed` row is a cheap way to enumerate every matching file.
- Writing the manifest through a JSON round trip reformats the whole file; edit the text.

## Authority

`fgos-identity` `launcher_env` is the sole decider of which writer variables an agent gets and which session variables it must not carry.
