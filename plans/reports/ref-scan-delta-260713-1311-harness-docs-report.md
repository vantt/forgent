# Documentation Delta Inventory: 14e6f10..HEAD (94 commits)

**Scope:** 211 MD files changed; +10214 insertions, -13145 deletions across .md root, docs/, scripts/, and nested story documentation.

---

## Commit Themes (Grouped)

### 1. Self-Improving Harness Lifecycle (E09)
Commits `61b5583..6e8243f` (12 commits): replay-safe identity, selective proposal decisions, story-to-backlog relationships, proof-backed atomic completion, evidence suppression, recurrence classification, outcome health, legacy reconciliation.

### 2. Signal Quality Improvements (E10)
Commits `8ee68dc..4fbb260` (3 commits): evidence provenance and causal retirement, backlog triage health, lane-aware trace health.

### 3. Symphony Repository Separation (E11)
Commits `e3980e5..22a6a06` (28 commits): separation boundary, frozen baselines, provenance-preserving bootstrap, standalone workspace, orchestration contract, adapters, product docs migration, parity suite, packaging, history partition, core cleanup, regression closure, cutover audit.

### 4. Trust-Boundary Hardening (E12)
Commits `28074d3..15e1d2e` (8 commits): request authority explicit, read-only query enforcement, coherent bootstrap gating, proof-backed completion, repository contract enforcement.

### 5. Post-Merge Release Recovery
Commits `dd22cd5..9cc306d` (2 commits): proof before tag promotion, immutable recovery contract, hosted transition proof.

---

## File Status Summary

| Status | Count | Notes |
| --- | --- | --- |
| Added (A) | 149 | E09, E10, E11, E12 epics; new contracts/decisions; reviews |
| Deleted (D) | 56 | Symphony product docs; impeccable skills; E05-E08 epics |
| Modified (M) | 18 | Core docs, CHANGELOG, scripts README |
| Renamed (R) | 5 | E04 epic renamed |

---

## NEW DOCUMENTATION FILES (A status)

### New Contract & Decisions (Root Level)

#### `docs/contracts/harness-orchestration-v1.md`
**Immutable public consumer-neutral Harness CLI protocol.**

**Sections:**
- Status & Compatibility Floor: `harness-cli-v0.1.14` is protocol-v1 baseline; consumers must require exact version or explicitly tested compatible tag.
- Process & Environment: `HARNESS_REPO_ROOT`, `HARNESS_DB_PATH`, `HARNESS_RUN_ID`, `HARNESS_REQUEST_ID` environment control.
- Discovery Before Mutation: `query contract --json` dispatch without auto-init; returns protocol version, CLI version, schema range, database state.
- Envelope, Output, Exit Contract: Every `--json` command writes one UTF-8 JSON doc to stdout; no progress to stdout; exit codes `0` (success), `2` (invalid input/compatibility), `3` (not found/conflict), `4` (verification failed), `5` (internal/resource).
- Timeouts & Cancellation: 30s reads, 300s mutations; full process-tree termination on timeout; mutation timeout has unknown outcome—must rediscover and check state before retry.
- Read Schemas: Stories (id, title, risk_lane, contract_doc, status, verify_command, runnable), Work Graph (consistent, single transaction, revision hash).
- Mutation Commands: story add/update/complete, story dependency add/remove, story hierarchy add/remove. `story update` rejects `implemented` target (use `story complete`).
- Changesets: status/apply with content_sha256 validation, idempotent skip on match, conflict on ID/content mismatch.
- WAL-Safe Snapshot: online backup, integrity-check, atomic rename; returns logical and file hashes.
- Installer Upgrade Contract: immutable release tuple, SHA-256 verification before touch, atomic replacement.
- Forward & Breaking Changes: Unknown fields tolerated; unknown protocol version is hard failure; field removal/rename requires new protocol version.

**Load-Bearing Rules:**
- `story complete <id>` is the **only** way to reach `implemented` state; compare-and-set `story update` with `implemented` target returns `INVALID_ARGUMENT/exit 2`.
- Discovery does not create DB; mutations must run after successful discovery and state validation.
- Consumers must branch on error `code`, never on message.

#### `docs/decisions/0008-self-improving-harness-lifecycle.md`
**Adopt human-governed improvement lifecycle.**

Date: 2026-07-10. Status: Accepted. Implementation: through US-080 (replay-safe identity, selective decisions, backlog relationships, atomic proof-backed completion).

