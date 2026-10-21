# Phase lead report: test governance phase 2, git

Date: 2026-10-21 (Asia/Saigon). Worktree `.claude/worktrees/test-d1`, branch `chore/test-governance-p2-git`, base `bf24f3ad6` (origin/main). Plan: [plan.md](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md), Phase 2, row D2 (narrow contract-prose). Model followed: [phase 2 first batch](phase-lead-261021-1129-test-governance-p2-ported-areas.md) §2, §3, §7.

## 1. Outcome

| Area | Node `test()` calls (files) | Rust tests | Route tests | Owns | Retired | Kept on purpose for the owner |
|---|---:|---:|---:|---:|---:|---:|
| git | 109 (23 files; `write-scope-parity` re-imports the runner write-scope suite, 168 node:test cases in all) | 234 (`cargo test -p fgos-git -- --list`) | 12 (one per port) | 94 | **3** | 1 (`land:132`, a regression witness, §6) |

Most git Node tests are **not** copies. The Rust crate tests the Land, ScopedCommit and Sync cores and the crash matrices. But it has no test for most Worktree policy refusals, the Land conflict, slot and handle refusals, the ScopedCommit fences or the Sync replay states. The N-API layer (`packages/git/node-addon`, about 1 700 lines, no `#[test]`) is only reachable from Node. So the Node tests are the only owners of those behaviours (mutations R4, A1). Three Node tests copied cases a Rust test owns, and they are retired. No contract-prose test exists in this area: no `test/git` file reads `packages/git/contracts`.

Change: `test/git/land.test.mjs` loses two tests and `test/git/sync.test.mjs` loses one. The retired Sync test's only assertion that its Rust owner lacks, "the target branch is unchanged after abort", is folded into the kept abort test `sync:36`.

## 2. Gates

| Gate | Before (base `bf24f3ad6`) | After (this branch) |
|---|---|---|
| `npm test` | 8778 tests, 8668 pass, **13 fail**, 32 skipped; exit 1. The 13 failures were in 11 files outside the area (`test/cli/fgos-approve*`, `fgos-disconnected-worktree-guard`, `fgos-edit-3`, `fgos-intake-4`, `test/direct/merge-gate`, `test/event-store/migrate*`, `topologies`). Rerun alone: 126 tests, 0 fail, so this is load (another suite ran on the machine) | 8775 tests, 8677 pass, **1 fail**, 32 skipped; exit 1. The only failure is the known `test/runner/loop.test.mjs` real-concurrency flake; rerun alone: 104 tests, 0 fail |
| `suite:` line | `suite: 581 files, 8091 test() calls, 385 s wall (baseline 581 / 8087 / 202 s at 78334ff1d)`; `suite: this change against bf24f3ad6: +0 -0 test() calls, 0 new CLI/host spawn site(s), 0 without a reason` | `suite: 581 files, 8088 test() calls, 458 s wall (baseline 581 / 8087 / 202 s at 78334ff1d)`; `suite: this change against bf24f3ad6: +0 -3 test() calls, 0 new CLI/host spawn site(s), 0 without a reason` |
| `cargo test --workspace` | 1236 passed, 0 failed | 1236 passed, 0 failed |
| `cargo test -p fgos-git` (clean, after all mutations restored) | 257 passed, 0 failed (19:46) | same tree |
| Coverage map (`node scripts/test-select-coverage-map.mjs`) | controller's map of main `4ebf60748` (`cov-b2.json`; base is newer only by docs commits) | 331 sources before and after, **0 sources lost their last covering test**, 0 sources with fewer covering files (`cov-compare.mjs`). 6 files timed out during collection (run-supervisor crash/adopt files, `runner/claim-port`, `runner/repo-locks-multiprocess`), none of them in this area. `npm test` did not rewrite the mutation census or the suite baseline |

Test cost of the change: −3 `test()` calls, 0 new CLI/host spawn sites, no change to what a CLI call loads (so no `--cli-cost` run is needed).

## 3. Mutation evidence

Harness: a scratch driver (not in the repo) applies one exact-string edit. It runs `cargo test -p fgos-git --no-fail-fast` (Rust edits only) and all `test/git/*.test.mjs` through the suite's own env and argv (`run-some.mjs`; the addon is rebuilt from the edited source by its digest). Then it restores the file; `git status` was clean after every run.

