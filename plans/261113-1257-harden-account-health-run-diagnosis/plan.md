---
title: "HARDEN account health B: per-run diagnosis (quota vs harness on the record)"
description: "Every run says by itself which side failed: 429 is a quota stop, the receipt carries the provider's own signal, quarantine is dated from it, provider-limit gets its own category, a refused outbox is infra, the unit summary keeps the infra facts, each fault leaves an audit line, and the Node wording list retires."
status: pending
priority: P1
effort: ~3.75d of lead work (6 phases); critical path P01 -> P02 -> P04 -> P05 ~2.25d
branch: main (plan only; each phase on its own branch `harden/acct-b-pNN` in its own linked worktree)
tags: [harden, account-health, provider-capacity, agent-protocol, run-supervisor, run-result, unit-summary]
created: 2026-11-13
---

# HARDEN account health B: per-run diagnosis

Owner chose option B on 2026-11-13. Input: [research](../reports/research-261113-0009-account-health-check-quota-vs-infra.md) (sections 3, 4, 5B), [P34 lead report](../reports/lead-261112-1523-harden-t9-p34-pane-provider-limit-settle.md), [outbox-denied debug](../reports/debug-261112-1408-confined-claude-headless-outbox-denied.md). Baseline `origin/main` `1075f902a` (2026-11-13); every `file:line` below was read on it. Each lead re-reads by symbol before the first edit.

Citations: RUL104 (better, not bigger), RUL11 (gather the mess in scope), L1 (log vs state), L10 (extend through the door), design principles 1 (one door), 2 (bottom-up), 8 (one owning proof). Impact analysis: `fgos tool query --capability impact-analysis --status present` returned 0 providers, so **impact-analysis: inactive**; blast radius below is from `rg` enumeration.

## Outcome

A reader of `result.json` / `unit-summary.json` can tell quota from harness in both directions without opening `stdout.log`:

