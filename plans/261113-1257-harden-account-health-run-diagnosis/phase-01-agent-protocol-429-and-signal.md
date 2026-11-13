---
phase: 1
title: "Agent-protocol: 429 is a quota stop; the provider's signal is extracted"
status: pending
depends_on: []
parallel: "wave 1 with P03 and P06; touches only packages/agent-protocol/** and its spec"
branch: harden/acct-b-p01
---

# P01 - agent-protocol: 429 / RESOURCE_EXHAUSTED -> usage-limit, `provider_signal`

**Authority:** the agent-protocol classifier stays the one place that reads a CLI's last words (P34 lead report "Authority"). It gains a pure extractor of the provider's own signal; nothing above it re-reads text.

## Context (verified)

- Direct: `last_event_is_provider_error` (`packages/agent-protocol/rust/src/direct/mod.rs:197-213`) treats any 4xx/5xx except 401/403 as `provider-error`, 429 included. Incident #7 (`unit-run-1794436407348-b2fc6cf2/producer/1/runs/01/stdout.log`) ends on `{"stopReason":"error","errorStatus":429,"errorMessage":"Cloud Code Assist API error (429): {... \"status\": \"RESOURCE_EXHAUSTED\" ...}"}` and its receipt says `direct:blocked:provider-error`.
- Screen: `is_provider_error` (`direct/mod.rs:220-241`) matches `api error (429)`; `is_quota_limit` (`:169-177`) does not. `provider_stop_on` (`terminal/mod.rs:283-292`) checks quota first, then provider error, on the bottom 12 lines.
- `retry_gave_up` (`direct/mod.rs:185-191`): a give-up whose `why` starts `provider requested` is quota (`:176`); any other give-up is provider-error (`:223`), including `Retry failed after 3 attempts: Cloud Code Assist API error (429)`.
- `Outcome`/`BlockedReason` (`outcome.rs`) stay as they are: the signal is a separate pure function, so no caller of the enums moves.

## Requirements

1. Direct, last JSON event with `stopReason: error`: `errorStatus == 429`, or an `errorMessage` whose embedded error body has `status: "RESOURCE_EXHAUSTED"`, gives `blocked(usage-limit)`; other 4xx/5xx except 401/403 stay `provider-error`.
2. Screen and stderr: an anchored `<api> api error (429)` line is quota (`is_quota_limit`), never `is_provider_error`; a give-up whose `why` is an `api error (429)` is quota.
3. `pub fn provider_signal(lines: &[&str]) -> Option<ProviderSignal>` (new type in `outcome.rs`, `serde_json::Value` out, camelCase keys, `None` when no field found) reads: `status` (u16, 100-599) from `errorStatus` or `api error (<n>)`; `statusWord` (`[A-Z_]{1,64}`) from the error body `status`; `requestedWaitMs` (u64) from `provider requested <n>ms wait`; `resetHint` (<= 80 chars) the matched `resets? in <dur>` or `try again at <h:mm am|pm>` phrase. Exposed as `Direct::provider_signal(stderr_tail, stdout_tail)` (same 5-line tails and last-event rule as `classify`) and `Terminal::stop_signal(screen)` (same bottom-12 window as `provider_stop_on`).
4. A working pane is never judged (unchanged); prose that quotes the wordings matches nothing (anchoring unchanged).
5. Doc comment at `direct/mod.rs:4-5` stops citing `provider-auth-failure.mjs`.

## Files

- Modify: `packages/agent-protocol/rust/src/direct/mod.rs`, `rust/src/terminal/mod.rs`, `rust/src/outcome.rs`, `rust/src/lib.rs` (re-export `ProviderSignal`), `rust/tests/direct_vectors.rs`, `rust/tests/terminal_vectors.rs` (read optional `expectSignal`), `contracts/agent-protocol.v1.json`, `contracts/fixtures/direct/omp/vectors.json`, `contracts/fixtures/terminal/omp/vectors.json`, `docs/platform/agent-protocol/spec.md`.
- Create: `contracts/fixtures/terminal/omp/provider-429-idle.txt` + `.insp.json` (trimmed from the recorded screen of `unit-run-1794436522404-2dbd5ab0`, cut after the 429 block, source noted).
- Delete: none.

## Vectors (owning proof: `direct_vectors.rs`, `terminal_vectors.rs`)

- direct omp `blocked-usage-limit-429-resource-exhausted`: last event of incident #7 (trimmed) -> usage-limit, `expectSignal {status: 429, statusWord: RESOURCE_EXHAUSTED}`.
- direct omp existing `blocked-provider-error-from-the-last-json-event` (404) keeps `provider-error`; add `expectSignal {status: 404, statusWord: NOT_FOUND}`.
- terminal omp existing `omp-giving-up-on-a-provider-wait-longer-than-its-limit-is-blocked-usage-limit`: add `expectSignal {status: 429, statusWord: RESOURCE_EXHAUSTED, requestedWaitMs: 1800000}`.
- terminal omp new `an-api-error-429-on-an-idle-screen-is-blocked-usage-limit` (the new screen file).
- terminal omp new `omp-giving-up-on-a-429-that-names-no-wait-is-blocked-usage-limit` (synthesized from the 503 give-up vector, source noted).
- existing `omp-retrying-a-rate-limit-within-its-limit-keeps-waiting` and `an-api-error-the-agent-mentions-mid-sentence-keeps-waiting` stay `none` (false-positive guards).
- codex `blocked-usage-limit` gets `expectSignal {resetHint: "try again at 7:18 PM"}`.

Tests retired: none. Net size: about +90 Rust lines, +6 vectors, +1 screen pair; `is_provider_error` loses the 429 arm.

## Steps

1. Red: add the vectors; `cargo test -p fgos-agent-protocol` fails on the 429 ones.
2. Add `api_error_status(rest) -> Option<u16>` used by both `is_quota_limit` and `is_provider_error`; route 429 to quota; extend `last_event_is_provider_error` into `last_event_stop(stdout_tail) -> Option<BlockedReason>`.
3. Add `ProviderSignal` and the two extractors; vectors' `expectSignal` assertions.
4. Spec section 4 (rules 3-4, wording bullets), section 9 entry "2026-11-13 - 429 is a usage limit, and the protocol reads the provider's own signal".

## Validation

`cargo test -p fgos-agent-protocol`; `cargo clippy -p fgos-agent-protocol -- -D warnings`; `cargo fmt --check`. Wiring is P02's.

## Risk / rollback

Risk: a 429 named by a CLI that then succeeds on its own - not judged (outbox wins, working pane not read). Rollback: revert the merge commit; P02 then reads `provider_signal` from a reverted crate, so revert P02 first.
