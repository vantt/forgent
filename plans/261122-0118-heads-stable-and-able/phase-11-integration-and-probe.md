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
