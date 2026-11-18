# Phase 8: Head door: questions over the request socket

## Inputs
- `plan.md` QP-6, QP-16 and QP-22.
- `packages/run-supervisor/contracts/head-request.v1.json`: its verbs and args, one request per connection, the 60 s
  bound, and the `busy` answer. After the session-verb plan the verb prefix is `session`; read it in step 0.
- `packages/run-supervisor/rust/src/head_request.rs:1-8`. It only carries and enforces. It learns what a role may ask
  for from the envelope and needs no change; confirm that in step 0.
- `src/session-host/head-request.mjs`: `runHeadRequest` (:89), which reads the trusted envelope and switches on the
  verb.
- `src/session-host/head-request-client.mjs`: the client and its verb constants.
- `src/session-host/head-grants.mjs`: `GRANTS` and `ROTATION_VERBS`.
- `head_client::request_head`, the Rust client.
- `src/runner/dispatch/confinement/workspace-paths.mjs:26-31`, which explains why `.fgos` is never writable in a head.
- The crate from phase 3 and `apps/fgos/src/wiring/questions.rs` from phase 4. The internal route pattern is in
  `routing.rs` and `command-routes.json`, for example `internal head-request`.

## Footprint
See the phase table in `plan.md`, row 8.

## Steps
0. Re-grep every input.
1. Add these verbs to `head-request.v1.json`:
   - `questions ask` `{input, ref, supersedes?, migrated?}`
   - `questions ack` `{id}`
   - `questions cancel` `{id, reason}`
   - `questions answer` `{id, option?, text?}`

   Give each one its refusals.
2. Add `QUESTION_VERBS = ['questions ask', 'questions ack', 'questions cancel']` to `head-grants.mjs` and include it in
   every persona's grant, the way `ROTATION_VERBS` is included. The secretary also gets `questions answer`.
3. Add the internal route `fgos internal head-questions --run-dir <dir>`, implemented in
   `apps/fgos/src/wiring/head_questions.rs`.
   - It reads the request on stdin.
   - It reads the envelope from the run dir itself.
   - It fills the caller from the envelope: role, session id, handle, persona, machine, and the worktree for the
     ref check.
   - It runs the use case and prints one JSON answer.
   - It does not appear in help.
4. In `runHeadRequest`, the `questions *` verbs call that route through the host and return its answer. Node does
   nothing else.
5. In `wiring/questions.rs`, when `FGOS_CONFINED=1`, `ask`, `ack`, `cancel` and `answer` go through
   `head_client::request_head`. On `busy` they retry 3 times, 1 s apart.
6. Add the verbs to the head request list in `docs/platform/session-host/spec.md`.
7. Tests:
   - `apps/fgos/tests/questions_head.rs`:
     - an envelope-driven `ask` records the envelope role;
     - a forged role in the args is ignored;
     - a shaper's `answer` is refused;
     - a secretary's `answer` records `by: owner, source: secretary`;
     - one `ask` is timed and stays under the bound.
   - Extend the session-host request and grant tests: dispatching the new verbs, and the `busy` retry.
8. Regenerate the routes, the manifest and the census.

## Verify
- `cargo test -p fgos --test questions_head`
- the session-host tests, run through the repo test runner

Pass condition: both are green.

## Rollback
Revert the phase commit. Heads lose the socket verbs, and the CLI verb stays.
