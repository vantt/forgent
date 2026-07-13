# Symphony Documentation Packaging Inventory

**Scope:** Symphony-specific product docs, contracts, release engineering, and entry point  
**Date:** 2026-07-13  
**Coverage:** All required symphony-specific files; inherited harness docs reviewed shallowly

---

## SYMPHONY-SPECIFIC DOCUMENTATION

### 1. README.md
**Path:** `README.md` (lines 1-137)

**Core Facts:**
- Symphony = standalone local orchestrator for running Harness stories
- Does NOT require Harness checkout, source link, database inspection, or live SQLite copy
- Typed boundary documented in `docs/contracts/harness-runtime-v1.md`

**Operator Workflow:**
- Runs built Symphony executable against target repository (can differ from current directory)
- Canonical standalone release published from this repository
- Version `symphony-v0.1.0` established 5-platform artifact baseline; later releases retain protocol-v1 compatibility based on discovered contract tuple
- Archive + `.sha256` sidecar from GitHub release; verify and install without Cargo
- Runtime checks packaged resource manifest's paths/shape; release verifier proves Web tree hash matches packaged bytes
- Install preserves `bin/` and `share/` relationship

**macOS/Linux Install (lines 29-38):**
```bash
ARCHIVE=/absolute/path/to/harness-symphony-<target>.tar.gz
(cd "$(dirname "$ARCHIVE")" && shasum -a 256 -c "$(basename "$ARCHIVE").sha256")
INSTALL_ROOT="$HOME/.local"
mkdir -p "$INSTALL_ROOT"
tar -xzf "$ARCHIVE" -C "$INSTALL_ROOT"
SYMPHONY="$INSTALL_ROOT/bin/harness-symphony"
```

**Windows Install (lines 40-52):**
```powershell
$Archive = "C:\absolute\path\to\harness-symphony-windows-x64.tar.gz"
$Expected = ((Get-Content "$Archive.sha256") -split '\s+')[0].ToLowerInvariant()
$Actual = (Get-FileHash -Algorithm SHA256 $Archive).Hash.ToLowerInvariant()
if ($Actual -ne $Expected) { throw "Symphony archive checksum mismatch" }
$InstallRoot = Join-Path $env:LOCALAPPDATA "Programs\Symphony"
New-Item -ItemType Directory -Force $InstallRoot | Out-Null
tar -xzf $Archive -C $InstallRoot
$Symphony = Join-Path $InstallRoot "bin\harness-symphony.exe"
```

**CLI Usage:**
```bash
"$SYMPHONY" --repo-root "$REPO" doctor
"$SYMPHONY" --repo-root "$REPO" work list
"$SYMPHONY" --repo-root "$REPO" run <story-id> --prepare-only
```

**Target Repository Requirements:**
- Must have compatible Harness CLI + Harness database
- `doctor` reports resolved CLI and corrective action
- Configuration template at `examples/symphony.yml`; copy to `.harness/symphony.yml` only when defaults insufficient

**Contributor Workflow:**
- Rust `1.92.0` (pinned `rust-toolchain.toml`)
- Node.js `24.9.0` (pinned `.node-version`)
- Source: `crates/harness-symphony/` (Rust app) + `crates/harness-symphony/web-ui/` (React/Playwright/Electron)

**CI Checks (lines 103-122):**
```bash
cargo metadata --locked --no-deps --format-version 1
cargo fmt --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace --locked
cargo build --workspace --release --locked
npm --prefix crates/harness-symphony/web-ui ci
npm --prefix crates/harness-symphony/web-ui exec -- playwright install chromium
npm --prefix crates/harness-symphony/web-ui run build
npm --prefix crates/harness-symphony/web-ui run e2e
FIXTURE=$(mktemp -d)
tests/compatibility/bootstrap-harness-fixture.sh --upgrade-cli --story US-DESKTOP-SMOKE "$FIXTURE"
npm --prefix crates/harness-symphony/web-ui run desktop:smoke -- --repo-root "$FIXTURE"
rm -rf "$FIXTURE"
```

