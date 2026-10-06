# Minimum Constitution, Ledger Schema And Validator: Design Report

Date: 2026-10-06. Scope: step 2 of Phase 4. Nothing is staged or committed.

## 1. Files

| File | State |
|---|---|
| `claim-and-disposition-vocabulary.{json,md}` | version 2 (modified) |
| `minimum-constitution.{json,md}` | new |
| `claim-ledger.schema.json` | new |
| `scripts/check-doc-constitution.mjs` | new |
| `test/scripts/check-doc-constitution.test.mjs` | new, 32 tests |

All plan files are under `plans/260925-documentation-authority-unification/`.

## 2. Design Choices And Evidence

- **Evolve the vocabulary, no parallel system.** Version 1 meanings and entries are kept; version 2 adds sections and records seven changes with evidence in `changesFromV1`.
- **`unclassified` claim kind added.** 10,826 ledger rows and 4,252 of 4,311 files emit it. `check-doc-inventory-gates.mjs` adds it by hand (`claimKinds.add('unclassified')`).
- **`unclassified` file class added.** 14 files emit it (`docs/templates/**` 11, `docs/architecture-manifest.json`, `docs/doc-registry.json`, `docs/user/README.md`). Version 1 allowed no disposition for it, so `unknown-blocking` now allows it and the file class carries `allowedDispositions: [unknown-blocking]`.
- **Ledger value sets defined.** The inventory emits authority kinds (5), claim statuses (3), review statuses (2), corpora (4), relation types (1) and identity statuses (2). Version 1 defined none of them. Generator-only values were read from `generate-doc-inventory.mjs` and flagged `generator-only`.
- **Unused values flagged, not removed.** Ten of 16 dispositions are used by no item and no row; they are marked `reserved`. `reviewed` is a reserved terminal review status; `needs-review` is registry-only (122 registry units).
- **Counting error corrected.** Version 1 said 14 ledger fields; its list has 15.
- **Constitution reuses `doc-governance.md`.** Document types, placement map, conflict precedence and typed relationships are encoded, not rewritten. 20 document kinds: the 15 governance types plus five the evidence needed (`platform-portal`, `collection-index`, `reading-map`, `platform-foundations`, `redirect-stub`).
- **Prior art.** `git log -S'constitution'` found only plan, proposal and report text; no code or schema. The archived knowledge-registry plan has a profile schema only for the Diataxis knowledge profile (`role`, `framework`, `mode`). Reused: its invariant `activeDoc(topic, role) <= 1` as the singleton rule, and its lifecycle names (reserved for later). Missing and new: platform placement, cardinality per scope, gates.
- **Observed `Document type:` values.** 94 files, 45 distinct values: 35 mapped to kinds (83 files), 10 left unmapped on purpose (Roadmap, Implementation plan, Migration plan, Architecture design, Governance, Governance guide, Documentation portal, User docs portal, Transitional switchboard, and the unfilled `<type>` placeholder in `docs/architect/agent-coordination/documentation-governance.md`).
- **Required metadata is the six-field core, not twelve.** Measured by script over `docs/platform/**`: 72 headered documents all carry Document type, Audience, Purpose, Design status, Last reviewed, Related. Only 13 carry all twelve fields of governance §5. Two of the three promoted area portals carry six. This follows the instruction to match promoted portals and avoid heavy metadata.
- **Schema holds no enums.** Vocabulary-bound fields carry `x-vocabulary`; the vocabulary is the single place values live. Fields §6.2 requires are marked `x-plan62` and the validator checks the marking against the vocabulary list.
- **Validator reuses** `loadShardedJsonArtifact`, `isMainModule`, and the inventory path constants. It implements only the JSON Schema subset the schema uses (no `ajv` in the repository).
- **Policy.** Structural breakage is fatal. Invalid ledger rows are reported with counts per reason, not fatal, because rows awaiting owner, kind or review are valid data. `--strict-rows` makes invalid rows and undefined item values fatal. Empty §6.2 fields are counted as gaps.

## 3. Gaps Against Plan §6.2 (Not Faked)

Measured on the regenerated ledger (86,085 rows):

| Field | Empty rows | Filled by |
|---|---:|---|
| `targetOwner` | 83,856 | Target assignment in the pilot and transformation steps |
| `targetAnchor` | 85,999 | Transformation of each area (only the three promoted portals carry it) |
| `claimKind` is `unclassified` | 10,826 | Classification in the pilot and transformation steps |
| `reviewStatus` is not `reviewed` | 86,085 | Independent review steps |
| `relations` typed beyond duplicates | all but `duplicate-content-member` | Cross-area review |

## 4. Results

Method: inventory regenerated into the scratch directory at commit `79530b22149de0decb4dfd389d2f018e8ed9d8e3` (the commit the identity registry binds to; generating at the branch head is refused) with `scripts/generate-doc-inventory.mjs`, 86,085 rows, 4,311 items.

