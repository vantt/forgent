---
phase: 5
title: "Retire the Node wording list; the probes judge through the Rust matcher"
status: pending
depends_on: [1, 4]
parallel: "last; serial after P04 (shared provider-capacity.test.mjs); file-disjoint with P06"
branch: harden/acct-b-p05
---

# P05 - delete `provider-auth-failure.mjs`

**Decision: retire, not align.** Evidence:

- The module's only importers are the two probes: `src/runner/dispatch/provider-account-probe.mjs:17` (uses at `:149`, `:158`, `:160`) and `src/runner/dispatch/provider-credential-probe.mjs:20` (uses at `:91-92`). Settlement stopped using it in `6e011e056`/`4597694c0`; the runner spec text naming `AUTH_FAILURE_PATTERNS` (`h-6979005beaf7/spec.md:103`) is stale and P04 rewrites it.
- The account probe's harness leg already settles through the supervised door (`runAccountProbe` -> `dispatch` -> `readRunOutcome`), so the receipt's verdict reaches it as `classification.failure.code/cause` (+ P04's `providerSignal`): it needs no text matcher for quota or login.
- The credential probe runs a CLI directly in the controller process. That process already loads the combined addon for every settlement (`src/runner/dispatch/run-result.mjs:983`, `nativeDoor().runResult.deriveOutcome`, reached from `normalizeRunResultV3` `:567`), and the addon crate is a plain Rust workspace member that can depend on `fgos-agent-protocol` (`packages/git/node-addon/Cargo.toml` already depends on `fgos-run-result`). So the Rust matcher is reachable; there is nothing to align.

## Requirements

1. Addon: `packages/git/node-addon` depends on `fgos-agent-protocol`; new `src/agent_protocol.rs` exports `agentProtocol.classifyDirect(cli, exitCode, stderrTail, stdoutTail) -> {reason: "login"|"usage-limit"|"provider-error"|null, providerSignal|null}` (P01's `Direct::classify` with no result path, and `Direct::provider_signal`).
2. Credential probe: keeps stdout and the merged tail separately; `judgeProbeOutput({exitCode, timedOut, cli, output, stdout})` asks `classifyDirect(cli, exitCode, output, stdout)`: timed out -> fail; `login` -> "the login is still rejected"; `usage-limit` with non-zero exit -> "the account answers with a usage limit" (+ status/wait from the signal); `provider-error` with non-zero exit -> "the provider refused the call (<status>)"; non-zero exit -> as today; else ok. `cli` comes from the plan's `command`.
3. Account probe: `readRunOutcome` carries `failure.cause` and `providerSignal`; `classifyAccountProbe` maps `provider-limit` + `credential` -> `auth`, + `quota` -> `quota`, + `provider` -> `other` with the signal as evidence; trust/sandbox/timeout patterns unchanged; the `ok` branch no longer re-reads text for a login (a settled run with a claim is ok: outbox wins, protocol rule 1).
4. Delete `src/runner/dispatch/provider-auth-failure.mjs`, its manifest entry (`docs/architecture-manifest.json:152`) and `test/runner/provider-auth-failure.test.mjs`.

## Files

- Create: `packages/git/node-addon/src/agent_protocol.rs`.
- Modify: `packages/git/node-addon/Cargo.toml`, `packages/git/node-addon/src/lib.rs`, `src/runner/dispatch/provider-credential-probe.mjs`, `src/runner/dispatch/provider-account-probe.mjs`, `docs/architecture-manifest.json`, `test/runner/provider-credential-probe.test.mjs`, `test/runner/provider-account-probe.test.mjs`, `test/runner/provider-capacity.test.mjs` (receives moved cases).
- Delete: `src/runner/dispatch/provider-auth-failure.mjs`, `test/runner/provider-auth-failure.test.mjs` (+ its line in `test/suite-baseline.json:356` via `scripts/test-proof-inventory.mjs --write-baseline` in the same commit).

## Retired tests, each with its new owner

| Test in `provider-auth-failure.test.mjs` | New owner |
|---|---|
| `:13` pi missing key; `:18` prose is not a dead credential; `:31` tail window | direct vectors `pi/blocked-login`, `pi/a-quoted-key-sentence-is-not-a-block`, `*/login-wording-far-up-is-not-a-block` (`cargo test -p fgos-agent-protocol`) |
| `:56` codex usage-limit line; `:61` pi 402 and prose; `:68` quoted / far-up quota | `codex/blocked-usage-limit`, `pi/blocked-usage-limit-openrouter-402`, `codex/outbox-beats-quoted-wording`, `*/login-wording-far-up-is-not-a-block` |
| `:38` quota keeps quota class; `:83` quota transcript with old login line keeps a reset time | `provider-capacity.test.mjs:551` (H1 default until) and vector `codex/a-quota-stop-whose-transcript-quotes-an-older-login-error-is-a-usage-limit` |
| `:43` provider HTTP error is evidence-only | moved as one case into `provider-capacity.test.mjs` (no other owner) |
| `:94` settlement takes the stop from the caller, not stderr | `attempt-steps.test.mjs` cases `a direct agent whose receipt names a dead login settles as a provider limit` (`:539`) and the provider-error name table (`:492-494`); text-not-judged is proven by `:155` |

Owning proofs added: addon wiring - extend `the call is judged by exit code and by what it printed` (`provider-credential-probe.test.mjs:60`) to drive the real addon with a gemini 429 last event and a login tail; account probe - extend `outcome classes come from what the run settled with` (`provider-account-probe.test.mjs:68`) with failure causes. Net size: -69 module lines, -~130 test lines, +~40 Rust addon, +~25 Node.

## Validation

`cargo build --release -p fgos-node-addon`; `cargo test -p fgos-node-addon`; `node scripts/run-tests.mjs test/runner/provider-credential-probe.test.mjs test/runner/provider-account-probe.test.mjs test/runner/provider-capacity.test.mjs test/architecture.test.mjs`; `rg provider-auth-failure src test docs/architecture-manifest.json packages/agent-protocol` is empty; msvc + `aarch64-apple-darwin` `cargo check -p fgos-node-addon`.

## Risk / rollback

Risk: credential probe now reads 5 final lines, not 16 KB - a login error followed by more than 5 lines falls to the exit code (still fails when non-zero). Risk: addon missing in a checkout run - the probe throws inside `probeQuarantinedAccounts`' try, which records a failed probe and keeps the account locked (same as today's settle without the addon). Rollback: revert the merge commit (restores module and test).
