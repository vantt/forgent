---
contract: plan-v1
title: "fgos session stop ends a head whose run supervisor is dead; session-gone wiring proof and changelog"
status: running
priority: P0
blockedBy:
  - 261127-0016-head-run-own-failure-domain
  - 261122-0056-orchestration-skeleton
  - 261126-2324-changelog-fragments-and-skill-surface-regeneration
  - 261125-1557-shaper-worktree
base: 936130c13cb166e22439b7f0edf03e1c680f7cbc
footprint:
  - plans/261127-0018-dead-supervisor-head-stop/**
  - src/session-host/head-stop.mjs
  - test/session-host/head-stop.test.mjs
  - docs/platform/session-host/spec.md
  - packages/supervision/rust/tests/definitions.rs
  - changelog.d/261127-0018-dead-supervisor-head-stop.md
  - apps/fgos/observe-kinds.json
  - packages/component-authority/model/doors/execution-s-node-seam.yaml
  - packages/run-supervisor/rust/src/controller/scope.rs
  - apps/fgos/src/wiring/execution_routes.rs
source:
  - plans/discussions/ds-rig5dsai5l-head-run-own-failure-domain/DISCUSSION.md
  - p-6htu2ae64o
  - plans/261127-0016-head-run-own-failure-domain/plan.md
created: 2026-11-27
lead: head:lead-forgent-261127-0018-dead-s-6acc8
host: fg-server2-jdp2bv
---

# Session stop ends a head whose supervisor is dead

The part of discussion `ds-rig5dsai5l` whose files Keeper (`261122-0056-orchestration-skeleton`) and the
changelog-fragment plan (`261126-2324`) hold. Split off from `261127-0016-head-run-own-failure-domain` on the owner's
order to keep that plan clear of Keeper; it runs as soon as both holders are done. Same priority as its parent.

## Outcome

`stopHeadSession` (`src/session-host/head-stop.mjs`) ends a head whose run supervisor is dead: it retires the pane,
settles the attempt through the existing adopt door and writes `retiredAt`, and never answers `stop-not-ended` for
that case (D7). The supervisor then starts the next generation through `fgos session start`. A wiring proof shows
`session-gone` matches the `supervisor-gone` head state, and a changelog fragment tells users heads survive each
other's OOM kill.

## Acceptance criteria

1. `node --test test/session-host/head-stop.test.mjs`: with the supervisor judged dead, stop retires the pane, runs
   adopt for the attempt dir (which publishes `closed.json`), writes `retiredAt`, returns `{stopped: true}`; with the
   supervisor alive, today's request-and-wait path is unchanged. Discussion acceptance 3.
2. `cargo test -p fgos-supervision --test definitions`: one wiring proof that a `fgos.head.state = supervisor-gone`
   record yields a `session-gone` row. Discussion acceptance 2 (wiring half).
3. `changelog.d/261127-0018-dead-supervisor-head-stop.md` exists with a `- Fixed:` bullet.
4. Live: on fg-server2, `kill -9` a head's supervisor, then `fgos session stop <role>` ends it and
   `fgos session start` brings up the next generation; recorded in `reports/live-stop.md`. Discussion acceptance 4
   (stop step).
5. `npm test` and `cargo test --workspace` green.

## Non-goals

Re-attaching a supervisor to a running agent; automatic restart; anything already in the parent plan.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Dead-supervisor branch of `stopHeadSession` | `run-supervisor` | settles through the existing adopt door (`run-supervisor/stop-requested.v1` unchanged); no new verb |
| `session-gone` wiring proof | `observe` | test only |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Stop a head with a dead supervisor](phase-01-stop-dead-supervisor-head.md) | - | src/session-host/head-stop.mjs, test/session-host/head-stop.test.mjs, docs/platform/session-host/spec.md, packages/supervision/rust/tests/definitions.rs, changelog.d/261127-0018-dead-supervisor-head-stop.md, plans/261127-0018-dead-supervisor-head-stop/reports/**, `apps/fgos/observe-kinds.json`, `packages/component-authority/model/doors/execution-s-node-seam.yaml`, `packages/run-supervisor/rust/src/controller/scope.rs`, `apps/fgos/src/wiring/execution_routes.rs` | 1 | ready |

## Owner questions

None.

## Risks and rollback

- Judging the supervisor dead wrongly would retire a live head's pane. The judgment reuses the same identity check
  as the head-state source and adopt (pid + start identity), never pid alone.
- Rollback: revert the phase commit; stop goes back to request-and-wait.
