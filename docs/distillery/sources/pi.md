---
name: pi
type: git-repo
url: https://github.com/earendil-works/pi
local: upstreams/pi
last_analyzed_commit: e5dde9a
last_analyzed_date: 2026-08-18
domains_covered: [harness, skills, hooks, workflow, routing, integration-contract, context-memory, quality-gates, tooling, config-packaging, repo-layout, safety, ux, testing-evals, orchestration, planning, docs-style, self-improvement]
---

# pi — Feature Index

> Extracted from HEAD `e5dde9a` on 2026-08-18. Clone: `upstreams/pi` (monorepo; scope this round: `packages/coding-agent`). Round 1 covers `packages/coding-agent/docs/*.md` (30 files, curated feature docs), targeted reads of `AGENTS.md`/`README.md`, plus a full mechanical file-by-file inventory of `src/core/` (73 files) and `src/modes/` (55 files, incl. `interactive/`+`rpc/` subdirs) — every undocumented mechanism the inventory surfaced (cache-miss cost accounting, remote model-catalog merge, raw-stdout takeover, resumed-session-cwd guard, resource-provenance/collision tracking, the fuzzy-match edit engine, install-telemetry attribution headers) is folded in above under its taxonomy domain. `orchestration`, `planning`, `docs-style`, `self-improvement` intentionally left unpopulated — see Notable absences below, not a gap; nothing in the src/ inventory surfaced a distinct mechanism for them either. `src/cli/` (19 files), `src/client/` (3), `src/server/` (1), `src/bun/` (3), `src/utils/` (33), and `examples/extensions/*.ts` (78 sample extensions) were not inventoried this round — real backfill candidates, not urgent (docs already cover their documented surface: CLI flags, extension API, providers).

Pi is a minimal terminal coding harness (earendil-works / badlogicgames), TypeScript, npm-distributed as `@earendil-works/pi-coding-agent`. Deliberately small core; everything else is TypeScript extensions, Agent-Skills-standard skills, prompt templates, themes, and "pi packages" bundling all four.

## harness

### minimal-core-by-design
- **What:** Pi's core deliberately omits built-in MCP, sub-agents, permission popups, plan mode, to-dos, and background bash. Users build or install those as extensions/packages, or reach for external tools (containers, tmux).
- **Where:** `docs/usage.md` § Design Principles
- **Notable:** Stated as an explicit, named design stance rather than a missing-feature gap: "Pi keeps the core small and pushes workflow-specific behavior into extensions, skills, prompt templates, and packages." Rationale blog post linked from the same section.
- **Keywords:** minimal core, no built-in sub-agents, no plan mode, no MCP, no permission popups
- **Seen:** e5dde9a

### four-run-modes
- **What:** One binary, four modes: interactive (default TUI), print (`-p`, one-shot), `--mode json` (structured event stream), `--mode rpc` (stdin/stdout JSONL for process integration). Same agent core underneath all four (`AgentSessionRuntime`/`AgentSession`).
- **Where:** `docs/usage.md` § Modes, `docs/rpc.md`, `docs/json.md`, `docs/sdk.md` § Run Modes (`InteractiveMode`, `runPrintMode`, `runRpcMode`)
- **Notable:** The SDK docs show all three non-interactive modes are thin wrappers over the same `createAgentSessionRuntime()` factory — the mode boundary is a presentation layer, not a different agent implementation.
- **Keywords:** interactive, print mode, json mode, rpc mode, AgentSessionRuntime
- **Seen:** e5dde9a

### built-in-tool-set
- **What:** Four default tools (`read`, `write`, `edit`, `bash`) plus three opt-in read-only tools (`grep`, `find`, `ls`). Flags: `--tools`/`-t` (strict allowlist), `--exclude-tools`/`-xt` (filter), `--no-builtin-tools`/`-nbt` (drop built-ins, keep extension/SDK tools), `--no-tools`/`-nt` (drop everything). `defaultTools` in settings.json controls the startup set; an empty array starts with zero built-ins while preserving extension/SDK tools.
- **Where:** `docs/quickstart.md`, `docs/usage.md` § Tool Options, `docs/settings.md` § Tools
- **Notable:** `--tools`/`-t` replaces the whole tool surface with a strict allowlist (extension + custom tools included), which is a different axis from `--no-builtin-tools` (drops only the four defaults). Read-only mode is a documented recipe: `pi --tools read,grep,find,ls -p "Review the code"`.
- **Keywords:** built-in tools, tool allowlist, read-only mode, defaultTools
- **Seen:** e5dde9a

### context-files-agents-md
- **What:** Loads `AGENTS.md`/`CLAUDE.md` at startup from `~/.pi/agent/AGENTS.md` (global), then walking parent directories to cwd. `AGENTS.override.md` in a directory replaces (not appends to) `AGENTS.md`/`CLAUDE.md` from THAT directory only — context files from other directories in the walk still layer normally. Disable with `--no-context-files`/`-nc`. `SYSTEM.md`/`APPEND_SYSTEM.md` (project `.pi/` or global `~/.pi/agent/`) replace/append to the whole default system prompt, a level above context files.
- **Where:** `docs/quickstart.md`, `docs/usage.md` § Context Files, § System Prompt Files
- **Notable:** The override semantics are per-directory, not global — a project can silence its own `AGENTS.md` with an override while still inheriting ancestor directories' `AGENTS.md` files untouched.
- **Keywords:** AGENTS.md, CLAUDE.md, AGENTS.override.md, SYSTEM.md, APPEND_SYSTEM.md
- **Seen:** e5dde9a

## skills

### agent-skills-standard-lenient
- **What:** Implements the community Agent Skills standard (agentskills.io) but relaxes one rule: skill `name` frontmatter does not need to match its parent directory name. Most other spec violations (name length/charset, description length) warn but still load.
- **Where:** `docs/skills.md` (top note + § Validation, § Name Rules)
- **Notable:** The relaxation is explicitly justified as serving shared skill directories used across multiple agent harnesses (pi loads `~/.claude/skills`, `~/.codex/skills` directly via settings) — strict standard compliance would break that cross-tool reuse case.
- **Keywords:** Agent Skills standard, SKILL.md, cross-harness skill reuse
- **Seen:** e5dde9a

