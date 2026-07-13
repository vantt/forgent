# Symphony Core Orchestration Inventory

**Report Date:** 2026-07-13  
**Project:** upstreams/symphony  
**Commit:** 2f0b257  
**Scope:** 5 core Rust files, 4,156 lines total  

---

## File: crates/harness-symphony/src/run.rs (1308 lines)

Isolated run orchestration: prepares worktrees, builds run contracts, executes agents, validates results, promotes artifacts.

### Main Structs/Enums/Consts

- **RunError** (18-46): Error type for story not found, not runnable, worktree failure, invalid result, agent errors, state errors, harness protocol errors, I/O, JSON, changeset errors.
- **PreparedRun** (48-57): Holds run_id, story_id, optional branch, worktree path, contract_path, harness_db_path, lightweight flag.
- **CompletedRun** (59-65): Wraps PreparedRun with outcome and paths to SUMMARY.md and RESULT.json.
- **RunContract** (67-82): Serializable contract v1 specifying run_id, mode, story_id, worktree, harness_db_path, harness CLI invocation, environment variables, required outputs, result schema, forbidden paths, agent instructions.
- **HarnessCliInvocation** (84-88): CLI executable and argv array.
- **RunEnvironment** (90-95): harness_db_path, harness_run_id, harness_run_mode (always "execute").
- **ResultFile** (97-105): Deserialized RESULT.json structure with version, run_id, story_id, outcome, optional validation and summary_path.
- **ResultValidation** (107-111): Optional commands array (each with command string and result: pass/fail/unavailable) OR unavailable reason string.
- **ValidationCommand** (113-117): command string and result (pass | fail | unavailable).

### State Machine / Lifecycle

**Run Lifecycle States and Transitions:**

1. **prepare_run()** (119-178): Creates isolated worktree
   - Preconditions (enforced lines 120-123):
     - Migration fence must be released
     - No active run exists
     - Story must be runnable
   - Actions:
     - Refreshes checkout from upstream (line 125)
     - Generates run_id (line 132)
     - Creates git worktree with branch `symphony/{run_id}` (line 141)
     - Snapshots harness.db to worktree (line 142)
     - Marks story status as "in_progress" via CAS (line 143)
     - Writes RUN_CONTRACT.json (line 154)
     - Appends AGENTS.md shim (line 155)
     - Records in state.db with status="prepared" (line 157)
   - Outcome: Returns PreparedRun with lightweight=false, branch set, worktree created

2. **prepare_here_run()** (180-257): Lightweight run in current checkout (tiny stories only)
   - Preconditions (enforced lines 181-206):
     - --here must be enabled (config.allow_here_for_tiny)
     - Story must be runnable
     - Story risk_lane must be "tiny" (checked twice at lines 189-194, 201-206)
     - Migration fence must be released
   - Actions:
     - No worktree created
     - Snapshots harness.db to `.symphony/runs/{run_id}/` in repo root (line 216)
     - Marks story in_progress (line 217)
     - Writes RUN_CONTRACT.json (line 234)
     - Records in state.db with status="prepared", lightweight=true, branch=None (line 236)
   - Outcome: Returns PreparedRun with lightweight=true, branch=None, worktree=repo_root

3. **execute_run(story_id)** (259-262): Wrapper combining prepare + execute
   - Calls preflight_agent first (line 260)
   - Delegates to execute_prepared_run

4. **execute_here_run(story_id)** (264-267): Wrapper for lightweight execution
   - Calls preflight_agent first (line 265)
   - Delegates to execute_prepared_run with prepare_here_run result

5. **execute_prepared_run()** (269-302): Runs agent and validates
   - Preconditions (enforced line 273-274):
     - Migration fence must be released
   - On agent failure (line 275-281):
     - Updates state.db status to "failed"
     - Returns error
   - On result validation failure (line 285-293):
     - Updates state.db status to "failed"
     - Returns error
   - On success (line 296-301):
     - Updates state.db status to run outcome ("completed", "blocked", etc.)
   - Outcome: Returns CompletedRun with promoted artifacts

