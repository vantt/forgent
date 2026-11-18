# Phase 03: doctor warn for a store on a default login home

Wave 2. Depends on 1. Capability `code:implement`. Effort 1d. Discussion task `task-default-home-guard`; decisions SD3,
OD1; plan A5, A6 (Q3 = B).

## Context

Decision 86 Q2 says a claude seat never uses `~/.claude` as an account's login store, because a pane renewing a copy
of that login can make the provider revoke the real refresh token and log out the lead sessions (F15). Nothing checks
it (F11). The owner ruled (2026-11-18 18:22) that this must warn, never refuse, so a single-account user still runs
fgOS, and (Q3 = B) that it covers every CLI of `CLI_LOGIN_HOMES` (`src/runner/dispatch/llm-accounts.mjs:214`).

## Requirements

- One pure function in `src/runner/dispatch/llm-accounts.mjs`, beside `CLI_LOGIN_HOMES` and reusing it and the same
  `realpath` rule as `machineLoginStores`: for each `runner.llmAccounts.<pool>.<account>.credentialStore.<cli>`, report
  when the expanded realpath equals that CLI's default login home under the user's home (or the value of the CLI's
  home variable). Output per hit: pool, account, cli, the config key path. No file content is read.
- One doctor row `llm-accounts-default-login-home`, status `warn` on a hit and `ok` otherwise, never `fail`, no
  `--fix` (the repair is the owner logging in a second directory). Message names the key and the remedy
  (`CLAUDE_CONFIG_DIR=<own dir> claude /login`, or the CLI's own home variable) and the renewal risk in one line.
  Registered in `src/setup/registrations.mjs` and `packages/distribution/contracts/doctor-registry.v1.json` (owner
  `bridge:S6a`, judge `src/runner/dispatch/llm-accounts.mjs`), per the doctor registry contract
  (`docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` section 3: a warn row never fails).
- Lease behavior is unchanged: a store on a default home still leases.
- `docs/platform/agent-confinement/spec.md`, decision 86 Q2 store list: one sentence that the rule is now warned by
  this row, for every CLI, and never refused (owner 2026-11-18, single-account users).

## Proof (one owning proof)

Extend `test/setup/model-pool-checks.test.mjs` (owner of the account pool doctor rows): with a temp home, one store
on `<home>/.claude` and one on a private directory, plus one codex store on `<home>/.codex`: the row is `warn` naming
the two default-home keys, never the private one; a store that is a symlink to the default home also warns; with only
private stores the row is `ok`. One case asserts the pool with the default-home store still resolves its account
(no refusal). Before adding, find the existing proof of `llm-accounts-shape` in that file and extend its fixture.

## Validation

`node scripts/run-tests.mjs test/setup/model-pool-checks.test.mjs` then `test/setup/registrations.test.mjs` (doctor
registry parity); `npm test` before landing.

## Risk

Low; additive warn row. Collision: `doctor-registry.v1.json` is appended by several plans, rebase only.
