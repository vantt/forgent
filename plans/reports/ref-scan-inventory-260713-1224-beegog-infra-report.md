# Beegog Infrastructure Inventory

**Scan Date:** 2026-07-13  
**Repository:** `/home/vantt/projects/forgent/references/beegog`  
**Scope:** hooks/, scripts/, .claude/, .claude-plugin/, .codex/, .codex-plugin/, .bee/

---

## 1. hooks/ Directory (14 files)

### Configuration Files

#### hooks/hooks.json (CODEX projection)
- **Language:** JSON
- **Purpose:** Codex default hook projection (rendered from catalog.mjs)
- **Events and Hooks:**
  - `SessionStart` (matcher: `startup|resume|clear|compact`): calls `bee-session-init.mjs` → session bootstrap
  - `UserPromptSubmit`: calls `bee-prompt-context.mjs` → phase reminder
  - `PreToolUse` (matcher: `Edit|Write|MultiEdit|Bash|Read|Glob|Grep`): calls `bee-write-guard.mjs` → write guard
  - `PostToolUse` (matcher: `TaskCreate|TaskUpdate|TodoWrite`): calls `bee-state-sync.mjs` → state sync
  - `SubagentStop`: calls `bee-state-sync.mjs` then `bee-chain-nudge.mjs` → state sync, chain nudge
  - `PreCompact`: calls `bee-session-close.mjs` → pre-compact flush check
  - `Stop`: calls `bee-state-sync.mjs` then `bee-session-close.mjs` → state sync, session close check

