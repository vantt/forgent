# Rust Harness Core Crate Inventory Report

**Repository**: /home/vantt/projects/forgentX/upstreams/repository-harness  
**Crate**: crates/harness/  
**Baseline Commit**: 9cc306d → 0a79bbe  
**Date**: 2026-08-07

---

## Architecture Layers

### Domain Layer

**File**: `crates/harness/src/domain/model.rs`

Defines immutable, framework-agnostic value objects and error types used throughout the application. Includes:

- `RelativePath`: validated relative file paths (rejects absolute, empty, escapes, symlinks, colons, null bytes).
- `ContentHash`: SHA-256 hex digest validators (exactly 64 hexadecimal characters).
- `CoreDistribution`: version string + list of `DistributionFile` records (path, content, hash).
- `InstallationState`: schema version + installed core version + baseline files representing the "known good" state.
- `BaselineFile`: managed file record with path, content bytes, SHA-256 hash.
- `WorkspaceMutation`: enum for Write or Delete filesystem operations on a relative path.
- `FileChangeKind`: enum: Create, Update, Delete, Preserve, Adopt.
- `UpdateConflict`: path + reason (OverlappingChanges, MissingManagedFile, ExistingUnmanagedPath, ModifiedRemovedFile, UnsafePath) + detail string.
- `ResolutionConflict`: path + base/local/incoming/resolved file contents (for three-way merge output).
- `UpdateResolutionSession`: from/to versions, conflicts, frozen workspace files (captures state at conflict detection).
- `InstallReport`, `UpdateReport`, `StatusReport`, `DoctorReport`: response objects for each command.
- `DomainError` enum with variants for invalid paths, invalid hashes, empty versions, duplicates, unsupported schemas.

No imports from application, infrastructure, interface, or framework libraries (fs, process, serde, clap, fs2). Tests verify path safety rules and schema validation.

**File**: `crates/harness/src/domain/mod.rs`

Re-exports all public types from `model.rs`.

---

### Application Layer

**File**: `crates/harness/src/application/ports.rs`

Defines three trait-based boundary contracts (ports) that infrastructure must implement:

- `CoreDistributionPort`: `current()` → returns a `CoreDistribution` (the target payload).
- `InstallationStatePort`: methods to recover interrupted transactions, load/save installation state, read/write workspace files, validate managed paths, stage resolution sessions, load/clear resolutions, apply mutations atomically.
- `ThreeWayMergePort`: `available()` → bool; `merge(base, local, upstream)` → `MergeOutcome` (Clean or Conflict with content + detail).
- `UpdateCandidatePort`: associated type Candidate; methods to fetch latest/exact/staged candidates, get release version, execute candidate, persist/clear, validate replacement target, replace executable.
- `CandidateRequest`: struct carrying root path, dry_run, continue_update, json flags for candidate execution.
- `CandidateExit`: struct with exit code and stdout/stderr bytes.
- `PortError`: error wrapper with string message.

No imports from infrastructure, interface, or frameworks. Defines the contract boundary.

**File**: `crates/harness/src/application/service.rs`

`CoreApplication<D, S, M>` orchestrates install, update, status, and doctor operations using three generic ports (distribution, state, merger). Main operations:

- `install()`: loads distribution, recovers interrupted transactions if not dry-run, scans workspace for each file in distribution (Create if new, Adopt if exists), applies mutations if not dry-run.
- `update()`: loads distribution and installed state, validates forward version, plans file changes by comparing base (installed), local (workspace), and upstream (new distribution) for each path, stages resolution session if conflicts exist (only when not dry-run).
- `continue_update()`: resumes a staged resolution session, validates session versions match current installed/candidate, freezes current workspace, verifies resolved content has no conflict markers, reapplies plan with resolutions.
- `abort_update()`: clears staged resolution session.
- `status()`: compares installed version against current distribution version (Current, UpdateAvailable, ExecutableOutdated, NotInstalled), reports file modification status.
- `doctor()`: runs seven health checks (transaction pending, resolution pending, merge tool available, provenance valid, path safety for each managed file).

