# Step 5 authority separation and implementation alignment

Author session: `codex-session:fgos-run_unit-run-17922161b19023@2026-10-17`

Status: authored; independent review and reviewer-held A36 draw pending. Steps 3/4 remain accepted. This report labels 108 cross-area inventory statements plus S3-01; it does not promote a document or turn a migration binding into a whole-file implementation claim.

## Population and outcomes

109 bounded rows; 98 from accepted Step 1, ten L11-15 additions, one S3-01 follow-up. Remainder sampling is separate and has no author verdict.

| Authority kind | Rows |
|---|---:|
| architecture | 20 |
| contract | 7 |
| decision history | 46 |
| generated projection | 12 |
| proposal | 1 |
| specification | 23 |
| vision | 0 |

| Alignment | Rows |
|---|---:|
| aligned | 11 |
| deferred | 89 |
| doc-fix | 9 |
| implementation-gap | 0 |

`aligned` applies only to the exact stated seam/citation. `doc-fix` means the candidate correction is authored and then read-only verified. `deferred` preserves history/proposals, the accepted ownership bindings awaiting full truth, and work explicitly owned by Steps 6/7/9 or Phase 9. No implementation gap was found against the bounded current claims inspected; this is not a whole-corpus truth verdict.

## Two subpasses and six coordination rows

Authority-separation is the only writer. It corrects six §11 table rows and labels the dated framing; exact original/final section bytes and SHA-256 are in `step-05-coordination-delta.json`. The subsequent implementation-alignment pass reads those final bytes and makes no independent rewrite. Retirement is intentional: `git show --stat 2180b4e72701bb090288af8fe8021008d9d42079` proves the old engine was removed; the existing `agent-coordination/spec.md` already routes to current owners. No new mechanism is designed.

| Row | Verified present behavior | Code evidence |
|---|---|---|
| X-STALE-01 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-02 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-03 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-04 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-05 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-06 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |

S3-01 adds visible historical/deferred labels at `component-boundary.md#3-recommended-responsibility-chain` and `#13-team-cognition-and-protocol-packages`. The advisory text remains intact; there is no current Team Cognition producer, no new id, and no implementation authorization. This also accounts the main-merged component boundary without touching its authority metadata.

## A34 preservation and activation

28/28 committed residual files remain byte-identical to B0 and every declared payload SHA-256 matches. `step-05-a34-preservation.json` embeds the verbatim payload, file/payload SHA-256, owner, historical decision digests and activation condition for each row. Source/target whole-file drift is measured separately, never mistaken for residual loss or new acceptance. Thirteen rows have retiring legacy successors (X-A34-01 plus X-A34-17..28); the inherited QF prose says “12” but its named set contains 13. The named set is preserved, and no accepted rationale is reopened. Step 9 rebinds every affected carry; Phase 9 must re-home that full named set before retirement.

## Deferred capability and row-local stop

- Process domain implementations other than linux-gate, full containment and supervisor gate primitives are explicitly deferred in spec/code; Windows holder-lock remains unsupported. No repair is authorized or attempted.
- The retired protocol visibility/authorization/event surface and Team Cognition module remain proposal intent. The implemented reviewed loop is not an implementation gap.
- PARK-PROTECTED-01: unparked under L11-25 as branch correct; divergence accepted and recorded (+10/-2 versus main). Raw equality remains false; Phase 9 preserves the transition banner and two compounding→knowledge fixes. No protected file edit here.
- L10-37 applies: X-DEFECT-01..05 rationale-only observations stay Phase 9 and never count as Phase 7 rework. Projection/F10 rows remain Step 6 work.

## Remainder frame and review boundary

`step-05-remainder-frame/index.json` lists 22,454 eligible production-extractor units from all 611 Markdown documents, in 375 parts of at most 60 entries. Exactly 3 fully bounded units are excluded (the six-row table and the two S3-01 labels); no whole owning file is excluded. Non-Markdown contracts/projections remain mechanical evidence and Step 6 scope. The reviewer independently chooses and holds a seed, draws at least 3,369 units (15%, minimum ten), and reads both directions/context/diff plus every high-risk/parked row and digest mismatch. The author chose no seed or sample. Until this work finishes, Step 5 is reviewing, not accepted.

More than 3% substantive deep-read rework expands that homogeneous set to full read before reporting. Rationale-only wording never enters the numerator under L10-37. Full-corpus current truth remains Phase 9.

## All bounded statements

The JSON companion holds exact pins, authority scope, proof commands, risk, owner and route for every row. Deferred rows explicitly identify where no operative implementation claim is being made.

