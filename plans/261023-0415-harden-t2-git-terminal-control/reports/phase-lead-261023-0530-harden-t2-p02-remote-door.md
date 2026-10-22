# Phase lead report: remote door, CF01, compaction (phase 02)

Branch `harden/t2-p02-remote-door` (from `harden/t2-p01-red-tests`), pushed. Cargo target `/home/vantt/projects/forgent-worktrees/t2-p02-target`. Main checkout untouched (its WAL was never read; see re-measure).

## Commits (in order)

| Commit | Subject | Git area (OPC) |
|---|---|---|
| `3e43fa59e` | fix(dispatch): keep the herdr socket when the server's state is unknown | no |
| `ee541123e` | test(git): pin the exact refusals and keep the fake ssh boundary | **yes** (OPC's six items; re-review only this delta) |
| `df4c30d82` | fix(git): one remote door reads the configured URL and accepts scp-form ssh origins (also CHANGELOG, `packages/identity`) | **yes** |
| `8e1ecbf63` | fix(git): compact finished worktree and ref chains beyond the recent few (also CHANGELOG) | **yes** |

Deviation from the requested order: the OPC test-fix commit lands after slice A (A was already committed when the request arrived), before both Git fix slices.

## OPC findings, commit `ee541123e`

1. High, hidden ref: the policy-refusal case moved from `tests/sequence.rs` to `tests/ssh_transport.rs`. The origin is a userless `ssh://example.invalid/<bare>`, the counter is written on the origin with plain git (tip advertised, lease holds), a `pre-receive` hook on the origin writes a marker and declines. The fake ssh runs plain git on the origin, so the hook runs. Asserts the marker exists (hook reached), the push is an error, the origin tip is unchanged. Still red (phase 3): `a policy refusal must not be reported as a lost lease: Ok(Stale)` (`ssh_transport.rs:407`). Red for the stated reason: the marker assertion passed first.
2. Medium, real ssh: `a_changed_ssh_account_on_the_origin_is_refused` moved to `ssh_transport.rs`, old copy deleted from `refs_remote.rs`; asserts the pin refusal cause and zero ssh calls. Green after slice B.
3. Medium, config: now asserts the outcome is not an acknowledgement (or is still pending). Still red (phase 3): `acknowledged although the parent directory sync failed` (`repository_config.rs:237`). If phase 3 completes the sync and acknowledges, it must bring an observable persistence proof; the no-replay assertion stays in the dead-writer case.
4. Medium, busy WAL: exact `(Refused, "busy")` plus a flag proving the competing append fired. Still red (phase 5): `left: (RecoveryRequired, "publication-wal: Busy")  right: (Refused, "busy")` (`publication.rs:2439`). The cause name `busy` is my reading of "the kebab of Busy, as Refs gives"; phase 5 must confirm or rename it here.
   - The second Publication case (borrow-unavailable, phase 5) still red as before: `"publication-borrow-unavailable" and "blocking operation left-behind: publication-wal: PublicationBorrowUnavailable"`.
5. Medium, layout causes: expected causes asserted per read (shallow only: `shallow-history-incomplete`; alternates beat shallow: `alternate-object-unavailable`). Still red (phase 5): `("inspect_input","git-command-failed")` where `shallow-history-incomplete` is expected (`driver.rs`, `a_failed_read_names_the_layout_cause_whichever_read_hits_it`). New green guard `a_missing_tree_or_path_is_an_alternates_error_and_stays_absent_when_only_shallow` covers the `list_tree` missing-parent and path-read branches (alternates: named error; shallow only: absence stays absence, which is the current behaviour; there is no shallow arm in those two branches by design).
6. Low, fake ssh dir: fresh (`create_dir`, pid plus nanos, 0700) and removed by an `atexit` hook after the last case. The success cases also require a non-empty ssh log (`assert_ssh_calls_all_to_git`).

## Slice A: CF01 (`src/runner/dispatch/worker-session-boot.mjs`)

- `judgeServer`: `alive` (capabilities answered with a non-null incarnation) | `dead` (connect refused twice, one `pollMs` apart, same inode and mtime, re-asking capabilities on each look) | `unknown` (everything else). Only dead unlinks; unknown throws `worker-session-server-unknown`; the post-start poll loop keeps the boolean `serverAnswers` and never unlinks. Seams: `connectFn`, `statFn` next to `unlinkFn`/`sleepFn`.
- Tests: the old dead-socket case now supplies the OS evidence (refused twice) and a server that answers only after the spawn; new: route fails and a connect works keeps the socket; null incarnation keeps it; refused once then answering is not removed; two refusals on different files are not proof. 14/14 green.

## Slice B: the one remote door

- `GitDriver::remote_target` (remote.rs) replaces `transfer_url` and Publication's `remote_url`; it reads raw, refuses control bytes, whitespace, `?`, `#`, `::`, leading `-` (user and host, both forms), credentials; compares raw with the pin; scheme ladder with scp form (`[user@]host:path`, host `[A-Za-z0-9._-]+`, no leading `-`, ssh account rule). One extra rule beyond the phase text: an `@` in the path's first segment refuses (`git:secret@host:p` otherwise parses as host `git`; phase 1's refusal case demands it).
- `redact` keeps a password-free ssh user (shared predicate `userinfo_is_credential`). Publication's `remote_call` uses `transfer_argv`. `transfer_call` stays (the Remote half under the caller's `LockScope`, as the phase text says); the verification line `rg "fn transfer_url|fn transfer_call"` therefore finds `transfer_call`: that grep contradicts the Requirements text, and I followed the text. `transfer_url` and Publication's ladder are gone: `rg remote-protocol-not-supported packages/git/rust/src` -> one line.
- `sequence_home` returns `Result<SequenceHome>`: origin absent (config listing) -> Local; present -> the door runs now; read errors returned. Callers moved: `mint.rs` claim (`git_refusal`) and give-back (typed refusal naming the unreturned number), 6 sites in `tests/sequence.rs`, 2 in `ssh_transport.rs`.
- CF07: no test added (closed as not reproduced). The restructure stays because the unsupported-origin refusal needs it; `tests/sequence.rs` case `an_origin_that_cannot_be_used_is_a_refusal_not_a_local_counter` proves refusal and the absent-origin Local answer; the identity case proves the give-back by name (and that the origin's counter is untouched).
- **Account-change case no longer spawns ssh once fixed: confirmed** (`ssh_calls` is empty; refusal `remote-url-not-pinned-or-credentials-present` before any transfer).
- Turned green, for the stated reason: `a_repository_whose_origin_is_in_scp_form_claims_a_counter_number_through_that_origin`, `an_scp_form_origin_is_accepted_and_option_or_helper_look_alikes_are_refused`, `the_remote_port_hands_git_the_url_the_remote_is_configured_with`, `publication_accepts_the_pin_it_is_given_for_an_ssh_url_with_a_user_name`, `a_changed_ssh_account_on_the_origin_is_refused`.
- Unit case in `remote.rs` extended with four credential/control strings; no scp-grammar unit copy, because `ssh_transport.rs` owns the grammar through the real door (design principle 8).
- Pins: stored `ssh://[redacted]@...` provenance answers `remote URL changed; rerun setup` once; CHANGELOG says so. IDENT must be told before merge (`mint.rs:166,206` changed).

## Slice C: compaction

- `refs::compact_finished(driver, repo, scope, wal, family)`: releases the pin (idempotent `release_pin`) and compacts every finished chain of the family beyond `wal::RECENT_TERMINAL` (4, moved to `wal.rs`, pub), under the held `worktree-admin` scope, with the chain's own binding (the Land precedent). Called at the end of `finish_worktree` (Worktree family: create/move/remove) and on the successful Refs path (RefUpdate/RefDelete). ConfigChange is not in either family. Unresolved chains are filtered out (no outcome).
- Deviation: Publication's `release_pin_and_compact` did not become the shared helper; it releases through its own port methods (`cas_raw`, `append_after_ref_durable`) and borrow, so the shared helper is the Refs `release_pin` plus `wal.compact` that Land already uses. Publication only imports the constant.
- Deferral channel: Refs returns the cause in the receipt's `durability.capability_evidence` (`compaction-deferred: <id>: <cause>`). Worktree has no returned receipt (`create` returns `WorktreeHandle`, `remove` returns `()`); adding a field means a public Rust, addon and ports-contract change, so a Worktree deferral leaves the chain retained, retried by the next pass, with no channel. Decision for the big lead if a channel is wanted.
- Replay (Refs): compacted success -> the receipt (from the caller's intent and the ledger tip/attribution); loss -> `stale` `compare-and-swap-stale`; abandoned and others -> `operation-recovery-required`. Worktree unchanged. Callers: `src/runner/worktree.mjs:718,1232,1235` mint a fresh `operationId()` every call, so no production caller replays an id; nothing handles `operation-recovery-required` for them.
- Tests: `worktree.rs` two cases, `refs_remote.rs` one case with the three replay rows. Verified red with the pass disabled (`op-won was not compacted`; Worktree: 7 retained, `stuck` not compacted), green with it on. Not done: the `wal.rs` `ten_thousand_...` Worktree-kind extension (it would test `wal.compact` with a fixture kind, which the port tests above already observe); `tests/repository_config.rs` stays green.

## Verification

- `cargo test --no-fail-fast`: `sequence` 6/6, `refs_remote` 18/18, `worktree` 11/11, `land_crash_matrix` all green, `recovery_matrix` green (4 filtered cases each pass), `publication` 32 pass / 2 red (phase 5 cases above), `repository_config` 8 pass / 1 red (phase 3), `ssh_transport` 5 pass / 1 red (phase 3 hook case), `--lib` 67 pass / 2 red (`driver` layout causes phase 5, `wal` temporaries phase 3: `a chain with leftover temporaries: Err(Corrupt("directory scan bound"))`).
- `cargo test -p fgos-identity`, `-p fgos-event-store`: all green. `cargo clippy -p fgos-git -p fgos-identity --all-targets -- -D warnings`: clean. `cargo check --workspace --all-targets`: clean.
- Node one-file run (boot, remote, refs, worktree, worktree-admin-multiprocess): 40/40.
- `tests/publication.rs` was run as part of the list above.

## Delta lines (HEAD vs `fc5b4e434`)

| Part | + | - | net | plan |
|---|---|---|---|---|
| Node src | 67 | 7 | **+60** | +10 |
| Rust src (driver, publication, refs, remote, sequence, wal, worktree, mint) | 185 | 77 | **+108** | +20 |
| Node tests | 94 | 6 | +88 | |
| Rust tests (tests/, inline `driver.rs` test module, identity test) | 392 | 110 | **+282** | +60 |
| CHANGELOG | 5 | 0 | +5 | |

Over the estimate: Node (+50) from the double probe plus connect seam and the named error; Rust (+88) from the grammar and shared predicate (remote.rs +38), the compaction helper and compacted replay (+71 refs.rs), mostly offset by the two deleted ladders (-40 publication.rs). The OPC commit alone is +171/-103 tests. Retiring nothing; two cases moved (account, hook).

## Test-cost line

Added 13 cases (Node boot 4; Rust: sequence 1, identity 1, worktree 2, refs_remote 1 with three rows, driver 1; plus the two moved into `ssh_transport.rs`), rewrote 1 (dead socket), strengthened 3 (config, busy, layout), retired 0, moved 2. New CLI/host spawns: none; the worktree cases run 7 and 5 real `git worktree add` calls, the refs case 10 ref operations.

## Re-measure (F-C1)

The checkout's real WAL could not be copied: a WAL is bound to its repository directory identity (device and inode), so a copy refuses to open. Instead, a scratch repository with 322 retained finished Worktree chains (six records each, pins released, the shape the 322 real operation directories have), read with the same two reads admission and `inspectGit` do (`scan(100_000)` then `active(100_000)`), release build, load 1.7:

- before: **32.3 ms** p50 (the speed seat measured `inspectGit` p50 28.5 ms at 322 chains);
- one compaction pass (one `create_worktree` including a 318-chain backlog): **14.9 s**, about 47 ms per chain, fsync bound;
- after: 4 retained chains, **2.8 ms** p50.

Concern for the big lead: on a machine with a large backlog the first worktree add after upgrade pays that one-time pass (about 15 s for 318 chains). If that is unwanted, cap the chains compacted per pass (a `.take(n)` in `compact_finished`); I did not, because the phase text asks for the full pass and a cap changes when retained history becomes bounded.

## Git-area commits for OPC

`ee541123e` (tests only; this is the delta that answers OPC's six findings), `df4c30d82`, `8e1ecbf63`. `3e43fa59e` is Node only.

## Unresolved questions

1. Busy cause name: `busy` (my reading); phase 5 owns it.
2. Worktree deferral channel: none added (contract ripple); accept?
3. Cap per pass for the first big compaction (15 s)?
4. `rg "fn transfer_call"` line in the phase file contradicts the "call halves stay" text; the grep line probably meant `transfer_url`.
