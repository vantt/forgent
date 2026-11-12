# Research: account health check, quota vs harness

Date 2026-11-13 (Asia/Saigon). Machine fg-server2. Read-only investigation for HARDEN; nothing built (RUL104: owner picks first). No credential values were read; account ids only.

Owner request (2026-11-13 00:20): "cần một năng lực thăm khám sức khỏe account, không rõ do account thật sự hết quota hay do harness/infra tệ nhưng các hội đồng thường xuyên hỏng."

## 1. Where the evidence lives

- Run records: `/home/vantt/projects/forgent/.fgos/assignments/unit-run-*` (61 units since 2026-11-08, 71 seat attempts). No other checkout or project on this machine holds run records (`mdview`, `skillstation` have none; worktrees hold only test fixtures).
- Workflow cases: `.fgos/workflow-runs/wf-run-*` (5 cases, 2026-11-08..09).
- Capacity state: `~/.fgos/runtime/provider-capacity/state.json` (no quarantine open, `audit` array empty).
- Per attempt: `runs/01/{result.json, receipt.json, exit.json, stop-requested.json, stdout.log, provider-capacity-selection.json}`.
- Out of reach: fg-server and the owner machine. All counts below are fg-server2 only.

## 2. Evidence table (all 19 non-pass seat attempts, 2026-11-08..12)

"Recorded as" is what fgOS wrote (`classification.failure.code/cause`, `outcome.category`); "True cause" is what the raw logs prove.

| # | Local time | Unit (short) | Seat | Provider/account | Mode | Recorded as | True cause (evidence) | Class |
|---|---|---|---|---|---|---|---|---|
| 1 | 11-08 16:42 | 130973647 | producer | gemini/tetcu72 | pane | nonzero-exit, infra; receipt `terminal:foreground-not-agent` | pane launch race; fallback passed | harness |
| 2 | 11-08 18:06 | 135976085 | producer | gemini/tetcu72 | pane | same as #1 | same; fallback passed | harness |
| 3 | 11-08 18:23 | 136998516 | producer | gemini/tetcu72 | headless | nonzero-exit, infra; `start-refused:no-envelope` | brief never delivered | harness |
| 4 | 11-08 18:36 | 137812868 (dialectic council) | thesis | claude/main | pane | nonzero-exit 143, infra | screen: Node `MODULE_NOT_FOUND`, our launch crashed; case left "chờ resume" | harness (own crash) |
| 5 | 11-08 18:37 | 137812868 (dialectic council) | antithesis | openai/tetnu | pane | exit 0 + SIGTERM, infra | cancelled with #4 (`stop-requested cause=cancel`) | harness (collateral) |
| 6 | 11-09 (case 17:38-18:08) | 220716923 (panel council) | synthesis | claude/main | pane | infra; `terminal:foreground-not-agent` | pane launch race; fallback `1-fb1` passed | harness |
| 7 | 11-12 05:33 | 436407348 | producer | gemini/tetcu72 | headless | `provider-limit`, cause `provider`, category **infra**; receipt `direct:blocked:provider-error` | stdout last event `errorStatus 429`, `RESOURCE_EXHAUSTED`, "check quota" | **quota, recorded as provider error** |
| 8 | 11-12 05:35 | 436522404 | producer | gemini/tetcu72 | pane | nonzero-exit 143, infra; receipt reason null | screen shows 429 `RESOURCE_EXHAUSTED`; pane sat idle 10 min until cancelled | **quota, recorded as infra** |
| 9 | 11-12 05:35 | 436497629 | producer | claude/main (haiku) | headless | `verdict-inconclusive` (category verdict) | claude permission gate refused outbox write | harness |
| 10 | 11-12 06:23 | 439406873 | producer | gemini/tetcu72 | headless | as #7 | as #7; fallback deepseek passed | **quota, recorded as provider error** |
| 11 | 11-12 10:30 | 454214436 | producer | claude/main (haiku) | headless | verdict-inconclusive | as #9 | harness |
| 12 | 11-12 10:47 | 455219007 | producer | claude/main (haiku) | headless | verdict-inconclusive | as #9 | harness |
| 13 | 11-12 10:47 | 455251574 | producer | claude/main (haiku) | pane | infra; `terminal:delivery-unknown` | brief delivery not confirmed | harness |
| 14 | 11-12 10:55 | 455747211 | producer | claude/main (haiku) | headless | verdict-inconclusive | as #9 | harness |
| 15 | 11-12 10:57 | 455780397 | producer | claude/main (sonnet) | pane | `invalid-agent-result-claim`, policy | claim failed schema | harness (protocol) |
| 16 | 11-12 11:54 | 459234713 | producer | claude/main (haiku) | headless | verdict-inconclusive | as #9 | harness |
| 17 | 11-12 13:28 | 464894525 | producer | gemini/tetcu72 | pane | nonzero-exit 143, infra | screen: 429, then `Retry failed ... Provider requested 1800000ms wait`; idle 14.5 min until cancelled | **quota, recorded as infra** |
| 18 | 11-12 13:43 | 465798818 | producer | claude/main (sonnet) | headless | verdict-inconclusive | as #9 (seat says BLOCKED: no write permission) | harness |
| 19 | 11-12 14:16 | 467771825 | producer | gemini/tetcu72 | pane | nonzero-exit 143, infra | as #17; idle 8.7 min until cancelled | **quota, recorded as infra** |