Rust noise: under the Rust edits, a few boundary crash-matrix tests also failed (`land_crash_matrix` stop-index matrices, `native_*` trace children, two `safe_restore` matrices, `publication.rs` children). They failed under unrelated edits as well, and some of them failed with `bwrap: Can't bind mount ... /var/tmp/fgos-e1/mnt` (a transient mount from another session). The same crate is green when nothing is edited (257/0), so they are listed separately and are not counted as catching the edit.

| id | seeded mutation | Rust tests that fail | Node tests that fail |
|---|---|---|---|
| N1 | Land facade never retries a lock-unavailable attempt within `waitMs` (`src/git/land.mjs` `within`) | n/a (Node-only edit) | `land.test.mjs: prepare waits only for its own full destination slot and pins the target after admission`; `land.test.mjs: a Land waiting for admission keeps its process running, ...` |
| N2 | `withNativeLocks` hands no held handle to the port (`src/git/native.mjs`) | n/a (Node-only edit) | 46 tests in 9 files, among them `land.test.mjs: Land refuses a caller-owned merge slot ...`, `land-recovery.test.mjs: live session and higher held rank exclude recovery`, `land.test.mjs: a held custody rank is refused before Land has any effect`, every ScopedCommit and Sync test that passes custody, `refs` (both backends), `worktree: Worktree custody requires the actual holder`, `commit-parent-death` (all 4) |
| N3 | `gitWriter` returns the pid as a number (`src/git/inspect.mjs`) | n/a (Node-only edit) | `inspect.test.mjs: a Git port writer is text when the session identity is a process id` |
| N4 | loader skips the addon digest check (`src/git/native.mjs`) | n/a (Node-only edit) | `native-load.test.mjs: resolver refuses absent, unsafe, wrong-target and changed bytes before exposing calls` |
| A1 | addon Land `recover` accepts an empty consumer acknowledgement (`node-addon/src/git/land.rs`) | n/a (addon crate has no tests; `fgos-git` does not contain it) | `land-recovery.test.mjs: durable receipt recovery retains candidate and pins until explicit consumer acknowledgement` |
| R1 | Land prepare lets a held rank above 20 through (`rank > 20` → `rank > 200`, Rust `land.rs`) | `held_custody_refuses_before_effect` | **none**: `land:44` stays green because holder-lock refuses the later acquisition with the same cause. The Node copy does not even witness this check |
| R2 | same-id Land prepare replays a receipt with another operation id (Rust `land.rs`) | `real_merge_evidence_and_same_id_replay`; `cas_failure_uses_shared_refs_classification_and_loss_replays_as_error`; `recovery_matrix_all_payload_kinds`; crash matrices (plus noise: `head_and_literal_tree_pages_all_formats_and_backends`, `hooks_fill_empty_...`, `every_durable_snapshot_...`, which are bwrap mount failures) | `land.test.mjs: Land binds actual consumer verification and returns an established receipt after an external ABA`; `land.test.mjs: M4 consumer settlement identity survives an unknown append acknowledgement`; `land.test.mjs: terminal replay bypasses a busy destination slot` |
| R3 | Sync abort refuses an in-progress (prepared or conflicted) Sync as `sync-merge-lost` (Rust `sync.rs`) | `sync_prepare_applies_declared_bytes_for_a_store_path_the_producer_deleted`; `sync_terminal_replay_ignores_live_branch_and_detached_head` (plus crash-matrix noise) | `sync.test.mjs: Sync abort preserves resolver bytes and only closes its own merge`; `Sync refuses foreign staged resolver paths and retains their bytes`; `Sync abort restores pre-merge permission bits on clean merged paths`; `a consumer can abort a prepared clean Sync after a red check without changing either branch`; `scoped-commit.test.mjs: ScopedCommit probes config and formats once per loan and once after hooks` |
| R4 | Worktree remove/relocate ignores a user lock (Rust `worktree.rs`) | **none** related (only crash-matrix noise) | `worktree.test.mjs: locked worktrees and submodules refuse before attempting removal or relocation` |
| R5 | Land clean gate ignores a dirty path that overlaps an own (incoming) path (Rust `land.rs` `land_gate`) | `dirty_own_paths_block_before_cas` (plus crash-matrix noise) | `land.test.mjs: staged overlap refuses before CAS`; `land.test.mjs: a dirty file obstructing an incoming directory belongs to the clean gate` |

