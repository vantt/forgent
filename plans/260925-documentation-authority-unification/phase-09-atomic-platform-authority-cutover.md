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

**Status:** `not-started`, `not-authorized`, blocked by Phase 8 and a separate explicit cutover approval.
**Mode:** dedicated cutover worktree; serialized mutation
**Purpose:** Promote one system and physically retire the competing system in one
reviewable integration change.

## Requirements

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
   after non-authority evidence payloads have been relocated and verified;
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
