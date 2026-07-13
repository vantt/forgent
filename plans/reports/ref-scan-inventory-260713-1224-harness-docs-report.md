# Repository Harness Documentation Inventory

**Scan date:** 2026-07-13  
**Repository:** `/home/vantt/projects/forgent/references/repository-harness`  
**Scope:** Complete documentation audit covering root-level files, docs/ directory structure, templates, and plans/

---

## Executive Summary

The repository-harness is a **reusable project-level operating system for AI-assisted software development**. It defines how humans and agents collaborate to turn product intent into safe, validated work. The harness exists before any application code; it consists entirely of policy documents, templates, a durable SQLite layer (via Rust CLI), and Phase 2-5 roadmap documents that define the framework's evolution.

**Current maturity:** H3 (active observability) after Phase 4 completion; H5 (self-improvement) in active development as Phase 5.  
**Total tracked files:** 119 in docs/, 7 root .md files, 5 PHASE files, plus 8 decision records, 22+ story files, 4 templates, and supporting directories.

---

## ROOT-LEVEL MARKDOWN FILES

All root files define high-level policy and project-level decision.

### README.md
**Purpose:** Entry point explaining the harness philosophy and installation.

**Key sections:**
- **The Problem:** Agents edit code before understanding product intent; important constraints live in chat history or people's heads.
- **The Harness Approach:** Reusable patterns for agent-ready repos including AGENTS.md, product contracts, story packets, validation matrix, decisions.
- **Installation:** Bash and PowerShell installers with `--merge`, `--override`, `--claude` flags; CLI released separately.
- **Philosophy quote:** "Coding agents do not only need better prompts. They need better repositories."

**Load-bearing contract:**
```
A repository starts to have a harness when it helps an agent answer practical
engineering questions without relying only on chat history:
- What should I read first?
- What type of work is this?
- Which product contract does it affect?
- How risky is the change?
- What proof will show the work is done?
- What decision or lesson should future agents inherit?
```

### CLAUDE.md
**Purpose:** Claude Code session bootstrap file; imports AGENTS.md and FEATURE_INTAKE.md at context-load time.

**Content:** 
- Harness import block (bare `@` lines, no backticks; disables on backtick wrapping).
- Instructs agents to run `scripts/bin/harness-cli query matrix` before starting work.
- Lane-dependent context is intentionally NOT auto-imported; agents read per phase per `docs/CONTEXT_RULES.md`.

**Key rule:** "Never wrap `@` lines in backticks; that disables the import."

### AGENTS.md
**Purpose:** Stable agent shim; the primary entry point agents read before work.

**Content:**
- **Project Skills:** References `.codex/skills/harness-intake-griller/SKILL.md` for discussion and feature intake.
- **Harness section:** Imports reading list with exact file order.
- **CLI section:** Names the Rust CLI as main operational tool with exact paths for macOS/Linux/Windows.
- **Tool registry:** Instructs agents to run `scripts/bin/harness-cli query tools --capability <name> --status present` before steps needing external tools.

**Key instruction:** "Absent tool capability is a clean skip, never a failure."

### CONTRIBUTING.md
**Purpose:** Contribution guidelines for external contributors to the harness itself.

**Good contribution types:**
1. Real-world harness examples (what agent/tool, what helped, what was missing).
2. Agent failure cases (what misunderstanding, which artifact could prevent it).
3. Template improvements for specs, stories, decisions, validation, rules.
4. Validation patterns per stack type.
5. Documentation clarity.

**Pre-PR checklist:**
- Read AGENTS.md
- Classify work with FEATURE_INTAKE.md
- Keep changes focused
- Update related docs
- Explain proof showing change is useful

**Explicit exclusion:** "Avoid adding project-specific product specs unless part of a clearly marked demo or example. Keep harness reusable."

### CHANGELOG.md
**Format:** Date-ordered entry per PR merge with commit hash, files changed, and Harness CLI release version when triggered.

**Recent entries (sample):**
- **2026-07-07 PR #37:** US-070 completed; web-ui readable done-column task cards
- **2026-07-05 PR #36:** US-068 completed; bounded work-item cards
- **2026-07-04 PR #35:** US-064 completed; ready work story delete
- **2026-06-15 PR #20:** Fix missing files in installer lists
- **2026-06-09 PR #13:** Phase 5 scope (Evolution Infrastructure)

**Post-merge automation:** Changelog entries auto-generated; Harness CLI patch released when PR touches source/schema/Cargo/packaging.

---

## PHASE DOCUMENTS

The harness evolves in sequential phases (H0 → H5), each validated by the `harness-benchmark` repository.

### PHASE2.md — Observability & Taxonomy
**Target:** H1.5 → H2 (component observability, structured traces, maturity tracking, context guidance)  
**Nature:** Pure specification work (markdown only; no code, no schema)

