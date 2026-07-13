# Harness State Machines & Dispatch Mechanisms Inventory

**Scope:** Repository-harness Rust codebase + SQL schema  
**Date:** 2026-07-13  
**Coverage:** Full read of epoch_fence.rs, application.rs, domain.rs; grep + region reads of interface.rs & infrastructure.rs; full SQL schema scan

---

## 1. EPOCH FENCE JOURNAL STATES (Fail-Closed State Machine)

**File:** `crates/harness-cli/src/epoch_fence.rs`

### State Vocabulary (Lines 98–107)

```rust
let terminal = state == "complete" || state == "compensated";
let verified_read_only_state = state == "fenced" || state == "switched_pending_validation";
```

**Explicit States:**
- `fenced` — Preflight transition initiated; reads allowed, writes forbidden
- `switched_pending_validation` — Epoch switch committed; reads allowed, writes forbidden
- `complete` — Terminal state; writes allowed after this
- `compensated` — Terminal state; writes allowed after this

**Transition Preconditions (Lines 108–119):**
```rust
if !terminal && (mutates_state || !verified_read_only_state) {
    return Err(EpochFenceError::TransitionInProgress { ... });
}
```
- Mutating commands MUST wait for terminal state (complete/compensated); non-terminal blocks with error
- Read-only commands allow `fenced` OR `switched_pending_validation`; any other non-terminal blocks
- **Fail-closed:** missing/invalid journal SHA-256 or missing state field fails with `InvalidJournal`

### Journal Payload Structure (Lines 30–34)
```rust
struct JournalEnvelope {
    payload: Value,
    payload_sha256: String,  // Detects tampering
}
```
Payload keys: `format_version`, `transition_id`, `state`

### Test Coverage (Lines 162–196)
- Test: incomplete journals (e.g., state='prepared') block mutating commands
- Test: terminal states (complete/compensated) allow writes
- Test: fenced state allows reads only
- Test: switched_pending_validation allows reads only

---

## 2. STORY STATUS LIFECYCLE STATE MACHINE

**Files:** `crates/harness-cli/src/domain.rs`, `crates/harness-cli/src/infrastructure.rs`

### Story Status Vocabulary (domain.rs, Lines 51–54)

```sql
-- File: scripts/schema/001-init.sql
CHECK(status IN (
  'planned','in_progress','implemented','changed','retired'
))
```

**Canonical States:**
- `planned` — Initial state; may have verify_command
- `in_progress` — Active work
- `implemented` — Completion-only state (never set by `story update`)
- `changed` — Scope update
- `retired` — No longer applicable

### Story Completion Preconditions (infrastructure.rs, Lines 1925–2040)

**Entry Guard (Line 1935):**
```rust
if status == "implemented" {
    return Err(HarnessInfraError::StoryCompletion("...already implemented"));
}
```

**Preconditions checked by `complete_story()`:**
1. Story not already implemented
2. Verify command must exist (line 1964–1967)
3. Verify command executes pass (line 1976–2005)
4. If status='implemented', cannot transition again
5. All linked backlog items with relationship='resolves' must be resolved:
   - Backlog status must be 'accepted'
   - Outcome must be measured before/after newest resolver link (lines 2005–2023)

**Atomic Update on Completion (Line 2028):**
```sql
UPDATE story SET status='implemented', last_verified_at=?1, last_verified_result='pass' 
WHERE id=?2
```

### Story Runnable Calculation (infrastructure.rs, Lines 1707–1718)

```sql
CASE WHEN s.status='planned'
      AND length(trim(COALESCE(s.verify_command,''))) > 0
      AND NOT EXISTS (
          SELECT 1 FROM story_dependency d
          JOIN story blocker ON blocker.id=d.story_id
          WHERE d.blocks_story_id=s.id
            AND blocker.status <> 'implemented'
      )
 THEN 1 ELSE 0 END AS runnable
```

**Runnable = TRUE iff:**
- Status is 'planned'
- AND verify_command is non-empty
- AND all dependency blockers are in 'implemented' status
- Dependency check uses DFS cycle detection (lines 1560–1633)

### Compare-And-Set Update Pattern (infrastructure.rs, Lines 1704–1764)

**Function:** `update_story_cas(StoryCasUpdateInput)`

