# Red Team: Minimum Constitution, Vocabulary v2, Row Schema, Validator

Date: 2026-10-06. Read-only review (no plan or code edits). Scope: step 2 artifacts of Phase 4 against plan §1, §3, §6, §10, §11.

Method: read all step-2 files and `docs/doc-governance.md`; probed `createRowValidator` (exported from `scripts/check-doc-constitution.mjs`) with synthetic rows built from the committed schema and vocabulary; matched every `git ls-files 'docs/platform/**'` `.md` file (440) against the constitution's placement patterns (`<x>` as one path segment) with a script; grepped for validator consumers. Probe results below are output of those runs.

## Verdict

**Freeze after fixes.** The structure is sound and small, and no engine scope leaks as code. But three things cannot be frozen as they are: the row schema cannot carry a rationale that nine dispositions require; the placement rules do not describe the promoted areas that already exist; and the row validator accepts ledger rows that violate the one-owner and no-silent-drop intent. Fixes are cheap now and costly after Phases 5-6 build on v2.

## Critical

### C1. Schema cannot hold the rationale that 9 dispositions require
- Evidence: vocabulary `requiresRationale: true` for retain-as-evidence, reclassify-out-of-platform-scope, supersede, archive-with-reason, delete-as-duplicate, delete-as-obsolete, defer-with-owner, reject-with-rationale, unknown-blocking. `claim-ledger.schema.json` has `additionalProperties: false` and no rationale field. `createRowValidator` enforces only `requiresTargetOwner` (`check-doc-constitution.mjs`, end of `validateRow`). Probe: a row with extra `rationale` returns `unexpected-property:rationale`; a `delete-as-obsolete` row with `targetOwner: null`, `claimKind: contract`, `authorityKind: legacy-current`, `status: current`, `reviewStatus: reviewed` returns `[]` (valid).
- Failure: a current contract is dropped as obsolete with no recorded reason and the validator, even with `--strict-rows`, accepts it. The only way to keep a rationale is to violate the frozen schema, so Phases 5-6 will either lose rationale or amend a "frozen" schema.
- Fix: add optional `rationale` (string, minLength 1) and `defersTo` (owner/phase) to the schema now; enforce `requiresRationale` in `createRowValidator`; add a rule that `delete-as-obsolete`/`delete-as-duplicate` is not allowed for `status: current` with `authorityKind` in legacy-current/promoted unless `rationale` plus a decision ref is present.

## High

### H1. Placement rules do not describe the promoted areas (and some patterns are ambiguous)
- Evidence (script): 440 `.md` files under `docs/platform/**`; 332 match no placement pattern. By area: agent-coordination 330 (`verification/<collection>/...` nesting 100+ files for `architecture-advisory-panel` alone; `playbooks/`, `playbooks/prompts/`, `roadmap/`, `roadmap/<x>/`, `vocabulary/`, `history/<x>/`, `reports/`), packaging-distribution 1 (`code-panel-rollout-plan.md`), platform root 1 (`migration-authoring-rules.md`). Every `<collection>/<name>.md` pattern is one segment deep; directory-style patterns (`docs/platform/history/`, `docs/history/<feature>/`) match no file at all.
- Evidence (script): files matching more than one kind: `<area>/README.md` = area-portal and redirect-stub; `<area>/spec.md`, `vision.md`, `intent-preservation-ledger.md` = their kind and redirect-stub (`canonical: no`); every `<collection>/README.md` = collection-index and the collection's own kind; `subcomponents/README.md` matches collection-index twice. Governance has `operations/`; agent-coordination uses `playbooks/`; the constitution places subcomponent portal and spec only, while governance §9 gives subcomponents `architecture/`, `contracts/`, `decisions/`, `verification/`, `history/`.
- Failure: "Maintained platform authority lives under docs/platform/**; each kind lives only at its patterns" is false for the largest promoted area, and nothing says whether the area is renamed at cutover or the constitution grows. A doc can be classified canonical or non-canonical depending on which pattern wins, which is exactly the "claim ends with two owners or none" the constitution exists to prevent. Phase 5 pilots will hit this first.
- Fix: (a) add nesting rule (`**` under verification/history/proposals/roadmap) and subcomponent variants of contract/decision/verification/history; (b) resolve overlaps with a precedence rule (most specific kind wins; `redirect-stub` only by header marker, not by path); (c) decide and record `playbooks` vs `operations`, `roadmap`, `vocabulary`, `reports`, and the two unmapped plan/roadmap types, either as kinds or as a recorded exception list; (d) add the placement conformance check the report defers (its open question 6), at least as a dry run over `docs/platform/**` that reports the exception list, before freeze.

