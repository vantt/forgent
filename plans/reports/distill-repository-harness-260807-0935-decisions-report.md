---
name: distill-repository-harness-260807-0935-decisions
description: Mechanical inventory of repository-harness decisions 0019-0023
metadata:
  type: reference
  scope: upstream-learning
  indexed_commit: 9cc306d
  prior_cursor: 14e6f10
---

# Repository-Harness Decisions Inventory (0019–0023)

Reference-learning index snapshot for upstream repository-harness, commits 14e6f10 → 9cc306d.

## 0019 Repository-Centered Default Workflow

**Problem:** Prior Harness default required agents to bootstrap SQLite control plane, record intake, retrieve durable proof matrix, create/update story state, record manual trace, optionally score context/audit entropy/create proposals. This machinery prioritized proving the bookkeeping itself over product behavior. Manual traces and context scores primarily evaluated agent-provided descriptions; verification status showed configured commands passed without proving requested product behavior.

**Decision:** Harness adopts repository-centered default workflow: AGENTS.md remains small map; bounded work uses ephemeral plan with no CLI mutation; complex/multi-session/dependency-sensitive work uses Git-native execution plan under docs/plans/active/; durable memory/judgment/validation are independent decisions; agents pause when product intent ambiguous/action difficult to recover/validation weakened/authority required; completion supported by executable/observable evidence not Harness rows/flags/traces; lasting decisions remain Git-native documents/task-local choices in execution plan; legacy capabilities remain compatible Phase 1 but removed from default; existing state preserved (no destructive migration); fresh installs adopt new default.

**Consequence:** Bounded work moves directly from repository context to implementation with real proof; human attention shifts from process compliance to application legibility/mechanical constraints/observable outcomes; complex work retains durable progress without parallel story/trace/database records.

**Path:** /home/vantt/projects/forgentX/upstreams/repository-harness/docs/decisions/0019-repository-centered-default-workflow.md

---

## 0020 Installation Profiles And Knowledge Boundaries

**Problem:** Decision 0019 made repository-centered workflow authoritative but installer still physically distributed SQLite lifecycle, historical documents, upstream Harness product material, schemas, bootstrap scripts, CLI binary to every consumer, creating conflicting signals. Root README described upstream repository, not consumer application. CLI and SQLite had real compatibility users; removing them would break external orchestration.

**Decision:** Harness has exactly two installation profiles: (1) Core (default) installs compact repository map, repository-centered workflow, generic product/planning/decision structure, required templates; (2) Core plus CLI (explicit --with-cli/-WithCli flag) adds complete compatibility surface (lifecycle/protocol docs, bootstrap scripts, schemas, migrations, database/binary ignore rules, release metadata, checksum-verified binary). CLI bundle is atomic at observable boundary—static compatibility files staged before replacement, failed binary download/checksum leaves prior bundle/binary untouched. Ordinary core install never downloads CLI, creates database ignore rules, removes executable, deletes database. Artifacts classified core/compatibility/upstream-only/historical; default docs link only through core; compatibility/historical remain deliberately reachable upstream but do not compete with installed workflow.

**Consequence:** Fresh default install has one clear authority path with no control-plane runtime; consumers opt into one complete compatibility contract rather than assembling dependencies; upstream implementation remains available without becoming consumer truth; existing binaries/databases survive ordinary core refreshes.

**Path:** /home/vantt/projects/forgentX/upstreams/repository-harness/docs/decisions/0020-installation-profiles-and-knowledge-boundaries.md

---

## 0021 Consumer-First Application Legibility Phase

**Problem:** Decisions 0019–0020 removed SQLite lifecycle from ordinary work and reduced default install to ten-file core. OpenAI's harness engineering describes autonomy as end-to-end application loop requiring repository-specific structure/tooling. First real consumer checkpoint (e-inna-brain rate-limit task) showed fresh agent discovered product/deployment truth without human navigation, but never started application, created deterministic state, called interface, retrieved logs, implemented behavior, exercised focused test, verified HTTP before/after.

**Decision:** Phase 3 is narrow, evidence-producing, consumer-first application-legibility phase (not generic observability framework). Evaluates one real task through target loop: discover execution → start isolated worktree-local instance → create deterministic scenario state → reproduce through real interface → inspect runtime evidence → implement bounded change → run focused executable proof → verify through interface → stop/clean. Phase may stop earlier when repository authority missing (valid evidence of exercised capabilities, not implied success for later steps). E-inna checkpoint proves compact core works without CLI/SQLite ceremony, fresh agent discovers relevant truth, compact repository rule converts speculative-policy failure into human-judgment stop. Does not prove simultaneous isolated runtimes, deterministic seeding/reset, interface reproduction, log/signal retrieval, implementation/proof, interface verification, cleanup/recovery. Most improvements belong in consumer application; repository-harness receives only patterns proven to reduce human intervention. Durable evidence is Git-native (execution plan/report, app diffs, test output, runtime observations, interface evidence).

**Consequence:** Phase 3 claims bounded by observed application behavior; completed e-inna checkpoint retained rather than overstated; human judgment is explicit boundary while routine navigation remains automation target; runtime tooling grows from consumer evidence.