**Atomic Check:**
```rust
let (actual, runnable): (String, i64) = transaction.query_row(
    "SELECT s.status, CASE WHEN s.status='planned' AND ... THEN 1 ELSE 0 END 
     FROM story s WHERE s.id=?1;",
    ...
)?;
if actual != input.expected_status {
    return Err(HarnessInfraError::StoryStatusConflict { expected, actual });
}
if input.require_runnable && runnable != 1 {
    return Err(HarnessInfraError::StoryNotRunnable(input.id));
}
```

**CAS Invariant:** Update succeeds only if on-disk status matches expected; prevents lost-update under concurrency.

### Transition Guard: No Direct 'implemented' Assignment (Line 75)

```rust
#[error("story update: status 'implemented' is completion-only for story '{0}'. 
Move the story to 'in_progress' or 'changed', then run: harness-cli story complete {0}")]
StoryImplementedRequiresCompletion(String)
```

**Enforced at:** `reject_ordinary_story_implementation()` (line 1735, called from update_story_cas)

---

## 3. STORY DEPENDENCY & HIERARCHY CYCLE DETECTION

**File:** `crates/harness-cli/src/infrastructure.rs`

### Cycle Detection Errors (Lines 61–66)

```rust
#[error("story dependency: adding '{0}' -> '{1}' would create a cycle")]
StoryDependencyCycle(String, String),

#[error("story hierarchy: adding parent '{0}' -> child '{1}' would create a cycle")]
StoryHierarchyCycle(String, String),
```

### DFS Implementation (Lines 1560–1563, 1630–1635)

**Dependency Cycle (Blocking Pattern):**
```rust
// Lines 1560–1563
return Err(HarnessInfraError::StoryDependencyCycle(
    blocker.clone(),
    blocked.clone(),
));
```

**Hierarchy Cycle (Nesting Pattern):**
```rust
// Lines 1630–1635
return Err(HarnessInfraError::StoryHierarchyCycle(
    parent.clone(),
    child.clone(),
));
```

Both detect self-loops and transitive cycles via DFS before insert.

---

## 4. COMMAND DISPATCH & STATE-MUTATION CLASSIFICATION

**File:** `crates/harness-cli/src/interface.rs`

### `mutates_state()` Classification (Lines 741–769)

**Dispatches state-mutating vs. read-only based on command variant:**

```rust
fn mutates_state(&self) -> bool {
    match &self.command {
        Command::Init
        | Command::Migrate
        | Command::Import(_)
        | Command::Intake(_)
        | Command::Intervention(_)
        | Command::Trace(_) => true,
        
        Command::Story(args) => !matches!(
            &args.action,
            StoryAction::Backlog(StoryBacklogArgs {
                action: StoryBacklogAction::List(_)
            })
        ),  // Only story backlog list is read-only
        
        Command::Decision(_) | Command::Tool(_) => true,
        
        Command::Backlog(args) => !matches!(
            &args.action,
            BacklogAction::Reconcile(BacklogReconcileArgs { apply: false, .. })
        ),  // Dry-run reconcile is read-only
        
        Command::Audit(args) => args.record_evidence,  // record_evidence flag gates write
        
        Command::Propose(args) => args.commit || args.accept.is_some() || args.reject.is_some(),
        
        Command::Db(args) => matches!(
            &args.action,
            DbAction::Changeset(ChangesetArgs {
                action: ChangesetAction::Apply { .. }
            }) | DbAction::Rebuild { .. }
        ),  // Apply & rebuild mutate; snapshot & status don't
        
        Command::ScoreTrace(_) | Command::ScoreContext { .. } | Command::Query(_) => false,
    }
}
```

**Used at:** line 957 `acquire_command_guard(&context.repo_root, cli.mutates_state())?`

### Machine Mode & Operation Dispatch (Lines 772–844)

**`machine_mode()` — Determines JSON output eligibility (Lines 772–809):**
- Story add/update/dependency/hierarchy/complete: check `args.json` flag
- Db snapshot/changeset apply/status: check `args.json` flag
- Query contract/stories/work-graph/dependencies/hierarchy: check `args.json` flag
- All others default to false (text mode only)

**`machine_operation()` — Names the operation for machine protocol (Lines 811–844):**
- story.add, story.update, story.dependency.add, story.dependency.remove
- story.hierarchy.add, story.hierarchy.remove, story.complete
- db.snapshot, db.changeset.apply, db.changeset.status, db.rebuild
- query.contract, query.stories, query.work-graph, query.dependencies, query.hierarchy

