# Plan — glm OpenRouter executor (tsk-gb3)

Mode: high-risk

Lane decided directly (this item's discovery verdict was `clear`, so it
skipped `exploring` and there is no `fgos-routing` Orient prose to read —
per `fgos-coding-planning`'s own direct-entry fallback, the Mode gate is
applied here instead of re-derived elsewhere). Flag count: 2 hard-gate
flags — **audit/security** (this touches the process-spawn env for every
headless executor and introduces the repo's first executor-scoped secret)
and **external systems** (adds OpenRouter as a live external provider).
Either hard-gate flag alone forces `high-risk` regardless of total count
(`fgos-routing`'s Mode gate table), so this stays `high-risk` even though
the blast radius itself (see Approach) turned out narrow.

## Approach

**Chosen path.** Give an executor its own env at spawn time, additive and
opt-in, so every existing executor (`claude`/`agy`/`codex`/`pi`) keeps its
current byte-identical spawn behavior:

1. `dispatch/config.mjs`: add an optional `env` field to the
   `executors.<id>` entry shape (`validateExecutorEntryShape`) — an
   object mapping `ENV_NAME -> string value`. Every key/value must be a
   non-empty string. This is the SAME layer `model`/`agentType`/
   `providerModel` already validate at, so it follows that precedent
   exactly rather than inventing a new validation shape.
2. `dispatch/transport.mjs`: `cliSpawnAdapter`'s spawn call changes from
   `env: {...process.env, [DISPATCH_DEPTH_ENV]: ...}` to
   `env: {...process.env, ...resolvedEnv, [DISPATCH_DEPTH_ENV]: ...}`,
   where `resolvedEnv` is the executor's own `env` block (when present)
   with every value passed through a **`${VAR_NAME}` substitution against
   `process.env` only** — never a shell. This is the one real design
   decision this plan makes: a committed config value like
   `"${GLM_OPENROUTER_API_KEY}"` resolves to
   `process.env.GLM_OPENROUTER_API_KEY` at spawn time, in plain JS string
   substitution, before the argv-only `spawn(..., {shell:false})` call —
   never through a shell, so this file's own SECURITY panel (argv array,
   `shell:false`, no shell metachar interpretation) stays intact. A
   literal value with no `${...}` token passes through unchanged (needed
   for the non-secret vars, `ANTHROPIC_BASE_URL`/`ANTHROPIC_MODEL`, which
   are fine to commit literally).
3. `.fgos/config.json`: register `executors.glm` — `kind: "agent"`,
   `command: "claude"`, same `args` shape the `claude` entry already
   uses, plus:

   ```json
   "env": {
     "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
     "ANTHROPIC_AUTH_TOKEN": "${GLM_OPENROUTER_API_KEY}",
     "ANTHROPIC_MODEL": "z-ai/glm-5.2",
     "ANTHROPIC_API_KEY": ""
   }
   ```

   `ANTHROPIC_API_KEY: ""` deliberately blanks any cached real-Anthropic
   key/login for this one child process only (RESEARCH.md Round 1 —
   guides otherwise warn a stale cached login can shadow the override).
   Follows the `agy`/`codex` precedent (committed `.fgos/config.json`
   only, no `registrations.mjs` default-template entry) — `glm` is a
   single-project executor addition, not a fresh-install default (see
   RESEARCH.md Round 1, finding 4).
4. The real secret value never enters this repo. `GLM_OPENROUTER_API_KEY`
   is exported in the operator's own shell profile (or an untracked,
   gitignored env file this session already avoids reading into any
   committed output) — outside every git-tracked path. Only the env-var
   NAME is committed, in `.fgos/config.json`.

**Alternatives rejected:**

- *Global env passthrough, no per-executor field* — rejected: every
  executor already inherits `process.env` wholesale
  (`transport.mjs:266`), so setting `ANTHROPIC_AUTH_TOKEN` globally in
  the shell would silently redirect the default `claude` executor's real
  Anthropic calls to OpenRouter too — the item's own explicit
  requirement ("without affecting the default 'claude' executor") rules
  this out.
- *Wrapper command (`command: "env", args: ["VAR=value", "claude", ...]`),
  no code change* — rejected: `spawn()` is already argv-based with
  `shell: false`, so this needs no shell either, but the secret VALUE
  would have to sit literally inside the committed `args` array (JSON
  config has no env-substitution mechanism of its own) — the exact
  "secret ends up in git" failure this item exists to avoid. A real
  `env` field with `${VAR}` substitution is what makes indirection to an
  uncommitted value possible at all.
- *Full shell-string env assignment (`ANTHROPIC_AUTH_TOKEN=$KEY claude
  ...` as one shell command)* — rejected outright: reintroduces exactly
  the shell-metachar risk `dispatch/transport.mjs`'s own header comment
  says the argv-array design exists to avoid.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `${VAR}` substitution logic | medium — a naive implementation could accidentally shell out or leak the resolved value into logs/errors | `fgos-coding-validating`: unit-test substitution directly (present var, absent var, no-token literal, empty-value literal) without ever spawning a real process; confirm no `console.log`/error message embeds a resolved secret value |
