# Phase 08 report: `session start|end|list|gc` native

Branch `rust-verb-migration-program/s3-p08`, rebased on `origin/rust-verb-migration-program/s3` (`0b2e36d77`). Status: DONE_WITH_CONCERNS (revised after OPC's CHANGES verdict: B1, B2, M1-M4 and the two low items are fixed below).

## What changed
- **Owner.** `apps/fgos/src/wiring/session.rs`: the four verbs over the Git Worktree and SafeRestore ports, the holder-lock `sessions` lock and Durable File. Registry written atomically, same JSON shape; a registry that is not a JSON array fails closed (never read as empty, never rewritten; unit test and parity cases). `end` seals through `EventStoreLifecycle::trigger` with `Policy { shutdown: true }` only, outside the `sessions` lock, also when the end fails.
- **Host wiring.** Four catalog operations, descriptors, providers, `NATIVE_SUBCOMMANDS`, projector over the shared parser, annotation (`owner_path: apps/fgos`), registry `native: true`; routes regenerated.
- **Node.** Arm and writer code deleted; `src/runner/session.mjs` is `listSessions` over `invokeHost(['session','list'], { dir, cwd })`. The harness `createSession`/`endSession` run the host verb.
- **Contract.** `identity.writer.v1.json` gets `x-sessionRegistry` rows (absent, empty, two sessions, not JSON, not an array), run by the session module and by `packages/identity/rust/tests/golden.rs`.
- **Doors row** "per-session checkout registry" (allowed: session.rs; identity `resolve.rs`, `command-registry.mjs` with reasons; `retiredBy` S6a). Negative case: a scratch `src/runner/*.mjs` with `export function createSession` and a `sessions.json` literal fails the row by name. One debt entry on "resolve the invocation root" for session.rs (see concern 3).

## Accepted changes (CHANGELOG)
1. `sessions.json` is written atomically (already in the plan).
2. **Outside a project the verb is refused and creates nothing** (HARDEN item): no repository, or a repository with no `.fgos` above the cwd and none in its main checkout, exits 4 with the `[not-in-project]` text, creates no `.fgos`, lock or directory. Proposed line: "`fgos session` outside a project is refused and creates nothing; it used to write a .fgos in the current directory".
3. From a subdirectory of a project the registry is the project's, not a new `.fgos` below the subdirectory (the base release made one, so `session list` there saw nothing). From a linked worktree with no store of its own the verb acts on the main checkout's store (the base made a store in the worktree). Proposed line: "`fgos session` run from a subdirectory or a store-less linked worktree uses the project's session registry instead of creating one there".
4. A missing or unknown sub-command, `--flag=value`, and unknown-flag texts are the host's shared ones (unknown-flag text is byte-equal with the base release, parity-checked, flag order included).
5. A failing Git removal prints the port's cause text, not the addon's JSON blob (`end` refused as dirty: `restore-baseline-dirty`). Parity case `end-dirty-and-forced-keeps-everything` normalises exactly that tail.

Kept as in Node: cwd as the starting point and `--dir` ignored, session checkouts under `<tmp>/fgos-sessions`, shutdown seal, retained ref plus stderr warning on a forced end, divergence refusal naming the sha, gc rules (dead pid, diverged, dirty, self-mount), `record` in `list`.

## Files outside the phase list (all approved by the step lead)
- `packages/git/rust/src/refs.rs` (`custody_lock_path` made `pub`) and `packages/git/rust/src/lib.rs` (one `#[cfg(unix)] pub use refs::custody_lock_path;`): **fgos-git touch, for OPC to review**.
- `src/util/host-bin.mjs` (optional `cwd` option of `invokeHost`) with one test in `test/util/host-bin.test.mjs`.
- `test/verbs/merge/approve-leaf-and-worktree.test.mjs`: assertions match the id the session answered with (the host verb has no id flag, so the harness ignores a requested `sessionId`; other call sites pass it and are unaffected).
- `apps/fgos-gateway/src/gateway.rs`: one test (`the_session_routes_drive_the_real_host_and_return_its_summary_unchanged`, builds the real host through cargo's artifact path, drives `POST /v1/sessions` and `DELETE /v1/sessions/{id}`).
- `test/rust-host/verb-parity.test.mjs`: `"session"` added to `TABLES`. `test/cli/subcommand-flag-drift.test.mjs`: session moved to the native group, reads `.flag("x")` of the shared parser.
- `Cargo.lock` left alone (the host already depends on `fgos-durable-file` through the gateway edge).

## Gates
- `cargo fmt --all --check` clean; `cargo clippy -p fgos -p fgos-identity -p fgos-git -p fgos-host-runtime --all-targets -- -D warnings` clean; gateway crate clippy clean; `cargo test -p fgos -p fgos-identity -p fgos-host-runtime` green (session module 23 tests, `cli_tests` session cases 2); gateway crate `cargo test` 100 passed; `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` clean.
- Census regenerated, 0 undeclared; `export-command-selectors.mjs --check` clean.
- `node scripts/run-tests.mjs` on: verb-parity (events + session tables, session = 42 cases incl. two accepted-difference cases), session, host-bin, architecture, flag-drift, command-routes, git-mutation-census, setup/checks, disconnected-worktree-guard, approve-leaf-and-worktree, fgos-return, postland-drift, merge-gate, unknown-flag-rejection, plus every file importing the harness session helpers: green except the three below.
- The three `test/cli/fgos-return.test.mjs` "return ... subdirectory" tests did come from this branch (correction of the earlier report): on the base Node's `listSessions` took the sessions lock under `<subdir>/.fgos` and made a stray store that `stateView(cwd)` then read. The host creates nothing there, so the tests now read state from the project's top level (`stateView(topLevel)`); `fgos-return.test.mjs` passes in full. `A4 boundary guard` fails under plain `node --test` only.

## Fixes after OPC's verdict
- **B1 (destructive removal).** `end` and `gc` no longer trust a registry row. The project's repository is opened once (`project_repo`, at its trusted main checkout) and passed to `remove_checkout`, which now requires: an absolute `worktreePath` whose real path is under the real sessions directory and not the directory itself, and a worktree whose `common_dir` equals the project's. The check runs before anything is unlinked or removed (the `.fgos` symlink unlink used to come first). `remove_worktree` gets the project repository. `gc` removes nothing Git does not list as a worktree of the project: such a row whose directory exists is kept and reported skipped. A stale row that names nothing on disk is still dropped (only the row goes, nothing is removed): this is the one place I read "keep the row" narrowly, to keep gc able to clear dead rows. Tests: `a_row_naming_another_repositorys_worktree_is_refused_and_that_worktree_is_left_alone`, `a_row_naming_a_path_outside_the_sessions_directory_is_refused_and_touches_nothing` (also the sessions dir itself, a relative and an empty path, and the outside checkout's `.fgos` link left in place).
- **B2.** See Gates: tests fixed, report corrected.
- **M1.** `start` takes HEAD from the caller's own checkout (the base did): `a_session_started_from_a_linked_worktree_begins_on_that_checkouts_own_head` (the linked worktree is ahead of main). The registry and store stay the project's.
- **M2.** `list` waits for the `sessions` lock 3 s, less than the Node client's 5 s, so a busy end or gc gives the named timeout, never the client's.
- **M3 (fgos-git, for OPC).** `fgos_git::acquire_checkout_custody(repo, root)` (all platforms; off Unix `git-lockscope-unavailable-windows`) is the one custody door, called by `recovery.rs` (`scoped_commit_custody`, unchanged behaviour, still `Ok(None)` off Unix) and `session.rs`; `custody_lock_path` is `pub(crate)` again; session's cfg pair is gone. Files: `packages/git/rust/src/{lib.rs,refs.rs,recovery.rs}`.
- **M4.** Module comment states the real lock discipline.
- **Low.** A parse error of the call is a validation refusal, not "requires a sub-verb". Known, as in the base: a lock or registry failure after `start` created the worktree leaves the checkout with no row (gc does not see it; nothing removes it).
- `--dir` debt row retirement text names backlog `p-5x37olszki` (session honours --dir).

## Parity
Table `test/rust-host/parity-cases/session.cases.mjs` (owns `runPreparedCase`, a fresh repository, HOME, TMPDIR per entry; ids, paths, hashes, times and pids normalised) against the base release `8d6a07c4c`. Covers: list/gc empty, start with/without `--item` (bare, empty, `=`), unknown flags (single and several), nesting from a worktree and below it, linked and frozen worktrees (admission refusals), non-repository, `--dir` naming another project, end (no id, `--force` before the id, unknown, twice, clean, forced, diverged then forced, dirty), gc (dead process, diverged and dirty orphans, own worktree, unjudgeable row, vanished worktree), corrupt registry (not JSON, not an array). Zero `node` children from the host for every case; the runner asserts no `.fgos` exists above a fixture. Latency (`session list`) is not re-measured here.

## Retired test -> owner now
| retired (`test/runner/session.test.mjs`) | owner now |
|---|---|
| createSession makes exactly one detached worktree with zero new branches | `wiring/session.rs` `start_makes_exactly_one_detached_worktree_with_no_new_branch` |
| .fgos in the worktree is a symlink to the shared store | `dot_fgos_in_the_session_worktree_is_a_symlink_to_the_shared_store` |
| createSession succeeds when .fgos is committed into HEAD | `start_with_dot_fgos_committed_at_head_still_links_the_shared_store` |
| createSession rejects a sessionId outside the safe charset | behaviour removed: the verb takes no id; ids are the host's UUIDs |
| createSession refuses to nest inside a session worktree | `start_from_inside_a_session_worktree_or_below_is_refused_and_creates_nothing` (+ parity nesting cases) |
| concurrent createSession from separate processes never loses a row | `concurrent_starts_never_lose_a_registry_row` (threads; kernel lock semantics are holder-lock's) |
| sessions lock excludes a second holder / SIGKILLed holder is free at once | holder-lock crate's own lock tests (behaviour not session's) |
| endSession seals open events after releasing the lock | `end_seals_once_with_shutdown_only_after_the_sessions_lock_is_released_and_also_on_failure` (the seal itself: event-store crate) |
| endSession removes a non-diverged session (also with committed .fgos) | `end_removes_a_non_diverged_session_and_clears_its_row` |
| endSession refuses diverged, force removes and retains | `end_refuses_a_diverged_session_naming_the_sha_and_force_keeps_the_commit` |
| endSession unknown / already ended | `end_of_an_unknown_or_already_ended_session_is_a_refusal` |
| listSessions reflects the registry | `list_answers_the_rows_and_is_empty_after_every_end` + the one Node client case in `session.test.mjs` |
| reclaim: dead orphan / live / diverged / legacy row | `gc_reclaims_a_dead_orphan_keeps_live_and_unprovable_rows_and_spares_a_diverged_one` |
| reclaim spares a dirty orphan | `gc_spares_a_dead_orphan_with_uncommitted_changes` |
| reclaim never reclaims the caller's own worktree | `gc_never_reclaims_the_checkout_it_runs_from_even_with_a_dead_pid` |
| guarded removal refusal preserves link, checkout, registry | `a_refused_removal_keeps_the_store_link_the_checkout_and_the_row` |
Also new: corrupt-registry fail-closed, subdirectory and store-less linked worktree roots, outside-a-project refusals, contract rows, projector reading, catalog/descriptor agreement.

## CHANGELOG lines proposed
- `fgos session` runs in the Rust host; `sessions.json` is written atomically.
- `fgos session` outside a project is refused and creates nothing; it used to write a .fgos in the current directory.
- `fgos session` run from a subdirectory or a store-less linked worktree uses the project's session registry instead of creating one there.
- `fgos session end` and `gc` refuse a registry row that does not name one of the project's own session checkouts (under the sessions directory, a worktree of the same repository).
- `--flag=value` is refused for `fgos session`, as for every verb on the shared parser; a missing or unknown sub-command gets the host's one text.
- A refused removal prints the Git port's cause instead of a JSON blob.
- Merge, approve and return read the session registry through the host (`fgos session list`), so they need a resolvable host binary.

## Concerns
1. `fgos-git` touch (`acquire_checkout_custody`, files `lib.rs`, `refs.rs`, `recovery.rs`) needs OPC review.
2. The harness `createSession` ignores a requested `sessionId`/`sessionsDir` (no flag exists); fixed ids in `fgos-return`, `fgos-disconnected-worktree-guard` and `approve` tests were only labels except in the one file edited.
3. Reading `--dir` as Node did (ignored) forces `session.rs` to ask the root door itself: one debt entry on the "resolve the invocation root" row, retires if the verb ever reads `--dir`.
4. Close phase: docs (`docs/platform/identity/spec.md` registry owner, runner spec, reading-map rows, route counts) and the "retired Node verb code" row names `createSession`, `endSession`, `reclaimOrphanedSessions`, `sessionSummary`, `acquireSessionsLock`, `SessionError`. The shared parity runner and my table are deleted by phase 12.
5. The Cargo target `/home/vantt/projects/forgent-worktrees/rvm-s3-p08-target` is kept until the lane lands.