6. **validate_finished_run()** (456-551): Validates agent output
   - Preconditions (enforced lines 467-513):
     - SUMMARY.md must exist at worktree/.harness/runs/{run_id}/SUMMARY.md
     - RESULT.json must exist
   - Validation checks (lines 480-512):
     - RESULT.json version must equal 1
     - run_id in RESULT.json must match prepared.run_id
     - story_id in RESULT.json must match prepared.story_id
     - outcome must be valid (line 496, see valid_outcome below)
     - Must have validation evidence (line 502, see has_validation_evidence below)
     - If summary_path present, must not be empty (line 507-512)
   - Forbidden paths check (line 514, see ensure_forbidden_paths_not_staged below)
   - For lightweight runs (line 515-526):
     - Changeset must exist at `.harness/changesets/{run_id}.changeset.jsonl`
     - Appends "lightweight: true" marker to SUMMARY.md
   - Artifact promotion (line 542-543, see promote_run_artifacts below)
   - Outcome: Returns CompletedRun with artifacts in final locations

### Contracts & Invariants Enforced

**Story Runnable Contract** (304-321):
- Line 308-313: Story exists in work graph or StoryNotFound
- Line 314-319: Story.runnable == true, else StoryNotRunnable error with status and required conditions

**Active Run Lock** (323-328):
- Line 324-326: No run with status IN ("prepared", "running") exists, else ActiveRunExists error with run_id

**Migration Fence** (330-333):
- Line 331: Fence must not be held, else MigrationFenceHeld error

**Forbidden Paths Guard** (632-662):
- Line 636-644: Git diff --cached --name-only runs to list staged files
- Line 645-659: Rejects if any staged file matches:
  - Exact: "harness.db" or ".symphony/state.db"
  - Prefix: ".symphony/runs/" or ".symphony/worktrees/"
  - Error quote (656-657): `"forbidden path staged for commit: {path}"`

**Result File Schema** (597-600):
- Parses RESULT.json and returns ResultFile struct

**Valid Outcome Predicate** (602-606):
- Quote (603-605): `matches!(value, "completed" | "blocked" | "needs_intake" | "partial" | "failed" | "cancelled")`

**Validation Evidence Predicate** (609-625):
- Line 613-618: Commands array non-empty with all valid (see valid_command below)
- Line 620-624: OR unavailable string non-empty
- Quote (609-610): `fn has_validation_evidence(validation: Option<&ResultValidation>) -> bool`

**Valid Command Predicate** (627-630):
- Quote (628-629): `!command.command.trim().is_empty() && matches!(command.result.as_str(), "pass" | "fail" | "unavailable")`

**Lightweight Summary Marker** (589-594):
- Appends (line 593): `"\n## Run Mode\n\nlightweight: true"`

**Artifact Promotion** (553-579):
- Lightweight: copies nothing (returns original paths)
- Full isolation (line 563-578):
  - Creates config.runs_dir/{run_id}/
  - Copies SUMMARY.md, RESULT.json, optional changeset.jsonl to runs_dir
  - Returns promoted paths

### Run Contract Schema

**Contract v1 Fields** (lines 403-436):
- **version**: 1
- **run_id**: Generated at line 132
- **mode**: "execute" (line 406)
- **story_id**: User-provided story identifier
- **lightweight**: Boolean flag (true for --here runs)
- **worktree**: Relative path display (line 409)
- **harness_db_path**: Relative path display (line 410)
- **harness_cli**: HarnessCliInvocation with executable path and ["story", "complete", story_id, "--json"]
- **env**: RunEnvironment with db path, run_id, mode "execute"
- **required_outputs**: Always [".harness/runs/{run_id}/SUMMARY.md", ".harness/runs/{run_id}/RESULT.json"]
- **result_json_schema**: JSON schema specifying version, run_id, story_id, outcome enum, validation structure
- **forbidden_paths**: ["harness.db", ".symphony/state.db", ".symphony/runs/**", ".symphony/worktrees/**"]
- **agent_instructions** (428-435):
  1. "Follow AGENTS.md and Harness docs."
  2. "For resolver stories, record a completed implementation trace and then invoke harness_cli.executable with harness_cli.argv; story verify is proof-only."
  3. "Implement only the assigned story scope."
  4. "Use only the isolated Harness DB snapshot named by HARNESS_DB_PATH."
  5. "Run the configured verification command when available."
  6. Quote (434): `"Write RESULT.json with a top-level validation object, not validation_evidence. Use validation.commands[].result values pass, fail, or unavailable."`