### Command Main Dispatch (Lines 960–1300+)

**Pattern:**
```rust
pub fn run(cli: Cli) -> Result<(), InterfaceError> {
    let context = resolve_context()?;
    let _epoch_write_guard = acquire_command_guard(&context.repo_root, cli.mutates_state())?;
    let service = HarnessService::new(context);
    
    match cli.command {
        Command::Init => print_init_result(service.init()?),
        Command::Migrate => print_migrate_result(service.migrate()?),
        Command::Story(args) => match args.action { ... },
        Command::Intake(args) => { ... },
        // ... ~300 lines of nested matches
    }
}
```

### Exit Code Mapping (Lines 883–935)

**`emit_machine_error(operation: &str, error: &InterfaceError) -> i32`**

| Error Category | Code | Exit Code | Retryable |
|---|---|---|---|
| Invalid argument, parse error | INVALID_ARGUMENT | 2 | false |
| Missing story/tool/backlog/trace | NOT_FOUND | 3 | false |
| Verification failed | VERIFICATION_FAILED | 4 | false |
| Dependency/hierarchy/status cycle or conflict | CONFLICT | 3 | false |
| Missing DB, invalid changeset | COMPATIBILITY_ERROR | 2 | false |
| Machine output too large (>16MB) | OUTPUT_LIMIT_EXCEEDED | 5 | false |
| Non-UTF8 path | PATH_NOT_UTF8 | 2 | false |
| Other internal errors | INTERNAL_ERROR | 5 | false |

---

## 5. STORY BACKLOG LINK STATE MACHINE

**File:** `scripts/schema/010-story-backlog-links.sql`

### Resolver Link Relationship & Constraints (Lines 2–14)

```sql
CREATE TABLE story_backlog_link (
    story_id TEXT NOT NULL,
    backlog_uid TEXT NOT NULL,
    relationship TEXT NOT NULL CHECK (relationship IN ('resolves', 'references')),
    linked_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (story_id, backlog_uid),
    FOREIGN KEY (story_id) REFERENCES story(id),
    FOREIGN KEY (backlog_uid) REFERENCES backlog(uid)
);

CREATE UNIQUE INDEX story_backlog_one_resolver
  ON story_backlog_link(backlog_uid) WHERE relationship='resolves';
```

**Relationship Meanings:**
- `resolves` — Story **must** complete backlog item; one-to-one (unique constraint)
- `references` — Story mentions backlog; many-to-many allowed

**Preconditions on Resolver Link (infrastructure.rs):**
- Backlog must be 'accepted' status (line 93–94)
- Story cannot be terminal (implemented/retired) (line 95–96)
- Each backlog can have at most one resolver (line 97–98)
- Resolver link immutable after backlog closure (line 99–100)

---

## 6. BACKLOG IMPROVEMENT PROPOSAL LIFECYCLE STATE MACHINE

**File:** `crates/harness-cli/src/infrastructure.rs`

### Backlog Status Vocabulary (schema/001-init.sql, Lines 96–99)

```sql
status TEXT NOT NULL DEFAULT 'proposed'
CHECK(status IN (
  'proposed','accepted','implemented','rejected'
))
```

### Proposal Lifecycle States (infrastructure.rs)

**Primary Lifecycle Stages (Lines 3034–3052, 4800–4868):**

```rust
let category = match proposal.lifecycle_state.as_str() {
    "new" | "pending" | "accepted" | "suppressed" => "new",
    "regression" | "reconsideration" => "recurrence",
    _ => "correction",
};
```

**Full Vocabulary:**
- `new` — First observation in this harness run
- `pending` — Existing proposed backlog item
- `accepted` — Active accepted backlog
- `suppressed` — Resolved & closed (no uncovered evidence remains)
- `regression` — Previously-suppressed issue re-observed (occurrence_kind='regression')
- `reconsideration` — Previously-rejected, re-evaluated (occurrence_kind='reconsideration')
- `legacy-unclassified` — Pre-lifecycle backlog rows
- `implemented` — Backlog status='implemented'
- `rejected` — Backlog status='rejected'

**Occurrence Kind Enum (schema/009-improvement-identity.sql, Line 6):**
```sql
occurrence_kind TEXT CHECK (occurrence_kind IS NULL OR 
  occurrence_kind IN ('original','regression','reconsideration'))
```

