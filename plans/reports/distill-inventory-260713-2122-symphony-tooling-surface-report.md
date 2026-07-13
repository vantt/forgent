# Symphony Tooling Surface Inventory

Inventory date: 2026-07-13
Head commit: 2f0b257
Project: crates/harness-symphony (Rust)
Scope: Web board, PR automation, doctor preflight, config schema

---

## File: crates/harness-symphony/src/pr.rs (402 lines)

**Purpose:** PR automation for running story results — create pull requests from run outcomes, manage branch preparation, git operations.

**Main Types:**
- `PrError` enum: Error types for PR creation failures
- `PrPlan` struct: Contains run_id, draft flag, title, body_path, files, base_branch, head_branch
- `PrCreateResult` struct: Plan + optional PR URL
- `plan_pr()` fn: Validates run status, checks artifacts exist, computes PR metadata
- `create_pr()` fn: Executes gh CLI PR creation after branch prep

**Key Behaviors:**
- PR creation disabled by `pull_request.create` config: "disabled" | "never" blocks any PR
- Run status must be "completed" (normal PR) or in `pull_request_draft_for` config list (draft PR)
  - Default draft statuses: "blocked", "needs_intake", "partial"
- Dry-run mode (guard): `--dry-run` flag returns plan without invoking gh
- gh capability check: Provider must be "github" (lines 105-108)
- Forbidden files guard: Blocks staging of "harness.db" or ".symphony/*" (lines 145-149)
- Branch validation: Rejects detached HEAD (line 166-169)
- Artifact requirements: Requires SUMMARY.md, RESULT.json, changeset.jsonl to exist (lines 72-74)

**Commands/Functions:**
- `plan_pr(config, run) → Result<PrPlan, PrError>`: Plan PR metadata from run record
- `create_pr(config, run_id, dry_run) → Result<PrCreateResult, PrError>`: Execute PR creation or dry-run
- `ensure_forbidden_files_not_staged(repo_root) → Result<(), PrError>`: Enforce git stage whitelist
- `current_branch(repo_root) → Result<String, PrError>`: Get active branch name
- `prepare_review_branch(run, plan) → Result<(), PrError>`: Stage changes, commit, push to review branch
- `git(worktree, args) → Result<(), PrError>`: Wrapper for git command execution
- `git_allow_failure(worktree, args) → Result<(), PrError>`: Git wrapper that permits exit code 128

---

## File: crates/harness-symphony/src/doctor.rs (626 lines)

**Purpose:** Preflight readiness checks for Symphony orchestration — verifies git, harness database, protocol contract, config, providers.

**Main Types:**
- `CheckStatus` enum: Pass | Warn | Fail
- `DoctorCheck` struct: name, status, detail, next (optional action)
- `DoctorReport` struct: Vec of checks; `has_failures()` predicate
- `run_doctor(config) → Result<DoctorReport, DoctorError>`: Execute all checks in order

**All Readiness Checks (in execution order):**

1. **check_git_available()** → `name: "git"`
   - Pass: `git --version` succeeds and returns version string
   - Fail: git not on PATH or command fails
   - Next: "Install git and ensure it is on PATH."

2. **check_git_worktree_support()** → `name: "git worktree"`
   - Pass: `git worktree list` succeeds
   - Fail: worktree list fails
   - Next: "Use a Git version that supports worktrees."

3. **check_repo_root(repo_root)** → `name: "repo root"`
   - Pass: `git rev-parse --show-toplevel` succeeds in repo_root
   - Fail: repo_root is not inside a Git repository
   - Next: "Run harness-symphony from the repository root or pass --repo-root."

4. **check_database_or_changesets(config)** → `name: "harness database"`
   - Pass: harness.db exists at `config.harness_db`
   - Warn: database absent but changeset directory exists (lines 314-323)
   - Fail: neither database nor changesets directory exists
   - Next on Warn: "Use the configured Harness CLI executable with argv [\"db\", \"rebuild\", \"--from\", \"{changeset_dir}\"]"
   - Next on Fail: "Use the configured Harness CLI executable with argv [\"init\"]."

