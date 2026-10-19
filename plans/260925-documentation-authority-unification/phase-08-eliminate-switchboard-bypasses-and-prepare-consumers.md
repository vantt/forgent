---
phase: 8
title: "Eliminate switchboard bypasses and prepare consumers"
status: detailing
priority: P1
effort: "7–11 Doer days plus independent review; re-estimate after Step 2"
dependencies: [7]
---

# Phase 8: Eliminate switchboard bypasses and prepare consumers

> Legacy numbering: this was **Phase 07** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** authorized (2026-10-19, A49); detailing. Phase 7 closed under A48; implementation has not started. Harness per `plan.md` §7.2; A42 standing delegation and A38 Lead-started independent review apply. Consumer list includes the measured 22 skill/task-spec files naming history plans (`plan.md` §7.6); distinguish writer conventions from historical citations. [Progress](reports/phase-08/progress.md), [decisions](reports/phase-08/owner-answers.md), [computed inventory](reports/phase-08/consumer-inventory.md).
**Mode:** plan branch
**Purpose:** Ensure cutover changes behavior, not only files. Generic consumers
should already use the Phase 2 switchboard; this phase rewrites remaining direct
path dependencies and prepares the one-row/table authority flip rather than
holding hundreds of edits on a long-lived branch.

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

Compare exact paths against the slice's Lead-declared allowlist; pin protected file digests and switchboard routes before and after, including generated outputs. A changed reviewed content binding returns to pending; no approval crosses a digest change. Keep a per-file edit journal with source/target occurrence and context; actual native carry/rebinding of changed candidate units is Phase 9's first obligation under A47. This phase does not claim renewed conservation approval.

Main drift follows L11-3's full scope, not a docs-only check:

```sh
git diff HEAD...main -- docs AGENTS.md CLAUDE.md plans/260925-documentation-authority-unification/transitional-switchboard.json
```

The Lead checks this at each step boundary and before packaging. Empty identity-scope diff may be synchronized by the Lead outside a worker; nonempty waits for a recorded Lead decision/deferred integration. Never merge mid-batch or have the Doer run git writes. Repin imports, invalidate affected consumer reviews/parity evidence, re-account legacy digests from exact main commits and append changed candidate files to Phase 9's A47 list. Do not repeat native/global work at every merge. Before close, compare the complete changed-file set against B0 and latest main; no silent omission of root instructions or switchboard. No partial unrecorded sync. New decisions that change this rule are L12 records, not inherited exceptions taken out of context.

### Step 0 — Accept the accounting baseline and release the first slice

- **Inputs:** A49/L12-1, merge `49ad04648`, six exception records, Phase 7 closed scorecard, `merge-accounting.json`, `reproduction-blocker.json`.
- **Doer outputs:** digest/main-commit accounts, exact reproduction diagnostics and declared write boundary. This turn completes the six data accounts, not the blocked ownership audit. Lead disposes the all-pass/no-rebind conflict explicitly before calling this baseline green.
- **Reviewer:** Lead-started independent accounting review of six exception rows, seven conflict resolutions and Phase 9 additions; it does not review source truth by implication.
- **Proof:** `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-rationale-reproduction.test.mjs test/scripts/check-legacy-docs-ratchet.test.mjs test/scripts/check-decision-citation-drift.test.mjs`; `node scripts/check-legacy-docs-ratchet.mjs`; inspect `git diff --check` and exact write list. Current ownership failure is not P7-DOC-GAP-05.
- **Stop/parking:** no checker change or rebind to force green; park only the baseline acceptance when missing authority. Steps 1–2 read-only analysis may continue. **Effort/risk:** half day, medium; no content approval.

### Step 1 — Settle the 47-edge Pilot B prerequisite

