# Phase 6: Read port and board definition

Status: draft. Decision: A6.

## Inputs
- Discussion §6 "Boards" (card contract, columns, read side, six guarantees) and §3 I39–I42.
- The crate from phases 4 and 5.

## Footprint
- `packages/portfolio/rust/**`, `apps/fgos/**`, `packages/portfolio/contracts/portfolio-cards.v1.json`

## Steps
1. Add the `portfolio-cards` contract at `packages/portfolio/contracts/portfolio-cards.v1.json` with the card shape `{ id, kind, title, parent, stage, state, column, waitingOn?, priority, groups: { area, plan, wave }, dependsOn, checklist?, artifacts, updatedAt }`.
2. Compute cards from the files on each read; a cache is allowed only per commit, as a disposable view.
3. Give each card a version derived from its source bytes and commit, and a change feed answering "changed since V".
4. Add one board definition per project: columns and the stage-to-column mapping, a workflow default with a per-project override.
5. Expose the read port as `fgos portfolio cards [--since <version>] --json`.
6. Write read-port tests for "all cards" and "changed since V".

## Verify
`cargo test -p fgos-portfolio read_port` passes.

## Rollback
`git revert` the phase commit.