### skill-locations-and-discovery
- **What:** Skills load from global (`~/.pi/agent/skills/`, `~/.agents/skills/`), project (`.pi/skills/`, `.agents/skills/` walking up to git root — only after project trust), packages, settings array, and `--skill <path>` CLI (repeatable, additive even with `--no-skills`). Discovery rules differ per location: root `.md` files with valid frontmatter count as skills in `~/.pi/agent/skills/`/`.pi/skills/`, but are ignored (only nested `SKILL.md` folders count) in `~/.agents/skills/`/project `.agents/skills/`.
- **Where:** `docs/skills.md` § Locations
- **Notable:** Explicitly supports pulling in Claude Code or OpenAI Codex skill directories unmodified via settings.json (`"skills": ["~/.claude/skills", "~/.codex/skills"]`), rather than requiring format conversion.
- **Keywords:** skill discovery, .agents/skills, --skill flag, cross-tool skills
- **Seen:** e5dde9a

### skill-slash-commands
- **What:** Every loaded skill auto-registers as `/skill:name`; trailing args after the command are appended to skill content as `User: <args>`. Toggle with `enableSkillCommands` (default true).
- **Where:** `docs/skills.md` § Skill Commands, `docs/usage.md` § Slash Commands
- **Keywords:** /skill:name, enableSkillCommands
- **Seen:** e5dde9a

## hooks

### extension-event-lifecycle
- **What:** A large, precisely-ordered event bus covering the whole session lifecycle: startup (`project_trust`, `session_start`, `resources_discover`), input processing (`input` → skill/template expansion → `before_agent_start` → `agent_start`), per-turn (`turn_start`, `context`, `before_provider_headers`, `before_provider_request`, `after_provider_response`, tool lifecycle, `turn_end`), completion (`agent_end`, `agent_settled`), and session-management events (`session_before_switch`/`fork`/`compact`/`tree`, each paired with a completion or failure event). The doc includes a full ASCII lifecycle diagram as the canonical ordering reference.
- **Where:** `docs/extensions.md` § Events § Lifecycle Overview (full event catalog follows, ~800 lines)
- **Notable:** `agent_end` vs `agent_settled` is a deliberately separated pair — `agent_end` fires per low-level run but Pi may still auto-retry/auto-compact-and-retry/continue with queued follow-ups, so status integrations that need "truly done" must use `agent_settled` instead, checked via `ctx.isIdle()`.
- **Keywords:** extension events, pi.on, lifecycle diagram, agent_settled vs agent_end
- **Seen:** e5dde9a

### tool-call-mutation-and-blocking
- **What:** The `tool_call` event fires after preflight, before execution, and can mutate `event.input` in place (later handlers see earlier mutations, no re-validation after mutation) or block execution via `{ block: true, reason?, terminate? }`. `terminate` only takes effect when every finalized result in the same tool-call batch is also terminating (parallel-tool-safe).
- **Where:** `docs/extensions.md` § tool_call, `isToolCallEventType` helper
- **Notable:** In default parallel-tool-execution mode, sibling tool calls from the same assistant message are preflighted sequentially then executed concurrently — `tool_call` is explicitly NOT guaranteed to see sibling tool results from the same message, a documented ordering gotcha for extension authors.
- **Keywords:** tool_call, block, terminate, parallel tool execution, isToolCallEventType
- **Seen:** e5dde9a

### tool-result-middleware-chain
- **What:** `tool_result` fires after execution, before `tool_execution_end`/final message events. Handlers chain like middleware in extension load order, each seeing the previous handler's patched result, and can return partial patches (`content`/`details`/`isError`/`usage`) — omitted fields keep current values.
- **Where:** `docs/extensions.md` § tool_result
- **Keywords:** tool_result, middleware chain, partial patch
- **Seen:** e5dde9a

### provider-request-response-hooks
- **What:** Three hooks give extensions raw access to the HTTP layer around each provider call: `before_provider_headers` (mutate outgoing headers in place, string=set/`null`=delete, runs once per request even across retries), `before_provider_request` (inspect or fully replace the built-in provider-specific payload right before send), `after_provider_response` (status + normalized headers, before the stream body is consumed).
- **Where:** `docs/extensions.md` § before_provider_headers/request, § after_provider_response
- **Notable:** `before_provider_request` payload rewrites (e.g. stripping/rewriting provider-level system instructions) are explicitly NOT reflected by `ctx.getSystemPrompt()`, which only reports pi's own system-prompt string — a documented gap between "pi's system prompt" and "what actually left the wire."
- **Keywords:** before_provider_headers, before_provider_request, after_provider_response, gateway tracing
- **Seen:** e5dde9a

### message-end-can-replace-message
- **What:** `message_end` handlers can return `{ message }` to replace the finalized message (role must be preserved) — used e.g. to overwrite reported cost/usage, or to normalize a provider's overflow error message so pi's context-overflow auto-recovery recognizes it (see custom-provider docs).
- **Where:** `docs/extensions.md` § message_start/update/end, `docs/custom-provider.md` § Context Overflow Errors
- **Keywords:** message_end, message replacement, overflow error normalization
- **Seen:** e5dde9a

### markdown-transformer-chain
- **What:** `pi.registerMarkdownTransformer()` registers a synchronous, display-only Markdown rewrite pipeline applied to user/assistant/thinking text before pi's built-in renderer runs. Transformers chain in load order, each receiving the previous one's output plus `{messageType, isStreaming, availableWidth}`. A throwing transformer is skipped (Pi keeps prior output and continues the chain) rather than failing the render.
- **Where:** `docs/extensions.md` § pi.registerMarkdownTransformer
- **Notable:** Explicitly display-only — the transformed text never touches the session file or the model context, only what's rendered in the TUI.
- **Keywords:** registerMarkdownTransformer, display-only transform, streaming-safe
- **Seen:** e5dde9a

### user-bash-interception
- **What:** `user_bash` fires on `!`/`!!` user shell commands and can fully replace execution: provide alternate `operations` (e.g. route through SSH), wrap the built-in local backend via `createLocalBashOperations()`, or return a `result` directly and skip execution entirely.
- **Where:** `docs/extensions.md` § user_bash
- **Keywords:** user_bash, createLocalBashOperations, remote bash routing
- **Seen:** e5dde9a

### input-event-processing-order
- **What:** Fixed pipeline for every user submission: (1) extension slash commands checked first — if matched, `input` event is skipped entirely; (2) `input` event fires and can `transform`/`handled`/`continue`; (3) if not handled, `/skill:name` expands; (4) if not handled, `/template` expands; (5) `before_agent_start` etc. begin. `event.source` distinguishes `"interactive"`/`"rpc"`/`"extension"` origin, and `event.streamingBehavior` tells the handler whether this is a mid-stream steer/followUp or an idle submission.
- **Where:** `docs/extensions.md` § input
- **Keywords:** input event, transform/handled/continue, processing order
- **Seen:** e5dde9a

