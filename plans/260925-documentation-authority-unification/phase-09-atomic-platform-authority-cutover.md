---
phase: 9
title: "Atomic platform-authority cutover"
status: pending
priority: P1
effort: ""
dependencies: [8]
---

# Phase 9: Atomic platform-authority cutover

> Legacy numbering: this was **Phase 08** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `not-started`, `not-authorized`, blocked by Phase 8, a separate explicit cutover approval, and the cross-plan order in `plan.md` §7.5: runs only after Plan A phase 06 and Plan B phase 06 have landed, because both write `AGENTS.md`. Plan C (draft, unscheduled) is not a dependency. Every entry in `dropped-claims-register.json` must be restored or dispositioned first; dropped-001 may be dispositioned as "restore later, tracked by Plan C draft".
**Mode:** dedicated cutover worktree; serialized mutation
**Purpose:** Promote one system and physically retire the competing system in one
reviewable integration change.

## Requirements

### Owned PRE-FLIP prerequisites from closure round 2 (L12-129/L12-133)

The machine handoff is [readiness.preFlipGates](reports/phase-08/step-07-readiness.json) with exact owners/details in [the gate register](reports/phase-08/step-08-preflip-gates.json). All twelve gates remain unmet; disposition counts are not readiness. Before the cutover Land:

- **`L12-129-archive-ref-and-checkout` — Lead / Phase 9 landing owner:** publish the bulk plan records on an archive ref on origin; land a small manifest on main pointing to that ref and each blob id by a **real merge, no history rewrite**. Repoint or retire every direct, constructed-name, directory-filter and glob test/script reader in that same change, naming each owning proof. Include the six restored round3/round4 source-witness inputs. Measure a candidate worktree **well under 60 s before the cutover Land**. The old 2.94 GB candidate took 139.96 s (split checkout 143.7 s), versus main 3.67 s; TIP pruning did not pass. This requirement grants no push, landing, cutover or deletion now.
- **`source-context-and-post-pin-recomposition` — Documentation source-binding reviewer / Lead:** select and record a **new final source pin**, re-check all **518** changed-source records without prepared hunks (10 Step 3 / 30 Step 4 / 478 Step 5), and the **10 Step 3 / nine Step 4 / 125 Step 5** L12-130 deferred overlaps, each now owned. Re-enumerate every spec changed since the old pin, including branch-own edits. The observed eight composed-at-pin sources are `apps/fgos-gateway/Cargo.toml`, `apps/fgos-gateway/src/mcp.rs`, `docs/platform/component-boundary.md`, `docs/platform/git/spec.md`, `src/cli/command-registry.mjs`, `src/setup/registrations.mjs`, `test/runner/dispatch-executor-profile.test.mjs` and `test/runner/worktree.test.mjs`; they are not a future completeness claim. Independently review current preserve/reject/park judgments as well as recomposed patches. **Before every patch application, require actual whole-file SHA-256 equality to `beforeSha256`** (rollback: `expectedAfterSha256`); refuse drift and recompose/review first. `patch --fuzz=0` with offsets does not establish source equality.
- **`cutover-release-with-docs-lease` — Lead / release staging owner:** stage a release **after the `docs-lease` route exists**, including final relevant fixes, and prove installed-host acquire/status/release/abandon routing with release-id/source-pin provenance. The activated release recorded in review B r2 lacks this route; a working-tree dev-door rehearsal is not proof of that installed release.
- **`final-code-holder-land-rehearsal` — Lead / lease and Git landing owners:** after the archive move shrinks the tree, use the final staged code/release to reproduce actual holder Land publication, non-holder refusal and verified rollback. The `44ca64559` rehearsal predates later fixes and its holder Land failed `borrow-deadline`; it cannot discharge this gate.

The Phase 8 census is bounded to its recorded pin; post-pin fixture literals and any later behavioral readers must be re-enumerated, never presumed covered. No PRE-FLIP duty or staged-release requirement changes the separate Phase 8 closure/owner cutover approval boundary.

