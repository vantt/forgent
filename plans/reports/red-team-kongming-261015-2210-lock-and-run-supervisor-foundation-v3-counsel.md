<!-- Nguồn: agent kongming (Claude Fable 5.1), gọi in-process bởi Lead sau `fgos dispatch decide --for counsel --needs-soul --has-live-task-access` (mechanism in-process), 2026-10-15, trên bản nháp commit fb3b6113e. Bản sao nguyên văn câu trả lời cuối; thí nghiệm của kongming nằm ở /tmp/claude-1000/-home-vantt-projects-forgentX/bbe6155f-ff18-4e69-ad42-40abac4a35bf/scratchpad/kongming/ (f1-node-cloexec.mjs, f2-git-gc-leak.py, f3.rs). -->

# Kongming counsel — v3 lock / supervisor / terminal-control design (fb3b6113e)

## TL;DR

The pivot to kernel `flock` on an open file description is the right call and the probes are honest — but the draft's text is unsafe as written in three places where the probes quietly did the right thing and the prose does not: (1) nothing states that a lock description must be `FD_CLOEXEC` everywhere except the one spawn that borrows it, and Rust `std::process::Command` *does* inherit fd 3 into every child (verified) — so a Rust gate/supervisor built from the text leaks the attempt lock into the agent and every MCP server / background bash it spawns, and `adopt` then reports `running` forever; (2) `git commit` under a borrowed main mutex leaks the lock into git's own detached `gc --auto` / `repack` (verified) — the mutex stays held after fgOS "released" it; (3) "agent keeps running when the supervisor dies" is false if the supervisor owns the stdout/stderr pipes as it does today. **Approve with changes**; three mandatory changes at the end.

## Reframed problem

What is being decided: can every fgOS mutual-exclusion need be reduced to "who holds a kernel lock on a description", with ownership transferred only by fd inheritance, and can a per-attempt supervisor + gate make the controller optional for settlement — without reopening the liveness/GC/TTL problems v2 had. Non-goals (owner-fixed): no daemon for terminal placement, supervisor never knows pane identity, reaper = "is the attempt lock held", fenced epochs only for non-live runs.

The question one level up that the draft never asks: **the lock now follows the fd, so the correctness boundary moved from "who is alive" to "who has a copy of the description".** Every objection below that matters is a consequence of that boundary not being written down as a law.

## Objections, ranked by severity

### 1. CRITICAL — Lock descriptions leak into the agent tree; `adopt` and the reaper then wait on strangers

**Scenario.** Supervisor (Rust) is spawned with the attempt lock at fd 3 (9.4 step 3). It spawns the gate with the fd inherited (direct) or passes it via `SCM_RIGHTS` (terminal). The gate spawns the agent. Claude Code starts MCP servers, `nohup`/`&` jobs, a `herdr` CLI call; the agent finishes; gate writes `gate-exit.json` and exits. The MCP server is still alive and still has a copy of the description → kernel says "held". `adopt` step 1: `try-lock → held → running` (9.7). Reaper: `held → keep home` (9.8). The unit never resumes, the home is never finalized, credentials are never written back, and `fence` shows a holder that is not an fgOS process.

**Why the draft misses it.** 6.4 item 1 says "mọi fd khác của Node/Rust mặc định `CLOEXEC`" — true for fds Node/Rust *open*, false for fds they *receive*. The probes passed only because Python masks the leak: `p4_gate.py` does `os.set_inheritable(lock_fd, False)`, `socket.recv_fds` returns non-inheritable fds (PEP 446), `subprocess` defaults to `close_fds=True`. None of that is in the text, and the Rust rewrite (6.2/6.3) will not get it for free.

**Evidence.** Experiment F3 (scratchpad `f3.rs`): a Rust binary that only does `Command::new("sh").arg("-c").arg("ls -l /proc/self/fd | grep -c f3.lock")` reports `1` when its parent passed fd 3 → Rust std inherits non-CLOEXEC fds ≥ 3. Experiment F1: Node `fs.openSync` fds are `O_CLOEXEC` (fdinfo flags `02100001`), and only an explicit `stdio: [...,fd]` mapping passes them — so the Node side of the claim holds; the Rust side does not.

**Smallest fix.** Add a holder-lock law: *a lock description is `FD_CLOEXEC` at all times; the only non-CLOEXEC moment is inside the one `spawn` call that borrows it, by explicit fd mapping (`pre_exec` dup2 or `command-fds`); any receiver (inherited fd 3, `SCM_RIGHTS` with `MSG_CMSG_CLOEXEC`) sets `FD_CLOEXEC` before any other syscall.* Add a test in 6.2: after the agent starts, scan `/proc/<agent-pid>/fd` (and one grandchild) and assert the lock inode is absent. Add doctor `lock-holders` (fdinfo scan) so the failure is diagnosable when someone breaks the law.

