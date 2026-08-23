# pi coding-agent: src/core + src/modes file inventory

Mechanical inventory only — no taxonomy/judgment. Repo:
`/home/vantt/projects/forgentX/upstreams/pi/packages/coding-agent`.
Every `.ts` file under `src/core/` (78) and `src/modes/` (59) is listed below,
grouped by subdirectory, with a one-line description (from reading the file,
not guessing from the name) and notable exported symbol names.

---

## src/core/ (flat files)

| File | Description | Notable exports |
|---|---|---|
| `agent-session-runtime.ts` (441L) | Wraps `AgentSession` creation/lifecycle into a reusable "runtime" object shared across modes (interactive/print/rpc); handles session-file-not-found error. | `AgentSessionRuntime`, `createAgentSessionRuntime`, `SessionImportFileNotFoundError`, `CreateAgentSessionRuntimeResult` |
| `agent-session-services.ts` (221L) | Builds the shared service bundle (settings, auth, model runtime, resource loader, etc.) that `AgentSession` and the runtime are constructed from. | `createAgentSessionServices`, `createAgentSessionFromServices`, `AgentSessionServices`, `AgentSessionRuntimeDiagnostic` |
| `agent-session.ts` (3417L, largest core file) | The central agent loop/state machine: turn execution, tool calls, compaction triggering, model switching, event emission. | `AgentSession` (class), `AgentSessionEvent`, `AgentSessionConfig`, `parseSkillBlock`, `SessionStats`, `ModelCycleResult` |
| `auth-guidance.ts` (25L) | Pure string-formatting helpers for login/no-model/no-API-key error messages pointing users at `/login` docs. | `getProviderLoginHelp`, `formatNoModelsAvailableMessage`, `formatNoModelSelectedMessage`, `formatNoApiKeyFoundMessage` |
| `auth-storage.ts` (507L) | `CredentialStore` implementation backed by `auth.json` on disk, with file-locking (proper-lockfile), in-memory and read-only variants. | `AuthStorage`, `FileAuthStorageBackend`, `ReadOnlyAuthStorage`, `InMemoryAuthStorageBackend`, `readStoredCredential` |
| `bash-executor.ts` (156L) | Thin wrapper that runs a bash command through pluggable `BashOperations` and returns a normalized `BashResult`. | `executeBashWithOperations`, `BashExecutorOptions`, `BashResult` |
| `cache-stats.ts` (164L) | **Distinct mechanism.** Detects/quantifies prompt-cache misses across a session (idle-gap vs 5-min TTL, model changes) and computes wasted tokens/cost. | `computeCacheWaste`, `collectCacheMisses`, `detectCacheMiss`, `CACHE_TTL_MS`, `CacheWasteTotals`, `ModelPriceSource` |
| `defaults.ts` (3L) | One constant: default thinking level. | `DEFAULT_THINKING_LEVEL` |
| `diagnostics.ts` (15L) | **Distinct mechanism** (type-only). Shape for resource-name collisions (extension/skill/prompt/theme same-name clashes across sources) and generic diagnostics. | `ResourceCollision`, `ResourceDiagnostic` (interfaces only) |
| `event-bus.ts` (33L) | Minimal typed pub/sub wrapper over Node's `EventEmitter`, with per-handler error isolation. | `createEventBus`, `EventBus`, `EventBusController` |
| `exec.ts` (107L) | Generic child-process exec helper (not the agent's bash tool) used for one-off command execution. | `execCommand`, `ExecOptions`, `ExecResult` |
| `experimental.ts` (9L) | Reads `PI_EXPERIMENTAL` env flag; gates a "strict tool sampling" JSON-schema mode. | `areExperimentalFeaturesEnabled`, `getExperimentalToolSampling` |
| `footer-data-provider.ts` (388L) | **Distinct mechanism.** Computes/watches data shown in the TUI footer: git branch/paths (handles both `.git` dir and worktree file), by walking up from cwd and file-watching. | `FooterDataProvider` (class), `findGitPaths`, `GitPaths`, `ReadonlyFooterDataProvider` |
| `http-dispatcher.ts` (111L) | **Distinct mechanism.** Configures global `fetch`/undici dispatcher: idle timeout, proxy support, connect-family-timeout tuning. | `configureHttpDispatcher`, `applyHttpProxySettings`, `parseHttpIdleTimeoutMs`, `formatHttpIdleTimeoutMs`, `DEFAULT_HTTP_IDLE_TIMEOUT_MS`, `HTTP_IDLE_TIMEOUT_CHOICES` |
| `index.ts` (80L) | Barrel: re-exports the public surface of core (AgentSession, runtime, services, bash-executor, event-bus, experimental flags, the whole extensions API, source-info). | (re-exports only) |
| `keybindings.ts` (370L) | Defines the app's keybinding schema/defaults, migrates old keybindings config shape, and a manager class extending the TUI library's base manager. | `AppKeybindings`, `KEYBINDINGS`, `KeybindingsManager`, `migrateKeybindingsConfig` |
| `messages.ts` (195L) | Session-message helpers: builds/labels synthetic messages for compaction summaries, branch summaries, bash-execution echoes, custom messages; converts internal `AgentMessage[]` to LLM `Message[]`. | `convertToLlm`, `createBranchSummaryMessage`, `createCompactionSummaryMessage`, `createCustomMessage`, `bashExecutionToText`, prefix/suffix string constants |
| `model-config.ts` (298L) | Loads/validates an immutable `models.json` snapshot via TypeBox schema (percentile cutoffs, OpenRouter routing options, etc.); explicitly "credential-blind". | `ModelConfig` (class), `ModelsJsonModel`, `ModelsJsonProvider`, `ModelsJsonModelOverride` |
| `model-registry.ts` (157L) | Registry wrapping model lookup/auth-resolution across providers; re-exports `ProviderConfigInput`. | `ModelRegistry` (class), `ResolvedRequestAuth` |
| `model-resolver.ts` (775L) | Resolves which model to use: default-per-provider table, pattern matching (`minimatch`), CLI `--model` parsing, scoped-model resolution, initial-model selection at startup, session model restore. | `resolveCliModel`, `resolveModelScope`, `findInitialModel`, `restoreModelFromSession`, `parseModelPattern`, `defaultModelPerProvider`, `ScopedModel` |
| `model-runtime.ts` (787L) | Wraps `@earendil-works/pi-ai`'s `Models` into a stateful runtime handling auth/credential sync (login/logout/set/remove runtime API key) plus streaming. | `ModelRuntime` (class, implements `Models`), `CredentialSynchronizationError`, `CredentialSynchronizationOperation` |
| `models-store.ts` (146L) | Persists/reads a `models.json`-shaped store of model catalogs (file-backed and in-memory implementations of `ModelsStore`). | `FileModelsStore`, `InMemoryCodingAgentModelsStore` |
| `output-guard.ts` (108L) | **Distinct mechanism.** Takes over `process.stdout`/`stderr` raw writes (bypassing readline/TUI interception) with backpressure-aware retry (`ENOBUFS`/`EAGAIN`/`EWOULDBLOCK`), used to safely print raw output during TUI takeover. | `takeOverStdout`, `restoreStdout`, `isStdoutTakenOver`, `writeRawStdout`, `waitForRawStdoutBackpressure`, `flushRawStdout` |
| `package-manager.ts` (2682L, second-largest core file) | **Distinct mechanism.** Full package/resource manager: resolves/installs/updates extensions, skills, prompts, themes from configured sources (npm/git/local), path metadata, progress callbacks, plus a `/proc/self/environ` fallback for empty `process.env` on Linux. | `DefaultPackageManager` (class), `PackageManager` (interface), `getExtensionTempFolder`, `PathMetadata`, `ResolvedResource`, `ProgressEvent` |
| `pi-manifest.ts` (34L) | Reads the `pi` field of a `package.json` (extensions/skills/prompts/themes arrays) as a manifest. | `readPiManifest`, `PiManifest` |
| `project-trust.ts` (96L) | Orchestrates the "trust this project folder?" prompt flow across modes (interactive/print/json/rpc), consulting `trust-manager.ts` and firing extension trust events. | `resolveProjectTrusted`, `AppMode`, `ResolveProjectTrustedOptions` |
| `prompt-templates.ts` (285L) | Loads user-defined slash-command prompt templates from disk, parses `$1 $2 ...`/`$ARGUMENTS`-style args, substitutes them, expands `/template` invocations in input text. | `loadPromptTemplates`, `expandPromptTemplate`, `parseCommandArgs`, `substituteArgs`, `PromptTemplate` |
| `provider-attribution.ts` (97L) | **Distinct mechanism.** Adds attribution/telemetry HTTP headers for known aggregator hosts (OpenRouter, NVIDIA NIM, Cloudflare AI Gateway, OpenCode) when install telemetry is enabled. | `mergeProviderAttributionHeaders` |
| `provider-composer.ts` (572L) | **Distinct mechanism.** Composes a full `Provider`/`Model` config from `ModelsJsonProvider`/override + OAuth/API-key auth wiring; validates extension-registered providers; resolves compatibility headers/auth status. | `composeModelProvider`, `validateExtensionProvider`, `resolveConfiguredModelHeaders`, `resolveCompatibilityRequestConfig`, `configuredRequestAuthStatus`, `clearApiKeyCache`, `ProviderConfigInput`, `AuthStatus` |
| `radius.ts` (1L) | **Distinct mechanism, trivial.** Single constant defining the "radius" provider id (an LLM provider name), nothing else. | `RADIUS_PROVIDER_ID = "radius"` |
| `remote-catalog-provider.ts` (137L) | **Distinct mechanism.** Fetches a remote model catalog from `https://pi.dev` (4h refresh interval, 4s timeout) and merges it over the locally-bundled baseline catalog, overriding stale entries by `id`. | `withRemoteCatalog`, `REMOTE_CATALOG_REFRESH_INTERVAL_MS` |
| `resolve-config-value.ts` (287L) | **Distinct mechanism.** Resolves config strings that may be shell commands (`$(cmd)`), env-var refs, or literal templates; caches shell command results for process lifetime; used by auth-storage & model-registry. | `resolveConfigValue`, `resolveConfigValueOrThrow`, `resolveHeaders`, `isCommandConfigValue`, `isConfigValueConfigured`, `getConfigValueEnvVarName(s)`, `clearConfigValueCache` |
| `resource-loader.ts` (1096L) | **Distinct mechanism** (large orchestrator). Central loader that discovers/loads all "resources" for a session — extensions, skills, prompt templates, project context files (CONTEXT.md etc.), themes — merging user/project scopes, tracking collisions via `diagnostics.ts`. | `DefaultResourceLoader` (class), `ResourceLoader` (interface), `loadProjectContextFiles`, `ResourceExtensionPaths` |
| `runtime-credentials.ts` (52L) | **Distinct mechanism.** Async `CredentialStore` overlay that lets runtime-set API keys (non-persistent, in-memory) shadow the persisted store. | `RuntimeCredentials` (class) |
| `sdk.ts` (401L) | Public SDK entry point: `createAgentSession()` top-level factory wiring together model runtime, tools, skills, prompt templates for embedding pi as a library. | `createAgentSession`, `CreateAgentSessionOptions`, `CreateAgentSessionResult` |
| `session-cwd.ts` (59L) | **Distinct mechanism, small.** Detects/reports when a resumed session's stored working directory no longer exists on disk, formats the error/prompt, and an error class for it. | `getMissingSessionCwdIssue`, `formatMissingSessionCwdError`, `formatMissingSessionCwdPrompt`, `assertSessionCwdExists`, `MissingSessionCwdError` |
| `session-manager.ts` (1714L, third-largest) | Session file format/persistence: entry types (message, thinking-level-change, model-change, compaction, branch-summary, custom, label, session-info), JSONL read/write, session tree building, session discovery/listing. | `SessionManager` (class), `CURRENT_SESSION_VERSION`, `parseSessionEntries`, `migrateSessionEntries`, `findMostRecentSession`, `buildSessionContext`, many `SessionEntry` subtype interfaces |
| `settings-manager.ts` (1290L) | Full settings schema (compaction, branch-summary, retry, terminal, image, thinking-budgets, markdown/mermaid, warnings, project-trust default, transport, package-source) plus file-backed and in-memory storage and a manager class merging global/project scope. | `SettingsManager` (class), `Settings`, `FileSettingsStorage`, `InMemorySettingsStorage`, `SettingsScope` |
| `skills.ts` (507L) | Loads skill definitions (frontmatter-parsed `.md` files) from disk directories, formats them for the system prompt. | `loadSkills`, `loadSkillsFromDir`, `formatSkillsForPrompt`, `Skill`, `SkillFrontmatter`, `LoadSkillsResult` |
| `slash-commands.ts` (42L) | Defines the built-in slash-command registry shape/list and shared slash-command info types. | `BUILTIN_SLASH_COMMANDS`, `SlashCommandInfo`, `BuiltinSlashCommand`, `SlashCommandSource` |
| `source-info.ts` (40L) | **Distinct mechanism, small.** Tracks provenance of a loaded resource: scope (user/project/temporary), origin (package/top-level), source string, base dir — used across extensions/skills/prompts/themes. | `createSourceInfo`, `createSyntheticSourceInfo`, `SourceInfo`, `SourceScope`, `SourceOrigin` |
| `system-prompt.ts` (162L) | Builds the agent's system prompt string from options (tools, skills, project context, etc.). | `buildSystemPrompt`, `BuildSystemPromptOptions` |
| `telemetry.ts` (13L) | **Distinct mechanism, tiny.** Checks whether install telemetry is enabled via `PI_TELEMETRY` env var or settings; consumed by `provider-attribution.ts`. | `isInstallTelemetryEnabled` |
| `timings.ts` (50L) | **Distinct mechanism, small.** Startup profiling instrumentation gated by `PI_TIMING=1` env var; namespaced timing buckets ("main"/"extensions") printed to stderr. | `time`, `resetTimings`, `printTimings` |
| `trust-manager.ts` (244L) | **Distinct mechanism.** Persists per-path project-trust decisions (trusted/untrusted/undecided) to a file-locked trust store under the config dir; lists trust-requiring project resources (settings.json, extensions, skills, prompts, themes, SYSTEM.md, APPEND_SYSTEM.md). | `ProjectTrustStore` (class), `getProjectTrustOptions`, `hasTrustRequiringProjectResources`, `getProjectTrustParentPath`, `ProjectTrustDecision`, `ProjectTrustOption` |
| `usage-totals.ts` (70L) | **Distinct mechanism, small.** Accumulates token/cost usage totals across session entries and produces a per-model cost breakdown. | `createUsageTotals`, `addUsageToTotals`, `getUsageCostBreakdown`, `UsageTotals`, `UsageCostBreakdownEntry` |

## src/core/compaction/

| File | Description | Notable exports |
|---|---|---|
| `branch-summarization.ts` (376L) | Summarizes a conversation "branch" (e.g., after navigating the session tree back to an earlier point) into a compact entry; collects/prepares entries and calls the model to generate the summary. | `generateBranchSummary`, `collectEntriesForBranchSummary`, `prepareBranchEntries`, `BranchSummaryResult`, `BranchSummaryDetails` |
| `compaction.ts` (1004L, largest compaction file) | Core context-compaction logic: token estimation, `shouldCompact` threshold check, cut-point selection (`findCutPoint`), summary generation via the model, and the top-level `compact()` orchestrator. | `compact`, `shouldCompact`, `findCutPoint`, `estimateContextTokens`, `estimateTokens`, `generateSummary`, `generateSummaryWithUsage`, `completeSummarization`, `calculateContextTokens`, `prepareCompaction`, `DEFAULT_COMPACTION_SETTINGS` |
| `index.ts` (7L) | Barrel: `export *` from branch-summarization, compaction, utils. | (re-exports only) |
| `utils.ts` (158L) | Shared compaction helpers: tracks file read/modify operations seen in messages, formats them into the summary prompt, serializes conversation text, and holds the summarization system prompt string. | `createFileOps`, `extractFileOpsFromMessage`, `computeFileLists`, `formatFileOperations`, `serializeConversation`, `SUMMARIZATION_SYSTEM_PROMPT` |

## src/core/export-html/

| File | Description | Notable exports |
|---|---|---|
| `ansi-to-html.ts` (258L) | Converts ANSI-escaped terminal text into HTML spans (colors/styles) for the exported-session viewer. | `ansiToHtml`, `ansiLinesToHtml` |
| `index.ts` (316L) | Top-level "export session to a standalone HTML file" feature: reads a session file, renders entries (messages, tool calls) into HTML using a template. | `exportSessionToHtml`, `exportFromFile`, `ExportOptions`, `ToolHtmlRenderer` (interface) |
| `tool-renderer.ts` (172L) | Builds the `ToolHtmlRenderer` used by `index.ts` to render individual tool-call results as HTML blocks. | `createToolHtmlRenderer`, `ToolHtmlRendererDeps`, `ToolHtmlRenderer` |

## src/core/extensions/

| File | Description | Notable exports |
|---|---|---|
| `index.ts` (187L) | Barrel re-exporting the extensions system's public API: loader functions, `ExtensionRunner`, and the large `types.ts` event/type surface plus type guards. | (re-exports only) |
| `loader.ts` (742L) | Discovers and loads extension modules from disk (with caching), builds an `ExtensionRuntime`, loads an extension from an inline factory function. | `discoverAndLoadExtensions`, `loadExtensions`, `loadExtensionsCached`, `loadExtensionFromFactory`, `createExtensionRuntime`, `clearExtensionCache` |
| `runner.ts` (1236L) | Runtime dispatcher that invokes loaded extensions' handlers for every lifecycle event (session start/shutdown/tree/fork, tool calls, provider requests, etc.); defines handler-type signatures. | `ExtensionRunner` (class), `emitSessionShutdownEvent`, `emitProjectTrustEvent`, `NewSessionHandler`, `ForkHandler`, `NavigateTreeHandler`, `SwitchSessionHandler` |
| `types.ts` (1751L, largest single file in either directory tree) | The entire extension-API type surface: every lifecycle event type (session/agent/turn/message/tool/input/provider events), `ExtensionAPI` interface, `ToolDefinition`/`defineTool`, tool-call/result event type guards, provider registration types, handler signatures. | `defineTool`, `ExtensionAPI`, `ToolDefinition`, `Extension`, `ExtensionContext`, dozens of `*Event`/`*EventResult` interfaces, `isBashToolResult`/`isEditToolResult`/etc. type guards |
| `wrapper.ts` (45L) | Wraps an extension-registered tool (`RegisteredTool`) into the internal `AgentTool` shape used by the agent loop. | `wrapRegisteredTool`, `wrapRegisteredTools` |

## src/core/tools/

| File | Description | Notable exports |
|---|---|---|
| `bash.ts` (510L) | The agent's `bash` tool: schema, local shell execution operations, spawn-hook mechanism, tool definition/factory. | `createBashTool`, `createBashToolDefinition`, `createLocalBashOperations`, `BashToolInput`, `BashSpawnHook`, `BashOperations` |
| `edit-diff.ts` (560L) | Diff/patch engine used by the edit tool: line-ending detection/normalization, fuzzy text matching for old/new replacement, applying edits, unified-patch/diff-string generation. | `fuzzyFindText`, `applyEditsToNormalizedContent`, `applyReplacementsPreservingUnchangedLines`, `generateUnifiedPatch`, `generateDiffString`, `computeEditsDiff`, `computeEditDiff`, `detectLineEnding`, `normalizeToLF`, `stripBom` |
| `edit.ts` (461L) | The agent's `edit` tool: schema, `EditOperations` interface, tool definition/factory (built on `edit-diff.ts`). | `createEditTool`, `createEditToolDefinition`, `EditToolInput`, `EditOperations` |
| `file-mutation-queue.ts` (61L) | Per-file-path async mutation queue so concurrent edit/write calls to the same file serialize instead of racing. | `withFileMutationQueue` |
| `find.ts` (380L) | The agent's `find` tool (filename glob/pattern search); includes path relativization helper. | `createFindTool`, `createFindToolDefinition`, `relativizeFindResultPath`, `FindToolInput`, `FindOperations` |
| `grep.ts` (390L) | The agent's `grep` tool (content search). | `createGrepTool`, `createGrepToolDefinition`, `GrepToolInput`, `GrepOperations` |
| `index.ts` (196L) | Barrel/factory hub: builds the full set of coding tools (`bash`, `edit`, `find`, `grep`, `ls`, `read`, `write`) as either definitions or bound tool instances, in "coding" (read+write) or "read-only" subsets. | `createCodingTools`, `createReadOnlyTools`, `createAllTools`, `createTool`, `createToolDefinition`, `Tool`, `ToolName`, `allToolNames` |
| `ls.ts` (230L) | The agent's `ls` (directory listing) tool. | `createLsTool`, `createLsToolDefinition`, `LsToolInput`, `LsOperations` |
| `output-accumulator.ts` (222L) | Accumulates streamed tool stdout/stderr output with size limits, producing snapshots (used for live tool-execution rendering). | `OutputAccumulator` (class), `OutputAccumulatorOptions`, `OutputSnapshot` |
| `path-utils.ts` (118L) | Path helpers shared by the file tools: existence check, `~` expansion, resolving a path against cwd for read/edit purposes (sync and async variants). | `pathExists`, `expandPath`, `resolveToCwd`, `resolveReadPath`, `resolveReadPathAsync` |
| `read.ts` (358L) | The agent's `read` tool (file/image reading with truncation). | `createReadTool`, `createReadToolDefinition`, `ReadToolInput`, `ReadOperations` |
| `render-utils.ts` (85L) | Shared TUI-rendering helpers for tool-call display: path shortening/linking, text normalization, "invalid args" text, generic tool-path rendering. | `shortenPath`, `linkPath`, `renderToolPath`, `getTextOutput`, `invalidArgText`, `normalizeDisplayText` |
| `tool-definition-wrapper.ts` (47L) | Wraps a `ToolDefinition` or converts a plain `AgentTool` into a `ToolDefinition`, for interop between the two representations. | `wrapToolDefinition`, `wrapToolDefinitions`, `createToolDefinitionFromAgentTool` |
| `truncate.ts` (276L) | Generic head/tail truncation for tool output with byte/line limits (used by read, grep, bash, etc.), plus per-line truncation for long grep matches. | `truncateHead`, `truncateTail`, `truncateLine`, `formatSize`, `DEFAULT_MAX_LINES`, `DEFAULT_MAX_BYTES`, `GREP_MAX_LINE_LENGTH` |
| `write.ts` (274L) | The agent's `write` tool (create/overwrite a file). | `createWriteTool`, `createWriteToolDefinition`, `WriteToolInput`, `WriteOperations` |

---

## src/modes/ (flat files)

| File | Description | Notable exports |
|---|---|---|
| `index.ts` (16L) | Barrel: re-exports `InteractiveMode`, `runPrintMode`, `RpcClient`/`runRpcMode`, and shared JSON/RPC types. | (re-exports only) |
| `json-event.ts` (46L) | Converts internal `AgentSessionEvent` objects into a JSON-serializable event shape (`toJsonEvent`) for RPC/JSON-mode consumers. | `toJsonEvent`, `JsonAgentSessionEvent` |
| `print-mode.ts` (169L) | Non-interactive "print" mode: runs one prompt through the agent session and prints the result to stdout, then exits. | `runPrintMode`, `PrintModeOptions` |

## src/modes/interactive/ (top-level, outside components/theme)

| File | Description | Notable exports |
|---|---|---|
| `external-editor.ts` (45L) | Opens the user's `$EDITOR` on a temp file to compose input, returns the edited content or a failure status. | `editInExternalEditor`, `ExternalEditorOptions`, `ExternalEditorResult` |
| `interactive-mode.ts` (6457L — by far the largest file in either tree) | The full TUI application: input handling, rendering the message list, all slash-command dispatch, dialogs/selectors wiring, session tree navigation, model/theme/settings selection, resume-command formatting. Delegates business logic to `AgentSession`. | `InteractiveMode` (class), `InteractiveModeOptions`, `formatResumeCommand`, `createInteractiveTui`, `createInteractiveTuiReference` |
| `model-catalog-refresh.ts` (51L) | Background refresh of model catalogs (ties into `remote-catalog-provider.ts`) for the interactive session. | `refreshModelCatalogs` |
| `model-search.ts` (21L) | Small text-extraction helpers used to build searchable text for the model selector's fuzzy search. | `getModelSearchText`, `getModelSelectorSearchText`, `ModelSearchItem` |

## src/modes/interactive/components/ (TUI widgets)

| File | Description | Notable exports |
|---|---|---|
| `armin.ts` (382L) | **Easter egg.** Animated XBM (1-bit) pixel-art component named "Armin" that says hi; ships raw bitmap data inline. | `ArminComponent` |
| `assistant-message.ts` (197L) | Renders an assistant chat message (markdown, tool-call summaries) in the TUI message list. | `AssistantMessageComponent` |
| `bash-execution.ts` (220L) | Renders a live/finished bash-execution message block (user-run shell commands, not the agent's bash tool) in the TUI. | `BashExecutionComponent` |
| `bordered-loader.ts` (68L) | A bordered spinner/loading indicator container widget. | `BorderedLoader` |
| `branch-summary-message.ts` (58L) | Renders a "branch summary" session entry (see `compaction/branch-summarization.ts`) as a message bubble. | `BranchSummaryMessageComponent` |
| `compaction-summary-message.ts` (59L) | Renders a compaction-summary session entry as a message bubble. | `CompactionSummaryMessageComponent` |
| `config-selector.ts` (942L) | TUI component for managing installed package resources (extensions/skills/prompts/themes) — enable/disable per scope, browse installed vs. available. | `ConfigSelectorComponent`, `ScopedResolvedPaths` |
| `countdown-timer.ts` (39L) | Reusable countdown-timer utility (tick/expire callbacks) used by dialog components with a timeout. | `CountdownTimer` |
| `custom-editor.ts` (90L) | A custom text-editor widget subclassing the TUI library's base `Editor`. | `CustomEditor` |
| `custom-entry.ts` (62L) | Renders a generic/unrecognized custom session entry. | `CustomEntryComponent` |
| `custom-message.ts` (113L) | Renders a generic/unrecognized custom message type in the message list. | `CustomMessageComponent` |
| `daxnuts.ts` (164L) | **Easter egg.** "POWERED BY DAXNUTS" tribute component with an inline hex-encoded 32x32 RGB image of a person (dax/@thdxr), for OpenCode + Kimi K2.5 attribution. | `DaxnutsComponent` |
| `diff.ts` (147L) | Renders a unified diff string with syntax/color highlighting for display. | `renderDiff`, `RenderDiffOptions` |
| `dynamic-border.ts` (25L) | A border component whose appearance can change dynamically (used by other components like the earendil announcement). | `DynamicBorder` |
| `earendil-announcement.ts` (53L) | **Announcement/easter-egg-adjacent.** Shows a bundled image (`clankolas.png`) plus a link to a blog post (`mariozechner.at/.../ive-sold-out`) — an in-app announcement banner. | `EarendilAnnouncementComponent` |
| `extension-editor.ts` (132L) | Focusable editor widget for editing extension-related text/config within the TUI. | `ExtensionEditorComponent` |
| `extension-input.ts` (87L) | Focusable input widget used by extensions requesting text input via the extension UI API. | `ExtensionInputComponent`, `ExtensionInputOptions` |
| `extension-selector.ts` (112L) | List-selector widget for choosing among extensions (e.g., in settings/config flows). | `ExtensionSelectorComponent`, `ExtensionSelectorOptions` |
| `first-time-setup.ts` (145L) | First-run onboarding component shown on first launch. | `FirstTimeSetupComponent`, `FirstTimeSetupOptions`, `FirstTimeSetupResult` |
| `footer.ts` (245L) | Renders the TUI status footer (cwd, git info, token counts) using data from `core/footer-data-provider.ts`. | `FooterComponent`, `formatTokens`, `formatCwdForFooter` |
| `index.ts` (38L) | Barrel re-exporting all component classes for use by extensions. | (re-exports only) |
| `keybinding-hints.ts` (48L) | Formats keybinding hint strings (e.g., "Ctrl+C to cancel") for display in footers/dialogs. | `formatKeyText`, `keyText`, `keyDisplayText`, `keyHint`, `rawKeyHint` |
| `login-dialog.ts` (233L) | Focusable dialog widget for the `/login` OAuth/API-key flow. | `LoginDialogComponent` |
| `markdown-transform.ts` (29L) | Factory for a markdown-transform function used by the extension API's markdown rendering hook. | `createMarkdownTransform` |
| `mermaid.ts` (89L) | Creates a markdown transformer that renders Mermaid diagram code blocks (integrates with `MermaidRenderingMode` setting). | `createMermaidMarkdownTransformer` |
| `model-selector.ts` (374L) | Focusable list-selector widget for picking a model. | `ModelSelectorComponent` |
| `oauth-selector.ts` (214L) | Focusable selector for choosing an OAuth/API-key auth provider during login. | `OAuthSelectorComponent`, `AuthSelectorProvider`, `formatAuthSelectorProviderType` |
| `scoped-models-selector.ts` (403L) | Focusable selector for configuring per-scope (global/project) model settings. | `ScopedModelsSelectorComponent`, `ModelsConfig`, `ModelsCallbacks` |
| `session-selector-search.ts` (194L) | Search/filter/sort logic for the session-picker list (parses query syntax, matches/scores sessions, sort modes threaded/recent/relevance). | `parseSearchQuery`, `matchSession`, `filterAndSortSessions`, `hasSessionName`, `SortMode`, `ParsedSearchQuery` |
| `session-selector.ts` (1031L) | Focusable session-picker widget (browse/search/switch sessions), built on `session-selector-search.ts`. | `SessionSelectorComponent` |
| `settings-selector.ts` (893L) | Large settings-editing widget covering the full `Settings` schema surface. | `SettingsSelectorComponent`, `SettingsConfig`, `SettingsCallbacks` |
| `show-images-selector.ts` (50L) | Small selector for the "show images" setting toggle. | `ShowImagesSelectorComponent` |
| `skill-invocation-message.ts` (55L) | Renders a message bubble showing that a skill was invoked mid-conversation. | `SkillInvocationMessageComponent` |
| `status-indicator.ts` (114L) | Family of animated status/loader indicators for different states (working, retrying, compacting, branch-summarizing, idle). | `StatusIndicator`, `WorkingStatusIndicator`, `RetryStatusIndicator`, `CompactionStatusIndicator`, `BranchSummaryStatusIndicator`, `IdleStatus`, `CompactionStatusReason` |
| `theme-selector.ts` (67L) | List-selector widget for choosing a color theme. | `ThemeSelectorComponent` |
| `thinking-selector.ts` (75L) | List-selector widget for choosing the model's thinking/reasoning level. | `ThinkingSelectorComponent` |
| `tool-execution.ts` (388L) | Generic renderer for a tool-call's live/finished execution state in the message list (used for extension-registered tools and fallback rendering). | `ToolExecutionComponent`, `ToolExecutionOptions` |
| `tree-selector.ts` (1427L) | Large widget for browsing/navigating the session's conversation tree (branches from compaction/fork), with filter modes (no-tools/user-only/labeled-only/all). | `TreeSelectorComponent`, `FilterMode` |
| `trust-selector.ts` (134L) | Selector dialog for the project-trust prompt (trusted/not/with-updates options), built on `trust-manager.ts`'s `ProjectTrustOption`. | `TrustSelectorComponent`, `TrustSelectorOptions`, `TrustSelection` |
| `user-message-selector.ts` (155L) | Selector for picking among past user messages (e.g., for edit/resubmit flows). | `UserMessageSelectorComponent` |
| `user-message.ts` (70L) | Renders a user chat message bubble. | `UserMessageComponent` |
| `visual-truncate.ts` (50L) | Truncates rendered text to a max number of visual (wrapped) lines for display. | `truncateToVisualLines`, `VisualTruncateResult` |

## src/modes/interactive/theme/

| File | Description | Notable exports |
|---|---|---|
| `theme-controller.ts` (166L) | Controller class coordinating theme switching, watching, and applying updates to the running TUI. | `InteractiveThemeController` |
| `theme.ts` (1335L) | The full theming system: `Theme` class, color/bg type unions, theme discovery/loading from disk paths, terminal light/dark auto-detection (env-based and query-based), a live-updating `theme` proxy singleton, syntax-highlighting (`highlightCode`), and per-widget theme getters (markdown, select-list, editor, settings-list). | `Theme` (class), `theme` (Proxy singleton), `getAvailableThemes`, `getAvailableThemesWithPaths`, `loadThemeFromPath`, `getThemeByName`, `detectTerminalBackgroundTheme`, `detectTerminalThemeForAuto`, `setTheme`, `initTheme`, `highlightCode`, `getMarkdownTheme`, `getSelectListTheme`, `getEditorTheme`, `getSettingsListTheme` |

## src/modes/rpc/

| File | Description | Notable exports |
|---|---|---|
| `jsonl.ts` (58L) | Low-level JSON-Lines framing: serializes a value to one JSON line, and attaches a line-reader callback to a readable stream. | `serializeJsonLine`, `attachJsonlLineReader` |
| `rpc-client.ts` (601L) | Typed client that spawns the agent binary in RPC mode (child process) and exposes a programmatic API over stdin/stdout JSON-lines for embedding the agent elsewhere. | `RpcClient` (class), `RpcClientOptions`, `ModelInfo`, `RpcEventListener` |
| `rpc-mode.ts` (817L) | Server side of RPC mode: headless JSON stdin/stdout protocol handler — receives `RpcCommand`s, executes them against the `AgentSessionRuntime`, emits events and command responses, and relays extension-UI requests/responses. | `runRpcMode` |
| `rpc-types.ts` (289L) | The RPC wire-protocol type definitions: command union, response union, session-state shape, extension-UI request/response types. | `RpcCommand`, `RpcResponse`, `RpcSessionState`, `RpcSlashCommand`, `RpcExtensionUIRequest`, `RpcExtensionUIResponse`, `RpcCommandType` |

---

## Files with no obvious doc coverage

Names/functionality not recognizable from typical coding-agent CLI docs
(session management, compaction, tools, extensions, themes, keybindings,
models/providers, RPC/SDK) — most likely genuinely new findings:

- `src/core/cache-stats.ts` — prompt-cache-miss cost accounting (idle-gap TTL heuristic, model-change detection).
- `src/core/output-guard.ts` — raw-stdout takeover with backpressure-aware retry loop, bypassing the TUI.
- `src/core/http-dispatcher.ts` — global fetch/undici dispatcher config (idle timeout, proxy, connect-family timeout).
- `src/core/provider-attribution.ts` + `src/core/telemetry.ts` — install-telemetry-gated attribution headers for specific aggregator hosts (OpenRouter, NVIDIA NIM, Cloudflare AI Gateway, OpenCode).
- `src/core/remote-catalog-provider.ts` — periodic remote model-catalog fetch/merge from `pi.dev`.
- `src/core/radius.ts` — a provider id constant for something called "radius" (no further code in the file).
- `src/core/resolve-config-value.ts` — config values that can be shell-command substitutions or env-var templates, with a process-lifetime result cache.
- `src/core/trust-manager.ts` / `src/core/project-trust.ts` — project-folder "trust" decision persistence and prompt-flow orchestration (a permission gate distinct from normal auth).
- `src/core/session-cwd.ts` — detecting a resumed session whose stored working directory no longer exists on disk.
- `src/core/timings.ts` — `PI_TIMING=1`-gated startup profiling instrumentation.
- `src/core/package-manager.ts` — full extension/skill/prompt/theme package manager (install/update/resolve from npm/git/local sources), including a `/proc/self/environ` env-var fallback for Linux.
- `src/core/diagnostics.ts` / `src/core/source-info.ts` — resource-provenance and name-collision tracking across user/project/package scopes.
- `src/core/tools/file-mutation-queue.ts` — per-path async mutation queue serializing concurrent file edits.
- `src/core/tools/edit-diff.ts` — the fuzzy-match diff/patch engine underlying the edit tool.
- `src/modes/interactive/components/armin.ts` and `daxnuts.ts` — inline-bitmap easter-egg TUI components (not app functionality).
- `src/modes/interactive/components/earendil-announcement.ts` — in-app announcement banner linking to an external blog post.
- `src/modes/interactive/theme/theme.ts` — terminal light/dark auto-detection via env/query probing, and per-widget theme derivation (markdown/select-list/editor/settings-list themes).
- `src/modes/interactive/model-catalog-refresh.ts` — background model-catalog refresh tied to `remote-catalog-provider.ts`.
- `src/modes/rpc/jsonl.ts` — the JSON-Lines wire-framing primitive underlying RPC mode.