The Phase 9 cutover change must land these three documentation guards as the same-change replacement for the legacy-docs ratchet it retires (L10), per [L12-89](reports/phase-08/owner-answers.md#l12-89--documentation-guards-at-cutover-owner-2026-10-21-1609):

1. refuse new files under the retired roots (docs/specs/**, docs/architect/** and new numbered decision files), while allowing generated docs/decisions/index.md per [L12-96](reports/phase-08/owner-answers.md#l12-96--owner-accepts-park-family-resolutions-owner-2026-10-21-1817);
2. placement check for new documentation files against the Phase 4 minimum constitution placement rules, installed as placement-glob rows in the existing convention component (packages/convention/contracts/convention.rules.v1.json, docs/platform/convention/spec.md §3.2 reservation) with block posture for the retired roots;
3. link and anchor check inside docs/platform/**, owned by the doc-health body checks (decision 2026-10-07: convention owns path rules, doc-health reads bodies).

Reuse existing doors (fgos convention, existing doc checkers, pre-commit and doctor registration); no second checker. fgos doc new/classify, duplicate-owner and stale-projection checks stay in Phase 10.

Before source retirement, the Step 10 documentation-navigation owner must complete the independently reviewed entry-by-entry merge of `docs/specs/reading-map.md` into retained `docs/reading-map.md`, preserving its curated document and source-code navigation and checking all destinations. Repoint `AGENTS.md` and all other consumers only with the atomic cutover. The Step 5 reclassify disposition records retention, not a completed merge. Require the reviewed conservation/consumer receipts from [the Step 10 obligations](phase-06-transform-all-platform-areas-as-candidate-material.md#step-10-close) and [owner queue](reports/phase-06/owner-queue.md#root-authorities-cutover-obligations-after-closure-review). Resolve the digest-bound AGENTS two-line A34 residual before root-instruction cutover; no source-to-self retention authorizes its removal.

Phase 7 cutover note (L11-23/L11-25): refresh the main-authored Holder-lock main-door/worktree-admin status header during the main-import step; retain the correct reading-map transition banner and two compounding→knowledge fixes (+10/-2 versus `eab4d617b`, accepted divergence, PARK-PROTECTED-01 closed).

### First obligation — final changed-candidate accounting (A47/A48, L12-1)

Before promotion, account every changed candidate file per unit. Retain A47's original 35-file set (6 main-touched, 29 plan-only; 2,436 claims, 233 gaps at the recorded pin); do not replace it with only main imports. The final set is recomputed from B0 and includes every subsequent candidate edit. This is deferred accounting, not a waiver of conservation or current-truth review. No carry or rebind occurred in the Phase 8 detailing turns. L12-3 assigns the imported 85 binding repairs to Phase 8 Step 0, and every subsequent target-edit batch carries/rebinds its own changed units; this final accounting is not a deferred repair waiver.

Merge `49ad04648` imports main `708ea6608` and adds the following exact incoming `docs/platform/**` changed-file list to that obligation (union/deduplicate with the original set; thirteen paths is not a claim of thirteen additional unique files):

- `docs/platform/agent-protocol/spec.md`
- `docs/platform/component-boundary.md`
- `docs/platform/event-store/spec.md`
- `docs/platform/git/spec.md`
- `docs/platform/holder-lock/spec.md`
- `docs/platform/intent-preservation-ledger.md`
- `docs/platform/packaging-distribution/contracts/activation-binding.md`
- `docs/platform/packaging-distribution/contracts/release-manifest.md`
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`
- `docs/platform/process/spec.md`
- `docs/platform/run-supervisor/spec.md`
- `docs/platform/session-identity/spec.md`
- `docs/platform/terminal-control/spec.md`

Merges `e1966d417` (local main `1d89e8177`) and `cbdf18555` (main `a0db9ca8e`) add the following incoming `docs/platform/**` changed-file obligations (union/deduplicate with the original and later sets, not additional unique-file counts):

- `docs/platform/component-boundary.md`
- `docs/platform/event-store/spec.md`
- `docs/platform/identity/spec.md`
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`
- `docs/platform/yaml-document/spec.md`

YAML Document has no candidate binding in the current ledger. Before flip, the documentation-navigation/area-inventory owner must route this incoming area through a switchboard row, the retained reading-map entry union and the inventory; its existing signed spec and imported Rust implementation status do not silently promote it. Identity must retain its section 7a local session-writer scope. Exact changed-document and content/neighbour binding witnesses are in [L12-130 accounting](reports/phase-08/step-08-l12-130-merge-accounting.json); existing source identities and independent-review duties remain intact.

Merge `022c0ee67` (actual main parent `628e47d86`, two board-only commits beyond the brief's `28127bc15`) adds the following incoming `docs/platform/**` changed-file obligations (union/deduplicate with the original and later sets, not additional unique-file counts):

- `docs/platform/component-boundary.md`
- `docs/platform/config/spec.md`
- `docs/platform/holder-lock/spec.md`
- `docs/platform/identity/spec.md`

Config has no candidate binding in the current ledger; its signed spec predates this import. Before flip, the documentation-navigation/area-inventory owner must route its incoming Rust crate, section schemas and standard status through the switchboard, retained reading-map entry union and inventory, without silently promoting the area or claiming caller wiring. Identity's section 7a local session-writer scope stays intact. Exact provenance and the one content/neighbour-verified component-table rebind are in [W0 accounting](reports/phase-09/w0-merge-accounting.json) and [binding witnesses](reports/phase-09/w0-merge-rebindings.json); independent changed-binding review and final-pin source recomposition remain owed.

Merge `bc5589ed7` (main parent `62ce98513`, 233 imported commits) adds the following incoming `docs/platform/**` changed-file obligations (union/deduplicate with all earlier sets; not seven additional unique files):

- `docs/platform/component-boundary.md`
- `docs/platform/event-store/spec.md`
- `docs/platform/git/spec.md`
- `docs/platform/identity/spec.md`
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`
- `docs/platform/terminal-control/spec.md`
- `docs/platform/yaml-document/spec.md`

The import's complete provenance, both-parent conflict witnesses, registry reconciliation, Step 0 content/neighbour checks and deferred Step 3/4/5 overlaps are in [import accounting](reports/phase-09/import2/merge-accounting.json). [Binding refresh](reports/phase-09/import2/binding-refresh.json) and `ledger/decisions/s16-import2-resync.json` carry current legacy changes, including RUL108 replacing the historical vendored-parser policy, into existing holders. The retained detailed navigation holder is `docs/reading-map.md` section 5, not a second platform map. Identity §7a retains its local session-writer scope; imported signing changes do not broaden this turn's authority. Every changed binding requires a fresh independent verdict; frozen gate/review projections and final-pin source recomposition remain owned by their existing owners. No authority promotion or cutover is performed.

Merge `571a996f5` (main parent `cac2f6ce7`, 69 imported commits) adds these incoming `docs/platform/**` obligations (union/deduplicate with earlier sets; not four additional unique files):

- `docs/platform/config/spec.md`
- `docs/platform/git/spec.md`
- `docs/platform/holder-lock/spec.md`
- `docs/platform/secrets/spec.md`

[Import accounting](reports/phase-09/import3/merge-accounting.json) records exact parents/base and every changed documentation path; [Step 0](reports/phase-09/import3/binding-check.json) checks all four incoming documents with both frozen extractors. The legacy re-sync is **done on the plan branch**: all 24 changed units are carried with pending bindings ([s18 shard](ledger/decisions/s18-import3-resync.json)), `docs/reading-map.md` section 5 carries the imported confinement and config updates, the drift scanner reports prepared-only shards as `preparedPendingApply` instead of resolving them against the live tree, and the three ratchet exception digests are refreshed against 571a996f5. [Receipt](reports/phase-09/import3/receipt.md) and [review](reports/phase-09/reviews/w11-import3-review.md) record the checks. Independent per-unit review of the pending bindings, and the drift scan after the prepared shards are applied, remain owed at the final pin; no authority promotion is claimed.

[Phase 8 merge accounting](reports/phase-08/merge-accounting.json) preserves merge/base/digest/main-commit provenance. Final native identity transitions, content/context validation, approvals and per-unit review remain owed against final bytes; incorporate the Phase 8 Step 0 and subsequent N1 receipts rather than deferring those binding repairs. Also include legacy main edits, architecture-manifest changes and any later full identity-scope drift as their existing obligations require.

At landing, reconcile main's only references to its new PF-I011/PF-I012 rows in `plans/reports/phase-lead-261018-2025-controller-death-p06-doctor-docs-changelog.md` with their candidate PF-I022/PF-I023 identities; do not alter the plan's existing PF-I011/PF-I012. This is an intent-ledger collision account, not contract renumbering authority.

Keep these cutover seams explicit: A45 legacy CTR010 lines in `docs/architecture-map.md` (Gateway retains CTR010, confinement candidate CTR011; no new shipped-contract renumbering); `apps/fgos-gateway/src/gateway.rs:1187` runtime OpenAPI read; P7-DOC-GAP-05 dead-vocabulary pre-landing blocker and P7-DOC-GAP-06 stale citations; L11-23 Holder-lock header and L11-25 accepted reading-map divergence. L12-1 supersedes L11-20 only where main now registers event-seal/event-append and uses `withStateTx` instead of events/claims locks; preserve the distinct Event Store implementation status.

L12-3 supersedes L12-2: the 85 imported stale target bindings across all nine files are Phase 8 Step 0 package work, not a pending Phase 9 rebind decision. Require its reviewed committed-byte receipts and both manifests' ownership audits/checks.mjs against final committed bytes after the separate L12-11 accounting commit; L12-14 withdraws L12-12, so require every frozen B pin and the unchanged reproduction test green; classifier/inventory work is outside Phase 8; any cutover edit to a target carries/rebinds changed units in its own package. Include every Phase 8-edited docs/platform path in A47's final union. No checker weakening, blanket expected-red allowance or frozen-baseline edit.

L12-4 reserves the literal repository-wide reader/writer legacy-authority search for post-flip step 10; Phase 8 supplies switchboard routing or exact cutover patches for every row. L12-7's docs/specs/** and docs/architect/** consumer edits are exact packet patches here, never early Phase 8 target edits. The AGENTS.md packet must pin Plan A/B phase 06 landing status. L12-13 supersedes L12-6: Phase 8 builds and independently proves the owner-accepted cutover lease as a thin wrapper on Holder-lock `acquire` under its own registered lease lock name and typed Git doors, with the committed held sidecar carrying the freeze across processes (L12-15) after a pinned read-only reuse check. No Git 04 landing wait. Require its delivered/rehearsed refusal and rollback receipts; real design/port conflicts go to the owner’s five-part decision packet. The Lead updates the program-board DOC row outside this scoped turn. Decision F revisit (L12-9): the legacy-root ratchet remains deferred from main and retires with those roots; no --record mode.

**Cutover sequence:**

1. acquire the Phase 8-delivered exclusive documentation-cutover lease, the
   owner-accepted no-TTL/fail-closed thin wrapper on current Holder-lock and typed
   Git doors (L12-13/L12-15; lease design §6), using `src/holder-lock/index.mjs` `acquire` under the lease-owned lock-registry name coordinated with the Holder-lock owner before build. The shared callback-scoped `withMainCheckout` mutex is used only for brief cutover ref/commit operations, never as the multi-process lease. Require independent rehearsal/refusal/
   rollback proof first; no second lock/ref guard and no Git 04 landing dependency.
   While held, refuse non-holder dispatch at `fgos run`, `fgos workflow start` and
   `bind()` (the old dispatch-execute door is removed), and in-scope writes/commits/
   ref movement through the reviewed doors, including reference-transaction protection;
   refuse only scope-intersecting merges, allowing code-only merges;
   Publication remains the only door to refs/fgos/*. Require explicit abandon,
   holder token outside the environment and committed held-sidecar missing-lock refusal.
   That sidecar persists the freeze across Units/processes and holder death until
   explicit release or owner abandon; losing the kernel lock never reopens writes.
   Enumerate worktrees and require clean/digest-matched sources before acquire
   and immediately before ref movement; release only after green verification
   or verified rollback under the lease;
2. rerun inventory and detect any unregistered/raw source drift since baseline;
   drift blocks cutover rather than being overwritten;
3. apply final candidate updates;
4. promote target authority metadata;
5. switch every reader and writer;
6. delete maintained files under `docs/specs/**` and `docs/architect/**` only
   after non-authority evidence payloads have been relocated and verified
   (per [the evidence relocation policy](evidence-payload-relocation-policy.md):
   `check-evidence-relocation --before` passes, the legacy copy is deleted,
   `--after` passes; payload bytes are never edited);
7. activate approved aliases in the minimal platform resolver, not as duplicate
   files;
8. regenerate projections and indexes;
9. enable no-legacy-path enforcement;
10. run semantic-remnant search and the full verification suite.

L12-17 dependency: carry legacy `docs/specs/work-state.md` RUL10 "bổ chú 3" (hot mutex `withStateTx`, main `dc8acf9bf`/`247d2d1a1`/`08d754c30`) into candidate `docs/platform/work-state/spec.md` RUL10 before applying the cutover patches for Pilot B rows 16 and 17 (`fgos-participant-contract.md:213,248`).

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

Determined when this phase is authorized; deliverable paths are listed under Requirements.

## Implementation Steps

To be detailed when this phase is explicitly authorized (plan.md §5). Deliverables and rules under Requirements are the contract.

## Success Criteria

Per [L12-89](reports/phase-08/owner-answers.md#l12-89--documentation-guards-at-cutover-owner-2026-10-21-1609), the following guards land in the same cutover change as ratchet retirement:

- [ ] refuse new files under the retired roots (docs/specs/**, docs/architect/**, retired decision files and index);
- [ ] placement check for new documentation files against the Phase 4 minimum constitution placement rules, installed as placement-glob rows in the existing convention component (packages/convention/contracts/convention.rules.v1.json, docs/platform/convention/spec.md §3.2 reservation) with block posture for the retired roots;
- [ ] link and anchor check inside docs/platform/**, owned by the doc-health body checks (decision 2026-10-07: convention owns path rules, doc-health reads bodies).

- [ ] only `docs/platform/**` owns maintained platform claims;
- [ ] no physical legacy platform authority remains;
- [ ] all aliases resolve to committed current targets;
- [ ] the sealed migration ledger exists at its durable target path and verifies;
- [ ] the documentation-cutover lease prevented registered writes and drift checks
  caught unregistered writes;
- [ ] complete suite and documentation checks are green.

## Risk Assessment

**Rollback:**

- one cutover commit or a tightly controlled commit train with a documented
  revert order;
- cutover itself appends no registry/event-log events;
- snapshot and verify generated projections, installation ledgers, alias state,
  and any installed-skill impact in addition to git state;
- never leave half the readers switched after a failed cutover;
- if gate failure occurs, restore the pre-cutover authority table, aliases,
  projections, and installed surfaces—not only tracked files—rather than
  declaring a partial success.

Program-level risks and countermeasures: `plan.md` §11.