### H2. Row validator does not enforce one owner; owner is any string
- Evidence (probe): `disposition: promote` with `targetOwner: "docs/specs/y.md"` (legacy root) returns `[]`; with `targetOwner: "foo"` returns `[]`; `claimKind: unclassified` + `promote` + `reviewStatus: reviewed` returns `[]`; `unknown-blocking` + `reviewed` returns `[]`; `retain-as-evidence` on a `normative-law` claim returns `[]`. `summarizeLedger` checks only `claimId` uniqueness (`seenIds`); rows sharing a `semanticClaimId` (818 duplicate groups) are not compared, so two different `targetOwner`s for one semantic claim pass.
- Failure: a promoted legacy path, a nonexistent path, or two owners for one duplicate content group is "valid". The existing `check-doc-inventory-gates.mjs` has switchboard-backed owner checks (lines ~271-278), but it is a separate gate over items and the constitution's promotion gate does not require row-level checks from this validator.
- Fix: validate `targetOwner` against the constitution (under `docs/platform/**`, matches a placement pattern, not a legacy root, kind able to serve `claimKind`); add checks: one distinct owner per `semanticClaimId`; `reviewed` forbids `unknown-blocking`/`blocking` and `claimKind: unclassified`; `unknown-blocking` forbids targetOwner. Make these "cutover-mode" fatal (see M3) if they cannot be fatal now.

### H3. Six required metadata fields contradict accepted governance; candidate marker contradicts promoted docs
- Evidence: `docs/doc-governance.md` §5 "Required baseline" lists twelve fields and is `Design status: Accepted`; the constitution (md §3) says it "is the machine-checkable form" of governance yet requires six and demotes the rest to "recommended". Report open question 1 is unresolved. `Design status` in promoted docs: `host-invocation-routing/{README,spec,vision}.md`, `packaging-distribution/{README,spec,vision}.md`, `agent-coordination/spec.md` = Draft; the constitution says a document marked Draft/Proposed/Candidate is a candidate and "only the cutover changes it".
- Failure: (1) two authorities for required metadata, no precedence rule, so the "candidate-status metadata check" will either reject twelve-field governance or ignore it. (2) The planned check treats promoted portals as candidates (they say Draft) while the switchboard says promoted; the marker is not an authority signal and will mislead any check that reads it. (3) The six fields lack what the cutover needs (§10): `Canonical for` (only recommended) is the sole machine-readable owner scope for the one-owner and singleton rules; no `Supersedes`/`Superseded by` (a `supersede` disposition has no document-side field); nothing records implementation alignment ("verification requirements").
- Fix: record an explicit decision (not an open question) that six is the migration-time floor and governance §5 stays the post-cutover target, amending governance or adding the exception to it in the same freeze; promote `Canonical for` into the required set (check how many of the 72 carry it) or define the owner scope another way; say that switchboard authority status, not `Design status`, decides promoted vs candidate, and define how the candidate check reads both.