Also: unit `455840350` (11-12 10:57) settled `execution-failure` with its only seat `pass`; the persisted `unit-summary.json` does not say why (unknown). Unit `225888303` (11-09) was `policy-refusal` before any seat (not account related).

Counts per provider/account (true cause):

| Provider/account | quota | auth | provider 5xx | harness/infra | unknown | passes |
|---|---|---|---|---|---|---|
| gemini/tetcu72 (only gemini account) | 5 | 0 | 0 | 3 | 0 | 15 |
| claude/main | 0 | 0 | 0 | 10 | 1 (unit-level) | 18 |
| openai/tetnu | 0 | 0 | 0 | 1 | 0 | 2 |
| deepseek, z-ai, xai (openrouter/thehive/vantt) | 0 | 0 | 0 | 0 | 0 | 17 |

Key facts:
- **Councils on this machine (4 cases: 1 dialectic, 3 panel) failed only on harness.** 3 council seat failures (#4 #5 #6), zero quota. Every quota hit was a solo or session-probe run on gemini/tetcu72.
- **All 5 real quota hits were mis-recorded**: 2 as `provider-error` (no quarantine), 3 as plain infra (pane idle, cancelled by a person). None quarantined the account, so the same exhausted account was picked 5 times over 9 hours, each time with `reasonCodes: unknown-or-low-confidence`.
- **14 of 19 failures are harness**, and 6 of those (claude headless outbox denied) are recorded as a *verdict* (`inconclusive`), not infra.
- Zero auth faults and zero provider 5xx in the window.

The owner's pain, concretely: in #7 #8 #10 #17 #19 the structured record says "provider error" or "infra exit 143"; only the raw stdout tells it was quota. In #9-#18 the record says "inconclusive verdict"; only the stdout tells the harness refused the write. A reader of `result.json` / `unit-summary.json` cannot tell quota from infra in either direction.

## 3. What exists today

| Piece | File | What it does | Limit found |
|---|---|---|---|
| `fgos dispatch probe-account --provider --account` | `src/runner/dispatch/provider-account-probe.mjs` | Runs every CLI of one account at once through the real door (bwrap, leased login, herdr pane), prompt "reply OK", 3 min timeout; per-CLI class ok/blocked-trust-prompt/auth/quota/sandbox/timeout/other; verdict healthy/account-fault/cli-fault/mixed | Classifies by re-reading text with the Node wording list, not the supervisor receipt. That list has no `429`/`RESOURCE_EXHAUSTED`/`Retry failed ... Provider requested`, so a gemini quota row reads `other` or `timeout`. Needs 2+ CLIs on one account to say cli-fault; gemini/tetcu72 has one path. A quarantine refuses the lease, so a quarantined account cannot be probed (except auth-token unlock). Not run once in the last 7 days. |
| `fgos ... probe-session` | `src/runner/dispatch/provider-session-probe.mjs` | One cheapest-tier seat through `runUnit`; judges where the CLI keeps its session | Judges session keep only; quota shows as `run-failed`. 22 of the 61 recent units are session probes. |
| Direct credential probe | `src/runner/dispatch/provider-credential-probe.mjs` | One real CLI call with the account's own login home (codex/omp/pi/claude layouts), no bwrap, no herdr, 90 s, env allowlist; used to unlock `auth-token` quarantines | Only reachable through quarantine unlock. Judges with the same Node wording list (same 429 blind spot). Not exposed as a check. |
| Node wording list | `src/runner/dispatch/provider-auth-failure.mjs` | AUTH and QUOTA line patterns | Second copy of the Rust list (P34 lead report already flagged it: design principle 1). Missing gemini 429 and the omp give-up line. |
| Rust classifier (authoritative for runs) | `packages/agent-protocol/rust/src/direct/mod.rs`, `terminal/mod.rs` | Receipt reasons `blocked:usage-limit / login / provider-error`; headless reads last JSON event `stopReason:error` + `errorStatus`; pane reads bottom 12 lines | Headless: **429 maps to `provider-error`**, not usage-limit (only 401/403 excluded). Pane: 429 line alone not matched; P34 `retry_gave_up` (landed 2026-11-12 15:47, after #17 #19) now catches the omp give-up line as usage-limit. |
| Settle mapping | `src/run-supervisor/steps/settle-attempt.mjs:96` `providerStopOf` | usage-limit→provider-limit/quota, login→credential, provider-error→provider | Fine; the input is wrong for 429. |
| Quarantine | `src/runner/dispatch/provider-capacity.mjs:968` `classifyProviderCapacityFault` | credential → manual-clear; provider → **evidence-only, no quarantine** (commit c0c192b79); quota → temporary until "resets in X" / "try again at HH:MM" / else **1 h default** | Not dated from "Provider requested 1800000ms wait" (falls to 1 h). No fault history kept (`audit: []`, no `lastFaultAt` for gemini). |
| Selection | `provider-capacity-selection.json` | Records chosen account + reasonCodes | Every gemini pick says `unknown-or-low-confidence`; nothing known before launch. |
| Doctor | `src/setup/registrations.mjs:1621` `checkProviderCapacityState` | Reports quarantined accounts | Says "healthy — N accounts, no quarantine" while an account is out of quota but unquarantined (today's state). |
| Run result | `classification.failure {family, code, cause}`, `outcome.category`; Unit result `infrastructure`, `infrastructureReason`, `refused`, `output.complete/incompleteReason` (fixtures in `packages/run-result/contracts/fixtures/`) | Separates infra from verdict at Unit level | Provider-limit attempts get `outcome.category: infra`. Raw provider status (429, `RESOURCE_EXHAUSTED`, requested wait) is not a field. Persisted `unit-summary.json` (contract v2) has no infrastructure/reason fields, so #455840350 cannot be explained after the fact. |
| Owner ideas | `plans/reports/lead-261112-1523-harden-t9-p34-pane-provider-limit-settle.md` "Ideas" | (a) date quarantine from requested wait; (b) probe an account of unknown capacity before launch | Not in `docs/backlog.md`; they live only in that report (and `debug-261112-1408-...outbox-denied.md`). |

## 4. Gaps (the missing fact per failure)

1. **No account-only signal next to the harness signal.** Every probe that exists, except the unlock-only credential probe, goes through bwrap + herdr + outbox. When it fails, the account and the harness fail together. Missing fact: "the same login, called directly, answered OK / 429 / 401 in N ms".
2. **Raw provider signal not stored.** `errorStatus`, the provider status word (`RESOURCE_EXHAUSTED`), the requested wait (`1800000ms`) and the reset hint exist only in `stdout.log`. Missing fact: a structured `providerSignal` on the attempt.
3. **429 misread as provider error (headless).** `last_event_is_provider_error` treats 429 like 404 → no quarantine → same exhausted account picked again (#7 → #8 two minutes later).
4. **Pane idle on quota recorded as infra.** Before P34 the pane sat until a person cancelled (#8 #17 #19: 10, 14.5, 8.7 min); the cancel settles as exit 143 infra, and the 429 on screen is not read at settle for a cancel. P34 fixes the omp give-up line only; a 429 screen without the give-up line (other CLIs) is still blind.
5. **Harness failure recorded as verdict.** Outbox write refused (#9-#18) settles `verdict-inconclusive`, not infra; a reader blames the model.
6. **Quarantine not dated from requested wait** (1 h default instead of 30 min).
7. **No fault history per account.** `audit` empty, `lastFaultAt` only set on quarantine; no way to answer "how often did tetcu72 hit quota this week".
8. **Two wording lists** (Node + Rust) disagree; probe-account uses the weaker one.
9. **Doctor says healthy** while an account is exhausted but unquarantined (consequence of 3).
10. **Persisted unit summary lacks the infra/refused reason** that the in-memory Unit result has.

## 5. Options

### A. Extend `probe-account` with a direct leg (one door) — new capability, needs owner pick

`fgos dispatch probe-account --provider P --account A [--all]` runs, per credential store of the account, (1) the existing direct credential call (`provider-credential-probe.mjs`, no bwrap/herdr, ~90 s cap, read-only prompt) and (2) the existing harness leg (real door). Report per CLI: `account: ok|quota|auth|provider-error|timeout` with status code, provider status word, requested wait, latency; `harness: ok|<class>`; verdict `healthy | account-fault | harness-fault | mixed`. `--all` loops every account in the inventory (the "check all accounts" view). Classification reads the Rust classifier (the receipt reason for the harness leg; the same matcher for the direct leg's JSON) instead of the Node list. Optional `--record`: write the direct-leg result as a capacity fact (quarantine on quota with the parsed wait, or clear a stale one) — only if the owner wants the probe to change state.
- Cost: medium. ~1 file extended (`provider-account-probe.mjs`), `provider-credential-probe.mjs` gains a structured judge (status/wait), CLI help in `src/runner/dispatch/cli.mjs` / `bin/fgos.mjs` registry, one test file extended; Node wording list retired in favour of the Rust matcher through the addon (or kept and aligned, if the addon is not reachable from that path). Real spend: one minimal request per account per CLI.
- Proves: "account fine, harness failed" or the reverse, on demand, in under 2 minutes per account. Answers the owner directly.
- Does not prove: what happened in a past run.

### B. Per-run diagnosis: record the raw provider signal and fix the misreads — mostly hardening of what exists (RUL104-compatible)

- Rust `direct/mod.rs`: 429 (and `RESOURCE_EXHAUSTED` / rate-limit) → `usage-limit`, not `provider-error`; terminal: read the 429 line as usage-limit too.
- Receipt carries a small `providerSignal {status, statusWord, requestedWaitMs, resetHint}`; settle copies it to `classification.failure`; `quotaQuarantineUntil` uses `requestedWaitMs` (owner idea a).
- Provider-limit attempts get their own `outcome.category` (`provider`) instead of `infra`; outbox-write refused settles as infra (`no-report`), not `verdict-inconclusive`.
- Persist `infrastructure/infrastructureReason/refused` into `unit-summary.json` (contract bump v3) and append one capacity audit line per fault.
- Cost: medium-high; touches the agent-protocol contract + Rust crate, `settle-attempt.mjs`, `settlement.mjs`, `provider-capacity.mjs`, run-result contracts + fixtures, unit-summary writer. Each is a fix to an existing door, no new verb.
- Proves: every past and future run says by itself which side failed; quarantine stops repeat picks of an exhausted account (would have saved #8 #10 #17 #19).
- Does not give an on-demand check of an account nobody has run yet.

### C. Doctor pointer row only — cheapest, proves least

Extend `checkProviderCapacityState` to warn "N accounts with a provider fault in 24 h and no probe since; run `fgos dispatch probe-account --all`". Read-only, never repairs (AGENTS.md doctor rules). Useful only on top of A (needs a verb to point at) and B (needs fault history to count).
- Cost: low; one row in `src/setup/registrations.mjs` + its test.

## 6. Recommendation

**B first, then A; C as the last small step.** Reasons from the evidence:
- On this machine the dominant pain is not "unknown" — it is *misrecorded*: 5/5 quota hits and 6/14 harness failures were written under the wrong class. A probe (A) would not fix the records nor stop the repeated picks of tetcu72; B does, and it is RUL104 hardening of existing doors (no new verb), so its core fixes (429 → usage-limit, requested-wait dating, category split) can start without a new-capability decision.
- A is the real new capability the owner asked for ("thăm khám sức khỏe account") and is cheap because both legs already exist; it should reuse B's single classifier, so it comes second.
- Councils here failed only on harness (launch race, own crash). A health check would have said "accounts healthy" for every council failure this week — which is exactly the answer the owner lacks today.

## 7. Open questions for the owner (decision-question template)

1. **Should `probe-account` change capacity state?**
   - What is happening: an on-demand account check (option A) will learn "quota exhausted until T" or "quota fine".
   - Cause: today only real runs can quarantine; a probe only reports.
   - Options: (a) report only — zero risk, the next real run still burns one seat; (b) `--record` writes quarantine/clears it — saves seats, but a probe can then take an account out of rotation.
   - Recommendation: (b) behind an explicit flag.
   - Scope of answer: `probe-account` only.
2. **Probe before launch for an account of unknown capacity (owner idea b)?**
   - What is happening: every gemini pick says `unknown-or-low-confidence`.
   - Cause: no capacity knowledge before launch.
   - Options: (a) never — no extra cost, first seat may fail; (b) only when the account's last fault is a quota with unknown reset — ~1 small request per such launch; (c) always — one request per launch, slower councils.
   - Recommendation: (b), after B lands (then the quarantine already covers most cases).
   - Scope of answer: seat binding / provider-capacity selection.
3. **Is a real request per account acceptable spend for `--all`?**
   - What is happening: `--all` touches every account×CLI path in the inventory (10 accounts across 8 provider families today).
   - Cause: only a real call proves quota.
   - Options: (a) yes, cheapest tier model; (b) only accounts with a recent fault.
   - Recommendation: (a) on demand, (b) for any scheduled use.
   - Scope: probe-account `--all`.
4. **Unit summary contract bump (v2 → v3) to persist infrastructure/refused reason?**
   - What is happening: unit 455840350 failed after a passing seat and nothing on disk says why.
   - Options: (a) bump now with option B; (b) leave as is.
   - Recommendation: (a), all callers move in the same change (L10).
   - Scope: run-result package and its readers.

## Unresolved

- fg-server and the owner machine were not examined; council failure mix there may differ (owner says councils "thường xuyên hỏng"; on fg-server2 only 3 council seat failures in 7 days, all harness).
- Who cancelled #8 #17 #19 (person or lead) is not recorded beyond `cause: cancel`.
- Root cause of unit 455840350 (seat pass, unit execution-failure) not determined from persisted files.
