---
phase: 4
title: Untrack the index, record the decision, integrate
status: draft
capability: code:implement
---

# Phase 4: Untrack the index, record the decision, integrate

This repository stops tracking `plans/backlog.md`, the decision that amends D-ADR0082 is recorded, the specs say what
the code now does, and the full gate runs on the combined tree.

## Inputs

- `plans/261125-1556-backlog-index-generated/plan.md` (Decisions taken here; Acceptance criteria 8 to 10).
- D-ADR0082 in `docs/platform/runner/decisions/h-36d872fbb0e5.md` (points 1 and 5) and the record format of its
  neighbours (heading, `[valid_from:: ...]`, `[amends:: D-ADR0082]`, Status, Context, Decision, Evidence, Reversal).
- `docs/platform/supervision/spec.md` section 5 "Lead to land" and section 8 decision history.
- `docs/platform/session-host/spec.md` (the sentence about the secretary's granted file `plans/backlog.md`).
- `docs/platform/agent-confinement/spec.md` line about the supervisor's write directories (`plans` and
  `plans/backlog.md`).
- `CHANGELOG.md` `## [Unreleased]`.

## Files it may write (footprint)

`plans/.gitignore` (new), `plans/backlog.md` (removed from the Git index only),
`docs/platform/runner/decisions/h-36d872fbb0e5.md`, `docs/platform/supervision/spec.md`,
`docs/platform/session-host/spec.md`, `docs/platform/agent-confinement/spec.md`, `docs/decisions/index.md`
(regenerated), `CHANGELOG.md`.

## Steps

1. Merge phases 1 to 3 into the integration branch (they land in wave order; this phase starts on their combined tip).
2. Write `plans/.gitignore` with `/backlog.md` (the same line `fgos migrate portfolio` writes) and run
   `git rm --cached plans/backlog.md`; the file stays on disk. Check `fgos convention check plans/.gitignore` accepts it.
3. Mint the decision id with `fgos identity mint d-adr` (needs the network; never derive it). Add its record after
   D-ADR0082 in `h-36d872fbb0e5.md` with `[amends:: D-ADR0082]`: the index is generated and local, never committed;
   the land door renders it after any land touching `plans/` and on demand by `fgos backlog-index`; the stale-index
   check is retired; heads write only row files; a tracked index is never overwritten. Context: row p-o4iniqvitl,
   discussion ds-6z4rfn6kv5, owner questions q-nudu6zlusf and q-3rhc6lroqc. Run `fgos decision-index`.
4. Specs: supervision spec section 5 gains one sentence on the render after a land (`backlogIndexNote`, never a
   refusal) and section 8 one line pointing at the new decision; session-host and agent-confinement specs drop
   `plans/backlog.md` from the secretary and supervisor grants.
5. `CHANGELOG.md` `## [Unreleased]`: `plans/backlog.md` is no longer committed; it is rendered by `fgos land` and
   `fgos backlog-index`; projects that track it untrack it with `git rm --cached plans/backlog.md`; heads can no longer
   write it.
6. Full gate on the combined tree.

## Verify

```bash
git ls-files plans/backlog.md            # prints nothing
git check-ignore plans/backlog.md        # prints plans/backlog.md
fgos decision-index --check
node scripts/plan-contract-check.mjs --all
npm test
cargo test --workspace
```

Pass: the two git commands print as noted; every other command exits 0.

## Rollback

Revert this phase's commit, then `git add plans/backlog.md` after rendering it with `fgos backlog-index` (or from the
parent of phase 1) to track it again.
