# HARDEN T5 follow-up: provider route faults in the agent protocol

Branch `harden/t5-route-faults-protocol` (base `d1e892ad0`), worktree
`/home/vantt/projects/forgent-worktrees/harden-t5-route-faults-protocol`. Not pushed.
Evidence: `plans/reports/debug-261106-2221-provider-route-faults-gemini-argon-agy-account-flag.md`
(sections 1, 2, 4). No P01 rows: each red proof was written first in its item's commit.

## Commits

| Commit | Item |
|---|---|
| `3e6ed6371` fix(agent-protocol): agy 1.5.2's third-party model access banner is dismissed before the brief | 1 |
| `d76a48639` feat(agent-protocol): a provider's API error ends the round as provider-error and the seat walk falls back | 2 (+ coordinator's headless scope) |
| `8393b1c19` fix(run-supervisor): a stopped pane seat's note gives the remedy for its own reason | 3 |

## 1. agy 1.5.2 start banner

- `packages/agent-protocol/rust/src/terminal/agy.rs`: second `StartBanner { marker: "changes to third-party model access", dismiss_key: "esc" }`. Not a generic `esc to dismiss` (the ready screen's other notices carry it).
- Fixture `contracts/fixtures/terminal/agy/start-banner-third-party-access.txt` built from the 1.5.2 pane quoted in the DOCOS report (banner lines verbatim; header account/path and composer filled in, as the report says the brief landed in the composer).
- Proof: new harness step `await-ready-then-deliver` in `rust/tests/terminal_vectors.rs` (a launch as the supervisor runs it: wait, then type), vector `the-third-party-model-access-banner-of-1-5-2-is-dismissed-before-the-brief-is-submitted`: asserts readiness `ready`, `sentKeys: ["esc"]`, one brief typed, outcome `delivered`.
- Red: `non-Enter key presses left: [] right: ["esc"]`. Green after the marker.

## 2. Provider API error: `provider-error`

New blocked reason `provider-error` (justification: no existing reason fits. `usage-limit` means quota and quarantines to a reset window; `login` is a credential fault locked until a person logs in; a 404 "Requested entity was not found" is neither). Exact strings as the coordinator asked: reason `provider-error`, settle `{adapterOutcome: 'provider-limit', cause: 'provider'}`.

- `outcome.rs`: `BlockedReason::ProviderError` -> `"provider-error"`.
- Terminal (`direct/mod.rs` `is_provider_error`, next to `is_quota_limit`): a line that starts, after `strip_marker` and an `error` label, with at most four words then `api error (<4xx|5xx>)`; 401/403 excluded. `terminal/mod.rs`: `quota_on` replaced by `provider_stop_on` (quota first, then API error), used by `stop_reason` and the idle branch of `detect_completed`, so one rule covers idle screens and deadline stops.
- Headless (coordinator scope addition): `Direct::classify(exit, stderr_tail, stdout_tail, result)`; after the stderr login/quota wordings, the newest parseable JSON line of the stdout tail (`message`, or `agent_end`'s last of `messages`) with `stopReason: error` and `errorStatus` 4xx/5xx other than 401/403 gives `blocked(provider-error)` -> `direct:blocked:provider-error`. The supervisor (`run-supervisor/rust/src/supervise.rs` `direct_reason`) now also reads the stdout capture tail (a FIFO or absent stdout reads as empty, as before for stderr).
- Supervisor deadline stop (`supervise/terminal.rs` `provider_stop_reason`) names `provider-error` too.
- Node `providerStopOf` (`src/run-supervisor/steps/settle-attempt.mjs`): `*:blocked:provider-error` -> `provider-limit` / cause `provider`.
- Contracts/docs: `terminal-outcomes.v1.json`, `agent-protocol.v1.json`, `receipt.v1.json`, `docs/platform/agent-protocol/spec.md` (results table, direct rule 4, screen rule, decision-history entry 2026-11-06), CHANGELOG.
- Proofs (each red first):
  - `contracts/fixtures/terminal/omp/vectors.json` `a-provider-api-error-on-an-idle-screen-is-blocked-provider-error` (fixture `provider-error.txt`, error line verbatim from the report) — red `none` vs `blocked/provider-error`; plus `an-api-error-the-agent-mentions-mid-sentence-keeps-waiting` (anchoring).
  - `contracts/fixtures/direct/omp/vectors.json` `blocked-provider-error-from-the-last-json-event` (event fields verbatim, errorStatus 404) — red `Exited{1}` vs `Blocked(ProviderError)`; `an-http-401-in-the-last-json-event-is-not-a-provider-error`.
  - Wiring: `supervise_lifecycle.rs` direct case (JSON event on stdout -> `direct:blocked:provider-error`; red `Null` with stdout not passed); `supervise_terminal_fake_herdr.rs` deadline-stop case `dapierror` (red `Null` with the arm removed).
  - `terminal_vectors.rs` receipt-reason list now includes `terminal:blocked:provider-error`; `direct_vectors.rs` receipt list includes `direct:blocked:provider-error`.
  - `test/run-supervisor/attempt-steps.test.mjs` providerStopOf case for both prefixes — red `blocked/null`.

## 3. Remedy by reason

- `terminalStopMessage` (now exported) picks the remedy from a table by receipt reason: trust-dialog -> grant trust; login -> log in again; usage-limit -> quota/credits, walk falls back; provider-error -> provider fault, walk falls back; needs-setup -> finish the CLI's first-run setup once on the same profile; needs-human and unknown blocked names -> answer the prompt; anything else -> no remedy. The false "The pane is left open" sentence is dropped (a stopped pane with captured output is closed; the trust e2e already asserted one `pane close`).
- Setup needed a distinguishing receipt reason (the receipt said only `terminal:needs-human`, and re-reading the setup marker in Node would duplicate the Rust profile's marker). New supervisor-named reason `REASON_NEEDS_SETUP = "terminal:needs-setup"` (agent-protocol `terminal/mod.rs`), written by the supervisor when `await_ready` ends `NeedsHuman` on a screen whose `setup_line` matches; `end_early` now takes the reason. `providerStopOf` settles `terminal:needs-setup` as `blocked` like needs-human. Contract prose + both specs + CHANGELOG updated.
- Proofs: `attempt-steps.test.mjs` "a stopped pane seat names the remedy for its own reason..." (red: export missing), providerStopOf `terminal:needs-setup`; `supervise_terminal_fake_herdr.rs` `a_cli_that_opens_its_first_run_setup_ends_as_needs_setup_and_nothing_is_typed` (omp setup-wizard fixture; red `terminal:needs-human`); `terminal_vectors.rs` toReceiptReason list includes `REASON_NEEDS_SETUP`. Test support: `RunOpts.cli` (default `claude`) feeds `agentProtocol.cli`.
- `terminal-cutover.test.mjs` trust e2e: its pane ends `terminal:needs-human` (fake detector says blocked, no trust rule match), so its repair assertion now expects "answer the prompt in the pane". Not a weakening: the same behaviour (note names the repair) for that reason; the per-reason wording is owned by the attempt-steps test.

## Tests

- `cargo test -p fgos-agent-protocol -p fgos-run-supervisor`: green. clippy `-D warnings` (both crates, all targets): clean. `cargo check` x86_64-pc-windows-msvc and aarch64-apple-darwin: clean. `cargo fmt -p` both crates: clean (`cargo fmt --all --check` reports a pre-existing diff in `packages/convention/rust/tests/golden.rs`, not touched here).
- Node focused: attempt-steps, contracts-terminal, terminal-cutover, run-case-admission, architecture, doc-health, decision-citation-drift: green.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared.
- Full suite (`node scripts/run-tests.mjs`, log `/dev/shm/harden-t5-route-faults-full.log`): 8599 tests, 8566 pass, 1 fail, 32 skipped, no `run-tests: ERROR` lines. The one failure is the known pre-existing "frozen V7n addendum" test.

## Size

Non-test, non-doc, non-fixture code across the three commits: +146 / -53 (`git diff --shortstat d1e892ad0..HEAD` minus census, fixtures, tests, docs, CHANGELOG). No phase budget was set for this follow-up.

## Retired tests

None.

## Items for other lanes

- Seat lead / dispatch side: `classifyProviderCapacityFault` (`src/runner/dispatch/provider-capacity.mjs`) treats any `provider-limit` that is not `credential` as a quota quarantine (default 1 h). With cause `provider` a 404 account is quarantined as `quota-limit`; whether a provider fault should quarantine the account at all (the 404 may be model-scoped, not account-scoped) is the dispatch side's call. The comments in `settlement.mjs:711` and `provider-capacity.mjs:960` still say `'credential' or 'quota'`.
- `briefNeverReached` (`src/runner/execution/case-admission-port.mjs`, receipt `reason === 'terminal:foreground-not-agent'` only): a `terminal:needs-setup` stop (and a trust dialog at the ready gate) also never typed the brief, so the reservation could be handed back. Left unchanged (outside this item; behaviour change for case accounting).
- DOCOS sections 1 (omp `--profile` vs `PI_CODING_AGENT_DIR` 404 cause), 3 (`--account` pin) and 4 (pi `max_tokens`, per-seat fallback) are not addressed here.

Status: DONE_WITH_CONCERNS
Summary: agy 1.5.2's banner is dismissed before the brief; a provider API error (pane line or headless JSON event) ends the round as `provider-error` -> provider-limit/cause provider; stop notes give the remedy per reason, with a new `terminal:needs-setup` receipt reason for first-run setup.
Concerns/Blockers: `terminal:needs-setup` is a new receipt reason (setup previously ended `terminal:needs-human`); the dispatch side still quarantines a `provider` cause like a quota (see Items for other lanes).
