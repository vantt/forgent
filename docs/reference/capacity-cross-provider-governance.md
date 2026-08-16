# capacity cross-provider governance

Reference for `capacities.<id>.allowCrossProvider`, the config field that
controls whether a capacity's prompt content is allowed to reach a
non-Claude backend.

## Field

`capacities.<id>.allowCrossProvider` — boolean, on a `.fgos/config.json`
`runner.capacities.<id>` entry. Optional.

| Value | Effect |
|---|---|
| Absent | Blocked (restrictive-by-default) |
| `false` | Blocked |
| `true` | Allowed |

## When the check applies

**Kind-independent** (revised tsk-in1-4 D5/D9 — `kind` stopped being the
CO CHE GOI/mechanism axis; it is now only `agent`/`tool`, the BAN CHAT
axis, orthogonal to dispatch mechanism). The check applies to every
capacity resolution EXCEPT the one exempt path: a capacity resolved
purely via `buildAgentTypeExecutor` (agentType-only — no own `command`/
`adapter`/`invocations` of its own; `resolveExecutorConfig`'s internal
`resolvedViaAgentType` flag) — that path always reuses the global
`cfg.executor`'s own command (Claude, in practice), so the check is
already inert for it by construction, not specially carved out. Pre-
tsk-in1-4 this section read "only when `kind === "cli"`" — `'cli'` is no
longer a legal `kind` value at all; a `kind: "agent"` capacity like `agy`
dispatched via its own `via: "cli"` invocation (`invocations[].via`, the
CO CHE GOI axis now) still clears this same gate exactly as before.

## What "non-Claude" means

Checked against the **final resolved executor `command`** — after
`capacities.<id>` > `executor` precedence resolves (the intermediate
`executors.<tier>` rung was retired at tsk-in1-2 D6) — against a small
known-Claude-CLI allowlist (`'claude'` today), never against:

- the capacity's declared `kind` alone (a capacity with no
  `command`/`adapter`/`invocations` override of its own falls through to
  the global executor, which is ordinarily Claude's own CLI — this must
  not require `allowCrossProvider`);
- the `provider` field (a freely-overridable display alias, not the
  command actually spawned — checking it would be spoofable).

## What happens on a violation

`resolveExecutorConfig` throws `RunnerConfigError` at resolve time, before
any dispatch. No silent fallback, no automatic substitution to a
Claude-only executor that proceeds anyway — the dispatch simply never
happens.

## Example

```json
{
  "capacities": {
    "fgos-coding-implement": {
      "kind": "agent",
      "command": "agy",
      "args": ["{prompt}"],
      "allowCrossProvider": true
    }
  }
}
```

Without `"allowCrossProvider": true`, this exact config throws at resolve
time: `capacity "fgos-coding-implement" resolves to non-Claude command "agy" —
prompt content would leave the Claude ecosystem. Set
capacities.fgos-coding-implement.allowCrossProvider: true to permit this.`
