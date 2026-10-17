# A38 bounded re-review: Steps 3-4 rework

Reviewer: reviewer:claude-session:a4954387@2026-10-17
Author session: as named in the request (Lead session; I authored none of the rows or edits)
Review mode: ordinary
Request commit: df3626178 (worktree detached at df3626178, read-only; base for deltas 18f1ddfaa)

Light read-only commands only (sed, rg/grep, jq, sha256sum, git diff/grep). No fgOS CLI, no tests, no writes.

## Pin check

All 6 input pins and all 5 candidate-file pins match the request's SHA-256 values exactly.

## Verdicts

| # | Entry | Verdict | Note |
|---|---|---|---|
| 1 | S3-01 | ok | contractId null, status `historical-deferred-Step-5`, owner "Step 5 visible superseded-label correction". Evidence: `runPattern` (`src/runner/execution/patterns/index.mjs:34-46`) has only solo/reviewed/panel cases, no cognition producer. Nothing is edited here; `S3-01 -> Step 5` is in `documentationFollowUp`. |
| 2 | S3-02 | ok | CTR012, version null, "current payload has no version field". Citations match code: `definition.mjs:241-253` (normalizeOperation, duplicate-op-id refusal), `steps.mjs:57-85` (taskSpecForStep), `run.mjs:555-580` (no-taskSpec / unresolved-file refusal), `assignment.mjs:270-280` (Assignment copy). The contract doc and the CTR012 registry row agree. |
| 3 | S3-04 | ok | CTR013, version null. The `contractPolicyVersion`/`normalizerVersion` stamps (`assignment.mjs:443-444,626-628`) are named as non-substitutes. `compileDispatchPlan` is at `plan.mjs:56`, and `assignment-run.v2` is at `assignment-runner.mjs:1570-1572`. DispatchPlan keeps no separate id. |
| 4 | S3-09 | ok | Status `compatible-covered-no-new-id`, ids CTR001+CTR002+run-result(S3-08). The `fanout-batch.mjs` attribution is gone from the row and the .md says so. `src/runner/loop.mjs:103,1011-1030` and `src/workflow/runner.mjs:83-97,164-166` do use `runOutcome`/`runResult`. The mapping gap is queued as `P7-DOC-GAP-01` in `documentationFollowUp`. |
| 5 | S3-13 | ok | `src/runner/dispatch/config.mjs:395` is the "Shape-check one executor block ({command, args[], adapter?})" comment. CTR009 / `executor.v1` unchanged. |
| 6 | S3-14 | ok | CTR011. Version reads "confinement-authority.v1 (documentation-only registry label)". `rg 'confinement-authority\.v1' src apps bin` returns nothing, so the label-only claim is true. Code stamps are `confinement-policy.v1`, `confinement-plan.v1` and `confinement-attestation.v1` (`policies.mjs:6`, `authority.mjs:772`, `attestation-store.mjs:21`). The cited contract doc exists. |
| 7 | S3-15 | ok | CTR010 / `fgos-gateway.v1`. The architecture-map now has the Gateway row (line 455) pointing at the OpenAPI under `docs/platform/herdr-web-dashboard/contracts/`. Shipped references are unchanged: gateway.rs:3 `CTR010`, both YAMLs `x-contract: "CTR010 ..."`, `component-boundary.md:73`. `git diff 18f1ddfaa df3626178 -- apps src bin docs/contracts` is empty. |
| 8 | X-DUP-01 | ok | Disposition `proceed-Step-6-after-A45`, blockedDecision null. Source and target digests are identical (`9f200578...`), and A45 is recorded at owner-answers.md:335-352. |
| 9 | X-CTR010-01 | ok | Disposition `resolved-owner-A45-option-A`, blockedDecision null, targetStep "Step 3; Step 9 close". The registry now has Gateway on CTR010 and confinement on CTR011, so the collision is resolved in the candidate. |
| 10 | V-05 | ok | Citations are now `phase-06/owner-answers.md#A43` and `concept-relationships.md:95-110`. That span is the "Coordination Rings" section with the A43 adoption paragraph. Meaning and `a43Guard` ("A ring never implies a new class or entity.") are unchanged. |
| 11 | Architecture registry | ok | CTR010-013 are one row each (lines 455-458), no duplicates. Component and slice rows use CTR011. The CTR011 row says label-only status. The CTR012 and CTR013 rows say "không có version field" and "không có contract/schema version field". DispatchPlan has no separate id. No CTR014 or other invented id. |
| 12 | Confinement history | ok | Line 49 now says CTR011, `confinement-authority.v1` is a documentation-only label, A45 moved the old number so CTR010 stays with the Gateway, and the legacy `docs/architecture-map.md` changes only at Phase 9. The diff is that one line. |
| 13 | Workflow operation contract | ok | Adds the 4-line "Registry identity: CTR012 · workflow-step-operation" paragraph. It says the payload has no version field and the allocation does not invent one. No other change. |
| 14 | Assignment contract | ok | Adds the 5-line CTR013 · Assignment paragraph. It states no payload contract/schema version field, that the policy/normalizer stamps are not a substitute, and that DispatchPlan stays in `assignment-run.v2` with no separate id. The existing "schema version" bullet in the field list is a pre-existing proposal line and is untouched. |
| 15 | Ring proposal pointer | ok | Adds a 4-line pointer to `concept-relationships.md#coordination-rings` (the anchor resolves to the heading above). It restates the A43 guard and changes no proposal text. |

