# Phase 07: caller migration, three-core deletion, one-door gate

- **Depends on:** phases 01-06 merged; plan 6.4 landed or explicitly rebased against (shared `run.mjs`).
- **Branch / worktree:** integration branch `git/p07-switch`, worktree `.claude/worktrees/git-p07`; sub-lanes `git/p07-<family>` merge into it. Nothing reaches main until phase 08's gate passes, because the switch is one release (Q4).
- **Model / effort:** sonnet for the mechanical moves, opus reviewer per family; 44h (resized from the phase 02 census).

**Status:** in progress on `git/p07-switch`; board owner decision 2026-10-20 11:34 (Asia/Saigon): foundation layers first, Work later. Phase 07 does not wait for the Event Store Work cutover.

**Unit 2 checkpoint:** the owner resolved Unit 1's four blockers. The Unit commit/sync adapters now call native ScopedCommit/Sync; raw Git bodies are removed. Native support preserves literal selected filenames, declared legacy event checkpoints/archives, owned-only diagnostic replay, recorded baselines/operation ids, custody-backed continuation and clean-start abort timing. See [Unit 2 report](../reports/phase-lead-261020-1150-git-p07-u2-commit-core-switch.md). This is an integration-branch change, not phase-07 acceptance or permission to land. The remaining families, shared matcher/definition switch and phase-08 proof gates remain open.

## Context

- Spec §13 (every row, outer scripts, Workflow deletion), §12 (same-release invariant, allowlist zero, detection rule, stop-everything), §15 E6 and T/T2/T3, §16 (lessons stay tested at their guard), §18 item 8 (Q1).
- Scout census and wrappers ([scout](../reports/scout-261018-0922-git-component-plan-census.md)); spec §13 classification at HEAD `1e238aead` (about 75 write lines, 17 production files, 4 scripts, 2 Rust sandbox sources, 1 skill).

## Requirements

