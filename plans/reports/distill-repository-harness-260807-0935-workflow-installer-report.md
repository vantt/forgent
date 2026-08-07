# Repository-Harness Inventory Report
## Workflow Decoupling, Installer/Release Pipeline, and Installation Profiles

**Report Date:** 2026-08-07  
**Subject Repo:** upstreams/repository-harness  
**Indexed Commit:** 9cc306d → 0a79bbe  
**Scope:** Phase 1–5 workflow series, core-state reproducibility scripts, installation profiles, and compatibility boundaries

---

## Phase Plans Summary

### Phase 1: Workflow Decoupling
- **Date:** 2026-07-20
- **Status:** Completed and activated
- **Goal:** Replace the database-centered default task lifecycle with repository-centered workflows. Ordinary bounded changes require no Harness CLI mutation. Complex work remains resumable through a Git-native execution plan.
- **Mechanical Changes:**
  - Removed mandatory operational ledger from default task path (preserved implementation/state)
  - Introduced three independent questions instead of one lane: durable memory, human judgment, validation
  - Added `docs/plans/active/` and `docs/plans/completed/` directories
  - Created one execution-plan template
  - Marked database-centered documents as compatibility surfaces where no longer authoritative
  - Updated installer and documentation surfaces to expose same default workflow across Bash, PowerShell, Claude
- **Outcome/Status:**
  - Default path now uses repository and Git-native plans without Harness CLI mutations
  - Existing CLI, SQLite state, changesets, protocol, installer upgrades remain compatible
  - Measured effect: 59% less mandatory context (997 words vs. 2,413); zero Harness commands for bounded scenarios; ambiguous-task intervention tied to consequence, not vocabulary; one evolving plan per complex fixture vs. multiple lifecycle records
  - All 8 validation gates passed (installer/agent-authority/workflow evaluation/protocol tests)

### Phase 2: Knowledge Boundary and Payload Reduction
- **Date:** 2026-07-21
- **Status:** Completed
- **Goal:** Make the repository-centered Harness a physically small, unambiguous installable core. Default installations receive only current repository workflow and Git-native knowledge/planning structure. Rust CLI, SQLite runtime, orchestration contract, legacy lifecycle remain supported as explicit compatibility bundle.
- **Mechanical Changes:**
  - Classified every installed and source-only artifact as `core`, `compatibility`, `upstream-only`, or `historical`
  - Defined minimal default consumer payload (exactly 10 core files)
  - Separated core and compatibility installation profiles
  - Made CLI and runtime one explicit, atomic compatibility add-on
  - Introduced compatibility window before core-only became default
  - Stopped installing upstream `repository-harness` product and maintenance material as consumer truth
  - Created separate indexes for current, compatibility, and historical knowledge
  - Added `scripts/harness-install-files.txt` (core profile) and `scripts/harness-cli-install-files.txt` (optional CLI)
- **Outcome/Status:**
  - Default fresh install: exactly 10 core files, no CLI binary download, no schema, bootstrap, SQLite lifecycle, orchestration, legacy story/scoring/audit/proposal files
  - Optional `--with-cli` / `-WithCli` selects complete, checksum-verified compatibility bundle (14 additional files + migrations + binary)
  - Core refresh leaves existing CLI and database untouched
  - All 6 validation jobs passed (Bash/PowerShell modes, manifest links, protocol, upgrade, changeset tracking)

### Phase 3: Decision-Boundary Replay
- **Date:** 2026-07-21
- **Status:** Completed
- **Goal:** Replace stale root Phase 3 definition with repository-centered objective. Strengthen installed core so agents stop before inventing externally observable policy. Replay exact failed `e-inna-brain` task in fresh worktree to verify behavior.
- **Mechanical Changes:**
  - Preserved old 334-line `PHASE3.md` as `docs/compatibility/phase-3-active-observability-legacy.md` with explicit superseded boundary
  - Replaced root `PHASE3.md` with current application-legibility and decision-boundary phase definition
  - Added historical compatibility banners to root `PHASE4.md` and `PHASE5.md`
  - Added policy-source gate to `AGENTS.md`, its canonical installer block, and `docs/WORKFLOW.md`
  - Added mechanical assertions to authority, documentation, and repository-workflow evaluation tests
  - Created isolated Harness feature worktree at commit `748d35f`, installed committed core into fresh consumer worktree
