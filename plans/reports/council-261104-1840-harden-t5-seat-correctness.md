# HARDEN T5 council, CORRECTNESS seat (axes A, B, F)

Seat: correctness and stability. Repo main at `af19e6de6` (no layer file differs from `c129461af`), fg-server2, 2026-11-04 18:40 Asia/Saigon. Read-only; the only write is this file. Scratch scripts live under `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/` (`ts.mjs`, `fam.mjs`, `out.mjs`, `rl.mjs`). No cargo target was created, no test suite run, nothing dispatched.

## What I ran, and what I did not read

Read in full: `src/runner/execution/run.mjs`, `commit-unit-work.mjs`, `seat-ledger.mjs`, `unit-state.mjs`, `unit-run-history.mjs`, `unit-control.mjs`, `partial-writes.mjs`; `src/runner/dispatch/{run-lock,cwd-lock,trust-store,worker-home,herdr-round,terminal-slot,worker-artifacts,stop-processes-inside}.mjs`; `src/seat-binding/client.mjs`; Rust `seat-binding` `lib.rs`, `route.rs`, `tier.rs`, `rank.rs`; Rust `run-result` `lib.rs` (derivation and scan). Read in part: `assignment-runner.mjs` lines 596-2202 (admission, `executeAssignment`), `authority.mjs` 1288-1898, `confinement/cleanup.mjs`, `provider-capacity.mjs` 296-780, `settlement.mjs` 600-700, `bind.mjs` 107-410, `recovery-planner.mjs`, `verbs/dispatch/recover.mjs`, `worker-session-boot.mjs`, doctor rows `blind-steps-use-proven-pools`, `seat-binding-dry-bind`, `seat-binding-route`.

Skimmed by export or grep only, so no verdict from me: `config.mjs`, `provider-credential-renewal.mjs`, `assignment.mjs`, `plan.mjs`, `transport.mjs`, `resolve.mjs`, `effective-execution-contract.mjs`, `execution-contract.mjs`, `seat-resolver.mjs`, `loops/*`, `patterns/*`, `unit-sync.mjs`, `handoff-refs.mjs`, Rust `model.rs`/`policy.rs`/`explain.rs`/`unit_summary.rs`, confinement `policies/resources/backend-registry/drivers/bwrap.mjs`/`probes/harness.mjs`. Coverage of the 35 500 Node lines is therefore partial (about a third read line by line); the brief's "every line" was not met.

Executed: `ts.mjs` (trust-store against a symlinked store and a TOML section holding an array), `fam.mjs` (bind family versus doctor family), `out.mjs` (`outcomeOfRunResult`). `rl.mjs` (run-lock) could not run from the checkout: the durable-file door needs the staged addon (`process-door-not-shipped`), so that finding is unreproduced.

## Part A, target shape

| Component | Part or separate | Authority for | Contract and ports | Node budget after | Delete | Doctor rows kept | Size target |
|---|---|---|---|---|---|---|---|
| Seat Binding | Separate (Rust crate, done) | Which executor, invocation, model, effort, tier, account runs a seat | `internal seat-binding bind\|ladder`, protocol 1; Node client fails closed | client 173 and facade `bind.mjs`+`seat-policy.mjs`+`dry-bind.mjs`+`account-pin.mjs` <= 750 (now about 960 with the dead `bindWorkSeat` path unverified) | 3 baseline dead exports | `seat-binding-route`, `seat-binding-dry-bind` | Rust 2 551 unchanged; golden vectors stay the owning proof |
| Run Result | Separate component in spec, one contract in code | The meaning of a run record: classification, outcome, evidence floor | Writer and validator Node `run-result.mjs`; metrics reader Rust. Twin derivation held by fixtures | keep 1 396 now; after dead exports (18 unused of 27) <= 1 150 | `normalizeRunResultV4`, `OUTCOME_CATEGORIES`, 14 more unused exports | `observe-run-coverage` | Rust 1 139 unchanged; see B-9 for the one-owner rule |
| Execution Core (`runUnit`) | Component | How a Unit runs: admission, record, seat walk, commit, settle | `runUnit(options)`, `CaseAdmissionPort`, `bind()` facade | `run.mjs` 1 629 -> <= 1 100 by cutting `runUnitBody` (1 020 lines) into fresh/resume prepare, `runRole` (attempt walk) and settle | nothing verified dead in `run.mjs` | none of its own | `runUnitBody` <= 350 lines |
| Dispatch (bind, seat resolver, assignment runner, transport, provider capacity) | Component; `bind.mjs`/`seat-resolver.mjs` belong to Execution Core by the spec row, not to Dispatch | Admission of one attempt, lease, launch hand-over | `executeAssignment(assignment, opts)`; admission ledger over `run-lock.mjs` | `assignment-runner.mjs` 2 202 -> <= 1 500: `executeAssignment` (1 136 lines) split into admit, prepare-launch, hand-over; `admitRunAttempt` (329) to its own module | `isSubstantiveEvidenceRef`, shadow binder, `herdrSpawnAdapter` | `run-attempts-stuck`, `provider-capacity-state`, `dispatch-decide-hook-wired`, `executor-*` rows | no function over 400 lines |
| Confinement | Separate component (own spec) | Whether and how a worker is sandboxed; private homes; attestation | `prepareConfinementForLaunch` (the only production door), `finalizeAttemptHome` | 6 455 -> <= 5 900 after the dead door | `executeThroughConfinement` (375), `finalizeConfinementResources` (128) | all `confinement-*` rows, `bwrap-available`, `credential-copies-retained` | tests re-homed, not ported |

