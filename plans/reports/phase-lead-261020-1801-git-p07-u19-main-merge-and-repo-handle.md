# Git phase 07, unit 19: main merged in, ignored paths through Inspect, shared repository facts

Worktree `git/p07-switch` at `5430a8b68` plus this working tree. Times are Asia/Saigon, 2026-10-20 18:02–18:50. The setup/hooks lane's files (`src/setup/*`, `.githooks/*`, `src/holder-lock/*`, `src/workflow/*`) were not edited.

## 0. The merge commit could not be written here: it is in a bundle

This sandbox mounts all Git storage read-only (`.git/`, `.git/objects`, `.git/refs`, `.git/worktrees/git-p07`: `EROFS`). `git merge` cannot write MERGE_HEAD or the index, so I could not make the one commit the brief allowed.

What I did instead:
- built the merge in a private object store (alternates onto the real one) with a private index;
- wrote it as a real two-parent commit: **`fb929b7e41f4cc357acf10cb0f5cc09a3ac44f4d`**, parents `5430a8b68` and `9bce0113e` (origin/main at 18:38);
- put it in a verified bundle: `<outbox>/u19-merge.bundle` (ref `refs/heads/git/p07-switch-merge`; `git bundle verify` says okay against this repository);
- moved the working tree onto that merge, then made steps 2–4 on top of it.

**What to do on the host, before anything commits this worktree:**

```sh
cd /home/vantt/projects/forgent/.claude/worktrees/git-p07
git fetch /home/vantt/projects/forgent/.fgos/assignments/unit-run-1792494107254-4706f6d6/producer/1/runs/01/outbox/u19-merge.bundle git/p07-switch-merge
git reset --mixed fb929b7e41f4cc357acf10cb0f5cc09a3ac44f4d   # branch and index to the merge; the working tree stays
git status --short                                            # exactly the 15 paths listed under "Steps 2–4 paths"
```

Then commit those 15 paths as one commit. Suggested subject: `perf(git): share checked repository facts per process, list ignored paths through Inspect, retire Node copies of Rust Land, ScopedCommit and Sync cases`.

**Do not let the runner's scoped commit run on `5430a8b68` first.** It would squash main's changes inside the scope into a single-parent commit and leave main's out-of-scope paths dirty. That is why this round's claim is `blocked`.

## 1. Merge resolution

The trial merge against `fb8c6e4ae` had 4 conflicts. Main then moved to `9bce0113e` (test-governance plus two research reports), which added 2 more. I merged `9bce0113e`.

| File | Resolution |
|---|---|
| `src/runner/worktree.mjs` | Main's provisioning record and `setProvisionedAside` on top of the branch's native-port callers. The branch's deleted `git()` helper stays deleted. |
| `test/helpers/git-addon.mjs` | Main's one-line re-export. Main moved the builder to `scripts/git-addon.mjs`, and the branch's staged-host change (`gitAddonDirectory`, `FGOS_HOST_BIN`/`FGOS_ACTIVE_MANIFEST_PATH`) is applied there. `scripts/lib/git-ports.mjs` imports `../git-addon.mjs` instead of the test helper. |
| `scripts/git/e3-bench.mjs` | Main's census, which builds fresh fixture repositories and takes no `--root`, bound to the branch's sandbox door on that fresh root. |
| `CHANGELOG.md` | Both sides' entries, main's first. |
| `scripts/test-proof-inventory.mjs` | Main's local `REPO_ROOT` (the cycle note) plus the branch's Inspect import. Main's two new raw reads now go through Inspect: `admissionBaseRef` uses `resolveCommit` + `compareCommits().mergeBase`, and the baseline writer uses `resolveCommit('HEAD')`. No `execFileSync` remains. |
| `test/scripts/test-proof-inventory.test.mjs` | Both sides' tests. |
| `docs/platform/git/spec.md` (auto-merged) | Main's E6 text and §14 test-preservation row are what the file holds now. Checked line by line against main. |

