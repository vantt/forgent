# Phase lead report: remote door, CF01, compaction (phase 02)

Branch `harden/t2-p02-remote-door` (from `harden/t2-p01-red-tests`), pushed. Cargo target `/home/vantt/projects/forgent-worktrees/t2-p02-target`. Main checkout untouched (its WAL was never read; see re-measure).

## Commits (in order)

| Commit | Subject | Git area (OPC) |
|---|---|---|
| `3e43fa59e` | fix(dispatch): keep the herdr socket when the server's state is unknown | no |
| `ee541123e` | test(git): pin the exact refusals and keep the fake ssh boundary | **yes** (OPC's six items; re-review only this delta) |
| `df4c30d82` | fix(git): one remote door reads the configured URL and accepts scp-form ssh origins (also CHANGELOG, `packages/identity`) | **yes** |
| `8e1ecbf63` | fix(git): compact finished worktree and ref chains beyond the recent few (also CHANGELOG) | **yes** |
| `7bac1c05f` | fix(git): compact at most eight finished chains per pass, oldest first | **yes** |

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

Per-pass cap (big lead's answer): `wal::COMPACT_PER_PASS = 8` next to `RECENT_TERMINAL`, oldest eligible chains first; the rest stay readable and drain over later operations. Proof: the existing worktree compaction case now builds a 14-chain backlog, one pass leaves `backlog + 1 - 8` retained and `late-11` still readable, and later passes drain it. Worst case of one pass in the scratch setup (release build, 60 finished chains): **561-652 ms per `create_worktree` including the add itself** (retained 60 -> 53 -> 46 -> 39, one pass each).

## Re-run after the cap

- Node boot test: `ℹ tests 14 / pass 14 / fail 0`.
- `cargo test --no-fail-fast -p fgos-git --test publication`: `test result: FAILED. 32 passed; 2 failed; 1 ignored` (the two phase-5 cases, unchanged: busy and borrow-unavailable).
- `worktree` 11 passed, `refs_remote` 18 passed, clippy clean.

## Git-area commits for OPC

`ee541123e` (tests only; answers OPC's six findings), `df4c30d82`, `8e1ecbf63`, `7bac1c05f` (the per-pass cap). Final Git-area list for OPC: those four. `3e43fa59e` is Node only.

## Unresolved questions

1. Busy cause name: `busy` (my reading); phase 5 owns it (answered: phase 5 decides).
2. (answered) Worktree gets no deferral channel; a silent retry is enough.
3. (answered) Cap of 8 per pass, done.
4. `rg "fn transfer_call"` line in the phase file contradicts the "call halves stay" text; the grep line probably meant `transfer_url`.

## OPC changes round: commits `004807272` (Git area) and `c158aaa53` (docs)

Re-review only `004807272`; `c158aaa53` is one spec sentence (remote section, `docs/platform/git/spec.md`: the scp form is accepted as ssh, bracketed IPv6 scp is refused although Git accepts it).

1. **Create chains kept** (`worktree.rs`): a WorktreeCreate chain is eligible only when both its registration (`<common>/worktrees/<registration>`) and its checkout path are gone; Move and Remove stay eligible. Proof: the prune case `missing_checkout_prune_requires_owned_create_and_preserves_unknown_residue` now runs `RECENT_TERMINAL + COMPACT_PER_PASS + 2` finished filler chains and two further operations before the prune, asserts the `create` chain is still readable, and the prune succeeds. Checked red: with the predicate forced to `true` that case fails (`inspect("create").is_ok()`), as does the keep-assert in the cap case.
2. **Worktree same-id replay**: `compacted_replay` reads the ledger only. Create: the request digest `(kind, Absent, base, writer)` is rebuilt from the caller's request; match -> `worktree-operation-already-completed` (completed), `worktree-operation-not-completed` (not completed), anything else `operation-recovery-required`; a different request -> `operation-id-conflict`. Remove: the ledger's expected tip equals the proof's and next is absent; completed -> `Ok(())`. Move: expected equals next equals the caller's tip; completed -> `worktree-operation-already-completed`. Deviation to know: Remove and Move requests contain live registration identities and tips that do not exist after the effect, so they are checked against the tips the ledger kept, not the full request digest; nor is the binding digest compared (it includes the custody resource that exists only while the path does). No Rust owner test for Worktree replay existed, so `a_compacted_worktree_id_replays_its_recorded_outcome_without_reading_the_disk` is new: create id, remove, compaction (both ids ledger-only), the same create id replayed -> already-completed, the same remove -> done, a different create under the same id -> conflict.
3. **Starvation**: `compact_finished` skips a failed candidate and goes on; at most `COMPACT_PER_PASS` (8) successes and `2 * COMPACT_PER_PASS` attempts per pass; order by the install time of the chain's first record (`Wal::first_change`, `record 0`, which never moves; the directory time that pin-release moves is used only to pick the 4 recent chains). Proof (extended cap case): 8 oldest chains each carry a leftover write temporary (so `compact` refuses), 14 healthy chains behind them; the first pass compacts exactly 8 healthy chains starting at the oldest healthy one, leaves the broken cohort readable, and two more operations drain the remaining eligible healthy chains.
4. **Interrupted deletions**: the pass first resumes ids that appear in both the operations and the ledger directories, through the existing `resume_compaction`, counted in the same bounds. Limit found: `compact_inner` unlinks records from sequence 0 upward, so once the first unlink happened the intent record is gone, and `resume_compaction` needs the intent from its caller; an automatic pass can rebuild it only while record 0 survives (a crash between the ledger install and the first unlink). Residue without its intent is skipped with a named `compaction-deferred` cause. Proof: `a_deletion_cut_short_after_the_ledger_was_written_is_finished_by_a_later_pass` (residue made by compacting and restoring the untouched records beside the ledger entry).
5. Spec sentence: `c158aaa53`.

Other test changes: the old cap and replay cases that created real worktrees and expected their create chains compacted were replaced by the three cases above (a create chain with a checkout is kept; 8 + 14 finished chains drain; the stopped-chain case now uses the shared `finished_chains` helper). The Refs replay case is untouched.

Results (target `t2-p02b-target`; the shared `t2-p02-target` was not used):
- `land_crash_matrix`: `ok. 15 passed; 0 failed; 2 ignored`; `recovery_matrix`: 30 single-case runs, each `ok. 1 passed`.
- `worktree`: `ok. 13 passed`; `refs_remote`: `ok. 18 passed`; `sequence`: `ok. 6 passed`.
- `publication --no-fail-fast`: `FAILED. 32 passed; 2 failed; 1 ignored` (busy and borrow-unavailable, phase 5, unchanged). `ssh_transport`: `FAILED. 5 passed; 1 failed` (the phase 3 hook case, unchanged).
- Node: boot, `test/git/worktree.test.mjs`, `test/git/refs.test.mjs`: `ℹ tests 32 / pass 32 / fail 0`.
- clippy `-p fgos-git -p fgos-identity --all-targets -D warnings`: clean.

Note: `packages/git/contracts/mutation-census.v1.json` shows as modified in this worktree (not mine; the big lead regenerates it); I did not stage it.

## Git-area commits for OPC's delta review

`004807272` only (after `ee541123e`, `df4c30d82` merged). Earlier, not yet merged: `8e1ecbf63`, `7bac1c05f` (superseded in part by `004807272`).