Where the spec is right and code agrees: Seat Binding row (thin client, fails closed, account view read outside the provider lock) and Execution Core row (`bind.mjs` is a facade). Where code and spec disagree:

1. The Holder-lock row says no decision is derived from a pid, TTL or mtime. `recovery-planner.mjs:60,375-377` and `runtime-inspection.mjs:210-214` derive "driver alive" from a 60 s window on `visibility.json` `lastSeenAt` (B-13).
2. `run.mjs:169-171` says the account inventory is "read live at every bind and launch". It is read once per `runUnit` (B-11).
3. The Run Supervisor row says Run Result Evaluator lives inside the Node `settle-attempt` step; the Run Result row names the evidence doc only. The Rust twin is described nowhere (B-9).
4. The Process Facts row names `src/runner/dispatch/process-identity.mjs` as the door path, so baseline O-1 is spec-endorsed, not a violation; it is still T0 code in a T5 directory.

## Part B, findings

Severity counts: High 2, Medium 10, Low 6. "Reproduced" means I ran it; "unreproduced" means a concrete scenario from code.

### High

**B-1. High. The agent-CLI trust stores are rewritten by read-modify-rename with no lock, against a file the CLI itself rewrites. Unreproduced (race), code certain.**
Evidence: `trust-store.mjs:198-224` (`seedTrust`: read at `:211`, write at `:223`), `:231-238` (`removeTrust`), `:90-101` (`writeStoreAtomic`); callers `herdr-round.mjs:222-251` (every unconfined terminal attempt seeds `~/.claude.json`) and `run-supervisor/steps/cleanup-trust.mjs:23-28` (removal after the receipt).
Scenario: two seats (two `fgos run` processes, or a panel across processes) seed in the same millisecond window, or one seed meets claude's own periodic write of `~/.claude.json` (it holds `oauthAccount`, per-project stats). The loser's update is renamed over by the stale snapshot of the other. Effects: a vanished trust entry (a seat stops at a folder-trust dialog, `agent_not_ready`), or fgOS reverting a field claude wrote milliseconds earlier in a file the operator owns. `cleanup-trust` does the same on every attempt end, so there are two writers per attempt. This is H-T4c, confirmed and widened: it is not only between concurrent seats but also with the CLI.
Fix: one writer door for operator-owned stores that takes a kernel lock (a `trust-store` row in the lock registry, rank above `provider-account`) around read-modify-write, and re-reads after the lock. A lock cannot stop the CLI, so the write must be minimal: only the one key changes and the rest of the parsed object is written back unchanged. It replaces the five hand-rolled temp-and-rename sites (O-3).

