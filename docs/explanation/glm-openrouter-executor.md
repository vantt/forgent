---
authoritative_for: adding a per-executor env override to the fgOS runner dispatch config/transport (executors.<id>.env with ${VAR} substitution against process.env, never a shell) to register a new "glm" executor routing the claude CLI through OpenRouter's z-ai/glm-5.2, keeping the real API key outside every git-tracked file; the merge-approve bypass this item's own landing hit due to a confirmed false-positive integrity check (tsk-52p)
---

# Giving one executor its own environment without touching the default one

`tsk-gb3` added a new fgOS runner executor named `glm` that reuses the
`claude` CLI as its command but routes to GLM 5.2 (`z-ai/glm-5.2`) via
OpenRouter instead of Anthropic's real API — without affecting the
default `claude` executor's real Anthropic calls.

## The gap this closed

Before this item, `dispatch/transport.mjs`'s `cliSpawnAdapter` always
spawned with `env: {...process.env}` unmodified — there was no way for one
executor to carry its own environment distinct from every other
executor's. Routing a second executor through OpenRouter needed its own
base-url/auth-token/model env vars without leaking into or being leaked by
the default executor's environment.

## What shipped

A new `executors.<id>.env` schema field, validated by
`validateExecutorEnvShape` (`dispatch/config.mjs`) — an object mapping
`ENV_NAME` to a string value, rejected otherwise. At spawn time,
`resolveExecutorEnv` (`dispatch/transport.mjs`) resolves `${VAR}`
placeholders against `process.env` via a plain regex substitution —
**never a shell**:

```js
export function resolveExecutorEnv(rawEnv, baseEnv = process.env) {
  if (!rawEnv || typeof rawEnv !== 'object') return {};
  const resolved = {};
  for (const [k, v] of Object.entries(rawEnv)) {
    if (typeof v === 'string') {
      resolved[k] = v.replace(/\$\{([^}]+)\}/g, (_, varName) => baseEnv[varName] ?? '');
    }
  }
  return resolved;
}
```

`cliSpawnAdapter` merges this resolved env on top of `process.env` (still
including the default), before the dispatch-depth env var:
`env: { ...process.env, ...resolvedEnv, [DISPATCH_DEPTH_ENV]: String(depth + 1) }`.

`glm` was registered in `.fgos/config.json`'s `runner.executors` — `kind:
agent`, `command: claude`, with its own `env` block pointing at the
OpenRouter-compatible base-url/auth-token/model vars. The real OpenRouter
API key itself stays outside every git-tracked file: only the env-var
*name* is committed, and `.gitignore` gained
`.fgos/secrets.local.env` as the untracked location the real key lives in
at spawn time.

## A cross-provider gate gap surfaced, filed separately

Implementing this surfaced a governance gap in the cross-provider
dispatch gate — filed as its own follow-up item (`tsk-2y7`), not detailed
here since it's out of this item's own scope.

## The merge itself hit the same false-positive integrity check as `tsk-2ewi`

Landing this item's merge required the same workaround already documented
on [`tsk-2ewi`](fanout-batch-per-child-sync-spawn-and-listwork.md):
`approve --acknowledge-iron-law` repeatedly parked on a confirmed
false-positive merge-integrity check (`branchContentMismatch` has no
`.fgos/` exemption, tracked as `tsk-52p`). After independently confirming
the real git-level merge had already landed correctly on main (commit
`8897162a`, verified: `resolveExecutorEnv` export and env-field validation
both present and correct on main), the item's status was corrected
`blocked → delivered` via a direct `fgos move`, under explicit user
authorization to bypass the buggy check given the merge was independently
verified sound. `tsk-gb3` is the origin point for that standing
authorization pattern that later items (including `tsk-2ewi`) also relied
on.
