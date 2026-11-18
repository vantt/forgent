# Phase 10 — Request transport: confined door, ticket verbs, session stop

A confined head gets every new socket verb through one client door, long verbs that answer at once with a ticket
(`land`, `run`, PS-10), the read of a ticket (`request result`), `worktree create`, the end of a session
(`session stop`), and the two supervisor writes (`supervisor handled|done`; the verbs themselves are phase 12). The route
binds each verb to the caller's grant and plan (PS-14, PS-24). The socket serves one request at a time and caps a verb
at 60 s, so a long verb must not run inside the request.

## Inputs
- Step 0: after the session-verb plan lands, verbs read `session <x>`, not `head <x>`. Re-grep and use the landed
  names. A finding that changes PS-10 stops the phase with `NEEDS_CONTEXT`.
- `packages/run-supervisor/contracts/head-request.v1.json`: `verbs`, `order` (busy), `run.verbTimeoutMs` 60000,
  `refusalCodes`.
- `packages/run-supervisor/rust/src/head_request.rs:33` (`VERB_TIMEOUT`), `:37` (`MAX_CONNECTIONS` 8), `:51`
  (`role_move`), `:458` (`decide`: grant check, `busy` gate), `:508-516` (`run_verb`: route child, `env_clear` + the
  step env, group killed on timeout only). The verb whitelist is `cfg.verbs` from the envelope.
- `src/session-host/head-request.mjs:20-48` (`confined`, `startHead`, `rotateHead`: the per-verb confined branch the
  generic door replaces for new verbs), `:89-117` (the route `switch`, `exactKeys`, `ownLineage`);
  `head-request-client.mjs:12-16` (verb constants, `requestHead`); `head-start.mjs:44-54` (placement read/write), `:41`
  (`lineageDirOf`), `openingText` (the opening a head is typed); today's CLI branch `bin/fgos.mjs:3473-3487`.
- Detach door: `src/util/spawn-detached-fgos.mjs:20` (`spawnDetachedCli`); precedent
  `src/session-rotation/rotate.mjs:32,306`.
- Process identity: `src/native/process-identity.mjs` (`selfRecord`, `judge` -> alive|dead|unknown on a recorded
  `{pid, startTime, ...}`).
- Nested dispatch marker: `FGOS_DISPATCH_DEPTH` (`src/runner/dispatch/adapters.mjs:81,95-99`).
- Git read in Node: `src/git/inspect.mjs` (`resolveTrunk`, `readObjects`) for a plan read at the trunk tip.
- Plan name rule: `packages/supervision/contracts/plan-vocabulary.v1.json` `headName` (phase 3, PS-11); plan
  frontmatter reader `src/util/yaml.mjs:89` (`readFrontmatter`); footprint rule `scripts/plan-contract-check.mjs:31`.
- Session Host: `src/session-host/client.mjs:129` (`retire(placement, 'close')`; needs `groupKey`, `:133-134`), spec
  `docs/platform/session-host/spec.md` section 3.
- The `retired` signal: ops-metrics phase 11's landed `fgos.head.state` source
  (`rg -n "retired" apps/fgos/src/wiring/observe_sources`). Step 0 reads what it derives `retired` from.
