# Scout: code facts for the fgos-git implementation plan

Date 2026-10-18 09:22 (Asia/Saigon), main at `8cbe3084f`. Read-only scout for [plan](../261018-0914-git-component-fgos-git/plan.md). Counts are a floor from grep and reads, not the §12 data-flow census; phase 07 regenerates the census with the §12 rule. Line numbers are evidence at this HEAD, not stable identifiers.

## What does not exist yet

- No `packages/git`, no `src/git`, no `packages/event-store`, no `src/event-store` (ls).
- No N-API addon anywhere: no `napi`, `node-gyp` or `cdylib` in any `Cargo.toml`; no `.node` file. Workspace members `Cargo.toml:3-19`.
- No Rust `LockScope` and no rank check in `packages/holder-lock/rust` (public API `port.rs:42-784`: `acquire`, `release`, `run_borrowed`, `borrowed_check`, `probe`, `holders`, `guarantee`, `Handle::declare_domain`). Rust does not read `lock-registry.v1.json`; only `src/holder-lock/registry.mjs` does.
- No Event Store implementation plan in `plans/`.

## Custody window (spec §6, Q2)

- Controller takes attempt 15 and cwd 30 in one scope: `src/run-supervisor/direct-launch.mjs:47-73`; in `executeAssignment` at `src/runner/dispatch/assignment-runner.mjs:2196-2208` (only for `mutating` and not `forceSharedCwd`).
- Controller releases its copies right after the binding: `assignment-runner.mjs:2486-2494` (`finally { attemptLocks.release() }`).
- Supervisor releases its copy at gate exit, before receipt and steps: `packages/run-supervisor/rust/src/supervise.rs:339-340`.
- On Unix the gate carries the lease (fd 4) and `declare_on_lease` is a no-op: `packages/run-supervisor/rust/src/supervise/unix.rs:53-56`; Windows writes the predecessor record (`supervise/windows.rs:61-66`).
- Runner commit runs later in the controller with no lease: `src/runner/execution/run.mjs:802-806` (`commitWork`) → `commitRoundWithSync` → `commitUnitWork` (`run.mjs:676-690`). `commit-unit-work.mjs` takes no holder lock.
- Holder-lock acquire already runs predecessor admission (kill a non-empty domain, then wait for empty): `packages/holder-lock/rust/src/port.rs:465-530`, `predecessor.rs:142-199`.
- Plan 6.4 left this window out of scope (its D5 and open question 1); no plan owned it until this one.

## Production Git write sites (floor)

| File | Writes (approx.) | Examples | Spawn route |
|---|---|---|---|
| `src/runner/worktree.mjs` | 10+ | `:332` push -u, `:512` remove, `:521`/`:575` prune, `:603` move, `:636` branch | `git()` `:156`, `gitQuiet` `:168`, inline `execFileSync` `:327`/`:332` |
| `src/runner/merge.mjs` | 9+ | `:566` mv, `:584`/`:616` add, `:977` merge --abort, `:1362-1389` event sweep, `:1402` commit, `:1739-1767` post-CAS re-stage | `git()` `:94`; `runBorrowed` `:1402` |
| `src/runner/execution/commit-unit-work.mjs` | 5 | `:276`/`:411` commit, `:399` checkout, `:400` rm, `:424-430` direct pre-commit hook spawn | `git(ctx,args)` `:90` with `--git-dir/--work-tree` prefix `:87` |
| `src/runner/session.mjs` | 7 | `:152` checkout, `:335`/`:351`/`:422`/`:548` remove, `:430`/`:554` prune | `gitAt` `:64` |
| `src/runner/loop.mjs` | 3 | `:515` branch -D, `:875` reset --hard, `:876` clean -fdq | inline `execFileSync` |
| `src/workflow/integrate.mjs` | 5 | `:116`/`:122` merge (`mergeArgs`), `:125`/`:154` remove --force, `:159` `fs.rmSync`, `:160` prune, `:169` branch -D | `git()` `:12` |
| `src/runner/repo-locks.mjs` | 1 | `:89` worktree add (`runWorktreeAdd`, under `withWorktreeAdmin` `:73`) | `spawnSync` |
| `src/runner/main-fgos-checkpoint.mjs` | spawn point | `:17` `runBorrowed(mainHandle, {command:'git', args})` | callers `merge.mjs:764`, `claim-port.mjs:109` |
| `src/state/events-compaction.mjs` | 2 | `:186` add -A, `:187` rm --cached | inline |
| `src/setup/git-hooks.mjs` | 2 | `:107` config core.hooksPath, `:146` config --unset | inline |
| `bin/fgos.mjs` | 4 | `:3392` add, `:3437` remove, `:4349` resync, `:4415` reset --hard | `gitAt`, helper `:169` |
| `scripts/test-select-mutate.mjs` | 4 | `:237`/`:263` add --detach, `:248`/`:279` remove -f | injectable `execFileFn` `:225` |
| `scripts/knowledge-migration.mjs` | 2 | `:288` mv, `:292` add | inline |
| `scripts/knowledge-canary.mjs`, `scripts/regenerate-observe-fixtures.mjs` | 3 | sandbox repos | inline |
| `packages/holder-lock/rust/src/borrow_vectors.rs` | sandbox | `:78` `Command::new(git)` (variable binary) | production sandbox probe |

