# Repository Harness: Code & Infrastructure Inventory

**Scan Date:** 2026-07-13  
**Repository:** `/home/vantt/projects/forgent/references/repository-harness`  
**Scope:** Workspace members, crates, scripts, agents, codex, harness state, GitHub workflows, gitignore/gitattributes

---

## 1. Workspace Configuration

**File:** `/home/vantt/projects/forgent/references/repository-harness/Cargo.toml`

```toml
[workspace]
resolver = "3"
members = ["crates/harness-cli", "crates/harness-symphony"]

[workspace.package]
edition = "2021"
license = "MIT"
repository = "https://github.com/hoangnb24/repository-harness"
```

**Summary:** Rust workspace with resolver v3, two member crates (harness-cli and harness-symphony), shared edition 2021, MIT license.

---

## 2. Crate: harness-cli

**Path:** `/home/vantt/projects/forgent/references/repository-harness/crates/harness-cli`

### Cargo.toml

```toml
[package]
name = "harness-cli"
version = "0.1.11"
edition.workspace = true
license.workspace = true
repository.workspace = true

[dependencies]
clap = { version = "4.6.1", features = ["derive"] }
rusqlite = { version = "0.39.0", features = ["bundled"] }
serde_json = "1.0.145"
thiserror = "2.0.18"

[dev-dependencies]
tempfile = "3.27.0"
```

**Purpose:** Durable layer CLI for project harness; SQLite-backed task specification, state, proof tracking, and intervention recording.

### Modules (6 .rs files)

**main.rs** (14 lines)  
Entry point: parses `interface::Cli`, calls `interface::run()`.

**interface.rs** (1520 lines)  
CLI definition and command execution. Commands:
- `init`: Create harness database
- `migrate`: Apply schema migrations
- `import brownfield`: Seed from markdown state
- `intake`: Record feature intake classification (with lane, type, flags, affected docs)
- `story add/update/verify/verify-all`: Story record management (id, title, lane, proof flags: unit/integration/e2e/platform, evidence, verify_command)
- `decision add/verify`: Decision record management
- `backlog add/close`: Backlog item management (with risk lane, discovered-while context, pain/suggestion/predicted-impact)
- `tool register/check/remove`: External tool registry (cli/binary/mcp/skill/http kinds, capabilities, responsibility roles)
- `intervention add`: Human/CI/review/agent intervention records
- `trace`: Agent execution trace recording (summary, intake, story, agent, outcome, duration, tokens, friction, actions, files read/changed, decisions, errors)
- `score-trace`: Trace quality tier evaluation against TRACE_SPEC
- `score-context`: Context reads compliance vs CONTEXT_RULES.md
- `audit`: Drift audit and entropy scoring
- `propose`: Generate improvement proposals from observed patterns
- `db changeset apply / db rebuild`: Semantic changeset application and database rebuild
- `query`: matrix, backlog, decisions, intakes, traces, friction, tools (with json/summary/responsibility/capability/status filters), interventions, stats, raw sql

**application.rs** (357 lines)  
Service layer wrapping HarnessService. Data structures:
- IntakeInput, StoryAddInput, StoryUpdateInput, DecisionAddInput, BacklogAddInput, BacklogCloseInput, ToolRegisterInput, InterventionAddInput, TraceInput
- InitResult, MigrateResult, BrownfieldImportResult, ChangesetApplyResult, DbRebuildResult
- Service methods delegate to SqliteHarnessRepository

**domain.rs** (1328 lines)  
Domain logic and value objects. Key types:
- InputType enum: new_spec, spec_slice, change_request, new_initiative, maintenance, harness_improvement
- RiskLane enum: tiny, normal, high_risk
- TraceQualityTier: minimal, standard, detailed (3-tier scoring)
- ToolArgSpec, ToolEntry (tool registry schema)
- Tool kind validation: cli, binary, mcp, skill, http
- Responsibility list (11 items: Task specification, Context selection, Tool access, Project memory, Task state, Observability, Failure attribution, Verification, Permissions, Entropy auditing, Intervention recording)
- Capability normalization (kebab-case validation)
- Records: StoryMatrixRecord, BacklogRecord, DecisionRecord, IntakeRecord, InterventionRecord, TraceRecord, FrictionRecord
- Scoring results: TraceScoreResult, ContextScoreResult, AuditResult, ImprovementProposal
- Query tables and filters

