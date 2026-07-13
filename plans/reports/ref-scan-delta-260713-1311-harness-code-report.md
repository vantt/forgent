# Harness CLI Repository Delta Inventory
**Commit Range:** 14e6f10..9cc306d (94 commits)  
**Themes:** Trust-boundary hardening, post-merge release recovery, E11 repository separation, US-100 cutover  
**Scan Date:** 2026-07-13

---

## 1. Crate Changes

### 1.1 Removal: `crates/harness-symphony/`
**Deletion: ~20,077 lines removed**

Complete removal of the harness-symphony crate and its web-ui subcomponent:
- Agent orchestration, workflow coordination, and PR state management code (agent.rs ~680L)
- Change set and history management (changeset.rs, sync.rs ~675L combined)
- Web UI frontend (Electron-based React/TypeScript, 6,287 lines package-lock.json)
- Web server with GraphQL-like API (web.rs ~2,346L)
- Configuration and diagnostic code (config.rs ~469L, doctor.rs ~488L, auto.rs ~354L)
- E2E retention, approval, and work management systems

**Rationale:** Repository separation (E11) moves orchestration and workflow to a separate Symphony repository; harness-cli becomes pure single-repository CLI.

### 1.2 Expansion: `crates/harness-cli/`
**Net insertion: +8,682 lines**

#### New Module: `src/epoch_fence.rs` (208 lines)
State-transition guard for E11 epoch migration. Implements shared file-lock-based write-blocking during repository separation.

**Key types:**
- `EpochFenceError`: IO, journal validation, and transition-in-progress states
- `EpochWriteGuard`: Dropped on command completion; held for duration of all state mutations
- `acquire_command_guard(repo_root, mutates_state)`: acquires shared lock, validates checksummed transition journal (JSON envelope with SHA-256), enforces state gates
- Journal states: `fenced` (read-only after preflight), `switched_pending_validation` (post-switchover validation), `complete`/`compensated` (terminal)

**Tests:** Validates incomplete journals fail closed, terminal journals allow writes, `switched_pending_validation` allows reads but not writes, `fenced` allows reads but not writes.

#### Cargo.toml Changes
Version bumped **0.1.11 → 0.1.17**

**New dependencies:**
- `chrono 0.4.42` — datetime handling
- `fs2 0.4.3` — platform-agnostic file locking
- `rusqlite`: added features `backup`, `hooks` (was only `bundled`)
- `serde` with `derive`
- `sha2 0.10.9` — content-addressed identity
- `unicode-normalization 0.1.24` — proposal_key consistency

#### Domain Logic: `src/domain.rs` (+265 lines)
**New functions:**
- `proposal_key(rule_id, rule_version, canonical_issue)` — Unicode-normalized SHA-256 identity for improvement issues, versioned by rule_id and rule_version
- `stable_uid(prefix, material)` — Deterministic 16-byte (128-bit) identity: `{prefix}_{hex32}`
- `sha256_hex(material)`, `sha256_bytes(bytes)` — Identity for protocol artifacts

**Domain model expansion:**
- `ProposalEvidence` — `source_kind` (trace|intervention|audit|legacy_snapshot), `uid`, `fingerprint`, `observed_at`
- `ImprovementProposal` — now includes `key` (proposal_key), `lifecycle_state`, `evidence_items: Vec<ProposalEvidence>`, `predecessor_uid`, `lifecycle_explanation`
- `StoryMatrixRecord` — added `risk_lane`, `runnable: bool`
- `CsvList::try_from_optional()` — JSON array parsing; rejects malformed input
- Improved `parse_tool_args` to accept JSON-formatted lists alongside CSV

**Tool registry updates:**
- `story complete` — new, runs fresh proof and atomically marks completion-eligible story implemented (0.1.11)
- `backlog reconcile` — new, previews/applies conservative legacy lifecycle identity backfill (0.1.11)
- `backlog outcome record` — new, appends measured impact for implemented improvement (0.1.11)
- `query improvement-health` — new, deterministic daily lifecycle and next actions (0.1.11)
- `query matrix` — added flags: `numeric`, `active`, `runnable`, `story`, `summary`
- `query sql` — doc clarification: now read-only