- **Outcome/Status:**
  - Decision-boundary replay passed: agent independently found HTTP boundary/contracts/configuration, identified absent rate-limit policy, made no application change, enumerated necessary decision set and declared blocker, stopped without intervention
  - Cause/effect: single compact authority rule plus one discriminating example changed behavior from `find gap → invent defaults → human interruption` to `find gap → explain consequences → stop with no diff`
  - Local commit `748d35f` (docs hardening), frozen without push
  - All validation gates passed; full pre-merge contract passed on fresh worktree

### Phase 3: Durable State Publication
- **Date:** 2026-07-21
- **Status:** Completed
- **Goal:** Publish evidence-backed durable Phase 3 state beside Phase 1 and Phase 2 transitions. Open pull request without claiming application capabilities the `e-inna-brain` pilot did not exercise.
- **Mechanical Changes:**
  - Recorded lasting Phase 3 scope and evidence boundary in decision 0021
  - Updated `PHASE3.md` to state end-to-end target and map workstreams to observed e-inna proof
  - Linked decision and retained evidence from current source indexes
  - Added focused doc-contract assertions
  - Created durable state commit at `0747c44` with decision 0021 plus P3-01 through P3-07 evidence matrix
  - Pushed feature branch `feature/phase3-decision-boundary-replay` and opened PR #53 to `main`
- **Outcome/Status:**
  - PR #53 contains core decision-boundary correction, clean e-inna replay, decision 0021 with evidence matrix
  - Records e-inna work as completed first checkpoint; keeps Reduction Phase 3 active until real runtime/interface loop exercised
  - Full pre-merge contract passed locally before publication

### Phase 4: Control-Plane Freeze
- **Date:** 2026-07-21
- **Status:** Complete
- **Goal:** Freeze new upstream reliance on SQLite lifecycle while preserving existing state as readable compatibility history. Keep protocol-v1 orchestration operational behind explicit compatibility boundary.
- **Mechanical Changes:**
  - Preserved old root Phase 4 roadmap under `docs/compatibility/`
  - Published decision 0022 with staged `warn → inventory → require explicit compatibility intent → freeze accidental writes` runway
  - Classified rows absent from current Git indexes as compatibility history (not active authority)
  - Identified all real write consumers in Rust interface without changing parser or repository implementation
  - Inspected active-looking rows and all CLI callers; exported only genuine current authority; classified historical rows without rewriting status
  - Required `--compatibility-write` flag for human lifecycle writes to upstream default database; permit with flag but reject unflagged
  - Kept JSON machine operations, installed consumer behavior, schemas, stored rows, command paths, protocol capabilities unchanged
  - Added native-artifact proof for rejection, explicit maintenance, machine JSON, isolated databases, installed consumers, reads, migrations
- **Outcome/Status:**
  - Direct inventory: no current upstream product/execution authority exists only in SQLite
  - Active-looking legacy: 3 planned stories (E10 history), 5 proposed backlog items, 133 intakes, 178 traces, 16 interventions, decision rows all classified as historical
  - Write consumers frozen: ordinary upstream work (Git-native), protocol-v1 orchestrator (unchanged), installed CLI consumers (unchanged), explicit `HARNESS_DB_PATH` (unchanged), source reconstruction/maintenance (unchanged), repository tests (targeting freeze boundary supply `--compatibility-write`), CI workflows (no source-default human lifecycle dependency found)
  - All 8 validation gates passed (unit tests, native-artifact, command-contract preservation, workflow regression, Rust tests, tracked-state parity, full pre-merge)

