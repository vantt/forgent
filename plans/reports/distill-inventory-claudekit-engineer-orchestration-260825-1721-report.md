# Inventory: claudekit-engineer orchestration/gating machinery

Source: `/home/vantt/projects/forgentX/upstreams/claudekit-engineer/`
Scope: `claude/hooks/`, `claude/agents/`, `claude/rules/`, `.claude/rules/quality-gates.md` (repo-maintainer-only, not shipped).
Mechanical inventory only — no porting judgment.

Manifest source of truth for hook wiring: `claude/settings.json` (the actual event/matcher registrations). `claude/hooks/managed-hooks.json` is a generated list of hook *names* only (no events), used by the CLI self-heal to detect missing registrations; it does not itself wire events.

managedHooks list (11): cook-after-plan-reminder, descriptive-name, dev-rules-reminder, plan-format-kanban, privacy-block, scout-block, session-init, session-state, simplify-gate, subagent-init, usage-quota-cache-refresh.

Three hook files exist under `claude/hooks/` but are **not** in `settings.json` or `managed-hooks.json` — they are opt-in, wired by the user editing `.claude/settings.json` themselves (per `claude/hooks/docs/README.md`) and/or gated by `.claude/.ck.json`: `team-context-inject.cjs`, `usage-context-awareness.cjs`, `workflow-artifact-gate.cjs`. `notifications/notify.cjs` is likewise opt-in (README: "NOT enabled by default").

---

## 1. `claude/hooks/` — top-level hook files

### `claude/hooks/session-init.cjs`
- What: SessionStart bootstrap. Detects project type/package-manager/framework, resolves active/suggested plan path, computes naming pattern, writes ~25 `CK_*` env vars to `CLAUDE_ENV_FILE` (session id, plan paths, reports/docs/plans paths, git branch/root, node/OS info, locale, validation config, coding-level). Also: one-time cleanup of orphaned `.claude/skills/.shadowed/` dirs (skill-dedup hook recovery), detects Agent Team membership by scanning `~/.claude/teams/`, prints previous session-state text on `compact`/`startup`, prints a compaction "APPROVAL STATE CHECK" warning, and injects coding-level guidelines + user assertions.
- Trigger/Event: `SessionStart`, matcher `startup|resume|clear|compact` (settings.json).
- Mechanism notes: "MITIGATION: Issue #277 — Auto-compact can bypass AskUserQuestion approval gates" — on `source === 'compact'` it prints a warning telling Claude to re-confirm any pending approval via AskUserQuestion rather than assume it was given. Fail-open crash wrapper (double try/catch) logs to `.logs/hook-log.jsonl` and always exits 0.
- Keywords: CK_* env cascade, plan resolution (`resolvePlanPath`), Agent Team detection, compaction approval-state mitigation, shadowed-skill recovery.

### `claude/hooks/usage-quota-cache-refresh.cjs`
- What: Keeps a cosmetic 5h/weekly usage-quota cache warm for the statusline. Exports `runUsageQuotaCacheRefreshHook`/`getUsageQuotaRefreshContext` for reuse by other hooks (e.g. `usage-context-awareness.cjs`).
- Trigger/Event: `SessionStart`, `UserPromptSubmit`, `PostToolUse` (matcher `Task|TaskCreate|TaskUpdate|TodoWrite`) — registered three times in settings.json.
- Mechanism notes: throttled — 5 min interval for PostToolUse-like events, 1 min for prompt/session-start-like events (`shouldFetch`). Always emits `{continue:true}` and exits 0; fetch itself has a 5s timeout.
- Keywords: cache warming, throttle intervals, statusline.