### Config Exposed

- **config.allow_here_for_tiny** (line 181): Controls whether --here run mode is available; if false, HereRunDisabled error
- **config.changeset_render_in_summary** (line 528): Controls whether to append changeset rendering to SUMMARY.md

### Run ID Generation

**generate_run_id()** (707-715):
- Quote (714): `format!("run_{}_{}_{}", timestamp, std::process::id(), sequence)`
- Uses AtomicU64 sequence counter (708)
- Timestamp in nanoseconds, PID, sequence number

---

## File: crates/harness-symphony/src/auto.rs (416 lines)

Unattended work queue polling and single-active-run orchestration.

### Main Structs/Enums/Consts

- **AutoError** (12-26): NotEnabled, AdapterBoundary, UnsupportedSource, State, Work errors.
- **AutoRunOptions** (28-37): enabled (bool), source (string), once (bool), max_runs (Option<u32>), max_attempts (u32), poll_interval_seconds (u64), max_idle_cycles (Option<u32>).
- **AutoRunSummary** (39-47): source, enqueued (u32), completed (u32), failed (u32), idle_cycles (u32), stopped_reason (string).
- **StoryRunResult** (49-53): run_id, outcome for internal use in runner trait.

### State Machine / Lifecycle

**run_auto_mode_with_runner()** (94-184): Main work loop with polling and retry

1. **Initialization** (99-117):
   - Precondition (line 99): options.enabled == true, else NotEnabled
   - Precondition (line 102): validate_source("harness-db"), else AdapterBoundary or UnsupportedSource
   - Precondition (line 105): ensure_migration_fence_released()
   - Create HarnessDbWorkSource (line 108)
   - Initialize AutoRunSummary (line 109)

2. **Main Loop** (118-181):
   - **Poll Phase** (line 120):
     - Call source.poll() for work candidates
     - For each candidate (line 121-126):
       - enqueue_work(story_id, source, max_attempts)
       - Track if first enqueue: enqueued++
   
   - **Idle Phase** (line 128-143):
     - If no next_queued_work():
       - idle_cycles++
       - If once=true (line 130-132): break "one poll completed with no queued work"
       - If idle_cycles >= max_idle_cycles (line 134-139): break "max idle cycles reached"
       - sleep(poll_interval_seconds) (line 141)
       - continue loop
   
   - **Execution Phase** (line 145-168):
     - mark_queue_running(story_id) (line 146)
     - run_story(story_id) (line 147)
     - **If outcome=="completed"** (line 148-150):
       - mark_queue_completed(story_id, run_id)
       - completed++
       - idle_cycles reset to 0 (line 145)
     - **Else** (line 152-160):
       - mark_queue_failed(story_id, run_id, error_msg)
       - If queue.status=="failed" (attempt limit exceeded): failed++
     - **On run error** (line 162-167):
       - mark_queue_failed(story_id, None, error_string)
       - If queue.status=="failed": failed++
   
   - **Stop Conditions** (line 170-180):
     - If once=true (line 170-172): break "one queued run processed"
     - If completed + failed >= max_runs (line 174-179): break "max runs reached"

### Contracts & Invariants Enforced

**Source Validation** (186-194):
- Quote (187-188): `if source == "harness-db" { return Ok(()); }`
- External sources (line 190): ["github-issues", "linear", "jira", "remote-harness"] → AdapterBoundary
- Unknown sources → UnsupportedSource

**Queue State Transitions** (from state.rs enqueue_work):
- Line 123: enqueued only incremented if queued.status=="queued" && queued.attempts==0
- Line 148-150: completed only if run outcome=="completed"
- Line 152-160: failed if outcome != "completed"

