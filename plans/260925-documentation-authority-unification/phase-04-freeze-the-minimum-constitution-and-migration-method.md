---
phase: 4
title: "Freeze the minimum constitution and migration method"
status: in-progress
priority: P1
effort: ""
dependencies: [3]
---

# Phase 4: Freeze the minimum constitution and migration method

> Legacy numbering: this was **Phase 03** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `in-progress`. Authorized by the owner on 2026-10-06; the pre-step ran first and is done.
**Mode:** plan branch
**Purpose:** Turn inventory evidence into a small, testable migration contract.

## Pre-step: gate tooling (owner-authorized 2026-10-06; done)

**Why:** the inventory generator cannot run on the branch head. It reads every text file in the tree, including its own ~250 MB of saved output, and runs out of memory; the 2026-10-06 resume worked around it by generating on a temporary commit without those files (17 s).

**0a (done, commit `6397a9970`):** make `scripts/generate-doc-inventory.mjs` skip its own saved output artifacts. Take the artifact paths from the existing artifact definition (`scripts/doc-inventory-artifact.mjs`) instead of repeating a second list. Add a test first (red) in `test/scripts/generate-doc-inventory.test.mjs`: a tree containing a large artifact at the output location must be ignored, and ordinary inputs must still be counted. Acceptance (measured with scripts, method stated): the generator completes on the branch head without removing any file; peak memory and runtime recorded; the claim count on a tree without artifacts is unchanged by the fix (86,085 at the 2026-10-06 sync, `reports/resync-261006/inventory-comparison.json`); the inventory gate checker `scripts/check-doc-inventory-gates.mjs` still exits 0 on the regenerated inventory. This changes which files the generator reads, not what it counts or how it judges.

**0a result (measured on `50639672a`, `/usr/bin/time -v`):** exit 0, 22.7 s, max RSS 1.92 GB; claim rows 86,085 unchanged; files 4,311; gates clean, 1,361 gaps; consumer edges 105,923 against 101,286 at the resync (plan files changed since then, mostly `reports/resync-261006/`, 4,496 edges). Independent read-only review: no findings of medium or higher. Known limit: artifacts that sat at the plan root before the 2026-09-29 move into `reports/` (commit `4d80eaf29`) are not skipped; this matters only on a commit between 2026-09-26 and 2026-09-29.

**0b (done, commit `3809d692c`):** record the cause of the `verify-phase-02` failure and of the two shipped-path inventory tests that were already failing before 2026-10-06 (on `551687021`), each with the command and output; propose a fix as a decision for the owner. The report is `reports/gate-failures-investigation-261006.md`. Owner decisions on 2026-10-06: (1) `verify-phase-02` is frozen, valid only for its approved range, and is not run on later heads; (2) the two shipped-path tests run on a fixture repository (`639456a8d`); (3) `verify-phase-01` is frozen the same way (it passes unmodified on its approved range); the pointer note at the old knowledge-registry plan path is `39e14c5e7`. See `plan.md` §7.4 and §7.5b.

**Rollback:** `git revert` the generator commit; nothing else depends on it.

## Requirements

**Deliverables:**

- minimum machine-readable constitution or equivalent validated schema;
- claim/disposition ledger schema;
- target path rules;
- conflict-resolution procedure;
- conservation checker;
- legacy-path ratchet;
- retirement-check dry-run;
- a minimal platform alias table/resolver contract that covers immutable
  historical paths and is importable into the future multi-profile registry;
- evidence-payload relocation policy and consumer proof;
- migration-specific documentation-cutover lease design; if it introduces a
  persistent file/config/tool dependency, register setup/doctor discovery and a
  changelog entry rather than leaving hidden infrastructure;
- candidate-status metadata/check;
- explicit list of richer fields deferred to the future engine.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

### Execution harness

Type **Decision + Code slice**. See `plan.md` §7.2 (rewritten 2026-10-06; the coordination-session harness of `reports/harness-readiness-2026-09-29.md` is obsolete).
- Owner decision 2026-10-06: doers may be Sonnet subagents dispatched in-process (`node bin/fgos.mjs dispatch decide`, answer `in-process`). The Lead plans, reviews, verifies independently and commits, and reviews every change before each commit. This supersedes "the Lead authors" for script, test and document edits.
- Review is read-only through the door that `node bin/fgos.mjs dispatch decide --for review --needs-soul --has-live-task-access` returns at phase start (`in-process` on 2026-10-06): one review for the documents, one for the gate scripts, at most one re-review each.
- Decision record: Doc review plus `ak:plan red-team` (owner, 2026-10-06; `rfc` and `architecture-advisory` are not finished and are not used).
- Observe is optional: `fgos metrics case open doc-authority-p4 ...` if the owner wants numbers; never a start condition.
- Authorized 2026-10-06.

### Resume inputs (2026-10-06)