**B-2. High. `outcomeOfRunResult` answers `pass` for any record that has no `classification`. Reproduced.**
Evidence: `unit-run-history.mjs:18-26`; `out.mjs` printed `v1 failed, no classification -> pass` and `empty object -> pass`; `classification {} -> execution-failure`. The comment above the line says "treating the missing outcome as ok made a failed seat a pass" and fixes only the object case.
Reach: `readUnitRunSeats` (`:42`) parses `result.json` raw, with no `interpretRunResult`. Seat-era results always carry a classification, so a live run is not affected. A legacy unit directory (about 1 900 old run records, kept readable by `legacy-seat-read.mjs`) or any result that parses as JSON but lacks `classification` shows as a passed seat in the derived unit summary and in hand-off selection (`readUnitRunHistory`). The Rust twin gets this right (`derive_legacy_outcome`, `lib.rs:191-338`: `status: failed` is infra). A fail-open default on the success decision is the wrong direction; the same file already holds the right function.
Fix: default to `deriveOutcome(interpretRunResult(runResult).classification)` and treat a result that cannot be interpreted as `execution-failure`. Add the v1 and empty-object rows to `run-outcome` fixture so Node and Rust prove the same cases.

### Medium

**B-3. Medium. `run.mjs:1243` returns an object naming an undeclared variable.** `return {outcome:'policy-refusal',role,round,...}`: `role` is not declared in `runRole` or its enclosing scopes (the seat is `seat.role`; `grep -n "\brole\b" run.mjs` shows no declaration), so the line throws `ReferenceError` instead of the intended `native-baseline-missing` refusal. Reach: resuming a writing unit run whose first attempt was recorded without a `nativeBaseline`. No test names `native-baseline-missing` (`grep` over `src` and `test` finds only this line). The runUnit catch then settles the unit as `execution-failure` and rethrows the raw error. Static, not executed (the function cannot run without a unit fixture). Fix: use `...seatTag`. It also shows that no lint step catches undeclared names in this layer; `doctor` or the gate could run `node --check` plus a no-undef pass (proposal P-3).

**B-4. Medium. Symlinked trust store is replaced by a regular file. Reproduced.** `writeFileKeepingMode` (`trust-store.mjs:77-85`) renames a temp file over `target`. `ts.mjs`: store `claude.json -> dot/claude.json`; after `seedTrust` it is no longer a symlink and the target never got the entry (`is symlink after: false`, `target has wt: false`). Dotfile managers commonly symlink `~/.claude.json`; the next sync silently undoes the seed and the link is gone. Fix: resolve `realpath` of the target before choosing the temp directory and rename onto the real path.

**B-5. Medium. `removeCodexTrust` can leave the operator's `config.toml` malformed. Reproduced.** `codexSectionPattern` (`:285`) ends the section at the first `[`, not the next header. `ts.mjs` with `[projects."/r/wt"]` holding `note = ["a"]` left `["a"]\nextra = 1` behind, which TOML reads as a new table, moving `extra` into it. fgOS itself writes only `trust_level`, but codex and people add keys to the same section. Also `removeAgyTrust` (`:611-640`) returns `false` on any write failure, so `cleanup-trust` reports `already-gone` while the entry stays (T4 note). Seed writes the path unescaped into a TOML key (`:326`), so a path containing `"` or a newline breaks codex's whole config; worktree paths are fgOS-made, so Low in practice.

**B-6. Medium. The doctor row that guards blind seats derives provider family a second way, and disagrees. Reproduced.** `blind-steps-proven-pools.mjs:61` uses `deriveProviderFamily(entry, cli?.command ?? entry?.command ?? 'claude')`; the runtime uses `getProviderFamily` (`bind.mjs:58-66`), which falls back to the global `executor.command` for an entry with no command or adapter. `fam.mjs` with `executor.command: 'gemini'` and an entry that names neither: runtime family `gemini`, doctor family `claude`. `claude/herdr|cli/bwrap` is a proven pair, so the row passes for a pool that binds an unproven family. Safety row, false pass, one-door breach. Fix: import `getProviderFamily`; delete the second derivation.

**B-7. Medium. `state.assignments` in the provider-capacity state is never pruned. Measured.** `provider-capacity.mjs:661` adds `provider:assignmentId` per lease; nothing deletes it (`grep` for `assignments[` finds only the write and two reads). The live file `/home/vantt/.fgos/runtime/provider-capacity/state.json` holds 636 entries, 94 KB, on a machine that runs few seats a day. Every lease and release under the machine-wide `provider-state` lock rewrites and fsyncs the whole file (`writeState` `:358-362`), and every bind parses it lock-free (`readAccountStates` `:589`). Linear growth in a global critical section. The entry is needed only until the receipt audit (`run.mjs:1390-1391`) ran. Fix: drop an entry when its attempt is closed, or cap by age in `reclaimDeadLeases`, which already runs in every lease.

