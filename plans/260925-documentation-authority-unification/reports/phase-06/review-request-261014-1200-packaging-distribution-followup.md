# Packaging-distribution bounded conservation and truth follow-up

Author session: codex-session:10@2026-10-14
Original carriage author session: codex-session:8@2026-10-13
Independent reports commit: 09fdd6746a39429288762a4a7b91d6a70af03a87
Accepted-verdict tree: 10e6885e45b32c287e9b534599bebab481883081
Changed content commit: fa7f63868c7b046aa6133749c942aa5f4ae87ad9
Review mode requested: ordinary
State: ready-for-review; no closure or promotion requested

Only twelve rationale reworks and three sampled truth fixes (units 2, 26, 28) are submitted. Three source bindings changed as a direct consequence of unit 26; they are shown with the truth fix, not a new carriage defect. Four files changed because the unit 28 marker assertion also appears in implementation-alignment. Nine changed native units and six A28 reverse tuple changes are consequences of these same fixes. Do not re-review unchanged carriage or decide F6 here.

The preceding committed reports supply 395 source ok verdicts, 31 successor ok verdicts and 21 stable heading ok verdicts. All source verdicts were applied by the unchanged `--apply-review`, in temporary per-report subsets because its frozen CLI requires exactly one verdict per pending claim. Subsets retain original shard/row identities and are merged back by exact claim ID; no approval is authored. Every note is verbatim and every report blob equals `09fdd6746`. Successors and stable headings use their existing representation and exact committed digests. Two identical-unit groups use their accepted notes verbatim; membership is unchanged. The candidate-list and A31 merge acceptances remain conservation evidence, not truth approval.

After truth rebinding, 392 source approvals remain and 15 source rows are pending: twelve rationale-only rows plus three changed unit-26 bindings. No approval carries to a changed version. Whole-shard `--rebind` also reopened an unchanged duplicate-digest row; its original approval was retained only after the exact stored anchor, complete digest and ancestry were proven equal. That row is excluded from this request.

A28 truth result stays historical: 3/30 false units, exactly 10%, not above the stop line. This request is a targeted correction review, not a new sample or self-authored truth acceptance. The reviewer could reproduce the 30 selections but not the exact 629-unit population digest; that limitation remains recorded in the committed report.

F6 proposal, dropped-010 register entry and FLAGGED literal retention are byte-unchanged. The Lead recommendation is advice; no owner decision is inferred. The dropped-001 register review and the existing one partial carry remain open, outside this limited follow-up. A33 applies only to Host Invocation.

Machine accounting: `plans/260925-documentation-authority-unification/reports/phase-06/packaging-followup-accounting.json`; SHA256 `abee7324e3a2f73c9b2d8acddf0952846f2c3135cc0e4bd3f9e9e1f2e1d3d2f3`. It contains full texts, full identity and shown-text hashes, all row decisions, native before/after IDs, changed file hashes, application commands and rebind results. The literal sections below are the review surface.

## Proof boundary

Proof source: `4cd663e911020e2028252d2be7814a035ae28af6`; native registry refreshed at the committed tree. Full commands, outputs and helper sources: `plans/260925-documentation-authority-unification/reports/phase-06/packaging-followup-verification.json` (SHA256 `d528825932d6f0a2699bc091199d86d9e0d123ce1dff3bb8b0a155cddf189731`).

| Check | Result |
|---|---|
| D, prior `reports/identity-registry.json` | Exit 0, zero fatal |
| D, prior `reports/phase-02-identity-registry.json` | Exit 0, zero fatal |
| Scoped strict E, each prior | Expected exit 1; exactly 15 not-reviewed + 1 partial-carry + 2 identical-unit groups + 1 dropped-001 register pending + 692 candidate-unverified units |
| Full native identity equality | All 94,328 pre-review IDs retained; 94,333 current IDs, five real new native IDs, four shown stable-heading digest changes; zero missing ID, no graft |
| Earlier persisted native identity equality | All 93,839 IDs retained; 93,815 tuples unchanged, 21 previously reviewed heading changes plus 3 shown truth-fix heading changes (the fourth truth-fix heading was new in the Packaging authoring batch) |
| Source/gap binding equality | 407 source IDs exact; 392 unchanged reviewed objects, 15 pending; 31 reviewed successors and 21 reviewed metadata/main heading bindings match native text |
| A28 candidate equality | 692 exact current tuples equal both E outputs; six changed tuples, 686 unchanged; eligible Candidate/Draft or history only |
| Prior closed areas | Agent 488 and Host 588 candidate tuples unchanged; prior area trees, holds, residuals and exception memberships unchanged |
| Exception membership | Both complete source/owner sets unchanged; committed ok notes recorded verbatim |
| Preservation | Extractor, five frozen files, 74 historical witnesses, 867 payloads, authority statuses and reader links unchanged; zero own allowlist violation with eight existing exemptions |
| Ratchet / placement / candidate status | Pass; zero candidate findings |
| Review/apply tests | 29/29 pass, zero fail/cancel/skip/todo; session env unset |
| Registry | 59,450,050 bytes, SHA256 `ff3b8e1ced4306cdb94dfcc943de16f2312c0d36b31889b8347aa96ce8bfa4e3`; unchanged compact format, below 90 MB; scratch only |

E remains red for these explicit open obligations. No batch closure or truth approval is claimed. `dropped-010`, its register entry and FLAGGED literal retention are byte-identical to `09fdd6746`.


## Twelve rationale-only rows

### claim_27e88f0348e205e3800328dff2bf9061

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/future-constraints.md#future-constraints-shared-gateway-adapter-and-substrate, under "Future Constraints: Shared Gateway, Adapter, And Substrate", is retained at docs/platform/packaging-distribution/architecture/future-constraints.md#future-constraints-shared-gateway-adapter-and-substrate. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/future-constraints.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/future-constraints.md#future-constraints-shared-gateway-adapter-and-substrate, under "Future Constraints: Shared Gateway, Adapter, And Substrate", is retained at docs/platform/packaging-distribution/architecture/future-constraints.md#future-constraints-shared-gateway-adapter-and-substrate. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the architecture/future-constraints.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/future-constraints.md#future-constraints-shared-gateway-adapter-and-substrate`
Unit digest: `8e8989079b3334c4b5f18b4d65d6170587d5ce58237c13d594696555b676ce23`; shown-text SHA256: `d37e2306cc81f5757e063d21a923b663fe7fac98b9978bfdb236c6ebbda1ad6b`

~~~~~~~~markdown
# Future Constraints: Shared Gateway, Adapter, And Substrate

```txt
Legacy status: Promoted architecture source
Promoted to: docs/platform/packaging-distribution/architecture/future-constraints.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Original future-constraints source
Do not use this legacy file for: Current canonical navigation
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active promoted future-constraints document is
> [docs/platform/packaging-distribution/architecture/future-constraints.md](../../platform/packaging-distribution/architecture/future-constraints.md).
> Keep this file only as discussion-era source context.

**Status:** Historical future-constraints source, not active delivery scope.
**Date:** 2026-09-04.

The promoted delivery target is packaging/distribution correctness and Rust
`fgos` CLI readiness. Shared web/gateway and MCP/substrate work should still
not be implemented from this historical file. The active constraint text lives
in [docs/platform/packaging-distribution/architecture/future-constraints.md](../../platform/packaging-distribution/architecture/future-constraints.md).
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/architecture/future-constraints.md#future-constraints-shared-gateway-adapter-and-substrate`
Unit digest: `d863752f9a2e603603e399c4dc7f7dae9de1a7f5b2dc9b1c627cfae188cc24be`; shown-text SHA256: `9f242c2aadd7f21c1ca9fcaa69028ea1ef5f7fee6af5d8ccc13487fa925b47f1`

~~~~~~~~markdown
### Future Constraints: Shared Gateway, Adapter, And Substrate

```txt
Legacy status: Promoted architecture source
Promoted to: docs/platform/packaging-distribution/architecture/future-constraints.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Original future-constraints source
Do not use this legacy file for: Current canonical navigation
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active promoted future-constraints document is
> [docs/platform/packaging-distribution/architecture/future-constraints.md](future-constraints.md).
> Keep this file only as discussion-era source context.

**Status:** Historical future-constraints source, not active delivery scope.
**Date:** 2026-09-04.

The promoted delivery target is packaging/distribution correctness and Rust
`fgos` CLI readiness. Shared web/gateway and MCP/substrate work should still
not be implemented from this historical file. The active constraint text lives
in [docs/platform/packaging-distribution/architecture/future-constraints.md](future-constraints.md).
~~~~~~~~

### claim_31ad2b5118fa2f5ace74f6dc554cd54b

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/history/distribution-baseline.md#distribution-baseline-and-scattered-spec-fragments, under "Distribution Baseline And Scattered Spec Fragments", is retained at docs/platform/packaging-distribution/history/distribution-baseline.md#distribution-baseline-and-scattered-spec-fragments. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/history/distribution-baseline.md#distribution-baseline-and-scattered-spec-fragments, under "Distribution Baseline And Scattered Spec Fragments", is retained at docs/platform/packaging-distribution/history/distribution-baseline.md#distribution-baseline-and-scattered-spec-fragments. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim.

Complete source: `docs/architect/packaging-distribution/history/distribution-baseline.md#distribution-baseline-and-scattered-spec-fragments`
Unit digest: `e01445cc31e3c304322e2d91470933c1f7394477d4c08c7e46fca9f42e26e393`; shown-text SHA256: `6c76e721f8bd96ab1ef8f07f0bd4e16999cdfb778d6e8bc244d7cad3e0a75acc`

~~~~~~~~markdown
# Distribution Baseline And Scattered Spec Fragments

```txt
Legacy status: Promoted history source
Promoted to: docs/platform/packaging-distribution/history/distribution-baseline.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Original baseline collection and source trace
Do not use this legacy file for: Current canonical history
Last reviewed: 2026-09-13
```

> Status: historical source. The active condensed history is
> [docs/platform/packaging-distribution/history/distribution-baseline.md](../../../platform/packaging-distribution/history/distribution-baseline.md).
> This file remains the full discussion-era evidence ledger and is not current
> target architecture.

**Status:** Historical/input record for the new Packaging And Distribution
architecture.
**Date:** 2026-09-04.
**Purpose:** Preserve the current generated-spec baseline and scattered
distribution-relevant facts while the new runtime identity/activation contract
becomes the canonical V1 design target.

This file is not the target design. It is the source-context ledger: facts,
constraints, older vocabulary, and design pressure that must not be forgotten
when the generated specs are eventually updated.
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/history/distribution-baseline.md#distribution-baseline-and-scattered-spec-fragments`
Unit digest: `cd639ea9673971d04f7780ecd0a823917af0f7431ad6ea9cba3a69c9fabad214`; shown-text SHA256: `50ce39d916584861e82a06d0db2ce38a26cfec3cce16f03a126fe521a0d9b59f`

~~~~~~~~markdown
### Distribution Baseline And Scattered Spec Fragments

```txt
Legacy status: Promoted history source
Promoted to: docs/platform/packaging-distribution/history/distribution-baseline.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Original baseline collection and source trace
Do not use this legacy file for: Current canonical history
Last reviewed: 2026-09-13
```

> Status: historical source. The active condensed history is
> [docs/platform/packaging-distribution/history/distribution-baseline.md](distribution-baseline.md).
> This file remains the full discussion-era evidence ledger and is not current
> target architecture.

**Status:** Historical/input record for the new Packaging And Distribution
architecture.
**Date:** 2026-09-04.
**Purpose:** Preserve the current generated-spec baseline and scattered
distribution-relevant facts while the new runtime identity/activation contract
becomes the canonical V1 design target.

This file is not the target design. It is the source-context ledger: facts,
constraints, older vocabulary, and design pressure that must not be forgotten
when the generated specs are eventually updated.
~~~~~~~~

### claim_3e74e0d8a854fb7ae0bffd1272066a17

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/README.md#packaging-and-distribution-architecture, under "Packaging And Distribution Architecture", is retained at docs/platform/packaging-distribution/README.md#packaging-and-distribution-architecture. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/README.md#packaging-and-distribution-architecture, under "Packaging And Distribution Architecture", is retained at docs/platform/packaging-distribution/README.md#packaging-and-distribution-architecture. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/README.md#packaging-and-distribution-architecture`
Unit digest: `43d5b8508099a9bb30ead5a267ab8d7e61f2c85130336e53870ddbc8f50085b7`; shown-text SHA256: `07e8a349e666a490b3f5172ecf519bcddb7d5df4f354bb862c14403aabae6e94`

~~~~~~~~markdown
# Packaging And Distribution Architecture

```txt
Legacy status: Promoted architecture source
Promoted to: docs/platform/packaging-distribution/README.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy folder for: Source rationale until redirects are finalized
Do not use this legacy folder for: Current canonical navigation
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active packaging-distribution portal is
> [docs/platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md).
> Keep this file only as discussion-era source context; do not add new target
> claims here.

**Status:** Historical architecture discussion package.
**Date:** 2026-09-04.
**Canonical source now:** [docs/platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md).
**Historical draft superseded by:** [Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md).

This folder preserved the discussion that shaped the promoted fgOS
packaging/distribution mechanism. The promoted delivery target is not shared
web/gateway. The promoted target is a correct
project-local runtime model that can support:

- `fgctl` as global/machine bootstrap and control;
- local `fgos` as project workflow authority;
- Rust `fgos` CLI distribution;
- legacy Node compatibility payload;
- project-local version safety;
- skills, agents, prose, docs, runner, init/doctor, and projections as part of
  one runtime identity story.
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/README.md#packaging-and-distribution-architecture`
Unit digest: `7162f8e811cea27ac4ffa4a795009a8f98d96b10999e321a82d62d33f59270f8`; shown-text SHA256: `1b486e3e86c5f9ebd822547747dc5ddb20fc5a75c3cf1519a3ff5e9f33b35a2d`

