# HARDEN T9 P21: Seat Binding owns provenance, family and account usability

Branch `harden/t9-p21-seat-binding-authority`, based on origin/main `fbf8b7cde` (P05, P06, P22, P26 on it). Three commits: provenance, family, account.

## What changed

- **Provenance (AU-15).** `dispatchBound` passes `binding: bound`. `effectiveDispatchPolicy` takes `binding` and records executor, tier, model and effort with the source Seat Binding wrote (`{ scope: 'seat-binding', id: <bind label> }`); the "caller bound the seat" branch that read `cliOverride.tier` + `cliOverride.model` and labelled both `cliOverride` is deleted. `launchPinOf({ binding, cliOverride })` in `plan.mjs` is the one reader of what a launch pins (executor, invocation, pool, account, digest, model); `assignment-runner.mjs` and `compileDispatchPlan` read the pin through it. `cliOverride` stays for one caller only: `fgos dispatch probe-account` (`provider-account-probe.mjs`, through `dispatch/cli.mjs`), which names executor, invocation, account and model itself and has no binding.
- **Family (AU-16).** `familyOf(source, command)` in `provider-adapter.mjs` replaces `deriveProviderFamily` (resolve.mjs) and `normalizeProviderFamily`; `getProviderFamily` in bind is now a private helper over it. Canonical spelling is the `modelPolicies` key (`openai`, `z-ai`, `gemini`, `claude`); `codex`, `openai-codex`, `glm`, `agy` are aliases. The provider-capacity state key (`openai-codex`) is made in exactly one place, `legacyStateKey` in `llm-accounts.mjs`; every reader of inventory, state and leases goes through it. Seat Binding keys `modelPolicies` and `tierFallback` by `familyOf` before the crate sees them (`familyKeyed` in `bind.mjs`; a cell under the family's own name wins over an alias-named one) and returns `family` on the binding. `KNOWN_POLICY_SHAPED_FLAGS` keeps canonical keys only. All callers moved: bind, explain, executor-governance, resolve, assignment-runner, llm-accounts, provider-capacity, probe, model-pool-checks, executor-profile-warnings, blind-steps-proven-pools (reads the launch view's family), registrations (state-key caller only).
- **Account usable (AU-18).** `assertPinnedAccountsUsable` reads the quarantine from Seat Binding's account view (`accountQuarantineOf` in `bind.mjs`, built by the same `accountViewOf` the crate is fed); its own `inspectProviderCapacity(...).healthy` predicate is gone. The lease stays the time-of-use guard.
- Docs: runner spec line on the family name; CHANGELOG (two lines); mutation census regenerated.

## Deviations from the phase text

- **Account check does not read the simulation.** The crate's pin path (`rank.rs` around 495-545) never tests quarantine for a pinned account (it checks unknown, disabled and login store only), so `simulateUnitBindings` cannot carry a quarantine refusal, and Rust is out of scope. The check reads the same account view instead. `unit-run-start.mjs` and `dispatch/cli.mjs` are untouched. The message lost the quarantine reason code (the view does not carry it); it still names the end time.
- **Family is the `modelPolicies` key, not `normalizeProviderFamily`'s CLI-derived name.** Cells, pools, pins (`openai/acct`), the golden contract and the spec all key by `openai`; making `openai-codex` canonical would have renamed shipped config keys and recorded pools. Counsel (kongming) confirmed. Visible change: governance refusals and `governance.providerFamily` now say `openai` (was `openai-codex`) and `gemini` / `z-ai` for `agy` / `glm`. Test fixtures that wrote both `openai` and `openai-codex` cells were reduced to the canonical one.
- The four-seat smoke on a built host was not run; the provenance proof is the end-to-end `fgos run` test below.
- Work code touched: none. `test/helpers/work-seat-config.mjs` (test helper) uses `familyOf`.
- `registrations.mjs`: only the import and the one family caller.

## Red evidence

- `test/cli/run-verb.test.mjs` "a run records tier and model with the source Seat Binding gave them": runs `fgos run` end to end and reads every recorded dispatch policy; failed on the old code with `{ scope: 'cliOverride' }`, passes now. The fixture executor cannot render `--effort`, so the run is the plain `--timeout` one; the old label was `cliOverride` for any bound run, so an `--effort`-only run was affected the same way.
- `bind.test.mjs`: "names its provider family once" (an executor declaring `codex` has the family of `openai`, binds that family's cell, and is refused when it must differ from an `openai` executor) and "a cell written under another spelling is found".
- `dispatch-plan-policy.test.mjs`: `familyOf` cases and the bound tier / model sources.

## Retired tests and new owners

- The `deriveProviderFamily` case in `dispatch-plan-policy.test.mjs` and the `normalizeProviderFamily` cases in `dispatch-governance-provider-denylist.test.mjs` and `dispatch-i08b-remediation.test.mjs` now call `familyOf` (same files); a duplicate `openai`/`pi` assertion in i08b was removed (the line above it owns it).
- The two cases asserting `{ scope: 'cliOverride' }` for a bound run now assert the bound label; the tool-executor case in `assignment-dispatch.test.mjs` passes its stated tier and model as `binding`.
- Quarantined-pin refusal (fresh run and resume): `run-provider-failover.test.mjs` unchanged, passes through the new check.

## Gate

Focused sets (dispatch, provider, llm-accounts, setup, bind, explain, account-pin, run-provider-failover, run-verb) green. `test/architecture.test.mjs`, `doc-health`, `check-decision-citation-drift` green. One-door scan: 0 undeclared, census regenerated. Full `npm test`: 8740 tests, 1 fail (the V7n addendum, known), no ERROR lines. Rust untouched and no shipped default changed, so no cargo run.

## Authority

- **Provenance labels.** Held in Dispatch (the `cliOverride` relabel); now written once by Seat Binding and copied. Still outside: Workflow's `unitOverridesOf` tags its fallback override `origin: 'workflow'` (P08's file); bind records it as `override:workflow`.
- **Family.** Two functions are one (`familyOf`, `provider-adapter.mjs`, the lowest dispatch leaf; bind cannot own it because `llm-accounts` and `provider-capacity` call it). The state key `openai-codex` is a second spelling kept only in `legacyStateKey`; retiring it needs a state-directory and `runner.providers` key migration: a separate item, not started.
- **Pinned-account quarantine.** The Rust pin path does not judge quarantine; Node now judges it from the view the crate reads. The single authority would be the crate refusing a quarantined pin and Node reading that refusal: a Rust change for a later phase.
- **Cell keys.** The crate receives family-keyed `modelPolicies` and `tierFallback` from Node's `familyKeyed`; a config validator could refuse alias spellings loudly instead (not done: the silent read keeps existing configs working).

## Lessons

- Read what the Rust crate does with a field before scoping a Node-side "one function": `family` was also the cell and pool key, so "returns the normalised key" had two readings; one early question to counsel avoided a shipped-default change.
- A phase line saying "read X from the simulation" needs one look at the crate's own path for that case; the pin path skips quarantine.
- Fixtures that hedge by declaring both spellings of a key hide that a function had two answers; reduce them rather than keep them.
- A background `npm test` needs a done-marker file; a wrapper `&` makes the harness report completion at once.
