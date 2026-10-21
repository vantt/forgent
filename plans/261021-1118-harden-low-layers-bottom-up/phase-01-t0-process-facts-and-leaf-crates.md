---
phase: 01
title: "T0: Process Facts & Control + Containment port, host-runtime, canonical-json, durable-file"
status: pending
depends_on: [00]
effort: ~4d (rough, re-estimated by the sub-plan)
---

# Phase 01 — T0: Process Facts & Control and the three leaf crates

HARDEN starts with this component. Follow the loop in [plan.md](plan.md#the-per-layer-loop). This file lists only what is specific to T0.

## Context links and prior art

- [docs/platform/process/spec.md](../../docs/platform/process/spec.md): the judge table in §3 and control in §4. §3 says "the leaf reader never spawns" (`:71`). It also settles the Node leaf: `process-identity.mjs` runs the same vectors, `resolveHolderLiveness` is an adapter (`dead → 'dead'`, `alive | unknown → 'held'`), and the cutover phases were to use `pidExists` in place of every private `isPidAlive` copy, deleting each copy in the same commit (`:73`). The decision log is at `:103-105`, plan 4.2.
- **The route already exists.** `fgos internal process-observe` lives in the holder-lock crate. Its contract is `packages/holder-lock/contracts/internal-route.process-observe.v1.json` and its Node client is `src/holder-lock/driver.mjs:269-293` (`runProcessObserveRoute`). Today hot-lock uses it only on Windows, where it caches the reading (`src/state/hot-lock.mjs:38`, `HOST_OBSERVE_TTL_MS = 250`, `:57-67`). The copies the 4.2 cutover promised to delete still exist (§A #3, #4). The T0 report must say why.
- **Hot-lock bans spawning.** Inside a hot-lock critical section any `child_process` call throws `exec-under-hot-lock` (`src/holder-lock/hot-guard.mjs:35-39`, `src/state/hot-lock.mjs:16`). Waiters judge the holder "every few milliseconds" (`hot-lock.mjs:72-75`).
- [component-boundary](../../docs/platform/component-boundary.md) has rows for "Process Facts & Control (L0)" and "Containment port (L0)".
- [Audit 09-28](../reports/audit-260928-2318-dispatch-engine-stability-speed-simplicity-report.md) C2, "liveness judged nine-plus ways". Its file list is stale: `cli-spawn-supervisor.mjs` and `main-checkout-lock.mjs` are gone. The inventory below was re-verified on 2026-10-21.
- [Architecture council 10-15](../reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md).
- The phase 00 T0 baseline report.

## Components and authority

| Component | Crate | Authority | Rust dependents |
|---|---|---|---|
| Process Facts & Control + Containment port | `packages/process/rust` (`fgos-process`) | Whether the tuple `{host, bootId, pidNs, pid, startTime}` is alive, dead or unknown. Signalling by identity (pidfd, `control.rs:83` `signal_by_identity`). Spawning with an fd map. Process domain per attempt (`domain_kill_all`, `lib.rs:205-212`) | `apps/fgos`, holder-lock, run-supervisor, terminal-control, git |
| host-runtime | `packages/host-runtime/rust` | Route registry, invocation service, external-process providers, civil time | `apps/fgos`, `apps/fgos-gateway`, convention, work-state, observe, run-result, session-identity, distribution |
| canonical-json | `packages/canonical-json/rust` | Canonical JSON bytes: keys sorted by UTF-16 code units, numbers formatted through `ryu_js` | run-supervisor, event-store |
| durable-file | `packages/durable-file/rust` | Durable atomic replace and creation modes. Mode is filtered by umask (`lib.rs:116-130`). Temp names follow `.durable-file-<pid>-<seq>.tmp` (`:202`) | git, run-supervisor, terminal-control, event-store |

Size today: process about 7 960 lines (src, tests and contracts), host-runtime about 9 520, canonical-json 209, durable-file 640. Rust `#[test]` counts: process 105, host-runtime 65, canonical-json 1, durable-file 10.

## T0 inventory

Verified with `rg` on main `f453cd941` on 2026-10-21, and re-checked by the red-team.

### A. Node code that decides process liveness or identity, or signals by bare pid

| # | Site | Record fields available | What it does today | Candidate |
|---|---|---|---|---|
| 1 | `src/runner/dispatch/process-identity.mjs:27,46,57,69,82,98,126,154` (158 lines) | full tuple | Node twin of the judge. Reads `/proc` itself (`:29,49,60,103`). `resolveHolderLiveness` folds `unknown` into `held` (`:154-158`) | becomes the thin client, or is replaced by it. Q1 decides how |
| 2 | `src/runner/dispatch/run-lock.mjs:34` `isProcessAlive` (`kill(pid,0)`), `:69-71` wrapper | pid (+ start time for holders) | second judge. Used by `assignment-runner.mjs:75,82,823,924` | delete the copy; keep the export name only as a re-export until SEAT lands (carry list) |
| 3 | `src/holder-lock/hold-transport.mjs:51` `pidAlive`, `:151` `helperAlive` | pid + child handle | liveness of the helper by bare pid | delete the copy. The hold transport itself is T1 |
| 4 | `src/holder-lock/fences.mjs:97` `isPidAlive`, `:415` reads `/proc/<pid>/stat` | pid | fence liveness and a copy of the start-time read | delete the copy. Whether fences stay at all is a T1 question under R4 |
| 5 | `src/runner/lock-fence.mjs:50` start-time read, `:61` cmdline, `:75` `process.kill(holder.pid, signal)`, `:78` ESRCH | pid + start time | judges in Node, then signals | move to Rust `signal_by_identity` |
| 6 | `src/runner/dispatch/stop-processes-inside.mjs:22` `kill(pid,0)`, `:48-49` `/proc/<pid>/exe,cwd`, `:64,70` SIGTERM/SIGKILL by bare pid | pid from the scan | scans `/proc`, then kills by bare pid, with a 1.5 s window in which the pid can be reused. Excludes `process.pid` and `process.ppid` | move to Rust. **State the exclusion contract** (who counts as self or parent once a host route runs the scan) and prove it |
| 7 | `src/runner/dispatch/provider-credential-renewal.mjs:703-708` | pid parsed from a staging name | treats an unclear pid as alive, on purpose: copies that hold tokens are never reaped on doubt | delete the copy. Keep the rule, mapping `unknown` to "keep" |
| 8 | `src/runner/gateway-control.mjs:292,307` SIGTERM/SIGKILL by bare pid. Liveness via #1 `pidExists` at `:67,177,239,287,336` | the registry entry has only `{pid, port, startedAt, logPath, binaryPath}` (`:225-231`) | stops the gateway | add a start time to the entry and use `signal_by_identity`. An old entry without one gives `IdentityUnknown` (`packages/process/rust/src/platform/linux.rs:210-212`); its rule is decided under R4 |
| 9 | `src/setup/registrations.mjs:5510` (row `confinement-backend-registry-readable`, `:5422`) | pid in a marker | doctor row judging liveness inline | delete the copy and call the door |
| 10 | `src/setup/registrations.mjs:5991-6050` `getAbandonedClaims` (`kill` at `:6021`), `:6057-6070` `processStartFingerprint` (compares `/proc/<pid>` **mtime**, `:6059,6063`), row `coordination-abandoned-claims` (`:6074`), its fix (`:6096-6130`, `kill` at `:6116`) | — | the branch is unreachable: no code anywhere writes `claim.json` (`rg -ln "claim\.json" src packages apps bin` returns only `registrations.mjs`), and the coordination engine is retired | **delete the row, its fix and the mtime branch.** Write no red test for it |
| 11 | `src/runner/session.mjs:477` `pidExists` | pid only | pid-only liveness, blind to pid reuse | judge on a full record. Old entries follow the R4 rule |
| 12 | `src/runner/dispatch/assignment-runner.mjs:921-926` `isProcessAlive(stagedPid)` | pid from a staging-directory name | a "not alive" verdict leads to `rmSync` of the staging directory (`:932,942`) | map `unknown` to "keep". SEAT file, so on the carry list |
| 13 | `src/state/hot-lock.mjs:57-67` `observeViaHost`, `:79-94` `hotObserver`, `:99` `judge(record, { observe })` with a JS observer | full tuple | judges a holder inside or near a critical section, so **no spawn is allowed** | goes onto the in-process door (Q1). A Rust judge cannot call back into a JS observer, so the signature changes |
| 14 | `src/holder-lock/index.mjs:440-459` `sweepProcessGroup` (`kill(-childPid)` after the child has exited), `src/runner/dispatch/transport.mjs:367-376`, `src/runner/dispatch/provider-credential-probe.mjs:113` | pgid of an own child | process-group kill. **Once the group is empty, the pgid can be reused** | the council decides by reasoning about whether the group can be empty at kill time, not by a red test. Prefer the process domain (`domain_kill_all`) |

**Required per site (A #2–#13):** a mapping table with the columns site | fields available | today's rule | mapping of `unknown` | where the mapping lives (Rust door or caller policy) | owning proof. Before any Node copy is deleted, there must be one red/green proof per row. For signal sites, the proof shows that a reused pid gets `IdentityMismatch` and receives no signal.

The production importers of #1 are `src/state/hot-lock.mjs:24`, `src/setup/holder-lock-checks.mjs:26`, `src/run-supervisor/{legacy-sweep.mjs:11,direct-launch.mjs:17,cancel-registry.mjs:16}`, `src/runner/session.mjs:39`, `src/runner/gateway-control.mjs:32`, `src/runner/dispatch/provider-capacity.mjs:11` and `src/runner/dispatch/run-lock.mjs:28`: 9 files. Any edit to `process-identity.mjs` changes its hash in `packages/git/contracts/mutation-census.v1.json:725`, and the build regenerates that file.

These sites are out of T0; they are listed here so the councils of the owning layers pick them up:
- T1: `src/holder-lock/driver.mjs:345-359`, the `/proc/*/fd` holder scan (the Rust holder-lock has `holders`).
- T1: `src/setup/holder-lock-checks.mjs:403`.
- T1: the `process-observe` route moving from the holder-lock crate to `fgos-process` (decided together with Q1).
- T4: `src/setup/run-supervisor-checks.mjs:36`, which reads `/proc/net/unix`.
- T5: `src/runner/dispatch/confinement/probes/harness.mjs:330,505` and `src/runner/dispatch/confinement/drivers/bwrap.mjs:602`.
- T5: `src/runner/dispatch/recovery-planner.mjs:185-211`, a TTL/heartbeat liveness check.

### B. Node atomic writes (twins of `durable-file`), grouped by contract class

`rg -c "renameSync\(" src bin` finds 33 sites in 19 files. Each site keeps its contract class. The council decides for each class whether `durable-file` supports it today. A twin moves only if its class is supported.

| Class | Sites |
|---|---|
| **replace, durable** (tmp, then fsync, then rename) | `src/workflow/case-runtime.mjs:20` `writeJsonAtomic` (+ `:159`), `src/workflow/case-bindings.mjs:129`, `src/runner/dispatch/provider-capacity.mjs:379`, `src/runner/dispatch/proof-helpers.mjs:124`, `src/runner/dispatch/provider-credential-renewal.mjs:105` `writeFileAtomic` (exported; used by `confinement/cleanup.mjs:12,101,138`) |
| **replace, no fsync** | `src/runner/execution/run.mjs:51` `writeJsonAtomic` (SEAT), `src/runner/dispatch/visibility-session.mjs:90` `writeJsonAtomic`, `src/verbs/dispatch/recover.mjs:202`, `src/runner/dispatch/reconciliation-planner.mjs:266,331`, `src/runner/dispatch/confinement/attestation-store.mjs:187,215,314`, `src/runner/main-checkout-activity.mjs:97`, `src/runner/worktree.mjs:236` (the board lists this file under GIT G4), `src/runner/execution/unit-summary.mjs:196` (SEAT), `src/holder-lock/hold-transport.mjs:240` |
| **mode-preserving** (keeps the target's permission bits; credential and trust stores) | `src/runner/dispatch/trust-store.mjs:72-99` (`writeFileKeepingMode`, `writeStoreAtomic` at `:90`). `durable-file` cannot express this today, because its mode is filtered by umask |
| **create-only** (hard link or `wx`; the second writer must lose) | `src/runner/dispatch/run-lock.mjs:227,252`, `src/holder-lock/fences.mjs:336`, `src/runner/dispatch/proof-helpers.mjs:99`, `src/workflow/case-bindings.mjs:51,99`, `src/workflow/store.mjs:113`. **Never converted to replace.** One concurrency proof per site: two contenders, exactly one wins |
| **copy-then-rename** | `src/setup/skill-wrappers.mjs:75` `atomicCopyFileSync` (+ `:1094`). Its readers hide only `.tmp-<pid>-<ts>-<rand>` names (`:32,96`). Changing the temp-name pattern makes those readers callers that must change too |
| **WORK-owned, left alone** | `src/state/hot-lock.mjs:310-315,326-330` (`tx.write`, `tx.rename`, inside the critical section), `src/state/store.mjs:219`. Fixed only if Critical or High |
| **not atomic writes** (move-aside, quarantine, staging directory) | `src/runner/worktree.mjs:277,284`, `src/runner/dispatch/assignment-runner.mjs:980`, `src/runner/dispatch/provider-capacity.mjs:335`, `src/runner/dispatch/provider-credential-renewal.mjs:742-743,1108,1121,1229` |

`src/util/unique-tmp-tag.mjs` provides temp names to 5 files.

Rust twins of `durable-file` outside the crate:
- `packages/run-supervisor/rust/src/supervise.rs:263`: the heartbeat runs every tick, so an fsync here costs I/O on every live run. It is a class decision.
- `packages/run-supervisor/rust/src/adopt.rs:230`
- `packages/run-supervisor/rust/src/supervise/windows.rs:91`
- `packages/holder-lock/rust/src/route/hold.rs:45`
- `packages/holder-lock/rust/src/predecessor.rs:130`
- `packages/git/rust/src/repository_config.rs:493`
- `packages/distribution/rust/src/init.rs:543`: Packaging, listed only for information.

### C. Canonical JSON twins (not byte-equal today)

Node:
- `src/runner/dispatch/effective-execution-contract.mjs:39`: keeps `undefined` members. It persists `dispatchPlanHash` and `configHash`.
- `src/runner/dispatch/proof-helpers.mjs:11`: filters out `undefined`.
- `src/runner/dispatch/recovery-planner.mjs:69` `stableStringify`.
- `src/runner/dispatch/reconciliation-planner.mjs:24` `stable`.
- `src/runner/dispatch/trust-store.mjs:379` `sortedJson`.
- Scripts: `scripts/build-rust-distribution.mjs:37`, which **produces** the release-manifest digests, and `scripts/measure-coordination-baseline.mjs:28`.

Rust:
- `packages/distribution/rust/src/verify.rs:46` `to_canonical_json` **verifies** the release-manifest digests. It sorts keys by UTF-8 bytes and formats numbers with `n.to_string()`.
- `run-supervisor/src/envelope.rs:19` already wraps the crate.

Test-side reference: `test/event-store/canonical-vectors.test.mjs:7`. Prior art: `packages/event-store/rust/examples/distribution_digest_audit.rs`.

**Rule:** a twin moves onto `fgos-canonical-json` only after a byte-equality run over its real persisted corpus. For the release manifests that means all three workspaces and both machines; for the others, the stored proof and contract digests. The producer and the verifier move together. A twin whose bytes differ is a contract change, not a deletion. The distribution pair is Packaging: it moves only if the corpus proof passes, and otherwise it is handed to phase 07.

### D. Doctor rows and setup steps

| Row | Registered | Note |
|---|---|---|
| `process-containment` | `src/setup/registrations.mjs:2340` → `src/setup/run-supervisor-checks.mjs:109` | The only signal that bwrap is missing (best-effort warns, unsupported fails). Decide whether T0 or T4 owns it; the warning must survive. |
| `rust-host-binary-present` | `:5258` | host / packaging |
| `rust-host-target-supported` | `:5264` | |
| `legacy-node-payload-present` | `:5270` | |
| `active-release-matches-checkout` | `:5276` | |
| `command-routes-drift` | `:5282` | host-runtime routes |

Two more rows judge liveness inline: `confinement-backend-registry-readable` (§A #9) and `coordination-abandoned-claims` (§A #10, to be deleted). T0 crates have no setup steps: no `registerConfigDefault` or `registerFix` names process, containment, durable or canonical (checked with `rg`).

Gate 8 output: the doctor table (loop step 2). Every fail/warn condition of these rows maps to a surviving row, and the row count does not grow.

### E. Tests

Rust:
- `packages/process/rust/tests/*`: 13 `.rs` files, including `judge_vectors.rs:74,97` over `contracts/process-facts.judge.v1.json`;
- `packages/host-runtime/rust/tests/*`: 6 files;
- `packages/durable-file/rust/tests/{install,creation_modes}.rs`;
- one inline test in canonical-json.

Node:
- `test/process/process-facts-vectors.test.mjs` (157 lines): the shared vectors plus 7 `resolveHolderLiveness` cases.
- `test/runner/process-identity.test.mjs` (80 lines): 9 `resolveHolderLiveness` cases. Their **verdict** cases duplicate the vector file and `judge_vectors.rs`. Their **policy** cases (`:52,57,76`: unknown, unreadable or no pid means "held, never reclaimed"; an injected `isAlive=false` short-circuits to dead) have no Rust owner today. The vector file has no caller-fact concept.
- `test/runner/run-lock-identity.test.mjs` (110 lines): 6 `resolveHolderLiveness` cases with the same verdict/policy split, plus 3 `acquireRunControl` cases that own run-lock behaviour. Keep those 3.
- `test/event-store/canonical-vectors.test.mjs`: contains its own reference implementation.
- `test/rust-host/help-routes.test.mjs` (one of three files at the 600 s ceiling) and `test/rust-host/internal-routes.test.mjs`.

**Inventory size:**
- 4 crates;
- 14 Node liveness/identity/signal sites in 15 files, plus 9 importer files;
- 33 rename sites in 19 files in six contract classes (plus the create-only link/`wx` sites), and 7 Rust atomic twins;
- 7 Node/script canonical-JSON twins and 1 Rust twin;
- 6 T0 doctor rows (plus 2 rows elsewhere that judge liveness, one of them dead) and 0 setup steps;
- 2 Node test files that duplicate liveness tests.

## Council brief: questions specific to T0

These come on top of the loop's standard brief.

1. **How Node reaches the one door. This is an owner question in T0 ask 1, backed by the council's numbers.**

   Hard constraint: anything reachable under `enterHotLock` or in a waiter loop (§A #13; the class rows of §B used inside transactions) cannot spawn. So:
   - **(a) host route per call** (`fgos internal …`, the pattern used for identity and terminal-control) is ruled out for those paths. It is allowed only for cold admin paths such as doctor, fence and gateway stop. It extends the existing `process-observe` route; no second route is added beside it.
   - **(b) in-process native binding.** The combined addon `packages/git/node-addon` already pulls in `fgos-process` (`Cargo.toml:16-18` links holder-lock and git, both of which depend on it). But:
     - the addon belongs to Git (owner decision Q1, `docs/platform/git/spec.md:211,695`, with reversal trigger E3 still unproven at `:837`);
     - its loader `src/git/native.mjs` imports T1/T4 modules (`:1,7`);
     - it refuses on channels without a release descriptor (`:40`, `git-addon-not-shipped`): the npm bin, direct `node bin/fgos.mjs`, and `npm run build:skills`;
     - it ships only for linux-x64 and win32-x64 (`packages/distribution/rust/src/manifest.rs:83-87`);
     - it may be loaded only once per process (`packages/git/node-addon/src/single_load.rs`);
     - its `versions()` check does not cover process or durable-file (`native.mjs:62-63`).

     A viable (b) therefore needs a T0-owned loader leaf, counted in the net size, plus a contract-version check and a channel matrix (activated release, npm bin, direct node, dev host, test runner, Windows). It is a cross-lane change with Git/ES.
   - **(c) keep the Node leaf** (the process spec §3/§8 decision) for the paths that must stay in-process. The owner's 10:01 rule says there should be no deciding Node logic in T0–T4, so (c) is acceptable **only as a named exception the owner approves**. It is never a choice the council makes on its own.

   Budgets are absolute per call class: µs for judge and atomic write; ms only for spawn on cold paths. Measure the cold first load (hash plus dlopen) as well as the warm call. Whatever is chosen supersedes the process spec §8 decision explicitly.
2. **Atomic writes:** for each §B class, decide whether `durable-file` covers it, and what is gained or lost on fsync and permission mode. Leave the create-only and mode-preserving classes as they are unless the crate gains that class without growing.
3. **`unknown` mapping per site** (the §A table): who owns each policy (the door or the caller), and what to do about old records under the R4 policy.
4. **host-runtime scope:** is anything in it (external-process providers, invocation service) a T9 Host concern rather than a T0 primitive? Record it in the phase 07 handoff.
5. **Doctor rows:** which of the six rows are T0 component health and which are packaging. The latter stay but are still reviewed under gate 8.

## Constraints specific to T0

**SEAT carry list.** These items wait until SEAT lands. They are finished in the first change after SEAT lands, before phase 02 closes, and each has one named owner (the T0 post-SEAT change):
- `assignment-runner.mjs:75,82,116-117,823,924`: the kept re-exports `isProcessAlive` and `resolveHolderLiveness` from `run-lock.mjs`, the import of `canonicalJson` from `proof-helpers.mjs`, and the staging judge in §A #12;
- `run.mjs:51` and `unit-summary.mjs:196`;
- `registrations.mjs` §A #9 and #10;
- any `apps/fgos/src/main.rs` route edit.

Close criterion: no exported Node liveness, signal or canonical function outside the client file, except the re-exports on the carry list. A grep is not enough on its own.

**Other constraints:**
- `src/state/hot-lock.mjs` and `src/state/store.mjs` writes are WORK-owned (§B). Only their liveness judging (§A #13) moves in T0.
- MAIL and OPC: announce any `fgos-process` or `durable-file` API change on the board before merge. Keep `containment.port.v1.json` stable.

## Files

The sub-plan fills this in. Expected shape:
- **Create:** at most what Q1's answer requires: a T0 loader leaf and binding, or a route extension. No new crate.
- **Modify:**
  - `process-identity.mjs` becomes the thin client;
  - the §A callers outside the carry list;
  - the §B callers in the classes that move;
  - the `process-observe` route moves to `fgos-process` if Q1 picks (a)/(b);
  - `docs/platform/process/spec.md`, with §8 superseded;
  - `docs/platform/component-boundary.md`, if the sentence about the Node leaf changes.
- **Delete:**
  - the §A copies #2, #3, #4 (liveness part), #7 and #9;
  - §A #10 entirely (the row, its fix and the mtime branch);
  - the twin helpers of the §B classes that move;
  - the §C twins that pass the byte-equality proof;
  - the Rust atomic twins whose class `durable-file` covers.
- **Tests to retire:**
  - the **verdict** cases in `test/runner/process-identity.test.mjs` and `test/runner/run-lock-identity.test.mjs`, now owned by `packages/process/rust/tests/judge_vectors.rs` plus one Node wiring proof in `test/process/process-facts-vectors.test.mjs`;
  - the **policy** cases (unknown means never reclaimed; caller fact short-circuits) are **moved first** into one owning proof at the layer that owns the mapping after the move, which is named in the retirement row, and only then retired.
  - the Node vector re-implementations, once Node calls Rust.

## Net size (estimate before the council; measured in the layer report, HARDEN commits only)

- **Node:** −250 to −400. `process-identity.mjs` 158 lines goes down to about 40; liveness copies about −80; §A #10 about −140; atomic and canonical twins that move about −100; plus a T0 loader leaf of +40 to +80 if Q1 picks (b).
- **Rust:** −50 to +150. A binding or route extension, minus the twins.
- **Tests:** −100 to −200. Verdict duplicates go; policy cases move rather than being added.
- **Layer total:** ≤ 0.

## Validation

- Red test first for every finding rated High or above. One proof per §A mapping row and one per create-only site (two contenders, exactly one wins).
- `cargo test -p fgos-process -p fgos-durable-file -p fgos-canonical-json -p fgos-host-runtime`, plus the full `npm test` and `cargo test --workspace` on a host built from the tree (proposal §4.6).
- An absolute budget table per call class, cold and warm, with the identity mint shown only as a reference.
- `rg "process\.kill\(" src bin` must return only the allowlisted own-child group kills (§A #14, after the council decides), plus carry-list sites by name.
- `rg "/proc/" src bin` must return only the thin client plus the T1/T4/T5 sites listed above.
- `rg -n "function (canonical\w*|stable\w*|sortedJson)|const stable\b" src scripts` must return only the twins that the byte-equality rule keeps.
- The T0 doctor table must show every fail/warn condition kept and no new row.

## Risks (only those specific to T0; the plan-wide risks are in plan.md)

| Risk | L × I | Mitigation |
|---|---|---|
| Moving a create-only site to replace allows two lock holders | M × H | Class preserved; one concurrency proof per site. |
| A permission mode widens or narrows on credential stores | M × H | Mode-preserving class left as it is unless the crate supports it. |
| The canonical byte change breaks release-manifest verification, and with it rollback | M × H | Corpus byte-equality proof; producer and verifier move together. |
| A JS fallback creeps in when the addon cannot load | M × H | Fail closed with a named error; channel matrix; owner exception only through Q1(c). |
| A wrong kill through pgid reuse or a pid-only record | M × H | §A mapping table and proofs; process domain preferred for group kills. |

## Rollback

Plan-wide rule (plan.md). Specific to T0: the formats T0 can change are the gateway registry entry (a start time added) and the stored digests, only if a twin moves. The sub-plan states whether the previous release still reads them.

## Done when

The loop close criteria (plan.md step 9) hold, and in addition:
- the close criterion in "Constraints" holds, with the carry list named and owned;
- the T0 net size (HARDEN commits) is ≤ 0;
- `process/spec.md` is updated, with §8 superseded;
- the boundary row is updated, or `No component-boundary change` is recorded.
