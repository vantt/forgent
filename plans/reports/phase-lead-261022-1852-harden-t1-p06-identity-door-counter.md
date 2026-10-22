# HARDEN T1 phase 6 report: identity door, one depth counter, T0 carry list, dead `fgosDir`

Branch `harden/t1-p06-identity-door-counter`, from the integration branch at `36e20ef81`. Plan: `plans/261022-0851-harden-t1-holder-lock-identity-door/phase-06-identity-door-counter-t0-carry.md`.

## Commits

| SHA | What |
|---|---|
| `ae778a00e` | Addon `sessionIdentity.{resolve,mintAttempt}` over `fgos-identity`; door checks `versions().sessionIdentity`; `Relation` gains `session` and `tty_nr`; `proc_tree.rs` reads through `facts::relation_of`; `fgos internal identity mint-attempt` deleted (`route.rs` and the `main.rs` arm) |
| `62c74e001` | Facade 64 lines, 4 exports; one counter (`hotLockDepth`); `state-lock-held.mjs` deleted; `door.mjs` and `payload-root.mjs` to kernel in the manifest; tests retired and rewritten |
| `10a065b38` | T0 carry list: staging judge, `run-lock.mjs` forwarders, `uniqueTmpTag` temp names |
| `8cd007564` | Dead `fgosDir` argument removed from every `resolveStateRoot`/`resolveLockRoot` caller |
| docs commit | identity §7a, process spec, component-boundary, reading-map, CHANGELOG |
| census commit | census and suite baseline regenerated |
| report commit | this report and T0 phase 07 marked done |

## Measured cost

`resolveWriterIdentity` uncached, through the door (p50 of 20 000 calls, debug addon, under background cargo load): **36 µs** (p95 37 µs). Baseline: 1.41 ms spawn, 0.9 µs cached. So it is about 39x cheaper than the spawn and about 40x dearer than the old cache hit. `mintAttemptWriterId` p50 0.33 µs (a pure function; the old route cost a spawn).

Review fix (cache restored): the first version dropped the cache, which made `withStateTx` pay about +44 µs of identity per call when `prefetched.writer` is absent (the fast-path test read 4.6x). The facade now keeps a minimal per-process cache keyed on the three env variables the rule reads (`ENV_ORDER` in `resolve.rs`), plus the resolved fgos dir for `env` and `registry` answers; `pid` and `unresolved` answers are kept by env alone, exactly as the old facade did; failures are never kept; no TTL. Facade is 69 lines, 4 exports.

`withStateTx` p50, quiet runs, tmpdir on ext4 (disk fsync makes some runs bimodal at about 50 µs for both sides): **about 29 µs with the cached identity, about 26 µs with `prefetched.writer`**, so the cache hit costs about 3 µs; uncached it was about 70 µs. The 19.6 µs baseline was measured on another machine state; same-run raw steps here are 19-22 µs. The fast-path test is restored to its original form (primes the cache once, then times plain `withStateTx`, no `prefetched.writer`) and reads 1.35-1.48x against the 2x bound.

## Δ lines against `36e20ef81`

| Area | Added | Removed | Plan estimate |
|---|---|---|---|
| Node `src/` | 65 | 285 | −215 |
| Rust (`.rs`) | 48 | 127 | +7 |
| Node tests | 97 | 378 | −320 |
| Docs and CHANGELOG | 16 | 16 | n/a |
| Generated (census, baseline, `Cargo.lock`, manifest) | 34 | 52 | n/a |

Rust is net smaller than the plan's +7 because `route.rs` (63 lines) went with the route decision. `session-identity.mjs` 238 to 64 lines.

## Test-cost line

Suite baseline: 594 files / 8129 `test()` calls to 593 / 8121. Added 0 test cases (the env-vector case, which also proves a changed env gives a changed answer through the cache,, the probe-activation case and the missing-addon case rewrite retired ones). Retired: 5 cases in `session-identity.test.mjs` (14 to 9: cache key list, two cache-count cases (exec counts; no exec remains), no-exec-under-lock, verb argv and env folded into the probe case), the file `identity-before-lock.test.mjs` (175 lines), 1 case in `exec-budget.test.mjs`, 3 Rust unit tests in `proc_tree.rs`. Host spawns removed: about 12 per `session-identity.test` run, every write path in `identity-before-lock`, the route spawn in `attempt-writer-id`. New spawns: none.

Owners of what was retired:
- cache key and exec-count cases: no exec to count; the cache's env keying and the answer stability are asserted in the env-vector case (it sets each env vector in turn in one process and asks twice), and `golden.rs` owns the rule;
- no exec under a lock: removed (nothing spawns); the spawn guard under the hot mutex is owned by `hot-lock-guard.test.mjs`;
- seat-binding refusal inside the provider-state lock (`exec-budget.test.mjs`): behaviour removed; the refusal inside the hot mutex is owned by `client.test.mjs` ("a process inside the hot mutex never execs the host");
- `proc_tree.rs` parser tests: owned by `facts.rs` (`parses_parent_group_and_start_from_a_stat_line_with_spaces_in_comm`, and the one-process read now asserts `session`); the rule by `golden.rs` (unchanged, green);
- hung host and non-JSON answer: rewritten against `probeIdentity` (`host-error`), not retired.