### Config Exposed

**options_from_config()** (74-84):
- enabled: false (must be opt-in, line 76)
- source: config.auto_source
- once: false
- max_runs: None
- max_attempts: config.auto_max_attempts
- poll_interval_seconds: config.auto_poll_interval_seconds
- max_idle_cycles: None

### Constants / Thresholds

- **Poll Interval**: config.auto_poll_interval_seconds (default 30 from test config line 243; set to 0 in auto.rs test line 243)
- **Max Attempts Per Story**: config.auto_max_attempts (default 3 from run.rs test line 748; set to 2 in auto.rs test line 244)
- **Auto-Mode Disabled by Default**: enabled=false (line 76)

---

## File: crates/harness-symphony/src/work.rs (597 lines)

Work discovery, board state derivation, and cycle detection.

### Main Structs/Enums/Consts

- **WorkError** (9-17): StoryNotFound, Protocol, State errors.
- **WorkItem** (19-27): id, status, lane, verify (configured/missing), runnable (yes/no/warn), reason.
- **WorkCandidate** (29-33): story_id, source for auto-enqueueing.
- **BoardItem** (35-51): Full board display with id, title, story_status, lane, verify, board_state, reason, blockers, unblocks, parent_id, children, hierarchy_depth, run_id, active_run.
- **BoardState** (53-74): Enum with Ready, Blocked, InProgress, Review, NeedsAttention, Done variants.
- **StoryRow** (76-83): Internal mapping struct from Story.
- **HarnessDbWorkSource** (90-115): Implements WorkSource trait; polls harness.db work graph.
- **EXTERNAL_WORK_SOURCE_BOUNDARIES** (117-118): Const array ["github-issues", "linear", "jira", "remote-harness"]

### Public Functions

**list_work()** (120-137):
- Queries protocol.work_graph()
- Classifies each story with classify() (line 125)
- Returns sorted WorkItems

**list_board()** (139-227):
- Queries protocol.work_graph()
- Builds story row map (line 143-148)
- Filters out retired stories (line 149-152)
- Extracts dependencies and hierarchy edges, filtering by active story_ids (line 157-170)
- Builds blocker/unblock/parent/children/cycle maps (line 163-172)
- Queries latest runs per story (line 174)
- Determines done_ids based on status or synced completion (line 176-185)
- Derives board items with full state (line 187-223)
- Returns sorted BoardItems

**retire_story()** (229-237):
- Loads story from work_graph
- CAS status update to "retired" (line 236)

### State Machine / Story Classification

**classify()** (240-270): Determines WorkItem runnable/reason based on status and verify_command

- **Logic** (line 252-260):
  | Status | Protocol Runnable | Verify Command | Runnable | Reason |
  |--------|-------------------|-----------------|----------|--------|
  | planned/in_progress | true | - | yes | ready |
  | planned/in_progress | true | missing | warn | proof command missing |
  | planned/in_progress | false | - | no | not runnable by Harness protocol |
  | implemented | - | - | no | already implemented |
  | retired | - | - | no | retired |
  | changed | - | - | warn | changed story needs human review |
  | other | - | - | no | unknown story status |

### Board State Derivation

**derive_board_item()** (401-492): Determines BoardState with precedence order

- **Precedence** (line 421-472):
  1. If story.status=="implemented" → Done ("story implemented")
  2. Else if story.status=="changed" → NeedsAttention ("changed story needs human review")
  3. Else if in_cycle → Blocked ("dependency cycle detected; fix task breakdown")
  4. Else if run exists (line 433-451):
     - prepared/running → InProgress ("active run {run_id}")
     - failed/cancelled/partial/blocked/needs_intake → NeedsAttention (run.next_action)
     - completed + synced (line 441) → Done ("synced locally")
     - completed + pr_url exists → Review ("review pull request")
     - completed + pr_status=="failed" → NeedsAttention (run.next_action)
     - completed + else → NeedsAttention ("completed run is missing required PR review artifact")
  5. Else if incomplete_blockers (line 452-455) → Blocked ("waiting for {blockers}")
  6. Else if status in (planned/in_progress) → Ready ("ready")
  7. Else if status==retired → Done ("retired")
  8. Else → NeedsAttention ("unknown story status {status}")