### `claude/hooks/dev-rules-reminder.cjs`
- What: Injects development-rules/session/plan context into the prompt. Core logic lives in `lib/context-builder.cjs` (`buildReminderContext`) so it's reusable by an OpenCode plugin. Uses an injection-scope reservation (`reserveInjectionScope`/`markRecentlyInjected`/`clearPendingInjection`) to avoid re-injecting the same content repeatedly within a session/cwd scope.
- Trigger/Event: `UserPromptSubmit`.
- Mechanism notes: scope key built from `baseDir` (CWD) supporting subdirectory/monorepo workflows (Issue #327). On error, rolls back the reservation so a future prompt can retry injection.
- Keywords: injection scope reservation, dedupe-per-session, context-builder shared lib.

### `claude/hooks/simplify-gate.cjs`
- What: Detects ship/commit-intent verbs in the user prompt (`ship|merge|pr|deploy|publish` = hard, `commit|finalize|release` = soft) via regex over action-prefix/action-object phrasing, with negation detection (`don't ship`, `never merge`) and a `ship on` idiom exception. If matched, computes live diff signals (`git diff --numstat HEAD` + untracked file line counts) and checks against thresholds (`locDelta:400`, `fileCount:8`, `singleFileLoc:200`, overridable via `.claude/.ck.json`/`.ck.json` `simplify.threshold`).
- Trigger/Event: `UserPromptSubmit`.
- Mechanism notes: **hard verbs → real block** — `emitHard` returns `{continue:false, decision:'block', reason}` and exits 2 (this is the one hook in the unconditional set that can actually stop the turn, not just inject context). Soft verbs only warn via `additionalContext`. Bypass: `CK_SIMPLIFY_DISABLED=1` env var, or user replying "force", or `gate.enabled:false` in config. Gate itself defaults `enabled:false` in `DEFAULTS` (must be turned on via config) even though the hook is in the managed/unconditional list.
- Keywords: ship-verb regex block, LOC/file-count thresholds, hard vs soft severity, `code-simplifier` subagent suggested as remedy.

### `claude/hooks/descriptive-name.cjs`
- What: Injects file-naming guidance (kebab-case for JS/TS/shell, snake_case for Python/Go/Rust, PascalCase for C#/Java/Kotlin/Swift; avoid generic report names like `review.md`/`report.md`/`notes.md`) before any `Write` tool call.
- Trigger/Event: `PreToolUse`, matcher `Write`.
- Mechanism notes: pure advisory injection via `hookSpecificOutput.additionalContext` with `permissionDecision:"allow"` — never blocks.
- Keywords: naming convention injection, per-language case rules.

### `claude/hooks/scout-block.cjs` (+ `scout-block/` subdir)
- What: Blocks tool access (Bash/Glob/Grep/Read/Edit/Write) to heavy directories (`node_modules`, `.git`, `dist`, `build`, `__pycache__`, etc.) using gitignore-spec pattern matching. Entry point delegates to `lib/scout-checker.cjs` (`checkScoutBlock`) for the shared decision logic, then to local formatters for Claude-specific error text.
  - `scout-block/pattern-matcher.cjs`: loads `.ckignore` baseline + optional project override, builds a matcher via a vendored `ignore` package (`scout-block/vendor/ignore.cjs`), supports negation (`!`) patterns.
  - `scout-block/path-extractor.cjs`: extracts `file_path`/`path`/`pattern` from tool_input and parses Bash command strings for path-like arguments, respecting exclude-flag semantics (`--exclude`, `--ignore`, `-x`, `find -path`, `--exclude-dir`) so excluded paths aren't flagged.
  - `scout-block/broad-pattern-detector.cjs`: separately detects overly broad glob patterns (e.g. `**` at root) that would flood context even outside blocked dirs, and suggests narrower patterns.
  - `scout-block/error-formatter.cjs`: formats the block message shown to the LLM.
- Trigger/Event: `PreToolUse`, matcher `Bash|Glob|Grep|Read|Edit|Write`.
- Mechanism notes: explicitly allows build commands (`npm build`, `cargo build`, `docker build`, `kubectl`, `terraform`, etc.) even though they may reference blocked dirs — checked via `isAllowedCommand`/`isBuildCommand`. Exit 2 blocks, exit 0 allows; JSON-parse or structure failures fail open (exit 0).
- Keywords: `.ckignore` gitignore-spec matching, broad-pattern glob detection, build-command allowlist, negation patterns.

### `claude/hooks/privacy-block.cjs`
- What: Blocks Read/access to privacy-sensitive files (`.env`, credentials, keys, tokens) unless the LLM re-requests with an `APPROVED:` path prefix after user confirmation. Core logic in `lib/privacy-checker.cjs`.
- Trigger/Event: `PreToolUse`, matcher `Bash|Glob|Grep|Read|Edit|Write` (same matcher entry as scout-block, runs second).
- Mechanism notes: emits a structured `@@PRIVACY_PROMPT_START@@ ... @@PRIVACY_PROMPT_END@@` JSON marker instructing the LLM to call `AskUserQuestion`; on approval, the LLM is told to re-access via `cat "<path>"` in Bash. Bash tool_input containing a sensitive path is **warned, not blocked** (`result.isBash` path) — deliberately allows the "Yes → bash cat" flow to proceed. Blocked case exits 2; everything else exits 0.
- Keywords: `APPROVED:` prefix retry protocol, `@@PRIVACY_PROMPT_START/END@@` marker, AskUserQuestion handoff, Bash exemption.

### `claude/hooks/plan-format-kanban.cjs`
- What: Warns (never blocks) when a `plan.md` write/edit uses a raw filename as markdown link text instead of a human-readable name (regex over `| N | [phase-01-x.md](...` table rows), and warns when a table row directly edits a Status column value instead of via `ck plan check/uncheck` CLI.
- Trigger/Event: `PostToolUse`, matcher `Edit|Write|MultiEdit`.
- Mechanism notes: only fires for paths ending in `/plan.md`. Always returns `{continue:true}` with `additionalContext` warnings appended; never blocks (advisory only).
- Keywords: kanban plan.md formatting, filename-as-link-text detection, canonical status-edit CLI reminder.

### `claude/hooks/session-state.cjs` (+ `lib/session-state-manager.cjs`)
- What: Persists/restores session progress markdown across sessions. On `PostToolUse` for Task/TaskCreate/TaskUpdate/TodoWrite, refreshes a statusline activity cache. On `Stop`/`SubagentStop`, refreshes the statusline cache and persists state via `persistState`. Also has a legacy no-event-name branch that prints previous state on plain SessionStart-like payloads (kept as a safety path if the hook were still wired to SessionStart directly).
- Trigger/Event: `PostToolUse` (matcher `Task|TaskCreate|TaskUpdate|TodoWrite`), `SubagentStop` (no matcher — every SubagentStop), `Stop` (all).
- Mechanism notes: fully fail-open; always exits 0 regardless of branch outcome or crash.
- Keywords: statusline activity cache, cross-session state persistence, legacy SessionStart safety path.

### `claude/hooks/subagent-init.cjs`
- What: Injects compact (~200 token target) context into every spawned subagent: subagent id/type/cwd, active/suggested plan + reports path, thinking/response language config, YAGNI/KISS/DRY + Python-venv rule reminders, computed naming templates for reports/plan dirs, an optional `## Plan CLI` section for plan-aware agent types (`planner`, `project-manager`, `code-simplifier`, `fullstack-developer`), optional trust-verification passphrase section, and optional per-agent-type `contextPrefix` from config (`config.subagent.agents[agentType].contextPrefix`).
- Trigger/Event: `SubagentStart` (no matcher — every subagent).
- Mechanism notes: uses `payload.cwd` (not `process.cwd()`) for git ops to support monorepo/worktree subagent spawns (Issue #327). Output uses the required `hookSpecificOutput.hookEventName:"SubagentStart"` + `additionalContext` shape.
- Keywords: SubagentStart context injection budget (~200 tokens), plan-aware agent allowlist, agent-specific config context, trust passphrase.

### `claude/hooks/usage-context-awareness.cjs`
- What: Thin legacy-named wrapper that delegates entirely to `usage-quota-cache-refresh.cjs`'s exported `runUsageQuotaCacheRefreshHook`, just under a different `isHookEnabled('usage-context-awareness')` gate/name and a different `userAgent` string.
- Trigger/Event: not registered in `settings.json`/`managed-hooks.json` — opt-in only (config-gated wrapper meant to be wired manually to whichever events the user wants).
- Mechanism notes: Comment: "Keep this hook name aligned with the config meaning: it is gated by `usage-context-awareness`." Delegates fully; no independent logic.
- Keywords: legacy alias, delegation wrapper.

### `claude/hooks/team-context-inject.cjs`
- What: For Agent-Team teammates, injects peer roster + task-status summary + a `## CK Context` block (reports/plans/project/naming/branch/active-plan from `CK_*` env vars) into the subagent's context.
- Trigger/Event: not registered by default; would be wired to `SubagentStart` if a user opts in (comment says "Fires: When a subagent is started (SubagentStart event)").
- Mechanism notes: detects team membership by parsing `agent_id` as `name@team-name` (rejects path-traversal attempts in the team-name segment: `/`, `\`, `..`); reads `~/.claude/teams/<team>/config.json` and `~/.claude/tasks/<team>/*.json`; silently exits 0 if not a team agent or no config found. Ends injected context with "Remember: Check TaskList, claim tasks, respect file ownership, use SendMessage to communicate."
- Keywords: `name@team-name` agent_id parsing, path-traversal guard, peer roster, task-status summary.

### `claude/hooks/workflow-artifact-gate.cjs` (+ `workflow-artifact-gate/` subdir)
- What: Validates a structured 5-file review-artifact bundle (`context-snippets.json`, `risk-gate.json`, `verification.json`, `review-decision.json`, `adversarial-validation.json`) produced by `ck:fix`/`ck:cook` before ship-like actions proceed. Dual-mode: hook mode (opt-in, fail-open on crash) or manual CLI mode (`node workflow-artifact-gate.cjs --stage <stage> --artifact-dir <dir> [--json]`, always validates, non-zero exit on block).
  - `workflow-artifact-gate/artifact-schema.cjs`: defines required files, `DECISIONS` set (`PASS|PASS_WITH_RISK|BLOCKED`), `CONTRACT_STATUSES` (`OK|CHANGED|BROKEN|UNKNOWN`), `MODES` set, and per-file validators (`validateContext`, `validateRiskGate`, `validateVerification`, `validateReviewDecision`, `validateAdversarial`).
  - `workflow-artifact-gate/stage-detector.cjs`: detects the workflow stage from prompt text (`detectPromptStage` — hard verbs `ship|push|deploy|publish|release|pr` vs soft `finalize|commit`, with negation exemption) or from a Bash command (`detectCommandStage`); exposes `isHardStage`/`isSoftStage` against config-defined `hardStages`/`softStages`.
  - `workflow-artifact-gate/artifact-locator.cjs`: resolves the artifact directory via a pointer file `.claude/workflow-artifacts.json` (24h recency window, `RECENT_MS`) or by scanning for harness dirs; path-traverses safely (`safeResolve` rejects null-byte injection and paths escaping cwd).
- Trigger/Event: not in `settings.json`/`managed-hooks.json` by default — README documents manual opt-in wiring to `UserPromptSubmit` and `PreToolUse` (matcher `Bash`) in the user's own settings, plus `.claude/.ck.json` `hooks.workflow-artifact-gate:true` and a `workflowArtifactGate` config block (`enabled`, `softStages`, `hardStages`, `highRiskAutoStop`).
- Mechanism notes: emergency disable via `CK_WORKFLOW_ARTIFACT_GATE_DISABLED=1` env var or config `false`. `result.status === 'block'` → `emitBlock` → `{continue:false, decision:'block'}` exit 2; `warn` or a non-hard stage → soft `additionalContext` injection; otherwise silent pass.
- Keywords: 5-file artifact bundle schema, hard/soft stage detection, pointer-file artifact location, `CK_WORKFLOW_ARTIFACT_GATE_DISABLED` kill switch.

### `claude/hooks/cook-after-plan-reminder.cjs`
- What: After the `Plan` subagent stops, prints a reminder to pause and ask the user which next step they want (implement / validate / red-team / revise / end), plus the concrete `/ck:cook <plan.md path>` command (resolved from session state's `activePlan`, falls back to a placeholder), and a note to only add `--auto` if the user explicitly asked for autonomous implementation.
- Trigger/Event: `SubagentStop`, matcher `Plan`.
- Mechanism notes: purely advisory console output; never blocks (always exit 0).
- Keywords: post-plan gate reminder, `/ck:cook --auto` opt-in framing.

### `claude/hooks/notifications/` (entry point: `notifications/notify.cjs`)
- What: Multi-provider (Telegram/Discord/Slack) notification router. Reads stdin JSON hook payload, loads env cascade (`process.env` > `~/.claude/.env` > `.claude/.env` via `lib/env-loader.cjs`), auto-detects which providers have any `<PREFIX>_*` env var set, loads `providers/{telegram,discord,slack}.cjs`, calls `provider.send(input, env)`, applies smart throttling (5-min quiet period after errors) via `lib/sender.cjs`.
- Trigger/Event: **not wired by default** — README explicitly states "Notification hooks are NOT enabled by default"; user must add `Stop`/`SubagentStop`/`Notification` entries to their own `settings.json` pointing at `notify.cjs`.
- Mechanism notes: zero external deps (native `fetch`, Node 18+); always exits 0.
- Keywords: env-cascade credential loading, per-provider auto-detection, throttle-after-error.

---

## 2. `claude/agents/` — 12 agent definitions

All agents share a "## Team Mode (when spawned as teammate)" trailer: on start, check `TaskList` and claim a task via `TaskUpdate`; read full task via `TaskGet`; respect any stated file-ownership boundary; on completion, `TaskUpdate(status:"completed")` then `SendMessage` a summary to lead; on `shutdown_request`, approve via `SendMessage(type:"shutdown_response")` unless mid-critical-operation; use `SendMessage(type:"message")` for peer coordination.

### `brainstormer.md`
- Role: "CTO-level advisor" — challenges assumptions, surfaces 2-3 alternatives, quantifies trade-offs, does not validate the user's first idea.
- Tools: Glob, Grep, Read, Bash, WebFetch, WebSearch, TaskCreate, TaskGet, TaskUpdate, TaskList, SendMessage (no Edit/Write — cannot implement).
- Distinctive: explicit "Behavioral Checklist" (assumptions challenged / alternatives surfaced / trade-offs quantified / second-order effects named / simplest option identified / decision documented) to verify before concluding. Explicitly "DO NOT implement anything." Offers to run `/ck:plan --fast` or `--hard` at the end if user agrees.

### `code-reviewer.md`
- Role: "Staff Engineer" doing production-readiness review; treats the diff as possibly AI-authored and untrusted until verified.
- Tools: Glob, Grep, Read, Bash, WebFetch, WebSearch, TaskCreate/Get/Update/List, SendMessage, **Write, Edit** (can write review reports/files but team-mode note says "Do NOT make code changes — report findings only", i.e. Edit/Write reserved for report authoring, not source edits). `memory: project`.
- Distinctive: 9-item Behavioral Checklist covering concurrency/error-boundaries/API contracts/backwards-compat/input-validation/authz/N+1/data-leaks/fact-checking; "AI-assisted code risk lens" section calling out generic helpers, defensive-paranoia catch-and-swallow, phantom tests, scope drift; explicit "Do NOT edit plan files or change task state directly — leave plan mutation to the lead, planner, or project-manager"; structured Output Format template with Critical/High/Medium/Low buckets.

### `code-simplifier.md`
- Role: simplification specialist — clarity/consistency/maintainability while preserving exact behavior; "prioritizes readable, explicit code over overly compact solutions."
- Tools: Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit, Bash, TaskCreate/Get/Update/List, SendMessage, `Task(Explore)`. `model: opus`.
- Distinctive: explicit "Maintain Balance" anti-over-simplification list (don't create clever-hard-to-understand code, don't merge concerns, don't chase fewer-lines over readability). Scope-limited to "recently modified code unless explicitly instructed" to review broader scope. Runs typecheck/linter/tests after refining if available.

### `debugger.md`
- Role: "Senior SRE" doing incident root-cause analysis — "You never guess — you prove."
- Tools: Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit, Bash, WebFetch, WebSearch, TaskCreate/Get/Update/List, SendMessage, `Task(Explore)`. `model: sonnet`, `memory: project`.
- Distinctive: 8-item Behavioral Checklist (evidence-first, 2-3 competing hypotheses, systematic elimination, timeline construction, environmental-factor check, root cause with evidence chain not "probably", recurrence prevention). Uses `psql`, `gh` for CI logs, `repomix` for codebase summaries. "Sacrifice grammar for concision" instruction. Has Memory Maintenance section (keep MEMORY.md <200 lines).

### `docs-manager.md`
- Role: "Technical Writer" — "stale docs are worse than no docs"; verify-before-document discipline.
- Tools: Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit, Bash, WebFetch, WebSearch, TaskCreate/Get/Update/List, SendMessage, `Task(Explore)`. `model: haiku`.
- Distinctive: "Size Limit Management" section — target `docs.maxLoc` (default 800 LOC), proactive splitting strategy into `docs/{topic}/index.md` + subtopic files when nearing the limit. "Documentation Accuracy Protocol" — evidence-based writing (grep-verify functions/classes/endpoints before documenting), "Red Flags (Stop & Verify)" list, self-validation via `node .claude/scripts/validate-docs.cjs docs/`. Maintains `codebase-summary.md`, `project-overview-pdr.md`, `code-standards.md`, `system-architecture.md`.

### `fullstack-developer.md`
- Role: "Senior Full-Stack Engineer" executing implementation phases from parallel plans — "writes production-grade code on first pass, not prototypes."
- Tools: Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit, Bash, WebFetch, WebSearch, TaskCreate/Get/Update/List, SendMessage, `Task(Explore)`. `model: sonnet`.
- Distinctive: 8-item Behavioral Checklist (error handling, input validation, no buried TODO, clean interfaces, **file ownership respected**, tests added, type safety, build passes). "File Ownership Rules (CRITICAL)" — NEVER modify files outside the phase's declared ownership list; STOP and report immediately on conflict. Designed for `/ck:plan --parallel` output — explicitly for concurrent multi-agent phase execution with conflict prevention.

### `git-manager.md`
- Role: "Git Operations Specialist" — extremely terse: "Execute workflow in EXACTLY 2-4 tool calls. No exploration phase."
- Tools: Glob, Grep, Read, Bash, TaskCreate/Get/Update/List, SendMessage (no Edit/Write). `model: haiku`.
- Distinctive: shortest agent file by far (19 lines); delegates to the `git` skill; team-mode note explicitly restricts to "only perform git operations explicitly requested — no unsolicited pushes or force operations."

### `journal-writer.md`
- Role: "Engineering diarist" — brutally honest incident/failure journal entries "for the future developer who inherits this mess at 2am."
- Tools: Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit, Bash, TaskCreate/Get/Update/List, SendMessage (no WebFetch/WebSearch). `model: haiku`.
- Distinctive: fixed journal template (What Happened / The Brutal Truth / Technical Details / What We Tried / Root Cause Analysis / Lessons Learned / Next Steps) written to `./docs/journals/`; explicit "Quality Standards" (200-500 words, ≥1 concrete technical detail, must create the file immediately not just describe it); example emotional-expression phrasebank; triggered by repeated test failure, critical bugs, failed migrations, security vulns, etc. Team-mode restricts to journal files only.

### `planner.md`
- Role: "Tech Lead" locking architecture before code — "No phase gets approved until its failure modes are named and mitigated."
- Tools: Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit, Bash, WebFetch, WebSearch, TaskCreate/Get/Update/List, SendMessage, `Task(Explore)`, `Task(researcher)`. `model: opus`, `memory: project`.
- Distinctive: 8-item plan-quality checklist + separate 5-item "Verification Discipline" (re-grep don't copy stale scout output; cite `file:line` or tag `[UNVERIFIED]`; trace don't assume control flow; enumerate every caller if >10 list first 10 + total count; check struct lifetime before adding shared state). References `skills/ck-plan/references/verification-roles.md` auto-loaded during validate/red-team. Mandatory YAML frontmatter schema for `plan.md` (`title/description/status/priority/effort/branch/tags/created`). Plan-folder naming resolution driven by injected `## Naming`/`## Plan Context` hook sections; after creating a plan, must run `node .claude/scripts/set-active-plan.cjs {plan-dir}` to update session state for subagents. Explicitly does not start implementation itself.

### `project-manager.md`
- Role: "Engineering Manager" tracking delivery "with data, not feelings" — measures by completed tasks/passing tests, not effort/intent.
- Tools: Glob, Grep, LS, Read, Edit, MultiEdit, Write, NotebookEdit, WebFetch, TaskCreate/Get/Update/List, WebSearch, BashOutput, KillBash, ListMcpResourcesTool, ReadMcpResourceTool, SendMessage (notably **no Bash**, but has BashOutput/KillBash — can inspect/kill background bash but not launch new commands). `model: haiku`.
- Distinctive: shortest checklist-driven agent (5 items: progress-vs-plan, blockers flagged >1 session stalled, scope changes logged, risks updated, next actions have owner+DoD). "Ask the main agent to complete implementation plan and unfinished tasks. Emphasize how important it is to finish the plan!" — explicit escalation instruction.

### `researcher.md`
- Role: "Technical Analyst" — "evaluates, not just finds"; every recommendation ranked with source credibility, trade-offs, adoption risk, architectural fit.
- Tools: Glob, Grep, Read, Bash, WebFetch, WebSearch, TaskCreate/Get/Update/List, SendMessage (no Edit/Write in frontmatter tools list — pure research role; but Report Output section implies writing report files via the general write path, likely inherited). `model: haiku`, `memory: user` (only agent with user-scoped memory rather than project-scoped).
- Distinctive: 7-item checklist requiring ≥3 independent sources, source-credibility weighting (official docs/maintainer blogs/production case studies > tutorials), explicit "concrete recommendation made — research ends with a ranked choice, not a list of options." "Be honest, be brutal, straight to the point, and be concise."

### `tester.md`
- Role: "QA Lead" — hunts untested paths/coverage gaps/edge cases; "thinks like someone who has been burned by production incidents caused by insufficient testing."
- Tools: Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit, Bash, WebFetch, WebSearch, TaskCreate/Get/Update/List, SendMessage, `Task(Explore)`. `model: haiku`, `memory: project`.
- Distinctive: "Diff-Aware Mode (Default)" — maps changed files to tests via 5 prioritized strategies (co-located / mirror-dir / import-graph grep / config-change-triggers-full-suite / high-fan-out-module-triggers-full-suite), with named auto-escalation rules to `--full` (config/infra changed, >70% of tests mapped, explicit flag). Flags changed code with **no** tests found rather than skipping silently. "Never ignore failing tests just to pass the build."

### `ui-ux-designer.md`
- Role: elite UI/UX designer — explicitly told to imagine itself an award-winning Dribbble/Behance/Awwwards/Mobbin/TheFWA designer.
- Tools: Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit, Bash, WebFetch, WebSearch, TaskCreate/Get/Update/List, SendMessage, `Task(Explore)`, `Task(researcher)`. `model: inherit`.
- Distinctive: mandatory strict skill-activation order (`ui-ux-pro-max` always first, then `frontend-design`, `web-design-guidelines`, `react-best-practices`, `web-frameworks`, `ui-styling`) with concrete `python3 .../search.py` invocation examples before any design work. Heavy Vietnamese-typography requirement (Google Fonts must explicitly support Vietnamese diacritics, cross-language font pairing). Delegates parallel research to up to 2 `researcher` agents. Maintains `./docs/design-guidelines.md` as living design-system doc.

---

## 3. `claude/rules/` — shipped rule files (loaded by the always-on `claude/rules/CLAUDE.md` contract)

### `claude/rules/CLAUDE.md`
- Always-loaded contract; kept intentionally short, points to the other rule files as on-demand references only.
- Establishes: show reasoning behind any decision presented to the user *before* asking them to choose; read README + docs before implementing; never edit `~/.claude/skills` unless explicitly asked; preserve secrets/never bypass privacy hooks.
- Defines the privacy-block hook response contract (parse `@@PRIVACY_PROMPT_START/END@@` JSON, use `AskUserQuestion`) and the skill-venv path convention.

### `claude/rules/development-rules.md`
- Follow existing docs/patterns; YAGNI > KISS > DRY priority order; no fake data/mocks/shortcuts to pass checks.
- Run narrowest test first then broaden; never hide failing tests/lint/type/build errors; preserve public contracts unless scope explicitly changes them.
- Conventional commit format, no AI references in commits; never commit secrets/dotenv/tokens/keys.

### `claude/rules/documentation-management.md`
- Update docs only for user-visible/behavioral/architectural/security-relevant changes — not for purely internal edits.
- Fixed plan directory layout: `plans/<slug>/{plan.md, phase-NN-<name>.md, reports/}`; `plan.md` kept short (status/phases/dependencies/acceptance criteria/links only).
- Read existing doc before updating; verify dates/links/claims match the actual change after updating.

### `claude/rules/orchestration-protocol.md`
- Every subagent prompt must include: task, files to read, files it may modify, acceptance criteria, constraints, work-context path, reports path.
- Context isolation: never pass full conversation history to a subagent; summarize only what's needed; give exact file paths instead of "look around"; keep merge decisions/user approvals in the controller session.
- Parallel work only when file ownership is clear and integration points known — avoid parallel edits to the same file/artifact/migration/shared config.
- Mandates a fixed subagent sign-off format: `Status: DONE|DONE_WITH_CONCERNS|BLOCKED|NEEDS_CONTEXT` + `Summary` + optional `Concerns/Blockers`; instructs the caller not to retry a failing prompt unchanged on `BLOCKED`/`NEEDS_CONTEXT`.

### `claude/rules/primary-workflow.md`
- 4-stage workflow shape: Understand (read before planning, clarify only what the repo can't answer, plan.md for broad/risky work) → Implement (prefer editing existing files, keep behavior-compatible, prove bug cause before fixing) → Verify (narrowest test first, broaden on shared-contract changes, fix regressions not weaken tests) → Review and Explain (reviewer/skill for high-risk changes, update docs only when user-facing behavior changed).

### `claude/rules/review-audit-self-decision.md`
- Verified decisions (backed by source/tests/empirical check) are not reversed on an abstract audit concern alone — only on new evidence or changed context; state the verification source when rejecting a concern.
- User decisions (thresholds, libraries, scope, schema, pricing, timelines, compliance, UX trade-offs) are never silently undone; an audit wanting to reverse one must be presented as decision/concern/trade-off/options and wait for the user.
- Threat-model discipline: identify what code actually stores/protects/exposes before applying a security finding; document non-issues briefly; ask when risk is plausible but depends on product intent.
- "Scout first" — read the repo before asking, ask only on conflicting evidence/missing context/business judgment/high reversibility risk.
- Never embed plan IDs/phase numbers/audit labels/finding codes in code comments, migration names, test names, or commit messages — explain the invariant/behavior directly instead.

Note: these five rule files are near-verbatim identical in content/structure to the user's own global `~/.claude/rules/*.md` files loaded in this session — the local global config appears derived from this upstream repo's shipped rules.

---

## 4. `.claude/rules/quality-gates.md` (repo-maintainer-only, NOT shipped to end users)

Rules for claudekit-engineer's own contributors/CI, distinct from the `claude/rules/` files shipped to consuming projects.

- **Metadata deletions (mandatory):** renaming/deleting any file under `claude/` (skills/hooks/agents/scripts) requires adding the old relative path to `claude/metadata.json` `deletions[]`, so the CLI installer removes stale files from user machines on upgrade.
- **Skill registry contract:** canonical skill names come from each `claude/skills/*/SKILL.md` frontmatter `name:` field; cross-references must use the exact registered name with `/ck:` prefix; check for collisions with Claude Code built-ins (`/help`, `/clear`, `/debug`, `/plan`, `/compact`, `/review`, `/search`) before adding a new skill name.
- **Skill cross-reference integrity (CI-enforced):** `scripts/check-skill-cross-refs.js` builds a registry from frontmatter `name:` (stripping the `ck:` prefix) and checks every `/ck:` reference in `claude/**/*.md` resolves — directory name ≠ registered name is the classic failure mode (table of examples given).
- **Skill routing coverage (CI-enforced):** `scripts/check-skill-routing.js` requires every shipped skill be reachable from `skill-domain-routing.md` or `skill-workflow-routing.md`, or explicitly justified in `scripts/skill-routing-allowlist.json` (min 20-char justification, enforced by `scripts/lib/validate-allowlist-reason.js`). States a named principle ("audit-route-reframe"): dormant-by-telemetry ≠ zero value; audit unique capability → fix routing → reframe description before deleting.
- **Skill description/listing policy (CI-enforced):** `scripts/check-skill-descriptions.js` runs a rule table (major/minor severity) against SKILL.md frontmatter — blocks on maintainer-only markers left in shipped skills, TODO/FIXME/WIP markers, missing `user-invocable: true`, `disable-model-invocation: true`, missing skill-listing-budget settings, oversized `skillListingMaxDescChars`, or `skillOverrides` present. `claude/scripts/validate-skill-frontmatter.py` is the separate blocking frontmatter-contract check.
- **Statusline changes:** any `statusline*.cjs`/`statusline-*.cjs` change must update snapshot tests across config variants (minimal/full/custom lines/no quota/1M context window), explicitly including ANSI escapes and NBSP characters.

---

## Unresolved / notable observations (no porting judgment implied)

- `simplify-gate.cjs` is in the unconditional `managed-hooks.json` list and wired to `UserPromptSubmit` in `settings.json`, but its own `DEFAULTS.gate.enabled` is `false` — so out of the box it is a no-op until a project's `.ck.json` turns `simplify.gate.enabled:true` on.
- Three hooks (`team-context-inject`, `usage-context-awareness`, `workflow-artifact-gate`) and the whole `notifications/` subsystem exist as fully-built `.cjs` files shipped in the repo but require manual `settings.json` wiring by the consuming project — they are present in the tree but dormant unless explicitly opted in.
- `claude/hooks/lib/` contains additional shared infra not separately inventoried above per the task's file list (only referenced as dependencies of the top-level hooks): `ck-config-utils.cjs` (isHookEnabled/loadConfig/env-writing), `hook-logger.cjs` (timer + crash logging to `.logs/hook-log.jsonl`), `context-builder.cjs`, `privacy-checker.cjs`, `scout-checker.cjs`, `project-detector.cjs`, `session-state-manager.cjs`, `usage-limits-cache.cjs`, plus statusline-rendering helpers.

Status: DONE — wrote report