1. A headless 429 / `RESOURCE_EXHAUSTED` and a pane `api error (429)` line end the round `blocked(usage-limit)`, not `provider-error`; the account is quarantined (would have saved #8 #10 #17 #19 of the research table).
2. The receipt carries `providerSignal {status, statusWord, requestedWaitMs, resetHint}`; settle copies it to `classification.failure.providerSignal`; the quarantine ends at the provider's requested wait (`1800000ms` -> 30 min), else at the named reset, else the 1 h default.
3. A provider-limit attempt has `outcome.category: "provider"` (reason `provider-quota|provider-credential|provider-error|provider-limit`), no longer `infra`.
4. A seat that exits 0 with no claim and no report settles `failure {family: unknown, code: no-report}`, category `infra` (`infra-no-report`), not `verdict-inconclusive` (#9-#18).
5. `unit-summary.json` v3 carries `infrastructure`, `infrastructureReason`, `refused`; v2 files on disk keep a reader (unit 455840350 would read `commit-failed:git-error`).
6. Each provider fault appends one line to `<capacity runtime>/provider-capacity/audit.jsonl`: a per-account fault history.
7. `src/runner/dispatch/provider-auth-failure.mjs` is deleted; the probes judge through the Rust matcher (decision and evidence in P05).

**Non-goals:** probe-account direct leg, `--all`, `--record` (A); doctor pointer row (C); pre-launch probe (open with the owner); no new verb, flag, doctor row or test-only switch; no change to seat outcome vocabulary (`provider-limit` stays the seat outcome); no free-text "rate limit" wording without a recorded capture (see Decided by analysis).

## Phases

| # | Phase | Depends on | Effort | Status |
|---|---|---|---|---|
| P01 | [Agent-protocol: 429 is a quota stop; provider signal extracted](phase-01-agent-protocol-429-and-signal.md) | - | 0.5d | landed |
| P02 | [Receipt carries `providerSignal`](phase-02-receipt-provider-signal.md) | P01 | 0.5d | pending |
| P03 | [Run Result: `provider` category, no-report is infra](phase-03-run-result-provider-category-no-report.md) | - | 0.75d | pending |
| P04 | [Settle: signal on the failure, quarantine dated from it, audit line per fault](phase-04-settle-signal-quarantine-audit.md) | P02, P03 | 0.75d | pending |
| P05 | [Retire the Node wording list](phase-05-retire-node-wording-list.md) | P01, P04 | 0.5d | pending |
| P06 | [Unit summary v3: infra facts persisted](phase-06-unit-summary-v3.md) | - | 0.75d | pending |

**Parallel (file-disjoint):** wave 1 = P01, P03, P06 together; P02 starts when P01 is pushed; P04 after P02 and P03; P05 last. P03 and P04 share `src/runner/dispatch/settlement.mjs` (P03 owns `classifyEvidenceToOutcomeFacts`, P04 the rest), so they are serial. P03 and P06 share the `fgos-run-result` crate but not a file (`lib.rs` + `tests/unit_result_fixtures.rs` vs `unit_summary.rs` + `tests/unit_summary.rs`). P03 and P05 share the addon crate but not a file (`run_result.rs` vs `agent_protocol.rs`, `lib.rs`, `Cargo.toml`). P05 and P04 both touch `test/runner/provider-capacity.test.mjs` and are serial.

**Shared files written only at landing, by the landing lead, never inside a parallel phase:** `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json`, `Cargo.lock` (P05 only adds a path dependency; regenerate, never hand-merge).

## Data flow (after)

```
CLI tail / pane screen
  -> agent-protocol (P01): BlockedReason + provider_signal(text)            [one matcher]
  -> run-supervisor (P02): receipt.reason + receipt.providerSignal           [physical fact]
  -> settle-attempt providerStopOf (P04): {adapterOutcome, cause, signal}
  -> settlement (P04): failure {family: provider, code: provider-limit, cause, providerSignal}
       -> run-result derive_outcome (P03): category provider / infra-no-report
       -> provider-capacity (P04): quarantine until = requestedWaitMs | resetHint | 1 h; audit.jsonl line
  -> Execution finishUnit (P06): settlement {outcome, infrastructure, infrastructureReason, refused}
       -> unit-summary.json v3 (P06) -> Rust reader v2|v3 -> fgos metrics discussions
credential unlock probe / account probe (P05): addon agentProtocol.classifyDirect | run result failure.cause
```

## Contract and fixture changes

| Contract / fixture | Change | Phase |
|---|---|---|
| `packages/agent-protocol/contracts/agent-protocol.v1.json` | names the `providerSignal` fact and its bounds; 429 under usage-limit | P01 |
| `packages/agent-protocol/contracts/fixtures/direct/omp/vectors.json`, `terminal/omp/vectors.json` (+ one `.txt/.insp.json` pair) | new 429 vectors; optional `expectSignal` on vectors | P01 |
| `packages/run-supervisor/contracts/receipt.v1.json` | optional additive `providerSignal` (stays v1: no meaning changes, same rule as unit-run-result.md section 4) | P02 |
| RunResult v3 `classification.failure.providerSignal` | optional additive; v3 unchanged | P04 |
| RunResult v3 `classification.outcome.category` | adds `provider`; a v3 record that recorded `infra` where the classification now derives `provider` is read as consistent | P03 |
| `packages/run-result/contracts/fixtures/unit-result.provider-limit.v1.json`, `test/fixtures/run-outcome/legacy-derivation.json` | category `provider`; old-record row | P03 |
| `unit-summary` v2 -> v3; `unit-summary.read.v2.json` -> `unit-summary.read.v3.json` (describes v3, says v2 is still read) | P06 |
| `provider-capacity-audit.v1` records move from `state.json.audit[]` to `audit.jsonl`; new `action: "fault"` | P04 |
| observe scorecard `RunStatusBuckets.provider_limited` | additive bucket so `provider` is not `unclassified` | P03 |

## Spec lines and decision history

| Holder | Edit | Phase |
|---|---|---|
| `docs/platform/agent-protocol/spec.md` section 4 rules 3-4, wording rules; section 9 entry 2026-11-13 | 429 / RESOURCE_EXHAUSTED are usage-limit; provider signal; drop the stale `provider-auth-failure.mjs` mention (P05 removes the module) | P01 |
| `docs/platform/run-supervisor/spec.md` receipt fields; section 16 entry | `providerSignal` | P02 |
| `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` (category list), `docs/platform/component-boundary.md` Run Result Evaluator row if it lists categories | `provider` category; `infra-no-report` | P03 |
| `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` lines 101-103 (fault classifier, quarantine dating; stale `AUTH_FAILURE_PATTERNS`/`QUOTA_LIMIT_PATTERNS` settle text) + narrative entry in `docs/platform/runner/decisions/h-36d872fbb0e5.md` | dating order, audit log, receipt-only judgement | P04 |
| `docs/platform/runner/contracts/unit-run-result.md` sections 2, 3, 5; `docs/platform/observe/spec.md:85,101`; `docs/platform/runner/architecture/h-69197b459754.md:105`; `docs/reading-map.md:190` | v3 summary fields, contract file name | P06 |

No locked law changes; no D-ADR is minted.

## CHANGELOG lines ([Unreleased], added at landing)

- P01+P02: "A provider that answers 429 or `RESOURCE_EXHAUSTED` now ends the seat as a usage limit: the account is quarantined and the seat walks on, instead of the same exhausted account being picked again; the run's receipt names the provider's status, status word, requested wait and reset hint."
- P03: "`fgos metrics runs` and run results now name a provider limit as its own category (`provider`), and a seat that ended without writing its result or report is counted as an infrastructure failure (`infra-no-report`), not as an inconclusive verdict."
- P04: "A quota quarantine now ends when the provider asked (for example 'Provider requested 1800000ms wait' quarantines for 30 minutes), and every provider fault leaves one line in `provider-capacity/audit.jsonl`."
- P05: "The quarantine unlock probe and `fgos dispatch probe-account` now recognise the same quota and login stops a run does, including a gemini 429."
- P06: "`unit-summary.json` is now version 3 and says whether a unit failed on infrastructure, why, and which seats were refused; version 2 files are still read."

## Landing (owner decision, 2026-11-13)

- Until tag `v0.2.0-rc.7` is out, main takes only CI fixes and the release-cut commit. B phases develop, test and push on their own branches (one linked worktree per phase, branch `harden/acct-b-pNN`, own `CARGO_TARGET_DIR` on ext4 under `forgent-worktrees`), but **no phase lands before the tag**.
- After the tag, phases rebase on `origin/main` and land **one at a time**, in dependency order (P01, P03, P06, P02, P04, P05 is one valid order).
- CHANGELOG lines go under the new `[Unreleased]` heading the cut creates.
- The git mutation census is regenerated with `node scripts/git-one-door-scan.mjs --write-census` on the rebased tree at each landing, and never hand-merged.
- Each landing: `diff --stat` checked for unexpected deletions; `cargo fmt --check`, `cargo clippy --workspace -D warnings`, msvc and `aarch64-apple-darwin` `cargo check` for touched crates; full `npm test` (read ERROR lines and fail count) and `cargo test --workspace` green; one line on the program board log.

## Risk summary

| Risk | L x I | Mitigation |
|---|---|---|
| A transient 429 (rate limit inside the CLI's retry budget) quarantines an account for 1 h | M x M | only a stop the CLI gave up on is read (direct: non-zero exit, last event; pane: idle screen); a working pane is never judged (vector `omp-retrying-a-rate-limit-within-its-limit-keeps-waiting`); requested wait dates the quarantine when named |
| Old v3 run results become `contract-corrupt` (recorded `infra`, derived `provider`) and re-settle or read as failure | M x H | P03 makes both readers accept that one split, with a legacy-derivation row; owning proof in Rust |
| Agent text forges a signal (`Provider requested 99999999ms wait`) | L x L | same exposure as today's `resets in` parse; values bounded and typed; only read when the stop is already named |
| `no-report` changes runner-loop behaviour (`infraFailure` now true) | L x M | seat outcome was already `execution-failure`; only the run category moves; runner loop treated `verdict` + `no-evidence` as failed too (`operation-choice.mjs:1798`) |
| Credential probe reads only the last 5 lines (Node read 16 KB) | L x L | the protocol's "final words" rule; a dead login is the CLI's last words (test `a dead login named at the end of a long output is still seen`) |

## Rollback

Each phase is one merge commit, revertable alone in reverse landing order. P03 and P06 change on-disk shapes: reverting P03 after records with category `provider` exist makes those records `outcome-contradicts-classification` under the old reader, so revert P03 together with a one-line reader acceptance or not at all after it ran on real work; reverting P06 makes v3 summaries `unsupported-version` (metrics skip them; `scripts/backfill-unit-summaries.mjs --regenerate` rewrites them as v2). P04's `audit.jsonl` is append-only; a revert leaves it unread.

## Success criteria (observable)

- `cargo test -p fgos-agent-protocol`: the incident #7 stdout vector gives `usage-limit` with signal `{status: 429, statusWord: "RESOURCE_EXHAUSTED"}`; the P34 screen gives `requestedWaitMs: 1800000`.
- A supervised direct attempt that prints the #7 last event leaves `receipt.reason = direct:blocked:usage-limit` and `receipt.providerSignal.status = 429`.
- Settling that receipt quarantines the leased account until `now + requestedWaitMs` when named, and appends one `action: "fault"` line.
- `derive_outcome` of a provider-limit classification is `provider`; of a claim-less exit-0 run is `infra/infra-no-report`.
- A unit whose commit failed writes `unit-summary.json` v3 with `infrastructure: true`, `infrastructureReason: "commit-failed:git-error"`; `fgos metrics discussions` reads v2 and v3 files.
- `rg provider-auth-failure src test` finds nothing.

## Decided by analysis (not owner questions)

1. **Fault history lives in `audit.jsonl`, not in `state.json.audit[]`.** `state.json` is rewritten on every lease and release (`writeState`, 8 call sites in `provider-capacity.mjs`); a history there grows unbounded inside a hot state file (L1: a history is a log). The existing capped append (`appendFaultRecord`, `src/observe/invocation-fault-log.mjs:69`) is reused after moving to a kernel leaf, and the three existing audit writers move to the same log (RUL11). Scope: P04.
2. **"Rate limit" is covered by status, not wording.** HTTP 429 is the rate-limit status; the spec admits a wording only with a recorded capture (`agent-protocol/spec.md` wording rule), and none exists on this machine (searched every `stdout.log`/`stderr.log` under `.fgos/assignments`: only prose "rate limiting"). A wording is added when a capture appears.
3. **`no-report` is structural, not text-judged.** Settle stopped reading agent text for a verdict in `6e011e056`; "exit 0, no claim file, no report" is the fact, whether the harness refused the write or the model never tried. Seat outcome is unchanged (`execution-failure` already).
4. **Category name `provider`.** Capacity-refused and lease-conflict stay `infra` (no provider answered); `outcomeOfRunResult` keeps mapping them to the `provider-limit` seat outcome.
5. **Unit 455840350's seat stays `pass` in the summary.** The agent did pass; Execution's commit failed (`git-error`, author identity unknown). The unit-level `infrastructureReason: commit-failed:git-error` explains it without changing seat semantics.

## Open questions

None blocking. The pre-launch probe question stays open with the owner and is out of this plan.