| Existing executors' spawn env | medium — a bug in the new merge line could change `claude`/`agy`/`codex`/`pi`'s existing env | `npm test -- test/runner/dispatch.test.mjs` (existing suite) must stay green unmodified for every case that predates this change; new cases are additive only |
| Secret never committed | high (this is the item's own stated hard requirement) | `git diff`/`git status` review before every commit in this branch — grep the exact literal key value pasted in the original submission is never present anywhere in the tracked tree; `.fgos/config.json`'s new `env` block contains only the var NAME, never a value that isn't `${...}` or a known-non-secret literal |
| OpenRouter model id correctness | low — already confirmed real (RESEARCH.md Round 1) | none needed beyond the citation already recorded |

**Impact-analysis posture:** `degraded`. `fgos tool query --capability
impact-analysis --status present` shows GitNexus registered and
`present`, but its only index covering this checkout
(`/home/vantt/projects/forgentX`) is **1797 commits behind HEAD** — too
stale to trust for blast radius here. Cross-checked directly instead:
`rg -n "cliSpawnAdapter|EXECUTOR_ADAPTERS\[|resolveExecutorConfig\(|validateExecutorEntryShape\(|validateExecutorShape\("
src/ bin/ --glob '*.mjs'` — every real call site of the functions this
plan touches lives inside `src/runner/dispatch/{config,transport,cli}.mjs`
alone (`cli.mjs`'s two `EXECUTOR_ADAPTERS[adapter]` call sites pass the
resolved `invocation` through opaquely, untouched by this change's
shape). One unrelated comment-only mention in
`src/runner/goal-check.mjs:47` (`// cliSpawnAdapter.`) — no code
coupling. Blast radius is confirmed narrow by direct evidence even though
the GitNexus proof point itself is weak.

**Files touched, in order:**

1. `src/runner/dispatch/config.mjs` — add `env` to
   `validateExecutorEntryShape`
2. `src/runner/dispatch/transport.mjs` — the `${VAR}` substitution helper
   + `cliSpawnAdapter`'s spawn `env` merge
3. `test/runner/dispatch.test.mjs` — new cases for both of the above
4. `.fgos/config.json` — register `executors.glm`
5. `CHANGELOG.md` — one line under `## [Unreleased]` (AGENTS.md's
   install/setup/doctor gate: this is a new, user-visible executor
   capability)
6. Outside the repo: export `GLM_OPENROUTER_API_KEY` in the operator's own
   shell profile — not a tracked file, not part of this branch's diff

## Shape

Single piece, not split — the whole change is ~4 files plus one
CHANGELOG line, one coherent capability (per-executor env override +
one registered executor using it), confirmed narrow blast radius above.
`high-risk` lane governs *how much scrutiny* this piece gets at
validating/executing, not whether it gets cut into several items.

Concrete cases to prove against (sized to `high-risk`, per
`references/approach-and-shape.md`):

- Existing executor (`claude`/`agy`/`codex`/`pi`, none of which declare
  `env`) spawns with byte-identical env to before this change.
- An executor `env` block with a `${VAR}` token where the named
  `process.env` var IS set → substituted correctly.
- An executor `env` block with a `${VAR}` token where the named
  `process.env` var is NOT set → defined behavior (empty string, or a
  clear validation/runtime error — decided at validating, not guessed
  here as an assertion).
- An executor `env` block with a literal value containing no `${...}`
  token → passed through unchanged.
- `validateExecutorEntryShape` rejects a malformed `env` (non-object,
  non-string value, empty string value) the same way it already rejects
  a malformed `model`/`agentType`.
- The `glm` entry itself: `command: "claude"`, so `CLAUDE_CLI_COMMANDS`
  cross-provider gating in `resolve.mjs` treats it as same-provider
  (`allowCrossProvider` not required) — worth a direct read/assertion at
  validating, since `agy`/`codex`/`pi` all needed `allowCrossProvider:
  true` for a *different* `command`, and `glm` deliberately keeps
  `command: "claude"` while still being a different real backend.

## Real gap found, deliberately out of scope

`resolve.mjs:322`'s cross-provider gate (`allowCrossProvider`) checks
`executor.command` against `CLAUDE_CLI_COMMANDS` only — it has no
awareness that an `env.ANTHROPIC_BASE_URL` override can send prompt
content to a real non-Claude backend even while `command` stays
`"claude"`. `glm` will pass this gate silently (command is `"claude"`),
even though its prompt content genuinely leaves to OpenRouter/Z.ai — the
exact thing the gate's own error message says it exists to catch. Fixing
the gate to also inspect `env.ANTHROPIC_BASE_URL` is a real, separate
change to shared governance logic that would affect how every future
executor is gated, not something this item's own scope covers (YAGNI —
this item's job is one new executor + the env field it needs, not a gate
redesign). Filed as its own follow-up item rather than silently worked
around or silently ignored — **tsk-2y7**. This plan still sets `glm`'s
`description` field honestly
("routes to OpenRouter/Z.ai, not real Anthropic") so a human reading
`.fgos/config.json` is not misled by the passing gate.

## Outstanding questions

None