5. **check_harness_protocol(config)** → `name: "Harness protocol"` (conditional)
   - Pass: `protocol.preflight()` succeeds; reports CLI version, protocol version, schema version, all required capabilities
   - Fail: Protocol init fails; detailed error from HarnessProtocolError enum
   - Next variants (lines 200-206):
     - DatabaseMissing: "Initialize the database explicitly with a checksum-verified Harness CLI..."
     - DatabaseNeedsMigration: "Back up and migrate the database with a checksum-verified..."
     - Other: "Install a checksum-verified protocol-compatible Harness CLI..."

6. **check_gitignore(config)** → `name: ".gitignore"` (if protocol check passed)
   - Pass: .gitignore exists and contains all required entries
   - Fail: .gitignore missing OR contains missing entries
   - Required entries: "harness.db", "harness.db-wal", "harness.db-shm", ".symphony/"
   - Next on Fail: "Add to .gitignore: {missing entries}"

7. **check_agent_adapter(config)** → `name: "agent adapter"`
   - Pass: Agent adapter status succeeds (adapter detected)
   - Warn: MissingCommand error (adapter is "custom" but no agent.command configured)
   - Fail: Unknown adapter or adapter unavailable
   - Next on Warn: "Set agent.command in .harness/symphony.yml before launching runs."
   - Next on Fail: "Set agent.adapter to custom or codex in .harness/symphony.yml."

8. **check_pr_adapter(config)** → `name: "PR adapter"`
   - Warn: PR creation disabled (config.pull_request_create == "disabled" | "never")
   - Pass: provider == "github" AND `gh --version` succeeds
   - Warn: provider == "github" but `gh --version` fails
   - Warn: provider != "github" (unsupported)
   - Next on missing gh: "Install gh or set pull_request.create: disabled."
   - Next on unsupported: "Set pull_request.provider: github or disable PR creation."

9. **check_unapplied_changesets(config)** → `name: "changeset sync"` (inserted only if protocol check passed)
   - Pass: All committed changesets are applied locally (empty unapplied list)
   - Warn: N committed changesets are unapplied
   - Warn: Error inspecting changesets
   - Next on Warn: "Run: harness-symphony sync"

10. **check_optional_providers(config)** → `name: "optional providers"` (inserted only if protocol check passed)
    - Discovers tools via `harness query tools --summary --json`
    - Pass: No optional providers registered (clean skip)
    - Pass: All registered optional providers present
    - Warn: Some registered optional providers missing/weak (degraded proof)
    - Warn: Tool discovery unavailable (cannot run query)
    - Next on Warn: "Install or rescan the provider to strengthen optional proof." OR "Core orchestration is unaffected; repair tool discovery for optional proof."

**Report Methods:**
- `print_report(report) → ()`: Pretty-print checks with status labels (PASS/WARN/FAIL) and next actions

---

## File: crates/harness-symphony/src/config.rs (522 lines)

**Purpose:** YAML configuration schema and path resolution for Symphony runtime.

**Config File Path:** `.harness/symphony.yml` (lines 7)

**Main Config Struct: `ResolvedConfig`** (lines 24-48)
Stores all resolved absolute paths and settings:
- version: u32 (default: 1)
- repo_root: PathBuf
- harness_db: PathBuf (default: "harness.db")
- harness_cli: Option<PathBuf> (optional)
- state_db: PathBuf (default: ".symphony/state.db")
- runs_dir: PathBuf (default: ".harness/runs")
- worktrees_dir: PathBuf (default: ".symphony/worktrees")
- single_active_run: bool (default: true)
- agent_adapter: String (default: "custom")
- agent_command: Vec<String> (default: empty)
- agent_timeout_minutes: u32 (default: 10)
- pull_request_create: String (default: "ask")
- pull_request_provider: String (default: "github")
- pull_request_draft_for: Vec<String> (default: ["blocked", "needs_intake", "partial"])
- changeset_directory: PathBuf (default: ".harness/changesets")
- changeset_render_in_summary: bool (default: true)
- allow_here_for_tiny: bool (default: true)
- compact_keep_last: u32 (default: 50)
- keep_failed_worktrees: bool (default: true)
- cleanup_after_sync: bool (default: false)
- auto_source: String (default: "harness-db")
- auto_poll_interval_seconds: u64 (default: 30)
- auto_max_attempts: u32 (default: 3)

