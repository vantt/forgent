# RESEARCH — pi executor runtime capacity (tsk-47r)

## Round 1 — 2026-08-18 (discovery stage, called from fgos-coding-discovering)

**Asked:** exact pattern to register a new executor (`pi`) via the
sanctioned `fgos setup` configDefault door, mirroring how `agy` is
registered, without touching `src/runner/dispatch/*.mjs` or the `agy`
executor entry itself. Also: is a new doctor check required, and what
verify command proves the registration.

**Checked:**

- `src/setup/registrations.mjs:1082-1086` — the single `registerConfigDefault({id:'runner', key:'runner', shape: {...}})` call. `assembleRegistryDefaults` composes registrations by flat per-key assignment (comment at `registrations.mjs:1053-1058`, tsk-2uf-3), so a SECOND `key:'runner'` registration would silently overwrite this one's shape rather than merge — confirmed by tsk-2uf-3's own choice to layer its `capabilities` addition onto this SAME literal (`git show d8ec279e`) instead of registering a second `key:'runner'` default. tsk-47r must do the same: extend this one shape object with an `executors: { pi: {...} }` key, never a second `registerConfigDefault({key:'runner', ...})` call.
- `src/setup/config-merge.mjs` (`mergeConfigDefaults`/`mergeInto`) — deep-merge-fill-missing-only, recursing into nested plain objects. Traced by hand: for the `executors` key, since the committed `.fgos/config.json` already has `runner.executors` as a plain object (containing `agy`) and the new default shape's `executors` is also a plain object (containing `pi`), `mergeInto` recurses one level into `executors` and fills only the missing `pi` sub-key — `agy` stays byte-identical, untouched. This is what makes it safe to extend the shared `shape` object without violating the "never touch the agy executor entry" constraint.
- `.fgos/config.json:35-64` (main checkout, read directly — this file is stripped from the worktree per ADR0020) — the live `runner.executors.agy` entry: `{kind:"agent", description, allowCrossProvider:true, invocations:[{via:"cli", adapter:"cli-spawn", command:"agy", args:[...]}], providerModel:"gemini", rigorOverrides:{...}}`. This is the exact shape `pi`'s own entry should mirror.
- `src/runner/dispatch/config.mjs:405-470` (`validateExecutorEntryShape`/comments, read-only — this file is off-limits to edit per the item's own constraints) — confirms the field vocabulary: `kind` required (`EXECUTOR_KINDS = ['agent','tool']`, `pi` is `'agent'`, a live persona, not `'tool'`); `invocations[].via` in `['cli','task','mcp','api']` (`pi` uses `'cli'`, which requires `command`+`args` shaped like `validateExecutorShape`); optional `allowCrossProvider` (boolean, restrictive-by-default — must be explicitly `true` to allow cross-provider dispatch), `providerModel`/`rigorOverrides` (model-tier mapping, mirrors `agy`'s own `modelPolicies` precedent at `dispatch/config.mjs:124-131`), `model`, `agentType`, `forceCliSpawn`, `for` (capability names this executor serves, from `cfg.capabilities`).
- `src/state/tool-registry.mjs:91-116` (`toolsFromExecutors`) — explicitly `continue`s (skips) any executor whose `kind !== 'tool'`. Confirmed: `agy` (`kind:'agent'`) is invisible to the tool-registry/`checkToolRegistryConfigured` doctor check (`registrations.mjs:521-556`) by design — that check only probes presence-mechanical `kind:'tool'` entries (e.g. `gitnexus`). `pi`, also `kind:'agent'`, will be equally invisible to it — this is not a gap `pi` introduces, it is identical to `agy`'s existing, accepted posture.
- `rg -n "agy" src/setup/*.mjs` — no dedicated "is the agy binary on PATH" doctor check exists anywhere in `src/setup/`; the only `agy`-specific check is `agy-permissions-configured` (`agy-permissions.mjs`), which checks `settings.json`'s command denylist, not binary presence. Confirms: an agent-kind executor's own binary presence has no doctor check today, for `agy` or otherwise.
- `test/setup/registrations.test.mjs:168-176`, `test/setup/checks-setup-config.test.mjs:68-72` — both assert `written.runner` / `config.runner` `deepEqual({...DEFAULT_RUNNER_CONFIG, capabilities: DEFAULT_CAPABILITY_SLOTS})` (tsk-2uf-3's own ripple fix for adding `capabilities`). Adding `executors: {pi: {...}}` to the same shape object requires updating both these assertions to include the new key — same ripple shape tsk-2uf-3 already established as precedent.

**Found — answers:**

1. **Registration pattern (clear):** extend the *existing* `registerConfigDefault({id:'runner', key:'runner', shape: {...}})` call at `registrations.mjs:1082` — add an `executors: { pi: {kind:'agent', description, allowCrossProvider:true, invocations:[{via:'cli', adapter:'cli-spawn', command:'pi', args:[...]}], providerModel, rigorOverrides}}` key alongside the existing `...DEFAULT_RUNNER_CONFIG, capabilities: DEFAULT_CAPABILITY_SLOTS`. `mergeConfigDefaults`'s fill-missing-only recursion adds `pi` under `runner.executors` on the next `fgos setup` run without touching `runner.executors.agy` (verified by tracing `mergeInto`'s recursion, not by running setup destructively against the live committed config in this discovery pass).
2. **Doctor check (clear, no new check needed):** `checkToolRegistryConfigured`'s generic tool-registry check does not and should not cover `pi` — it only probes `kind:'tool'` executors, and `agy` (the direct precedent for an agent-kind executor) has no dedicated binary-presence check either. Adding one for `pi` alone would be inconsistent with the existing, accepted posture for agent-kind executors — not required by AGENTS.md's install/setup/doctor gate, since that gate is satisfied by the *generic* `runner` configDefault + `checkConfigNotStale` machinery already covering "is `runner.executors.pi` present" structurally, same as it does for `agy`.
3. **Live `.fgos/config.json` baseline (clear):** captured verbatim above from `.fgos/config.json:35-64` in the main checkout.

**Still open (not blocking `clear` — resolved at planning/executing, not discovery):** the exact `args` allowlist for `pi`'s own `invocations[].args` (`--tools <list> --mode json ...`) depends on live-testing `pi` first (item's own scope step 1, "KHÔNG khai config trước khi thấy nó chạy") — deliberately sequenced AFTER a live run, not something discovery can front-load without violating the item's own locked ordering.

**Verdict: clear.**

Verify (real, runnable — mirrors tsk-2uf-3's own ripple-test precedent exactly):

```bash
npm test -- test/setup/registrations.test.mjs test/setup/checks-setup-config.test.mjs
```
