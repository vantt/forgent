---
title: "HARDEN account health A: on-demand and scheduled account probe"
description: "probe-account gains a direct leg (the account's own login, no bwrap, no herdr) beside the harness leg, four verdicts, --all, --record, a scheduled sweep, and one self-probe per account per run when a quota stop named no reset."
status: pending
priority: P1
effort: ~3.5d of lead work (5 phases); critical path P02 -> P03 -> P05 ~2.75d
branch: mail/acct-a-plan (plan only; each phase on its own branch `harden/acct-a-pNN` in its own linked worktree, base origin/main)
tags: [harden, account-health, provider-capacity, probe-account, doctor-timer]
created: 2026-11-14
---

# HARDEN account health A: on-demand and scheduled account probe

Input: [research section 5A and 7](../reports/research-261113-0009-account-health-check-quota-vs-infra.md), [B plan](../261113-1257-harden-account-health-run-diagnosis/plan.md) (fully landed on main: P01..P06, last range `161e82ac2..145578359`, board line `9c8f5289b`). Baseline `origin/main` `9c8f5289b` (2026-11-14); every `file:line` below was read there. Each lead re-reads by symbol before the first edit.

Scope: exactly the five HARDEN decisions (owner-approved): (1) a direct leg beside the harness leg, four verdicts `healthy | account-fault | harness-fault | mixed`; (2) `--all`; (3) `--record` writes the result as a capacity event; (4) modes (a) manual and (b) scheduled; (5) one self-probe per account per run when that account's latest failure is a quota stop with unknown reset. RUL104 (better, not bigger): every phase extends an existing door; nothing else is added. Forks the five decisions leave open are in "Decisions for HARDEN" below, each with a recommendation; phases are written for the recommended option and say what changes otherwise.

Citations: RUL104, RUL11, L1 (log vs state), L10 (through the door), design principles 1 (one door), 2 (bottom-up), 8 (one owning proof); runner spec RUL74 (lazy unlock after one real call, `3b6b152ee`), RUL79 (probe-account, `80cf7a8a6`). Impact analysis: `fgos tool query` cannot run inside the plan worktree (no `.fgos/installation`); the B plan found 0 providers, so **impact-analysis: inactive**; blast radius below is from `git grep` on `origin/main`.

## Prior art (what existed, what is reused, what is missing)

| Thing | Where | Reused as |
|---|---|---|
| Harness leg: every CLI of one account through the real door | `runAccountProbe` `src/runner/dispatch/provider-account-probe.mjs:249` (RUL79, `80cf7a8a6`) | unchanged; becomes leg 2 |
| Direct call with the account's own login, no bwrap/herdr, env allowlist, 90 s, account lock | `credentialProbeCommand` `provider-credential-probe.mjs:46`, `runCredentialProbe` `:122`, `createCredentialProbe` `:168` (RUL74, `3b6b152ee`) | leg 1; judged through `agentProtocol.classifyDirect` (B P05, `161e82ac2`) |
| One real call that lifts a quarantine | `probeQuarantinedAccounts` `provider-capacity.mjs:868`, called once at `assignment-runner.mjs:606` | the self-probe (decision 5) extends it; no second probe loop |
| Fault -> quarantine + `fault` audit line | `classifyProviderCapacityFault` `provider-capacity.mjs:1052`, `recordProviderAccountFault` `:785`, `audit.jsonl` (B P04) | `--record` and the self-probe write through it |
| Clear + audit line | `clearProviderAccountQuarantine` `:817`; unlock clear inside `probeQuarantinedAccounts` `:921-935` | gathered into one clear helper (RUL11) |
| OS timer per project, doctor row + `--fix`, marker-owned units | `src/setup/mailbox-sync-timer.mjs` (systemd user timer / launchd), registered `src/setup/registrations.mjs:1859,1865` | scheduled mode (D3) |
| Missing | no account-sweep loop, no direct-vs-harness verdict, no record of a probe that found the account healthy, no marker of "quota reset unknown", no scheduled probe | built here |

`git log -S` for `probe-account`, `capacityEvent`, `capacity-event`, `provider-health`, `accountHealth`, `healthProbe`: only RUL79's introduction and its docs; no removed sweeper or timer to revive.