~~~~~~~~markdown
### Packaging And Distribution Architecture

```txt
Legacy status: Promoted architecture source
Promoted to: docs/platform/packaging-distribution/README.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy folder for: Source rationale until redirects are finalized
Do not use this legacy folder for: Current canonical navigation
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active packaging-distribution portal is
> [docs/platform/packaging-distribution/README.md](README.md).
> Keep this file only as discussion-era source context; do not add new target
> claims here.

**Status:** Historical architecture discussion package.
**Date:** 2026-09-04.
**Canonical source now:** [docs/platform/packaging-distribution/README.md](README.md).
**Historical draft superseded by:** [Runtime Identity And Activation](architecture/runtime-identity-and-activation.md).

This folder preserved the discussion that shaped the promoted fgOS
packaging/distribution mechanism. The promoted delivery target is not shared
web/gateway. The promoted target is a correct
project-local runtime model that can support:

- `fgctl` as global/machine bootstrap and control;
- local `fgos` as project workflow authority;
- Rust `fgos` CLI distribution;
- legacy Node compatibility payload;
- project-local version safety;
- skills, agents, prose, docs, runner, init/doctor, and projections as part of
  one runtime identity story.
~~~~~~~~

### claim_6741229cfdc5d39ced167646c763cffa

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/README.md#1-historical-read-order, under "1. Historical Read Order", is retained at docs/platform/packaging-distribution/README.md#1-historical-read-order. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/README.md#1-historical-read-order, under "1. Historical Read Order", is retained at docs/platform/packaging-distribution/README.md#1-historical-read-order. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/README.md#1-historical-read-order`
Unit digest: `bbe95d34035f20022d650b13187b26135df1ee2f77dddb5bd7dbd0ddd641b9b1`; shown-text SHA256: `e5dd7bccf4da7827f2af20ee5b5145e61fa98b2a579fce12270ad6eb285c0a6a`

~~~~~~~~markdown
## 1. Historical Read Order

For current work, start at
[docs/platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md).
The older discussion order was:

1. [Workspace Topology Architecture](../workspace-topology.md) — root topology,
   state classes, worktree behavior, workspace activation binding, work-state
   writer compatibility, projection scope, locks, and dirty-tree rules.