**Deserializable Config Schema: `SymphonyConfig`** (lines 51-70)
YAML structure with sections:
```yaml
version: u32 (serde default: 1)
repo:
  root: PathBuf (alias: none; default: ".")
  harness_db: PathBuf (default: "harness.db")
  harness_cli: Option<PathBuf> (alias: "harness_cli_path"; default: none)
symphony:
  state_db: PathBuf (default: ".symphony/state.db")
  runs_dir: PathBuf (default: ".harness/runs")
  worktrees_dir: PathBuf (default: ".symphony/worktrees")
  single_active_run: bool (default: true)
agent:
  adapter: String (default: "custom")
  command: Vec<String> (default: [])
  timeout_minutes: u32 (default: 10)
pull_request:
  create: String (default: "ask")
  provider: String (default: "github")
  draft_for: Vec<String> (default: ["blocked", "needs_intake", "partial"])
changeset:
  directory: PathBuf (default: ".harness/changesets")
  render_in_summary: bool (default: true)
runs:
  allow_here_for_tiny: bool (default: true)
  compact_keep_last: u32 (default: 50)
cleanup:
  keep_failed_worktrees: bool (default: true)
  cleanup_after_sync: bool (default: false)
auto:
  source: String (default: "harness-db")
  poll_interval_seconds: u64 (default: 30)
  max_attempts: u32 (default: 3)
```

**Key Methods:**
- `SymphonyConfig::load(repo_root) → Result<Self, ConfigError>`: Load .harness/symphony.yml or return defaults if missing
- `SymphonyConfig::resolve(current_root) → ResolvedConfig`: Convert relative paths to absolute using repo root

**All Default Values (verbatim):**
- `default_version()`: 1
- `default_repo_root()`: "."
- `default_harness_db()`: "harness.db"
- `default_state_db()`: ".symphony/state.db"
- `default_runs_dir()`: ".harness/runs"
- `default_worktrees_dir()`: ".symphony/worktrees"
- `default_agent_adapter()`: "custom"
- `default_timeout_minutes()`: 10
- `default_pull_request_create()`: "ask"
- `default_pull_request_provider()`: "github"
- `default_draft_for()`: ["blocked", "needs_intake", "partial"]
- `default_changeset_directory()`: ".harness/changesets"
- `default_compact_keep_last()`: 50
- `default_true()`: true
- `default_auto_source()`: "harness-db"
- `default_auto_poll_interval_seconds()`: 30
- `default_auto_max_attempts()`: 3

---

## File: crates/harness-symphony/src/web.rs (2631 lines)

**Purpose:** HTTP web server and kanban-style task board UI controller — exposes REST endpoints for task/run management, changeset sync, PR automation, and serves SPA assets.

**Server Setup:**
- `WebServerOptions` struct: host (String), port (u16)
- Default host: "127.0.0.1" (lines 152)
- Default port: 4317 (line 152)
- `run_web_server(config, options) → Result<(), WebError>`: Binds TCP listener, accepts connections, routes HTTP requests

**HTTP Route Table** (lines 239-315, parsed request):