**is_synced()** (494-498):
- Quote (495-498): `matches!(run.sync_status.as_str(), "applied" | "synced" | "synced_locally")`

### Cycle Detection

**cycle_members()** (341-360): Detects stories in dependency cycles

- Builds adjacency graph from edges (line 343-348)
- For each story, DFS to find self-reachability (line 351-359)
- Returns HashSet of cycle members

**reaches()** (362-380): DFS helper for cycle detection

- Tracks visited and stack (line 369-378)
- Returns true if start node reachable from itself

### Contracts & Invariants

**Auto-Eligible Filter** (507-509):
- Quote (508-509): `fn is_auto_eligible(item: &WorkItem) -> bool { item.runnable == "yes" && matches!(item.status.as_str(), "planned" | "in_progress") }`

**HarnessDbWorkSource.poll()** (105-114):
- Calls list_work() once (single protocol invocation, not per-story)
- Filters with is_auto_eligible()
- Returns WorkCandidates

---

## File: crates/harness-symphony/src/agent.rs (868 lines)

Agent dispatch, adapter routing, and Codex JSON-RPC protocol.

### Main Structs/Enums/Consts

- **AgentError** (20-38): MissingCommand, UnavailableCommand, UnsupportedAdapter, CommandFailed, Codex, Io, Json, Protocol errors.
- **CODEX_IDLE_RECONCILE_SECONDS** (16-18): 30 seconds in production, 1 second in tests.

### Public Functions

**run_agent()** (40-46):
- Routes to custom or codex adapter based on config.agent_adapter
- Quote (41-45): `match config.agent_adapter.as_str() { "custom" => run_custom_agent(...), "codex" => run_codex_agent(...), other => Err(UnsupportedAdapter) }`

**resolved_agent_command()** (48-56):
- Returns config.agent_command if non-empty
- Else if adapter=="codex": ["codex", "app-server"]
- Else: []

**agent_adapter_status()** (58-75):
- Validates command availability
- Returns description string

**preflight_agent()** (80-82):
- Called before run preparation (line 260 run.rs, line 265 run.rs)
- Validates adapter before worktree/branch creation

### Custom Adapter

**run_custom_agent()** (150-163):
- Spawns command via base_command()
- Waits for output
- Returns error if exit status != success

### Codex Adapter

**run_codex_agent()** (165-405): JSON-RPC bidirectional protocol handler

**Initialization Phase** (lines 171-189):
- Spawns base_command with Stdio::piped on stdin/stdout/stderr
- Spawns reader thread to consume stdout lines (line 191-198)

**JSON-RPC Handshake** (lines 200-327):
- **Send initialize** (line 200-217):
  - id=0, method="initialize"
  - clientInfo: name="harness_symphony", version from cargo env
  - capabilities: experimentalApi=true, requestAttestation=false
  
- **Receive initialize response** (line 313):
  - id=0 response triggers:
    - Send initialized notification
    - Send thread/start request (id=1) with cwd, runtimeWorkspaceRoots, approvalPolicy="never", sandbox="danger-full-access"
  
- **Receive thread/start response** (line 329-338):
  - id=1 response extracts thread.id
  - Call send_turn_start() (id=2) with codex_prompt()
  
- **Receive turn/start response** (line 340-345):
  - id=2 response extracts turn.id

**Main Event Loop** (lines 232-404):
- **Timeout: 250ms** (line 233)
- **On recv_timeout (line 236-251)**:
  - Check if child exited (line 236)
  - Check idle reconciliation timeout (CODEX_IDLE_RECONCILE_SECONDS=30s default, line 244)
  - If turn_started and no events for 30s, send turn-state query (line 253-265)
- **On turn/started method** (line 383-385):
  - Sets turn_started=true, enables idle reconciliation
- **On turn/completed method** (line 387-403):
  - Reads status from /params/turn/status
  - If "completed": return Ok()
  - Else: return Err(status) with optional error message