**Four stories** (each builds on previous):
1. **US-003 Component Taxonomy** → `docs/HARNESS_COMPONENTS.md` (inventory files → 11-responsibility framework + NexAU 7-component cross-reference)
2. **US-005 Maturity Ladder** → `docs/HARNESS_MATURITY.md` (H0–H5 with verifiable criteria, files required, benchmark indicators per level)
3. **US-004 Trace Specification** → `docs/TRACE_SPEC.md` (field specs, quality tiers: minimal/standard/detailed, friction capture protocol, lane-to-tier mapping)
4. **US-006 Context Rules** → `docs/CONTEXT_RULES.md` (intake/planning/implementation/validation/trace phases × tiny/normal/high-risk; retrieval triggers; token budgets)

**Expected benchmark deltas:** Harness compliance 74% → 85-90%; trace quality 1.5 → 2.0-2.5; friction captured 2/6 → 4-5/6 tasks.

**Deliverables:** 4 docs + AGENTS.md + HARNESS.md updates + GLOSSARY.md new terms + benchmark comparison.

---

### PHASE3.md — Active Observability
**Target:** H2 → H3 (active scoring, friction context, feedback loop)  
**Nature:** Rust CLI code + documentation (no schema migrations; schema already has columns needed)

**Three stories** (dependency order enforced):
1. **US-011 Backlog Outcome Workflow** (documentation + filter; shows open vs closed backlog; enables predicted-impact ↔ actual-outcome feedback)
2. **US-008 Trace Quality Scoring** (new CLI command `scripts/bin/harness-cli score-trace`; evaluates trace fields against TRACE_SPEC.md tier rules; compares achieved vs required tier)
3. **US-009 Enriched Friction Query** (friction entries gain lane and task-type context for pattern recognition)

**Trace scoring rules (sample):**
- Minimal (1): `task_summary` ≥10 chars + non-null `outcome`
- Standard (2): Minimal + `intake_id` + `agent` + `actions_taken` + `files_read` + `files_changed` + (errors OR harness_friction)
- Detailed (3): Standard + `decisions_made` + explicit `errors` and `harness_friction` + duration/token fields (or note explaining why absent)

---

### PHASE4.md — Mechanical Verification
**Target:** H3 partial → H4 partial (story verification + pre-close gate + auto-scoring on trace write)  
**Nature:** Rust CLI code + schema migration (`002-story-verify.sql`)

**Summary:** Phase 4 adds `story.verify_command` field and `story verify <id>` / `story verify-all` commands; auto-scores traces when written; warns on `trace --story <id>` if linked story verification hasn't passed.

**Friction findings from Phase 4 benchmark:**
- T4 authentication: decision text in trace but no durable `docs/decisions/NNNN-*.md` record (high-risk auth work must add decision row).
- Proof flags require numeric booleans: use `--unit 1 --integration 1` not `yes`/`no`.
- Agents should prefer command examples in docs before repeated help probing.

---

### PHASE5.md — Evolution Infrastructure
**Target:** H4 partial → H5 partial (self-improvement loop, drift detection, batch verification)  
**Nature:** Rust CLI code + schema migration (tools, interventions, context rules automation)

**Three workstreams:**
1. **Validate:** `score-context` (US-022) + `audit` (US-023) → "here's what's wrong"
2. **Check:** `verify-all` (US-020) → "here's what's broken"
3. **Improve:** `propose` (US-024) → "here's what to fix, based on patterns"

**Research grounding:** Runtime Substrate (H5 = harness proposes safe self-improvements), Continual Harness (self-improvement requires verified traces + outcome comparison), "The Last Harness" (Evolution role must be mechanical and auditable), AHE (tool registry + capability manifest), NLAHs (context rule measurement before enforcement).

---

## DOCS/ DIRECTORY STRUCTURE

**Total:** 119 files across 8 directories.

```
docs/
├── (root 17 files: specification and reference docs)
├── decisions/          8 files (durable decisions NNNN-*.md)
├── demo/              1 file  (walkthrough example)
├── product/           2 files (product contract, empty until spec provided)
├── stories/          22 files (feature packets, backlog, epics)
│   └── epics/
├── templates/         4 files (reusable formats)
│   └── high-risk-story/ (4 files: overview, design, execplan, validation)
```

### ROOT DOCS FILES (17 total)

**Entry-point files:**

#### docs/README.md
Maps the directory: main files (HARNESS.md, FEATURE_INTAKE.md, ARCHITECTURE.md, TEST_MATRIX.md, HARNESS_BACKLOG.md, GLOSSARY.md, SYMPHONY_QUICKSTART.md, SYMPHONY_SCOPE.md) and folders (product/, stories/, decisions/, demo/, templates/). Clarifies current state: "Harness v0 exists before implementation."

