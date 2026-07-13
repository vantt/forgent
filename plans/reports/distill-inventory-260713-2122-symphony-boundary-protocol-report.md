# Symphony Boundary Protocol Mechanical Inventory

**Report Date:** 2026-07-13  
**Repository:** /home/vantt/projects/forgent/upstreams/symphony  
**Scope:** Typed boundary between Symphony and Harness CLI; durable changeset sync integration  

---

## File: crates/harness-symphony/src/harness_protocol.rs

**Path (relative):** crates/harness-symphony/src/harness_protocol.rs

**Size:** 893 lines

**Primary struct/purpose:**  
`HarnessProtocol` (line 68): Typed process-level client for Harness CLI orchestration protocol v1, controlling subprocess invocation, JSON envelope parsing, exit-code semantics, and timeout policies for read/mutation operations without access to Harness SQLite schema.

**Protocol/contract rules (verbatim with line numbers):**

1. **Protocol version pinning** (lines 24–28):
   - `PROTOCOL_VERSION: u32 = 1`
   - `CONTRACT_SCHEMA_MINIMUM: u32 = 1`
   - `CONTRACT_SCHEMA_MAXIMUM: u32 = 13`
   - `SUPPORTED_DATABASE_SCHEMA_MINIMUM: u32 = 12`
   - `SUPPORTED_DATABASE_SCHEMA_MAXIMUM: u32 = CONTRACT_SCHEMA_MAXIMUM`

2. **Timeout policy** (lines 30–31):
   - `DEFAULT_READ_TIMEOUT: Duration = Duration::from_secs(30)`
   - `DEFAULT_MUTATION_TIMEOUT: Duration = Duration::from_secs(300)`

3. **Output size limit** (line 29):
   - `OUTPUT_LIMIT_BYTES: usize = 16 * 1024 * 1024`

4. **Required capabilities** (lines 37–48):
   ```
   stories.read.v1, stories.write.v1, work-graph.read.v1,
   story-dependencies.read-write.v1, story-hierarchy.read-write.v1,
   changesets.apply.v1, changesets.status-sha.v1,
   isolated-db.v1, isolated-db-snapshot.v1, semantic-operation-log.v1
   ```

5. **Environment variables** (lines 449–450):
   - `HARNESS_REPO_ROOT` (working directory context)
   - `HARNESS_DB_PATH` (database path)
   - `HARNESS_RUN_ID`, `HARNESS_RUN_MODE` (optional, run-scoped)

6. **Response envelope format** (lines 167–174):
   ```rust
   struct Envelope<T> {
       protocol_version: u32,
       operation: String,
       request_id: Option<String>,
       result: Option<T>,
       error: Option<ProtocolErrorBody>,
   }
   ```

7. **Response validation rules** (lines 693–704):
   - Protocol version must match `PROTOCOL_VERSION` (line 693)
   - Operation name must match requested operation (line 699)
   - Success: `result` present, `error` absent (line 707)
   - Failure: `error` present, `result` absent (line 713)

8. **Exit code semantics** (lines 714–751):
   - Exit 0: Success
   - Exit 2: `INVALID_ARGUMENT`, `COMPATIBILITY_ERROR`, `PATH_NOT_UTF8`
   - Exit 3: `NOT_FOUND`, `CONFLICT`
   - Exit 4: `VERIFICATION_FAILED`
   - Exit 5: `OUTPUT_LIMIT_EXCEEDED`, `INTERNAL_ERROR`
   - Unknown codes in range 2–5 tolerated per line 719: "Protocol v1 permits additive errors."

9. **Output newline requirement** (lines 675–687):
   - Must end with exactly one newline (line 675)
   - Must be exactly one JSON line (line 682)
   - No newlines within body (line 682)

**Error handling (verbatim with line numbers):**

