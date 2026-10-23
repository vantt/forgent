# Phase lead report: red tests (phase 01)

Branch `harden/t2-p01-red-tests` (from `harden/t2-git-terminal-control`). Cargo target `/home/vantt/projects/forgent-worktrees/t2-p01-target`. Node: no change. Production code: no change.

## Per finding

| Finding | Result | Test (file) | Failing assertion / evidence |
|---|---|---|---|
| RT01 scp-form origin | reproduced | `a_repository_whose_origin_is_in_scp_form_claims_a_counter_number_through_that_origin` (`packages/git/rust/tests/ssh_transport.rs`) | `a claim through an scp-form origin: OperationError { code: Refused, cause: "remote-protocol-not-supported" ... }` |
| RT01 door grammar | reproduced (accept half); refuse half is a guard, green today | `an_scp_form_origin_is_accepted_and_option_or_helper_look_alikes_are_refused` (`ssh_transport.rs`) | `"git@example.invalid:/tmp/.../origin.git" must be accepted: ... cause: "remote-protocol-not-supported"`. The refused list (`-oProxyCommand=x:y`, `ssh://-oProxyCommand=x@h/r`, `ext::sh -c x`, `fd::17`, `[::1]:p`, `a b@h:p`, `h:p?x`, userinfo with `:` or `%`, tab) is refused today; the test asserts the fake ssh is never reached for them, so it protects the grammar once scp is accepted. Deviation: driven through `inspect_remote` (the real door) in `ssh_transport.rs`, not as an inline test in `remote.rs`, so it survives the classifier moving in phase 2 and can use the fake ssh. |
| F-7 Remote port | reproduced | `the_remote_port_hands_git_the_url_the_remote_is_configured_with` (`ssh_transport.rs`) | push fails `cause: "remote-advertisement-failed"`; git stderr decodes to `fake ssh: could not resolve hostname redacted`: git was handed `ssh://[redacted]@example.invalid/...` and parsed `[redacted]` as the host. With a fake that served any host, the push even succeeded against the wrong host. |
| F-7 Publication pin | reproduced | `publication_accepts_the_pin_it_is_given_for_an_ssh_url_with_a_user_name` (`ssh_transport.rs`) | `cause: "remote-url-not-pinned-or-credentials-present"` with the pin taken from `Inspect::remote_url` |
| Pin binds the ssh account | reproduced (the plan said "red only if the fix compares redacted forms"; it is red today) | `a_changed_ssh_account_on_the_origin_is_refused` (`tests/refs_remote.rs`) | expected `remote-url-not-pinned-or-credentials-present`, got `remote-advertisement-failed`: pin `ssh://[redacted]@h/x` equals the redacted read of `ssh://root@h/x`, so the Remote port went on to run ssh. While red this case spawns one real `ssh` child to the unresolvable host `example.invalid`; after the fix it refuses before any spawn. |
| CF02 | reproduced | `a_scan_reports_an_expired_retained_pane_with_its_pane_id_and_closes_nothing` (`packages/terminal-control/rust/tests/core_failures.rs`, retarget of `retain_closes_only_past_until_on_the_same_incarnation`) | `the finding names the pane to close: "retain expired; pane closed"`; the scan also removes the pane today. Assumes the pane id appears in the finding `detail` text (no new field assumed). |
| CF03 pid-only | reproduced | `a_pane_whose_foreground_process_only_shares_a_pid_with_the_launched_one_is_kept` (`core_failures.rs`) | `Released { disposition: Close }` instead of `KeptUnknown`. The launched sleeper is killed so the foreground entry carrying its pid is a stranger; no marker editing. |
| CF03 empty list | reproduced | `an_empty_foreground_list_proves_no_ownership` (`core_failures.rs`) | `Released { disposition: Close }` instead of `KeptUnknown` |
| CF04 | reproduced | `errors_before_install_propagate_and_errors_after_install_keep_the_outcome_unless_the_parent_sync_failed` (`packages/terminal-control/rust/src/store.rs`, renamed; `parent-fsync` moved out of the loop) | `a marker whose durability is unproven was reported as Ok(true)`; the installed file is still asserted present. `name-installed` and `temp-removed` keep their old expectations (not part of the finding's witness). |
| CF05 | reproduced | `a_config_edit_that_failed_between_rename_and_parent_sync_is_not_acknowledged_on_observation_alone` (`packages/git/rust/tests/repository_config.rs`) | `acknowledged on observation alone: ["effectObservedOnly"]`. No fsync seam exists, so the witness is the recorded outcome after a fault at `config-replaced`: acknowledged with detail `effectObservedOnly`. It turns green if the fix completes the sync before a plain acknowledgement, or leaves the outcome unacknowledged. It also asserts the edit appears once and no `config.lock` remains. |
| CF06 | reproduced (all three readers) | `failed_write_temporaries_never_count_against_the_record_bound` (`packages/git/rust/src/wal.rs`, beside `scan_ignores_compaction_temporaries_before_counting_the_bound`) | 40 `.durable-file-*.tmp` in an operation dir and in a pre-intent dir: `inspect` -> `Corrupt("directory scan bound")`, `known_id` -> `Corrupt("pre-intent scan bound")`, `scan` -> both entries carry `error: Some(...)`. |
| CF07 | **not reproduced** | none kept | The seat's witness (origin URL with non-UTF-8 bytes) does not produce a `remote_url` error: `redact` returns `String::from_utf8_lossy(...)` (always valid UTF-8, `driver.rs:1757-1775`), so `line` never fails; the push errored, nothing was created locally, the test was green. A corrupt config line makes every later local call refuse in `preflight`, and `git remote get-url` exits 0 for every other odd config tried (fetch-only remote, pushurl only, empty url, backslash-n). The `Err(_) => Local` arm (`sequence.rs:73`) is real code but only reachable by a read timeout or process fault, which no fixture can inject without a new seam. The probe test was dropped (principle 8). |
| CF08 | reproduced | `a_push_the_remote_refuses_for_another_reason_keeps_that_refusal` (`packages/git/rust/tests/sequence.rs`) | `a policy refusal must not be reported as a lost lease: Ok(Stale)`. Witness is `receive.hideRefs=refs/fgos/seq` on the bare origin. A rejecting `pre-receive` hook cannot be used: the driver runs remote receive-pack with its own hooks path, so origin hooks never run. `receive.denyNonFastForwards` was accepted (it applies to `refs/heads` only). |
| CF09 | **no unit witness** | none | `refs::sync_refs` and `objects::sync_loose_objects` have no checkpoint seam and the sequence path never reaches them; observing order would need a new test-only seam. Per the witness rule: phase 3's proof is OPC's reading review plus a run of `scripts/git/e1-power-cut.*`. |
| CF10 | reproduced | `commands_do_not_inherit_the_callers_descriptors` (`packages/terminal-control/rust/tests/herdr_driver_fake.rs`, extended with a descriptor from `F_DUPFD` at 2048) | `leaked [2048] into [0, 1, 10, 11, 12, 2, 2048]`. A precondition assert names a too-low descriptor limit (here 524288). |
| E-5 | reproduced | `a_failed_read_names_the_same_layout_cause_whichever_read_hits_it` (`packages/git/rust/src/driver.rs`, beside `layouts_preserve_missing_object_diagnostics_without_fetch`) | `shallow only: [("checked","shallow-history-incomplete"),("inspect_input","git-command-failed"),("resolve_head","shallow-history-incomplete")]; alternates and shallow: [("checked","alternate-object-unavailable"),("inspect_input","alternate-object-unavailable"),("resolve_head","shallow-history-incomplete")]`. Three read paths are exercised; the other sites (`list_tree`, the two path reads) need existing objects and carry the same promisor/alternates ladder as `checked`, so they are covered once the ladder is one function. |
| F-5 busy | reproduced | `publication_names_a_busy_wal_like_every_other_port` (`packages/git/rust/tests/publication.rs`) | `RecoveryRequired "publication-wal: Busy"`. A checkpoint hook appends a record to the chain from a second `Wal` handle (a racing writer); asserts `Refused` plus a kebab cause. Per the simplicity seat, Refs maps Busy through `failure` (`Refused`, cause from the Debug name `Busy`, which is not kebab either); I did not re-run Refs, so the assertion is the fix's target (`Refused` + kebab), not a copy of Refs. |
| F-5 two spellings | reproduced | `a_borrow_that_is_unavailable_has_one_cause_name_whichever_check_finds_it` (`publication.rs`) | `"publication-borrow-unavailable"` vs `"blocking operation left-behind: publication-wal: PublicationBorrowUnavailable"`. Asserts the admission cause ends with the authority cause (the `blocking operation <id>:` prefix is allowed). |

Fake ssh feasibility: works. `tests/ssh_transport.rs` writes the fake `ssh` into its own temp dir, prepends it to `PATH` once before any driver call, and serialises its cases. It serves `git-upload-pack` and `git-receive-pack` on the path argument, and refuses any host other than `example.invalid` and any account other than `git`. No containment problem; the four cases take about 0.6 s. The end-to-end acceptance "an scp-form origin can mint ids" is therefore closed by a test (the RT01 case via `sequence_home`/`sequence_push`/`sequence_tip`); no manual transfer is needed.

## Verification

```
cargo test -p fgos-git --test sequence --test refs_remote --test publication --test repository_config --test ssh_transport
cargo test -p fgos-git --lib -- wal:: driver:: remote::
cargo test -p fgos-terminal-control --test core_failures --test herdr_driver_fake
cargo test -p fgos-terminal-control --lib -- store::
```

Red in `--no-fail-fast` runs, exactly the new or retargeted cases (16): ssh_transport 4, refs_remote 1, publication 2, repository_config 1, sequence 1, git lib 2 (wal, driver), terminal core_failures 3, herdr_driver_fake 1 (extended), terminal lib store 1 (retargeted). No other case in the touched files failed. Not run: whole `npm test`, other crates.

## Delta lines (HEAD vs `182161f52`, tests only)

- Git: `ssh_transport.rs` +418 (new), `publication.rs` +129, `driver.rs` inline +47, `wal.rs` inline +34, `repository_config.rs` +43, `refs_remote.rs` +33, `sequence.rs` +27 = +731.
- Terminal-control: `core_failures.rs` +56 -2, `store.rs` inline +14 -2, `herdr_driver_fake.rs` +12 -3 = +82 -7.
- Total tests +813 / -7 (plan estimate +260; `ssh_transport.rs` carries the fake ssh script and fixtures, and the Publication case needs its own bare-repository setup). Node 0, Rust production 0.

## Test-cost line

Added 13 new cases (4 in the new binary, 9 elsewhere), extended or retargeted 3 existing ones (retained-pane scan retarget, store parent-sync rename, descriptor extension), retired 0. New CLI/host spawns: none. Each ssh case adds 1-3 git children plus the fake shell; the refs_remote account case spawns one real `ssh` child while red.

## Commits and Git-area review

- `e33224774` `test(git): ...` touches the Git area (`packages/git/**`): needs OPC review.
- `3619a0a7a` `test(terminal-control): ...` does not touch the Git area.
- Branch tip: the report commit on top of `3619a0a7a`, pushed to `origin/harden/t2-p01-red-tests`.

## Notes for later phases

- Phase 3 should drop CF07 from its slice (closed as not reproduced) and carry CF09 without a unit witness.
- The accepted-grammar case and the account case take their pin through `Inspect::remote_url`, the way callers do; the phase 2 change to `redact` is what turns them green.
- `rustfmt` was run only on the new file: `driver.rs` is not rustfmt-clean on the track branch, so other files were left as written.