**Product Contracts:**
- `docs/SYMPHONY_QUICKSTART.md` — operator loop
- `docs/SYMPHONY_SCOPE.md` — implemented contract and future boundary
- `docs/contracts/harness-runtime-v1.md` — pinned external protocol
- License: MIT

---

### 2. docs/SYMPHONY_SCOPE.md
**Path:** `docs/SYMPHONY_SCOPE.md` (lines 1-147)

**Status:** Current standalone product contract

**Product Definition (lines 3-8):**
> "Symphony is an on-demand local orchestrator for executing Harness stories. It turns typed work records into isolated agent runs, local review evidence, and reviewable product/Harness changes. It is not the Harness policy engine, a general-purpose issue tracker, or a hosted autonomous coding service."

**Product Boundary (lines 10-29):**
> "Harness owns story intent, lane, dependencies, hierarchy, verification policy, and durable semantic operations. Symphony owns selection, run preparation, agent launch, local run state, result validation, review surfaces, optional PR automation, and post-merge changeset synchronization."

**Cause and Effect Flow (lines 19-29):**
```text
Harness work graph
  -> Symphony selects a runnable story
  -> Harness creates a WAL-safe isolated database snapshot
  -> Symphony creates a worktree and RUN_CONTRACT.json
  -> the configured agent changes files and writes result evidence
  -> Harness records durable mutations as a semantic changeset
  -> Symphony validates and presents the run
  -> a human may accept its branch/PR
  -> Symphony asks Harness to apply the accepted changeset locally
```

**Implemented & Future Matrix (lines 37-51):**

| Area | Current Contract | Future / Out of Scope |
|------|------------------|----------------------|
| Invocation | Local CLI and Web/desktop controller; explicit `--repo-root`; checksum-verifiable local/CI release candidate | Remote publication (US-100), hosted service |
| Work discovery | One revisioned typed work-graph read with lane, status, dependencies, hierarchy, and revision | External issue trackers as the authoritative work model |
| Selection | Runnable work listing and explicit story runs; bounded unattended polling for opted-in work | Unbounded scheduler, distributed queue, multiple concurrent writers |
| Isolation | Git worktree for normal/high-risk; tiny `--here`; protocol-created WAL-safe DB snapshot | Container/VM sandboxing or remote execution |
| Agent runtime | Configured adapters, including Codex app-server behavior; explicit run contract and cancellation/status surfaces | Universal agent compatibility or automatic repair guarantees |
| Results | Required versioned `RESULT.json` and `SUMMARY.md`; validation before acceptance; local review/log artifacts | Treating result files as durable product state |
| Harness mutations | Protocol-routed compare-and-set writes and semantic operation logs | Direct SQL, table coupling, or deriving changesets by diffing databases |
| Review | Changed-file, validation, summary/result, event, and changeset views | Automatic approval without a human-controlled acceptance policy |
| Pull requests | Optional configured PR create/retry; summary supplies the body; branch carries product changes and semantic changeset | PR provider as a mandatory dependency |
| Sync | Idempotent protocol status/apply of committed changesets; local sync state | Committing or sharing `harness.db` / `.symphony/state.db` |
| Retention | Local run artifacts can be compacted; committed changesets remain durable | Using local logs as permanent cross-clone history |
| Configuration | Optional `.harness/symphony.yml`, version 1; tracked example | Requiring personal `.agents`, `.codex`, or `.impeccable` trees |
| Design tooling | May be used externally by contributors; absence does not block runtime | Bundled design-tool ownership or runtime dependency |