- **Inputs:** all 47 immutable queue rows, current legacy text, candidate claim/alias mapping, Phase 6 link-preview judgments; Phase 7 contract decisions including A45.
- **Doer outputs:** one proposal per original edge with stable row identity, original reference, current source occurrence/digest, proposed target path/anchor/authority kind, current switchboard route, reason and behavior-proof need. Changed/missing occurrences are explicit superseded/drift rows, never dropped. No consumer edit yet.
- **Reviewer:** Lead-started A38 reviewer reads all 47 original-to-proposed joins and the actual target passages; Lead decides genuinely ambiguous mappings under A42 and records L12 reasons. Owner only for excluded actions such as renumbering/deletion.
- **Proof:** `python3 -c "import json; q=json.load(open('plans/260925-documentation-authority-unification/reports/phase-05/pilot-b-link-judgment-queue.json')); assert len(q)==47; print(len(q))"`; run `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-link-pass.test.mjs`; check 47/47 unique source-row joins and target anchors through the unchanged link/anchor APIs, with commands/output stored in the review packet.
- **Stop/parking:** no rewrite until all 47 rows have reviewed disposition; ambiguous rows park individually while Step 2 proceeds. A hash/anchor mismatch cannot inherit an old judgment. **Effort/risk:** half to one day, high semantic risk.

### Step 2 — Complete the consumer census and writer classification

- **Inputs:** computed JSON/Markdown inventory, old `reports/phase-07-08-prep/consumer-survey.*`, switchboard/aliases, current existing inventory consumer edges, shipped-path conventions, source/render headers and all Step 1 judgments.
- **Doer outputs:** exact per-edge reader/writer table across instructions, maps/portals, skills/prompts/task specs, CLI help, setup/doctor, generators/projections, tests/fixtures, comments, maintained external links and runtime. Record matched expression or call site, current file digest, current authority route, desired owner/anchor, source vs render, pre-cutover action, cutover action, test, reviewer and parked reason. List dynamic/unresolved edges explicitly. Refresh the evidence consumer table separately. All 22 history-plan files receive reviewed semantic dispositions; do not pretend all 22 are writer instructions.
- **Reviewer:** Lead-started census reviewer independently enumerates tracked surfaces and manually traces every discovered file-open/write/default-root construction. Cross-check the old survey's test readers, `path.join('docs','specs')`, UI-spec tools and wrapped comments. `.fgos` and external/ignored consumers remain unproven until the Lead supplies a separately authorized read-only export; never read secrets.
- **Proof:** `git ls-files -z`; `rg -n --hidden -g '!.git/**' -g '!.fgos/**' -g '!plans/260925-documentation-authority-unification/**' 'docs/(specs|architect|contracts|ui-spec)|docs/history/<feature>/plan\.md' AGENTS.md CLAUDE.md README.md core domains .agents plugins .claude src bin apps packages scripts test docs`; reconcile relative links/constructed paths against existing inventory APIs, not just this regex. Recompute the scan using expressions/method in the JSON; hash pinned inputs. No native sync or global D/E for a lexical refresh.
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
- **Doer outputs:** small batches by source owner: instructions/navigation, shared skills/prompts, domain skills/task specs, maintained comments/help and evidence links. Only behavior-preserving switchboard/current-owner navigation is applied now. Exact root-authority flips and maintained legacy-root edits stay as reviewed cutover patch specifications. Source edits precede `npm run build:skills`; generated `.agents`/plugin outputs must come solely from that build. Preserve external projects' plan-placement contract; use the existing convention door rather than hardcoding this repo's `plans/` into shipped skills. Capture deterministic source→render provenance and installed-package link limitations. User-visible help gets an authorized changelog line.
- **Reviewer:** Lead-started independent source/render reviewer for each disjoint batch; all 22 planning files joined, historical plan references preserved as history; root instructions reviewed against their registry sources, never a hand-patched projection.
- **Proof:** common light proof; `env -u CLAUDE_CODE_SESSION_ID npm run build:skills` twice with byte-equal second output; `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/generate-shipped-path-inventory.test.mjs test/setup/instruction-registry.test.mjs test/setup/instruction-composition.test.mjs test/setup/instruction-projections.test.mjs`; validate maintained links and anchors from the reviewed matrix.
- **Stop/parking:** unexpected generated delta, install-level assumption, new config/dependency or legacy ratchet violation parks the affected batch; setup/doctor registration is required in the same authorized slice for any new prerequisite. No direct render repair. **Effort/risk:** one to two days, medium/high; exact size after census.

