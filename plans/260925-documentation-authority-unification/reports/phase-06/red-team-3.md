# Red-team: Step 3 Host Invocation checkpoint

Reviewer: reviewer:claude-session:4df9e88c@2026-10-13
Author session: codex-session:1@2026-10-11
Pack commit: 76353c58eb885becc550d734fde5d7c2709cce33
Lead disposition: 0 Critical, 0 High. F1, F2, F5, F7 are rework in review-3-checkpoint-host-invocation.md. F3 and F4 follow the frozen area map and stay open as accepted Medium. F6 is routed to the owner. F8 to F10 are Low, fixed alongside F1.

Reviewer: independent red-team pass (read-only). Worktree HEAD 48195b2c2; legacy sources pinned at 83d757f4d.
Method: node scripts over the 431-row shard and the extractor (`extractMarkdownConservationUnits`), line-level and unit-level text containment, anchor and digest recomputation, code citation spot-checks, link resolution, promoted-area diff review.

Prefix for paths: `D` = `docs/platform/host-invocation-routing`, `L` = `docs/architect/host-invocation-routing`.

## Findings

### F1 (Medium) Dead restore pointers: 30 "historical reference unavailable" carriers point at paths that exist nowhere
- Source: `L/legacy-cli-transition.md#unheaded-block-8`, `#unheaded-block-14`, `#unheaded-block-21`, `#unheaded-block-29`; kernel/external/migration/roadmap units moved to restore groups dropped-002..017.
- Candidate: `D/architecture/legacy-cli-transition.md` (lines 82, 102, 127, 149), `D/architecture/node-to-rust-migration.md` (8), `D/architecture/external-provider-protocol.md` (7), `D/roadmap.md` (7), `D/spec.md` (4).
- Evidence: the in-place text for a moved unit was replaced by "this retained source detail is carried verbatim in `the dropped-009 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-...`)". Three different malformed prefixes are used: `docs/architect/contracts/...`, `docs/architect/host-invocation-routing/contracts/...`, `docs/architect/host-invocation-routing/release-boundaries.md#...`. None exists. The restored text really lives at `D/contracts/component-protocol.md#restored-*`, `D/architecture/release-boundaries.md#restored-*`, `D/verification/compatibility-harness.md#restored-*`, all of which exist. The text says the reference is "unavailable", which is false, and it is not a link. The only carrier for those units is therefore reachable by a reader only by searching.
- Not a lost claim (unit text is intact in the target, see "checked without finding"), but a reader of the legacy-cli doc sees a gap plus a dead pointer.
- Fix: replace each with a relative markdown link to the existing anchor (for example `../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case`) and drop "historical reference unavailable".

### F2 (Medium) False "historical plan unavailable in this checkout" in 9 promoted files; evidence links removed
- Source: `L/node-to-rust-component-migration.md` (Observe row), R2/R3 redirect plans, `L/rust-cli-and-proof-components-plan.md` R2/R3 execution-record rows.
- Candidate: `D/README.md`, `D/r2-external-process-rollout-plan.md`, `D/r3-remote-peer-rollout-plan.md`, `D/architecture/host-use-cases.md`, `D/architecture/node-to-rust-migration.md` (Observe row), `D/roadmap.md` (4), `D/verification/r2-external-process-proof.md`, `D/verification/r3-remote-peer-proof.md`, `D/verification/source-preservation-audit.md` (18 occurrences).
- Evidence: all three cited plans exist in this checkout at HEAD, under `archive/plans/260915-host-invocation-r2-external-process/plan.md`, `archive/plans/260918-host-invocation-r3-remote-peer/plan.md`, `archive/plans/260929-1501-metrics-friction-rust-native/plan.md` (verified with `ls`; they were archived by commit 22e54f834). The batch turned live evidence links backing `implemented preview` / `implemented complete` statuses (including the R3 remote-peer row and Observe row) into inert text and asserted something false. The R2/R3 redirect pages now redirect nowhere.
- Fix: retarget the links to `archive/plans/...` (correct relative depth), remove the "unavailable" phrase; keep the Draft wording on the redirects.

### F3 (Medium) Restored normative text sits inside ```` ```md ```` code fences in contract/architecture owners
- Source: all 16 restoration groups (dropped-002..017), 51 spans.
- Candidate: `D/contracts/component-protocol.md` (10 groups), `D/architecture/release-boundaries.md` (4), `D/verification/compatibility-harness.md` (2).
- Evidence: each restored span is rendered as a fenced `md` block. The extractor treats the fence as one `unheaded-block`, so several source units collapse into one target unit and no individual MUST/never sentence is citable or linkable; the contract doc presents requirements as quoted code. Example: component-protocol "Both adapters delegate a complete use case. A host must not split one state transaction..." is only reachable inside a fence.
- Fix (or document as owner-accepted): render the restored span as prose under the restore heading, with the Checked status block beside it, keeping the verbatim bytes.