**Harness Protocol Boundary (lines 53-73):**
1. Resolves one Harness CLI from config/environment/target repo/PATH
2. Before read/mutation: requests protocol-v1 discovery envelope, checks CLI version, schema range, protocol version, named capabilities
3. Work state from one `query work-graph --json` operation (not assembled from table reads)
4. Isolated databases from `db snapshot --json` (includes committed WAL pages consistently)
5. Story writes use typed compare-and-set operations
6. Every process gets explicit repo/database paths, timeouts, output-size bound
7. Only `.symphony/state.db` directly owned by Symphony; `harness.db` remains opaque behind protocol

**Run and Artifact Contract (lines 78-103):**
- Normal/high-risk runs use isolated worktree; tiny runs may use current checkout with `--here`
- Each run receives versioned `RUN_CONTRACT.json` with identity, story, workspace/database paths, required outputs, allowed/forbidden paths, validation context
- Agent must write versioned `RESULT.json` (matching run/story identity, allowed terminal outcome) + readable `SUMMARY.md`

**Artifact Durability Split (table, lines 91-98):**

| Artifact | Meaning | Durability |
|----------|---------|-----------|
| Product/code/docs changes | Proposed product delta | Branch/PR |
| `.harness/changesets/*.changeset.jsonl` | Semantic Harness operations | Commit and retain |
| `SUMMARY.md`, `RESULT.json`, validation and event logs | Run evidence and review input | Local; compactable |
| `harness.db` | Harness local index | Local; rebuildable |
| `.symphony/state.db` | Symphony local controller state | Local only |

> "Therefore 'successful run' does not mean 'merged change.' A result can be valid while its branch still awaits review. Likewise, PR acceptance does not mutate another clone's database: after merge, `sync` detects the committed changeset, asks Harness to apply it once, and records local sync state."

**Operational Guarantees (lines 105-116):**
- `doctor` reports actionable readiness failures (incompatible/missing Harness)
- Normal/high-risk work cannot silently fall back to root checkout
- `--here` rejected for non-tiny lanes
- Protocol incompatibility fails before persistent Harness mutation
- Result identity/schema validated before acceptance
- Sync idempotent; does not mark failed application as successful
- PR automation optional; local execution/review usable without it
- Personal tool configuration not part of product contract

**Configuration and Distribution (lines 118-136):**
- Target-repository-relative and optional
- Normal Harness repo + compatible CLI + current database works with defaults
- Start from `examples/symphony.yml`; create `.harness/symphony.yml` only for differing settings
- **Stable archive layout:** `bin/harness-symphony(.exe)`, `share/harness-symphony/web-ui/**`, `share/harness-symphony/resource-manifest.json`
- Executable validates manifest paths/shape before serving packaged assets
- Release verifier recomputes Web tree hash to validate asset bytes
- Local/CI release candidates carry per-archive checksums and provenance
- Remote publication gated by US-100
- **Explicitly deferred:** Signing, notarization, auto-update

**Explicit Non-Goals (lines 138-147):**
- Reimplementing Harness intake, risk classification, or durable schema
- Reading/writing Harness tables directly
- Owning, vendoring, or copying Harness source
- Treating local databases/run evidence as committed collaboration state
- Requiring PR provider, design tool, personal skill tree, or editor setup
- Promising cross-machine scheduling, hosted execution, or packaged releases before owning stories deliver

---

### 3. docs/SYMPHONY_QUICKSTART.md
**Path:** `docs/SYMPHONY_QUICKSTART.md` (lines 1-193)

**Context:** For operators running built Symphony artifact against Harness-enabled target repo (US-096 produces checksum-verifiable local/CI candidates, does not publish remote)

**Step 1: Choose Artifact & Target Repo (lines 7-50):**
- Verify archive before extraction
- Keep `bin/` and `share/` under one installation root (executable validates/loads `share/harness-symphony/resource-manifest.json`)
- Runtime validation: manifest version, paths, hash shape, required index
- Release verifier recomputes Web tree hash, binds actual bytes to archive checksum before installation

