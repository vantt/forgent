---
area: distillery
updated: 2026-07-17
sources: [distillery-state-consumer]
decisions: []
coverage: partial
---

# Distillery — Porting Lifecycle

## Purpose

Distillery is forgent's reference-learning system: it studies external sibling
projects to find ideas and patterns worth reusing. This spec covers one part
of it — the **porting lifecycle**: how the adoption status of each considered
idea ("candidate") is tracked from first identification through to its final
outcome, and durably remembered so a rejected idea is never re-litigated by
accident. Other distillery capabilities (finding new source material, cross-
source comparison, candidate ranking) are out of scope here — see Open Gaps.

## Entry Points & Triggers

- A person or agent decides a porting candidate should move to its next
  lifecycle stage and runs the status-change command for it.
- Once, at cutover: a seeding operation establishes the correct current status
  for every candidate already on record, before the live status-change command
  is used for the first time.

## Data Dictionary

| Field | Meaning |
|---|---|
| Feature (id) | The name of the extracted idea/pattern under consideration. Unique. |
| Status | The candidate's current lifecycle stage — see enum below. This is the ONLY field this spec's lifecycle governs (R1). |
| `candidate` | Identified as reusable, not yet committed to. |
| `planned` | Decided to pursue; work has not started. |
| `in-progress` | Actively being built/integrated. |
| `ported` | Adopted as-is and shipped. |
| `adapted` | Adopted with modification and shipped. |
| `rejected` | Considered and declined — recorded permanently so it is never re-litigated. |
| Score, Local, Đích (destination), Commit, Notes | Free-form metadata about the candidate. NOT governed by this lifecycle (R1) — still edited directly, unaffected by a status change. |

## Behaviors & Operations

**Advance a candidate's status.**
- Triggers when: an operator or agent decides a candidate is ready for its
  next lifecycle stage and issues the move.
- Blocked when: the requested move is not one of the legal next stages for
  the candidate's current status (see the enum's legal order above — each
  status has a fixed, small set of stages it may move to next; most illegal
  moves are attempts to skip stages or to move a candidate that has already
  reached a final stage).
- What changes: the candidate's status is durably recorded as changed. The
  human-readable porting log is updated to show the new status for that one
  candidate — nothing else on the log changes.
- Side effects: the change is appended to a permanent record of every status
  change ever made, so the complete history is always reconstructable from
  scratch (R2).
- What the operator observes: on success, confirmation that the move
  happened. On an illegal move, a clear explanation of why (the candidate's
  current status and what moves are actually legal from there) — and nothing
  changes, neither the record nor the human-readable log.

**Seed historical status (one-time, at cutover only).**
- Triggers when: the porting lifecycle is switched on for the first time,
  before any live status-change command has been used.
- What changes: every candidate already on record gets its current status
  established in the durable record, matching exactly what the human-readable
  log already showed for it — no candidate starts over at the beginning.
- What each status is "reached" through: the seeding operation only ever uses
  the SAME legal stage-to-stage moves the live command would use — it never
  takes a shortcut straight to a candidate's final status. This is itself a
  proof that every candidate's recorded status is one the lifecycle can
  actually produce.
- Side effect / self-check: if a candidate's current status could NOT be
  reached through any legal sequence of moves, seeding for that candidate
  would fail loudly rather than silently accepting it — this has not
  happened with real data yet (Edge Cases Settled).
- Running the seeding operation again after it already ran changes nothing —
  it recognizes work already done and skips it.

## Actors & Access

- **Operator/agent** — anyone with access to the distillery tooling. No
  additional access control beyond ordinary tool access; this is internal
  workshop tooling, not a user-facing product surface.

## Business Rules

- **R1.** The lifecycle governs the Status field only. Score, Local,
  destination, commit, and notes stay freely editable and are never touched
  by a status change.
- **R2.** The durable record of status changes is the source of truth. The
  human-readable porting log is always a reflection of it — after cutover,
  it is never hand-edited for Status again.
- **R3.** Status changes for distillery candidates go through the same kind
  of durable, rule-checked mechanism forgent uses for tracking its own
  work — not a separate, informal mechanism built just for this.

## Edge Cases Settled

- A candidate may end its life either by being rejected outright (never
  built) or by being rejected after active work started — both are legal,
  final outcomes.
- An illegal move (skipping a stage, or trying to move a candidate that has
  already reached a final stage) is refused in full: neither the durable
  record nor the human-readable log changes.
- As of this writing, every candidate on record reached its current status
  through a sequence the lifecycle actually allows — none needed an
  exception.

## Open Gaps

- The status-change command currently must be run from the project's own
  root location — running it from elsewhere is not yet supported.
- The one-time seeding operation assumes every historical candidate reached
  its current status the "normal" way (see Edge Cases Settled) — if a real
  historical case ever turns out not to fit, that nuance would only be
  recoverable from the free-form Notes column, not the durable record.
- Distillery's other capabilities — finding new source material to review,
  comparing ideas across sources, ranking candidates by score — are not yet
  described in this spec; only the porting-status lifecycle is covered here.
  `coverage: partial` reflects this.
- `docs/specs/system-overview.md` already lists a `distillery` area entry
  pointing here (and a separate `distill-skill` entry still marked
  spec-pending) — this spec was written in the forgent-workshop project and
  moved into this repo verbatim; it has not been re-harvested against this
  repo's own doc conventions.

## Pointers (implementation)

- CLI command: `.agents/skills/distill/scripts/distill.mjs` (`move` verb)
- State/lifecycle rules: `src/state/porting.mjs`
- Durable record + human-readable-log sync: `src/state/porting-store.mjs`
- Human-readable log: `docs/distillery/porting-log.md`
- Durable record storage: `docs/distillery/state/porting/`
- One-time seeding script: `.agents/skills/distill/scripts/migrate-porting-state-backfill.mjs`
- Package boundary: this repo's `package.json` (`exports`) exposes `forgent/state/porting` and `forgent/state/porting-store` — the distill skill imports its own package by name (Node self-reference); external consumers (e.g. the forgent-workshop project) install this repo as the `forgent` dependency and import the same subpaths.