**B-8. Medium. Two panel seats can start two worker-session servers. Unreproduced (needs herdr).** `worker-session-boot.mjs` `ensureWorkerSession` checks `existsSync(socketPath)` and then spawns `herdr --session fgos-worker server` detached; there is no in-flight guard. `establishConfinement` (`herdr-round.mjs:186`) runs it per attempt, and the seats of a panel launch together in one process. Both see no socket (the first server needs tens of ms to create it), both spawn. The second server either fails or takes the socket; either way a pane lands in a server that is not the one the other seat addresses, which looks like `session-unavailable` or an orphaned server. Fix: memoize the pending promise per session name in this module, and take a short kernel lock for the cross-process case.

**B-9. Medium. Node and Rust derive outcomes by different rules. Reproduced by reading both.** Node `deriveOutcome` (`run-result.mjs:1159-1242`) has rule 0 (`failure.family provider` and `code blocked` gives `blocked`) and reasons from `failure.code`/`policy.code`; Rust `derive_outcome` (`lib.rs:23-128`) has no rule 0 (such a record is `infra`) and builds `infra-exec-failed`, `policy-<code>`, `infra-policy-needs-input`. Metrics read the recorded `classification.outcome` first (`lib.rs:203-219`), so only records without one diverge: v2 records and anything written before the field existed. Which side is the owner is nowhere written. Recommendation: Node is the owner at write time (it has the evidence); Rust's re-derivation exists only for records with none. Add rule-0 and reason vectors to `test/fixtures/run-outcome/legacy-derivation.json` so both sides prove the same rows, and drop reason strings from Rust equality.

**B-10. Medium. The lease-receipt audit fails open. Unreproduced.** `run.mjs:1390-1391`: `receipt = readLeaseReceipt(...)` returns `null` on a missing or unparseable `provider-capacity-selection.json` (`:601-609` swallows every error), and the audit runs only `receipt && outcome === 'pass'`. The comment says the file lies in a directory the worker can reach and the provider record is the truth. A pass with a leased account but no receipt file is committed unaudited. The truth source is the state record: `state.assignments[provider:assignmentId]` exists iff a lease was granted. Fix: audit when the state record exists, not when the file exists; treat an unreadable file as a mismatch.

**B-11. Medium. The account inventory is memoized for the life of `runUnit`.** `run.mjs:636-638` (`liveConfigRead ??=`) feeds `withAccounts`, used by every bind and by the lease (`:1033`, `:1176`). The comment at `:169-171` promises a live read. A unit that runs for hours keeps a disabled or removed account bindable and quarantined state from `readAccountStates` is live while the inventory is not. Fix: read `accountInventoryConfigOf(loadRunnerConfigForDir(mainRoot))` per bind (cold, a few ms) or correct the comment and spec.

**B-12. Medium. `publishNextGeneration` has no exit when the highest generation file is unparseable. Unreproduced (addon).** `run-lock.mjs:158-179` and `parseJsonFile` (`:111-124`): an unparseable `NNNNNNNNNN.json` is skipped by `listGenerations`, so `nextEpoch` is computed from the highest parseable epoch, `installOnce` answers `already-exists` for the unparseable file's number, and the loop `continue`s forever, synchronously, blocking the event loop. Reachable through a partial copy of a run directory (`cp -r`, rsync) or disk damage; normal publication is atomic. Every ledger in the layer (admission, run control, unit control) uses it. Fix: count the file as present when its name matches, and refuse by name when a record is unreadable; or bound the loop.