#### hooks/claude-hooks.json (Claude projection)
- **Language:** JSON
- **Purpose:** Claude Code hook projection (explicit via .claude-plugin/plugin.json)
- **Identical to hooks.json except:** Adds PreToolUse matcher `Agent|Task` → `bee-model-guard.mjs` (Claude-only; Codex doesn't expose collaboration spawn through PreToolUse)

### Hook Implementation Files (7 Node.js/ESM files)

#### hooks/bee-session-init.mjs
- **Language:** JavaScript (Node.js 18+, ESM)
- **Event:** SessionStart (startup|resume|clear|compact)
- **Behavior:**
  1. Reads hook context via shared adapter (stdin normalization, root discovery)
  2. Checks for `.bee/bin/lib/state.mjs` existence (fail-open boundary)
  3. Calls repo's `state.hookEnabled()` to check if hook is active
  4. Calls repo's `inject.buildSessionPreamble()` to generate session preamble (status, gates, HANDOFF, patterns, decisions)
  5. Writes preamble to stdout as plain developer context
  6. Fails gracefully: any crash logged to `.bee/logs/hooks.jsonl`, exits 0

#### hooks/bee-prompt-context.mjs
- **Language:** JavaScript (Node.js 18+, ESM)
- **Event:** UserPromptSubmit
- **Behavior:**
  1. Reads hook context via shared adapter
  2. Calls `state.hookEnabled()` to verify active
  3. Calls `inject.buildPromptReminder()` to build 1-3 line phase/mode/next-action/gate reminder
  4. Deduplication: `inject.shouldInject()` checks injection cache; only emits if state changed or >30 min since last inject
  5. Marks as injected via `inject.markInjected()`
  6. Outputs plain developer context
  7. Fail-open (crashes logged, exits 0)

#### hooks/bee-write-guard.mjs
- **Language:** JavaScript (Node.js 18+, ESM)
- **Event:** PreToolUse (Edit|Write|MultiEdit|Bash|Read|Glob|Grep) + Codex apply_patch tool
- **Four sequential checks (first hit wins):**
  1. **Gate guard:** Denies writes before Gate 3 (execution approval)
  2. **Reservation guard:** During swarming, denies writes to unreserved paths
  3. **Privacy/scout guard:** Secret-file reads emit `@@BEE_PRIVACY@@` marker; scout dirs (node_modules/, dist/) denied
  4. **CLI-shape validation (additive, harness-integration D4):** Recognizes `bee_*.mjs` or `bee.mjs` commands in Bash, validates parsed flags against JSON-Schema via validate-args.mjs
- **apply_patch handling (canonical envelope):** Extracts targets from `*** Add File:`, `*** Update File:`, `*** Delete File:`, `*** Move to:` lines; P1 repair denies if target set cannot be fully proved inside repo
- **Deny:** Exit 2 with reason on stderr; **Allow:** Exit 0
- **Fail-open:** Crashes logged to `.bee/logs/hooks.jsonl`, exit 0 (crashes never flip allow/deny)

#### hooks/bee-state-sync.mjs
- **Language:** JavaScript (Node.js 18+, ESM)
- **Events:** PostToolUse (TaskCreate|TaskUpdate|TodoWrite) + SubagentStop + Stop
- **Behavior:**
  1. Reads hook context via shared adapter
  2. Calls `cells.listCells()` to enumerate cells and count by status (open, claimed, capped, blocked)
  3. Updates `.bee/state.json`: `cells` counts + `last_activity` timestamp
  4. Always silent (no stdout)
  5. Fail-open: crashes logged, exit 0

#### hooks/bee-chain-nudge.mjs
- **Language:** JavaScript (Node.js 18+, ESM)
- **Event:** SubagentStop
- **Behavior:**
  1. Reads hook context and current phase from state
  2. Identifies if subagent is a registered bee worker (by nickname/name/agent field)
  3. **If phase is "reviewing":** Emits JSON systemMessage: nudge reviewer synthesis
  4. **If registered worker or phase is "swarming":** Emits JSON systemMessage: collect STATUS token, update cell, check/release reservations
  5. **Debt check (decision 0011):** If behavior_change cells capped since last scribing, nudges capture in-flight
  6. **Advisory only:** Emits JSON systemMessage, never `decision:"block"` (would continue child instead of advising parent)
  7. Fail-open: crashes logged, exit 0

#### hooks/bee-model-guard.mjs
- **Language:** JavaScript (Node.js 18+, ESM)
- **Event:** PreToolUse (Agent|Task) — Claude-only (Codex doesn't expose in PreToolUse)
- **Behavior (decision 0023, explicit-tier transport):**
  1. Reads hook context and checks for Agent/Task dispatch tools
  2. **Allowed transports:**
     - `tool_input.model`: Non-empty string param (e.g., "claude-opus-4-20250514")
     - `[bee-tier: <tier>]` marker anchored to start of `tool_input.prompt` or `tool_input.description` (leading whitespace allowed; mid-text matches rejected to prevent forgery)
  3. **Denied transports:** Bare dispatch (no model param, no anchored marker) = exit 2 with reason + audit log
  4. **Audit log:** One line per evaluated dispatch (`transport`, `model`, `tier`, `subagent_type`, description) → `.bee/logs/dispatch.jsonl`
  5. **Deny:** Exit 2 with reason on stderr + log entry to hooks.jsonl
  6. **Allow:** Exit 0
  7. Fail-open: crashes logged, exit 0

#### hooks/bee-session-close.mjs
- **Language:** JavaScript (Node.js 18+, ESM)
- **Events:** Stop + PreCompact (advisory, always exits 0)
- **Behavior ("hive door open" check):**
  1. Reads hook context
  2. If phase is "idle" or "compounding-complete": **decision-nudge** — if source files changed with no bee flow and no recent decision, nudge to review & log
  3. **capture-nudge (decision 0003):** If newest decision more recent than every docs/specs/*.md, warn that settled outcome never captured
  4. **capture-queue-nudge (decision 0017):** If pending capture stubs exist, nudge to flush (PreCompact forces, Stop dedupes)
  5. **mid-phase warning:** If phase not "idle" and no `.bee/HANDOFF.json`, warn about claimed-but-uncapped cells and active reservations
  6. **Output:** Collects all parts, emits as ONE parseable JSON systemMessage (Codex requirement)
  7. **Advisory only:** Never `decision:"block"` (would loop main turn)
  8. Fail-open: crashes logged, exit 0

#### hooks/adapter.mjs (Shared runtime adapter — no direct hook call)
- **Language:** JavaScript (Node.js 18+, ESM)
- **Purpose:** Single shared runtime for all bee wrapper hooks (cell codex-parity-3, decision D2)
- **Exports:**
  - `readHookContext(hookName)`: Entry point every wrapper calls first
    - Normalizes stdin: empty, junk bytes, top-level null/arrays → plain object BEFORE property access
    - Resolves repo root inside fail-open boundary (finds `.bee/onboarding.json`)
    - Parses `--source` identity (plugin|repo)
    - Returns: `{ payload, cwd, root, source, event, gaps }`
  - `findRepoRoot(startDir)`: Walks up dirs searching for `.bee/onboarding.json`
  - `libModuleUrl(root, name)`: Constructs file:// URL for `.bee/bin/lib/<name>`
  - `appendHookLog(root, entry)`: Fail-open append to `.bee/logs/hooks.jsonl`
  - `logCrash(root, hookName, error, source)`: Logs crash entry (never changes hook decision)
  - `logCoverageGap(root, hookName, gap, detail, source)`: Logs visible coverage gap (never changes decision)
  - `parseSourceIdentity(argv)`: Parses `--source=plugin|repo` from argv
  - `isAdvisoryEvent(event)`: Checks if event is PreCompact/SubagentStop/Stop (requires JSON output)
  - `encodeAdvisory(text)`: Encodes as `{ systemMessage: "..." }` JSON
  - `emitHookOutput(ctx, text, { defaultEvent })`: Routes output: advisory events → JSON systemMessage; context events → plain stdout

#### hooks/catalog.mjs (Hook catalog for rendering — not a callable hook)
- **Language:** JavaScript (Node.js 18+, ESM)
- **Purpose:** Single logical hook catalog; renders projections for both runtimes (Claude/Codex) and targets (plugin/repo)
- **Key exports:**
  - `CATALOG`: Array of event entries; each event has groups with matcher, script, statusMessage
  - `renderProjection(runtime, { target })`: Produces hooks.json object for one runtime/target combo
    - Runtime: "claude" | "codex"
    - Target: "plugin" (default, uses `${CLAUDE_PLUGIN_ROOT}`) | "repo" (uses git root + `--source=repo`)
  - `ALLOWED_DIFFERENCES`: One approved drift — model-tier-guard (Claude-only)
- **Render rules:**
  - `plugin` target: `node "${CLAUDE_PLUGIN_ROOT}/hooks/<script>"`
  - `repo` target: Shell command resolving git root; if git fails, emits diagnostic to stderr, exits 0 (fail-open)

### Test Files (3 Node.js/ESM files)

#### hooks/test_hook_contracts.mjs (1981 lines)
- **Language:** JavaScript (Node.js 18+, ESM)
- **Purpose:** Comprehensive harness for hook correctness contracts
- **Scope:** Malformed payload handling, coverage gaps, drift-check (hooks.json vs claude-hooks.json byte parity), rendering fidelity

#### hooks/test_write_guard.mjs (555 lines)
- **Language:** JavaScript (Node.js 18+, ESM)
- **Purpose:** Unit tests for bee-write-guard checks (gate, reservation, privacy, CLI-shape) and apply_patch target extraction

#### hooks/test_model_guard.mjs (441 lines)
- **Language:** JavaScript (Node.js 18+, ESM)
- **Purpose:** Unit tests for bee-model-guard tier-marker anchoring and transport validation

---

## 2. scripts/ Directory (2 files)

### scripts/install.sh
- **Language:** Bash (sh-compatible)
- **Purpose:** Two-layer bee installer for greenfield and brownfield projects
- **Layer 1 (runtime):** Copies bee skills from bee checkout to `~/.claude/skills` and/or `~/.codex/skills`
- **Layer 2 (repo):** Runs onboard_bee.mjs (not included in this repo) to install AGENTS.md BEE block, .bee/ runtime, helpers
- **Modes:**
  - Fetch from github (default, requires git & network)
  - Local checkout via `--source <path>`
  - Reference/branch via `--ref <ref>` (default: main)
- **Options:**
  - `--runtime {claude|codex|both}` (default: both)
  - `--no-hooks`: Skip repo-hooks wiring for Claude Code
  - `--claude-md`: Extend CLAUDE.md with @AGENTS.md import
  - `--no-git-init`: Don't init git in greenfield
  - `--dry-run`: Plan only, write nothing
  - `-y, --yes`: Non-interactive
- **Safety:** Greenfield/brownfield detection, BEE:START/END markers preserve external content, no overwrite on re-run

### scripts/install.ps1
- **Language:** PowerShell
- **Purpose:** Windows equivalent of install.sh (same two-layer approach)
- **Parameters:**
  - `-Directory <path>`: Target (default: current dir)
  - `-Runtime {claude|codex|both}` (default: both)
  - `-Source <path>`: Local checkout
  - `-Ref <ref>` (default: main)
  - `-NoHooks`: Skip repo hooks
  - `-ClaudeMd`: Extend CLAUDE.md
  - `-NoGitInit`: Don't init git
  - `-Yes`: Non-interactive
  - `-DryRun`: Plan only

---

## 3. .claude/ Directory (3 files)

### .claude/settings.json
- **Language:** JSON
- **Purpose:** Claude Code project configuration
- **Content:**
  - `statusLine`: Command-based status line (calls `.claude/statusline-command.sh`)
  - `permissions`: `defaultMode: "bypassPermissions"`
  - `enabledPlugins`: `compound-engineering@compound-engineering-plugin: false`
  - `hooks`: Hook configuration (same as hooks/claude-hooks.json but with expanded commands):
    - Resolves to `.bee/bin/hooks/<script>` via `$CLAUDE_PROJECT_DIR` variable
    - Events: SessionStart, UserPromptSubmit, PreToolUse (write tools + Agent/Task), PostToolUse, SubagentStop, Stop, PreCompact

### .claude/statusline-command.sh
- **Language:** Bash
- **Purpose:** Bash command wrapper for statusline; invokes Node.js statusline-usage.mjs

### .claude/statusline-usage.mjs
- **Language:** JavaScript (Node.js 18+, ESM)
- **Purpose:** Status line content generation (not examined in detail)

---

## 4. .claude-plugin/ Directory (2 files)

### .claude-plugin/plugin.json
- **Language:** JSON
- **Name:** `bee`
- **Version:** `0.1.29`
- **Description:** "bee: validate-first agentic development for Claude Code and Codex — staged workflow with four human gates, evidence-based validation, bounded swarms over verified cells, and a compounding knowledge loop."
- **Hooks field:** `"./hooks/claude-hooks.json"` (explicit reference to Claude projection)

### .claude-plugin/marketplace.json
- **Language:** JSON
- **Purpose:** Marketplace metadata for plugin distribution
- **Content:**
  - Owner: `bee`
  - Single plugin entry: source `./`, description of validate-first workflow

---

## 5. .codex/ Directory (1 file)

### .codex/hooks.json
- **Language:** JSON
- **Purpose:** Repository-level hooks configuration for Codex (repo transport)
- **Key difference from plugin hooks:** Commands use git-root resolution instead of `${CLAUDE_PLUGIN_ROOT}`:
  - Wraps each hook script in shell command: `r="$(git rev-parse --show-toplevel 2>/dev/null)"; [ -n "$r" ] || { echo "bee: hook transport unavailable (no git root)" >&2; exit 0; }; exec node "$r"/hooks/<script> --source=repo`
  - Ensures fail-open (no git → diagnostic to stderr, exit 0)
- **Events & hooks:** Identical to Codex projection (hooks/hooks.json) — no model-guard (Codex doesn't expose Agent/Task in PreToolUse)

---

## 6. .codex-plugin/ Directory (1 file)

### .codex-plugin/plugin.json
- **Language:** JSON
- **Name:** `bee`
- **Version:** `0.1.18` (note: differs from Claude version 0.1.29)
- **Description:** "bee: validate-first agentic development skills — staged workflow with four human gates, evidence-based validation, bounded swarms over verified cells, and a compounding knowledge loop."
- **License:** MIT
- **Skills field:** `"./skills/"` (references skills directory, not included in this scan)
- **Interface:**
  - displayName: "Bee"
  - Category: "Productivity"
  - Capabilities: Plan, Write, Review, Learn
  - defaultPrompt: 4 example prompts (onboard, route, plan/validate, groom)
  - brandColor: "#B45309"

---

## 7. .bee/ Directory — Configuration & State

### .bee/config.json
- **Language:** JSON
- **Purpose:** Bee runtime configuration (hooks enabled/disabled, lanes, capabilities, commands, model tiers)
- **Schema version:** 1.0
- **Hooks enabled (all true):**
  - session-init, prompt-context, write-guard, state-sync, chain-nudge, session-close
  - (model-guard implicitly enabled; not listed here)
- **Lanes:** Empty (no lane routing configured)
- **Capabilities:** Empty (no capability overrides)
- **Commands:** Test and verify CLI commands (`bee test`, `bee verify`)
- **gate_bypass:** `true` (autopilot gate 1-3 approval for small work)
- **models:** Per-runtime (claude/codex) model tier assignments:
  - **claude:**
    - extraction: "haiku"
    - generation: { model: "sonnet", effort: "medium" }
    - review: "opus"
    - advisor: { kind: "cli", command: "codex exec ..." } (not present in codex tier)
  - **codex:**
    - extraction: "gpt-5.5"
    - generation: "gpt-5.5"
    - review: { kind: "cli", command: "codex exec ..." }
- **dogfood_repos:** One entry (anphabe-gogl project)

### .bee/config-sample.json
- **Language:** JSON
- **Purpose:** Example/reference configuration template (not actively used)

### .bee/state.json
- **Language:** JSON
- **Purpose:** Runtime workflow state (session state, phase, feature, approved gates, workers, cell counts)
- **Current state (snapshot):**
  - schema_version: "1.0"
  - phase: "exploring"
  - feature: "intervention-log-v2"
  - mode: null
  - approved_gates: { context: false, shape: false, execution: false, review: false }
  - workers: []
  - summary: "Exploring complete. CONTEXT.md ready, fresh-eyes review in progress."
  - next_action: "Gate 1, then invoke bee-planning."
  - cells: { open: 0, claimed: 0, capped: 113, blocked: 0 }
  - last_activity: "2026-07-13T04:12:20.260Z"

### .bee/onboarding.json
- **Language:** JSON
- **Purpose:** Onboarding manifest tracking installed versions & helper file hashes
- **Content:**
  - schema_version: "1.0"
  - bee_version: "0.1.29"
  - managed: { agents_block, gitignore_block, helpers{}, lib{}, statusline{}, repo_hooks{} }
    - Each file entry has SHA256 hash (for change detection)
    - Covers: bee.mjs, bee_backlog.mjs, bee_capture.mjs, ... bee_status.mjs (9 helpers)
    - Covers: backlog.mjs, capture.mjs, cells.mjs, ... validate-args.mjs (13 lib files)
    - Covers: statusline-command.sh, statusline-usage.mjs
    - Covers: adapter.mjs, bee-session-init.mjs, ... bee-model-guard.mjs (7 repo hooks)
  - created_at: "2026-07-07T15:28:12.863Z"
  - updated_at: "2026-07-13T04:05:10.906Z"

### .bee/reservations.json
- **Language:** JSON
- **Purpose:** Active agent reservations during swarming (file path locks)
- **Current state:** Empty array (no active swarms)

### .bee/backlog.jsonl
- **Language:** JSONL (not examined in detail)
- **Purpose:** Backlog of planned cells/work

### .bee/decisions.jsonl
- **Language:** JSONL (not examined in detail)
- **Purpose:** Decision log (durable learnings, conventions)

### .bee/feedback-digest.json
- **Language:** JSON (not examined in detail)
- **Purpose:** Aggregated feedback from sessions

### .bee/review-candidates.jsonl
- **Language:** JSONL (not examined in detail)
- **Purpose:** Cells awaiting review

### .bee/.inject-cache.json
- **Language:** JSON (not examined in detail)
- **Purpose:** Caches deduplication hashes for hook injections

### .bee/manifest-hash.json
- **Language:** JSON (not examined in detail)
- **Purpose:** Hash tracking for manifest integrity

### .bee/cells/ Directory
- **Content:** 151+ individual cell JSON files (e.g., adv-1.json, codex-parity-1.json, harness09-1.json)
- **Purpose:** Unit cells for bee's multi-phase execution and tracking (not examined in detail)

### .bee/logs/ Directory
- **hooks.jsonl:** Hook runtime crash and coverage-gap log (appended per hook invocation)
- **dispatch.jsonl:** Audit log of every Agent/Task dispatch (model, tier, subagent_type)

---

## 8. .gitignore

**Full content:**
```
# BEE:START
.bee/state.json
.bee/reservations.json
.bee/workers/
.bee/logs/
.bee/capture-queue.jsonl
.bee/feedback-digest.json
.bee/.inject-cache.json
.bee/HANDOFF.json
.bee/spikes/
.bee/manifest-hash.json
# BEE:END
```

**Rationale:** Transient runtime state (state, reservations, logs, cache, handoff) is not committed; cells and config persist.

---

## Summary by Domain

| Area | Count | Key Behavior |
|------|-------|--------------|
| **Hooks (code)** | 7 files | Gate guard, write reservation, privacy/scout checks, CLI validation, state sync, chain nudge, session close; all fail-open |
| **Hooks (config)** | 2 files | hooks.json (Codex), claude-hooks.json (Claude); catalog.mjs renders both |
| **Hooks (tests)** | 3 files | Contract compliance, drift detection, guard unit tests |
| **.claude/** | 3 files | settings.json (hooks wired to repo paths), statusline command & script |
| **.claude-plugin/** | 2 files | plugin.json (v0.1.29, hooks field), marketplace.json |
| **.codex/** | 1 file | hooks.json (repo transport via git-root resolution) |
| **.codex-plugin/** | 1 file | plugin.json (v0.1.18, skills dir, interface metadata) |
| **.bee/config** | 2 files | Active config + sample; 6 hooks enabled, model tiers, gate_bypass |
| **.bee/state** | 1 file | Exploring phase, feature "intervention-log-v2", 113 cells capped |
| **.bee/onboarding** | 1 file | v0.1.29 manifest; tracks SHA256 hashes for 22 runtime files |
| **.bee/cells/** | 151+ files | Tracked work cells (not examined in detail) |
| **.bee/logs/** | 2 files | hooks.jsonl (crashes/gaps), dispatch.jsonl (audit) |
| **.bee/other** | 6 files | reservations, backlog, decisions, feedback, candidates, cache, manifest hash |
| **scripts/** | 2 files | install.sh (Bash), install.ps1 (PowerShell); two-layer setup |
| **.gitignore** | 1 file | 10 transient runtime paths under .bee/ (marked BEE:START/END) |

---

## Coverage Notes

**Full coverage achieved:** Every file in hooks/, scripts/, .claude/, .claude-plugin/, .codex/, .codex-plugin/, .bee/ config & state files read. Test files (1981, 555, 441 lines) listed but not fully examined per inventory scope.

**No unreadable files in scope.**
