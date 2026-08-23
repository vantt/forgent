# Iron Law evidence: tsk-j7y

`classifyIronLaw({ filesChanged, description })` result, computed against
this item's real diff at `fgw/tsk-j7y` and its own event-log description
(command run from the main checkout, per fgos-coding-implement's own step 4):

```json
{"required":true,"matchedFlags":["delete"],"matchedModules":[]}
```

`matchedModules` is empty — this diff touches none of `MODULE_RULES`'s
self-modifying-capable paths (`src/runner/`, `src/evolve/`, `bin/fgos.mjs`,
etc.). `required:true` comes entirely from `matchedFlags`: the item's own
description text (quoting the original bug report's "drop and recreate the
FTS index") trips a `HEAVY_KEYWORDS` match on `delete` — the over-reporting
direction `iron-law.mjs`'s own header calls safe (D13).

Verify command (the item's own, locked at `fgos-coding-planning`/
`fgos-coding-validating`): `node --test test/state/tool-registry.test.mjs`

## Failing-test-first proof

**RED** — committed this session (commit `9324940`) before `probeTool` was
touched, run to confirm it actually failed before any implementation:

```
✔ probeTool on kind mcp/skill resolves by scanning scanTarget on disk, relative to repoRoot (0.229547ms)
✔ probeTool on kind mcp/skill with no scanTarget resolves "unknown" (0.095942ms)
✖ probeTool on kind mcp/skill resolves "stale" when scanTarget/meta.json lastCommit is behind repoRoot's current git HEAD, "present" when it matches (tsk-j7y) (27.506381ms)
...
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  'present' !== 'stale'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-j7y-LOB2OU/test/state/tool-registry.test.mjs:138:10)
...
ℹ tests 23
ℹ pass 22
ℹ fail 1
```

**GREEN** — after implementing `probeTool`'s `lastCommit`-vs-`HEAD`
staleness check (`src/state/tool-registry.mjs`):

```
✔ probeTool on kind mcp/skill resolves by scanning scanTarget on disk, relative to repoRoot (0.544287ms)
✔ probeTool on kind mcp/skill with no scanTarget resolves "unknown" (0.119775ms)
✔ probeTool on kind mcp/skill resolves "stale" when scanTarget/meta.json lastCommit is behind repoRoot's current git HEAD, "present" when it matches (tsk-j7y) (31.895853ms)
...
ℹ tests 23
ℹ pass 23
ℹ fail 0
```

Full-suite regression run (`npm test`, broader than the item's own locked
verify, since this diff touches a locked function with real callers outside
its own module — `bin/fgos.mjs`'s `tool check`, per plan.md's caller trace):
`tests 2410, pass 2405, fail 0, skipped 5, duration_ms 182007`.