### F4 (Medium) Wrong owner for several restored groups in `contracts/component-protocol.md`
- Source: `L/node-to-rust-component-migration.md#3-why-the-sequence-is-selected` and neighbours (rejected options rationale, dropped-013), `#unheaded-block-44..50` (per-component repeat procedure, dropped-014), `#unheaded-block-59` (rollback bullets, dropped-015), `L/rust-cli-and-proof-components-plan.md#changed-areas, #performance-gates, #exit-gate-and-verify` (P1 harness, dropped-016).
- Candidate: `D/contracts/component-protocol.md#restored-rejected-options-rationale`, `#restored-per-component-repeat-procedure`, `#restored-rollback-bullets`, `#restored-p1-compatibility-harness`.
- Evidence: these are decision rationale, a manual procedure, rollback policy and a phase harness plan with placeholder 25 ms / 10 ms budgets (the candidate's own note calls them "UNPROVEN as measurements"). They are filed under kind `contract`, while the sibling "test and review gates" table of the same plan went to `verification/compatibility-harness.md`. This splits one proof-plan between a contract and a verification doc, and a contract doc now carries unmeasured performance budgets. The frozen map assigns them, so this is a map-level concern the reviewer should confirm rather than a candidate slip.
- Fix: confirm placement at review; if kept, state in the contract doc that these sections are non-normative rationale/procedure, or route dropped-016 to the verification owner like dropped-017.

### F5 (Medium) Stale "current" route-count claims remain in the area and contradict code and each other
- Source: `L/rust-cli-and-proof-components-plan.md` route matrix statements; promoted rows `D/roadmap.md:33,92,97`, `D/spec.md:30`, `D/verification/source-preservation-audit.md:64` ("Code-verified current snapshot").
- Evidence: those rows say "73 selectors: 71 legacy-cli, two native (version, gate-bypass)". `packages/host-runtime/contracts/command-routes.json` (last changed 2026-10-12) has 75 selectors, 70 `legacy-cli`, 5 native: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. `D/architecture/node-to-rust-migration.md` already says Observe (metrics/friction) is `implemented complete` natively, so the candidate set contradicts itself. The README disclaimer ("not certifying current route counts") does not cover a row labelled "Code-verified current snapshot".
- Not introduced by this batch, but the batch declares "no new real conflict" and relies on A28 truth sampling; this is a concrete false current sentence likely to be drawn.
- Fix: either update the counts with a code citation or relabel as dated snapshot; resolve the "two native" versus Observe contradiction.

### F6 (Medium) Obsolete-flag supersede (dropped-010) rests on author inference, not an owner decision
- Source: `L/legacy-cli-transition.md#unheaded-block-14` ("`bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default").
- Candidate: `D/architecture/release-boundaries.md#unheaded-block-23` (claim_6a37273a0a45d24c53e344928c3edf22, disposition `supersede`), `D/README.md` section 10.
- Evidence: the `supersede` target is the "Checked status: FLAGGED obsolete" paragraph; the verbatim clause is retained in the fence, which is good. But `package.json:9-12` and the `bin/fgos.mjs` header only show that the compatibility entries still exist, not that the removal promise was withdrawn. `HI-I033` says the preview installed default flip is proven, so the clause's condition arguably holds and the promise is unfulfilled rather than obsolete. Whether it is withdrawn is an owner call; the register has `intentional: null` and the author's verdict is recorded as fact ("obsolete").
- Fix: wording "not yet executed; retained compatibility entries per bin/fgos.mjs header and AGENTS.md" and keep the owner-queue item open; do not close it as a settled conflict.

### F7 (Low) HI-I027 wording weakens "never hardcoded path" and invents a status label
- Source: `L/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path` ("never from PATH, never from the caller's cwd, never as an alternate package-manager bin entry, and never hardcoded").
- Candidate: `D/intent-preservation-ledger.md` HI-I027.
- Evidence: the row now says "never PATH, caller cwd, alternate npm bin selection or an unconfined hardcoded payload path", status changed from `implemented preview` to `code-checked boundary; dated preview proofs retained` (vocabulary not used elsewhere), and the note says root selection may come from environment bindings or `current_exe`-relative discovery (matches `apps/fgos/src/legacy_exec.rs:69-110`). The retained architecture text in `D/architecture/legacy-cli-transition.md:99` still says "read from the activation binding's manifest", which the code does not literally do (env or exe-relative root, then manifest verification). `unconfined` also matches AGENTS.md wording, so this is a qualified-but-supported weakening. The architecture doc and ledger now describe the mechanism differently with no cross-note. `D/spec.md:28` still labels the identity "accepted-not-implemented" while the same spec row 5 and HI-I027 say the resolver is implemented and code-checked.
- Fix: align spec.md:28 status, add a Checked-status note under the retained resolver paragraph, keep the standard status vocabulary.

### F8 (Low) Broken relative links in candidate restore sections (verbatim copy of source links)
- Candidate: `D/architecture/release-boundaries.md` (`./host-invocation-provider-routing.md`, `./rust-cli-and-proof-components-plan.md`, `../component-boundary/component-boundary-advisory.md`); `D/contracts/component-protocol.md:223` (`../component-boundary/component-boundary-advisory.md`).
- Evidence: link resolution over all non-history candidate files found only these four broken targets. The history copy of the retired plan also has ~35 broken links, expected for a verbatim non-authority snapshot.
- Fix: retarget to `../spec.md`, `../roadmap.md`, `../../component-boundary.md` (or the architect advisory), or mark them as source-relative.

### F9 (Low) Stale operational details retained verbatim with no per-item caveat
- Candidate: `D/roadmap.md:584,605,872` (`cargo test --manifest-path herdr-plugin/Cargo.toml`; directory was renamed `herdr-dashboard` in d4266597e and `herdr-plugin` no longer exists), `D/architecture/release-boundaries.md:64` layout comment `herdr-plugin/ excluded`, `D/spec.md:188,304` ("current herdr" as the gateway; code is `apps/fgos-gateway`), `D/architecture/legacy-cli-transition.md:105` Herdr call-site inventory.
- Evidence: the general wrapper says "not a fresh certification", and the layout Checked-status mentions `apps/fgos-gateway` but not the rename, so a reader can still copy a command that cannot run.
- Fix: add one Checked-status line for the verification-command table and for the layout tree noting the rename.

### F10 (Low) Cosmetic and header issues
- Truncated slug headings: `D/architecture/release-boundaries.md:144` ("... ownership hea"), `D/contracts/component-protocol.md:65` ("... dispatched te"). Truncation comes from anchor-length limits but is user visible.
- `Last reviewed: 2026-09-18` left unchanged on files that gained large "Added in candidate" sections (legacy-cli-transition, node-to-rust-migration, release-boundaries, component-protocol, compatibility-harness), while the history doc says "Pending". Misleading freshness.
- The retained "Migration Status Note" in 5 docs says "This document remains a legacy-current source ... The promoted platform docs are [this very file]" (for example `D/architecture/legacy-cli-transition.md:62`). The wrapper explains it is pinned text, so no authority leak, but the self-reference reads oddly.

## Summary count

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 6 (F1-F6) |
| Low | 4 (F7-F10) |

## Checked, no finding

- Lost or weakened claims: for all 431 rows, resolved each source unit from the pinned blobs via the extractor and tested exact containment (after link-normalisation) of every non-heading unit text in its target file: 0 misses. Line-level check over the five carried sources found the only non-verbatim lines are rewritten link targets and "See the intent preservation ledger" navigation. MUST/never/number statements sampled and present verbatim: "never from PATH ... never hardcoded", "configuration can never replace a built-in provider", "There is no 'roll back by changing provider selection' mechanism", "unless ... 30 calendar days", "25 ms / 10 ms placeholder budgets", "Option B is selected", "CI rejects ... legacy payload removal before its compatibility binding is removed".
- Stale anchors/digests: all 431 `targetAnchor` exist in their target files; all 431 `targetUnitDigest` match a recomputed unit digest; all 429 rationale-named source anchors match the unit the `sourceUnitDigest` resolves to; 0 mismatches.
- Unaccounted remainders: unit counts per source 75/48/67/38/90/113 = 431 all present; 0 duplicates; the two rows without the standard rationale pattern are the packaged-extension class (unheaded-block-8) and the dropped-010 supersede, both accounted.
- Invented claims: novel candidate lines (not in the six sources nor the pre-batch candidate) were limited to the "Added in candidate" wrappers, the "Retained selected source material" headings, restore headings and Checked-status/Code-evidence notes. Code citations spot-checked and accurate: Cargo.toml:1-17 (exclude list), package.json:9-12 and :27-35, bin/fgos.mjs:1-10 header, frame_codec.rs:1-16 (4-byte BE length-prefixed JSON-RPC 2.0), legacy_exec.rs:242-253 (spawn node, inherited stdio), operation_provider_router.rs:108-119 (exact version-pair match), contracts.rs:377-393 (open-string mechanism), registry.rs:19-69 (duplicate-binding link failure; replacement not honored at selection, which the Checked-status note correctly does not overclaim), invocation_service.rs admit/select/grant order and `Parked` terminal state.
- Archive/delete: only documentation-standardization-plan.md, kept in history verbatim under A8; source blob unchanged; no deletions.
- Authority leaks: no file outside `docs/platform/host-invocation-routing/` changed between 83d757f4d and 48195b2c2 (docs/architect untouched); the area README states promoted navigation only; the R2/R3 redirects are Draft with historical statuses explicitly labelled. Candidate headers keep "Design status: Draft; Canonical: Yes, after review", unchanged convention.
- Pointer-back carriers: none; every moved unit's text is present in the target (the only pointers are the dead ones in F1, whose content is carried elsewhere).
- Identical-unit exception: the two members (external-provider-protocol and legacy-cli-transition status/date/revised header) are the only digest `ab6730b9...` pair; subject documents differ; no semantic-owner exemption requested.
- Restoration groups: 16 groups present (10 component-protocol, 4 release-boundaries, 2 compatibility-harness), matching the area map and dropped-002..017.
- Not examined: the 572-row candidate-unverified list, review pack sidecar integrity, the sensitivity pack and fresh-reader materials, and the 30-unit truth sample (reviewer-owned and outside this red-team scope).