1. **Start from the phase 02 census** (every `git` spawn site with family and owner), re-run it on the current tree, and treat it as the checklist; every site gets a §13 row, the readers family below, or a named class (sandbox setup, production sandbox probe, hook read context per spec §13: "hook read context is not a second writer").
2. **Switch every row of §13 in this release** (thin adapters: input/output/error translation only; no git subprocess, matcher, lock policy, cleanup or recovery in an adapter; output fields and timing kept):
   - `src/runner/execution/commit-unit-work.mjs` → ScopedCommit + Sync with the `custody` handle from phase 04; the direct `pre-commit` spawn goes through `git hook run` or is dropped (G-062).
   - `src/runner/execution/unit-sync.mjs` → thin Sync adapter.
   - `src/runner/merge.mjs` → Land, Sync, SafeRestore, Refs, Worktree; numbering, verification policy and state stay consumer; decision renumbering becomes declared candidate bytes. Event sweep and post-CAS event changes call the temporary Work adapter below, using declared Land candidate paths and a separate ScopedCommit/Checkpoint operation after CAS; no raw re-stage remains.
   - `src/runner/worktree.mjs` → Worktree, Refs, Remote; provisioning stays in Execution outside Git locks; `resyncClaimWorktree` → SafeRestore; `resyncWorktree` → SafeRestore `apply` with `reapplyLocalDelta`; `refreshUnstartedBranch` → `fastForwardCheckedOut` under custody; `ensureBranchPushed` drops `push -u` (RepositoryConfig by name when upstream is needed).
   - `src/workflow/integrate.mjs` → **deleted**; its callers use Worktree create, Land and guarded cleanup; target resolution through Inspect `resolveRef` (unknown, never throw), only when a Unit has a worktree or the workflow has an integrate step.
   - `src/runner/repo-locks.mjs` → keep holder delegation; remove `runWorktreeAdd`.
   - `src/runner/session.mjs` → Worktree create/remove/prune and SafeRestore; consumer registry atomic.
   - `src/runner/loop.mjs` → `deleteRef` CAS (no `branch -D`); reset/clean → SafeRestore.
   - `src/setup/git-hooks.mjs` → RepositoryConfig `ensureHooks` / `removeOwnedHooksConfig`.
   - `bin/fgos.mjs` `return` → Worktree remove (no finally-force-delete); `main-checkout-reset` → SafeRestore preview/apply with snapshot.
   - `src/runner/claim-port.mjs` and take → Worktree and Inspect facts outside `state`; Work keeps the claim CAS.
   - `src/runner/github-adapter.mjs` → unchanged API merge; any local mutation through Git ports.
   - `src/verbs/merge/*` (approve, catchup, sync-root, review) → same ports, actual receipt OIDs, direct reads through Inspect.
   - `src/runner/promote-engine.mjs` (`createBranchRef`, `withMergeEphemeralWorktree`, `mergeRunnerItem`) → Land, Refs, Worktree, same release as `merge.mjs`.
   - `src/runner/dispatch/write-scope.mjs` → thin facade over `fgos-write-scope`, exports and golden semantics preserved.
   - Outer scripts: `scripts/knowledge-migration.mjs` → ScopedCommit with both literal paths of each move, full rollback before registry update; `scripts/test-select-mutate.mjs` → Worktree; `scripts/install-git-hooks.mjs` → RepositoryConfig. `knowledge-canary`, observe fixture regeneration, external-consumer CI and Rust tests are classified sandbox setups.
   - `packages/holder-lock/rust/src/borrow_vectors.rs` → named exemption class *production sandbox probe*; the census proves its repo is under its own `temp_dir()`.
   - `core/skills/**` → no instruction to run a Git write; `fgos-run` uses `fgos worktree create`.
   - **Node readers → Inspect** (spec §12 counts any `git` child outside the driver, and `status` without optional locks writes the index): every reader in the census, at least `src/cli/version.mjs`, `src/runner/dispatch/{transport,settlement,trust-store,cli,assignment-runner,stray-writes}.mjs`, `src/runner/{attestation-guard,work-dispatch,claim-liveness,paths,promote-preflight,operation-choice,iron-law-gate}.mjs`, `src/runner/execution/{run,partial-writes}.mjs`, `src/state/{store,cleanup-harness,drift-status,postland-drift,tool-registry}.mjs`, `src/workflow/{dir-guard,runner}.mjs`, `src/verbs/state/move.mjs`, `src/verbs/merge/promote-to-component.mjs`, `src/setup/registrations.mjs` (git reads), `scripts/prepare-release.mjs`.
   - **Holder-lock's own git listings** cannot import Git (Git depends on holder-lock): `src/holder-lock/fences.mjs:123`, `:161` take the worktree list and refs as parameters from their setup-layer caller (`src/setup/holder-lock-checks.mjs`, which calls Inspect); the `quiesce-scan` route (`packages/holder-lock/rust/src/route.rs:474`) takes the linked worktree dirs as `--dir` arguments from its caller instead of running `git worktree list`. Holder-lock `run_borrowed` stays the driver's borrow primitive (phase 01 requirement 1).
   - **`write-scope.mjs` leaf contract:** `src/workflow/definition.mjs:2-7` calls it an import-free leaf and `test/state/domain-registry-compiled.test.mjs` copies it alone. The signed RUL84 rule (one Rust matcher, Node facade) wins: the comment in `definition.mjs` and that test are retargeted to load the facade with the addon (kept assertion, retargeted import, never weakened), and the architecture manifest records the new edge.
   - Rust readers in `packages/distribution`, `packages/herdr-fgos-common`, `packages/observe` → Inspect through `fgos-git` in-process (reads only).
   - Event-file rows (`src/state/events-jsonl-truncation-guard.mjs`, the event duty of `src/runner/main-fgos-checkpoint.mjs`, `src/state/events-compaction.mjs`, the `merge.mjs` sweep and post-CAS changes): retain Work’s legacy tracked `.fgos/events.jsonl`, shards and `merge=union` for now. Route every Git effect through the temporary Work adapter below; the non-event checkpoint duty also uses Checkpoint (phase 05). The WORK lane deletes the adapter and event duties together with its Event Store cutover.

   Classification findings F-E1..F-E10 (spec §13) and where each lands:

   | Finding | Site | Lands in |
   |---|---|---|
   | F-E1 | checkpoint spawn site `main-fgos-checkpoint.mjs:17` (argv injected by callers) | Temporary Work adapter → Checkpoint / ScopedCommit (declared event files); non-event → Checkpoint |
   | F-E2 | Land event sweep and post-CAS re-stage `merge.mjs:1362-1389`, `:1739-1767` | Temporary Work adapter → declared Land candidate paths; post-CAS → separate ScopedCommit / Checkpoint |
   | F-E3 | `resyncWorktree` | SafeRestore `reapplyLocalDelta` |
   | F-E4 | `refreshUnstartedBranch` | Refs `fastForwardCheckedOut` |
   | F-E5 | `ensureBranchPushed` `push -u` (`worktree.mjs:332`) | Remote push without `-u`; CHANGELOG |
   | F-E6 | `promote-engine.mjs` | Land, Refs, Worktree with `merge.mjs` |
   | F-E7 | knowledge-migration move (`scripts/knowledge-migration.mjs:288-292`) | ScopedCommit with both literal paths |
   | F-E8 | skill text `core/skills/fgos-run/SKILL.md:25` | `fgos worktree create` (phase 03) |
   | F-E9 | production sandbox probe `borrow_vectors.rs:78` | named exemption class, census proof |
   | F-E10 | hook-file replay `commit-unit-work.mjs:424-430` | `git hook run` or dropped (G-062) |

