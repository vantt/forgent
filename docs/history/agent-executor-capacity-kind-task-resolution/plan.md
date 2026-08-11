# plan.md — tsk-3sw: capacity kind:"task" agentType resolution

## Mode

Flags counted: **public contracts** (`resolveExecutorConfig`/
`resolveExecutorCommand` are shared internal API with 3 real call sites —
`spawnWorker`, `resolveCapacityCli`, `judge-executor.mjs`'s
`spawnAttempt`), **existing covered behavior** (`test/runner/
dispatch.test.mjs` has extensive existing coverage of the precedence chain
this item extends — must not regress). 2 flags → **standard** mode: a
phased plan, no split into child items (one coherent piece of work, see
"Split" below).

impact-analysis posture: **full** (GitNexus registered and `present`,
`fgos tool query --capability impact-analysis --status present`).

## Approach

Extend `resolveExecutorConfig` (`src/runner/dispatch.mjs`) so a
`kind:"task"` capacity declaring only `agentType` (no own `command`/
`args`) resolves to a real, spawnable executor instead of silently falling
through to `perTier ?? cfg.executor` (today's `byCapacity` gate only checks
`capacity.adapter || capacity.command` — confirmed by direct code read,
`CONTEXT.md` scout evidence).

**Concrete shape** (not previously locked in `CONTEXT.md` — an
implementation-only detail, not material to `D1`/`D2`'s product decisions,
so decided here per this skill's own mid-planning-gap filter rather than
handed back to `fgos-coding-exploring`):

```js
const byCapacity =
  capacity && (capacity.adapter || capacity.command) ? capacity
  : capacity && capacity.agentType ? buildAgentTypeExecutor(cfg.executor, capacity.agentType)
  : undefined;
```

`buildAgentTypeExecutor(baseExecutor, agentType)` derives its args from the
**resolved `cfg.executor`'s own args template** (whatever the project
actually configured — never a hardcoded literal copy of
`DEFAULT_RUNNER_CONFIG`, so a project that customized its global
`--allowedTools`/`--permission-mode` gets that customization reflected in
its agentType capacities too), inserting `'--agent', agentType` and
stripping the `'--model', '{model}'` pair (D2 — the agent definition's own
pinned model wins, never overridden by tier). `command` stays whatever
`cfg.executor.command` is — D1 scopes this to Claude-only for now, so this
branch does not itself hardcode `'claude'` as a literal; it inherits
whatever the global executor already resolved to (in every config this
repo ships or has seen, that is `claude` — D1's Claude-only scoping is
enforced by this item simply not building a per-provider branch, not by a
runtime provider check).

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| `byCapacity` gate extension | medium — touches the one precedence chain both `spawnWorker` (headless runner) and `resolveCapacityCli` (in-session skills) share | existing `dispatch.test.mjs` suite must stay 100% green (regression proof); new tests cover the agentType-only branch explicitly for both call paths |
| `buildAgentTypeExecutor`'s arg-stripping (`'--model'`+`'{model}'` pair removal) | low — pure array transform, no I/O | unit test asserting the built args array contains no `'--model'`/`'{model}'` pair when `agentType` is used, and DOES contain them for every existing (unchanged) capacity shape |
| `validateCapacityShape`'s new `agentType` field check | low — mirrors the existing `model`/`allowCrossProvider` optional-field pattern exactly | unit test: non-string/empty `agentType` throws `RunnerConfigError`, mirroring existing `model` field test shape |

Files touched: `src/runner/dispatch.mjs` (the two functions above),
`test/runner/dispatch.test.mjs` (new coverage), and one short mention in
`docs/explanation/agent-executor-capacity-aware-dispatch.md` (the new
`agentType` field is real, user-facing schema surface — brief addition,
not a rewrite, per this repo's own "update docs only when user-facing
behavior changes" convention).

`fgos graph --json`: `tsk-3sw` is not on the critical path
(`depth: 10` path rooted at `tsk-4vo`) and not in `topUnblock`'s top 5
(only `tsk-53h` depends on it, 1 unblock) — this item's own internal
ordering is unaffected by global graph pressure; the phase order below is
purely dependency-of-implementation, not urgency-driven.

## Shape (standard)

1. **Phase 1 — static validation.** `validateCapacityShape`: `agentType`,
   when present, must be a non-empty string (mirrors `model`). Test:
   malformed `agentType` throws `RunnerConfigError` with a named message,
   same style as the existing `model` field test.
2. **Phase 2 — resolution.** `buildAgentTypeExecutor` + the extended
   `byCapacity` gate in `resolveExecutorConfig`, per the concrete shape
   above. Test: an agentType-only capacity resolves to `{command:
   cfg.executor.command, args: [...cfg.executor.args minus --model pair,
   '--agent', agentType]}` — via BOTH `spawnWorker`-style resolution
   (`fgosDir` given) and `resolveCapacityCli`-style resolution (no
   `fgosDir`), asserting both produce the identical resolved shape (the
   "works identically for cli-dispatch and task-dispatch" claim `CONTEXT.md`
   already asserts — this is where it gets proven, not just claimed).
3. **Phase 3 — precedence regression proof.** Test: a capacity declaring
   BOTH `agentType` AND its own `command`/`args` (the `judge-discovery`
   shape) still resolves to its own `command`/`args` unchanged — `agentType`
   is never consulted when `capacity.command` is already present. Full
   existing `dispatch.test.mjs` suite green (no regression to any
   pre-existing precedence case).
4. **Phase 4 — doc mention.** One short paragraph in
   `docs/explanation/agent-executor-capacity-aware-dispatch.md` naming the
   new `agentType` field and linking this item's `CONTEXT.md`/`plan.md` —
   not a rewrite of the existing explanation.

Concrete cases proven, matching mode `standard`'s expected depth:
empty/boundary (`agentType: ""` → validation error), existing behavior
that must not regress (every current capacity shape: plain `command`,
`kind:"cli"` with presence check, `judge-discovery`'s own
`command`+`kind:"task"` combination), no concurrent-access or
partial-failure cases apply (pure synchronous config resolution, no I/O
in the new code path itself).

## Split

No split. One coherent piece: the gate extension, its helper, and their
tests are inseparable (the helper has no caller other than the gate
extension; the tests prove the gate extension's own new branch). `tsk-53h`
(this item's own dependent, per its own `D1`) is explicitly a separate,
later item — not a child of this one.

## Assumptions

- `cfg.executor` (the global executor block) always has a `command`/`args`
  shape by the time `resolveExecutorConfig` runs (`validateExecutorShape`
  already guarantees this at config-load time, unconditionally, before any
  capacity resolution) — `buildAgentTypeExecutor` never needs its own
  null-check for this.
- No existing capacity in this repo's own committed `.fgos/config.json`
  declares `agentType` today (confirmed: `rg agentType` — zero hits) — this
  phase plan changes zero existing capacity's resolved behavior; every new
  behavior is opt-in via a field nothing uses yet.
