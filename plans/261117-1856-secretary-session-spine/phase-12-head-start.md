# Phase 12: Head sessions start confined, through the worker's seat door

<!-- Rewritten 2026-11-18 for the owner decision "Head sessions are confined like workers; one request socket" (plan.md, Design settled). Supersedes the plain-harness launch of the sec/p12 WIP. -->
A head session (secretary, shaper, lead) is launched exactly like a terminal worker attempt: run supervisor, bwrap
sandbox with the herdr socket and the user runtime directory masked, account lease, private home, login write-back at
retire. The only difference from a worker is a grant keyed by the Identity role: which paths of the main checkout are
writable, and which verbs the session may ask for. This phase delivers the confined launch and the writable paths;
phase 12b adds the request socket and the one verb `head start`.

## Component authority (who decides what; nobody re-decides another's question)

| Question | Owner | Where |
|---|---|---|
| Who is this session, which role does it hold, is it alive | Identity | `packages/identity/rust/src/directory.rs:537` `register_writer`, `:620` `resolve` |
| What a role may write and ask for | The grant table, one reader `grantOf(role)` | new `src/session-host/head-grants.mjs` (step 2) |
| Which CLI, model, account and invocation | `bind()` | `src/runner/execution/bind.mjs`, reached through `bindHeadSeat` (kept from the WIP) |
| Sandbox, private home, credential copy and write-back | Confinement Authority | `src/runner/dispatch/confinement/authority.mjs:721` `prepareConfinementForLaunch`, `:970` `finalizeAttemptHome` |
| Pane allocation, typed opening, liveness of the attempt, steps after it | Run supervisor (transports and enforces only) | `packages/run-supervisor/rust/src/supervise/terminal.rs` |
| Starting a head, fronting a live one, one live head per persona-name | Session Host use case `startHeadSession` | `src/session-host/head-start.mjs` |

## Answers from code (prior art)

1. **Can the run supervisor host a long-lived interactive attempt?** Almost. The envelope already allows no soft
   deadline (`deadlines.softAt` null) and no idle limit (`idleMs` null) (`packages/run-supervisor/contracts/envelope.v3.json`
   `fields.deadlines`); with `idle` None the supervisor never samples the screen (`terminal.rs:530-560` `Sup::tick`,
   `sampling_can_matter`). The steps are a list the controller writes. Three things stop a head today:
   (a) after `BRIEF_DELIVERED` the loop ends the attempt on any `blocked` state or visible blocker
   (`terminal.rs:934` `adapter.detect_completed`, body `packages/agent-protocol/rust/src/terminal/mod.rs:690`), and a head
   shows permission dialogs all day; it also ends on a result file and on an unreadable result (`terminal.rs:940`);
   (b) `buildEnvelope` always derives the hard ceiling from the round timeout (`src/run-supervisor/direct-launch.mjs:235`);
   (c) `attemptSteps` always puts `settle-attempt` first (`direct-launch.mjs:159-169`), which needs a run control token a
   head does not have. The minimal change is an optional envelope object `session` that, when present, makes the
   terminal loop after delivery wait only for the end of the domain, the carrier and a cancel request, plus a caller-given
   ceiling and a step list without `settle-attempt`. The only entry that starts a supervised terminal attempt is
   `executeAssignment` (`src/runner/dispatch/assignment-runner.mjs:1201`), through `buildLaunch` (`:840`) and
   `awaitBinding` (`:1080`); there is no detach mode (`rg -n detach src/runner/dispatch/assignment-runner.mjs` is empty)
   and it waits for a settled result (`awaitSettledResult`, `:1120`). A head is not a unit of work (no run control, no
   evaluator, no commit), so it does not go through `executeAssignment`; it reuses the same seat functions (step 3).
