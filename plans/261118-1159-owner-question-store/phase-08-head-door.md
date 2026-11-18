# Phase 8: Head door: questions over the request socket

## Inputs
- `plan.md` QP-6, QP-16 and QP-22.
- `packages/run-supervisor/contracts/head-request.v1.json`: the verbs, their args, the one-request-per-connection
  rule and the 60 s bound. After the session-verb plan the verb prefix is `session`, so read it in step 0.
- `packages/run-supervisor/rust/src/head_request.rs`: how a verb is served, how the envelope's role is read, and how
  replies are framed.
- `src/session-host/head-grants.mjs`: the grant table (`GRANTS` and `ROTATION_VERBS`).
- How a head's CLI forwards a request verb to its socket today, so the same forwarding is used.
- `src/runner/dispatch/confinement/workspace-paths.mjs:26-31`: why `.fgos` is never writable inside a head.
- The `CallerSource` socket adapter port from phase 3, and `apps/fgos/src/wiring/questions.rs` from phase 4.

## Footprint
See the phase table in `plan.md`, row 8.

## Steps
0. Re-grep every input.
1. In `head-request.v1.json`, add these verbs:
   - `questions ask`, with args `{input, ref, supersedes?, migrated?}`;
   - `questions ack`, with args `{id}`;
   - `questions cancel`, with args `{id, reason}`;
   - `questions answer`, with args `{id, option?, text?}`.
   Each verb names its refusals.
2. In `head_request.rs`, serve each verb by calling the `fgos-questions` use case. The `CallerSource` socket adapter
   is filled from the envelope: role, session id, handle, persona, and the worktree used for the ref check.
3. In `head-grants.mjs`, grant `questions ask|ack|cancel` to every persona's grant and `questions answer` to the
   secretary.
4. In `wiring/questions.rs`, a write sub-verb run inside a head goes through the socket, the way the head's other
   request verbs do.
5. In `docs/platform/session-host/spec.md`, add the verbs to the head request list.
6. Tests:
   - `cargo test -p fgos-run-supervisor`: a head's `ask` records the envelope role as the asker, a shaper's `answer`
     is refused as not granted, a secretary's `answer` records `by: owner, via: secretary`, and one `ask` is timed to
     stay under the bound;
   - extend the session-host grant test.
7. Regenerate the census.

## Verify
- `cargo test -p fgos-run-supervisor`
- the session-host grant test, through the repo test runner

Pass condition: both are green.

## Rollback
Revert the phase commit. Heads lose the socket verbs, and the CLI verb stays.