| Error Type | Returned When | Line |
|---|---|---|
| `ExecutableNotFound` | CLI not discoverable via search order | 187–188 |
| `InvalidExecutable { path }` | Configured path not executable | 189–190 |
| `Spawn { path, source }` | Child process spawn failed | 191–195 |
| `Timeout { operation, timeout_seconds }` | Operation exceeded policy duration | 196–200 |
| `OutputLimitExceeded { operation, limit }` | Combined stdout/stderr exceeded 16 MiB | 201–202 |
| `NonUtf8 { operation, stream }` | Output not valid UTF-8 | 203–207 |
| `MalformedJson { operation, reason }` | Response not valid JSON or envelope | 208–211 |
| `OperationMismatch { expected, actual }` | Envelope operation name differs | 212–213 |
| `ResultMismatch { operation, reason }` | Result fields inconsistent with request | 214–215 |
| `ProtocolVersion { expected, actual }` | Envelope or contract protocol mismatch | 216–217 |
| `SchemaContractRange { actual_minimum, actual_maximum }` | Contract schema tuple not exactly 1..=13 | 218–222 |
| `DatabaseMissing { database }` | `contract.database_state == Missing` | 223–224 |
| `DatabaseNeedsMigration { database }` | `contract.database_state == NeedsMigration` | 225–226 |
| `DatabaseUnsupported { database }` | `contract.database_state == Unsupported` or schema version out of range | 227–228 |
| `MissingCapability { capability }` | Required capability absent in contract | 229–230 |
| `MissingEnvironmentDeclaration { name }` | `HARNESS_DB_PATH` not in `required_environment_variables` | 231–232 |
| `Cli { operation, exit_code, code, message, retryable, details }` | Non-zero exit with valid error envelope | 233–241 |
| `InvalidFailureEnvelope { operation, exit_code }` | Non-zero exit without error field or zero exit without result | 242–243 |
| `ExitCodeMismatch { operation, code, exit_code }` | Error code paired with undocumented exit code | 244–249 |
| `Output { operation, source }` | I/O error collecting process output | 250–255 |

**Preflight contract validation** (lines 509–572):
- `discover_contract()` (line 309): Read-only; accepts missing DB
- `preflight()` (line 314): Calls `discover_contract()` then validates all requirements
- Validation enforces protocol version, schema contract range, database state, `HARNESS_DB_PATH` env declaration, and all required capabilities

**Key methods:**
- `discover_contract()` (309–311): Query without mutation (read timeout)
- `preflight_for(capabilities)` (318–322): Discover + validate against custom capability list
- `work_graph()` (324–326): Read work graph (read timeout)
- `snapshot(output)` (328–350): Create isolated DB snapshot (mutation timeout, validates output path matches)
- `compare_and_set_status(id, expected, status, require_runnable)` (352–385): CAS story update (mutation timeout, validates all response fields)
- `changeset_status(path)` (387–398): Inspect applied state (read timeout)
- `apply_changeset(path)` (400–414): Transactionally apply changeset (mutation timeout)

---

## File: crates/harness-symphony/src/sync.rs

**Path (relative):** crates/harness-symphony/src/sync.rs

**Size:** 635 lines

**Primary struct/purpose:**  
`SyncResult` (lines 38–40): Durable changeset application workflow; manages migration fence, preflight contract discovery before mutation, git checkout state validation, and transactional logging of applied changesets with SHA content verification.

**Protocol/contract rules (verbatim with line numbers):**

1. **Discovery-before-mutation** (lines 42–57):
   - Line 43: `let protocol = HarnessProtocol::from_config(config)?;`
   - Line 44: `protocol.preflight()?;` ← Validates before any changeset operation
   - Line 52: `let paths = changeset_files(&config.changeset_directory)?;`
   - Line 55: `changes.push(apply_changeset_path(&protocol, &store, path)?);`

2. **Changeset file naming convention** (lines 70–72):
   - Pattern: `{run_id}.changeset.jsonl` in `.harness/changesets/`

