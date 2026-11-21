---
contract: plan-v1
title: "Every stop decision of a head leaves one line the owner can read"
status: done
lead: lead:ROTATE
base: 595a7f0b1194ada7826d774edce61817dd41a8bc
priority: P1
blockedBy: []
footprint:
  - plans/261121-0745-head-rotation-trace/**
  - apps/fgos/src/wiring/session_rotation_hook.rs
  - src/session-host/head-request.mjs
  - src/session-rotation/rotate.mjs
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/session-host/contracts/rotation-files.v1.json
  - docs/platform/session-host/spec.md
  - test/session-host/head-request.test.mjs
  - test/session-rotation/rotate.test.mjs
source:
  - p-4r4h3jqtth
created: 2026-11-21
---

# Every stop decision of a head leaves one line the owner can read

## Outcome
Each Stop of a head asks its supervisor through the existing `session rotate` request, carrying the measured fraction, its source, the level and the reason. Below soft the host records the line and starts nothing; at soft or hard it records the line and the request outcome. The host appends one bounded line per stop to `<lineage>/stop-trace.jsonl`.

## Cause (proven from the transcript and files)
- Head generation 17 ran 87 stops; the transcript's stop_hook_summary shows the rotation hook ran on all of them with no error.
- Its context peaked at 332368 tokens. The window is the configured 1000000, so the fraction was 0.33, below soft 0.4 (400k). The hook decided correctly; nothing was asked, nothing recorded.
- All 10 handoffs on record are `rotation: manual`: the automatic path has never fired. The owner rotated generations 14 to 16 by hand at 105k to 155k tokens. Thresholds are the owner's decision and are not changed here.
- The hook runs inside the head's sandbox where `.fgos` is read-only, so it cannot write a record itself; the host sees every stop only through the request socket.

## Prior art reused
The stop hook's existing request to its own supervisor (`session rotate`, spec 8.8), `requestRotation` and the lineage folder with `incidents.jsonl` (executor). No new verb, no second channel. A hook failure that never reaches the host stays a gap and is documented as such.

## Non-goals
No change to soft, hard or any override; no status-line sidecar writer; no new verb.

## Acceptance criteria
1. `session rotate` accepts an optional `measure` (fraction, source, stale, level, reason); with reason `none` it appends the line and returns `started:false, reason:below-threshold`.
2. Every stop with a request socket sends the request; the decision reason travels in it.
3. An owning Rust test: a head above soft across many stops asks every time. An owning JS test: the host appends one bounded line per request, outcome included.
4. Spec 8.8 and both contracts say it, including the remaining gap.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | Hook always asks; host records the line | - | apps/fgos/src/wiring/session_rotation_hook.rs, src/session-host/head-request.mjs, src/session-rotation/rotate.mjs, contracts, spec, tests | 1 | done |

## Owner questions
Whether secretary soft should be lowered (asked by the supervisor).

## Risks and rollback
- Risk: a route child per stop. Mitigation: below-threshold returns before any lineage lock. Rollback: `git revert`.

## Overlap note
Any overlap error with a running plan is the known checker-versus-admission mismatch (backlog p-pcfbembv6e).