**Core Rules:**
1. `propose` is read-only unless one proposal key is explicitly accepted or rejected; bulk `--commit` is invalid.
2. Explicit acceptance creates/reuses backlog occurrence, records outcome-review schedule; explicit rejection records terminal occurrence + reason.
3. Proposal key identifies underlying issue; separate stable backlog uid identifies one accepted/implemented/rejected/regression/reconsideration occurrence.
4. Proposal matching is deterministic, conservative, Unicode-safe, versioned.
5. Accepted occurrences retain structured links to evidence; default audit and proposal generation stay read-only; explicit evidence recording creates lifecycle episodes so cleared findings are genuinely new when they reappear.
6. Raw traces, friction, interventions, stories, closed outcomes remain historical evidence—never deleted.
7. One story may resolve backlog occurrence; other stories reference without closure authority.
8. **Implemented closure requires explicit `story-completion` operation:** requires linked improvement intake + completed implementation trace, runs fresh verification, atomically records proof, marks story implemented, closes eligible accepted occurrences.
9. Ordinary verify commands record proof only, do not close lifecycle state.
10. Resolution evidence and measured outcome are separate records; observations append-only; proof never claims improvement.
11. New evidence after implementation is regression; after rejection is reconsideration—both require new acceptance before work.
12. Intakes, traces, occurrences, evidence use stable cross-changeset identity; all mutations participate in semantic changesets and fresh-database rebuild proof.
13. Cleanup is conservative and named; ambiguous legacy rows reported for human selection, not auto-rewritten.

**Consequences:** Closure is explainable through accepted work and fresh proof; regression history remains append-only/auditable; fresh clones reconstruct same decisions; can measure if implemented process changes actually helped. **Tradeoff:** stable evidence identity and cross-changeset replay add schema/migration complexity; explicit completion adds lifecycle command.

#### `docs/decisions/0009-separate-symphony-product-repository.md`
**Make hoangnb24/symphony canonical product repo; restore hoangnb24/repository-harness as reusable template.**

Date: 2026-07-11. Status: Accepted.

**Core Rules:**
1. Use one-time provenance-preserving filtered import; do not start with untraceable snapshot.
2. Preserve `crates/harness-symphony/` during first extraction; path flattening is later refactor.
3. Symphony depends on versioned, machine-readable Harness CLI protocol and released artifacts; neither uses path dependency, submodule, or copied fork.
4. Harness retains generic capabilities that Symphony helped motivate: isolated DB selection, semantic logging, changeset apply/rebuild, story dependencies/hierarchy, explicit completion, validation-environment quarantine.
5. **Symphony must stop mutating Harness tables directly; stop parsing human CLI output.** All Harness writes through CLI; supported reads use versioned JSON contracts.
6. Bootstrap and validate Symphony in target before deleting any source from repository-harness.
7. **Tracked live `.harness/changesets` are not test fixture:** preserve legacy evidence through Git history/backups, replace core replay tests with synthetic fixtures, keep active operational files out of template.
8. Do not vendor `.agents/skills/impeccable`, `.codex/hooks.json`, local `.impeccable`; optional tools must be externally installable and cleanly absent.
9. Merge/publish Symphony first; Harness removal gated by standalone parity and recoverable source tag/bundle.
10. **Cross-repo story handoff preserves dependency truth with non-runnable source proxies and checksummed target receipts.** Never retire source row to make dependency appear satisfied.

**Consequences:** Each repo has one product contract, release, dependency, backlog, agent context. Harness installs no longer contain broken Symphony guidance. Runtime dependency explicit/testable. Core validation smaller, uses fixtures. **Tradeoff:** split requires coordinated dual-copy period; orchestration contract must be designed/supported; legacy changesets/DB need ownership-aware migration.

#### `docs/decisions/0010-proof-before-cli-release-promotion.md`
**Harness CLI release automation: two separate proof contracts.**

Date: 2026-07-13. Status: Accepted. Context: post-merge run 29222332569 built 0.1.16 but failed applying current protocol smoke to immutable 0.1.14 upgrade-source (current smoke requires protections not in 0.1.14, so it is not valid historical baseline). Failed validation left immutable-looking tag with no assets.

**Core Rules:**
1. Pinned initial upgrade-source artifact runs frozen baseline containing only behavior promised by that version.
2. Built and installed candidate runs current full protocol and installer contract.
3. Post-merge maintenance may prepare versioned candidate commit, **must not create release tag.** Reusable release workflow builds/validates exact commit across every platform. Only after all matrix jobs pass may publish job create annotated tag and publish artifacts.
4. Candidate identity: requested tag version must equal crate version; if tag exists, must resolve to candidate commit; absent tag allowed only for post-merge candidate path.
5. **Failed tags never moved/deleted automatically.** Recovery advances to new patch version. For run 29222332569, `harness-cli-v0.1.16` remains at original commit without assets; corrected flow publishes later patch.