3. **Checkout dirtiness rules** (lines 186–191):
   - Permitted: `.harness/symphony.yml`, `.harness/runs/`, `.tsbuildinfo` files
   - Forbidden: Any other uncommitted changes or untracked files
   - Per line 182: `Err(SyncError::DirtyCheckout(status))`

4. **Preflight fence** (lines 45–50, 64–69):
   - Preflight called twice (before and after `refresh_checkout_from_upstream`)
   - Migration fence acquired per line 108: `let guard = store.acquire_migration_fence_guard()?;`

5. **Content SHA verification** (lines 136–141):
   - After apply, re-query changeset status (line 135)
   - Verify ID, applied flag, and content SHA match apply result (line 136)
   - Per line 139: "post-apply status did not confirm the same applied content SHA"

**Error handling (verbatim with line numbers):**

| Error Type | Returned When | Line |
|---|---|---|
| `Changeset(ChangesetError)` | Changeset parsing/IO error | 13–14 |
| `State(StateError)` | State store error (migration fence, record) | 15–16 |
| `Protocol(HarnessProtocolError)` | Contract discovery, changeset ops fail | 17–18 |
| `ResponseMismatch { path, detail }` | Harness returned inconsistent ID or SHA | 19–20 |
| `Io(std::io::Error)` | File system error | 21–22 |
| `GitFailed(String)` | Git command error (line 202) | 23–24 |
| `DirtyCheckout(String)` | Untracked/uncommitted files present | 25–26 |

**Changeset application contract** (lines 103–153):
- Line 109: Extract changeset ID from file
- Line 110: Query `changeset_status(&path)` (read-only discovery)
- Lines 117–126: If already applied, record in state and return
- Lines 128–141: Else apply via protocol, re-verify SHA/applied status
- Line 144: Record successful sync in state store
- Line 146: Commit state transaction

---

## File: crates/harness-symphony/src/changeset.rs

**Path (relative):** crates/harness-symphony/src/changeset.rs

**Size:** 315 lines

**Primary struct/purpose:**  
`RenderedChangeset` (lines 29–33): Parses JSONL changeset files; extracts run_id from mandatory `changeset.header` operation; renders semantic operations into human-readable markdown for PR summaries.

**Protocol/contract rules (verbatim with line numbers):**

1. **Changeset file format** (lines 128–144):
   - JSONL (one JSON object per line, no blank lines)
   - First operation must be `changeset.header` (line 58)
   - Line 58–59: `value.get("op").and_then(Value::as_str) == Some("changeset.header")`

2. **Header extraction** (lines 54–65):
   - Line 60–62: Extract `run_id` from header
   - Line 63: Default to "unknown" if absent
   - Used as changeset ID across protocol (line 109 in sync.rs)

3. **Rendering rules** (lines 67–88):
   - Line 78–82: Skip header, render remaining operations
   - Map each operation via `render_operation()` (line 81)
   - Operations: `intake.add`, `story.add`, `story.update`, `story.verify`, `decision.add`, `trace.add`, else generic render

**Error handling (verbatim with line numbers):**

| Error Type | Returned When | Line |
|---|---|---|
| `Io(std::io::Error)` | File I/O error | 9–10 |
| `Parse { path, line, source }` | JSON parse error at line N | 11–16 |
| `MissingHeader(String)` | No `changeset.header` operation | 17–19 |

---

## File: crates/harness-symphony/src/interface.rs

**Path (relative):** crates/harness-symphony/src/interface.rs

**Size:** 760 lines

**Primary struct/purpose:**  
`Cli` parser (lines 26–35) and `run()` orchestrator (lines 258–389): Top-level command router for Symphony; exposes CLI subcommands (version, doctor, work, run, runs, status, auto, sync, web, pr, config, migration-fence) with error aggregation via `InterfaceError` (lines 232–256).

**Protocol/contract rules (verbatim with line numbers):**