### Temporary Work adapter (owner decision 2026-10-20 11:34)

Use the clearly named Work-side `src/state/legacy-event-git-adapter.mjs`; it translates declared paths and receipts only. Work owns event discovery, truncation/compaction verification and timing outside Git locks. Git owns all Git effects and custody/lock/recovery policy. No raw Git exception is added:

| Legacy duty | Port and boundary |
|---|---|
| `main-fgos-checkpoint.mjs` event checkpoint; truncation-guard callback | Checkpoint (`ScopedCommit.checkpointTrackedFiles`) with exact declared tracked event paths under borrowed main authority; Work runs truncation guard first |
| `merge.mjs` pre-land event sweep | Work declares exact candidate paths/bytes to Land; no implicit sweep in Git |
| `merge.mjs` post-CAS event changes | Separate declared ScopedCommit / Checkpoint operation under main authority after Land; never an unjournaled re-stage |
| `events-compaction.mjs` commits | ScopedCommit with exact old/new paths after Work verifies its candidate; Work retains archive/guard policy |

**Unit 2 port prerequisite implemented:** the existing ScopedCommit/Checkpoint request accepts typed `legacyEvents: {exactPaths}` for the retired event layout only, under main 50. The temporary Work adapter and the existing native hook grant-check door use that declaration; ordinary `.fgos` payloads remain excluded/refused. Work-event/Land owners still wire their callers; Land has no implicit sweep. WORK removes the adapter, declaration and grant branch together at Event Store cutover.

Legacy tracked event files, writer shards, truncation guard and `merge=union` remain until WORK cuts over. WORK owns deletion of this adapter and every legacy event duty in that same cutover. This is a temporary consumer of typed ports, never a second Git core. E6 event assertions are **kept/retargeted**, not retired before that cutover.

3. **Delete the three parallel cores in this release:** Workflow integrate (lock-free writer), the Work merge/worktree core (git-spawning bodies of `merge.mjs` and `worktree.mjs` and their helpers), the Unit commit/sync core (`commit-unit-work.mjs` and `unit-sync.mjs` bodies). A compatibility export may contain only translation and is deleted with its last import in the same change.
4. **One-door gate (V-GATE, D9):** `scripts/git-one-door-scan.mjs` (static: every `child_process`, `runBorrowed`, `execSync`/shell and Rust `Command::new` site whose binary can be `git` or a hook by data flow, wrappers and their callers counted); `test/helpers/git-spawn-spy.mjs` preloaded by `scripts/run-tests.mjs` records every `git` or hook spawn from `src`, `bin` or `scripts` and fails the suite on any; `test/git/one-door.test.mjs` with nine seeded false-negative probes under `test/fixtures/git-one-door/` (callback argv, `runBorrowed` facade, argv in a variable or mutated, global options before the verb, wrapper prepending the verb, Rust variable binary, shell string, direct hook replay and skill text, read verbs that write). The build writes `packages/git/contracts/mutation-census.v1.json`; doctor `git-mutation-one-door` checks it is empty and its digest matches the payload.
5. **Manifest:** `components.nativeAddon` becomes required in the schema for every target (linux-x64 has been refused without it by `fgctl` since phase 05, Event Store M10); a release without it is refused by `fgctl` on windows-x64 too. The windows-x64 addon build and its tests must be green for this release (D11).
5a. **Stale compatibility channels:** the host's internal routes bump their protocol in this release, so an older payload reached through a stale global npm install or `node bin/fgos.mjs` gets `host-version-mismatch` before any state write (the existing fail-closed rule, holder-lock §19); P-RELEASE covers a stale `fgos merge`.
6. **Test preservation (E6):** regenerate the list of assertions that reach a Git write site (T, T2, T3 and the six extra files of §15); label each kept, retargeted or retired (event-file families of D-ADR0055 only); no assertion weakened. Lesson map: every retained G-id in §16 points to a test.
7. **Read-only workflow outside a repo (Q1, default (a)):** `resolveGitRoots` in `run.mjs` returns `notARepository` for a run whose units have no `writes`; a unit with `writes` still requires a repository.
8. **CHANGELOG `[Unreleased]`:** every Git mutation now runs through `fgos-git`; `review` no longer writes upstream config (`push -u` removed); `--force-shared-cwd` refused for writing units (from phase 04); `fgos worktree create`; read-only workflows run outside a repository; Workflow integrate removed; an addon is required by every release.
9. **Board:** Workflow deletion date (D10) and the release id on the GIT row.