#### docs/HARNESS.md
**Core mental model:** Human intent → Feature intake → Story packet → Agent work loop → Product delta → Validation proof → Harness delta → Next intent.

**Key sections:**
- **Harness v0 Scope:** Agent entrypoint, policy docs, templates, durable SQLite layer, growth backlog.
- **Durable Layer:** Operational data (intake, story, decision, backlog, trace) in SQLite (`harness.db`), managed by Rust Harness CLI, `.gitignore`d.
- **Spec Lifecycle:** Spec is input material, not permanent; decompose into product docs, stories, architecture, validation expectations.
- **Growth Rule:** "The harness grows from friction." Record it or improve harness directly with `scripts/bin/harness-cli backlog add`.
- **Task Loop:** 9 steps including intake classification, proof matrix query, lane selection, trace recording per TRACE_SPEC.md tier, friction capture.
- **Story Verification:** Stories may carry `verify_command`; `story verify <id>` runs it and records pass/fail.

**Load-bearing quote:**
```
Policy documents describe how to work. The durable layer stores what happened.
```

#### docs/FEATURE_INTAKE.md
**Mandatory gate:** Every prompt enters intake before code changes.

**Input types:** New spec, spec slice, change request, new initiative, maintenance request, harness improvement.

**Lanes:**
- **Tiny:** Low-risk docs, copy, narrow edits, initial setup (health/smoke endpoints, no domain schema/auth/provider/migration).
- **Normal:** Story-sized bounded behavior (create story, link product docs, add validation, implement vertical slice).
- **High-risk:** Security, data, scope, contracts, multi-role (create story folder, fill execplan/overview/design/validation, ask confirmation, record decision).

**Risk checklist:** Auth, authorization, data model, audit/security, external systems, public contracts, cross-platform, existing behavior, weak proof, multi-domain. 4+ flags or hard gates → high-risk.

**Hard gates:** Auth, authorization, data loss, audit/security, external provider, removing validation.

**Output format required:**
```
Lane: [tiny|normal|high-risk]
Reason: [risk flags + explanation]
Docs: [affected product docs]
Story: [story file path]
Validation: [unit, integration, E2E]
```

#### docs/ARCHITECTURE.md
**Principle:** "Discovery before shape." Identify product surfaces, runtime stack, core domains, boundary inputs, validation ladder before proposing implementation.

**Default layering:** domain ← application ← infrastructure ← interface ← app surfaces.

**Candidate structure:** app/domain/, app/application/, app/infrastructure/, app/interface/, surfaces/.

**Dependency rule:** Inner layers must not depend on outer. Domain depends on nothing external except tiny utilities.

**Parse-first boundary rule:** Unknown data parsed at boundaries before entering inner code. Applies to HTTP requests, sessions, env vars, DB rows, webhooks, deep links.

**Rationale:** "No application stack is selected yet. No application code exists yet. This document defines generic architecture questions and boundary rules that future implementation should adapt."

#### docs/TEST_MATRIX.md
**Status values:** planned, in_progress, implemented, changed, retired.

**Matrix structure:** Story | Contract | Unit | Integration | E2E | Platform | Status | Evidence.

**Evidence rules:**
- Unit: pure domain and application rules
- Integration: backend enforcement, data integrity, provider behavior, jobs, service contracts
- E2E: user-visible browser flows
- Platform: shell, deployment, mobile, desktop, runtime behavior

**Note:** "A story can be implemented without every proof column if the story packet explains why."

**Current state:** All rows marked "planned"; matrix fills as stories are implemented. Query current proof status with `scripts/bin/harness-cli query matrix`.

#### docs/GLOSSARY.md
**Terms defined (sample):**
- **Agent:** AI coding collaborator
- **Harness:** Repo-level OS for safe product changes
- **Product Contract:** Current expected behavior
- **Story Packet:** Story-sized work file with product contract, affected docs, design, validation
- **Feature Intake:** Classification into tiny/normal/high-risk before implementation
- **Component Taxonomy:** Map files/capabilities to 11-responsibility framework
- **Maturity Level:** H0-H5 verifiable stages (H0 bare, H1 scaffolding+policy, H2 durable state+observability, H3 active observability+evolution, H4 automated verification, H5 self-improving)
- **Trace Quality Tier:** Minimal/standard/detailed per lane
- **Verification Gate:** Advisory Harness check before task close
- **Tool Registry:** Compiled + registered tool manifest from `scripts/bin/harness-cli query tools`
- **Intervention:** Durable record of human/reviewer/CI/agent correction
- **Context Score:** Result of `scripts/bin/harness-cli score-context <trace-id>` comparing reads vs context rules
- **Entropy Score:** Drift score from `scripts/bin/harness-cli audit` (lower is better)
- **Improvement Proposal:** Structured recommendation from `scripts/bin/harness-cli propose`
- **Context Phase:** Intake/planning/implementation/validation/trace recording
- **Retrieval Trigger:** Condition telling agent to fetch additional context
- **Harness Delta:** Doc, template, validation, backlog, decision update
- **Backlog Outcome Loop:** Feedback workflow: predicted impact at creation, actual outcome at close
- **Durable Layer:** SQLite + Rust CLI storing operational records (separate from policy docs)
- **Product Delta:** Code, tests, API shape, data model, product documentation
- **Trace:** Structured record of agent actions, files, decisions, errors, outcome, friction