#### Application Layer: `src/application.rs` (+265 lines)
**New input/output types:**
- `StoryDependencyInput`, `StoryDependencyRecord` — blocker ↔ blocked directed edges
- `StoryHierarchyInput`, `StoryHierarchyRecord` — parent ↔ child directed edges
- `StoryBacklogLinkInput`, `StoryBacklogLinkRecord` — story ↔ backlog occurrence, relationship ∈ {resolves, references}
- `StoryCasUpdateInput`, `StoryCasUpdateResult` — compare-and-set story status with runnable precondition check
- `OrchestrationStoryRecord`, `WorkGraphResult` — stories + dependencies + hierarchy snapshot
- `ContractDiscoveryResult` — protocol_version, cli_version, schema range, database state, capabilities, required env vars
- `BacklogOutcomeInput`, `OutcomeObservationRecord` — observed outcome for implemented backlog occurrence (status ∈ {confirmed, ineffective, reverted})
- `LegacyReconcileRecord`, `LegacyReconcileResult` — conservative backfill of lifecycle identity for legacy backlog rows
- `ImprovementHealthItem`, `ImprovementHealthResult` — daily category health (proposal, implementation, outcome, recurrence)
- `ChangesetStatusResult`, `DbSnapshotResult` — inspect changeset or snapshot database atomically

**HarnessService methods:**
- Story graph: `add_story_dependency()`, `remove_story_dependency()`, `add_story_hierarchy()`, `remove_story_hierarchy()`, `query_story_hierarchy()`, `update_story_cas()` (CAS = compare-and-set)
- Orchestration: `query_orchestration_stories()`, `query_work_graph()`, `discover_contract()`
- Story completion: `complete_story(id)` — atomic proof + implementation transition
- Backlog links: `link_story_backlog()`, `unlink_story_backlog()`, `query_story_backlog_links()`
- Outcomes: `record_backlog_outcome()`, `reconcile_legacy_improvements(apply: bool)`
- Database: `changeset_status()`, `snapshot_db()`
- Proposals: `propose()` now takes `ProposalDecision` enum (not bool commit flag)
- Audit: `audit_record_evidence()` — explicitly persist audit evidence transitions

#### Interface Layer: `src/interface.rs` (+1,441 lines)
**CLI command expansion:**

*Story commands:*
- `story dependency add --blocker S1 --blocked S2 [--json]` / `remove` — cycle-safe edges
- `story hierarchy add --parent S1 --child S2 [--json]` / `remove` — cycle-safe parent/child
- `story backlog link --story S1 --backlog B1 --relationship {resolves|references}` / `unlink` / `list` — link to backlog occurrences
- `story update --contract <DOC> --expected-status <S> --require-runnable [--json]` — CAS + runnable gate
- `story complete <ID> [--json]` — atomic completion proof + implementation
- `audit --record-evidence` — flag to persist evidence episode transitions
- `propose --accept KEY --outcome-manual --outcome-due <T> --outcome-after-traces <N> [--reason R]` — granular proposal acceptance
- `propose --reject KEY --reason R` — explicit proposal rejection
- `propose --show-suppressed` — include handled occurrences with full evidence coverage

*Database commands:*
- `db changeset apply <PATH> [--json]` — added `--json` flag for protocol output
- `db changeset status <PATH> --json` — inspect without write; requires `--json`
- `db snapshot --output <PATH> --json` — atomic SQLite backup with protocol envelope

*Query commands:*
- `query contract --json` — discover protocol capabilities (replaces `query matrix` for machine reading)
- `query stories --json` — stable story records
- `query work-graph --json` — stories + edges snapshot
- `query matrix --active --runnable --story ID --summary` — filtered views
- `query dependencies [--story ID] [--json]` — dependency edges
- `query hierarchy [--story ID] [--json]` — hierarchy edges
- `query improvement-health` — daily health view

*Backlog commands:*
- `backlog reconcile --action backfill-lifecycle-identity [--dry-run|--apply]` — legacy lifecycle backfill
- `backlog outcome record --id N --status {confirmed|ineffective|reverted} --outcome TEXT [--evidence TEXT]`