How the mutations decide labels: R1, R2 and R3 make `land:44`, `land:49` and `sync:119` mirrors, because Rust catches the edit. Each of them adds no wiring that N2 (handover), the Land route `land:11` and the kept Sync abort tests lack. R4 and A1 show that Node is the only owner of a Rust behaviour and of addon behaviour, so those tests stay as owns. R5 shows `land:132` is owned in Rust as well, but it is a regression witness (§6).

## 4. Retired (each with its owner)

| Retired test (line at `bf24f3ad6`) | Born in | Owner now |
|---|---|---|
| `land.test.mjs:44` a held custody rank is refused before Land has any effect | `78429d1dd` feat | `packages/git/rust/tests/land.rs: held_custody_refuses_before_effect` (same two assertions: `lock-order-violation`, no `git-candidates`; R1 fails it and not the Node test). The Node held-handle wiring through Land stays proven by `land.test.mjs:161` and `land-recovery.test.mjs:46` (N2) |
| `land.test.mjs:49` M4 consumer settlement identity survives an unknown append acknowledgement | `78429d1dd` feat | Its product assertions are the same-id replay receipt and `publishedOid`. Owners: `land.test.mjs:11` (route, deep-equals the replay receipt), `land.test.mjs:254` (`publishedOid` is the candidate), and Rust `land.rs: real_merge_evidence_and_same_id_replay` (R2). The rest is a JS `Map` model of a Work ledger with no product code under it; its `repoIdentity` read does not influence the assertions |
| `sync.test.mjs:119` a consumer can abort a prepared clean Sync after a red check without changing either branch | `623c1b3a2` wip | `packages/git/rust/tests/scoped_commit_sync.rs: sync_prepare_applies_declared_bytes_for_a_store_path_the_producer_deleted` (abort branch: `conflict-aborted`, HEAD unchanged, incoming file gone, status clean; R3 fails it). Node `prepare` wiring: `sync.test.mjs:104`; Node `abort` wiring: `sync.test.mjs:36`, `:46`, `:56`, `:93`. Its "target branch unchanged" assertion moved into `sync.test.mjs:36` |

`git log -S` on all three titles: feature or wip commits, none from a fix.

## 5. E6 inventory (every Node test of the area; lines at base `bf24f3ad6`)

Columns: E6 verdict, label, owner or evidence. Per port, the route test is the one wiring proof that the Node facade reaches the Rust port through the addon. "owns (Rust behaviour)" means the behaviour lives in `fgos-git` but no Rust test asserts it, so this Node test is its only owner.

`test/git/commit-parent-death.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 21 | `${mode}: controller death retains custody and recovers ...` (4 calls: commit/sync × immutable/rejected) | Kept | owns | Node controller death while its holder-lock lease is borrowed by the Git hook. The Rust crash tests kill the Rust performer, never a Node controller (N2 fails all 4) |

`test/git/cutover-grant.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 14 | cutover grant validates exact authority and `${indexMode}` hook index (`${layout}`) (5 calls) | Kept | owns | the real `.githooks/pre-commit` and host `internal git-grant-check` against the ScopedCommit cutover grant (`legacy-ref-mismatch`, `seal-digest-mismatch`, temporary/external/symlinked hook index). `grant.rs` has no Rust test |

`test/git/e2e-consumer-noncoding.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 42 | business-discussion completes on a detached HEAD without origin/HEAD and moves no ref | Kept | owns | V-CONSUMER workflow e2e (file header names why no other test runs it) |
| 57 | business-discussion completes in a directory that is not a repository | Kept | owns | same as above |

`test/git/e3-census.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 5 | operation census counts completed Git execs and fresh lock descriptions, including interrupted syscalls | Kept | owns | Node script `scripts/git/e3-bench.mjs` strace parser |
| 28 | operation census recognizes the Node lock-fd acquisition adapter on inherited fd 3 | Kept | owns | same as above |

