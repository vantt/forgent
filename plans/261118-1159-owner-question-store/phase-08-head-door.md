# Phase 8: Head door: questions over the request socket

## Inputs
- `plan.md` QP-6, QP-16 and QP-22.
- `packages/run-supervisor/contracts/head-request.v1.json`: its verbs and args, one request per connection, the 60 s
  bound, and the `busy` answer. The existing verbs are `session start|rotate|answered|restore role|bind session|write`;
  the new ones are `questions *`, which does not collide with `session <x>`. Each verb carries an `identity` field
  (`held`, `registered-then-take`, and so on).
- `packages/run-supervisor/rust/src/head_request.rs:1-8`. It only carries and enforces. It learns what a role may ask
  for from the envelope and needs no change; confirm that in step 0.
- `src/session-host/head-request.mjs`: `runHeadRequest` (:75-114), which reads the trusted envelope and switches on
  the verb (switch :89, `unknown-verb` default :114).
- `src/session-host/head-request-client.mjs`: the client; verb constants `HEAD_*_VERB` (:17-21) and the
  `requestHead*` helpers (:120-133).
- `src/session-host/head-grants.mjs`: `GRANTS` per persona, read through `grantOf(role, persona)`; the shared list
  `HEAD_VERBS` (`ROTATION_VERBS` no longer exists); `HEAD_REQUEST_SOCKET_ENV` (:12).
- `head_client::request_head(socket, verb, &args, &id, REPLY_TIMEOUT)`, the Rust client, used by
  `apps/fgos/src/wiring/mailbox_identity.rs:209` and `session_rotation_hook.rs:238`.
- `src/runner/dispatch/confinement/workspace-paths.mjs:42`, which refuses a grant under `.fgos` (the attempt's own
  run directory), so a head never gets `.fgos` writable.
- The crate from phase 3 and `apps/fgos/src/wiring/questions.rs` from phase 4. Where the internal route lives: the
  run supervisor's routes (`head-request`, `supervise`, ...) are in `packages/run-supervisor/rust/src/route.rs:152-170`
  and `internal-route.run-supervisor.v1.json`, but that crate does not depend on `fgos-questions`. `apps/fgos` hosts
  the other internal routes itself (`seat-binding`: `main.rs` dispatches before the route table, `wiring/seat_binding.rs`
  serves it; `main.rs:176` says they are not listed in `command-routes.json` or help). `head-questions` follows the
  `seat-binding` pattern.

## Footprint
See the phase table in `plan.md`, row 8.

## Steps
0. Re-grep every input.
1. Add these verbs to `head-request.v1.json`, each with `args`, `does`, `identity: held` (the head holds its role) and
   the same role step as `session rotate`:
   - `questions ask` `{input, ref, supersedes?, migrated?}`
   - `questions ack` `{id}`
   - `questions cancel` `{id, reason}`
   - `questions answer` `{id, option?, text?}`

   Give each one its refusals.
2. Add `QUESTION_VERBS = ['questions ask', 'questions ack', 'questions cancel']` to `head-grants.mjs` and include it in
   every persona's grant, the way `HEAD_VERBS` is included (the shaper's `verbs` becomes `[...HEAD_VERBS,
   ...QUESTION_VERBS]`). Only the secretary also gets `questions answer`; the shaper stays without it.
3. Add the internal route `fgos internal head-questions --run-dir <dir>`: a branch in `apps/fgos/src/main.rs` beside
   `seat-binding`, implemented in `apps/fgos/src/wiring/head_questions.rs`. Document its argv in
   `head-request.v1.json`. `route.rs` and the internal-route contract stay unchanged (they own the supervisor's
   routes).
   - It reads the request on stdin.
   - It reads the envelope from the run dir itself.
   - It fills the caller from the envelope: role, session id, handle, persona, machine, and the worktree for the
     ref check.
   - It runs the use case and prints one JSON answer.
   - It does not appear in help.
4. In `runHeadRequest`, the `questions *` verbs call that route through the host and return its answer. Node does
   nothing else.
5. In `wiring/questions.rs`, when `FGOS_HEAD_REQUEST_SOCKET` is set (`HEAD_REQUEST_SOCKET_ENV`), `ask`, `ack`,
   `cancel` and `answer` go through `head_client::request_head`. On `busy` they retry 3 times, 1 s apart.
6. Add the verbs to the head request lists in `docs/platform/session-host/spec.md` (the verb line now reads
   `session start|rotate|answered|write`, plus the `session restore role` and `session bind session` mentions).
7. Tests:
   - `apps/fgos/tests/questions_head.rs`:
     - an envelope-driven `ask` records the envelope role;
     - a forged role in the args is ignored;
     - a shaper's `answer` is refused;
     - a secretary's `answer` records `by: owner, source: secretary`;
     - one `ask` is timed and stays under the bound.
   - Extend the session-host request and grant tests: dispatching the new verbs, and the `busy` retry.
8. Regenerate the census. No route or manifest entry is added: the internal route is not in them.

## Verify
- `cargo test -p fgos --test questions_head`
- the session-host tests, run through the repo test runner

Pass condition: both are green.

## Rollback
Revert the phase commit. Heads lose the socket verbs, and the CLI verb stays.
