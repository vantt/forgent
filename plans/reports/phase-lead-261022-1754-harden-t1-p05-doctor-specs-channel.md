# HARDEN T1 phase 5: doctor merge, specs, checkout channel (phase lead report)

Branch `harden/t1-p05-doctor-specs-channel` from `harden/t1-holder-lock-door` at `a9f131f0e`. Cargo target `/home/vantt/projects/forgent-worktrees/harden-t1-p05-target`. Node tests ran one file group at a time with the dev host and addon staged by `ensureGitAddon`, `env -u CLAUDE_CODE_SESSION_ID`, `</dev/null`. Commits: `803bb84ab` (docs), `c125931bf` (code, tests, contracts, census, baseline), plus this report.

## Doctor table (old row, condition, surviving row)

| Old row | Condition | Surviving row | Reached by |
|---|---|---|---|
| `lock-kernel-semantics` | fail: no driver, lock root unresolved, `unsupported`/`none`, probe red; warn: directory missing | `lock-kernel-semantics` | `holder-lock-checks.test.mjs` (semantics warn/pass, `guaranteeRefusal`) |
| `lock-kernel-semantics` (new facts) | pass line prints `stateRoot <root> (<source>)` and `killWaitMs 2000 (fixed)` | `lock-kernel-semantics` | same file, message suffix assertion |
| `lock-borrow-vectors` | red vector or sibling, unavailable, protocol mismatch, other exit | `lock-borrow-vectors` (unchanged) | `holder-lock-checks.test.mjs` borrow-vectors case |
| `lock-holders` | warn: foreign holder with pid and cmdline; predecessor domain not dead, unknown version, unreadable, not JSON, Windows job; info: unlistable | `lock-holders` (unchanged) | the existing four `lock-holders` cases |
| `lock-record-unreadable` | warn: hot record (`state`, `porting-events`) cannot be read, open by another process, does not parse; `unknown` judge beyond 5 minutes grace | `lock-holders` (same texts, same next step `fgos lock fence <resource>`) | five moved cases, below |
| `lock-fences` | (gone in the fence-deletion phase; `git-fence-missing` is `git-operation-journal`'s) | none | `git-checks.test.mjs` journal case |
| `lock-predecessor-kill-wait` | (gone with the key in the lock-door phase) | `lock-kernel-semantics` prints `killWaitMs 2000 (fixed)` | semantics case |
| `state-root` | fail: cannot resolve | `lock-kernel-semantics` (fails by name, prints the root) | semantics case (pinned pass line); unresolved path is the existing "lock root unresolved" failure, now fed by the door |
| `state-root` | fail: Node and host disagree; pass line "without the pin the host resolves ..." | removed with Node's resolver (the door and the host run one Rust function) | `state_root_vectors.rs` owns the formula |
| `writer-identity-resolvable` | fail: no host, mismatch or error | unchanged (phase 6 owns its body) | existing cases |
| `convention-conformance` | fail: post-cutoff violations | unchanged | existing cases |
| config default `lock` / fix `lock-dirs` | | default already deleted in the lock-door phase; fix stays | `lock-dirs` case |

Dev-host `fgos doctor --json`: `lock-*` rows are exactly `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`; no `state-root`. `lock-kernel-semantics` ends with `stateRoot /home/vantt/.local/state/fgos (pinned); killWaitMs 2000 (fixed)`. Together with `writer-identity-resolvable` and `convention-conformance`, five rows.

## State-root route and callers

Deleted: `fgos internal state-root` (route arm and `state_root_route` in `packages/holder-lock/rust/src/route.rs`), `packages/holder-lock/contracts/internal-route.state-root.v1.json`, `runStateRootRoute` in `src/holder-lock/driver.mjs`. `resolveStateRoot` is now the pin, else `doorStateRoot(env)` (one line in `driver.mjs` over the existing `holderLock.stateRoot`), else `lock-driver-unavailable` with reason `addon-not-shipped` naming `npm run fgos:dev` (not cached: it is a pure function of `env`, and the vector test passes different environments). `apps/fgos/src/main.rs`: comment only. `state_root.rs`: untouched. Callers: `rg "resolveStateRoot\("` lists 17 `src` and test sites; they pass a `fgosDir` that is now ignored (signature stays tolerant, no caller edited, as the phase file says). Scripts: none call the route or `resolveStateRoot` (`scripts/run-tests.mjs` stopped using the route in the lock-door phase).

## Δ lines (staged diff, this phase)

| Group | Added | Deleted | Plan estimate |
|---|---|---|---|
| Node `src` | 91 | 181 | −132 |
| Rust production | 3 | 17 | −15 |
| Rust tests | 0 | 15 | −12 |
| Contracts (JSON, incl. 1 deleted file, 34 lines) | 2 | 37 | −34 |
| Node tests | 72 | 105 | −120 (see below) |
| Docs and CHANGELOG, AGENTS.md | 77 | 99 | not counted |
| Generated (census, baseline) | 32 | 40 | n/a |

Node src is −90 net against −132: the facts line and the moved hot-record function (about 50 lines) landed where the plan counted 30. Node tests are −33 net: the five lock-record cases moved (about 55 lines) rather than the 40 estimated and the state-root test kept every vector.

## Test-cost line

Added 0 new behaviours. Retired: `state-root: Node and the host agree` (behaviour removed); `internal-routes.test` state-root case and the three state-root entries of the protocol-mismatch loop; `internal_lock_routes.rs` `state_root_route_resolves_the_one_root` and three protocol entries; file `test/setup/lock-record-checks.test.mjs`. Moved: the five lock-record cases, re-titled `lock-holders: a hot record ...` in `test/setup/holder-lock-checks.test.mjs`. Test calls 8,193 baseline before this phase, 8,129 after the baseline regeneration (594 files, 56 known clones). Host spawns removed: `state-root.test` unpinned vectors (3 route spawns become door calls in the existing child), `internal-routes.test` state-root, `internal_lock_routes.rs` state-root. New spawns: none. CLI-call cost not re-measured (nothing here touches the CLI start path).

## Retired tests and new owners

| Retired | Owner now |
|---|---|
| `holder-lock-checks.test` "state-root: Node and the host agree; a pinned root also shows the unpinned answer" | behaviour removed (Node no longer resolves); formula owned by `packages/holder-lock/rust/tests/state_root_vectors.rs`; door wiring by `test/holder-lock/state-root.test.mjs` (every vector, unpinned ones through the door in a child) |
| `internal-routes.test` "state-root answers the pinned root and its lock root" | `state_root_vectors.rs` |
| `internal-routes.test` and `internal_lock_routes.rs` protocol-mismatch entries for `state-root` | route removed; the survivors in the same loops own the generic behaviour (`protocol_and_usage_errors_fail_closed`) |
| `internal_lock_routes.rs` `state_root_route_resolves_the_one_root` | `state_root_vectors.rs` |
| `test/setup/lock-record-checks.test.mjs` (5 cases) | moved, not dropped: `holder-lock-checks.test.mjs` `lock-holders: no hot record passes`, `... live process ... passes`, `... does not parse ... for the right resource only`, `... without a pid is unreadable`, `... foreign namespace warns only after the grace` |
| `test/holder-lock/state-root.test.mjs` "without a pin and without a host binary the root is not guessed" | same title, new behaviour: "... without the addon ... error names the dev door" (reason `addon-not-shipped`) |

## Verification (all green unless noted)

- One-file runs: `holder-lock-checks` 15 cases pass (with `state-root`, `driver-unavailable`, `facade-multiprocess`), `checks` 110, `checks-doctor-config`, `registrations`, `internal-routes`, `terminal-control/contracts`, `architecture`, `dispatch-reconciliation-import-graph`, `test/docs/*.test.mjs`, `git-checks`, `one-door` (process and git), `hot-lock-contract`, `hot-lock-tx`. Last grouped run: 248 pass, 0 fail.
- `cargo test -p fgos-holder-lock` all ok; `cargo test -p fgos --test internal_lock_routes` 6 ok.
- Census regenerated with `node scripts/git-one-door-scan.mjs --root . --write-census`: the 5 known `unresolved-binary` sites only. Baseline with `node scripts/test-proof-inventory.mjs --write-baseline`.
- Greps for `internal state-root`, `lock-fences`, `lock-predecessor-kill-wait`, `lock-record-unreadable` (as a row id), `state-root` (as a row id), `predecessorKillWaitMs`, `runStateRootRoute`, `internal-route.state-root` over `src bin test docs packages apps scripts AGENTS.md`: only history and decision text (holder-lock spec section 20, distribution.md dated entries, process spec history line, CHANGELOG) and `lock-record-unreadable` as the hot-lock error reason (not a row).

## Files outside the phase file's list that I had to touch

- `src/setup/git-checks.mjs`: loads the addon before asking the state root, so an addon-less channel keeps reporting `addon not shipped` (its test failed after the route went).
- `test/terminal-control/contracts.test.mjs`, `packages/terminal-control/contracts/internal-route.terminal-control.v1.json`: they pointed at the deleted contract; now `lock-fd` and `state-root.vectors.v1.json`.
- `packages/holder-lock/contracts/state-root.vectors.v1.json`: dropped its `route` field.
- `test/holder-lock/driver-unavailable.test.mjs`: the state root now reports `addon-not-shipped` like every lock door.
- `docs/architecture-manifest.json` (deleted file's row), `docs/specs/work-state.md`, `docs/platform/run-supervisor/spec.md`, `docs/platform/process/spec.md` (one sentence each naming the removed config key or row).

## Notes for the big lead

1. The holder-lock spec section 9 no longer states a `src/holder-lock/` line budget: the directory is 1,784 lines today (driver 254, hold-transport 498, index 707, others), above the 1,650 the phase file named. The spec text says nothing about a number; a budget is the lead's call.
2. `process/spec.md:112` and session-identity spec text stay with the identity phase. The DOC message (H12 pattern) is for the lead to send; files touched: holder-lock spec, component-boundary, reading-map, distribution, how-to doctor doc, setup-doctor-registry, work-state, run-supervisor and process specs (one sentence), AGENTS.md, CHANGELOG.
3. About 17 callers still pass a now-ignored `fgosDir` to `resolveStateRoot`; removing the argument is a mechanical sweep I left out of this phase (RUL104 would move them together; it touches many files outside T1).
4. The full suite was not run (big lead's window).

Status: DONE_WITH_CONCERNS
