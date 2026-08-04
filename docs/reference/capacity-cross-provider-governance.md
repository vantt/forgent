# capacity cross-provider governance

Reference for `capacities.<id>.allowCrossProvider`, the config field that
controls whether a capacity's prompt content is allowed to reach a
non-Claude backend.

## Field

`capacities.<id>.allowCrossProvider` — boolean, on a `.fgos-runner.json`
`capacities.<id>` entry. Optional.

| Value | Effect |
|---|---|
| Absent | Blocked (restrictive-by-default) |
| `false` | Blocked |
| `true` | Allowed |

## When the check applies

Only when `capacities.<id>.kind === "cli"`. Every other `kind`
(`mcp`/`http`/`skill`/`task`) is out of scope for this check.

## What "non-Claude" means

Checked against the **final resolved executor `command`** — after
`capacities.<id>` > `executors.<tier>` > `executor` precedence resolves —
against a small known-Claude-CLI allowlist (`'claude'` today), never
against:

- the capacity's declared `kind` alone (a `kind: "cli"` capacity with no
  `command`/`adapter` override falls through to the tier/global executor,
  which is ordinarily Claude's own CLI — this must not require
  `allowCrossProvider`);
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
    "fgos-code-implement": {
      "kind": "cli",
      "command": "agy",
      "args": ["{prompt}"],
      "allowCrossProvider": true
    }
  }
}
```

Without `"allowCrossProvider": true`, this exact config throws at resolve
time: `capacity "fgos-code-implement" resolves to non-Claude command "agy" —
prompt content would leave the Claude ecosystem. Set
capacities.fgos-code-implement.allowCrossProvider: true to permit this.`
