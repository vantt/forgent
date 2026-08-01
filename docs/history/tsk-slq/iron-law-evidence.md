# Iron Law evidence: tsk-slq

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff returned `required: true` — `matchedModules: []` (no self-modifying
module touched; every file this item adds is net-new), `matchedFlags:
["auth", "schema"]` (description keyword match, not a files-changed
match).

```json
{
  "required": true,
  "matchedFlags": ["auth", "schema"],
  "matchedModules": []
}
```

Context on the two matched flags (both are description-text substring
matches against `HEAVY_KEYWORDS`, not evidence of an auth/schema *system*
being touched): `"auth"` matched inside the word "**auth**oring" in the
item's own scope point 3 ("migrating/**auth**oring the first agent
definition(s)") — a false-positive substring hit, not an authentication
concern. `"schema"` matched for real: scope point 5's "silently-diverging
**schema**s that happen to share a name" — this item genuinely adds a new
schema (`.fgos/agents/<name>.yaml`), so this flag is a legitimate hit.
Either way, the gate is satisfied by the same failing-test-first proof
below, and D1 (`docs/history/agent-executor-agent-definitions/CONTEXT.md`)
already carries the real security-boundary reasoning for the schema this
item introduces.

## Failing-test-first proof

Test command: `node --test test/scripts/project-agents.test.mjs` (part of
`npm test`).

**Before the fix** — `scripts/project-agents.mjs`'s `validateDefinition`
rejected a `tool-scope` list only when it contained a non-string/empty
entry, not when the list itself was empty (`.some()` on an empty array is
trivially `false`). An agent definition with `tool-scope: []` — no
declared tools — passed validation silently, meaning the generated
`.claude/agents/<name>.md` would carry an empty `tools:` frontmatter line
instead of failing loud, defeating the least-privilege intent D1 exists
for. Real transcript:

```
✖ an empty tool-scope is refused -- an agent-type with no declared tools is a config error, not an implicit deny-all (1.704473ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception (AgentDefinitionError).
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-slq-hWd2Vs/test/scripts/project-agents.test.mjs:68:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:911:18)
      at Test.postRun (node:internal/test_runner/test:1465:19)
      at Test.run (node:internal/test_runner/test:1390:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'throws',
    diff: 'simple'
  }
ℹ tests 8
ℹ pass 7
ℹ fail 1
```

**After the fix** — `validateDefinition`'s tool-scope check gained an
explicit `.length === 0` branch:

```diff
- if (!Array.isArray(def['tool-scope']) || def['tool-scope'].some((t) => typeof t !== 'string' || !t.trim())) {
+ if (!Array.isArray(def['tool-scope']) || def['tool-scope'].length === 0 || def['tool-scope'].some((t) => typeof t !== 'string' || !t.trim())) {
```

Same test file, real transcript:

```
✔ an empty tool-scope is refused -- an agent-type with no declared tools is a config error, not an implicit deny-all (1.592196ms)
ℹ tests 8
ℹ pass 8
ℹ fail 0
```

Full suite after the fix (`npm test`, the item's own recorded `verify`
command run in full): **1988 tests, 1983 pass, 0 fail, 0 cancelled, 5
skip** (the 5 skips pre-exist this item, unrelated).

## Why this counts as the Iron Law's proof even though `matchedModules` is empty

Every file this item touches is net-new (`.fgos/agents/fgos-placeholder.yaml`,
`.claude/agents/fgos-placeholder.md`, `scripts/project-agents.mjs`,
`test/scripts/project-agents.test.mjs`) except `.gitignore` and
`package.json`/`package-lock.json` (dependency addition, D4) — none of
those are on `MODULE_RULES`' self-modifying-capable list. The proof above
is the real failing-test-first evidence for the one genuine bug this
item's own build caught in itself before it shipped, which is what the
Iron Law asks for regardless of which flag triggered `required: true`.