`test/git/github-adapter-contract.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 9 | consumer-authorized API merge stays in GitHub; a timed out merge is queried before retry | Kept | owns | Node `src/runner/github-adapter.mjs` (not ported) |
| 37 | an unreachable merge with no server confirmation remains outcome-unknown | Kept | owns | same as above |
| 58 | pre-connect merge failures stay unreachable without an observation request | Kept | owns | same as above |

`test/git/inspect.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 15 | Inspect marshals real byte paths, explicit absence, reads, pages and snapshots | Kept | route | Inspect port: every typed read through the addon, the `exec-under-hot-lock` guard, `notARepository` |
| 73 | a Git port writer is text when the session identity is a process id | Kept | owns | Node `gitWriter`/`gitPortOptions` (N3: only this test) |

`test/git/land-recovery.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 9 | recovery abandons an unattempted Land and a fresh identity can land | Kept | owns (Rust behaviour) | `recover` of a pre-attempt chain answers `notPublished` with no warnings. Rust `another_writer_abandons_pre_attempt_but_only_owner_cleans_candidate` asserts neither |
| 20 | durable receipt recovery retains candidate and pins until explicit consumer acknowledgement | Kept | owns | addon `recover` acknowledgement handling (A1: only this test), pins kept until acknowledgement, `operation-id-reused` |
| 36 | dirty candidate cleanup is deferred with a warning and preserves successful Land | Kept | owns | the addon maps an acknowledgement failure to a `land-cleanup-deferred` warning |
| 46 | live session and higher held rank exclude recovery | Kept | owns | recover's live-session exclusion and held-rank refusal through the Node handover (N2) |
| 56 | a SIGKILL during consumer verification releases authority; Node recovery and a fresh Land succeed | Kept | owns | death of a Node process holding a native Land session |
| 81 | a missing receipt at next is observed-only through Node and keeps that attribution after cleanup | Kept | owns (Rust behaviour) | Land `effectObservedOnly` with `currentlyAtCandidate`, then replay through acknowledgement and prepare. The Rust crash matrix asserts observed-only only for the store-collision crash; not mutated here |
| 98 | even a dangling native index lock names inspected repair before publication | Kept | owns (Rust behaviour) | Land prepare refusal text that names the repair door and the §11 runbook, with a dangling symlink lock. The Rust native-lock tests assert the inspection, not this prepare refusal |

`test/git/land.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 11 | Land binds actual consumer verification and returns an established receipt after an external ABA | Kept | route | Land port: prepare, publish, session replay, close and same-id replay through the addon (R2) |
| 24 | missing or mismatched verification and dirty candidate never move the target | Kept | owns | addon evidence deserialization (`missing field`) and a mismatch on each of the five fields. Rust `mismatch_and_candidate_edits_never_publish` checks only `treeDigest` |
| 34 | the same destination stays excluded across consumer verification | Kept | owns | the worktree-admin and main-checkout locks stay free during the consumer phase (Rust `slot_excludes_same_destination_through_verification` checks only the exclusion) |
| 44 | a held custody rank is refused before Land has any effect | **Retired** | mirrors-Rust | §4 (R1) |
| 49 | M4 consumer settlement identity survives an unknown append acknowledgement | **Retired** | mirrors-Rust | §4 (R2) |
| 62 | ignored incoming collisions preserve bytes and block before CAS | Kept | owns (Rust behaviour) | Land refusal of an ignored non-store collision. No Rust Land test (`ignored_checkout_collision_refuses_before_target_attempt` is the Refs port) |
| 71 | unattached target lands without touching the main checkout; foreign attached targets refuse | Kept | owns (Rust behaviour) | `notApplicable` checkout, `foreign-target-checkout`: no Rust test |
| 79 | candidate transforms are frozen before verification and staged tampering is refused | Kept | owns (Rust behaviour) | declared bytes on a clean merge, and a staged edit refused as `candidate-dirty`. The Rust owners cover a conflict resolution and an unstaged edit |
| 86 | unresolved target attempts never replay a CAS, even at the old tip | Kept | owns (Rust behaviour) | same-id prepare after a lost outcome record refuses `land-recovery-required`. Rust covers publish-on-session and the crash matrix, not this entry; not mutated |
| 95 | Land materializes tracked non-event store bytes stripped by worker allocation before verification | Kept | owns (Rust behaviour) | no Rust Land test declares `.fgos/` non-event bytes |
| 102 | a conflict aborts only the operation candidate and preserves both refs and main bytes | Kept | owns (Rust behaviour) | `land-conflict-aborted`: no Rust test |
| 110 | missing footprint fails safe while a return subtree leaves unrelated dirt alone | Kept | owns (Rust behaviour) | `footprint: null` and `subtree`: no Rust test |
| 117 | an ignored store collision publishes once with a pending checkout and preserves its local bytes | Kept | owns (Rust behaviour) | normal-publish path. Rust `ignored_store_collision_is_terminal_after_post_cas_crash` owns only the crash-recovery path |
| 126 | a dirty file obstructing an incoming directory belongs to the clean gate | Kept | owns (Rust behaviour) | R5: Rust has no obstruction case |
| 132 | staged overlap refuses before CAS | Kept | owns (regression witness) | R5 also fails Rust `dirty_own_paths_block_before_cas`, but the test was born in fix `ab852c202`; see §6 |
| 141 | abandoned prepare never blocks a fresh identity and remains recoverable | Kept | owns (Rust behaviour) | the same writer's fresh id is admitted and abandons the old chain (`abandonedBeforeAttempt`). Rust tests only a different writer, which is refused. Born in fix `ab852c202` |
| 151 | terminal replay bypasses a busy destination slot | Kept | owns (Rust behaviour) | no Rust test holds the slot during a terminal replay (R2 fails it) |
| 161 | Land refuses a caller-owned merge slot before creating a candidate or moving either tip | Kept | owns (Rust behaviour) | `land-slot-already-held` through the Node handover (N2): no Rust test |
| 176 | Land refuses an ephemeral checkout as its repository handle before creating another candidate | Kept | owns (Rust behaviour) | `land-main-handle-required`: no Rust test |
| 191 | an uncovered conflict is aborted even when another path has declared resolution bytes | Kept | owns (Rust behaviour) | `land-conflict-aborted`: no Rust test |
| 206 | prepare waits only for its own full destination slot and pins the target after admission | Kept | owns | Node `within` wait loop (N1) |
| 254 | untracked verification output never blocks publication of the frozen candidate | Kept | owns (Rust behaviour) | no Rust test |
| 263 | a Land waiting for admission keeps its process running, so a session closed in the same process admits it within the budget | Kept | owns | Node `within` keeps the event loop running (N1) |

