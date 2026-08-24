# RESEARCH — glm OpenRouter executor (tsk-gb3)

## Round 1 — 2026-08-24 (discovery stage, called from fgos-coding-discovering)

**Asked:** (a) does the Claude Code CLI support routing to a non-Anthropic
backend via env vars, and which ones; (b) the exact OpenRouter model id for
"GLM 5.2" (zai/z-ai); (c) does fgOS's own runner config already support a
per-executor env override at spawn time.

**Checked:**

- Repo search first (`rg -n "ANTHROPIC_BASE_URL|ANTHROPIC_AUTH_TOKEN|ANTHROPIC_API_KEY|ANTHROPIC_MODEL|CLAUDE_CODE_USE" src docs bin`)
  — no hits in fgOS's own source/docs. Not a repo-known pattern yet.
- `src/runner/dispatch/config.mjs` (`validateExecutorShape`,
  `validateExecutorEntryShape`, full file read) — the executor-block shape
  is `{command, args, adapter?}` at the global level and `{kind, command?,
  args?, model?, allowCrossProvider?, agentType?, forceCliSpawn?,
  invocations?, for?, carries?, providerModel?, rigorOverrides?}` per
  `executors.<id>` entry. **No `env` field exists anywhere in this
  vocabulary.**
- `src/runner/dispatch/transport.mjs` (`cliSpawnAdapter`, full file read) —
  the only place a child is actually spawned. Line ~261-267:
  `spawn(command, args, {cwd, shell:false, stdio:[...], detached:true,
  env:{...process.env, [DISPATCH_DEPTH_ENV]: String(depth+1)}})`. Every
  executor's child inherits this session's full `process.env` verbatim,
  plus one depth counter — **confirmed: no per-executor env override
  exists today**, at either the config-shape or the spawn-call layer.
- `.fgos/config.json` (`runner.executors`) — read the live committed
  registry. `claude`/`agy`/`codex`/`pi` are all registered; none declares
  an `env` key (consistent with the schema finding above — the field
  literally isn't validated/read anywhere yet).
- `src/setup/registrations.mjs:1379-1443` — only `pi` is registered as a
  DEFAULT-template executor (`PI_EXECUTOR_DEFAULT`, layered onto the
  shared `runner` config-default, tsk-47r). `agy`/`codex` are NOT
  registered there — both live only in this project's own committed
  `.fgos/config.json`, hand-authored. Two real precedents exist for "how
  does a new executor get added"; `agy`/`codex`'s simpler one (committed
  config only, no `registrations.mjs` touch) is the closer match for
  `glm` — a single-project executor, not a template every fresh `fgos
  setup` should bootstrap.
