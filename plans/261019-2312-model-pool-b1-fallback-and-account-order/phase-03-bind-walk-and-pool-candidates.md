# Phase 03: `bind()` walks cell entries and the tier order; pool-based rotation

Lands together with phase 04 (this phase changes the contract, 04 moves its callers; one merge).

## Context

- [plan.md](plan.md) D1, D2, D3, D6, D7; owner decisions 1, 2, 4; wave-0 answers 1, 2, 6, 7.
- Code: `bind()` `src/runner/execution/bind.mjs:137` (candidate pool `:171-200`, filter loop `:223-326`, transport `:361-383`, tier and model `:420-464`), `nextCandidate` `:611`, `retrySameCandidate` `:652`; `src/runner/execution/account-rotation.mjs:21,55`; `account-pin.mjs:17,31`; `explain.mjs`.

## Requirements

1. **Tier before candidates.** Move the rigor, override and ceiling tier derivation (`bind.mjs:420-450`) ahead of the candidate loop (pure move: it depends on the capability and unit, not on the executor), so each family's cell is known while candidates are built.
2. **Candidates are (family, cell entry).** For each `prefer` candidate, read `resolveTierCandidates(cfg, tier, family)`; make one candidate per entry whose pool is usable (an `llmAccounts` account of that pool, not disabled, holds a store matching an invocation's `credentialStore.use`; a family-named pool with no `llmAccounts` entry is usable through the legacy inventory). The invocation is chosen per entry by today's rules (herdr, posture, pins) among invocations whose `use` matches. The binding carries `model` (the entry's model id, as that pool spells it), `pool`, `tier`.
3. **Missing cell refuses.** An out-of-process agent seat whose family has no cell at the tier gets `refused: { reason: 'tier-cell-missing', detail: 'no model for tier "<t>" under family "<f>" (runner.modelPolicies.<f>.<t>)' }`. Delete the `executor.model` / `default` fallthrough (`:453-464`). In-process, inline and tool candidates need no model and are not refused. In a fallback walk a family without a cell is skipped and recorded in provenance (`skipped: [{family, reason}]`); if no candidate is left, the refusal names the last skipped cell.
4. **Walk state.** `bind(ask, ctx, { tried = [], excludePools = [] })`. `tried` is the seat's earlier bindings (candidate identity: executor, invocation, pool, model). Empty `tried`: first passing candidate in `prefer` order with today's spread (unchanged). Non-empty: take the first untried candidate in this order: (a) remaining entries of the last tried binding's family in cell order; (b) if `tierFallbackOf(cfg, tier)` exists, the listed families in that order that `prefer` names, each expanded by its cell; (c) with no list, the candidates after the last tried one in `prefer` order (today's walk). A `prefer` family absent from the tier's list is never a fallback target (narrow, never widen); a listed family `prefer` does not name is ignored. Every filter (governance, independence, posture, blind, skills, `excludePools`) still applies to each candidate. Tier never changes during a walk.
5. **Fault exclusion by pool.** `excludeFamilies` becomes `excludePools`; `credentialFaultFamilies` becomes `credentialFaultPools` in `account-rotation.mjs` and returns the pools whose login failed in this unit. Replace the `family-excluded` refusal with `pool-excluded`.
6. **Rotation by pool.** `inspectAccountRotation({ runnerConfig, pool, runtimeDir })` reads the pool's state key; `mayRotateAccount` is unchanged; `retrySameCandidate` records `pool` in its provenance detail. Account order inside the pool is the lease's declared order (phase 02).
7. **Provenance.** `nextCandidate` provenance gains `pool` and `walk: 'entry' | 'family'` beside `kind: 'next-candidate'`; `candidateIndex` is removed from the binding (it was the old walk state; L10).
8. **Pin.** `resolveAccountPin` takes `pool/account` (split at the first `/`; a bare id is refused with a message showing the pool/account form). The pin keeps only candidates of that pool; if the bound family has no entry in that pool the seat binds unpinned and `provenance.account.skipped` says why; an unknown account in a known pool refuses `account-pin-unknown`; a disabled one refuses `account-pin-disabled`.
9. **Explain.** `fgos dispatch explain --for <cap>` prints the walk: candidates in order (family, entry model, pool, invocation, store), why a candidate is skipped, and the pool's accounts in declared order with usable or the reason. The old `pending-pool-routing` label is removed (the pools now route).

## Files

- Modify: `bind.mjs`, `account-rotation.mjs`, `account-pin.mjs`, `explain.mjs`, `dry-bind.mjs` (account field shape).
- Tests: `bind.test.mjs`, `bind-committed-config.test.mjs`, new `test/runner/execution/tier-fallback.test.mjs`, `account-rotation.test.mjs`, `account-pin.test.mjs`, `explain.test.mjs`.

## Tests (one per owner decision)

- Decision 1: with `tierFallback.advanced = [gemini, deepseek, z-ai, claude]` a seat that leads on claude and fails walks gemini, deepseek, z-ai in that order; `prefer` naming `[claude, gemini]` never reaches deepseek; no list gives today's prefer-order walk (compare against the recorded baseline snapshot).
- Decision 2: for every tier of the committed config, the whole chain stays in the tier, contains only families with a cell, and flagship/frontier chains contain no doer-only family; a family with no cell is skipped and recorded.
- Decision 4: `tier-cell-missing` names family and tier (bind and, in phase 04, assignment policy); two entries of one cell with different pools yield two candidates in cell order; `excludePools` skips one pool and keeps the other of the same family; `pool/account` pin selects the matching entry, refuses bare ids.
- `tried` makes the recompute pure: binding N+1 computed from the recorded bindings equals the one the runner used.
- A cell entry whose pool has no account with a matching store produces no candidate and appears in explain with the reason.

## Risk / rollback

M x H: contract change reaches four caller files (phase 04). Mitigation: phase 04 moves them in the same merge; `rg "excludeFamilies|skipCandidateIndex|candidateIndex"` is the completion check. Rollback: revert 03 and 04 together.