**infrastructure.rs** (4123 lines)  
SQLite repository implementation. Key methods:
- Database initialization and schema application
- CRUD operations for all entities (stories, decisions, backlog, tools, interventions, traces, intakes)
- Query building and execution (matrix, backlog filters, friction queries, tool registry lookups)
- Verification execution (story/decision verify_command runs)
- Audit queries (orphaned stories, unverified items, stale records, broken tools, entropy score)
- Changeset application and database rebuild
- Import from brownfield markdown (TEST_MATRIX.md, decisions/, HARNESS_BACKLOG.md)

---

## 3. Crate: harness-symphony

**Path:** `/home/vantt/projects/forgent/references/repository-harness/crates/harness-symphony`

### Cargo.toml

```toml
[package]
name = "harness-symphony"
version = "0.1.0"
edition.workspace = true
license.workspace = true
repository.workspace = true

[[bin]]
name = "harness-symphony"
path = "src/main.rs"

[dependencies]
clap = { version = "4.6.1", features = ["derive"] }
rusqlite = { version = "0.39.0", features = ["bundled"] }
serde = { version = "1.0.228", features = ["derive"] }
serde_json = "1.0.150"
serde_yaml = "0.9.34"
tempfile = "3.27.0"
thiserror = "2.0.18"
```

**Purpose:** Local isolated runner for Harness stories; orchestrates agent execution, run state, worktrees, web UI.

### Modules (14 .rs files)

**main.rs** (23 lines)  
Entry point: parses CLI, delegates to interface::run().

**interface.rs** (623 lines)  
CLI for Symphony. Commands:
- `doctor`: Inspect Symphony readiness (git, worktree, repo, db, CLI, env vars, .gitignore, agent config, PR capability checks)
- `work list`: List runnable Harness stories
- `work board`: Show dependency-aware Web UI board state
- `run <story_id>`: Execute or prepare isolated run
  - `--prepare-only`: Stage worktree/db/contract without running
  - `--here`: Run in-place with copied DB (tiny-lane only)
- `runs list/show/compact`: Local Symphony run state inspection and artifact retention
- `auto --enable`: Unattended polling mode (--once, --source, --max-runs, --max-attempts, --poll-interval-seconds, --max-idle-cycles)
- `status`: Show local Symphony status
- `sync`: Apply committed changesets to harness.db
- `web`: Serve Web UI backend (--host, --port)
- `pr create/retry`: Create pull requests for finished runs (--dry-run)
- `config show`: Show resolved configuration

**config.rs** (469 lines)  
Configuration management. Reads .harness/symphony.yml (YAML), provides defaults. Typed config with:
- agent (command, timeout, description)
- work (adapter, queue settings)
- web (controller backend config)
- Run (parallelism, log archiving, retention policy)

**state.rs** (655 lines)  
Run state store (.symphony/state.db, SQLite). Schema:
- run_header: metadata for each run
- active-run lock (single run at a time)
- terminal state release (completed/failed/cancelled)
- Queries for runs list/show/status

**run.rs** (1046 lines)  
Run execution pipeline:
- prepare_run(): eligibility checks, git worktree creation, DB copy, run contract generation, AGENTS shim
- execute_run(): launch isolated agent in worktree
- execute_here_run(): in-place execution with copied DB (tiny-lane only)
- prepare_here_run(): stage for here-run
- CompletedRun struct: result details, changeset records, PR creation result

**agent.rs** (680 lines)  
Agent invocation and subprocess orchestration. Handles:
- Agent setup (environment variables, working directory)
- Process spawning and stream capture (stdout/stderr)
- Timeout management
- Exit code handling
- Result aggregation