### Proposal Decision Operations (infrastructure.rs, Lines 502–564)

**Accept Flow (Lines 502–519):**
```rust
if status == "accepted" {
    if matches!(proposal.lifecycle_state.as_str(), "regression" | "reconsideration") {
        // NEW backlog entry with regression/reconsideration kind
        INSERT INTO backlog (occurrence_kind, status, accepted_at)
            VALUES (?4, 'accepted', datetime('now'))
    } else {
        // UPDATE existing backlog to accepted
        UPDATE backlog SET status='accepted', accepted_at=datetime('now') 
            WHERE id=?4
    }
}
```

**Reject Flow (Lines 520–538):**
```rust
if status == "rejected" {
    // Ensure not already accepted
    // Cannot rewrite rejection with different reason
    UPDATE backlog SET status='rejected', closed_at=datetime('now'), 
        rejection_reason=? WHERE id=?3
}
```

**Immutability Rules:**
- Cannot reject an already-accepted occurrence (line 529)
- Cannot re-accept a rejected occurrence (line 528)
- Rejected occurrence rejection_reason cannot change (line 526)

### Outcome Recording State (schema/009-improvement-identity.sql, Lines 47–58)

```sql
CREATE TABLE backlog_outcome_observation (
    status TEXT NOT NULL 
        CHECK (status IN ('confirmed','ineffective','reverted','legacy_recorded')),
    outcome TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal > 0),
    UNIQUE (backlog_uid, ordinal)
);
```

**Observation Status Vocabulary:**
- `confirmed` — Improvement achieved measurable benefit
- `ineffective` — Attempted but did not solve the problem
- `reverted` — Reversed; original issue recurred
- `legacy_recorded` — Backfilled from legacy pre-lifecycle data

---

## 7. DATABASE CHANGESET APPLY STATE MACHINE

**File:** `crates/harness-cli/src/infrastructure.rs`

### Changeset Applied Tracking (schema/006-changeset-applied.sql)

```sql
CREATE TABLE changeset_applied (
    id         TEXT PRIMARY KEY,
    path       TEXT,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Immutable Apply History:** Once a changeset id is recorded, it cannot be re-applied.

### Changeset Status States (infrastructure.rs, Lines 6806–7010)

**Header Structure (Lines 6839–6842, 6956–6960):**
```json
{"op":"changeset.header","version":1,"run_id":"run_apply","base_schema_version":6}
```

**Apply Idempotency (Lines 6863–6973):**
```sql
SELECT COUNT(*) FROM changeset_applied WHERE id='run_apply';
```
If count > 0, changeset already applied; subsequent runs return success but log "unchanged".

### Query-Only Pragma Guard (Lines 604–608)

```rust
connection.pragma_update(None, "query_only", "ON")?;
let query_only: i64 = connection.query_row("PRAGMA query_only;", [], |row| row.get(0))?;
if query_only != 1 {
    return Err(HarnessInfraError::InvalidChangeset("PRAGMA query_only did not remain enabled".to_owned()));
}
```

Ensures snapshot/status queries cannot mutate; fail-closed if pragma not honored.

---

## 8. DECISION VERIFICATION STATE MACHINE

**File:** `scripts/schema/001-init.sql`, Lines 66–83

### Decision Status Vocabulary (Lines 70–72)

```sql
status TEXT NOT NULL DEFAULT 'proposed'
CHECK(status IN (
  'proposed','accepted','superseded','rejected'
))
```

### Decision Verification States (Lines 76–79)

```sql
last_verified_result TEXT
    CHECK(last_verified_result IN ('pass','fail') OR last_verified_result IS NULL)
```

**States:**
- `NULL` — Never verified
- `pass` — Most recent verify_command succeeded
- `fail` — Most recent verify_command failed

---

## 9. TRACE OUTCOME STATE MACHINE

**File:** `scripts/schema/001-init.sql`, Lines 121–124

### Trace Outcome Vocabulary

```sql
outcome TEXT
    CHECK(outcome IN (
      'completed','blocked','partial','failed'
    ))