### Phase 5: Optional Consumer Split
- **Date:** 2026-07-21
- **Status:** Completed
- **Goal:** Finish reduction Phase 5 by making Symphony explicit owner of orchestration policy and runtime evidence. Keep only generic, versioned integrity primitives in optional Harness compatibility CLI. Ordinary installations contain neither orchestration nor evaluation machinery.
- **Mechanical Changes:**
  - Published decision 0023 separating generic integrity primitives from orchestration/evaluation policy
  - Updated current product and compatibility discovery to point orchestration work to standalone Symphony repository
  - Moved repository-workflow regression scripts from `tests/evals/` to names matching their core-boundary role
  - Added install-boundary test proving default payload contains no orchestration/evaluation surface
  - Kept work-graph reads, atomic compare-and-set enforcement, transactional changeset application as generic compatibility primitives
  - Reclassified current repository workflow checks (not agent/trace evaluations)
- **Outcome/Status:**
  - Symphony remains independent owner of orchestration policy and runtime evidence
  - Harness core installs neither orchestration nor evaluation machinery
  - Generic atomic protocol primitives remain available only through explicit compatibility selection
  - Old maturity/proposal-engine Phase 5 preserved as compatibility history
  - Mechanical validation enforces new boundary
  - All 4 validation gates passed (phase 5 boundary, documentation contract, workflow regressions, manifest-link proof, Bash installer, protocol-v1 native-artifact, fresh-consumer changeset tracking, full pre-merge)

---

## Core-State Reproducibility Scripts

### `scripts/materialize-core-state.sh`
**Input:** 
- `HARNESS_CORE_STATE_ROOT` (default: repo root)
- `HARNESS_CLI` (default: `$root/scripts/bin/harness-cli`)
- `HARNESS_DB_PATH` (default: `$root/harness.db`) — output location
- `HARNESS_CORE_MANIFEST` (default: `$root/.harness/core-state/manifest.json`)
- `HARNESS_CHANGESET_DIR` (default: `$root/.harness/changesets`)

**What It Does Mechanically:**
1. Validates manifest structure (format version, snapshot path, SHA-256 fields, schema version, changeset array with unique IDs and paths)
2. Verifies snapshot file SHA-256 matches manifest expectation
3. Creates temp directory and copies snapshot to candidate database
4. Runs CLI `db snapshot --output` and verifies logical SHA-256 against manifest
5. Iterates over included changesets in manifest; for each: verifies changeset file exists, status matches manifest ID and SHA-256
6. Iterates over any additional changesets in `HARNESS_CHANGESET_DIR`; applies them if not in manifest, rejects if in manifest with different ID/bytes
7. Queries CLI `db contract` and verifies database schema is current, schema version matches manifest
8. Runs `verify-core-state-ownership.sh` to check materialized database violates no core ownership rules
9. Moves candidate to output location
10. Outputs: database path and snapshot SHA-256

**Produces:** Reproducible `harness.db` from tracked snapshot and changesets

### `scripts/publish-core-snapshot.sh`
**Input:**
- `HARNESS_CLI` (default: `$root/scripts/bin/harness-cli`)
- `HARNESS_SOURCE_DB` (default: `$root/harness.db`) — source database to snapshot
- `HARNESS_CORE_STATE_DIR` (default: `$root/.harness/core-state`)
- Optional flags: `--replace` (update existing snapshot), `--expected-logical-sha <hash>` (precondition for replacement)

**What It Does Mechanically:**
1. Validates source database exists; requires `jq` and `sqlite3`
2. If snapshot+manifest exist: requires `--replace` flag and validates `--expected-logical-sha` matches current manifest
3. Verifies existing tuple if present; runs `verify-core-snapshot.sh` on old tuple
4. Runs `verify-core-state-ownership.sh` on source database
5. Creates temp directory in `HARNESS_CORE_STATE_DIR`
6. If replacing: backs up previous snapshot and manifest to temp
7. Runs CLI `db snapshot --output $temp/harness.db --json`
8. Finds all changesets in `.harness/changesets/` (sorted); for each: queries status, records ID/path/SHA-256 as JSON
9. Queries CLI `query contract --json` for schema version
10. Generates manifest JSON: format_version=1, snapshot path/file_sha256/logical_sha256/schema_version, included_changesets array
11. Makes snapshot read-only
12. Verifies new tuple with `verify-core-snapshot.sh`
13. If replacing: restores previous files from temp before activating; cleanup removes staged files on failure
14. Moves temp files to final location (snapshot + manifest)
15. Verifies final tuple again
16. Outputs: published core snapshot path