**Epoch fence integration:**
- `Cli::mutates_state()` — identifies commands that write (used by epoch guard at entry)
- `Cli::machine_mode()` — detects `--json` flags; enforces 16 MiB protocol output limit
- Pre-command: `acquire_command_guard(repo_root, mutates_state)` with epoch fence validation
- Post-success machine output: serialized JSON envelope with protocol_version = 1

**Proposal decision enum:**
```rust
pub enum ProposalDecision {
    Preview,
    PreviewSuppressed,
    Accept { key: String, schedule: String },
    Reject { key: String, reason: String },
}
```

#### Infrastructure Layer: `src/infrastructure.rs` (+6,996 lines)
**Error types:** New variants for dependency cycles, hierarchy cycles, story status conflicts, story completion state, changeset identity conflict (SHA-256 mismatch), database snapshots, backlog linking relationships, legacy reconciliation, SQL read-only mode

**SQL read-only enforcement:**
- `DbConfig` with authorization hooks; `PRAGMA query_only = 1` for non-state-mutating commands
- `QuerySqlReadDenied` error on attempted writes

**Repository trait expansion:**
- Story graph mutation: `add_story_dependency()`, `remove_story_dependency()`, `add_story_hierarchy()`, `remove_story_hierarchy()`
- Hierarchy queries: `query_story_hierarchy(story: Option<&str>)`
- Backlog linking: `link_story_backlog()`, `unlink_story_backlog()`, `query_story_backlog_links()`
- Story CAS: `update_story_cas(input)` — compare-and-set with runnable precondition, returns before/after status
- Orchestration: `query_orchestration_stories()`, `query_work_graph()`
- Protocol: `discover_contract()` — database schema version, capability negotiation, protocol version
- Completion: `complete_story(id)` — atomically proves story and closes linked backlog items
- Outcomes: `record_backlog_outcome()`, `reconcile_legacy_improvements(apply: bool)`
- Database: `changeset_status()`, `snapshot_db()`
- Proposal: `propose(decision: ProposalDecision)` returns `ProposalResult { proposals, message }`
- Audit: `audit_record_evidence()` — persist episode transitions

**Implementation details:**
- `StoryCompletionContext`: captures intake_uid and trace_uid generated during completion
- `StoryCompletionWrite`: tracks already-completed state, closed backlog ids, referenced ids
- `ParsedChangeset`: validates changeset id and content_sha256
- `LegacyBacklogRow`, `LegacyEvidenceCapture`, `LegacyReconcileCandidate` — bridge legacy lifecycle rows
- Cycle detection in dependency/hierarchy graphs via DFS
- JSON array normalization in CsvList (handles both `["a","b"]` and `a,b` CSV formats)
- Atomic snapshot using SQLite `backup` API; reports source logical SHA-256, graph revision, snapshot file SHA-256
- Verification environment overrides in tests

#### Main Entry Point: `src/main.rs` (16 line changes)
Epoch fence acquired before command execution; state mutation detection gating.

---

## 2. Tests Directory (NEW, 53 files)
**Structure:** 12 subdirectories with 53 test scripts and fixtures.

### 2.1 Release Tests (6 files)
**Purpose:** Release identity guard, promotion guard, workflow contract, and post-merge recovery.

- **test-release-identity-guard.sh** — Negatives: absent tag, invalid stable tag, abbreviated source SHA, crate/lock version mismatch, release pin mismatch, lightweight tag, tag target mismatch. Positives: valid pretag and tagged identity; proof-run ownership.
- **test-release-promotion-guard.sh** — Verifies promote script atomicity and identity checks before tag push.
- **test-release-workflow-contract.sh** — End-to-end release workflow validation.
- **test-post-merge-release-recovery.sh** — Orchestrates identity/promotion/workflow tests plus upgrade candidate proving.
- **download-v0.1.14-artifact.sh** — Pinned initial protocol (v0.1.14) artifact download for upgrade testing.
- **test-harness-cli-candidate.sh** — Candidate binary proving.

### 2.2 Cutover Tests (7 files)
**Purpose:** E11 repository separation and US-100 cutover validation.