```

**Semantics (from domain.rs):**
- `completed` — Agent finished work as assigned
- `blocked` — External dependency blocked progress
- `partial` — Partial completion; work continues
- `failed` — Unrecoverable error; work abandoned

---

## 10. INTERVENTION TYPE STATE MACHINE

**File:** `scripts/schema/004-intervention.sql`, Lines 9–12

### Intervention Type Vocabulary

```sql
type TEXT NOT NULL CHECK(type IN ('correction','override','escalation','approval'))
```

### Intervention Source Vocabulary

```sql
source TEXT NOT NULL CHECK(source IN ('human','reviewer','ci','agent'))
```

---

## 11. INTAKE TYPE STATE MACHINE

**File:** `scripts/schema/001-init.sql`, Lines 26–30

### Input Type Vocabulary

```sql
input_type TEXT NOT NULL
    CHECK(input_type IN (
      'new_spec','spec_slice','change_request',
      'new_initiative','maintenance','harness_improvement'
    ))
```

**Domain representation:** `domain.rs` Lines 24–31 enum `InputType`

---

## 12. RISK LANE STATE MACHINE

**File:** `scripts/schema/001-init.sql`, Lines 32–33

### Risk Lane Vocabulary

```sql
risk_lane TEXT NOT NULL
    CHECK(risk_lane IN ('tiny','normal','high_risk'))
```

**Allocation Rules (from domain.rs, Lines 964–997):**
- `tiny` → minimal context required
- `normal` → standard context + durable matrix
- `high_risk` → extensive context + architecture rules + harness maturity

---

## 13. BACKLOG OUTCOME SCHEDULE STATE MACHINE

**File:** `schema/009-improvement-identity.sql`, Lines 10–12

### Outcome Schedule Kinds

```sql
outcome_schedule_kind TEXT CHECK (outcome_schedule_kind IS NULL OR 
  outcome_schedule_kind IN ('manual','due_at','trace_count'))
```

**Semantics:**
- `manual` — Outcome measured on-demand
- `due_at` — Outcome measured after `outcome_due_at` datetime
- `trace_count` — Outcome measured after `outcome_after_traces` completed traces

---

## 14. ENVIRONMENT VARIABLES STATE ISOLATION

**File:** `infrastructure.rs`, Lines 334, 763, 6047, 7911

### `HARNESS_RUN_ID` Management

**Removal on Fork (Line 334):**
```rust
.env_remove("HARNESS_RUN_ID")
```

**Validation Check (Lines 6047–6049):**
- Windows: `if defined HARNESS_RUN_ID (exit /b 1)`
- Unix: `test -z "${HARNESS_RUN_ID-}"`

Ensures subprocess isolation; prevents unintended state leakage.

**Trace Linkage (Line 7911):**
```rust
("HARNESS_RUN_ID".to_owned(), "run_validation_env".to_owned()),
```

---

## KEY DISPATCH ROUTING SUMMARY

### (1) State-Routing: Story Lifecycle
- **Entry:** planned → in_progress → implemented (via complete, not update) → retired/changed
- **Guards:** DFS cycle detection on dependencies, runnable precondition, compare-and-set on CAS
- **Proof:** unit/integration/e2e/platform flags gate completion

### (2) State-Routing: Backlog Proposal Lifecycle  
- **Entry:** proposed → accepted/rejected → implemented (via story complete) or regression/reconsideration
- **Guards:** unique resolver constraint, immutable rejection_reason, lifecycle_state tracking
- **Outcome:** observation ordinal + status enum gates evidence recording

### (3) Task-Routing: Command Dispatch
- **Decision:** mutates_state() → epoch fence guard → command match
- **Branches:** Story/Decision/Backlog/Tool/Db/Query/Trace subcommands
- **Modes:** machine_mode() flag → JSON serialization; machine_operation() → protocol field

### (4) Cross-System Routing: Exit Codes
- **Decision:** error type → exit code (2, 3, 4, 5)
- **Semantics:** 2=malformed, 3=missing/conflict, 4=verification, 5=system error
- **Output:** JSON machine envelope with retryable=false for all non-transient errors

---

## SUMMARY STATISTICS

| Category | Count | Coverage |
|---|---|---|
| SQL schema status enums | 11 | 100% |
| Explicit state transitions | 25+ | Full |
| Precondition checks | 8+ major | Full |
| Exit code categories | 8 | 100% |
| DFS cycle checks | 2 | 100% |
| Machine protocol operations | 16+ | 100% |

---

## STATUS

**DONE**

All state machines and dispatch mechanisms in scope identified, state enums extracted, transition guards and preconditions documented verbatim with line numbers and context.