`test/git/legacy-event-adapter.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 12 | temporary Work declaration admits exact legacy events on main only | Kept | owns | Node `src/state/legacy-event-git-adapter.mjs` |
| 65 | every legacy event change borrows main-checkout authority through native validation | Kept | owns | the real holder-lock borrower probe inside a Git hook |

`test/git/lock-handover.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 13 | one-shot capability refuses raw, foreign, forged and released handles; pins borrows through the call | Kept | owns | Node handover bridge and addon loans (N2) |
| 37 | native description copy does not leak into ordinary child processes | Kept | owns | same as above |
| 46 | native ScopedCommit protects a live async sibling and native mint refuses an active drain | Kept | owns | same as above |

`test/git/native-load.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 22 | one combined load reports both crate versions and Node-API line | Kept | owns | Node loader / addon versions |
| 26 | a second physical addon copy refuses at load, while a child owns its own marker | Kept | owns | addon `single_load` |
| 35 | a worker environment can load the same library instance | Kept | owns | same as above |
| 41 | resolver refuses absent, unsafe, wrong-target and changed bytes before exposing calls | Kept | owns | Node loader (N4: only this test) |
| 47 | real append and read run in a hot section without a child process; Git refuses there | Kept | owns | hot-gate guard in the facade |
| 73 | Publication marshals object writes, reads, ordered walks and receipted CAS through the real port | Kept | route | Publication port |
| 102 | staged release and npm-relative manifests resolve their own addon without PATH or cwd fallback | Kept | owns | Node loader channels |
| 136 | inspection leaves WAL absent; setup and mapping use the shared Rust config writer | Kept | owns | addon-only functions `inspectGit`, `initializeGitWal`, `ensureGitFetchMapping`, `gitFetchMappings` |
| 180 | native lock inspection includes symlink residue in a linked worktree git directory | Kept | owns | addon `inspectGit` native-lock listing |
| 193 | Windows lock-taking addon doors refuse by name before resolving paths | Kept | owns | Windows only (skipped here) |
| 199 | umask 002 driver directories are created safely, repaired by setup, and diagnosed without chmod by doctor | Kept | owns | setup/doctor composition over `prepareGitDriverDirectories` |

`test/git/native-lock-repair.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 9 | native repair transports an inspection report and preserves an unknown external index lock | Kept | route | NativeLockRepair port |