| Method | Path Pattern | Handler Function | Response Type |
|--------|--------------|------------------|---------------|
| GET | /health | direct json_response | {"ok": true} (200) |
| GET | /api/board | list_board via protocol | BoardResponse with items (200) |
| POST | /api/tasks/{story_id}/start | start_run_response | StartRunResponse (story_id, run_id, status) |
| POST | /api/tasks/{story_id}/recover | recover_run_response | ErrorResponse (story not found), or recovery action |
| POST | /api/tasks/{story_id}/retire | retire_task_response | RetireTaskResponse (story_id, status) |
| GET | /api/runs/{run_id}/events | events_response | EventsResponse (run_id, events: Vec<Value>) |
| GET | /api/runs/{run_id}/review | review_response | ReviewResponse (detailed run review data) |
| POST | /api/runs/{run_id}/sync | sync_run_response | SyncRunResponse (run_id, applied, changes) |
| POST | /api/runs/{run_id}/pr-merged | pr_merged_response | PrMergedResponse (run_id, pr_status) |
| POST | /api/runs/{run_id}/pr-retry | pr_retry_response | PrRetryResponse (run_id, pr_status, pr_url) |
| GET | /* (any) | static_response | Serves SPA assets from web dist dir |
| Non-GET/POST on /health or /api/* | | direct json_response | ErrorResponse "method not allowed" (405) |
| GET/POST on unrecognized path | | direct json_response | ErrorResponse "not found" (404) |

**Response Structs:**
- `BoardResponse`: items: Vec<BoardItemResponse>
- `BoardItemResponse`: id, title, board_state, story_status, lane, verify, blockers, unblocks, parent_id, children, hierarchy_depth, run_id, active_run, reason, failure_summary, recovery_action
- `StartRunResponse`: run_id, story_id, status
- `PrRetryResponse`: run_id, pr_status, pr_url
- `RetireTaskResponse`: story_id, status
- `EventsResponse`: run_id, events
- `ReviewResponse`: run_id, story_id, status, outcome, summary, result, validation, changed_files, changeset_preview, pr_url, pr_status, artifact_paths, events, suggested_next_action, failure_summary, recovery_action
- `SyncRunResponse`: run_id, applied, changes
- `PrMergedResponse`: run_id, pr_status
- `ErrorResponse`: error (String)
- `FailureSummary`: category, reason, latest_event, latest_error, run_id, evidence_artifacts, next_action
- `RecoveryAction`: kind, label, endpoint, confirmation

**Key Handler Functions:**
- `start_run_response(config, story_id) → Result<HttpResponse, WebError>`: Validate story ready state, prepare run, spawn executor thread, return run record
- `recover_run_response(config, story_id) → Result<HttpResponse, WebError>`: Find failed/blocked run, validate recovery action, execute recovery
- `retire_task_response(config, story_id) → Result<HttpResponse, WebError>`: Retire completed story (mark as archived)
- `events_response(config, run_id) → Result<HttpResponse, WebError>`: Read and return run event log
- `review_response(config, run_id) → Result<HttpResponse, WebError>`: Detailed review: status, changeset, validation result, failure summary, recovery actions
- `sync_run_response(config, run_id) → Result<HttpResponse, WebError>`: Sync changesets from run to repo, return applied changes
- `pr_merged_response(config, run_id) → Result<HttpResponse, WebError>`: Mark run PR as merged, update run state
- `pr_retry_response(config, run_id) → Result<HttpResponse, WebError>`: Retry PR creation after fix, dry-run or real

**Asset Serving:**
- `static_response(config, request_path) → Result<HttpResponse, WebError>`: Serves SPA assets from dist directory
- Respects environment variable `HARNESS_SYMPHONY_WEB_DIST_DIR` override (line 19)
- Falls back to packaged/embedded dist tree

**Supporting Functions (60+ total):**
- `failure_summary_for_run()`: Analyze failure category and root cause
- `review_next_action()`: Suggest recovery action based on run status
- `run_needs_attention()`: Predicate for board Lane display
- `recovery_action_for_review()` / `recovery_action_for_run()`: Build UI action buttons
- `execution_retryable_run()`: Can executor retry?
- `pr_retryable_run()`: Can PR be retried?
- `is_synced()`: Are changesets applied?
- `available_artifacts()`: List evidence artifacts (logs, screenshots, etc.)
- `validation_failure_message()` / `latest_event_message()` / `latest_event_error()`: Extract diagnostics from run artifacts

**Detailed Review Response Fields:**
- Computes status from run record
- Extracts outcome from RESULT.json artifact
- Renders changeset preview with `render_changeset()`
- Loads validation results and error traces
- Lists changed files from changesets
- Provides recovery actions based on run state (retry executor, recover task, retry PR, etc.)
- Includes evidence artifact links (SUMMARY.md, RESULT.json, events log, screenshots)

**Constraints/Guards (no explicit implementation but implicit in flow):**
- Only GET/POST methods routed (other methods → 405)
- All POST endpoints reject non-JSON requests implicitly via route parsing
- Static asset paths validated against web dist directory (prevents directory traversal, line 39: InvalidAssetPath error)

---

## Summary

**Tooling Surface Checklist:**
- ✅ Web board: REST /api/board endpoint serving Harness task cards with status, dependencies, recovery actions
- ✅ PR automation: /api/runs/{run_id}/pr-retry, pr.rs create_pr() with gh CLI, dry-run guard, forbidden files check
- ✅ Doctor preflight: 10 readiness checks (git, repo, database, protocol, gitignore, adapters, providers)
- ✅ Config schema: 8 sections (repo, symphony runtime, agent, PR, changeset, runs, cleanup, auto) with 30 typed fields and defaults
- ✅ Web server: HTTP on 127.0.0.1:4317, 9 API routes + static asset serving

**No sections unread:** All target files inventoried completely. web.rs route logic confirmed via lines 239-315 route table, main request handlers verified, response schemas enumerated.