- **On turn-state query response** (line 349-380):
  - Reads turn status from /result/data array
  - "completed" → return Ok()
  - "failed"/"interrupted" → return Err() with error message
  - "inProgress" → continue loop
  - Other → return Err("unknown status")

**Event Logging** (line 278):
- Appends each line to APP_SERVER_EVENTS.jsonl (line 219-223)

**Environment Setup** (line 407-417):
- base_command sets 4 variables (quote 412-415):
  - `HARNESS_REPO_ROOT` = worktree
  - `HARNESS_DB_PATH` = prepared.harness_db_path
  - `HARNESS_RUN_ID` = prepared.run_id
  - `HARNESS_RUN_MODE` = "execute"

### Executable Validation

**executable_available()** (95-110):
- If absolute path: check is_executable_file()
- Else if has directory separator: check relative to repo_root
- Else: search PATH via executable_candidates()

**is_executable_file()** (112-128):
- Check metadata.is_file()
- Unix: check mode & 0o111 != 0
- Windows: return true if file exists

### Codex Prompt

**codex_prompt()** (503-522):
- Line 509-521: Instructs agent to:
  - Read AGENTS.md and run contract at contract_path
  - Complete only story_id for run_id
  - Write required artifacts: .harness/runs/{run_id}/SUMMARY.md and RESULT.json
  - Use Harness CLI via executable/argv (not shell-split)
  - Keep worktree as cwd
  - Use HARNESS_DB_PATH, HARNESS_RUN_ID, HARNESS_RUN_MODE from environment
  - Produce .harness/changesets/{run_id}.changeset.jsonl
  - Quote (510-521): `"RESULT.json must have version 1, run_id {run_id}, story_id {story_id}, an allowed outcome, summary_path .harness/runs/{run_id}/SUMMARY.md, and a top-level validation object. Do not write validation_evidence. validation must be either {{\"commands\":[{{\"command\":\"exact command\",\"result\":\"pass\"}}]}} with each result set to pass, fail, or unavailable, or {{\"unavailable\":\"non-empty reason\"}}."`

### Contracts & Invariants Enforced

**Adapter Requirement** (line 22):
- Quote (22): `#[error("unsupported agent adapter '{0}'. Supported adapters: custom, codex")]`

**Custom Adapter Requires Command** (line 85-87):
- Quote (22-23): `#[error("agent.command is not configured. Set agent.command in .harness/symphony.yml.")]`

**Executable Availability** (line 88-92):
- Quote (24-25): `#[error("selected agent executable '{0}' is not available; install it or configure agent.command before launching a run")]`

**Codex Idle Timeout** (lines 243-265):
- After 30 seconds without events after turning started, send turn-state query (line 256-264)
- After 30 seconds without response to state query, terminate with error (line 244-251)
- Quote (247-251): `"no app-server events or turn-state response for {CODEX_IDLE_RECONCILE_SECONDS} second(s) after reconciliation request. Last app-server method: {last_observed_method}; events: {event_count}; see {path}"`

**JSON-RPC Error Handling** (line 287-309):
- On error in message (line 287): terminate with Codex error
- On unsupported request method (line 299-308): error quote (305-307): `"unsupported app-server request '{method}'. See {path}"`

### Constants / Thresholds

- **CODEX_IDLE_RECONCILE_SECONDS**: 30 (prod, line 16), 1 (test, line 18)
- **Event Loop Timeout**: 250ms (line 233)
- **SQLite Busy Timeout**: 300s (inherited from state.rs via Connection pool)

---

## File: crates/harness-symphony/src/state.rs (935 lines)

Symphony state machine, run lifecycle tracking, auto-queue management, migration fence, changeset sync.

### Main Structs/Enums/Consts