### Step 5 — Prepare behavioral consumers and cutover parity

- **Inputs:** actual runtime readers/writers/default-root calls from Step 2; old/current/candidate contract files; setup/doctor/generator registration semantics; A45, P7-DOC-GAP-05/06 and Phase 9 obligations.
- **Doer outputs:** per-seam parity receipt and exact cutover patch specification for gateway contract read, CLI help, setup/doctor manifest/scan roots, generators/projections, real-file tests and UI-spec compiler roots. Retain active reads until Phase 9. The gateway packet proves current vs candidate OpenAPI byte/semantic differences and expected response content type, success/error status and missing-file behavior; any payload/API change parks the seam rather than being called a path-only edit. Do not launch a raw gateway or add an implicit fallback/dual-write path. Synthetic fixture strings and recorded outcomes get explicit preserve dispositions. A45 legacy `docs/architecture-map.md` lines change only in the cutover packet, never renumber the shipped contract here.
- **Reviewer:** Lead-started independent code/contract reviewer; inspect every behavioral reader and generator output, not a sample of path strings. This is preparation, not code implementation in this turn.
- **Proof:** common light proof; `env -u CLAUDE_CODE_SESSION_ID node --test test/docs/rul11-anchor-phrase.test.mjs test/docs/decisions-corpus-retired.test.mjs test/setup/instruction-registry.test.mjs test/scripts/check-decision-citation-drift.test.mjs`; compare current/candidate gateway file hashes and parsed operation/schema sets. In the later authorized implementation slice, add real behavior tests at the existing seam and run the affected gateway Rust suite via its established test target; no runtime process needed for this planning turn. Record exact commands/target when the census identifies it, do not invent a passing test name.
- **Stop/parking:** behavior or schema difference, missing fixture provenance, stale contract numbering, changed implementation or P7-DOC-GAP-05 blocks the affected seam/landing. Existing dead-vocabulary failure stays visible; do not weaken the guard. **Effort/risk:** one to two days, high runtime risk.

### Step 6 — Prepare evidence digest manifest and verifier

- **Inputs:** policy §3–§6, refreshed exact consumer table (current lexical seed: 212 non-payload mentions, 194 legacy-form), all mirror pairs, modes, current source commit and tree walkers.
- **Doer outputs:** deterministic manifest with `version`, `sourceCommit`, `generatedBy`, sorted `collection/before/after/sha256/bytes/mode/gitBlob/relation` entries; later sealed home per policy. Build the already-designed `scripts/check-evidence-relocation.mjs` in a separately scoped tooling slice with `--before`/`--after`, reusing existing classification/path/hash primitives. No payload text, line endings, mode or file removal changes. Repoint safe maintained prose consumers per Step 4, preserve fixture/history and machine-specific absolute paths. Recompute the policy table instead of hardcoding 867 or 190 as truth.
- **Reviewer:** Lead-started independent code/data reviewer checks every manifest entry mechanically, all exceptional consumers, executable modes and both verifier behaviors. No new gate framework or relocation engine.
- **Proof:** planned commands after that tooling slice exists: `env -u CLAUDE_CODE_SESSION_ID node scripts/check-evidence-relocation.mjs --manifest <reviewed-manifest> --before`; `env -u CLAUDE_CODE_SESSION_ID node --test <reviewed-evidence-relocation-test>` (exact test path assigned with the slice). Negative behavior cases in external scratch must reject missing/changed/unlisted payloads and wrong modes. `--after` is tested only against scratch fixtures in Phase 8; live `--after` is expected to fail while legacy files exist. Live `--after` belongs to Phase 9 after approved deletion. Do not edit the existing retirement gate to claim a verifier exists before it does; route required registration/protection to the Lead's tooling slice.
- **Stop/parking:** unmatched mirror/digest/mode, newly found runtime reader, unclassified consumer or missing standing verification integration blocks relocation readiness. No early deletion or new ratchet exception kind. **Effort/risk:** one day plus review, high data-preservation risk.

