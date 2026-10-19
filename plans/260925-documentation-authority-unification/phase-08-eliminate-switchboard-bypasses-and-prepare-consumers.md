---
phase: 8
title: "Eliminate switchboard bypasses and prepare consumers"
status: detailing
priority: P1
effort: "7.75–13 Doer days plus 4–6 reviewer days; re-estimate after Step 2"
dependencies: [7]
---

# Phase 8: Eliminate switchboard bypasses and prepare consumers

> Legacy numbering: this was **Phase 07** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** authorized (2026-10-19, A49); detailing. Phase 7 closed under A48; implementation has not started. Harness per `plan.md` §7.2; A42 standing delegation and A38 Lead-started independent review apply. Consumer list includes the measured 22 skill/task-spec files naming history plans (`plan.md` §7.6); distinguish writer conventions from historical citations. [Progress](reports/phase-08/progress.md), [decisions](reports/phase-08/owner-answers.md), [computed inventory](reports/phase-08/consumer-inventory.md).
**Revision:** P8-1–P8-18 addressed under supplied Lead L12-3–L12-10; implementation and independent acceptance remain unexecuted.
**Mode:** plan branch
**Purpose:** Ensure cutover changes behavior, not only files. Generic consumers
should already use the Phase 2 switchboard; this phase rewrites remaining direct
path dependencies and prepares the one-row/table authority flip rather than
holding hundreds of edits on a long-lived branch.

L12-8 reading of Purpose: “not holding hundreds of edits” describes switchboard-routed consumers making the eventual flip one row/table change. It grants no early main landing; that remains owner-only.

## Requirements

**Consumers include:**

- `apps/fgos-gateway/src/gateway.rs:1187` serves `/contract` from `docs/contracts/fgos-gateway-api-v1.yaml`; include this runtime consumer when preparing the cutover to the candidate registry contract.

- AGENTS/CLAUDE and instruction sources;
- reading maps and portals;
- skills and prompt templates;
- CLI help/examples;
- setup/doctor registrations;
- generators and projections;
- tests and fixtures;
- comments that name authority paths;
- external-facing links where maintained in-repo.

**Evidence payloads** ([policy](evidence-payload-relocation-policy.md) §4-§6): repoint the consumers of `docs/architect/agent-coordination/verification/**` listed in the policy's consumer table (about 190 files: skill sources, how-to links, code comments, the promoted area's README and proof-preservation table), refresh that table for the cutover commit, and build the digest manifest and `scripts/check-evidence-relocation.mjs` (`--before`, `--after`) so Phase 9 step 6 can run.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

The [computed inventory](reports/phase-08/consumer-inventory.json) enumerates tracked hit files, line numbers, spellings and SHA-256 at input `49ad04648`; it is the planning seed, not proof that every hit is an authority dependency. Step 2 completes semantic and dynamic-path coverage. Relevant boundaries:

| Surface / inputs | Source or executable consumer | Planned treatment |
|---|---|---|
| Always-loaded doctrine | `AGENTS.md`, `CLAUDE.md`, `core/instructions/**`, `domains/*/AGENTS.md`, `src/setup/instruction-registry.mjs`, instruction composition/projection modules | Reuse instruction registry/projection; do not hand-edit generated blocks. Keep current route operative until cutover; prepare exact root-instruction cutover packet. |
| Reading/navigation | `README.md`, `docs/README.md`, `docs/reading-map.md`, `docs/specs/reading-map.md`, area portals, `docs/transitional-switchboard.md`, plan-local `transitional-switchboard.json` | Entry-by-entry curated reading-map conservation; current switchboard remains operative. Four Phase 7 system-architecture missing routes require explicit scope rows, not inferred promotion. |
| Skills, task specs, prompts | `core/skills/**`, `domains/coding/skills/**`, `domains/coding/task-specs/shape-plan.md`, tracked `.claude/skills/**` | Edit actual sources named in render headers. Census lists all 22 history-plan reference files; 13 literal convention files, nine named historical references. Do not convert history references into writer instructions. |
| Rendered skills/instructions | `.agents/skills/**`, `plugins/fgOS/skills/**`, registry-managed instruction projections | Regenerate via `npm run build:skills` and existing instruction generation door; no hand edits; verify deterministic second run. Shipped conventions for external projects remain independent of this repo's topology. |
| CLI/help and setup | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/setup/{instruction-registry,registrations,checks}.mjs` and registered checks | Inventory descriptions, default roots and manifest readers; prepare behavior parity before changing roots; user-visible help requires Unreleased changelog in an authorized implementation slice. |
| Generators/projections | `scripts/{generate-doc-inventory,generate-shipped-path-inventory,check-decision-citation-drift,check-doc-retirement,check-legacy-docs-ratchet,doc-link-pass}.mjs`, `src/report/**`, UI-spec tools | Reuse `planLinkPass` (pure semantic planner), existing inventory/alias/constitution APIs. Legacy ratchet and frozen baselines are not casually rebaselined. Prepare gate-root changes for atomic cutover. |
| Runtime | `apps/fgos-gateway/src/gateway.rs:1187`, `docs/contracts/fgos-gateway-api-v1.yaml`, candidate `docs/platform/contracts/` registry/OpenAPI | Preserve `/v1/contract` bytes, headers and error behavior; changing the active file read is a cutover action. No new fallback resolver. |
| Tests/fixtures/comments | all census rows in `test/**`, `src/**`, `apps/**`, `packages/**`; notably RUL11, retired-decision corpus, dead-vocabulary, instruction registry/projections | Separate actual file reads from synthetic paths, immutable recorded fixtures and comments. Fix maintained links; preserve historical fixture bytes. P7-DOC-GAP-05 stays a visible pre-landing blocker. |
| Evidence payloads | policy §3 table; `core/skills/fgos-architecture-panel/SKILL.md`, how-to links, agent-coordination verification README and proof-preservation table | Refresh exact consumers; prepare digest manifest plus `scripts/check-evidence-relocation.mjs` and behavioral tests in the later tooling slice. No payload edits or deletion in Phase 8. |
| Planning/accounting | `reports/phase-05/pilot-b-link-judgment-queue.json`, Phase 6 owner queue, Phase 7 scorecard/answers, Phase 9 file | Resolve 47-edge prerequisite first; keep A45/A47 and all close carries visible. |

Prior art: `scripts/doc-link-pass.mjs` already exists, so the 2026-10-07 survey's “no reusable link-rewriter” observation is stale. Reuse its protections for provenance/history/self-links; do not build a parallel rewriter. `git log -S'check-evidence-relocation'` finds the designed policy (`ffedbfcbc`, `428029088`), not a delivered verifier; verifier implementation remains missing. Before implementation, repeat history searches for changed symbols, old executor/config names and the relevant area decision history. No code, checker or tests are changed in this detailing turn.

## Implementation Steps

### Shared boundaries and proof rules

This is a plan for later bounded author slices, not permission for this Doer to execute them now. Requirements and Success Criteria above/below remain unchanged. A49 authorizes detailing. Before an implementation slice, the Lead supplies its exact write scope, budget and proof commands. No promotion, authority cutover, alias activation, retirement, deletion, main landing or push occurs in Phase 8. No public/stable contract renumbering is inferred from A45. Gates, vocabulary, extractor, comparator and frozen tests/baselines cannot be changed just to accommodate migration output.

Doer authors; an independent fresh-context reviewer is started by the Lead under A38, with pinned inputs, acceptance contract and distinct output path, no author history or verdict hint. The Doer never certifies its own work. One writer; unrelated rows continue while one row is parked. Every step records inputs/digests, authored output paths, proof exit/results, reviewed rows, parked reason/owner and smallest next action in progress. The fixed controls are `reports/phase-08/{progress,owner-answers}.md`; this brief explicitly names the detailing artifacts. Later artifact names come from `fgos convention path --json` in the Lead's authorized environment; this worker never calls the CLI. Runner commits only declared writes; Doer performs no git writes.

Review requests are at most 60 entries and 400 KB per part; keep one logical request identity when partitioned. Mechanically inspect every row; deep-read at least 15% (minimum 10 or all when fewer), plus all mismatches and high-risk rows; above 3% rework expands the affected set to full review. Independent review and red-team may overlap later unrelated author work only with disjoint write paths. One bounded re-review follows fixes; unresolved findings return to the Lead without cycling evidence packs.

All test commands use `env -u CLAUDE_CODE_SESSION_ID`. Common light proof, after every author batch:

```sh
git diff --check
git diff --name-only HEAD
node scripts/check-legacy-docs-ratchet.mjs
env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-link-pass.test.mjs test/scripts/check-doc-candidate-status.test.mjs test/scripts/check-doc-constitution.test.mjs
```

Compare exact paths against the slice's Lead-declared allowlist; pin protected file digests and switchboard routes before and after, including generated outputs. A changed reviewed content binding returns to pending; no approval crosses a digest change. Keep a per-file edit journal with source/target occurrence and context. L12-3 supersedes L12-2: Step 0 rebinds all 85 imported drifts across all nine files, including docs/specs and architecture-manifest rows. Every later batch editing a decision-target file carries and rebinds its changed units in the same batch (Phase 7 N1 shape); positional `unheaded-block-N` shifts are expected and must be resolved by content, never by blind digest substitution. Changed bindings return to pending independent review. Both ownership audits and both checks.mjs runs must be green at each batch end. Phase 9 still owns final changed-candidate conservation/current-truth accounting under A47; the 85-row repair is no longer deferred there.

No Phase 8 content edits under `docs/specs/**` or `docs/architect/**` (L12-7); their consumers become exact Phase 9 cutover patch specs. Step 0 may repair plan-local bindings pointing into those files without editing the targets. L12-4 is a reading of unchanged Success Criterion 1: Phase 8 proves every legacy-authority reader/writer is switchboard-routed or packaged as an exact cutover edit, so none treats legacy as authority after the flip. The literal repository-wide post-flip search belongs to Phase 9 step 10.

Main drift follows L12-5: L11-3 identity scope PLUS every path class Phase 8 writes, including generated renders:

```sh
git diff HEAD...main -- docs AGENTS.md CLAUDE.md plans/260925-documentation-authority-unification/transitional-switchboard.json core domains src test apps bin scripts packages .agents plugins .claude CHANGELOG.md
```

The Lead checks this at each step boundary and before packaging. Merge main only when that diff is empty. Otherwise carry it at the next batch boundary with per-file conflict review; never silently merge the drift. The Lead owns integration outside the worker. Never merge mid-batch or have the Doer run git writes. Repin imports, invalidate affected consumer reviews/parity evidence, re-account legacy digests from exact main commits and append changed candidate files to Phase 9's A47 list. Do not repeat native/global work at every merge. Before close, compare the complete changed-file set against B0 and latest main; no silent omission of root instructions or switchboard. No partial unrecorded sync. New decisions that change this rule are L12 records, not inherited exceptions taken out of context.

### Step 0 — Package the imported bindings before consumer edits

- **Inputs:** A49, L12-1 and L12-3–L12-10, merge `49ad04648`, six accounted exceptions, Phase 7 rebind/N1 procedure (`owner-answers.md` L11-26 and L11-28; `step-09-close-assignment-target-rebindings.json`), closed scorecard, `merge-accounting.json`, historical `reproduction-blocker.json`.
- **Doer outputs:** a package turn rebinds all 85 drifted bindings across nine files, including docs/specs and architecture-manifest targets, using the established Phase 7 procedure; preserve source identities, journal before/after anchor/digest and reason, invalidate affected approvals. No target-file content edit. Resolve positional shifts against actual passages. Record exact committed path/commit exception data after runner commits, never guess a future commit id or change embedded checker logic. Record the Step 0 decisions already supplied, including Decision F revisit (L12-9).
- **Seven conflict-resolution paths to review:** `docs/platform/component-boundary.md`; `docs/platform/holder-lock/spec.md`; `docs/platform/packaging-distribution/contracts/activation-binding.md`; `docs/platform/packaging-distribution/contracts/release-manifest.md`; `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`; `docs/platform/intent-preservation-ledger.md`; `scripts/check-decision-citation-drift.baseline.json`. Exact resolutions and merge-byte digests are in `merge-accounting.json`; none is authorization to edit these targets now.
- **Reporter:** committed `reports/phase-08/audit-report.py` extracts both manifests' scripts unchanged to distinct `/tmp/fgos-work/` directories and runs ownership, audit-ownership and checks independently, even after an earlier failure. Its JSON contains manifest-qualified failing rows keyed by `(manifest,file,collection,claimId,targetOwner,targetAnchor)`, expected digest and current anchor digests; ownership collision/duplicate diagnostics; separate checks A unaccounted commit/path pairs and B/H/I. Missing output or command error fails proof; no count-only acceptance and no expected-red allowance. Reuses each recipe's `unitsOf` read-only. Logs and complete original JSON remain in scratch. Both checks can run independently of ownership success; there is no need to change them or build a fallback checker.
- **Reviewer:** Lead-started independent accounting review of all 85 joins, six exceptions, seven conflict resolutions and Phase 9 additions; fresh content bindings are not approved merely by rehashing. Partition requests at ≤60 entries/400 KB (at least two parts for 85 bindings; exact total includes exceptions/conflicts and byte splits).
- **Proof:** `env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/audit-report.py`; `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-rationale-reproduction.test.mjs test/scripts/check-legacy-docs-ratchet.test.mjs test/scripts/check-decision-citation-drift.test.mjs`; ratchet and diff checks. Require both audits AND checks green before any consumer edit. The reporter is diagnostic, never a replacement for the unchanged tests. Repeat after committed-byte accounting.
- **Stop/parking:** unexplained row, missing source passage, collision, unaccounted commit/path or red check blocks package acceptance and all consumer edits. Read-only Steps 1/2 and 6b may proceed independently. **Effort/risk:** 0.5–1 day, high binding risk; package review required.

### Step 1 — Settle the 47-edge Pilot B prerequisite

- **Inputs:** all 47 immutable queue rows, current legacy text, candidate claim/alias mapping, Phase 6 link-preview judgments; Phase 7 contract decisions including A45.
- **Doer outputs:** one proposal per original edge keyed by `(index,consumerPath,referenceAsWritten,originalLine)`, re-located by content rather than stale line number, original reference, current source occurrence/digest, proposed target path/anchor/authority kind, current switchboard route, reason and behavior-proof need. Changed/missing occurrences are explicit superseded/drift rows, never dropped. No consumer edit yet.
- **Reviewer:** Lead-started A38 reviewer reads all 47 original-to-proposed joins and the actual target passages; Lead decides genuinely ambiguous mappings under A42 and records L12 reasons. Owner only for excluded actions such as renumbering/deletion.
- **Proof:** pre-assign preserve/cutover-patch-only to the ten code/test/gate rows; gate baselines/exceptions remain preserved, behavior-test rows require a parity-backed cutover patch, and comments may rewrite only after semantic review. Explicit zero-based queue indexes: 0 (shipped-path generator), 1–2 (conservation tests), 40 (dogfood fixture), 41–42 (ratchet baseline/exceptions), 43–45 (retired-corpus tests), 46 (citation-drift test): ten code/test/gate/fixture rows. Preserve frozen gate data and recorded fixture bytes; generator and real-reader tests get preserve-now/exact-cutover-patch dispositions. Report preserve versus rewrite counts and reasons separately. Use existing `planLinkPass` (`scripts/doc-link-pass.mjs`) and its target-anchor validation for rewrite proposals; preservation proves original bytes/context and why no rewrite is needed. `python3 -c "import json; q=json.load(open('plans/260925-documentation-authority-unification/reports/phase-05/pilot-b-link-judgment-queue.json')); assert len(q)==47; print(len(q))"`; run `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-link-pass.test.mjs`; check 47/47 unique source-row joins and target anchors through the unchanged link/anchor APIs, with commands/output stored in the review packet.
- **Stop/parking:** no rewrite until all 47 rows have reviewed disposition; ambiguous rows park individually while Step 2 proceeds. A hash/anchor mismatch cannot inherit an old judgment. **Effort/risk:** half to one day, high semantic risk.

### Step 2 — Complete the consumer census and writer classification

- **Inputs:** computed JSON/Markdown inventory, old `reports/phase-07-08-prep/consumer-survey.*`, switchboard/aliases, current existing inventory consumer edges, shipped-path conventions, source/render headers and all Step 1 judgments.
- **Doer outputs:** exact per-edge reader/writer table across instructions, maps/portals, skills/prompts/task specs, CLI help, setup/doctor, generators/projections, tests/fixtures, comments, maintained external links and runtime. Record matched expression or call site, current file digest, current authority route, desired owner/anchor, source vs render, pre-cutover action, cutover action, test, reviewer and parked reason. List dynamic/unresolved edges explicitly. Refresh the evidence consumer table separately. Join census edges to every ledger `targetOwner` and list all affected anchors (including shifted positional anchors) for batch N1 scope. Store alias lookup/write-destination columns in this same table; Step 3 reviews them without a duplicate alias artifact. All 22 history-plan files receive reviewed dispositions: the 13 shipped `docs/history/<feature>/plan.md` conventions and sibling CONTEXT/RESEARCH/DISCUSSION conventions describe external-project topology and stay unchanged (L12-10); nine historical references stay historical. Any convention change needs a separate backlog item, outside this plan.
- **Reviewer:** Lead-started census reviewer independently enumerates tracked surfaces and manually traces every discovered file-open/write/default-root construction. Cross-check the old survey's test readers, `path.join('docs','specs')`, UI-spec tools and wrapped comments. `.fgos` and external/ignored consumers remain unproven until the Lead supplies a separately authorized read-only export; never read secrets.
- **Proof:** `env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/scan-consumers.py` (redirect stdout to external scratch). This committed scanner uses the inventory JSON's own patterns over `git ls-files`, including root documents, relative forms, split literals and `dogfood-fixture/`; excludes state/secrets and this plan. Reconcile hits by path/line/pattern/digest against the seed; changed counts require explanation. Trace dynamic constructions and wrapped comments through existing inventory APIs; lexical coverage alone is not semantic proof. No native sync/global D/E for a lexical refresh.
- **Stop/parking:** untraced dynamic writer or missing consumer class blocks only its rewrite batch; census cannot close with unexplained gaps. **Effort/risk:** one to two days, high completeness risk.

### Step 3 — Review the route and cutover matrix before any rewrite

- **Inputs:** reviewed 47 rows, completed census, unchanged current switchboard, candidate status/aliases and reading-map conservation obligations.
- **Doer outputs:** reviewed mapping for each maintained reader/writer; exact lookup-only alias tests/cases; missing switchboard route proposals; protected root-instruction and A45 legacy CTR010 cutover patch specifications. Every row distinguishes executable action now from Phase 9 action. No alias is a writing destination. A known historical path may resolve for lookup; authoring always names its current explicit owner. Do not implement a second resolver or engine.
- **Behavior preservation:** before cutover, generic instructions navigate through the operative switchboard and its explicit current sources. Candidate links are labelled candidate/provenance, never current authority. Already-promoted evidence navigation may repoint to byte-identical target payloads under the policy. A reader whose path determines runtime/test behavior stays on its current path until parity is proved and its cutover patch is approved. Legacy maintained content is not deleted or turned into a competing stub.
- **Reviewer:** Lead-started route reviewer reads target claims and current authority status, including all four missing system-architecture routes and candidate vs promoted distinctions. Lead settles within-scope choices under A42.
- **Proof:** common light proof; `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-link-pass.test.mjs test/scripts/check-doc-retirement.test.mjs`; exact before/after switchboard route comparison and alias resolution cases using existing APIs. No alias adoption in production.
- **Stop/parking:** any proposed target changes ownership, payload schema or contract identity parks that row for Phase 9/owner. **Effort/risk:** half to one day, high authority risk.

### Step 4 — Prepare and apply safe prose/source consumer batches

- **Inputs:** reviewed matrix and row-specific dispositions; source headers, instruction registry, shipped conventions and scope for this implementation slice.
- **Doer outputs:** small batches by source owner: instructions/navigation, shared skills/prompts, domain skills/task specs, maintained comments/help and evidence links. Only behavior-preserving switchboard/current-owner navigation outside `docs/specs/**` and `docs/architect/**` is applied now; those two roots get exact Phase 9 patch specs only (L12-7). Each decision-target batch includes its own N1 carry/rebind and both audits/checks green, not a deferred drift delta. Exact root-authority flips and maintained legacy-root edits stay as reviewed cutover patch specifications. Source edits precede `npm run build:skills`; generated `.agents`/plugin outputs must come solely from that build. Leave the 13 shipped plan writer conventions, sibling CONTEXT/RESEARCH/DISCUSSION conventions and nine historical references unchanged (L12-10); preserve external projects' plan-placement contract; use the existing convention door rather than hardcoding this repo's `plans/` into shipped skills. Capture deterministic source→render provenance and installed-package link limitations. User-visible help gets an authorized changelog line.
- **Reviewer:** Lead-started independent source/render reviewer for each disjoint batch; all 22 planning files joined, historical plan references preserved as history; root instructions reviewed against their registry sources, never a hand-patched projection.
- **Proof:** common light proof; `env -u CLAUDE_CODE_SESSION_ID npm run build:skills` twice with byte-equal second output; `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/generate-shipped-path-inventory.test.mjs test/setup/instruction-registry.test.mjs test/setup/instruction-composition.test.mjs test/setup/instruction-projections.test.mjs`; validate maintained links and anchors from the reviewed matrix.
- **Stop/parking:** unexpected generated delta, install-level assumption, new config/dependency or legacy ratchet violation parks the affected batch; setup/doctor registration is required in the same authorized slice for any new prerequisite. No direct render repair. **Effort/risk:** one to two days, medium/high; exact size after census.

### Step 5 — Prepare behavioral consumers and cutover parity

- **Inputs:** inherited `core/workflows/**` classification and stale shipped-path inventory obligation (`plan.md` §7.6); actual runtime readers/writers/default-root calls from Step 2; old/current/candidate contract files; setup/doctor/generator registration semantics; A45, P7-DOC-GAP-05/06 and Phase 9 obligations.
- **Doer outputs:** in a later authorized code slice, extend the existing shipped-path classifier for `core/workflows/**`, regenerate the shipped-path inventory and verify `generate-shipped-path-inventory.test.mjs`; no parallel classifier. Per-seam parity receipt and exact cutover patch specification for gateway contract read, CLI help, setup/doctor manifest/scan roots, generators/projections, real-file tests and UI-spec compiler roots. Retain active reads until Phase 9. The gateway packet proves current vs candidate OpenAPI byte/semantic differences and expected response content type, success/error status and missing-file behavior; any payload/API change parks the seam rather than being called a path-only edit. Do not launch a raw gateway or add an implicit fallback/dual-write path. Synthetic fixture strings and recorded outcomes get explicit preserve dispositions. A45 legacy `docs/architecture-map.md` lines change only in the cutover packet, never renumber the shipped contract here.
- **Reviewer:** Lead-started independent code/contract reviewer; inspect every behavioral reader and generator output, not a sample of path strings. This is preparation, not code implementation in this turn.
- **Proof:** common light proof; `env -u CLAUDE_CODE_SESSION_ID node --test test/docs/rul11-anchor-phrase.test.mjs test/docs/decisions-corpus-retired.test.mjs test/setup/instruction-registry.test.mjs test/scripts/check-decision-citation-drift.test.mjs`; compare current/candidate gateway file hashes and parsed operation/schema sets. In the later authorized implementation slice, add real behavior tests at the existing seam and have the Lead run the affected gateway Rust/cargo suite via its established test target as a heavy job scheduled alone under the 15 GiB host rule; no runtime process needed for this planning turn. Record exact commands/target when the census identifies it, do not invent a passing test name.
- **Stop/parking:** behavior or schema difference, missing fixture provenance, stale contract numbering, changed implementation or P7-DOC-GAP-05 blocks the affected seam/landing. Existing dead-vocabulary failure stays visible; do not weaken the guard. **Effort/risk:** one to two days, high runtime risk.

### Step 6 — Prepare evidence digest manifest and verifier

- **Inputs:** policy §3–§6, refreshed exact consumer table (current lexical seed: 212 non-payload mentions, 194 legacy-form), all mirror pairs, modes, current source commit and tree walkers.
- **Doer outputs:** deterministic manifest with `version`, `sourceCommit`, `generatedBy`, sorted `collection/before/after/sha256/bytes/mode/gitBlob/relation` entries; later sealed home per policy. Build the already-designed `scripts/check-evidence-relocation.mjs` in a separately scoped tooling slice with `--before`/`--after`, reusing existing classification/path/hash primitives. No payload text, line endings, mode or file removal changes. Repoint safe maintained prose consumers per Step 4, preserve fixture/history and machine-specific absolute paths. Recompute the policy table instead of hardcoding 867 or 190 as truth.
- **Reviewer:** Lead-started independent code/data reviewer checks every manifest entry mechanically, all exceptional consumers, executable modes and both verifier behaviors. No new gate framework or relocation engine.
- **Proof:** planned commands after that tooling slice exists: `env -u CLAUDE_CODE_SESSION_ID node scripts/check-evidence-relocation.mjs --manifest <reviewed-manifest> --before`; `env -u CLAUDE_CODE_SESSION_ID node --test <reviewed-evidence-relocation-test>` (exact test path assigned with the slice). Negative behavior cases in external scratch must reject missing/changed/unlisted payloads and wrong modes. `--after` is tested only against scratch fixtures in Phase 8; live `--after` is expected to fail while legacy files exist. Live `--after` belongs to Phase 9 after approved deletion. Do not edit the existing retirement gate to claim a verifier exists before it does; route required registration/protection to the Lead's tooling slice.
- **Stop/parking:** unmatched mirror/digest/mode, newly found runtime reader, unclassified consumer or missing standing verification integration blocks relocation readiness. No early deletion or new ratchet exception kind. **Effort/risk:** one day plus review, high data-preservation risk.

### Step 6b — Read-only reuse check against Git 04 custody/ref door

- **Inputs:** `cutover-write-lease-design.md` §6, Git phase 04 on `git/p04-custody`, `docs/platform/git/spec.md`, and `plans/261017-1313-fgos-platform-program-board/plan.md`; current custody lease/ref door and L12-6.
- **Doer outputs:** read-only compatibility matrix comparing documentation freeze needs, registered writers/admission, linked worktrees, real liveness, clean/digest-matched sources and ref movement against Git 04's custody lease and ref door. Record landed/pending evidence and missing semantics; do not build, acquire or test a second lease/ref guard. The Lead coordinates with the Git lead and records the dependency/status; no Doer message or coordination receipt is inferred here.
- **Reviewer/proof:** independent read-only trace to exact Git 04 contract/source pins and program-board lane/status; distinguish specified behavior from landed/tested behavior. No state write, runtime lease or rehearsal is required for this check.
- **Stop/parking:** building any lease waits until Git 04 lands and is designed on its door, including any amendment to the older lease design. Missing landed custody/ref support blocks cutover readiness while consumer/evidence preparation continues. Phase 9 requires its own integrated refusal/rollback proof before acquiring a lease. **Effort/risk:** 0.25–0.5 day, high dependency risk; implementation excluded from this phase estimate.

### Step 7 — Assemble the atomic consumer handoff

- **Inputs:** reviewed Step 1–6b outputs; latest main drift, full edit journal and Phase 9 accounting list; aliases; gate/lease design; A45 legacy lines, gateway seam and P7 carries.
- **Doer outputs:** one consumer cutover matrix and ordered patch specifications, row-level readiness receipts, parked list and rollback ordering. Explicitly include A47's original 35 changed candidate files plus all subsequent changed candidates (including L12-1's thirteen incoming paths), main's PF-I022/PF-I023 reference reconciliation, reading-map entry merge, holder-lock header, P7-DOC-GAP-05/06 and all A34 residuals. Append every Phase 8-edited `docs/platform/**` path to the A47 changed-candidate union, with batch N1 carry/rebind receipts; any final changed target is rebound in its own package before handing off. No blanket deferred-red binding obligation remains. Phase 9 must compare the final actual changed-file set, not rely on a count from Phase 7. Record exact Plan A phase 06 and Plan B phase 06 landing status/commits in the AGENTS.md cutover packet; either pending blocks that cutover. Record Git 04 landing and reuse-check gaps, requiring integrated custody/ref proof before cutover; do not implement or acquire a lease in this turn.
- **Reviewer:** Lead-started independent integration reviewer joins every census row to applied-safe, prepared-for-cutover, preserved-history/fixture or individually parked disposition; no generic “all covered” status. Check writer destinations are never aliases and current routing remains intact.
- **Proof:** repeat full-scope main diff and common light proof; compare protected switchboard/root-instruction hashes; rerun Step 0 tests with recorded dispositions; live evidence `--before` once available. Search every census spelling and dynamic seam again. Planned post-cutover checks are listed separately from pre-cutover passes.
- **Stop/parking:** any unowned reader/writer, unexplained changed file or stale proof prevents readiness. Score unchanged Success Criterion 1 against the L12-4 pre-cutover reading and exact patch coverage; reserve literal repository-wide proof for Phase 9 step 10. **Effort/risk:** half day, high integration risk.

### Step 8 — One independent adversarial closure review

- **Inputs:** pinned final consumer matrix, 47 reviewed joins, source/render deltas, parity receipts, manifest/verifier proof and Git 04 read-only reuse/dependency evidence, Phase 9 handoff and every L12 decision/open row.
- **Doer outputs:** Phase 8 scorecard mirroring Phase 7: each requirement and success criterion mapped to evidence/verdict, applied vs prepared behavior explicit, suite baseline vs branch residuals separated, owner/Lead decisions and exact carry-forward lists. No new authority claim from file placement. Progress records next concrete action before yielding.
- **Reviewer:** Lead starts ONE independent adversarial closure review combining checkpoint and red-team, sized to consumer work (all 47 judgments and all behavioral/writer/alias/evidence exceptions mandatory; mechanical full coverage plus the shared sample for homogeneous prose batches). Pin protected hashes and contract acceptance, not a desired verdict. One bounded re-review after fixes; a changed source digest invalidates only affected judgments, with no carried approval.
- **Proof:** Lead runs `env -u CLAUDE_CODE_SESSION_ID npm test` in its allowed environment, serially with other heavy jobs, plus the scoped commands above, exact changed-path checks, source/render determinism and the complete consumer-remnant search. Do not rerun native sync/global D/E merely to duplicate Phase 9 accounting; if the Lead requires heavy proof, budget and schedule it explicitly. Record real exits and main-vs-branch failure attribution as in the Phase 7 close, never hide a new failure.
- **Stop/parking:** unresolved mandatory judgment, untraced behavioral consumer, missing digest proof or false green blocks close. Apply the already-settled L12-4 reading; do not reopen the SC question at close or claim the post-flip search has run. Owner-only landing, push, cutover, deletion or renumbering uses the five-part packet in `reports/phase-08/owner-answers.md` and parks only dependent work. **Effort/risk:** half to one day plus independent review, high false-completion risk.

Execution dependency: `0 ∥ 1 ∥ 2`; `3 ← 1,2`; `4,5 ← 0,3`; `6 ← 2` (manifest/verifier preparation independent of Step 3; any consumer edit still requires 0,3); `6b ← 0 inputs` (read-only check may start while package acceptance is blocked); `7 ← 0–6b`; `8 ← 7`. These are logical readiness edges, not concurrent writers: authoring is serial. Consumer edits require accepted Step 0 and all 47 reviewed dispositions. Phase 9 remains separately unauthorized.

### Review volume, budget and scorecard map

Seed: 2,276 hit files = 1,155 historical-review-before-rewrite + 390 immutable payload + 731 remaining. Written classification rule: only inventory-tagged immutable payloads with byte/mode provenance are preserve-payload; only completed dated reports/plans with no active writer/default/read contract are preserve-history. Any active instruction found in either class moves to the maintained table. Mechanical full coverage, sampled audit and all exceptions are mandatory; category names alone do not approve preservation.

At ≤60 entries AND 400 KB per part, the seed census is at least 38 parts (partitioned by class: 20 history + 7 payload + 13 remaining = 40 parts before byte splits). Minimum deep reads per those 60-entry parts: 200 history + 70 payload + 130 remaining = 400, plus all high-risk/mismatch rows. This exceeds a single unpartitioned 15% sample deliberately; final counts use actual part sizes. Step 1: 47 entries, ≥1 part, all 47 deep-read. Step 0: 85 bindings + six exceptions + seven conflict paths = 98 entries, ≥2 parts, all binding/conflict joins reviewed. Steps 3/7/8 reuse census row ids and record exact reviewed/changed counts, ≥ceil(rows/60) parts each (seed class partition 40 parts before additional byte splits); re-review only changed bindings, while mechanically joining all rows. Step 4 author batches ≤60 edges/400 KB and one source owner; Step 5 all behavioral exceptions deep-read; Step 6 all payload rows mechanically verified plus exceptional entries deep-read. Never send a 2,276-file request as one part.

Lead budgets 4–6 reviewer days initially (census 2–3, route/source/parity 1–2, combined closure 1), with one bounded re-review included. At each step publish actual entries, bytes, part count, mandatory/sample deep reads and elapsed/remaining budget. If a step exceeds its assigned budget or >3% rework, pause that review for Lead re-sizing/full affected-set review; unrelated work continues. Re-estimate after Step 2, including edge expansion beyond file counts. Serial Doer sum: 0 (0.5–1) + 1 (0.5–1) + 2 (1–2) + 3 (0.5–1) + 4 (1–2) + 5 (1–2) + 6 (1) + 6b (0.25–0.5) + 7 (0.5) + 8 (0.5–1) = **6.75–12 days**; reserve one Doer day for fixes, hence **7.75–13** plus independent review. Verifier tooling is included in Step 6; Git lease implementation is excluded/dependent on Git 04. No hidden implementation day allowance.

| Scorecard requirement / inherited obligation | Step and required receipt |
|---|---|
| All listed consumer classes, runtime and source/render parity | 2–5 census, route columns, per-seam parity and deterministic regeneration |
| Evidence policy §4–§6 manifest AND verifier | 6 manifest hashes/modes, live --before, scratch negative/--after proof; live --after only in Phase 9 |
| §7.5b lease obligation, narrowed by L12-6 | 6b read-only Git 04 custody/ref reuse matrix and dependency; actual lease integration/proof waits for Git 04 and cutover authorization |
| SC1 unchanged, L12-4 reading | 7/8 every edge switchboard-routed or exact cutover patch; Phase 9 step 10 literal search |
| SC2 lookup-only aliases | 2 alias columns, 3 reviewed cases, 7/8 no writing destination alias |
| Binding integrity / inherited A47 | 0 green audits/checks; every changed batch N1 receipt; 7 final changed-candidate union |
| Shipped classification, Decision F, AGENTS coordination | 0 L12-9 revisit; 5 core/workflows classifier/inventory; 7 Plan A/B phase 06 landing pins |

## Success Criteria

- [ ] repository-wide search finds no reader or writer treating a legacy path as
  current authority;
- [ ] aliases are lookup-only and never writing instructions.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11. Main hazards here are a missed dynamic writer, treating a historical reference as an active instruction, a source/render mismatch in shipped skills, an early authority switch hidden as a link fix, evidence digest/mode loss, and repeated main sync invalidating reviews. Controls are the per-edge matrix, source-based deterministic regeneration, pinned current switchboard routes, parity packets, manifest re-hashing and full identity-scope drift checks. The imported 85 drifts are Step 0 repair work under L12-3, distinct from the Phase 9 dead-vocabulary failure; a red audit is never a tolerable batch-end baseline. Repair bindings through the existing procedure without weakening checkers or expanding scope.

## Prerequisite from the dual pilot (owner, 2026-10-07)

The 47 inbound edges of the work-state sources that the link preview could not map to a document without a judgment (`reports/phase-05/pilot-b-link-judgment-queue.json`) must be worked off before this phase rewrites consumers: an agent proposes the target for each edge, the Lead reviews, and the owner decides only the ambiguous ones. Phase 6 area transformations need the same queue for their own sources.