### 2. HIGH — Borrowed git commits leak the main mutex into git's own background children

**Scenario.** Land/checkpoint borrows the main mutex into `git commit` (6.4). Git 2.34 runs `git maintenance run --auto` → `git gc --auto`, which *daemonizes* (closes 0-2 only) and inherits fd 3. The fgOS transaction closes its fd — but `git gc` + `git repack` still hold the description. In this repo (93 521 packed objects, 473 MB pack, 1 284 loose, `gc.auto` default 6700) an auto-gc runs tens of seconds. During that window: the pre-commit hook refuses every human commit ("fgOS is writing the main checkout right now"), the next land blocks, `fence` would list `git repack` as the holder, and an operator will be tempted to kill it. Same path for any hook that backgrounds a process.

**Why the draft misses it.** 6.4 item 6 "cha phải đợi con" assumes git's process tree ends when `git commit` returns. It doesn't.

**Evidence.** Experiment F2 (`f2-git-gc-leak.py`, git 2.34.1): with `gc.auto=1`, after `git commit` returned and the holder closed its fd, the lock was still held by `/usr/lib/git-core/git gc --auto --quiet` and `git repack -d -l -q …`; became free 52 ms later (tiny repo). With `gc.auto=0`: no holders.

**Smallest fix.** The borrow API is the only place that maps the fd into git; have it add `-c gc.auto=0 -c maintenance.auto=false` (or `GIT_CONFIG_COUNT/KEY/VALUE`) by construction, and add a test fixture with `gc.auto=1` and one loose object under `objects/17/` asserting "lock free immediately after close". Document that git hooks inherit the description and must not background anything.

### 3. HIGH — "Agent keeps running when the supervisor dies" is only true if the gate owns the agent's IO; in `terminal` mode it degrades to "idle until hard ceiling, then settled as timeout"

**Scenario A (direct).** 9.1 makes the supervisor the owner of capture ("capture stdout/stderr vào file"); today's shape is `stdio: ['ignore','pipe','pipe']` (`src/runner/dispatch/detached-run-supervisor.mjs:615`). If the Rust supervisor keeps it, supervisor death closes the pipe read end → the agent's next write gets `EPIPE`/`SIGPIPE` → a Node-based CLI typically crashes → gate-exit says `exitCode≠0` → adopt settles `failed` and you *do* pay the model again on retry. The policy in 9.3 silently fails.

**Scenario B (terminal).** Supervisor dies after the brief is delivered. Agent finishes and writes `outbox/result-1.json`, then sits at its interactive prompt. Nobody runs agent-protocol, so nobody sends the exit command; the gate waits until `deadline + grace` and kills the tree with `stoppedBy: hard-ceiling`. Adopt then has a `gate-exit` that looks like a timeout and an outbox that looks like success. 9.7 does not say which wins. Cost: a full deadline of wall-clock per such attempt — against priority #2 "release con người".

**Why the draft misses it.** The P4 probe gate already does the right thing (`p4_gate.py`: `dup2(out,1); dup2(err,2)` "capture to files, never a pipe to the supervisor") — the text contradicts the probe. The failure table row "Supervisor chết → chạy tới xong" is only proven for a `sleep` worker.

**Smallest fix.** (i) Gate owns agent IO: capture files and the brief file are opened by the gate from paths in GO; the supervisor only tails. Write this into 9.3. (ii) Adopt rule: *outbox result present ⇒ settle from outbox regardless of `stoppedBy`*. (iii) For `terminal`, either accept the wall-clock loss explicitly, or give the gate one orphan branch: on supervisor-socket EOF, poll the outbox path (already in GO); result present + short grace → terminate tree. That is one `if`, not a second agent-protocol. If you will not add it, pick fail-stop for `terminal` and keep "runs on" only for `direct` — one policy per mode is still KISS; a policy that is only true in one mode is not.

Also note: `PR_SET_PDEATHSIG` is delivered when the *thread* that forked exits — a multithreaded Rust gate must spawn from the thread that lives as long as the gate (or use `pre_exec` in a single-threaded gate), and it is cleared across a setuid exec (bwrap on some distros → use `--die-with-parent`). On `kill -9` of the gate only the agent root gets the signal; descendants are orphaned to init, which is fine for the lock (no copy, after fix 1) but the table row "Gate dies → PDEATHSIG giết agent" should say "agent root; descendants orphaned" and the gate should publish the agent's `pgid` at spawn so the supervisor/adopt can `killpg`.

