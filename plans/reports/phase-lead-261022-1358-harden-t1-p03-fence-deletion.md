# Phase 3 report: Node fence deletion (harden-t1-p03-fence-deletion)

Status: untested, waiting for the build window. All edits are committed; no cargo, node --test or fgos command was run (only `node --check` on the touched modules and JSON parses).

Branch `harden/t1-p03-fence-deletion`, from `harden/t1-holder-lock-door` at d8708f6c8.

## Delta lines (git diff HEAD --numstat, before the report)

| Group | Files | Added | Removed |
|---|---|---|---|
| Deleted Node mechanism | `src/holder-lock/fences.mjs` | 0 | 514 |
| Doctor checks and row | `src/setup/holder-lock-checks.mjs`, `src/setup/registrations.mjs` | 17 | 195 |
| Registry | `src/holder-lock/registry.mjs` (-30 net), `lock-registry.v1.json`, schema | 40 | 150 |
| Moved into the Event Store lane's file | `src/verbs/events/migrate.mjs` | +94 | -3 |
| Rust test | `registry_rows.rs` | 0 | 3 |
| Retired test files (5) | `test/holder-lock/fences-*.test.mjs` | 0 | 1038 |
| Other test edits | holder-lock-checks, registry-contract, git-checks, one-door, checks, migrate-cutover-grant (+3 cases) | ~75 | ~270 |
| Docs | architecture-manifest (-1), setup-doctor-registry.md (2 tokens), CHANGELOG (+1) | 1 | 3 |

Whole diff: 23 files, +193 / -2054. The exact table is `git diff d8708f6c8..HEAD --numstat`.

## Test-cost line

Added 3 (`checkStopped` cases) + 1 (`lock-holders` scans `repo-config`, skips rows with no lock file); retired 5 files and 10 cases. Host spawns removed: the five fence files each spawned the host and real git repositories (`fences-stop-check` 4 quiesce scans, `fences-rust-locks` an `fgctl` activation); `holder-lock-checks.test` no longer spawns the host for `fixLockFences`. New spawns: two `sleep`/`node` children and a stub script in `migrate-cutover-grant`, no new host start. CLI-call before/after to be measured after "resume builds".

## Retired tests and their owners

| Retired | Owner now |
|---|---|
| `fences-main-door.test.mjs`, `fences-v1-ledger.test.mjs`, `fences-v1-tombstone.test.mjs` | behaviour removed (the mechanism) |
| `fences-rust-locks.test.mjs` "fgctl activates behind the fences" | `packages/distribution/rust/tests/activation_lock_multiprocess.rs`, `install_lock_multiprocess.rs` |
| `fences-rust-locks.test.mjs` doctor warns on a foreign holder of the Rust-caller locks | `test/setup/holder-lock-checks.test.mjs` `lock-holders` foreign flock case |
| `fences-stop-check` clean / blocker in root / blocker in linked worktree | `test/event-store/migrate-cutover-grant.test.mjs` (existing cases) |
| `fences-stop-check` ownPidChain climbs parents | behaviour removed; the chain now comes from `selfChain()` of the process door (proven by its own tests) |
| `fences-stop-check` late-starter, blocked-cutover, clean-cutover | behaviour removed (`placeFences`/`fenceCutover` are gone) |
| `fences-stop-check` excluded pid is not counted | new case `checkStopped does not count a pid the caller declares as its own...` in `migrate-cutover-grant.test.mjs` |
| `fences-stop-check` linked worktree counts only when listed | new case `checkStopped counts a process working in a linked worktree only when the caller lists that worktree` in `migrate-cutover-grant.test.mjs` |
| unreadable-entry blocker (no old test; the Rust route owns the counting at `route.rs:609`) | new case `checkStopped reports unreadable process entries as a blocker of their own` (stub host that prints the contract JSON; wiring proof of the Node mapping only) |
| `holder-lock-checks.test` three fence cases (`lock-fences` check/fix, owners, blocked fix) | behaviour removed |
| `holder-lock-checks.test` fence case "an unused controller fence does not turn a channel without activation red" lived in `git-checks.test.mjs` | `test/setup/git-checks.test.mjs` `the journal row fails with git-fence-missing when a Git WAL has lost the controller activation fence` (the wiring case) |
| `registry-contract.test` "schema rejects a 4.2 lock without a fence", "every lock owned by 4.2 has a fence...", "a tombstoned lock never takes its v3 lock..." | deleted data; the schema is `additionalProperties: false`, so "registry validates against its schema" proves no fence column returns |
| `registry-contract.test` fence/v1 halves of the repo, Rust-owned and event-store row cases | halves removed; the rank, scope and v3Path halves stay in the same cases |
| `registry-contract.test` `placeFences`/`fenceStatus` on the controller fence | `apps/fgctl/tests/git_wal_activation_gate.rs:255-264`; the three `repo-config` assertions stay |