## Phases

| # | Phase | Depends on | Effort | Status |
|---|---|---|---|---|
| P01 | [Direct call returns its verdict and asks for the seat's model](phase-01-direct-call-structured-result.md) | - | 0.25d | pending |
| P02 | [Capacity: probe results recorded, quota reset known/unknown, self-probe door](phase-02-capacity-probe-record-and-self-probe-door.md) | - | 0.75d | pending |
| P03 | [probe-account: direct leg, four verdicts, `--all`, `--record`](phase-03-probe-account-direct-leg-all-record.md) | P01, P02 | 1d | pending |
| P04 | [Self-probe before launch, once per account per run](phase-04-self-probe-before-launch.md) | P01, P02, P03 (spec file only) | 0.5d | pending |
| P05 | [Scheduled sweep: one managed timer door](phase-05-scheduled-sweep-timer.md) | P03 | 1d | pending |

**Parallel (file-disjoint):** wave 1 = P01 + P02; wave 2 = P03; wave 3 = P04 + P05. P04 needs only P01/P02 code but shares `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` with P03 (P03 owns the RUL79 bullet, P04 the RUL74 bullet), so it starts after P03 is pushed. P02 also edits that spec (quarantine paragraph `:101-103`) and runs before P03.

**Shared files written only at landing, never inside a phase:** `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json` (regenerate with `node scripts/git-one-door-scan.mjs --root . --write-census`, never hand-merge), `test/suite-baseline.json` (regenerate with `scripts/test-proof-inventory.mjs --write-baseline` when a test file is added or removed). No phase touches Rust or `Cargo.lock` (the addon door `agentProtocol.classifyDirect` already exists, `packages/git/node-addon/src/agent_protocol.rs`).

## Data flow (after)

```
manual:    fgos dispatch probe-account --provider P --account A | --all [--record] [--leg direct]   (P03)
scheduled: managed timer (P05) -> fgos dispatch probe-account --all --record --leg direct
per account (P03, sequential across accounts):
  leg 1 direct, per login store, under the account lock (P01):
     credentialProbeCommand(store, {model}) -> runCredentialProbe -> classifyDirect
     -> {ok, reason: login|usage-limit|provider-error|null, providerSignal, exitCode, timedOut, elapsedMs}
  leg 2 harness, per invocation (unchanged RUL79): executeAssignment -> readRunOutcome -> classifyAccountProbe
     (a lease refused for quarantine is `quarantined`, out of the verdict)
  verdict: healthy | account-fault | harness-fault | mixed  (+ nothing-to-probe when neither leg has a row)
  --record (P02 door recordAccountProbe):
     direct fault -> classifyProviderCapacityFault -> recordProviderAccountFault (quarantine + fault line, source probe)
     direct ok    -> clear a quota-limit / auth-token quarantine (clear-quarantine line)
     always       -> one `action: "probe"` line in provider-capacity/audit.jsonl
run (P04): leaseAccountForAttempt -> probeQuarantinedAccounts({..., accountId, runKey: unitRunId})
     candidate: quota-limit record with resetKnown:false, not yet probed by this run
     -> same direct call (createCredentialProbe) -> recordAccountProbe -> lease (refused -> existing rebind)
```

## Contract changes

| Contract | Change | Phase |
|---|---|---|
| `judgeProbeOutput` / probe function result | additive `reason`, `providerSignal`; `{ok, detail}` unchanged | P01 |
| `provider-capacity-state.v1` quarantine record | additive `resetKnown` (bool) on `quota-limit`; additive `probe.runKey`; old records without it read as known (no self-probe) | P02 |
| `provider-capacity-audit.v1` | new `action: "probe"`; `fault` line gains optional `source: "probe"` | P02 |
| `fgos dispatch probe-account` JSON | `verdict` vocabulary: `cli-fault` and `no-confined-cli` retire, `harness-fault` added; each row gains `leg`; `--all` returns `{accounts: [...]}` | P03 |
| config `dispatch.probeAccount.intervalSec` (D5) | new key, default 0 (off), in `core/config-standard/dispatch.yaml` + `core/config-schema/dispatch.schema.yaml` | P05 |

## Decisions for HARDEN

Each follows `core/skills/_shared/decision-question.md`. All are inside the five approved decisions except D4 (one more flag), which is why it is asked.

**D1. Which model does the direct leg ask for?**
- What is happening: the harness leg asks for the strongest model a tier cell names for the pool (`probeModelFor`, `provider-account-probe.mjs:108`); the direct call (`credentialProbeCommand`, `provider-credential-probe.mjs:46`) passes no model, so the CLI uses the login's default.
- Cause: gemini quota is per model (2026-11-06: tetcu72 `ok` on its default model while its flagship got 404, spec RUL79). A direct leg on another model than the harness leg compares two different things, and verdict `harness-fault` could be a model difference.
- Options: (a) login default model: 0 lines, but the two legs can disagree for a reason that is neither account nor harness; (b) same model as the harness leg: `credentialProbeCommand` gains `{model}` mapped per CLI (codex `-m`, omp/pi/claude `--model`), ~+10 src lines, +1 test case, P01; the unlock probe keeps passing none.
- Recommendation: (b). The verdict is only true when both legs ask the same thing.
- Scope of answer: the direct call's command line only; no tier or binding change.

**D2. What does `--record` write when the account is healthy?**
- What is happening: decision 3 says `--record` writes the result as a capacity event. A fault already has a door (`recordProviderAccountFault`, `fault` line + quarantine); a clear has one (`clear-quarantine` line). A healthy account with no quarantine has none, so nothing would be written.
- Cause: `provider-capacity-audit.v1` today has `fault`, `clear-quarantine`, `state-reset` (`provider-capacity.mjs:335,800,833`).
- Options: (a) state effects only (quarantine on fault, clear on ok): no new record kind, but a healthy sweep leaves no trace and the scheduled mode cannot show "checked, fine"; (b) state effects + one `action: "probe"` line per probed account `{at, provider, accountId, verdict, direct: [{cli, reason, providerSignal, elapsedMs}], source: probe-account|self}`: +1 record kind, ~+20 src lines, P02.
- Recommendation: (b). The point of mode (b) and of the research gap 7 (no fault history) is a history that says when an account was last seen healthy.
- Scope of answer: the audit log record kinds; `state.json` shape is unchanged by it.

**D3. How is the scheduled run (mode b) started?**
- What is happening: fgOS has one OS-timer door, `src/setup/mailbox-sync-timer.mjs` (systemd user timer / launchd agent per project, doctor row, `--fix` writes units carrying a marker, removes only marked units). Nothing schedules a probe.
- Cause: AGENTS.md install/setup/doctor gate: a new runtime dependency needs a doctor readiness row and a registered fix only when safe.
- Options: (a) generalise the mailbox timer module into one managed-timer door with two schedules (mailbox-sync, account-probe); two doctor rows share one implementation; no new `systemctl`/`launchctl` call site; ~+60/-30 src, P05, ~1d; (b) a second copy of the timer module for the probe: same behaviour, duplicated code (design principle 1 refuses); (c) no code: document a crontab line per machine: 0 code, but three machines set by hand, doctor blind, release-con-nguoi (priority 2) loses.
- Recommendation: (a). One door, RUL11 gather.
- Scope of answer: the timer module and its two doctor rows; mailbox behaviour must stay byte-identical (its tests unchanged).

**D4. What does the scheduled sweep run: both legs, or the direct leg only?** (asks for one flag outside the five decisions)
- What is happening: the harness leg opens herdr panes and confines each CLI; from a systemd/launchd timer there is no interactive herdr session, so pane invocations may fail for that reason alone [UNVERIFIED: lead checks `resolveHerdrBin()` / `envForSession` from a timer env in P05 step 1] and the sweep would record false `harness-fault`s at night. `--record` writes only direct-leg facts anyway (the harness leg already records its faults through its own settle).
- Cause: harness health is now visible on every real run (B landed); account capacity is what nobody sees between runs.
- Options: (a) both legs, no new flag: doubles spend (~2 calls per store instead of 1), opens panes unattended, possible false harness faults; (b) `--leg direct|harness|both` (default `both`), timer uses `--leg direct`: +1 flag, ~+10 src lines in P03, halves spend, no panes.
- Recommendation: (b).
- Scope of answer: the flag on `probe-account` and the timer's command line; manual runs keep both legs by default.

**D5. Where does the timer's interval live?**
- What is happening: one new key is needed (seconds between sweeps, 0 = off).
- Cause: config keys go in `core/config-standard` + `core/config-schema`; no section owns provider capacity today (`runner.yaml` holds executors/accounts, `dispatch.yaml` holds supervisor waits, `$comment: owner: run-supervisor`).
- Options: (a) `dispatch.probeAccount.intervalSec` (named after the verb it runs), section description and owner comment widened: 2 files, ~+12 lines; (b) a new section `providerCapacity.probe.intervalSec`: 2 new files + section registration, ~+30 lines, a section with one key.
- Recommendation: (a), default 0 (off) so nothing runs until the owner sets it.
- Scope of answer: the key name and default only.

**D6. When does the self-probe (decision 5) fire?**
- What is happening: after B, a quota stop with no requested wait and no reset hint quarantines for the 1 h default (`quotaQuarantineUntil` `provider-capacity.mjs:1036`). Two moments exist: while the default quarantine is active (only reachable when no other account of the pool is usable, the RUL74 rule `bind.mjs:235`), and after it expired, when Seat Binding may name the account again and the real seat would be the first to learn the quota is still gone (research #8 #10 #17 #19: tetcu72 picked again and again).
- Cause: "unknown reset" means fgOS guessed the end; a real call is the only way to know.
- Options: (a) before launch only, on the named account whose expired quota record has `resetKnown: false`; (b) only to lift an active one when nothing else is usable (extends the RUL74 unlock); (c) both, through the one `probeQuarantinedAccounts` door with one candidate rule.
- Recommendation: (c). Same door, same call, ~+25 src lines more than (a); (a) alone leaves a run with no usable account waiting out a guessed hour.
- Scope of answer: lease-time probe only; Seat Binding ranking (`fgos-binding` crate) is untouched.

**D7. "Once per account per run": what is a run, and does the 30-min cooldown still apply?**
- What is happening: RUL74 limits unlock calls by a per-account cooldown (`DEFAULT_QUARANTINE_PROBE_COOLDOWN_MS` 30 min, `provider-capacity.mjs:856`). Decision 5 says once per account per run.
- Cause: a council unit has several seats and rounds that each lease; parallel unit runs share the account state.
- Options: (a) run = unit run (`unitRunId`, the prefix of the assignment id, `assignment-runner.mjs:235`), stamped as `quarantine.probe.runKey`; the quota self-probe uses only that key, the auth unlock keeps its cooldown unchanged; (b) both key and cooldown for the quota self-probe: fewer calls under many parallel runs, but a run may not probe at all.
- Recommendation: (a): the owner's rule literally; spend is bounded by the number of unit runs that reach that account.
- Scope of answer: the quota self-probe guard only.

## Decided by analysis (not questions)

1. **Legs run in order, direct first, per account.** The direct call runs in the account's real home and may rotate a refresh token (credential probe header `:5-7`); the harness leg copies the login into a private home. Direct first, under the account lock, means the harness copies the fresh token.
2. **Accounts are swept one after another.** Parallel accounts would open up to ~20 rounds at once and two families can share one login home (`openrouter` under z-ai and deepseek); account locks are per provider/account, not per home.
3. **Verdict rules.** Direct rows: `ok`, account (`login`/`usage-limit`), other. Counted harness rows: confined ones (RUL79 rule, unchanged), minus `quarantined`. `healthy` = every direct ok and every counted harness ok; `account-fault` = every direct row is an account fault; `harness-fault` = every direct ok and some counted harness not ok; `mixed` = anything else; `nothing-to-probe` when neither leg has a row. With no counted harness row the verdict is from the direct leg alone. `cli-fault` and `no-confined-cli` retire (L10: consumers are the spec line RUL79, the registry description `command-registry.mjs:1581` and `test/runner/provider-account-probe.test.mjs:97,106`; nothing in `src` reads `verdict`).
4. **A harness row refused because the account is quarantined is `quarantined`**, from `failureCode === 'provider-capacity-lease-conflict'` (`run-result.mjs:41`, `settlement.mjs:519`) [lead confirms the probe's refusal reaches `readRunOutcome` with that code]. Counting it would turn a stale quarantine into `harness-fault`.
5. **`--record` records the direct leg only.** The harness leg is a real dispatch and already quarantines through its own settle (`recordProviderCapacityFault`, B P04); recording it twice would write two fault lines for one stop.
6. **"Latest failure" is read from the state record, not from `audit.jsonl`.** `setQuarantine` (`:752`) overwrites the record on every quarantining fault, so the record is the latest one; scanning a log on the lease path is L1-wrong (log is history, state is the view). An expired quota record stays in `state.json` until overwritten or cleared (`isQuarantined` `:538` only compares `until`), which is exactly the marker D6(a) needs.
7. **`--all` refuses `--provider`, `--account`, `--executor`, `--invocation`**, and skips accounts with `disabled: true` (listed as `skipped: disabled`). No narrowing flags added.

## Backwards compatibility

- `probe-account --provider P --account A` without new flags keeps running the harness leg as today and now also the direct leg; JSON adds `leg` on rows and the verdict vocabulary changes (CHANGELOG line). No other program parses it (`git grep` above).
- Quota records written before A have no `resetKnown`: read as known, never self-probed; the next quota stop writes the field.
- Old `audit.jsonl` readers: none in `src` read records by action except `inspectProviderCapacity`, which reads `state.json` only; a new action is inert to them.
- Timer: off by default (`intervalSec: 0`); a machine that never sets it sees one doctor row `info: not scheduled` (P05 decides the exact status per `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` section 3).

## Test matrix (one owning proof per behaviour)

| Behaviour | Owning proof (lowest layer) | Phase |
|---|---|---|
| direct call returns reason + signal; model on the command line | `test/runner/provider-credential-probe.test.mjs` (extend `:60`, `:72`, `:22`) | P01 |
| probe result -> quarantine/clear/probe line; `resetKnown`; self-probe candidate rule and run key | `test/runner/provider-capacity.test.mjs`, `test/runner/provider-quarantine-probe.test.mjs` (rewrite `:104`) | P02 |
| two legs, four verdicts, `quarantined` row, `--all`, `--record`, `--leg` | `test/runner/provider-account-probe.test.mjs` (rewrite `:97`, `:106`; extend `:151`) ; flag registry wiring `test/cli/subcommand-flag-drift.test.mjs` (one wiring proof) | P03 |
| a seat launch probes a named unknown-reset account once per unit run | wiring: extend `a dispatch whose only account is locked for a dead login tries one real call and runs once the call succeeds` (`test/runner/assignment-dispatch.test.mjs:2340`) with a second case; the candidate rule itself is owned by P02 | P04 |
| managed timer: mailbox unchanged, probe schedule written/removed by doctor `--fix` | `test/setup/mailbox-sync-timer.test.mjs` (renamed with the module) | P05 |

No e2e: a real provider call is spend; the CLI wiring proof is the drift test plus one `runDispatchCli` case with injected doors.

## Risk summary

| Risk | L x I | Mitigation |
|---|---|---|
| A self-probe adds up to 90 s before a seat launch | M x L | only for an account whose quota record says reset unknown, once per unit run; timeout unchanged (`DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS`) |
| `--record` on a transient failure quarantines a healthy account | L x M | only `login`/`usage-limit` with non-zero exit quarantine (the `judgeProbeOutput` rule, `:95-102`); timeouts and exit codes record a `probe` line only |
| Direct call rotates a token while a real run holds a private copy | L x M | the call holds the account lock (`acquireAccountLock` `:517`), the same lock renewal (RUL75) takes; unchanged from RUL74 |
| Sweep spend | M x L | ~1 cheap call per login store per account (~15 on fg-server2) per sweep with `--leg direct`; interval set by the owner, default off |
| Timer generalisation breaks mailbox sync | L x H | mailbox tests stay unchanged and green; unit file names and marker string unchanged for mailbox |
| Timer env lacks a herdr session | M x M | D4 (b): the timer never opens panes |

## Rollback

Each phase is one merge commit, revertable alone in reverse landing order (P05, P04, P03, P02, P01). P02 data: `resetKnown`/`probe.runKey` fields are ignored by the old reader; `probe` lines stay in `audit.jsonl` unread. P05: before reverting, `fgos doctor --fix` with `intervalSec: 0` removes the probe timer units (marker-owned); a revert without that leaves a timer calling a flag that may not exist (it fails and logs, nothing else).

## OPC conditions (process and Git call sites)

- No phase adds a Git call; `node scripts/git-one-door-scan.mjs --root .` count must not rise.
- No phase adds a spawn/exec site: the direct leg reuses `runCredentialProbe`'s `spawn` through the account lock's `spawnHolding`; the timer reuses `mailbox-sync-timer.mjs`'s `systemctl`/`launchctl` runner (`:90-91` of the module body). If a lead finds a new site is needed, stop and ask lead:OPC (claude-muyt@fg-server2) with the site, why the existing door does not serve, and the census diff, before writing it.

## Landing

- B is on main (`9c8f5289b`). Main is frozen until tag `v0.2.0-rc.8` is out; A phases develop, test and push on `harden/acct-a-pNN` (one linked worktree each, own `CARGO_TARGET_DIR` only if Rust is touched, which no phase plans), never land. After the tag, the landing lead rebases each on `origin/main` and lands one at a time in dependency order (P01, P02, P03, P04, P05).
- CHANGELOG lines (added at landing, `[Unreleased]`):
  - P01+P03: "`fgos dispatch probe-account` now also calls each login of the account directly (no sandbox, no pane) and says whether the account, the harness, both or neither failed (`healthy`, `account-fault`, `harness-fault`, `mixed`); `--all` probes every account and `--record` writes what the direct call found to the capacity state and its audit log."
  - P02+P04: "An account whose last quota stop named no reset time is checked with one real call, at most once per run, before a seat uses it again: a still-exhausted account stays out, a recovered one is released early."
  - P05: "`dispatch.probeAccount.intervalSec` schedules `probe-account --all --record --leg direct`; `fgos doctor --fix` writes the timer (off by default)."

## Budget

| Phase | src | test | docs | days |
|---|---|---|---|---|
| P01 | +15 | +25 | 0 | 0.25 |
| P02 | +60 / -15 | +70 / -10 | spec ~6 lines | 0.75 |
| P03 | +120 / -15 | +110 / -25 | spec RUL79 bullet, registry | 1 |
| P04 | +20 | +40 | spec RUL74 bullet | 0.5 |
| P05 | +60 / -30 | +50 | config standard/schema, doctor registry doc row | 1 |
| total | ~+275 / -60 | ~+295 / -35 | | ~3.5d |

Provider spend for proof: none in tests (injected spawn/dispatch); one manual `--all` smoke after P03 (~30 cheap calls with both legs) and one timer tick after P05 (~15 calls), each named in the lead report.

## Success criteria (observable)

- `fgos dispatch probe-account --provider gemini --account tetcu72` prints a `direct` row per login store with `reason`, `providerSignal`, `elapsedMs`, harness rows as today, and one of the four verdicts.
- With an exhausted account, `--record` leaves `state.json` quarantine `quota-limit` dated from the provider signal and two audit lines (`fault` with `source: probe`, `probe`).
- `--all` returns one entry per enabled account in inventory order; refuses the narrowing flags.
- A unit run whose bound account carries an expired `quota-limit` record with `resetKnown: false` makes exactly one direct call for it, however many seats lease it.
- With `dispatch.probeAccount.intervalSec: 21600`, `fgos doctor --fix` writes and enables `fgos-account-probe-<hash>` units; with 0 it removes only marked units; mailbox timer tests unchanged.

## Open questions

D1-D7 above; D4 is the only one that widens the approved scope (one flag). No phase waits on another plan.