## Verification

- `cargo clippy --workspace --all-targets -- -D warnings`: clean. `cargo fmt --all -- --check`: clean. `cargo test -p fgos-identity -p fgos-process -p fgos-node-addon -p fgos`: green (identity golden vectors unchanged). `cargo test --workspace`: 1260 passed, 0 failed.
- Node, focused, `env -u CLAUDE_CODE_SESSION_ID`, env from `ensureGitAddon`: identity facade, `attempt-writer-id`, doctor `writer-identity-resolvable`, `hot-lock-*`, `test/state`, `test/util`, `test/holder-lock`, `test/seat-binding`, `test/session-identity`, `test/architecture.test.mjs`, the import-graph test, `test/rust-host/internal-routes.test.mjs`, registrations, assignment, run, unit-summary, provider-capacity, run-lock, git-checks, hook e2e tests: 1601 + 391 + 54 tests, 0 failures.
- Greps (outside history text): `state-lock-held`, `noteLockHeld`, `stateLockHeld`, `identity-in-lock`, `IDENTITY_ENV_KEYS` (now only a test helper that reads the contract, `test/helpers/identity-env.mjs`), `isProcessAlive`, `mint-attempt`, `fgos-session-identity`: none left in `src`, `bin`, `test`, `packages`, `apps`, `scripts`. The new CHANGELOG line and spec decision-history lines name the deleted things on purpose. `rfind(')')` in the four crates: `facts.rs` only. `execFileSync` in the facade: only inside `probeIdentity`.
- Census: 5 `unresolved-binary` sites, the known red (CFG `03c99bc61`), no new ones.

## Decisions and deviations

1. `fgos internal identity mint-attempt` deleted with its `main.rs` arm and `route.rs` (big lead answer 1). `apps/fgos/src/main.rs` is a shared file: say so on the board when this lands (the board row and the MAIL announcement of the new public items `Relation::{session, tty_nr}`, `sessionIdentity` addon namespace, and the removed route are the integrator's, not written here).
2. `host-error` kept for the doctor probe (answer 2). The probe's non-JSON, wrong-shape, hung and failed answers are all `host-error`; `timeout`, `bad-output`, `identity-in-lock` are gone.
3. Provider-state lock: `rg -n "seatBinding|createSeatBindingClient" src/runner/dispatch/provider-capacity.mjs` found nothing before the change, so its note was not guarding a Seat Binding exec; the note and the lock's refusal went.
4. The seat-binding client's `seat-binding-in-lock` keeps its name; it now fires under the hot mutex only. It also means a `spawnSync` there is covered by the hot-guard child-process guard.
5. `hot-lock.mjs`: only the import, `noteLockHeld()` and the `try/finally` around `releaseRecord` that existed for `noteLockReleased()`. The rest of `:227+` is untouched.
6. T0 staging judge: `resolveHolderLiveness` answers only `dead` or `held` (an `unknown` judge maps to `held`), so the code is `!== 'dead'` to keep the directory, equivalent to "removed only on dead". An existing test ("a live sibling staging directory is never removed during admission cleanup") already owns the keep case; no unjudgeable-holder wiring case was added because none can be built without faking the process table.
7. Files outside the phase's list that I touched, and why: `test/helpers/identity-env.mjs` (new, 6 lines: three test files stripped the identity env through `IDENTITY_ENV_KEYS`, which the phase deletes from the facade; one helper reads the list from the contract instead of three copies); `test/holder-lock/windows-hot-lock.test.mjs`, `test/run-supervisor/windows-custody.test.mjs`, `test/state/store.test.mjs` (they imported symbols the facade no longer exports); `src/runner/worktree.mjs` `provisioningStateRoot(repoRoot)` and `src/run-supervisor/direct-launch.mjs` `attemptStepEnv({fgosDir})` lost a parameter whose only use was the removed argument (their one caller in `assignment-runner.mjs` was passing a string where an options object is taken, so it never worked).
8. Not done here, left to the integrator or the lead: the parent plan's phase 01 "Constraints" done line (that file is outside my list), the board row, DOC and MAIL notices, the CLI-call cost paste. GitNexus `detect_changes` was not run (no MCP access in this session); impact analysis for this change is the grep set above plus the focused test runs.
9. Out of scope and failing here: `test/rust-host/{dev-host,fgctl-*}.test.mjs` need a prebuilt `target/debug/fgos` in the checkout (my build target is outside it); they fail at fixture setup, not on this change.
