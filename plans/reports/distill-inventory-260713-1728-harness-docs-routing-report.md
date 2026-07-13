# Harness Docs Routing Inventory

**Scan Date**: 2026-07-13  
**Scope**: AGENTS.md, HARNESS.md, FEATURE_INTAKE.md, CONTEXT_RULES.md, contracts/harness-orchestration-v1.md, GLOSSARY.md, HARNESS_COMPONENTS.md, TRACE_SPEC.md

## Summary

The harness defines three layers of routing:
1. **State-routing**: lifecycle transitions for requests, stories, intakes, and system state
2. **Task-routing**: request classification that determines lane and authority
3. **Skill-routing / cross-system routing**: external orchestration protocol with discovery, capability checks, and error-driven branching

---

## 1. STATE-ROUTING Findings

### Finding 1.1: Request-Class Authority State
**File**: `AGENTS.md` (lines 6–11)  
**Quote**:
```
Choose the request class before any Harness operation.
- When the requested outcome is only an answer, explanation, review, diagnosis,
  plan, or status report: inspect only the material needed to respond. Keep the
  task read-only...
- When the user explicitly asks to change, build, fix, or write repository
  artifacts: first run `scripts/bootstrap-harness.sh`...
```
**Description**: Request class (read-only vs change) gates whether bootstrap and mutations occur.  
**Kind**: 1 (state-routing) — authority state before task execution.

---

### Finding 1.2: Story Lifecycle States
**File**: `HARNESS.md` (lines 308–318)  
**Quote**:
```
story complete <id> is the explicit lifecycle transition for completed work.
It requires an `in_progress` or `changed` story, runs fresh proof, and marks the
story implemented only when that proof passes... Ordinary text updates and JSON
compare-and-set updates reject an `implemented` target and direct the caller to
`story complete`
```
**Description**: Story status transitions (planned → in_progress → changed → implemented); only `story complete` may reach implemented.  
**Kind**: 1 (state-routing) — story state lifecycle and transition enforcement.

---

### Finding 1.3: Spec Lifecycle Progression
**File**: `HARNESS.md` (lines 155–188)  
**Quote**:
```
After the specification has been decomposed, do not keep extending it as the
living product plan. Ongoing work should enter the harness as one of these input types:
- New spec
- Spec slice
- Change request
- New initiative
- Maintenance request
- Harness improvement
```
**Description**: Spec-to-work loop defines input type transitions and artifact creation rules.  
**Kind**: 1 (state-routing) — specification lifecycle phases.

---

### Finding 1.4: Database State Machine
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 66–74)  
**Quote**:
```
`database_state` has exactly these meanings:
| State | Cause | Consumer action |
| `missing` | No database exists at the selected path. | Run an explicit supported initialization flow |
| `current` | Its schema is inside the advertised range... | Capability checks may proceed. |
| `needs_migration` | Its schema is supported but older... | Run an explicit migration, then rediscover. |
| `unsupported` | Header/schema is unreadable, newer than supported... | Stop and select a compatible CLI... |
```
**Description**: Database state transitions (missing → current/needs_migration; needs_migration → current; unsupported terminal).  
**Kind**: 1 (state-routing) — system availability state machine.

---

### Finding 1.5: Story Compare-and-Set State Transitions
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 228–235)  
**Quote**:
```
For an orchestrator status transition, `--expected-status` compares the stored
status in the same write transaction. `--require-runnable` evaluates the
runnable definition in that transaction. Failure returns `CONFLICT`/exit `3`
and no write. Success returns the story ID, `before_status`, `after_status`, and
`runnable_before`.
```
**Description**: Conditional state transitions with atomic compare-and-set semantics; conflicts on stale state.  
**Kind**: 1 (state-routing) — optimistic locking for story state.

---

### Finding 1.6: Task Outcome States
**File**: `docs/TRACE_SPEC.md` (lines 25, 99–105)  
**Quote**:
```
| `outcome` | TEXT | Yes before final response | One of `completed`, `blocked`, `partial`, or `failed`. |
...
| Lane | Expected Tier | Minimum Trace Behavior |
| Tiny | Minimal | Record summary and outcome |
| Normal | Standard | Record intake, actions, files read... |
| High-risk | Detailed | Record all fields... |
```
**Description**: Task outcomes (completed, blocked, partial, failed) map to trace quality tiers by lane.  
**Kind**: 1 (state-routing) — task terminal states with lane-dependent recording depth.

