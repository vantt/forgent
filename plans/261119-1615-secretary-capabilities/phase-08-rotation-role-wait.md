# Phase 8: A rotation successor's role-gated verbs wait for the role

## Context (cause found in phase 2 review)
Miu gen 14 (2026-11-19 09:06Z, `.fgos/assignments/head-secretary-miu-14/runs/01`) was a rotation successor. It
registered without the role by design (`holder_is_predecessor` -> `register(&[])`, terminal.rs), bound its session,
and its questions hook ran `fgos questions list` at 09:06:31Z and 09:06:34Z -> `role-not-held`, before the predecessor's
`session answered` (~09:06:40Z) moved the role. Not a fresh start, not a dead holder, not a bind race. Phase 2 made a
fresh start bind its role before GO and refuse by name; this phase closes the rotation window.

## Requirements
1. Route (`packages/run-supervisor/rust/src/head_request.rs` `decide`): a role-gated verb from a registered head whose
   role is still held by its live rotation predecessor (same head key, lower gen) is refused `role-pending-rotation`
   (retryable; detail names the predecessor), never `role-not-held`. `role-not-held` stays for every other caller.
2. Client (`src/session-host/head-request-client.mjs`): on `role-pending-rotation` wait and retry with bounded backoff
   (total at most the rotation handover budget, e.g. 60 s), then report the code by name.
3. A rotation whose role move fails (`session answered` / `session restore role`) is refused by name and the predecessor
   keeps the role (phase 2 requirement 3).
4. A refusal from a route child carries a bounded detail to the client (today only the code reaches it: `head_request.rs`
   ~1143-1151 logs the message, `head-request-client.mjs` ~83-85 prints `verb-failed (<code>)`), so a confined
   `fgos session start nope` shows `persona-not-found` with the known personas (p-ficygecgfb). Contract
   `head-request.v1.json`, session-host spec.
5. Tests: route test with predecessor holding the role -> `role-pending-rotation`; after the move the same call passes;
   client retry proof at the CLI boundary once.
