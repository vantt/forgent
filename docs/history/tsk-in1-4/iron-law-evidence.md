# tsk-in1-4 — Iron Law failing-test-first evidence

`classifyIronLaw` result (scoped to this leaf's own diff vs its target
`fgw/tsk-in1`, not the wider `main` trunk): `required: true`,
`matchedFlags: []`, `matchedModules: ["src/runner/dispatch.mjs"]`.

## Test command

Item's own verify: `npm test`

## Failing-before (real transcript — `src/runner/dispatch.mjs` and
`src/state/tool-registry.mjs` temporarily checked out back to the parent
commit's version (`d9b43925`, tsk-in1-3), every test file left at its new
content)

```
ℹ tests 417
ℹ pass 375
ℹ fail 42
```

(scoped run over `test/runner/dispatch.test.mjs test/state/tool-
registry.test.mjs test/cli/fgos-tool.test.mjs test/runner/loop.test.mjs
test/setup/checks.test.mjs` — the five files this item touches.)

Representative real failures, spanning every facet of the change:

- `CAPACITY_KINDS is exactly the agent/tool BAN CHAT axis (D5, tsk-in1-4)
  — no longer reuses tool-registry's own KINDS` — pre-fix `CAPACITY_KINDS`
  was still `['cli', 'binary', 'mcp', 'skill', 'task']`, not `['agent',
  'tool']`.
- `INVOCATION_VIA is exactly the CO CHE GOI axis (D11 tsk-5tm-4, widened
  D8 tsk-in1-4) — cli/task/mcp` — pre-fix `INVOCATION_VIA` was still
  `['cli']` only, not widened to include `task`/`mcp`.
- `toolsFromCapacities maps a capability-bearing capacity into a
  tool-shaped object ... probe kind/command read from invocations[0], not
  capacity.kind (tsk-in1-4 D5)` — pre-fix `toolsFromCapacities` still read
  `capacity.kind`/`capacity.probeCommand` directly (`'mcp'` expected,
  `'tool'` — the new BAN CHAT value — returned instead).
- `resolveCapacityIdForPurpose finds the capacity via a multi-value "for"
  array (D15, tsk-in1-4)` — pre-fix `for` was still a single string field,
  not validated/matched as an array.
- The 9 `tool check`/`tool query` CLI-integration tests in
  `fgos-tool.test.mjs` — pre-fix `declareGitnexus`'s
  `kind: 'tool', invocations: [{ via: extra.kind ?? 'mcp', ... }]` shape
  was rejected outright by the still-live `CAPACITY_KINDS` validation
  (`'tool'` not yet a valid value), so every CLI subprocess exited
  non-zero before even reaching the behavior under test.

## Passing-after (real transcript, both files restored to the fix)

Full `npm test`: `tests 3363 / pass 3358 / fail 0` (5 skipped,
pre-existing, unrelated), `duration_ms 119100`.

## What changed

- `src/runner/dispatch.mjs`: split `capacities.<id>.kind` down to the pure
  agent/tool BAN CHAT axis (`CAPACITY_KINDS = ['agent', 'tool']`) from the
  dispatch mechanism, which moves to `invocations[].via`
  (`INVOCATION_VIA = ['cli', 'task', 'mcp']`). Added Gate B1
  (`validateInvocationShape` — shape-checks each invocation per its own
  `via`, never forcing cli-executor shape onto an `mcp`/`task`
  invocation), Gate B2 (`resolveExecutorConfig` picks the invocation whose
  `via === 'cli'` specifically, never `invocations[0]` blindly), and Gate
  B3 (throws explicitly when `invocations` is present but none is
  `via: 'cli'`, instead of silently falling through to the global
  executor). `capacities.<id>.for` becomes a non-empty `string[]`,
  validated against a new curated `runner.capabilities` catalog
  (`capabilityNames`) built from `cfg.capabilities` before capacities are
  validated. `allowCrossProvider` governance is now kind-independent: the
  only exemption is a capacity resolved purely via `buildAgentTypeExecutor`
  (agentType-only, no own command/adapter/invocations), tracked via a new
  `resolvedViaAgentType` boolean.
- `src/state/tool-registry.mjs`: `toolsFromCapacities` now reads probe
  kind/command from `capacity.invocations[0]` instead of the retired
  `capacity.kind`/`capacity.probeCommand` fields.
- `test/runner/dispatch.test.mjs`, `test/cli/fgos-tool.test.mjs`,
  `test/state/tool-registry.test.mjs`, `test/runner/loop.test.mjs`,
  `test/setup/checks.test.mjs`: rewritten to the new `kind: agent|tool` +
  `invocations[].via` + `for: string[]` + `capabilities` catalog shape;
  the handful of tests that previously depended on the live (now
  permanently un-migrated) main `.fgos/config.json` were decoupled onto
  `mkTempGitRepo()`-isolated fixtures.
- Docs (AGENTS.md docs-gate, user-visible config-surface change):
  `CHANGELOG.md`, `docs/specs/runner.md` (new RUL65), `docs/reference/
  forgentx-tool-registry-configuration.md` — updated in place, including
  an explicit callout that the live `.fgos/config.json` migration
  (`agy.kind → 'agent'`, `gitnexus`/`herdr.kind → 'tool'` +
  `invocations[]`) is deliberately deferred to whoever merges
  `fgw/tsk-in1` to `main`, since it is a breaking config-shape change old
  code rejects outright (unlike tsk-in1-1/tsk-in1-3's additive changes).