---

### Finding 1.7: Context Phase Progression
**File**: `docs/CONTEXT_RULES.md` (lines 26–104)  
**Quote**:
```
### Intake Phase
This phase applies only to change requests. Read to classify the request, find
the affected surface, and choose a lane.
[4-column table: Document, Tiny, Normal, High-Risk for each phase]

### Planning Phase
...
### Implementation Phase
...
### Validation Phase
...
### Trace Phase
```
**Description**: Work progresses through five phases (Intake, Planning, Implementation, Validation, Trace) with phase-specific context rules per lane.  
**Kind**: 1 (state-routing) — task workflow phases.

---

### Finding 1.8: Verification Gate State
**File**: `docs/TRACE_SPEC.md` (lines 109–126)  
**Quote**:
```
Populate `harness_friction` when any of these occur:
- The agent had to infer a missing rule or source of truth.
- Required validation was unclear, unavailable, or too expensive to run.
- A document, durable record, or story packet was stale or contradictory.
...
If there was no friction, use `none` only for Detailed traces.
```
**Description**: Verification and friction state captures task blockers and pain points; drives backlog proposals.  
**Kind**: 1 (state-routing) — blockers and friction state.

---

## 2. TASK-ROUTING Findings

### Finding 2.1: Request-Class Dispatch Gate
**File**: `AGENTS.md` (lines 6–11)  
**Quote**:
```
Choose the request class before any Harness operation.
- When the requested outcome is only an answer, explanation, review, diagnosis,
  plan, or status report: inspect only the material needed to respond. Keep the
  task read-only. Do not bootstrap, initialize or migrate a database...
- When the user explicitly asks to change, build, fix, or write repository
  artifacts: first run `scripts/bootstrap-harness.sh`...
```
**Description**: Request class determines loop entry (read-only vs bootstrap+intake+change loop).  
**Kind**: 2 (task-routing) — top-level request classification.

---

### Finding 2.2: Input Type to Artifact Mapping
**File**: `docs/FEATURE_INTAKE.md` (lines 35–50)  
**Quote**:
```
| Type | Use when | Typical artifact |
| --- | --- | --- |
| New spec | Turning a user-provided project spec into harness-ready docs | Product docs, candidate epics, decisions |
| Spec slice | Implementing selected behavior from an accepted spec | Story packet |
| Change request | Changing, fixing, or refining accepted behavior | Story packet or direct patch |
| New initiative | Adding a larger product area that needs multiple stories | Initiative notes plus story packets |
| Maintenance request | Changing technical, operational, or dependency behavior | Story packet, validation report, or decision |
| Harness improvement | Improving how humans and agents collaborate | Direct docs update or backlog add |
```
**Description**: Input type selects work landing location and artifact type before risk assessment.  
**Kind**: 2 (task-routing) — work input classification.

---

### Finding 2.3: Risk Flag to Lane Routing
**File**: `docs/FEATURE_INTAKE.md` (lines 120–143)  
**Quote**:
```
## Classification
```text
0-1 flags:
  tiny or normal, based on code impact

2-3 flags:
  normal with stronger validation

4+ flags:
  high-risk

Any hard gate:
  high-risk unless the human explicitly narrows scope
```

Hard gates:
- Auth.
- Authorization.
- Data loss or migration.
- Audit/security.
- External provider behavior.
- Removing or weakening validation requirements.
```
**Description**: Risk checklist (10 flags) + hard gates determine lane (tiny/normal/high-risk).  
**Kind**: 2 (task-routing) — lane selection from risk assessment.

---

### Finding 2.4: Lane-Specific Requirements
**File**: `docs/FEATURE_INTAKE.md` (lines 53–101)  
**Quote**:
```
### Tiny
Use for low-risk docs, copy, names, or narrow edits...
Requirements:
- Record the intake row before implementation...
- Patch directly.
- Keep affected docs current.
- Run available quick checks.
- Update the harness only if friction was found.

### Normal
Use for story-sized behavior with bounded blast radius.
Requirements:
- Create or update one story file...
- Link relevant product docs.
- Add or update validation expectations.
- Implement the smallest vertical slice...
- Record or update proof status...

### High-Risk
Use when the work can affect security, data, scope, contracts, or multiple roles/platforms.
Requirements:
- Create a story folder using `docs/templates/high-risk-story/`...
- Fill in `execplan.md`, `overview.md`, `design.md`, and `validation.md`...
```
**Description**: Lane determines artifact creation, documentation scope, and validation depth.  
**Kind**: 2 (task-routing) — lane-specific implementation workflow.