| Command | Result |
|---|---|
| `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/check-doc-constitution.test.mjs` | 32 pass, 0 fail |
| `node scripts/check-doc-constitution.mjs --no-ledger` | exit 0; 16 dispositions, 12 claim kinds, 20 document kinds, 13 deferred items |
| `node scripts/check-doc-constitution.mjs --inventory <scratch>` | exit 0; rows 86,085, valid 86,085, invalid 0; items 4,311, undefined values 0; 3.2 s, 1.2 GB peak |
| same with `--strict-rows` | exit 0 |
| `node scripts/check-doc-inventory-gates.mjs --inventory <scratch>` with the version 2 vocabulary | exit 0; 1,071 gaps, 818 duplicate groups, 151 semantic-conflict groups unchanged |
| `node scripts/check-legacy-docs-ratchet.mjs` | exit 0 |
| `node bin/fgos.mjs tool query --capability impact-analysis --status present` | 0 providers; impact-analysis inactive |

Without shards the default command exits 1 and prints the regenerate command, like the gates checker; use `--no-ledger` to check only the constitution files.

## 5. Notes On Method

- The version 2 vocabulary JSON was built from the committed version 1 (`git show HEAD:`) by a scratch script. Early on I ran one file-level `git checkout --` on that one file, which I own, to restore the version 1 input after an overwrite. No branch operation, no other file touched.
- No existing script or test was changed. `check-doc-inventory-gates.mjs` still keeps private copies (`claimKinds.add('unclassified')`, a four-class list); they are redundant now but harmless.

## 6. Open Questions For The Lead

1. **Metadata level.** `doc-governance.md` §5 says twelve fields are the required baseline; evidence supports six. Keep six as required and the rest recommended (what the constitution does now), or require twelve and amend the three promoted portals later?
2. **Ten unmapped document types.** The constitution lists them; each area transformation should assign a kind. Is that acceptable, or should the owner decide the Roadmap, Implementation plan and Governance cases now?
3. **Discussion scratchpad placement.** Governance names no home; the constitution uses `docs/history/<feature>/DISCUSSION.md` (what the shaping skill uses). Confirm.
4. **Deferred items in the platform intent ledger.** Plan §3 item 12 wants each deferral recorded in `docs/platform/intent-preservation-ledger.md`. That edits a promoted document, which this step may not do. The 13 items with triggers are in `minimum-constitution.json`.
5. **`docs/templates/**` and `docs/user/README.md`.** 12 files are `unclassified`. The constitution does not place templates (deferred with templates and sections). Which area owns them?
6. **Placement conformance.** The validator checks the constitution, not that existing files follow it. A conformance check of `docs/platform/**` paths against the placement patterns belongs with the candidate-status check.

## 7. Red-Team Fixes

Applied after `reports/red-team-minimum-constitution-261006.md`, tests first.

| Finding | Change |
|---|---|
| C1 rationale | Schema has optional `rationale`; the validator requires one for the nine dispositions with `requiresRationale`, and accepts the rationale of the row's inventory item (every item has one). Fatal only under `--strict-rows`, otherwise counted as invalid. The extra red-team rule for current claims dropped as obsolete was not applied (not in the Lead decision). |
| H1 placement | The promoted areas' subdirectories are admitted: `playbooks` (guide-runbook), `roadmap`, `vocabulary`, `reports` (verification), nested verification, subcomponent variants of architecture, contract, decision, verification, history. Added kinds `vocabulary`, `roadmap`, `rollout-plan`; 23 kinds. `redirect-stub` is identified by the header marker `Document type: Redirect`. Precedence: marker, then fewest `**`, then fewest placeholders; ties are errors; five platform-wide collection directories are reserved from area names. `--check-placement` result: 440 Markdown files under `docs/platform/**`, 439 match exactly one kind, 0 ambiguous, 1 recorded exception. |
| H2 owners | `targetOwner` must be null or a path under `docs/platform/**` that classifies to a kind; `reviewed` is invalid on an `unknown-blocking` row or an `unclassified` kind. One-owner-per-`semanticClaimId` is a retirement-gate requirement for the conservation checker, not built. |
| H3 candidate marker | Candidate or promoted status comes from the switchboard `authorityStatus`; `Design status` text is descriptive only. Metadata level untouched; the six-versus-twelve question is still open for the owner. |
| H4 | Item-level check that each disposition allows its file class (`--strict-rows` fatal). The dropped-claims register is already validated by `check-doc-inventory-gates.mjs` (`validateDroppedClaims`, commit `6d099c8c8`), and the 43 removed and 248 edited units were dispositioned in step 1 (registry retired rows and `needs-review` markers, commits `79530b221`, `9fcd0c2a4`); the red team missed both. Row-set conservation against the previous registry is a conservation-checker requirement (retirement gate `row-set-conserved`). |
| M1 | Vocabulary and constitution status is "Proposed (freeze pending owner)"; `amendmentRule` and `amendments` (additive 2.x by recorded exception, major version pinned). |
| M2 | Entries that encode governance carry `governanceRef`; the validator checks each heading exists in `docs/doc-governance.md`. |
| M3 | Retirement gate records `cutover-mode` (validator `--cutover`) for the retirement-check dry-run; no code. |
| M4 | PF-I011 to PF-I020 added to `docs/platform/intent-preservation-ledger.md` in its row format; the four deferrals already covered cross-reference PF-I007 to PF-I010. |
| Low | Phase 4 file steps and success criteria updated; `plan.md` §7.1 row 4 updated; counts in the constitution page marked with their measurement commit. |