**Produces:** Tracked manifest and snapshot recording current database state with exact changeset parity

### `scripts/verify-core-snapshot.sh`
**Input:**
- `HARNESS_CLI` (default: `$root/scripts/bin/harness-cli`)
- `HARNESS_CORE_MANIFEST` (default: `$root/.harness/core-state/manifest.json`)
- `HARNESS_CORE_SNAPSHOT` (default: `$root/.harness/core-state/harness.db`)

**What It Does Mechanically:**
1. Validates inputs exist; requires `jq` and `sqlite3`
2. Checks snapshot has no SQLite sidecars (WAL, SHM)
3. Verifies snapshot journal mode is DELETE (not WAL)
4. Validates manifest field types and presence (file/logical SHA, schema version)
5. Computes actual file SHA-256 and compares to manifest
6. Runs CLI `db snapshot --output $temp/probe.db --json` to compute logical SHA-256
7. Compares actual logical SHA-256 to manifest
8. Queries CLI `query contract --json` and verifies database state is current, schema version matches manifest
9. Runs `verify-core-state-ownership.sh`
10. Dumps SQLite to SQL text and checks:
    - No repository root absolute path embedded
    - No private-key or token-shaped material (regex: `-----BEGIN.*PRIVATE KEY-----`, `sk-*`, `gh[pousr]_*`, `Bearer *`)
11. Iterates over included changesets in manifest; for each: verifies file exists at recorded path, status matches recorded ID and SHA-256
12. Outputs: verified core snapshot schema version and logical SHA-256

**Produces:** Pass/fail validation of snapshot integrity, schema, ownership, and included changesets

---

## Installation Profiles and Knowledge Boundaries

### `docs/product/installation-profiles.md` — Concrete Profiles and Contracts

**Three Profiles Defined:**

#### Core (Default)
- **Files:** Exactly 10 files declared in `scripts/harness-install-files.txt`:
  - `AGENTS.md`
  - `docs/WORKFLOW.md`, `docs/README.md`, `docs/product/README.md`
  - `docs/plans/README.md`, `docs/plans/active/README.md`, `docs/plans/completed/README.md`
  - `docs/decisions/README.md`
  - `docs/templates/decision.md`, `docs/templates/exec-plan.md`
- **Downloads:** Checksum-verified `harness` binary placed at `scripts/bin/harness`
- **Does Not Do:** No CLI download, schema discovery, database bootstrap, database-specific `.gitignore` write
- **Update Behavior:** Refreshes do not remove existing `harness-cli` or database
- **Knowledge Boundary:** Does not include `.agents/skills/engineering-wisdom/` (separate explicit manifest)

#### Core Plus CLI (Explicit Selection)
- **Activation:** `--with-cli` (Bash) or `-WithCli` (PowerShell); `--upgrade-cli` / `-UpgradeCli` implies this
- **Files Added:** 
  - `scripts/harness-cli-install-files.txt` (14 discovered migrations + compatibility docs)
  - `scripts/schema/*.sql` (full discovered migration history)
  - Generated database/binary ignore rules
  - Checksum-verified platform binary
- **Safety:** Compatibility inputs and binary staged before target files change; failure restores previous state; core remains usable
- **Ownership:** Caller explicitly selected this profile

#### Engineering Wisdom Add-on (Independent)
- **Activation:** `--with-engineering-wisdom` (Bash) or `-WithEngineeringWisdom` (PowerShell)
- **Files:** Declared in `scripts/engineering-wisdom-install-files.txt`
- **Behavior:**
  - No flag: installer does not read optional manifest or copy skill
  - Opt-in flag: installer copies `engineering-wisdom` skill and explicit-only metadata
  - Installed skill: nothing runs until consumer invokes `$engineering-wisdom`
  - Later install without flag: existing copy left untouched
  - Removal: delete `.agents/skills/engineering-wisdom/` (no database or lifecycle state)