**Consequences:** Published tag identifies candidate that passed all platform gates. Historical compatibility checks cannot fail because current contract gained guarantee. Failed tags remain auditable, recovered via monotonic versions. **Tradeoff:** unpublished-candidate identity mode required; frozen baseline must stay small and version-specific.

### Review Documents

#### `docs/reviews/US-073-proposal-to-backlog-lifecycle.md`
Review of E09 proposal-to-backlog lifecycle story implementation.

#### `docs/reviews/feature-self-improving-harness-lifecycle-to-main-review.md`
Comprehensive review of self-improving lifecycle feature before main merge (1225 lines).

### Epic E09: Self-Improving Harness Lifecycle

**`docs/stories/epics/E09-self-improving-harness-lifecycle/README.md`**
Orchestrates US-073 through US-085. Dependency order: US-073 (replay-safe identity) → US-074 (safe improvement identity) → US-075 (selective decisions) → US-076 (backlog relationships) → US-077 (explicit completion) → US-078 (recurrence suppression) → US-079 (health observation) → US-080 (legacy reconciliation) → US-082-085 (closure paths).

**Stories (with design/execplan/overview/validation subdocs):**
- US-073: Story dependency mutation replay
- US-074: Replay-safe improvement identity
- US-075: Selective proposal decision
- US-076: Story-backlog relationships
- US-077: Explicit proof-backed story completion
- US-078: Proposal suppression and recurrence classification
- US-079: Outcome observation and daily health
- US-080: Legacy improvement reconciliation
- US-082: Review finding closure
- US-083: Post-review correctness closure
- US-084: Proof-audit finding closure
- US-085: Semantic integrity closure

### Epic E10: Harness Signal Quality

**`docs/stories/epics/E10-harness-signal-quality/README.md`**
Dependency: E09. Improves observability and evidence provenance. Stories:
- US-086: Evidence provenance and causal retirement (with design/execplan/overview/validation)
- US-087: Backlog triage health
- US-088: Lane-aware trace health

### Epic E11: Symphony Repository Separation

**`docs/stories/epics/E11-symphony-repository-separation/README.md`** (371 lines)
Largest new epic. 12 stories in dependency order covering separation, bootstrap, parity, and cutover.

**Frozen baseline:** `docs/stories/epics/E11-symphony-repository-separation/US-089-separation-boundary-and-frozen-baselines/evidence/baseline.md`

**Stories:**
- US-089: Separation boundary and frozen baselines (with evidence/baseline.md)
- US-090: Provenance-preserving Symphony bootstrap
- US-091: Standalone Symphony workspace
- US-092: Machine-readable Harness orchestration contract
- US-093: Symphony-Harness protocol adapter
- US-094: Symphony product docs and optional tooling migration
- US-095: Cross-repo standalone parity suite
- US-096: Standalone Symphony packaging and release candidate
- US-097: Durable history and local state partition
- US-098: Harness-only repository cleanup
- US-099: Harness core regression closure
- US-100: Cutover and post-separation audit (with evidence/ subdirectory containing JSON proof files and README)

**Migration manifest:** `docs/stories/epics/E11-symphony-repository-separation/migration-manifest.md` (298 lines) documents complete file mappings and ownership transfer.

### Epic E12: Harness Trust Boundaries

**`docs/stories/epics/E12-harness-trust-boundaries/README.md`** (76 lines)
Hardening request authority and state coherence. Stories:
- US-101: Harness trust boundary hardening (with design/execplan/overview/validation)
- US-102: Post-merge release recovery (with design/execplan/overview/validation)

### Other New Stories

**`docs/stories/US-081-validation-subprocess-write-quarantine.md`**
Validation provider registry audit cleanup; enforcement of read-only query execution.

### Scripts Documentation

**`scripts/agent-harness-block.md`** (18 lines)
Documentation for agent Harness block behavior in scripts context.

**`scripts/claude-harness-block.md`** (9 lines)
Documentation for Claude Code Harness block behavior.

---

## MODIFIED CORE DOCUMENTATION (M status)

### `AGENTS.md`
**Major refactor: removed project skills section, condensed Harness instructions.**