Plan-update logic performs full three-way comparison:
- If base+upstream both present and local present: attempt auto-merge via `ThreeWayMergePort`, or apply user-provided resolution if available.
- If base present, upstream removed, local unchanged: delete.
- If upstream new, local doesn't exist: create.
- If upstream new, local exists unmanaged: conflict (ExistingUnmanagedPath).
- If base present, upstream removed, local modified: conflict (ModifiedRemovedFile).

Backup strategy: each apply creates a timestamped `.harness-backup/harness-core-{id}/` directory with prior state and workspace copies. On error, recovery restores from backup.

`ApplicationError` enum covers: AlreadyInstalled, NotInstalled, NoResolutionPending, ResolutionVersionMismatch, ResolutionPlanMismatch, ResolutionDrift, UnresolvedMarkers, InvalidCoreVersion, CoreDowngrade, Port/Domain errors.

Tests use in-memory fixtures for StatePort, DistributionPort, and MergePort.

**File**: `crates/harness/src/application/self_update.rs`

`SelfUpdateApplication<C, S>` owns the self-update use case (candidate fetching, version verification, executable replacement orchestration).

`execute()` method:
1. Loads installed core version and compares against executing binary version.
2. If installed core > executable version (executable outdated): fetches exact candidate matching installed version, verifies identity (release pointer version = candidate reported version = installed version), then replaces executable (via `candidates.replace()`).
3. Else: fetches latest release candidate (via pointer file), verifies candidate version ≥ both installed core and executing binary, executes candidate with `--directory`, `--dry-run`, `--continue`, `--json` flags, handles exit code 0 (success, clears persisted candidate or replaces executable if needed), exit code 2 (conflict, retains candidate), other codes as error.
4. Returns `SelfUpdateExit::Forwarded` (pass-through stdout/stderr/code) or `SelfUpdateExit::Recovery` (executable recovery report).

`discard_retained_candidate()`: clears persisted candidate.

Enforces semantic: candidate version cannot be older than installed core; a `--continue --dry-run` previews but does not remove the pending session.

---

### Infrastructure Layer

**File**: `crates/harness/src/infrastructure/embedded_distribution.rs`