### 7.1. H1 leftovers for the Lead

One path matches no kind: `docs/platform/migration-authoring-rules.md` (temporary migration rules, retired at the cutover). It is recorded in `placementExceptions` with that reason, so the check passes; say if it should get a permanent kind instead.

### 7.2. Results

| Command | Result |
|---|---|
| `node --test test/scripts/check-doc-constitution.test.mjs` | 47 pass |
| validator on scratch inventory, normal | exit 0; 86,085 rows valid, 0 invalid; 4,311 items, 0 undefined values; placement 440 files, 0 leftover, 0 ambiguous |
| same with `--strict-rows --check-placement` | exit 0 |
| `check-doc-inventory-gates.mjs`, `check-legacy-docs-ratchet.mjs` | exit 0 |

## 8. Metadata Decision (a)

Owner decision 2026-10-06, implemented: candidate material needs six fields (`candidateCore`); promotion and every canonical document at the cutover need the governance §5 baseline plus `Supersedes` and `Superseded by` (`promotionFields`). The baseline is derived from `docs/doc-governance.md` by the validator (`governanceBaselineFields`), not copied; the constitution references it with `governanceRef`. The retirement gate gained `reviewed-rationale` (a row reviewed at cutover carries its own rationale) and `canonical-metadata-complete`. Open question 1 of section 6 is closed.

Promotion report (`--no-ledger --promotion`, report only, never fatal, measured on the plan branch):

| Measure | Count |
|---|---:|
| Canonical Markdown documents under `docs/platform/**` | 408 |
| Headerless (mostly verification proofs) | 352 |
| Headered | 56 |
| Headered and missing some promotion field | 56 |
| Complete | 0 |
| Missing `Supersedes` and `Superseded by` | 408 |
| Missing `Canonical for` and the other five governance extras | 403 (5 carry them) |

The Lead's estimate was about 59 of 72 headered documents; the difference is the supersession fields, which no document carries, and that the 72 include non-canonical kinds (history, proposals, roadmaps). Gaps are filled in Phase 6.

Results: 52 tests pass in the file (671 earlier across `test/scripts`; re-run below); validator normal, `--strict-rows`, `--check-placement` and `--promotion` exit 0; ratchet exit 0.

## 9. Evidence Payloads Are Not A Canonical Kind

Lead decision (plan §3 item 10: evidence is not authority). New kind `evidence-payload` (24 kinds now): not canonical, `metadataExempt`, owned by the nearest `verification/README.md` of the area. Patterns: `docs/platform/verification/<collection>/**`, `<A>verification/<collection>/**`, `<S>verification/<collection>/**`, i.e. anything nested below a `verification` directory; top-level files of `verification/` stay `verification` (canonical). Classification is by location, never by missing header. The pattern tie-break now prefers more path segments (after fewer `**`), so the nested pattern beats `verification/**`. The validator rejects an exempt kind that is canonical or has no owner rule, and `--check-placement` lists evidence whose verification README is missing (0 now).

Measured on the plan branch:

| Check | Result |
|---|---|
| `--check-placement` | 440 files, 439 exactly one kind, 0 leftover, 0 ambiguous, 0 evidence without index, 1 recorded exception |
| Evidence payloads (exempt) | 302 |
| Canonical documents | 106 (was 408) |
| Canonical headerless | 50 |
| Canonical headered, all with missing fields | 56 |
| Complete | 0 |
| Missing `Supersedes` / `Superseded by` | 106 / 106 |
| Missing `Canonical for` and the five other baseline extras | 101 (5 carry them) |
| Missing the six candidate fields | 50 |

Headerless files the evidence rule did not classify (all canonical kinds, so correctly shown as missing metadata; all in agent-coordination, none are proofs): architecture 14, decisions 12, playbooks 9, contracts 5, vocabulary 4, and one each of `history/README.md`, `intent-preservation-ledger.md`, `proposals/README.md`, `roadmap/README.md`, `verification/README.md`, `vision.md`. The only one under `verification/` is the area's own `README.md`, the index that owns the evidence. Use `--promotion --json` for the full path list.

Results: 56 tests pass in the file; all `test/scripts` tests, validator (normal, `--strict-rows`, `--check-placement`, `--promotion`), gates and ratchet re-run below.

Status: DONE
Summary: Proof payloads are an exempt evidence kind assigned by location; every area's verification README stays canonical and now stands out as headerless. Canonical documents drop from 408 to 106 and the placement check still classifies all 440 files.