The merge needed three semantic fixes that no Git conflict showed. They are in the merge commit:
- `scripts/event-store/v-spawn-bench.mjs`: main's store-increment benchmark ran `git rev-parse HEAD` on the checkout and a rest-args `git -C <repo>` wrapper. It now reads HEAD through Inspect and builds fixtures through `sandboxGit(root)`. The rest-args shape had also crashed main's census scanner (`argv[i].startsWith is not a function`).
- `test/event-store/door.test.mjs` (main's Event Store door census):
  - It now follows a call through a name bound to `sandboxGit(...)` and judges it at the caller's site, with the same E3 fixture-provenance rule as a direct spawn; the door's own spawn has no finding of its own.
  - Before this fix, every e3-bench site was invisible (0 exemptions) and the door itself was flagged. After it, there are the same 4 E3 exemptions as on main and no violations.
  - The 12-entry `dormantInvocationFindings` debt list is now empty. Git 07 removed every spawn site those entries traced to: `run.mjs` 5→0, `commit-unit-work.mjs` 4→0, `main-fgos-checkpoint.mjs` 3→0. The test itself says removed findings must leave the list.

## 2. Provisioning lists ignored paths through Inspect

- Spec §3 first: the Inspect row and a dated unit-19 paragraph.
- Rust `status` takes a new `Ignored` argument (`Excluded` | `Listed` → `--ignored=no` | `--ignored=traditional`), and `StatusEntry` gains `ignored`.
- Every caller moved to the new signature in the same change: land ×2, refs ×4, inspect ×1, worktree ×1, event-store `legacy_import`, the addon and the tests.
- The addon takes `ignored: true`.
- `untrackedEntries` in `src/runner/worktree.mjs` reads `status({untracked: 'normal', ignored: true})`. It drops an ignored entry that sits inside a listed directory, which is the only difference I measured from `ls-files --others --directory`. The raw call and its `nulPaths`/`GIT_LIST_MAX_BUFFER` imports are deleted.
- §11 also carries main's requested sentence: remove sets provisioned bytes aside first, and the port's rule is unchanged.

## 3. Repository facts cached, revalidated by the config stamp

**What I measured first.** Main's merge had already added a per-driver config cache. But almost every Inspect port answers one call, and each new port paid `var` ×2, `config --list` and `rev-parse --show-object-format` again. A per-port `RepoHandle` cache alone would have saved about one spawn per verb (17 format probes against 16 config lists).

**What I did.**
- `ConfigCache` now also holds `(ObjectFormat, RefStorage)`. These are `extensions.*` config facts, valid exactly while the existing `ConfigStamp` holds, so `read_repository_facts` probes formats again only when the stamp changes.
- The two driver caches are process statics, so every port in one process shares them. The source list is keyed by the selected Git binary plus `HOME`/`XDG_CONFIG_HOME`. The config cache is keyed by git dir and stat-revalidated on every resolution, as before.
- Disk topology still runs on every call. Checkout handles (ScopedCommit, Sync, Land checkout) still read everything afresh, and the ScopedCommit spawn-census test is unchanged and green.

**Why process-wide, not per port.** That is where the cost was, and it is the same cache and the same staleness rule, used across ports. It goes beyond the literal "per Inspect port" wording; I decided it from the measurement.

Measured back to back, same fixture, before (merge tree) and after, median of 7 (approve) or 5 runs, Git spawns counted with `strace -f -e execve`:

| Verb | ms before → after | Git spawns | format probes | `config --list` |
|---|---|---|---|---|
| `approve <id> --no-wait`, slot held (exit 9 both) | 707 → 422 | 79 → 21 | 17 → 1 | 16 → 2 |
| `doctor --json` (multi-read verb) | 3784 → 2429 | 332 → 62 | 69 → 2 | 77 → 10 |
| `version` / `show` / `list` | 223/214/206 → 223/213/209 | 6/5/5, unchanged | 1 | 2 |

## 4. Test doctrine (design principle 8, decision 0072)

**Retired: 7 Node tests.** Each Node copy's cases are owned by the named Rust test. Where the Node copy asserted something extra, I added that assertion to the owning Rust test first.

| Retired Node test | Owning test |
|---|---|
| land: "dirty non-overlapping main is tolerated, preserved, and reported lagging" | `packages/git/rust/tests/land.rs:dirty_nonoverlap_is_preserved_and_reported_lagging` (+ HEAD = candidate) |
| land: "own paths dirtied during verification refuse publication; declared rename source counts" | `land.rs:dirty_own_paths_block_before_cas` (+ the declared-footprint rename case) |
| land: "staged modification and addition outside the footprint survive in index and worktree" | `land.rs:staged_dirt_survives_publish_and_exact_old_recovery` (asserts more, in three stop points) |
| land: "prepare pins the current destination after source catchup and replay retains that binding" | `land.rs:current_target_is_pinned_after_destination_acquisition_and_replays_after_cleanup` (+ incoming bytes in the candidate) |
| land: "declared candidate bytes resolve only the exact covered conflicts before verification" | `land.rs:declared_resolution_bytes_are_frozen_before_consumer_verification` (+ no MERGE_HEAD in main, source unchanged, HEAD = published candidate) |
| scoped-commit: "ScopedCommit records actual effect when a real hook changes the selected tree" | `scoped_commit_sync.rs:hook_tree_tampering_reports_real_effect` (identical assertions) |
| sync: "Sync leaves only temporary conflict grants and refuses markers before staging" | `scoped_commit_sync.rs:sync_clean_and_conflict_resolution_have_exact_parents` + `markers_include_tabs_and_diff3_but_skip_binary`. Its missing-custody refusal moved into the Sync route test. |

**Added: 2 Rust tests.** Neither behaviour had a proof.
- `tests/inspect.rs:status_lists_ignored_paths_collapsed_only_when_asked`: no other status reader asks for ignored paths.
- `driver.rs:a_shared_config_cache_never_hides_a_later_config_write_from_a_new_driver`: sharing across drivers is new. The existing invalidation test uses one driver.

**Kept.**
- One Node route test per port: Land "binds actual consumer verification…", ScopedCommit "requires exact custody…", Sync "clean exact two-parent merge…".
- The Node-only boundaries: held-handle loans, the lock-rank interplay, field-by-field `verification-mismatch` marshalling.
- Every other Git 07 Node test whose cases no Rust test owns: the rest of ScopedCommit, Worktree, land-recovery, and Land's staged overlap and uncovered conflict.
- `test/verbs/worktree-remove.test.mjs` stays the owning proof of provisioning set-aside through the new Inspect route.

**Totals.**
- `test/git/*` + worktree-remove: 170 → 163 tests.
- Static `test()` calls (`suiteReport`): 8,067 → 8,060, against main's baseline of 8,041. Its clone gate returns status 0.
- Rust, 6 crates: 615 passed (u18: 608), 2 of them added here.

## Verification

**Node.** A scratch wrapper sets umask 077, unsets `FGOS_HOST_BIN`, runs `ensureGitAddon` from `scripts/git-addon.mjs`, sets `FGOS_STATE_ROOT`/`FGOS_TEST_FIXTURE_ROOT` under `/tmp/fgos-work/u19` (mode 700), then runs `node --test --test-reporter=spec <files>`.

| Batch | Result |
|---|---|
| Merge alone: worktree-remove/create, runner/worktree, `test/git/*`, native-addon, architecture | 247/247 (1 skip) |
| Final, 61 files: `test/git/*`, runner worktree*/merge*, `test/event-store/*`, fgos-approve-6, direct/merge-gate, native-addon, architecture, hot-lock-known-exec-sites, util/git-paths, verbs worktree-create/remove, claim-liveness, drift-status, scripts test-proof-inventory/test-select, working-tree-clean-unified, attestation-guard, cli version, assignment-runresult | 688 tests: 652 pass, 6 skip, 30 fail. All 30 are `EROFS` on `~/.local/state/fgos/attestations` in assignment-runresult, the environmental set u16/u18 recorded. |
| door census + e3-census + v-spawn-bench + door-fixtures + scoped-commit | green |

**Rust.**
- `cargo clippy --locked -p fgos-node-addon -p fgos-git -p fgos-event-store -p fgos-observe -p fgos-distribution -p fgos --all-targets -- -D warnings`: clean.
- `FGOS_STATE_ROOT=/tmp/fgos-work/u19/rstate cargo test --locked --no-fail-fast -p fgos-node-addon -p fgos-git -p fgos-event-store -p fgos-observe -p fgos-distribution -p fgos` (umask 022): 116 suites, 615 passed, 3 failed. These are u18's environmental three:
  - `quiesce_scan_lists_a_process_working_in_the_workspace` returns 12 (`unavailable`) in this PID namespace;
  - the two `workspace::tests` tests fail in a parallel env race and pass alone (`cargo test -p fgos-distribution --lib workspace::`, 4/4).
- Under umask 077, three worktree tests and one safe_restore test fail on the fixture's executable mode. They pass at umask 022.

**Also.**
- `git diff --check` against the merge tree is clean.
- Impact analysis was not queried in this confined session. The cross-check was `rg` over every Rust `.status(` caller (all moved), every `publication_config`/`config_sources` use, and the Node status callers (unchanged contract).
- Not run: full `npm test`, E3, lifecycle verbs.

## Steps 2–4 paths (on top of the merge commit)

`CHANGELOG.md`, `docs/platform/git/spec.md`, `packages/event-store/rust/src/legacy_import.rs`, `packages/git/node-addon/src/git/inspect.rs`, `packages/git/rust/src/{driver,inspect,land,refs,worktree}.rs`, `packages/git/rust/tests/{inspect,land}.rs`, `src/runner/worktree.mjs`, `test/git/{land,scoped-commit,sync}.test.mjs`, and this report.

## Not done

- Main's report also asked for one sentence in `docs/platform/holder-lock/spec.md` (the fence-table `recovery` row). That is the holder-lock lane's area and not this unit's.

## Ideas (owner choice, not done; RUL104)

- **Move ScopedCommit's Node-only proofs down to Rust.** Foreign staged entries, baseline-stale, foreign MERGE_HEAD, the restore-failure cases and the post-hook format/promisor fences have no Rust test. Their owning proof should sit in `scoped_commit_sync.rs`, leaving one Node route test. Benefit: about 12 slower Node tests become Rust tests. Cost: one porting pass.

Status: BLOCKED
Summary: Main (9bce0113e) is merged as commit fb929b7e4, delivered in outbox/u19-merge.bundle because this sandbox cannot write Git storage. On top of it: provisioning lists ignored paths through Inspect, repository facts are shared per process (approve --no-wait 79 to 21 Git spawns, doctor 332 to 62), and 7 Node copies of Rust-owned cases are retired (2 Rust tests added).
Concerns/Blockers: The branch must be reset onto the bundled merge (recipe in section 0) before any commit of this worktree; a runner commit on 5430a8b68 would squash main. Environmental failures as in u18 (EROFS attestations, PID-namespace quiesce, workspace env race).