`EmbeddedCoreDistribution` implements `CoreDistributionPort::current()`. Uses `include_bytes!()` compile-time macros to embed a fixed set of 23 files (AGENTS.md, .agents/skills/*.md, .agents/skills/*/scripts/*.py, docs/*.md, docs/templates/*.md). Each file is SHA-256 hashed and wrapped in a `DistributionFile`. Version is read from `env!("CARGO_PKG_VERSION")` (build-time crate version).

Test verifies payload count, checks that generic instructions exclude repo-specific content (no "Current Upstream Goal"), validates that all skills are marked authorized/read-only, and that metadata files set `allow_implicit_invocation: false`.

**File**: `crates/harness/src/infrastructure/filesystem_state.rs`

`FileSystemInstallationState` implements `InstallationStatePort`. Manages persisted installation state in `.harness-core/` directory with atomic transaction journal (`.harness-core/transaction.json`), manifest (`.harness-core/manifest.json`), and baseline files (`.harness-core/base/<path>`).

Key methods:

- `recover_interrupted()`: acquires lock, checks transaction.json phase (Applying vs Committed); if Applying, restores workspace and state from backup under `.harness-backup/`, then removes transaction journal.
- `apply()`: validates state schema, creates backup hierarchy, writes transaction.json (phase=Applying), applies mutations, writes manifest + baseline files with atomic temp-file rename, updates transaction (phase=Committed), removes transaction.json. On error, recovery runs automatically.
- `apply_if_unchanged()`: verifies frozen workspace files match expected content before applying (used for `continue_update` to reject workspace drift).
- `transaction_pending()`: checks for .harness-core/transaction.json.
- `resolution_pending()`: checks for .harness-core/update/session.json.
- `stage_resolution()`: writes four directories (base, local, incoming, resolved) with conflict file contents, plus session.json with metadata.
- `load_resolution()`: reconstructs `UpdateResolutionSession` from persisted files.
- `clear_resolution()`: removes .harness-core/update/ directory.
- `validate_managed_path()`: walks path components, rejects symlinks at any level.

Filesystem safety:
- Rejects symlinks for .harness-core/, .harness-core/update, .harness-core/update-candidate, and all managed workspace paths.
- Uses `fs2::FileExt` for exclusive locking during critical sections.
- Atomic writes via temp file + rename to avoid partial-write corruption.
- All JSON persisted with schema_version for compatibility.

Tests verify transaction rollback on failure, symlink rejection, interruption recovery, and atomic write semantics.

**File**: `crates/harness/src/infrastructure/git_merge.rs`

`GitThreeWayMerge` implements `ThreeWayMergePort`. Delegates to `git merge-file -p --diff3 -L LOCAL -L BASE -L UPSTREAM <local> <base> <upstream>`. 

- Exit code 0: clean merge → `MergeOutcome::Clean(stdout)`.
- Exit code 1: conflicting changes → `MergeOutcome::Conflict { content: stdout, detail: "local and upstream changes overlap" }`.
- Other codes: error (e.g., git not installed).

Uses tempfile for scratch space. Test verifies clean merge of non-overlapping changes and conflict detection on overlapping edits.

**File**: `crates/harness/src/infrastructure/release_handoff.rs`

`LatestReleaseCandidates` implements `UpdateCandidatePort`. Orchestrates candidate download, checksum verification, and executable replacement.

Release asset discovery:
- Reads release pointer from `https://raw.githubusercontent.com/hoangnb24/repository-harness/main/scripts/harness-release-tag` (or test override via `HARNESS_TEST_RELEASE_ROOT`).
- Parses tag format `harness-v{version}`, validates semver.
- Downloads binary artifact from GitHub release (platform-specific: harness-{macos,linux}-{arm64,x64} or harness-windows-x64.exe).
- Downloads SHA-256 sidecar file.

Candidate verification:
- `latest()`: fetches pointer, downloads versioned artifact.
- `exact()`: downloads specific version directly.
- `staged()`: loads `.harness-core/update-candidate/harness[.exe]` from filesystem, verifies against cached checksum.
- `reported_version()`: executes candidate `--version`, parses last word.
- `execute()`: runs candidate with `update --candidate --directory <root> [--dry-run] [--continue] [--json]`.

Executable replacement:
- `validate_replacement_target()`: verifies repository executable path (scripts/bin/harness) is a regular file (not symlink), matches current executing binary canonicalized path.
- `replace()`: uses `self_replace` crate to atomically replace running executable.
- `persist()`: stores candidate in `.harness-core/update-candidate/harness[.exe]` for recovery after interruption.
- `clear_persisted()`: removes staged candidate.

Candidate must be executable (chmod +x on Unix). Tests verify checksum mismatch rejection and symlink-following safety.

**File**: `crates/harness/src/infrastructure/mod.rs`

Re-exports the four infrastructure implementations: `EmbeddedCoreDistribution`, `FileSystemInstallationState`, `GitThreeWayMerge`, `LatestReleaseCandidates`.

---

### Interface Layer

**File**: `crates/harness/src/interface/cli.rs`

`Cli` struct (clap `Parser`): parses command line into `Command` enum (Install, Update, Status, Doctor). Each variant carries `--directory` (default "."), `--json` (for JSON output), and command-specific flags (`--dry-run`, `--continue`, `--abort` for Update).

`execute()` function:
- Routes each command to the appropriate application method (`CoreApplication::install`, `update`, `status`, `doctor` or `SelfUpdateApplication::execute` for self-update).
- Passes results to presenter functions (present_install, present_update, present_status, present_doctor).
- Returns `CommandExit { code, stdout, stderr }`.

Update command routing:
- `--candidate` flag: candidate mode (invoked by verified release candidate; runs application layer update directly).
- `--continue`: continues a staged resolution session (hands to `SelfUpdateApplication`, which internally calls application layer).
- `--abort`: aborts staged resolution (clears candidate and resolution session).
- Normal (no flags): fetches latest release candidate via `SelfUpdateApplication`.

**File**: `crates/harness/src/interface/presenter.rs`

Renders command outputs. Each presenter function accepts a domain report object and a `json` bool flag.

- `present_install()`: renders `InstallReport` as JSON or human text (lists changes: create/adopt/etc.).
- `present_update()`: renders `UpdateReport`. If no conflicts: success (code 0) with change list. If conflicts: code 2 with conflict details and instructions to resolve files in `.harness-core/update/resolved/`, then `harness update --continue`.
- `present_status()`: renders `StatusReport` with condition (not_installed / current / update_available / executable_outdated) and file status (modified, missing).
- `present_doctor()`: renders `DoctorReport` as pass/fail lines (transaction, update_resolution, merge tool availability, provenance, per-path safety).
- `present_abort()`: confirms whether a resolution session was removed.
- `present_executable_recovery()`: reports executable version recovery from candidate.

JSON serialization via serde; human text uses multi-line strings with clear formatting.

**File**: `crates/harness/src/interface/mod.rs`

Re-exports `execute()`, `Cli`, `Command` from cli.rs; `CommandExit` from presenter.rs.

---

### Entry Point

**File**: `crates/harness/src/main.rs`

Composition root. Parses CLI, instantiates infrastructure ports:
- `EmbeddedCoreDistribution` (no state).
- `FileSystemInstallationState` (no state).
- `GitThreeWayMerge` (no state).
- `LatestReleaseCandidates::default()` (reads env for test overrides).

Creates `CoreApplication::new(distribution, state, merger)` and `SelfUpdateApplication::new(candidates, state)`.

Calls `execute(cli, &application, &self_update)`.

Writes stdout/stderr and exits with the returned code.

**File**: `crates/harness/src/lib.rs`

Public module tree: `pub mod application`, `pub mod domain`, `pub mod infrastructure`, `pub mod interface`.

---

## Test Coverage

**File**: `crates/harness/tests/clean_architecture.rs`

Enforces dependency-direction rules:
- Domain layer forbids imports from application, infrastructure, interface, serde, clap, fs2, std::fs, std::process.
- Application layer forbids imports from infrastructure, interface, serde, clap, fs2, std::fs, std::process.
- Infrastructure forbids interface imports.
- Interface forbids infrastructure imports.
- Composition root (main.rs) must import both infrastructure and interface and instantiate applications.

**File**: `crates/harness/tests/cli_lifecycle.rs`

Integration tests:
- Install on fresh directory with dry-run and actual install; verifies state files, manifest, baseline.
- Install migrates existing AGENTS.md without overwriting consumer edits (Adopt behavior).
- Status command reports installation condition.
- Doctor command runs all health checks.

**File**: `crates/harness/tests/release_update.rs`

Tests self-update flow with a mock release directory:
- Stages a candidate in `.harness-core/update-candidate/`.
- Runs update; verifies conflict is detected and staged.
- Resolves conflict manually.
- Runs `--continue` to apply resolution.
- Verifies candidate is retained across conflict staging for recovery.

**File**: `crates/harness/tests/update_lifecycle.rs`

Tests core update operations:
- Three-way merge of non-overlapping changes (plan succeeds; application applies).
- Conflict detection and staging on overlapping changes (plan succeeds; no apply; code 2 returned).
- Atomic application with rollback on failure.
- Dry-run preview without mutation.
- Handling of file creation, deletion, adoption, and preservation.

---

## Decision Documents

### 0011 Reproducible Core State

**Title**: Reproducible Core State  
**Date**: 2026-07-20  
**Status**: Accepted

**Problem**: Historical Harness source state was stored in SQLite, not version-controlled; binary merges and WAL files made worktrees unreliable. A fresh clone could not reconstruct state.

**Decision**: Authoritative inputs are a read-only SQLite baseline snapshot (committed) plus semantic JSONL changesets (committed after baseline). Each worktree materializes its own ignored writable harness.db from those inputs. Mutable operations use expected revisions; stale revisions stop replay rather than merge.

**Consequence**: Fresh clones can reconstruct state; mutations become Git-visible; conflicting intent is surfaced before overwrite. Tradeoff: repository carries a reviewed binary baseline artifact, and changeset format/schema revisions require compatibility tests.

**Reference**: `/home/vantt/projects/forgentX/upstreams/repository-harness/docs/decisions/0011-reproducible-core-state.md`

---

### 0024 Rust Harness Core Maintenance CLI

**Title**: Rust Harness Core Maintenance CLI  
**Date**: 2026-07-21  
**Status**: Implemented

**Problem**: Bash/PowerShell installers copy the core but cannot safely update it without overriding consumer edits. The optional harness-cli owned update orchestration but made maintenance depend on SQLite lifecycle (dependency that 0019/0020 removed).

**Decision**: A Rust CLI named `harness` becomes the cross-platform owner of core installation and maintenance. It does NOT own intake, stories, traces, scoring, SQLite lifecycle, work selection, or orchestration. Bash/PowerShell bootstrap scripts delegate to a checksum-verified harness binary.

**Consequence**: Core installation/maintenance have one implementation; consumers receive upstream improvements without silently losing changes; explicit provenance and diagnostics. Tradeoff: default core gains a binary dependency; artifact publication and verification become part of release contract.

**Reference**: `/home/vantt/projects/forgentX/upstreams/repository-harness/docs/decisions/0024-rust-harness-core-maintenance-cli.md`

---

### 0025 Latest-Release Self-Update And Human-Directed Conflicts

**Title**: Latest-Release Self-Update And Human-Directed Conflicts  
**Date**: 2026-07-22  
**Status**: Accepted and implemented

**Problem**: Previous harness executable was confined to its embedded core version; `harness update` could not discover newer releases. Conflicts were detected but had no resumable path for human authorization and agent application.

**Decision**:
1. Self-update uses GitHub release pointer (`harness-release-tag`) to discover latest version; downloads binary + SHA-256 sidecar; verifies checksum; rejects older versions.
2. Candidate owns interpretation of embedded payload; direct version jumps use exact installed base.
3. Status reports `executable_outdated` when core > executable version.
4. On conflict: retains BASE, LOCAL, UPSTREAM, RESOLVED under `.harness-core/update/`; candidate retained under `.harness-core/update-candidate/`; `--continue` requires manual RESOLVED edit, rejects conflict markers and drift.
5. Normal update always plans from installed to latest; `--dry-run` preserves pending session; `--abort` removes it only.
6. Verified candidate is durable until executable replacement succeeds; next update repairs executable from candidate if interrupted.

**Consequence**: Installed executable discovers and installs later releases directly; conflicts are explainable and resumable; human judgment governs semantic choices; mechanical staging/verification/drift detection remain automated. Tradeoff: existing pre-decision executables need one final bootstrap refresh; updates require curl and network (status/doctor do not).

**Reference**: `/home/vantt/projects/forgentX/upstreams/repository-harness/docs/decisions/0025-latest-release-self-update-and-human-directed-conflicts.md`

---

## Mechanical Summary

| **Layer** | **File** | **Responsibility** |
|-----------|----------|-------------------|
| Domain | `domain/model.rs` | Value objects (RelativePath, ContentHash, CoreDistribution, InstallationState, FileChangeKind, UpdateConflict, ResolutionConflict, UpdateResolutionSession, report types, DomainError). No framework imports. |
| Application | `application/ports.rs` | Boundary contracts: CoreDistributionPort, InstallationStatePort, ThreeWayMergePort, UpdateCandidatePort. |
| Application | `application/service.rs` | `CoreApplication`: install, update, continue_update, abort_update, status, doctor. Orchestrates via ports. Three-way merge logic. Transaction & backup management. |
| Application | `application/self_update.rs` | `SelfUpdateApplication`: fetches release candidate, verifies identity, executes candidate, orchestrates executable replacement. Handles version constraints and retry on conflict. |
| Infrastructure | `infrastructure/embedded_distribution.rs` | `EmbeddedCoreDistribution`: compile-time payload embedding (23 files). Provides CoreDistributionPort. |
| Infrastructure | `infrastructure/filesystem_state.rs` | `FileSystemInstallationState`: persistent state in `.harness-core/`. Transaction journal, atomic writes, recovery, symlink rejection. Provides InstallationStatePort. |
| Infrastructure | `infrastructure/git_merge.rs` | `GitThreeWayMerge`: delegates to `git merge-file`. Provides ThreeWayMergePort. |
| Infrastructure | `infrastructure/release_handoff.rs` | `LatestReleaseCandidates`: GitHub release discovery, checksum verification, candidate execution, executable replacement. Provides UpdateCandidatePort. |
| Interface | `interface/cli.rs` | Command parsing (Install, Update, Status, Doctor). Routes to application methods. Provides Cli, Command, execute. |
| Interface | `interface/presenter.rs` | Output formatting. JSON or human-readable text. Provides CommandExit. |
| Entry | `main.rs` | Composition root. Instantiates ports, creates applications, calls execute(). |
| Tests | `tests/clean_architecture.rs` | Enforces dependency directions (domain ← application ← infrastructure, interface; main wires both). |
| Tests | `tests/cli_lifecycle.rs`, `release_update.rs`, `update_lifecycle.rs` | Integration: install, update, conflict staging, resolution, self-update. |

---

## File Location Reference

All paths are absolute, relative to `/home/vantt/projects/forgentX/upstreams/repository-harness/`:

- `crates/harness/src/lib.rs` — module tree
- `crates/harness/src/main.rs` — entry point
- `crates/harness/src/domain/mod.rs` — domain exports
- `crates/harness/src/domain/model.rs` — domain types and validation
- `crates/harness/src/application/mod.rs` — application exports
- `crates/harness/src/application/ports.rs` — trait boundaries
- `crates/harness/src/application/service.rs` — CoreApplication orchestration logic
- `crates/harness/src/application/self_update.rs` — SelfUpdateApplication orchestration
- `crates/harness/src/infrastructure/mod.rs` — infrastructure exports
- `crates/harness/src/infrastructure/embedded_distribution.rs` — embedded payload provider
- `crates/harness/src/infrastructure/filesystem_state.rs` — filesystem state management and persistence
- `crates/harness/src/infrastructure/git_merge.rs` — three-way merge via git
- `crates/harness/src/infrastructure/release_handoff.rs` — release download and candidate execution
- `crates/harness/src/interface/mod.rs` — interface exports
- `crates/harness/src/interface/cli.rs` — command-line interface
- `crates/harness/src/interface/presenter.rs` — output formatting
- `crates/harness/tests/clean_architecture.rs` — dependency-direction enforcement
- `crates/harness/tests/cli_lifecycle.rs` — CLI integration tests
- `crates/harness/tests/release_update.rs` — self-update integration tests
- `crates/harness/tests/update_lifecycle.rs` — core update integration tests
- `docs/decisions/0011-reproducible-core-state.md` — state reproducibility approach
- `docs/decisions/0024-rust-harness-core-maintenance-cli.md` — Rust CLI decision
- `docs/decisions/0025-latest-release-self-update-and-human-directed-conflicts.md` — self-update and conflict resolution decision

---

**Status**: DONE  
**Summary**: Rust core crate implements a clean-architecture install/update/status/doctor CLI with three-way merge conflict staging, human-directed resolution, self-update to latest GitHub release, and atomic filesystem transactions with recovery.