1. **Preflight gating** (lines 317–322):
   - Line 317: Construct `HarnessProtocol::from_config(&resolved)`
   - Line 318: `protocol.preflight()` before any work listing or run prep

2. **Version report contract** (lines 72–92):
   - Line 86: `harness_protocol_version: PROTOCOL_VERSION`
   - Lines 87–91: Schema mins/maxs, supported CLI versions
   - Emitted by `version --json` (lines 261–265)

3. **State store initialization** (lines 339–341):
   - `RunStateStore::new(resolved.state_db)` creates/opens state DB
   - Used by runs, sync, auto commands

**Error handling (verbatim with line numbers):**

| Error Type | Source | Line |
|---|---|---|
| `Config(ConfigError)` | Config loading/resolution | 235 |
| `Doctor(DoctorError)` | Preflight diagnostics | 236 |
| `Work(WorkError)` | Work graph query | 237–239 |
| `State(StateError)` | State store operations | 241 |
| `Run(RunError)` | Run prep/exec | 243 |
| `Sync(SyncError)` | Changeset apply | 245 |
| `Retention(RetentionError)` | Run compaction | 247 |
| `Pr(PrError)` | PR creation | 249 |
| `Auto(AutoError)` | Auto mode polling | 251 |
| `Web(WebError)` | Web server startup | 253 |
| `CurrentDir(std::io::Error)` | CWD query fails | 254–255 |

---

## File: crates/harness-symphony/src/retention.rs

**Path (relative):** crates/harness-symphony/src/retention.rs

**Size:** 133 lines

**Primary struct/purpose:**  
`compact_runs()` (lines 22–44): Run artifact retention policy; deletes old run directories by modification time, preserving only the N newest, without touching changesets.

**Protocol/contract rules (verbatim with line numbers):**

1. **Keep-last validation** (lines 26–28):
   - Must be ≥ 1: `if keep_last == 0 { return Err(RetentionError::UnsafeKeepLast) }`

2. **Artifact scope** (lines 29–42):
   - Operates on `config.runs_dir` only
   - Does NOT touch `config.changeset_directory` (per line 106 test assertion)

**Error handling (verbatim with line numbers):**

| Error Type | Returned When | Line |
|---|---|---|
| `UnsafeKeepLast` | `keep_last == 0` | 10–11 |
| `Io(std::io::Error)` | File system error | 12–13 |

---

## File: docs/contracts/harness-runtime-v1.md

**Path (relative):** docs/contracts/harness-runtime-v1.md

**Size:** 98 lines

**Purpose:**  
Public contract and compatibility matrix between Symphony and Harness CLI for protocol v1; specifies pinned tested tuple, executable discovery order, invocation boundary (env vars, timeouts, output limits), data-access patterns, and upgrade recovery procedures.

**All rules and guarantees (numbered and quoted verbatim):**

### A. Compatibility Tuple (lines 7–30)

**Rule 1:** "The first standalone Symphony release supports exactly this tested tuple:"
- Harness release: `harness-cli-v0.1.14`
- CLI version: `0.1.14`
- Protocol: `1`
- CLI schema range: `1..=13`
- Supported current database schema: `12..=13`
- Symphony config: `1`
- Run contract: `1`
- Result contract: `1`
- Required environment: `HARNESS_DB_PATH`
- Required capabilities: `stories.read.v1`, `stories.write.v1`, `work-graph.read.v1`, `story-dependencies.read-write.v1`, `story-hierarchy.read-write.v1`, `changesets.apply.v1`, `changesets.status-sha.v1`, `isolated-db.v1`, `isolated-db-snapshot.v1`, `semantic-operation-log.v1`

**Rule 2 (line 29):** "CLI `0.1.11` with schema 12 is retained only as the legacy negative fixture. It is not a supported protocol-v1 runtime."

### B. Executable Discovery (lines 32–52)

