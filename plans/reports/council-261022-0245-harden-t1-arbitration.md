# HARDEN T1 arbitration: holder-lock, session identity, convention, state root, hot mutex

Big lead `forgent-a8`, 2026-10-22 03:00 (Asia/Saigon), main `63645ef3c`. Inputs:
- [brief](council-261021-2338-harden-t1-council-brief.md) and [baseline](research-261022-0138-harden-t1-baseline.md);
- the four seats: [correctness](council-261021-2338-harden-t1-seat-correctness.md) (codex), [speed](council-261021-2338-harden-t1-seat-speed.md) (Claude), [simplicity](council-261021-2338-harden-t1-seat-simplicity.md) (Claude), [red-team](council-261021-2338-harden-t1-seat-redteam.md) (gemini).

The big lead re-checked the evidence the verdicts below rest on:
- RT-M1 reproduced: a Node process run from the checkout gets `process-door-not-shipped`.
- These red-team findings were read at the cited lines:
  - `migrate.mjs:8-9,70` imports `checkStopped` and `workspaceListing`;
  - `assignment-runner.mjs:2432` uses `domainEndpoint()`;
  - `git-checks.test.mjs:10` imports `checkLockFences`;
  - `registry_rows.rs:28-30` asserts the fence columns.
- `.githooks/pre-commit` is wired only in the fgOS repository itself: mdview has no `core.hooksPath`.
- `lock.predecessorKillWaitMs` is set to its default 2000 in both the global and this project's config, and nowhere to anything else.

## 1. Outcome in one paragraph

T1 puts the holder-lock behind the in-process door that T0 opened. Every Node lock operation today spawns the host: 1.36–1.42 ms, while the lock itself costs 1 µs and an in-process acquire plus release costs 28 µs. After T1 none of them spawns on Linux or macOS. Windows keeps its lock-hold helper, because the supervisor's domain handover depends on it. The writer identity moves to the same door after SEAT lands.

Six things are deleted or merged:
- the cutover fences, which have outlived their release;
- the Node `/proc` holder scan;
- the Node two-process probe;
- the duplicate `/proc/<pid>/stat` parser in the identity crate;
- the private copies of the state-root formula;
- four of the nine doctor rows (9 rows become 5).

