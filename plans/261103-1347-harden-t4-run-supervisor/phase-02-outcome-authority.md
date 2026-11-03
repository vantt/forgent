---
phase: 02
title: "Outcome authority: the supervisor names a provider stop in receipt.reason (deadline stops and direct exits), settle maps names to outcomes, the three screen/stderr judges go, one newest-result rule"
status: pending
depends_on: []
parallel: "wave 1, with phases 01 and 03 (disjoint files)"
effort: ~1.5d
net_size: "Node −65 / Rust +35 / tests +15 (estimate)"
---

# Phase 02 — Outcome authority

## Context

[plan.md](plan.md) fact 3; arbitration §3 rows S1 + RT4 answer 4 and S11/RT4-09; layer phase file received items "Agent outcome wiring" (decision 30) and its T3-04a addendum (red test 8, captured quota screens). Red-team answer 4 (a)–(c), simplicity S1, correctness received item 4 (order: the receipt must name the stop before the screen read goes).

Code read on `fcd42ecdc`:
- Terminal: an early end already names its reason (`supervise/terminal.rs:692-699` `end_early` → `TerminalOutcome::receipt_reason`, `agent-protocol terminal/mod.rs:51-58`). A deadline stop does not: `Sup::tick` calls `begin_stop(cause, None)` for `soft-deadline` and `idle` (`terminal.rs:406-419`).
- The stop classifier is private: `Terminal::stop_reason` (`terminal/mod.rs:297-300`) = `classify_blocked` (trust dialog, login) or `quota_on` (usage limit).
- Direct: `Direct::classify` (`direct/mod.rs:48-62`) has no caller in `packages/run-supervisor`; the receipt is built in one place for supervisor and adopt (`supervise.rs:117-153` `publish_receipt_with`).
- Node judges again: `settle-attempt.mjs:104-132` (`SCREEN_LIMIT_PATTERNS`, `screenSaysProviderStop`, `terminalAdapterOutcome`; the timeout arm `:128` is `6035c018c`), `:199-204` (screen into `stdoutText` and glued into `stderrText`), `settlement.mjs:636-655` (re-matches `stderrText` with `matchAuthFailureLine`/`matchQuotaLimitLine` for `exitedOnDeadCredential`, `exitedOnQuota`, `credentialFault`).
- Newest result: Rust uses the protocol rule (`direct/mod.rs:64-79` `newest_result`, receipt `outboxPresent`, `supervise.rs:90-93`); Node uses `resolveWorkerArtifactPath(runDir, /^result-(\d+)\.json$/, 'agent-result.json')` in `settle-attempt.mjs:189` and `settlement.mjs:27-33, 548` (leading zeros, legacy name, three directories).
- Red test 8 is on `origin/harden/t3a-red-tests` (`129230049`, `30cb75484`), not on main.

## Requirements