**Rule 3:** "Symphony resolves one executable in this order:" (lines 34–40)
1. `repo.harness_cli` in `.harness/symphony.yml`
2. `HARNESS_CLI_PATH`
3. `scripts/bin/harness-cli` (macOS/Linux) or `scripts/bin/harness-cli.exe` (Windows)
4. `harness-cli`/`harness-cli.exe` on `PATH`

**Rule 4 (line 43):** "Configured relative paths are resolved from `repo.root`. Paths are passed as an executable plus argument array; spaces and `.exe` suffixes never require shell quoting."

### C. Invocation Boundary (lines 54–65)

**Rule 5 (lines 56–60):**  
"Every protocol process receives an explicit working directory, `HARNESS_REPO_ROOT`, and `HARNESS_DB_PATH`. Run-scoped writes additionally receive `HARNESS_RUN_ID` and `HARNESS_RUN_MODE`. Reads time out after 30 seconds, mutations after 300 seconds, and combined stdout/stderr is capped at 16 MiB."

**Rule 6 (lines 61–65):**  
"Machine output must be exactly one newline-terminated protocol-v1 JSON envelope. Unknown additive fields are tolerated. A malformed envelope, operation mismatch, unsupported version/range, missing capability, timeout, output overflow, or undocumented exit/error pairing fails closed."

### D. Data Access and Mutation (lines 67–79)

**Rule 7 (lines 69–74):**  
"Work, dependency, and hierarchy state comes from one revisioned `query work-graph --json` call. Isolated run databases come from `db snapshot --json`, which uses SQLite's online backup protocol and includes committed WAL pages. Story status changes use compare-and-set `story update --json` operations. Changeset inspection and application use `db changeset status/apply --json`. Only `.symphony/state.db` remains directly owned through SQLite by Symphony."

**Rule 8 (line 77):**  
"Before a run, sync, selector, or Web mutation, Symphony discovers and validates the runtime contract. Failure occurs before the Harness database changes."

### E. Upgrade and Recovery (lines 80–98)

**Rule 9 (lines 82–87):**  
"Install or replace the CLI through the checksum-verified immutable release:" with provided bash/PowerShell scripts using `--upgrade-cli --ref harness-cli-v0.1.14 --yes`.

**Rule 10 (lines 96–98):**  
"Contract discovery is read-only and may run while the database is missing; database initialization remains an explicit operator action."

---

## File: docs/contracts/harness-orchestration-v1.md

**Path (relative):** docs/contracts/harness-orchestration-v1.md

**Size:** 314 lines

**Purpose:**  
Public protocol specification consumed by Symphony; defines process contract, discovery-before-mutation pattern, envelope format, exit codes, timeouts, data schemas (stories, work graph, changesets), mutation surface, and forward-compatibility rules.

**Key contract rules (verbatim with line numbers):**

1. **Protocol Additive Rule** (lines 3–7):  
   "This is the public, consumer-neutral process contract for Harness CLI protocol version `1`. It is additive: existing commands and human-readable output remain supported. A machine consumer must discover support before any mutation."

2. **Consumer Requirements** (lines 17–19):  
   "Consumers must require the recorded tag (or a later explicitly tested compatible tag), protocol `1`, schema in the advertised range, and every capability they use. They must not infer protocol support from semantic version ordering alone."

3. **Process and Environment** (lines 22–35):  
   - Invoke `scripts/bin/harness-cli` or `.exe`
   - Working repo: `HARNESS_REPO_ROOT`
   - Database: `HARNESS_DB_PATH`
   - Run logging: `HARNESS_RUN_ID` enables semantic-operation-log
   - Request tracking: `HARNESS_REQUEST_ID` (trimmed to 128 Unicode scalars)
   - "JSON strings are UTF-8. If a path cannot be represented in a JSON result, the command fails before mutation with `PATH_NOT_UTF8`."

