# HARDEN T4 P07: not-started close and legacy deletion (lead report)

Branch `harden/t4-p07-not-started-close`, worktree `/home/vantt/projects/forgent-worktrees/harden-t4-p07` (from `origin/main` 315bc38d5), Cargo target `/home/vantt/projects/forgent-worktrees/harden-t4-p07-cargo` (left for the big lead). Machine load stayed below 3 (no load warning). Owner answers used: OQ-1 (a), OQ-2 (a). Not pushed, not merged.

## Commits
- `1c309954c` feat(run-supervisor): adopt closes an attempt that has its lock and no envelope; the legacy sweep is removed (code, tests, contracts, CHANGELOG, census)
- `2fd4da6a8` docs(run-supervisor): the legacy sweep file and its doctor row leave the manifest, the registry contract and the packaging spec (docs exception only: manifest row, doctor lists, row 7i)

## Census (read-only, nothing modified)
Machine fg-server2. Workspaces with `.fgos/assignments`: `/home/vantt/projects/forgent` only (`mdview` and `skillstation` have a `.fgos` but no assignments tree; no per-worktree trees; `~/.fgos` has none). `find` over `/home/vantt` for `attempt.lock`: only the forgent tree.
- forgent: 503 attempt dirs with `attempt.lock`, 503 `envelope.json`; **0 with lock and no envelope**. Split: with `controller/commands` 0, with `attempt-intent.json` 0, by `run.json` status n/a. The new rule closes nothing today.
- Outside real workspaces: `/var/tmp` and `/tmp` hold test leftovers: 2 693 attempt dirs with a lock, 1 without an envelope (`/var/tmp/fgos-test-fixtures-fhEjav/.../producer/1/runs/01`: a `fgos-spawn-worker-repo` fixture, no `controller/commands`, no intent, so `legacy-run` under the new rule) and 30 `/tmp/fgos-steps-fds-*` dirs that are not attempt dirs. Not supervisor-era attempts; not touched. No BLOCKED condition.
- The owner machine census is for the guide (old release, read-only).

