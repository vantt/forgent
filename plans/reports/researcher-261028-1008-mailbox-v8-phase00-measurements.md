# Mailbox V8 phase 00: measurements for questions 1, 2, 6, 7

Scope: read-only research for `plans/261027-1205-mailbox-v8-cross-machine-delivery/phase-00-facts-and-measurements.md`. No tracked file changed, nothing committed. Questions 3, 4 and 5 of the phase were not asked here and are not answered.

Environment of every number: machine `fg-server2`, Linux 7.0.0-38, 24 cores, ext4 (`/dev/nvme0n1p2`), repo commit `417d8abc7` (main), OpenSSH 10.2p1, release builds (`cargo build --release`) from a throwaway linked worktree `forgent-worktrees/mailbox-v8-p00` with `CARGO_TARGET_DIR` on ext4 beside it. The machine was shared with other lanes: load average 4 to 13 during the runs, which explains the spread between runs below. Worktree, target and scratch repos are deleted. The throwaway sources are kept, untracked, at `.fgos/runtime/tmp/mailbox-v8-p00-bench-src/` (`mailbox_append_bench.rs`, `spawn_bench.rs`, `host-stub.diff`, `stats.py`).

Report file name came from `fgos convention path --kind report --type researcher --slug mailbox-v8-phase00-measurements --json` (the call with `--kind report` alone is refused: "report type is empty or malformed"; the plan's command line needs `--type`).

## Q1. Cost of appending one signed event to `project:mailbox`

Verdict: **pass, with two stated gaps** (migrated-clone admission not measured; growth with stream length).

### What was measured

A throwaway example (`apps/fgos/examples/mailbox_append_bench.rs`, built in the worktree only) that repeats `apps/fgos/src/wiring/identity_log.rs::StoreLog::append` against the real Event Store crate (`fgos-event-store`) with the real Git driver (`fgos-git`) and the real signing (`fgos_identity::signing::sign`, which runs `ssh-keygen` twice: `-y` to read the public key, then `-Y sign`). Each iteration is exactly the identity append sequence plus a signature:

1. `write_readiness` (the write admission, `admit`)
2. `read` of the stream with `project: true` (`read`, needed for the `seen` cursor)
3. build a small payload (about 200 bytes: id, from, to, kind, body of about 70 characters, sentAt) and sign it (`sign`)
4. `append` (`append`)

A scratch clone on ext4 with an empty initial commit, a stream `project:mailbox` registered from a throwaway contract (`mailbox.message-sent`, scope project, `sealOnWrite:false`, like Identity's types), state root in a scratch dir (`FGOS_STATE_HOME`), machine id and key minted there.

Commands (binary built with `cargo build --release -p fgos --example mailbox_append_bench`):

```
mailbox_append_bench <repo> 100            # in-process, per iteration, fresh store, repeated twice
mailbox_append_bench <repo> 300            # same, stream grows to 300 events
python3 loop: mailbox_append_bench <repo> 1   # one process per append (cold), wall time incl. exec
```

### Results (milliseconds)

In-process, per iteration (what one `send` adds on top of its own startup if caches were warm; they are not, see cold rows), fresh store, n=100 per run, two runs:

| run | total p50 | total p95 | total max | admit p50/p95 | read p50/p95 | sign p50/p95 | append p50/p95/max |
|---|---|---|---|---|---|---|---|
| 1 | 29.7 | 57.1 | 95.8 | 3.4 / 10.9 | 4.5 / 12.5 | 5.7 / 16.8 | 16.0 / 23.4 / 55.5 |
| 2 | 29.1 | 52.7 | 69.5 | 3.2 / 6.8 | 4.2 / 10.7 | 5.7 / 11.7 | 16.0 / 16.5 / 54.1 |

Growth: one run of 300 appends: total p50/p95/max = 32.4 / 75.1 / 90.6 over all 300; first 30 = 28.0 / 39.8 / 69.6; last 30 = 71.8 / 88.7 / 90.6. The last 30 split: read 26.1 p50 (37.2 p95), admit 11.3, sign 14.2, append 21.3. `read` is the part that grows with the stream (4.5 ms at the start, 26 ms at about 300 events), and `append` has a constant cost of one durable write set (spec: three steady-state fsyncs, kept by contract). The last-30 rows were also taken while load average peaked, so part of that rise is load.

Cold process, one append per process, wall time from the parent (includes exec, store and Git driver open, `open` is 16 ms of it):

| condition | n | p50 | p95 | max |
|---|---|---|---|---|
| small store (about 20 events), load average about 4.5 | 60 | 57 | 62 | 69 |
| 300-event store, load average about 6 to 13 | 40 | 139 | 215 | 221 |
| fresh store each time (store minting included), load average about 6 to 13 | 40 | 98 | 210 | 218 |

### Reading against the target (p95 at most 200 ms)

- Quiet machine, small stream: p95 62 ms cold, 53 to 57 ms per iteration. Passes with a factor of three.
- Loaded machine (other lanes running builds and tests, load 6 to 13): cold p95 is 210 to 215 ms, just over 200. The excess is scheduling and `ssh-keygen` and `git` process spawns competing for CPU, not the store.
- Where the time goes: the `ssh-keygen` pair (sign) is 6 to 17 ms; the Git driver spawns contained `git` processes for admit and read (3 to 12 ms each); the append is one durable write set (16 ms, three fsyncs). A local mailbox send is about 10 ms, so a remote send is 3 to 6 times a local one in the quiet case.
- The send path should open the store once and call admit, read, sign and append once; do not sign twice or re-read.

### Gaps (unmeasured, with the closest evidence)

1. **Migrated clone.** The scratch clone is not migrated, so `write_readiness` returned early after one ref listing. A real project clone with the `.fgos/events` fence and `refs/fgos/legacy` runs the pinned-fence and mirror checks, which cost more git calls. I tried a local clone of forgent but `write_readiness` refused it (`EventStoreRefspecMissing`, mirror fetch mapping provenance is installed only by `fgos setup`), so I stopped. Closest evidence: `plans/reports/phase-lead-261023-1530-work-read-and-append-cost.md` (4 git processes per repeat read; steady append is exactly 3 fsyncs) and HARDEN R13 (board log line 2026-10-26 10:27: a steady `fgos list` is 11 contained git calls; the due sync runs in the detached child; `04d71fb40` cut mirror re-walks). R14 (line 2026-10-26 23:27, `d4a2a0d18`) only fixes the dev host's run directory for the detached child, no effect on append cost. Expect `admit` and `read` on a migrated clone to be a small multiple of the figures above; one confirming run on a setup-installed clone is still needed before the plan freezes the budget.
2. Rate: the figures are for one writer; two senders on one clone serialize on the append lock (not measured).
3. The seal and push are not in these numbers; they belong to the detached child.

## Q2. Can the hook start one detached child and return within 50 ms p95?

Verdict: **pass** for the spawn cost itself and for a hook with a stub; with one gap: the deeper real hook path (a call with a live Claude/Codex head) was not run, and the check "is the last fetch older than intervalSec" was not measured.

### How the hook runs

`fgos hook mailbox --cli <claude|codex|pi|omp> --event <stop|post-tool-use>` is served natively by `apps/fgos/src/wiring/mailbox_hook.rs` before the composition root (route table `native_kinds`). `main` runs `run()` inside `catch_unwind` and then `exit(0)`: exit 0 on every path, nothing on stdout or stderr unless frames are delivered, a watchdog (`mailbox.hook.budgetMs`, 8 s failure ceiling) and a circuit breaker. It holds only the mailbox mutex. Spec section 7.5 records the measured steady no-mail p95 inside the real CLIs as 26.5 ms (Claude Code) and 38.1 ms (Codex), against the 50 ms target. Not unix: `mailbox_hook_unsupported.rs` prints nothing and exits 0, so a spawn door only needs a unix implementation for the hook (the Windows door would be a separate decision).

### Spawn and return, from Rust

`apps/fgos/examples/spawn_bench.rs` (release build), time of the `spawn()` call only, n=100 per cell, three repeats (nine values per cell below show the range of the three repeats):

| variant | target | p50 | p95 | max |
|---|---|---|---|---|
| A: `std::process::Command`, stdio null, no new session | `/bin/true` | 0.07 to 0.09 ms | 0.10 to 0.20 | 0.31 |
| B: A plus `pre_exec(setsid)` | `/bin/true` | 0.20 to 0.22 | 0.27 to 0.33 | 0.44 |
| C: log file open (append, `O_CLOEXEC`) plus `fgos_process::control::spawn_with_fds(cmd, &[])` plus `setsid` | `/bin/true` | 0.19 to 0.21 | 0.21 to 0.28 | 0.39 |
| A / B / C | `/bin/sleep 2` | 0.09 to 0.12 / 0.17 to 0.25 / 0.18 to 0.21 | up to 0.23 / 0.46 / 0.38 | 0.34 / 1.46 / 0.64 |

So a detached spawn with its own session, log descriptor and the closed-descriptor door costs about 0.2 ms, 250 times under the 50 ms budget.

### Real hook with a stub child

A copy of the host (`host-stub.diff`, worktree only): `mailbox_hook::main`, after `run()` and before `exit(0)`, spawns `$FGOS_BENCH_STUB 2` with stdio null, `setsid` and `spawn_with_fds`. Release `fgos` binary, command `fgos hook mailbox --cli claude --event post-tool-use` with a Claude `PostToolUse` JSON on stdin, cwd and `CLAUDE_PROJECT_DIR` in a scratch repo with a `.fgos` directory, `FGOS_STATE_HOME` scratch. n=120 each, interleaved, wall time including exec:

| variant | p50 | p95 | max |
|---|---|---|---|
| hook, no stub | 13.2 ms | 36.8 | 46.6 |
| hook, stub started detached (`/bin/sleep`) | 14.1 ms | 35.3 | 62.6 |

Stdout and stderr were empty and exit code 0 in all 240 runs. The stub adds about 1 ms at p50 and nothing visible at p95 (the p95 is dominated by machine load, load average about 4 during the run).

Caveat: this scratch call takes the quiet path (the caller is not a Claude or Codex head, so the call ends at the caller check). It exercises process start, argument and root resolution, config, breaker, stdin read and the spawn. The deep steady path (record open, drain) is the 26.5 and 38.1 ms of spec 7.5. Adding the 0.2 ms spawn does not change a pass or fail on that path.

### What the hook door must also do (not measured)

The plan wants the hook to start the child only when the last fetch is older than `eventStore.sync.intervalSec`. That needs a read of `sync.json` (`fgos_event_store::sync::sync_status`, one small file read) from the clone's `.git/fgos/events`. The hook already resolves the main checkout from disk; resolving the common dir and reading `sync.json` should cost well under 1 ms, but I did not measure it. Note the Node trigger reads a directory listing and a few first lines on every command (`store.maintenance`).

A spawn-storm point: the Rust `sync_with_fs` already claims the due window in the child (see Q6) but only after the child has started (about 20 to 100 ms for a legacy-node payload). A hook that fires on every tool call can spawn several children inside that window; the extra ones find the seal lock held and exit. Either accept that (cheap, 0.2 ms each, the children are short) or have the parent record its attempt before spawning.

## Q6. Where should the Rust detached door live, and what must it copy?

Verdict: **pass** (no blocker to a Rust door; one location recommended). Recommendation: **put the door in `packages/process/rust`, next to `fgos_process::control::spawn_with_fds`, and call it from host wiring. Not in the mailbox crate, not in the event store crate.**

### Existing Rust code that spawns detached children

There is no Rust detached door today. grep (`setsid|pre_exec|process_group|CommandExt|DETACHED_PROCESS|CREATE_NEW_PROCESS_GROUP` over `apps`, `crates`, `packages`):

- `packages/run-supervisor/rust/src/steps.rs:202-227`: `run_step` spawns a step with `pre_exec(setsid)` and `spawn_with_fds(cmd, &[])`, stdin null, a `supervisor.log` opened append, `0600`, `O_CLOEXEC`; but it waits for the child (it is a supervised step, not a detached one).
- `packages/run-supervisor/rust/src/attempt_step.rs:60` and `gate/unix.rs`, `gate/windows.rs`: gate children (supervised).
- `packages/terminal-control/rust/src/driver/herdr.rs:306`: `fgos_process::control::spawn_with_fds(cmd, &[])` for the herdr client (waits for output).
- `packages/process/rust/src/containment/{linux,macos,windows,pgroup}.rs`: process-group containment of descendants; `windows.rs` uses `CommandExt` (creation flags).
- `packages/git/rust/src/driver.rs`: `git` calls (readers detached from blocking only in the sense of timeouts).
- `packages/process/rust/src/control.rs:94` `spawn_with_fds(cmd, fd_map)`: the one door that closes every descriptor from 3 up that would survive exec (Linux, macOS; `platform/windows.rs:142` stub returning an error). Everything above spawns through it.
- Tests only: `apps/fgos/tests/internal_lock_routes.rs`, `windows_*` tests.

So the nearest existing mechanism is `spawn_with_fds` in `fgos-process`; the Rust detached door should extend that door (one door principle), not add a second `Command` spawn path.

### Rules the Node door and `maintenance.mjs` enforce (the Rust door must copy)

From `src/cli/detached-child.mjs`:

1. The child is the same CLI entry run by the same executable with the caller's environment, so it resolves host, state root and writer identity exactly as the caller did. In Rust: the host's own exe (`std::env::current_exe`, or `FGOS_HOST_BIN` as the Node door's callers use) and `std::env::vars`, current directory set to the clone root. R14 (`d4a2a0d18`): under `npm run fgos:dev` a process whose `FGOS_HOST_BIN` points into the dev run directory keeps that directory alive, so the child must receive `FGOS_HOST_BIN` unchanged.
2. Own session: `detached: true` (setsid on unix; a creation flag on Windows). Rust: `pre_exec(setsid)`, as in `steps.rs`.
3. No IPC channel: stdio is exactly `['ignore', out, out]`. Rust: stdin null, no pipe.
4. No inherited descriptors: Node closes all but the three; Rust must use `spawn_with_fds(cmd, &[])` (which closes descriptors from 3 up) and open the log with `O_CLOEXEC`.
5. Log path: `logPath` opened in append mode, handed as stdout and stderr, closed in the parent in `finally`; no path means output discarded (`'ignore'`). Rust: same, with owner-only mode `0600` as `steps.rs` does.
6. Never throws: a spawn that cannot start returns `{pid: null, logPath, error}` (error code or message); the asynchronous `error` event is swallowed; `child.unref()`; the caller decides what a missing child costs. Rust: return `Result`/a value, no panic and no wait; never `wait()` the child; let it be reparented.
7. `windowsHide: true` (Windows only; the hook is not served on Windows).

From `src/event-store/maintenance.mjs` (policy around the door, which the Rust trigger must also keep):

8. Never fails its caller: every step is attempted separately, the first failure is returned as `{error}`, durable open batches stay on disk, the next trigger retries.
9. Outside every hot mutex: no spawn while a hot lock is held.
10. Lock and throttle: only tries the seal lock, never waits; the due test is `syncDue`: disabled when `sync.intervalSec <= 0`; due when no attempt exists, the last attempt was to another remote, or `now - last.time >= intervalSec`; any attempt counts, including one that failed before its push, so an offline machine tries once per interval.
11. `end` trigger only; a dispatched worker (`dispatched`) never pushes, only a session of the clone's owner does.
12. Seal order: seal due streams first (`sealIfDue` per stream, `sealAll` on shutdown), then hand the publish to the child; the child is `events sync --opportunistic --dir <root>`.
13. The child's own throttle (already in Rust): `packages/event-store/rust/src/sync.rs::sync_with_fs` with `opportunistic: true` first tries the seal lock and returns `busy` instead of waiting (`locks.rs`), claims the due window by writing `sync.json` before any network work (so a command that ends while the publish runs starts no second publisher), seals every stream, then fetches, verifies mirrors and publishes (`seal -> fetch -> verify -> push` order in one critical section). The Rust door therefore needs no new seal+push logic: it spawns `events sync --opportunistic --dir <root>` (the same child) and the Event Store enforces lock, claim and ordering.
14. `intervalSec` is the Event Store config value `eventStore.sync.intervalSec` (default 300 s), read through `readEventStoreConfig`; Rust has `fgos_config::provider::effective_value(dir, "eventStore.remote")` as the pattern in `identity_log.rs`.

For the fetch+ingest child (not in Node today), copy rules 1 to 11 and add its own due test on `last_fetch.time` (`sync_status(layout).last_fetch`), with the same try-lock behavior.

### Where it should live (one recommendation)

`packages/process/rust` (crate `fgos-process`), as a function beside `spawn_with_fds`, for these reasons:

1. `fgos-process` is already the spawn door for supervised children and already depends on `libc` and owns the platform split (`platform/{linux,macos,windows}.rs`); the closed-descriptor guarantee (rule 4) lives there and a detached door must not re-implement it.
2. The host binary has no `libc` dependency (`apps/fgos/Cargo.toml` lists it only under `[target.'cfg(unix)'.dev-dependencies]`), so a host-wiring door would force a new dependency or a second `unsafe pre_exec` outside the crate that owns such code (the mailbox crate's only `unsafe` is `record/sys.rs`; spec section 4 rule 4: "the mailbox adds none of these mechanisms again").
3. It is below everything: `fgos-mailbox`, `fgos-event-store` (which does not depend on `fgos-process` directly today, but via `fgos-git`), and the host can all use it; no upward import is created. The event store must not own it because the mailbox store crate does not depend on it (spec 4: never imports the Event Store).
4. Policy (when to spawn, the `sync_due` test, what to spawn, `dispatched`) stays in host wiring beside `mailbox_hook.rs` and `mailbox_verbs.rs`, exactly as the Node split keeps `detached-child.mjs` (mechanism) apart from `maintenance.mjs` (policy). Put only the mechanism in `fgos-process`: `spawn_detached(program, args, cwd, env, log_path) -> Result<Pid, SpawnFault>` that sets stdin null, opens the log append `0600` `O_CLOEXEC`, `setsid`, `spawn_with_fds(cmd, &[])`, never waits. Windows: return a typed `Unsupported` like the other windows stubs.

Rejected: a copy in `apps/fgos/src/wiring/` (needs libc, second mechanism); a copy in `fgos-mailbox` (forbidden dependency direction and an extra `unsafe` site); a new crate (no second consumer yet, one-door principle favors extending `fgos-process`).

Surprise: because the child is `events sync --opportunistic`, the existing Event Store logic already does the "seal then push" with lock, claim and ordering. Phase 02 can be smaller than the plan describes: the Rust door is the mechanism of rules 1 to 7 plus a host-side due test; no Rust seal+push implementation is needed for the send side. The receive side (fetch+ingest child) still needs a new command or mode.

## Q7. Layering: `RemoteMail` port in the mailbox store crate, host adapter in wiring, stream `project:mailbox`

Verdict: **yes, it satisfies the architecture manifest and spec section 4; it needs a spec edit (already in phase 01) and a decision on one wording.**

### Checked rules

`docs/architecture-manifest.json` (`architecture-manifest.v1`): `layers: entry, use-case, infra, domain, kernel`; `rules: one-directional-layer, domain-siloing`; `components: packaging-distribution`; `domains: coding, marketing`; `files` is a map of `src/**/*.mjs` and `bin/*.mjs` paths to layers (no `apps/`, `packages/` or `.rs` entry exists; the only mailbox mention is `src/setup/mailbox-limits.mjs`). Spec section 4 states the consequence: "`test/architecture.test.mjs` scans only `.mjs` files under `src` and `bin`, so the architecture manifest cannot express a Rust crate boundary (this answers question 7); no workspace-wide cargo dependency test is proposed in this slice." So no manifest rule can be violated by Rust crates; the Rust boundary is held by Cargo dependency sets and review.

Spec section 4 rules (`docs/platform/agent-mailbox/spec.md` lines 117 to 151):

- Rule 1: core imports no adapter and no tool name (held by `fgos-mailbox-core` depending on `serde` only).
- Rules 2 to 3: one authority per port; core takes time and ids as parameters, no I/O.
- Rule 4: add through the door, not beside it (L10): "Atomic file replacement goes through `durable-file`, mutual exclusion through `holder-lock` ... The mailbox adds none of these mechanisms again."
- Rule 5: "A port is added only when a second real implementation exists ... `MailStore` and `Replication` return as ports with section 15.2."
- Dependency direction: "In the first slice it imports `fgos-process`, `fgos-holder-lock`, `fgos-durable-file` and `fgos-identity` only ... It never imports the run supervisor, the Event Store, git, observe or any Workflow code. Nothing below it imports it; only `apps/fgos` wiring and tests do."
- Section 13 table: Event Store row "nothing in the first slice; ... never ... push to a Git remote in the first slice".
- Section 15.2: `MailStore` and `Replication` become ports at cross-machine time; `Replication`: `publish()`, `fetch()`, `nudge()`.

### Cargo dependency edges checked (current main)

- `packages/mailbox/rust/core/Cargo.toml`: `serde` only.
- `packages/mailbox/rust/store/Cargo.toml` (`fgos-mailbox`): `fgos-mailbox-core`, `fgos-process`, `fgos-holder-lock`, `fgos-durable-file`, `fgos-identity` (`default-features = false`, comment "the host provider is not needed"), `serde`, `serde_json`, `libc` (unix).
- `packages/event-store/rust/Cargo.toml`: `fgos-canonical-json`, `fgos-git`, `fgos-holder-lock`, `fgos-durable-file`, `fgos-identity` (`default-features = false`), `serde`, `serde_json`, `sha2`, `thiserror`.
- `packages/identity/rust/Cargo.toml`: features `provider` (default; pulls host-runtime), `directory` (pulls `fgos-canonical-json`, `fgos-convention`, `fgos-git`, `fgos-holder-lock`); always `fgos-durable-file`, `fgos-process`.
- `apps/fgos/Cargo.toml`: depends on `fgos-event-store`, `fgos-identity` (default features, so `directory` and signing are available), `fgos-git`, `fgos-config`, `fgos-mailbox`, `fgos-mailbox-core`, `fgos-process`, `fgos-holder-lock`, others.

### Does the plan's design hold?

- A `RemoteMail` port defined in `fgos-mailbox` (trait, with types owned by the crate; no Event Store, no Identity directory/signing types in its signature) and its adapter in `apps/fgos/src/wiring/` (beside `mailbox_identity.rs`, in the same way `identity_log.rs` is Identity's `EntryLog` adapter) adds no dependency edge to `fgos-mailbox`: the crate still imports only `core`, `process`, `holder-lock`, `durable-file`, `identity` (library, no features). The host already depends on both `fgos-event-store` and `fgos-mailbox`, so the adapter needs no new edge in `apps/fgos/Cargo.toml` (and a new `libc` dependency there only if the door is placed in the host, which Q6 advises against).
- No cycle: `event-store -> identity` and `mailbox-store -> identity` both point down; `event-store` does not depend on `mailbox`, `mailbox` does not depend on `event-store`.
- Signing with `fgos_identity::signing` in the host adapter: the host has the `directory` feature (default features), the mailbox crate does not and must not.
- Stream `project:mailbox` in a registered contract (`packages/mailbox/contracts/event-streams.v1.json`, embedded with `include_str!` in the host adapter like `identity_log.rs` embeds `packages/identity/contracts/identity-event-streams.v1.json`): not a manifest matter. It follows the Identity pattern exactly (that contract has scope `project`, `sealOnWrite:false`). Needs lead:ES approval for the registration, as the plan states.

### Things that would violate rules

1. Putting any of these in `fgos-mailbox` itself: a `fgos-event-store` dependency, `fgos_identity::signing` (requires the `directory` feature, which pulls `fgos-git`, `fgos-convention`; spec 4 and 5.1.1 forbid), `ssh-keygen`, or Git. Stay in host wiring.
2. A `RemoteMail` signature that exposes Event Store types (`StreamId`, `Positions`) or Identity types (`Signature`): it would make the crate depend on them in effect.
3. Rule 5 (port only when a second real implementation exists): section 15.2 itself says `MailStore`/`Replication` become ports "at this point", so a `RemoteMail` port is allowed by the spec, but the spec names the ports `MailStore` and `Replication` (`publish`, `fetch`, `nudge`), not `RemoteMail`. Align the name and the method set with section 15.2 in phase 01 or record why it differs. The second real implementation is the in-memory or test double used by the crate's tests plus the host adapter; say so in the spec edit.
4. Spec section 4's "Dependency direction" text says the crate imports "`fgos-identity` only" and "never ... the Event Store, git"; section 13's Event Store row says "nothing in the first slice". Both are first-slice statements that phase 01 must rewrite (as the plan says: "Spec sections 4 and 13 are updated in phase 01"), but note they currently contradict a mailbox crate that links Event Store types.
5. The spec also says the layout table row for `fgos-mailbox` says it "imports ... only". A hook that calls Event Store functions (for the `sync_status` due test) lives in `apps/fgos/src/wiring/mailbox_hook.rs`, which is host wiring and may link the Event Store; keep the call out of `fgos-mailbox/hook/shell.rs`.
6. Detached door in the mailbox crate (see Q6): second mechanism and a new `unsafe` site in a crate whose only `unsafe` is `record/sys.rs`.

## Surprises and unknowns

- `fgos convention path --kind report` alone is refused; `--type <agent-type>` is required.
- The Event Store already contains the seal-claim-fetch-publish child behavior; the Rust door only has to start `events sync --opportunistic` (Q6, rule 13).
- The host has no `libc` outside tests; this tips the door location to `fgos-process`.
- An `architecture.test.mjs` / manifest check cannot see any Rust boundary, so the layering in Q7 is held only by Cargo dependency sets and review. If the owner wants a mechanical check, that is a new decision (spec section 4 says none is proposed in this slice).
- Cold-process numbers vary by a factor of three to four with machine load (57 ms p50 quiet versus 98 to 139 ms loaded); the plan's 200 ms p95 should name the load condition it is measured under.
- A working tree file `plans/261021-1118-harden-low-layers-bottom-up/plan.md` shows as modified in `git status`; not from this work (another session).

## Verdict table

| Question | Verdict | Basis |
|---|---|---|
| Q1 append cost, p95 at most 200 ms | pass (quiet: 62 ms cold p95; loaded: 210 to 215 ms cold p95; growth and migrated-clone gaps stated) | n=100, 300 in-process; n=60, 40, 40 cold |
| Q2 hook plus detached child within 50 ms p95 | pass | spawn 0.2 ms (n=100 x 3); hook with stub p95 35.3 ms vs 36.8 ms without (n=120 each) |
| Q6 location and rules for the Rust door | pass | no existing detached Rust door; recommend `packages/process/rust`; 14 rules listed |
| Q7 layering | pass (yes) | manifest cannot express Rust; Cargo edges unchanged; spec 4 and 13 text needs the phase 01 edit and a port-name alignment |

Status: DONE_WITH_CONCERNS
Summary: Q1, Q2, Q6 and Q7 pass; append p95 is 62 ms on a quiet machine and about 210 ms under heavy load, the hook spawns a detached child in 0.2 ms, and the Rust door belongs in `packages/process/rust` next to `spawn_with_fds`. The migrated-clone append cost, the real-head hook path and the `sync.json` due check were not measured.
Concerns/Blockers: (1) the 200 ms p95 only holds on a non-saturated machine, and one confirming run on a `fgos setup`-installed, migrated clone is still needed; (2) the plan's `RemoteMail` name and method set differ from the spec 15.2 ports `MailStore` and `Replication`; (3) hook spawn storms inside the child's startup window are tolerable but should be decided.
Scope flags: none (no --yagni).