Judge-vector checks (`registry-contract.test` :161, :169, :181 in the old file) were not touched.

## migrate.mjs diff, for GIT / Event Store review (H18)

`src/verbs/events/migrate.mjs` only gains code; nothing of its existing logic changed except the two import lines.
- Imports: dropped `checkStopped` (fences.mjs) and `workspaceListing` (holder-lock-checks.mjs); added `spawnSync`, `createGitInspect`/`gitPortOptions`, `resolveHostBin`, `selfChain`.
- Added before `migrateUseCase`: `SCAN_PROTOCOL`, `SCAN_TIMEOUT_MS`, `ownPidChain` (now `[...new Set([process.pid, process.ppid, ...selfChain()])]`, the process door, same expression `src/runner/lock-fence.mjs` uses), `workspaceListing`, `hostError`, `scanWorkspace`, `checkStopped` (exported, byte-for-byte the old body). `migrateUseCase` is unchanged and still calls both.
- Review with `git diff d8708f6c8..HEAD -- src/verbs/events/migrate.mjs`.

## Corrections of D4 applied

- `checkStopped`/`workspaceListing` moved in the same commit that deletes their old home.
- `cutOverLockFiles` now filters by `lock.name in LOCK_FILES`: `repo-config` joins `lock-holders` (19 locks scanned, was 18); `attempt`, `event-seal`, `event-append` have no enumeration and are skipped instead of throwing. Test `lock-holders scans every registry row that has a lock file...` owns it; the two `of 18 locks` messages became `of 19 locks`.
- `ownPidChain` no longer reads `/proc`; `test/process/one-door.test.mjs` lost the `fences.mjs` row.
- Registry v1 readers and columns: `fence`, `fenceNote`, `v1Path`, `v1Shape` gone from every row and from the schema (with the `owner == 4.2` rule); `resolveLock` returns `{ name, kind, scope, rank, v3Path, lockDir }`; `fillTemplate` lost `strict`, `os.tmpdir()`, `encodeURIComponent(cwd)` and `~/`. No v3 template uses them (checked against the file).
- Kept: owner enum values (including room for `"documentation"`: not narrowed, but also not added, since DOC's row is not on this branch; re-apply the column deletion to the `documentation-cutover` row if DOC lands first). Rust WAL tombstone files untouched. Event Store rows lost their `fence`/`v1*` columns and `registry_rows.rs` lost its three asserts in the same commit.

## No code reads a v1 lock path

```
rg -n "fences\.mjs|checkLockFences|fixLockFences|lock-fences|isCutOverLock|fenceStatus|placeFences|v1Path|v1Shape|\"fence\"" src bin test packages/holder-lock packages/event-store docs/architecture-manifest.json
```
returns nothing (run on the final tree).

## Files outside phase-03's list that I had to touch

- `src/holder-lock/protocol.mjs`: comment named `fences.mjs`; now names `migrate.mjs`.
- `test/setup/checks.test.mjs`: expected doctor id list lost `lock-fences`.
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`: `test/setup/registrations.test.mjs` compares its "Today's registered checks/fixes" lists to the registry, so the two `lock-fences` tokens had to go.

## Left for phase 5 (spec text) and for the build window

- Still mention `lock-fences`: `docs/specs/distribution.md` rows 5g, 7, 7b and history lines, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:281`, `docs/specs/reading-map.md:57`, `docs/platform/holder-lock/spec.md` (fence prose, §12/13/18). Not edited here.
- `test/runner/lock-status.test.mjs` named in the phase verification does not exist in this tree; skip it or point at the right file.
- Regenerate after "resume builds": `packages/git/contracts/mutation-census.v1.json` (it lists `fences.mjs` and a `holder-lock-checks.mjs` spawn row, and `migrate.mjs` gains a `spawnSync` site), `test/suite-baseline.json`. Not touched.
- Run: the eight one-file tests of phase-03, `cargo test -p fgos-event-store --test registry_rows`, `cargo test -p fgos-holder-lock --test scope_rank`, then `fgos doctor` on the dev host (no `lock-fences` row; `lock-holders` counts 19 locks).
- Risk to look at first: the stub-host case and the `sleep` case in `migrate-cutover-grant.test.mjs` have never run; `workspace-only` scans may behave differently from what I assumed for `sleep` (the old fence test used the unscoped host).
