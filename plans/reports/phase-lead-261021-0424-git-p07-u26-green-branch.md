# Git phase 07 unit 26: make `git/p07-switch` green on this host

Branch `git/p07-switch` from `e2fff5a32` (already merges origin/main), worktree `.claude/worktrees/git-p07`, 2026-10-21 03:14–05:35 (Asia/Saigon). Real host: bwrap pid namespaces, herdr, `/var/tmp` writable, umask 002, governor `powersave`. Input: [host gate rerun](gate-261021-0312-git-p07-p08-host-gate-rerun.md), [u25 report](phase-lead-261021-0045-git-p07-u25-host-gate-fixes.md). 13 commits on the branch, nothing pushed, nothing merged, main checkout untouched.

## Result

Last full `npm test` in the worktree on the committed tree: **8781 tests, 8684 pass, 0 fail, 32 skip, 65 todo, rc 0**, `suite: 581 files, 8094 test() calls, 477 s wall` printed (log `/home/vantt/.claude/jobs/e1505f04/tmp/u26/full.log`). Six full runs in total: rc 1 with 4 failures and a leftover temp dir (before the last fixes), rc 1 with the hot-lock flake and the leftover dir, rc 1 with the leftover dir only, rc 1 with the hot-lock flake only, rc 0 (with log-only instrumentation of the fixture helper), rc 0 (clean committed tree, the numbers above). The leftover temp dir showed in the first three runs and in none of the last three on the same tree. Remaining intermittent items are under "Not closed".

Also: `cargo clippy --workspace --all-targets --locked -D warnings` rc 0; `cargo test -p fgctl` green under umask 002 (`git_wal_activation_gate` 2/2); `node scripts/git-one-door-scan.mjs --write-census` 0 undeclared sites (census committed; `configured-binary` is now 101, it was 100: `ensureHostBin` and the dev-host builder moved into `scripts/lib`). No Rust source changed; one Rust test fixture changed.

## Cluster by cluster (reproduced first, rerun after)

