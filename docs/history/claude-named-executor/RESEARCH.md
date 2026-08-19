# RESEARCH — claude-named-executor (tsk-1cn)

## Round 1 — 2026-08-19

**Asked:** What is the current shape of `runner.executors` entries in
`.fgos/config.json` (agy/codex/pi/gitnexus/herdr), does `runner.executors.claude`
already exist, and how does the resolver (`src/runner/dispatch/resolve.mjs`)
pick between `executors.<id>` and the top-level `executor` default? Does
adding a `claude` entry require `allowCrossProvider`/`providerModel`/
`rigorOverrides` the way agy/pi do?

**Checked:**
- `.fgos/config.json` (`repo-root/.fgos/config.json:1-100`): `runner.executor`
  (top-level, unnamed) is `{command:"claude", args:["-p","{prompt}",
  "--model","{model}","--permission-mode","acceptEdits","--allowedTools",
  "Bash(git add:*),Bash(git commit:*)"]}`. `runner.executors` currently has
  keys `agy`, `codex`, `pi`, `gitnexus`, `herdr` — **no `claude` key**.
  - `agy`: `kind:"agent"`, `allowCrossProvider:true`, `invocations:[{via:"cli",
    adapter:"cli-spawn", command:"agy", args:[...]}]`, `providerModel:"gemini"`,
    `rigorOverrides:{light:"lightweight", standard:"lightweight",
    heavy:"lightweight"}`.
  - `codex`: `kind:"agent"`, `allowCrossProvider:true`, `invocations:[{via:"cli",
    adapter:"cli-spawn", command:"codex", args:[...]}]`. No `providerModel`/
    `rigorOverrides`.
  - `pi`: same shape as agy (own `providerModel:"openai-codex"`,
    `rigorOverrides` all `"lightweight"`).
- `src/runner/dispatch/resolve.mjs:187-207` (`resolveExecutorAndOverrides`):
  a literal `cfg.executors[id]` entry always wins first. `resolveExecutorConfig`
  (`resolve.mjs:214-316`): an `invocations` array with a `via:"cli"` entry
  resolves to that invocation's `{command,args,adapter,provider}`
  (`resolve.mjs:277-291`); falling through to `cfg.executor` (the top-level
  default) only happens when no named executor is passed at all, or the
  named entry declares neither `invocations`/`command`/`adapter`/`agentType`.
- `src/runner/dispatch/config.mjs:357`: `CLAUDE_CLI_COMMANDS =
  Object.freeze(['claude'])`.
- `resolve.mjs:307` (cross-provider gate): `allowCrossProvider` is only
  checked `if (... && !CLAUDE_CLI_COMMANDS.includes(executor.command) &&
  executorEntry.allowCrossProvider !== true)`. Since a `claude` entry's
  resolved `command` is literally `"claude"` (in `CLAUDE_CLI_COMMANDS`), this
  gate is skipped regardless of `allowCrossProvider` — agy/codex/pi need
  `allowCrossProvider:true` only because their commands (`agy`/`codex`/`pi`)
  are NOT in `CLAUDE_CLI_COMMANDS`. A `claude` entry does not need it.
- `modelForTier` (`resolve.mjs:33-51`) defaults `providerModel:'claude'` when
  the caller passes none — agy/pi set `providerModel` because they are
  non-Claude providers; a `claude` executor entry needs no explicit
  `providerModel` override (default already correct) and no
  `rigorOverrides` (agy/pi's overrides exist to downgrade a non-Claude
  provider's own model-policy tier; nothing forces a Claude entry to
  redeclare the same downgrade).
- `test/runner/dispatch.test.mjs` already exercises `executors.agy`/`codex`
  shape assertions — `npm test` (`node --test 'test/**/*.test.mjs'`) is the
  real, runnable verify command for this item.

**Found:** No `runner.executors.claude` entry exists today; `runner.executor`
(top-level, unnamed) is the sole fallback for claude dispatch, confirming the
item's own premise. The resolver already supports a named `invocations:
[{via:"cli", adapter:"cli-spawn", command:"claude", args:[...]}]` entry
mirroring agy/codex's exact shape — no code change needed in
`resolve.mjs`/`transport.mjs`, this is a pure config addition. `kind:"agent"`
and `invocations` (reusing the SAME `args` array already in `runner.executor`)
are the only fields actually needed; `allowCrossProvider`/`providerModel`/
`rigorOverrides` are NOT needed for a `claude` entry (see gate details above)
— including them would be inert-but-misleading copy-paste from agy/pi, not a
real requirement.

**Still open:** none — evidence is sufficient to add the config entry
directly; no code path needs modification.

## Verdict

`clear`. Verify: `npm test` (existing `test/runner/dispatch.test.mjs`
already covers `executors.<id>` shape resolution; a new test asserting
`resolveExecutorConfig(cfg, tier, 'claude', ...)` resolves to
`runner.executor`'s own command/args should be added alongside the config
change).
