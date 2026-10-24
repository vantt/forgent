# HARDEN T2 closing report: Git and terminal-control

Big lead `lead:HARDEN`, 2026-10-23 22:28 (Asia/Saigon).
- Sub-plan: [261023-0415-harden-t2-git-terminal-control](../261023-0415-harden-t2-git-terminal-control/plan.md). Phase reports are in its `reports/` folder.
- Arbitration: [council-261023-0402](council-261023-0402-harden-t2-arbitration.md). Landing: [landing-261023-2228](landing-261023-2228-harden-t2-git-terminal-control-this-machine.md).

T2 is merged to main as `a01f725bf`, from the track branch `harden/t2-git-terminal-control` (tip `158ba01bc`, which carries the head-in-listing branch). It is **active on the second machine since 22:09**: release `sha256:ae20f16f…`, previous `sha256:c91242ea…`. The owner machine lands it by the [guide](guide-261023-2228-harden-t2-owner-machine-landing.md), when the owner says go.

**Two things the owner should read first.**
1. **All three size ceilings were missed** (section 3). The big lead landed before checking the table, although the phase order said a missed ceiling blocks the close. The owner is being asked Q8 now.
2. **Two arbitration lines are reversed by evidence** and carried here as notes, not questions: the two `git var` children stay (D-T2-9), and the WAL digest twin stays (D-T2-10). Section 4 has the evidence.

## 1. What changed

### Git
- **One remote door** (`GitDriver::remote_target`).
  - It reads the configured URL raw, compares it with the pin, and refuses credentials, controls, `?`, `#`, `::`, whitespace and a leading `-` in user or host.
  - It accepts git's scp form `user@host:path` as ssh.
  - `redact` keeps a password-free ssh user, so the displayed form equals the raw form for every URL the door accepts.
  - Result: a GitHub scp-form origin and an `ssh://user@host/...` origin can mint ids (`fgos identity mint`), use the Remote port, and publish through Event Store. Before, both were refused or sent to `ssh://[redacted]@host`.
  - The sequence home now refuses an unusable origin by name before any claim. `packages/identity` `mint.rs` moved with it, and IDENT acknowledged it (board 08:50).
- **Durability.**
  - Every `core.fsync=all` site (17) goes through one helper that also forces `core.fsyncMethod=fsync`, so a repository or global `writeout-only` can no longer turn a reported durable effect into one a power cut rolls back.
  - A config edit is acknowledged only after its file and directory sync. A local counter claim is durable before it is reported. WAL temporaries of failed writes no longer count against the record bound.
- **Cost.**
  - Refs and config admission read the WAL once (`wal.active`) instead of twice.
  - `list_refs` passes name patterns to `for-each-ref`.
  - The publication ceremony and `resolve_head` run fewer children (section 2).
  - One repository fact cache per process carries config and formats across checkout handles, with freshness resting on the existing config stamp.
  - Event Store's tip read returns HEAD inside the listing it already runs (`%(HEAD)`).
- **Land waits in Rust.** The Land port holds an explicit `Idle | Pending | Open` state and waits on its own thread. The Node retry loop (`lockUnavailable`, `within`) and its error re-parse are gone.
- **Consolidation.**
  - One failure mapping (`From<WalError>`), one constructor per code, one layout-cause function instead of six ladders, one transaction skeleton (`Intent::of`, `authority_gate`, `CommitResult::committed/unchanged`, one native-state list).
  - The WAL runs on the durable-file checkpoint trait.
  - Six unreachable result codes are gone. `ports.v1.json` is made true and pinned at run time by `test/git/native-load.test.mjs`.
  - Unused Node arms (`fetchRefs`, `inspectRemote`, the config facade `recover`, the create `sessionId`) and `createGitNativeLockRepair` are deleted. `nativeError` lives in `src/native/door.mjs`.

### Terminal-control
- **Correctness.**
  - CF01: the worker boot unlinks a herdr socket only when the OS refuses a connect twice on the same file. When the server's state cannot be judged, it keeps the socket and fails by name.
  - CF02: doctor observes and never closes a retained pane.
  - CF03: closing needs the recorded process tuple, not pid equality.
  - CF04: an install whose directory sync failed is answered `unknown`.
  - CF10: the herdr runner spawns through Process's explicit-fd door and waits on the exit descriptor.