4. **Discovery Before Mutation** (lines 37–74):  
   Line 37: "Run: `harness-cli query contract --json`"  
   Line 45–46: "Discovery is dispatched without automatic database initialization or migration. It does not create the DB, schema, changeset, trace, or WAL files."  
   Database states (lines 67–74):
   - `missing`: No DB; explicit init required, no mutations
   - `current`: Schema in range and current; proceed
   - `needs_migration`: Supported but old; explicit migrate then rediscover
   - `unsupported`: Unreadable, newer, or below floor; change CLI

5. **Capabilities Contract** (lines 76–92):  
   "Protocol-v1 capabilities are behavioral promises, not product names."  
   Required: `stories.read.v1`, `stories.write.v1`, `work-graph.read.v1`, `story-dependencies.read-write.v1`, `story-hierarchy.read-write.v1`, `changesets.apply.v1`, `changesets.status-sha.v1`, `isolated-db.v1`, `isolated-db-snapshot.v1`, `semantic-operation-log.v1`

6. **Envelope Contract** (lines 94–131):  
   Line 96: "Every `--json` command writes exactly one newline-terminated UTF-8 JSON document to stdout. It writes no progress text to stdout."  
   Success: `result` and no `error`  
   Failure: `error` and no `result`  
   Output limit (line 115): "The CLI limits its stdout machine document to 16 MiB including the trailing newline. Consumers must impose a 16 MiB limit on stdout plus stderr combined, terminate the process tree if exceeded, and treat a truncated/non-JSON response as an internal protocol failure."

7. **Exit Code Semantics** (lines 120–126):
   ```
   Exit 0: Success
   Exit 2: INVALID_ARGUMENT, COMPATIBILITY_ERROR, PATH_NOT_UTF8
   Exit 3: NOT_FOUND, CONFLICT
   Exit 4: VERIFICATION_FAILED
   Exit 5: OUTPUT_LIMIT_EXCEEDED, INTERNAL_ERROR
   ```

8. **Retryability** (lines 128–130):  
   "`retryable` is authoritative for ordinary failures. Protocol v1 currently reports `false`; a future additive error may report `true`. Consumers branch on `code`, never on `message`."

9. **Timeout Policy** (lines 132–149):  
   Line 134: "The consumer timeout is 30 seconds for discovery/read/status commands and 300 seconds for mutations, changeset apply, initialization/migration, and snapshot."  
   Line 135–136: "A deployment may configure a smaller value or a larger value capped at 120 seconds for reads and 900 seconds for mutations."  
   Line 142–143: "On timeout, output overflow, or caller cancellation, terminate the whole process tree: send `SIGTERM`, wait at most 5 seconds, then `SIGKILL` on macOS/Linux; use a Windows Job Object (or equivalent tree termination) on Windows."  
   Line 147–149: "A mutation timeout has an unknown outcome: SQLite may have committed immediately before cancellation. Therefore rediscover compatibility and query the operation's logical/status state before retrying."

10. **Runnable Definition** (lines 172–176):  
    "`runnable` is true exactly when the stored status is `planned`, the trimmed verification command is non-empty, and every direct dependency blocker is `implemented`. Hierarchy does not alter runnable state. Consumers use this field and must not reproduce the SQL rules."

11. **Consistent Work Graph** (lines 184–207):  
    Line 184: "`harness-cli query work-graph --json`"  
    Line 185: "The result contains `stories`, `dependencies`, `hierarchy`, and `revision`. All collections come from one SQLite read transaction."  
    Line 190: "`revision` is lowercase SHA-256 over the UTF-8 bytes of a compact JSON object with lexicographically ordered keys `dependencies`, `hierarchy`, and `stories`, using those ordered collections and no revision field."  
    Line 199–202: "Generic callers may use deterministic separate reads; An orchestrator making one scheduling decision uses `work-graph`, not three separate commands whose revisions could differ."

12. **Compare-and-Set Story Update** (lines 228–235):  
    "For an orchestrator status transition, `--expected-status` compares the stored status in the same write transaction. `--require-runnable` evaluates the runnable definition in that transaction. Failure returns `CONFLICT`/exit `3` and no write. Success returns the story ID, `before_status`, `after_status`, and `runnable_before`."