#### docs/SYMPHONY_QUICKSTART.md
**Purpose:** Beginner-facing instructions for running stories via Harness Symphony (local runner).

**Core concept:** Symphony transforms a story file into isolated run workspace (copied harness.db, RUN_CONTRACT.json, agent execution) → SUMMARY.md, RESULT.json, semantic changeset JSONL.

**Key rule:** "Root harness.db is not source of truth for a run. Run writes to copied DB; durable changes preserved as changesets."

**Lanes:**
- **Tiny:** `run <story-id> --here` (current checkout)
- **Normal/high-risk:** `run <story-id> --prepare-only` (isolated worktree) then `run <story-id>` (isolated execution)

**Flow:** Story → classification → isolation (if needed) → RUN_CONTRACT.json shim → agent work → SUMMARY.md + RESULT.json + changeset → review/PR.

#### docs/SYMPHONY_SCOPE.md
**Detailed design** for Harness-native agent workbench. (Skipped detailed read; referenced for context.)

#### docs/TOOL_REGISTRY.md
**Two kinds of "tool":**
1. **Capability manifest (outbound):** Harness offers (built-in `harness-cli` subcommands)
2. **Inbound tool registry:** Project equips for harness to use (gitnexus, linters, deploy checks, optional)

**Registration pattern:**
```bash
scripts/bin/harness-cli tool register \
  --name <name> --kind [cli|binary|mcp|skill|http] \
  --capability <kebab-case> --command <cmd> \
  --description <text> --responsibility <type> [--args ...]
```

**Tool kinds:**
- `cli` / `binary`: probed via command on PATH
- `mcp` / `skill` / `http`: registered without `--force`; presence resolved later by `tool check`

**Probe and query:**
```bash
scripts/bin/harness-cli tool check [--name <name>] [--json]
scripts/bin/harness-cli query tools --capability <name> --status [present|missing|unknown]
```

**Guarantee:** "Absent capability is a clean skip, never a failure."

#### docs/HARNESS_BACKLOG.md
**Legacy improvement list.** Current items stored in durable layer via `scripts/bin/harness-cli backlog add` and queried with `--open`, `--closed` filters. (Details deferred to `backlog` table.)

#### docs/HARNESS_AUDIT.md
Reference to drift detection; produced by `scripts/bin/harness-cli audit`.

#### docs/IMPROVEMENT_PROTOCOL.md
Protocol for how friction becomes proposals becomes backlog items. (Phase 5 work.)

#### docs/CONTEXT_RULES.md
**Phase 2 deliverable:** Defines what context reaches model per phase and lane.

**Structure (example from PHASE2.md):**
```
Context Phases: Intake | Planning | Implementation | Validation | Trace
Lane ×Phase matrix: Must read | Should read | Skip
Retrieval Triggers: e.g., "If task touches database schema, read docs/decisions/ for prior schema decisions"
Token Budget Guidance: Tiny ~2K, Normal ~5K, High-risk ~10K
```

#### docs/HARNESS_COMPONENTS.md
**Phase 2 deliverable:** Taxonomy mapping harness files to 11-responsibility framework + NexAU 7-component decomposition.

**11 responsibilities:**
1. Task specification → AGENTS.md, FEATURE_INTAKE.md, templates, intake/story tables
2. Context selection → AGENTS.md, CONTEXT_RULES.md, ARCHITECTURE.md, decisions, product docs, score-context
3. Tool access → harness-cli, TOOL_REGISTRY.md, tool table
4. Project memory → docs, decisions, GLOSSARY.md, backlog, story, trace tables
5. Task state → query matrix, TEST_MATRIX.md, intake/story/trace tables
6. Observability → TRACE_SPEC.md, trace table, score-trace, query traces/friction, HARNESS_MATURITY.md
7. Failure attribution → HARNESS_COMPONENTS.md, TRACE_SPEC.md, trace.errors/harness_friction, HARNESS_BACKLOG.md, query friction
8. Verification → TEST_MATRIX.md, query matrix, story verify, verify-all, trace, score-trace, validate workflows
9. Permissions → AGENTS.md, HARNESS.md, FEATURE_INTAKE.md, ARCHITECTURE.md, installer conflict handling
10. Entropy auditing → HARNESS_BACKLOG.md, HARNESS_AUDIT.md, IMPROVEMENT_PROTOCOL.md, backlog/trace tables, audit, propose
11. Intervention recording → intervention table, intervention add/query, trace/decision/story tables, docs

