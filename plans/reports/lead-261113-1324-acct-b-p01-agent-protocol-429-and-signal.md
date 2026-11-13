# Lead report: account health B, agent-protocol 429 and provider signal

Branch `harden/acct-b-p01` on `origin/harden/acct-b-plan`. Not landed (main frozen until rc.7).

## Commits
- `ad0699b34` feat(agent-protocol): 429 is a usage limit, `provider_signal` extracted (Rust, vectors, census).
- Next commit on the branch: spec, contract json, this report.

## What changed
- `direct/mod.rs`: `api_error_status` shared by `is_quota_limit` and `is_provider_error`; 429 routed to quota (line, and give-up whose why is a 429); `last_event_is_provider_error` became `last_event_stop -> Option<BlockedReason>` (errorStatus 429 or body `RESOURCE_EXHAUSTED` -> usage-limit; other 4xx/5xx except 401/403 -> provider-error). New `provider_signal(lines)`, `Direct::provider_signal(stderr, stdout)`. Stale `provider-auth-failure.mjs` doc comment gone.
- `terminal/mod.rs`: `Terminal::stop_signal(screen)` over the same bottom-12 window.
- `outcome.rs`: `ProviderSignal` (+ `to_json`, camelCase, absent fields omitted). Re-exported from `lib.rs` with `provider_signal`. `Outcome`/`BlockedReason` unchanged.
- Vectors: direct omp `blocked-usage-limit-429-resource-exhausted` (incident 7 last event, trimmed), `expectSignal` on the omp 404 and codex usage-limit vectors; terminal omp `an-api-error-429-on-an-idle-screen-is-blocked-usage-limit` (new screen pair `provider-429-idle`, cut from the recorded give-up screen), `omp-giving-up-on-a-429-that-names-no-wait-is-blocked-usage-limit` (synthesized, source noted), `expectSignal` on the give-up vector. Both vector harnesses read optional `expectSignal` (a sibling of `expect`). One bounds test for the extractor (reset phrase, status 100-599, word 1-64, hint 80 chars) lives in `direct_vectors.rs`.
- False-positive guards `omp-retrying-a-rate-limit-within-its-limit-keeps-waiting` and `an-api-error-the-agent-mentions-mid-sentence-keeps-waiting` unchanged and green.
- Spec section 4 (rules 3-4, wording bullets, signal paragraph) and section 9 entry 2026-11-13; contract json names `providerSignal` and 429 under usage-limit.

## Gates (logs in /dev/shm)
- `cargo test -p fgos-agent-protocol -p fgos-run-supervisor`: all ok (acct-b-p01-cargo.log; first run acct-b-p01-test1.log/test2.log).
- `cargo clippy ... --all-targets -D warnings` clean (acct-b-p01-clippy.log); `cargo fmt --all --check` clean.
- `cargo check -p fgos-agent-protocol` for x86_64-pc-windows-msvc and aarch64-apple-darwin: ok.
- Node: architecture, doc-health, decision-citation-drift: 90 pass (acct-b-p01-node.log). run-supervisor contracts, contracts-terminal, terminal-fallback, direct-crash-matrix: 25 pass (acct-b-p01-sup.log).
- One-door scan: 0 undeclared, class counts unchanged.
- Mutation check: a wrong `expectSignal` in a codex vector fails the harness (it asserts).
- Full `npm test` not run: no wiring changed (P02 reads the new API), focused suites above cover every reader of the crate.

## Proposed CHANGELOG line
`Fixed: a provider 429 / RESOURCE_EXHAUSTED now ends a run as a usage limit instead of a provider error, so the account is quarantined; the agent protocol also reads the provider's own status, wait and reset phrase.`

## Size and tests
Net about +300 Rust lines incl. extractor and tests (plan estimated +90 for the matcher), +5 vectors, +1 screen pair. `is_provider_error` lost the 429 arm. Tests retired: none.

## Authority notes
- The pre-commit one-door guard refused the commit until `packages/git/contracts/mutation-census.v1.json` was regenerated (it digests every touched Rust file), so the census is in `ad0699b34`. The landing lead regenerates it (never hand-merge).
- Resolved ambiguity: `expectSignal` sits beside `expect` on a vector, matched for equality; `resets in` durations are tokenized (digits plus unit words) so trailing prose is not captured.

## Lessons
- The mutation census makes every Rust phase touch a shared file at commit time, whatever the plan says; plan landing order around regenerating it.
- A sibling `expectSignal` key kept the existing expected-outcome comparison untouched in both harnesses.
- Hand-written extractors need an explicit bounds test; the recorded vectors alone never exercise `resets in`.