- WebSearch, "Claude Code CLI ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN
  environment variable custom model provider" — Claude Code CLI honors
  `ANTHROPIC_BASE_URL` (overrides every request's target host, including
  its own agentic sub-loops), `ANTHROPIC_AUTH_TOKEN` (literal Bearer
  token for a custom endpoint, distinct from `ANTHROPIC_API_KEY` which is
  for real Anthropic auth), and `ANTHROPIC_MODEL` (model name substituted
  into every request). Multiple independent sources (Requesty docs,
  vLLM docs, imfing.com, claude-codex.fr) describe the same three-var
  pattern for pointing Claude Code at OpenRouter/other gateways. Sources:
  [Claude Code Environment Variables — Requesty](https://docs.requesty.ai/integrations/claude-code),
  [Claude Code — vLLM docs](https://docs.vllm.ai/en/stable/serving/integrations/claude_code/),
  [Use custom LLM providers in Claude Code — Xin Fu](https://imfing.com/til/use-custom-llm-providers-in-claude-code/).
- WebSearch, "OpenRouter Claude Code ANTHROPIC_BASE_URL openrouter.ai/api/v1
  ANTHROPIC_MODEL setup" — confirms the exact values: `ANTHROPIC_BASE_URL=
  https://openrouter.ai/api` (OpenRouter's Anthropic-Messages-API-
  compatible endpoint — distinct from its OpenAI-compatible
  `/api/v1`), `ANTHROPIC_AUTH_TOKEN=<OpenRouter API key>`,
  `ANTHROPIC_MODEL=<model id>`, and `ANTHROPIC_API_KEY` should be left
  unset/blank to avoid the CLI preferring a cached real-Anthropic login
  over the override (also: `/logout` once if this CLI was ever logged
  into a real Anthropic account, or the cached session can shadow the env
  vars). Source: [Claude Code + OpenRouter: The Setup Guide That Actually Explains Things](https://medium.com/@shreshthg30/claude-code-openrouter-the-setup-guide-that-actually-explains-things-39c65f0581c6),
  corroborated by [andrewbaker.ninja's ANTHROPIC_BASE_URL guide](https://andrewbaker.ninja/2026/08/10/how-to-run-claude-code-on-openrouter-with-alternative-models-like-deepseek-the-anthropic_base_url-guide/).
- WebSearch + WebFetch (`openrouter.ai/z-ai`), "GLM 5.2 z-ai openrouter
  model" — OpenRouter lists a real, live model `z-ai/glm-5.2` ("Large-
  scale reasoning model", 1.05M context, $0.336/$1.056 per M input/output
  tokens, high/xhigh reasoning effort supported), plus `z-ai/glm-5.2:free`
  and `z-ai/glm-5.2:batch` variants. This matches the user's "GLM 5.2"
  literally — not a guess/nearest-neighbor substitution. Sources:
  [GLM 5.2 — OpenRouter](https://openrouter.ai/z-ai/glm-5.2),
  [Z.ai | OpenRouter](https://openrouter.ai/z-ai).

**Found — answers:**

1. **(a) Mechanism, clear:** Claude Code CLI's `ANTHROPIC_BASE_URL` +
   `ANTHROPIC_AUTH_TOKEN` + `ANTHROPIC_MODEL` triple is a real, documented,
   widely-used pattern (OpenRouter explicitly serves an Anthropic-
   compatible endpoint at `/api` for exactly this use case) — this is not
   a hypothetical integration.
2. **(b) Model id, clear:** `z-ai/glm-5.2` is the real OpenRouter model id
   for "GLM 5.2".
3. **(c) fgOS gap, clear:** confirmed real and precisely scoped — neither
   `dispatch/config.mjs`'s executor-entry shape nor
   `dispatch/transport.mjs`'s `cliSpawnAdapter` spawn call has any
   per-executor env override today. This is the actual code work the item
   needs: add an optional `env` (object, string→string) field to the
   `executors.<id>` shape (validated in `validateExecutorEntryShape`),
   thread it through `resolveExecutorCommand`/`resolveExecutorConfig` into
   `cliSpawnAdapter`'s spawn call as `env: {...process.env, ...invocation.env,
   [DISPATCH_DEPTH_ENV]: ...}` (executor's own env layered OVER
   `process.env`, so it can override `ANTHROPIC_BASE_URL`/
   `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_MODEL` without touching any other
   executor's spawn, since `env` stays absent/unused for every existing
   entry — byte-identical behavior for `claude`/`agy`/`codex`/`pi`).
4. **Registration precedent, clear:** follow `agy`/`codex` (committed
   `.fgos/config.json` only) rather than `pi` (also registered as a
   setup-default template) — `glm` is a single-project executor addition,
   not a fresh-install default every `fgos setup` should bootstrap.
5. **Secret storage:** no existing repo convention for a per-executor
   secret was found (not a gap in this item's own reasoning — no prior
   executor has ever needed a real secret; `agy`/`codex`/`pi` all rely on
   their own external CLI's own credential store, e.g. `~/.pi/agent/
   auth.json`, never fgOS's own config). The env-var-name-only-in-config,
   real-value-outside-git pattern is a direct, mechanical application of
   this repo's own `development-rules.md` ("never commit secrets") and
   `dispatch/config.mjs`'s own TRUSTED-CONFIG note (the committed config
   is executable/reviewable, so a raw secret in it would be committed and
   reviewable too) — no product judgment call needed here, so this stays
   `clear` rather than becoming a `question` for a person.

**Still open (not blocking `clear` — resolved at planning/executing):**
exact shell-profile-vs-untracked-file choice for where the real
`OPENROUTER_API_KEY` value lives on this machine, and the exact new test
cases `test/runner/dispatch.test.mjs` needs for the new `env` field —
implementation detail, not a product ambiguity.

**Verdict: clear.**

Verify (real, runnable — existing test file covering
`dispatch/config.mjs`+`dispatch/transport.mjs`; executing stage adds new
cases to this same file for the `env` field):

```bash
npm test -- test/runner/dispatch.test.mjs
```
