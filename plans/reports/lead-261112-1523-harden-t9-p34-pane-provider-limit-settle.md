# Lead report: T9 P34, a pane seat that hit a provider limit settles at once

Date 2026-11-12. Branch `harden/t9-p34-pane-provider-limit-settle`. Phase file `plans/261109-1718-harden-t9-host-surface/phase-34-pane-provider-limit-settle.md`.

## Cause (read from the incident unit's pane log, not assumed)

`unit-run-1794464894525-e702b487`, omp, gemini, quota-exhausted account. The pane ended on two blocks: `Error: Cloud Code Assist API error (429) ... RESOURCE_EXHAUSTED`, then `Error: Retry failed after 1 attempts: Provider requested 1800000ms wait, exceeds retry.maxDelayMs (300000ms). Original error: ...`, then an empty prompt.

The whole path from a pane to the walk already existed: the supervisor's wait loop (`detect_completed`, on its own cadence, only when the agent is idle) reads the screen through one classifier (`provider_stop_on`), the receipt names `terminal:blocked:usage-limit | provider-error`, `providerStopOf` in `settle-attempt.mjs` maps both to `provider-limit`, and `terminal-fallback.test.mjs` already proves the walk binds the next candidate. The same symptom with a 404 was fixed this way on 2026-11-06. Two gaps kept this screen from stopping:

1. The give-up line matched no wording (it is not `api error (<status>)` at the start and not a quota phrase).
2. The 429 line that would have matched `is_provider_error` sat 16 non-empty lines from the bottom; the classifier reads 12.

## Change

- `packages/agent-protocol/rust/src/direct/mod.rs`: `retry_gave_up` reads omp's `Error: Retry failed after <n> attempts: <why>` with the existing anchoring (start of line after marker and `error` label). `Provider requested ... wait` is added to `is_quota_limit` (usage-limit, so the account is quarantined with the default window); any other give-up is added to `is_provider_error` (provider-error, walk moves on, nothing quarantined). One list, shared by the terminal and the direct path. No new outcome, no new loop, no change to Node.
- Prior art reused: `is_quota_limit`, `is_provider_error`, `provider_stop_on`, `providerStopOf`, the idle-only check in `detect_completed`. Missing: only the wording.
- Not done on purpose: widening the 12-line window (the give-up line is the CLI's last words and sits within it; widening raises false positives from scrollback).

## False positives

Four terminal vectors (owning proof, `omp/vectors.json`, screen recorded from the real pane, path trimmed): the real screen gives `usage-limit`; a give-up with no wait gives `provider-error`; a retry in progress (agent working) and prose that quotes the wording give nothing. A transient 429 that omp retries within its limit keeps the agent working and never reaches the idle check.

## Proof

- Red then green: `cargo test -p fgos-agent-protocol` (terminal vectors failed on the new real-screen vector before the change, 13 pass after).
- Wiring proof: `terminal-fallback.test.mjs`, "a pane that sits idle after omp gave up on a provider wait moves the role to the next candidate". Red with the classifier change reverted (second brief never typed, 60 s timeout), green with it: attempts `[alpha provider-limit, beta pass]`.
- Also green: `supervise_terminal_fake_herdr` (12), `terminal-cutover`, `attempt-steps`, `contracts-terminal`, architecture, doc-health, census scan (0 undeclared), fmt, clippy `-D warnings`, `cargo check` for msvc and aarch64-apple-darwin.
- Citation-drift real-repo test: known red (document-identity spec), not touched.
- Real run: not done. No spare quota-bearing gemini account was named, and reproducing the incident means burning quota; the recorded real screen is the evidence.
- Full `npm test` (614 s): 2 fails, both known reds (citation drift in document-identity, V7n addendum); zero ERROR lines; +1 test() call, 0 new spawn sites.

## Authority

- "The screen says the provider ended the round" is held once, in the agent-protocol classifier (lowest layer that sees the screen). The supervisor carries the receipt reason, Dispatch settlement maps it to the outcome vocabulary, Seat Binding and the lease own quarantine. Nothing was re-derived above it.
- Found, not moved: `src/runner/dispatch/provider-auth-failure.mjs` holds a Node copy of the quota and login wordings for the account probe and headless stderr. It is a second list of the same phrases (design principle 1). The give-up wording is not in it, and the pane path does not use it. It belongs to one list in the protocol crate; moving it is a separate item, not this phase's files.

## Ideas (owner picks; not done)

- The give-up line names the requested wait (`1800000ms`); the quarantine of that account could end at that wait instead of the default window (`quotaQuarantineUntil` already parses reset windows from the screen tail). Real problem: the account is retried too early or too late; evidence: the unit above.
- Capacity selection picked an account of unknown capacity (`unknown-or-low-confidence`); a probe before launch would avoid the first failed seat (from the debug report).

## Lessons

- Read the incident's pane log against the classifier's window before designing: the fix was one missing wording, and a "new monitor" would have duplicated a working path.
- A wiring proof through a fake pane needs the brief echoed on the screen, or the supervisor ends delivery as unknown; the first attempt at the test failed for that reason, not for the code under test.
- The Rust supervisor integration tests need `cargo build -p fgos-run-supervisor --examples` first; a bare `cargo test` fails with ENOENT on the harness binary.