- **StateError** (7-27): ActiveRunExists, RunNotFound, MigrationFenceHeld, ChangesetContentConflict, Sqlite, Io errors.
- **RunRecord** (29-42): Stored run state with run_id, story_id, branch, worktree, lightweight, status, result_path, pr_url, pr_status, sync_status, next_action.
- **QueueRecord** (44-53): Auto-queue entry: story_id, source, status, attempts, max_attempts, last_run_id, last_error.
- **MigrationFenceGuard** (55-58): RAII guard for fence-protected transactions.
- **NewRunRecord** (60-72): Input type for add_run().
- **RunStateStore** (74-558): Main state database interface.

### Database Schema

**run_state Table** (lines 90-104):
- PK: run_id
- Columns: story_id, branch (nullable), worktree, lightweight (default 0), status, result_path (nullable), pr_url (nullable), pr_status (default 'missing'), sync_status (default 'not_applicable'), next_action, created_at, updated_at
- Timestamps auto-set to datetime('now')

**changeset_sync Table** (lines 105-111):
- PK: id (run_id from changesets)
- Columns: path, content_sha256 (default ''), applied (0/1), synced_at
- Immutability guard (line 420): UPDATE ... WHERE content_sha256='' OR content_sha256=excluded.content_sha256

**auto_queue Table** (lines 112-122):
- PK: story_id
- Columns: source, status, attempts (default 0), max_attempts, last_run_id (nullable), last_error (nullable), created_at, updated_at

**migration_fence Table** (lines 123-128):
- PK: singleton (CHECK singleton=1, single row)
- Columns: held (CHECK held IN (0,1)), reason, updated_at

### Run State Machine

**Active Statuses** (line 319):
- "prepared", "running"

**Terminal Statuses** (implicit, from tests line 746-756):
- "completed", "failed", "cancelled", "blocked", "needs_intake", "partial"

**State Transitions:**
- **Active → Any Terminal** (line 261-279 update_status):
  - prepared/running → completed, blocked, needs_intake, partial, failed, cancelled
  - Any terminal state releases single_active_run lock (line 323)
  
- **Completed → PR States** (line 329-363):
  - completed + no PR → pr_status='missing'
  - completed + update_pr_url() → pr_status='created', next_action='review pull request'
  - created + update_pr_status('merged') → pr_status='merged', next_action='approve sync'
  - any + update_pr_status('failed') → pr_status='failed', next_action='retry pull request creation'

### Auto-Queue State Machine

**Queue Enqueue Logic** (line 458-481):
- Quote (466-478):
  ```
  INSERT INTO auto_queue (story_id, source, status, max_attempts)
  VALUES (story_id, source, 'queued', max_attempts)
  ON CONFLICT(story_id) DO UPDATE SET
    source=excluded.source,
    status=CASE
      WHEN auto_queue.status IN ('completed', 'running') THEN auto_queue.status
      WHEN auto_queue.attempts >= auto_queue.max_attempts THEN 'failed'
      ELSE 'queued'
    END,
    max_attempts=excluded.max_attempts,
    updated_at=datetime('now');
  ```
- Initial: status='queued', attempts=0
- Re-enqueue: preserves terminal states, fails if attempts >= max_attempts, else requeues

**Queue Transitions:**
1. **queued** → **running** (mark_queue_running, line 500-509):
   - status='running', attempts++, last_error=NULL
   
2. **running** → **completed** (mark_queue_completed, line 512-521):
   - status='completed', last_run_id=run_id, last_error=NULL
   
3. **running** → **queued or failed** (mark_queue_failed, line 524-541):
   - If attempts < max_attempts: status='queued', retain for retry
   - If attempts >= max_attempts: status='failed'
   - last_error=error_message, last_run_id=run_id (optional)

**next_queued_work() Selection** (line 483-498):
- Quote (487-491):
  ```
  SELECT ... FROM auto_queue
  WHERE status='queued' AND attempts < max_attempts
  ORDER BY created_at ASC, story_id ASC
  LIMIT 1;
  ```

### Migration Fence State Machine

**Fence States:**
- held=0: released (default, no migration in progress)
- held=1: held (migration ownership handoff in progress)

**Fence Transitions:**
1. **hold_migration_fence(reason)** (151-164):
   - Singleton upsert: held=1, reason=new_reason
   - Can be called multiple times (overwrites reason)