**B-13. Medium. `resume-driver` and `reassign-driver` are authorised on a 60 s heartbeat and then do nothing a driver would act on.** `recovery-planner.mjs:160-190,375-377` uses `visibility.json` `lastSeenAt` (written only by `round.note` during preparation, `herdr-round.mjs:91-93`, never after the hand-over), so after 60 s every run without an envelope reads "driver not fresh". `recover.mjs:238-252` then unlinks `dispatch.claim`; no code under `src` writes that file (`grep`: only `recover.mjs` and comments), so `dispatchClaimCleared` is always false, while the CLI answers `applied`, bumps the control epoch and records a recovery log entry. A caller is told a recovery happened that did not. `DRIVER_FRESH_MS = 60000` is declared in `recovery-planner.mjs:60` and `visibility-session.mjs:65`, and `runtime-inspection.mjs:213` repeats the number. Fix: delete the two actions (the supervisor era has `adopt` for every attempt with an envelope), the claim unlink and the heartbeat window; or keep them and give them an executor. Needs a spec edit and the example at `command-registry.mjs:1445`.

### Low

- **B-14. Low.** `readUnitRunSeats` (`unit-run-history.mjs:42-102`) wraps everything in `catch { /* best effort */ }` and returns the seats found so far. A transient `readdir` error mid-walk makes a resume believe seats never ran and run them again. Catch per directory, rethrow the rest.
- **B-15. Low.** `prepareTerminalAttempt` creates the private home (a copy of an account login) in `establishConfinement`, then builds `createRoundTerminalControl` outside the `try` (`herdr-round.mjs:392-397`). A throw there (bad `terminal` config) leaves the home; only `sweepAttempts` on a later run reclaims it. Move the construction inside the `try` that calls `abandon()`.
- **B-16. Low.** Stale staging cleanup in `admitRunAttempt` matches `name.startsWith('.staging-' + attemptStr)` (`assignment-runner.mjs:891`); `.staging-10` is a prefix of `.staging-100-...`. The pid-liveness and digest checks make a wrong delete unlikely; the match should be anchored.
- **B-17. Low.** `createSeatBindingClient` caches the resolved host for the life of the process (`client.mjs:107-121`). A long-lived process (gateway, workflow runner) that outlives an activation switch keeps the old release path; the answer is a named `seat-binding-no-host-binary`, not a wrong decision. Acceptable; resolve again on `ENOENT`.
- **B-18. Low.** `BindBarrier.arrive()` must be called on every path; `runRole` calls it only from the `finally` at `run.mjs:1214-1227`, after `assertNotCancelled()` and `assertSeatId` (`:1170-1173`). A seat that throws there leaves siblings awaiting `batch.bound` inside `Promise.allSettled` (`panel.mjs:83`, `reviewed.mjs:347`, `debate.mjs:88`). Unreachable today (those throws happen before any sibling's microtask); one refactor makes it live. Call `arrive` from a `finally` that starts at the top.
- **B-19. Low.** Atomic writes without fsync in layer code (`run.mjs:59-69`, `unit-summary.mjs:196`, `attestation-store.mjs:188,216,315`, `trust-store.mjs:77-85`): O-3 stands. `unit.json` is the resume authority and is written about 8 times per attempt; a power loss can leave a renamed empty file. Move to `replaceDurably` (the door exists).

### Edge cases from reading, no finding

`executeAssignment`'s `finally` is sound: every throw between run control and the supervisor hand-over leaves an attempt intent and a free lock for the adopt door, the lease is released and `terminalPrep.abandon()` cannot throw (each step is in its own `try`). `admitRunAttempt` closes the generation-before-directory crash window by replaying the same retry tuple. `acquireRunControl` never reclaims on TTL alone. Seat Binding `rank.rs` is deterministic (all maps are `BTreeMap`) and I found no logic fault in the walk, continuity, pin or independence paths; the Rust risk is zero panics on input (`serde` errors become `invalid-request`).

## Migration table

| Node part | What it decides | Move to Rust? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `src/seat-binding/client.mjs` | Carries one bind call | Done | Nothing left to move | n/a | 173 |
| `bind.mjs` fact assembly (`executorFacts`, `accountViewOf`) | What the crate may know | No | Reads config and live account state; the crate must stay pure | n/a | facade <= 520 |
| `run-result.mjs` derive (`deriveOutcome`, `interpretRunResult`) | Meaning of a record | No (hot read loops: a host exec per record is 20 ms) | Fix the twin by vectors (B-9) | 1 | 1 150 |
| `run-lock.mjs` generation ledger | Append-only epochs | No | 384 lines over the durable door; fix B-12 | 2 | 384 |
| `provider-capacity.mjs` state | Leases, quarantine, audit | Later | Gain: one account authority with Seat Binding. Cost: 1 029 lines and a locked JSON file. Prune first (B-7), delete the text judge (H-T4d) | 5 | <= 850 |
| `trust-store.mjs` | Writes operator stores | No | Three file formats of other tools; add the lock (B-1) | 1 | 640 |
| `authority.mjs` | Sandbox plan, attestation | No | Argv building for bwrap is a candidate only after the dead door goes | 3 | <= 1 400 |
| `assignment-runner.mjs`, `run.mjs` | Admission, record, seat walk | No | Reshape, not a language move | 4 | 1 500 / 1 100 |
| `recovery-planner.mjs`, `recover.mjs` | Recovery recommendation | No | Delete the two driver actions (B-13) | 3 | <= 280 / 330 |

## Delete list

Production: `executeThroughConfinement` (`authority.mjs:913`, 375 lines) and `finalizeConfinementResources` (`:1689`, 128) with the facade export (`dispatch.mjs:46`) and the three `test/architecture.test.mjs` rows; `dispatch/prepare.mjs` (49) and `dispatch/recovery.mjs` (178); `assignment-runner.mjs:213` `isSubstantiveEvidenceRef`; `herdr-deadlines.mjs` (7, one consumer); `lock-wait.mjs` (24) and its 53-line test, but note `src/runner/merge.mjs:54` also imports `DEFAULT_LOCK_WAIT_MS`, which the baseline missed, so the constant moves to the holder-lock facade first; `provider-auth-failure.mjs` (69) and its 10 tests, plus the two `QUOTA_PATTERN`s and the text fallback at `provider-capacity.mjs:970-996`, once a run on every executor shows a typed `stopCause`; the second family derivation in `blind-steps-proven-pools.mjs:61`; the shadow binder at `transport.mjs:205-231` and doctor row `shadow-binder-divergence` (zero events on this machine); `resume-driver`/`reassign-driver`, `clearDispatchClaimForRecoveredDriver` and the three `60000` constants (B-13); `legacyPersonaProjection` (`p-3e6b1a52`). Tests: about 39 calls in 6 files re-homed onto `prepareConfinementForLaunch`; `dispatch-effect-guarantee.test.mjs` (15 tests) goes with `dispatch/recovery.mjs`; `test/runner/lock-wait.test.mjs`.

## Doctor table

| Row (layer) | Fail or warn condition | Surviving row |
|---|---|---|
| `seat-binding-route` | no host binary; route does not answer `ladder` at protocol 1 | kept; add: answers `bind` with a minimal request (today a host with only `ladder` passes) |
| `seat-binding-dry-bind` (62 spawns) | any seat of any Workflow unit refused by policy | kept; the 62 spawns drop to one if the dry bind batches seats (proposal P-2) |
| `blind-steps-use-proven-pools` (460 spawns, 9.3 s) | a blind unit can bind an unproven family/transport | kept; fix B-6 first; share candidates with `seat-binding-dry-bind` |
| `executor-posture-coverage` (36 spawns) | capability with no candidate that carries posture | kept |
| `dispatch-decide-hook-wired` | hook missing from `.claude/settings.json` | kept (fix registered) |
| `confinement-*` (probe freshness, blind read, strict readiness, herdr maturity, bwrap platform, orphaned resources) | probe stale, backend missing, orphan temp dirs | kept; no condition lost by the dead-door delete (none reads it) |
| `credential-copies-retained` | private home held after write-back failures | kept |
| `run-attempts-stuck` | attempt with envelope or intent and no `closed.json` with a free lock | kept (T4 owns); it is the safety net for the non-handed-over throws in `executeAssignment` |
| `provider-capacity-state` | state file unreadable or accounts invalid | kept; add warn when `assignments` exceeds a bound (B-7) |
| `shadow-binder-divergence` | divergence event recorded | goes with the shadow binder |
| `executor-profile-warnings`, `executor-skills-installed`, `agent-cli-project-trusted` | the 3 machine-state fails of this run | kept; `executor-profile-warnings` reports informational legacy warnings as a fail, which is a severity fault of the row |

## Tests table

| Behaviour | Owning proof | Duplicate or smell | Move or change |
|---|---|---|---|
| Seat decision | Rust `golden.rs` (82 cases) | about 190 Node tests around it (`bind` 64, `tier-cell` 21, `seat-binding-dry-bind` 18, ...) | Keep Node tests that prove the facade facts only (executor facts, account view, refusal shape); retire cases that restate the crate's ranking |
| One host exec per bind, none in a lock | `client.test.mjs` (in-lock refusal); `exec-budget.test.mjs` (6.6 s) | exec budget duplicates a launch end to end | Keep the client test; move the exec count to a counter in the client test |
| Outcome derivation | `run-outcome.test.mjs` plus Rust `lib.rs` over one fixture | rule 0 and v1-without-classification not in the fixture (B-2, B-9) | Add vectors; that is the owning proof |
| Failover, rotation, partial writes | `run-provider-failover.test.mjs` (30 tests, 124 s) | every case needs real bwrap launches; `SKIP` turns the whole file green when bwrap is unusable (`failover-fixture.mjs:39`) | The decision (rotate or walk) is `runRole`'s loop plus `bind()`; prove it with an injected `executeAssignment` and keep 3 end-to-end launches. The skip must fail the gate when the platform claims bwrap |
| Resume of a writing run without `nativeBaseline` | none | B-3 | add one |
| Trust-store concurrency and symlink | `trust-store` tests (not read) | none for B-1, B-4, B-5 | add 3 cases |
| Time-based waits | 117 lines name `setTimeout`/`sleep`/`Atomics.wait`/`waitFor` (baseline); `run.test.mjs` 13, `spawn-worker.test.mjs` 2 | spawn-worker flaked once (1 of 18) | Replace waits with the file or receipt the test needs |

Why `run.test.mjs` takes 140 s and `run-provider-failover.test.mjs` 124 s (not separately measured, from reading): both drive `runUnit` through a real supervisor, launch gate and bwrap per seat. The failover file has 30 tests with 1 to 3 attempts each; at T4's measured 1.2 s per seat plus fixture setup (a git repo, a worktree, an accounts file) that is the 4 s per test the baseline saw; `run.test.mjs` has 87 tests at about 1.6 s, the same shape. There is no injection port between `runRole` and `executeAssignment`, so every behaviour of the seat walk pays a launch. The fix is a port (proposal P-1), not faster launches.

## Received items (answers)

| Item | Answer |
|---|---|
| Grace versus agent-ready (D-T2-7) | The 7-line `herdr-deadlines.mjs` has one consumer (`terminal-control-checks.mjs:14`). Move `READY_TIMEOUT_MS` into `src/terminal-control/config.mjs` next to `allocationGraceMs` and delete the file; the supervisor owns deadlines now |
| T2 §5(1) class-B herdr callers | Not mine to fix by line: with the supervisor the live ones are `herdr-round.mjs` (allocation and screen follow, via the port) and `worker-session-boot.mjs:156` (spawns `herdr server`, B-8). Keep both behind terminal-control or document `worker-session-boot` as the one raw call |
| T2 §5(2) name-sniff, `parseHerdrUsage` | Delete both; `settlement.mjs:759` should read the adapter's declared `locus`, `usage-parsers.mjs:142` returns all nulls |
| T2 §5(3) `herdrSpawnAdapter` | Delete (it only rejects); the supervisor is the only herdr launcher |
| T2 §5(4) Git addon error re-parse | Only `src/event-store/native.mjs:32` remains; use `nativeError()`; not in this layer's files |
| T2 §5(5) 559 doctor spawns | One bind per host exec is the contract; cut the call count (P-2), not the contract |
| H20 `lock-wait.mjs` | Delete, but `merge.mjs:54` imports the constant; move it first |
| T3-04a wording lists | Delete once a run per executor proves typed `stopCause`; until then the text fallback is the only judge for non-typed stops. I did not verify that proof |
| T3-04a stale-result guard, claim lookup | `herdr-round.mjs:354` and `worker-artifacts.mjs:39-60` are two answers to "which result file"; B-A5 unification stands. `Number()` accepts `result-007` and `result-1e1` |
| T3-04a outbox readers follow symlinks | Still true (`worker-artifacts.mjs`: `readdirSync` plus `existsSync`, no `lstat`); the worker writes the outbox, so a symlink to a path outside the run is a read primitive for the controller |
| H-T4c `cleanup-trust` lost update | Confirmed and widened to the seed side and to the CLI itself (B-1); fix in `trust-store.mjs`, which is this layer |
| H-T4d text judge | Delete per the delete list |
| H-T4e `cliSpawnAdapter` short calls | Make them `direct` attempts only if a probe needs the supervisor's guarantees; probes already run outside any state lock. Owner decision |
| H-T4f pane allocated before the envelope | `prepareTerminalAttempt` allocates (`:415`) before the envelope exists; `abandon()` releases it on a live failure, a killed controller leaves it, and the key is the attempt id so the port can reconcile by key. Fix is in terminal-control (release by key at adopt of an intent-only attempt) |
| Dead door | Delete after re-homing the 39 test calls; `finalizeConfinementResources` goes with it |
| `resolveWorkerArtifactPath` | Stays with H-T4e |

## For T4 (closed layer, note only)

1. `cleanup-trust.mjs:23-28` calls `removeTrust`/`removeCodexTrust`/`removeAgyTrust`, which have the B-1 race, B-5 malformed output and a swallowed write failure that reports `already-gone`.
2. `src/run-supervisor` imports 13 modules of `src/runner/dispatch` (O-2). `process-identity.mjs`, `run-lock.mjs`, `cwd-lock.mjs`, `proof-helpers.mjs` and `trust-store.mjs` are the ones that belong below both layers.

## Proposed additions (owner picks; each names what it replaces)

- **P-1 An injectable dispatch port for `runRole`** (`options.dispatch`, default `executeAssignment`). Problem: the seat-walk logic (rotation, walk, lease conflict, ceiling) is provable only through real launches (124 s plus 140 s of tests). Evidence: the tests table. Benefit: the rotation, walk, lease-conflict and ceiling cases run in milliseconds; replaces about 25 of the 30 failover launches. Net: Node +15, tests -250 lines of fixture reuse.
- **P-2 One dry-bind call per doctor run for both rows** instead of 62 + 460 spawns. Problem: 9.3 s of a 89 s doctor. Evidence: baseline §4. Benefit: about 8 s. Replaces the per-seat spawn loops in two rows; the client contract (one bind per exec) is unchanged only if the crate accepts a batch, which it does not today, so this needs a Rust `bind-many` route (+60 Rust). Owner decides whether 8 s is worth a route.
- **P-3 A no-undef pass in the gate** (`node --check` is not enough; B-3 survived). Problem: undeclared names in a 35 000-line layer with no linter. Benefit: catches B-3-class faults before runtime. Replaces nothing; the smallest form is a script in `scripts/` using the V8 parser already shipped with Node.
- **P-4 A `trust-store` lock-registry row** for B-1. Replaces the five hand-rolled write sites (O-3). Needs a rank decision against `lock-registry.v1.json`.

## Net size estimate (my proposals only)

| Part | Delta |
|---|---|
| Node production | about -1 010 deleted (dead door 503, `prepare` 49, `recovery` 178, small modules 100, driver actions about 120, shadow binder about 60) and +120 added (B-1 lock and realpath, B-2, B-3, B-6, B-7, B-10, B-12, B-15), net about -890 |
| Rust | 0 (P-2 would add about 60) |
| Tests | about -450 (dead-door re-home is net zero; `dispatch-effect-guarantee` 15 tests, `provider-auth-failure` 10, `lock-wait` 53 lines) and +250 (vectors for B-2/B-9, trust-store cases, B-3, B-12), net about -200 |

The phase file's -2 000 to -6 000 Node cannot come from a correctness lens; the simplicity seat owns the size claim.

Status: DONE_WITH_CONCERNS
Summary: Two High findings (trust-store lost updates against operator-owned agent-CLI stores; `outcomeOfRunResult` answering `pass` for a record without classification, reproduced) and ten Medium, including a reproduced doctor false pass for blind seats, an undeclared `role` at `run.mjs:1243`, and an unpruned lease-state file (636 entries, 94 KB, measured). Seat Binding's Rust code showed no fault.
Concerns/Blockers: Coverage is partial (about a third of the layer read line by line, the rest skimmed; the unread files are listed). B-8, B-10 and B-12 are unreproduced (herdr and the staged addon were not available). Nothing was run beyond three pure-Node scratch scripts.