**macOS/Linux (lines 16-26):**
```bash
ARCHIVE=/absolute/path/to/harness-symphony-<target>.tar.gz
(cd "$(dirname "$ARCHIVE")" && shasum -a 256 -c "$(basename "$ARCHIVE").sha256")
INSTALL_ROOT="$HOME/.local"
mkdir -p "$INSTALL_ROOT"
tar -xzf "$ARCHIVE" -C "$INSTALL_ROOT"
SYMPHONY="$INSTALL_ROOT/bin/harness-symphony"
REPO=/absolute/path/to/target-repository
```

**Windows (lines 28-40):**
```powershell
$Archive = "C:\absolute\path\to\harness-symphony-windows-x64.tar.gz"
$Expected = ((Get-Content "$Archive.sha256") -split '\s+')[0].ToLowerInvariant()
$Actual = (Get-FileHash -Algorithm SHA256 $Archive).Hash.ToLowerInvariant()
if ($Actual -ne $Expected) { throw "Symphony archive checksum mismatch" }
$InstallRoot = Join-Path $env:LOCALAPPDATA "Programs\Symphony"
New-Item -ItemType Directory -Force $InstallRoot | Out-Null
tar -xzf $Archive -C $InstallRoot
$Symphony = Join-Path $InstallRoot "bin\harness-symphony.exe"
$Repo = "C:\absolute\path\to\target-repository"
```

- Always identify target with `--repo-root`; works from any directory
- Signing/notarization/auto-update deferred; archive checksum + trusted provenance = current integrity controls
- Target needs compatible Harness CLI + initialized Harness database
- Optional settings in `examples/symphony.yml`