Delegating callers (no direct spawn): `promote-engine.mjs:33` (`createBranchRef`), `:82` (`withMergeEphemeralWorktree`); `src/verbs/merge/approve.mjs:422`, `:533`; `sync-root.mjs:265`; `review.mjs:89` (`ensureBranchPushed`); `claim-port.mjs:109`. Rust reads to classify in phase 07: `packages/distribution/rust/src/workspace.rs:32`, `lib.rs:184`, `packages/herdr-fgos-common/rust/src/fgos.rs:348`, `packages/observe/rust/src/sources/*`.

Unwrapped worktree administration (no rank 40 today): `worktree.mjs:512`, `:521`, `:575`, `:603`, `:1426-1436`; `session.mjs:335-554`; `integrate.mjs:125-160`; `merge.mjs:1684-1687`. `worktree.mjs:1289` and the `createWorktree` default use a fresh `createLockScope`, so they cannot see a caller's held ranks.

## Skill text

`core/skills/fgos-run/SKILL.md:25`: "`--writes` needs a linked worktree (create one with `git worktree add`)". Other SKILL.md hits not inspected; phase 07 scans every shipped skill.

## Hook, setup, doctor, packaging

- `.githooks/pre-commit` order: stale index `:445-451`, convention warnings `:453`, at-home `:475`, staged `.fgos/` deletion refusal `:456-458`, worker `.fgos` `:462-464`, root-file `:467-469`, worker branch `:483`, `.fgos/*.jsonl` line-count guard `:489-496`, main-checkout borrower verdict `:499-511`, beacon `:516-545`.
- Doctor registry: `registerCheck` `src/setup/registrations.mjs:172`, `registerConfigDefault` `:193`, `registerFix` `:218`; holder-lock checks registered at `:2276-2311`.
- Manifest components: `packages/distribution/rust/src/manifest.rs:138-155` (`legacy_node` required; `runner`, `workshop` optional by `serde(default)`); schema version check `:79`; staging `scripts/build-rust-distribution.mjs:252`, `:284-315`, `:388-396`; contract `docs/platform/packaging-distribution/contracts/release-manifest.md`.
- Activation gates: `init.rs:864-870` (main-checkout check, `preflight_candidate` `:371-405`, activation lock `:170-204`), `holder_lock_gate` `:962-1000`, `publish_and_tail` `:1001-1005`, activation file `:461-487`.
- Fences: `src/holder-lock/fences.mjs:38` `CUTOVER_OWNERS = ['4.2','4.3','4.4']`, `placeFences` `:388`.
- Tests: `npm test` = `node scripts/run-tests.mjs`; 494 `*.test.mjs`; CI `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --all -- --check` (`.github/workflows/ci.yml:285-291`). `test/state/hot-lock-known-exec-sites.test.mjs` is a spy pattern, not an allowlist. The six §15 extra test files exist.
- `write-scope.mjs` exports: `WriteScopeError` `:8`, `canonicalizeWriteEntry` `:25`, `canonicalizeWrites` `:53`, `expandGenerated` `:90`, `matchesWriteScope` `:130`, `partitionPaths` `:144`; tests `test/runner/write-scope.test.mjs` and four others.
- Read-only workflow outside a repo: `src/runner/execution/run.mjs:98-108` throws `RunnerConfigError` "fgos run must run inside a git repository".

## Collisions found

- Plan 6.3 (running) and 6.4 (held) both edit `assignment-runner.mjs` and `recovery-planner.mjs`; 6.4 also owns `run.mjs`. 6.3 edits `packages/run-supervisor/rust/src/gate.rs` and the envelope contracts.
- `src/runner/merge.mjs`, `worktree.mjs`: board row reserves them for "GIT G4".

Status: DONE. Summary: facts the plan cites, re-verified at HEAD `8cbe3084f` for the custody window lines.
