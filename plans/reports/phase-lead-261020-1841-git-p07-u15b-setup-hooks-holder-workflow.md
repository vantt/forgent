# Git phase 07 unit 15b: setup/hooks, holder listings, Workflow

Worktree `.claude/worktrees/git-p07-setup`, branch `git/p07-setup`, on top of the codex WIP `44abfcfa5`. No `git add`/`commit` was run.

## WIP review (44abfcfa5)

Kept: `src/setup/git-hooks.mjs` on RepositoryConfig (`inspectHooks`/`ensureHooks`/`removeOwnedHooksConfig`) and Inspect; the Inspect reads in `registrations.mjs` (tag, doc path at HEAD, `MERGE_HEAD`); `dir-guard.mjs`, `case-start.mjs`, `case-admission-port.mjs` and `unit-handoff.mjs` on Inspect, Worktree create (`createWorktreeCheckoutSync`), Worktree removal (`removeWorktree`) and Refs CAS (`deleteBranchRef`); the deletion of `src/workflow/integrate.mjs`, including its `fs.rmSync` fallback (spec §11).

Fixed:
- **Integrate step.** The WIP merged every unit of the predecessor step under a guessed `wf/<run>/<unit>` name, so a read-only unit (it has no branch) failed the step. A branch the target already contains also failed it, because Land refuses a fresh identity for an already-merged tip (§9). Now the step merges only units with a recorded `branch`. `mergeWorkflowBranch` returns `merged: false` when Inspect `ancestry` shows the source is already in the target. An unknown target fails the step with a named reason.
- **Land request.** `footprint: []` replaces `null`: the branch's committed paths are the own-file set, so unrelated dirt in the main checkout no longer blocks, as with the old `git merge`. Land pins the target itself (`target` is omitted). After `completeStep` is durably recorded, the step passes `workflow-run:<id>/step:<id>` as `consumerAcknowledgement` to Land `recover`, so delivered candidates are released (§9 cleanup admission). A cleanup warning never fails the step.
- **Import order.** In `workflow-runner.test.mjs` and `knowledge-doctor.test.mjs` the WIP put the `initFixtureRepo` import above `process-tmp-root`. It now comes after it.

## New work

- **Holder listings (phase file item "Holder-lock's own git listings").**
  - `src/holder-lock/fences.mjs` no longer spawns Git. `fenceTargets`/`fenceStatus`/`placeFences`/`fenceCutover` require `worktrees` and `branches` (both empty outside a repository).
  - `checkStopped` accepts a workspace as a root or as `{root, worktrees}`. Each worktree is passed to the host as `--dir`.
  - `src/setup/holder-lock-checks.mjs` gains `workspaceListing(repoRoot)`, which reads them through Inspect `listWorktrees`/`listBranches`.
  - `packages/holder-lock/rust/src/route.rs` `quiesce-scan` takes repeatable `--dir` (exactly one `--root` when present) and no longer runs `git worktree list`.
  - The route contract JSON and holder-lock spec §10/§12 are updated.
- **Setup.**
  - `checkNodeAndGit` reads Git through the fgos-git floor verdict (`gitFloor` in `git-checks.mjs`, via `inspectGit`) instead of `git --version`.
  - The convention check reads its root through Inspect `resolveRepo`, its cutover commit through `resolveCommit` and path existence at the cutover through `pathsAtRevision`. That is shared as `pathExistsAt`/`commitAt`; a blob over the read budget still counts as existing.
  - The doc-current-path check reuses the same helpers and resolves HEAD once.
- **Fixtures.** Setup tests that wire hooks now build their repository with `initFixtureRepo`, which writes the activation fence: `checks-setup-config`, `dir-resolution`, `uninstall-wiring-2`, `uninstall-wiring-3`. Without the fence, RepositoryConfig refuses with `git-fence-missing`; production keeps that refusal.

## Census rows