**Step 2: Check Readiness & Select Work (lines 52-66):**
```bash
"$SYMPHONY" --repo-root "$REPO" doctor
"$SYMPHONY" --repo-root "$REPO" work list
```
- Fix `doctor` failures before run
- `work list` statuses: `yes` (runnable), `warn` (non-runnable until gap resolved), `no` (Symphony won't run yet)

**Step 3: Prepare & Execute (lines 68-99):**
- Normal/high-risk: inspect workspace + contract before launch
- Preparation creates worktree below `.symphony/worktrees/<run_id>/`
- Writes `.harness/runs/<run_id>/RUN_CONTRACT.json` inside workspace
- Harness creates isolated database via WAL-safe snapshot protocol
- Symphony launches configured agent adapter
- Tiny-lane may run in target checkout with `--here` flag
- Symphony refuses `--here` for normal/high-risk; lightweight still uses isolated database + result artifacts

**Step 4: Understand Outputs (lines 101-131):**
Every completed run must write (under workspace):
```text
.harness/runs/<run_id>/SUMMARY.md
.harness/runs/<run_id>/RESULT.json
```

If durable Harness mutations:
```text
.harness/changesets/<run_id>.changeset.jsonl
```

**Distinction:**
- `SUMMARY.md`, `RESULT.json`, logs, validation output = local run evidence (not durable repo records)
- Product/code/docs changes + semantic changesets = branch changes (may be committed/reviewed in PR)
- `harness.db`, `.symphony/state.db` = local indexes (never PR artifacts)

**Inspection Commands:**
```bash
"$SYMPHONY" --repo-root "$REPO" status
"$SYMPHONY" --repo-root "$REPO" runs list
"$SYMPHONY" --repo-root "$REPO" runs show <run_id>
```

**Step 5: Optional PR & Post-Merge Sync (lines 146-178):**
When PR provider configured:
```bash
"$SYMPHONY" --repo-root "$REPO" pr create <run_id>
"$SYMPHONY" --repo-root "$REPO" pr retry <run_id>
```
- Optional; uses summary as PR body
- Publishes run branch with product changes + semantic changeset
- Does NOT turn local result files/databases into committed state

After PR accepted, pull merged branch + replay changesets:
```bash
"$SYMPHONY" --repo-root "$REPO" sync
```
- Goes through typed Harness changeset-status/apply protocol
- Idempotent: already-applied changeset skipped; invalid/incompatible fails before marking applied

**Contributor Source Workflow (lines 180-192):**
Operators need NO Cargo/source/binary. Contributors build with:
```bash
cargo build --locked -p harness-symphony
cargo test --workspace --locked
cargo run --locked -p harness-symphony -- --repo-root /path/to/target doctor
```

---

### 4. docs/OPTIONAL_TOOLING.md
**Path:** `docs/OPTIONAL_TOOLING.md` (lines 1-31)

**Core Principle:**
> "Symphony builds, runs, and validates without Impeccable or any project-local design-tool configuration. Impeccable is an optional external provider for design review; it is not a dependency, bundled extension, or prerequisite."

**Design Review Degrade Ladder:**
1. **No provider registered:** skip optional review cleanly; record `design-review: inactive` when trace written (not drift, must not fail validation)
2. **Provider registered but missing/unusable:** continue with required build/Playwright/accessibility/human screenshot checks; report degraded warning; mark proof weak if workflow requires provider
3. **Provider present/usable:** may add optional design audit/validation; supplements rather than replaces required executable + human review evidence

**Generic Harness Tool Registry Ownership:**
- Provider discovery and status owned by generic Harness tool registry
- Symphony does NOT prescribe Impeccable install command or scan path (external/runtime-specific concerns)
- **Critical:** Do NOT add `.impeccable`, `.codex`, or `.agents` configuration to this repository

**Archived Material:**
- Archived intake-griller under `archive/extensions/harness-intake-griller/` (historical source material)
- Deliberately outside hidden runtime discovery paths
- Neither executable nor required before Symphony run

---

### 5. docs/RELEASING.md
**Path:** `docs/RELEASING.md` (lines 1-39)

**Five-Platform Workflow:**
- Creates immutable candidates
- Publishing GitHub release/tag = separate explicit owner-approved cutover action
- Published `symphony-v0.1.0` release = initial baseline
- Later releases must repeat complete native + aggregate gates

**Prerequisites (lines 8-9):**
- Pinned Rust + Node versions
- `npm ci`
- Common Unix archive tools

**Build Commands (from repo root, lines 11-15):**
```bash
npm --prefix crates/harness-symphony/web-ui ci
scripts/build-release.sh
scripts/verify-release-manifest.sh --native dist/release-manifest.json
```

**Build Output:**
- One native archive
- `.sha256` sidecar
- `release-manifest.json`

**CI Pattern (lines 16-19):**
- CI runs same command once per target
- Later aggregates verified native entries

**Packaging Constraints (lines 21-24):**
- Rejects dirty release inputs
- Rejects `SOURCE_SHA` differing from checked-out `HEAD`
- `SYMPHONY_RELEASE_ALLOW_DIRTY_TEST_ONLY=1` exists ONLY for pre-commit story verifier
- Marks metadata/provenance dirty; must NEVER be set by release CI

**Testing (lines 26-32):**
```bash
tar -xzf dist/harness-symphony-<version>-<target>.tar.gz -C /tmp/symphony
/tmp/symphony/bin/harness-symphony --version
/tmp/symphony/bin/harness-symphony --repo-root /path/to/harness-project doctor
```

**Asset Location (lines 34-35):**
Web UI served from `share/harness-symphony/web-ui`; Cargo/npm/Symphony source NOT runtime requirements

**Deferred Work (lines 37-39):**
- Unsigned artifacts
- Notarization, code signing, installers, auto-update, remote publication = explicitly deferred

---

### 6. docs/contracts/release-manifest-v1.md
**Path:** `docs/contracts/release-manifest-v1.md` (lines 1-36)

**Overview:**
`dist/release-manifest.json` = machine-readable index for local/CI release candidate

**Top-Level Fields (lines 6-15):**
- `manifest_version`: integer `1`
- `product`: `harness-symphony`
- `symphony_version` and `source_sha`
- `source_dirty`: `false` for aggregate candidate; test-only native manifests may truthfully record `true`
- `supported_harness`: protocol `1`, schema range `1..13`, supported current database schemas `12..13`
- `artifacts`: one entry per native archive

**Artifact Entry Fields (lines 17-20):**
- `target_triple`
- `archive_name`
- `archive_format`
- `binary_path`
- `web_asset_root`
- `web_asset_sha256`
- `archive_sha256`
- `metadata_sha256`
- `provenance_sha256`
- `sbom_sha256`

**Path Safety (lines 22-25):**
All paths = relative archive paths; must be safe:
- No absolute path
- No empty segment
- No `..` segment

**Verification Constraints (lines 22-29):**
Verifier must:
- Recompute every checksum
- Reject duplicate archive entries
- Reject opaque databases or Harness CLI source/binaries
- Compare internal metadata to manifest (not trust producer output)

**Native vs Aggregate Jobs (lines 31-35):**
- Native jobs emit single-entry manifests
- Final aggregation job merges only when:
  - Every top-level identity field matches
  - Target triples + archive names unique

**Supported Target Triples (lines 31-35, named in lines 34-35):**
1. `aarch64-apple-darwin`
2. `x86_64-apple-darwin`
3. `aarch64-unknown-linux-gnu`
4. `x86_64-unknown-linux-gnu`
5. `x86_64-pc-windows-msvc`

**Verification Modes:**
- `--native`: accepts exactly one supported target triple
- `--aggregate`: requires exactly all five supported triples + clean source

---

### 7. docs/decisions/0008-symphony-release-layout.md
**Path:** `docs/decisions/0008-symphony-release-layout.md` (lines 1-44)

**Status:** Accepted for local/CI release candidates; remote publication gated by US-100

**Decision: Stable Archive Layout (lines 8-28):**
```text
bin/harness-symphony[.exe]
share/harness-symphony/web-ui/**
LICENSE
release-metadata.json
provenance.json
sbom.spdx.json
```

- Backend locates Web assets relative to executable at `../share/harness-symphony/web-ui`
- Development overrides + US-095 executable-adjacent test layout = explicit fallbacks
- Archive cannot contain its own checksum (circular hash issue)
- `release-metadata.json`, provenance, SBOM describe source + staged content
- External `release-manifest.json` + `.sha256` sidecar bind files to final archive bytes
- CLI archives + Electron packages separable
- Electron consumes same resource layout/metadata; desktop signing must not block CLI release candidate

**Reproducibility (lines 34-39):**
- Archive entries sorted, assigned source commit timestamp
- Numeric owner/group zero, normalized modes
- Gzip timestamps suppressed
- Two packages built from same already-built native binary + Web output = byte-identical

**Deferred Work (lines 41-44):**
- Code signing, notarization, installer distribution, auto-update
- Remote GitHub Release publication NOT part of US-096

---

### 8. AGENTS.md
**Path:** `AGENTS.md` (lines 1-15)

**Content (lines 1-15):**
```markdown
# Agent Instructions

<!-- HARNESS:BEGIN -->
## Harness

This repo uses Harness. Before work, read:

- `README.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT_RULES.md`
- `docs/TOOL_REGISTRY.md`
- `scripts/bin/harness-cli query matrix` on macOS/Linux, or `.\scripts\bin\harness-cli.exe query matrix` on Windows
<!-- HARNESS:END -->
```

**Role:** 15-line entry point; directs agents to read 6 files + 1 CLI command before work

---

## INHERITED-FROM-HARNESS (shallow review)

All docs below are inherited from repository-harness with minimal symphony-specific deviations. Brief scan only; full harness docs live in repository-harness repo.

| Doc | Inherits From | Note | Symphony Deviation |
|-----|---|---|---|
| `docs/ARCHITECTURE.md` | repository-harness | Generic architecture questions; no application stack selected yet | None; explicitly placeholder for future symphony app stack |
| `docs/CONTEXT_RULES.md` | repository-harness | Context selection rules for agents by intake phase (Tiny/Normal/High-Risk) | None observed |
| `docs/FEATURE_INTAKE.md` | repository-harness | Intake flow, input type classification | None observed |
| `docs/GLOSSARY.md` | repository-harness | Standard Harness glossary (Agent, Harness, Product Contract, Story Packet, Feature Intake, Component Taxonomy) | None observed |
| `docs/HARNESS.md` | repository-harness | Harness mental model (intent → intake → story → agent loop) | None observed |
| `docs/HARNESS_COMPONENTS.md` | repository-harness | Responsibility map (11 areas), NexAU decomposition (7 surfaces), coverage status | Symphony clarification: maps to Symphony/Harness integration points, not symphony-internal |
| `docs/HARNESS_MATURITY.md` | repository-harness | Maturity ladder H0-Hx; no repository harness → measurable improvement | None observed |
| `docs/TRACE_SPEC.md` | repository-harness | Trace table field spec (id, created_at, task_summary, intake_id, story_id, agent, etc.) | None observed |
| `docs/TOOL_REGISTRY.md` | repository-harness | Inbound tool registry (optional capabilities) + outbound CLI manifest | None observed |
| `docs/TEST_MATRIX.md` | repository-harness | No product behavior defined yet; template for future story/contract/proof mapping | None observed; expected to populate as symphony product behavior defined |
| `docs/IMPROVEMENT_PROTOCOL.md` | repository-harness | Phase 5 self-improvement loop (friction → propose → backlog → implement → close) | None observed |

---

## SUMMARY OF SYMPHONY PRODUCT BOUNDARIES

**Symphony Is:**
- Local CLI orchestrator for Harness stories
- Standalone; does not require Harness source/checkout
- Uses typed Harness protocol (v1) for work discovery, database isolation, mutations
- Manages run preparation, isolation (worktree/DB), result validation, review surfaces, optional PR automation
- Produces 5-platform checksum-verifiable release candidates (macOS arm64/x64, Linux arm64/x64, Windows x64)
- Release manifest v1 machine-readable index with artifact sha256 hashes
- Stable archive layout: `bin/harness-symphony`, `share/harness-symphony/web-ui/**`, metadata/provenance/SBOM

**Symphony Is NOT:**
- Harness policy engine, risk classifier, or intake owner
- General-purpose issue tracker
- Hosted autonomous coding service
- Requirement for PR provider, design tools, personal skill config
- Direct database reader/writer
- Distributed scheduler or multiple-concurrent-writer manager
- Signed, notarized, or auto-updating product (explicitly deferred)

**Key Delivery Contracts:**
1. `RUN_CONTRACT.json` — run identity, story, workspace paths, required outputs, validation context (per-run, versioned)
2. `RESULT.json` — agent outcome (versioned, machine-readable, terminal state)
3. `SUMMARY.md` — human-readable narrative (used as PR body if published)
4. `.harness/changesets/<run_id>.changeset.jsonl` — durable Harness semantic operations (committed to repository)
5. `release-manifest.json` + `.sha256` sidecar — immutable native/aggregate artifact index

**Verification & Integrity:**
- Archive checksum (SHA256) via `.sha256` sidecar file
- Release verifier recomputes Web tree hash, binds bytes to archive checksum
- Manifest verifier recomputes all artifact checksums, rejects opaque/unsafe paths
- Aggregate verification requires all 5 target triples + clean source
- No signing, notarization, or auto-update in scope

---

Status: DONE
Summary: Completed comprehensive inventory of all Symphony-specific documentation (README, SCOPE, QUICKSTART, OPTIONAL_TOOLING, RELEASING, release-manifest-v1, decision 0008, AGENTS.md) with exact quotes, line numbers, code artifacts, and 5-platform release matrix. Inherited docs from repository-harness reviewed shallowly; no symphony-specific deviations detected in generic harness infrastructure docs.
Concerns/Blockers: None