## Per requirement
- **Lock from admission (OQ-1 a):** done. `acquireAttemptLocks` runs right after admission, before the probe and credential-renewal awaits; its inputs were all known (`resolvedExecutorId`, `compiledPlan.capability`, `cwd`, `effectiveMutation`, `opts.custody`, `attemptStr`). The single `try` now starts there; the old second lock site is gone (the segment between admission and the old `try` is reindented two spaces, `git diff -w` is +71/-48). A resumed attempt that already has an envelope or a pre-supervisor launch record takes no lock (adopt judges it with the lock free, as before; it never launched here). `finally` now only gives back the lease and run control once run control was taken, so early returns behave as before.
- **Known limit of the lock move:** a kill on the instruction(s) between the run record and the lock (all synchronous: no await), or a failure of the host binary resolution that sits just before the lock, leaves `run.json` `running` with no lock or no intent: `legacy-run`, no door closes it, `fgos run --resume` refuses it by name (`attempt-legacy-run`, message now points to `fgos dispatch inspect`). Also: a kill after the home directory is made but before the prepare publishes its finalization descriptor leaves a private home no finalizer can find (it existed before this phase for the same edge). Both go to the spec hand-off.
- **Intent (OQ-2 a):** `attempt-intent.v1.json` contract, writer `writeAttemptIntent` in `direct-launch.mjs`, steps from one shared `attemptSteps` used by `buildEnvelope` too. Deviation: written with `publishMutableProjection` (atomic replace under the held lock) instead of once, so a resumed attempt that never got an envelope carries the intent of its new launch; removed by the controller in `finally` when it settled the run with no envelope (refusal, already-answered resume), so those do not show as stuck. The intent carries `mode` (the controller's) but the adopt-written envelope is always `direct` and `mutation: read-only` (no pane, no lease).
- **Adopt closes it:** `adopt.rs` `read_intent` (valid intent that names its own directory, no `controller/commands`), `publish_not_started_envelope` under the exclusive lock (`origin: adopt-not-started`, no launch command, digest from `envelope::digest`, start-refusal note code `no-envelope`), then the ordinary `drive`. Verdict reasons: `--probe-only` `needs-adopt` reason `no-envelope`; adopted line reason `start-refused:no-envelope`. Lock without intent and without envelope stays `legacy-run`.
- **Legacy deletion:** `legacy-sweep.mjs`, `checkLegacyAttemptsStuck`/`fixLegacyAttemptsStuck`, registration and fix, planner `abandon-legacy` intent and `legacy-holders` evidence, recover `applyAbandonLegacy`/`judgeLegacyHolders`/`legacyHolders`, the CLI intent text, `recover-actions` entry. `rg "legacy-sweep|sweepLegacy|judgeLegacyHolders|abandon-legacy|legacy-attempts-stuck|legacy-holders" src bin packages test` is empty except census and `test/suite-baseline.json` (TEST's). `legacy-run`/`abandoned-legacy` read sites stay.
- **Doctor 5 -> 4:** `fgos:dev -- doctor --json` lists `run-supervisor-route`, `runtime-socket-dir`, `run-attempts-stuck`, `run-supervisor-config`, all passing.
- **Docs exception (own commit):** manifest row deleted; registry contract "Today's registered checks/fixes" lists; spec #7, #7b lists and row 7i dropped. No backticked path to a deleted file existed under `docs/platform/**` (doc-health green).
- **Size:** `wc -l src/run-supervisor/*.mjs` = **1 057** (was 1 183): the plan's <= 1 000 target is not met (intent writer +40 in `direct-launch.mjs`). Concern for the big lead.

## Out-of-list edits (needed by the change, flagged)
- `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json`: two lines named the legacy sweep file and the adopt reasons; acceptance needs `packages` free of `legacy-sweep`.
- `test/runner/assignment-dispatch.test.mjs`: the "concurrent identical admission" test lists the refusal codes a second controller may get; with the lock first it is now often `attempt-in-flight`. One code added to its list.
- `test/fixtures/run-layout/legacy-stuck/` deleted (only the retired doctor test used it).
- `packages/run-supervisor/rust/src/supervise.rs`: `publish_start_refusal` made `pub(crate)`.

## Retired tests and owners
- `test/run-supervisor/legacy-sweep.test.mjs` (6): behaviour removed; supervisor-era window owned by `adopt_matrix::adopt_a_lock_and_an_intent_without_an_envelope_is_closed_as_not_started_and_the_steps_run_once` and `direct-crash-matrix` 7b.
- `direct-crash-matrix` 7a (kill before the lock) and 7c (envelope, no binding): 7a's window is one instruction now; 7c -> `adopt_matrix::adopt_no_binding_and_no_receipt_is_abandoned_not_started_and_the_steps_run_once`; 7b re-pointed to "home made and recorded, no envelope" and asserts receipt `abandoned-not-started` reason `start-refused:no-envelope`, the adopt-written envelope, home removed, run settled (real steps).
- `inspect-recover-adopt` two `abandon-legacy` cases (behaviour removed). Kept: "a run from before the supervisor reads legacy-run", the `abandoned-legacy` terminal-unit case (renamed), and a trimmed case for the already-settled park of a legacy run's unread result (the tail assertion of the old second case).
- `run-supervisor-checks` three `legacy-attempts-stuck` cases (behaviour removed); registration test now lists four rows.
- `resume-adopts` 9 kept (title and comment reworded; it builds the state by hand). `assignment-enumerator-guard` entry for the deleted file removed. `contracts-unit-state` action list updated.
- `test/suite-baseline.json` is TEST's: retired file `test/run-supervisor/legacy-sweep.test.mjs`.
- New Rust: `adopt_matrix` +2 (`adopt_a_lock_and_an_intent...`, `adopt_an_intent_is_closed_only_while_its_controller_is_gone_and_only_when_it_names_this_directory`; red on main, which answers `legacy-run`). New helper `not_started` in `tests/support/adopt_fixture.rs`. Test-cost: 0 new CLI/host spawns beyond the existing adopt harness; 7b reuses the existing real-run harness.

## Δ lines (origin/main..HEAD) vs estimate
- Node src: -200 (est. -240; `assignment-runner` +22 net, reindent not counted twice)
- Rust src: +97 (est. +35; intent validation, envelope synthesis, comments)
- Node tests: -249; Rust tests: +101 => tests -148 (est. -160)
- Contracts +18, docs -2.

## Test counts (what I ran)
- Rust (`packages/run-supervisor/rust`): `adopt_matrix` 16, `adopt_concurrency` 2, `supervise_portable` 2, `steps_runner` 9, `adopt_scan_perf` 10, lib 19: all pass. `cargo fmt --all --check` clean; clippy `-D warnings --all-targets` clean; `cargo check` msvc and aarch64-apple-darwin clean (crate `fgos-run-supervisor` only; full workspace is the big lead's gate).
- Node, focused (HERDR/CLAUDE env unset): `direct-crash-matrix` 5/5; run-supervisor group (resume-adopts, inspect-recover-adopt, direct-cutover, sweep, contracts x3, crash-matrix-adopt-resume, windows-custody, terminal-cutover, terminal-crash-matrix, adopt-client, attempt-steps, cancel-registry) 102 tests, 101 pass, 1 skipped (Windows); runner group (26 files naming `assignment-runner`, `direct-launch`, `recovery-planner`, `recover`, `run.mjs`) 990 tests, 1 red (concurrent admission, fixed above, rerun 49/49); setup/architecture/doc-health/registrations/checks/import-graph/recovery/custody/layout/one-door 255 tests with 4 red before the docs commit (manifest row, Data Dictionary #7 and #7b, one-way imports), all green after it (174/174 on the re-run set).
- Not run: full `npm test` and `cargo test --workspace` (big lead). The census scan reports 0 undeclared.

## Doc lines still needed (frozen; for DOC / P08)
`docs/platform/run-supervisor/spec.md`: line ~210 (`legacy-run` rule, now also "lock without envelope and without intent"; add the not-started rule and `attempt-intent.json` in the layout and the matrix), ~257 (resume `legacy-run` row: no doctor owner), ~329 (section 14 `legacy-attempts-stuck` row: remove), decision history entry; `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:206` and `docs/platform/runner/decisions/h-36d872fbb0e5.md:1813` (history, mark superseded); `docs/reading-map.md:186` (names the legacy check); `docs/decisions/index.md` is generated. `docs/backlog.md`: row for the two known limits above.

## For the owner-machine guide
Before this release: old-release read-only `fgos doctor` on all three workspaces; `legacy-attempts-stuck` must pass with nothing kept, else `fgos doctor --fix` with the old release first (after this release nothing settles a leftover legacy run). Run the census (lock, no envelope) read-only on each workspace; expect 0. What changes: a killed dispatch is closed by the next `fgos run`/`doctor --fix`; cwd lease held a few seconds longer; doctor shows four rows; `--intent abandon-legacy` is gone. Rollback: re-activate the previous release; `attempt-intent.json` files are inert for it, an adopt-written envelope reads as a closed v3 attempt, and the old sweep handles intent-only dirs as `running` legacy runs.

Unresolved: none blocking. Questions: (1) accept 1 057 vs the <= 1 000 line target, or schedule a trim? (2) accept the two known limits (instruction-wide kill before the lock; home made before its descriptor)?

Status: DONE_WITH_CONCERNS
Summary: Adopt now closes lock+intent+no-envelope attempts as `abandoned-not-started` (home finalized) and the legacy sweep, row, fix and `abandon-legacy` are gone; doctor is at four rows, all focused gates green, two commits on the branch, not pushed.
Concerns/Blockers: `src/run-supervisor` is 1 057 lines (target 1 000); Rust +97 vs +35 estimated; edits outside the file list (internal-route contract, `assignment-dispatch.test.mjs` refusal-code list, deleted fixture); known limits of the lock move named above; full `npm test` and workspace cargo gates not run.