**NexAU cross-reference:**
| Component | Harness Equivalent | Status |
|-----------|-------------------|--------|
| System prompts | AGENTS.md + policy docs | Covered |
| Tool descriptions | TOOL_REGISTRY.md, CLI help | Covered |
| Tool implementations | harness-cli crates | Covered |
| Middleware | installer, intake workflow | Partial |
| Skills | templates, docs | Partial |
| Sub-agents | None | Missing |
| Long-term memory | harness.db, decisions, stories | Covered |

#### docs/HARNESS_MATURITY.md
**Phase 2 deliverable:** Verifiable ladder H0-H5 with required files, criteria, benchmark indicators.

**Levels:**
- **H0 Bare Environment:** No harness. Functional score only. Status: Passed.
- **H1 Scaffolding & Policy:** AGENTS.md, HARNESS.md, FEATURE_INTAKE.md, ARCHITECTURE.md, TEST_MATRIX.md, templates. Compliance 20-40%. Status: Achieved.
- **H2 Durable State & Observability:** CLI, schema, HARNESS_COMPONENTS.md, HARNESS_MATURITY.md, TRACE_SPEC.md, CONTEXT_RULES.md. Compliance 75-90%, trace quality 2.0+, lane accuracy 6/6, friction captured 4-5/6. Status: Achieved.
- **H3 Active Observability & Evolution:** Trace quality scoring by command, friction grouped by component, backlog with predicted/actual outcomes. Status: Partial (Phase 4 complete).
- **H4 Automated Verification:** Story verify_command, batch verify-all, pre-close gate. Status: Partial (Phase 4 complete).
- **H5 Self-Improving Harness:** Automated improvement proposal pipeline, drift detection, self-repair. Status: In progress (Phase 5).

#### docs/TRACE_SPEC.md
**Phase 2 deliverable:** Specifies trace fields, quality tiers, friction capture protocol.

**Fields (example):**
| Field | Type | Required | Format |
|-------|------|----------|--------|
| task_summary | TEXT | Yes | Free text ≥10 chars |
| actions_taken | TEXT | Standard+ | JSON array |
| files_changed | TEXT | Standard+ | JSON array |
| errors | TEXT | Detailed | structured or "none" |
| harness_friction | TEXT | Detailed | structured or "none" |

**Quality tiers:**
- **Minimal (1):** task_summary ≥10 chars + outcome
- **Standard (2):** Minimal + actions_taken + files_read + files_changed + (errors OR harness_friction)
- **Detailed (3):** Standard + decisions_made + explicit errors/friction + duration/token or note

**Lane-to-tier mapping:**
- Tiny → Minimal acceptable
- Normal → Standard required
- High-risk → Detailed required

### docs/DECISIONS/ (8 files)

All follow `docs/templates/decision.md` format. Durable records of choices that constrain future work.

- **0001-harness-first-development.md:** Harness-as-library-first (policy + templates before app code)
- **0002-post-spec-product-lifecycle.md:** After spec decomposition, use product docs/stories/decisions not extended monolithic spec
- **0003-generic-spec-intake-harness.md:** Generic harness for any project, not baked-in product spec
- **0004-sqlite-durable-layer.md:** SQLite + Rust CLI for durable operational records (separate from markdown policy)
- **0005-prebuilt-rust-harness-cli.md:** Prebuilt Rust CLI released separately; installer downloads and verifies via .sha256
- **0006-phase-4-benchmark-triage.md:** Clarifications from Phase 4 benchmark (decision text vs durable record, proof flag numeric booleans, command shape)
- **0007-improvement-proposal-rules.md:** Proposals are advisory unless committed to backlog; they come from friction + intervention patterns
- **README.md:** Index of decision records; explains decision role in harness

### docs/DEMO/ (1 file)

#### docs/demo/README.md — Harness Demo Walkthrough
Example transformation: "Build a simple team task tracker" spec → intake note → product contract fragments → story packet → proof matrix → decision record → implementation.

Shows the harness ideal workflow:
1. **Input:** Prompt or spec
2. **Intake:** Classify input type and lane (normal, because no auth/payments/migration/provider)
3. **Product Contract:** Small docs (tasks.md, assignment.md) not monolithic spec
4. **Story Packet:** Atomic story (US-001 Create a task) with acceptance criteria and validation layers
5. **Proof Matrix:** Durable row linking story to product contract to proof columns
6. **Decision:** If stack/model/rule is chosen, record under docs/decisions/
7. **Implementation:** Only after contract, story, proof shape clear
8. **Harness Delta:** Ask whether harness itself should improve