### H4. Dropped-claim and removed-claim paths are not covered by anything that exists
- Evidence: `dropped-claims-register.json` has no schema and no validator; the gate is `planned: conservation checker`. `summarizeItems` checks only that each item value is in a vocabulary set (`ITEM_VOCABULARY_FIELDS`); it does not check `fileClass` x `proposedDisposition` against `allowedFileClasses` (an `unclassified` file with `promote` passes). Nothing compares the current row set to the previous ledger, so a row that simply vanishes is invisible. The constitution does not mention the 43 removed and 248 edited units from the resync (plan §7.4, owed before the method is frozen per phase-04 "Resume inputs").
- Failure: a legacy claim can be dropped by removing its row, by re-dispositioning it to a no-owner disposition (C1), or by editing a source so its identity is not carried forward, and none of the step-2 checks notice. The "can the method reject missing dispositions" success criterion of phase 4 is not demonstrated for the three drop routes.
- Fix: before freeze, add (a) item-level file class x disposition check using the existing `allowedFileClasses`; (b) the register's schema and a check that each entry has a dispositioned row; (c) a row-set conservation check against the carried-forward registry (every previous claim identity is present or has a recorded removal with rationale); (d) either do the 43/248 disposition now or write it into the freeze as a named, owned blocker with a gate.

## Medium

### M1. "Frozen v2" has no amendment rule and is labelled Accepted before this review
- Evidence: vocabulary md and json say "Accepted (frozen in Phase 4)"; constitution pins `vocabulary.version === 2` (`vocabulary-version-mismatch`); `grep amend|unfreez|v3` finds no amendment procedure; plan §6.3 says inventory "may extend [the vocabulary] only by recorded exception"; phase-04 / plan §7.2 say findings go to the owner "before anything is frozen".
- Failure: Phases 5-6 will need values (a claim kind for roadmap/playbook content, a reviewed-by field, kinds from H1). Without a rule they either edit a frozen file silently or block. Freezing is not what blocks them; the absence of a defined additive path is.
- Fix: keep v2 frozen for existing meanings, define additive amendments (v2.1...) by recorded exception with evidence, validator re-run and constitution pin as a range or major version; change the status text to "Proposed (freeze pending owner)" until the Lead freezes.

### M2. Near-manifest scope and a second copy of governance with no sync check
- Evidence: `minimum-constitution.json` carries 20 document kinds with `typeName`, `claimKinds`, `cardinality`, `canonical`, placements, plus 35 `documentTypeAliases`, `corpusPlacement`, `reuses`. Deferred item 1 is "doc-types.yaml manifest". Governance §2/§3 holds the same placement map and types in prose; no check ties them.
- Failure: this is in practice a doc-types manifest and a second source for placement. It will drift from governance (H1 shows it already differs: `operations/`, nested paths) and the engine inherits a manifest nobody owns. Not engine code, so not a hard violation of plan §3.7.
- Fix: state in the constitution that governance prose is the human source and the JSON is a generated-or-checked projection; add a check that every governance §2 path is covered by a placement; drop `reuses` narrative from the data file (keep it in the md); keep `typeName` aliases only for types the inventory observed.

### M3. Non-fatal invalid-row policy is a hole in practice
- Evidence: default `runCli` returns 0 with invalid rows; `--strict-rows` is the only escalation and no phase or gate names it. The validator is referenced by no `package.json` script, workflow, or verify script (`grep -rl check-doc-constitution` returns only its own test, the plan documents and the report; `ci.yml` and `package.json` mention neither it nor the inventory gates checker). `usageDrift` and the §6.2 `gaps` counts never affect the exit code, even under `--strict-rows`. Today 86,085/86,085 rows are valid, so nothing is hidden yet.
- Failure: at cutover the ledger can pass with every row owner-less and unreviewed, because "empty is data". Nothing converts "data to fill" into "blocking" when the phase that should fill it ends.
- Fix: add a `--cutover` mode (retained claims need owner, anchor, classified kind, reviewed; `usageDrift` fatal) and name it in the promotion/retirement gates; wire the default mode into the phase verify script the way the inventory gates are; name which step first runs `--strict-rows`.

