# Phase 10 — Request transport: ticket verbs and session stop

A confined head gets four new kinds of socket verb: long verbs that answer at once with a ticket (`land`, `run`,
PS-10), the read of a ticket (`request result`), the end of a session (`session stop`), and two short writes the
supervisor needs from inside its sandbox (`supervisor handled`, `supervisor done`; the verbs themselves are phase 12).
The socket serves one request at a time and caps a verb at 60 s, so a long verb must not run inside the request.

## Inputs
- Step 0: after the session-verb plan lands, verbs read `session <x>`, not `head <x>`. Re-grep and use the landed
  names. A finding that changes PS-10 stops the phase with `NEEDS_CONTEXT`.
- `packages/run-supervisor/contracts/head-request.v1.json`: `verbs`, `order` (busy), `run.verbTimeoutMs` 60000,
  `refusalCodes`.
- `packages/run-supervisor/rust/src/head_request.rs:33` (`VERB_TIMEOUT`), `:37` (`MAX_CONNECTIONS` 8), `:51`
  (`role_move`), `:458` (`decide`: grant check, `busy` gate), `:508` (`run_verb`: route child, group killed on
  timeout only). The verb whitelist is `cfg.verbs` from the envelope, so Rust names no verb but `role_move`.
- `src/session-host/head-request.mjs:89-117` (the `switch` per verb, `exactKeys`, `ownLineage`),
  `head-request-client.mjs:12-16` (verb constants, `requestHead`), `head-start.mjs:44-54` (placement read/write),
  `:41` (`lineageDirOf`).
- Detach door: `src/util/spawn-detached-fgos.mjs` (`spawnDetachedCli`, takes `cliPath`); precedent
  `src/session-rotation/rotate.mjs:32,306` (rotation returns at once, a detached executor outlives the verb).
- Session Host: `src/session-host/client.mjs:129` (`retire(placement, 'close')`; a close needs `groupKey`,
  `:133-134`), spec `docs/platform/session-host/spec.md` section 3.

## Footprint
`packages/run-supervisor/contracts/head-request.v1.json`, `packages/run-supervisor/rust/src/head_request.rs`,
`packages/run-supervisor/rust/tests/head_request*.rs`, `src/session-host/head-request.mjs`,
`src/session-host/head-request-client.mjs`, `src/session-host/head-stop.mjs` (new),
`test/session-host/head-request.test.mjs`, `test/session-host/head-stop.test.mjs` (new),
`docs/platform/session-host/spec.md`.

## Steps
0. Re-grep inputs; list the verbs the contract has now.
1. Contract: add verbs `land`, `run`, `request result`, `worktree create` (short verb, runs `fgos worktree create` within the 60 s cap; lead only, PS-17), `session stop`, `supervisor handled`, `supervisor done`, each
   with `args`, `does`, `data`, `identity: held`. Add refusal codes `ticket-used`, `ticket-unknown`, `bad-args`.
2. Ticket verbs `land` and `run` (Node route child, `head-request.mjs`):
   - `land` args `{branch?, paths?}` (exactly one of the two); `run` args `{prompt | unit, provider?, capability?,
     writes?, worktree?}`. Unknown keys refuse `bad-args`; the host argv is built from these fields, never a free string.
   - The request `id` is the ticket id. A ticket file `.fgos/runtime/head-tickets/<role-slug>/<id>.json` is written
     atomically with `{id, verb, state: "running", pid, startedAt}`; an existing id refuses `ticket-used`.
   - A detached runner (`head-request.mjs --ticket <file>`, started with `spawnDetachedCli`) runs `fgos <verb> ... --json`
     to its end, then rewrites the file with `state: "done"|"failed"`, `exit`, `result` (the host's JSON) or `code`.
     The verb answers `{ticket: <id>, state: "running"}` at once, so `busy` never covers the long work.
3. `request result` args `{id}`: reads that role's own ticket file; `ticket-unknown` otherwise. A `running` ticket
   whose `pid` is dead answers `state: "failed"`, `code: "runner-gone"` (decided from the OS, not from the file).
4. `session stop` args `{persona, name}`, in `head-stop.mjs`: `stopHeadSession({persona, name, projectRoot}, ports)`
   reads the placement (`readHeadPlacement`), calls the host `retire(placement, 'close', { groupKey })`, writes
   `retired.json` `{at, by, reason}` in the lineage dir (the signal ops-metrics' head source reads as `retired`), and
   returns `{stopped: true}`. A role no live session holds returns `{stopped: false, reason: "not-live"}`. Only the
   supervisor's grant lists it (phase 9); the verb refuses `role-mismatch` for a persona-name that is not a `lead-*`
   or `planner-*` lineage or the caller's own.
5. `supervisor handled|done`: the route child calls the phase-12 entry through `fgos supervisor <sub>` (host verb) and
   returns its JSON; no logic here.
6. Rust: only if the contract tests need it (`role_move` untouched). Add the two serving proofs below.
7. Tests, one behaviour each:
   - `head-request.test.mjs`: `land` and `run` answer a ticket at once; `request result` returns `running`, then the
     outcome; a reused id refuses; a dead runner pid reads `failed`.
   - `head-stop.test.mjs`: stop retires the placement and writes `retired.json`; a not-live role stops nothing.
   - `head_request.rs` (Rust): a ticket verb returns well under `VERB_TIMEOUT` while its detached runner survives the
     route child's exit.
8. Session-host spec: the verbs section lists the six verbs; one decision-history line says long verbs answer a ticket.

## Verify
- `node scripts/run-tests.mjs test/session-host/head-request.test.mjs test/session-host/head-stop.test.mjs`
- `cargo test -p fgos-run-supervisor head_request`
- `rg -n "head-tickets" src packages` finds `head-request.mjs` and its test only.

## Rollback
Revert the phase commit. Ticket files under `.fgos/runtime/head-tickets/` are runtime scratch that nothing reads
without the verb; leave them.