### docs/PRODUCT/ (2 files)

- **README.md:** Placeholder; "empty until a spec is derived"
- **symphony-web-ui-controller.md:** Symphony Web UI Controller product spec (demo/example)

### docs/STORIES/ (22+ files)

#### Structure
```
stories/
├── README.md            (index of stories)
├── US-*.md             (standalone tiny stories)
├── backlog.md          (legacy backlog index)
├── epics/
│   ├── README.md       (epic navigation)
│   ├── E01-durable-layer/
│   │   └── US-002-rust-harness-cli/
│   │       ├── overview.md, design.md, execplan.md, validation.md
│   ├── E04-symphony-cli-prerequisites/
│   │   └── US-028..., US-029..., US-030..., US-031...
│   ├── E05-symphony-local-runner/
│   │   └── US-032..., US-033..., US-034..., US-035..., US-036..., US-037..., US-038..., US-039...
│   ├── E06-symphony-review-sync/
│   │   └── US-040..., US-041..., US-042..., US-043...
│   ├── E07-symphony-automation/
│   │   └── US-044..., US-045...
│   ├── E08-symphony-web-ui-controller/
│   │   └── US-047..., US-048..., US-049..., US-050..., US-051..., US-064..., US-065..., US-066..., US-067..., US-068..., US-070...
│   ├── E02-phase-2-observability-taxonomy/
│   │   └── phase-2-progress.md
│   └── E03-phase-5-evolution-infrastructure/
│       └── phase-5-progress.md
```

#### Story Format (per `docs/templates/story.md`)
- **Status:** planned | in_progress | implemented | changed | retired
- **Lane:** tiny | normal | high-risk
- **Product Contract:** Behavior description
- **Relevant Product Docs:** Links
- **Acceptance Criteria:** Checkbox list
- **Design Notes:** Commands, queries, API, tables, domain rules, UI surfaces
- **Validation:** Unit | Integration | E2E | Platform | Release (proof matrix cells)
- **Harness Delta:** Improvements proposed or made
- **Evidence:** Commands, reports, screenshots after validation

#### High-Risk Stories (E08-symphony-web-ui-controller/US-047-dependency-board-foundation/*)
Folder structure with:
- **overview.md:** Problem statement, context, scale
- **design.md:** Architecture, data flow, component interactions
- **execplan.md:** Step-by-step implementation sequence, risks, rollback
- **validation.md:** Proof structure (unit/integration/E2E/platform) with commands

### docs/TEMPLATES/ (4 files + 1 subfolder)

#### docs/templates/story.md
Standard template for story-sized work (see **Story Format** above).

#### docs/templates/decision.md
```markdown
# Decision: [NNNN-]<Title>

## Context
[What led to this decision]

## Decision
[What was chosen]

## Reasoning
[Why this trade-off was chosen]

## Alternatives considered
[What else was evaluated]

## Implications
[What this constrains or enables]
```

#### docs/templates/spec-intake.md
Template for turning raw product spec into intake note (type, lane, reason, candidate product docs, epics, validation shape).

#### docs/templates/validation-report.md
Template for proof summary after implementation.

#### docs/templates/high-risk-story/
Four-file breakdown for high-risk features:
- **overview.md:** Problem, context, scale, stakeholders, timeline
- **design.md:** Architecture, domain model, API shape, data flow, edge cases, accessibility, security
- **execplan.md:** Implementation phases, each phase's scope and proof, rollback strategy, risk matrix
- **validation.md:** Proof layers (unit, integration, E2E, platform, manual), commands to run, acceptance criteria per layer

---

## PLANS/ DIRECTORY

**Structure:**
```
plans/
└── reports/          (report outputs, read-only or generated)
```

**Current state:** Temporary reports directory only; no active phase plans stored yet. Plans are captured in PHASE2.md through PHASE5.md documents in root.

---

## HARNESS OPERATIONAL COMMANDS

The durable layer is accessed via `scripts/bin/harness-cli` (Rust binary, platform-specific).

