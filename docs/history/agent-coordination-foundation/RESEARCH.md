# Agent-coordination foundation — research log

Accumulating log, per `fgos-researching`'s own contract: append a new dated
round, never overwrite an earlier one.

## Round 1 — 2026-09-09

**Asked:** Does the resolver already support a capability resolving to a
non-agent (MCP/tool) provider, and what does the existing catalog/config
already look like, before writing a new shared capability catalog and
adding P2-runtime capability slots?

**Checked (repo search first, per the two-branch rule):**

- `core/skills/_shared/executor-dispatch-fallback.md` — existing dispatch
  activation prose; no reference to a shared planning fragment or a
  capability catalog file before this round.
- `core/skills/fgos-capability-dispatching/SKILL.md` — existing small
  inline catalog (`code:implement`, `advise`, `execute`), coding-scoped
  description.
- `docs/history/capability-aware-dispatch-activation/{CONTEXT,plan}.md` —
  the prior item that shipped `code:implement`; its own scout evidence
  confirmed `src/runner/dispatch/resolve.mjs` needed no resolver change
  for a new canonical capability key, and its validation constraints (no
  invented names, one `decide --for` per unit) still hold.
- `src/setup/registrations.mjs:1663-1676` — `DEFAULT_CAPABILITY_SLOTS`
  only declared `advise`/`execute`/`code:implement`, each with only a
  `description` (never `prefer`/`overrides` — deliberate, per the
  in-file comment: "naming which executor serves a purpose is a
  dispatch-mechanism decision").
- `src/runner/dispatch/config.mjs:353` — `EXECUTOR_KINDS = Object.freeze(['agent', 'tool'])`;
  `config.mjs:419` — `INVOCATION_VIA = Object.freeze(['cli', 'task', 'mcp', 'api'])`.
  Confirms the resolver's executor shape already distinguishes
  agent-shaped executors from tool/MCP providers.
- Live `.fgos/config.json` (main checkout, read-only) —
  `runner.capabilities.impact-analysis.prefer = "gitnexus"`;
  `runner.executors.gitnexus = { kind: "tool", invocations: [{ via: "mcp", tools: { "impact-analysis": "mcp__gitnexus__impact" } }] }`.
  A real, already-live example of a capability resolving to a non-agent
  provider.
- `src/runner/dispatch/resolve.mjs:282-311` (`resolveExecutorAndOverrides`)
  — plain lookup by `executors[id]` or `capabilities[purpose].prefer`;
  never branches on `executor.kind`. `src/runner/dispatch/mechanism.mjs:82-96`
  (`decideExecutorDispatchMechanism`) — `hasNativeMechanism` is exactly
  `executor.kind === 'agent'`; a `kind: "tool"` executor with a `via:
  "mcp"` invocation is not cli-spawn-shaped, so it is NOT forced
  out-of-process the way a `kind: "agent"` cli-spawn executor is.
  `src/runner/dispatch/plan.mjs` (`compileDispatchPlan`, ~line 175-195) —
  the "mcp-handback" branch: when the resolved mechanism is
  `out-of-process` and the executor has an `invocations[].via === "mcp"`
  entry whose `tools[purpose]` matches, the plan flips to `mechanism:
  "in-process"` and returns `mcpTool`, so a caller with an MCP client can
  call the tool directly instead of spawning a subprocess.
- `test/setup/checks.test.mjs`/`checks-doctor-config.test.mjs` — the
  `advise-execute-capabilities-configured` doctor check hardcoded the
  3-name list (`['advise', 'execute', 'code:implement']`); no test
  exercised `decide --for` end-to-end against a tool/MCP-shaped executor.

**Found:** the resolver already treats capability resolution as
provider-agnostic (agent vs. tool, cli vs. mcp) — no resolver change is
needed to document or prove "capability may route to a tool/MCP
provider" (P2-foundation's requirement). What was missing was (1) a
shared, cross-referenced doc surface stating this plainly next to the
existing dispatch fragment, (2) the P2-runtime `code:review`/`code:test`/
`code:debug`/`code:refactor` slots, and (3) a test proving the mcp-handback
path with a synthetic tool-kind executor (mirroring the real
`impact-analysis` → `gitnexus` mapping) rather than only asserting the
enum exists.

**Verdict:** `{clear: true, verify: "node --test test/setup/capability-catalog-doctrine.test.mjs && node --test test/setup/checks.test.mjs test/setup/checks-doctor-config.test.mjs"}`