- **Reviewable Constraints:** Finding must separate observation, applicable heuristic, counter-pressure, proposed enforcement, and verification
- **Authority:** Installing or invoking skill does not authorize architecture rewrites, lint rules, coverage targets, dependency rules, or policy (requires consumer-repository authority)

**Core Update Contract:**
- Dry-run reveals published release candidate, reports planned merge without writing
- Normal update: takes upstream when consumer unchanged, keeps consumer-only edit, three-way text merge when both changed
- Rejects candidate older than installed provenance or executing binary
- Overlapping edits stage resolution session under `.harness-core/update/` with BASE, LOCAL, UPSTREAM, RESOLVED copies
- Continuation rejects unresolved markers, malformed inputs, candidate tampering, workspace file drift
- Success writes provenance last, retains prior bytes under `.harness-backup/`
- First release containing network discovery is one-time bootstrap boundary

**Ownership Constraint:**
- Installers do not copy: root README, architecture, build scripts, tests, CI, historical decisions, provenance
- Those paths describe upstream Harness or evolution, not consumer product

---

### `docs/compatibility/README.md` — Compatibility Index

**Scope:** Source-only index for explicit CLI users, maintainers of SQLite durable layer, or orchestration protocol users

**Installation Boundary:**
```bash
scripts/install-harness.sh --with-cli --yes /path/to/project
./scripts/install-harness.ps1 -WithCli -Yes -Directory C:\path\to\project
```
- Adds lifecycle references, bootstrap scripts, full schema history, local database/binary ignore rules, release metadata, checksum-verified binary

**Lifecycle References:** Phase 4 write-consumer inventory, superseded Phase 3/4/5 roadmaps, feature intake, story/matrix/trace/audit/backlog/component/maturity/improvement/tool docs, legacy stories

**Runtime & Orchestration:**
- Protocol v1 (`docs/contracts/harness-orchestration-v1.md`)
- Phase 5 ownership boundary (decision 0023)
- Symphony owns: scheduling, agent runs, worktrees, conflict/retry policy, PR/review sync, Symphony-specific runtime evidence
- Bootstrap: `scripts/bootstrap-harness.sh` / `.ps1`
- Schema migrations: `scripts/schema/*.sql`

**Key Fact:** Existing databases and binaries remain local, never removed by ordinary core install/refresh. Protocol supplies consumer-neutral atomic operations, not Symphony orchestration policy.

---

### `docs/compatibility/phase-4-write-consumer-inventory.md` — Write-Consumer Audit

**Conclusion:** No current upstream product or execution authority exists only in SQLite. Source default database can reject accidental human lifecycle writes without exporting/rewriting.

**Audit Sources:**
1. Read-only queries of upstream `harness.db` for active-looking story/backlog/decision/intake/trace/intervention rows
2. Comparison with `docs/plans/README.md` and `docs/decisions/README.md` (current Git-native authority index)
3. Repository-wide inspection of CLI invocations in `scripts/`, `tests/`, `.github/workflows/`
4. Published mutation surface in `docs/contracts/harness-orchestration-v1.md`

**Active-Looking Legacy Rows:**
| Surface | Exact rows | Disposition |
| --- | --- | --- |
| Planned stories | US-086, US-087, US-088 | E10 proposal history; E10 is legacy story packet absent from active index; no export |
| Retired story | US-110 | Explicitly retired Phase 0 evaluation; no export |
| Proposed backlog | 3, 4, 5, 8, 20 | Old trace-audit, benchmark, Phase 5, decision-refresh proposals; none indexed as active plan; no export |
| Indexed compatibility decisions | 0005, 0006, 0007, 0011 | Git documents exist and indexed as compatibility authority |
| Other durable decision rows | 0008–0010, Phase 0 0011–0014, 0018 | 0008–0010 classified in decision index; Phase 0 and 0018 are historical database evidence |
| Intakes, traces, interventions | 133 intakes, 178 traces, 16 interventions | Historical execution/review evidence; current completion from Git, executable checks, CI, runtime |