| Path | State |
|---|---|
| `src/workflow/integrate.mjs` | closed: deleted; callers use Worktree create, Land, Worktree removal + Refs CAS |
| `src/workflow/unit-handoff.mjs` 287, 296 | closed: `gitOk`/`gitOut` deleted; Inspect, Worktree, Refs |
| `src/workflow/dir-guard.mjs` 24-26 | closed: Inspect `resolveRepo` |
| `src/workflow/case-start.mjs` 128 | closed: node spawn of the detached advance (non-Git); its rev-parse reads are on Inspect |
| `src/workflow/case-admission.mjs` 173, `seats.mjs` 45 | closed: regex `exec`, not a spawn |
| `src/workflow/runner.mjs` (readers list) | closed: Inspect + Land |
| `src/holder-lock/fences.mjs` 123, 161 | closed: listings are parameters; 280/310 regex; 452 host route (non-Git) |
| `packages/holder-lock/rust/src/route.rs` 544 | closed: `--dir` from the caller |
| `src/holder-lock/driver.mjs`, `hold-transport.mjs`, `index.mjs` | closed: host routes and `runBorrowed`, the lower-layer borrow transport (phase 01 req. 1) |
| `borrow_windows.rs`, `driver/mod.rs`, `helper.rs`, `port.rs`, `route/hold.rs`, `semantics.rs` | closed: thread spawns, borrow transport, test `sleep`s; non-Git |
| `src/setup/holder-lock-checks.mjs` 146, 306, 474 | closed: `sleep`/host routes (non-Git); the new listing is Inspect |
| `packages/holder-lock/rust/src/borrow_vectors.rs` | closed: named exemption *production sandbox probe*; its repository is created under its own `temp_dir()` (`run`, line 418) and removed after; 415 is `--version` of the same binary |
| `src/setup/git-hooks.mjs` | closed: RepositoryConfig + Inspect |
| `src/setup/registrations.mjs` 361, 3502, 4108, 4238, 6398, 6423, 6475 | closed: fgos-git floor / Inspect; 1696/1719 bwrap, 3222-3302 claude, 3804/5232 node, 4589 herdr, 6370 host: non-Git |
| `.githooks/pre-commit` | closed: hook read context (§13). Every Git call is a read: rev-parse, symbolic-ref, show, reflog, merge-base, diff, worktree list, `config --get`. Inspect cannot run inside the commit (index.lock is held) |
| `agent-hooks.mjs`, `instruction-registry.mjs`, `run-supervisor-checks.mjs`, `shell-rc.mjs`, `skill-wrappers.mjs`, `terminal-control-checks.mjs` | closed: non-Git (host shim, regex, bash, herdr) |

`rg "'git'" src/setup src/workflow src/holder-lock` is empty.

## Changed assertions

1. `test/setup/uninstall-wiring.test.mjs` (WIP). First test: old: a relative `.githooks` value with no provenance is unwired (`{unwired:true}`, config unset, files deleted). New: `{unwired:false, skippedExisting:'.githooks'}`, config and files kept. Spec §11 RepositoryConfig paragraph: "Custom/pre-existing unproven values return `skippedExisting`; removal requires both successful owned provenance and the exact current owned value."
2. Same file, second test: its arrangement changed from an unproven absolute `core.hooksPath` to `installGitHooks` (journaled); the assertions are unchanged, under the same spec line.
3. Same file, new test: tracked hook bytes survive uninstall. Spec §13 row `git-hooks.mjs`: "preserve custom path/tracked files".
4. `test/workflow/workflow-runner.test.mjs` (WIP). The declared-target fixture now creates `release` (the assertion is unchanged), plus a new assertion that an absent declared target is `null`. Spec §13 integrate row: "resolveRef, which returns unknown instead of throwing".

No assertion in the holder-lock tests changed; they now pass the listing.

New tests:
- the integrate step skips a branch the target already contains and a unit without a branch;
- `checkStopped` finds a process in a linked worktree only when that worktree is listed (host only);
- Rust `workspace_dirs_are_the_root_and_the_listed_worktrees_only`.

## needsWrites (files I may not edit)

1. `src/git/land.mjs:2`: change `import { hotLockDepth } from '../state/hot-lock.mjs'` to `'../holder-lock/hot-guard.mjs'`. It is the same function (hot-lock re-exports it), and it is how `inspect.mjs`/`config.mjs` import it. Without this, `test/architecture.test.mjs` "A4 boundary guard" fails: workflow → `git/land.mjs` → `state/hot-lock.mjs`.
2. `docs/architecture-manifest.json:318`: delete the row `"src/workflow/integrate.mjs": "infra"`. Two architecture tests fail on the missing file.
3. `test/runner/worktree-admin-multiprocess.test.mjs:13`: import `createWorkflowWorktree` from `'../../src/workflow/unit-handoff.mjs'`. The file fails to load today.
4. `src/verbs/events/migrate.mjs:69`: pass `workspaces: [{ root: cwd, worktrees: workspaceListing(cwd).worktrees }]` (import `workspaceListing` from `src/setup/holder-lock-checks.mjs`). Until then its stop check scans the root only and misses processes whose cwd is a linked worktree.
5. `packages/distribution/rust/src/git_gate.rs` `predecessor_scan`: add `--dir <path>` for each linked worktree, read through fgos-git `list_worktrees`. Same gap as item 4, in the activation gate's predecessor scan.
6. `test/scripts/install-git-hooks.test.mjs`:
   - The unit tests need `initFixtureRepo`, or `activateGitFixture` from `test/helpers/git-fixture.mjs`, on their repositories (they fail with `git-fence-missing`).
   - The CLI tests copy only part of `src/` into a temp tree and now miss `src/git/*` and the addon.
   - `scripts/install-git-hooks.mjs` should report a RepositoryConfig refusal instead of crashing.