| Row | Authority kind | Alignment | Owner / target | Route |
|---|---|---|---|---|
| X-DUP-01 | generated projection | deferred | `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | Step 6 |
| X-DUP-02 | generated projection | deferred | `docs/platform/ui-spec/history/schema/surface-contract.schema.json` | Step 6 |
| X-DUP-03 | generated projection | deferred | `docs/platform/contracts/architecture-manifest.json` | Step 6 |
| X-DUP-04 | generated projection | deferred | `docs/platform/ui-spec/architecture/spec.config.yaml` | Step 6 |
| X-SEM-05 | specification | deferred | `docs/platform/agent-confinement/spec.md` | Step 2 |
| X-SEM-06 | specification | deferred | `docs/platform/claude-plugin/spec.md` | Step 2 |
| X-SEM-07 | specification | deferred | `docs/platform/decision-citation-drift/spec.md` | Step 2 |
| X-SEM-08 | specification | deferred | `docs/platform/distillery/spec.md` | Step 2 |
| X-SEM-09 | architecture | deferred | `docs/platform/documentation/switchboard.md` | Step 2 |
| X-SEM-10 | specification | deferred | `docs/platform/herdr-web-dashboard/spec.md` | Step 2 |
| X-SEM-11 | specification | deferred | `docs/platform/observe/spec.md` | Step 2 |
| X-SEM-12 | architecture | deferred | `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md` | Step 2 |
| X-SEM-13 | architecture | deferred | `docs/specs/runner.md` | Step 2 |
| X-SEM-14 | specification | deferred | `docs/platform/runner/spec.md` | Step 2 |
| X-SEM-15 | architecture | deferred | `docs/platform/domainization/architecture/domainization.md` | Step 2 |
| X-SEM-16 | specification | deferred | `docs/platform/system-overview/spec.md` | Step 2 |
| X-SEM-17 | specification | deferred | `docs/platform/ui-spec/architecture/components/C01-item-card.md` | Step 2 |
| X-SEM-18 | contract | deferred | `docs/platform/ui-spec/contracts/20-domain-rules.md` | Step 2 |
| X-SEM-19 | specification | deferred | `docs/platform/ui-spec/operations/F01-answer-a-parked-question.md` | Step 2 |
| X-SEM-20 | specification | deferred | `docs/platform/ui-spec/operations/F02-approve-a-merge.md` | Step 2 |
| X-SEM-21 | specification | deferred | `docs/platform/ui-spec/spec.md` | Step 2 |
| X-SEM-22 | specification | deferred | `docs/platform/ui-spec/architecture/modals/M01-answer-question.md` | Step 2 |
| X-SEM-23 | specification | deferred | `docs/platform/ui-spec/architecture/modals/M02-approve-merge.md` | Step 2 |
| X-SEM-24 | specification | deferred | `docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md` | Step 2 |
| X-SEM-25 | specification | deferred | `docs/platform/ui-spec/architecture/screens/S01-sign-in.md` | Step 2 |
| X-SEM-26 | specification | deferred | `docs/platform/ui-spec/architecture/screens/S02-taskboard.md` | Step 2 |
| X-SEM-27 | specification | deferred | `docs/platform/ui-spec/architecture/screens/S03-task-detail.md` | Step 2 |
| X-SEM-28 | specification | deferred | `docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md` | Step 2 |
| X-SEM-29 | generated projection | deferred | `docs/platform/ui-spec/architecture/spec.config.yaml` | Step 6 |
| X-SEM-30 | contract | deferred | `docs/platform/ui-spec/contracts/30-states-and-errors.md` | Step 2 |
| X-SEM-31 | generated projection | deferred | `docs/platform/ui-spec/history/schema/surface-contract.schema.json` | Step 6 |
| X-SEM-32 | contract | deferred | `docs/platform/ui-spec/contracts/15-system-events.md` | Step 2 |
| X-A34-01 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-02 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-03 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-04 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-05 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-06 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-07 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-08 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-09 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-10 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/packaging-f6-host-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-11 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-12 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-13 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/host-invocation-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-14 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/packaging-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-15 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-l9-9-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-16 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-l9-9-partial-carry-residual.json` | Step 5 sample; Step 9 all affected |
| X-A34-17 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-18 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-19 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-20 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-21 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-22 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-23 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-24 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-25 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-26 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-27 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step10-sync2300-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-A34-28 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/step10-sync2300-predecessor-residuals.json` | Step 5 sample; Step 9 all affected |
| X-NAV-01 | architecture | deferred | `docs/platform/system-architecture/architecture/roadmap.md` | Step 7 |
| X-NAV-02 | architecture | deferred | `docs/platform/system-architecture/architecture/workspace-topology.md` | Step 7 |
| X-NAV-03 | architecture | deferred | `docs/platform/system-architecture/architecture/workspace-topology-audit.md` | Step 7 |
| X-NAV-04 | architecture | deferred | `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md` | Step 7 |
| X-STALE-01 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-02 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-03 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-04 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-05 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-STALE-06 | architecture | doc-fix | `docs/platform/system-architecture/architecture/architecture-intent.md` | Step 5 |
| X-DEFECT-01 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 4-6 |
| X-DEFECT-02 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 4-6 |
| X-DEFECT-03 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 4-6 |
| X-DEFECT-04 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 4-6 |
| X-DEFECT-05 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 4-6 |
| X-DEFECT-06 | architecture | aligned | `docs/platform/runner/architecture/h-7af1f0242611.md` | Step 4 |
| X-DEFECT-07 | architecture | aligned | `docs/platform/host-invocation-routing/architecture/host-use-cases.md` | Step 4 |
| X-DEFECT-08 | architecture | aligned | `docs/platform/runner/operations/h-51f5cd7279fd.md` | Step 4 |
| X-DEFECT-09 | generated projection | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 6 |
| X-DEFECT-10 | generated projection | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 6 |
| X-DEFECT-11 | generated projection | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 6 |
| X-DEFECT-12 | generated projection | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 6 |
| X-DEFECT-13 | generated projection | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 6 |
| X-DEFECT-14 | generated projection | deferred | `plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md` | Step 6 |
| X-CTR010-01 | contract | aligned | `docs/platform/architecture-map.md` | Step 3; Step 9 close |
| QF-01 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | Step 5 sample; Step 9 affected; Phase 9 promotion truth and 12-row residual re-home |
| QF-02 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | Step 5 bounded; Phase 9 full |
| QF-03 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | Steps 4-6 candidate defects; Phase 9 rationale-only |
| QF-04 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | Step 2 semantic; Step 6 duplicate; Phase 8 alias mechanics |
| QF-05 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | Phase 9 |
| QF-06 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | Phase 8 |
| QF-07 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | Phase 8/9 |
| QF-08 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | Phase 8 preparation; Phase 9 adoption |
| QF-09 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | preserve; Step 9 affected rebind |
| QF-10 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | owner-only carry |
| QF-11 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | owner at Phase 9 |
| QF-12 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | Steps 4-6 named; Phase 9 remaining truth |
| QF-13 | decision history | deferred | `plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md` | separate main-owned item |
| X-MAIN-01 | specification | doc-fix | `docs/platform/holder-lock/spec.md` | Phase 9 main-import step |
| X-MAIN-02 | specification | aligned | `docs/platform/process/spec.md` | Step 5; Step 6; Step 9 |
| X-MAIN-03 | architecture | aligned | `docs/platform/component-boundary.md` | Step 5; Step 6; Step 9 |
| X-LOCK-01 | architecture | aligned | `docs/platform/process/spec.md` | Step 5; Step 6; Step 9 |
| X-LOCK-02 | architecture | aligned | `docs/platform/session-identity/spec.md` | Step 5; Step 6; Step 9 |
| X-LOCK-03 | contract | aligned | `docs/platform/holder-lock/spec.md` | Step 5; Step 6; Step 9 |
| X-LOCK-04 | contract | doc-fix | `docs/platform/holder-lock/spec.md` | Phase 9 main-import step |
| X-LOCK-05 | specification | aligned | `docs/platform/packaging-distribution/spec.md` | resolved; bounded close re-review |
| X-LOCK-06 | contract | aligned | `docs/platform/process/spec.md` | Step 5; Step 6; Step 9 |
| X-LOCK-07 | specification | deferred | `docs/platform/process/spec.md` | Step 5; Step 6; Step 9 |
| S3-01 | proposal | doc-fix | `docs/platform/component-boundary.md` | Step 5 independent review; Step 9 rebind |

## Closing correction (L11-23..26)

X-MAIN-01/X-LOCK-04 are doc-fix, deferred to Phase 9 main-import header refresh: main-checkout already uses `withMainCheckout`; only hot-state implementation remains pending. X-LOCK-05 is resolved/aligned at packaging-distribution/spec.md:530-533. PARK-PROTECTED-01 is unparked as branch-correct divergence accepted. All 109 rows have refreshed file pins and span probes; 26 statement hashes and additional evidence pins were stale (51 rows changed in total, including the final matrix evidence pin). Current machine rows govern these corrections; historical review observations below are retained as provenance.