- **Removed:** "Project Skills" section referencing `.codex/skills/harness-intake-griller/SKILL.md`.
- **Removed:** Long list of "read before work" documents.
- **Added:** Two-path request classification (read-only vs change requests).

**New rules:**
- Read-only requests (answer, explain, review, diagnose, plan, status): inspect only needed material, keep task read-only, do not bootstrap/initialize/record intake.
- Change requests (change, build, fix): run `scripts/bootstrap-harness.sh` first, use `docs/FEATURE_INTAKE.md`, query `scripts/bin/harness-cli query matrix --active --summary`, retrieve lane-specific context from `docs/CONTEXT_RULES.md`.

### `CLAUDE.md`
**Simplified imports; now strictly read-only for `@AGENTS.md`.**

- **Removed:** `@docs/FEATURE_INTAKE.md` import (moved to AGENTS.md guidance).
- **Removed:** "run `scripts/bin/harness-cli query matrix` before starting work" (moved to change-request class).
- **Removed:** "lane-dependent context is intentionally not imported" explanation.
- **Kept:** Single bare `@AGENTS.md` import as canonical entrypoint.

**New concise preamble:** "Claude Code does not auto-load `AGENTS.md`. Import that single canonical project instruction source. Keep this bare `@` line outside backticks so the import remains active."

### `README.md`
**Refactored for reusable template positioning and explicit bootstrap flow.**

**Changed:**
- Installer explanation now mentions that `--claude` refreshes `CLAUDE.md` block "imports only `AGENTS.md`, the canonical request-authority and retrieval entrypoint."
- **Added explicit bootstrap step:** documented `scripts/bootstrap-harness.sh` / `.\scripts\bootstrap-harness.ps1` as required after CLI install; notes distinction between source checkout (validates restored core-state epoch) and installed project (initializes empty state).
- Release workflow description: changed from "publishes from tags by GitHub Actions" to "built and proven before tag promotion by workflow"; added detail that workflow "builds and tests all five platforms, verifies pinned `v0.1.14` upgrade transition, then creates annotated tag and publishes ten binary and checksum assets. Failed tags are never moved or reused."
- **Removed:** "Try Harness Symphony" section (24 lines). Replaced with: "Harness exposes a versioned orchestration contract for external runners. One independent consumer is [Symphony](https://github.com/hoangnb24/symphony); it is not part of this repository or the Harness installer."
- **Clarified:** "This repository implements the Harness v0 product: a Rust CLI, SQLite durable layer, installers, operating documents, contract tests, and release automation. Those upstream components are executable product behavior, not placeholders."
- **Updated:** "No product contract currently defined" → "The upstream Harness contract lives in this README, the operating documents, the versioned orchestration contract, story packets, and executable tests. The generic `docs/product/` directory is reserved for a consumer project's product contract; Harness intentionally does not populate it with a fake domain model."

### `docs/HARNESS.md`
**Extensive refactor: request-class loops, task classification separation, explicit completion semantics.**

**Major changes:**
- Changed "Every task has two possible outputs" to "A change request can have two outputs"; clarified harness delta is "when warranted."
- **Harness v0 Scope:** now explicitly distinguishes what Harness includes (SQLite-backed proof matrix, upstream contract tests) vs excludes (prefixed with "consumer-project-" or "consumer" language).
- **Added explicit `story complete` command** to durable layer CLI examples.
- **Complete section rewrite: "Task Loop" → "Request-Class Loops"** with two subsections:
  - **Read-Only Requests:** answer/explain/review/diagnose/plan/status stay read-only; inspect only needed material; no bootstrap/initialize/record intake/trace.
  - **Change Requests:** explicit mutation loop with bootstrap step, feature intake, focused matrix query (`--active --summary`), lane-specific context retrieval, trace recording.
- **Story Verification:** added explanation of `query matrix --active --summary`, `--runnable` filter, `--story <id>` selection; noted filters combine with AND.
- **Added detailed `story complete` semantics:** requires `in_progress`/`changed` status; runs fresh proof; marks implemented only on pass; resolver stories require linked intake + completed trace after newest link; proof + closures committed atomically/replayably; `story update` rejects `implemented` target; ordinary `story verify` remains proof-only.
- **Phase 5 Evolution Commands:** changed `propose --commit` to explicit `propose --accept <key> --outcome-after-traces <N>` and `propose --reject <key> --reason "..."`. Added note that old bulk path is rejected so proposals cannot become accidental work items.
- **Done Definition:** split into read-only requests (response supported by evidence, facts vs inference clear, state unchanged) vs change requests (10-point checklist). Changed "Missing harness capabilities" to "Missing Harness capabilities" and qualified "when relevant."