## workflow

### prompt-templates-with-arg-substitution
- **What:** Markdown files under `~/.pi/agent/prompts/`/`.pi/prompts/` become `/filename` slash commands. Support positional args (`$1`, `$2`, `$@`/`$ARGUMENTS`), bash-style defaults (`${1:-default}`, `${@:-default}`), and slicing (`${@:N}`, `${@:N:L}`). `argument-hint` frontmatter shows expected args in autocomplete with `<required>`/`[optional]` bracket convention.
- **Where:** `docs/prompt-templates.md`
- **Notable:** The default-value and slicing syntax is deliberately shell-familiar (`${1:-default}`) rather than inventing new template syntax — lowers the learning curve for anyone who already writes bash.
- **Keywords:** prompt templates, argument-hint, ${1:-default}, positional args
- **Seen:** e5dde9a

### message-queue-steer-vs-followup
- **What:** Two distinct queued-message channels while the agent is streaming: **steer** (Enter, or `ctx.compact`-adjacent `pi.sendMessage({deliverAs:"steer"})`) delivers after the CURRENT assistant turn's tool calls finish, before the next LLM call; **followUp** (Alt+Enter) waits until the agent has no more tool calls at all. Both have a `"one-at-a-time"` (default) or `"all"` delivery mode setting (`steeringMode`/`followUpMode`).
- **Where:** `docs/usage.md` § Message Queue, `docs/extensions.md` § pi.sendMessage, `docs/rpc.md` § steer/follow_up commands
- **Notable:** This is a two-tier interrupt/queue design, not a single "send while busy" queue — steer is for redirecting the CURRENT task, follow-up is for appending a NEXT task, and both are independently batchable ("all" mode) vs throttled ("one-at-a-time").
- **Keywords:** steering, follow-up, steeringMode, followUpMode, message queue
- **Seen:** e5dde9a

## routing

### model-cycling-and-scoped-models
- **What:** `--models "pattern,pattern"` / `enabledModels` setting define a minimatch-filtered subset of the full model catalogue for Ctrl+P cycling (`scopedModels`). Empty means "everything usable." Each scoped entry can pin a thinking level via pattern suffix (`anthropic/*:high`).
- **Where:** `docs/extensions.md` § ctx.scopedModels, `docs/usage.md` § Model Options
- **Keywords:** scoped models, --models flag, enabledModels, Ctrl+P cycling
- **Seen:** e5dde9a

### thinking-level-map-per-model
- **What:** `thinkingLevelMap` on a model config maps pi's abstract 7-level thinking scale (`off`/`minimal`/`low`/`medium`/`high`/`xhigh`/`max`) to provider-specific values, with `null` explicitly hiding a level the model doesn't support (maps may contain holes, e.g. supporting `high`+`max` but not `xhigh`). Omitted entirely = standard levels through `high` use the provider default mapping, and `xhigh`/`max` are unsupported.
- **Where:** `docs/models.md` § Thinking Level Map, `docs/custom-provider.md`
- **Notable:** Tri-state semantics (omitted / string / `null`) let a provider config precisely describe partial reasoning-level support rather than forcing an all-or-nothing flag.
- **Keywords:** thinkingLevelMap, reasoning levels, null-hides-level
- **Seen:** e5dde9a

### provider-composition-layering
- **What:** Model/provider configuration composes in layers: built-in catalog → extension `pi.registerProvider()` (queued during extension load, applied immediately after) → `models.json` overrides on top. `modelOverrides` patches individual built-in or extension-registered models without replacing the provider's whole list; providing `models` at provider level REPLACES the provider's whole model list (upsert-by-id merge only when merging into an already-built-in provider).
- **Where:** `docs/models.md` § Overriding Built-in Providers, § Per-model Overrides, `docs/custom-provider.md` § Quick Reference
- **Notable:** Two different merge semantics live side by side and are easy to confuse: provider-level `models` REPLACES the list; `modelOverrides` PATCHES individual entries. The doc calls this out explicitly with worked examples for both.
- **Keywords:** registerProvider, modelOverrides, provider composition, models.json layering
- **Seen:** e5dde9a

### config-value-resolution-syntax
- **What:** Every credential/header value across `models.json`, `auth.json`, and `pi.registerProvider()` shares one small resolution grammar: `!command` (leading bang) executes the whole value as a shell command and uses stdout (cached for process lifetime for auth.json, resolved at request time for models.json); `$ENV_VAR`/`${ENV_VAR}` interpolates; `$$` escapes a literal `$`; `$!` escapes a literal `!`; anything else is a literal.
- **Where:** `docs/models.md` § Value Resolution, `docs/providers.md` § Key Resolution, `src/core/resolve-config-value.ts` (`resolveConfigValue`, `clearConfigValueCache`)
- **Notable:** The doc explicitly flags that pi does NOT apply TTL/caching/failure-recovery to `!command` in models.json ("pi cannot infer the right one") — callers needing that must wrap their own script, a deliberate anti-magic stance.
- **Keywords:** !command, $ENV_VAR, credential resolution, op read, security find-generic-password
- **Seen:** e5dde9a

## integration-contract