## Files

Owned by this phase (one sub-lane per family, disjoint):

| Family | Files |
|---|---|
| Unit commit/sync | `src/runner/execution/commit-unit-work.mjs`, `unit-sync.mjs`, `run.mjs`, `partial-writes.mjs`, `src/runner/dispatch/write-scope.mjs`, `src/workflow/definition.mjs` (comment), `test/state/domain-registry-compiled.test.mjs` |
| Node readers | every reader file named in requirement 2 (disjoint from the other families; `run.mjs` reads go with the Unit family) |
| Holder-lock listings | `src/holder-lock/fences.mjs`, `src/setup/holder-lock-checks.mjs`, `packages/holder-lock/rust/src/route.rs` (quiesce `--dir`) |
| Work merge/worktree | `src/runner/merge.mjs`, `worktree.mjs`, `repo-locks.mjs`, `session.mjs`, `loop.mjs`, `claim-port.mjs`, `promote-engine.mjs`, `github-adapter.mjs`, `src/verbs/merge/*`, `bin/fgos.mjs` |
| Workflow | delete `src/workflow/integrate.mjs`; edit its importers under `src/workflow/` |
| Setup and scripts | `src/setup/git-hooks.mjs`, `scripts/knowledge-migration.mjs`, `scripts/test-select-mutate.mjs`, `scripts/install-git-hooks.mjs` |
| Rust readers | `packages/distribution/rust/src/{workspace,lib}.rs`, `packages/herdr-fgos-common/rust/src/fgos.rs`, `packages/observe/rust/src/sources/*` |
| Gate | `scripts/git-one-door-scan.mjs`, `scripts/run-tests.mjs`, `test/helpers/git-spawn-spy.mjs`, `test/git/one-door.test.mjs`, `test/fixtures/git-one-door/**`, `packages/git/contracts/mutation-census.v1.json`, `scripts/build-rust-distribution.mjs` (census step), `packages/distribution/rust/src/manifest.rs` (required key) |
| Temporary Work event adapter | `src/state/legacy-event-git-adapter.mjs`, `src/state/events-jsonl-truncation-guard.mjs`, `src/state/events-compaction.mjs`, `src/runner/main-fgos-checkpoint.mjs`; Land owner alone edits `merge.mjs` call sites |
| Shared at the end (lead only) | `CHANGELOG.md`, `src/setup/registrations.mjs`, `docs/architecture-manifest.json`, `test/test-ownership.mjs`, skill sources and render surfaces |

## Steps

1. Re-run the phase 02 census with the §12 rule; publish it as the checklist in the phase report. Current reproducible candidate inventory: [Git 07 census](../reports/scout-261020-1135-git-p07-census.md), generated by `scripts/git-p07-census.py`. Its ownership/order section reserves shared files and keeps all integration work off main until phase 08.
2. Gate tooling and seeded probes first (they must fail on today's tree, proving detection).
3. Sub-lanes switch their families in parallel; each removes its old writer bodies in the same commit series.
4. Test preservation labelling and lesson map; fix retargeted imports without weakening.
5. Q1 runner change; manifest key required; CHANGELOG; board.
6. Integration: one-door scan empty, spy clean, full suites green; opus review per family; hand the release candidate to phase 08.

## Validation

```bash
node scripts/git-one-door-scan.mjs --json   # expect zero undeclared writers
node --test test/git/one-door.test.mjs        # nine seeded probes detected
cargo test --workspace && cargo clippy --workspace --all-targets -- -D warnings && cargo fmt --all -- --check
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p07 build> npm test
rg -n "execFileSync\('git'|spawnSync\('git'|git worktree add" src bin scripts core/skills   # expect no production hit
```

Vectors: **V-GATE**, **V-PARITY** (consumer outputs, event timing, real merged OID, post-success settlement faults), **V-CONSUMER (static part)**, **E6** labels complete.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| A family cannot switch in time and blocks the release | Medium × High | Q4 forbids a partial release; the date (D10) moves, the board records it; no interim Node patch. |
| Hidden write site missed by the scan | Medium × High | Runtime spy in every `npm test`; seeded probes; doctor census check. |
| Behaviour drift in merge verbs | Medium × Medium | V-PARITY fixtures and the kept assertions; opus review per family. |
| `run.mjs` conflict with 6.4 | Medium × Medium | Rebase rule; phase 04 contract. |

## Rollback

Before landing: drop the integration branch. After landing: phase 08 rollback (activate the previous release after reconciliation through the C5 door; never the legacy writer as a fallback, never erase WAL).
