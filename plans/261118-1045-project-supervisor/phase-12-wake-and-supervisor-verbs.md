# Phase 12 — Wake door and supervisor verbs

One door starts the supervisor (`supervisor wake`), and four small verbs let it read and drain the queue. Rust, in
`fgos-supervision`; the host wiring is phase 16.

## Inputs
- Wait: ops-metrics phase 4 (Observe write door, for span `fgos.supervisor.wake`). Phase 2 report
  `plans/261118-1045-project-supervisor/reports/spike-timer-head-start.md` (the service environment a head start needs
  from a timer; if it is absent, stop with `NEEDS_CONTEXT`).
- Phase 3 (`portfolio.rs`: plan rows, order, admissibility, `supervisor_name`, `head_name`; the wake outcome enum in
  `observe-kinds.json`), phase 8 (`Queue`), phase 10 (socket verbs `supervisor handled|done`, `session start` with
  `forQuestion`, `session stop`; `done` stops its caller in the route).
- `src/session-host/head-start.mjs:202-219` (`startHeadSession` fronts a live holder; the wake door must not call it
  for a live one: fronting every tick would steal the owner's focus), `:65-77` (`identityHolder`), `:37` (`headRoleOf`).
- Identity: in-process `directory::resolve` (`packages/identity/rust/src/directory.rs:620`), whose answer carries
  `project_id` (`:110`); the directory is per OS user (`docs/platform/identity/spec.md` §5), so roles of every project
  on the machine share it. Project id and handle: the crate's `project(repo)` read (same spec, "Verbs").
- Owner-question store: `fgos.question.answered` attrs (asker role, session id, handle, persona, origin ref,
  `answeredAt`, optional pane) and kind `fgos.question.cancelled`; ack/cancel are accepted from the asker, any session
  holding the same `head:` role, or any head when the asker held no head role (its QP-4); there is no `answers:` role
  and no `--for` flag. The supervisor never acks or cancels.
- Session verb name after the session-verb plan: `fgos session start <persona> --name <name>` (PS-16).
- Config keys from phase 4: `supervisor.maxLeads`, `watcher.wakeFailureLimit`, `watcher.activeIntervalSec`,
  `watcher.idleIntervalSec`, `watcher.overdueFactor` (use the landed names).

## Footprint
`packages/supervision/rust/src/wake.rs`, `packages/supervision/rust/src/supervisor.rs`,
`packages/supervision/rust/tests/wake.rs`.

## Steps
0. Re-grep inputs; run `fgos session start --help` on the landed tree; read the spike report.
1. `wake.rs`: `wake(ports, {trigger, ref}) -> WakeOutcome`. Ports: `Project` (`{id, handle}` or missing), `Identity`
   (`holder(role) -> Live{project_id}|NotLive|Unknown`), `StartSession` (the adapter runs
   `<host> session start supervisor --name <supervisor_name(handle)>` with the environment the spike proved),
   `Portfolio`, `Queue`, `WakeLog` (last start attempt and consecutive failures, `.fgos/runtime/supervision/wake.json`,
   atomic), `Telemetry`. Order:
   1. no project id -> `project-id-missing` (supervision needs a project id; doctor's `identity-project-id` row says how);
   2. unhandled count 0 -> `nothing-unhandled`;
   3. every unhandled event is a capacity kind (`lane-freed`, `plan-priority-changed`) and the portfolio has no
      admissible plan -> mark them handled `by: watcher`, `nothing-admissible` (no LLM is started for nothing, red team M3);
   4. holder `Live` of this project -> `already-live` (the queue is the delivery, PS-9; nothing typed, nothing fronted);
      `Live` with another `project_id` -> `role-held-other-project`, no start;
   5. holder `Unknown` -> `identity-unknown`, no start (unknown is never turned into not-live);
   6. a start attempted less than `activeIntervalSec × overdueFactor` ago -> `starting` (a slow start is not doubled);
   7. `wakeFailureLimit` consecutive failures and the last attempt less than `idleIntervalSec` ago -> `backoff`;
   8. else record the attempt and start; `started` on success, `start-failed` with the host's code otherwise.
   Every call emits span `fgos.supervisor.wake` with `trigger`, `ref`, `outcome` (phase 3's enum).
2. `supervisor.rs`, the read and drain verbs as library functions the host calls:
   - `plans(portfolio, live_heads, max_leads) -> PlansView`: portfolio rows in order, each with `admissible`,
     `headName`, and for a `running` plan `leadLive` (a `running` plan with no live lead is what the supervisor
     restarts, red team M2), plus `leadsLive` and `maxLeads`. Lane freedom is not read here; the supervisor reads
     `fgos slots` for it.
   - `successor(event) -> Option<{persona, name, forQuestion}>` for a `question-answered` event: persona and name from
     the asker role, `forQuestion` = the question id (the event ref). The supervisor passes all three to
     `session start`, so the successor runs under the asker's own `head:<persona>-<name>` role (which lets it
     `ack`/`cancel`) and its opening names the question; `queue` attaches it as `successor` to each
     `question-answered` event, so no new verb is needed.
   - `queue(queue) -> Vec<RaisedEvent>`; `handled(queue, ids, by)`; `done(queue)` refuses `events-unhandled` with the
     count when any remain, else answers `{done: true}` (the request route then stops the caller, phase 10).
3. Verb output is JSON with `--json` and one plain line otherwise; refusal codes are the ones named above.
4. Tests in `tests/wake.rs` with fake ports, one behaviour each:
   - no unhandled event -> `nothing-unhandled`, nothing started;
   - only capacity events and nothing admissible -> marked handled, `nothing-admissible`, nothing started;
   - a live holder of this project -> `already-live`, the start port is never called; of another project ->
     `role-held-other-project`;
   - an unknown holder -> `identity-unknown`; no project id -> `project-id-missing`;
   - not live -> started once with the name `supervisor_name(handle)`; a second wake inside the grace -> `starting`;
     failures up to the limit then `backoff`;
   - `done` refuses while an event is unhandled and passes after `handled`;
   - `plans` reports `leadsLive`, `maxLeads` and `leadLive` of a running plan (order and admissibility are owned by
     `tests/portfolio.rs`);
   - `successor` of an answered event gives the asker's persona and name and the question id.

## Verify
- `cargo test -p fgos-supervision --test wake` passes; clippy `-D warnings` clean.
- `rg -n "startHeadSession|front" packages/supervision` finds nothing.

## Rollback
Revert the phase commit. No verb exists until phase 16 wires it.