### rpc-mode-jsonl-protocol
- **What:** `pi --mode rpc` speaks a strict-JSONL command/response/event protocol over stdin/stdout: LF-only record delimiter (explicitly warns that Node's `readline` is non-compliant because it also splits on U+2028/U+2029, which are valid inside JSON strings), optional `id` for request/response correlation, `success:true` response means "accepted/queued/handled" not "finished" (async completion streams as separate events).
- **Where:** `docs/rpc.md` § Framing, § Commands
- **Notable:** The explicit `readline`-incompatibility warning is the kind of "we got burned, here's the fix" note that only shows up after a real integration bug — a genuinely load-bearing framing detail most JSONL protocols leave implicit.
- **Keywords:** RPC mode, JSONL framing, LF-only, id correlation
- **Seen:** e5dde9a

### extension-ui-over-rpc-subprotocol
- **What:** Extension `ctx.ui` calls translate into a request/response sub-protocol layered on the base RPC stream: dialog methods (`select`/`confirm`/`input`/`editor`) emit `extension_ui_request` and block for a matching `extension_ui_response`; fire-and-forget methods (`notify`/`setStatus`/`setWidget`/`setTitle`/`set_editor_text`) emit but don't wait. A `timeout` field on a dialog request lets the agent auto-resolve with a default if the client never answers, so clients don't need their own timeout tracking.
- **Where:** `docs/rpc.md` § Extension UI Protocol
- **Notable:** In RPC mode `ctx.hasUI` is `true` (unlike print/json modes where it's `false`) precisely because this sub-protocol makes dialogs actually functional over the wire — `ctx.mode === "tui"` is the separate check for terminal-only features like `custom()`.
- **Keywords:** extension_ui_request, dialog vs fire-and-forget, ctx.hasUI vs ctx.mode
- **Seen:** e5dde9a

### sdk-layered-session-api
- **What:** Three API layers for embedding: `createAgentSession()` (single session, simplest), `createAgentSessionRuntime()`/`AgentSessionRuntime` (owns session REPLACEMENT — new/switch/fork/clone/import — rebuilding cwd-bound services each time), and the underlying `Agent`/`AgentState` (from `@earendil-works/pi-agent-core`) for raw LLM-loop state. The same runtime layer backs all three built-in non-interactive modes (`InteractiveMode`, `runPrintMode`, `runRpcMode`).
- **Where:** `docs/sdk.md` § createAgentSession, § createAgentSessionRuntime, § Agent and AgentState, § Run Modes
- **Notable:** "Session replacement lifecycle and footguns" is documented as its own named section (also mirrored in extensions.md) — captured old `pi`/`ctx` objects become stale and throw after a replacement; only the freshly-injected `withSession` callback's `ctx` is safe. This looks like a real bug class the maintainers hit and then wrote a dedicated warning for.
- **Keywords:** createAgentSession, AgentSessionRuntime, session replacement footguns, withSession
- **Seen:** e5dde9a

### json-event-stream-mode
- **What:** `--mode json` streams the same internal event set RPC mode emits (`AgentSessionEvent`) as JSON lines to stdout for a single one-shot prompt, with streaming `message_update` records intentionally stripped of cumulative `partial`/`message` snapshots to keep per-event size linear — consumers reconstruct live text/thinking/tool-call state by tracking `contentIndex`+`delta` themselves.
- **Where:** `docs/json.md`
- **Keywords:** --mode json, JsonAgentSessionEvent, delta-only streaming
- **Seen:** e5dde9a

## context-memory

### session-as-branching-tree
- **What:** Every session entry has `id`+`parentId`; the "leaf" is the current position. `/tree` navigates within the SAME file (no new file created) by moving the leaf pointer; `/fork` creates a NEW session file from a selected earlier user message (restoring that prompt into the editor); `/clone` duplicates the current active branch into a new file at the current position (no restore). A comparison table in the docs makes the three mechanisms' differences explicit (output file, view, typical use, whether a summary is offered).
- **Where:** `docs/sessions.md` § Branching with /tree, § /tree, /fork, and /clone
- **Notable:** Selecting a user/custom message in `/tree` moves the leaf to that message's PARENT and restores the text into the editor for re-submission (creating a new branch on submit); selecting a non-user entry moves the leaf directly to that entry with an empty editor to continue forward — two different selection semantics depending on entry role, spelled out explicitly.
- **Where:** `docs/sessions.md` § Selection Behavior
- **Keywords:** session tree, /tree /fork /clone, leaf pointer, branching
- **Seen:** e5dde9a

### compaction-turn-boundary-algorithm
- **What:** Auto-compaction triggers at `contextTokens > contextWindow - reserveTokens` (default reserve 16384). Walks backward from newest message accumulating token estimates until `keepRecentTokens` (default 20000) is reached — that's the cut point. Normally cuts at turn boundaries (a "turn" = one user message through all its assistant/tool responses); when a single turn exceeds the budget, it becomes a documented "split turn" where the cut lands mid-turn at an assistant message, and pi generates TWO summaries (history + turn-prefix) and merges them. Repeated compactions resume summarizing from the PREVIOUS compaction's kept boundary (`firstKeptEntryId`), not from the compaction entry itself, so nothing already-summarized gets re-summarized.
- **Where:** `docs/compaction.md` § How It Works, § Split Turns, § Cut Point Rules
- **Notable:** Cut points are restricted to user/assistant/BashExecution/custom messages — NEVER at a tool result, because a tool result must stay attached to its originating tool call. This is the kind of invariant that silently corrupts context if violated.
- **Keywords:** auto-compaction, split turn, cut point rules, firstKeptEntryId, reserveTokens/keepRecentTokens
- **Seen:** e5dde9a

### branch-summarization-separate-mechanism
- **What:** Distinct from compaction: fires on `/tree` navigation away from a branch, finds the deepest COMMON ANCESTOR of old and new leaf positions, walks entries from the old leaf back to that ancestor, and (if the user opts in) generates a summary attached at the new position — preserving context from an abandoned branch without replaying it. Same structured summary format and cumulative file-tracking mechanism as compaction, but a genuinely separate trigger and entry type (`BranchSummaryEntry` vs `CompactionEntry`).
- **Where:** `docs/compaction.md` § Branch Summarization, § Cumulative File Tracking
- **Keywords:** branch summarization, common ancestor, BranchSummaryEntry
- **Seen:** e5dde9a

### cumulative-file-tracking-across-summaries
- **What:** Both compaction and branch summarization extract file read/write operations from the messages being summarized AND from the previous compaction/branch-summary's own `details` payload, so `readFiles`/`modifiedFiles` accumulate across an arbitrary chain of compactions/nested branch summaries instead of resetting each time.
- **Where:** `docs/compaction.md` § Cumulative File Tracking
- **Keywords:** readFiles, modifiedFiles, cumulative tracking, CompactionDetails
- **Seen:** e5dde9a

### session-jsonl-tree-format
- **What:** Sessions persist as JSONL with a tree structure (`id`/`parentId` per entry, no separate branch files). Version 3 is current (v1 linear→v2 tree→v3 renamed `hookMessage`→`custom` role); older sessions auto-migrate on load. `buildContextEntries()`/`buildSessionContext()` walk the active leaf-to-root path, splice in the nearest `CompactionEntry` (using its `retainedTail` as a self-contained checkpoint when present, else `firstKeptEntryId`), and produce the exact message list sent to the LLM.
- **Where:** `docs/session-format.md` (full entry-type catalog, SessionManager API reference)
- **Notable:** `retainedTail` (materialized post-compaction messages embedded directly on the `CompactionEntry`) is a newer mechanism layered over the older `firstKeptEntryId`-pointer approach purely for backward compatibility with sessions written before it existed — the doc is explicit that this is a compat shim, not the preferred shape going forward.
- **Keywords:** JSONL session format, SessionManager, retainedTail, firstKeptEntryId, version migration
- **Seen:** e5dde9a

### prompt-cache-waste-accounting
- **What:** Undocumented mechanism (no docs/*.md coverage): `cache-stats.ts` detects prompt-cache MISSES across a session by comparing idle gaps between requests against a fixed cache TTL constant and against model changes, then computes the actual wasted tokens/cost each miss caused. Feeds `showCacheMissNotices` (`docs/settings.md`'s UI-only description of the setting — the accounting logic itself lives only in code).
- **Where:** `src/core/cache-stats.ts` (`computeCacheWaste`, `collectCacheMisses`, `detectCacheMiss`, `CACHE_TTL_MS`)
- **Notable:** This is real per-session cost forensics, not just a usage total — it explains WHY a request cost more (cache expired vs model switched) rather than just reporting that it did.
- **Keywords:** cache miss detection, CACHE_TTL_MS, cost forensics
- **Seen:** e5dde9a

### remote-model-catalog-merge
- **What:** Undocumented mechanism: `remote-catalog-provider.ts` periodically (4h interval, 4s fetch timeout) pulls a model catalog from `https://pi.dev` and merges it OVER the locally-bundled baseline catalog, overriding stale entries by `id` — this is how pi ships new model IDs/pricing between npm releases without requiring a reinstall. `model-catalog-refresh.ts` triggers this in the background for interactive sessions.
- **Where:** `src/core/remote-catalog-provider.ts` (`withRemoteCatalog`, `REMOTE_CATALOG_REFRESH_INTERVAL_MS`), `src/modes/interactive/model-catalog-refresh.ts`
- **Notable:** `PI_OFFLINE` (documented in `docs/environment-variables.md`) is what this mechanism respects, but the merge-by-id-over-bundled-baseline strategy itself is undocumented — worth knowing the local baseline is never treated as complete, only as a fallback floor.
- **Keywords:** remote catalog, pi.dev, offline fallback, id-based override merge
- **Seen:** e5dde9a

### install-telemetry-gated-attribution-headers
- **What:** Undocumented mechanism: when `PI_TELEMETRY`/`enableInstallTelemetry` is on, pi adds attribution HTTP headers identifying itself as the calling client to specific KNOWN aggregator hosts only (OpenRouter, NVIDIA NIM, Cloudflare AI Gateway, OpenCode) — not a blanket header on every provider request.
- **Where:** `src/core/provider-attribution.ts` (`mergeProviderAttributionHeaders`), `src/core/telemetry.ts` (`isInstallTelemetryEnabled`)
- **Notable:** Scoped to a hard-coded allowlist of aggregator hosts rather than every provider — attribution headers are treated as an aggregator-specific courtesy/analytics signal, not a universal client-identification stamp.
- **Keywords:** attribution headers, install telemetry, aggregator hosts, PI_TELEMETRY
- **Seen:** e5dde9a

### raw-stdout-takeover-with-backpressure
- **What:** Undocumented mechanism: `output-guard.ts` lets pi bypass the TUI/readline layer to write directly to raw `process.stdout`/`stderr`, with explicit backpressure-aware retry on `ENOBUFS`/`EAGAIN`/`EWOULDBLOCK` rather than assuming a synchronous write always succeeds.
- **Where:** `src/core/output-guard.ts` (`takeOverStdout`, `writeRawStdout`, `waitForRawStdoutBackpressure`, `flushRawStdout`)
- **Notable:** Named backpressure error codes handled explicitly rather than a generic try/catch — the kind of defensive detail that only appears after hitting a real large-output-write failure in production.
- **Keywords:** raw stdout takeover, backpressure retry, ENOBUFS/EAGAIN/EWOULDBLOCK
- **Seen:** e5dde9a

### resumed-session-missing-cwd-guard
- **What:** Undocumented mechanism: `session-cwd.ts` detects when a session being resumed/forked/imported has a stored working directory that no longer exists on disk (deleted, moved, or a different machine), and produces a dedicated error class plus a formatted prompt/error message instead of silently failing deeper in the resume path or resolving to the wrong cwd.
- **Where:** `src/core/session-cwd.ts` (`assertSessionCwdExists`, `MissingSessionCwdError`, `formatMissingSessionCwdPrompt`)
- **Keywords:** missing session cwd, resume guard, MissingSessionCwdError
- **Seen:** e5dde9a

### context-overflow-auto-recovery
- **What:** When a request errors with a context-window overflow, pi can automatically drop the failed assistant message, run compaction, and retry ONCE — but only if it recognizes the error as an overflow from `errorMessage` pattern matching. Custom/non-standard providers are expected to normalize their own overflow errors via a `message_end` handler that rewrites `errorMessage` to start with a phrase pi recognizes (the generic fallback `context_length_exceeded` is called out as the safest choice), scoped carefully to that provider so unrelated errors (e.g. rate limits) are never mis-triggered into a wasted compaction.
- **Where:** `docs/custom-provider.md` § Context Overflow Errors
- **Keywords:** context overflow recovery, message_end error rewrite, context_length_exceeded
- **Seen:** e5dde9a

## quality-gates

### file-mutation-queue-for-parallel-tools
- **What:** `withFileMutationQueue(absolutePath, fn)` serializes all read-modify-write operations against one resolved file path (built-in `edit`/`write` already participate) so that two tool calls racing on the same file in a parallel-tool-execution turn cannot silently drop one write. Symlinks are handled by canonicalizing existing files through `realpath()` before queuing (new files fall back to the resolved absolute path, since there's nothing to realpath yet).
- **Where:** `docs/extensions.md` § Custom Tools (file mutation queue section), `src/core/tools/file-mutation-queue.ts` (`withFileMutationQueue`, 61 lines total — a small, self-contained per-path async queue)
- **Notable:** The doc spells out the exact failure mode this prevents with a worked example (a custom tool and built-in `edit` both touching `foo.ts` in the same assistant turn, both reading stale content, last write wins silently) — evidence this was a real bug pi's own parallel-tool-execution default introduced, not a speculative safeguard.
- **Keywords:** withFileMutationQueue, parallel tool race, realpath canonicalization
- **Seen:** e5dde9a

### fuzzy-match-edit-engine
- **What:** The `edit` tool's underlying diff/patch engine (`edit-diff.ts`, 560 lines) does line-ending detection/normalization (CRLF/LF/BOM-aware) before attempting an exact match, then falls back to fuzzy text matching for the old/new replacement pair, applies edits while preserving unchanged lines byte-for-byte, and generates both a TUI-facing diff string and a standard unified patch (`details.patch`) for SDK consumers.
- **Where:** `src/core/tools/edit-diff.ts` (`fuzzyFindText`, `applyReplacementsPreservingUnchangedLines`, `generateUnifiedPatch`, `detectLineEnding`, `normalizeToLF`, `stripBom`)
- **Notable:** Two diff representations are generated from the same edit for two different audiences — a rendered/highlighted diff for the TUI and a real unified patch for programmatic consumers (`docs/sdk.md` § Tools notes `details.patch` explicitly) — rather than the SDK having to reverse-engineer a patch from the TUI-oriented diff string.
- **Keywords:** fuzzy text matching, line-ending normalization, unified patch, edit tool internals
- **Seen:** e5dde9a

## tooling

### custom-tool-registration
- **What:** `pi.registerTool()` defines LLM-callable tools with a `typebox` parameter schema, optional `promptSnippet` (one-liner in the system prompt's "Available tools") and `promptGuidelines` (tool-specific bullets appended flat to the "Guidelines" section — must self-name the tool since there's no grouping/prefix). `prepareArguments(args)` runs before schema validation as an optional compat shim so an OLDER resumed session's stored tool-call args (matching a prior schema version) can be reshaped to the current schema, without weakening the public schema itself.
- **Where:** `docs/extensions.md` § Custom Tools, § Tool Definition, § Argument preparation
- **Notable:** `promptGuidelines` bullets are flat with no automatic tool-name prefix — the doc explicitly warns against writing "Use this tool when..." because the model can't tell which tool "this" refers to once bullets from multiple tools are concatenated.
- **Keywords:** registerTool, promptSnippet, promptGuidelines, prepareArguments, StringEnum
- **Seen:** e5dde9a

### built-in-tool-override
- **What:** An extension registering a tool with the SAME NAME as a built-in (`read`/`bash`/`edit`/`write`/`grep`/`find`/`ls`) replaces it; interactive mode shows a warning when this happens. Rendering override is INDEPENDENT of execution override and resolved per-slot: an override that only defines `execute` (omitting `renderCall`/`renderResult`) still gets the built-in's syntax highlighting/diff rendering for free.
- **Where:** `docs/extensions.md` § Overriding Built-in Tools
- **Notable:** Per-slot renderer inheritance is what lets an extension wrap a built-in tool purely for logging/access-control without reimplementing its UI — a deliberate decoupling of "what runs" from "how it's shown."
- **Keywords:** tool override, per-slot renderer inheritance, renderCall/renderResult
- **Seen:** e5dde9a

### dynamic-tool-registration-at-runtime
- **What:** `pi.registerTool()` works both at extension-load time and AFTER startup (inside command handlers, event handlers) — newly registered tools are immediately callable by the LLM in the same session, no `/reload` needed. `pi.setActiveTools(names)` toggles which registered tools (built-in or dynamic) are currently enabled.
- **Where:** `docs/extensions.md` § pi.registerTool
- **Keywords:** dynamic tools, setActiveTools, no-reload-needed
- **Seen:** e5dde9a

## config-packaging

### pi-packages-three-source-types
- **What:** One install surface (`pi install <source>`) accepts npm (`npm:@scope/pkg@1.2.3`, pinned versions skipped by bulk updates), git (multiple URL shorthands, refs pinned to tags/commits, `pi update --extensions`/`--all` reconciles the CHECKOUT to the configured ref but never auto-advances it), and local paths (added to settings without copying, file=single extension / dir=package rules). `-l` writes to project settings instead of user settings; `-e`/`--extension` on any source type installs to a temp dir for that run only, without persisting.
- **Where:** `docs/packages.md` § Install and Manage, § Package Sources
- **Notable:** Git refs are described as "pinned, not auto-advancing" even under `pi update --all` — reconciliation only re-clones/re-checks-out to whatever ref settings.json ALREADY names; moving to a NEW ref is a separate explicit `pi install git:host/user/repo@new-ref` action. This is a deliberate no-surprise-upgrades stance for git packages.
- **Keywords:** pi install, npm/git/local packages, pinned refs, -l project-local
- **Seen:** e5dde9a

### pi-package-manifest-and-filtering
- **What:** A package declares resources via a `pi` key in `package.json` (or falls back to convention directories `extensions/`/`skills/`/`prompts/`/`themes/`) with glob + `!exclusion` support. Consumer-side settings.json can further FILTER what's loaded from an installed package via the object form (`{source, extensions: [...], skills: [], ...}`), where omitting a key loads everything of that type, `[]` loads none, `!pattern` excludes, and `+path`/`-path` force-include/exclude an exact path — filters only ever NARROW what the manifest already allows.
- **Where:** `docs/packages.md` § Creating a Pi Package, § Package Filtering
- **Notable:** Peer-dependency discipline is explicit and named: if a package imports pi's own bundled core packages (`pi-ai`, `pi-agent-core`, `pi-coding-agent`, `pi-tui`, `typebox`) it must list them as `peerDependencies` with `"*"` and NOT bundle them, but any OTHER pi package it depends on must be fully bundled (`dependencies` + `bundledDependencies`) since pi loads packages with separate module roots that never share modules across installs.
- **Where (implementation):** `src/core/package-manager.ts` (`DefaultPackageManager`, 2682 lines — resolve/install/update for npm/git/local sources); undocumented implementation detail — it falls back to reading `/proc/self/environ` on Linux when `process.env` is unexpectedly empty (a known Node/Electron/sandboxed-launcher edge case), so package installs still see the user's real environment variables in that situation.
- **Keywords:** pi manifest, package.json pi key, dependency bundling rules, peerDependencies, /proc/self/environ fallback
- **Seen:** e5dde9a

### resource-provenance-and-collision-tracking
- **What:** Undocumented mechanism: every loaded extension/skill/prompt/theme carries a `SourceInfo` (scope: user/project/temporary; origin: package/top-level; source string; base dir) attached at load time, and `resource-loader.ts` uses it to detect and report NAME COLLISIONS across sources (two skills named the same from different locations, etc.) as structured `ResourceDiagnostic`/`ResourceCollision` objects rather than silent overwrite.
- **Where:** `src/core/source-info.ts` (`createSourceInfo`, `SourceInfo`), `src/core/diagnostics.ts` (`ResourceCollision`, `ResourceDiagnostic`), `src/core/resource-loader.ts` (`DefaultResourceLoader`)
- **Notable:** `pi.getCommands()`'s documented `sourceInfo` field (`docs/extensions.md`) is the public-API surface of this same internal provenance system — the docs describe the OUTPUT shape but not that a whole collision-detection subsystem produces it.
- **Keywords:** SourceInfo, ResourceCollision, provenance tracking, name collision detection
- **Seen:** e5dde9a

### settings-project-global-merge
- **What:** Two settings.json files (`~/.pi/agent/settings.json` global, `.pi/settings.json` project) merge with project winning per-key, NESTED OBJECTS MERGED (not replaced wholesale) — e.g. project `{"compaction":{"reserveTokens":8192}}` over global `{"compaction":{"enabled":true,"reserveTokens":16384}}` yields `{"enabled":true,"reserveTokens":8192}`. Resource-path arrays (extensions/skills/prompts/themes) resolve relative to whichever settings FILE they appear in (global paths relative to `~/.pi/agent`, project paths relative to `.pi`).
- **Where:** `docs/settings.md` § Project Overrides, § Resources
- **Keywords:** settings merge, nested key merge, project overrides global
- **Seen:** e5dde9a

## repo-layout

### monorepo-package-boundaries
- **What:** `pi-mono` splits into `packages/ai` (LLM provider abstraction, streaming, cost calc), `packages/agent` (core agent loop + message types, provider-agnostic), `packages/tui` (terminal UI component library, no agent knowledge), `packages/coding-agent` (CLI, interactive mode, tools, sessions — the actual "pi" product). Each is independently importable (`@earendil-works/pi-ai`, `@earendil-works/pi-agent-core`, `@earendil-works/pi-tui`, `@earendil-works/pi-coding-agent`).
- **Where:** `docs/development.md` § Project Structure
- **Keywords:** pi-ai, pi-agent-core, pi-tui, pi-coding-agent, package boundaries
- **Seen:** e5dde9a

### fork-rebranding-config
- **What:** A fork can rename the product identity (CLI banner, config directory name, environment variable prefixes, bin name) via a single `piConfig: {name, configDir}` block in `package.json`, without touching source. `CONFIG_DIR_NAME` is exported for extension authors to reference instead of hardcoding `.pi`, so rebranded distributions stay compatible with third-party extensions.
- **Where:** `docs/development.md` § Forking / Rebranding, `docs/extensions.md` § ctx.cwd (CONFIG_DIR_NAME usage)
- **Notable:** This is a first-class, documented rebranding surface (not an unsupported hack) — the codebase and its extension ecosystem are both designed to route config-dir-name lookups through one exported constant specifically so forks stay drop-in compatible with the extension ecosystem.
- **Keywords:** piConfig, configDir, CONFIG_DIR_NAME, white-label fork
- **Seen:** e5dde9a

## safety

### project-trust-gate
- **What:** A project is considered to have resources needing trust if it has ANY of: `.pi/settings.json`, `.pi/{extensions,skills,prompts,themes}`, `.pi/SYSTEM.md`/`APPEND_SYSTEM.md`, or project `.agents/skills` (cwd or ancestor). A bare `.pi/` directory alone does NOT trigger the gate. Before trust resolves, only context files + user/global extensions + CLI `-e` extensions load — project-local extensions and settings load ONLY after trust. `defaultProjectTrust` (`ask`/`always`/`never`) controls non-interactive fallback since there's no prompt in `-p`/json/rpc modes; `--approve`/`--no-approve` override for one run; `/trust` persists a decision (including for the parent folder) to `~/.pi/agent/trust.json` without reloading the current session.
- **Where:** `docs/security.md` § Project Trust, `docs/usage.md` § Project Trust, `src/core/trust-manager.ts` (`ProjectTrustStore`, file-locked per-path decision store), `src/core/project-trust.ts` (`resolveProjectTrusted`, orchestrates the flow across all four run modes)
- **Notable:** The doc is explicit that project trust is an INPUT-LOADING guard only — "It does not make untrusted code, untrusted prompts, or untrusted model output safe. Prompt injection from repository files... is expected local-agent risk and cannot be reliably prevented by pi." This is a named, honest scope boundary rather than implying trust=safety.
- **Keywords:** project trust, defaultProjectTrust, trust.json, /trust
- **Seen:** e5dde9a

### explicit-no-sandbox-stance
- **What:** Pi ships with NO built-in sandbox. Built-in tools and extensions run with the full permissions of the pi process. The security doc argues a partial in-process sandbox would be actively worse than none — "easy to misunderstand as a security boundary while still depending on the host shell, filesystem, package managers, credentials, and extension code" — and that real isolation must come from the OS/VM/container layer, pointing to the containerization doc's three concrete patterns instead.
- **Where:** `docs/security.md` § No Built-in Sandbox
- **Notable:** This is a deliberate, argued-for absence (not an oversight) — worth comparing against any host project that DOES ship a partial in-process sandbox, since pi's authors consider that shape actively dangerous.
- **Keywords:** no built-in sandbox, false sense of security, OS/VM isolation
- **Seen:** e5dde9a

### three-containerization-patterns
- **What:** Named decision table for isolating pi: (1) **Gondolin extension** — pi runs on host, but a bundled example extension routes built-in tools + `!` commands into a local Linux micro-VM, host cwd mounted at `/workspace`, writes propagate through to host; good for VM isolation while keeping provider auth on the host. (2) **Plain Docker** — whole `pi` process containerized, simplest, but provider API keys enter the container. (3) **OpenShell** — whole process runs in a policy-controlled sandbox (filesystem/process/network/credential/inference policy) via a gateway (local Docker/Podman/VM or remote Kubernetes); can keep raw provider API keys OUTSIDE the sandbox entirely by routing inference through `https://inference.local` with the gateway injecting upstream credentials.
- **Where:** `docs/containerization.md`
- **Notable:** OpenShell's inference-routing option is the only one of the three that avoids putting real provider API keys inside the isolated boundary at all — a materially different security property from Docker/Gondolin, called out via its own dedicated subsection.
- **Keywords:** Gondolin micro-VM, Docker sandbox, OpenShell, inference routing, credential isolation
- **Seen:** e5dde9a

## ux

### tui-component-system
- **What:** A small `Component` interface (`render(width)→string[]`, optional `handleInput`, `invalidate()`) underlies the whole TUI. Extensions render custom UI via `ctx.ui.custom()`, which supports full-screen replacement or `{overlay:true}` (drawn on top of existing content, with anchor/percentage/margin positioning and a `handle` for programmatic focus/hide). A `Focusable` interface (with a zero-width `CURSOR_MARKER` APC escape sequence scanned out of rendered output) positions the REAL hardware cursor for IME support while keeping a separate fake/rendered cursor visible — container components with embedded `Input`/`Editor` children must propagate `focused` down manually or IME candidate windows render in the wrong place.
- **Where:** `docs/tui.md` § Component Interface, § Focusable Interface, § Overlays
- **Notable:** The IME-cursor-positioning mechanism (separate fake cursor for display vs a real, normally-hidden hardware cursor positioned via a scanned escape-sequence marker) is a genuinely subtle terminal-UI technique most CLI TUI frameworks don't need to solve at all — it exists specifically because CJK IME candidate windows anchor to the OS-level cursor position, not anything the TUI itself draws.
- **Keywords:** Component interface, ctx.ui.custom, overlay, Focusable, CURSOR_MARKER, IME support
- **Seen:** e5dde9a

### theme-system-51-tokens
- **What:** Themes are JSON files with a `vars` (reusable named colors) + `colors` (51 required tokens across core UI/backgrounds/markdown/diffs/syntax/thinking-level-borders/bash-mode, a handful with documented fallbacks like `thinkingMax→thinkingXhigh`) shape, validated by a published JSON schema for editor autocompletion. On first run pi detects terminal background and defaults to built-in `dark`/`light`. Editing the CURRENTLY ACTIVE custom theme file hot-reloads it immediately for visual iteration.
- **Where:** `docs/themes.md`, `src/modes/interactive/theme/theme.ts` (1335 lines — `detectTerminalBackgroundTheme`/`detectTerminalThemeForAuto` do the actual env-based and terminal-query-based probing; `theme` is a live-updating Proxy singleton so every already-rendered component picks up a theme change without re-fetching)
- **Keywords:** theme JSON schema, 51 color tokens, hot reload active theme, terminal background detection, theme Proxy singleton
- **Seen:** e5dde9a

### namespaced-keybindings-with-fullscreen-dual-routing
- **What:** Keybindings use namespaced action ids (e.g. `tui.editor.cursorUp`, `app.session.rename`) editable in `~/.pi/agent/keybindings.json`, with `/reload` applying changes live. In `--tui-mode fullscreen`, a documented dual-routing rule applies: unmodified navigation keys (`home`, `pageUp`, etc.) control the TRANSCRIPT scroll region while their `ctrl`-modified variants keep controlling the editor — configurable per-action via dedicated `tui.altScreen.*` bindings, with an empty-array binding (`"tui.altScreen.pageUp": []`) able to fully disable one side of the routing.
- **Where:** `docs/keybindings.md` § All Actions, § TUI Fullscreen Viewport
- **Notable:** Migration is handled automatically and silently — "Older configs using pre-namespaced ids such as `cursorUp`... are migrated automatically to the namespaced ids on startup" — a backward-compat detail that avoids breaking every existing user's custom keybindings.json when the naming scheme changed.
- **Keywords:** namespaced keybinding ids, keybindings.json, fullscreen dual routing, auto-migration
- **Seen:** e5dde9a

## testing-evals

### provider-implementation-test-suite-convention
- **What:** A fixed set of copy-and-adapt test files (`stream.test.ts`, `tokens.test.ts`, `abort.test.ts`, `empty.test.ts`, `context-overflow.test.ts`, `image-limits.test.ts`, `unicode-surrogate.test.ts`, `tool-call-without-result.test.ts`, `image-tool-result.test.ts`, `total-tokens.test.ts`, `cross-provider-handoff.test.ts`) exists in `packages/ai/test/` specifically so a NEW custom provider implementation can be validated against the same edge cases every built-in provider already passes, rather than each provider author inventing their own coverage.
- **Where:** `docs/custom-provider.md` § Testing Your Implementation
- **Notable:** `cross-provider-handoff.test.ts` implies pi tests context HANDOFF BETWEEN different providers mid-session as a first-class scenario, not just single-provider streaming correctness.
- **Keywords:** provider test suite, cross-provider-handoff, copy-and-adapt test convention
- **Seen:** e5dde9a

### dev-test-workflow
- **What:** `./test.sh` runs the non-LLM test suite (no API keys required); `npm test` runs everything including LLM-dependent tests; `npm test -- test/specific.test.ts` for one file. A hidden `/debug` command writes rendered TUI lines (with ANSI codes) plus the last messages sent to the LLM to `~/.pi/agent/pi-debug.log` for interactive debugging.
- **Where:** `docs/development.md` § Testing, § Debug Command
- **Keywords:** test.sh, npm test, /debug, pi-debug.log
- **Seen:** e5dde9a

## Notable absences (design decisions, not gaps)

- **No built-in sub-agents / orchestration.** `docs/usage.md` § Design Principles names this explicitly alongside no-MCP/no-permission-popups/no-plan-mode/no-todos/no-background-bash. Nothing to index under `orchestration` or `planning` this round — these are stated non-goals, cross-reference if the host project is evaluating whether to build sub-agent orchestration on TOP of a pi-like minimal core vs inside it.
- **`docs-style`/`self-improvement`** — no distinct mechanism surfaced in this round's docs-only pass; not ruled out, just unexamined. A `src/` code-level backfill (see the parallel inventory report cited below) may surface something under `self-improvement` (e.g. the `/changelog`/telemetry/update-check machinery) worth a second look.

## Round 1 supplementary inventory

Full mechanical file-by-file inventory report (73 files under `src/core/`, 55 under `src/modes/`, every file covered, one-line description + notable exports each): `plans/reports/from-general-purpose-to-coordinator-260818-pi-core-modes-inventory-report.md`. Its most-notable findings are folded into the domain sections above; the report itself remains the fuller per-file reference (e.g. exact line counts, every component in `src/modes/interactive/components/` including the two easter eggs `armin.ts`/`daxnuts.ts`, the full RPC-mode file breakdown).