| Cluster | Reproduced cause | Fix (owner) | Proof |
|---|---|---|---|
| A (40) | `scripts/run-tests.mjs` and `scripts/git-addon.mjs` exported a partial addon descriptor as `FGOS_ACTIVE_MANIFEST_PATH`; `apps/fgos/src/legacy_exec.rs` parses it as a release manifest (`missing field 'entry'`). Reproduced, then also found: staged *other* releases (fgctl init/upgrade) inherit the pair and run the checkout payload (`addon not shipped`) | One builder, `scripts/lib/dev-host-manifest.mjs` (`devHostManifest`, `devHostEnv`), extracted from `scripts/run-rust-dev-host.mjs` (no second manifest code). The suite now stages `<addon dir>/manifest.json` in the dev-host shape and exports `FGOS_HOST_BIN`, `FGOS_ACTIVE_RELEASE_PATH`, `FGOS_ACTIVE_MANIFEST_PATH` exactly like `npm run fgos:dev`; the source digest moved to a sidecar file; e3-bench, p-release-checks and the event-store scripts follow. Tests that stage another release drop the pair (`withoutActiveRelease` in `fgctl-init-fixture.mjs`) | fgctl-init (6, 4, 4, 4, 3), fgctl-upgrade 16, fences-rust-locks, fences-stop-check pass solo; `native-addon.test` and `run-tests.test` mirrors updated |
| host skew (new, found here) | The branch bumps the holder-lock route protocol to 2; this machine's activated release speaks 1, and `npm test` from a worktree resolves it for the full-suite queue (`host-version-mismatch`) | `queueWithHostBin` probes the resolved host with `internal state-root --protocol <this checkout's>` and builds a checkout host when it does not answer; one test in `full-suite-queue.test.mjs` | solo runs and the full run start |
| B (14) | four fixtures without the activation fence | `activateGitFixture` in spawn-worker, run-case-admission, driver-rununit, work-path-case-admission | pass solo |
| C (6) | identity-before-lock: the stand-in host in front of the real one is not the host its manifest names, so the loader refused it. Others: see below | stand-in staged inside the checkout with a manifest built by `devHostManifest` | identity-before-lock 4/4 |
| D (13) + R6 | A refused run: `untrusted-driver-directory ... mode 0775` (harness state root created at umask 002) and no fence. The 120 s waits were the refused run never creating a brief or attempt directory | terminal harness and direct harness create the state root 0700 and call `activateGitFixture`; `confinement-registry-fixture.helper.mjs` creates its state dir 0700 | terminal-fallback, -cutover, -crash-matrix, resume-adopts, direct-crash-matrix pass; `crash-matrix-adopt-resume` 30/30 in 139 s solo (main 119 s) |
| F (3) | `src/setup/run-supervisor-checks.mjs` probed the run-supervisor routes with the holder-lock `PROTOCOL` (now 2); the host's four routes speak 1. Not a host/addon skew: a product regression of the bump | `src/run-supervisor/protocol.mjs` owns the protocol for the check, the client, direct launch and attempt step (three private copies removed); registered in `docs/architecture-manifest.json` | run-supervisor-checks 3/3 |
| E loop-rununit (3) | A failed round leaves its files in its dispatch checkout; the Worktree port never removes a dirty checkout, so the retry was refused at the reclaim (`worktree-fail` instead of `worker-failed`). The third test staged its stray file with a `post-checkout` hook the port never runs | `removeDispatchWorktree` resets a dirty dispatch checkout to its own HEAD through SafeRestore (snapshot first), then removes it (spec §3 "retry reset/clean → SafeRestore"). The staged-index case stages through a `worktreeSetup` command | loop-rununit 12/12, runner-loop e2e |
| E domain-aware-stage-literals (2), run-verb (1), p03 (1) | fence missing; p03 called `commitUnitWork` without custody and native baseline | fence added; p03 holds custody and captures the baseline before the producer runs | pass solo |
| E harness (2) | `fgos version` now runs ~22 driver git probes (not one); the child comparison saw the driver's per-process `git-floor-<pid>-<n>` name | the node double-count proof uses a fixture that starts git once (`fixtures/node-git-caller.mjs`); `compareResults` normalises the floor probe token | harness 100% |
| E check-decision-citation-drift (1) | a P08 doc line cited D-ADR0057 without a gloss | gloss added in `docs/specs/runner.md` | pass |
| E active-release-drift-check (1) | the test deleted the manifest variable in-process, which the Git addon loader reads | the linked-worktree case keeps the suite's manifest variable while the check reads only the release variable | pass |
| E runtime-coordination (1, plus 2 intermittent) | the one-spawn count assumed a `git` child; two settleClaim CAS tests ran an `addWork` and `acquireClaim` inside one millisecond, which the same-writer drift check counts as the claim's own event | counts `GitInspect.resolveRepo` calls at the addon; the two tests wait one clock tick | pass solo and beside `door.test` |
| E event-store door (1) | the scan classifies `decodeLegacyFiles` and `branchKey` (no product caller, only tests pass loader options) as `uncalled-wrapper` | the class excluded in the door test's second assertion (see changes below) | pass |
| E e2e-consumer-noncoding (1) | not a regression: the owner's plan Q1 answer (read-only workflow runs outside a repository, "the runner change lands in phase 07") was never built | built: `resolveGitRoots(cwd, { allowNoRepository })`, `assertRepositoryForWrites`; `startWorkflow`/case verbs and `runUnit` use them; a unit with `writes` or a sync ref is refused before any unit run exists. Spec §18 item 8 closed, CHANGELOG line | e2e-consumer-noncoding 2/2; two new proofs in `run.test.mjs` (the refusal) |
| exit 13 | `run-tests.mjs` awaits `import('./test-proof-inventory.mjs')`; that graph reaches `git-ports.mjs` → `git-addon.mjs` → `run-tests.mjs`, a cycle through a module with a pending top-level await. Deterministic when the launcher is main (earlier checks imported it instead) | staging and `ensureHostBin` moved to the leaf `scripts/lib/git-addon-stage.mjs`; launcher and `git-addon.mjs` import it; 4 test imports updated | the suite report prints; `run-tests.test.mjs` computes the static import closure (positive control included, negative control run by hand) |
| cargo | `git_wal_activation_gate` created its state root at the process umask | `set_permissions(0o700)` | passes at umask 002 |

### C: the npm channel (doctor-fresh-run, install-packaging, git-checks)

Decision applied: one door, no addon-less Git read path. The loader's refusal reads `git-addon-unavailable: addon not shipped on this channel: onboard this project with \`fgctl init\`` (was "until M10"); `doctor`'s Git info row uses the same text. `docs/specs/distribution.md` Entry Points and a dated history line, CHANGELOG `[Unreleased]` line.

This is a behaviour change, not a weakening: the old assertions proved that `fgos init` from an `npm pack` install succeeds in a fresh project, a route that no longer exists. Old → new:

