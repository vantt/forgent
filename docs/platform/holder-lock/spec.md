# Holder-lock Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single lock port for every cold fgOS lock: kernel locks on open file descriptions behind one OS-neutral port
Design status: Accepted
Implementation status: In progress (contracts and registry landed; crate, routes, Node facade, fences, fgctl gate and the cutover of ten locks land in parallel phases)
Canonical: Yes
Owner: Holder-lock component
Source: packages/holder-lock/rust (crate fgos-holder-lock), src/holder-lock/ (Node facade)
Contracts: packages/holder-lock/contracts/
Last reviewed: 2026-10-16
Related:
- docs/platform/process/spec.md
- docs/platform/component-boundary.md
- docs/platform/session-identity/spec.md
- docs/specs/distribution.md
- docs/specs/runner.md
- plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md
- plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md
```

## 1. Purpose

Holder-lock answers one question for every cold lock in fgOS: who holds this resource right now, as the kernel sees it. A lock is a kernel lock on an open file description. The kernel releases it when every process holding a copy of that description has died, so no decision anywhere in the component is derived from a pid, a TTL, a start time or an mtime.

Every caller (the Node facade, a Rust crate, a git hook) goes through one port with one set of operations. Each operating system has one driver behind the port, and the port reports the guarantee level that driver gives on the filesystem the lock files live on. Nothing in the public interface is POSIX-only: a caller never sees a file descriptor or a handle of the operating system.

The component owns the cold locks only. The hot state mutex (`events.lock` and `claims.lock`, merged into one `state` lock) keeps its in-process fast path and uses this port only for the reclaim step; that work and the main-checkout mutex belong to the next track (see the ownership column of the registry, section 7).

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| The port: `acquire`, `release`, `run_borrowed`, `probe`, `holders`, `guarantee` ([contract](../../../packages/holder-lock/contracts/holder-lock.port.v1.json)) | Writer identity (Session Identity) |
| Which process holds which resource, as the kernel reports it | Taking a lock away from a live holder (there is no such path; a hung live holder is stopped by a person, `fgos lock fence`, next track) |
| Lock order inside one `LockScope` and the description rules (section 5) | Liveness judgment of a process tuple (process facts) |
| The lock registry: every lock's name, kind, scope, rank, path, legacy shape and fence ([registry](../../../packages/holder-lock/contracts/lock-registry.v1.json)) | The attempt lock's lifecycle (run supervisor) and the containment port (process control) |
| The single state-root resolution and `lockRoot` (section 11) | The meaning of a lock's contents (a lock file is never read for data) |
| The internal routes `fgos internal lock-fd`, `state-root`, `quiesce-scan`, `lock-borrow-vectors` (section 10) | Any verb a person calls |
| The cutover fences for the retired lock shapes and the stop-everything check (section 12) | Deciding when a workspace is cut over (a person, through `fgos doctor --fix`) |

There is one implementation of the primitive, the Rust crate `fgos-holder-lock`, which calls `flock` in process. Node cannot call `flock`, so the Node facade in `src/holder-lock/` opens the lock file itself and hands the description to the internal route `fgos internal lock-fd`, which locks the inherited description and exits. The lock stays with the description Node owns; the helper is never the owner. Rust and Node lock the same file with the same primitive, so a Rust writer and a Node writer exclude each other with no second protocol.

Depends on `fgos-process` (facts and control) and on the kernel. The component-boundary entry is [Holder-lock (L1)](../component-boundary.md#4-current-high-level-components).

## 3. The port

Operations, as the contract states them:

| Operation | Meaning |
|---|---|
| `acquire(resource, mode: EX \| SH, wait: try \| ms N, killWaitMs)` | Hold the lock. Returns `acquired` with an opaque handle, `held` (reason `kernel-lock-held` or `predecessor-domain-not-empty`, with the holders when they are listable), `timeout` with the milliseconds waited, or `unavailable` (`unsupported-platform`, `unsupported-filesystem`, `host-version-mismatch`, `io-error`). `acquired` is returned only when both hold: the kernel lock is held and the predecessor domain recorded next to the lock file is empty (section 8). A free kernel lock alone is not proof |
| `release(handle)` | Close every copy of the description the handle owns. The holder releases only after its own domain is empty (section 8, step 0) |
| `run_borrowed(handle, spec)` | The only way a child command (a git commit of a checkpoint or merge) runs with the holder's authority. The description goes to exactly one child through an explicit fd mapping (slot 3 by default, env `FGOS_LOCK_FD=<name>:3`). When the command is git, `-c gc.auto=0 -c maintenance.auto=false` is prepended. After the child exits the leftovers in the domain are killed and the call waits for the domain to be empty before it returns `{exit, signal, leftoversKilled}` |
| `probe(resource)` | One non-blocking `LOCK_SH` attempt on a fresh description, dropped at once; answers `free` or `held` and never obstructs a holder. Used by the adopt scan, the resume guard and reconcile |
| `holders(resource)` | Diagnostic list `[{pid, startTime, cmdline}]` of every process holding a description of the lock file, or `unlistable` with a reason. Linux reads `/proc/*/fdinfo/*` for a `lock:` line on the file's inode; macOS and Windows report `unlistable` |
| `guarantee(path)` | `{driver, exclusion, borrow, holders, platform, notes}` for the directory the lock files live in. The levels are `kernel`, `kernel-unmeasured`, `job-scoped`, `unsupported`, `none` |

Invariants of every result:

- `held` and `timeout` never leave a description open: the lock is released before the result is returned, and `predecessor-domain-not-empty` is returned after the kernel lock was released again.
- No result of any operation is derived from a pid, a TTL or an mtime.
- A handle is opaque. The fd lives only inside the driver; `run_borrowed` is the one place that maps it into a child.

The lock file of a resource is created once and never removed while the resource lives. A lock whose resource is a run (`attempt`, `advance`, `recovery`) lives in the run directory and goes away with the run; the inode check in section 5 makes that safe.

## 4. Drivers and guarantee levels

Each platform runs at the highest level it has, and the level is said out loud: `fgos doctor` prints it (`lock-kernel-semantics`), `fgctl` refuses to activate a release whose level is red (section 13). No platform falls back to the retired TTL locks.

| Driver | Exclusion | Borrow (`run_borrowed`) | Holders | Note |
|---|---|---|---|---|
| Linux `flock`, local filesystem | `kernel` (measured) | `kernel`: the description is passed to exactly one child at spawn; the git hook checks it by try-lock on the inherited description | `kernel` (fdinfo) | The first driver |
| macOS `flock` | `kernel` (measured 2026-10-16 on macOS 26.6 arm64: the lock is released on SIGKILL, an inherited fd keeps the lock after the parent dies, the borrow path never shows the lock free while git or its child is alive) | `kernel`, as Linux | `unsupported` (`unlistable`) | Enabled at once; still gated at activation by the borrow vectors and the semantics probe. Containment on macOS is best-effort (a `setsid` + double-fork escapee survives a group kill) and is reported in `notes`, not as a level |
| Windows | `unsupported` | `unsupported` | `unsupported` | No driver in this track. The locks of this component report `unsupported` and `acquire` returns `unavailable (unsupported-platform)`; gateway, sessions, runner, dispatch and the other cutover locks do not run on Windows until the Windows driver (`LockFileEx` through a lock-holding helper process, the next-but-one track). Its probes, including `predecessor-all-owners-dead`, are already green on a real Windows machine |
| NFS, SMB, CIFS | `none` | `none` | `none` | The driver refuses with a named error (`unsupported-filesystem`); doctor fails by name |

The guarantee is asked once per lock directory and per process. A directory whose exclusion level is `none`, or a platform with no driver, makes every `acquire` of the facade fail with the named error `lock-driver-unavailable`.

## 5. Description rules

The boundary between right and wrong moved from "who is alive" to "who holds a copy of the description". These rules are mandatory and have tests:

1. The lock description is always `FD_CLOEXEC`. The one moment it is not is inside exactly one spawn that borrows it, through an explicit fd mapping (Node: a `stdio` slot; Rust: `dup2` in `pre_exec`).
2. The receiver (inherited fd 3, or `SCM_RIGHTS` with `MSG_CMSG_CLOEXEC`) sets `FD_CLOEXEC` before any other syscall.
3. Reason, with evidence: Node opens with `O_CLOEXEC`, but Rust's `std::process::Command` inherits every fd above 2 that is not `CLOEXEC`. Every Rust route that receives a description has a leak test: after the child ran, `/proc/<child>/fd` and a grandchild's fd table do not contain the lock inode.
4. After acquire, `fstat(fd).ino` must equal `stat(path).ino`; otherwise close and retry. This is what lets a lock file be removed with its resource.
5. The lock file is opened `O_RDWR` (NFSv4 and BSD refuse an exclusive lock on a read-only fd).
6. Borrowing is a strong right and is close-only: any copy that calls `LOCK_UN` releases the shared lock, so owner and borrower only `close`; no library guard that unlocks on drop is used.
7. The doctor check `lock-holders` reports every holder that is not an fgOS process, so a violation shows up at once. The bwrap monitor process of an attempt whose supervisor or gate holds the lock is a member, not a stranger.
8. The borrow vectors are mandatory and there is no run-time switch that disables borrowing (such a switch would block fgOS's own commits and trip after every release). The vectors run in a throwaway repository with real git: a git alias that starts a background shell process, a clean/smudge filter that starts a background process, a hook that starts a background process, and `gc.auto=1` with enough loose objects; each asserts the lock is free as soon as git has exited and the owner closed its description, plus the sibling check (a process with the same `FGOS_LOCK_FD` value that opened the file itself is not a borrower). A red vector is a doctor FAIL (`lock-borrow-vectors`) and `fgctl` refuses to activate.

The borrower test used by a hook has three conditions, all required: `FGOS_LOCK_FD` names exactly the slot, `fstat(slot)` has the same `dev:ino` as the lock file, and `LOCK_EX | LOCK_NB` on the slot succeeds (a description that already holds the lock succeeds; a sibling that opened the file itself fails). Missing any one, the hook tries the lock once on a description of its own and never claims to be a borrower. The worker base env of a dispatch scrubs `FGOS_LOCK_FD` and `FGOS_MAIN_LOCK_HOLDER_PID`; a leaked variable is useless without the description.

## 6. Kinds

| Kind | Mechanism | Used for |
|---|---|---|
| `mutex` | Kernel lock, held briefly | sessions, advance, reconcile, recovery, provider account, provider state; later main checkout, `worktree-admin`, merge slot, observe, activation, install |
| `lease` | Kernel lock, held for the length of a long job; may be handed to a gate | gateway, runner, dispatch cwd, full-suite; later the attempt lock, whose file lives in the run directory |
| `hot-mutex` | Node in-process link/unlink, dead-holder cleanup under a kernel lock | `state` (events and claims merged), `porting-events`; next track |
| `beacon` | Not a lock | the main-checkout activity file |

Run control is not a kind: its ledger and CAS stay as they are, with no garbage collection; real exclusion of an attempt is the attempt lock.

## 7. Registry

[`packages/holder-lock/contracts/lock-registry.v1.json`](../../../packages/holder-lock/contracts/lock-registry.v1.json) (schema [`lock-registry.schema.v1.json`](../../../packages/holder-lock/contracts/lock-registry.schema.v1.json)) is the only list of which locks exist, in which order they may be taken, and which fence the cutover places for them. Rust and Node read the same file; the Node facade resolves the path templates (`<fgosDir>`, `<lockRoot>`, `<runDir>`, `<workflowRunDir>`).

One row per lock: `name`, `kind`, `scope` (`repo`, `machine`, `run`), `rank`, `v3Path`, `v1Shape` (`file-link`, `file-wx`, `ledger-dir`, `file-by-cwd`), `v1Path`, `fence` (`tombstone`, `blocking-generation`, `none`), `owner` (the track that cuts it over: `4.2`, `4.3`, `4.4`, `6.2`), and notes. A row owned by this track must carry a fence, a legacy shape, a legacy path and a new path.

Ranks (a scope may only take a lock of a higher rank than every lock it holds):

| Rank | Locks | Kind |
|---|---|---|
| 10 | `runner`, `gateway` | lease |
| 15 | `attempt` | lease |
| 20 | `merge-slot` | mutex |
| 30 | `dispatch-cwd` | lease |
| 40 | `worktree-admin` | mutex |
| 50 | `main-checkout` | mutex |
| 55 | git's own `index.lock`: outside fgOS, no row; the hook tries rank 50 once | — |
| 60 | `state`, `porting-events` | hot-mutex |
| 80 | leaves: `sessions`, `advance`, `reconcile`, `recovery`, `full-suite`, `provider-account`, `provider-state`, `observe`, `activation`, `install` | mutex, lease |

Locks cut over by this track: `gateway`, `runner`, `sessions`, `advance`, `reconcile`, `recovery`, `full-suite`, `provider-account`, `provider-state`, `dispatch-cwd`. Their new files live under `<fgosDir>/locks/` (repo scope), `<lockRoot>/` (machine scope) or the run directory. The dispatch cwd lock keeps the `fgosDir` scope; a machine-wide cwd lock is a separate item, opened only when two workspaces share one cwd for real.

Locks cut over by the Rust-callers track (registry owner `4.4`), all leaves of rank 80, all mutex, all fenced by a tombstone:

| Lock | Scope | New path | Legacy path (becomes a tombstone directory) | Caller |
|---|---|---|---|---|
| `activation` | repo | `<fgosDir>/locks/activation.lock` | `.fgos/installation/activation.lock` | `fgctl` init, upgrade, repair |
| `install` | machine | `<lockRoot>/install.lock` (`<stateRoot>/locks/install.lock`) | `<stateRoot>/install.lock` | `fgctl` release store |
| `observe` | repo | `<fgosDir>/locks/observe.lock` | `.fgos/observe/.lock` | Observe store (`fgos metrics`, `fgos friction`) |

The observe lock waits at most 5 s, has no TTL, and the shard snapshot is written under it. The activation and install locks are held by `fgctl` through the crate it links; a holder that is killed leaves the lock free at once. Until the main-checkout lock is cut over, `fgctl` checks the main checkout with `probe` (shared, non-blocking, never held) plus the v1 read, and reads a directory at `.fgos/main-checkout.lock` (a tombstone) as "moved".

## 8. The predecessor domain rule

Measured on Windows: a lock bound to a process is released the moment that process dies, while the job that kills its children does so asynchronously, so for a few milliseconds the lock reads free while a borrowed git may still be writing. Linux and macOS have no such gap on the borrow path (git itself holds a copy of the description), but the rule is part of the port from the first driver so no driver can be written without it ([contract](../../../packages/holder-lock/contracts/predecessor.v1.json)).

0. **Release rule.** A holder releases only when its own domain is empty: `run_borrowed` waits for the child, kills what is left in the domain (the borrow API already turned automatic gc off, so there is no legitimate reason to leave a process behind), waits for empty, and only then returns so the caller may release. Consequence: a non-empty predecessor domain found after the next holder took the lock means the previous holder died abnormally.
1. A holder that will create a process domain while it holds the lock (a job for `run_borrowed` on Windows; the attempt's namespace or job) writes `<lockFile>.predecessor.json` right after acquire and before creating the domain, while it still holds the lock: `{v: 1, domainKind, domainId}`. `domainKind` is `linux-gate` (the gate's process tuple; empty iff `judge(tuple) == dead`), `windows-job` (a named Job Object) or `macos-tree` (a tree root tuple; best-effort). The record is written through a temp file and a rename. A missing record means the previous holder created no domain.
2. The next holder, after it holds the kernel lock, reads the record and asks the driver whether the domain is empty. Empty, or unopenable but proven empty: proceed. Not empty: kill the whole domain at once; never wait for it to drain.
3. Then wait at most `killWaitMs` (`lock.predecessorKillWaitMs`, default 2000 ms; measured a few ms) for the killed processes to be signaled. Domain empty: proceed. Deadline passed, or the kill was refused: release the kernel lock and return `held (predecessor-domain-not-empty)` naming the domain; doctor shows that domain.
4. A holder that proceeded and will create a domain itself overwrites the record before creating it. A record with `v != 1`, or an unreadable record, is never deleted or ignored: acquire returns `held (predecessor-domain-not-empty)` with the raw record.

Why kill at once rather than wait for the domain to drain: a drain only helps a holder that was allowed to leave processes running after release, and step 0 forbids that. The second Windows measurement showed every contender waiting the full 2000 ms before terminating; killing at once brings the crash path down to a few milliseconds (p50 5.9 ms, p95 6.9 ms over 50 runs). A holder that violates step 0 on purpose has its leftover killed by the next holder: that is the holder's defect, and `lock-borrow-vectors` catches the known vectors.

In this track only the `linux-gate` domain has an implementation (`judge(gate) == dead`; `kill_all` is SIGKILL by identity). On Linux `run_borrowed` declares no domain; the leftovers it kills are the other processes that still hold the lock description (`holders()`), each signaled by identity, with a named error `borrow-leftover-not-killed` and the pid when one survives the deadline. On macOS the leftovers are the child's process group. `windows-job` and `macos-tree` are contract only until their drivers exist.

## 9. Node facade and `LockScope`

`src/holder-lock/` is the Node facade. A caller never sees an fd.

- `acquireSync(scope, name, params, {waitMs})` and `acquire(...)` (async: `--try` repeated on a timer, so the runner loop never blocks its event loop). The facade opens the lock file `O_RDWR | O_CREAT`, runs `fgos internal lock-fd` with the fd in `stdio` slot 3, checks the inode after acquire, and passes `--kill-wait-ms` from `lock.predecessorKillWaitMs` (read through the same config reader `fgos setup` uses). `acquireSync` waits with `spawnSync` and `killSignal: SIGKILL`: when it returns the helper is dead and reaped, the fd is closed, and the result is not-acquired unless the stdout line says `acquired`. There is no hung state.
- `handle.release()` closes the fd; idempotent; never `LOCK_UN`.
- `probe(name, params)` runs `--shared-try` on a fresh description and closes it at once.
- `runBorrowed(handle, spec, {sync | async})` is the only function that puts the lock fd into `stdio`; it sets `FGOS_LOCK_FD=<name>:3` and, for git, prepends the gc flags. The async form returns the child for a caller that needs `onSpawn` (the account lock).
- `held` with reason `predecessor-domain-not-empty` becomes the named error `lock-predecessor-domain-not-empty` with the domain; `borrow-leftover-not-killed` keeps its name.
- The host binary is found once per process by `resolveActiveHostBin` (`FGOS_HOST_BIN`, then the activation), the same rule Session Identity uses; the route is exec'd directly, never through a shim, and never inside a hot lock.

`LockScope` is an object passed explicitly through calls; every parallel `claimAndDispatch` in the runner has its own. Inside one scope a lock may be acquired only at a rank higher than every rank the scope holds; two locks of the same rank in one scope are forbidden. A violation throws `lock-order-violation` with `{held, acquiring}` at once. There is no trace-then-warn release and no environment switch: the full test suite and dogfood expose a wrong order, and the phase that caused it fixes it. Exclusion between two scopes of one process is the kernel's job (two descriptions), so no process-wide rank set exists. Across processes (hook, helper) no order check is needed: the hook tries once and never waits, the helper holds nothing after it exits.

## 10. Internal routes

The routes live in `apps/fgos/src/main.rs` as the earliest branch of `main()` (before any composition, provider or spawn, so no child can inherit fd 3). They are not in `command-routes.json` and not in help. Every route requires `--protocol 1`; absent or different, the answer is `host-version-mismatch` (one release, one protocol). Each prints one JSON line on stdout (`{v: 1, protocol: 1, ...}`); stderr is for people and never parsed.

| Route | Contract | Does |
|---|---|---|
| `fgos internal lock-fd` | [`internal-route.lock-fd.v1.json`](../../../packages/holder-lock/contracts/internal-route.lock-fd.v1.json) | Sets `FD_CLOEXEC` on fd 3 before any other syscall, then exactly one of `--try`, `--wait-ms N`, `--shared-try`, `--borrowed-check <path>`, `--guarantee <path>`; optional `--kill-wait-ms N` and `--predecessor <path>`. Exit 0 acquired/free/borrower/guarantee, 10 held/not-borrower, 11 timeout, 12 unavailable, 2 usage, 3 protocol mismatch, 70 internal. It never calls `LOCK_UN` and spawns nothing |
| `fgos internal state-root` | [`internal-route.state-root.v1.json`](../../../packages/holder-lock/contracts/internal-route.state-root.v1.json) | Prints `{stateRoot, lockRoot, source}` (section 11) |
| `fgos internal quiesce-scan` | [`internal-route.quiesce-scan.v1.json`](../../../packages/holder-lock/contracts/internal-route.quiesce-scan.v1.json) | Read-only: lists every other fgOS process of the given roots (`--root`, `--exclude-pid`) by environ, cwd inside any linked worktree, or cmdline; `clean` only when nothing was found and nothing was unreadable; `unavailable` where `/proc` cannot be scanned (a person confirms) |
| `fgos internal lock-borrow-vectors` | [`internal-route.lock-borrow-vectors.v1.json`](../../../packages/holder-lock/contracts/internal-route.lock-borrow-vectors.v1.json) | Runs the four vectors and the sibling check of section 5 in a temporary repository; `pass` or `fail` per vector with elapsed time and the git version; budget one second; `--vector` and `--keep-repo` for diagnosis; exit 10 on a red vector, 12 when git or the platform is unavailable (treated as fail by activate) |

## 11. One state root

`stateRoot` is resolved by one function in the crate, the same formula `resolve_machine_release_store_root` uses, so the release store and the locks never disagree ([contract](../../../packages/holder-lock/contracts/internal-route.state-root.v1.json), [vectors](../../../packages/holder-lock/contracts/state-root.vectors.v1.json)):

1. `FGOS_STATE_ROOT` (`pinned`): used verbatim.
2. `FGOS_STATE_HOME` (`fgos-state-home`): used verbatim, no suffix.
3. `XDG_STATE_HOME/fgos` (`xdg-state-home`).
4. `HOME/.local/state/fgos` (`home`); `USERPROFILE/.local/state/fgos` only when `HOME` is unset.
5. `.local/state/fgos` relative (`relative-fallback`).

A variable whose value is blank is unset; a non-blank value is used untrimmed. `lockRoot` is `<stateRoot>/locks`. The Rust host resolves the root once and exports `FGOS_STATE_ROOT` before it execs the Node payload; Node reads that variable and calls the route only when it is absent (the `node bin/fgos.mjs` compatibility channel), once, before any lock. Dispatch pins `FGOS_STATE_ROOT` into the environment of every child, so a sandbox with its own `HOME` does not move the root; a process that sets another root is, by definition, another machine scope. The key of a cwd is `dev:ino` after `realpath`.

## 12. Cutover: stop everything, fence once

fgOS has one user and its runtime state can be rebuilt, so the two-protocol, two-phase quiescence of the design is replaced by a stop-everything cutover: every writer in every workspace (forgentX, mdview, mcp-skill-hub) is stopped, each lock of this track moves to the new path, and the legacy path is deleted in the same phase. There is no family marker, no protocol floor in the activation manifest, and no separate phase that deletes legacy code.

The fences that remain are the cheapest thing that makes an old binary fail loudly rather than hold a legacy lock beside a kernel lock:

| Lock | Fence | Why |
|---|---|---|
| `gateway`, `sessions`, `runner`, `reconcile` (fixed paths) | Tombstone: the legacy file path becomes a directory holding `TOMBSTONE` (`{lock, at, by}`), placed once | One `mkdir`; the old binary meets `EISDIR` |
| `advance`, `recovery` (per run) | Tombstone for every run that exists at cutover, not lazily | An old binary aiming at a run created after the cutover is rare; lazy placement adds code to every acquire |
| `dispatch-cwd` | Tombstone for both the `path.resolve` form and the `realpath` form, for every worktree (`git worktree list --porcelain`) and every claim at cutover | Two writers in one worktree is real harm; listing once is cheap |
| `provider-account`, `provider-state` | Blocking generation: a final generation published by `link` whose holder is pid 1 with no start time and no boot id | A tombstone does not stop a generation ledger; pid 1 is alive in every namespace and a holder without a start time is always `held` to old code |
| `activation`, `install`, `observe` | Tombstone: the legacy path (`.fgos/installation/activation.lock`, `<stateRoot>/install.lock`, `.fgos/observe/.lock`) becomes a directory holding `TOMBSTONE`, placed once | An older `fgctl` or `fgos` meets the directory and stops with an error rather than taking a legacy lock beside the kernel lock |
| `full-suite` | None | A tombstone makes the old branch's queue loop forever; without a fence the old branch only runs the suite unqueued, which is harmless |

`src/holder-lock/fences.mjs` is the body of the doctor check `lock-fences` and of its fix: `checkStopped({workspaces})` runs `quiesce-scan` per workspace and lists every blocker (an unreadable entry is a blocker; a platform that cannot scan answers `needs-attest`); `placeFences({fgosDir, lockRoot, workspaceRoot})` places each fence by exclusive `mkdir` or by `link`, is idempotent, and stops with `v1-lock-present` and the path when a legacy lock file is in use (nobody's file is removed); `fenceStatus` reports which registry paths still lack their fence. The fix runs `checkStopped`, then `placeFences`, then `checkStopped` again to catch a process that started while the fences went in (it has met the fence and failed loudly, but it is still reported for a person to stop). A blocker on the first scan places nothing.

A release from before the cutover meets a fence as a raw `EISDIR` or "held by pid 1", not a named error: accepted for a single user and noted in the changelog. Rollback to an older release is by hand: remove the `TOMBSTONE` directories of exactly the registry paths, and publish one more generation with `releasedAt` on each blocked ledger.

## 13. Setup, doctor and activation

`fgos setup` creates `<lockRoot>` (mode 0700) and `<fgosDir>/locks`, and registers one config default, `lock: {predecessorKillWaitMs: 2000}`: the merge adds the key only when it is missing and never overwrites a value the owner set (global first, then project on top).

`fgos doctor` checks, registered in `src/setup/registrations.mjs` with their bodies in `src/setup/holder-lock-checks.mjs`:

| Check | Does | Result |
|---|---|---|
| `lock-kernel-semantics` | For `<fgosDir>/locks` and `<lockRoot>`: `--guarantee` through the route plus a two-process probe on that same mount (a child holds EX, the parent must see `held`; the child dies, the parent must see `free`) | Prints `{driver, exclusion, borrow, holders}`. `kernel` passes; Windows `unsupported` warns that holder-lock has no Windows driver yet and names the components that do not run; a network filesystem (`none`) fails by name. A platform is never failed for being itself |
| `lock-borrow-vectors` | `fgos internal lock-borrow-vectors` | Any red vector fails. Not applicable on Windows |
| `lock-holders` | `holders()` for every lock of this track in the registry | A holder that is neither an fgOS process nor a child of a `runBorrowed` call warns with pid and cmdline; a lock whose `predecessor.json` names a domain that is not empty warns with the domain; `unlistable` is informational |
| `lock-fences` | `fenceStatus` | A registry path without its fence warns. Fix: `checkStopped`, `placeFences`, `checkStopped`; with a blocker nothing is placed and the processes are listed |
| `lock-predecessor-kill-wait` | Reads `lock.predecessorKillWaitMs` after the config merge | Prints the value and its source. Not a positive integer, or above 60000, fails by name; absent passes with the default 2000 |
| `state-root` | `stateRoot`, `lockRoot` and the source, from Node and from the host | A difference fails |

The check `provider-capacity-lock-stale` is removed with its body: the provider-capacity ledger is no longer a mutex once the provider locks are kernel locks.

`fgctl` gates activation: right before it publishes the activation file on every path (init, upgrade, repair) it runs, through the crate it links itself and never under the candidate directory, the guarantee plus the two-process semantics probe for `<workspace>/.fgos/locks` and `<lockRoot>`, and the borrow vectors. On Linux and macOS a red probe or vector refuses the activation with `lock-kernel-semantics-failed` or `lock-borrow-vectors-failed` and the detail. On Windows the vectors do not run, the activation goes through, and one line says holder-lock is unsupported until the Windows driver. A network filesystem is refused by name. There is no flag that turns the gate off. The manifest carries no `lockProtocol` field and there is no `lockProtocolFloor`.

## 14. Known limits

- A hung live holder is never taken over. Until `fgos lock fence` exists (next track), a person stops the process; the lock releases when it dies.
- `holders()` is `unlistable` on macOS and Windows, so `lock-holders` and the leftover kill of `run_borrowed` rely on the process group there (best-effort).
- The predecessor rule only has the `linux-gate` domain in this track; nothing declares a domain on Linux or macOS until the attempt lock (run supervisor) and the Windows driver exist.
- The dispatch cwd lock keeps the `fgosDir` scope: two workspaces whose `.fgos` directories differ do not exclude each other on one cwd.
- A borrower hook's `LOCK_EX | LOCK_NB` on an inherited description also succeeds when nobody holds the lock; that only happens when the API hands over a description it has not locked, which is a programming error, since the API only passes a description after acquire.
- The lease on a dispatch cwd is released at the end of the assignment, before the runner commits the Unit's writes; that gap exists today and is a named deferred item of the run supervisor.
- `FGOS_HOST_BIN` is inherited, so a child uses its parent's host binary; a release whose route speaks another protocol answers `host-version-mismatch` and the facade fails closed.

## 15. Lịch sử quyết định

- **2026-10-15 — Thiết kế nền bản 3 (r1): kernel lock trên open file description thay mọi lock TTL/pid.** Lock thuộc description, không thuộc pid: không tái dùng pid, không boot id, không TTL, không record cần dọn, không GC; con kế thừa description lúc spawn nên mượn quyền không có khe; kernel trả lời "có ai giữ không" bằng try-lock. Bằng chứng: probe kernel lock trên Linux thật (giữ sau khi helper thoát, hai description cùng process loại trừ, SIGKILL nhả ngay, mượn qua git thật với owner bị SIGKILL). Thiết kế và probe: [design r6](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) §6, §12.1.
- **2026-10-16 — r2, r3: ba vòng phản biện (kongming, Astra, Argon).** Nhận: luật description (Rust kế thừa fd ≥ 3 không `CLOEXEC`; `git gc --auto` giữ lock sau commit; fd mượn rò qua shell nền) → `FD_CLOEXEC`, `O_RDWR`, close-only, API mượn tắt gc, test rò trên route thật, doctor `lock-holders`; tombstone không phải hàng rào chung → kiểm kê theo hình dạng giao thức, thế hệ chặn cho ledger, tombstone cả `path.resolve` lẫn `realpath`; zombie bị coi là sống và record thiếu pid bị coi là chết → sửa ở process facts; `probe` dùng `LOCK_SH` để quét adopt không cản holder (kongming N6); vân tay runtime tắt mượn khi đổi git/host bị bác vì tự chặn commit của fgOS → check `lock-borrow-vectors`, đỏ = FAIL, không có chế độ tắt mượn (kongming M4). Design §14.
- **2026-10-16 — r4: yêu cầu chạy trên Linux, macOS, Windows.** Cổng lock trung lập OS, mỗi nền một driver, mức bảo đảm khai báo và doctor báo mức; không còn "fail trên Windows"; spike X1 (Windows) và X2 (macOS) đo trên máy thật trước khi viết driver. r4 còn giữ R-dual + quiescence hai pha + sàn `lockProtocolFloor` và lịch trace → cảnh báo → ném cho thứ tự lock (§6.5, §6.8).
- **2026-10-16 — r5: luật miền của holder trước (6.0.1).** Đo trên Windows thật: lock trống 0,2 ms sau khi holder bị giết nhưng process cuối trong job chết sau 3,9 ms → một vi phạm. `acquire` chỉ trả handle khi kernel lock đã giữ VÀ miền process của holder trước đã rỗng; record `predecessor.json`; r5 chờ cạn tới `lock.predecessorDrainMs`. Design §12.10.
- **2026-10-16 — r6: kết thúc ngay, bỏ chờ cạn.** Lần đo hai: với job do supervisor giữ, 0/50 vi phạm nhưng contender luôn chờ đủ 2000 ms (p50 2006,8 ms). Chọn phương án B: holder chỉ nhả khi miền của mình rỗng (bước 0), người sau thấy miền trước chưa rỗng thì kết thúc ngay; `lock.predecessorDrainMs` bỏ, thay bằng `lock.predecessorKillWaitMs` chỉ giới hạn chờ signaled. Windows cần người giữ job thứ hai; đường dự phòng Toolhelp đo 0/50 vi phạm, chờ thêm p95 8,7 ms. Design §6.0.1, §12.11, §12.12.
- **2026-10-16 — Quyết định của anh (plan 4.2, thay một phần thiết kế).** A1: cutover dừng-toàn-bộ thay R-dual và quiescence hai pha; một user, state xoá làm lại được; chuyển mỗi lock và xoá đường v1 trong cùng phase; không marker họ, không sàn, không phase xoá v1 riêng. A2: Windows chưa có driver thì các lock này báo `unsupported`, không lùi về v1; driver Windows chỉ viết sau khi các probe 6.0.1 xanh trên máy thật; macOS bật driver `flock` ngay (X2 đã đo), vẫn chặn ở activate bằng vector mượn và probe ngữ nghĩa. A3: sai thứ tự lock ném lỗi ngay, không lịch trace → cảnh báo → ném; full `npm test` và dogfood lộ vi phạm, sửa trong phase gây ra. [Plan](../../../plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md).
- **2026-10-16 — Lead tự quyết (plan 4.2).** D1: spec ở `docs/platform/holder-lock/spec.md` và `docs/platform/process/spec.md`, theo tiền lệ Session Identity. D2: registry lock là file dữ liệu `lock-registry.v1.json`, chốt ở phase đầu, Rust và Node cùng đọc. D3: primitive cho gate (subreaper, PDEATHSIG, PID namespace, tty) để run supervisor làm, 4.2 không có consumer. D4: `fgctl` chạy vector mượn và probe ngữ nghĩa bằng crate nó tự link, trước publish. D5: route nội bộ kiểm `--protocol 1`, lệch → `host-version-mismatch`. D6: account lock giữ bất biến "con probe còn sống thì không giành" bằng `runBorrowed`. D7: bỏ `lockProtocolFloor` và trường `lockProtocol` của manifest (hàng rào đã làm binary cũ fail to tiếng). D8: luật 6.0.1 cài một lần trong lõi cổng và route; ở 4.2 chỉ miền `linux-gate` có cài đặt; luật nhả trên Linux: `run_borrowed` không khai miền, phần còn sót là process khác còn giữ description; macOS: process group của con.

- **2026-10-16 — Lead tự quyết (plan 4.4a: fgctl và Observe gọi từ Rust).** `activation`, `install`, `observe` thành kernel lock: `activation.lock` ở `<fgosDir>/locks/` (mutex, rank 80, repo), `install.lock` ở `<stateRoot>/locks/` (machine), `observe.lock` ở `<fgosDir>/locks/` chờ 5 giây, không TTL, snapshot shard ghi dưới lock. Holder bị giết thì lock nhả ngay. Ba đường cũ (`.fgos/installation/activation.lock`, `<stateRoot>/install.lock`, `.fgos/observe/.lock`) thành thư mục tombstone, fgctl/fgos cũ dừng có lỗi. Tới khi main checkout được cutover, fgctl kiểm main checkout bằng `probe` (shared, không chặn, không giữ) cộng đọc v1, và coi thư mục tombstone ở `.fgos/main-checkout.lock` là "đã chuyển". Windows: `fgctl init`/`upgrade`/`repair` từ chối với `lock-driver-unavailable` cho tới khi có driver Windows, không lùi về file cũ. D1: ba lock là ba hàng registry riêng (`activation`, `install`, `observe`), cả ba mutex hạng 80, hàng rào tombstone. D2: `check_main_checkout_lock` của `fgctl` = `probe(main-checkout)` không giữ, cộng đường đọc v1 chỉ thêm nhánh tombstone; không giữ main mutex qua publish vì `run_tail` chạy `fgos setup` có thể checkpoint main. D3: Rust không giữ `LockScope`; thứ tự cố định trong code: `probe(main-checkout)` → `activation`; `install` chỉ giữ trong `stage_release`, nhả trước `activation`, hai lock hạng 80 không lồng nhau. D4: ghi shard snapshot của Observe đi dưới observe lock (hai process cùng writer id có thể xen dòng). D5: Windows trước driver Windows: `lock-driver-unavailable`, không lùi về v1. D6: giữ tên kiểu công khai `ActivationLockGuard`, `InstallLockGuard`, `StoreLockGuard` và biến thể lỗi `ActivationLockHeld`, `AlreadyInProgress`, `observe-lock-timeout`; guard bọc handle, `Drop` chỉ đóng description. [Plan](../../../plans/261016-1306-fgctl-rust-callers-on-holder-lock/plan.md).

## 16. Related files

| Relationship | File |
|---|---|
| defines (port) | [holder-lock.port.v1.json](../../../packages/holder-lock/contracts/holder-lock.port.v1.json) |
| defines (predecessor domain) | [predecessor.v1.json](../../../packages/holder-lock/contracts/predecessor.v1.json) |
| defines (registry) | [lock-registry.v1.json](../../../packages/holder-lock/contracts/lock-registry.v1.json), [lock-registry.schema.v1.json](../../../packages/holder-lock/contracts/lock-registry.schema.v1.json) |
| defines (routes) | [lock-fd](../../../packages/holder-lock/contracts/internal-route.lock-fd.v1.json), [state-root](../../../packages/holder-lock/contracts/internal-route.state-root.v1.json), [quiesce-scan](../../../packages/holder-lock/contracts/internal-route.quiesce-scan.v1.json), [lock-borrow-vectors](../../../packages/holder-lock/contracts/internal-route.lock-borrow-vectors.v1.json) |
| evidenced by (vectors) | [state-root.vectors.v1.json](../../../packages/holder-lock/contracts/state-root.vectors.v1.json) |
| consumes | [process/spec.md](../process/spec.md) |
| constrains | [session-identity/spec.md](../session-identity/spec.md) (identity grants no lock authority) |
| boundary | [component-boundary.md](../component-boundary.md) |
| setup and doctor registry | [distribution.md](../../specs/distribution.md) |
| dispatch cwd lock, resume guard, reconcile | [runner.md](../../specs/runner.md) |
| plan | [plan.md](../../../plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md) |
| design and evidence | [design r6](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) |