7. `CHANGELOG.md` `[Unreleased]`:
   - Workflow integrate merges through Land and skips work the target already has.
   - `fgos uninstall` leaves a `core.hooksPath` that fgOS did not journal.
   - `quiesce-scan` takes `--dir`.

## Judgment calls

- Workflow binds evidence that says "workflow integration runs no verification command". Git never certifies verification (§9), and Workflow had none before.
- A Land conflict or refusal leaves its candidate retained (§9: red/conflicted retained until the consumer acknowledges). Only delivered candidates are acknowledged.
- `installGitHooks` lets a RepositoryConfig refusal propagate, as the old `git config` failure did, rather than hide it. In an unactivated checkout that ships `.githooks` (a fresh fgOS source clone before activation), `fgos setup` therefore stops with `git-fence-missing`.
- `fenceTargets` requires the listing instead of defaulting to empty, so a caller cannot silently skip merge-slot or dispatch-cwd fences.

## Verification

Wrapper (`$S/t.mjs` in the session scratchpad): umask 077, `FGOS_STATE_ROOT=/tmp/fgos-work/u15b/state` and `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u15b/fixtures` (mode 0700), `FGOS_HOST_BIN` unset so `ensureGitAddon` stages a host built from this checkout, then `node --test`. Baseline: `git archive 7d931a0a2` into scratch, with its own cargo target, the same files.

- `cargo test --locked -p fgos-holder-lock --lib route`: 7 passed. `cargo clippy --locked -p fgos-holder-lock --all-targets -- -D warnings`: clean.
- `cargo test --locked -p fgos --test internal_lock_routes`: 13/14. `quiesce_scan_lists_a_process_working_in_the_workspace` gets exit 12 (`unavailable`, PID namespace), so it needs the outer host.
- `test/workflow/*.test.mjs`: 85 failures, every one also failing on baseline (bwrap namespace or confinement: `nested-write-from-confined-worker`, `confinement-*`). Baseline had 90; the 5 integrate tests that failed there now pass. All nine integrate/cleanup tests pass.
- `test/setup/*.test.mjs` + `test/holder-lock/*.test.mjs` + `test/scripts/install-git-hooks.test.mjs` + `test/runner/worktree-admin-multiprocess.test.mjs`: baseline 46 failures, tree 37.
  - The new ones in the tree were the fence-less hook fixtures, since fixed: the rerun of `checks-setup-config`, `dir-resolution`, `uninstall-wiring{,-2,-3}`, `readme-tag-check`, `convention-doctor-check`, `knowledge-doctor` and `checks-setup-hookspath` gives 36/36.
  - Also new: needsWrites 3 and 6, and the new linked-worktree scan test (host only).
  - The rest also fail on baseline or are environmental:
    - quiesce scans `needs-attest` inside the PID namespace;
    - `target/release/fgctl` absent;
    - the v1 fixture needs `yaml`;
    - `npm pack`, `legacy-attempts-stuck`, `workflow-case-checks`, `skill-wrappers` projection, `leaf-notify-drift`.
- `test/architecture.test.mjs`: 3 failures, all needsWrites 1-2.

**Needs the outer host:** `fences-stop-check`, the fence-fix tests of `holder-lock-checks`, the Rust quiesce route test, `fences-rust-locks` (needs `cargo build --release -p fgctl`), and the bwrap/confined workflow tests.

Status: DONE_WITH_CONCERNS
Summary: Setup/hooks, holder listings and Workflow are on the typed ports, `integrate.mjs` is deleted, and every family census row is closed. The tree is green for my files except failures that also fail on baseline, need the outer host, or wait on needsWrites.
Concerns/Blockers: needsWrites 1-3 are required for a green architecture test and a loadable worktree-admin test. 4-5 restore linked-worktree coverage in migrate and the activation gate scans.