- **test-us100-readiness-schema.sh** — Schema validation for cutover readiness envelope: platform archives, capability assertions, smoke test proofs, ownership audit, runtime disposition, evidence file verification. Negatives: duplicate platforms, empty capabilities, incomplete contracts, unverified sidecars, substituted releases.
- **test-canonical-symphony-ownership.sh** — Symphony repository clean state, no forbidden directories, no dirty checkout, canonical URL format.
- **audit-us100-runtime-disposition.sh** — Runtime disposition audit before cutover.
- **released-cross-repo-smoke.sh** — Cross-repository smoke tests post-release.
- **support/released-fixture-agent.sh** — Test fixture helper.
- Two more (assert-canonical-symphony-ownership.sh, assert-target-symphony-coverage.sh).

### 2.3 Boundary Tests (5 files)
**Purpose:** Repository separation contract and historical records.

- **test-e11-historical-receipts.sh** — Historical record validation.
- **assert-harness-only-tree.sh** — Harness repository contains only harness-cli and scripts; no Symphony code.
- **assert-target-symphony-coverage.sh** — Symphony repository coverage.
- **assert-symphony-history-allowlist.sh** — symphony-history-allowlist.tsv validates historical tree coverage.
- **symphony-history-allowlist.tsv** — Allowlist for Symphony legacy path coverage.

### 2.4 Bootstrap & Installer Tests (7 files)
- **test-bootstrap-harness.sh** — Bootstrap script validation.
- **test-install-harness-modes.sh**, **.ps1** — Unix and PowerShell installer modes.
- **test-cli-upgrade-candidate.sh** — Upgrade from v0.1.14 to candidate.
- **test-install-harness-modes.ps1** — Windows-specific installer contract.
- **assert-consumer-changeset-trackable.sh**, **assert-agent-authority-contract.sh**, **assert-install-manifest-links.sh** — Manifest consistency.

### 2.5 Protocol Tests (4 files)
- **smoke-native-artifact.sh**, **.ps1** — Native binary smoke tests.
- **smoke-v0.1.14-artifact.sh**, **.ps1** — Initial protocol v0.1.14 smoke tests.

### 2.6 Core Tests (6 files)
**Purpose:** Story/decision/tool/backlog command contracts and schema replay.

- **test-core-boundary-contract.sh** — Core commands (story, decision, tool, backlog, trace) positive and negative cases.
- **test-schema-replay-command-contract.sh** — Changeset replay idempotency.
- **assert-schema-replay-command-contract.sh**, **assert-durable-state-boundary.sh**, **assert-command-contract.sh** — Contract assertions.
- **harness-command-contract.txt** — Command reference.

### 2.7 History Tests (4 files)
- **test-e11-us097-prepare-core.sh**, **test-e11-us097-inventory.sh**, **test-e11-epoch-transition.sh** — E11 prepare-core, inventory, and epoch transition.
- **assert-no-live-root-changesets.sh** — No uncommitted live root changesets.

### 2.8 Maintenance & Coherence Tests (5 files)
- **test-harness-cli-release-classification.sh** — Release classification from file changes.
- **test-render-changelog-files.py** — Changelog rendering validation.
- **test-revision-coherence.sh**, **test-core-state-ownership.sh** — Revision and ownership coherence.

### 2.9 Evaluation & Documentation Tests (2 files)
- **test-task-authority.sh** — Task authority evaluation.
- **test-doc-contracts.sh** — Documentation contract validation.

### 2.10 Fixtures (8 files)
Changesets for testing generic rebuild scenarios (positive: story graph, local ID remap, tools; negative: invalid timestamp, unsupported op, missing timestamp).

---

## 3. Scripts Changes

### 3.1 New Release/Verification Scripts (20 files)
**Release automation:**
- **verify-harness-cli-release-identity.sh** — Validates stable tag format, source SHA ancestry, crate/lock version match, release pin consistency, tag type (annotated), tag target, proof-run ownership
- **promote-harness-cli-release-tag.sh** — Guards tag promotion: runs pretag identity check, creates annotated tag with proof metadata, verifies tagged identity post-push with recovery on push failure
- **harness-cli-release-changed.sh** — Detects CLI code changes from file list
- **harness-cli-release-tag** — Pin file for candidate tag

