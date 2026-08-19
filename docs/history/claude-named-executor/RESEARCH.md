# RESEARCH — claude-named-executor (tsk-1cn, tsk-1jt)

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

## Round 2 — 2026-08-19 (tsk-1jt, discovery stage)

**Asked:** what does `pi`'s own D4 proof-test precedent (tsk-47r,
`docs/history/pi-executor-runtime-capacity/{plan.md,RESEARCH.md}`) look
like mechanically, so tsk-1jt can mirror it for the named `claude`
executor? And is there any existing guard against dispatching `claude`
itself as an out-of-process CLI target (as opposed to in-process/native)?

**Checked:**
- `docs/history/pi-executor-runtime-capacity/plan.md` step 2, and
  `RESEARCH.md` Rounds 3-4 (real evidence, `tsk-1nif`/`tsk-1o8j` throwaway
  items): the proven mechanical pattern is (1) create a genuinely
  disposable `fgos submit`/`fgos take --role session` work item
  (`kind: chore`, small `verify`, a `footprint` naming one file), (2) claim
  its worktree the same way `/fgOS:pick` does
  (`createClaimWorktree`/`fgos pick`), (3) build the real dispatch prompt
  with `buildPrompt` (`src/runner/dispatch/prepare.mjs`) against that
  item's own work object at `stage: 'executing'` — never a hand-written
  approximation, (4) run the executor CLI from inside that worktree with
  the prompt, (5) read the real JSON event stream plus `.fgos/events.jsonl`
  and `git log`/`git show --stat` on the worktree as evidence — never the
  worker's own self-report alone, (6) `wontfix` the throwaway item and
  remove its worktree/branch afterward, never left dangling.
- `RESEARCH.md` Round 3 (`pi --provider anthropic`, real attempt):
  produced a `400 ... "You're out of extra usage"` from the SAME Anthropic
  account the session's own OAuth draws from — an account-level usage cap,
  not a mechanism/contract defect. `pi --provider openai-codex --model
  gpt-5.5` (Round 4, different provider/account) got real evidence instead.
  **Relevant to tsk-1jt:** dispatching `claude` itself as an out-of-process
  worker draws on the SAME account/usage pool this very session already
  uses — a real, foreseeable risk of hitting the identical "out of extra
  usage" block Round 3 hit, unrelated to whether the worker-contract claim
  holds. If it happens, that is the honest `BLOCKED` outcome Round 3
  recorded (neither GREEN nor RED) — not a reason to fabricate a verdict.
- `docs/specs/runner.md:1662-1751` (D-ADR0026, Native-First Dispatch
  Doctrine): explicitly names this exact case as anticipated, not
  forbidden — "1 `claude` bị spawn qua cli/spawn, một khi đã chạy, chính
  nó lại là 1 Claude Code agent loop thật" (line ~1712-1714, quoting
  `tsk-53h`'s own pinned nesting rule) — a `claude` process spawned via
  cli/spawn is itself a real rootTask, fractal/recursive by design.
  Rule 2 of the doctrine's own dispatch-mechanism table (line ~1742) says a
  same-provider, soul-needing target should PREFER native (in-process)
  dispatch over cli-spawn — which is exactly why `dispatch.mjs decide`
  resolved `in-process` for `fgos-coding-implement` during tsk-1cn's own
  drive. This means tsk-1jt's own proof must go through the literal
  `executorId`-named path (`dispatch.mjs execute claude --prompt ...`),
  bypassing the purpose-based `decide` step entirely — matching exactly
  what the item's own description already specifies, not a gap to close.
- `src/runner/dispatch/cli.mjs:536` (`execute` subcommand) →
  `executeExecutorCli` → `resolveExecutorConfig`/`transport.mjs`'s
  `cliSpawnAdapter`: no special-casing anywhere that excludes
  `command === 'claude'` from the ordinary CLI-spawn path agy/codex/pi
  already use — `runner.executors.claude` (landed on `main`,
  `10847668`) resolves and spawns through the identical mechanism.

**Found:** the mechanical pattern to mirror is fully specified by tsk-47r's
own precedent; no new mechanism needs inventing. The one real, honest risk
carried into tsk-1jt (not a gap in the plan, a property of the test itself)
is the shared-account usage cap Round 3 hit — the test's own real outcome
this session cannot control in advance.

**Still open:** none for discovery purposes — the D4 test itself is the
open question the item exists to answer; nothing here blocks proceeding.

## Verdict (Round 2, tsk-1jt)

`clear`. Verify: not automatable (a live agent dispatch cannot be asserted
by a CI-style command, per tsk-47r's own precedent) — proof lives in this
file's own Round 3 below (once run), read by the human approver at
`awaiting-approval`.