Must be handled before the method is frozen (see `plan.md` §7.3-§7.4):
- rerun conservation on the synced tree with identity carry-forward, then disposition the 43 removed and 248 edited claim units listed in `reports/resync-261006/inventory-comparison.json` and the new routing gap `docs/specs/observe.md`;
- carry `dropped-claims-register.json` into the conservation checker so a dropped claim fails the gate;
- `scripts/verify-phase-02.mjs` is frozen (owner decision 2026-10-06): do not repair its paths; build this phase's own gates instead;
- the early move of the legacy-docs ratchet to main is deferred (`plan.md` §7.5b, decision F); keep re-accounting main-side legacy edits at each sync;
- known generator limit: artifacts that sat at the plan root before the 2026-09-29 move into `reports/` are not skipped; matters only when generating on a commit between 2026-09-26 and 2026-09-29.

Already decided (see `plan.md` §7.5b): the standing policy for main-side legacy-root edits and the knowledge-registry plan move.

## Related Code Files

Step 2 files: `minimum-constitution.{json,md}`, `claim-and-disposition-vocabulary.{json,md}`, `claim-ledger.schema.json` (this plan directory), `scripts/check-doc-constitution.mjs`, `test/scripts/check-doc-constitution.test.mjs`. Existing gate scripts: `scripts/check-doc-inventory-gates.mjs`, `scripts/check-legacy-docs-ratchet.mjs`. Later steps add their own paths under Requirements.

## Implementation Steps

Done:

1. Pre-steps 0a and 0b (generator memory fix, gate-failure investigation).
2. Step 1: identity carry-forward, dispositions of the removed and edited units, dropped-claims register in the inventory gates.
3. Step 2 (done, frozen): minimum constitution (`minimum-constitution.{json,md}`), vocabulary version 2, `claim-ledger.schema.json`, `scripts/check-doc-constitution.mjs` with tests. Frozen by the owner on 2026-10-06 (metadata decision (a), evidence-payload kind, reports as history); amendments only as additive 2.x. See `reports/minimum-constitution-261006.md`.

3. Step 3 (done): conservation checker in `scripts/check-doc-inventory-gates.mjs` (claim ids conserved against the sealed registry and the registry committed at HEAD, one owner per semantic claim, dispositions and required targets, retired rows with a disposition, legacy growth through the ratchet, stale-inventory and registry-digest checks; open data reported, fatal with `--strict`/`--cutover`); registry binding to any commit with an identical in-scope tree and `--refresh` (one command) in `scripts/generate-doc-inventory.mjs`.
4. Step 4 (done): alias table, schema, contract and resolver (`alias-table*.json|md`, `scripts/doc-alias-resolver.mjs`); candidate-status check (`scripts/check-doc-candidate-status.mjs`, status from the switchboard only); retirement-check dry run (`scripts/check-doc-retirement.mjs`) and ledger cutover mode (`check-doc-constitution.mjs --cutover`); evidence relocation policy with consumer proof and the cutover write-lease design (design documents, nothing built); deferred list checked, three lessons added (intent ledger PF-I021, constitution `deferredToEngine`).
5. Step 5 (done): `ak:plan red-team` on the Phase 4 deliverables; see the Execution record below.

Not built, by decision of the design documents: the evidence relocation manifest and verifier, and the cutover lease (door, hook guards, doctor check). The retirement dry run reports both as blocked.

## Execution record (steps 3-5, 2026-10-06)

Commits on `plan/260925-documentation-authority-unification` after `01d84f202`: `3a3f54661` (conservation rules, binding, `--refresh`), `79624fdd8` (carried registry and manifest), `021288dc5` (alias resolver, candidate-status check), `ffedbfcbc` (evidence policy, lease design), `3dc8e6566` (retirement dry run, `--cutover` ledger mode), `e979fe4af` (constitution gate wiring, deferrals), `0fc64f249` (review fixes in scripts), `428029088` (review fixes in design documents), `6bb52797e` (registry and manifest after the fixes).

