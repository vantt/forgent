---
phase: 3
title: "probe-account: a direct leg beside the harness leg, four verdicts, --all, --record"
status: pending
depends_on: [1, 2]
parallel: "wave 2, alone (shares the runner spec with P02 and P04)"
branch: harden/acct-a-p03
---

# P03 - probe-account direct leg, verdicts, sweep, record

**Authority:** `fgos dispatch probe-account` (RUL79) stays a Dispatch diagnostic; it picks nothing. State writes go only through P02's `recordAccountProbe`.

## Context (verified on `9c8f5289b`)

- `runAccountProbe` (`src/runner/dispatch/provider-account-probe.mjs:249`) plans invocations (`accountInvocations` `:57`), dispatches each through the injected door, classifies (`classifyAccountProbe` `:143`) and returns `{provider, accountId, verdict: accountProbeVerdict(rows), results}` (`:302`). `accountProbeVerdict` (`:178`) returns `nothing-to-probe | no-confined-cli | healthy | account-fault | cli-fault | mixed`.
- CLI parse: `runDispatchCli` case `probe-account` (`src/runner/dispatch/cli.mjs:187-246`) requires `--provider`/`--account`; usage string `:296`. Registry: `src/cli/command-registry.mjs:1580-1596`. bin dispatches it at `bin/fgos.mjs:2448`.
- Account inventory: `providerAccountInventory(cfg)` (`provider-capacity.mjs:290`); per-account stores: `accountCredentialSources` (`:212`), `credentialSourceForCli` (`:205`). Account lock: `acquireAccountLock` (`:517`) returns `spawnHolding`.
- Lease refusal code in a RunResult: `provider-capacity-lease-conflict` (`src/runner/dispatch/run-result.mjs:41`).

## Requirements

1. **Direct leg (leg 1).** New `runDirectLeg({cfg, plan, provider, accountId, probe, acquireLock, timeoutMs, now})` in `provider-account-probe.mjs`: for each login store of the account (`accountCredentialSources`; the CLI of the store from its key, or `cliForCredential` `:37` for a single store), take the account lock, call P01's probe with the harness leg's model for that CLI (`probeModelFor`), release. Row: `{leg: 'direct', cli, store, outcome, reason, providerSignal, exitCode, evidence: detail, model, modelSource, elapsedMs}`; `outcome` = `ok | auth | quota | other | no-probe` (`no-probe`: layout fgOS cannot call, `credentialProbeCommand` null). Injected `probe` and `acquireLock` (tests), defaulting to `createCredentialProbe()` and `acquireAccountLock`.
2. **Order.** `runAccountProbe` runs leg 1 first, then the harness leg (unchanged); harness rows gain `leg: 'harness'`. A harness row whose `failureCode` is `provider-capacity-lease-conflict` gets outcome `quarantined` and `inVerdict: false` (decided-by-analysis 4).
3. **Verdict.** `accountProbeVerdict(rows)` per the plan's decided-by-analysis 3: `healthy | account-fault | harness-fault | mixed | nothing-to-probe`; `cli-fault` and `no-confined-cli` removed.
4. **`--leg direct|harness|both`** (D4 (b), default `both`): skips the other leg. If HARDEN picks D4 (a), drop this requirement and its registry entry.
5. **`--all`**: `runAccountSweep({cfg, ...doors})` loops `providerAccountInventory(cfg)` in declared order, one account at a time; `disabled: true` -> `{provider, accountId, skipped: 'disabled'}`; returns `{accounts: [...]}`. Refuses `--provider`, `--account`, `--executor`, `--invocation` with `--all` (validation error naming them).
6. **`--record`**: after each account, `recordAccountProbe({provider, accountId, direct: <direct rows>, verdict, source: 'probe-account'})`. A manual and a scheduled sweep write the same source (no flag added to tell them apart; the timer's tick time is in `at`). Without `--record` leg 1 writes nothing.
7. **CLI + registry.** `cli.mjs` parses `--all`, `--record`, `--leg`; usage string `:296`; registry `probe-account` description (verdict list, two legs, the three flags) and `parameters`; `required` drops `provider`/`account` (one of `--all` or both is enforced in `cli.mjs`).
8. **Spec.** `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` RUL79 bullet (`:175`): two legs, order, verdict rules, `quarantined` row, `--all`, `--record`, `--leg`; dated 2026-11-xx extension sentence, not a rewrite of the history text. Decision narrative: one entry in `docs/platform/runner/decisions/h-36d872fbb0e5.md` for the verdict vocabulary change (retired `cli-fault`, `no-confined-cli`).

## Files

- Modify: `src/runner/dispatch/provider-account-probe.mjs`, `src/runner/dispatch/cli.mjs`, `src/cli/command-registry.mjs`, `test/runner/provider-account-probe.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (only if it pins the flag list by hand; lead checks), `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (RUL79 bullet), `docs/platform/runner/decisions/h-36d872fbb0e5.md`.
- Not touched: `bin/fgos.mjs` (it already hands `rawArgv` through, `:2448-2451`).

## Owning proofs and retirements

| Behaviour | Owner |
|---|---|
| direct leg per store, under the lock, on the harness model, before the harness leg | extend `every CLI starts before any finishes, each under a read-only posture binding...` (`provider-account-probe.test.mjs:151`) with an injected probe/lock recording order |
| four verdicts | rewrite `the verdict says account fault only when every CLI failed the same account-level way` (`:97`) into the four-verdict table case |
| harness rows: confined only, `quarantined` excluded | rewrite `the verdict reads only the invocations that declare their own sandbox` (`:106`) to add the `quarantined` row |
| `--all` order, disabled skipped, narrowing flags refused; `--record` calls `recordAccountProbe` once per account; `--leg` | one new case through `runDispatchCli(argv, {returnResult: true})` with injected doors (no existing owner: new flags) |
| flag registry matches parser | `test/cli/subcommand-flag-drift.test.mjs` (wiring proof; extend only if needed) |

Retired: `cli-fault` / `no-confined-cli` assertions in `:97` / `:106` (behaviour removed by decision 1; the rewritten cases own the new vocabulary).

## Steps

1. Red: rewritten `:97`, `:106`, extended `:151`, new CLI case. 2. Direct leg. 3. Verdict + `quarantined`. 4. `--leg`, `--all`, `--record` in `cli.mjs`. 5. Registry + usage. 6. Spec + narrative. 7. Gate. 8. One manual smoke on fg-server2: `fgos dispatch probe-account --provider gemini --account tetcu72 --json` via `npm run fgos:dev --`, and `--all --leg direct` (no `--record`); paste both verdicts (no credential text) into the lead report.

## Validation

`node scripts/run-tests.mjs test/runner/provider-account-probe.test.mjs test/runner/provider-credential-probe.test.mjs test/runner/provider-capacity.test.mjs test/cli/subcommand-flag-drift.test.mjs test/cli/dispatch-operability.test.mjs test/runner/provider-per-cli-credential-sources.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs`; `node scripts/git-one-door-scan.mjs --root .`; `git diff --stat origin/main...HEAD`.

## Risk / rollback

Risk: architecture guard on `executeAssignment` callers (`test/architecture.test.mjs:445`) -> the sweep must call the same injected `dispatch` from `cli.mjs`, never import the door elsewhere. Risk: a direct call holds the account lock up to 90 s while a real run wants to renew -> the renewal waits (same as RUL74 today). Rollback: revert; no state written unless `--record` was used, and those records are inert to the old reader.
