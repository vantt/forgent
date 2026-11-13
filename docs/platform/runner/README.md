# Runner


```txt
Document type: Area portal
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; implementation truth not certified
Provenance: `docs/specs/runner.md` at `947dc310396071a4d530216d5c06d05993d63bf5`
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading the scope, contracts and implementation limits stated here
Do not use this for: Claims outside the stated scope or unrecorded implementation proof
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/runner/spec.md
Supersedes: The mapped source location; source provenance is retained
Superseded by: None
```

> This portal routes readers to the runner interfaces, rules, decision history and implementation limits listed below; navigation is not implementation proof.

## Reading routes

Start with [spec.md](spec.md) for the carried preamble and source identity. The source area introduction remains in [runtime inspection and reconciliation](architecture/h-e53a3a9829a8.md), as the frozen map requires. Choose the mapped document below for the question you are reviewing.

- [dispatch-runtime-inspection](architecture/h-e53a3a9829a8.md) — Architecture.
- [entry-points-triggers](subcomponents/h-ce5b9771a26a/spec.md) — Specification.
- [data-dictionary](subcomponents/h-02842f76ffd2/spec.md) — Specification.
- [behaviors-operations](operations/h-51f5cd7279fd.md) — Guide / Runbook.
- [actors-access](subcomponents/h-6df5686d0d54/spec.md) — Specification.
- [business-rules](subcomponents/h-6979005beaf7/spec.md) — Specification.
- [edge-cases-settled](subcomponents/h-37aced3896a8/spec.md) — Specification.
- [open-gaps](subcomponents/h-2e032393add1/spec.md) — Specification.
- [visuals](subcomponents/h-d3b49ef7edf5/spec.md) — Specification.
- [pointers-implementation](subcomponents/h-f34e0d170d89/spec.md) — Specification.
- [từ-vựng-dispatch-hiện-hành](architecture/h-7af1f0242611.md) — Architecture.
- [executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration](contracts/h-b3eb60fb4d2b.md) — Contract.
- [coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner](decisions/h-aabefc85f0c9.md) — Decision record.
- [dispatch-operability-implementation-slice-2026-09-16](architecture/h-69197b459754.md) — Architecture.
- [lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4](decisions/h-36d872fbb0e5.md) — Decision record.
- [Unit run result contract](contracts/unit-run-result.md) — Approved by the owner on 2026-11-12 and implemented except `usage`: what Execution hands up when a Unit run ends (facts, output path, launch ceiling).
- [Routing handoff contract](contracts/routing-handoff.md) — carried in an earlier batch; unchanged here.
- [Conserved dispatch and session contracts](contracts/conserved-dispatch-doctrine.md) — Native-First rationale, session/merge distinction and maintained operation templates; no retired engine revival.

## Verification and boundary

Source implementation limits and deferred work are recorded in the owning specifications and decision histories; navigation does not certify implementation.

> Carriage note: [Decision records](decisions/h-36d872fbb0e5.md) include current records 0047, 0052 and 0055–0063 under the verbatim carried retired-history heading; later records partly supersede earlier rules.

## Known conflicts in carried text

These are reading cautions from the fresh-reader key, not current behavior proof. Carried implementation limits and deferred work remain explicit.

1. The [history heading](decisions/h-36d872fbb0e5.md) says “retired” while carrying live settled decisions. Placement grants no retirement.
2. The key found a Data Dictionary compat mention of `dispatch execute --effort` against RUL90/0062 removing that door. The published [dictionary](decisions/h-36d872fbb0e5.md#0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability) now records that compatibility removal and its source implementation limits.
3. Decision 0062 records the R3 pending-callers gate; RUL93/RUL95 and 0063 record it reached. These are dated stages of supersession, not code verification.
4. The carried source front matter says August 2026 and `coverage: full` against an October body. The published [preamble](spec.md) is labelled corrected; the source's old claim proves no coverage.
5. Deleted ranking/entropy pointers and the literal-main Open Gap were stale code claims. Source corrections are labelled in [Pointers](subcomponents/h-f34e0d170d89/spec.md), [Open Gaps](subcomponents/h-2e032393add1/spec.md) and [Gate A](operations/h-51f5cd7279fd.md); remaining carried claims are unverified.
6. The [vocabulary table](architecture/h-7af1f0242611.md) records historical self-citations; their line numbers are not navigable source evidence.
7. RUL76 already names `--idle-timeout-ms` and `runner.idleTimeoutMs` in the [carried rules](subcomponents/h-6979005beaf7/spec.md). Check its partial supersession and implementation before proposing a new idle-timeout rule.

## Cross-area reading links

- [Component boundary and change check](../component-boundary.md#5-how-to-change).
- [Documentation metadata and implementation evidence](../governance.md#5-metadata).
- [Six-question acceptance](../platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi).

These links supplement the known-conflicts routes above; they certify no carried claim.