### Step 6b — Revalidate and build the already-approved cutover lease

- **Inputs:** `cutover-write-lease-design.md` §6 (ten owner-approved directions), current Holder-lock/session identity/Git/runner contracts, completed writer census, full-scope drift check and the survey's main-checkout hook-wiring finding. This is the existing Phase 8 obligation in `plan.md` §7.5b, not a new engine proposal.
- **Doer outputs:** first a grounded design delta: the old design names removed `main-checkout-lock.mjs`, TTL string locks and retired dispatch routes; reconcile it with `src/runner/repo-locks.mjs`, Holder-lock's current port/registry, current one-door run admission and real OS liveness before code. Preserve no expiry, fail-closed behavior, scope, explicit abandon, non-environment holder credential, held-sidecar protection and ref guard. Lead reviews any necessary design amendment under A42. Then a separately scoped implementation slice adds the thin migration-specific lease through existing primitives, writer/admission/merge/ref checks and setup/doctor registration, spec/config-registry entry before code and Unreleased changelog. No new configuration default without registration; no copied lock/liveness implementation. This detailing turn builds nothing and acquires no live lease.
- **Reviewer:** Lead-started independent architecture/code reviewer traces every registered writer and admission path, including fallback and already-running work, checks linked-worktree resolution and main hook location. A main-installed hook/guard dependency needs a separately reviewed early-harvest landing request to the owner; a guard present only on the plan branch is not protection for other worktrees.
- **Proof:** planned implementation tests use `env -u CLAUDE_CODE_SESSION_ID node --test <reviewed-lease-test-paths>` with exact paths/commands fixed in that slice. Rehearse acquire, refusal of a non-holder commit/dispatch/scope merge/ref movement, code-only merge behavior, explicit abandon/release and missing-lock-with-held-sidecar refusal in an external throwaway repo/worktree. Verify dirty worktree/raw-edit drift, changed target tree ids, linked-worktree hook resolution, credential non-disclosure and rollback under a held lease. No production state or local live process is touched to stage proof; all rehearsal writes stay in scratch. Light common proof runs on implementation output; required native tests run alone under the Lead's budget.
- **Stop/parking:** no existing primitive meeting the approved semantics means Lead decision before adding anything; do not resurrect removed TTL locks. Missing main-installed guard, incomplete writer coverage, failed refusal or an undelegated landing action blocks lease readiness, while consumer/evidence preparation continues. **Effort/risk:** one to two days after design revalidation plus review, critical concurrency risk; outside the current write scope and unexecuted. Owner still separately approves main landing and actual cutover, deletion and push.

### Step 7 — Assemble the atomic consumer handoff

- **Inputs:** reviewed Step 1–6b outputs; latest main drift, full edit journal and Phase 9 accounting list; aliases; gate/lease design; A45 legacy lines, gateway seam and P7 carries.
- **Doer outputs:** one consumer cutover matrix and ordered patch specifications, row-level readiness receipts, parked list and rollback ordering. Explicitly include A47's original 35 changed candidate files plus all subsequent changed candidates (including L12-1's thirteen incoming paths), main's PF-I022/PF-I023 reference reconciliation, reading-map entry merge, holder-lock header, P7-DOC-GAP-05/06 and all A34 residuals. No carrying/rebinding or native registry persistence in this preparation step. Phase 9 must compare the final actual changed-file set, not rely on a count from Phase 7. Verify lease prerequisites and main-installed hooks are real before requesting cutover; do not implement or acquire a lease in this turn.
- **Reviewer:** Lead-started independent integration reviewer joins every census row to applied-safe, prepared-for-cutover, preserved-history/fixture or individually parked disposition; no generic “all covered” status. Check writer destinations are never aliases and current routing remains intact.
- **Proof:** repeat full-scope main diff and common light proof; compare protected switchboard/root-instruction hashes; rerun Step 0 tests with recorded dispositions; live evidence `--before` once available. Search every census spelling and dynamic seam again. Planned post-cutover checks are listed separately from pre-cutover passes.
- **Stop/parking:** any unowned reader/writer, unexplained changed file or stale proof prevents readiness. The literal Success Criteria are not claimed green while required behavioral cutover patches remain unapplied. **Effort/risk:** half day, high integration risk.