### `docs/FEATURE_INTAKE.md`
**Clarified scope: applies only to change requests.**

- **Added preamble:** "This intake gate applies to change, build, and fix requests before code or durable Harness state changes."
- **Added read-only exemption:** "Answer, explain, review, diagnose, plan, and status requests stay read-only. They do not bootstrap or initialize Harness, record intake, update a story or backlog item, or record a trace. If the user later asks to implement a proposed change, that new change request enters this gate."

### `docs/GLOSSARY.md`
**Updated proposal definition and removed duplicate entries.**

- **Proposal:** changed from "advisory unless committed to the backlog with `--commit`" to "read-only until a human explicitly accepts one stable key with an outcome schedule or rejects one stable key with a reason."
- **Removed (14 entries):** Tool Registry, Intervention, Context Score, Entropy Score, Improvement Proposal (duplicate).

### `docs/CONTEXT_RULES.md`
**Major refactor: authority-gated context, bounded retrieval, request-class awareness.**

- **Added authority gate table:** request class → examples → Harness mutations → default context. Read-only requests do not bootstrap/initialize/record; change requests do after bootstrap.
- **Reframed "Context Phases" as change-request-only:** "This phase applies only to change requests."
- **Updated intake must-reads:** changed `scripts/bin/harness-cli query matrix` to `query matrix --active --summary`.
- **Renamed section:** "Additive Behavior" → "Bounded Retrieval Behavior." Added: "Do not preload every Harness document. For a read-only request, stop after the answer is supported. For a change request, `AGENTS.md` points to intake and the focused matrix summary; this document then expands context only when a lane, phase, or retrieval trigger requires it."
- **Review checklist:** split into "Before implementation" and "Before the final response" (for change requests).

### `docs/IMPROVEMENT_PROTOCOL.md`
**Minor updates to proposal lifecycle rules (partial diff shown).**