**Common workflow (from HARNESS.md):**
```bash
scripts/bin/harness-cli init
scripts/bin/harness-cli intake --type <type> --summary <text> --lane <lane>
scripts/bin/harness-cli story add --id <id> --title <text> --lane <lane>
scripts/bin/harness-cli story update --id <id> --status <status>
scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 0
scripts/bin/harness-cli story verify <id>
scripts/bin/harness-cli story verify-all
scripts/bin/harness-cli decision add --id <id> --title <text> --doc docs/decisions/<file>.md
scripts/bin/harness-cli trace --summary <text> --outcome <outcome>
scripts/bin/harness-cli score-trace [--id <id>]
scripts/bin/harness-cli score-context <trace-id>
scripts/bin/harness-cli audit
scripts/bin/harness-cli propose
scripts/bin/harness-cli query matrix [--numeric]
scripts/bin/harness-cli query backlog [--open | --closed]
scripts/bin/harness-cli query tools --capability <name> --status present
scripts/bin/harness-cli query friction
scripts/bin/harness-cli query interventions
scripts/bin/harness-cli query stats
scripts/bin/harness-cli tool register --name <name> --kind <kind> --capability <capability> --command <cmd> --description <text> --responsibility <type>
scripts/bin/harness-cli tool check [--name <name>] [--json]
scripts/bin/harness-cli --version
```

---

## CROSS-DOCUMENT ARCHITECTURE

**Dependency graph:**

```
README.md (overview)
  ↓
AGENTS.md (agent entry point)
  ↓ imports
CLAUDE.md (Claude Code session bootstrap)
  ↓ references
docs/FEATURE_INTAKE.md (classification)
  ↓ defines lanes: tiny | normal | high-risk
  ↓
docs/HARNESS.md (operating model)
  ├─ defines Task Loop (steps 1-9)
  ├─ references docs/TRACE_SPEC.md (for trace tier per lane)
  ├─ references docs/CONTEXT_RULES.md (for phase-specific context)
  └─ references docs/ARCHITECTURE.md (for layering and boundaries)
  ↓
PHASE2.md, PHASE3.md, PHASE4.md, PHASE5.md (evolution roadmap)
  ├─ specify new docs/HARNESS_COMPONENTS.md, docs/HARNESS_MATURITY.md, docs/TRACE_SPEC.md, docs/CONTEXT_RULES.md
  └─ reference docs/GLOSSARY.md for term definitions
  ↓
docs/GLOSSARY.md (shared vocabulary)
docs/decisions/ (durable choices)
docs/stories/ (backlog + epics with high-risk folders)
docs/templates/ (reusable formats)
docs/demo/ (example walkthrough)
scripts/bin/harness-cli (Rust operational tool)
  ├─ manages harness.db (SQLite durable layer)
  └─ implements Phase 3/4/5 features (scoring, verification, proposals)
```

---

## KEY CONTRACTS AND RULES

### Intake Classification (FEATURE_INTAKE.md)
**MUST occur before code changes.**

Input types → Lane selection:
- 0-1 risk flags → tiny or normal
- 2-3 risk flags → normal + stronger validation
- 4+ flags → high-risk
- Hard gates (auth, authorization, data loss, audit, external provider, removing validation) → high-risk unless scope explicitly narrowed

### Task Loop (HARNESS.md, Section "Task Loop")
**MANDATORY steps for every task:**
1. Classify with FEATURE_INTAKE.md
2. Record classification with `scripts/bin/harness-cli intake`
3. Locate affected product docs and story files
4. Check proof status with `scripts/bin/harness-cli query matrix`
5. Work only inside selected lane
6. Ask whether product truth, validation expectations, architecture, patterns, or instructions changed
7. Record trace with `scripts/bin/harness-cli trace`, using docs/TRACE_SPEC.md for expected tier and depth
8. Review trace score; use `score-trace --id <id>` only when re-checking
9. If harness friction found, fix directly or record with `scripts/bin/harness-cli backlog add`

### Trace Quality Tiers (docs/TRACE_SPEC.md)
**Minimal (1):** task_summary ≥10 chars + outcome  
**Standard (2):** Minimal + actions_taken + files_read + files_changed + (errors OR harness_friction)  
**Detailed (3):** Standard + decisions_made + explicit errors + harness_friction + duration/token or note

Lane-to-tier requirement:
- Tiny → Minimal acceptable
- Normal → Standard required
- High-risk → Detailed required

### Growth Rule (HARNESS.md, Section "Growth Rule")
**"The harness grows from friction."**

When agent encounters confusion, repeats manual reasoning, needs new validation command, discovers missing rule, or sees recurring failure:
1. Improve harness directly, OR
2. Record friction with `scripts/bin/harness-cli backlog add --title "..." --pain "..."`

For improvements expected to change behavior/validation:
- At creation: fill `--predicted <impact>`
- At close: fill `--outcome <measured result>`

### Trace Friction Capture (HARNESS.md, Section "Task Loop" step 7)
```bash
scripts/bin/harness-cli trace --summary <text> --outcome <outcome> --harness-friction "<friction>"
```

Later query patterns: `scripts/bin/harness-cli query friction`.

### Tool Registry (TOOL_REGISTRY.md)
**Inbound tools optional; absent = clean skip.**