Five defects found by the council are fixed:
- an `unknown` hot-mutex holder times out without its named reason;
- the redundant bytes check in `reclaimDeadHolder`;
- T0-R1 (canonical JSON through the door now takes a string);
- T0-R2 (a named `mode` error);
- R3 (containment errors now carry bwrap's own stderr line).

Expected size: Node −1 100 to −1 350, Rust +80 to +150, tests −1 300 to −1 600. That pays back T0's +150 many times, so T0 and T1 together end well below 0. The red-team caught three proposals that would have broken live behaviour:
- removing the route fallbacks would break every `git commit` in this repository;
- an unconditional release settle would kill the live attempt gate;
- deleting the Windows helper would break every mutating Windows run.

Each now has a constraint in the shape below.

## 2. Part A: target shape per component (for owner approval, then into each spec)

### 2.1 Holder-lock (crate, Node facade, `fgos lock fence`)

1. **Authority.** Who holds which resource as the kernel sees it: kernel locks on open file descriptions, the registry, lock order in a scope, the predecessor rule, the borrow drain, release settlement, and the machine state root.
2. **Contract and ports.**
   - The Rust port is unchanged: `acquire`, `release`, `run_borrowed`, `probe`, `holders`, `guarantee`, `validate`, `clear_domain`.
   - The Node facade exports are unchanged: `acquireSync`, `acquire`, `probe`, `lockHolders`, `runBorrowed`, `spawnWithLocks`, `checkBorrowedDescription`, `createLockScope`, `resolveLock`, `resolveStateRoot`, `guaranteeFor`, and `HolderLockError` with today's codes.
   - **New:** one `holderLock` namespace on the combined addon (`packages/git/node-addon`, which already links `fgos-holder-lock`). It works on the description Node opened, as the Git loan already does (`port.rs:311`). Its calls:
     - `lockFd(fd, mode, wait, killWaitMs, predecessorKinds)`;
     - `probe(path)`;
     - `guarantee(dir)`;
     - `drainChild(fd, childPid, killWaitMs, protectedRoots)`, with owner `std::process::id()`;
     - `clearDomain(fd, path, killWaitMs)`;
     - `releaseFd(fd, killWaitMs)`;
     - `holders(path)`, returning a process tuple per holder and an `origin`;
     - `twoProcessProbe(dir)`.
   - Errors keep their names; the door's `process-door-*` refusals map to `lock-driver-unavailable`.
   - Three constraints the red-team found are part of the shape:
     1. `release()` settles through `releaseFd` for an exclusive handle that was never handed over. A handle passed to `spawnWithLocks` is marked handed-over and its release stays a plain close, because the supervisor and gate still hold the description (RT-M2).
     2. A full `CreationMark`, including `last_pid`, is captured per acquire in process and advanced with the one-proof lag. No directory-cached `reachFloorTicks` and no `last_pid: None` across the door (RT-M4).
     3. `holders(path)` uses `port::holders` (the fdinfo scan) and returns process tuples, so `lock-fence` drops its second scan and `observe` loop (RT-M7). Speed's `/proc/locks`-stamp shortcut is rejected: `/proc/locks` is not an atomic snapshot, its device number differs on btrfs and overlayfs, and after `spawnWithLocks` it names the controller.
3. **Rust/Node boundary and Node budget.**
   - Rust decides everything the facade spawned the host for. Node keeps:
     - the description's lifetime: open, `WeakMap`, stdio mapping for `runBorrowed`/`spawnWithLocks`, and the handed-over mark;
     - `LockScope`;
     - registry path filling (pure, 1.3 µs; Rust has no `cwdDevIno` and refuses hot-mutex rows, see D-9 of the red-team);
     - `fgos lock fence`/`lock-status` presentation.
   - Routes that keep a process boundary:
     - `lock-fd --borrowed-check`, for the git hook child;
     - `quiesce-scan`, for `fgctl` and `events migrate`;
     - `lock-borrow-vectors`, for doctor and `fgctl`;
     - `lock-hold`, for Windows;
     - `state-root`, for the checkout channel (see §6 Q2).
   - **Node budget:** `src/holder-lock/` ≤ 1 650 lines (today 2 499, of which `hold-transport.mjs` 498 stays).
4. **Delete list.**
   - The `lock-fd` route modes the door replaces: `--try`, `--wait-ms`, `--shared-try`, `--guarantee`, `--probe`, `--predecessor-state`, `--drain-child`, `--clear-domain`. Their Rust bodies move into the addon file; `apps/fgos/tests/internal_lock_routes.rs` and `test/rust-host/internal-routes.test.mjs` are rewritten to the routes that remain.
   - The Node route runner for those modes (`driver.mjs:84-201`), and the Node `/proc` holder scan (`driver.mjs:272-348`).
   - The Node two-process probe (`holder-lock-checks.mjs:92-221`), replaced by the door's `twoProcessProbe`.
   - The Node pid classifier (`holder-lock-checks.mjs:46-48,401-461`): the classification moves into `fgos-holder-lock` (layer 1), **not** `fgos-process`, which must not learn lock and payload names (red-team on S-E4).
   - `fences.mjs`, with the corrections in §4 D4.
   - Instruction text: holder-lock spec §2's "Node cannot call flock" paragraph, the §10 route table rows, and §12–§13 fence prose.
5. **Doctor rows kept:**
   - `lock-kernel-semantics`, which absorbs `lock-predecessor-kill-wait` and `state-root` as lines;
   - `lock-borrow-vectors`;
   - `lock-holders`, which absorbs `lock-record-unreadable`.

   The `lock-fences` row goes with its mechanism. Fix `lock-dirs` stays.
6. **Size target.** Node −1 000 (±150), Rust +100 (±50), tests −1 100 (±150).

### 2.2 Session Identity

1. **Authority.** Which writer this process is (`{id, source}`), the attempt writer id, the launcher scrub.
2. **Contract and ports.**
   - Rust is unchanged.
   - The addon gains `sessionIdentity.resolve(pid, fgosDir)` and `sessionIdentity.mintAttempt(id)`, about 30 lines over `resolve` and `mint_attempt_writer_id`.
   - The verb `fgos identity` and the route `internal identity mint-attempt` stay for people, for the doctor's per-binary probe, and for the git hook (§6 Q2).
   - `WriterIdentityError` keeps `host-missing`, `host-version-mismatch` (doctor probe) and `invalid-attempt-id`. Once the resolver no longer spawns, `timeout`, `host-error`, `bad-output` and `identity-in-lock` have nothing producing them and are retired.
3. **Boundary and budget.** `session-identity.mjs` ≤ 70 lines and 4 exports: `resolveWriterIdentity`, `mintAttemptWriterId`, `probeIdentity`, `WriterIdentityError`. **This waits for SEAT**, which edits this file.
4. **Delete list.**
   - The exec, the two caches, `classifyExecError` and the `heldLocks` counter. After SEAT there is one counter, `hotLockDepth()` in `hot-guard.mjs` (S-E6).
   - `test/state/identity-before-lock.test.mjs`, whose behaviour is removed with the exec.
   - `proc_tree.rs` `parse_proc_stat`/`ProcFsTree` (S-E10). `Relation` in `fgos-process` gains `session` and `tty_nr`; their tests go in `facts.rs:562-581` (red-team's correction).
5. **Doctor row kept:** `writer-identity-resolvable`.
6. **Size target.** Node −185, Rust +5, tests −300.

### 2.3 Convention

Unchanged on main: it is cold (hook, doctor and agents) and keeps its route. Its 21-line client stays. RT-M9 removes a duplicate RFC 3339 offset parser in `operations.rs:280-312` in favour of `fgos-host-runtime`'s, which is about −25 Rust lines. Spec §5's sentence on the local offset is corrected to the code, or the code moves to `civil_time` (S-F5a): the lead picks whichever is smaller. SEAT's `seat-id.mjs`/`definition-names.mjs` are reviewed after SEAT lands (see §5 H-items). Doctor row: `convention-conformance`.

### 2.4 The one state-root and `.fgos` lookup door

1. **Authority.** The machine root is `fgos_holder_lock::state_root`, pinned by the host as `FGOS_STATE_ROOT`. The repository `.fgos` is `fgosDirFromRoot` in `src/runner/paths.mjs`, and the main checkout root is Git Inspect's.
2. **Shape.**
   - `resolveStateRoot` reads the pin, else asks the route once per process (the checkout channel, see §6 Q2).
   - Every private copy of either formula imports the one door:
     - `attestation-store.mjs:167`, which ignores `FGOS_STATE_ROOT` (RT-M5);
     - `fgos-file-registry.mjs:69`, `main-fgos-checkpoint.mjs:22`, `holder-lock-checks.mjs:57` `fgosDirOf`, `runtime-inspection.mjs:19`, and `friction-client.mjs:33`.
   - The ~90 literal joins onto an already-resolved root stay, because churning them moves no decision.
3. **Doctor:** the `state-root` conditions live in `lock-kernel-semantics`.
4. **Size target.** Node −25, Rust 0.

### 2.5 The hot mutex (review only; stays in Node until WORK, owner decision 3)

T1 fixes these defects in the T0/T1 range `hot-lock.mjs:1-226`:
- S-F1;
- HL-N8/N9;
- the two Windows paths T1-CF-01 and T1-CF-02.

It touches nothing in `:227-331`, which is WORK's. WORK gets from T1:
- the lock door (the reclaim lock is then the only contended-path call, and no longer a spawn);
- the identity door (no `identity-in-lock` rule to carry over);
- one depth counter;
- HL-F1's breakdown, and the proposed "write the self record once per process" addition, for WORK to take or leave (§6 Q5).

## 3. Part B: accepted findings (go into the T1 sub-plan)

| Id | Severity | What | Fix shape (as arbitrated) | Owning proof |
|---|---|---|---|---|
| S-1 (+RT-M2, RT-M4, RT-M7) | High | every Node lock op spawns the host | the `holderLock` door, §2.1 | `facade-multiprocess.test.mjs` rewritten to assert no child process; Rust `multiprocess.rs` keeps the kernel cases; one red case for the handed-over release |
| RT-M1 | High | moving to the door from a checkout process breaks every `git commit` here | the hook becomes a cold host client (§4 D2) | a hook test that commits in a fixture repo through the activated host |
| RT-M2 | High (design constraint) | unconditional settle kills the live gate | handed-over mark | red test: `spawnWithLocks` then `release()` leaves the child alive |
| RT-M3 | High (design constraint) | in-process `LockFileEx` breaks `declare-domain` and async borrow | keep `hold-transport.mjs` and `route/hold.rs` | existing `windows_lock_hold_route.rs` |
| S-F1 | Medium | `unknown` holder times out without `lock-record-unreadable` and says "retry" | keep the last verdict; set reason and the fence next step; drop the test exemption at `hot-lock-multiprocess.test.mjs:218-220`; also remove the dead argument at `hot-lock.mjs:310` | the same test without the exemption |
| HL-N8/N9 | Medium | two byte compares cover for each other | speed S-6: `reclaimDeadHolder` reads once, checks bytes **and** `judge === 'dead'`, unlinks; `unlinkRecordIfUnchanged` serves `clearHotRecord` only | P-N9 and P-N8 (speed S-6 wording), retiring the prose line in `hot-lock-contract.test.mjs:30` |
| T1-CF-01, T1-CF-02 | Medium (inferred, Windows) | `EPERM`/`EBUSY` read as absent spins without a deadline; release exhaustion returns as success | a retryable-read result under the same deadline; `hot-lock-release-stuck` named error | `windows-hot-lock.test.mjs`, run on the cross-platform workflow |
| S-2/S-E2 | Medium | Node `/proc` holder scan | `holders(path)` through the door, `port::holders` | `lock-holders` row tests |
| S-3 | Medium | identity is a 1.4 ms spawn per process | identity door after SEAT | one door wiring case in `session-identity.test.mjs` |
| S-8/S-E3 | Medium | Node copy of the two-process probe | door `twoProcessProbe` (speed's shape: no new route flag) | `semantics.rs:177-190`, one row wiring case |
| S-E1 | Medium | fences past their release | delete, with §4 D4 | the Rust tests simplicity's D5 names |
| S-E4 | Medium | Node pid classifier | Rust classifier in `fgos-holder-lock`, returned as `origin` | one Rust test of the classifier; Node rows keep one wiring case |
| S-E10 | Medium | second `/proc/<pid>/stat` parser | `fgos_process::facts::relation_of` | `facts.rs:562-581` with `session`/`tty_nr` |
| RT-M5 | Medium | attestation store ignores the state-root pin | `resolveStateRoot().stateRoot` | a pinned-root case in the attestation store test |
| RT-M11 / R3 | Medium | bwrap's mount refusal reaches the user as "user namespaces unavailable?" | `BwrapPidns::spawn_in` keeps bwrap's pre-gate stderr and puts the line in the error | a containment test with a refusing mount (fixture namespace, as `b36a8e6ad` does) |
| T0-R1 (S-4/S-C2) | Medium | N-API object marshalling costs 85% of canonical JSON | string-in `canonicalJson(text)`, with the red-team's validating replacer so `[1, undefined]`, holes and `NaN` still throw `canonical-json-not-json`; byte equality re-proven on the corpus script | `native-load.test.mjs:74` unchanged; `canonical.v1.json` vectors |
| T0-R2 (S-F2) | Low | omitted `mode` gives raw `NumberExpected` | `durable-file-mode-invalid` with `installed: 'none'`, integer in 0..0o7777 | one case in the door's owning test |
| RT-M6, RT-M8, RT-M10 | Low | `group_members` third stat parser; `v1Path`-only template branches; Windows borrow masks `LeftoverNotKilled` | delete; delete with `v1Path`; match `emptied` first | existing Rust tests; one Windows case |
| S-13 | Low | the kill-wait config is read twice per acquire | per §6 Q4 | — |
| S-G1 | Low | nine rows for three components | 9 → 5 (§2.1, simplicity's table, red-team D-4) | rows' tests re-titled, no case dropped |
| T0 size debt | — | duplicate phase-1 red tests | retire simplicity's list, with red-team's correction: `run-lock-identity.test.mjs` keeps `:35` and `:45` and retires only `:60` | named in the sub-plan per test |

**Rejected** (verification source in brackets):
- speed S-2's `/proc/locks` holder shortcut (red-team §2, spec §118);
- S-9, deleting the Windows helper (RT-M3);
- S-E5, merging the two host-binary resolvers: the fallback is pinned by three test suites, and whether a worktree may use another checkout's release is a Host & Surface question, handed to T9 (H17);
- S-E9, moving `existingLockFiles` into the registry leaf (run-directory layout does not belong in layer 1);
- moving registry template filling into Rust (red-team D-9);
- A.6 `Serialize` derives in `fgos-process` (the wire shape is not the crate's types);
- simplicity's HL-N8/N9 deletion of the judge (it breaks `hot-lock.v1.json:25`);
- correctness's "keep the fences" (it rested on a stale plan line, corrected in `3fd0dc544`);
- S-E8, `lock-wait.mjs`: outside T1, noted for T5.

## 4. Decisions made by the big lead inside the approved frame

- **D1 Order.**
  - Phase 1 is red tests for the reproduced Highs and Mediums.
  - Phase 2 is the Linux/macOS lock door with RT-M2/M4/M7, the facade moved, the route modes deleted, and the probe and classifier moved.
  - Phase 3 is the fence deletion.
  - Phase 4 is the hot-mutex fixes, the state-root copies, T0-R1/R2, R3 and the Low items.
  - Phase 5 is the doctor merge and specs.
  - Phase 6 is identity and the single counter, after SEAT lands.
  - Windows work rides on the cross-platform workflow; nothing Windows-only is judged on Linux.
- **D2 The git hook (RT-M1).** `.githooks/pre-commit` is a cold client of the activated host, like Convention. It asks for its four answers through host verbs that stay:
  - `fgos identity --json`;
  - `fgos lock-status main-checkout --json`, for probe and holders;
  - `lock-fd --borrowed-check`.

  The Node facade then has one path, the door, and no route fallback. One extra spawn per commit is cold. This decides the hook. The checkout channel `node bin/fgos.mjs` is the owner's question (§6 Q2).
- **D3 Windows keeps the lock-hold helper** until the supervisor has another way to receive a domain (RT-M3). This is evidence, not an owner call.
- **D4 Fence deletion corrections (red-team D-5 and §4).**
  - `checkStopped` and `workspaceListing` move next to their remaining caller, `src/verbs/events/migrate.mjs`. That is ES's file, so this is coordinated through the board.
  - The registry keeps `fence: "none"`, `v1Path: null`, `v1Shape: null` on the Event Store rows, or `registry_rows.rs` changes in the same commit; the lead picks the smaller.
  - `cutOverLockFiles` filters by `LOCK_FILES` membership.
  - `ownPidChain` reads parents through the process door, not `/proc`.
  - `test/setup/git-checks.test.mjs` changes with `checkLockFences`.
  - `git-fence-missing` moves to a Git row before the Node row goes (H16).
  - The owner-machine landing guide checks `lock-fences` green on forgentX, mdview and mcp-skill-hub before the T1 landing.
- **D5 `test/runner/dispatch-reconciliation-import-graph.test.mjs:225-232`** is updated deliberately when the facade's imports change, as T0 did for its import graph.

## 5. Handed to other lanes or phases (recorded in the receiving plan in the same turn)

| # | Item | To |
|---|---|---|
| H16 | `git-fence-missing` (the fgctl Git-WAL fence, `tombstone.rs`) needs a Git doctor row before HARDEN deletes `checkLockFences`; and whether the WAL fence itself is past its release under owner decision 1 | GIT |
| H17 | Two host-binary resolvers (`host-bin.mjs:41-64` falls back to another checkout's activation) and the host's own `.fgos` ancestor walk (`main.rs:123-143`) versus Git's trusted main root | T9 (Host & Surface), phase 07 |
| H18 | `src/verbs/events/migrate.mjs` gains `checkStopped`/`workspaceListing` beside it when the fences go | ES (board, shared file) |
| H19 | SEAT review: `src/convention/{seat-id,definition-names}.mjs` evaluate convention rules in Node; and SEAT's `state-lock-held.mjs` is a third depth counter | SEAT (at its landing), then T1 phase 6 |
| H20 | `lock-wait.mjs` default-behind-a-module | T5 |

## 6. Owner ask 1 (batched)

**Q1. Approve the T1 target shapes in §2?**
- What is happening: every lock call from Node starts a host process today (1.4 ms). The council agrees on one in-process door for Linux and macOS, with the red-team's three safety constraints.
- Options: (a) approve as written; (b) change a component.
- Recommendation: **(a)**.
- Scope of the answer: T1's sub-plan and the four specs.

**Q2. The checkout channel `node bin/fgos.mjs` once locks and identity go in-process.**
- What is happening: since T0, a Node process run straight from a source checkout cannot load the door (`process-door-not-shipped`, reproduced). Process judgement already refuses there. After T1, lock and identity calls refuse there too. The git hook is handled by D2.
- Cause: the door only trusts the addon of the release whose payload is running, so a hand-edited checkout never loads a different release's native code.
- Options and cost:
  - **(a)** Declare the channel unsupported for these verbs. Change AGENTS.md's "Legacy-Node CLI Ownership Boundary" text and point to `npm run fgos:dev`, which already runs working-tree code through the host. The state-root route can then go too (−50 lines).
  - **(b)** Teach the door to load the workspace activation's addon when it runs from a checkout. That is a second trust rule in the loader, and checkout code would run against another release's native ABI.
  - **(c)** Keep the old route fallbacks in the facade. That is two paths per call, which L10 forbids.
- Recommendation: **(a)**. It matches T0's answer for the npm channel (OQ-2), and the dev door exists.
- Scope of the answer: AGENTS.md text, `state-root.mjs` and its route, and the hook tests.

**Q3. HL-F1: the hot mutex fast-path bound.**
- What is happening: `withStateTx` is 5–8% slower than the lock it replaced. That is about 1 µs of JS allocation in WORK's region, so it is real, not noise. The test compares against a deleted mechanism fetched from an old commit, and it reads 1.101 under suite load against its 1.10 bound.
- Options:
  - **(a)** Replace the bound with an absolute one from the same run: `withStateTx` p50 ≤ 2 × the raw link/unlink syscall quartet (today 1.6×). It never skips and proves "the mutex adds no second syscall class".
  - **(b)** Keep the 10% bound and ask WORK to win back the microsecond.
- Recommendation: **(a)**.
- Scope of the answer: the one test; TEST applies it in its timing batch.

**Q4. `lock.predecessorKillWaitMs`.**
- What is happening: only Node reads it, about 29 µs on every acquire. Rust callers (Git, fgctl, Observe) always use the 2000 ms default. Both configs on this machine hold exactly 2000.
- Options:
  - **(a)** Delete the key, its doctor row line, the setup merge and three tests: ≈ −150 lines and one bound everywhere.
  - **(b)** Keep it and read it once per project per process (S-13): Rust stays on the default, and the doc says so.
- Recommendation: **(a)**. Nobody has set it to anything but the default, and today it promises a bound that Rust callers do not apply.
- Scope of the answer: a user-visible config key (CHANGELOG line).

**Q5. Proposed addition (simplicity): write the hot mutex's self record once per process.**
- What it would do: cut ≈ 40% of the fast path (19.6 → ≈ 11 µs).
- Cost: a crash leaves a new leftover kind, which `lock-holders` would sweep.
- Options:
  - **(a)** Hand it to WORK as an idea for its store rewrite.
  - **(b)** Do it in T1.
  - **(c)** Drop it.
- Recommendation: **(a)**. It touches WORK's region and adds a mechanism.

## Owner answers (ask 1)

2026-10-22 08:50, owner: "1a 2a 3a 4a 5a". Recorded as owner decisions 9–13 in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md#owner-decisions); Q3 goes to TEST (H21), Q5 to WORK (H22).

## Unresolved questions

1. The fence deletion lands on the owner machine only after its three workspaces show `lock-fences` green; the guide will carry that line.