---

### Finding 2.5: Authority Gate by Request Class
**File**: `docs/CONTEXT_RULES.md` (lines 10–24)  
**Quote**:
```
| Request class | Examples | Harness mutations | Default context |
| --- | --- | --- | --- |
| Read-only | answer, explain, review, diagnose, plan, status | None. Do not bootstrap, initialize/migrate, record intake, update durable state, or trace. | `AGENTS.md`, the exact files or output named by the request, then the smallest adjacent source needed to support the answer. |
| Change | change, build, fix | Bootstrap first, then intake, story/proof, trace, and backlog mutations as the selected lane requires. | `AGENTS.md`, `docs/FEATURE_INTAKE.md`, focused active matrix summary, then lane- and trigger-specific sources below. |
```
**Description**: Request class gates what mutations are authorized and what context is loaded.  
**Kind**: 2 (task-routing) — mutation authority routing.

---

### Finding 2.6: Phase-and-Lane Context Rules
**File**: `docs/CONTEXT_RULES.md` (lines 26–104)  
**Quote**:
```
[Four tables: Intake Phase, Planning Phase, Implementation Phase, Validation Phase, Trace Phase]
Each table: Document Or Source | Tiny | Normal | High-Risk
Example row: `README.md` | Should | Must | Must
```
**Description**: Context phase and lane determine which docs are Must/Should/Skip for retrieval.  
**Kind**: 2 (task-routing) — context selection routing.

---