Registration per kind (cli, binary, mcp, skill, http):
```bash
scripts/bin/harness-cli tool register \
  --name <name> --kind <kind> --capability <capability> \
  --command <cmd> --description <text> --responsibility <type>
```

Presence check: `scripts/bin/harness-cli tool check [--json]`.

**Guarantee:** "Absent tool capability is a clean skip, never a failure."

### Story Verification (Phase 4 onward)
Stories may define `verify_command` (mechanical proof).
```bash
scripts/bin/harness-cli story add --id <id> --title <text> --verify "<command>"
scripts/bin/harness-cli story verify <id>           # Run single story
scripts/bin/harness-cli story verify-all             # Batch verify all
```

Pre-close gate: `trace --story <id>` warns if linked story verification has not passed.

### Backlog Outcome Loop (HARNESS.md, Section "Growth Rule")
1. Create backlog item with predicted impact:
   ```bash
   scripts/bin/harness-cli backlog add --title "..." --predicted "..."
   ```
2. Close item with actual outcome:
   ```bash
   scripts/bin/harness-cli backlog close --id <id> --outcome "..."
   ```
3. Review predicted vs actual:
   ```bash
   scripts/bin/harness-cli query backlog --closed
   ```

### Harness Delta Checklist (per HARNESS.md Task Loop step 6)
Before closing a task, ask whether any of these changed:
- Product truth (docs/product/*)
- Validation expectations (docs/TEST_MATRIX.md, story validation columns)
- Architecture rules (docs/ARCHITECTURE.md)
- Repeated failure patterns (docs/decisions/, HARNESS_BACKLOG.md)
- Next-agent instructions (AGENTS.md, docs/HARNESS.md, docs/CONTEXT_RULES.md)

If yes, update harness or record backlog item.

---

## SUMMARY STATISTICS

| Category | Count | Notes |
|----------|-------|-------|
| Root .md files | 7 | README, CLAUDE, AGENTS, CONTRIBUTING, CHANGELOG, PHASE2-5 |
| Docs/ root files | 17 | Entry-point + specification docs |
| Docs/decisions/ | 8 | Numbered durable decision records |
| Docs/demo/ | 1 | Example walkthrough |
| Docs/product/ | 2 | Product contract (empty placeholder + example) |
| Docs/stories/ | 22+ | Backlog + epics (E01-E08) + individual stories (US-001, US-008, etc.) |
| Docs/templates/ | 4 | story, decision, spec-intake, validation-report (+ high-risk-story/ subfolder with 4 files) |
| Plans/reports/ | (temp) | Report outputs only |
| **Total tracked docs** | **~119** | Excludes scripts/, crates/, config files |

---

## UNREAD FILES AND LIMITATIONS

**Could not exhaustively read all files due to scope and size:**
- `docs/stories/epics/E*/*.md` files beyond US-047 (full high-risk folder structure read, but not all story detail)
- `docs/reviews/` (review artifacts)
- `docs/design/` (design artifacts for Symphony Web UI)
- `scripts/` subdirectories (CLI implementation, schema files, installer scripts)
- `crates/` subdirectories (Rust implementation details)
- `.github/workflows/` (CI/CD automation)
- `.harness/` (changesets, run artifacts)

**These were intentionally scoped out per task:** "Do NOT read all. Report find/tree and identify patterns."

---

## KEY OBSERVATIONS

1. **Harness-first philosophy:** Policy and structure precede application code. No baked-in product spec; spec is input to decompose, not truth to extend.

2. **Separation of concerns:** 
   - Policy docs (markdown): how to work, what decisions were made, reusable templates
   - Durable layer (SQLite + Rust CLI): what happened, structured operational records
   - Product implementation: separate, to be provided by user

3. **Maturity-driven evolution:** H0 → H5 progression clearly mapped, with benchmark validation at each phase. Each phase adds capability without breaking prior phases.

4. **Lane-based risk triage:** Tiny/normal/high-risk classification determines upfront scope, proof depth, approval gates, and documentation burden. Automatic via risk checklist.

5. **Friction-driven growth:** Harness improves from observation of agent/human friction, with predicted-impact ↔ actual-outcome feedback loop to measure effectiveness.

6. **Reusability:** Repo is deliberately generic, no project-specific implementation. Designed to bootstrap any future product spec with the same workflow.

7. **Tool extensibility:** Inbound tool registry allows projects to equip optional capabilities (linters, code graph, deploy checks, MCP servers) without harness depending on them.

8. **Audit and proposal machinery:** Phase 5 adds self-examination (audit entropy score, context scoring, improvement proposals) to turn friction patterns into actionable backlog items.

---

Status: **DONE**  
**Written:** `/home/vantt/projects/forgent/plans/reports/ref-scan-inventory-260713-1224-harness-docs-report.md`

