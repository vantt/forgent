# Runner refuses quarantine-driven bindings: the mutating recheck ignores the account view

Reporter: lead:SUPERVISOR (claude-b7gj@fg-server2), 2026-11-23 08:05 +07. Read-only diagnosis; no code changed.

## Outcome

From 08:01 every writing unit whose binding avoided gemini was refused with exit 4:
`binding mismatch: recomputed gemini/gemini(-lite) does not match assignment deepseek/thehive -- refused`.
This is an old gap, not a regression of release 3b595f7c. It surfaced when gemini's only account,
`gemini/tetnu`, went into `quota-limit` quarantine at 08:01:58, until 09:01:58 (`fgos dispatch inspect --provider-capacity`).

## Cause

- The run bind passes the live account overlay:
  `apps/fgos/src/wiring/unit_run_host/accounts.rs:110-116` (`accounts: Some(LeaseOverlay)`). A quarantined account
  drops gemini from the walk, so the unit binds deepseek/thehive (from `capabilities.execute.prefer`).
- The mutating recheck rebuilds the binding with `accounts: None`:
  `packages/execution/engine/src/assignment_runner/legality.rs:318-323`. `bind_facade.rs:169` (`overlay_of`) then has
  no overlay, gemini looks healthy and comes first, and the comparison at `legality.rs:340-366` refuses.
- The recheck already replays the ask, the config digest and the walk (`walk_state_of`, `rotation.rs:212`). The account
  view is the only bind input it drops, although the bind records it as `bindingInput.accountViewDigest`.
- It is not specific to failover: any bind in which account state removed the preferred candidate is refused.
- The Node twin `src/runner/dispatch/assignment-runner.mjs:~325` has the same gap; `fgos run` uses the Rust path.

Origin: the Rust check came in with `456c64595`, and the overlay-aware run bind with `f7c5eafa5` / `cfe190b3b`
(2026-11-19). All three are in both releases f75c3a69 (245635f84) and 3b595f7c (aa2aa79ed).

## Evidence

- `unit-run-1795395664087-bbaa8365/producer/1`: a first attempt (`tried: []`), bound to deepseek/thehive because gemini
  was quarantined, then refused (tickets c-31242, c-31646, c-32009).
- `unit-run-1795395618677-6377aee7/producer/1-fb1`: walk `tried: []`, `failedAccounts: [gemini/tetnu]`.
- `unit-run-1795395043624-5933223b` (orchestration-skeleton p10): the same refusal after a gemini provider-limit.
- Not confirmed: `unit-run-1795395043849-d25ed627/1-fb1` recorded `tried: [gemini]`; its summary says only
  `execution-failure`.

## Route

- **Now:** hold writing units until the gemini quarantine ends (about 09:02), then resume
  261123-0726 phases 1 and 3 and orchestration-skeleton p10 and p12. Do not make deepseek the primary with
  `--provider deepseek`: the owner keeps cheap families in fallback.
- **Fix:** the recheck replays the account view that the bind recorded instead of passing `accounts: None`. It refuses
  by name when that view cannot be reproduced, like `binding-replay-config-mismatch`, and never silently re-binds.
  A quarantine that ends between the bind and the recheck must not cause a mismatch. The Node twin gets the same fix,
  or is retired if dead.
- **Owning proof:** a new vector in `packages/execution/contracts/assignment-runner/legality.v1.json`, driven by
  `packages/execution/engine/tests/assignment_runner.rs`: a binding where a quarantine removed the preferred
  candidate is accepted. `test/runner/execution/run-gate.test.mjs` (lines 228-256) covers only walk-driven fallbacks.
- **Owner decision pending:** open a P1 backlog row and a small fix plan through the secretary.