2. **release_migration_fence()** (167-178):
   - Sets held=0

3. **ensure_migration_fence_released()** (180-194):
   - Queries held=1 rows
   - If found: error MigrationFenceHeld(reason)

4. **acquire_migration_fence_guard()** (196-216):
   - BEGIN IMMEDIATE transaction
   - Check held=1
   - If held: ROLLBACK, error MigrationFenceHeld
   - Else: return guard (transaction still open)
   - Guard.commit() → COMMIT
   - Guard drop → auto-ROLLBACK if not committed

### Single Active Run Lock

**Enforcement** (line 236-237):
- add_run() checks active_run_id() before insert
- Quote (236-237): `if let Some(active) = active_run_id(&transaction)? { return Err(StateError::ActiveRunExists(active)); }`

**Release** (line 319):
- active_run() queries WHERE status IN ('prepared', 'running')
- Any terminal status removes from active set

### Changeset Sync Invariants

**Content SHA Immutability** (line 420, 443-456):
- Quote (420): `WHERE changeset_sync.content_sha256='' OR changeset_sync.content_sha256=excluded.content_sha256;`
- Insert or update only if:
  - First write (content_sha256=''), or
  - SHA matches recorded value
- If mismatch: error ChangesetContentConflict (line 434-438)

**Synced Predicate** (line 443-456):
- changeset_synced(id, sha) returns true only if:
  - Exists in changeset_sync
  - content_sha256 matches
  - applied=1

### Public API

**Initialization:**
- init() (83-149): Creates tables with backward-compatible column migrations

**Migration Fence:**
- hold_migration_fence(reason)
- release_migration_fence()
- ensure_migration_fence_released()
- acquire_migration_fence_guard() → MigrationFenceGuard

**Run Management:**
- add_run(NewRunRecord) → checks single_active_run, records state
- update_status(run_id, status, next_action)
- list_runs() → Vec<RunRecord>, sorted by created_at DESC, run_id DESC
- show_run(run_id) → RunRecord
- active_run() → Option<RunRecord> where status IN ('prepared', 'running')

**PR Tracking:**
- update_pr_url(run_id, pr_url) → sets pr_status='created'
- update_pr_status(run_id, status) → updates pr_status, next_action
- record_pr_failure(run_id, error)

**Changeset Sync:**
- record_changeset_synced(id, path, sha256, applied) → idempotent with conflict detection
- changeset_synced(id, sha256) → bool

**Auto-Queue:**
- enqueue_work(story_id, source, max_attempts) → QueueRecord
- next_queued_work() → Option<QueueRecord>
- mark_queue_running(story_id)
- mark_queue_completed(story_id, run_id)
- mark_queue_failed(story_id, run_id, error) → QueueRecord
- queue_record(story_id) → QueueRecord

### Constants / Thresholds

- **SQLite Busy Timeout**: 300 seconds (line 88, 154, 169, 199)
  - Quote (88): `connection.busy_timeout(std::time::Duration::from_secs(300))?`
- **Max Attempts Per Story**: Controlled by config.auto_max_attempts (passed to enqueue_work)
- **Column Migration Safety** (line 130-147):
  - ALTER TABLE IF not exists (idempotent, backward compatible)

---

## Summary Coverage

All 5 files read and inventoried. No unreadable sections. Core orchestration logic fully documented:

- **run.rs**: Worktree preparation, contract generation, agent execution, result validation
- **auto.rs**: Work polling, single-active-run enforcement, retry logic, stop conditions
- **work.rs**: Work discovery, story classification, board state derivation, cycle detection
- **agent.rs**: Custom/Codex adapter dispatch, JSON-RPC protocol, environment setup, executable validation
- **state.rs**: Run/queue/fence/changeset state machines, single-active-run lock, content SHA immutability

Total lines: 4,156. All state machines, contracts, invariants, constants, and error paths documented with line numbers and code quotes.

---

**Status**: DONE  
**Summary**: Completed inventory of Symphony 2f0b257 core orchestration across 5 files. Documented state machines, contracts, invariants, configs, and thresholds.