- **Vector parity first (prerequisite).** Every wording the Node judges recognise (`provider-auth-failure.mjs` patterns, `SCREEN_LIMIT_PATTERNS`, the strings in `attempt-steps.test.mjs:324-333`, e.g. `402 … requires more credits`, `No API key found for openrouter.`) has a vector in `packages/agent-protocol/contracts/fixtures/{direct,terminal}/<cli>/vectors.json` that the Rust classifier names the same way (login or usage-limit), or the Rust rule is extended until it does. A wording the Rust side refuses on purpose (agent prose about a rate limit while working) is a negative vector. The claude and codex-TUI quota screens are captured screens, not invented text; the lead records where each came from.
- **Red test 8** from `129230049`/`30cb75484` is taken onto the branch and shown red on main before the fix.
- **Deadline stop names the provider.** When the terminal supervisor stops an attempt for `soft-deadline` or `idle`, it reads the screen once (`core.read(key, None, Some("visible"))`, the read the idle sampler already does) and asks the protocol's stop classifier; a `login` or `usage-limit` verdict becomes `receipt.reason` `terminal:blocked:<reason>` while the outcome stays `timeout`. A trust dialog at a deadline does not (today's timeout arm reads the strict provider wordings only). The classifier becomes public in the protocol crate as the one door (no copy in the supervisor).
- **Direct exit names the provider** (decision 30 wiring). In `publish_receipt_with`, for a direct attempt whose gate exit is non-zero and whose outbox has no result, `classify` reads the last lines of the capture stderr (bounded, no-follow, non-blocking; the reader phase 04 also uses, or the one `FsOutbox` uses if phase 04 has not landed) and a `Blocked(reason)` becomes `receipt.reason` `direct:blocked:<reason>`. Outbox wins; exit 0 never yields a reason; the protocol's reason renderer gains the `direct:blocked:<reason>` arm.
- **One name → outcome table in the settle step** replaces `terminalAdapterOutcome`: `*:blocked:usage-limit` and `*:blocked:login` → `provider-limit` (login also marks a credential fault); `*:blocked:trust-dialog` and `terminal:needs-human` → `blocked`; any other `*:blocked:*` → `blocked` (never success); `terminal:delivery-unknown` → no adapter outcome (as today); a `timeout` receipt with a `login`/`usage-limit` reason → `provider-limit` (keeps `6035c018c`).
- **Settlement stops judging text.** `settleRunOutcome` takes the stop from its caller (`adapterOutcome` plus whether it is a credential fault) and no longer re-matches `stderrText` for `exitedOnDeadCredential`, `exitedOnQuota`, `quotaInTail`, `credentialFault`. Before deleting, the lead lists every `settleRunOutcome` caller (`rg -n "settleRunOutcome\(" src`); the non-supervised branch in `assignment-runner.mjs` is one and goes in phase 05 (`http` never prints a CLI's stderr), so nothing there needs the text rule.
- **Screen stays evidence only.** `settle-attempt.mjs` keeps one screen read for the person-facing message (`terminalStopMessage`) and `stdoutText`; `stderrText` is the capture stderr only.
- **One newest-result rule.** The receipt gains `outboxResult`: the file name the protocol rule picked, or `null` (`outboxPresent` stays for compatibility and equals `outboxResult != null`). The settle step hands settlement the path of that file; settlement uses it instead of discovering one. When phase 05 has removed the last caller that discovers a claim itself, `resolveWorkerArtifactPath` goes (L10); until then this phase names the remaining callers in its report.
- **Stop and ask** (not inside the frame): if an existing test proves that a pane seat's quota quarantine takes its reset time from the screen through `stderrText` (`provider-capacity.mjs:955-981`, `quotaQuarantineUntil`), the glue removal changes that behaviour. Do not add a new input to keep it; report it to the big lead for a decision question (hand-off H-T4d).
- `CHANGELOG.md` only if user-visible behaviour changes (it should not: the same stops settle the same way).

## Files

**Create:** none (vectors go into existing fixture files).

**Modify:**
- `packages/run-supervisor/rust/src/supervise.rs` (`publish_receipt_with`: direct reason, `outboxResult`)
- `packages/run-supervisor/rust/src/supervise/terminal.rs` (deadline-stop reason in `Sup::tick`)
- `packages/agent-protocol/rust/src/terminal/mod.rs` (public stop classifier), `src/outcome.rs` or the renderer's home (`direct:blocked:` arm), `contracts/fixtures/*/*/vectors.json`, `contracts/terminal-outcomes.v1.json` / `agent-protocol.v1.json` only where a reason name is listed
- `packages/run-supervisor/contracts/receipt.v1.json` (`outboxResult`, the two reason families)
- `src/run-supervisor/steps/settle-attempt.mjs`
- `src/runner/dispatch/settlement.mjs`
- `src/runner/dispatch/worker-artifacts.mjs` (only if its last caller goes here)
- Tests: `packages/agent-protocol/rust/tests/{terminal_vectors,direct_vectors}.rs`, `packages/run-supervisor/rust/tests/supervise_lifecycle.rs` (direct reason), `supervise_terminal_fake_herdr.rs` (deadline reason), `test/run-supervisor/attempt-steps.test.mjs`, `test/run-supervisor/terminal-cutover.test.mjs:112-123`, `test/runner/assignment-runresult.test.mjs`
- `packages/git/contracts/mutation-census.v1.json`

**Delete:** `SCREEN_LIMIT_PATTERNS`, `SCREEN_TAIL_LINES`, `screenSaysProviderStop`, `terminalAdapterOutcome` and the `AUTH_FAILURE_TAIL_LINES`/`matchAuthFailureLine`/`matchQuotaLimitLine` import in `settle-attempt.mjs`; the screen glue at `settle-attempt.mjs:204`; the stderr re-match block in `settlement.mjs:636-655` (the provider-capacity classifier keeps its own reading, H-T4d).

**Tests to retire:**
- `attempt-steps.test.mjs` "a seat the supervisor stopped on a timeout is a provider limit only when its screen ends on the provider's strict wording" (`:324-333`): its wordings become protocol vectors (owner: `terminal_vectors.rs` / `direct_vectors.rs`), its timeout arm becomes one case of the name table in the same file (owner: the new table case) and one deadline-reason case in `supervise_terminal_fake_herdr.rs`.
- In `test/runner/assignment-runresult.test.mjs`, the cases that feed a quota or login sentence through `stderrText` and expect `provider-limit` from settlement's text rule: their wordings move to vectors (owner: protocol vectors), their settlement half becomes "settlement takes the stop it is given" cases (owner: the same file). The lead lists each title.
- `terminal-cutover.test.mjs:112-123` is re-pointed at a captured quota screen (kept as the one pane wiring of provider-limit, not retired).

## Net size

Rust: public classifier +3, deadline reason +12, direct reason +15, `outboxResult` +5 → +35. Node: settle screen judging −55, settlement re-judge −18 (+6 name table in settle) → about −65. Tests: red test 8 +25, vector parity (JSON, not counted) , moved Node cases −10 → about +15.

## Steps

1. Find the owning tests: protocol vectors own wording → verdict; `supervise_terminal_fake_herdr.rs` owns terminal receipts; `supervise_lifecycle.rs` owns direct receipts; `attempt-steps.test.mjs` owns settle; `assignment-runresult.test.mjs` owns settlement.
2. Vector parity: diff the Node wordings against the Rust classifiers; add vectors (captured screens) until each Node case has a Rust twin; commit.
3. Red test 8 onto the branch; show it red.
4. Rust: public classifier, deadline reason, direct reason, `outboxResult`; `cargo test -p fgos-agent-protocol -p fgos-run-supervisor`.
5. Node: name table, delete the screen judges and the glue, settlement takes the stop it is given, receipt-named claim; run the Node files.
6. The pane wiring test against a captured screen; the stop-and-ask check on quarantine reset times.
7. msvc and darwin `cargo check`, clippy, census.

## Validation (focused)

- `cargo test -p fgos-agent-protocol --test terminal_vectors --test direct_vectors`
- `cargo test -p fgos-run-supervisor --test supervise_lifecycle --test supervise_terminal_fake_herdr --test adopt_matrix`
- `cargo check -p fgos-run-supervisor -p fgos-agent-protocol --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`; clippy `-D warnings`
- FR `test/run-supervisor/attempt-steps.test.mjs test/run-supervisor/terminal-cutover.test.mjs test/runner/assignment-runresult.test.mjs test/runner/provider-capacity.test.mjs test/run-supervisor/terminal-groups.test.mjs`
- `rg -n "SCREEN_LIMIT_PATTERNS|screenSaysProviderStop|terminalAdapterOutcome|exitedOnDeadCredential|exitedOnQuota" src` → nothing
- census count not higher.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A provider wording Node caught and Rust does not stops rotating accounts (failover silently stops) | M × H | Vector parity is step 2 and blocks every deletion; each Node case gets a Rust twin. |
| Agent-controlled capture text forges a `direct:blocked:login` | M × M | Last lines only, non-zero exit only, outbox wins (red-team 4a); the verdict only moves the caller to another account, never marks success. |
| Pane quota quarantine loses the printed reset time | M × M | Stop-and-ask requirement; hand-off H-T4d. |
| Deadline-stop screen read costs one more herdr call per stopped attempt | L × L | Once per attempt, at the stop only. |

## Rollback

Revert the merge; re-activate the previous release. On-disk: receipts gain `outboxResult` and the `direct:blocked:*` reasons and a reason on deadline stops; the previous release's settle step ignores `outboxResult`, reads `reason` only through its own screen rules, so it settles them as before (it re-judges the screen). No data migration.

## Done when

Red test 8 green; vector parity recorded; the deadline and direct reason cases green; no text judge left in Node; landed on fg-server2 with a pane-seat smoke; guide section written.

## Lead brief essentials

Delete list above. Find the owning test before writing a new one. Vector parity blocks deletion. Stop and ask on the quarantine reset-time case. Δ-lines per language. All plan.md lead rules apply.