2. **Request socket**: phase 12b.
3. **How a head registers its role.** The WIP's SessionStart row (`fgos identity session --register --role
   "$FGOS_HEAD_ROLE"`) runs inside the sandbox, where the state root is not writable and a pid is a namespace pid, so it
   cannot be the door. The supervisor, outside the sandbox, registers the attempt's session with the role through
   `register_writer` (key `FGOS_SESSION_ID` = the attempt writer id, `envelope.identity.writerId`; head = the gate's host
   tuple, which lives exactly as long as the domain). Identity stays the only authority; the run supervisor crate already
   depends on `fgos-identity` with `default-features = false` (`packages/run-supervisor/rust/Cargo.toml`); it adds the
   `directory` feature.
4. **Lease lifetime and write-back.** A lease is not exclusive (`src/runner/dispatch/provider-capacity.mjs:652-700`
   adds one entry per run id). It is reclaimed only when the runner pid is dead and `isRunWorkerAlive` says the run's
   attempt no longer works (`provider-capacity.mjs:571`); the closure that answers that maps run id
   `run_<assignmentId>_<NN>` to `.fgos/assignments/<assignmentId>/runs/<NN>` and asks the adopt probe
   (`assignment-runner.mjs:629-635`, `src/runner/dispatch/run-admission.mjs:38`). So a head attempt lives under
   `.fgos/assignments/<headKey>/runs/01` with run id `run_<headKey>_01`: its lease then lasts exactly as long as its
   supervised attempt, with no new code. The login is renewed once before the copy (`renewLeasedLogin`, `:781`) and
   written back by `finalize-home` when the head ends (pane closed: receipt `carrier-lost`; agent quits: `exited`), as
   for every attempt. A claude login renewed inside the home is staged, never applied (agent-confinement spec, section on
   claude); see risk 1.
5. **Split**: yes. This phase is the confined launch; `phase-12b-head-request-socket.md` is the socket and the verb.

## Doors reused and paths deleted (L10)

- Reused, never copied: `bindHeadSeat` (WIP), `acquireAttemptLocks`, `writeAttemptIntent`, `buildEnvelope`,
  `writeAttemptFiles`, `startSupervisor`, `waitForBinding` (`src/run-supervisor/direct-launch.mjs:51,178,204,256,283,336`),
  `leaseAccountForAttempt`, `renewLeasedLogin` (`assignment-runner.mjs:601,781`), `prepareConfinementForLaunch`,
  `prepareTerminalAttempt` (`src/runner/dispatch/herdr-round.mjs:429`), the `host-write-denied` policy
  (`src/runner/dispatch/confinement/policies.mjs:27`), the supervisor's typed brief delivery, `finalize-home`,
  `cleanup-trust`, `release-slot`, adopt and the lease reclaim.
- Deleted in the same change: the WIP's plain launch (`defaultSeat` with `prepareSeat` and Session Host `start` in
  `src/session-host/head-start.mjs`), the WIP's hook-row change (`agent_hooks.rs`, its vectors, the Node mirror,
  `agent-hooks.v1.json`, `test/setup/agent-hooks.test.mjs`, `.claude/settings.json`), and the uncommitted
  `test/run-supervisor/prepare-seat.test.mjs` addition. None of these is on main. Session Host `start` loses its only
  planned caller: step 7 deletes the op or opens an item.

## Inputs (read first)
- plan.md "Design settled", bullet of 2026-11-18; `docs/platform/run-supervisor/spec.md` sections 3, 4, 5.3, 7;
  `docs/platform/agent-confinement/spec.md` section 9.3; `docs/platform/identity/spec.md` local directory paragraph.
- WIP: `git -C /home/vantt/projects/forgent-worktrees/sec-p12 show ba2bfbb5e` and its report
  `plans/261117-1856-secretary-session-spine/reports/phase-12-head-start.md` (reusable: name and role checks, fronting,
  `placement.json` in the lineage folder, `openingText`, `bindHeadSeat`, the `ports` pattern that loads the runner lazily).

## Files this phase may write
`src/session-host/head-start.mjs`, `src/session-host/head-grants.mjs`, `test/session-host/head-start.test.mjs`,
`src/session-host/client.mjs`, `test/session-host/client.test.mjs`, `packages/session-host/rust/src/route.rs`,
`packages/session-host/rust/src/host.rs`, `packages/session-host/contracts/**`,
`src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch/session-attempt.mjs`, `src/runner/dispatch/herdr-round.mjs`,
`src/runner/dispatch/confinement/policies.mjs`, `src/runner/dispatch/confinement/resources.mjs`,
`test/runner/dispatch-confinement-policies.test.mjs`, `docs/platform/agent-confinement/spec.md`,
`src/run-supervisor/direct-launch.mjs`, `test/run-supervisor/direct-cutover.test.mjs`,
`packages/run-supervisor/contracts/envelope.v3.json`, `packages/run-supervisor/contracts/attempt-intent.v1.json`,
`packages/run-supervisor/contracts/worker-env-allowlist.v1.json`, `packages/run-supervisor/rust/Cargo.toml`,
`packages/run-supervisor/rust/src/supervise.rs`, `packages/run-supervisor/rust/src/supervise/terminal.rs`,
`packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs`, `Cargo.lock`, `docs/architecture-manifest.json`,
`plans/261117-1856-secretary-session-spine/reports/phase-12-head-start.md`.

## Steps
0. Branch from main as `sec/p12a`; cherry-pick only `src/session-host/head-start.mjs` and
   `test/session-host/head-start.test.mjs` from `ba2bfbb5e` (plus the `docs/architecture-manifest.json` row it adds). Do
   not carry its hook-table, settings, census or `prepare-seat` changes.
1. **Envelope `session`.** In `envelope.v3.json` add optional `session {role, verbs, requestSocketPath}` (`verbs` and
   `requestSocketPath` are filled by phase 12b; here `verbs` is `[]` and `requestSocketPath` absent). Rules: only with
   `host: terminal`; steps have no `settle-attempt`; `deadlines.softAt` and `idleMs` are null. In
   `direct-launch.mjs` give `attemptSteps` (`:159`) a `session` flag that drops `settle-attempt`, so the envelope and the
   intent (`writeAttemptIntent`, `:178`; contract `attempt-intent.v1.json`) carry one list, and give `buildEnvelope`
   (`:204`) `session` and `ceilingMs` (used instead of the timeout-based ceiling at `:235`). The ceiling of a head is a
   named constant `HEAD_HARD_CEILING_MS` in `head-start.mjs` (7 days; see open question 2).
2. **Grant table.** `src/session-host/head-grants.mjs`: one frozen table keyed by persona (secretary:
   writes `plans`, `docs/backlog.md`, `docs/discussions`; verbs `['head start']`; every other persona: none) and one
   reader `grantOf(role)` that parses `head:<persona>-<name>` and returns `{writes, verbs}`. Nothing else imports the
   table. The follow-up plan moves the data into `core/config-standard`/`core/config-schema` by changing only the body of
   `grantOf`. Writes are paths relative to the project root; `..`, absolute paths and globs are refused by name.
3. **Writable paths in the sandbox.** Add grant resource `workspace-paths` (`access: read-write`, extra key `paths`) to
   the shape check (`policies.mjs:301`) and to `resolveConfinementResources` (`resources.mjs:465`, next to `workspace`
   at `:565`): one resolved entry per path, each through `canonicalizeAndVerifySubpath` under the project root, a missing
   path refused `workspace-path-missing`, a symlink refused like `workspace`. The bwrap driver already binds any resolved
   resource with write access (`drivers/bwrap.mjs:640-645`), so it needs no change. Add the resource to section 9 of
   `docs/platform/agent-confinement/spec.md` in the same commit (a new grant is a contract).
4. **Launch through the seat door.** Extract from `buildLaunch` (`assignment-runner.mjs:840-1078`) the seat part (resolve
   the executor command, `terminalAgentArgs`, `buildConfinementRequest` plus `prepareConfinementForLaunch`,
   `prepareTerminalAttempt`, `buildEnvelope`, `writeAttemptFiles`) into one exported function that `buildLaunch` calls
   with its own extras (evaluator baseline, effective contract, settle context stay in `buildLaunch`), and split
   `awaitBinding` (`:1080`) so its first half (`startSupervisor` + `waitForBinding`) is callable alone. Export
   `leaseAccountForAttempt` and `renewLeasedLogin` unchanged. New `src/runner/dispatch/session-attempt.mjs` exports
   `launchSessionAttempt({ binding, key, persona, name, role, grant, opening, projectRoot, beside, display })`: attempt dir
   `.fgos/assignments/<key>/runs/01`, `acquireAttemptLocks` read-only (no dispatch-cwd lease), intent, lease, the
   requirement `host-write-denied` plus `{resource: 'workspace-paths', paths: grant.writes}` when non-empty, launch env
   `FGOS_HEAD_ROLE`, `FGOS_HEAD_GEN` (add both to `worker-env-allowlist.v1.json` if the authority filters them), the
   seat function of this step with `session`, then the first half of `awaitBinding`; returns
   `{ placement: {host: 'terminal', key}, runDir }` once bound and never waits for a result. On a refusal before the
   handover it gives back what it took through the same `closeAttempt` rules (`:1164`). `prepareTerminalAttempt` gets
   two inputs: `opening: 'verbatim'` (the brief file is the opening text, not `renderBrief`, `herdr-round.mjs:472`) and
   `display`/`beside` passed to `openAsync` (`:511,527`).
5. **Supervisor session mode** (`terminal.rs`). Read `session` in `Plan::from` (`:90`). After `BRIEF_DELIVERED`
   (`drive`, `:877`), when `session` is present, loop on `io.pause` until `finished()` and do not call `detect_completed`
   or the unreadable-result wait (`:930-950`). After the AGENT frame, register the session in Identity through
   `register_writer(state_root, Some(cwd), WriterKey{source: "FGOS_SESSION_ID", value: writerId}, gate host tuple,
   [role], false)`; a `role-held` refusal registers without the role (a rotation successor; phase 14 moves the role);
   any other refusal is one `supervisor.log` line and the attempt goes on. Enable the `directory` feature in
   `packages/run-supervisor/rust/Cargo.toml`.
6. **Use case.** In `head-start.mjs` replace `defaultSeat` and the `host.start` call with the port
   `ports.launch ?? launchSessionAttempt` (loaded lazily, as the WIP loads the runner); pass `grantOf(role)`, the
   opening, `display {id: name, title: persona}`, `beside`. Keep refusals, fronting, `placement.json`, `gen`. Remove
   `hostKind` (a head is always a terminal attempt).
7. **Session Host `start`.** `rg -n "\.start\(" src/session-host src/session-rotation src/runner` and
   `rg -n "SessionHost.*start\(|\.start\(&" packages` outside tests. If nothing calls it, delete the op from
   `packages/session-host/rust/src/route.rs:17,56`, `host.rs:70` and its contract, `src/session-host/client.mjs:127,194`,
   and their test cases; keep any delivery code the supervisor still uses. If a caller remains, open a backlog item
   with `fgos identity mint backlog` and name it in the report. Either way write the port-contract delta into the phase
   report for phase 14 to fold into `docs/platform/session-host/spec.md`.
8. **Proofs** (one owner each, design principle 8):
   - use case: `test/session-host/head-start.test.mjs` (fake ports): launches through the launch port with role, grant
     and verbatim opening; fronts a live role instead of a second launch; refuses bad names and a held rotation lock.
   - envelope shape and step list: extend the envelope case of `test/run-supervisor/direct-cutover.test.mjs` (session
     envelope has no `settle-attempt`, null soft and idle, the given ceiling; intent has the same steps).
   - writable paths: extend `test/runner/dispatch-confinement-policies.test.mjs` (shape) and the resolver case it already
     drives (one bind per path, `..` and missing refused).
   - supervisor session mode and registration: one case in
     `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs` (a blocked screen after delivery does not end
     a session attempt; the role is registered; closing the pane ends it `carrier-lost` and runs `finalize-home`).
   - The extraction in step 4 is a move: the existing `executeAssignment` terminal tests stay the proof of the worker path.

## Verify
- `node scripts/run-tests.mjs test/session-host/head-start.test.mjs test/run-supervisor/direct-cutover.test.mjs test/runner/dispatch-confinement-policies.test.mjs test/run-supervisor/terminal-cutover.test.mjs test/runner/assignment.test.mjs test/session-host/client.test.mjs test/architecture.test.mjs`;
  read every ERROR line and the fail count, not only the exit code.
- `cargo test -p fgos-run-supervisor -p fgos-session-host`; `cargo clippy -p fgos-run-supervisor -p fgos-session-host -- -D warnings`;
  `cargo check -p fgos-run-supervisor --target aarch64-apple-darwin` (CARGO_TARGET_DIR off `/tmp`).
- Live, through the working tree (`npm run fgos:dev`, or `FGOS_HOST_BIN` set to the freshly built host), on this machine,
  recorded in the report: start `planner` / `probe` through `startHeadSession` (`node -e` as in the WIP report); expect a
  herdr tab, the opening typed visibly, `fgos identity resolve head:planner-probe` live, `ls .fgos/assignments/head-planner-probe-1/runs/01/`
  showing `supervisor-binding.json`; inside the pane `echo $FGOS_CONFINED` prints `1` and `ls $XDG_RUNTIME_DIR` shows no
  herdr socket. Then start `secretary` / `probe` and check that touching `plans/x-probe.md` works and touching `src/x` is
  refused. Close both panes; expect `receipt.json` `carrier-lost`, `steps/finalize-home.json`, `closed.json`, and the
  role resolving `not-found`. Delete the probe files.
- `fgos dispatch inspect` and `fgos doctor` do not report the closed head attempts as stuck (they live in the assignments
  layout without `assignment.json`).

## Risks
1. **Long-lived login copy (High x Medium).** A head runs for hours; a claude or xai login renewed inside its private home
   is only staged, never applied, and a rotating refresh token used inside the home can invalidate the source for other
   seats of the same account. Mitigation in this phase: none in code; the live check records the account and CLI the
   head bound to, and the report states the exposure. Owner question 1.
2. **Assignments layout without an assignment (Medium x Medium).** Readers of `.fgos/assignments/**` may expect
   `assignment.json` or a run control. Mitigation: the verify step reads `dispatch inspect`, doctor and `sweepAttempts`
   (`src/run-supervisor/client.mjs`) on a closed head; a reader that refuses is fixed to skip a `session` envelope by
   name, inside this phase's footprint, or the phase stops `NEEDS_CONTEXT`.
3. **Bind of a single file (`docs/backlog.md`, Medium x Low).** A tool that saves by rename onto a bind-mounted file gets
   `EBUSY`/`EXDEV`. Mitigation: the live check edits `docs/backlog.md` from the secretary pane with the CLI's own edit
   tool; if it fails, report it (the backlog row verb of the follow-up plan is the real fix) rather than widening the grant.
4. **Extraction from `buildLaunch` (Medium x High: every terminal and direct worker passes through it).** Mitigation: a
   pure move, its existing tests unchanged and green, GitNexus impact on `buildLaunch`/`awaitBinding` reported before editing.
5. **Identity registration from the supervisor (Low x Medium).** A refused registration leaves a head unfrontable
   (`placement-unknown` path stays). Mitigation: the refusal is logged and the live check reads `identity resolve`.

## Open questions
1. Owner: may a head hold a leased account for hours, given risk 1? Options: (a) accept, rotation keeps sessions short
   and `fgos doctor credential-copies-retained` names staged copies; (b) heads bind only executors whose renewed login
   is applied automatically (account-signed tokens, codex); (c) a dedicated account per head persona. Recommendation (a)
   for this plan, (c) in the grant follow-up.
2. `HEAD_HARD_CEILING_MS` (7 days) is a constant until the grant follow-up gives it a config key in
   `core/config-standard`; the gate kills a head at that instant whatever it is doing.

## Rollback
Revert the phase commit(s). The extraction is a move, so a revert restores `buildLaunch` byte for byte; heads started
before the revert keep running under their own supervisor and close through adopt (their envelopes carry their steps).
