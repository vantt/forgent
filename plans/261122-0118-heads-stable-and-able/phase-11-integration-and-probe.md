# Phase 11: Integration gate and live grant probe

Capability: `code:test` (gate), `code:implement` (the probe script).

Closes acceptance criteria 1, 2 and 5, and the verb-by-verb list of `p-vquz26ibnn`. It re-confirms `p-d3ub553ogh` live.

## Inputs

- Every earlier phase landed on main.
- `packages/run-supervisor/contracts/head-request.v1.json` `verbs` (the full verb surface) and
  `src/session-host/head-grants.mjs` (`grantOf`). The probe takes the expected outcome from the grant. It never takes
  the observed outcome from it.
- The request log of each head's run supervisor. It writes one line per request with its verb and outcome
  (`head-request <id> ...` in `head_request.rs`). The supervisor's `session read` shows a head's screen.
- `test/live/mailbox-behaviour.live.mjs`, the pattern for a live script kept out of `npm test`.
- Phase 5: the heads must run the release that carries this plan. The probe needs that release activated; activation is
  the owner's step.

## Footprint

`test/live/head-grant-probe.live.mjs`, `CHANGELOG.md`,
`plans/261122-0118-heads-stable-and-able/reports/head-grant-probe.md` and `test/session-host/head-start.test.mjs`
(step 6 only).

`CHANGELOG.md` is no longer in the plan-level footprint (2026-11-23, owner order): rebase my one CHANGELOG line onto
main at step 2, and have lead:SUPERVISOR land it if the land door refuses a path outside the footprint.

## Steps

1. Gate: on main with every phase landed, run `npm test` and `cargo test --workspace`. Fix a regression in the phase
   that caused it, through that phase's footprint and a plan note. Never weaken a test.
2. Changelog: under `## [Unreleased]` in `CHANGELOG.md`, add one line per user-visible change. Heads record friction
   and the supervisor patches config through the request socket. The land door checks landed plans and removes a
   landed branch's clean worktree. A head's request routes run the active release, while its grant stays the one set
   at its start. Orphan rotations are resolved, and a rotation's handoff carries the last message and the head's task.
   The secretary keeps a Claude pin. A pool login near expiry is renewed even while a live seat shares it.
3. Probe script, `test/live/head-grant-probe.live.mjs`, run inside a confined head. For every verb of the contract it
   makes one call through the CLI with arguments chosen so the call cannot change state, and records the reply:
   - `served`: the route ran and answered done, or a domain refusal that proves the grant and the route passed. Examples:
     `session stop` of a name that does not exist, or `land --paths` of a path outside the grant refused by the land
     door.
   - `refused as expected`: `verb-not-granted` for a verb the grant does not hold.
   - `failed`: transport or route failure.

   Verbs that act on the caller itself (`supervisor done`, `session rotate`, `session answered`,
   `session restore role`, `session bind session`) are not called. Their row cites the head's own request-log line from
   its last real use, or says "no use in the window". The script also prints `TMPDIR` and proves it writable, which
   covers `p-d3ub553ogh`. Output is one JSON document.
4. Run it only from heads started on release `1e544460` or later. A head started earlier keeps its launch release's
   request server and grant, and must be rotated first. Run it from both confined heads. Raise `coordination-chore` for the supervisor to run it in its own head, and ask
   Miu through the supervisor's mailbox to run it in hers. Each head lands its JSON under this plan's `reports/` with
   `fgos land --paths`; both hold `plans` writes.
5. Write `reports/head-grant-probe.md`: a verb-by-verb table for the secretary and the supervisor (verb, expected from
   the grant, observed, evidence). Name each verb out of scope with its reason. Add the "Folded rows" check: each row
   of `plan.md` with the commit or report that closes it.
6. A stale note reported by s6a (lead:SUPERVISOR, 2026-11-22 19:10): `test/session-host/head-start.test.mjs:343` cites
   the deleted `test/helpers/head-sandbox-argv.mjs`. Correct that text and change nothing else. The stray-writes path at
   `docs/platform/run-supervisor/spec.md:66` is fixed by s6a phase 22b, not here. s6a 22b also edits `CHANGELOG.md` in
   disjoint hunks, so if step 2's line lands second, rebase it.

## Verify

`npm test` and `cargo test --workspace` are green on main. The probe table has no `failed` row and no row where the
observed outcome differs from the expected one, or each such row is explained and carried to a backlog row.

## Rollback

Revert the changelog and probe commits. The reports stay as evidence.

## Owner answer to q-vbh2knqpnu (2026-11-23 22:26 +07)

The owner answered "Do all three now" through the secretary. That allows three host steps: activate a release built
from main at or after `0174ac6dd`, run `npm test` and `cargo test --workspace` on it, and remove exactly the worktrees
`forgent-worktrees/261122-0118-heads-stable-and-able-p13` (discard its abandoned edit; the work landed as `5ebc25616`)
and `-p11c` (empty). It forbids any code change and any change to other plans' worktrees.

The lead checked state at 22:35. None of the three steps had run yet:

- The active release (`sha256:edf91f57…`, activated 15:56 +07) predates `5ebc25616`. Its `head-grants.mjs` lacks
  `plans/backlog.md` in the secretary and supervisor writes.
- Both worktrees are still registered.
- The lead's sandbox is read-only for `.fgos/runtime` and `.agents`, so the lead cannot run the suite or remove the
  worktrees itself.

Phase 11 is parked on these host steps. When they are done, the lead resumes at step 1 (read the suite result), then
steps 2-6. The probe runs from a supervisor and a secretary started after the new activation.

### State at 23:20 (2026-11-23)

- Host step 1 done: release `sha256:ef959860…` activated at 23:11. Its `head-grants.mjs` carries `5ebc25616`
  (`plans/backlog.md` in the secretary and supervisor writes).
- Host steps 2 (full suite) and 3 (remove p13 and p11c) are still owed by the owner. Guide:
  `reports/howto-261123-2306-owner-host-steps-phase-11.md`.
- Steps 3 and 6 are already on main: the probe script (`6f4ea6ca7`, `0ba7be66c`, `32139463b`), and the stale
  `head-sandbox-argv` note is gone from `head-start.test.mjs`. The step 2 lines wait in
  `reports/carry-p11-changelog-lines.md` for a land outside this footprint.
- Event `3bf13f45ec5e0924` (coordination-chore) asks the supervisor to rotate itself and Miu onto `ef959860`, run the
  probe in both heads, land each JSON under `reports/`, and land the changelog lines.
- Left for the lead after that: read the suite result, write `reports/head-grant-probe.md` with the folded-rows check,
  and close the plan.

### Supervisor routing at 23:55 (2026-11-23)

- The owner's unconfined `npm test` on main `5a5dde6e0` is red (18 fails, `plans/261123-0828-head-stop-rotation-bad-measure/reports/lead-261123-2333-head-stop-rotation-bad-measure-verify.md`). Two are attributed to this
  plan's phase 13 grant `e900a7e10` (`plans/backlog.md` in the secretary and supervisor grants):
  `test/session-host/head-permission-mode.test.mjs:47` and `test/session-host/head-start.test.mjs:370`. Phase 11
  needs a green suite: confirm the cause and fix them through this plan.
- The supervisor's probe JSON is on main: `reports/head-grant-probe-supervisor.json` (`b76553b29`). Miu was asked for hers.
- The CHANGELOG lines wait on owner question `q-2vehh564d2` (no `lead:SUPERVISOR` is live).
