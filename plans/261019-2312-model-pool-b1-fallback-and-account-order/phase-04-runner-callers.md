# Phase 04: move every caller of the changed contracts

Starts after phase 03 is ready and AGENT-WF 07-08 are on main (phase 00 fact 1); branch cut after them. Lands with phase 03.

## Context

- [plan.md](plan.md) D3, D4, D6, D7. Callers enumerated by `rg "nextCandidate|excludeFamilies|credentialFaultFamilies|skipCandidateIndex|candidateIndex|retrySameCandidate|inspectAccountRotation|resolveAccountPin" src bin` on 2026-10-19.

## Callers (complete list, 5 files outside bind and account-rotation)

| File | Spots | Change |
|---|---|---|
| `src/runner/execution/run.mjs` | `:11-12` imports, `:654` fault set, `:920-923` recorded walk state, `:1011-1029` rotation then `nextCandidate` | Fault set holds pools; record and pass `tried`; rotation by `bound.pool`; read old records per phase 00 fact 8 |
| `src/runner/dispatch/assignment-runner.mjs` | `:50`, `:465-466` write-gate recompute, `:1170-1195` `fallbackSkipIndex`/`skipIndexOfAttempt`, `:1608` lease key, `:1643`/`:1658` lease `cli`, `:1013` second walker (per fact 2) | Recompute with `tried` and `excludePools` from `unit.json`; lease key = the bound pool (family-named pool when the cell has no `@`, so the legacy key is unchanged); pass `cli` from the invocation's `credentialStore.use` for every launch that declares one; second walker moved to the same walk if reachable |
| `src/setup/blind-steps-proven-pools.mjs` | `:74-78` | Enumerate candidates with `tried` instead of an int |
| `src/runner/dispatch/assignment-policy.mjs` | tier and model resolution | Raise `tier-cell-missing` with the same text as `bind()` |
| `src/runner/dispatch/settlement.mjs` | `:684` `quarantineProviderAccount` | Verify only: it already passes `providerCapacitySelection.provider`, now a pool key; no edit expected |
| `bin/fgos.mjs`, `src/workflow/runner.mjs`, `src/cli/command-registry.mjs` | `--account` flag, workflow account override, help text | `pool/account` form, help text, early refusal of a bare id at `workflow start` (same dry-bind check as today) |

Also: skills and docs that show `--account <id>` (phase 00 fact 7 list) move to `pool/account`.

## Requirements

- No second path: after this phase `rg "excludeFamilies|skipCandidateIndex|credentialFaultFamilies"` over `src bin` finds nothing; `candidateIndex` is gone from bindings and records written by new code.
- `fgos run` and `workflow start` stay the only doors; nothing here adds an option.
- Write-gate recompute (`assignment-runner.mjs:455-470`) must equal the runner's binding after account rotation, walk step, credential fault and resume. Add a table test over these four.
- Lease receives `cli` whenever the invocation declares a store (today only when pinned, `assignment-runner.mjs:1477`), so accounts without the store are never leased.
- Missing-cell refusal for the in-process `claude` seat is not applied (no model needed).

## Tests

- `run-provider-failover.test.mjs`: accounts `a, b` in pool `P1`, cell `[m1@P1, m2@P2]`, tier list `[F1, F2]`: failure order is `P1/a`, `P1/b`, `P2` first account, then `F2`; each step's provenance `kind` is `account-rotation` or `next-candidate` and names the pool. Real lease, temp runtime dir.
- Decision 3 end to end: a quota hit on `a` quarantines only `a`; the next seat starts on `b`, not on the least-leased account.
- Credential fault in pool `P1` leaves `P2` of the same family eligible.
- `assignment-dispatch.test.mjs`: recompute equals original binding; `tier-cell-missing` from both paths.
- `account-pin` through `fgos run --account pool/account` and through a workflow start; bare id refused.
- Resume of a recorded old `unit.json` restarts the walk at the primary without a crash.

## Risk / rollback

M x M: conflict in `run.mjs` with AGENT-WF (sequenced after it); M x H: refusal breaks a project that relied on the fallthrough (the phase 00 table goes to the owner before this phase lands). Rollback: revert 03 and 04 as a pair; state files and configs are unchanged by them.