`test/git/one-door.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 58 | the static scan reports a Git spawn in each shape a literal search misses | Kept | owns | Node `scripts/git-one-door-scan.mjs` (V-GATE) |
| 68 | a declared standalone skill and text quoted into a data command are not sites | Kept | owns | same as above |
| 83 | the scan judges every file its root declares as product, whatever the directory is called, and only counts the rest | Kept | owns | same as above |
| 102 | doctor refuses a census that lists a site, or whose files do not match the payload it sits in | Kept | owns | same as above |
| 126 | the spawn spy charges a command run through runBorrowed to the code that called runBorrowed | Kept | owns | test helper `git-spawn-spy` |
| 138 | a sandbox Git call is judged by every repository path it names, in separate and = forms | Kept | owns | `scripts/lib/git-spawn-match.mjs` |

`test/git/recovery.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 8 | Recovery lists and inspects an interrupted Land and delegates to its existing recovery | Kept | route | Recovery port (`git-operation-unknown` has no Rust test) |
| 30 | doctor --fix recovers an interrupted Land through the Recovery door and then has nothing left to recover | Kept | owns | Node `src/setup/git-checks.mjs` |
| 43 | doctor warns, never fails, about a finished Land whose candidate is still retained | Kept | owns | same as above |
| 58 | Recovery terminal Restore replay delegates without changing its outcome | Kept | owns (Rust behaviour) | Recovery delegating a terminal Restore |

`test/git/refs.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 13 | Refs exact-old CAS and registered checkout exclusion (`files`, `reftable`; 2 calls) | Kept | route | Refs port on both ref backends |

`test/git/remote.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 12 | Remote explicit transfers use a real bare remote and preserve push configuration | Kept | route | Remote port |

`test/git/repository-config.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 9 | RepositoryConfig fills empty hooks, reports missing enforcement and removes only its exact value | Kept | route | RepositoryConfig port |

`test/git/safe-restore.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 10 | SafeRestore preserves binary, staged/unstaged, untracked, symlink and mode state under `${linked}` (2 calls) | Kept | route | SafeRestore port under main 50 and producer custody |
| 45 | SafeRestore refuses stale HEAD, backward ancestry, native residue and unsafe config without changing bytes | Kept | owns (Rust behaviour) | `not-descendant`, `repository-config-untrusted` on restore, and the typed `code: recovery-required` from apply: none is in the Rust test (which checks `head-mismatch`, `not-commit` and the native lock via preview) |
| 65 | SafeRestore snapshots an ignored incoming collision and refuses to guess a reapply over it | Kept | owns | `listSnapshot`/`extractPath`/`acknowledge` addon wiring, `untracked-target-collision` |