### M4. Deferrals: some have no owner, others are not recorded where §3.12 requires
- Evidence: plan §3 item 12 says deferred architecture is recorded with a revisit trigger "in the intent-preservation ledger"; constitution §9 leaves that edit to the owner (promoted doc). Triggers like "The engine event model is designed" and "The platform-docs registry profile is designed" name no owner or plan. Ten unmapped document types and the unclassified files (`docs/templates/**` 11, `docs/user/README.md`, two registry JSONs) have no revisit trigger; the report says "each area transformation should assign".
- Failure: deferral without owner is the "scope reduction by omission" §3.12 forbids; unmapped types will reappear as unknown-blocking at Phase 9.
- Fix: write the 13 entries into `docs/platform/intent-preservation-ledger.md` in the step that freezes (owner approval is one question, not an open item); give each unmapped type and the templates/user files an owning phase and a gate (e.g. Phase 5 pilot must map any type it touches; Phase 7 asserts zero unmapped).

## Low

### L1. Stale or premature text
- `phase-04-*.md`: "Implementation Steps: To be detailed", "Related Code Files: Determined when authorized" although the phase is in progress and step 1 and 2 exist; success criterion still unchecked. Fix: list steps done (pre-step, carry-forward, constitution) and remaining (conservation checker, alias table, retirement dry-run, lease, metadata check).
- `plan.md` §7.1 row 4 says "Constitution ... remain open"; accurate only while uncommitted. Update at commit.
- `minimum-constitution.md` §2.1 and report quote 94 files / 45 values / 10 unmapped; if the inventory moves, these go stale; they are evidence, not rule. Mark as "measured at <commit>".

### L2. Claim-kind to document-kind mapping is never applied to rows
`validateConstitution` checks every claim kind is served by some document kind, but no check ties a row's `claimKind` to its `targetOwner` kind (a `contract` claim owned by a `history` document passes). Covered by the H2 fix.

### L3. Directory-style placements
`docs/platform/history/`, `docs/platform/<area>/history/`, `docs/history/<feature>/` are directory patterns while others are file patterns; the validator treats all as plain strings. Covered by H1(a).

## Answers To The Attack Questions

| Question | Answer |
|---|---|
| Two owners or none? | Possible. Owner is a free string; semantic-duplicate groups are not compared; placement and kind are not checked on rows (H2); placement patterns overlap (H1). |
| Legacy claim dropped unnoticed? | Yes by three routes: no-rationale obsolete/duplicate disposition (C1), vanished row (H4), identity not carried (H4). Register has no checker. |
| Third system or engine scope? | Not code. The JSON is a near doc-types manifest duplicating governance prose with no sync check (M2). |
| Consistent with promoted areas and governance? | No: 332/440 existing files do not match; `operations` vs `playbooks`; six vs twelve fields (H1, H3). |
| Six fields enough for §10? | No: no owner-scope field required, no supersession fields, candidate marker unreliable (H3). |
| Deferred without trigger? | Triggers exist for 13 items but without owners; unmapped types and templates have none (M4). |
| Non-fatal policy a hole? | Yes at cutover; nothing flips "empty" to "blocking" and nothing runs the validator (M3). |
| Does freezing v2 block Phases 5-6? | Not by itself; the missing amendment path does (M1). |
| Contradiction with shipped path conventions (§3.11)? | None found: placements are `docs/**` only, `domains/`, skills and `plans/` excluded, no consumer-project path imposed. |
| Stale text vs committed state? | L1. |

## Unresolved Questions

1. Does the owner want governance §5 amended to six fields now (H3), or six as a migration floor with twelve kept as the post-cutover target?
2. Are agent-coordination `playbooks/`, `roadmap/`, `vocabulary/`, `reports/` renamed at cutover or admitted as kinds (H1)? This decides several hundred paths.
3. Is the 43 removed / 248 edited disposition done before the freeze (H4 d) or carried as an owned blocker?