2. [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
   — active promoted runtime architecture and first implementation target.
3. [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md)
   — shared web/gateway, Project Runtime Adapter, and MCP/substrate constraints
   that packaging must not block, but does not deliver now.
4. [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md)
   — old Node/npm distribution baseline and generated-spec fragments preserved
   as input/history.

The older generated specs under `docs/specs/*` are not edited during this
architecture churn. Once the design settles, update their generated source or
owning workflow and regenerate/check the spec projections.
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/README.md#1-historical-read-order`
Unit digest: `3eec93e722cb187e30a087567678012796959fb0762a1b99d9ede0eced1ce364`; shown-text SHA256: `ed3eb725b66450ce992c585d3fa025e0b68dfc95c087da385d02c4b77b090b7d`

~~~~~~~~markdown
#### 1. Historical Read Order

For current work, start at
[docs/platform/packaging-distribution/README.md](README.md).
The older discussion order was:

1. [Workspace Topology Architecture](../../architect/workspace-topology.md) — root topology,
   state classes, worktree behavior, workspace activation binding, work-state
   writer compatibility, projection scope, locks, and dirty-tree rules.
2. [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md)
   — active promoted runtime architecture and first implementation target.
3. [Promoted Future Constraints](architecture/future-constraints.md)
   — shared web/gateway, Project Runtime Adapter, and MCP/substrate constraints
   that packaging must not block, but does not deliver now.
4. [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md)
   — old Node/npm distribution baseline and generated-spec fragments preserved
   as input/history.

The older generated specs under `docs/specs/*` are not edited during this
architecture churn. Once the design settles, update their generated source or
owning workflow and regenerate/check the spec projections.
~~~~~~~~

### claim_5766225be2d76d6239e116a664aec7cf

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/README.md#2-historical-supersession-table, under "2. Historical Supersession Table", is retained at docs/platform/packaging-distribution/README.md#2-historical-supersession-table. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/README.md#2-historical-supersession-table, under "2. Historical Supersession Table", is retained at docs/platform/packaging-distribution/README.md#2-historical-supersession-table. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/README.md#2-historical-supersession-table`
Unit digest: `70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8`; shown-text SHA256: `c024c29002998a528c38f3b1d13c6b6c73cb3f8557c32c5347ec1ffbf3016396`

~~~~~~~~markdown
## 2. Historical Supersession Table

| Topic | Active source to follow | Status |
|---|---|---|
| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
| Release identity and activation | [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
| Shared gateway/web | [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/README.md#2-historical-supersession-table`
Unit digest: `7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e`; shown-text SHA256: `e272ae39b15dbf8dcf31bb459ecc812d21d5625a65a48a98e21cb57a47d73a64`

~~~~~~~~markdown
#### 2. Historical Supersession Table

| Topic | Active source to follow | Status |
|---|---|---|
| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../../architect/workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
| Release identity and activation | [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
| Shared gateway/web | [Promoted Future Constraints](architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |
~~~~~~~~

### claim_f3d6f2172d4780ee47f3a2f7a44b2ec8

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#runtime-identity-and-activation, under "Runtime Identity And Activation", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#runtime-identity-and-activation-1. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#runtime-identity-and-activation, under "Runtime Identity And Activation", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#runtime-identity-and-activation-1. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#runtime-identity-and-activation`
Unit digest: `b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96`; shown-text SHA256: `58e20c597120f44e153dbfdde9d84c6ac9000bb3ce21473dd4e03986f47fef61`

~~~~~~~~markdown
# Runtime Identity And Activation

```txt
Legacy status: Promoted architecture/contract source
Promoted to:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Source detail until contract extraction is complete
Do not use this legacy file for: Current implementation status without checking implementation alignment
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active promoted runtime docs are
> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),
> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),
> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),
> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),
> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).
> Keep this file only as detailed source context.

**Status:** Historical architecture contract draft.
**Date:** 2026-09-04.
**Scope:** Project-local fgOS runtime identity, release records, per-workspace
activation binding, pinning, drift, rollback, quarantine, and the minimum
command boundary needed for packaging/distribution and the Rust `fgos` CLI.

This document was the first contract draft before promotion into
`docs/platform/packaging-distribution/**`. It deliberately kept shared
gateway/web as a future constraint, not active delivery scope.
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#runtime-identity-and-activation-1`
Unit digest: `54660ce11d518179ea925df6d69831e3c4f990e5e40ed35de69ce4b5c5c672cd`; shown-text SHA256: `6e98b503d44ce697a54a59b21ac898a709aaa7809e59936e0bd1c70dcc3cadfb`

~~~~~~~~markdown
### Runtime Identity And Activation

```txt
Legacy status: Promoted architecture/contract source
Promoted to:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Source detail until contract extraction is complete
Do not use this legacy file for: Current implementation status without checking implementation alignment
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active promoted runtime docs are
> [runtime-identity-and-activation.md](runtime-identity-and-activation.md),
> [repository-runtime-layout.md](../contracts/repository-runtime-layout.md),
> [release-manifest.md](../contracts/release-manifest.md),
> [activation-binding.md](../contracts/activation-binding.md),
> [distribution-pin.md](../contracts/distribution-pin.md),
> and [fgctl-and-local-fgos.md](fgctl-and-local-fgos.md).
> Keep this file only as detailed source context.

**Status:** Historical architecture contract draft.
**Date:** 2026-09-04.
**Scope:** Project-local fgOS runtime identity, release records, per-workspace
activation binding, pinning, drift, rollback, quarantine, and the minimum
command boundary needed for packaging/distribution and the Rust `fgos` CLI.

This document was the first contract draft before promotion into
`docs/platform/packaging-distribution/**`. It deliberately kept shared
gateway/web as a future constraint, not active delivery scope.
~~~~~~~~

### claim_a194d0ab7320ba24239af2947b286713

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#how-to-use-this-document, under "How To Use This Document", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#how-to-use-this-document. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#how-to-use-this-document, under "How To Use This Document", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#how-to-use-this-document. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#how-to-use-this-document`
Unit digest: `43afffffa5c14ced4d88b4f77dd85918110522d11d204d3ccdb266b7d4cfdb1f`; shown-text SHA256: `7bd1e2cf5862bf1d5b1bc591e7efcc8342fa8c234e7404a5003c53255016b309`

~~~~~~~~markdown
## How To Use This Document

This document is intentionally detailed historical source context. Use the
promoted platform docs as the working contract for new changes.

Read it in layers:

1. Read [Workspace Topology Architecture](../workspace-topology.md) first for root
   topology, state classes, worktree behavior, and dirty-tree rules.
2. Read the promoted
   [runtime identity architecture](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
   for current runtime identity language.
3. Read the promoted contracts for
   [repository layout](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
   [activation binding](../../platform/packaging-distribution/contracts/activation-binding.md),
   [distribution pin](../../platform/packaging-distribution/contracts/distribution-pin.md),
   and [release manifest](../../platform/packaging-distribution/contracts/release-manifest.md).
4. Use the remaining sections here only to recover historical rationale or
   details that the preservation audit points to.
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#how-to-use-this-document`
Unit digest: `af9d7395f28979e64969c6ed6a2c53b35d1de02b1d879d4649c16bd5d841329f`; shown-text SHA256: `d496020cd3bf362f1bffa9153935110a8e6ec9685bb1230a20938262aa7421e2`

~~~~~~~~markdown
#### How To Use This Document

This document is intentionally detailed historical source context. Use the
promoted platform docs as the working contract for new changes.

Read it in layers:

1. Read [Workspace Topology Architecture](../../../architect/workspace-topology.md) first for root
   topology, state classes, worktree behavior, and dirty-tree rules.
2. Read the promoted
   [runtime identity architecture](runtime-identity-and-activation.md)
   for current runtime identity language.
3. Read the promoted contracts for
   [repository layout](../contracts/repository-runtime-layout.md),
   [activation binding](../contracts/activation-binding.md),
   [distribution pin](../contracts/distribution-pin.md),
   and [release manifest](../contracts/release-manifest.md).
4. Use the remaining sections here only to recover historical rationale or
   details that the preservation audit points to.
~~~~~~~~

### claim_730ffda554a0b85dda9cf5813e028e29

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#3-roots-and-on-disk-shape, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#3-roots-and-on-disk-shape. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#3-roots-and-on-disk-shape, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#3-roots-and-on-disk-shape. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#3-roots-and-on-disk-shape`
Unit digest: `b41bcf03b6d6a9dc66be65ebf2042fff6580124af3dfbf01722a3a2cef476258`; shown-text SHA256: `8a83eda89b5005e0c4603001582fa890d1dc3c0d9a020988966b45d24b38e3bf`

~~~~~~~~markdown
## 3. Roots And On-Disk Shape

The root topology is defined in
[Workspace Topology Architecture](../workspace-topology.md). This document uses
that topology and focuses on runtime identity records.

The minimum shape is:


```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; physical placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```

The separation is architectural:

- release store `releases/<artifactDigest>/` is immutable release payload;
- workspace `.fgos/installation/bin/*` is the stable local entry surface;
- workspace `.fgos/installation/activation.json` selects the active runtime for
  that workspace only;
- workspace `.fgos/config.json` is tracked workspace/branch policy;
- workspace `.fgos/distribution.json` is tracked runtime pin policy and may
  differ by branch/worktree;
- workspace `.fgos/installation/projections/ledger.json` records projections for
  that workspace only;
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging;
- `runtimeCoordinationRoot(workStateId)` owns claims/sessions/leases/locks and
  must not share a namespace with release/activation records;
- config, event history, coordination, cache, activation, and projections have
  distinct state classes per
  [Workspace Topology Architecture](../workspace-topology.md).

Worker workspaces still need an installation capsule if commands are expected
to enter through local shims. They must not symlink or copy the entire shared
`.fgos` state tree. The minimum worker capsule is:

```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```

If `.fgos/distribution.json` exists but the release store has not staged its
requested release, the workspace is in `pinned-not-staged`. `fgctl init` must
acquire/stage the pinned release and publish this workspace's activation
binding, not silently choose latest.

Possible tracked pin shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```

Root resolution order for the stable shim:

```txt
1. read workspace .fgos/installation/root.json if present;
2. otherwise resolve TopologyContext for repository/workspace/work-state identity;
3. read machineReleaseStore from TopologyContext;
4. read workspace .fgos/installation/activation.json;
5. exec releases/<artifactDigest>/bin/<entry>.
```

The shim must not treat a shared release store as a shared active runtime. Two
worktrees may use different activation bindings while sharing the same
content-addressed releases.

`<artifactDigest>` is a path-safe digest identity for the canonical release
tree manifest, for example `sha256-abc123...`. It is not the path humans,
agents, gateway, or runner supervisors should call directly. The stable command
path is:

```txt
.fgos/installation/bin/fgos
.fgos/installation/bin/fgos-runner
```

Those entries are thin local shims. A shim should do only the minimum required
to enter the active release:

```txt
resolve machineReleaseStore from TopologyContext/root binding
read workspace .fgos/installation/activation.json
resolve artifactDigest to releases/<digest>/
verify the target entry exists
exec the active release binary
```

It must not scan the full workspace, verify every fingerprint, resolve network
versions, run doctor checks, or load broad registries on every command. Full
verification belongs to install/repair/doctor paths. The normal command
overhead should be limited to reading one small record and executing the active
binary.

Shim forward-compatibility rule: the shim reads only `schemaVersion`,
`artifactDigest`, and `releasePath` from workspace `activation.json`. Broader
activation metadata may evolve without requiring every stable shim to be
replaced.

The alternative is a `current` symlink, but the preferred V1 is a shim because
it works more consistently on Windows, can produce clear errors when the active
release is missing, and can later add a lightweight invocation lease without
depending on filesystem symlink behavior.
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#3-roots-and-on-disk-shape`
Unit digest: `8663234273000c940a8a87fcb1ecec9558e979f5135b38d28a91f7ad61474f1a`; shown-text SHA256: `a5b202934f25ebb797bd26ab544ca4e3f4d5dec6f0af61982e4fe49cd85ecf5d`

~~~~~~~~markdown
#### 3. Roots And On-Disk Shape

The root topology is defined in
[Workspace Topology Architecture](../../../architect/workspace-topology.md). This document uses
that topology and focuses on runtime identity records.

The minimum shape is:


```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; physical placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```

The separation is architectural:

- release store `releases/<artifactDigest>/` is immutable release payload;
- workspace `.fgos/installation/bin/*` is the stable local entry surface;
- workspace `.fgos/installation/activation.json` selects the active runtime for
  that workspace only;
- workspace `.fgos/config.json` is tracked workspace/branch policy;
- workspace `.fgos/distribution.json` is tracked runtime pin policy and may
  differ by branch/worktree;
- workspace `.fgos/installation/projections/ledger.json` records projections for
  that workspace only;
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging;
- `runtimeCoordinationRoot(workStateId)` owns claims/sessions/leases/locks and
  must not share a namespace with release/activation records;
- config, event history, coordination, cache, activation, and projections have
  distinct state classes per
  [Workspace Topology Architecture](../../../architect/workspace-topology.md).

Worker workspaces still need an installation capsule if commands are expected
to enter through local shims. They must not symlink or copy the entire shared
`.fgos` state tree. The minimum worker capsule is:

```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```

If `.fgos/distribution.json` exists but the release store has not staged its
requested release, the workspace is in `pinned-not-staged`. `fgctl init` must
acquire/stage the pinned release and publish this workspace's activation
binding, not silently choose latest.

Possible tracked pin shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```

Root resolution order for the stable shim:

```txt
1. read workspace .fgos/installation/root.json if present;
2. otherwise resolve TopologyContext for repository/workspace/work-state identity;
3. read machineReleaseStore from TopologyContext;
4. read workspace .fgos/installation/activation.json;
5. exec releases/<artifactDigest>/bin/<entry>.
```

The shim must not treat a shared release store as a shared active runtime. Two
worktrees may use different activation bindings while sharing the same
content-addressed releases.

`<artifactDigest>` is a path-safe digest identity for the canonical release
tree manifest, for example `sha256-abc123...`. It is not the path humans,
agents, gateway, or runner supervisors should call directly. The stable command
path is:

```txt
.fgos/installation/bin/fgos
.fgos/installation/bin/fgos-runner
```

Those entries are thin local shims. A shim should do only the minimum required
to enter the active release:

```txt
resolve machineReleaseStore from TopologyContext/root binding
read workspace .fgos/installation/activation.json
resolve artifactDigest to releases/<digest>/
verify the target entry exists
exec the active release binary
```

It must not scan the full workspace, verify every fingerprint, resolve network
versions, run doctor checks, or load broad registries on every command. Full
verification belongs to install/repair/doctor paths. The normal command
overhead should be limited to reading one small record and executing the active
binary.

Shim forward-compatibility rule: the shim reads only `schemaVersion`,
`artifactDigest`, and `releasePath` from workspace `activation.json`. Broader
activation metadata may evolve without requiring every stable shim to be
replaced.

The alternative is a `current` symlink, but the preferred V1 is a shim because
it works more consistently on Windows, can produce clear errors when the active
release is missing, and can later add a lightweight invocation lease without
depending on filesystem symlink behavior.
~~~~~~~~

### claim_088af18a5796ed72fe6d33ff2cc5d05c

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest, under "5. ReleaseManifest", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest, under "5. ReleaseManifest", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest`
Unit digest: `b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b`; shown-text SHA256: `58d7822f6171775470cdc34ba7e2d54c99708d6405c9e75ad7d4a119d1873c53`

~~~~~~~~markdown
## 5. ReleaseManifest

The release manifest is the immutable statement of what an fgOS release
contains.

The canonical artifact digest is computed from this release tree manifest, not
from a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive
digests may still be recorded for download/integrity diagnostics, but they are
not runtime identity. Runtime identity must survive different compression
formats, package transports, and mirror locations.

The digest formula is:

```txt
fileDigest = sha256(file bytes as emitted by the release build)
artifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))
```

The release build, not the installer, owns byte normalization. Install should
not rewrite line endings or file contents to make a digest pass.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:...",
  "digestKind": "release-tree-manifest",
  "releaseVersion": "0.1.0",
  "sourceRevision": "...",
  "createdAt": "2026-09-04T00:00:00Z",
  "target": {
    "os": "linux",
    "arch": "x64",
    "libc": "glibc"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:..."
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:..."
    },
    "workshop": {
      "skillsDigest": "sha256:...",
      "agentsDigest": "sha256:...",
      "proseDigest": "sha256:..."
    }
  },
  "requires": {
    "node": ">=20 <23",
    "git": ">=2.39"
  },
  "adapter": {
    "protocolVersion": "1",
    "entry": "bin/fgos adapter",
    "capabilities": []
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": []
}
```

`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest`
Unit digest: `dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee`; shown-text SHA256: `bbf15d39ee5e46d10dad5b89e6bc941bc035a5cf2738843c12c10408fa786e56`

~~~~~~~~markdown
#### 5. ReleaseManifest

The release manifest is the immutable statement of what an fgOS release
contains.

The canonical artifact digest is computed from this release tree manifest, not
from a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive
digests may still be recorded for download/integrity diagnostics, but they are
not runtime identity. Runtime identity must survive different compression
formats, package transports, and mirror locations.

The digest formula is:

```txt
fileDigest = sha256(file bytes as emitted by the release build)
artifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))
```

The release build, not the installer, owns byte normalization. Install should
not rewrite line endings or file contents to make a digest pass.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:...",
  "digestKind": "release-tree-manifest",
  "releaseVersion": "0.1.0",
  "sourceRevision": "...",
  "createdAt": "2026-09-04T00:00:00Z",
  "target": {
    "os": "linux",
    "arch": "x64",
    "libc": "glibc"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:..."
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:..."
    },
    "workshop": {
      "skillsDigest": "sha256:...",
      "agentsDigest": "sha256:...",
      "proseDigest": "sha256:..."
    }
  },
  "requires": {
    "node": ">=20 <23",
    "git": ">=2.39"
  },
  "adapter": {
    "protocolVersion": "1",
    "entry": "bin/fgos adapter",
    "capabilities": []
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": []
}
```

`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../../../architect/host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
~~~~~~~~

### claim_0036613efcab070084f6d6a219f0787d

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/scope-map.md#packaging-distribution-scope-map, under "Packaging Distribution Scope Map", is retained at docs/platform/packaging-distribution/spec.md#packaging-distribution-scope-map. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/scope-map.md#packaging-distribution-scope-map, under "Packaging Distribution Scope Map", is retained at docs/platform/packaging-distribution/spec.md#packaging-distribution-scope-map. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/scope-map.md#packaging-distribution-scope-map`
Unit digest: `a4662e51b8e00012069dc6288fafe9a3543cab8567d41656dcb8fb52df99f784`; shown-text SHA256: `1dd6f442756a6a86953eb75c22710bf6c96115959066f8d08004146b0d0de3d2`

~~~~~~~~markdown
# Packaging Distribution Scope Map

```txt
Legacy status: Promoted migration/source map
Promoted to:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Original scope classification source
Do not use this legacy file for: Current canonical navigation
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active area boundary now lives in
> [docs/platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md),
> with preservation tracking in
> [source-preservation-audit.md](../../platform/packaging-distribution/verification/source-preservation-audit.md).
> Keep this file only as the discussion-era concern map.

**Status:** Historical architecture discussion map.
**Date:** 2026-09-04.
**Purpose:** Preserve the concern split that was promoted into
`docs/platform/packaging-distribution/**` without letting this old map compete
as the current navigation surface.

Packaging distribution is not one component. It cuts across bootstrap,
runtime payload, project semantics, host surfaces, state authority, skill/prose
materialization, runner autonomy, Rust migration, and product packaging
cleanliness.

This document maps those concerns to the architecture documents that should own
or reference them.
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/spec.md#packaging-distribution-scope-map`
Unit digest: `5ed2f9d1174332ae7c94a4760f7b93b006433d24fe88195bfc8b8642cc393d7d`; shown-text SHA256: `1c91b484f9bc020ee0059c1ec5cd906c8cbd21f261e1fe46e33d70137863251a`

~~~~~~~~markdown
### Packaging Distribution Scope Map

```txt
Legacy status: Promoted migration/source map
Promoted to:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Original scope classification source
Do not use this legacy file for: Current canonical navigation
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active area boundary now lives in
> [docs/platform/packaging-distribution/README.md](README.md),
> with preservation tracking in
> [source-preservation-audit.md](verification/source-preservation-audit.md).
> Keep this file only as the discussion-era concern map.

**Status:** Historical architecture discussion map.
**Date:** 2026-09-04.
**Purpose:** Preserve the concern split that was promoted into
`docs/platform/packaging-distribution/**` without letting this old map compete
as the current navigation surface.

Packaging distribution is not one component. It cuts across bootstrap,
runtime payload, project semantics, host surfaces, state authority, skill/prose
materialization, runner autonomy, Rust migration, and product packaging
cleanliness.

This document maps those concerns to the architecture documents that should own
or reference them.
~~~~~~~~

### claim_0126dcd017d4604b384236e046fadd82

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/scope-map.md#2-historical-document-split, under "2. Historical Document Split", is retained at docs/platform/packaging-distribution/spec.md#2-historical-document-split. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/scope-map.md#2-historical-document-split, under "2. Historical Document Split", is retained at docs/platform/packaging-distribution/spec.md#2-historical-document-split. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/scope-map.md#2-historical-document-split`
Unit digest: `44d80ce41b99b1994d0c1f216606224be37eab7cf3f0f34a3a8b886704a9e350`; shown-text SHA256: `a074d9833db02091ec3af3b8b52a1fc247245bda4d42c1f3151a3ce2501659b4`

~~~~~~~~markdown
## 2. Historical Document Split

This discussion proposed the split below. The active promoted split now lives
under `docs/platform/packaging-distribution/**`.

```txt
docs/architect/
  workspace-topology.md
    repository/workspace/work-state identities, state classes, modes,
    operation-to-root matrix, lifecycle/failure modes, dirty-tree rules

docs/architect/packaging-distribution/
  README.md
    discussion spine and target model later promoted to platform docs

  scope-map.md
    this file; concern map and document routing

  runtime-identity-and-activation.md
    immutable release manifest, workspace activation binding, pin, projection
    ledger, migration journal outline, invocation lease, drift, rollback,
    quarantine

  future-constraints.md
    future shared web/gateway constraint, Project Runtime Adapter,
    out-of-process protocol, global substrate boundary

  history/distribution-baseline.md
    old Node/npm baseline and generated-spec fragments preserved as input

future optional splits, only when they outgrow runtime identity:
  fgctl-and-local-fgos-contract.md
  workshop-materialization.md
```

[Workspace Topology Architecture](../workspace-topology.md) must be read before
runtime identity, because packaging consumes topology rather than owning it.
[Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
is the promoted first packaging-specific contract. Gateway/web itself is not
active delivery scope; its constraints live in
[Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md).
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/spec.md#2-historical-document-split`
Unit digest: `697dcb0fc77b4574bc4785abc062489f7b8d7ed3fcc636d2f93d67873d5434a7`; shown-text SHA256: `b3bdd16193c9405d132280f4376659f392fc263043b7ee4b2366853e99fb88b8`

~~~~~~~~markdown
#### 2. Historical Document Split

This discussion proposed the split below. The active promoted split now lives
under `docs/platform/packaging-distribution/**`.

```txt
docs/architect/
  workspace-topology.md
    repository/workspace/work-state identities, state classes, modes,
    operation-to-root matrix, lifecycle/failure modes, dirty-tree rules

docs/architect/packaging-distribution/
  README.md
    discussion spine and target model later promoted to platform docs

  scope-map.md
    this file; concern map and document routing

  runtime-identity-and-activation.md
    immutable release manifest, workspace activation binding, pin, projection
    ledger, migration journal outline, invocation lease, drift, rollback,
    quarantine

  future-constraints.md
    future shared web/gateway constraint, Project Runtime Adapter,
    out-of-process protocol, global substrate boundary

  history/distribution-baseline.md
    old Node/npm baseline and generated-spec fragments preserved as input

future optional splits, only when they outgrow runtime identity:
  fgctl-and-local-fgos-contract.md
  workshop-materialization.md
```

[Workspace Topology Architecture](../../architect/workspace-topology.md) must be read before
runtime identity, because packaging consumes topology rather than owning it.
[Runtime Identity And Activation](architecture/runtime-identity-and-activation.md)
is the promoted first packaging-specific contract. Gateway/web itself is not
active delivery scope; its constraints live in
[Future Constraints](architecture/future-constraints.md).
~~~~~~~~

### claim_163988c8973416bdd64781cc7c667f65

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Disposition: `move`; status: `pending`; authoredBy: `codex-session:8@2026-10-13`

Previous rationale:
The complete heading from docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model, under "Workspace Runtime Model", is retained at docs/platform/packaging-distribution/spec.md#workspace-runtime-model. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation.

Corrected rationale:
The complete heading from docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model, under "Workspace Runtime Model", is retained at docs/platform/packaging-distribution/spec.md#workspace-runtime-model. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation.

Complete source: `docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model`
Unit digest: `b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0`; shown-text SHA256: `dbe3c61382bef8964e016323ee442dfbfd65947aa53824d9fd494a560de9d121`

~~~~~~~~markdown
# Workspace Runtime Model

```txt
Legacy status: Superseded pointer
Superseded by:
- docs/architect/workspace-topology.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Redirect only
Do not use this legacy file for: Current model detail
Last reviewed: 2026-09-13
```

> Status: historical redirect. Active topology remains
> [docs/architect/workspace-topology.md](../workspace-topology.md), while active
> packaging-distribution runtime records live under
> [docs/platform/packaging-distribution/](../../platform/packaging-distribution/README.md).
> Keep this file only as the old pointer that explains the split.

**Status:** Moved.
**Date:** 2026-09-04.

Workspace/runtime/work-state topology is broader than packaging/distribution.
The canonical architecture document is now:

[Workspace Topology Architecture](../workspace-topology.md)

Packaging/distribution consumes that topology for release store placement,
workspace activation binding, projection ledger scope, leases, and dirty-tree
rules. Do not update this file with new topology decisions; update
`docs/architect/workspace-topology.md` instead.
~~~~~~~~

Complete target (unchanged): `docs/platform/packaging-distribution/spec.md#workspace-runtime-model`
Unit digest: `bb51245f797ae2ff9c26ec3eeda2eec25bae525e30543a9a658a47dd84109dd6`; shown-text SHA256: `6af2bb857d4a66bbf18ad9b1fdae21512b7b7158f39757d93428762c2eba2ce5`

~~~~~~~~markdown
### Workspace Runtime Model

```txt
Legacy status: Superseded pointer
Superseded by:
- docs/architect/workspace-topology.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Redirect only
Do not use this legacy file for: Current model detail
Last reviewed: 2026-09-13
```

> Status: historical redirect. Active topology remains
> [docs/architect/workspace-topology.md](../../architect/workspace-topology.md), while active
> packaging-distribution runtime records live under
> [docs/platform/packaging-distribution/](README.md).
> Keep this file only as the old pointer that explains the split.

**Status:** Moved.
**Date:** 2026-09-04.

Workspace/runtime/work-state topology is broader than packaging/distribution.
The canonical architecture document is now:

[Workspace Topology Architecture](../../architect/workspace-topology.md)

Packaging/distribution consumes that topology for release store placement,
workspace activation binding, projection ledger scope, leases, and dirty-tree
rules. Do not update this file with new topology decisions; update
`docs/architect/workspace-topology.md` instead.
~~~~~~~~

## Three sampled truth fixes

### Sample unit 2

Complete before: `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#unheaded-block-11`
Unit digest: `6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b`; shown-text SHA256: `6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b`

~~~~~~~~markdown
| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs` |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |
~~~~~~~~

Complete current: `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#unheaded-block-11`
Unit digest: `1c0ced47def581b2c6236f710da48b9b52fa6b13795bf4d037c1b528d19dc987`; shown-text SHA256: `1c0ced47def581b2c6236f710da48b9b52fa6b13795bf4d037c1b528d19dc987`

~~~~~~~~markdown
| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs`  **Status note (2026-10-14):** The retained implementation claim overstates doctor/fix coverage: `plugin-dev-skills-packaged` detects missing files only (`src/setup/registrations.mjs:3251-3276`); byte drift is checked by `test/skills/fgos-mirror.test.mjs:137`, and this check has no registered repair. |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |
~~~~~~~~

Sentence-local additions for this fix:

`docs/platform/packaging-distribution/contracts/skill-package-distribution.md`

~~~~~~~~markdown
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs`  **Status note (2026-10-14):** The retained implementation claim overstates doctor/fix coverage: `plugin-dev-skills-packaged` detects missing files only (`src/setup/registrations.mjs:3251-3276`); byte drift is checked by `test/skills/fgos-mirror.test.mjs:137`, and this check has no registered repair. |
~~~~~~~~

### Sample unit 26

Complete before: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27`
Unit digest: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`; shown-text SHA256: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
~~~~~~~~

Complete current: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27`
Unit digest: `6fbabae72e49d14c8ea861f42ffc8ee4180d3b83c968871b6ea38ace19b92d9a`; shown-text SHA256: `6fbabae72e49d14c8ea861f42ffc8ee4180d3b83c968871b6ea38ace19b92d9a`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime. **Status note (2026-10-14):** The permission in the first sentence is retained dated design, not implemented: static preflight never runs candidate code and the proposed environment-variable bootstrap context was never honored by a host (`packages/distribution/rust/src/init.rs:431-446`). The must-not obligation remains.
~~~~~~~~

Sentence-local additions for this fix:

`docs/platform/packaging-distribution/contracts/activation-binding.md`

~~~~~~~~markdown
**Retained dated design — status note (2026-10-14):** The bootstrap-context permission below is source design, not current behavior. Preflight is static and never executes candidate release code (`packages/distribution/rust/src/init.rs:431-446`).
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
~~~~~~~~

`docs/platform/packaging-distribution/contracts/activation-binding.md`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime. **Status note (2026-10-14):** The permission in the first sentence is retained dated design, not implemented: static preflight never runs candidate code and the proposed environment-variable bootstrap context was never honored by a host (`packages/distribution/rust/src/init.rs:431-446`). The must-not obligation remains.
~~~~~~~~

Associated source binding consequences (ordinary review; pending with all approval pins removed):

#### claim_e4bf9b812f0b787bcf56246677865361

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Decision: `{"claimId": "claim_e4bf9b812f0b787bcf56246677865361", "sourceUnitDigest": "57af5b1c65fd1dda38b5e2fa7e5231049f66141d34f71578f2509b78a4994305", "targetOwner": "docs/platform/packaging-distribution/contracts/activation-binding.md", "targetAnchor": "6-workspaceactivationbinding", "claimKind": "architecture", "disposition": "move", "reviewStatus": "pending", "authoredBy": "codex-session:10@2026-10-14", "rationale": "The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#6-workspaceactivationbinding, under \"6. WorkspaceActivationBinding\", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.", "reviewNote": "Stored digest has no target match; independent re-review required."}`

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#6-workspaceactivationbinding`
Unit digest: `57af5b1c65fd1dda38b5e2fa7e5231049f66141d34f71578f2509b78a4994305`; shown-text SHA256: `bf8d61bb919b6ecb32f956bdc469ef583855749d23994adcc064d9ef384830d4`

~~~~~~~~markdown
## 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
~~~~~~~~

Previously accepted target: `docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding`
Unit digest: `af026389acc476c217dd34e67292fe2ab3a06c89ccbe09e95f77a5f342e9e2f1`; shown-text SHA256: `e00f1788095d833ad6bb4d38a06a52b3fa605f7441c9589dcd3feb5d4ecb76fa`

~~~~~~~~markdown
#### 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
~~~~~~~~

Current pending target: `docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding`
Unit digest: `32761eb7cc5ab63a191f4a707e6e56cf65a32c3dd5d605aa5558346377edfb40`; shown-text SHA256: `ee69bcb619898365a7b38bc0eb13bb4ab438e82e13b39b6553be5dea8cf8e2c8`

~~~~~~~~markdown
#### 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

**Retained dated design — status note (2026-10-14):** The bootstrap-context permission below is source design, not current behavior. Preflight is static and never executes candidate release code (`packages/distribution/rust/src/init.rs:431-446`).
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime. **Status note (2026-10-14):** The permission in the first sentence is retained dated design, not implemented: static preflight never runs candidate code and the proposed environment-variable bootstrap context was never honored by a host (`packages/distribution/rust/src/init.rs:431-446`). The must-not obligation remains.
~~~~~~~~

#### claim_3673677485dd4449067c9e5074623e1a

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Decision: `{"claimId": "claim_3673677485dd4449067c9e5074623e1a", "sourceUnitDigest": "a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599", "targetOwner": "docs/platform/packaging-distribution/contracts/activation-binding.md", "targetAnchor": "unheaded-block-25", "claimKind": "architecture", "disposition": "move", "reviewStatus": "pending", "authoredBy": "codex-session:10@2026-10-14", "rationale": "The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-63, under \"6. WorkspaceActivationBinding\", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.", "reviewNote": "Stored digest has no target match; independent re-review required."}`

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-63`
Unit digest: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`; shown-text SHA256: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`

~~~~~~~~markdown
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
~~~~~~~~

Previously accepted target: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25`
Unit digest: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`; shown-text SHA256: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`

~~~~~~~~markdown
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
~~~~~~~~

Current pending target: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25`
Unit digest: `273e89aa19e81dcc743483fe3e51606dcf949278cadecb37a885aa39014cec2b`; shown-text SHA256: `273e89aa19e81dcc743483fe3e51606dcf949278cadecb37a885aa39014cec2b`

~~~~~~~~markdown
**Retained dated design — status note (2026-10-14):** The bootstrap-context permission below is source design, not current behavior. Preflight is static and never executes candidate release code (`packages/distribution/rust/src/init.rs:431-446`).
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
~~~~~~~~

#### claim_107a23bb29dcf6db15e2471d7e77590b

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json`
Decision: `{"claimId": "claim_107a23bb29dcf6db15e2471d7e77590b", "sourceUnitDigest": "ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0", "targetOwner": "docs/platform/packaging-distribution/contracts/activation-binding.md", "targetAnchor": "unheaded-block-27", "claimKind": "architecture", "disposition": "move", "reviewStatus": "pending", "authoredBy": "codex-session:10@2026-10-14", "rationale": "The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-65, under \"6. WorkspaceActivationBinding\", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation.", "reviewNote": "Stored digest has no target match; independent re-review required."}`

Complete source: `docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-65`
Unit digest: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`; shown-text SHA256: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
~~~~~~~~

Previously accepted target: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27`
Unit digest: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`; shown-text SHA256: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
~~~~~~~~

Current pending target: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27`
Unit digest: `6fbabae72e49d14c8ea861f42ffc8ee4180d3b83c968871b6ea38ace19b92d9a`; shown-text SHA256: `6fbabae72e49d14c8ea861f42ffc8ee4180d3b83c968871b6ea38ace19b92d9a`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime. **Status note (2026-10-14):** The permission in the first sentence is retained dated design, not implemented: static preflight never runs candidate code and the proposed environment-variable bootstrap context was never honored by a host (`packages/distribution/rust/src/init.rs:431-446`). The must-not obligation remains.
~~~~~~~~

### Sample unit 28

Complete before: `docs/platform/packaging-distribution/verification/install-and-release-proof.md#unheaded-block-17`
Unit digest: `6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed`; shown-text SHA256: `6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed`

~~~~~~~~markdown
- The public release posture is preview.
- External installs default `fgos` through the Rust host.
- Public docs may state that Rust host is the default installed runtime.
- Rust host is the default runtime path for activated workspace installs.
- Legacy Node fallback is deprecated immediately as a public/default runtime
  posture.
- Legacy Node fallback may remain only as an explicit escape hatch during a
  short compatibility window. It must require an intentional selector such as
  an environment variable, flag, or equivalent supported mechanism; it must not
  silently catch Rust-host failures.
- Any escape-hatch invocation must emit a warning, log entry, or proof marker
  that distinguishes deliberate legacy fallback use from default Rust-host use.
- The escape hatch remains supported for 30 calendar days after the preview
  release publication date. The public preview tag `v0.1.0` was published on
  2026-09-18, so the earliest removal date for this preview release is
  2026-10-18 unless a later release decision replaces that support promise.
~~~~~~~~

Complete current: `docs/platform/packaging-distribution/verification/install-and-release-proof.md#unheaded-block-17`
Unit digest: `0a6462a61aad15b54f05f1516733d66bbaa77dfe4800eb05db5f58f6561ff268`; shown-text SHA256: `0a6462a61aad15b54f05f1516733d66bbaa77dfe4800eb05db5f58f6561ff268`

~~~~~~~~markdown
- The public release posture is preview.
- External installs default `fgos` through the Rust host.
- Public docs may state that Rust host is the default installed runtime.
- Rust host is the default runtime path for activated workspace installs.
- Legacy Node fallback is deprecated immediately as a public/default runtime
  posture.
- Legacy Node fallback may remain only as an explicit escape hatch during a
  short compatibility window. It must require an intentional selector such as
  an environment variable, flag, or equivalent supported mechanism; it must not
  silently catch Rust-host failures.
- Any escape-hatch invocation must emit a warning, log entry, or proof marker
  that distinguishes deliberate legacy fallback use from default Rust-host use. **Status note (2026-10-14):** This marker remains an open requirement, not implemented for direct npm/Node compatibility invocation (`bin/fgos.mjs`, as checked in `review-4-packaging-truth-f6.md`, truth-sample-28). The invocation record is opt-in and emitted only through Rust-host legacy-cli routes (`apps/fgos/src/legacy_exec.rs:176-191`); it does not satisfy this obligation for direct Node entry.
- The escape hatch remains supported for 30 calendar days after the preview
  release publication date. The public preview tag `v0.1.0` was published on
  2026-09-18, so the earliest removal date for this preview release is
  2026-10-18 unless a later release decision replaces that support promise.
~~~~~~~~

Sentence-local additions for this fix:

`docs/platform/packaging-distribution/verification/install-and-release-proof.md`

~~~~~~~~markdown
- Any escape-hatch invocation must emit a warning, log entry, or proof marker
  that distinguishes deliberate legacy fallback use from default Rust-host use. **Status note (2026-10-14):** This marker remains an open requirement, not implemented for direct npm/Node compatibility invocation (`bin/fgos.mjs`, as checked in `review-4-packaging-truth-f6.md`, truth-sample-28). The invocation record is opt-in and emitted only through Rust-host legacy-cli routes (`apps/fgos/src/legacy_exec.rs:176-191`); it does not satisfy this obligation for direct Node entry.
~~~~~~~~

`docs/platform/packaging-distribution/verification/implementation-alignment.md`

~~~~~~~~markdown
Legacy Node fallback is deprecated immediately as public/default posture and remains only as the settled, explicit escape hatch with warning/log/proof marker for 30 calendar days after preview release publication. **Status note (2026-10-14):** The warning/log/proof marker is an open requirement for direct npm/Node entry (`bin/fgos.mjs`, `review-4-packaging-truth-f6.md` truth-sample-28); the Rust-host record is opt-in (`apps/fgos/src/legacy_exec.rs:176-191`). The retained dated decision is not proof that this marker is implemented.
~~~~~~~~

## Every changed native unit

Native refresh retained the old identities and created five new content identities; four stable headings change digest at the same ID/path/anchor. No old ID is lost or grafted. The registry stays scratch until eventual batch closure. All unchanged native bindings keep their existing independent evidence.

### docs/platform/packaging-distribution/contracts/skill-package-distribution.md#3-implemented-model

Before claim ID: `claim_8346d3fc0bd4551aae82a045dc081a3f`; current claim ID: `claim_8346d3fc0bd4551aae82a045dc081a3f`

Complete native before: `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#3-implemented-model`
Unit digest: `60647e3fe7bc9ecdea9d6a06c0d7758979a28930daf0b1b32ba9186736406e58`; shown-text SHA256: `c895bdff7e2c7906de97df25ecb205fb38f653f338d3b2ac2e7f732961be7f49`

~~~~~~~~markdown
## 3. Implemented Model

Current canonical authoring sources:

```txt
core/skills/
domains/<domain>/skills/
```

Current generated or assembled distribution targets:

```txt
.agents/skills/ (assembled portable projection)
.claude/skills/ (generated thin wrappers for canonical skills; hand-authored skills preserved)
plugins/fgOS/skills/ (mirrored fgos-* dev skills and _shared/; hand-authored plugin skills preserved)
.gemini/extensions/fgos/ (prototype extension package generator; partial/planned)
```

Current build/proof surfaces:

| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs` |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |

Generated targets are not the source of truth. They may be committed for host compatibility, but edits should flow from the canonical source through the generator. Note that host trees may be mixed: `plugins/fgOS/skills/` contains hand-authored user commands (`pick`, `submit`, `cook`, `list`, etc.) alongside mirrored `fgos-*` dev skills, and `.claude/skills/` preserves hand-authored skills (`ui-spec`, `gitnexus`) without treating them as generated wrappers.

Run `npm run build:skills` in the fgOS source repo after editing canonical skill sources. Every Markdown file written by assembly carries a one-line HTML generated-from header naming its repo-relative `core/skills/...` or `domains/<domain>/skills/...` source and that rebuild command. The header follows byte-identical YAML frontmatter, or is the first line when none exists. Plugin mirrors and Claude companion/reference files inherit it through copying; Claude `SKILL.md` thin wrappers retain their generated-wrapper marker and point to the assembled projection whose header identifies the canonical source. Non-Markdown bytes and hand-authored plugin CLI-wrapper skills are unchanged.
~~~~~~~~

Complete native current: `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#3-implemented-model`
Unit digest: `df6fa52885ed92efcfee0882fbddb65b54e5d5ee372ae9dfc65047ccb663e1e8`; shown-text SHA256: `073c812c909745d3b2388683bfc615ea5c22cb8c7a69547bffc998d0ea1bdd9d`

~~~~~~~~markdown
## 3. Implemented Model

Current canonical authoring sources:

```txt
core/skills/
domains/<domain>/skills/
```

Current generated or assembled distribution targets:

```txt
.agents/skills/ (assembled portable projection)
.claude/skills/ (generated thin wrappers for canonical skills; hand-authored skills preserved)
plugins/fgOS/skills/ (mirrored fgos-* dev skills and _shared/; hand-authored plugin skills preserved)
.gemini/extensions/fgos/ (prototype extension package generator; partial/planned)
```

Current build/proof surfaces:

| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs`  **Status note (2026-10-14):** The retained implementation claim overstates doctor/fix coverage: `plugin-dev-skills-packaged` detects missing files only (`src/setup/registrations.mjs:3251-3276`); byte drift is checked by `test/skills/fgos-mirror.test.mjs:137`, and this check has no registered repair. |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |

Generated targets are not the source of truth. They may be committed for host compatibility, but edits should flow from the canonical source through the generator. Note that host trees may be mixed: `plugins/fgOS/skills/` contains hand-authored user commands (`pick`, `submit`, `cook`, `list`, etc.) alongside mirrored `fgos-*` dev skills, and `.claude/skills/` preserves hand-authored skills (`ui-spec`, `gitnexus`) without treating them as generated wrappers.

Run `npm run build:skills` in the fgOS source repo after editing canonical skill sources. Every Markdown file written by assembly carries a one-line HTML generated-from header naming its repo-relative `core/skills/...` or `domains/<domain>/skills/...` source and that rebuild command. The header follows byte-identical YAML frontmatter, or is the first line when none exists. Plugin mirrors and Claude companion/reference files inherit it through copying; Claude `SKILL.md` thin wrappers retain their generated-wrapper marker and point to the assembled projection whose header identifies the canonical source. Non-Markdown bytes and hand-authored plugin CLI-wrapper skills are unchanged.
~~~~~~~~

### docs/platform/packaging-distribution/contracts/skill-package-distribution.md#unheaded-block-11

Before claim ID: `claim_8db02d2c23a009bfaab4b9e9bdba4622`; current claim ID: `claim_a58bad2441b40698889c8e0187d2605e`

Complete native before: `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#unheaded-block-11`
Unit digest: `6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b`; shown-text SHA256: `6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b`

~~~~~~~~markdown
| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs` |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |
~~~~~~~~

Complete native current: `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#unheaded-block-11`
Unit digest: `1c0ced47def581b2c6236f710da48b9b52fa6b13795bf4d037c1b528d19dc987`; shown-text SHA256: `1c0ced47def581b2c6236f710da48b9b52fa6b13795bf4d037c1b528d19dc987`

~~~~~~~~markdown
| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs`  **Status note (2026-10-14):** The retained implementation claim overstates doctor/fix coverage: `plugin-dev-skills-packaged` detects missing files only (`src/setup/registrations.mjs:3251-3276`); byte drift is checked by `test/skills/fgos-mirror.test.mjs:137`, and this check has no registered repair. |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |
~~~~~~~~

### docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding

Before claim ID: `claim_203f72d4c42176464e86f820f009abb9`; current claim ID: `claim_203f72d4c42176464e86f820f009abb9`

Complete native before: `docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding`
Unit digest: `af026389acc476c217dd34e67292fe2ab3a06c89ccbe09e95f77a5f342e9e2f1`; shown-text SHA256: `e00f1788095d833ad6bb4d38a06a52b3fa605f7441c9589dcd3feb5d4ecb76fa`

~~~~~~~~markdown
#### 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
~~~~~~~~

Complete native current: `docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding`
Unit digest: `32761eb7cc5ab63a191f4a707e6e56cf65a32c3dd5d605aa5558346377edfb40`; shown-text SHA256: `ee69bcb619898365a7b38bc0eb13bb4ab438e82e13b39b6553be5dea8cf8e2c8`

~~~~~~~~markdown
#### 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

**Retained dated design — status note (2026-10-14):** The bootstrap-context permission below is source design, not current behavior. Preflight is static and never executes candidate release code (`packages/distribution/rust/src/init.rs:431-446`).
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime. **Status note (2026-10-14):** The permission in the first sentence is retained dated design, not implemented: static preflight never runs candidate code and the proposed environment-variable bootstrap context was never honored by a host (`packages/distribution/rust/src/init.rs:431-446`). The must-not obligation remains.
~~~~~~~~

### docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25

Before claim ID: `claim_a5a9eff7862eb4e558507650d03fc8e5`; current claim ID: `claim_2566edd0ea51c9acd1bdd66d339973ab`

Complete native before: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25`
Unit digest: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`; shown-text SHA256: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`

~~~~~~~~markdown
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
~~~~~~~~

Complete native current: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25`
Unit digest: `273e89aa19e81dcc743483fe3e51606dcf949278cadecb37a885aa39014cec2b`; shown-text SHA256: `273e89aa19e81dcc743483fe3e51606dcf949278cadecb37a885aa39014cec2b`

~~~~~~~~markdown
**Retained dated design — status note (2026-10-14):** The bootstrap-context permission below is source design, not current behavior. Preflight is static and never executes candidate release code (`packages/distribution/rust/src/init.rs:431-446`).
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
~~~~~~~~

### docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27

Before claim ID: `claim_c5d5879d2c0a7a26ae5ac47fa47748c0`; current claim ID: `claim_c8989bed5c55666aa1cc0354bd963812`

Complete native before: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27`
Unit digest: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`; shown-text SHA256: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
~~~~~~~~

Complete native current: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27`
Unit digest: `6fbabae72e49d14c8ea861f42ffc8ee4180d3b83c968871b6ea38ace19b92d9a`; shown-text SHA256: `6fbabae72e49d14c8ea861f42ffc8ee4180d3b83c968871b6ea38ace19b92d9a`

~~~~~~~~markdown
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime. **Status note (2026-10-14):** The permission in the first sentence is retained dated design, not implemented: static preflight never runs candidate code and the proposed environment-variable bootstrap context was never honored by a host (`packages/distribution/rust/src/init.rs:431-446`). The must-not obligation remains.
~~~~~~~~

### docs/platform/packaging-distribution/verification/install-and-release-proof.md#6-settled-node-fallback-policy

Before claim ID: `claim_51b8e85b394738184789d7d5e5082c9d`; current claim ID: `claim_51b8e85b394738184789d7d5e5082c9d`

Complete native before: `docs/platform/packaging-distribution/verification/install-and-release-proof.md#6-settled-node-fallback-policy`
Unit digest: `e6d01264c4854a3eea5840c631cb7a62ebec91b3e42648654bc74238ec36bb7e`; shown-text SHA256: `7f11572f69dd74b662b8ada8f866f2bf96738ec6a29aa66cc795c15707cf47cd`

~~~~~~~~markdown
## 6. Settled Node Fallback Policy

Public/default release posture means the officially supported release stance
for users outside the source checkout: which release channel is published or
recommended, which installed `fgos` entrypoint is documented as the default,
and what compatibility/rollback promise the release owner makes for that
channel. It is broader than local proof that a workspace-installed path can
enter the Rust host.

The compatibility posture is now settled as:

- The public release posture is preview.
- External installs default `fgos` through the Rust host.
- Public docs may state that Rust host is the default installed runtime.
- Rust host is the default runtime path for activated workspace installs.
- Legacy Node fallback is deprecated immediately as a public/default runtime
  posture.
- Legacy Node fallback may remain only as an explicit escape hatch during a
  short compatibility window. It must require an intentional selector such as
  an environment variable, flag, or equivalent supported mechanism; it must not
  silently catch Rust-host failures.
- Any escape-hatch invocation must emit a warning, log entry, or proof marker
  that distinguishes deliberate legacy fallback use from default Rust-host use.
- The escape hatch remains supported for 30 calendar days after the preview
  release publication date. The public preview tag `v0.1.0` was published on
  2026-09-18, so the earliest removal date for this preview release is
  2026-10-18 unless a later release decision replaces that support promise.

This policy does not mean every component has moved to Rust. It means the
user-facing default entrypoint is Rust-host-owned; the Rust host may still
execute the legacy Node payload through the release manifest while that payload
remains a component behind the host boundary.

If the Rust host fails, support/rollback guidance follows the explicit
deprecated Node fallback escape-hatch policy above. Silent fallback is not part
of the support promise.
~~~~~~~~

Complete native current: `docs/platform/packaging-distribution/verification/install-and-release-proof.md#6-settled-node-fallback-policy`
Unit digest: `e004f1bd1e6f3be3f9e5c5e290a5f2934b0d222a315409018d1776a12d807554`; shown-text SHA256: `6d56aeb2b645b7b70039af194dce61ab213a23ad83011805c2827594de957638`

~~~~~~~~markdown
## 6. Settled Node Fallback Policy

Public/default release posture means the officially supported release stance
for users outside the source checkout: which release channel is published or
recommended, which installed `fgos` entrypoint is documented as the default,
and what compatibility/rollback promise the release owner makes for that
channel. It is broader than local proof that a workspace-installed path can
enter the Rust host.

The compatibility posture is now settled as:

- The public release posture is preview.
- External installs default `fgos` through the Rust host.
- Public docs may state that Rust host is the default installed runtime.
- Rust host is the default runtime path for activated workspace installs.
- Legacy Node fallback is deprecated immediately as a public/default runtime
  posture.
- Legacy Node fallback may remain only as an explicit escape hatch during a
  short compatibility window. It must require an intentional selector such as
  an environment variable, flag, or equivalent supported mechanism; it must not
  silently catch Rust-host failures.
- Any escape-hatch invocation must emit a warning, log entry, or proof marker
  that distinguishes deliberate legacy fallback use from default Rust-host use. **Status note (2026-10-14):** This marker remains an open requirement, not implemented for direct npm/Node compatibility invocation (`bin/fgos.mjs`, as checked in `review-4-packaging-truth-f6.md`, truth-sample-28). The invocation record is opt-in and emitted only through Rust-host legacy-cli routes (`apps/fgos/src/legacy_exec.rs:176-191`); it does not satisfy this obligation for direct Node entry.
- The escape hatch remains supported for 30 calendar days after the preview
  release publication date. The public preview tag `v0.1.0` was published on
  2026-09-18, so the earliest removal date for this preview release is
  2026-10-18 unless a later release decision replaces that support promise.

This policy does not mean every component has moved to Rust. It means the
user-facing default entrypoint is Rust-host-owned; the Rust host may still
execute the legacy Node payload through the release manifest while that payload
remains a component behind the host boundary.

If the Rust host fails, support/rollback guidance follows the explicit
deprecated Node fallback escape-hatch policy above. Silent fallback is not part
of the support promise.
~~~~~~~~

### docs/platform/packaging-distribution/verification/install-and-release-proof.md#unheaded-block-17

Before claim ID: `claim_5f74e7c956ad4a546af303d9f15fb8e2`; current claim ID: `claim_b1c72fca65660f4b58be153780bc5435`

Complete native before: `docs/platform/packaging-distribution/verification/install-and-release-proof.md#unheaded-block-17`
Unit digest: `6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed`; shown-text SHA256: `6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed`

~~~~~~~~markdown
- The public release posture is preview.
- External installs default `fgos` through the Rust host.
- Public docs may state that Rust host is the default installed runtime.
- Rust host is the default runtime path for activated workspace installs.
- Legacy Node fallback is deprecated immediately as a public/default runtime
  posture.
- Legacy Node fallback may remain only as an explicit escape hatch during a
  short compatibility window. It must require an intentional selector such as
  an environment variable, flag, or equivalent supported mechanism; it must not
  silently catch Rust-host failures.
- Any escape-hatch invocation must emit a warning, log entry, or proof marker
  that distinguishes deliberate legacy fallback use from default Rust-host use.
- The escape hatch remains supported for 30 calendar days after the preview
  release publication date. The public preview tag `v0.1.0` was published on
  2026-09-18, so the earliest removal date for this preview release is
  2026-10-18 unless a later release decision replaces that support promise.
~~~~~~~~

Complete native current: `docs/platform/packaging-distribution/verification/install-and-release-proof.md#unheaded-block-17`
Unit digest: `0a6462a61aad15b54f05f1516733d66bbaa77dfe4800eb05db5f58f6561ff268`; shown-text SHA256: `0a6462a61aad15b54f05f1516733d66bbaa77dfe4800eb05db5f58f6561ff268`

~~~~~~~~markdown
- The public release posture is preview.
- External installs default `fgos` through the Rust host.
- Public docs may state that Rust host is the default installed runtime.
- Rust host is the default runtime path for activated workspace installs.
- Legacy Node fallback is deprecated immediately as a public/default runtime
  posture.
- Legacy Node fallback may remain only as an explicit escape hatch during a
  short compatibility window. It must require an intentional selector such as
  an environment variable, flag, or equivalent supported mechanism; it must not
  silently catch Rust-host failures.
- Any escape-hatch invocation must emit a warning, log entry, or proof marker
  that distinguishes deliberate legacy fallback use from default Rust-host use. **Status note (2026-10-14):** This marker remains an open requirement, not implemented for direct npm/Node compatibility invocation (`bin/fgos.mjs`, as checked in `review-4-packaging-truth-f6.md`, truth-sample-28). The invocation record is opt-in and emitted only through Rust-host legacy-cli routes (`apps/fgos/src/legacy_exec.rs:176-191`); it does not satisfy this obligation for direct Node entry.
- The escape hatch remains supported for 30 calendar days after the preview
  release publication date. The public preview tag `v0.1.0` was published on
  2026-09-18, so the earliest removal date for this preview release is
  2026-10-18 unless a later release decision replaces that support promise.
~~~~~~~~

### docs/platform/packaging-distribution/verification/implementation-alignment.md#3-alignment-table

Before claim ID: `claim_095d9f70331b803e8fdfa59bbda82d0c`; current claim ID: `claim_095d9f70331b803e8fdfa59bbda82d0c`

Complete native before: `docs/platform/packaging-distribution/verification/implementation-alignment.md#3-alignment-table`
Unit digest: `34771c42ba42aea9b74bf36110de97211b1fc60a9c6d45652134b01bb8abaf7e`; shown-text SHA256: `e05531d1bb8d2d77393f9620717e85883ddf7f765f9af46a6bc733ecb77c515b`

~~~~~~~~markdown
## 3. Alignment Table

| Design claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| `fgctl` is the recommended install/bootstrap entry. | implemented preview | `README.md`, `install.sh`, `test/install/install-sh.test.mjs`, `scripts/ci-external-consumer.sh`, `.github/workflows/release.yml`, GitHub release `v0.1.0` published 2026-09-18 with `fgctl-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `fgos-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `SHA256SUMS`, and `install.sh` | Stable/default graduation remains a release-owner decision; preview install channel is proven by release workflow 35317876419 and post-release CI/external-consumer proof 35498322149. |
| Release tree includes native `bin/fgos`, runner shim, legacy Node payload, and manifest. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `packages/distribution/rust/src/manifest.rs`, `packages/distribution/rust/tests/schema_golden.rs` | Frozen V1 schema in `contracts/release-manifest.md` with legacyNode locator invariant and golden tests. |
| `artifactDigest` is manifest/tree identity, not archive checksum. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `scripts/ci-external-consumer.sh` | Extract exact digest contract into a schema doc if needed. |
| Repository/workspace/release-store layout boundaries are explicit. | partial | `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`, `docs/architect/packaging-distribution/runtime-identity-and-activation.md`, `docs/architect/packaging-distribution/scope-map.md` | Verify worker capsule and projection ledger implementation before marking full. |
| Workspace root binding snapshot lives under `.fgos/installation/root.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs` | Frozen V1 schema in `contracts/repository-runtime-layout.md` with golden tests. |
| Workspace `.fgos/distribution.json` is the tracked runtime pin. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `docs/platform/packaging-distribution/contracts/distribution-pin.md` | Frozen V1 schema in `contracts/distribution-pin.md` with golden tests. |
| `fgctl stage` verifies candidate release content before trust. | implemented | `packages/distribution/rust/src/verify.rs` (`verify_release_files`, `verify_legacy_node`), `packages/distribution/rust/src/store.rs`, `apps/fgos/src/legacy_exec.rs`, `test/rust-host/fgctl-stage.test.mjs`, `apps/fgos/tests/cli_tests.rs` (commits 19000200, 3b3a95fc) | Staging, preflight, and host admission enforce `verify_release_files` and `verify_legacy_node`, refusing symlink components (files and intermediate directories), path traversal, and payload digest mismatches before trust/execution. |
| Workspace activation is per-workspace through `.fgos/installation/activation.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `src/setup/bin-discovery.mjs` | Frozen V1 schema in `contracts/activation-binding.md` with golden tests. |
| Workspace local `fgos` can enter the Rust host through activation. | implemented preview | `test/rust-host/fgctl-init.test.mjs`, `scripts/ci-external-consumer.sh`, `docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Public preview posture is settled: external installs default `fgos` through the Rust host, public docs may state Rust host is the default installed runtime, and proof covers local fixture plus external-consumer asset flow where `version --runtime-json` reports `host: "rust"` and the activated `artifactDigest`. Stable/default release posture remains a separate release-owner decision. |
| Workspace command resolution prefers activated workspace installation before other tiers. | implemented | `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs` | Ensure any Rust/Herdr resolver keeps the same tier order. |
| Legacy npm/Node install remains compatibility path. | implemented legacy deprecated | `package.json`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, `test/install-packaging.test.mjs`, `README.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Coordinator decision (2026-09-15) confirms this posture for the preview release: Rust host is the default runtime path for activated workspace installs and external installs. Legacy Node fallback is deprecated immediately as public/default posture and remains only as the settled, explicit escape hatch with warning/log/proof marker for 30 calendar days after preview release publication. |
| `fgos doctor` default path is read-only. | implemented | `docs/specs/distribution.md`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | Keep future checks from writing in check-only mode. |
| `fgos doctor --fix` runs registered fixes then reports. | implemented | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/registrations.test.mjs`, `test/setup/*.test.mjs` | Avoid copying a stale full fix list into prose. |
| `fgos setup` also runs registered fixes as deprecated legacy compatibility. | implemented legacy deprecated | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/cli/fgos-manifest.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs`, `test/setup/*.test.mjs` | P8 keeps old behavior reachable while command surfaces and setup payload point workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`; shell/global integration remains legacy setup compatibility under the 30-day preview fallback window unless superseded by a later release decision. |
| Project config overrides global config. | implemented | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` | Keep doctor/fix and legacy setup docs clear that global fills, project wins. |
| Canonical instruction sources are registered and discovered from `core/instructions/`, `components/<component>/instructions/`, and `domains/<domain>/instructions/`. | implemented | `src/setup/instruction-registry.mjs`, `test/setup/instruction-registry.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P3 complete: source discovery, rule force classification, authority/specificity/applicability metadata, and registry tests implemented. Keep new instruction owners registered rather than discovered from docs prose. |
| Instruction rules compose into a machine-readable effective instruction set before rendering. | implemented | `src/setup/instruction-composition.mjs`, `test/setup/instruction-composition.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P4 complete: composition emits stable effective-set IR, applies law/boundary/procedure/preference/host-adapter order, and fails explicit conflicts instead of last-write-wins. Portable projection repair is implemented in P5; host-specific adapter expansion remains demand-driven. |
| `AGENTS.md` is the primary portable instruction projection; host-specific instruction files are adapters only when needed. | implemented | `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs`, `src/setup/registrations.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P5 implements the portable `AGENTS.md` managed-block renderer, effective-set JSON materialization, projection ledger entry, and doctor check/fix repair path. No host-specific duplicate file is generated without an adapter need. |
| Canonical skill authoring is split by component/domain source. | implemented | `core/skills/`, `domains/*/skills/`, `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs`, `docs/architect/domainization/README.md` | Keep duplicate-name protection active as domains add skills. |
| `.agents/skills` and `.claude/skills` are generated projections, not canonical source. | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` | Instruction projection ledger evidence exists for P5; skill projection ledger coverage remains a separate follow-up. |
| Plugin-only consumers receive required dev skills. | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Mirrored `fgos-*` dev skills and `_shared/` distinguished from hand-authored plugin skills in `plugins/fgOS/skills/` (`contracts/skill-package-distribution.md`). |
| Host-neutral skill intent ids map to host-native triggers. | partial | `src/setup/skill-wrappers.mjs` (`mapSkillIntentToHostTriggers`, `discoverCanonicalSkills`), `test/setup/skill-wrappers.test.mjs` | Direct 1:1 intent-to-trigger mapping implemented for canonical skills; routing/pick and shipped Claude compatibility vocabulary (`/fgOS:pick`, `/fgOS:submit`) marked partial pending public-intent metadata or explicit alias contract (P3-P5). |
| Gemini receives a native extension/package target for fgOS skills. | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` | Extension package layout and prototype generator implemented in P2; full build/release packaging, install pipeline, and doctor check integration planned for subsequent phase. |
| Shared skill fragments cannot collide across component-owned sources. | implemented | `src/setup/skill-wrappers.mjs` (`discoverSharedFragments`, `assembleSkills`), `test/setup/skill-wrappers.test.mjs` | Move toward namespaced fragment layout (_shared/<owner>/) as multi-domain fragments expand. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | implemented | `domains/coding/skills/fgos-code-panel/`, `test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs` | Proved via canonical source in coding domain with generated projections in `.agents/skills`, `.claude/skills`, and `plugins/fgOS/skills`. |
| Packaging-distribution is the platform-support component for packaging, install, activation, and doctor/fix readiness. | partial | `docs/platform/packaging-distribution/README.md`, `docs/platform/component-boundary.md`, `docs/architect/component-boundary/component-boundary-advisory.md` | Promote the detailed component-boundary source into `docs/platform/component-boundary.md` before marking final. |
| `fgctl` never writes host-visible projections directly. | implemented | `apps/fgctl/src/main.rs`, `packages/distribution/rust/src/init.rs` (`publish_and_tail`, `preflight_candidate`), `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Proved in P7: fgctl stages releases, creates stable shims/root/activation records, and invokes local runtime tail without writing host-visible projections directly; candidate preflight writes nothing. |
| Shared gateway/web remains future-only. | planned | `docs/platform/packaging-distribution/architecture/future-constraints.md` | Revisit when gateway owns a project runtime adapter. |
~~~~~~~~

Complete native current: `docs/platform/packaging-distribution/verification/implementation-alignment.md#3-alignment-table`
Unit digest: `c5ef945c749e02cd0479a2540196f51ffadf62f984dbfb5f5ba933509a9d96a4`; shown-text SHA256: `61c417598a52716667d2393358cc9ba322de961730fd2d2fcfb487a0a6bf4f39`

~~~~~~~~markdown
## 3. Alignment Table

| Design claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| `fgctl` is the recommended install/bootstrap entry. | implemented preview | `README.md`, `install.sh`, `test/install/install-sh.test.mjs`, `scripts/ci-external-consumer.sh`, `.github/workflows/release.yml`, GitHub release `v0.1.0` published 2026-09-18 with `fgctl-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `fgos-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `SHA256SUMS`, and `install.sh` | Stable/default graduation remains a release-owner decision; preview install channel is proven by release workflow 35317876419 and post-release CI/external-consumer proof 35498322149. |
| Release tree includes native `bin/fgos`, runner shim, legacy Node payload, and manifest. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `packages/distribution/rust/src/manifest.rs`, `packages/distribution/rust/tests/schema_golden.rs` | Frozen V1 schema in `contracts/release-manifest.md` with legacyNode locator invariant and golden tests. |
| `artifactDigest` is manifest/tree identity, not archive checksum. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `scripts/ci-external-consumer.sh` | Extract exact digest contract into a schema doc if needed. |
| Repository/workspace/release-store layout boundaries are explicit. | partial | `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`, `docs/architect/packaging-distribution/runtime-identity-and-activation.md`, `docs/architect/packaging-distribution/scope-map.md` | Verify worker capsule and projection ledger implementation before marking full. |
| Workspace root binding snapshot lives under `.fgos/installation/root.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs` | Frozen V1 schema in `contracts/repository-runtime-layout.md` with golden tests. |
| Workspace `.fgos/distribution.json` is the tracked runtime pin. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `docs/platform/packaging-distribution/contracts/distribution-pin.md` | Frozen V1 schema in `contracts/distribution-pin.md` with golden tests. |
| `fgctl stage` verifies candidate release content before trust. | implemented | `packages/distribution/rust/src/verify.rs` (`verify_release_files`, `verify_legacy_node`), `packages/distribution/rust/src/store.rs`, `apps/fgos/src/legacy_exec.rs`, `test/rust-host/fgctl-stage.test.mjs`, `apps/fgos/tests/cli_tests.rs` (commits 19000200, 3b3a95fc) | Staging, preflight, and host admission enforce `verify_release_files` and `verify_legacy_node`, refusing symlink components (files and intermediate directories), path traversal, and payload digest mismatches before trust/execution. |
| Workspace activation is per-workspace through `.fgos/installation/activation.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `src/setup/bin-discovery.mjs` | Frozen V1 schema in `contracts/activation-binding.md` with golden tests. |
| Workspace local `fgos` can enter the Rust host through activation. | implemented preview | `test/rust-host/fgctl-init.test.mjs`, `scripts/ci-external-consumer.sh`, `docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Public preview posture is settled: external installs default `fgos` through the Rust host, public docs may state Rust host is the default installed runtime, and proof covers local fixture plus external-consumer asset flow where `version --runtime-json` reports `host: "rust"` and the activated `artifactDigest`. Stable/default release posture remains a separate release-owner decision. |
| Workspace command resolution prefers activated workspace installation before other tiers. | implemented | `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs` | Ensure any Rust/Herdr resolver keeps the same tier order. |
| Legacy npm/Node install remains compatibility path. | implemented legacy deprecated | `package.json`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, `test/install-packaging.test.mjs`, `README.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Coordinator decision (2026-09-15) confirms this posture for the preview release: Rust host is the default runtime path for activated workspace installs and external installs. Legacy Node fallback is deprecated immediately as public/default posture and remains only as the settled, explicit escape hatch with warning/log/proof marker for 30 calendar days after preview release publication. **Status note (2026-10-14):** The warning/log/proof marker is an open requirement for direct npm/Node entry (`bin/fgos.mjs`, `review-4-packaging-truth-f6.md` truth-sample-28); the Rust-host record is opt-in (`apps/fgos/src/legacy_exec.rs:176-191`). The retained dated decision is not proof that this marker is implemented. |
| `fgos doctor` default path is read-only. | implemented | `docs/specs/distribution.md`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | Keep future checks from writing in check-only mode. |
| `fgos doctor --fix` runs registered fixes then reports. | implemented | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/registrations.test.mjs`, `test/setup/*.test.mjs` | Avoid copying a stale full fix list into prose. |
| `fgos setup` also runs registered fixes as deprecated legacy compatibility. | implemented legacy deprecated | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/cli/fgos-manifest.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs`, `test/setup/*.test.mjs` | P8 keeps old behavior reachable while command surfaces and setup payload point workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`; shell/global integration remains legacy setup compatibility under the 30-day preview fallback window unless superseded by a later release decision. |
| Project config overrides global config. | implemented | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` | Keep doctor/fix and legacy setup docs clear that global fills, project wins. |
| Canonical instruction sources are registered and discovered from `core/instructions/`, `components/<component>/instructions/`, and `domains/<domain>/instructions/`. | implemented | `src/setup/instruction-registry.mjs`, `test/setup/instruction-registry.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P3 complete: source discovery, rule force classification, authority/specificity/applicability metadata, and registry tests implemented. Keep new instruction owners registered rather than discovered from docs prose. |
| Instruction rules compose into a machine-readable effective instruction set before rendering. | implemented | `src/setup/instruction-composition.mjs`, `test/setup/instruction-composition.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P4 complete: composition emits stable effective-set IR, applies law/boundary/procedure/preference/host-adapter order, and fails explicit conflicts instead of last-write-wins. Portable projection repair is implemented in P5; host-specific adapter expansion remains demand-driven. |
| `AGENTS.md` is the primary portable instruction projection; host-specific instruction files are adapters only when needed. | implemented | `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs`, `src/setup/registrations.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P5 implements the portable `AGENTS.md` managed-block renderer, effective-set JSON materialization, projection ledger entry, and doctor check/fix repair path. No host-specific duplicate file is generated without an adapter need. |
| Canonical skill authoring is split by component/domain source. | implemented | `core/skills/`, `domains/*/skills/`, `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs`, `docs/architect/domainization/README.md` | Keep duplicate-name protection active as domains add skills. |
| `.agents/skills` and `.claude/skills` are generated projections, not canonical source. | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` | Instruction projection ledger evidence exists for P5; skill projection ledger coverage remains a separate follow-up. |
| Plugin-only consumers receive required dev skills. | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Mirrored `fgos-*` dev skills and `_shared/` distinguished from hand-authored plugin skills in `plugins/fgOS/skills/` (`contracts/skill-package-distribution.md`). |
| Host-neutral skill intent ids map to host-native triggers. | partial | `src/setup/skill-wrappers.mjs` (`mapSkillIntentToHostTriggers`, `discoverCanonicalSkills`), `test/setup/skill-wrappers.test.mjs` | Direct 1:1 intent-to-trigger mapping implemented for canonical skills; routing/pick and shipped Claude compatibility vocabulary (`/fgOS:pick`, `/fgOS:submit`) marked partial pending public-intent metadata or explicit alias contract (P3-P5). |
| Gemini receives a native extension/package target for fgOS skills. | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` | Extension package layout and prototype generator implemented in P2; full build/release packaging, install pipeline, and doctor check integration planned for subsequent phase. |
| Shared skill fragments cannot collide across component-owned sources. | implemented | `src/setup/skill-wrappers.mjs` (`discoverSharedFragments`, `assembleSkills`), `test/setup/skill-wrappers.test.mjs` | Move toward namespaced fragment layout (_shared/<owner>/) as multi-domain fragments expand. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | implemented | `domains/coding/skills/fgos-code-panel/`, `test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs` | Proved via canonical source in coding domain with generated projections in `.agents/skills`, `.claude/skills`, and `plugins/fgOS/skills`. |
| Packaging-distribution is the platform-support component for packaging, install, activation, and doctor/fix readiness. | partial | `docs/platform/packaging-distribution/README.md`, `docs/platform/component-boundary.md`, `docs/architect/component-boundary/component-boundary-advisory.md` | Promote the detailed component-boundary source into `docs/platform/component-boundary.md` before marking final. |
| `fgctl` never writes host-visible projections directly. | implemented | `apps/fgctl/src/main.rs`, `packages/distribution/rust/src/init.rs` (`publish_and_tail`, `preflight_candidate`), `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Proved in P7: fgctl stages releases, creates stable shims/root/activation records, and invokes local runtime tail without writing host-visible projections directly; candidate preflight writes nothing. |
| Shared gateway/web remains future-only. | planned | `docs/platform/packaging-distribution/architecture/future-constraints.md` | Revisit when gateway owns a project runtime adapter. |
~~~~~~~~

### docs/platform/packaging-distribution/verification/implementation-alignment.md#unheaded-block-5

Before claim ID: `claim_23aa9eddbe0a401a9d68aa29470f2618`; current claim ID: `claim_6ea4185ed63550ef849daaedb8a999d1`

Complete native before: `docs/platform/packaging-distribution/verification/implementation-alignment.md#unheaded-block-5`
Unit digest: `75a79276b3c2305221a561a733259f29f4c76ea5bacdc6754b26547e37722c7d`; shown-text SHA256: `75a79276b3c2305221a561a733259f29f4c76ea5bacdc6754b26547e37722c7d`

~~~~~~~~markdown
| Design claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| `fgctl` is the recommended install/bootstrap entry. | implemented preview | `README.md`, `install.sh`, `test/install/install-sh.test.mjs`, `scripts/ci-external-consumer.sh`, `.github/workflows/release.yml`, GitHub release `v0.1.0` published 2026-09-18 with `fgctl-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `fgos-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `SHA256SUMS`, and `install.sh` | Stable/default graduation remains a release-owner decision; preview install channel is proven by release workflow 35317876419 and post-release CI/external-consumer proof 35498322149. |
| Release tree includes native `bin/fgos`, runner shim, legacy Node payload, and manifest. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `packages/distribution/rust/src/manifest.rs`, `packages/distribution/rust/tests/schema_golden.rs` | Frozen V1 schema in `contracts/release-manifest.md` with legacyNode locator invariant and golden tests. |
| `artifactDigest` is manifest/tree identity, not archive checksum. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `scripts/ci-external-consumer.sh` | Extract exact digest contract into a schema doc if needed. |
| Repository/workspace/release-store layout boundaries are explicit. | partial | `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`, `docs/architect/packaging-distribution/runtime-identity-and-activation.md`, `docs/architect/packaging-distribution/scope-map.md` | Verify worker capsule and projection ledger implementation before marking full. |
| Workspace root binding snapshot lives under `.fgos/installation/root.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs` | Frozen V1 schema in `contracts/repository-runtime-layout.md` with golden tests. |
| Workspace `.fgos/distribution.json` is the tracked runtime pin. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `docs/platform/packaging-distribution/contracts/distribution-pin.md` | Frozen V1 schema in `contracts/distribution-pin.md` with golden tests. |
| `fgctl stage` verifies candidate release content before trust. | implemented | `packages/distribution/rust/src/verify.rs` (`verify_release_files`, `verify_legacy_node`), `packages/distribution/rust/src/store.rs`, `apps/fgos/src/legacy_exec.rs`, `test/rust-host/fgctl-stage.test.mjs`, `apps/fgos/tests/cli_tests.rs` (commits 19000200, 3b3a95fc) | Staging, preflight, and host admission enforce `verify_release_files` and `verify_legacy_node`, refusing symlink components (files and intermediate directories), path traversal, and payload digest mismatches before trust/execution. |
| Workspace activation is per-workspace through `.fgos/installation/activation.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `src/setup/bin-discovery.mjs` | Frozen V1 schema in `contracts/activation-binding.md` with golden tests. |
| Workspace local `fgos` can enter the Rust host through activation. | implemented preview | `test/rust-host/fgctl-init.test.mjs`, `scripts/ci-external-consumer.sh`, `docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Public preview posture is settled: external installs default `fgos` through the Rust host, public docs may state Rust host is the default installed runtime, and proof covers local fixture plus external-consumer asset flow where `version --runtime-json` reports `host: "rust"` and the activated `artifactDigest`. Stable/default release posture remains a separate release-owner decision. |
| Workspace command resolution prefers activated workspace installation before other tiers. | implemented | `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs` | Ensure any Rust/Herdr resolver keeps the same tier order. |
| Legacy npm/Node install remains compatibility path. | implemented legacy deprecated | `package.json`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, `test/install-packaging.test.mjs`, `README.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Coordinator decision (2026-09-15) confirms this posture for the preview release: Rust host is the default runtime path for activated workspace installs and external installs. Legacy Node fallback is deprecated immediately as public/default posture and remains only as the settled, explicit escape hatch with warning/log/proof marker for 30 calendar days after preview release publication. |
| `fgos doctor` default path is read-only. | implemented | `docs/specs/distribution.md`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | Keep future checks from writing in check-only mode. |
| `fgos doctor --fix` runs registered fixes then reports. | implemented | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/registrations.test.mjs`, `test/setup/*.test.mjs` | Avoid copying a stale full fix list into prose. |
| `fgos setup` also runs registered fixes as deprecated legacy compatibility. | implemented legacy deprecated | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/cli/fgos-manifest.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs`, `test/setup/*.test.mjs` | P8 keeps old behavior reachable while command surfaces and setup payload point workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`; shell/global integration remains legacy setup compatibility under the 30-day preview fallback window unless superseded by a later release decision. |
| Project config overrides global config. | implemented | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` | Keep doctor/fix and legacy setup docs clear that global fills, project wins. |
| Canonical instruction sources are registered and discovered from `core/instructions/`, `components/<component>/instructions/`, and `domains/<domain>/instructions/`. | implemented | `src/setup/instruction-registry.mjs`, `test/setup/instruction-registry.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P3 complete: source discovery, rule force classification, authority/specificity/applicability metadata, and registry tests implemented. Keep new instruction owners registered rather than discovered from docs prose. |
| Instruction rules compose into a machine-readable effective instruction set before rendering. | implemented | `src/setup/instruction-composition.mjs`, `test/setup/instruction-composition.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P4 complete: composition emits stable effective-set IR, applies law/boundary/procedure/preference/host-adapter order, and fails explicit conflicts instead of last-write-wins. Portable projection repair is implemented in P5; host-specific adapter expansion remains demand-driven. |
| `AGENTS.md` is the primary portable instruction projection; host-specific instruction files are adapters only when needed. | implemented | `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs`, `src/setup/registrations.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P5 implements the portable `AGENTS.md` managed-block renderer, effective-set JSON materialization, projection ledger entry, and doctor check/fix repair path. No host-specific duplicate file is generated without an adapter need. |
| Canonical skill authoring is split by component/domain source. | implemented | `core/skills/`, `domains/*/skills/`, `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs`, `docs/architect/domainization/README.md` | Keep duplicate-name protection active as domains add skills. |
| `.agents/skills` and `.claude/skills` are generated projections, not canonical source. | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` | Instruction projection ledger evidence exists for P5; skill projection ledger coverage remains a separate follow-up. |
| Plugin-only consumers receive required dev skills. | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Mirrored `fgos-*` dev skills and `_shared/` distinguished from hand-authored plugin skills in `plugins/fgOS/skills/` (`contracts/skill-package-distribution.md`). |
| Host-neutral skill intent ids map to host-native triggers. | partial | `src/setup/skill-wrappers.mjs` (`mapSkillIntentToHostTriggers`, `discoverCanonicalSkills`), `test/setup/skill-wrappers.test.mjs` | Direct 1:1 intent-to-trigger mapping implemented for canonical skills; routing/pick and shipped Claude compatibility vocabulary (`/fgOS:pick`, `/fgOS:submit`) marked partial pending public-intent metadata or explicit alias contract (P3-P5). |
| Gemini receives a native extension/package target for fgOS skills. | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` | Extension package layout and prototype generator implemented in P2; full build/release packaging, install pipeline, and doctor check integration planned for subsequent phase. |
| Shared skill fragments cannot collide across component-owned sources. | implemented | `src/setup/skill-wrappers.mjs` (`discoverSharedFragments`, `assembleSkills`), `test/setup/skill-wrappers.test.mjs` | Move toward namespaced fragment layout (_shared/<owner>/) as multi-domain fragments expand. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | implemented | `domains/coding/skills/fgos-code-panel/`, `test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs` | Proved via canonical source in coding domain with generated projections in `.agents/skills`, `.claude/skills`, and `plugins/fgOS/skills`. |
| Packaging-distribution is the platform-support component for packaging, install, activation, and doctor/fix readiness. | partial | `docs/platform/packaging-distribution/README.md`, `docs/platform/component-boundary.md`, `docs/architect/component-boundary/component-boundary-advisory.md` | Promote the detailed component-boundary source into `docs/platform/component-boundary.md` before marking final. |
| `fgctl` never writes host-visible projections directly. | implemented | `apps/fgctl/src/main.rs`, `packages/distribution/rust/src/init.rs` (`publish_and_tail`, `preflight_candidate`), `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Proved in P7: fgctl stages releases, creates stable shims/root/activation records, and invokes local runtime tail without writing host-visible projections directly; candidate preflight writes nothing. |
| Shared gateway/web remains future-only. | planned | `docs/platform/packaging-distribution/architecture/future-constraints.md` | Revisit when gateway owns a project runtime adapter. |
~~~~~~~~

Complete native current: `docs/platform/packaging-distribution/verification/implementation-alignment.md#unheaded-block-5`
Unit digest: `337119230317d450243e7262b70478e740f5e71270e3c8d8ba5ef003cf7b967b`; shown-text SHA256: `337119230317d450243e7262b70478e740f5e71270e3c8d8ba5ef003cf7b967b`

~~~~~~~~markdown
| Design claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| `fgctl` is the recommended install/bootstrap entry. | implemented preview | `README.md`, `install.sh`, `test/install/install-sh.test.mjs`, `scripts/ci-external-consumer.sh`, `.github/workflows/release.yml`, GitHub release `v0.1.0` published 2026-09-18 with `fgctl-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `fgos-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `SHA256SUMS`, and `install.sh` | Stable/default graduation remains a release-owner decision; preview install channel is proven by release workflow 35317876419 and post-release CI/external-consumer proof 35498322149. |
| Release tree includes native `bin/fgos`, runner shim, legacy Node payload, and manifest. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `packages/distribution/rust/src/manifest.rs`, `packages/distribution/rust/tests/schema_golden.rs` | Frozen V1 schema in `contracts/release-manifest.md` with legacyNode locator invariant and golden tests. |
| `artifactDigest` is manifest/tree identity, not archive checksum. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `scripts/ci-external-consumer.sh` | Extract exact digest contract into a schema doc if needed. |
| Repository/workspace/release-store layout boundaries are explicit. | partial | `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`, `docs/architect/packaging-distribution/runtime-identity-and-activation.md`, `docs/architect/packaging-distribution/scope-map.md` | Verify worker capsule and projection ledger implementation before marking full. |
| Workspace root binding snapshot lives under `.fgos/installation/root.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs` | Frozen V1 schema in `contracts/repository-runtime-layout.md` with golden tests. |
| Workspace `.fgos/distribution.json` is the tracked runtime pin. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `docs/platform/packaging-distribution/contracts/distribution-pin.md` | Frozen V1 schema in `contracts/distribution-pin.md` with golden tests. |
| `fgctl stage` verifies candidate release content before trust. | implemented | `packages/distribution/rust/src/verify.rs` (`verify_release_files`, `verify_legacy_node`), `packages/distribution/rust/src/store.rs`, `apps/fgos/src/legacy_exec.rs`, `test/rust-host/fgctl-stage.test.mjs`, `apps/fgos/tests/cli_tests.rs` (commits 19000200, 3b3a95fc) | Staging, preflight, and host admission enforce `verify_release_files` and `verify_legacy_node`, refusing symlink components (files and intermediate directories), path traversal, and payload digest mismatches before trust/execution. |
| Workspace activation is per-workspace through `.fgos/installation/activation.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `src/setup/bin-discovery.mjs` | Frozen V1 schema in `contracts/activation-binding.md` with golden tests. |
| Workspace local `fgos` can enter the Rust host through activation. | implemented preview | `test/rust-host/fgctl-init.test.mjs`, `scripts/ci-external-consumer.sh`, `docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Public preview posture is settled: external installs default `fgos` through the Rust host, public docs may state Rust host is the default installed runtime, and proof covers local fixture plus external-consumer asset flow where `version --runtime-json` reports `host: "rust"` and the activated `artifactDigest`. Stable/default release posture remains a separate release-owner decision. |
| Workspace command resolution prefers activated workspace installation before other tiers. | implemented | `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs` | Ensure any Rust/Herdr resolver keeps the same tier order. |
| Legacy npm/Node install remains compatibility path. | implemented legacy deprecated | `package.json`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, `test/install-packaging.test.mjs`, `README.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Coordinator decision (2026-09-15) confirms this posture for the preview release: Rust host is the default runtime path for activated workspace installs and external installs. Legacy Node fallback is deprecated immediately as public/default posture and remains only as the settled, explicit escape hatch with warning/log/proof marker for 30 calendar days after preview release publication. **Status note (2026-10-14):** The warning/log/proof marker is an open requirement for direct npm/Node entry (`bin/fgos.mjs`, `review-4-packaging-truth-f6.md` truth-sample-28); the Rust-host record is opt-in (`apps/fgos/src/legacy_exec.rs:176-191`). The retained dated decision is not proof that this marker is implemented. |
| `fgos doctor` default path is read-only. | implemented | `docs/specs/distribution.md`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | Keep future checks from writing in check-only mode. |
| `fgos doctor --fix` runs registered fixes then reports. | implemented | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/registrations.test.mjs`, `test/setup/*.test.mjs` | Avoid copying a stale full fix list into prose. |
| `fgos setup` also runs registered fixes as deprecated legacy compatibility. | implemented legacy deprecated | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/cli/fgos-manifest.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs`, `test/setup/*.test.mjs` | P8 keeps old behavior reachable while command surfaces and setup payload point workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`; shell/global integration remains legacy setup compatibility under the 30-day preview fallback window unless superseded by a later release decision. |
| Project config overrides global config. | implemented | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` | Keep doctor/fix and legacy setup docs clear that global fills, project wins. |
| Canonical instruction sources are registered and discovered from `core/instructions/`, `components/<component>/instructions/`, and `domains/<domain>/instructions/`. | implemented | `src/setup/instruction-registry.mjs`, `test/setup/instruction-registry.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P3 complete: source discovery, rule force classification, authority/specificity/applicability metadata, and registry tests implemented. Keep new instruction owners registered rather than discovered from docs prose. |
| Instruction rules compose into a machine-readable effective instruction set before rendering. | implemented | `src/setup/instruction-composition.mjs`, `test/setup/instruction-composition.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P4 complete: composition emits stable effective-set IR, applies law/boundary/procedure/preference/host-adapter order, and fails explicit conflicts instead of last-write-wins. Portable projection repair is implemented in P5; host-specific adapter expansion remains demand-driven. |
| `AGENTS.md` is the primary portable instruction projection; host-specific instruction files are adapters only when needed. | implemented | `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs`, `src/setup/registrations.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P5 implements the portable `AGENTS.md` managed-block renderer, effective-set JSON materialization, projection ledger entry, and doctor check/fix repair path. No host-specific duplicate file is generated without an adapter need. |
| Canonical skill authoring is split by component/domain source. | implemented | `core/skills/`, `domains/*/skills/`, `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs`, `docs/architect/domainization/README.md` | Keep duplicate-name protection active as domains add skills. |
| `.agents/skills` and `.claude/skills` are generated projections, not canonical source. | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` | Instruction projection ledger evidence exists for P5; skill projection ledger coverage remains a separate follow-up. |
| Plugin-only consumers receive required dev skills. | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Mirrored `fgos-*` dev skills and `_shared/` distinguished from hand-authored plugin skills in `plugins/fgOS/skills/` (`contracts/skill-package-distribution.md`). |
| Host-neutral skill intent ids map to host-native triggers. | partial | `src/setup/skill-wrappers.mjs` (`mapSkillIntentToHostTriggers`, `discoverCanonicalSkills`), `test/setup/skill-wrappers.test.mjs` | Direct 1:1 intent-to-trigger mapping implemented for canonical skills; routing/pick and shipped Claude compatibility vocabulary (`/fgOS:pick`, `/fgOS:submit`) marked partial pending public-intent metadata or explicit alias contract (P3-P5). |
| Gemini receives a native extension/package target for fgOS skills. | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` | Extension package layout and prototype generator implemented in P2; full build/release packaging, install pipeline, and doctor check integration planned for subsequent phase. |
| Shared skill fragments cannot collide across component-owned sources. | implemented | `src/setup/skill-wrappers.mjs` (`discoverSharedFragments`, `assembleSkills`), `test/setup/skill-wrappers.test.mjs` | Move toward namespaced fragment layout (_shared/<owner>/) as multi-domain fragments expand. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | implemented | `domains/coding/skills/fgos-code-panel/`, `test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs` | Proved via canonical source in coding domain with generated projections in `.agents/skills`, `.claude/skills`, and `plugins/fgOS/skills`. |
| Packaging-distribution is the platform-support component for packaging, install, activation, and doctor/fix readiness. | partial | `docs/platform/packaging-distribution/README.md`, `docs/platform/component-boundary.md`, `docs/architect/component-boundary/component-boundary-advisory.md` | Promote the detailed component-boundary source into `docs/platform/component-boundary.md` before marking final. |
| `fgctl` never writes host-visible projections directly. | implemented | `apps/fgctl/src/main.rs`, `packages/distribution/rust/src/init.rs` (`publish_and_tail`, `preflight_candidate`), `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Proved in P7: fgctl stages releases, creates stable shims/root/activation records, and invokes local runtime tail without writing host-visible projections directly; candidate preflight writes nothing. |
| Shared gateway/web remains future-only. | planned | `docs/platform/packaging-distribution/architecture/future-constraints.md` | Revisit when gateway owns a project runtime adapter. |
~~~~~~~~

## Exact A28 list consequences

The list still has 692 eligible units. The other 686 tuples are unchanged. Only these six changes are submitted; they must equal the fresh native strict E output.

| Path and anchor | Before ID / digest | Current ID / digest |
|---|---|---|
| `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#3-implemented-model` | `claim_8346d3fc0bd4551aae82a045dc081a3f` / `60647e3fe7bc9ecdea9d6a06c0d7758979a28930daf0b1b32ba9186736406e58` | `claim_8346d3fc0bd4551aae82a045dc081a3f` / `df6fa52885ed92efcfee0882fbddb65b54e5d5ee372ae9dfc65047ccb663e1e8` |
| `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#unheaded-block-11` | `claim_8db02d2c23a009bfaab4b9e9bdba4622` / `6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b` | `claim_a58bad2441b40698889c8e0187d2605e` / `1c0ced47def581b2c6236f710da48b9b52fa6b13795bf4d037c1b528d19dc987` |
| `docs/platform/packaging-distribution/verification/implementation-alignment.md#3-alignment-table` | `claim_095d9f70331b803e8fdfa59bbda82d0c` / `34771c42ba42aea9b74bf36110de97211b1fc60a9c6d45652134b01bb8abaf7e` | `claim_095d9f70331b803e8fdfa59bbda82d0c` / `c5ef945c749e02cd0479a2540196f51ffadf62f984dbfb5f5ba933509a9d96a4` |
| `docs/platform/packaging-distribution/verification/implementation-alignment.md#unheaded-block-5` | `claim_23aa9eddbe0a401a9d68aa29470f2618` / `75a79276b3c2305221a561a733259f29f4c76ea5bacdc6754b26547e37722c7d` | `claim_6ea4185ed63550ef849daaedb8a999d1` / `337119230317d450243e7262b70478e740f5e71270e3c8d8ba5ef003cf7b967b` |
| `docs/platform/packaging-distribution/verification/install-and-release-proof.md#6-settled-node-fallback-policy` | `claim_51b8e85b394738184789d7d5e5082c9d` / `e6d01264c4854a3eea5840c631cb7a62ebec91b3e42648654bc74238ec36bb7e` | `claim_51b8e85b394738184789d7d5e5082c9d` / `e004f1bd1e6f3be3f9e5c5e290a5f2934b0d222a315409018d1776a12d807554` |
| `docs/platform/packaging-distribution/verification/install-and-release-proof.md#unheaded-block-17` | `claim_5f74e7c956ad4a546af303d9f15fb8e2` / `6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed` | `claim_b1c72fca65660f4b58be153780bc5435` / `0a6462a61aad15b54f05f1516733d66bbaa77dfe4800eb05db5f58f6561ff268` |

## Review handback

Commit ordinary verdicts for the twelve rationale-only rows and the three changed source bindings. Review only truth fixes 2, 26, 28 and their nine shown native units / six reverse tuple consequences; report their current digests. Do not infer truth approval from conservation acceptance. No owner F6 disposition is requested or authorized here.

STOP. Next action: independent Lead review of this bounded request. No batch close, Step 5, promotion, push, rebase or main merge.