13. **Changeset Contract** (lines 237–253):  
    Line 239–240: "Both parse the JSONL file and return `id`, lowercase byte-exact `content_sha256`, `applied`, and operation count."  
    Line 250: "A previously applied ID with the same SHA is an idempotent skip. The same ID with different bytes is `CONFLICT`, never a skip."  
    Line 252: "Apply is transactional: either all semantic operations and its applied marker commit, or none do."

14. **Snapshot Contract** (lines 255–280):  
    Line 260: "The output path must not exist. Harness creates a temporary database beside the requested output, uses SQLite's online backup API (therefore including committed pages still present only in WAL), integrity-checks it, then atomically renames it. It never copies `harness.db` as a file and does not change source logical state."  
    Line 278–280: "`source_logical_sha256` hashes canonical logical user-table state; `graph_revision` follows the work-graph definition; `snapshot_file_sha256` hashes the completed snapshot bytes."

15. **Forward Compatibility Rule** (lines 305–313):  
    "Consumers must tolerate unknown object fields, capabilities, and error-detail fields, but not an unknown `protocol_version`, missing required field, changed field type, or undocumented exit/code pairing. Additive fields and capabilities may ship under v1. Removing/renaming a field, changing ordering/hash semantics, weakening atomicity, or changing a command's meaning requires a new protocol version. A published version is deprecated by capability/release documentation, never silently removed."

---

## Summary of Key Boundary Patterns

### 1. **Discovery-Before-Mutation Invariant**
- Every Symphony operation (run prep, sync, selector, Web mutation) begins with `protocol.preflight()`
- Preflight calls `discover_contract()` and validates protocol version, schema range, database state, capabilities
- Failure halts before any Harness DB mutation

### 2. **Timeout & Output Limits**
- Reads: 30 seconds
- Mutations: 300 seconds
- Combined stdout/stderr: 16 MiB
- Exceedance → process killed, error returned

### 3. **Content Verification**
- Changeset apply followed by status re-query to verify SHA and applied flag
- Story CAS validates ID, status, and runnable before/after
- Snapshot validates output path match

### 4. **Exit Code Determinism**
- Exit 0 = success (result + no error)
- Exit 2/3/4/5 paired with specific error codes
- Additive errors (unknown codes) tolerate 2–5 range per protocol v1 permissiveness

### 5. **State Durability**
- Symphony owns `.symphony/state.db` alone
- Harness owns `harness.db`
- Changeset records track run_id, path, content_sha256, applied flag
- Sync idempotent for same ID + SHA; conflict for same ID + different SHA

### 6. **Forward Compatibility**
- Unknown fields tolerated
- Missing fields or changed field type → break
- New capabilities added; old capabilities versioned (e.g., `stories.read.v1`)
- Protocol version bump required for breaking changes

---

## Unresolved Questions

1. **WAL recovery semantics**: When a mutation times out, docs note "SQLite may have committed immediately before cancellation." Procedure is to rediscover & re-query state. Test coverage for interrupted changeset apply not inspected.

2. **Snapshot WAL page timing**: Snapshot uses SQLite online backup including "committed WAL pages." Exact consistency boundary (whether snapshot is point-in-time or includes uncommitted locks) not specified in contracts.

3. **Error detail growth**: Contract says "`details` are a bounded object and may gain fields" but no max object size or versioning scheme for details documented.

4. **Capability deprecation**: Forward-compat rule mentions "deprecated by capability/release documentation, never silently removed" but no example or timeline given.

---

**Status:** DONE

**Summary:** Mechanical inventory of 7 files complete. Symphony-Harness boundary enforces discovery-before-mutation, deterministic exit codes, durable content SHA verification, and strict forward-compatibility tolerance. No code changes made; report file written.

**Concerns/Blockers:** None; read-only analysis complete.