Evidence (2026-10-06, worktree head `6bb52797e`):
- Tests: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs`: 753 tests, 753 pass, 0 fail (counted from the runner summary); focused files `check-doc-conservation` (16), `check-doc-retirement` (28), `doc-alias-resolver` (12), `check-doc-candidate-status` (10), `check-doc-constitution` (63), `generate-doc-inventory` (all) pass.
- Gates: `node scripts/check-doc-inventory-gates.mjs` exit 0 (row set conserved against 2 registries); `--strict` exit 1 with the open data listed; `node scripts/check-legacy-docs-ratchet.mjs` exit 0 (995 legacy files, 24 accounted edits, 1 accounted new file).
- Rebinding: committing the registry and manifest leaves the gates green without a rebind (measured: `--refresh --commit HEAD` after the commit printed "bound; no carry-forward needed"). The carry-forward from `79530b221` to the tree conserved all claim ids (86,273 before, 0 lost) and paired 17 duplicate-digest units that were identity gaps.
- Cutover dry run (`node scripts/check-doc-retirement.mjs`, exit 0; `--cutover` exit 1): 15 checks blocked, 4 pass, 1 owed to human review. Blockers: 1,383 files and 39,584 claim rows unknown-blocking; 86,086 rows unreviewed; 83,751 rows without their own rationale; 2,143 retained rows without a target anchor; 1 vocabulary usage drift (`ambiguous-registry-gap`, no longer emitted after the carry-forward); 972 legacy paths read by history with no alias (alias table empty); 3,853 consumer edges from outside the legacy roots and history; 134 platform documents with no switchboard status (131 excluding evidence payloads), 3 canonical portals missing metadata fields, 2 dead links; 105 of 105 canonical platform documents lack promotion fields; 155 duplicate groups plus 151 semantic-conflict groups open (814 evidence mirrors resolve by deduplication); 1 dropped claim without a reviewed disposition; evidence verifier and cutover lease not built.

## Red Team Review

### Session - 2026-10-06
**Findings:** 29 raw from 3 reviewers, 20 after deduplication (18 accepted, 2 partly rejected). **Severity of the 18 accepted:** 5 Critical, 7 High, 6 Medium. Every Critical and High finding was fixed without an owner decision (scripts in `0fc64f249`, documents in `428029088`).

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Gates and retirement never checked that the inventory describes the current tree or that the registry on disk is the one it was generated from | Critical | Accept | `validateInventoryFreshness` in the gates; retirement runs the gates |
| 2 | Row-set conservation compared only with the first-generation registry (501 later ids unprotected); refresh overwrote before comparing | Critical | Accept | also compared with the registry committed at HEAD; refresh refuses to lose an id |
| 3 | Aliases for one anchor counted as covering the document; chains keyed by bare path | Critical | Accept | retirement coverage needs a bare-path alias; chains keyed by full path |
| 4 | `immutableRefEdges` are id co-mentions, not path references; real history references are consumer edges | Critical | Accept | coverage computed from history consumer edges |
| 5 | Lease dispatch gate rested on `bind()`, which `decide` and the hook never call and which falls back to inline work | Critical | Accept | lease design corrected; limit stated |
| 6 | Strict and cutover modes silently skipped missing inputs; retirement swallowed an explicit missing path | High | Accept | strict refuses to run without them; explicit paths are errors |
| 7 | Missing disposition fatal only for live rows | High | Accept (partly) | retired rows without a disposition are fatal; open gap rows stay open data |
| 8 | Cutover requires an anchor that the inventory gate rejects | High | Accept | anchor verified against the target document |
| 9 | Cutover exit 0 with review checks open; dropped gate silently disappears; evidence check passes on file existence | High | Accept | review needs a record; dropped gates and the evidence check block |
| 10 | Lease: any TTL-passing caller deletes the record; commit hook bypasses; identity spoofing; acquire race; vanished lock | High | Accept | design corrected, decisions 8-10 added for the owner |
| 11 | Cutover check could not pass before step 6 (815 payload mirror duplicate groups) | High | Accept | mirrors excluded from the conflict count |
| 12 | Duplicate-owner rule only for byte-identical files | Critical (reviewer) | Accept (modified) | identical-unit owners reported as open data; the constitution's `semanticClaimId` rule is unchanged |
| 13 | Metadata evaluator counted exempt evidence payloads; no placement check; second switchboard resolver | Medium | Accept | evidence payloads excluded; placement and route conflicts added; generator index reused |
| 14 | Alias contract cannot express split; anchors unchecked; CLI skipped owner checks | Medium | Accept | split needs an anchor; anchors checked; CLI passes the repo root |
| 15 | Wrong counts in the evidence policy; policy schedule contradicted the commit | Medium | Accept | counts corrected with method; verifier deferred to cutover preparation |
| 16 | Lease scope named a switchboard JSON that is under `plans/` | Medium | Accept | named explicitly |
| 17 | Plan reference in a code comment | Medium | Accept | removed; the extra check is labelled migration acceptance |
| 18 | Ratchet roots, untracked files and dynamic consumer edges are blind spots | Medium | Accept (partly) | dynamic edges are counted in the measure; the ratchet roots stay as decided in the containment phase (owner question) |
| 19 | Constitution edited after the freeze | Medium | Reject (partly) | wiring changes no rule text and the three deferrals are additive recorded exceptions under the frozen amendment rule; listed for owner confirmation |
| 20 | `--refresh` hint turns a "shards missing" message into a registry rewrite | Medium | Reject | refresh rewrites the registry only when the in-scope tree differs, where a plain regeneration would fail anyway (test: bound registry is not rewritten) |

### Whole-Plan Consistency Sweep
Searched `plan.md` and every `phase-*.md` for the superseded terms (`<commit>` placeholder, "planned" gate checks, `uncoveredImmutableTargets`, "bind() reaches every caller"): none remain outside this record. `plan.md` section 7.1 row 4 and section 7.5b are updated below. Unresolved contradictions: none.

## Success Criteria

- [x] constitution, vocabulary, row schema and validator exist and pass on the full ledger (step 2)
- [x] the method can reject duplicate owners, missing dispositions, missing targets,
  and unauthorized legacy growth mechanically. Evidence: one test per rejection in `test/scripts/check-doc-conservation.test.mjs` (lost claim id, two owners on one semantic claim, missing or unknown disposition, missing required target owner, legacy growth through the ratchet, stale inventory, lost previous id through the CLI); `check-doc-retirement.test.mjs` proves a blocked check per defect.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