**work.rs** (925 lines)  
Work discovery and dependency resolution. Provides:
- list_work(): Runnable stories (filters for status, verify_command, dependencies)
- list_board(): Dependency-aware Web UI board structure
- WorkItem struct: story id, status, lane, verify_command, runnable flag, reason
- BoardItem struct: dependency tree representation

**auto.rs** (354 lines)  
Unattended polling mode. Handles:
- Configuration from command line / config file
- Poll loop (sources work items, executes runs, tracks completion)
- Idle cycle management, max-runs/max-attempts limits
- AutoRunSummary: aggregated results

**pr.rs** (401 lines)  
Pull request creation for run results. Functionality:
- PrCreateResult struct: commit message, branch, PR title/body, provider
- create_pr(): Invoke provider (GitHub, GitLab, etc. stubs)
- Retry logic

**sync.rs** (675 lines)  
Changeset synchronization. Applies committed .harness/changesets/*.changeset.jsonl to harness.db:
- unapplied_changesets(): Discover unsynced files
- sync_changesets(): Apply with idempotency
- SyncResult: changesets applied, operations performed

**changeset.rs** (315 lines)  
Changeset file parsing and operations. Schema:
- changeset.header: metadata
- story.add, story.update, trace.add, decision.add, etc. operations
- Semantic operation record definitions

**doctor.rs** (488 lines)  
Symphony readiness checks. Verifies:
- Git repository and worktree support
- Repository is Harness-enabled (.harness/, harness.db, scripts/schema)
- Harness CLI binary present and functional
- HARNESS_DB_PATH env var handling
- Operation log file exists and is writable
- .gitignore includes .symphony/ and harness.db
- agent.command is configured
- PR provider capability (gh, etc.)

**retention.rs** (132 lines)  
Run artifact cleanup. Implements:
- compact_runs(): Keep N newest run artifact directories under .symphony/worktrees/
- Deletion of older run state

**web.rs** (2346 lines)  
Web UI backend. Serves:
- HTTP endpoints for work list, board, run management, status, configuration
- JSON responses for frontend consumption
- WebServerOptions: host, port binding

---

## 4. Scripts

**Path:** `/home/vantt/projects/forgent/references/repository-harness/scripts`

### README.md
Comprehensive guide to scripts and CLI usage. Key sections:
- Harness CLI usage patterns (init, migrate, story, decision, backlog, trace, query, db rebuild)
- Proof flag semantics (numeric 0/1 on story update)
- Database path configuration (HARNESS_DB_PATH, HARNESS_DB environment variables)
- Changeset recording with HARNESS_RUN_ID
- Installer usage (bash/PowerShell, --merge/--override/--refresh-agent-shim)
- Schema migration procedures
- Release packaging and GitHub Actions workflows

### build-harness-cli-release.sh
Builds prebuilt Rust CLI binary for target platform (aarch64-apple-darwin, x86_64-apple-darwin, x86_64-unknown-linux-gnu, aarch64-unknown-linux-gnu, x86_64-pc-windows-msvc). Outputs:
- dist/harness-cli-<platform>
- dist/harness-cli-<platform>.sha256

Options: --target, --profile, --out-dir.

### install-harness.sh
Bash installer for Harness v0 files. Applies to target project directory. Modes:
- Interactive (prompts on conflicts)
- --merge: Keep existing, install missing
- --override: Back up and replace
- --refresh-agent-shim: Update AGENTS.md shim
- --force: Overwrite existing
- --dry-run: Show changes without writing
- Downloads prebuilt CLI from release tag (configurable via HARNESS_CLI_RELEASE_TAG, HARNESS_CLI_BASE_URL)

### install-harness.ps1
PowerShell equivalent to bash installer.

### scripts/schema/
SQL migration files (version-controlled):
- 001-init.sql: Core schema (intake, stories, decisions, backlog, tools, interventions, traces, tool checks)
- 002-story-verify.sql: Verification command tracking
- 003-tool-registry.sql: Tool registry expansion
- 004-intervention.sql: Intervention record schema
- 005-tool-extensions.sql: Tool extensions (args, capability, scan_target)
- 006-changeset-applied.sql: Changeset idempotency tracking
- 007-story-dependencies.sql: Story dependency relationships
- 008-story-hierarchy.sql: Story hierarchy (epics/stories)

### validate-changeset-rebuild.sh
Smoke test for changeset rebuild correctness.

### harness-cli-release-tag
Contains tag name for prebuilt CLI release (e.g., harness-cli-v0.1.11).

### harness-install-files.txt
Payload declaration for both bash and PowerShell installers (file paths to install).

---

## 5. .agents/ Directory

**Path:** `/home/vantt/projects/forgent/references/repository-harness/.agents/skills/impeccable`

### impeccable Skill (Frontend Design)

**SKILL.md** (>100 lines)  
Project-specific frontend design skill. Versions: 3.9.1. Usage: "Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface."

**Scope:** Websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, empty states.

**Key Design Guidance:**
- Contrast: body text ≥4.5:1, large text ≥3:1, placeholder text ≥4.5:1
- Typography: 65-75ch body line length, no paired similar fonts, display ceiling 6rem, letter-spacing ≥-0.04em
- Layout: Vary spacing, avoid nested cards, flexbox for 1D/grid for 2D, semantic z-index scale
- Motion: Intentional, ease-out curves, reduced-motion support required, no layout animation
- Color: Use OKLCH, avoid cream/sand/beige as default body bg
- Absolute bans: side-stripe borders, gradient text, decorative glassmorphism, hero-metric template, identical card grids, tiny uppercase eyebrows, numbered section markers (unless sequence carries info)
- Codex-specific defects to refuse: 1px border + wide shadow, over-rounding (>16px), hand-drawn sketchy SVG, repeating-linear-gradient stripes, decorative grid backgrounds

**Setup Workflow:**
1. Run `node .agents/skills/impeccable/scripts/context.mjs`
2. Read command reference (reference/<command>.md)
3. Familiarize with existing design system
4. Read register reference (reference/product.md or reference/brand.md)
5. If new project: run `node .agents/skills/impeccable/scripts/palette.mjs` for brand seed

**agents/ Subdirectory:**
- impeccable_asset_producer.toml
- impeccable_manual_edit_applier.toml
- openai.yaml

**scripts/ Subdirectory:**  
Comprehensive detector, hook, and live-editing infrastructure (110+ .mjs files):
- command-metadata.json
- detect-*.mjs: Anti-pattern detection (browser/CLI/static HTML analyzers)
- detector/: Multi-engine detection (browser injection, CLI, design system, antipattern registry, rule checks, color analysis, visual screenshot contrast, filesystem, profiler)
- hook-*.mjs: Pre-edit and admin hooks
- live-*.mjs: Live browser iteration (accept, complete, inject, insert, poll, resume, server, status, target, wrap)
- lib/: impeccable-config.mjs, impeccable-paths.mjs, design-parser.mjs, is-generated.mjs, target-args.mjs
- palette.mjs: Brand seed color picker
- pin.mjs: Design pinning

**reference/ Subdirectory:**  
Command references (30 .md files): adapt, animate, audit, bolder, brand, clarify, codex, colorize, craft, critique, delight, distill, document, extract, harden, hooks, init, interaction-design, layout, live, onboard, optimize, overdrive, polish, product, quieter, shape, typeset.

---

## 6. .codex/ Directory

**Path:** `/home/vantt/projects/forgent/references/repository-harness/.codex`

### hooks.json
PostToolUse hook configuration:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|apply_patch",
        "hooks": [
          {
            "type": "command",
            "command": "node \".agents/skills/impeccable/scripts/hook.mjs\"",
            "timeout": 5,
            "statusMessage": "Checking UI changes"
          }
        ]
      }
    ]
  }
}
```

**Effect:** After Edit/Write tool use (or patch apply), runs impeccable design hook (5s timeout, "Checking UI changes" status).

### harness-intake-griller Skill

**SKILL.md** (>100 lines)  
Project-specific skill for feature intake discussion. Usage: "Use when a user has a rough product idea, feature request, bug-fix intent, Harness improvement, or Symphony-ready work candidate and wants to clarify intent before implementation."

**Workflow:**
1. Clarify intent (1 decision at a time until shared understanding is explicit)
2. Shared understanding gate (problem, outcome, audience, current/target behavior, non-goals, constraints, decision chain, uncertainty)
3. Intake gate (outcome, user-visible behavior, scope boundary, source of truth, risk lane, validation proof, handoff rule)
4. Artifact generation (product docs, story packets, validation expectations)
5. Handoff to Symphony (ready for execution)

**Preflight:** Read AGENTS.md, README.md, docs/HARNESS.md, FEATURE_INTAKE.md, ARCHITECTURE.md, CONTEXT_RULES.md, TOOL_REGISTRY.md, matrix, product/stories/decisions docs.

**Interview Loop:** One question at a time; restate understanding, name missing decision, include recommendation, explain why.

**Boundary:** Do not jump to implementation; do not start Symphony runs without explicit user request after intake artifacts are ready.

**agents/ Subdirectory:**
- openai.yaml

---

## 7. .harness/ Directory

**Path:** `/home/vantt/projects/forgent/references/repository-harness/.harness`

### changesets/

16 changeset files (.changeset.jsonl), each recording semantic operations:

Filename format: `run_<timestamp|identifier>_<description>.changeset.jsonl`

Example: `run_0000000000_seed_symphony_index.changeset.jsonl`

**Schema per file:**
- First line: `changeset.header` with base_schema_version, run_id, version
- Subsequent lines: Semantic operation records (story.add, story.update, decision.add, trace.add, backlog.*, tool.*, intervention.add, etc.)
- Each operation: id, op (operation type), payload (field-value pairs), version

**Records:**  
Changesets track story lifecycle (add, update, proof proof flags), decision records, backlog items, tool registrations, intervention records, trace records. Idempotency: changeset.header + op type + id key.

**Changesets observed:**
- run_0000000000_seed_symphony_index.changeset.jsonl: US-028 through US-037 (symphony prerequisites, DB path, operation log, changeset apply, db rebuild)
- run_0000000002_retire_stale_symphony_docs.changeset.jsonl: Retirement of stale docs
- run_1782473523_99206.changeset.jsonl through run_1783610000000000000_us072.changeset.jsonl: Multiple timestamped runs, including US-069, US-071, US-072 (impeccable tool, symphony features)

**Total state:** 16 changeset files representing multi-phase development from symphony bootstrap through tool integration.

---

## 8. .github/ Directory

### Workflows

#### harness-cli-release.yml

**Trigger:** Tags matching `v*` or `harness-cli-v*`; workflow_dispatch; workflow_call (reusable)

**Jobs:**

1. **verify** (ubuntu-24.04)
   - Checkout source at tag ref
   - Install Rust
   - cargo fmt --check
   - cargo test --workspace
   - bash -n scripts/install-harness.sh && bash -n scripts/build-harness-cli-release.sh

2. **build** (matrix: macos-arm64, macos-x64, linux-x64, linux-arm64, windows-x64)
   - Checkout source at tag ref
   - Install Rust + target triple
   - scripts/build-harness-cli-release.sh --target <triple>
   - Smoke: dist/<binary> --help, dist/<binary> score-trace --help
   - Upload build artifact (binary + .sha256)

3. **publish** (ubuntu-24.04)
   - Download build artifacts
   - Create GitHub Release if not exists
   - Upload release assets (harness-cli-* binaries and checksums)

**Permissions:** contents: write

#### post-merge-maintenance.yml

**Trigger:** pull_request_target closed on main, if merged=true

**Job: prepare** (ubuntu-24.04)
- Checkout main
- Configure Git author (github-actions[bot])
- Update maintenance files:
  - Detect if PR changed crates/harness-cli/, scripts/schema/, Cargo.toml, build-harness-cli-release.sh
  - If cli_changed: increment patch version, update Cargo.toml + Cargo.lock, create harness-cli-v* tag
  - Prepend PR summary to CHANGELOG.md
  - Commit to main, push tag
- Outputs: cli_changed, release_tag, maintenance_ref

**Job: release-cli** (conditional on cli_changed=true)
- Calls harness-cli-release.yml (reusable workflow) with release_tag + checkout_ref

**Permissions:** contents: write, pull-requests: read

---

## 9. .gitignore

**Content:**
```
# Harness durable layer — each project instance generates its own data.
harness.db
harness.db-wal
harness.db-shm

# macOS Finder metadata.
.DS_Store

# Rust build output for harness tooling.
target/
dist/

# JavaScript dependencies for local web UI packages.
node_modules/
*.tsbuildinfo

# Local web UI build and test output.
desktop-dist/
test-results/
tsconfig.tsbuildinfo

# Downloaded Harness CLI binary for installed project instances.
scripts/bin/harness-cli
scripts/bin/harness-cli.exe

# Local Symphony runtime state.
.symphony/
.harness/*
!.harness/changesets/
!.harness/changesets/*.changeset.jsonl
```

**Rules:**
- Ignore harness.db and SQLite WAL/SHM files (project-specific durable state)
- Ignore Rust build outputs (target/, dist/)
- Ignore downloaded CLI binaries
- Ignore Symphony runtime state (.symphony/)
- Preserve .harness/changesets/ (durable semantic operation log)
- Ignore other .harness/* (transient state)

---

## 10. .gitattributes

**Content:**
```
*.sh text eol=lf
*.ps1 text eol=crlf
*.yml text eol=lf
*.yaml text eol=lf
```

**Rules:**
- .sh scripts: Unix line endings (lf)
- .ps1 scripts: Windows line endings (crlf)
- .yml/.yaml configs: Unix line endings (lf)

---

## 11. Summary Statistics

### Codebase Metrics

| Item | Count | Details |
|------|-------|---------|
| Workspace members | 2 | harness-cli, harness-symphony |
| Rust source files (.rs) | 20 | CLI: 6 files (7.3k LOC); Symphony: 14 files (9.1k LOC) |
| SQL schema files | 8 | 001-init through 008-story-hierarchy |
| Script files | 5 | build-harness-cli-release.sh, install-harness.sh/ps1, validate-changeset-rebuild.sh, release-tag, install-files.txt |
| Changesets | 16 | Run logs with semantic operations, idempotent replay |
| Agent skills | 2 | impeccable (design), harness-intake-griller (intake discussion) |
| GitHub workflows | 2 | harness-cli-release.yml, post-merge-maintenance.yml |

### CLI Commands (harness-cli)

| Category | Commands |
|----------|----------|
| Database | init, migrate, db changeset apply, db rebuild |
| Records | intake, story (add/update/verify/verify-all), decision (add/verify), backlog (add/close), tool (register/check/remove), intervention add, trace, audit, propose |
| Scoring | score-trace, score-context |
| Query | matrix, backlog, decisions, intakes, traces, friction, tools, interventions, stats, sql |

### CLI Commands (harness-symphony)

| Category | Commands |
|----------|----------|
| Work discovery | work list, work board |
| Execution | run <story_id> (--prepare-only, --here) |
| State | runs list, runs show, runs compact, status |
| Polling | auto --enable (--once, --source, --max-runs, --max-attempts, --poll-interval-seconds, --max-idle-cycles) |
| Integration | sync, pr create/retry, config show |
| Utility | doctor, web |

### Responsibilities (Harness Domain)

1. Task specification
2. Context selection
3. Tool access
4. Project memory
5. Task state
6. Observability
7. Failure attribution
8. Verification
9. Permissions
10. Entropy auditing
11. Intervention recording

### Risk Lanes

- **tiny:** Low-risk docs, copy, names, narrow edits, smoke endpoints
- **normal:** Story-sized behavior with bounded blast radius
- **high-risk:** Security, data, scope, contracts, multi-role/platform

### Trace Quality Tiers

1. **Minimal:** task_summary
2. **Standard:** Minimal + intake/story + outcome + duration + tokens + friction
3. **Detailed:** Standard + actions + files_read + files_changed + decisions + errors

### Tool Kinds

- cli, binary, mcp, skill, http (executable/scanned variants)

---

## 12. Key File Locations & Purposes

| Path | Purpose |
|------|---------|
| `Cargo.toml` | Workspace config, members, shared metadata |
| `crates/harness-cli/Cargo.toml` | CLI package: SQLite durable layer for task specs, state, proofs |
| `crates/harness-symphony/Cargo.toml` | Symphony package: isolated runner, worktrees, web UI |
| `scripts/build-harness-cli-release.sh` | Cross-platform Rust binary build for prebuilt distribution |
| `scripts/install-harness.sh` | Bash installer (merge/override modes, auto-download CLI) |
| `scripts/install-harness.ps1` | PowerShell installer (Windows equivalent) |
| `scripts/schema/*.sql` | Version-controlled database migrations (8 versions) |
| `scripts/harness-cli-release-tag` | Current prebuilt CLI release tag (e.g., harness-cli-v0.1.11) |
| `.agents/skills/impeccable/` | Frontend design skill (3.9.1); detector, live-edit, refs |
| `.codex/skills/harness-intake-griller/` | Feature intake discussion skill; interview loop, artifact generation |
| `.codex/hooks.json` | Post-tool-use hook (runs impeccable design check) |
| `.harness/changesets/*.changeset.jsonl` | Semantic operation logs (idempotent, replay-safe) |
| `.github/workflows/harness-cli-release.yml` | Multi-platform CI/CD build & GitHub Release publish |
| `.github/workflows/post-merge-maintenance.yml` | Auto-bump version, changelog, tag creation on CLI changes |
| `.gitignore` | Harness.db, .symphony/, target/, node_modules/, downloaded binaries |
| `.gitattributes` | Line-ending rules (sh=lf, ps1=crlf, yml=lf) |

---

## 13. Notable Patterns & Conventions

### Harness Feature Intake
- 6 input types: new_spec, spec_slice, change_request, new_initiative, maintenance, harness_improvement
- 10 risk flags: Auth, Authorization, Data model, Audit/security, External systems, Public contracts, Cross-platform, Existing behavior, Weak proof, Multi-domain
- Hard gates: Auth, Authorization, Data loss, Audit/security, External providers, Validation weakening
- Lane assignment: 0-1 flags → tiny/normal; 2-3 → normal+strong; 4+ → high-risk

### Story Record Schema
- id, title, status (planned/in-progress/implemented/retired)
- risk_lane (tiny/normal/high_risk)
- contract_doc (path to docs/stories/...)
- verify_command (optional shell command)
- proof flags (unit, integration, e2e, platform: 0/1 each)
- evidence (test/run output)
- notes

### Changeset Format
- JSONL (one JSON object per line, idempotent replay)
- First line: changeset.header (metadata)
- Operation records: {id, op, payload, version}
- Supports roll-forward on second apply (skipped if already applied)

### CLI Proof Flag Semantics
- Numeric only: `story update --unit 1 --integration 1 --e2e 0 --platform 0`
- No yes/no strings
- Represents concrete test coverage proof

### Database Environment Variables
- `HARNESS_DB_PATH`: Override db location (takes precedence)
- `HARNESS_DB`: Legacy env var (fallback)
- Default: harness.db in repo root
- `HARNESS_RUN_ID`: Semantic operation log recording (enables changeset generation)
- `HARNESS_REPO_ROOT`: Override repo detection (defaults to cwd)

### Symphony Runtime
- `.symphony/state.db`: Single active-run lock (mutual exclusion)
- `.symphony/worktrees/`: Isolated git worktrees per run
- `.harness/symphony.yml`: Optional config (agent, work, web, run settings)
- Doctor checks: git, repo, db, CLI, env vars, .gitignore, agent command, PR capability

---

## 14. Unreadable Files

None. All files in scope were successfully read.

---

**Status:** DONE  
**Report Generated:** 2026-07-13 12:24 UTC
