# Seat provider failover: implementation report

Branch `worktree-agent-a3053d6d70c166347`. Decision number 0058 in `docs/specs/runner.md`.

## Commits

- `e092abb0f` feat(runner): fail a seat over to another account of its provider, then to the next candidate
- `dbcf7df4d` docs(runner): record provider failover across accounts and providers
- `1bc5770e0` fix(test): count only unpinned capabilities in the committed-config binding sentinel (cherry-pick of main's `182e6bdc2`; the worktree base lacked it and `bind-committed-config.test.mjs` failed without it, unrelated to this change)

## What existed (prior art) vs what was added

Existed: provider-limit loop in `run.mjs` (`nextCandidate`, `-fb<N>` ids, `fallbackExhausted`); account inventory, lease ranking, quarantine, `classifyProviderCapacityFault` in `provider-capacity.mjs`; shared `AUTH_FAILURE_PATTERNS`; write gate recompute via `fallbackSkipIndex`; soft spread (0055) with `preferIndependentOf`.

Gap found: the observed pi exit (`No API key found for openrouter.`) never reached the classifier as a provider stop. The capacity classifier only reads a stop that the adapter already named `provider-limit`, and a plain non-zero exit settled as `nonzero-process-exit`, so nothing ran.

Added:
1. `provider-auth-failure.mjs`: anchored pattern `^(error:)? no api key found for <x>`, plus `matchAuthFailureLine(text, {tailLines})` (line by line, optional tail window). Capacity classifier, credential probe and pane ladder all use it.
2. `settlement.mjs`: non-zero, non-timeout exit, no valid worker claim, dead-credential wording in the last 5 stderr lines settles as `provider-limit`; `failure.cause: 'credential'` added (additive). Capacity classifier then quarantines `auth-token` / `manual-clear`.
3. `account-rotation.mjs` (new, infra): `inspectAccountRotation` (reads `inspectProviderCapacity`, no second ranking), `mayRotateAccount` (healthy > 0 and retries < accounts - 1), `credentialFaultFamilies` (rebuilt from recorded attempts).
4. `bind.mjs`: `getProviderFamily` exported; `bind(..., {excludeFamilies})`; `nextCandidate(..., {excludeFamilies})` marks `fallbackFrom.kind = 'next-candidate'`; `retrySameCandidate` marks `kind = 'account-rotation'` (+ `provider`, `accountsHealthy`). Scoring unchanged.
5. `run.mjs`: after a `provider-limit` round, rotate (same binding, new `-fb<N>` id) before the walk; walk uses the unit's credential-fault families and re-reads sibling seats for the spread; attempt records `failureCause`, rotation `skipCandidateIndex` inherits the previous one; `fallbackExhausted.accountRotations`; `runUnit` forwards `providerCapacityRuntimeDir` to the dispatch it already makes.
6. `assignment-runner.mjs` write gate: a rotation retry resumes the walk where the attempt it retries did, and the gate applies the same family exclusion (walks made no later than the attempt's `boundAt`). Verified: with the rotation branch disabled the writer test fails with `binding mismatch` (recomputed beta vs alpha), so the fix is load-bearing.
7. Contract: `unit-summary.read.v2.json` documents optional `fallbackFrom.kind/provider/accountsHealthy` (no version bump, additive). Rust reader ignores unknown fields (checked `packages/run-result/rust/src/unit_summary.rs`).
8. Docs: decision 0058 appended at the end of `docs/specs/runner.md`, one paragraph under RUL65b (replaces the "provider-limit only walks to the next candidate" behaviour text in effect; 0050 item 3 is left as history and 0058 states it extends it), CHANGELOG Unreleased/Fixed line, `docs/architecture-manifest.json` entry.

## Boundary

No component-boundary change. Choice of account/executor stays in Execution Core (`bind()`, `run.mjs`, lease); no recipe/workflow/pattern field, no retry knob, no credential probe.

## Item 5 (write gate) conclusion

The gate recomputes `bind()` without `preferIndependentOf` (0055 follow-up). Rotation made it fail outright for writing seats, so it was fixed (see 6). The remaining 0055 gap is unchanged: a writing synthesizer that falls back by spread preference can still mismatch at the gate. Noted in 0058.

## Tests added

- `test/runner/execution/run-provider-failover.test.mjs` (9, real confined workers through `runUnit`, accounts via private HOME config + runtime dir): rotation to account B of the same provider (same executor/invocation, `-fb1`, second account, provenance, quarantine `auth-token`, `failure.cause`); single account goes straight to next provider; rotation budget spent then walk; family exclusion skips a same-provider executor; everything exhausted gives `provider-limit` + `fallbackExhausted` and a non-pass summary; writing seat passes the gate on retry and on a walk; panel seat that rotated keeps role and unit passes (no `sharedFamilies`); panel seat that walked lands on a family siblings did not use.
- `test/runner/execution/account-rotation.test.mjs` (6): budget rules, state from inventory/quarantine, exclusion and spread in `nextCandidate`, `retrySameCandidate`, fault-family rebuild with `boundBefore`.
- `test/runner/provider-auth-failure.test.mjs` (5): positive wording, negative ordinary text, tail window, classifier quarantine for any provider, quota stays quota.
- `test/runner/dispatch-liveness.test.mjs` (+1): pane with missing key is `provider-limit`; quoted wording is not.

## Verification

- Typecheck: n/a (plain ESM).
- Full suite `env -u CLAUDE_CODE_SESSION_ID node scripts/run-tests.mjs`: exit 0; tests 7108, pass 7035, fail 0, skipped 8. (First full run had 1 failure, the base-only sentinel above, fixed by cherry-pick.)
- GitNexus `impact` / `detect_changes` MCP tools were not available in this session; blast radius checked by grep (`fallbackSkipIndex` has one caller; `AUTH_FAILURE_PATTERNS` three users, all moved to `matchAuthFailureLine`; `bind` signature change is additive). Impact-analysis evidence for this change is therefore weak.

## Merge notes

- `docs/specs/runner.md` and `CHANGELOG.md`: the other agent also appends at the end of the decisions list (0057); expect a trivial adjacency conflict. Mine is a separate `### 0058` block, a RUL65b paragraph, and one `### Fixed` line at the top of Unreleased/Fixed.
- `1bc5770e0` duplicates main's `182e6bdc2`; identical patch, merges cleanly.

## Unresolved questions

- A provider with no account inventory (openrouter on this machine) has nothing to quarantine, so every new unit retries it once before walking; only same-unit protection exists. Is a per-provider soft "recently dead" memory wanted, or is account inventory for such providers the intended fix?
- `fallbackFrom.kind` says `next-candidate`, which may be the same family under another executor; excluded only after a credential fault. Fine for now?
