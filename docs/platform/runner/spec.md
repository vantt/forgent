---
area: runner
updated: 2026-10-15
sources: [phase-2-routing, post-divorce-hardening, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, discovery-context, worker-execution, fan-out-parallel, human-rounds, worker-dispatch-log, self-improve-loop, base-workflow-model-s2, fgos-multi-session-checkout, github-adapter-s3, github-adapter-s4, work-graph-intelligence-s2b, work-graph-intelligence-s10, work-graph-intelligence-s11, fgos-sample-testbed, p50-workflow-induct, str68-discovery-judge-robustness, str76-runner-bootstrap, str86-runner-headless-git, str7-str8-priority-intent, str51-2-reclaim-self-mount-fix, mvp2-scope-test-infra, str46-io-contract-lat2, spec-docs-lifecycle-realignment]
decisions: [feed7428, 14396a5c, 1a80b4d3, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, cfae0120, 22699c61, 04a6cd05, 396d9d9e, 2e92b7a5, f0c40acc, 5a6900b2, 8575f1a3, c8df2479, cb09d6fd, b1aa1bdc, caecb9d1, 9b141173, a3176299, 140eb8a4, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, c11322cb, 2ac16176, f8a3a5d9, 3d4ea29c, 3c8e5926, 342102b9, d4c59ba2, 644916a4, ef6ed305, a4fe4c2b, f69951df, 5208dfe9, 8cf7effe, 7bbe6315, a7c93ec8, cfdd808f, 31b5f045, 87536f3f, 38f7e0b8, ecfd0d1a, f176c18a, d3445024, cf3ee399, fa12fd97, a58a7563, 6e2776cc, 8b95f883]
coverage: candidate-unverified
---

# Spec: Runner (vòng tự hành)

```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve frozen-map runner content for independent conservation review
Design status: Candidate
Implementation: Carriage only; implementation truth not certified
Provenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing runner carriage, placement and conservation
Do not use this for: Canonical behavior, source retirement or current truth proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/runner.md
Supersedes: None; legacy authority retained
Superseded by: None
```

> Added in candidate: Metadata and map-based placement scaffolding. The area introduction follows the frozen map into architecture/h-e53a3a9829a8.md. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F4: candidate authoring date (docs/specs/runner.md:1-7 front matter; :1121 RUL100 dated 2026-10-15); A41 F4: no current full-coverage certification (docs/specs/runner.md:1-7, stale sources/decisions lists; :1121 dated 2026-10-15). Front-matter sources/decisions retain legacy provenance lists, not a completeness claim.


## Added in candidate: Navigation

[Runner portal](README.md); [area introduction](architecture/h-e53a3a9829a8.md#guard-reconciliation). Each mapped carrier:

- [architecture/h-e53a3a9829a8.md](architecture/h-e53a3a9829a8.md)
- [subcomponents/h-ce5b9771a26a/spec.md](subcomponents/h-ce5b9771a26a/spec.md)
- [subcomponents/h-02842f76ffd2/spec.md](subcomponents/h-02842f76ffd2/spec.md)
- [operations/h-51f5cd7279fd.md](operations/h-51f5cd7279fd.md)
- [subcomponents/h-6df5686d0d54/spec.md](subcomponents/h-6df5686d0d54/spec.md)
- [subcomponents/h-6979005beaf7/spec.md](subcomponents/h-6979005beaf7/spec.md)
- [subcomponents/h-37aced3896a8/spec.md](subcomponents/h-37aced3896a8/spec.md)
- [subcomponents/h-2e032393add1/spec.md](subcomponents/h-2e032393add1/spec.md)
- [subcomponents/h-d3b49ef7edf5/spec.md](subcomponents/h-d3b49ef7edf5/spec.md)
- [subcomponents/h-f34e0d170d89/spec.md](subcomponents/h-f34e0d170d89/spec.md)
- [architecture/h-7af1f0242611.md](architecture/h-7af1f0242611.md)
- [contracts/h-b3eb60fb4d2b.md](contracts/h-b3eb60fb4d2b.md)
- [decisions/h-aabefc85f0c9.md](decisions/h-aabefc85f0c9.md)
- [architecture/h-69197b459754.md](architecture/h-69197b459754.md)
- [decisions/h-36d872fbb0e5.md](decisions/h-36d872fbb0e5.md)
