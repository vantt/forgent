# Phase 12b: one request socket per head session, and `head start` through it

Status: DONE (live check done).

## What changed
- Contract `packages/run-supervisor/contracts/head-request.v1.json` (frames, verb, refusal codes, limits, order of checks); route row `head-request` in `internal-route.run-supervisor.v1.json`; envelope `session.verbs` / `session.requestSocketPath` rules (present together or the supervisor refuses `envelope-invalid`).
- Supervisor: `head_request.rs` (`HeadRequests`): polled from `Sup::tick`, each connection on its own thread (max 8), peer uid, 5 s whole-frame read deadline, Identity check (`session_for` of the attempt's writer id equals the holder `resolve` finds for the role; Identity errors fail closed), verb in the envelope, one request at a time, route child through the process door's `run_bounded_command` (60 s, own group, parent-death signal), one `head-request <id> <verb> <result> <code>` log line. Socket bound with `AttemptSocket::bind` (reused, same dir/mode/length rules), before the pane launch, dropped (path unlinked) once the gate is gone.
- Route `fgos internal head-request`: `attempt_step::exec_payload` is the one hand-over helper both routes use (attempt-step's own copy deleted).
- Node: `src/session-host/head-request.mjs`: `requestHeadStart` client, `startHead` (one branch on `FGOS_CONFINED === '1'`), payload entry `runHeadRequest` (args re-checked, project is the envelope's cwd, the sandbox cannot choose it). `startHeadSession` stays the only starter.
- Launch: `session-attempt.mjs` computes `terminalSocketPath(<attemptId>-req)` only when the grant has verbs, writes both envelope fields, sets `FGOS_HEAD_REQUEST_SOCKET` (name lives in `head-grants.mjs`, so the launcher does not import the payload module) and passes `requestSocket` in the confinement request; `bwrap.mjs` binds it read-only through `socketInRuntimeDir`, the one check shared with the GO socket (same refusal code).
- `FGOS_CONFINED=1` reaches the agent: `authority.mjs` adds it to the agent environment when the prepared confinement has a sandbox prefix (driver result, not a flag); named in `worker-env-allowlist.v1.json`.
- grantOf: no supervisor-side call exists. The grant is read once at launch (`startHeadSession` passes the persona explicitly) and rides the digest-protected envelope; the supervisor and the entry read only the envelope, so the hyphen fallback is never used.

## Out-of-footprint edits (all approved)
`request.mjs`, `authority.mjs`, `assignment-runner.mjs` (one line), `worker-env-allowlist.v1.json`, confinement contract md and spec 9.3, `head-grants.mjs` (variable name), `docs/architecture-manifest.json` (layer and tier rows), `contracts.test.mjs`, `dispatch-confinement-authority.test.mjs`. Also the separate fix fc5f63d7a (import cycle in the confinement shape modules), already in main.

## Proof
- `cargo test -p fgos-run-supervisor` all green (head_request.rs: 8 integration cases + 2 unit; wire contract, role, verb, bad frames, busy with the tick never held, timeout, verb-failed detail, contract agrees with code); clippy `--all-targets -D warnings`, `cargo fmt --check`, `cargo check --target aarch64-apple-darwin` clean.
- Node via `scripts/run-tests.mjs`: head-request 5, head-start, bwrap-driver (request socket bound ro, outside-dir refused), contracts, architecture, confinement authority (marker), worker-env, backend-p03, terminal-cutover, install-packaging: 181 pass, 0 fail, no ERROR lines.
- Live (staged dev host, this machine, real herdr, gemini via the leased account):
  - `secretary`/`probe` (planner persona stand-in, secretary grant): agent environ has `FGOS_CONFINED=1`, `FGOS_HEAD_REQUEST_SOCKET`; inside its mount namespace the socket is present. `startHead({persona:'planner', name:'probe2'})` from inside returned `head:planner-probe2`; a second tab opened; `supervisor.log`: `head-request f69fbd6a0bd20af2 head start done -`; `fgos identity resolve head:planner-probe2` and `head:secretary-probe` live.
  - `planner-probe2` (grant with no verbs): envelope `session {role, verbs: []}`, no socket path, no variable; `startHead` from inside refused `no-request-socket`, nothing started. A confined worker is the same shape (marker, no variable), same code.
  - Both panes closed with `herdr pane close`; both attempts reached `closed.json` (`gate-lost`), sockets unlinked, no process left.

## Notes
- `head-request` route is Unix-only (Windows host answers `internal`).
- The GO socket file stays visible inside the sandbox after GO (existing behaviour, not widened).
