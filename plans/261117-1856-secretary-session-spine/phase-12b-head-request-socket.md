# Phase 12b: One request socket per head session, and the verb `head start` through it

<!-- Added 2026-11-18 for the owner decision "Head sessions are confined like workers; one request socket" (plan.md, Design settled). -->
A confined head cannot reach herdr, so it cannot start another session itself. Its own run supervisor opens one request
socket, binds it read-only into that sandbox (the GO socket pattern), and performs granted verbs outside. This plan ships
one verb, `head start`. Confined and unconfined callers end in the same `startHeadSession`; the socket is only a
transport into that door, never a second implementation.

## Component authority

| Question | Owner |
|---|---|
| Which session is calling, which role it holds | Identity (`directory::resolve`, `packages/identity/rust/src/directory.rs:620`); the supervisor asks, never caches |
| Which verbs the role may ask for | The grant table through `grantOf(role)` (phase 12, `src/session-host/head-grants.mjs`), read once at launch and carried in the digest-protected envelope (`session.verbs`); the supervisor reads only the envelope |
| Transport, peer check, enforcement, the log line | Run supervisor (`packages/run-supervisor/rust/src/head_request.rs`, new) |
| What `head start` does | `startHeadSession` (`src/session-host/head-start.mjs`), called host-side by the payload entry |

## Answers from code
- **Where the socket lives.** The GO socket is created and served by the Rust supervisor: `AttemptSocket::bind`
  (`packages/run-supervisor/rust/src/supervise/terminal.rs:154`: directory owned by the user, mode 0700, file 0600, path
  at most 107 bytes) and accepted with `accept_gate` (`:185`, uid from `peer_uid`, `go_channel.rs:112`, SO_PEERCRED on
  Linux, `getpeereid` elsewhere; pids are never compared). Node only computes the path (`terminalSocketPath`,
  `src/run-supervisor/direct-launch.mjs:120`) and the bwrap driver binds it back read-only after checking it lies
  directly in the socket directory (`gateGoSocket`, `src/runner/dispatch/confinement/drivers/bwrap.mjs:261`, bind at
  `:652-657`). The request socket uses the same three pieces; no new daemon, no Node server.
- **Peer authentication.** The socket file exists only inside this attempt's sandbox (one `--ro-bind`; the runtime
  directory around it is masked, agent-confinement spec 9.3), and the uid must be the supervisor's own. A same-uid host
  process can also reach it; the trust boundary is the OS user, as for Identity (identity spec, local directory). The
  caller is therefore this attempt's session, and its role is whatever Identity says that session holds now (so a role
  moved away by rotation stops the old session's verbs).
- **Executing the verb.** The supervisor never runs Node logic itself. It runs
  `<hostBin> internal head-request --protocol 1 --run-dir <attemptDir>` with the request on stdin; the host execs the
  Node payload of the same release, as the `attempt-step` route does (`packages/run-supervisor/rust/src/attempt_step.rs:15`,
  route switch `route.rs:150,160`, contract `internal-route.run-supervisor.v1.json` row `attempt-step`). The entry
  calls `startHeadSession` and prints one JSON line.

## Doors reused and paths deleted (L10)
Reused: `AttemptSocket::bind`, `peer_uid`, `read_frame`/`write_frame` (`go_channel.rs:54,69`), the payload exec of
`attempt_step.rs`, the bind-back check of `gateGoSocket` (generalized to name any socket of this attempt, not copied),
`startHeadSession`, Identity `resolve`. Deleted: nothing on main; the WIP has no socket code.

## Inputs (read first)
Phase 12 report; `packages/run-supervisor/contracts/gate-go.v1.json`; `docs/platform/run-supervisor/spec.md` sections
5.1, 5.3, 7, 10; `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json`.

## Files this phase may write
`packages/run-supervisor/contracts/head-request.v1.json`, `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json`,
`packages/run-supervisor/contracts/envelope.v3.json`, `packages/run-supervisor/rust/src/head_request.rs`,
`packages/run-supervisor/rust/src/lib.rs`, `packages/run-supervisor/rust/src/route.rs`,
`packages/run-supervisor/rust/src/attempt_step.rs`, `packages/run-supervisor/rust/src/supervise/terminal.rs`,
`packages/run-supervisor/rust/tests/head_request.rs`, `src/session-host/head-request.mjs`,
`test/session-host/head-request.test.mjs`, `src/runner/dispatch/session-attempt.mjs`,
`src/runner/dispatch/confinement/drivers/bwrap.mjs`, `test/run-supervisor/bwrap-driver.test.mjs`,
`plans/261117-1856-secretary-session-spine/reports/phase-12b-head-request-socket.md`.

