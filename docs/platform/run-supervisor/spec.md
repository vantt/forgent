# Run Supervisor Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the one process per attempt that owns a launched agent after the controller handed it over, the launch gate that is the process root of the agent, the receipts, the post-receipt steps and the adopt door
Design status: Accepted
Implementation status: In progress (direct mode: contracts, crate, containment drivers, routes, Node steps and reaper call sites landed; the controller cutover and the doctor checks land in later phases of the plan; terminal mode is plan 6.3)
Canonical: Yes
Owner: Run supervisor component (L4)
Source: packages/run-supervisor/rust (crate fgos-run-supervisor), src/run-supervisor/ (Node client, steps)
Contracts: packages/run-supervisor/contracts/
Last reviewed: 2026-10-18
Related:
- docs/platform/process/spec.md
- docs/platform/holder-lock/spec.md
- docs/platform/agent-protocol/spec.md
- docs/platform/component-boundary.md
- docs/specs/runner.md
- docs/specs/distribution.md
- plans/261016-1351-run-supervisor-rust-core-direct-mode/plan.md
- plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md
```

## 1. Purpose

A run supervisor is one Rust process per attempt. It owns the attempt after the controller (the Node process that ran `fgos run`) handed it over, so a controller that dies, hangs or is killed no longer loses the result of a CLI agent. The agent keeps running, its result is settled, its credential is written back and its home is cleaned, with no one resuming it.

Two roles, one contract set:

| Role | Process | Does |
|---|---|---|
| Supervisor | `fgos internal supervise` | Holds the attempt lock and the cwd lease, creates the containment domain, starts the gate, watches deadlines, publishes the receipt, runs the steps |
| Gate | `fgos internal gate` | Is the process root of the agent inside the domain (pid 1 of a fresh PID namespace on Linux), owns the agent's IO, enforces the hard ceiling, ends the domain when the agent is gone, publishes `gate-exit.json` |

Adopt (`fgos internal adopt`, section 8) is the third entry point: it settles an attempt whose supervisor is gone.

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| Envelope v3 and its digest ([contract](../../../packages/run-supervisor/contracts/envelope.v3.json)) | Which executor, model or argv runs (Execution Core `bind()` and `resolveExecutorCommand`; the argv is written into the envelope) |
| The layout of an attempt directory and the one-time publication of its files (section 3) | Judging the work (Run Result Evaluator inside the `settle-attempt` step) |
| Binding, GO, gate-exit, stop and cancel requests, receipt, step receipts, closed marker | Retry, fallback or the next attempt (controller) |
| The post-receipt step runner (section 7) | What a step does (the Node payload defines `settle-attempt`, `finalize-home`) |
| The adopt door and its recovery matrix (section 8) | The attempt lock primitive (holder-lock) and the containment port (process control) |
| Deadlines: soft and idle by the supervisor, hard ceiling by the gate | Panes, tabs, terminals (plan 6.3; the supervisor never knows a pane) |
| The four internal routes and their protocol (section 10) | Any verb a person calls |

Layering: the gate and supervisor are L4. They use the containment port and facts of `fgos-process` (L0), the attempt lock and predecessor record of `fgos-holder-lock` (L1) and the adapters of `fgos-agent-protocol` (L3). Nothing below knows an attempt. The component-boundary entries are in [component-boundary.md](../component-boundary.md#4-current-high-level-components).

The `BoundInvocationSupervisor` of `packages/host-runtime` is a different thing: a short RPC call bound to its caller's lifetime. It stays separate; only L0 primitives are shared.

## 3. Attempt directory and publication

Layout (all names from the envelope contract; `<attemptDir>` is `<assignmentDir>/runs/<NN>`):

| File | Written by | When |
|---|---|---|
| `attempt.lock` (+ `.predecessor.json`) | controller creates, supervisor declares the domain | Registry row `attempt`, rank 15, kind lease |
| `envelope.json` | controller, once | After the locks are held, before any agent process exists |
| `protected/attempt-secrets.json` (0600, dir 0700) | controller | Secret env and run-control token; never copied elsewhere |
| `supervisor-binding.json` | supervisor | After the gate runs inside the domain, before GO |
| `gate-exit.json` | gate | After the agent exited and the domain was emptied. Inside a sandbox with a read-only root the controller leaves an empty `gate-exit.json` bound writable (as the two capture files) and the gate fills it in place, never through a symlink; no process of the agent exists then, so the gate has the last word |
| `stop-requested.json` | supervisor | Before SIGTERM to the gate |
| `cancel-requested.json` | anyone allowed to cancel | Polled by the supervisor |
| `receipt.json` | supervisor, or adopt | After the gate is gone |
| `steps/<stepId>.json` | step runner | Only after the step exited 0 |
| `closed.json` | supervisor, or adopt | When every step has a receipt |
| `adopting.json` | adopter | While it holds the lock |
| `start-refused.json` | supervisor | Only when it ends before binding: `{attemptId, code, why}` (`lock-held`, `lock-unavailable`, `envelope-invalid`, `host-version-mismatch`, `internal`). Adopt shows the `code` |
| `supervisor.log` | supervisor stdout and stderr | Free text, never parsed |

The supervisor also writes `agent-binding.json` (the agent's tuple from the gate's AGENT frame) and `supervisor-heartbeat.json` (display only, every 5 s). Neither is in the layout contract; nothing decides from them.

**Publication rule.** Every file except `supervisor.log` is written to a temp file in the same directory, fsynced, then hard-linked to its final name. `EEXIST` means another writer already published it: read that one, never overwrite. `adopting.json` is the one exception: it describes only the current holder and is replaced by temp file and rename.

**Digest.** `envelope.digest` is `sha256:` plus the hex sha256 of the canonical JSON of the envelope without the `digest` key (keys sorted by UTF-16 order, integers only, no whitespace). Node (`canonicalJson` in `src/runner/dispatch/proof-helpers.mjs`) and Rust (`fgos_run_supervisor::envelope::digest`) reproduce the shared [vector file](../../../packages/run-supervisor/contracts/vectors/envelope-digest.v1.json) byte for byte. A reader finding `v != 3` or a wrong digest treats the run as `legacy-run` (adopt) or refuses with `envelope-invalid` (supervise, gate, attempt-step).

The envelope is immutable and carries no secret. It names: `attemptId`, `unitRunId`, `runDir`, `mode` (`direct`; `terminal` is plan 6.3), `protocolId` 1, `hostBin` and `payloadRoot` of the release that wrote it (resolved once, never through PATH or a shim), `cwd`, `mutation`, `launch` (command, args, non-secret env, `stdinPolicy`, `briefPath`, `outboxDir`, capture paths), `containment.preferred` and `bwrapPrefix`, `deadlines`, `agentProtocol.cli`, and the `steps`. A `createdAt {bootId, boottimeNs}` field lets Windows adopt give an unbound attempt a 60 s start grace on the same boot; file times are never used.

## 4. Handover: controller to supervisor

1. Mint the attempt id, create the run directory, acquire the attempt lock and, for a mutating attempt, the dispatch-cwd lease, in one `LockScope` (rank 15 then 30). A read-only attempt takes no cwd lease. Refused: the attempt does not start.
2. Prepare: bind, `confinement.prepare` (home marker v2 carries the attempt id), write the envelope and the side file.
3. Spawn `$hostBin internal supervise --envelope <path> --protocol 1` with the attempt lock at fd 3 and the lease at fd 4, `setsid`, stdio to files, **no IPC channel and no pipe**. (Windows: a `LockFileEx` lock is never inherited, so the controller lets go and the supervisor takes the lock itself; the envelope names `cwdLeaseFile`.)
4. Wait for `supervisor-binding.json`. A wait that ends without it is `launch-unknown`, never `not-started`: the attempt stays for adopt, which concludes only when the lock is free and the domain is empty.
5. The controller closes its lock fds on seeing the binding and in `finally` of every exit path. A hung controller that kept them would be a live holder and adopt would report `running` for ever. From then on it only reads files.

No child process starts inside the hot state mutex (`exec-under-hot-lock`): the host binary is resolved and the envelope built before any `withStateTx`.

**Controller implementation** (`src/run-supervisor/direct-launch.mjs`, called from `executeAssignment`). The sandbox's root is read-only, so the controller creates the capture files and `gate-exit.json` empty before the prepare and asks the sandbox driver to bind exactly those files writable (`attemptBinds`); the outbox is the one writable directory. The sandbox program leads `containment.bwrapPrefix` (the driver's prefix carries only its arguments). `spawnWithLocks` (holder-lock facade) hands the lock descriptions to the supervisor at 3 and 4; no other descriptor of the controller reaches it. After the result appears the controller still waits for `closed.json` (bounded) so the next dispatch never meets a step in flight; a supervisor that is gone while the agent lives is waited for through the adopt door. `controller/settle-context.json` carries what only the controller knows (effective policy, provider account evidence, fallback, stray-write baseline of the main checkout) to the settle step; `assignment.json` in the attempt directory is the effective assignment. A `supervise` for an attempt that already has a `supervisor-binding.json` or a `receipt.json` refuses with exit 71 `attempt-already-bound` before it touches any lock: its predecessor rule would otherwise end the live domain. The envelope's `deadlines.killWaitMs` (config `lock.predecessorKillWaitMs`) is the bound `kill_all` waits for an empty domain.

The controller does not settle while a supervisor lives. The controller reads receipts from files; it holds no handle to the supervisor.

## 5. Supervisor and gate

**Supervisor sequence.** Set `FD_CLOEXEC` on fd 3 and 4 before any other syscall; read and verify the envelope (digest, `hostBin` equals the running binary, else `host-version-mismatch`); `containment.create`; declare the domain in `attempt.lock.predecessor.json` (and on the cwd lease file) before the domain has a process; start the gate in the domain with fd map `{3 attempt, 4 cwd, 5 GO end}`; publish the binding `{supervisor, gate host tuple, domain, guarantee}`; wait for HELLO (15 s limit); send GO; watch.

**Watch** (50 ms tick): new bytes of the stdout and stderr captures, judged by the agent-protocol adapter, feed the idle timer; cancel request; soft deadline; idle. On a stop cause the supervisor publishes `stop-requested.json {cause: soft-deadline|idle|cancel}` first, then sends STOP and SIGTERM to the gate. A gate that outlives `gateKillGraceMs` plus 5 s has its whole domain ended by `kill_all`. When the gate is gone the supervisor makes sure the domain is empty, **releases the cwd lease at once** (the next round of the controller need not wait for the steps), publishes the receipt, runs the steps, publishes `closed.json` and exits 0 with `{result: closed|open, outcome, pendingStep?}`.

**Gate sequence.** Set `FD_CLOEXEC` on lock fds and the GO fd; verify the envelope; send HELLO; wait for GO. EOF or refusal before GO: exit 64 without running the agent and without `gate-exit.json`. GO carries `attemptId`, `envelopeDigest` and the gate's host tuple; a mismatch against the gate's own envelope exits 65. The gate then opens the capture files (`dup2` to fd 1 and 2) and stdin per `launch.stdinPolicy` (`brief-file` or null), spawns the agent with env `launch.env` plus the side file env and `FGOS_PIDNS_ANCHOR`, sends AGENT, and waits.

| Event at the gate | Result |
|---|---|
| Agent exits | `kill(-1, SIGKILL)` for the rest of the domain, `waitpid(-1)` until `ECHILD`, then `gate-exit.json {exitCode, signal, stoppedBy: agent}`; the lock is held until the namespace is empty |
| SIGTERM or SIGINT | The gate is pid 1 and installs handlers (pid 1 ignores a signal without one). Forward SIGTERM to the agent group; SIGKILL after `gateKillGraceMs`. `stoppedBy` and `cause` come from `stop-requested.json`; the signal without the file is `cancel` with cause `signal` |
| Hard ceiling | The envelope's absolute `CLOCK_BOOTTIME` instant (with its boot id; a later start never extends it): SIGTERM, `gateKillGraceMs`, SIGKILL; `stoppedBy: hard-ceiling` |
| Supervisor dies after GO | Nothing: the agent keeps running (section 9) |

The gate keeps `waitpid(-1)` running for the whole attempt to reap every orphan the namespace adopts, not only at the end. In direct mode the gate has no `PDEATHSIG` and bwrap has no `--die-with-parent`; either would turn a supervisor death into an agent death. The gate owns the agent's IO, so the agent never sees `EPIPE` when the supervisor goes.

Soft deadline and idle are the supervisor's; the hard ceiling is the gate's and is the safety stop when the supervisor is dead. Deadlines are absolute (`CLOCK_BOOTTIME` plus boot id; on Windows `GetTickCount64` milliseconds times 1e6 with no boot id); another boot means every process of the attempt is already dead.

### 5.1 The GO channel

[Contract](../../../packages/run-supervisor/contracts/gate-go.v1.json). Frames are a 4-byte big-endian length then one UTF-8 JSON object, at most 65536 bytes; an oversize or invalid frame is treated like EOF. Frames: `HELLO` (gate to supervisor), `GO`, `AGENT {tuple}` (gate to supervisor), `STOP {cause}` (advisory duplicate of `stop-requested.json`), `BRIEF_DELIVERED` (terminal mode only; a direct gate ignores it). Direct mode uses an inherited socketpair end, so there is nothing to authenticate. Terminal mode will use a unix socket and check the peer uid with `SO_PEERCRED`, never the pid (a peer in another PID namespace reads pid 0). On Windows the channel is a named pipe (`--go-socket`).

### 5.2 Containment drivers

The supervisor calls the containment port ([process spec, section 9](../process/spec.md#10-containment-port)); the driver is chosen from `envelope.containment.preferred` and the machine.

| Platform | Driver | Gate role |
|---|---|---|
| Linux | `bwrap-pidns` | `bwrap --unshare-pid --as-pid-1 --proc /proc ... -- fgos internal gate`; the gate is pid 1 of the namespace. Empty is `judge(gate host tuple) == dead` |
| Linux without user namespaces | `linux-pgroup` | Best-effort process group; the level is reported |
| Windows | `windows-job` | The gate is a suspended member of the attempt's named job; no signals (stop is polled from `stop-requested.json` every 20 ms); the agent runs in a nested kill-on-close job so ending it never ends the gate |
| macOS | `macos-tree` | No pid 1 and no subreaper; the gate kills the agent's group and tree, best-effort |

The binding records `guarantee.containment` (`kernel` or `best-effort`) and `guarantee.lock` for the attempt.

## 6. Receipt

[Contract](../../../packages/run-supervisor/contracts/receipt.v1.json). The receipt is the physical result, published once. It is not the work result.

| Outcome | When |
|---|---|
| `exited` | `gate-exit.stoppedBy == agent`; also an `orphan` stop with an outbox result |
| `timeout` | `stoppedBy` is `soft-deadline`, `idle` or `hard-ceiling` |
| `cancelled` | `stoppedBy == cancel` |
| `gate-lost` | A binding exists but there is no `gate-exit.json` (the lock being free proves the domain empty) |
| `abandoned-not-started` | No binding; adopt found the lock free |
| `carrier-lost` | Terminal mode only (plan 6.3) |

Fields: `outcome`, the `gateExit` object when present, `captureDigests {stdout, stderr}` (`sha256:` of the file bytes or null), `outboxPresent`, `synthesizedBy` (`supervisor` or `adopt`), `publishedAt`. **An outbox result wins:** it is settled whatever the outcome (hard ceiling, orphan branch); the Run Result Evaluator still judges it.

## 7. Steps

[Contract](../../../packages/run-supervisor/contracts/step-receipt.v1.json). After the receipt the supervisor runs the envelope's `steps` in order, each as a child process.

| Step | Owner | Does |
|---|---|---|
| `settle-attempt` | Node payload, Execution Core door | Run Result Evaluator, `exit.json`, `evidence.json`, `result.json`, `settleRunControl` (CAS) through `commitRunSettlement`, using the token in the side file; never a new epoch while that token exists |
| `finalize-home` | Node payload, confinement door | Write the credential back, then clean the home, for every kind of end (this changes the old contract that kept the home unless the end was `exited` or `spawn-failed`). Returns `retry` (`credential-home-kept`) while the credential cannot be written back |
| `release-slot` | Plan 6.3 | Terminal-control release; not in a direct envelope |

Each step runs as `<hostBin> internal attempt-step <stepId> --protocol 1 --run-dir <attemptDir>`; the host execs the Node payload of the **same release** (`envelope.payloadRoot`, which may have been deactivated by then) at `src/run-supervisor/attempt-step.mjs`, never through `bin/fgos.mjs`. The step gets stdin `/dev/null`, exactly the env the envelope names (`FGOS_STATE_ROOT`, the project root; no secrets), stderr appended to `supervisor.log`, and **no lock description**: the supervisor keeps holding the lock while it waits, because a step that inherited it would be one more live holder and one more leak surface.

Its stdout is one JSON line: `{result: done, detail}`, `{result: retry, reason}` (exit 75) or `{result: error, code}`. Only after exit 0 and `done` does the runner publish `steps/<stepId>.json`. No receipt means run again; every step is idempotent. A step that times out (`stepTimeoutMs`) has its process group killed and no receipt. A missing receipt stops the chain and leaves the attempt open for adopt. Exit codes of the route: 0 done, 65 envelope-invalid, 66 payload-missing, 70 error, 75 retry.

`closed.json` is published when every step has a receipt; scans skip closed attempts.

## 8. Adopt

One door for resume, recover, scan and cleanup: `fgos internal adopt --protocol 1 (--run-dir <attemptDir> | --scan) [--probe-only] [--kill-wait-ms N]`. The Node client is `src/run-supervisor/client.mjs`; `sweepAttempts` (`sweep.mjs`) is the single sweep that the four old reaper call sites now use, followed by the reaper for markers it does not own (herdr homes of marker v1, until plan 6.3). The scan reads one attempt directory per stdin line and answers one JSON line per directory in order.

Decision order for one attempt directory:

1. `closed.json` present: `closed`, no lock opened.
2. No `attempt.lock`, or no envelope with `v == 3`: `legacy-run` (left to plan 6.4).
3. Probe the lock with a shared, non-blocking try (two scans never block each other). Held: `being-adopted` when `adopting.json` exists, else `running`.
4. Lock free but unbound with an envelope younger than the Windows start grace: `running` (reason `starting`). A `start-refused.json` of this attempt ends the grace: the supervisor said it will never bind (on Windows a supervisor that cannot take the attempt lock exits 70 `lock-held`), so the attempt is judged at once and carries the reason `start-refused:<code>` in the adopt answer, in `receipt.json` (`reason`) and in the doctor message, not only in `supervisor.log`.
5. Lock free is not enough: ask the containment domain recorded in the binding (or, with no binding, the declared predecessor record) whether it is empty; `unknown` counts as not empty. `--probe-only` stops here (`needs-adopt` or `running` with reason `domain-not-empty`) and writes nothing. A scan adopts only what is already empty; `--run-dir` may wait out a domain for up to `--kill-wait-ms` (default `lock.predecessorKillWaitMs`, 2000).
6. Take the lock exclusively (the holder-lock predecessor rule ends a leftover domain), write `adopting.json`, run the matrix, run the steps, publish `closed.json`, remove `adopting.json`.

**Recovery matrix** (every row idempotent; the step runner is the supervisor's own):

| State on disk | Adopt does |
|---|---|
| No binding, no receipt | Receipt `abandoned-not-started`, then all steps |
| Binding, no `gate-exit`, no receipt (supervisor and gate killed, power loss, reboot) | Lock free proves the domain empty: synthesize receipt `gate-lost` (with the outbox if any) |
| `gate-exit` present, no receipt | Publish the receipt from `gate-exit` and the outbox |
| Receipt present, run control `settled`, no `result.json` | Existing recovery: `commitRunSettlement` accepts a settle by the old token in the side file; no new epoch |
| Receipt present, not settled | Settle with the attempt's token from the side file; a new epoch only when the side file is lost and the recorded holder is dead |
| `result.json` present, no `finalize-home` receipt | Run `finalize-home` (the result proves the work, not the cleanup) |
| Every step has a receipt | Publish `closed.json` |

Outcomes: `adopted` (this call drove the attempt to `closed`), `open` (a step returned retry or failed; the attempt stays, `pendingStep` names it), `held` (lock free but the declared domain could not be emptied: reason `predecessor-domain-not-empty`, nothing done). Two adopters are serialized by the kernel lock; exactly-once of side effects rests on step receipts, the settlement CAS and credential staging, never on the lock. Never a second agent for the same work.

Home cleanup has one rule: a home belongs to an attempt (marker v2 `{attemptId, runDir, dispatchId, resource, createdAt}`, no pid, no pane); only `finalize-home` run under the attempt lock with an empty domain removes it ([contract](../../../packages/run-supervisor/contracts/home-marker.v2.json)). Marker v1 homes with a `paneId` keep the old reaper until plan 6.3.

## 9. Policy: supervisor dies, agent keeps running, adopt settles it

When the supervisor dies the agent runs on until it exits, until the hard ceiling, or (terminal mode) the orphan branch. Exclusion stays correct because the gate still holds the attempt lock and the cwd lease, and the domain stays provable because the gate is pid 1. The alternative (the gate kills the agent when the supervisor dies) would discard work the model already did. Adopt then settles the attempt from `gate-exit.json` and the outbox. The same holds when the controller dies: the supervisor, not the controller, owns the result.

## 10. Routes

All four routes are exec'd by the host (`main.rs`, the earliest branch of `internal`), absent from help and from `command-routes.json`, called only by the payload of the same release. [Contract](../../../packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json).

| Route | Argv | Exit codes |
|---|---|---|
| `fgos internal supervise` | `--envelope <path> --protocol 1` | 0 finished, 2 usage, 3 `host-version-mismatch`, 65 `envelope-invalid`, 70 internal |
| `fgos internal gate` | `--protocol 1 --envelope <path> (--go-fd N \| --go-socket <path>) [--lock-fds 3,4] [--job-name <name>]` | 0 `gate-exit.json` published, 64 no GO (agent never started), 65 envelope or GO mismatch, 70 internal |
| `fgos internal adopt` | `--protocol 1 (--run-dir <dir> \| --scan) [--probe-only] [--kill-wait-ms N]` | 0, 2, 3, 70 |
| `fgos internal attempt-step` | `<stepId> --protocol 1 --run-dir <dir>` | 0 done, 65, 66 `payload-missing`, 70, 75 retry |

Common rules: `--protocol 1` is required on every route; absent or different gives exit 3 with stdout `{"v":1,"protocol":1,"result":"error","code":"host-version-mismatch"}` (one release, one protocol; fail closed). Flags are `--name value`. stdout is one JSON object per line with `v:1` and `protocol:1`; stderr is free text and never parsed.

**`--probe`.** Each route also accepts `--protocol 1 --probe`: it checks that the route exists in this binary, does nothing else (no envelope read, no file touched, no lock) and answers `{"v":1,"protocol":1,"result":"ok","route":"<name>","containment":{...}}`, where `containment` is the guarantee the machine would give (driver, level, escapes). The doctor check `run-supervisor-route` calls it for each route; `process-containment` reads the same `containment` field.

## 11. Error model

Who dies, and what each of the others does ([design r6, section 10](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md)):

| Who dies | Attempt lock | Agent | Deadline | Receipt and settle | Home | Cleanup |
|---|---|---|---|---|---|---|
| Controller before spawning the supervisor | Released (the controller was the only holder) | Never ran | none | Adopt: `abandoned-not-started` | Adopt finalizes | Adopt |
| Controller after the binding | Held (supervisor and gate) | Keeps running | Supervisor | Supervisor and its steps | Kept until `finalize-home` | Nobody needs to act |
| Supervisor | Held (gate) | Runs to its end (the gate holds the IO); terminal mode: orphan branch | Gate's hard ceiling (SIGTERM, grace, SIGKILL) | Adopt from `gate-exit` and the outbox (outbox wins) | Kept until adopt | Adopt |
| Gate | Held (supervisor) | Linux: pid 1 died, the kernel kills the namespace; Windows: the job still has the supervisor's handle, the agent lives until the supervisor stops it; macOS: best-effort | none | Supervisor: `gate-lost` | Supervisor finalizes | Supervisor |
| Agent | Held until the gate exits | none | none | Normal | `finalize-home` | Supervisor |
| Supervisor and gate (for example `kill -9` of the group) | Released; the domain is already empty when it is | Dies with the namespace | none | Adopt by the matrix (from the outbox if the agent wrote one) | Adopt finalizes | Adopt |
| herdr server | Held | Lost with the pty | none | Supervisor: `carrier-lost` (terminal mode, plan 6.3) | Finalize | Supervisor |
| Reboot | Released by the kernel | Dies | none | Adopt on the next `fgos run` | Finalize | Adopt |
| Clock jump | Unaffected (kernel) | none | Absolute `CLOCK_BOOTTIME` plus boot id | none | none | none |
| A step dies midway | Held until the supervisor exits | none | none | Missing step receipt: adopt runs that step again | By the matrix | Adopt |

When the gate is SIGKILLed the kernel closes its fds before it finishes killing the namespace, so for a moment the lock reads free while the namespace is not yet empty. That is why adopt asks the containment port, not only the lock, and why `unknown` is never empty.

## 12. Boundary

- A process created outside the domain on the agent's request (a daemon reached through a socket of herdr, systemd, docker; a launchd or COM service) is not killed with the attempt. That is outside the guarantee, like raw git outside fgOS. An attempt with a sandbox sees only the host sockets confinement grants explicitly.
- The supervisor knows no pane and no terminal. Terminal mode (`terminal-control.launch`, `--die-with-parent`, the BRIEF_DELIVERED and orphan branch, `release-slot`, `carrier-lost`) is plan 6.3.
- Every route knows only `--protocol 1`. A release older than the payload that calls it refuses with `host-version-mismatch`.
- The agent's argv, stdin policy and model come from the executor configuration through the envelope; this component does not choose them.

## 13. Runtime socket directory

`$XDG_RUNTIME_DIR/fgos` when `XDG_RUNTIME_DIR` is an absolute path, else `/tmp/fgos-<uid>`; mode 0700, owned by the user. `src/run-supervisor/runtime-dir.mjs` resolves and checks it and refuses a directory that is not a real directory, is owned by another uid, allows group or other access, or leaves no room for a hashed socket name within 100 bytes (`sun_path` holds about 107). Direct mode does not need it (the GO channel is an inherited socketpair); terminal mode puts the attempt socket there under a hashed name. Setup creates it and doctor checks it, so the 6.3 path does not arrive with an unchecked directory. The bwrap driver binds it into the sandbox for terminal mode.

## 14. Setup and doctor

Config key `dispatch.gateKillGraceMs` (milliseconds, default 10000): the SIGTERM to SIGKILL grace used by the gate, by the hard ceiling and by `kill_all`; the controller copies it into `envelope.deadlines.gateKillGraceMs`. Project overrides global. The key is read through the project-over-global merge (`src/run-supervisor/gate-kill-grace.mjs`) with the default when absent; setup registers no config default for it, because a registered default would be written into the global `~/.fgos/config.json` before every workspace on the machine has activated a release that knows it (the lesson of 2026-10-13). Doctor refuses a value below 1000.

`fgos setup` creates the runtime socket directory (0700) when missing; it runs the registered fixes, so the `runtime-socket-dir` fix is the setup step.

Doctor checks (registered in `src/setup/registrations.mjs`; levels follow the doctor convention: `passed: false` fails, a `warning:` prefix warns):

| Check | Does | Result |
|---|---|---|
| `process-containment` | Prints the driver the machine would pick, its level (`kernel` or `best-effort`) and the named escapes, from the route's `--probe` answer | `kernel` passes; `best-effort` warns on Linux (no bwrap user namespace, `linux-pgroup` runs) and is informational elsewhere; no driver fails |
| `runtime-socket-dir` | The directory exists, mode 0700, owned by the uid; fix creates it | Missing warns (setup creates it); not a directory, another owner or a loose mode fails; fix creates or tightens to 0700 and leaves a non-directory alone |
| `run-attempts-stuck` | Runs with an envelope v3 and no `closed.json` whose lock is free (`adopt --scan --probe-only`; writes nothing) | Fails naming each attempt with its reason (for example `start-refused:lock-held`); a held lock is a running attempt, not a finding; fix runs `sweepAttempts` |
| `run-supervisor-route` | The host binary answers `--protocol 1 --probe` with `result: ok` for `supervise`, `gate`, `adopt`, `attempt-step` | Any route missing or a protocol mismatch fails by name |
| `gate-kill-grace` | Prints `dispatch.gateKillGraceMs` and its source (`project`, `global`, `default`) | Below 1000 or not an integer fails; absent passes with 10000 |

The check for orphaned confinement resources skips attempt homes (marker version 2: they belong to adopt) and its fix calls `sweepAttempts` instead of the reaper directly; the fix never removes a version 2 home.

**`lock-holders` (N1).** The holder-lock check ([holder-lock spec, section 13](../holder-lock/spec.md#13-setup-doctor-and-activation)) treats a bwrap monitor process whose parent is the supervisor or the gate of an attempt that holds the lock as a member, not a stranger. Without that rule every running attempt would warn, because the monitor sits between the supervisor and the namespace and holds a copy of the lock description.

## 15. Known limits

- `fgos internal lock-scan` is in the route contract, but no such route exists in the crate: the scan of lock files is `adopt --scan` itself (a shared, non-blocking probe per attempt in one process).
- Windows adopt of an unbound attempt relies on the 60 s start grace measured from `createdAt`; an envelope without it gets no grace.
- `best-effort` containment (macOS, Linux without user namespaces) cannot prove no writer remains when the lock is free; adopt waits and rescans, and the attempt records the level.
- A host with no release manifest next to it (a raw `FGOS_HOST_BIN`, development) has no payload to check against: the payload that started the controller is the one the envelope names and the step accepts it only when its own root is that one. A release host is held to its manifest.
- A step whose payload release was removed from disk returns `payload-missing` and stays for adopt to retry; the store of releases is immutable after deactivation, so this is a manual-removal case only.

## 16. Lịch sử quyết định

- **2026-10-16 — Hai cách khởi động, một cổng chứa process, gate là gốc process của agent.** Supervisor Node cầm pipe và kênh IPC chết cùng controller; thay bằng supervisor Rust không pipe, không IPC, gate pid 1 của PID namespace, chính sách "supervisor chết → agent chạy tiếp". Design r6 §9.1-9.3. Chi tiết quyết định thay `detached-run-supervisor` ở [runner.md](../../specs/runner.md).
- **2026-10-16 — Kongming M1-M3, N1-N8.** `--die-with-parent` chỉ ở terminal; `--as-pid-1` và handler SIGTERM/SIGINT ở gate; GO mang `attemptId` và digest, không so pid; bước sau receipt không nhận fd lock; rỗng ⇔ `judge(gate) == dead`; `lock-holders` coi monitor bwrap là thành viên.
- **2026-10-16 — D4: argv không dựng ở Rust.** Agent-protocol `direct` đọc cấu hình executor đã dựng argv vào envelope; chuyển binder ProviderAdapter sang Rust là việc riêng. Xem [agent-protocol](../agent-protocol/spec.md).
- **2026-10-17 — D6: miền Windows thuộc 4.4b.** Supervisor chỉ gọi `create_kill_job`, `open_job`, `assign_and_resume` và `Domain::WindowsJob`; gate luôn là thành viên job, `holder` là gate, `keeper` là supervisor.
- **2026-10-18 — Cutover của `direct` (6.2 P09).** `executeAssignment` giao agent cho supervisor Rust; xoá `detached-run-supervisor.mjs`, kênh IPC, `reconcile-cli-spawn.mjs`, `legacySpawn`, `bindConfinedHomesToSupervisor`. Phát hiện khi chạy bwrap thật: gate nằm trong sandbox root chỉ-đọc nên không tạo được `gate-exit.json` và file capture; controller tạo sẵn file rỗng, driver bind đúng các file đó, gate ghi tại chỗ. Controller đợi `closed.json` sau result; settle step nhận ngữ cảnh controller qua `controller/settle-context.json`.
- **2026-10-18 — D9: `dispatch.gateKillGraceMs`, mặc định 10000, tối thiểu 1000.** Doctor `gate-kill-grace`; setup không ghi khoá vào config global.

## 17. Related files

| Relationship | File |
|---|---|
| defines | [packages/run-supervisor/contracts/](../../../packages/run-supervisor/contracts/) |
| uses | [process/spec.md](../process/spec.md), [holder-lock/spec.md](../holder-lock/spec.md) |
| adapters | [agent-protocol/spec.md](../agent-protocol/spec.md) |
| boundary | [component-boundary.md](../component-boundary.md) |
| runner decision | [runner.md](../../specs/runner.md) |
| plan | [plan.md](../../../plans/261016-1351-run-supervisor-rust-core-direct-mode/plan.md) |
| design and evidence | [design r6](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) |
