# HARDEN T5 phase 12: test structure and the posture doctor fold

Branch `harden/t5-p12`, worktree `/home/vantt/projects/forgent-worktrees/harden-t5-p12`, based on origin/main `6f85f0272`. Not pushed. No red-test commit: this phase retires and moves proofs and adds golden cases, it fixes no behaviour.

## What changed

1. **Doctor fold** (`cfff2aa7f`). `executor-posture-coverage` is gone; `seat-binding-dry-bind` now also binds every core capability (`execute`, `code:implement`) and every capability whose pool holds an agent executor, as a writing producer, in its own fixed headless session. Same three outcomes and messages.
2. **Exec count at the client** (same commit). `client.test.mjs`: every client call is exactly one host exec, a badly answered bind is one exec and never retried, a call inside the hot mutex costs none. `exec-budget.test.mjs` is deleted.
3. **Failover skip** (same commit). `failover-fixture.mjs` throws a named error where `/usr/bin/bwrap` exists on Linux and cannot run a confined command; it skips only where bwrap is not claimed (reason says so). No env switch.
4. **Pre-admission refusals** (`9f8982643`). Eleven refusal tests move unchanged to `run-pre-admission.test.mjs`, which never launches. The repo fixture, `panelSeats` and `withCancelHandlers` they share move to `test/helpers/run-unit-repo-fixture.mjs`.
5. **Failover on the pure answer** (`ef2b8e30d`). Nine table tests over `answerProviderLimit` in `account-rotation.test.mjs`; `run-provider-failover.test.mjs` goes 31 tests to 6.
6. **Seat tests to facade wiring** (`8fa5c64b6`). 14 new golden cases; `bind.test.mjs` 64 to 34 tests, `tier-fallback.test.mjs` 9 to 4.

### Doctor table (condition to row)

| Condition | Old row | New row (`seat-binding-dry-bind`) |
|---|---|---|
| core or agent-pool capability, executor cannot carry the posture | `executor-posture-coverage` fail, "executors lack required posture confinement: ... Fix: (1)... (2)..." | same text, a problem of the row: fails |
| capability with no pool (`headless-no-executor`, `no-candidate`) | warning, "no candidate executor available for capabilities: ... Fix: Declare runner.capabilities.<cap>.prefer" | same text in the row's information list: passes |
| any other refusal | fail "other failures: ..." | fail "other posture failures: ..." |
| all bound | pass "...: execute -> claude, ..." | `; posture: execute -> claude, ...` appended to the row message |
| config not loadable | pass with note | the row's own existing note |

Deviation: the old module bound with the session's real herdr presence; the row uses the fixed headless session every other seat of the row uses, so the answer is the same wherever it runs. The module and its registration, the manifest row, the registry doc id and the baseline row are removed; the RUL100 decision history in the runner subcomponent spec gets a note that the row folded; CHANGELOG has the line.

## Tests retired, each with its owner

### `executor-posture-coverage-check.test.mjs` (11)

| Retired | Owner |
|---|---|
| registered and visible | `the dry-bind row replaces the two rows it covers in the doctor registry` |
| passes with bwrap executors (x2: plain and "real bind()") | `core capabilities served by bwrap-capable executors and by native agents pass and list their executor` |
| fails without bwrap (x2) | `an agent executor with no bwrap invocation fails as posture-unavailable and names both remedies` |
| native agents pass | same first test |
| config load failure | `a runner config that cannot be loaded passes with a note instead of throwing` (existing) |
| core and pool capabilities only; tool-only skipped | `only core capabilities and capabilities declaring an agent pool are bound...` |
| no pool warns | `a core capability with no pool is information...` |
| grouped failures | `a posture failure and a missing pool are reported together...` |

### `exec-budget.test.mjs` (1)

One bind per seat, walk step and lease conflict: the runner side is the `rebind`/`walk` answers of the table (`a lease that could not take the named account rebinds...`, `a dead login ... is retried on it...`); exec per client call and none under a lock: `every client call is exactly one host exec...` and `a process inside the hot mutex never execs the host`.

### `run-provider-failover.test.mjs` (31 to 6)

| Retired | Owner |
|---|---|
| usage limit with no lease walks | `loop-rununit.test.mjs` "a provider limit on the first candidate moves the worker to the next candidate" (spentquota, no inventory) |
| one account goes straight to next provider | table `a provider with one account, no inventory, or no healthy account goes straight to the walk step` |
| rotation stops after the accounts; timeout rides every attempt | table `rotation stops after the accounts the provider has...`; the timeout assertions moved into the kept dead-login run |
| login just failed is not picked again (even via another executor) | table (credential fault names `faultPool`) + `account-rotation` "the pools to avoid are rebuilt from the attempts" + golden "a fault excludes one pool..." |
| everything used up fails | golden "when every candidate has been tried the walk ends in a named refusal" + table (stop shapes) |
| writing seat passes the gate on rotation / on a walk (x3 incl. unit prefer) | `run.test.mjs` commit tests + `account-rotation` "the walk state of an attempt..." (the gate recomputes from `unit.json`) |
| panel seat rotated keeps its role; panel seat walked to a free family | table rotation + golden "shape alternative spreads away..." and the new spread cases |
| debate rebuttal keeps the candidate | `account-rotation` "a seat in a later round keeps the binding..." + golden multi-round cases |
| lease conflict rebinds, no launch spent | table lease-conflict cases + new `seatLaunchesUsed` case in `run-case-admission.test.mjs` ("an attempt whose account could not be leased ... is not a launch") |
| two checkers conflict, stay independent | table rebind + golden independence rows |
| unit-preferred executor at limit walks to the pool | golden new "a walk step after a unit-preferred executor goes into the capability pool..." |
| provider limit on a pinned account ends the seat | table `a pinned account ends the seat on its limit...` |
| pin on reviewed unit pins its provider's seat | `account-pin.test.mjs` "a seat none of whose entries the pinned pool serves binds unpinned..." |
| dirty file changed again stops the retry | new `partial-writes.test.mjs` case + table partial-writes cases |
| pinned writing seat reports paths | table `...before any pin or rotation is considered` |
| read-only seat still rotates | table `...one that changed nothing, or took no baseline, still rotates`; "records no write baseline" asserted in the kept dead-login run (a read-only seat) |
| second pool eligible after a dead login; quota quarantines only that account | golden "a fault excludes one pool and keeps the other pool..." + kept usage-limit run (spent1 quarantined, live1 healthy) |
| old record without pool resumes | `account-rotation` "the walk state of an attempt..., or a record that carries no pool" |
| assignment record cleanup | assertion moved into the kept dead-login run |

