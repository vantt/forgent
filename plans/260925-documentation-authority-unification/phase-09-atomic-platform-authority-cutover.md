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

Before source retirement, the Step 10 documentation-navigation owner must complete the independently reviewed entry-by-entry merge of `docs/specs/reading-map.md` into retained `docs/reading-map.md`, preserving its curated document and source-code navigation and checking all destinations. Repoint `AGENTS.md` and all other consumers only with the atomic cutover. The Step 5 reclassify disposition records retention, not a completed merge. Require the reviewed conservation/consumer receipts from [the Step 10 obligations](phase-06-transform-all-platform-areas-as-candidate-material.md#step-10-close) and [owner queue](reports/phase-06/owner-queue.md#root-authorities-cutover-obligations-after-closure-review). Resolve the digest-bound AGENTS two-line A34 residual before root-instruction cutover; no source-to-self retention authorizes its removal.

Phase 7 cutover note (L11-23/L11-25): refresh the main-authored Holder-lock main-door/worktree-admin status header during the main-import step; retain the correct reading-map transition banner and two compounding→knowledge fixes (+10/-2 versus `eab4d617b`, accepted divergence, PARK-PROTECTED-01 closed).

### First obligation — final changed-candidate accounting (A47/A48, L12-1)

Before promotion, account every changed candidate file per unit. Retain A47's original 35-file set (6 main-touched, 29 plan-only; 2,436 claims, 233 gaps at the recorded pin); do not replace it with only main imports. The final set is recomputed from B0 and includes every subsequent candidate edit. This is deferred accounting, not a waiver of conservation or current-truth review. No carry or rebind occurred in the Phase 8 detailing turn.

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

[Phase 8 merge accounting](reports/phase-08/merge-accounting.json) preserves merge/base/digest/main-commit provenance. Native identity transitions, content/context rebindings, approvals and per-unit review are still owed against final bytes. Also include legacy main edits, architecture-manifest changes and any later full identity-scope drift as their existing obligations require.

At landing, reconcile main's only references to its new PF-I011/PF-I012 rows in `plans/reports/phase-lead-261018-2025-controller-death-p06-doctor-docs-changelog.md` with their candidate PF-I022/PF-I023 identities; do not alter the plan's existing PF-I011/PF-I012. This is an intent-ledger collision account, not contract renumbering authority.

Keep these cutover seams explicit: A45 legacy CTR010 lines in `docs/architecture-map.md` (Gateway retains CTR010, confinement candidate CTR011; no new shipped-contract renumbering); `apps/fgos-gateway/src/gateway.rs:1187` runtime OpenAPI read; P7-DOC-GAP-05 dead-vocabulary pre-landing blocker and P7-DOC-GAP-06 stale citations; L11-23 Holder-lock header and L11-25 accepted reading-map divergence. L12-1 supersedes L11-20 only where main now registers event-seal/event-append and uses `withStateTx` instead of events/claims locks; preserve the distinct Event Store implementation status.

Phase 8's reproduction diagnostics currently enumerate 85 stale target bindings across nine targets. They do not authorize rebinding early or changing ownership-checker logic; the Lead must settle the requested all-pass test target versus A47's deferral before treating that preparation baseline as green.

**Cutover sequence:**

1. acquire a migration-specific exclusive documentation-cutover lease; while it
   is held, registered doc writers, dispatch admission, and merge gates refuse
   mutations to in-scope roots; enumerate worktrees and require clean/digest-
   matched sources before the lease and immediately before ref movement;
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

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

Determined when this phase is authorized; deliverable paths are listed under Requirements.

## Implementation Steps

To be detailed when this phase is explicitly authorized (plan.md §5). Deliverables and rules under Requirements are the contract.

## Success Criteria

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