**Local Database Drift:** Tracked state contains intake 224 while local materialization does not. Demonstrates local database cannot be current roadmap authority.

**Write Consumer Behaviors:**
| Consumer | Behavior | Phase 4 Disposition |
| --- | --- | --- |
| Ordinary upstream work | Git-native plans, decisions, code, tests, CI, runtime evidence | SQLite lifecycle writes frozen |
| Human source maintenance | Rare, deliberate repair or compatibility verification | Requires global `--compatibility-write` (warns and executes) |
| Protocol-v1 orchestrator | JSON story add/update/complete, dependency/hierarchy mutation, changeset apply/status, reads, snapshots | Retained unchanged |
| Installed `core plus CLI` consumer | Its own explicitly selected local lifecycle and database | Retained unchanged |
| Explicit `HARNESS_DB_PATH` workflow | Fixtures, recovery, replay, copied databases, isolated validation | Retained unchanged |
| Source reconstruction/maintenance | Init, migrate, changeset apply, rebuild, snapshot, integrity/read queries | Retained unchanged |
| Repository tests | Temp source, consumer, worktree, epoch, protocol fixtures | Retained; targeting freeze boundary supply `--compatibility-write` |
| CI workflows | Compilation, tests, materialization, protocol smoke, installer/release proof | No source-default human lifecycle dependency found |

**Enforced Cause-and-Effect:**
- `harness-cli intake ...` (upstream default): exits before write transaction, explains Git-native authority, points to `--compatibility-write`
- `harness-cli --compatibility-write intake ...`: warns compatibility selected, performs existing mutation
- `harness-cli story update ... --json` (protocol v1): no freeze diagnostic, existing envelope/exit-code/semantics
- `HARNESS_DB_PATH=/tmp/test.db harness-cli intake ...`: operates on explicitly selected compatibility database

**Deletion Boundary:** Phase 4 does not delete CLI, schemas, changesets, snapshots, protocol, or readable state. Protocol-v1 and explicit CLI-profile consumers still need them. Deletion would weaken supported compatibility contract.

---

## End-to-End State

**Repository Authority Strata (Locked Across All Phases):**
1. Repository-centered workflow (AGENTS.md, docs/WORKFLOW.md) — current default
2. Git-native plans/decisions/code/tests/CI/runtime — current product authority
3. Compatibility index pointing to explicit CLI/protocol users — documented but not default
4. Historical/provenance material indexed separately — discoverable, not default discovery path

**Installation Strata:**
1. Default (core-only): 10 files, no CLI binary, no database machinery, no orchestration
2. Optional (core + CLI): adds 14 files + migrations + binary on explicit flag
3. Optional (engineering wisdom): independent add-on on separate flag

**Write Freezes:**
- Upstream default database: SQLite lifecycle writes rejected unless `--compatibility-write` supplied
- Installed CLI consumers: no freeze (explicit profile selection = compatibility intent)
- Explicit `HARNESS_DB_PATH`: no freeze (explicit database selection = compatibility intent)
- Protocol-v1: no freeze (JSON machine envelope unchanged)
- Repository tests: no freeze when targeting freeze boundary (supply `--compatibility-write`)

**Core-State Reproducibility:**
- `publish-core-snapshot.sh`: creates manifest + snapshot from source database + changeset log
- `verify-core-snapshot.sh`: validates snapshot file/logical SHA, schema, ownership, no embedded secrets, changeset parity
- `materialize-core-state.sh`: reconstructs reproducible harness.db from tracked snapshot + changesets

---

Status: DONE  
Summary: Phases 1–5 transition repository-centered workflow from optional to default, reduce installation payload from full CLI/database to 10-file core (optional CLI bundle), freeze accidental SQLite writes while preserving protocol-v1 compatibility, split orchestration ownership to Symphony. Core-state scripts enable reproducible database reconstruction. Installation profiles expose core-only (default), core+CLI (explicit), and engineering-wisdom add-on (independent).