`test/git/scoped-commit.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 25 | ScopedCommit requires exact custody, preserves pre-existing dirt and literal path names | Kept | route | ScopedCommit port |
| 39 | ScopedCommit refuses foreign staged entries even within the write scope | Kept | owns (Rust behaviour) | `foreign-staged`: no Rust test |
| 42 | ScopedCommit preserves rejection evidence and unstages only its own paths | Kept | owns (Rust behaviour) | unstages only its own paths |
| 51 | ScopedCommit receipt replay retains the actual hook-expanded file set | Kept | owns (Rust behaviour) | replay keeps the files the hook expanded. Rust `hook_tree_tampering_reports_real_effect` asserts the status, not the replay |
| 61 | ScopedCommit refuses a changed baseline and a foreign merge without staging | Kept | owns (Rust behaviour) | `baseline-stale`, `foreign-merge-head`: no Rust test |
| 73 | ScopedCommit `${setsid}${main/custody}` refuses executable filter config and drains hook background children with gc enabled (4 calls) | Kept | owns | borrowed fd and drain through the Node lease, `gc.auto` forced to 0 |
| 114 | ScopedCommit never reports plain success while a setsid hook child without the borrowed descriptor survives | Kept | owns (Rust behaviour) | `containment-unproven`: no Rust test |
| 132 | rejecting hook restores a producer move, binary bytes, modes, symlinks and the index | Kept | owns (Rust behaviour) | restore after a rejection |
| 166 | ScopedCommit refuses invalid requests, post-preflight staging and replay of a rejected attempt | Kept | owns (Rust behaviour) | `invalid-commit-message`, `foreign-staged-index`, no hook rerun |
| 187 | baseline-dirty paths changed by the producer are excluded with an explicit receipt report | Kept | owns (Rust behaviour) | `preExistingInScope`: no Rust test |
| 196 | literal path `${name}` commits and replays losslessly (3 calls) | Kept | owns (Rust behaviour) | glob scope `**` with `*`, tab and newline names. Rust `literal_scoped_commit_real_hook_and_replay` covers only `[literal]` |
| 209 | post-commit compaction failure returns the landed receipt with a warning | Kept | owns (Rust behaviour) | `compaction-deferred` on ScopedCommit (Rust covers only `checkout-compaction-deferred`) |
| 227 | rejected hooks restore clean permission bits and leave skip-worktree paths alone | Kept | owns (Rust behaviour) | no Rust test |
| 241 | a clean-path restore failure still restores producer bytes on independent paths | Kept | owns (Rust behaviour) | `commit-worktree-restore-required`: no Rust test |
| 253 | ScopedCommit probes config and formats once per loan and once after hooks | Kept | owns | `e3-bench` census: Git exec counts per phase |
| 275 | ScopedCommit refreshes config between calls on the same port | Kept | owns (Rust behaviour) | no Rust test |
| 286 | ScopedCommit fences post-hook config changes on `${rejection/success}` (2 calls) | Kept | owns (Rust behaviour) | no Rust test |
| 299 | ScopedCommit checks object format again on an existing port | Kept | owns (Rust behaviour) | `repository-format-changed`: no Rust test |
| 309 | ScopedCommit refuses post-hook promisor changes on `${rejection/success}` (2 calls) | Kept | owns (Rust behaviour) | `repository-promisor-changed`: no Rust test |

`test/git/sync.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 24 | Sync creates a clean exact two-parent merge and no resolver grant | Kept | route | Sync port (start, inspect, replay) |
| 36 | Sync abort preserves resolver bytes and only closes its own merge | Kept | owns (Rust behaviour) | abort keeps resolver edits; now also asserts the target branch is unchanged (folded from `:119`) |
| 46 | Sync refuses foreign staged resolver paths and retains their bytes | Kept | owns (Rust behaviour) | `foreign-staged` on continue and abort |
| 56 | Sync preserves a rejecting hook cause and never reports its open merge as not started | Kept | owns (Rust behaviour) | `rejected-open`: no Rust test |
| 72 | a recreated worktree does not inherit a rejected Sync from the dead checkout | Kept | owns (Rust behaviour) | `authority-mismatch` for a dead checkout's Sync |
| 93 | Sync abort restores pre-merge permission bits on clean merged paths | Kept | owns (Rust behaviour) | no Rust test |
| 104 | Sync preparation leaves the source tip unchanged until consumer verification finishes | Kept | owns (Rust behaviour) | same-id prepare answers `in-progress`: no Rust test |
| 119 | a consumer can abort a prepared clean Sync after a red check without changing either branch | **Retired** | mirrors-Rust | §4 (R3) |