| Test | Old assertion | New assertion |
|---|---|---|
| `doctor-fresh-run` | init, setup, doctor, doctor --fix all exit 0; four doctor checks pass; `fixed` array present | `fgos init` exits non-zero, stderr matches the new message (names the addon and `fgctl init`), the project directory is byte-for-byte unchanged |
| `install-packaging` | init exits 0, `.fgos/` created in the external cwd, not in the prefix, repo `.fgos` not leaked | init exits non-zero with the same message, no `.fgos/` in the external cwd or the prefix; the repo `.fgos` leak check is kept. Packaging-content assertions untouched |
| `git-checks` (addon-less row) | `info: addon not shipped` | `info: addon not shipped on this channel: onboard this project with \`fgctl init\``; the child no longer blanks `FGOS_HOST_BIN` (that resolved the machine's activated host, protocol 1 here) and drops only the manifest pair, the thing the row is about |

The doctor-state-after-init behaviour is owned by the `fgctl init` tests, which run the real runtime tail (init, doctor --fix, doctor); it is not reachable on the npm channel any more.

## Assertions changed (design principle 8)

- `door.test.mjs` second assertion: event-owned `classes` must be empty except `rust-test`; now also except `uncalled-wrapper`. A wrapper no product code calls reaches no spawn; a later caller turns it into a site or `configured-binary`, which both assertions still judge. The first assertion (no event-store site) is unchanged.
- `harness.test.mjs` HIGH-2: "`fgos version` spawns exactly one git" retargeted to a fixture that starts git once; the behaviour under test (spy and PATH shim do not double count a `node:` entry) is the same. `compareResults` ignores only the `git-floor-<pid>-<n>` token.
- `runtime-coordination.test.mjs` readClaims: spawn count → `resolveRepo` count (same invariant, one resolution per read). Two CAS tests wait one clock tick between item and claim (fixture, assertions unchanged).
- `loop-rununit` staged index: hook → `worktreeSetup` command (the Worktree port runs Git without hooks); assertions unchanged.
- p03 commit test: same assertions, plus the custody and baseline the API now requires.

No test was skipped, deleted or loosened elsewhere; new tests: `full-suite-queue` (host protocol), `run-tests` (import cycle), `run.test.mjs` (two: no-repository roots and refusal).

## Not closed

1. **Intermittent run failure, three of six full runs (the first three): `run-tests: ERROR: test suite left temporary directories behind: fgos-direct-repo-*: 1`** (a direct-harness project). Not reproducible in isolation (5 direct-harness files together, repeated), not reproduced in the clean final run. Instrumented runs showed no removal error; a late writer recreating the directory after its removal fits but is not proven. `removeCreated` now retries the removal (3 × 100 ms). Next step: if it recurs, log creation and removal per file as in this session's diagnostic (`CREATED`/`REMOVING` lines) to name the file.
2. **Hot-lock `fast path` ratio flake** (`test/state/hot-lock-multiprocess.test.mjs`), 2 of 6 runs; the same flake main has on this host.
3. `packages/distribution` `store::tests::test_lock_exclusive_and_release` failed once in the gate's cargo run; 240 runs here (4 concurrent × 60) never failed. Not isolated.
4. `process-facts-vectors` zombie flake did not fire here.
5. P-RELEASE, E3 and `cargo test --workspace` were not rerun (not in the brief).

## Notes for the coordinator

- The machine's activated release speaks holder-lock protocol 1; this branch speaks 2. Plain `fgos` here and any test that resolves the activated host (not `FGOS_HOST_BIN`) get `host-version-mismatch` until the owner machine restages and activates a release built from this tree (guide on the board after merge). `npm test` copes through the queue probe.
- Temp state: `/var/tmp/fgos-u26` (mine) and `/home/vantt/.claude/jobs/e1505f04/tmp/u26` hold scratch scripts and logs; no processes left.

Status: DONE_WITH_CONCERNS
Summary: The branch is green on this host: the last full `npm test` on the committed tree is rc 0 (8781 tests, 8684 pass, 0 fail) and the suite report prints again (exit 13 was an import cycle through a pending top-level await). All clusters A to F and E are fixed at their owners, plus the owner-decided read-only workflow outside a repository that phase 07 never built.
Concerns/Blockers: Three of six full runs failed on an intermittent leftover `fgos-direct-repo-*` temp-dir check (cause not isolated; none in the last three runs) and two on the known hot-lock ratio flake. The activated release on this machine is protocol 1, so the owner machine needs a restage and activation after merge.