- **The core owns more.** It validates the config envelope (the 40×8 floor) and names a refusal. It answers its defaults and policy names in `capabilities`. One timeout budget is passed down to every herdr command of an operation.
- **Pane access behind the port** (owner decision 20). The anchor pane, agent kinds and integrations, the socket path derived from the session name, and caller ownership on `attach`. `pane-owned.sh` is deleted. The only raw herdr exec left is the worker session-server start, named in the spec.
- **Dead surface deleted:** the activity-launch branch, `label_tab`, the group hint, `KeptUnknown` of the marker outcome, three capabilities (15 to 12), `roleHint`, `reportState`, dead fixtures, `herdr-agent.mjs`, the `terminal-dir` fix.
- **Layout and names** (owner decisions 22 to 27).
  - The geometry is measured once per allocate.
  - Overflow tabs are numbered. Worker panes carry a label and their role reaches the driver.
  - `even-split` is the default policy (`measured-split` stays selectable).
  - Labels are built in one Rust place: `<short id> · <title ≤ 24>`, `<role> · <model>`, own pane `… | fg.ssid:<8>`.
  - macOS: the process parent is read on macOS, and two build fixes (holder-lock, durable-file) make the workspace compile for `aarch64-apple-darwin`. It has never run on a Mac.

### Doctor
Git rows 10 to 6, terminal rows 3 to 2, four Git fixes kept, no condition lost. Rows carry `detail`. The journal row now prints the retained chain count and oldest age (owner pick A1).

### Docs
Git and terminal-control specs, distribution, runner, reading map, the setup-doctor registry, the how-to, `CHANGELOG.md`. The specs state the code facts; no line budgets are written into them.

## 2. Before and after

Second machine, ext4 NVMe, release builds. **Load was 2 to 5 from other leads during every phase measurement, so only same-moment pairs mean anything.** The figures are the phase leads' own. I found no phase 17 re-measure on a quiet machine in the records, so none is claimed.

