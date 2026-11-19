# Phase 10 — Request transport: confined door, ticket verbs, session stop

A confined head gets every new socket verb through one client door, long verbs that answer at once with a ticket
(`land`, `run`, PS-10), the read of a ticket (`request result`), `worktree create`, the end of a session
(`session stop`), and the two supervisor writes (`supervisor handled|done`; the verbs themselves are phase 12). The route
binds each verb to the caller's grant and plan (PS-14, PS-24). The socket serves one request at a time and caps a verb
at 60 s, so a long verb must not run inside the request.

## Inputs
- Step 0: re-checked against main `f0128ff57` (2026-11-19): the session-verb plan landed (`session <x>` verbs), the
  owner-question store landed its head door (`questions ask|ack|cancel|answer` socket verbs, route child
  `callHeadQuestions`) and `session write` (publishes through the paths land). Re-grep only if main moved; a finding
  that changes PS-10 stops the phase with `NEEDS_CONTEXT`.
- `packages/run-supervisor/contracts/head-request.v1.json`: `verbs`, `order` (busy), `run.verbTimeoutMs` 60000,
  `refusalCodes`.
- `packages/run-supervisor/rust/src/head_request.rs:40` (`VERB_TIMEOUT`), `:53` (`MAX_CONNECTIONS` 8), `:76`
  (`role_move`), `:986` (`decide`: grant check, `busy` gate), `:1067-1080` (`run_verb`: route child, `env_clear` + the
  step env, group killed on timeout only). Rust client half: `head_client.rs` (`request_head`), used by the host's
  confined routing (PS-20, phase 16). The verb whitelist is `cfg.verbs` from the envelope.
- `src/session-host/head-request.mjs:22-54` (`confined`, `startHead`, `rotateHead`: per-verb confined branches that
  keep their callers), `:64` (`exactKeys`), `:69` (`ownLineage`), `:83` (`callHeadQuestions`: the route child running
  a host verb with the envelope's `hostBin`, the precedent for `land` and `supervisor`), `:104-150` (`runHeadRequest`,
  the route `switch`); `head-request-client.mjs:17-25` (verb constants), `:80` (`requestHead(verb, args)`, already
  generic); `head-start.mjs:45-55` (placement read/write), `:42` (`lineageDirOf`), `:97` (`openingText`); today's CLI
  branch `bin/fgos.mjs` `case 'session'` (~:3376).
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
  Agreed with lead:OPS-METRICS on 2026-11-18: `retired` is the field `retiredAt` (RFC 3339) in the head's
  `placement.json` under `.fgos/runtime/session-rotation/<persona>-<name>/`, and the record's ts is `retiredAt`.
  `session stop` writes exactly that field.
- Owner-question store: `fgos questions ack|cancel <id>` accepts the asker, any session holding the same `head:` role
  (the successor the supervisor starts with the asker's persona and name), or any head when the asker held no head
  role (its QP-4). No `answers:` role, no `--for` flag.

## Footprint
`packages/run-supervisor/contracts/head-request.v1.json`, `packages/run-supervisor/rust/src/head_request.rs`,
`packages/run-supervisor/rust/tests/head_request.rs`, `src/session-host/head-request.mjs`,
`src/session-host/head-request-client.mjs`, `src/session-host/head-stop.mjs` (new), `src/session-host/head-plan.mjs`
(new), `src/session-host/head-start.mjs`, `test/session-host/head-request.test.mjs`,
`test/session-host/head-stop.test.mjs` (new), `test/session-host/head-plan.test.mjs` (new),
`docs/platform/session-host/spec.md`.

## Steps
0. Re-grep inputs; list the verbs the contract has now; read what the landed head-state source treats as `retired`.
1. Contract: add verbs `land`, `run`, `request result`, `worktree create`, `session stop`, `supervisor handled`,
   `supervisor done`, each with `args`, `does`, `data`, `identity: held`; `session start` args gain optional
   `forQuestion`. Add refusal codes `ticket-used`, `ticket-unknown`, `land-branch-lead-only`, `path-outside-grant`,
   `write-outside-footprint`, `footprint-change-refused`. `bad-args` exists ("session write only"): widen its text to
   every verb whose args break its contract shape, do not add a second code.
2. Client constants: one constant per new verb in `head-request-client.mjs`, beside the existing ones; Node callers use
   the existing generic `requestHead(verb, args)`. No new Node client door: the host routes confined calls of these
   verbs in Rust through `head_client::request_head` (PS-20, phase 16).
3. `head-plan.mjs`: `planOfHead(projectRoot, persona, name)` resolves a `lead-*`/`planner-*` name to its plan dir by
   the PS-11 rule (strip the project prefix, unique prefix among plans not `done`/`withdrawn`), reads `plan.md` at the
   trunk tip (`resolveTrunk` + `readObjects`, never the working file) and returns `{dir, footprint}`. Refusals
   `plan-not-found`, `plan-ambiguous`. One reader for phase 9's grant and for this route.
4. Ticket verbs `land` and `run` (route child, `head-request.mjs`):
   - `land` args `{branch?, paths?, tests?, message?}` (exactly one of `branch`/`paths`; `message` is the commit
     message, required with `paths`, as `LandCommand.message` of phase 7). Binding: `paths` outside the caller's
     grant `writes` refuse `path-outside-grant`; `branch` from any persona but `lead` refuses `land-branch-lead-only`;
     a lead's branch land passes its plan footprint (`planOfHead`) as `--footprint`; a lead's `paths` land that changes
     the `footprint` of its plan's frontmatter against the trunk tip refuses `footprint-change-refused`.
   - `run` args `{prompt, provider?, capability?, writes?, worktree?}`, lead only (no `unit`: a Unit file the sandbox
     wrote names its own writes and cannot be bound; review 2026-11-19); any argv value starting with `-` refuses
     `bad-args`; `writes` not covered by the
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
   writes `retiredAt` (RFC 3339, now) into the lineage's `placement.json` through `writeHeadPlacement` (the landed
   head-state source answers `retired` from it: `apps/fgos/src/wiring/observe_sources/head_state.rs:11-16`), and
   returns `{stopped: true}`. A role no live session holds returns
   `{stopped: false, reason: "not-live"}`. The route refuses `role-mismatch` for a persona-name that is not a `lead-*`
   or `planner-*` lineage of this project, an asker named by an answered question, or the caller's own.
8. `session start` with `forQuestion`: passed through `startHead` to `startHeadSession`, which adds one opening line
   (`openingText` in `head-start.mjs`): "You continue question <id>: write its answer back to its origin, then
   `fgos questions ack <id>` (or `cancel`)". The successor holds the asker's own head role, so no flag is needed. No
   other start changes.
9. `supervisor handled|done`: the route child runs the host verb `fgos supervisor <sub> --json` the way
   `callHeadQuestions` runs `questions` (envelope `hostBin`) and returns its JSON. The host verb lands in phases 12/16;
   tests here use a fake host.
   On `done` answering `{done: true}`, the route spawns a detached `session stop` of the caller's own role (after the
   reply is written) and adds `stopping: true` (PS-9).
10. Rust: only if the contract tests need it (`role_move` untouched). One serving proof: a ticket verb returns well
    under `VERB_TIMEOUT` while its detached runner survives the route child's exit.
11. Node tests, one behaviour each:
    - `head-request.test.mjs`: `requestHead` with a new verb reaches the route (fake socket); the ticket file
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