## Steps
1. **Contract** `packages/run-supervisor/contracts/head-request.v1.json`: framing as gate-go (4-byte big-endian length,
   one UTF-8 JSON object, at most 65536 bytes; oversize or invalid closes the connection); frames
   `REQUEST {type, id, verb, args}` (client to supervisor) and `REPLY {type, id, result: done|refused, data?, code?, detail?}`;
   one connection carries one request; at most one request runs at a time (a second gets `busy`); the verb runs at most
   `verbTimeoutMs` (60 000; the head's own launch waits up to 45 s for its binding); verbs: `head start` with
   `args {persona, name, beside?}`; refusal codes `peer-uid`, `bad-frame`, `role-not-held` (Identity does not give this
   session the envelope's role), `verb-not-granted`, `busy`, `verb-failed` (the entry's own code in `detail`),
   `verb-timeout`; lifetime: listening from before the pane launch until the attempt closes, path unlinked then. Add the
   envelope field `session.requestSocketPath` and `session.verbs` rules, and the route row `head-request`.
2. **Supervisor** (`head_request.rs`, wired from `terminal.rs` `run` (`:710`) and `Sup::tick` (`:530`)): bind with
   `AttemptSocket::bind` before `session_host.launch`; each tick accept without blocking; check the uid; read one frame
   with a 5 s read timeout; resolve this attempt's full session id through `directory::resolve` and require its roles to
   contain `envelope.session.role`; require `verb` in `envelope.session.verbs`; spawn the route child on a worker thread
   (stdin the request, env the step env, stdout one JSON line, killed at `verbTimeoutMs`, dies with the supervisor as a
   step does) and write `REPLY` from that thread; append one line per request to `supervisor.log`
   (`head-request <id> <verb> <result> <code>`, no args). The tick never blocks on a request.
3. **Route** `fgos internal head-request --protocol 1 --run-dir <attemptDir>`: verify the envelope like `attempt-step`
   and exec `src/session-host/head-request.mjs` of the envelope's `payloadRoot`; share the exec helper with
   `attempt_step.rs` instead of copying it.
4. **Node** `src/session-host/head-request.mjs`: (a) the payload entry: read the request from stdin, call
   `startHeadSession({persona, name, beside, projectRoot: envelope.cwd})`, print `{result, data|code}`; (b) the client
   `requestHeadStart(args)`: connect to `FGOS_HEAD_REQUEST_SOCKET`, check the socket file is owned by its own uid, send
   one frame, wait for `REPLY`; (c) `startHead(args)`: the one branch, `FGOS_CONFINED === '1'` sends through the socket
   (refused `no-request-socket` when the variable is unset, which is a confined worker), otherwise calls
   `startHeadSession` directly. Phase 15's CLI arm calls `startHead` and nothing else.
   Phase 12 found (live) that `FGOS_CONFINED` is set on the gate only: the gate builds the agent's environment from the
   declared allowlist, so the agent never sees it. Fix it at that one place: the gate adds `FGOS_CONFINED=1` to the
   agent environment whenever it runs inside bwrap (the env-allowlist contract names it), so every confined agent, worker
   or head, sees the same marker; never infer confinement from the socket variable or from a masked path.
5. **Launch wiring**: `launchSessionAttempt` (phase 12) computes the socket path with `terminalSocketPath(<attemptId>-req)`,
   writes `session.requestSocketPath` and `session.verbs = grantOf(role).verbs` into the envelope, puts
   `FGOS_HEAD_REQUEST_SOCKET` in the launch env, and passes the path to the confinement request; `bwrap.mjs` binds it
   back read-only through the generalized check (only a socket directly in the run supervisor's socket directory).
   A role whose grant has no verbs gets no socket at all.
6. **Proofs** (one owner each):
   - the wire contract and enforcement: `packages/run-supervisor/rust/tests/head_request.rs` (wrong uid is not testable
     unprivileged: unit-test the uid predicate; oversize frame, role not held, verb not granted, busy, timeout, a granted
     request runs the route child and returns its line).
   - bind-back: extend the GO socket case of `test/run-supervisor/bwrap-driver.test.mjs` (the request socket is bound
     read-only; a path outside the socket directory is refused).
   - the Node client and branch: `test/session-host/head-request.test.mjs` (one wiring proof against a socket the test
     serves; confined without the variable refuses). The use-case cases stay in `head-start.test.mjs`.

## Verify
- `node scripts/run-tests.mjs test/session-host/head-request.test.mjs test/session-host/head-start.test.mjs test/run-supervisor/bwrap-driver.test.mjs test/run-supervisor/contracts.test.mjs test/architecture.test.mjs`
  (read ERROR lines and the fail count).
- `cargo test -p fgos-run-supervisor`; `cargo clippy -p fgos-run-supervisor -- -D warnings`;
  `cargo check -p fgos-run-supervisor --target aarch64-apple-darwin`.
- Live through `npm run fgos:dev` (phase 12's precondition): start `secretary` / `probe`; inside its pane run
  `node -e "import('<checkout>/src/session-host/head-request.mjs').then(m=>m.startHead({persona:'planner',name:'probe2'}))"`;
  expect a second tab, `head-request ... head start done` in the secretary attempt's `supervisor.log`, and
  `fgos identity resolve head:planner-probe2` live. From a `planner` head the same call is refused `verb-not-granted`.
  Close all probe panes and check every probe attempt reaches `closed.json`.

## Risks
1. **Verb execution blocks the supervisor (Medium x High).** Mitigation: the request runs on its own thread; a proof that
   the carrier check still runs while a request is pending.
2. **Socket gone after supervisor death (Low x Medium).** The head lives on (orphan branch) but its verbs stop. Mitigation:
   the client names `request-socket-unavailable`; the person restarts the head. No adopt-side server.
3. **Host CLI inside the sandbox (Medium x Medium).** `fgos head start` runs the host and Node payload under a read-only
   root; any write it attempts before the arm fails. Mitigation: phase 15 keeps the confined arm to `startHead` only; the
   live check runs the real verb once phase 15 lands (phase 18 live check (a)).

## Rollback
Revert the phase commit. Heads started with a socket keep running; their envelopes name the socket, which is simply
absent after their supervisor ends.