Totals: 15 ok, 0 rework, 15/15 entries received a verdict.

## Aggregate confirmations

| Claim | Result |
|---|---|
| 22 unique rows | confirmed (`jq`: length 22, unique ids 22) |
| 0 incompatible, 0 missing ids, 0 parked | confirmed (`step-03-checks.json` matrix counts; recomputed status groups: 14 compatible + 1 compatible-covered = 15, 1 historical-deferred, 6 inventory-only) |
| 6 inventory-only, 1 historical/deferred | confirmed (X-STALE-01..06; S3-01) |
| Every Step 3 stop array empty, `accepted-pending-review` truthful | confirmed. All six blocking arrays are `[]`. `documentationFollowUp` holds only `S3-01 -> Step 5` and `P7-DOC-GAP-01 -> owner queue`, both non-blocking routed items. |
| A/B/C/G/H/I consistent | confirmed. A has no violations. B matches the Phase 6 extractor blobs. C has no changed area statuses and an unchanged switchboard sha. G is bounded: `freshNativeCloseClaim:false`, 8 candidate-unit drift paths all logged, fresh native close deferred to Step 9 under L11-2. H has 0 findings. I has no root instruction or switchboard changes. |
| Every candidate edit is in `post-review-edits.md` | confirmed. All 5 candidates (the 4 platform docs and the proposal) have rows, and the 3 earlier TRUTH-15/26/27 rows cover the other three changed candidate units in G's drift list. |
| No code, shipped contract, checker, vocabulary source, extractor, comparator, baseline, root instruction or switchboard changed | confirmed. `git diff 18f1ddfaa df3626178 --name-only` outside `plans/260925-*` and `docs/platform/*` is empty. Changed files are 5 candidate docs plus plan report files. `docs/contracts/**`, `src/`, `apps/`, `bin/`, `scripts/`, `CHANGELOG.md`, AGENTS.md and CLAUDE.md are untouched. |
| CTR011/012/013 unused before allocation | confirmed. `git grep 'CTR01[123]' 18f1ddfaa -- . ':!plans'` is empty (code, docs, legacy map, events, knowledge). The only earlier mentions are in plan reports (owner-answers.md and the prior architecture review), which are proposals rather than allocations. |
| Gateway's existing CTR010 references unchanged | confirmed. In `git grep CTR010`, every non-plans hit outside the two edited candidate files is byte-identical between 18f1ddfaa and df3626178, and the only hits that moved are the confinement ones in the edited candidate files. |
| CTR012/CTR013 invent no version | confirmed. Both registry rows, both contract docs and both matrix rows state the absence explicitly. |
| `git diff --check 18f1ddfaa df3626178` | clean (no output) |

## Remaining stop conditions

None for Steps 3-4. Carried, non-blocking routings (all already recorded):
- S3-01 visible superseded-label correction goes to Step 5.
- `P7-DOC-GAP-01` (confidence/category-to-action mapping) is queued in the owner queue.
- X-DUP-01 proceeds to Step 6 and X-CTR010-01 closes at Step 9.
- Native carry/rebind and fresh G for the 8 drifted candidate units are Step 9 work under L11-2.

## Notes

- Legacy `docs/architecture-map.md` and `docs/specs/confinement-authority.md:1353` still say confinement = CTR010. This is intended: they are outside the candidate set and are changed only at the Phase 9 cutover, and edit 12 records it. It is a known stale-until-cutover state, not a defect now.
- The matrix status for S3-01 is not `compatible`, and `currentIncompatible` stays 0 because the row is classified historical/deferred, not a live seam. L10-37 is satisfied: no wording-only change was escalated to rework, and I found nothing that was rework on substance.
- I only checked that cited line numbers show the claimed code (spot reads), not full semantic behavior beyond that.

## Unresolved

None.

Status: DONE
Summary: 15/15 entries ok, 0 rework; all pins match, aggregate claims confirmed, CTR011-013 were unused, CTR010 Gateway references and all code and shipped contracts are unchanged, and CTR012/CTR013 invent no version.
Concerns: none blocking (legacy-map CTR010 confinement text stays stale until Phase 9, as recorded).