### Step 8 — Independent checkpoint, red-team and close

- **Inputs:** pinned final consumer matrix, 47 reviewed joins, source/render deltas, parity receipts, manifest/verifier and lease-rehearsal proof, Phase 9 handoff and every L12 decision/open row.
- **Doer outputs:** Phase 8 scorecard mirroring Phase 7: each requirement and success criterion mapped to evidence/verdict, applied vs prepared behavior explicit, suite baseline vs branch residuals separated, owner/Lead decisions and exact carry-forward lists. No new authority claim from file placement. Progress records next concrete action before yielding.
- **Reviewer:** Lead starts one independent closure checkpoint and an independent adversarial red-team with disjoint reports, sized to consumer work (all 47 judgments and all behavioral/writer/alias/evidence exceptions mandatory; mechanical full coverage plus the shared sample for homogeneous prose batches). Pin protected hashes and contract acceptance, not a desired verdict. One bounded re-review after fixes; a changed source digest invalidates only affected judgments, with no carried approval.
- **Proof:** Lead runs `env -u CLAUDE_CODE_SESSION_ID npm test` in its allowed environment, serially with other heavy jobs, plus the scoped commands above, exact changed-path checks, source/render determinism and the complete consumer-remnant search. Do not rerun native sync/global D/E merely to duplicate Phase 9 accounting; if the Lead requires heavy proof, budget and schedule it explicitly. Record real exits and main-vs-branch failure attribution as in the Phase 7 close, never hide a new failure.
- **Stop/parking:** unresolved mandatory judgment, untraced behavioral consumer, missing digest proof or false green blocks close. If the unchanged Success Criteria cannot literally be satisfied before the Phase 9 flip, Lead records that conflict and routes a scoped decision; do not silently weaken criteria or execute the flip. Owner-only landing, push, cutover, deletion or renumbering uses the five-part packet in `reports/phase-08/owner-answers.md` and parks only dependent work. **Effort/risk:** half to one day plus independent review, high false-completion risk.

Execution dependency: `0 → 1 → 3 → 4/5/6/6b → 7 → 8`, with Step 2 read-only census allowed alongside Step 1; Step 3 requires both. A blocked accounting acceptance does not block independent read-only census/judgment analysis. Authoring is serial. Phase 9 remains separately unauthorized.

## Success Criteria

- [ ] repository-wide search finds no reader or writer treating a legacy path as
  current authority;
- [ ] aliases are lookup-only and never writing instructions.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11. Main hazards here are a missed dynamic writer, treating a historical reference as an active instruction, a source/render mismatch in shipped skills, an early authority switch hidden as a link fix, evidence digest/mode loss, and repeated main sync invalidating reviews. Controls are the per-edge matrix, source-based deterministic regeneration, pinned current switchboard routes, parity packets, manifest re-hashing and full identity-scope drift checks. The reproduction audit's 85 target-digest drifts are an explicit current blocker, distinct from the known Phase 9 dead-vocabulary failure. No checker weakening, native carry or scope expansion is a mitigation.

## Prerequisite from the dual pilot (owner, 2026-10-07)

The 47 inbound edges of the work-state sources that the link preview could not map to a document without a judgment (`reports/phase-05/pilot-b-link-judgment-queue.json`) must be worked off before this phase rewrites consumers: an agent proposes the target for each edge, the Lead reviews, and the owner decides only the ambiguous ones. Phase 6 area transformations need the same queue for their own sources.

