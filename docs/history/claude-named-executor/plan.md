# plan.md — tsk-1cn: Register claude as a named executor

Mode: small (0 mode-gate flags apply — no auth/authorization/data-model/
audit-security/external-provider/public-contract/cross-platform change; a
pure config addition mirroring an already-tested pattern, no gray areas).
No `CONTEXT.md` exists for this item — discovery verdict was `clear`
(`docs/history/claude-named-executor/RESEARCH.md`), which skips `exploring`
entirely, so there is no locked-decisions doc to cite; this plan cites the
research round instead.

## Approach

Add a `claude` key to `.fgos/config.json`'s `runner.executors`, mirroring
`agy`/`codex`'s own `invocations`-based shape:

```json
"claude": {
  "kind": "agent",
  "description": "Claude Code CLI (headless dispatch)",
  "invocations": [
    {
      "via": "cli",
      "adapter": "cli-spawn",
      "command": "claude",
      "args": ["-p", "{prompt}", "--model", "{model}", "--permission-mode",
        "acceptEdits", "--allowedTools",
        "Bash(git add:*),Bash(git commit:*)"]
    }
  ]
}
```

`args` is the SAME array already at `runner.executor.args` (the top-level
default) — this is a naming/addressability change, not a new behavior: the
resolver already spawns exactly this command/args combination today when no
named executor is requested at all (`src/runner/dispatch/resolve.mjs:292`,
`executor = byExecutor ?? cfg.executor`).

**No `allowCrossProvider`/`providerModel`/`rigorOverrides`** — RESEARCH.md's
finding: `resolve.mjs:307`'s cross-provider gate only fires when the
resolved `command` is outside `CLAUDE_CLI_COMMANDS = ['claude']`
(`config.mjs:357`); agy/codex/pi need `allowCrossProvider` because their
commands are not `"claude"`. `providerModel` defaults to `'claude'`
already (`resolve.mjs:33`) and `rigorOverrides` exists only to downgrade a
*non*-Claude provider's model-policy tier. Copying those three fields from
agy/pi would be inert-but-misleading, not a real requirement — leaving them
off is the correct mirror, not an incomplete one.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| `.fgos/config.json` shape | light — pure data addition, no new field/adapter, exact shape `validateExecutorShape` (`src/runner/dispatch/config.mjs:300`) already accepts (agy/codex are live proof) | `npm test` — `test/runner/dispatch.test.mjs` already asserts `executors.<id>` shape/resolution for agy/codex; a new assertion for `executors.claude` proves the same holds for it |
| Dispatch resolution (`resolveExecutorConfig`) | light — no code change; resolver already has the `invocations`+`via:"cli"` branch this entry lands on (`resolve.mjs:277-291`), exercised today by agy/codex | same `npm test` run, plus a direct assertion that `resolveExecutorConfig(cfg, tier, 'claude', ...)` returns the same `{command,args}` as the unnamed `cfg.executor` fallback |
| `dispatch.mjs decide` addressability (AGENTS.md's "Dispatch" section: `decide --for <purpose>`/`decide <executorId>`) | light — `decide claude` becomes resolvable by literal id (`resolveExecutorAndOverrides`'s first branch, `resolve.mjs:189-191`), which today falls through only via the unnamed default | same test file, asserting `decide claude` (or the underlying `resolveExecutorAndOverrides(cfg, 'claude')`) returns `{executorId:'claude', configured:true}` |

**Impact-analysis posture:** `full` — `fgos tool query --capability
impact-analysis --status present` returned GitNexus `present`. Not actually
load-bearing here: this change touches no function/class/method symbol (a
JSON config key addition), so `impact({target, direction:"upstream"})`
against a code symbol does not apply. Cross-checked directly instead (this
plan's own reads of `resolve.mjs`/`config.mjs`/`transport.mjs`) — no
resolver code changes, so no blast radius beyond the new config key itself.

## Files touched

- `.fgos/config.json` — add `runner.executors.claude` (data only)
- `test/runner/dispatch.test.mjs` — add coverage for the new `claude`
  executor entry (shape resolution + `decide`-style addressability)
- `CHANGELOG.md` — `## [Unreleased]` line (AGENTS.md's install/setup/doctor
  gate: this is a dispatch-config change a user of fgOS would see)

## No split

One honest piece — a config entry plus its test coverage. No candidate
split exists; `fgos graph --json`'s ordering fields do not apply to a
single undivided piece.

## Outstanding questions

None