### 4. HIGH — Tombstone cutover order breaks the activation door itself

**Scenario.** 4.3 tombstones `main-checkout.lock`. 4.4 (lock.rs) is "song song sau 4.2". If 4.3's cutover runs before 4.4 is activated, every `fgos activate`/`fgctl init` path calls `check_main_checkout_lock` (`packages/distribution/rust/src/init.rs:805, 847, 886`) → `std::fs::read_to_string(dir)` → `EISDIR` → `Io(_)` → `?` → activation refused. Fail-closed, yes — but the thing that failed closed is the only door through which the fix can be activated. Recovery = manual tombstone removal under quiescence (6.8 step 5), by hand.

**Evidence.** `packages/distribution/rust/src/lock.rs:56-73` (read_to_string, no directory branch); init.rs call sites above.

**Smallest fix.** Make "4.4 lock.rs lands and is the *activated* release" a hard predecessor of the main-checkout cutover in 4.3, on the critical path, not parallel. Also say plainly in 6.8 that `lockProtocolFloor` is UX only (an old fgctl doesn't know it); the tombstone is the real guard.

Other tombstone holes checked, all fail-closed: `events.lock` → `linkSync` gives `EEXIST`, then `readFileSync(dir)` throws `EISDIR` uncaught (`src/state/events.mjs:304-319`); `.githooks/pre-commit:502` calls `inspectMainCheckoutLock` → `EISDIR` propagates → non-zero exit → commit refused; `forceReclaimAmbiguousLock` → `unlinkSync(dir)` → `EISDIR`; no `rmSync(..., recursive)` near any lock path. One cosmetic gap: old releases die with a raw `EISDIR` stack, not a named error — acceptable under the single-user policy, but say so.

### 5. MEDIUM-HIGH — "Never delete a lock file" + per-attempt/per-run/per-cwd locks = unbounded growth, and the adopt scan at every `fgos run` becomes seconds

**Scenario.** 6.1: lock files are created once and never deleted. Attempt locks (9.4), run-control fenced-leases, per-cwd dispatch leases. This repo already has 1 552 assignment dirs / 1 880 run dirs (read-only count). 9.7 says adopt runs "quét đầu mỗi `fgos run`" with a try-lock per attempt through the Rust helper at ~1.4 ms p50 → ~2.6 s added to every `fgos run`, growing. Deleting flock files naively is the classic unsafe pattern (A opens inode 1, B unlinks + recreates inode 2, C locks inode 2 → two holders).

**Smallest fix.** (a) Put the attempt lock *inside* the run directory (`runs/NN/attempt.lock`) so it dies with the run dir under whatever archiving already exists; (b) the primitive does the standard post-acquire check `fstat(fd).ino == stat(path).ino` else close+retry — two lines that make deletion safe if ever needed; (c) adopt scans only runs without `result.json` and performs all try-locks in **one** Rust route call (`fgos internal lock-scan --paths-from stdin`) — µs per lock, one exec.

### 6. MEDIUM — The rank table (6.5) contradicts the actual acquisition order; enforcement is production behavior, so it will throw late

**Scenario.** `assignment-runner.mjs:2219` acquires the per-cwd lease (rank 30) before the attempt lock (rank 15) can exist — a 30→15 acquisition. Land holds slot (20) then main (50) and may still need `worktree-admin` (40) for post-land worktree cleanup. With "chỉ acquire hạng lớn hơn mọi hạng scope đang giữ" enforced by throwing, the first real run after 4.3 fails on ordering, not on a race.

**Smallest fix.** Derive the table from a trace of the real sequence (one env-gated `FGOS_LOCK_TRACE` log for one release), ship rank enforcement as warn-only for that release, then throw. Renumber attempt above cwd now.

### 7. MEDIUM — Hot path merge: re-entry today is a 5 s self-deadlock, and the "exec under hot lock" guard as specified cannot be complete

**Facts.** `claims.lock` is nested inside `events.lock` at `src/state/store.mjs:1148` and `src/runner/claim-port.mjs:358`, and taken standalone at `bin/fgos.mjs:4152,4165`, `claim-port.mjs:270`. `events.lock` re-entry = `EEXIST` → own pid alive → spin until `EVENTS_LOCK_TIMEOUT_MS` → `lock-timeout` (`events.mjs:325,381`). The repo has 150 raw `spawn*/exec*` call sites in 54 files; "mọi helper spawn của fgOS đi qua một hàm kiểm" is a promise 150 edits away, and one missed site is a silent gap.

**Smallest fix.** The depth counter you already add for the exec guard should also throw `hot-lock-reentry` *immediately* (no timeout). Implement the exec guard by wrapping `node:child_process` (`spawn`, `spawnSync`, `exec*`) once at the `bin/fgos.mjs` entry — one place, every call site, production behavior, no routing discipline required. Keep the claim/release functions `stateTx`-aware exactly as the draft says.

Platform note: the hot-mutex dead-holder judgement requires `startTime` (5.1); where it is unavailable the answer is `unknown` → never reclaim → a crashed holder leaves `state` held until a human runs `fence`. Today's code reclaims on `kill(pid,0)`. Either declare the interim Linux-only or keep a `{bootId, pid-alive}` fallback for the interim on other platforms.

### 8. MEDIUM — After-receipt steps: layering is fine, double-settle is already fenced, but the envelope is under-specified on exactly the fields that make it safe

**Verified.** `commitRunSettlement` (`src/runner/dispatch/settlement.mjs:411-480`) is CAS-fenced by `settleRunControl` and `publishImmutableProof`; same `{controlEpoch, controlToken}` ⇒ `alreadySettledByUs` ⇒ rehydrate, different ⇒ `run-control-superseded` + `result.superseded.json`. Credential write-back is bounded by `CREDENTIAL_KEEP_MAX_ATTEMPTS` and ends with `rmSync` of the home (`confinement/cleanup.mjs:245-280`) → rerun is a no-op. So supervisor-settle vs adopt-settle cannot double-write *if* the supervisor's step presents a token.

**Under-specified.** Which token the `settle-attempt` child uses (the controller's admission token → must travel in the 0600 side file); that the controller stops settling itself (`assignment-runner.mjs:1884, 2742`) or shares the token; what cwd/env/binary the step runs with (the supervisor scrubs env for the agent — the step needs `FGOS_STATE_ROOT`, project root, and the *same-release* payload path, which may be deactivated hours later); one try or retries. Fix: a fixed envelope field list (`hostBin`, `payloadRoot`, `cwd`, `env`, `controlToken`, `stepTimeoutMs`) and the rule "one try; failure leaves the attempt for adopt".

### 9. MEDIUM — The Windows row is wrong, not merely unproven

Node has no `LockFileEx`; the helper-at-fd-3 trick depends on POSIX fd inheritance, and libuv passes extra stdio handles on Windows through the CRT `lpReserved2` block, which Rust std does not read. So on Windows neither borrow *nor* mutex/lease works by this design. Say `unsupported`, and make doctor `lock-kernel-semantics` fail there instead of "mutex/lease chạy".

### 10. LOW — Hook "borrower" check has a benign loophole

`flock(3, LOCK_EX|LOCK_NB)` on an inherited description also succeeds when **nobody** holds the lock — the hook then *acquires* the mutex and releases it at exit while git keeps writing refs (same window as today's single try). Not exploitable by accident (needs `FGOS_LOCK_FD` + matching inode), but the hook should only call itself `borrower` when the env var names the slot *and* `fstat` matches *and* NB succeeds; otherwise it does its own fresh-description try once and never claims borrow.

### 11. Terminal-control option (a) — the failure table holds, with two additions

Same-process ordering: two attempts of one group can race `split` against a sibling's `release(close)` of the anchor pane inside one coordinator — serialize per `groupKey` in-process (one Map of promises). `allocationGrace` must exceed the supervisor-binding timeout, or the scan closes the pane while a slow supervisor is about to `launch` (not fatal — `not-started` — but noisy). The "supervisor never knows pane identity" decision is honoured consistently (key → allocation record → pane); fine.

### 12. KISS cuts and stranger-redesign gaps

Cut: `fenced-lease` as a *new kind* — with a kernel lock never taken from a live holder, the epoch protects nothing on local fs; keep `run-lock.mjs` CAS as it already exists, don't design a kind around it. Cut the per-lock "record hiển thị" (a second writer with its own staleness); fdinfo scan already answers "who holds". Keep `process-control` minimal: pidfd signalling only for `fence`; gate + PDEATHSIG + subreaper covers the run path.

Stranger must redesign unless specified: the quiescence scan's definition of "process của workspace" (`cmdline`+`cwd` misses `--cwd` runs and staged-release node paths — use `/proc/*/environ` `FGOS_STATE_ROOT` + membership of any worktree of the repo); gate tty handling under `pane run bash script` (`herdr-round.mjs:1876`, exec at `:113`) — `tcsetpgrp` needs `SIGTTOU` ignored and the shell job-control interaction stated; `direct` stdin for the brief after supervisor death (file, not pipe); the short runtime dir for `sun_path` on macOS; whether the controller closes its attempt fd right after `supervisor-binding.json` (it must — a hung controller that "keeps it to observe" is a live holder that makes adopt say `running`; T8 is precisely about controllers that hang).

## What to avoid

- Shipping 6.2 with the Python probes as the only fd-passing evidence. Port the three fd tests to the real Rust routes before the first writer.
- Treating "held" from the kernel as "an fgOS member is alive". After fix 1 that becomes true; before it, it is "someone has a copy".
- Enforcing rank order by throwing before one release of traces.
- Letting the controller keep the attempt fd "for observation".

## Alternatives & trade-offs

- **Fail-stop everywhere (gate kills agent on supervisor EOF)** — simpler, loses paid model work; probe exists (App. B3). Acceptable if objection 3(iii) is refused; worse for `direct`, where runs-on costs nothing.
- **Borrow via a token the hook validates against the holder's pid (v2 shape)** — avoids the git-gc leak but reopens B3/A4. Not worth it; `gc.auto=0` on borrowed calls is cheaper.
- **Era-ledger (App. B1)** — proven, but the kernel lock removes the whole class; keep only as fallback for NFS/Windows, don't build it now.

## Work checklist (for the plan writer)

1. Holder-lock spec: CLOEXEC law + receiver rule + leak test (`/proc/<agent>/fd`) + doctor `lock-holders`.
2. Borrow API applies `-c gc.auto=0 -c maintenance.auto=false`; fixture test with `gc.auto=1`.
3. 9.3: gate opens capture + brief files from GO; supervisor tails. Adopt: outbox wins over `stoppedBy`. Decide terminal-mode orphan branch vs fail-stop.
4. Roadmap: 4.4 `lock.rs` (tombstone-aware / try-lock) activated **before** 4.3 main-checkout cutover.
5. Attempt lock inside run dir; ino re-check in primitive; adopt scan bounded (no `result.json`) + one Rust route for all try-locks.
6. Rank table from trace; warn-first; attempt > cwd.
7. Re-entry throws immediately; exec guard by wrapping `node:child_process` at entry.
8. Envelope field list + token travel + controller stops self-settling.
9. Windows → `unsupported`; doctor fails `lock-kernel-semantics`.
10. Controller closes attempt fd after binding; gate publishes agent `pgid`; PDEATHSIG thread/setuid notes.

## Success metrics

- Leak test green on real Rust routes; `fence` never lists a non-fgOS process as holder in a week of dogfood.
- Hook never refuses a human commit while no fgOS transaction is in flight (gc window gone).
- Controller SIGKILL and supervisor SIGKILL in `direct` both end with `result.json` from the first attempt, zero re-dispatch.
- `fgos run` startup delta from adopt scan < 50 ms at 2 000 runs.
- Zero `lock-order` throws in the warn-only release.

## Verdict

**Approve with changes.** The three I would insist on before any writer lands:

1. **CLOEXEC law + git `gc.auto=0` on borrow + leak test** (objections 1, 2) — without these the kernel-lock claim "process chết thì kernel nhả" is false in production.
2. **Gate owns agent IO; adopt prefers outbox; explicit terminal-mode policy** (objection 3) — otherwise the headline supervisor guarantee is only true for `sleep`.
3. **Cutover ordering (lock.rs before main-checkout tombstone) and attempt lock inside the run dir with a bounded one-exec adopt scan** (objections 4, 5) — otherwise the first cutover can lock out `fgos activate`, and every `fgos run` pays for history.

## Assumptions

- Linux is the only production platform today (high; `docs/specs/distribution.md` mentions macOS/win32 but no probe exists) — if macOS is live, objection 7's platform note becomes medium-high.
- The Rust supervisor/gate will use `std::process::Command` or tokio (high) — the inheritance result holds for both.
- `git` ≥ 2.30 with default `gc.autoDetach` on dev machines (high; measured on 2.34.1).
- Attempt/run counts in the main checkout's `.fgos/assignments` (1 552 / 1 880) are representative of a dogfood workspace (medium) — if archiving already prunes them, objection 5 drops to medium.
- Runtime note: this consult ran on Claude Fable 5.1 per the runtime note; experiments live under `/tmp/claude-1000/-home-vantt-projects-forgentX/bbe6155f-ff18-4e69-ad42-40abac4a35bf/scratchpad/kongming/` (`f1-node-cloexec.mjs`, `f2-git-gc-leak.py`, `f3.rs`); no repo files or `.fgos` were touched.