Kept runs: dead login, usage limit, partial writes merged with the resume that takes a new baseline, pinned account runs, quarantined pinned account refused (admission and resume), account of no candidate's provider refused.

### `bind.test.mjs` (31) and `tier-fallback.test.mjs` (5)

Mapping as approved by the lead (message of this phase): each retired test names a golden case or a kept test; the 14 new golden cases are the ones that had none:

1. seats outnumbering families share the least used family
2. a family used twice is passed over
3. spread never overrides the hard independence filter
4. the walk keeps ranking by family use
5. no global maxTier means no ceiling
6. a capability maxTier below the global cap
7. an override effort on a cell that promises none
8. a lease conflict names another account of the pool
9. a lease conflict on every account refuses by name
10. a unit-preferred executor a hard filter removes falls to the pool
11. an override executor pins over the unit preference
12. a walk after a unit-preferred executor never returns to it
13. acceptDependence from an authorized door under spread
14. a description-only exact entry supplies no pool, the bare verb is not a key

Merged inside kept tests: locked-persona override into the persona test; unit-prefer provenance into the herdr bare-executor test. New kept facade test: `a later binding records where it came from and what it skipped...` (fallbackFrom kinds, skipped provenance).

**Wiring proof that `bind()` reaches the Rust route and maps its refusal shape:** `seat-policy.test.mjs` "a refusal is a decision that comes back as a value, never as an exception" (crate refusal to a value) with `bind.test.mjs` "headless session refuses when no candidate executor is found" (refusal to the Node `refused.reason`) and `client.test.mjs` "the real host answers a bind..." / "a refused seat comes back as a result...". Untouched.

Untouched by the same rule (config loading, facade facts, committed-config properties): `bind-committed-config`, `bind-tier-composition`, `seat-policy`, `explain`, `tier-cell`, `tier-fallback-config`.

## New golden cases fail when their rule breaks (spot checks, reverted)

- Dropping the `failed_accounts` filter in `rank.rs`: the new lease-conflict cases and two older multi-round cases failed.
- Letting the global `maxTier` win over a capability's own in `policy.rs`: the new "capability maxTier below the global cap" case failed, along with four older ones.
- Both files restored (`git status` clean for `packages/`).

## Evidence

- `cargo test -p fgos-seat-binding`: golden 5/5 and crate tests pass (82 to 96 cases). No Rust source changed, so clippy, fmt and the msvc/darwin checks have nothing new to see.
- Focused set (phase list plus account-rotation, partial-writes, run-pre-admission, architecture, doc-health, citation drift): 292/292.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared; census regenerated at each commit. `check-undefined-names`: clean.
- Time: `run-provider-failover.test.mjs` 138 s (31 tests) to about 20 s (6 tests). `run.test.mjs` 144 s with 78 tests (was 89); new refusal file about 3 s.

## Net size

| | Estimate | Measured |
|---|---|---|
| Node src | -85 | -74 (+63 / -137) |
| Tests (test/ lines) | about -1 100 | -935 (+620 / -1 555) |
| golden JSON | not counted | +547 lines, 14 cases |

Shortfall in tests: the Node seat files that only test the facade stayed (by the rule), and five failover proofs were kept beyond the three the phase named because a pure table cannot own them (pin admission, quarantine refusal, resume baseline, pinned run).

Full suite (`node scripts/run-tests.mjs`): tests 8 599 (was 8 653 before this phase), pass 8 564, fail 3, skipped 32, no `run-tests: ERROR` line. Failures: the known frozen V7n addendum, plus two account-lock tests (`facade-multiprocess` PID namespace / probe child, `provider-capacity` holder killed) that pass 42/42 when run alone: load from lanes running in parallel on this machine, files this phase does not touch.

## Deviations

- Failover file about 20 s, at the edge of the target, with six tests instead of three: the extra three are admission and pin wiring (about 4 s) that a table cannot own.
- `bind.test.mjs` is 34 tests, not about 20: the remaining ones are facade facts listed above.
- Doctor row uses the fixed headless session (above).
- New helper file `test/helpers/run-unit-repo-fixture.mjs` (shared by two test files).
- Extra files touched outside the phase list: `test/runner/execution/account-rotation.test.mjs`, `partial-writes.test.mjs`, `run-case-admission.test.mjs` (owners for retired behaviours), `docs/platform/seat-binding/spec.md` (exec-budget citation), `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` and `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` (row gone), `test/suite-baseline.json` (two deleted files).

## For other phases

- P13: re-measure the test layer; `run-herdr.test.mjs` source guard is still waiting for a behavioural transport proof (from P10).
- `src/setup/registrations.mjs`: only the posture row import and registration were touched.

Status: DONE_WITH_CONCERNS (see Deviations).