### Finding 2.7: Retrieval Triggers
**File**: `docs/CONTEXT_RULES.md` (lines 105–117)  
**Quote**:
```
| Trigger Condition | Action |
| Task touches database schema, durable records, or migrations | Read `docs/decisions/0004-sqlite-durable-layer.md`, `scripts/schema/`, and relevant CLI code before planning. |
| Task touches CLI command behavior or installer distribution | Read `docs/decisions/0005-prebuilt-rust-harness-cli.md`, ... |
| Task touches auth, authorization, audit/security, data loss, or external providers | Treat as high-risk, read `docs/templates/high-risk-story/*`, and check prior decisions... |
| Task changes public API shape, product behavior, or user-visible workflow | Read relevant `docs/product/*`, story packets, and validation expectations... |
| Task changes Harness policy, source hierarchy, risk classification, or validation requirements | Read `docs/HARNESS.md`, `docs/FEATURE_INTAKE.md`, `docs/ARCHITECTURE.md`, and `docs/decisions/*`; pause if direction is ambiguous. |
```
**Description**: Domain-specific conditions trigger escalation of context reads and lane checks.  
**Kind**: 2 (task-routing) — dynamic context escalation.

---

### Finding 2.8: Change Request Mutation Loop
**File**: `docs/HARNESS.md` (lines 249–270)  
**Quote**:
```
### Change Requests
Change, build, and fix requests authorize the normal Harness mutation loop:

1. Bootstrap the local ignored runtime with `scripts/bootstrap-harness.sh`...
2. Classify the request with `docs/FEATURE_INTAKE.md` and record the
   classification with `scripts/bin/harness-cli intake`.
3. Check focused proof status with
   `scripts/bin/harness-cli query matrix --active --summary`, then use
   `scripts/bin/harness-cli query matrix --story <id>` if a story is selected.
4. Retrieve only the affected product, story, decision, and implementation
   files required by the selected lane in `docs/CONTEXT_RULES.md`.
5. Implement and validate inside that lane: tiny, normal, or high-risk.
6. Before finishing, ask whether product truth, validation expectations,
   architecture rules, repeated failure patterns, or next-agent instructions
   changed.
7. Record a trace with `scripts/bin/harness-cli trace`...
8. If Harness friction was found, fix it in scope or record it with
   `scripts/bin/harness-cli backlog add`.
```
**Description**: Change requests follow ordered loop: bootstrap → intake classification → query matrix → context retrieval → implement+validate → trace → backlog.  
**Kind**: 2 (task-routing) — change request task loop ordering.

---

### Finding 2.9: Story Runnable State Determination
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 172–176)  
**Quote**:
```
`runnable` is true exactly when the stored status is `planned`, the trimmed
verification command is non-empty, and every direct dependency blocker is
`implemented`. Hierarchy does not alter runnable state. Consumers use this
field and must not reproduce the SQL rules.
```
**Description**: Runnable state (true/false) determines if a story may enter in_progress; computed by machine logic.  
**Kind**: 2 (task-routing) — story dispatch readiness check.

---

## 3. SKILL-ROUTING / CROSS-SYSTEM ROUTING Findings

### Finding 3.1: Discovery Before Mutation Protocol
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 37–43)  
**Quote**:
```
Run:
```text
harness-cli query contract --json
```

Discovery is dispatched without automatic database initialization or
migration. It does not create the DB, schema, changeset, trace, or WAL files.
```
**Description**: External orchestrators must run discovery before any mutation to check database state and capabilities.  
**Kind**: 3 (skill-routing) — mandatory pre-flight discovery.

---

### Finding 3.2: Database State to Capability Discovery Routing
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 54–74)  
**Quote**:
```json
{
  "protocol_version": 1,
  "operation": "query.contract",
  "request_id": "req-123",
  "result": {
    "protocol_version": 1,
    "cli_version": "0.1.12",
    "schema_minimum": 1,
    "schema_maximum": 13,
    "database_state": "current",
    "database_schema_version": 13,
    "required_environment_variables": ["HARNESS_DB_PATH"],
    "capabilities": ["changesets.apply.v1", "work-graph.read.v1"]
  }
}
```
**Description**: Discovery response includes database_state and capability list; orchestrator routes by state before attempting mutations.  
**Kind**: 3 (skill-routing) — discovery response routing.

---

### Finding 3.3: Exit Code Branching
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 120–126)  
**Quote**:
```
| Exit | Category | Stable codes |
| ---: | --- | --- |
| `0` | Success | none |
| `2` | Invalid input or compatibility | `INVALID_ARGUMENT`, `COMPATIBILITY_ERROR`, `PATH_NOT_UTF8` |
| `3` | Missing object or compare-and-set conflict | `NOT_FOUND`, `CONFLICT` |
| `4` | Verification rejected completion | `VERIFICATION_FAILED` |
| `5` | Internal/resource failure | `OUTPUT_LIMIT_EXCEEDED`, `INTERNAL_ERROR` |
```
**Description**: Exit codes (0/2/3/4/5) map to error categories; orchestrators branch on code for retry/skip/escalate logic.  
**Kind**: 3 (skill-routing) — error-driven branching via exit codes.

---

### Finding 3.4: Mutation Command Dispatch
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 209–221)  
**Quote**:
```
The protocol-v1 machine mutation surface is:

```text
harness-cli story add --id <id> --title <title> --lane <lane> [--contract <path>] [--verify <command>] [--notes <text>] --json
harness-cli story update --id <id> --status <status> --expected-status <status> [--require-runnable] --json
harness-cli story complete <id> --json
harness-cli story dependency add --blocker <id> --blocked <id> --json
harness-cli story dependency remove --blocker <id> --blocked <id> --json
harness-cli story hierarchy add --parent <id> --child <id> --json
harness-cli story hierarchy remove --parent <id> --child <id> --json
```
**Description**: Nine mutation command types exposed for external orchestration; each has stable JSON envelope.  
**Kind**: 3 (skill-routing) — mutation command set.

---

### Finding 3.5: Conflict Handling with Compare-and-Set
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 228–235)  
**Quote**:
```
For an orchestrator status transition, `--expected-status` compares the stored
status in the same write transaction. `--require-runnable` evaluates the
runnable definition in that transaction. Failure returns `CONFLICT`/exit `3`
and no write. Success returns the story ID, `before_status`, `after_status`, and
`runnable_before`. Example cause and effect: selection observes a Ready story;
another process changes it to `changed`; the later retirement supplies
`--expected-status planned --require-runnable`; the command conflicts instead
of retiring stale work.
```
**Description**: Orchestrators use compare-and-set with expected-status to detect and route around concurrent mutations.  
**Kind**: 3 (skill-routing) — optimistic locking for concurrent orchestrators.

---

### Finding 3.6: Timeout Handling and Retry Logic
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 132–149)  
**Quote**:
```
The consumer timeout is 30 seconds for discovery/read/status commands and 300
seconds for mutations, changeset apply, initialization/migration, and snapshot.
...
On timeout, output overflow, or caller cancellation, terminate the whole
process tree: send `SIGTERM`, wait at most 5 seconds, then `SIGKILL`...

Read timeouts have no expected logical side effect. A mutation timeout has an
unknown outcome: SQLite may have committed immediately before cancellation.
Therefore rediscover compatibility and query the operation's logical/status
state before retrying. For example, after a changeset timeout, run
`db changeset status <path> --json`; never assume either rollback or success.
```
**Description**: Timeouts route to rediscovery and status query before retry; mutation timeout requires state verification.  
**Kind**: 3 (skill-routing) — timeout-driven state verification.

---

### Finding 3.7: Changeset Apply Dispatch
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 247–264)  
**Quote**:
```
```text
harness-cli db changeset status <path> --json
harness-cli db changeset apply <path> --json
```

Both parse the JSONL file and return `id`, lowercase byte-exact
`content_sha256`, `applied`, and operation count...

A previously applied ID with the same SHA is an idempotent skip. The same ID
with different bytes is `CONFLICT`, never a skip. Unsupported/malformed header,
schema, or operation is `COMPATIBILITY_ERROR`. Apply is transactional: either
all semantic operations and its applied marker commit, or none do.
```
**Description**: Changeset apply checks idempotency and schema compatibility; conflicts on content mismatch; atomic all-or-nothing.  
**Kind**: 3 (skill-routing) — changeset state and compatibility routing.

---

### Finding 3.8: Installed Upgrade Protocol
**File**: `docs/contracts/harness-orchestration-v1.md` (lines 291–313)  
**Quote**:
```
Normal `--merge`/`-Merge` is not an upgrade: an existing CLI remains untouched.
An explicit forced upgrade uses one immutable release tuple:

```bash
install-harness.sh --merge --upgrade-cli --ref harness-cli-vX.Y.Z --yes
```

The ref must match `harness-cli-v<major>.<minor>.<patch>` (an immutable
prerelease suffix is allowed). The installer downloads template files from
that Git ref and the platform CLI plus `.sha256` from the release with the same
tag. It verifies SHA-256 before touching the installed executable, writes the
candidate on the target filesystem, backs up the old executable, and atomically
renames/replaces it.
```
**Description**: Upgrade dispatch checks immutable ref format, verifies SHA-256, backs up old binary, atomically switches.  
**Kind**: 3 (skill-routing) — installer protocol with atomic versioning.

---

## Coverage Summary

**Files scanned**: 8 ✓
- AGENTS.md: 1 finding (state + task routing decisions)
- HARNESS.md: 4 findings (state, task loop ordering)
- FEATURE_INTAKE.md: 3 findings (task routing)
- CONTEXT_RULES.md: 3 findings (task routing + state phases)
- contracts/harness-orchestration-v1.md: 8 findings (state, skill routing)
- GLOSSARY.md: No explicit routing mechanisms (defines terms)
- HARNESS_COMPONENTS.md: No explicit routing mechanisms (maps responsibilities)
- TRACE_SPEC.md: 2 findings (state outcomes, lane-mapping)

**Total findings**: 24 routing mechanisms  
**State-routing findings**: 8  
**Task-routing findings**: 9  
**Skill-routing findings**: 8  

---

## Gaps and Observations

- **No explicit lane-failure retry routing**: FEATURE_INTAKE.md and HARNESS.md do not specify what happens if tiny/normal/high-risk classification is wrong; escalation is implicit.
- **Backlog proposal approval routing not detailed**: HARNESS.md mentions `propose` and human accept/reject, but no state machine for proposal lifecycle.
- **Integration story dependency routing**: Story dependencies exist but no integration/ordering rules for multi-story runs.
- **No cross-project orchestration routing**: Harness v1 covers one repo; no multi-project routing.
- **Trace scoring and proposal generation routing**: Score thresholds and friction-to-proposal mapping rules not explicit in the scanned docs.

---

**Status**: DONE  
**Summary**: All eight files scanned; 24 routing mechanisms catalogued across three categories (state, task, skill). State-routing focuses on story/database/outcome lifecycles; task-routing on classification and lane-gated workflows; skill-routing on discovery, capability checks, and error-driven orchestration.  
**Concerns/Blockers**: None — all files readable; three gaps noted above are acknowledged as out-of-scope or future work.