| Call | Before | After | Source |
|---|---|---|---|
| Refs, Worktree and config admission read at 322 retained chains | 32.3 ms p50 (`scan` then `active`) | **15.8 ms** p50 (`active` alone) | phase 2 report |
| Publication ceremony per seal (CAS plus pin release), Git children | 13 steady, 15 first publication | **10** both | phase 5C |
| `resolve_head`, children per call | born 3, unborn 4, detached with a missing commit 3 | born **2**, unborn 3, missing commit 2 | phase 5A |
| Event Store read with an attached HEAD, children | 11 | **9** (HEAD cost 2 to 0) | head-in-listing report |
| Contained children per worktree add | 15 | **13** (one `config` and one formats read less) | phase 13, strace marginal, its own probe shape |
| `list_refs` of one ref among 1 300 (git alone) | 7.56 ms | **0.86 ms** | phase 4 |
| Terminal allocate, herdr commands beside 1, 2, 3, 4 live panes (fake herdr) | 8, 12, 16, 20 (a layout read, and a pty read for every pane, per allocate: about (N+1)² on a real tab) | **6, 7, 8, 9** (one layout read per tab, pty read for the new pane only; the +1 is the pane label) | layout bugs report |
| `attach`, herdr commands | 4 | 2 (3 after the ownership check of the port moves) | layout bugs and port moves reports |
| Doctor `inspectGit` calls per run | 7 to 8 | **4** (5 with a non-origin remote) | phase 7 |
| `loop.test` B/A (WORK's branch over T2 plus head-in-listing) | 1.83 | **1.41** | WORK's A/B, board 21:05 |

Read these honestly:
- **Worktree add.** The speed seat's baseline was 184 ms, 25 fsync and 19 children. At the track tip the phase 4 lead measured 11.5 contained children both before and after its change (the drop predates it), so 19 no longer held. The p50 figures moved by tens of milliseconds under load: phase 4 had 269 / 282 / 301 before and 269 / 262 / 284 after; phase 13 had 169 to 222 before and 167 to 187 after. fsyncs per add did not change (about 22 to 23). The owner-approved attempt to cut them (phase 10) measured 25 to 23 and no time change, and was withdrawn (decision 23).
- **`loop.test` B/A is not a T2 speed-up.** It is the ratio of WORK's cutover branch to T2, and the gain is the publication ceremony, the head-in-listing branch and WORK's own waves. The CLI A/B stays at 3.6× (237 ms against about 880 ms per `move`), and WORK profiles one `move` next.
- **Not re-measured at close:** the doctor wall time, one terminal `capabilities` op, and the wall time of `test/runner/worktree-admin-multiprocess.test.mjs`. TEST's W2 and W3 triggers waited for the Worktree compaction (F-C1), which left T2, so TEST must be told what changed (section 6).
- **Test-suite cost totals** (`node scripts/test-proof-inventory.mjs --cli-cost`, before and after) were not run.

## 3. Net size against the ceilings

HARDEN commits only, `git diff <merge-base>..<track>` at `db5f19193`. Rust tests under `tests/` count as tests; **inline `#[cfg(test)]` modules are counted in Rust here**, which charges the Rust line with test code and flatters the tests line (the phase 17 rule counted them as tests). JSON contracts and fixtures are shown apart.

| Part | Ceiling | Plan floor (phases 1 to 9) | Measured | Verdict |
|---|---|---|---|---|
| Node `src bin scripts` | ≤ −120 | ≈ −245 | **−76** | missed by 44 |
| Rust src | ≤ 0 | ≈ −145 | **+490** | missed |
| Tests | ≤ 0 | ≈ +200 (expected ≈ −55) | **+2 044** | missed |
| Layer (the three above) | ≤ −120 | — | **+2 458** | missed |
| JSON contracts and fixtures | not capped | — | +1 941 | shown apart |

The measured figures are the big lead's run of the phase 17 command; I have not re-derived them. The plan's floors cover phases 1 to 9 only, and the additions below came after the ceilings were set.

**Where the additions come from** (each owner-approved or a bug fix; figures from the phase reports unless marked):
- **Owner picks after the ceilings (11:10).**
  - Q2 port moves: Rust src +220, Rust tests +144, Node src −19, shell −38, Node tests −67.
  - Even-split policy: about +145 production Rust (`even_split.rs` is 127 lines), 22 new fixtures, about +75 Rust tests.
  - Labels: Rust src +50/−6, Rust tests +45/−7.
  - A1 (journal line): two `Backlog` fields and a 9-line Node formatter. A2 (repository fact cache): Rust src +25, Rust tests +36.
- **The Land wait in Rust:** Rust src +127 (phase 4, including the `list_refs` change). Its estimate was +45; the explicit port state, the worker thread and cancel-on-settle account for the rest.
- **Head-in-listing:** about +55 Rust net (69 added), +261 tests (one new binary in each of two crates).
- **macOS:** parent read `packages/process` macOS +29/−1, holder-lock build fix +7, durable-file build fix +4/−2.
- **Phase 1's red tests** were +813 tests against an estimate of +260; the new `ssh_transport.rs` (the fake `ssh` and its fixtures) is +418 of it.
- **Test retirements** paid less than the plan's expected figure in phase 6B: Node tests −105 against an expected −280, because two route cases failed their re-proof and were kept.

**Q8, asked of the owner (decision template).**
- *What is happening.* Node −76 against ≤ −120, Rust +490 against ≤ 0, tests +2 044 against ≤ 0.
- *Cause.* The owner-approved additions above, plus red tests written as new files.
- *Options.* (a) accept the overrun and close; (b) fold one slice that still pays; (c) accept the Rust growth and fold the tests through TEST's D4 move-down (the 53 Node Git tests that own Rust behaviour).
- *Recommendation (draft; the big lead confirms before it goes out).* (a) for Rust, because the growth is behaviour the owner chose; (c) for tests, as a TEST follow-up, not a T2 block.
- *Scope of the answer.* T2's ceilings only.

Node budgets named in the plan's "Done when": met: `src/git` (216 lines in 12 files at phase 9), `terminal-control-checks.mjs` (120, the Q2 target). Missed: `git-checks.mjs` (169 against 150), `client.mjs` (235 against 200, the second spawn path was not paid), `config.mjs` (111 against 100).

## 4. Arbitration items

### Fixed (owning proof named, green on the final tree)

| Finding | Owning proof |
|---|---|
| CF01 socket unlinked on an unanswered route | `test/runner/dispatch-worker-session-boot.test.mjs` (dead socket cleared only after two refusals on the same file; unknown keeps the socket) |
| CF02 doctor closes panes | `core_failures.rs::a_scan_reports_an_expired_retained_pane_with_its_pane_id_and_closes_nothing` |
| CF03 pid-only ownership | `core_failures.rs::a_pane_whose_foreground_process_only_shares_a_pid_with_the_launched_one_is_kept`, `::an_empty_foreground_list_proves_no_ownership` |
| CF04 lost durability reported as success (terminal store) | `store.rs::errors_before_install_propagate_and_errors_after_install_keep_the_outcome_unless_the_parent_sync_failed` |
| CF05 same, config recovery | `repository_config.rs::a_config_edit_that_failed_after_the_rename_is_acknowledged_only_once_its_sync_completed`, `::a_config_edit_whose_sync_cannot_be_completed_keeps_unknown_evidence` |
| CF06 WAL temporaries count against the bound | `wal.rs::failed_write_temporaries_never_count_against_the_record_bound` |
| CF08 every rejected push read as a lost lease | `ssh_transport.rs::a_push_the_remote_refuses_for_another_reason_keeps_that_refusal` (plus one unit case on the spellings, git 2.53.0 evidence) |
| CF09 local counter durability | `sequence.rs::a_local_claim_asks_git_to_flush_even_when_the_repository_configures_writeout_only` pins the flags. **There is no unit witness of the ordering;** the proof is OPC's reading review. The power-cut script was not run (the phase lead was not root). |
| CF10 herdr fd seal stops at 1023 | `herdr_driver_fake.rs::commands_do_not_inherit_the_callers_descriptors` (descriptor 2048). Residual, named: Process's door closes a parent-side snapshot, not at fork. |
| RT01 scp-form origin, F-7 redacted URL | `ssh_transport.rs` (the scp claim, the grammar and refusal list, the URL the port is handed, the account-change refusal with zero ssh calls) and `publication.rs` (the pin accepted for an ssh user) |
| E-5 layout-cause copies disagree | `driver.rs::a_failed_read_names_the_layout_cause_whichever_read_hits_it` |
| F-5 double spelling of WAL failures | `publication.rs::publication_names_a_busy_wal_like_every_other_port`, `::a_borrow_that_is_unavailable_has_one_cause_name_whichever_check_finds_it`, and `contracts.rs::every_wal_failure_is_named_by_one_kebab_cause_and_code_in_every_port` |
| Land wait decided in Node | `test/git/land.test.mjs` (same-process holder keeps the loop ticking; a second call or close while pending is named; held locks refuse a wait) |
| F-C4 whole-namespace listing | `tests/inspect.rs::listing_one_namespace_returns_exactly_its_refs_and_pages_the_same_way` |
| F-C5 and A2 repeated config and format reads | `driver.rs::checkout_stamp_rechecks_external_config_writes_between_children` (counts reads) |
| Journal retention (A1) | `wal.rs::scan_counts_only_finished_chains_still_on_disk` plus two cases in `test/setup/git-checks.test.mjs` |
| Doctor 10+3 to 6+2 | the condition map of the phase 7 report; `test/setup/{git-checks,terminal-control-checks,checks}.test.mjs` |
| Pane access outside the port (E-10, E-11, E-12, E-17) | the driver cases, route inline cases, `test/plugins/terminal-skill-attach.test.mjs` (real-process ownership proof) |
| Dead surface, contracts made true (E-26, F-8, E-14 core half, E-13, E-15, E-16) | `herdr_driver_fake.rs::each_operation_runs_a_fixed_number_of_herdr_commands` (replaces the p95 timing bar), `test/terminal-control/contracts.test.mjs`, the route inline floor and budget cases |
| E-1, E-3, F-1, E-6, E-20, E-21, E-24 | `cargo test -p fgos-git`: 294 pass, 0 fail, after each slice; `test/git/native-load.test.mjs` pins `ports.v1.json` |
| Q3 sentence, Q4 Node arms | spec §2; `rg` proofs in the commit body; the fetch refusals moved to a Rust test |

### Not reproduced
- **CF07** (a sequence home chosen from any read error). `redact` reads through `from_utf8_lossy`, so `remote_url` cannot fail on non-UTF-8, and no fixture can inject a read timeout without a new seam. The restructure stayed because RT01 needs it.

### Kept by evidence
- **F-C3, the two `git var` children (D-T2-9).** They let an absent global or system config file that appears later invalidate the floor record and the config cache (`driver.rs`, comment at `:636-639`). The `--show-origin` listing cannot name absent files. A hand derivation would copy git's lookup and the driver's `GIT_*` scrub and lose the fail-closed `git-config-paths-unavailable`. The saving is one or two children once per process.
- **The WAL digest twin (D-T2-10).** The T0 canonical-JSON leaf prints numbers through f64 and sorts keys by UTF-16; the WAL digest keeps integers exact and sorts by bytes. The encoders differ by construction, so no run over today's records could make the switch safe for future ones.
- **Slice B** (compat fields). `CheckoutProof.old_index` is written `null` into every Land record and the struct is `deny_unknown_fields`; the Restore snapshot defaults admit snapshots from before `bcec8ad3b`, and the fields are read.
- **Phase 5C's dropped trims** (each weakens a spec rule): the pin read-back, the two target reads before the CAS, the target read-back after it, compaction's pin-absent read, a release with the delete alone.
- Smaller: `replay_known_id` stays four equality checks; `release(close)` keeps its three incarnation reads; the placement fallback by count stays as a documented degraded mode (doctor row, test and spec say so), so the review's P5 deletion was not made; `provider-account-probe.mjs`'s `herdr-diagnosis.json` read goes to T5 with its public outcome class.

### Dropped or not taken
- **F-C1, compaction of Worktree and Refs chains: left T2** (commits reverted). OPC's second and third rounds found new defects (a compacted Remove replay answered `Ok(())` for a different worktree; starvation moved, not removed; auto-resume never reached `resume_compaction`). Each fix needed a new mechanism, and at steady state it cost about 4 fsyncs (about 47 ms per chain) on every add to save about 0.09 ms per chain. Counsel by `kongming` and OPC agreed. Instead admission reads once. The work is backlog item `p-djrgdijd2c` (off the hot path, through doctor `--fix` or the guarded prune door).
- **F-C2, fewer fsyncs on a worktree add (phase 10):** dropped by the owner (decision 23, withdrawing decision 19).
- **A3, A4, A5** (phases 14 to 16): not taken (decision 21).
- **Slices A and C of phase 8** (six legacy `worktree:{root}` acceptances, the v1 compact-receipt branch): built on `harden/t2-p08-census-slices`, **not merged**. They wait for both machines' census lines to read zero and for no workspace on a release built before `869e789d7`.
- **Slice 12** (delete the Rust `checkpoint_tracked_files`): did not run; WORK's `work/es-cutover` is not on main.

## 5. Doctor table, 10+3 to 6+2

| Before | After | Where the conditions went |
|---|---|---|
| `git-transport-config`, `git-publication-refspecs` | `git-repository-config` | all conditions; the refspec fix stays |
| `git-trust-topology`, `git-durability-capability`, the compatibility rule | `git-component-compatible` | trust and durability become pass text; the duplicate probe check is removed |
| `git-operation-journal`, `git-land-recovery` | `git-operation-journal` | retained Land candidates become a warning; fence, pending and incomplete conditions are kept with their next step; the retention line is new |
| `git-native-locks` | `git-native-locks` | unchanged, now with the runbook pointer |
| `git-worktree-recovery` | `git-worktree-recovery` | reasons printed in the message |
| `git-mutation-one-door` | `git-mutation-one-door` | unchanged (red with CFG's 5 sites) |
| `terminal-control`, `terminal-config` | `terminal-control` | the core names the floor refusal; the two Node rules (grace against the agent ready timeout, the `retainFailedPaneMs` shape) stay in the Node adapter |
| `terminal-allocations` | `terminal-allocations` | observation only; each finding names its pane |

On the second machine after landing, `fgos doctor --json` lists exactly these 6 and 2 rows, 140 rows in all, 10 not passed. The landing report names them.

## 6. Reused doors, deleted paths, hand-offs

**Reused.**
- Process: `spawn_with_fds` and `exit_descriptor` (CF10), `facts::identity_of` (CF03), the ancestry walk (`attach`), a macOS `relation_of`.
- Durable-file: the checkpoint `FileSystem` trait and `sync_directory` for the WAL and the native lock.
- One remote door instead of two ladders (the Remote port's and Publication's).
- Publication's own `RECENT_TERMINAL` stays where it was.

**Not used, though planned:** `wal.compact` for Worktree and Refs (reverted), and `createDoctorRun` (not on main).

**Deleted.** The Node Land retry loop; two remote scheme ladders; six result codes; `pane-owned.sh`; the group hint; the `terminal-dir` fix; `herdr-agent.mjs`; the Node native-lock repair door; the Node arms with no caller; the activity-launch branch; the three dead capabilities; and the Node cases whose behaviour moved down to a named Rust owner.

**Hand-offs ledger** (parent plan, rows H25 to H30, rechecked):

| # | Item | State |
|---|---|---|
| H25 | Worker session-server start | recorded in T4's plan |
| H26 | herdr caller inventory and the rest | recorded in T5's plan. New T5 input: the grace-versus-agent-ready rule stays in the Node adapter (D-T2-7), recorded 04:55 in the parent plan's phase-06 "Received" list. Also for T5: `herdr-round.mjs` and `proof-helpers.mjs` import lines edited in T2. |
| H27 | Config defaults in config files | superseded by owner decisions 26 and 27; CFG owns the versioned-standard migration, told 10-23, to be confirmed by CFG |
| H28 | `checkpoint` and `legacyEvents` deletion | open with WORK; the Rust `checkpoint_tracked_files` stays until `work/es-cutover` lands |
| H29 | Test move-down (53 rows) | recorded by TEST. **TEST's W2 and W3 triggers wait for F-C1, which left T2: TEST must be told**, with the admission figure 32.3 to 15.8 ms and the pointer to `p-djrgdijd2c` |
| H30 | One `inspectGit` per doctor run | open; trigger is WORK's `createDoctorRun` on main |

Also owed or open:
- **R9**, the lock fence's final-probe race (HARDEN, next).
- **CFG:** the five `unresolved-binary` sites.
- **Process-door owner:** the CF10 residual (a parent-side snapshot, not at fork).
- **IDENT:** acknowledged (board 08:50).
- **DOC:** the file list of phase 9 (`docs/platform/git/spec.md`, `docs/platform/terminal-control/spec.md`, `docs/specs/distribution.md`, `docs/specs/runner.md`, `docs/specs/reading-map.md`, `docs/platform/component-boundary.md`, `docs/platform/event-store/spec.md`, the setup-doctor registry contract, the how-to, `CHANGELOG.md`).
- **Backlog:** `p-djrgdijd2c` open; `p-txiatvrts4` implemented in this landing, row still reads `proposed`.

## 7. What the big lead got wrong

- **Landed before checking the Δ table.** Phase 17 says a missed ceiling blocks the close; the ceilings were missed, and the merge went first. The owner is asked Q8 afterwards, which is the wrong order.
- **Reused a Cargo target across two checkouts once.** Stale artifacts followed. T1 recorded the same slip and memory already says not to do it; the habit did not hold under time pressure.
- **Misread the owner's macOS sentence.** I reverted macOS work, then restored it when the owner confirmed macOS is supported (decision 23 lineage). Both commits are on the track.

The independent verifies caught what the leads' own runs had missed: for example, phase 5A's first `resolve_head` read HEAD several times in one child and could pair one branch's commit with another's name (OPC reproduced it; fixed with a bracketed two-step read and `tests/head_switch.rs`), and phase 5B's shared native-state list would have blocked a restore during a bisect (fixed in `dc756d2af`).

## Unresolved questions

1. **Q8:** accept the missed size ceilings, fold a slice, or fold the tests through TEST's move-down? (Section 3.)
2. **Censuses.** Do `fg-server` and `design-lap` both read zero, with no workspace on a release built before `869e789d7`? Until then slices A and C of phase 8 stay unmerged.
3. **R9** lands next, as HARDEN's first item after this close.