`test/git/worktree.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 9 | Worktree create, move, guarded remove (`files`, `reftable`; 2 calls) | Kept | route | Worktree port on both backends |
| 39 | Worktree create strips tracked worker state without touching main state | Kept | owns (Rust behaviour) | no Rust test |
| 43 | Worktree remove preserves a live cwd | Kept | owns (Rust behaviour) | `live-cwd`: no Rust test |
| 48 | detached sessions allocate unique mkdtemp paths and validate the session id | Kept | owns (Rust behaviour) | `invalid-session-id`: no Rust test |
| 58 | established worktree operation ids return without repeating effects and bind all inputs | Kept | owns (Rust behaviour) | `operation-id-conflict`: no Rust worktree test |
| 71 | Worktree custody requires the actual holder | Kept | owns | custody through the Node handover (N2) |
| 84 | stripped tracked state is clean for removal and reappearing worker state is preserved | Kept | owns (Rust behaviour) | `dirty-preserved`, `ignored-bytes-preserved`: no Rust test |
| 100 | main checkout allocation supports .claude/worktrees and rejects admin or linked nesting | Kept | owns (Rust behaviour) | no Rust test |
| 112 | locked worktrees and submodules refuse before attempting removal or relocation | Kept | owns (Rust behaviour) | R4: only this test catches the user-lock check |
| 129 | detached undelivered tip requires a surviving non-fgos ref | Kept | owns (Rust behaviour) | `delivery-unreachable` (Rust `missing_owned_detached_history...` covers the prune path, not remove) |
| 145 | Worktree `${action}` warns once and proceeds with a non-dumpable same-user process (2 calls) | Kept | owns (Rust behaviour) | `worktree-cwd-unreadable`: no Rust test |
| 184 | plain worktree with tracked .fgos `${preserves/removes}` (2 calls) | Kept | owns (Rust behaviour) | no Rust test |
| 199 | recreated skip-worktree tracked state is preserved even with identical bytes | Kept | owns (Rust behaviour) | `worker-state-preserved`: no Rust test |

`test/git/worktree-recovery.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 9 | read-only worktree diagnostics preserve foreign missing and partial registrations | Kept | owns | doctor row `git-worktree-recovery` (Node `setup/git-checks`) plus `inspectOrphans` / `prune` refusal |
| 27 | doctor reports foreign admin files and preserves ignored provisioned directories as advisory | Kept | owns | same as above |
| 41 | doctor treats a worktree locked by a live process as advisory and a dead owner as a finding | Kept | owns | the doctor's passed/advisory mapping over Rust `lock_naming_a_live_process_is_not_a_recovery_finding` / `..._dead_..._stays_a_finding` |

`test/git/write-scope-parity.test.mjs`: no `test()` of its own. It re-runs `test/runner/write-scope.test.mjs` once through the addon's `writeScope` and once through Node. Kept, owns (addon `writeScope` parity).

Ports and their one route test: Inspect `inspect:15`, Publication `native-load:73`, Refs `refs:13`, Remote `remote:12`, Worktree `worktree:9`, ScopedCommit `scoped-commit:25`, Sync `sync:24`, Land `land:11`, SafeRestore `safe-restore:10`, RepositoryConfig `repository-config:9`, NativeLockRepair `native-lock-repair:9`, Recovery `recovery:8`. The loop rows (`refs`, `worktree`, `safe-restore`) are one test body run per backend or custody mode.

## 6. Gaps and items for the owner (nothing was added; RUL104)

- **No uncaught mutation in this batch.** Every seeded edit failed at least one test.
- **R1, a weak Node copy:** `land:44` did not catch the Land rank check it was named for. Rust `held_custody_refuses_before_effect` is the only proof (now retired from Node).
- **`land:132` (staged overlap) is a regression witness** (born in fix `ab852c202`). R5 shows Rust `dirty_own_paths_block_before_cas` catches the same gate. The rule says to move its case (a *staged* edit of an incoming path) into that Rust test before retiring the Node copy. I may not edit Rust, so it stays. Option for the owner: add the staged variant to `dirty_own_paths_block_before_cas`, then retire `land:132`.
- **Rust behaviour owned only through Node** (labelled "owns (Rust behaviour)" above): most Worktree policy refusals, the Land conflict/slot/handle/footprint refusals, the ScopedCommit fences and the Sync replay states. This is not a weakness of the suite: each has an owner. But the owning proof sits one layer above the code (principle 8 "lowest layer that can observe it"). Moving them down into `packages/git/rust/tests` would be a new item for the owner. It would add Rust tests and retire Node copies, and it is larger than this batch.
- **The N-API layer has no Rust test** (`packages/git/node-addon`, A1). Node is the only owner of its marshalling, by construction.

## 7. Unresolved questions

1. `land:132`: add the staged case to the Rust owner and retire the Node test (option a), or keep the Node witness (option b)? Recommendation: (a), in the next batch that is allowed to touch Rust tests.
2. Should the "owns (Rust behaviour)" rows (53 rows) become a follow-up item to move their proofs into `fgos-git` tests? This is a cost decision for the owner: it lowers Node suite time, but it adds Rust tests first.