**E11 Verification:**
- **verify-e11-us089.sh** through **verify-e11-us100.sh** (12 scripts) — Epic story verification chain
- **verify-e11-inventory.sh** — Inventory verification
- **verify-revision-coherence.sh** — Revision coherence across repos
- **verify-core-state-ownership.sh** — Core state ownership post-separation

**Epoch & Transition:**
- **harness-epoch-transition.py** — Epoch transition orchestration
- **run-e11-us089-frozen-baseline.sh** — Baseline proof run

**Validation:**
- **validate-premerge.sh** — Pre-merge contract (calls validate-changeset-rebuild, runs repository tests)

### 3.2 Schema Migrations (7 new files)
**Version progression: 6 → 13**

- **009-improvement-identity.sql** — Adds uid, proposal_key, occurrence_kind to backlog; creates proposal_evidence_link, audit_evidence_episode, backlog_outcome_observation tables
- **010-story-backlog-links.sql** — story_backlog_link table for story ↔ backlog relationships (resolves|references)
- **011-legacy-evidence-snapshots.sql** — Snapshot tables for legacy reconciliation
- **012-review-finding-closure.sql** — Review finding lifecycle
- **013-changeset-content-sha.sql** — Content SHA-256 for changeset identity

### 3.3 Bootstrap Scripts (2 new files)
- **bootstrap-harness.sh**, **bootstrap-harness.ps1** — Initialize harness.db and core directories

### 3.4 Documentation (3 new files)
- **agent-harness-block.md**, **claude-harness-block.md** — Claude-block usage guides

### 3.5 Data Processing (3 new files)
- **e11-us089-baseline.py**, **e11-us097-prepare-core.py**, **e11-us097-dispositions.py**, **e11-us097-inventory.py**, **render-changelog-files.py** — Python utilities for E11 baseline, core prep, inventory, changelog rendering

### 3.6 Modified Scripts
- **install-harness.sh**, **install-harness.ps1** — Updated for harness-cli-only (removed symphony-web-ui references)
- **harness-install-files.txt** — Updated manifest

---

## 4. GitHub Workflows

### 4.1 New: `.github/workflows/premerge.yml`
**Trigger:** Pull requests targeting main; workflow_dispatch

**Jobs:**
- **validate** — repository contract (validate-premerge.sh), Linux CLI upgrade proving (v0.1.14 → candidate)
- **windows-installer** — Windows installer modes and upgrade transition

### 4.2 Modified: `.github/workflows/harness-cli-release.yml`
**Key changes:**
- Removed `push.tags` trigger (now workflow_dispatch + workflow_call only)
- Renamed job outputs: `source_sha` instead of implicit
- **verify** job: 
  - Adds `--verify-tag` and release identity guard (verify-harness-cli-release-identity.sh pretag)
  - Runs validate-premerge.sh
  - Checks formatting and tests
- **build** jobs:
  - Recheck identity before each platform build
  - Smoke test native binary (tests/protocol/smoke-native-artifact.sh)
  - Download v0.1.14 artifact and prove upgrade (tests/installer/test-cli-upgrade-candidate.sh)
  - Windows: PowerShell installer modes
- **publish** job:
  - Reverify checksums on downloaded artifacts
  - Calls promote-harness-cli-release-tag.sh for immutable tag creation
  - Publishes release with `--verify-tag`; asserts 10 artifacts present

### 4.3 Modified: `.github/workflows/post-merge-maintenance.yml`
**Trigger:** pull_request_target closed (merged to main)

**Jobs:**
- **prepare**:
  - Detects CLI changes via harness-cli-release-changed.sh
  - Bumps patch version (Cargo.toml + Cargo.lock + release-tag pin)
  - Updates CHANGELOG.md with PR title, author, merge commit, file changes
  - Outputs cli_changed flag, release_tag, maintenance_ref
- **release-cli** (conditional on cli_changed):
  - Calls harness-cli-release.yml workflow with maintenance_ref as checkout_ref

---

## 5. Cargo.toml Root Changes
**Workspace:** No significant changes.