**Path:** /home/vantt/projects/forgentX/upstreams/repository-harness/docs/decisions/0021-consumer-first-application-legibility-phase.md

---

## 0022 Control-Plane Freeze And Compatibility Runway

**Problem:** Decisions 0019–0021 moved ordinary work to repository-native evidence. Default install no longer contains Rust CLI or SQLite lifecycle, but source maintains writable upstream database with planned stories, proposed backlog, manual traces, interventions, decision rows absent from Git-native indexes. That history is valuable and irreversible to mutate. Immediate write shutdown would break external orchestration consumers who explicitly selected that published protocol and need migration.

**Decision:** Phase 4 freezes SQLite control plane through staged compatibility-first runway: (1) Current repository authority from Git-native documents/architecture/plans/decisions/code/tests/CI/runtime—SQLite row status does not reactivate work absent from those surfaces; (2) Existing databases/snapshots/changesets/schemas/historical rows remain readable/reconstructable—no rewrite/deletion; (3) Intake/trace/intervention/backlog/proposal/tool-registry/decision-row/story lifecycle mutations are legacy writes, not used for new upstream work; (4) Read-only queries, initialization/migration, integrity/rebuild, protocol-v1 orchestration remain supported; (5) Human-oriented legacy lifecycle mutation targeting upstream default database rejected without --compatibility-write flag; (6) Machine JSON operations, isolated fixtures, explicit paths, installed consumers, read operations, maintenance unchanged; (7) Direct consumer inventory recorded in phase-4-write-consumer-inventory.md proves protocol-v1/CLI consumers still required—schema removal/deletion outside Phase 4 boundary; (8) Old Phase 4 mechanical-verification roadmap is compatibility history. Staged sequence: repository-centered already active → warn on new upstream legacy writes → inventory real compatibility consumers/mutations → export authority to Git-native → require explicit compatibility intent → freeze obsolete writes → retain while supported consumers exist.

**Consequence:** New upstream work has one inspectable Git-native authority path; existing data remains recoverable/queryable; source receives immediate signal when extending superseded lifecycle; external orchestration retains published behavior during runway; later deletion based on observed usage not assumption.

**Path:** /home/vantt/projects/forgentX/upstreams/repository-harness/docs/decisions/0022-control-plane-freeze-and-compatibility-runway.md

---

## 0023 Optional Consumer Ownership

**Problem:** Repository-centered core no longer requires CLI or SQLite lifecycle. Optional compatibility profile exposes versioned machine protocol (work-graph reads, atomic CAS story updates, isolated snapshots, semantic logging, transactional changesets) used by independently released Symphony product. Repository separation completed physical move (Symphony owns runner/worktrees/selection/run state/adapter/PR-review-sync/UI/evidence); Harness needs to distinguish orchestration policy from generic integrity primitives. Atomic CAS/changeset in Symphony would make consumer responsible for storage invariants. Test scripts under tests/evals/ exercise default workflow/task authority—core regression tests not evaluations—location obscures extension boundary.

**Decision:** Phase 5 separates optional consumers by ownership: (1) repository-harness core owns repository map, Git-native knowledge/plans, decision boundaries, mechanical repository checks; (2) optional CLI owns generic storage-integrity/compatibility primitives while protocol v1 supported (discovery, consistent work-graph reads, isolated snapshots, atomic CAS, semantic logging, changeset application, replay, recovery); (3) hoangnb24/symphony owns orchestration policy (work selection, polling, worktrees, run lifecycle, timeouts, retry/conflict handling, changeset coordination, PR-review-sync, UI, Symphony evidence); (4) consumer applications own application-specific runtime commands, logs, metrics, reproduction fixtures, browser/CLI interaction, end-to-end proof—Harness does not ship generic observability adapters; (5) trace-scoring/context-scoring/benchmark/audit/proposal remains legacy compatibility/history—not installed by core, not ordinary-work evaluation requirement; (6) repository workflow/task-authority scripts classified as core workflow regression tests, not evaluations; (7) fresh core contains no orchestration contract, Symphony runtime, CLI/database lifecycle, trace/scoring, benchmark, evaluation payload; (8) protocol-v1 primitives not removed during Phase 5—removal requires later versioned migration with consumer proof/recovery window. Dependency direction: ordinary repository → Harness core files only; explicit orchestration user → Symphony orchestration policy → optional Harness protocol primitives → target repository state; application evaluation → real application, CI, PR, logs, metrics, interface evidence (not mandatory Harness traces).

**Consequence:** Default Harness install remains small with no orchestration/evaluation control plane; Symphony evolves scheduling, retries, run artifacts, UI, PR behavior on own release cycle; Harness retains atomic guarantees needed by every compatible consumer; evaluation uses evidence produced by real work rather than mandatory self-reported traces.

**Path:** /home/vantt/projects/forgentX/upstreams/repository-harness/docs/decisions/0023-optional-consumer-ownership.md

---

**Status:** DONE  
**Summary:** Inventoried five upstream decisions (0019–0023) mechanically. All files read successfully; each decision extracted with stated problem, decision statement, consequence, and exact file path as requested.