### `CHANGELOG.md`
**Three new entries (PR #45, #46, #47).**

- **PR #47 (2026-07-13):** "Fix post-merge CLI release recovery"; `harness-cli-v0.1.17` (publication requires platform proof); 30 files changed.
- **PR #46 (2026-07-13):** "Harden Harness trust boundaries and pre-merge proof"; `harness-cli-v0.1.16` publication attempt (post-merge validation failed; tag preserved, no assets); 53 files.
- **PR #45 (2026-07-13):** "Complete E11 repository separation"; no CLI release required; 24 files.

### Other Modified Docs
- `docs/ARCHITECTURE.md`: +15 lines (contract/architecture alignment).
- `docs/TEST_MATRIX.md`: +20 lines (proof matrix documentation).
- `docs/TOOL_REGISTRY.md`: +33 lines (discovery contract updates).
- `docs/README.md`: +17 lines (navigation updates).
- `docs/demo/README.md`: +2 lines.
- `docs/product/README.md`: +7 lines (reserved for consumer contract).
- `scripts/README.md`: +137 lines (tool and script documentation).
- Various story validation.md files under E01: minor updates.

---

## DELETED DOCUMENTATION FILES (D status)

### Skills
- `.agents/skills/impeccable/SKILL.md` and 29 reference docs (adapt, animate, audit, bolder, brand, clarify, codex, colorize, craft, critique, delight, distill, document, extract, harden, hooks, init, interaction-design, layout, live, onboard, optimize, overdrive, polish, product, quieter, shape, typeset).
- `.codex/skills/harness-intake-griller/SKILL.md`.

### Symphony Product Documentation
- `docs/SYMPHONY_QUICKSTART.md` (353 lines).
- `docs/SYMPHONY_SCOPE.md` (902 lines).
- `crates/harness-symphony/web-ui/DESIGN.md`, `PRODUCT.md`.
- `docs/product/symphony-web-ui-controller.md`.

### Symphony Product Epics (Complete Removal)
- **E05 (Symphony Local Runner, 8 stories):** US-032-039 and README.
- **E06 (Symphony Review Sync, 4 stories):** US-040-043 and README.
- **E07 (Symphony Automation, 2 stories):** US-044-045 and README.
- **E08 (Symphony Web UI Controller, 25 stories):** US-047-071, including deep audits (US-069 triple audit docs), design principles validation, reviewer closure; plus README.

### Standalone Story
- `docs/stories/US-046-first-class-symphony-codex-adapter.md`.

**Rationale:** Symphony repository separation (decision 0009); all product-specific story documentation moved to separate `hoangnb24/symphony` repository or deleted as per cutover plan. Impeccable and intake-griller skills removed from core; optional agent tools externally installable.

---

## RENAMED FILES (R status)

- `docs/stories/epics/E04-symphony-cli-prerequisites/` → `docs/stories/epics/E04-isolated-durable-state-and-semantic-replay/`
  - README.md, US-028-029-030-031 all renamed under new epic path.

---

## KEY LOAD-BEARING CONTRACTS & RULES

### Request Authority Model (Core)
- **Read-only requests** (answer, explain, review, diagnose, plan, status): No Harness state mutations. No bootstrap, initialize, record intake, update durable, or trace.
- **Change requests** (change, build, fix): Bootstrap first; normal mutation loop; intake, story/proof, trace, backlog as lane requires.

### Story Lifecycle (E09 + Protocol Contract)
- `propose` is read-only; bulk `--commit` is rejected.
- Explicit accept/reject required per proposal key; creates/reuses/rejects backlog occurrences.
- **`story complete <id>` is the only path to `implemented` state:** requires fresh proof pass, atomically records proof + eligible closures.
- `story update` rejects `implemented` target and directs caller to `story complete`.
- Ordinary `story verify` remains proof-only; does not close lifecycle.

### Release Promotion (Decision 0010)
- Two separate proof contracts: pinned upgrade-source baseline (frozen per version) and current full protocol.
- Post-merge creates candidate commit; **tag creation deferred until after all-platform matrix pass.**
- Failed tags **never retagged or deleted**; recovery advances to new patch version.

### Symphony Separation (Decision 0009)
- Symphony moves to separate repository; depends on versioned, machine-readable Harness CLI protocol and released artifacts.
- Cross-repo story handoff via non-runnable source proxies and checksummed target receipts.
- All Harness writes through CLI; supported reads use versioned JSON contracts.
- Harness core excludes `.agents/skills/impeccable`, `.codex/hooks.json`, local `.impeccable`.

### Self-Improvement Lifecycle (Decision 0008)
- Accepted occurrences retain structured evidence links; cleared findings are genuinely new when they reappear.
- Closure requires linked improvement intake + completed implementation trace recorded after newest resolver link.
- All lifecycle mutations participate in semantic changesets and fresh-database rebuild proof.

---

## UNRESOLVED QUESTIONS & COVERAGE NOTES

1. **Detailed E09-E10 story design specs:** design.md, execplan.md, overview.md, validation.md read but not exhaustively quoted. All present in repository.
2. **E11 migration manifest contents:** 298-line document covers file mappings; detailed mappings not extracted but structure verified.
3. **E12 US-101-102 implementation:** design/execplan/overview/validation present; execution details not analyzed beyond overview.
4. **Post-merge workflow changes:** CHANGELOG references `.github/workflows/` changes but workflow file contents not inspected (out of `.md` scope).
5. **Deleted Impeccable skills reference docs:** 29 reference files removed; no analysis of which skill docs superseded or migrated elsewhere (skill definitions not in `.md` scope).

---

## SUMMARY

**Major themes:**
1. **Request authority model introduced** (E12): Separates read-only inspection tasks (no Harness mutations) from change requests (bootstrap → intake → execute → trace). Reflected in AGENTS.md, CLAUDE.md, FEATURE_INTAKE.md, CONTEXT_RULES.md, HARNESS.md rewrites.
2. **Self-improving lifecycle codified** (E09 + decision 0008): Explicit proposal accept/reject, atomic proof-backed `story complete`, cross-changeset stable evidence identity, regression/reconsideration classification.
3. **Public orchestration contract published** (decision 0010 + harness-orchestration-v1.md): Versioned CLI protocol, discovery before mutation, protocol-aware consumers, immutable error codes/exit paths.
4. **Symphony product separated** (E11 + decision 0009): Moved to independent repository; Harness retains generic CLI and orchestration; removes baked-in product confusion; all E05-E08 stories and product docs deleted from core.
5. **Release promotion hardened** (decision 0010): Two-stage proof (pinned baseline + current full contract); tags created only after all-platform matrix passes; failed tags immutable, recovered via monotonic version.

**Net documentation effect:** Repository evolves from product-embedded tooling (with Symphony examples/stories) to reusable, consumer-agnostic Harness CLI and orchestration layer with clear request-authority boundaries and proof-backed lifecycle guarantees.