- Owner-question store: `fgos questions ack|cancel <id>` accepts the asker, any session holding the same `head:` role
  (the successor the supervisor starts with the asker's persona and name), or any head when the asker held no head
  role (its QP-4). No `answers:` role, no `--for` flag.

## Footprint
`packages/run-supervisor/contracts/head-request.v1.json`, `packages/run-supervisor/rust/src/head_request.rs`,
`packages/run-supervisor/rust/tests/head_request*.rs`, `src/session-host/head-request.mjs`,
`src/session-host/head-request-client.mjs`, `src/session-host/head-stop.mjs` (new), `src/session-host/head-plan.mjs`
(new), `src/session-host/head-start.mjs`, `test/session-host/head-request.test.mjs`,
`test/session-host/head-stop.test.mjs` (new), `test/session-host/head-plan.test.mjs` (new),
`docs/platform/session-host/spec.md`.

## Steps
0. Re-grep inputs; list the verbs the contract has now; read what the landed head-state source treats as `retired`.
1. Contract: add verbs `land`, `run`, `request result`, `worktree create`, `session stop`, `supervisor handled`,
   `supervisor done`, each with `args`, `does`, `data`, `identity: held`; `session start` args gain optional
   `forQuestion`. Add refusal codes `ticket-used`, `ticket-unknown`, `bad-args`, `land-branch-lead-only`,
   `path-outside-grant`, `write-outside-footprint`, `footprint-change-refused`.
2. One confined client door in `head-request-client.mjs`: `SOCKET_VERBS` read from the contract's `verbs`, and
   `requestHeadVerb(verb, args, { socketPath })` over the existing `requestHead`. Phase 16 routes every confined call of
   a `SOCKET_VERBS` verb to it (PS-20); existing `startHead`/`rotateHead` keep their callers.
3. `head-plan.mjs`: `planOfHead(projectRoot, persona, name)` resolves a `lead-*`/`planner-*` name to its plan dir by
   the PS-11 rule (strip the project prefix, unique prefix among plans not `done`/`withdrawn`), reads `plan.md` at the
   trunk tip (`resolveTrunk` + `readObjects`, never the working file) and returns `{dir, footprint}`. Refusals
   `plan-not-found`, `plan-ambiguous`. One reader for phase 9's grant and for this route.
4. Ticket verbs `land` and `run` (route child, `head-request.mjs`):
   - `land` args `{branch?, paths?, tests?}` (exactly one of `branch`/`paths`). Binding: `paths` outside the caller's
     grant `writes` refuse `path-outside-grant`; `branch` from any persona but `lead` refuses `land-branch-lead-only`;
     a lead's branch land passes its plan footprint (`planOfHead`) as `--footprint`; a lead's `paths` land that changes
     the `footprint` of its plan's frontmatter against the trunk tip refuses `footprint-change-refused`.
   - `run` args `{prompt | unit, provider?, capability?, writes?, worktree?}`, lead only; `writes` not covered by the
     lead's plan footprint refuse `write-outside-footprint`. The runner starts `fgos run` without
     `FGOS_DISPATCH_DEPTH` (a lead's phase run is a top-level seat and takes a lane, PS-12).
   - Unknown keys refuse `bad-args`; the host argv is built from these fields, never a free string.
   - The request `id` is the ticket id. A ticket file `.fgos/runtime/head-tickets/<role-slug>/<id>.json` is written
     atomically with `{id, verb, state: "running", runner: <process identity record>, startedAt}`; an existing id
     refuses `ticket-used`.
   - A detached runner (`head-request.mjs --ticket <file>`, started with `spawnDetachedCli`) runs `fgos <verb> ... --json`
     to its end, then rewrites the file with `state: "done"|"failed"`, `exit`, `code`, and for `land` the host's JSON;
     for `run` only the `unitRunId` (the outcome stays in `.fgos/assignments/<unitRunId>/`, read by `request result`).
     The verb answers `{ticket: <id>, state: "running"}` at once.
5. `request result` args `{id?, wait?}`: with `id`, that role's own ticket (else `ticket-unknown`); a `run` ticket's
   outcome is read from its assignment record. Without `id`, the role's tickets, newest first (a restarted lead finds
   its runs). `wait` (seconds, capped at 50) polls until the ticket leaves `running`. A `running` ticket whose runner
   record `judge`s `dead` reads `state: "failed"`, `code: "runner-gone"`; `unknown` stays `running`.
6. `worktree create` args `{path, branch, base?}`, lead only; `branch` required (`bad-args` without it, PS-7: detached
   worktrees are not this door's); runs `fgos worktree create <path> --branch <b>` within the 60 s cap.
7. `session stop` args `{persona, name, reason?}`, in `head-stop.mjs`: `stopHeadSession({persona, name, projectRoot,
   reason}, ports)` reads the placement (`readHeadPlacement`), calls the host `retire(placement, 'close', { groupKey })`,
   writes the `retired` signal exactly as the landed head-state source reads it (step 0; if it derives `retired` from
   the placement's absence, write nothing new), and returns `{stopped: true}`. A role no live session holds returns
   `{stopped: false, reason: "not-live"}`. The route refuses `role-mismatch` for a persona-name that is not a `lead-*`
   or `planner-*` lineage of this project, an asker named by an answered question, or the caller's own.
8. `session start` with `forQuestion`: passed through `startHead` to `startHeadSession`, which adds one opening line
   (`openingText` in `head-start.mjs`): "You continue question <id>: write its answer back to its origin, then
   `fgos questions ack <id>` (or `cancel`)". The successor holds the asker's own head role, so no flag is needed. No
   other start changes.
9. `supervisor handled|done`: the route child runs the host verb `fgos supervisor <sub> --json` and returns its JSON.
   On `done` answering `{done: true}`, the route spawns a detached `session stop` of the caller's own role (after the
   reply is written) and adds `stopping: true` (PS-9).
10. Rust: only if the contract tests need it (`role_move` untouched). One serving proof: a ticket verb returns well
    under `VERB_TIMEOUT` while its detached runner survives the route child's exit.
11. Node tests, one behaviour each:
    - `head-request.test.mjs`: a confined caller's `requestHeadVerb` reaches the socket for a new verb; the ticket file
      is written and `request result` returns `running`, then the outcome; no-id lists the role's tickets; a reused id
      refuses; a dead runner reads `failed`; each binding refusal fires once (`path-outside-grant`,
      `land-branch-lead-only`, `write-outside-footprint`, `footprint-change-refused`); `worktree create` without
      `branch` refuses; `supervisor done` with an empty queue (fake host) answers `stopping` and starts the stop of the
      caller's own role; a run ticket starts `fgos run` without `FGOS_DISPATCH_DEPTH`.
    - `head-stop.test.mjs`: stop retires the placement and leaves the `retired` signal; a not-live role stops nothing.
    - `head-plan.test.mjs`: a lead name resolves to its plan; the footprint comes from the trunk tip, not an edited
      working file; a `done` plan never makes a name ambiguous.
    - the `forQuestion` opening line, proved in `head-request.test.mjs` through `startHead` with fake ports
      (`head-start.test.mjs` belongs to phase 9 in the next wave).
12. Session-host spec: the verbs section lists the new verbs, the confined door, the binding rules; one
    decision-history line says long verbs answer a ticket.

## Verify
- `node scripts/run-tests.mjs test/session-host/head-request.test.mjs test/session-host/head-stop.test.mjs test/session-host/head-plan.test.mjs`
- `cargo test -p fgos-run-supervisor --test head_request`
- `rg -n "head-tickets" src packages` finds `head-request.mjs` and its test only.

## Rollback
Revert the phase commit. Ticket files under `.fgos/runtime/head-tickets/` are runtime scratch that nothing reads
without the verb; leave them.