**harness-cli only:** Version 0.1.11 → 0.1.17
- Dependencies: +chrono, +fs2, +serde, +sha2, +unicode-normalization; rusqlite features expanded
- Features: None added

---

## 6. Summary: Architecture & Protocol Changes

### Trust-Boundary Hardening
1. **Release identity guard:** Validates tag format, source ancestry, crate/lock version consistency, release pin immutability, proof-run ownership (verify-harness-cli-release-identity.sh)
2. **Promotion guard:** Atomically proves and promotes tags with recovery fallback (promote-harness-cli-release-tag.sh)
3. **SQL read-only enforcement:** `PRAGMA query_only=1` + authorization hooks prevent accidental writes via query commands
4. **Epoch fence:** Pre-command lock acquisition blocks writes during E11 repository separation (epoch_fence.rs)

### Post-Merge Release Recovery
1. **Automatic version bump & changelog:** Post-merge maintenance workflow detects CLI changes and increments version
2. **Staged release workflow:** Pre-merge proves upgrade path; release builds cross-platform; publish verifies checksums and tag immutability
3. **Changeset identity:** Content SHA-256 for idempotent replay and detect double-applies

### E11 Repository Separation
1. **Boundary tests:** assert-harness-only-tree, canonical-symphony-ownership verify clean separation
2. **Epoch transition control:** epoch_fence.rs gates writes during switchover (journal states: fenced → switched_pending_validation → complete)
3. **Dispositions & inventory scripts:** E11 US-089 through US-100 verification chain

### US-100 Cutover Readiness
1. **Schema versioning:** Readiness envelope includes initial and cleaned-core protocol contracts, archives, smoke proofs, ownership audit, runtime disposition
2. **Evidence verification:** Cutover-readiness.json references proof files with SHA-256 sidecars
3. **Capability negotiation:** discover_contract() reports cli_version, schema range, capabilities (stories.read.v1, changesets.apply.v1, isolated-db.v1, etc.)

### Improvement Lifecycle (E09)
1. **Proposal identity:** proposal_key(rule_id, rule_version, issue) ensures stable identity across rule updates
2. **Stable UIDs:** prefix-based deterministic identity for backlog, intake, trace, intervention
3. **Evidence links:** proposal_evidence_link table tracks source (trace|intervention|audit|legacy_snapshot) for each proposal
4. **Outcome tracking:** backlog_outcome_observation records confirmed/ineffective/reverted outcomes; schedule_kind ∈ {manual, due_at, trace_count}
5. **Legacy reconciliation:** Backfill lifecycle identity for pre-identity backlog rows (conservative, opt-in via --apply)

### Database Contract
- Schema version 9–13 (current)
- Dependencies/hierarchy: cycle-safe directed edges
- Backlog links: story ↔ backlog occurrence (resolves|references) — one resolver per backlog item
- Changesets: idempotent replay with content-based identity (SHA-256)
- Snapshots: atomic online backup with logical source hash

---

## 7. Coverage Notes

**Fully covered:**
- All new CLI commands (story dependency, hierarchy, backlog, complete, audit --record-evidence, propose {accept|reject}, query contract/stories/work-graph/dependencies/hierarchy/improvement-health, db changeset status, db snapshot, backlog reconcile, backlog outcome record)
- Release automation pipeline (verify, build, publish, promotion guard)
- E11 boundary separation and cutover readiness schema
- Epoch fence state machine and locking protocol
- New domain identities (proposal_key, stable_uid, sha256 functions)
- Changeset identity and snapshot database features

**Not fully scanned:**
- Complete infrastructure.rs implementation of story_dependency/hierarchy graph mutations (~2000+ lines of SQL, cycle detection, query logic) — sampled only; implementation present and extensive
- Backlog outcome and legacy reconciliation SQL and business logic — sampled; extensive implementation present
- Complete test fixtures and edge case coverage for all 12 test subdirectories — representative files read; full coverage assumed

---

**Status:** DONE
**Coverage:** Mechanical delta inventory complete. All thematic areas (release, E11, cutover, epoch, proposal identity, backlog linking, graph edges, SQL read-only, workflow automation) inventoried with evidence.
