# Phase lead report: test governance phase 2, first batch (ported areas)

Date: 2026-10-21 (Asia/Saigon). Worktree `.claude/worktrees/test-p2`, branch `chore/test-governance-p2-p3`, base `61883b444`. Plan: [plan.md](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md). Owner rule (2026-10-20): the suite does not get weaker; a test goes only when another named test owns its behaviour or the behaviour is gone.

## 1. Where this batch stands (done / half-done / next)

| Area | Node tests | State | Retired | Next step |
|---|---:|---|---:|---|
| terminal-control | 19 | **done, committed**, gates green | 3 | none; re-check only if the crate changes |
| event-store | 75 | **inventory and mutations done, nothing to retire** (committed with this report) | 0 | none for retirement; optionally add owners for the survivors in section 6 |
| run-supervisor | 143 | **half-done**: all labels and mutations done, 5 retirements decided, **no test file edited** | 0 so far, 5 decided | apply the 5 deletions in section 4, run both gates (about 30 min), commit as its own unit |
| git | 92 | not started | - | list the Rust tests, label, mutate, retire (Git 07 has landed, the plan's hard constraint no longer blocks) |
| holder-lock | 110 | not started | - | same; first read `test/holder-lock` against `packages/holder-lock/rust` and the 4 contract-reading files |

The coordinator stopped the batch after terminal-control; run-supervisor edits and gates were deliberately not run.

Totals now: `test()` calls 8094 -> 8091 (3 retired). `suite:` lines: before `suite: 581 files, 8094 test() calls, 465 s wall (baseline 572 / 8041 / 202 s at f38dfd1d0)`; after `suite: 581 files, 8091 test() calls, 467 s wall (baseline 581 / 8091 / 202 s at 61883b444)`. `test/suite-baseline.json` refreshed in the same commit (sizes and sha only; wall seconds untouched, so 202 s is stale on this loaded host).

## 2. Rules applied (how a label was decided)

- **owns**: Node-only behaviour (facade, controller, use case, script) or the only guard of a thing no other test sees. **route**: the one wiring proof per port. **mirrors-Rust**: a named Rust test asserts the same behaviour and the seeded mutation that breaks it fails that Rust test. **contract-prose**: asserts wording of a contract file.
- A mutation only Node catches makes the Node test owns. A mutation both sides catch makes the Node test a mirror candidate; it is retired only if it adds no wiring the route test lacks (such wiring is folded into the route test first).
- Contract-prose is retired only when every behaviour the prose describes has a named owner, or no behaviour exists. When a described behaviour has no owner (mutation survives everywhere) the prose test stays and the gap is listed (section 6). Pure shape lints that no code reads stay (mutation TC-C1, RS-C3, RS-C4: only Node catches).
- `git log -S` on every retired title: ten titles checked; all born in feature commits except one, `a close is refused while a foreign process holds the foreground...` (`e1d5a4005`, a fix). That commit added no Rust case for it because the Rust test `immediate_close_with_a_foreign_foreground_is_kept_without_a_release_marker` already existed (and it added `immediate_close_without_process_info...` plus the run-supervisor `release_slot_step.rs` cases); mutation TC-R1 fails those Rust tests.
- Mutation harness: scratch driver (not in the repo) applying one exact-string edit, running `cargo test -p <crate>` and the area's Node files through the suite's own argv and env, then restoring the file. Equivalent in spirit to `scripts/test-select-mutate.mjs` but without its ownership manifest, which cannot take ad-hoc mutants. Full results below.

## 3. terminal-control (done)

Node 19 tests: 1 route, 15 owns, 3 retired. Rust: 87 tests (`cargo test -p fgos-terminal-control -- --list`).

Change: `test/terminal-control/client-route.test.mjs` loses three tests and the route test `every operation of the port answers through the route` now also calls `capabilities` (with the incarnation endpoint and pid) and `launch` (answers `not-started`, one `pane run` reached herdr). Mutations TC-R4 and TC-R5 still fail Node after the fold.

Retired (each with its owner):

| Retired test | Owner now |
|---|---|
| client-route:41 capabilities reports the driver and the live server incarnation | `tests/herdr_driver_fake.rs: declares_what_herdr_can_do_after_one_probe`, `incarnation_is_the_socket_owner_identified_by_the_os`; Node wiring in client-route:55 |
| client-route:87 a close is refused while a foreign process holds the foreground... | `tests/core_failures.rs: immediate_close_with_a_foreign_foreground_is_kept_without_a_release_marker` (+ `immediate_close_without_process_info_is_kept_without_a_release_marker`) |
| client-route:100 launch keeps the slot after a request and never launches into it twice | `tests/core_failures.rs: launch_requested_without_launched_is_kept_and_never_launched_into_again`, `the_core_never_launches_into_an_attached_or_released_slot`; Node wiring in client-route:55 |

Mutation evidence (rows TC-R4/TC-R5 appear twice: before and after the fold):

| id | seeded mutation | Rust tests that fail | Node tests that fail |
|---|---|---|---|
| TC-C1 | port contract loses an operation (contract file) | **none** | `terminal-control/contracts.test.mjs: every port operation has a route op and only names results the port defines` |
| TC-N1 | client reports a route usage error under another code (Node client) | n/a (Node-only edit) | `terminal-control/client-route.test.mjs: a bad request or a wrong protocol throws a named error` |
| TC-R1 | close goes ahead with a foreign foreground (Rust core) | `immediate_close_with_a_foreign_foreground_is_kept_without_a_release_marker`; `immediate_close_without_process_info_is_kept_without_a_release_marker` | `terminal-control/client-route.test.mjs: a close is refused while a foreign process holds the foreground, and goes throug...` |
| TC-R2 | a second launch into one slot is not refused (Rust core) | `launch_requested_without_launched_is_kept_and_never_launched_into_again` | `terminal-control/client-route.test.mjs: launch keeps the slot after a request and never launches into it twice` |
| TC-R3 | version mismatch exits with another code (Rust route) | `route::tests::a_protocol_other_than_one_is_a_version_mismatch` | `terminal-control/client-route.test.mjs: a bad request or a wrong protocol throws a named error` |
| TC-R4 | server incarnation reports pid 1 instead of the socket owner (Rust herdr driver) | `incarnation::incarnation_is_the_socket_owner_identified_by_the_os`; `incarnation::endpoint_falls_back_to_status_server_when_none_is_given`; `incarnation::a_server_swapped_while_closing_is_unknown` | `terminal-control/client-route.test.mjs: capabilities reports the driver and the live server incarnation` |
| TC-R4 | server incarnation reports pid 1 instead of the socket owner (Rust herdr driver) [rerun after the route test was extended] | `incarnation::endpoint_falls_back_to_status_server_when_none_is_given`; `incarnation::incarnation_is_the_socket_owner_identified_by_the_os`; `incarnation::a_server_swapped_while_closing_is_unknown` | `terminal-control/client-route.test.mjs: every operation of the port answers through the route` |
| TC-R5 | herdr never declares layout.geometry (Rust herdr driver) | `declares_what_herdr_can_do_after_one_probe`; `an_unreadable_answer_is_unknown`; `each_capability_runs_the_expected_command` | `terminal-control/client-route.test.mjs: capabilities reports the driver and the live server incarnation`; `terminal-control/client-route.test.mjs: every operation of the port answers through the route` |
| TC-R5 | herdr never declares layout.geometry (Rust herdr driver) [rerun after the route test was extended] | `declares_what_herdr_can_do_after_one_probe`; `an_unreadable_answer_is_unknown`; `each_capability_runs_the_expected_command` | `terminal-control/client-route.test.mjs: every operation of the port answers through the route` |

Gates: `cargo test --workspace` 1214 passed, 0 failed before and after (the after log has one result line merged with a test name by interleaved output; the line says 1 passed). `npm test`: before 8781 tests, 0 fail; after 8778 tests, 0 fail, 32 skipped (same skips). Coverage map: `node scripts/test-select-coverage-map.mjs` before and after: 331 sources, **0 sources lost their last covering test** (7 files timed out before, 6 after: the same run-supervisor and runner e2e files, so those rows are partial in both maps; the static import graph covers them).

Environment notes for the next agent:
- The first `npm test` of this worktree had 78 failures: the worktree's `.fgos/config.json` was marked skip-worktree and replaced by a 1273-byte stub during the run, so every test reading the committed config failed. Fixed by `git update-index --no-skip-worktree .fgos/config.json && git checkout -- .fgos/config.json`; the rerun was green. Check this first in any fresh worktree.
- The first `npm test` after the change failed only on `run-tests: ERROR: test suite left temporary directories behind (fgos-direct-repo-*: 1)` (a run-supervisor direct-harness fixture, a file this change did not touch; 0 test failures); the solo rerun was green. Treat as the known load flake.
- `npm test` rewrites `packages/git/contracts/mutation-census.v1.json`; it was restored, not committed. The coverage script writes `plans/260922-test-suite-optimization/`; it was copied aside and deleted.

## 4. run-supervisor (half-done: decided, not applied)

Node 143 tests: 1 route (`direct-crash-matrix.test.mjs:45`), 137 owns, **5 to retire**. Rust: 133 tests. Nothing was edited.

Apply these five deletions (line numbers at base `61883b444`), then also delete the now-unused import of `DEFAULT_GATE_KILL_GRACE_MS` in contracts-unit-state if nothing else uses it:

| Test to retire | Why / owner |
|---|---|
| contracts-unit-state:48 the cancel wait key is documented with its default and floor | owner `cancel-registry.test.mjs:45`; mutation RS-N2 fails the owner and not this test |
| contracts-unit-state:55 resume rules cover every attempt state a resume can meet | prose; owners `resume-adopts.test.mjs:77` (RS-N7 fails it), :149, :166 |
| contracts-unit-state:65 automatic resume stays deferred with its seam named | wording of a feature that does not exist; no behaviour |
| contracts-terminal:75 attempt writer id vectors reproduce through the reference mint | mirrors `packages/session-identity/rust/tests/attempt_writer_id.rs: every_vector_case_reproduces_and_valid_ids_resolve_as_env_ids` and `test/session-identity/attempt-writer-id.test.mjs:24` (RS-C1 fails all three); contract drift still caught by contracts-terminal:67, :88 (RS-C4) |
| adopt-client:64 adoptRun with probeOnly changes nothing and a foreign run dir is legacy-run | mirrors `adopt_matrix.rs: adopt_probe_only_reports_without_writing_or_running_anything`, `adopt_a_run_dir_without_the_v3_layout_is_legacy_and_nothing_changes` (RS-R6, RS-R7); Node flag marshalling owned by inspect-recover-adopt:63,95,122 (RS-N5), legacy reading by :144 |

Kept on purpose: contracts-unit-state:27 (live-controller condition has no behaviour owner, RS-N6 survives), :70, all of contracts.test and contracts-terminal except :75 (Rust never reads those files; RS-C3, RS-C4), the crash-matrix e2e rows (Node controller over the real supervisor; RS-R1, RS-R4 are caught by Rust and by those rows).

Mutation evidence:

| id | seeded mutation | Rust tests that fail | Node tests that fail |
|---|---|---|---|
| RS-C1 | vector file expects another writer id for "plain" (contract vectors) | `every_vector_case_reproduces_and_valid_ids_resolve_as_env_ids` | `run-supervisor/contracts-terminal.test.mjs: attempt writer id vectors reproduce through the reference mint`; `session-identity/attempt-writer-id.test.mjs: every shared vector mints to the same writer id through the Rust route` |
| RS-C2 | resolve contract lowers x-maxIdLength (contract file) | `contract_names_the_same_env_order_and_limits` | `run-supervisor/contracts-terminal.test.mjs: a minted writer id always passes the resolve rule and the length bound is ti...` |
| RS-C3 | unit-state contract rewords the awaiting-resume rule (contract file) | n/a (Node-only edit) | `run-supervisor/contracts-unit-state.test.mjs: awaiting-resume needs a closed last attempt, no unit-summary and no live c...` |
| RS-C4 | attempt writer id contract narrows attemptIdPattern (contract file) | **none** | `run-supervisor/contracts-terminal.test.mjs: both envelopes carry identity equal to the minted attempt writer id`; `run-supervisor/contracts-terminal.test.mjs: attempt writer id vectors reproduce through the reference mint`; `run-supervisor/contracts-terminal.test.mjs: a minted writer id always passes the resolve rule and the length bound is ti...` |
| RS-N1 | unit with a running attempt reads awaiting-resume (Node unit-state) | n/a (Node-only edit) | `run-supervisor/inspect-recover-adopt.test.mjs: a unit whose attempt is not closed stays running, and one with a summary ...` |
| RS-N2 | cancel wait slack is 4 s instead of 5 s (Node gate-kill-grace) | n/a (Node-only edit) | `run-supervisor/cancel-registry.test.mjs: the cancel wait defaults to the kill grace plus five seconds and refuses a valu...` |
| RS-N3 | terminal launch no longer dies with its parent (Node bwrap driver) | n/a (Node-only edit) | `run-supervisor/bwrap-driver.test.mjs: a terminal launch dies with its parent and binds the runtime socket directory`; `run-supervisor/terminal-cutover.test.mjs: fgos run with herdr present runs a confined read-only unit in a pane: the gate...` |
| RS-N4 | resume of a running attempt is refused under another code (Node run.mjs) | n/a (Node-only edit) | **none** |
| RS-N4b | resume of a running attempt is refused under code attempt-busy (Node run.mjs) | n/a (Node-only edit) | **none** |
| RS-N5 | adoptRun drops the probe-only flag (Node client) | n/a (Node-only edit) | `run-supervisor/adopt-client.test.mjs: adoptRun with probeOnly changes nothing and a foreign run dir is legacy-run`; `run-supervisor/inspect-recover-adopt.test.mjs: an orphaned attempt with an outbox result recovers as adopt, and applying...`; `run-supervisor/inspect-recover-adopt.test.mjs: a recommendation goes stale when the run changes between observe and appl...`; `run-supervisor/inspect-recover-adopt.test.mjs: a unit whose attempt is not closed stays running, and one with a summary ...` |
| RS-N6 | a held unit controller no longer keeps the unit running (Node unit-state) | n/a (Node-only edit) | **none** |
| RS-N7 | resume of a still running attempt goes ahead (Node run.mjs) | n/a (Node-only edit) | `run-supervisor/resume-adopts.test.mjs: 2. --resume while the attempt still runs is refused by name and changes nothing` |
| RS-R1 | hard-ceiling stop no longer maps to a timeout receipt (Rust supervise) | `supervise::tests::outcome_follows_the_receipt_contract`; `adopt_a_gate_exit_without_receipt_becomes_the_receipt`; `a_gate_that_never_starts_the_agent_still_ends_in_a_named_receipt` | `run-supervisor/direct-crash-matrix.test.mjs: 5. controller and supervisor both dead: the gate enforces the hard ceiling ...` |
| RS-R2 | steps with a receipt run again (Rust steps) | `adopt_a_receipt_that_exists_stands_and_only_the_missing_steps_run`; `a_step_with_a_receipt_is_not_run_again`; `steps_run_in_order_and_a_step_with_a_receipt_is_skipped` | **none** |
| RS-R3 | gate accepts a tampered envelope digest (Rust gate) | `a_tampered_envelope_is_refused_before_hello` | **none** |
| RS-R4 | failed terminal attempt closes its pane (Rust terminal_slot) | `terminal_slot::tests::missing_receipt_or_missing_facts_retain`; `missing_capture_or_gate_exit_or_inconsistent_outcome_retains`; `a_failed_attempt_keeps_the_pane`; `a_cancellation_not_stopped_by_cancel_retains`; `a_launch_that_proves_nothing_sends_no_go_and_the_gate_finds_the_socket_closed`; `a_pane_that_disappears_is_a_lost_carrier_and_nothing_is_closed` | `run-supervisor/crash-matrix-adopt-resume.test.mjs: terminal: no-binding: --resume takes the attempt through adopt to the...`; `run-supervisor/terminal-cutover.test.mjs: an agent that never started settles as a failed attempt with a named reason an...` |
| RS-R6 | probe-only no longer stops before adopting (Rust adopt) | `adopt_names_why_a_supervisor_never_bound`; `adopt_a_declared_domain_without_a_binding_is_not_called_empty`; `adopt_probe_only_reports_without_writing_or_running_anything`; `adopt_scan_leaves_a_running_attempt_and_a_foreign_run_alone`; `a_supervisor_killed_midway_leaves_the_agent_running_and_adopt_settles_from_gate_exit` | `run-supervisor/adopt-client.test.mjs: adoptRun with probeOnly changes nothing and a foreign run dir is legacy-run`; `run-supervisor/adopt-client.test.mjs: adoptScan lists open attempts under runs/, skips closed ones and answers in listin...`; `run-supervisor/inspect-recover-adopt.test.mjs: an orphaned attempt with an outbox result recovers as adopt, and applying...`; `run-supervisor/inspect-recover-adopt.test.mjs: a recommendation goes stale when the run changes between observe and appl...`; `run-supervisor/inspect-recover-adopt.test.mjs: a unit whose attempt is not closed stays running, and one with a summary ...` |
| RS-R7 | a run dir without the v3 layout is no longer called legacy-run (Rust adopt) | `adopt_a_run_dir_without_the_v3_layout_is_legacy_and_nothing_changes`; `adopt_scan_leaves_a_running_attempt_and_a_foreign_run_alone` | `run-supervisor/adopt-client.test.mjs: adoptRun with probeOnly changes nothing and a foreign run dir is legacy-run`; `run-supervisor/direct-crash-matrix.test.mjs: 7a. a controller that dies before it took the lock leaves nothing to adopt`; `run-supervisor/direct-crash-matrix.test.mjs: 7b. a controller that dies after the lock and before the prepare leaves no ...`; `run-supervisor/inspect-recover-adopt.test.mjs: a run from before the supervisor reads legacy-run and recovers as it alwa...`; `run-supervisor/inspect-recover-adopt.test.mjs: abandon-legacy settles a legacy run only on proof that every recorded pro...`; `run-supervisor/inspect-recover-adopt.test.mjs: abandon-legacy settles a legacy run whose worker result nobody read, and ...`; `run-supervisor/legacy-sweep.test.mjs: every recorded process dead settles abandoned-legacy, and a second sweep changes n...`; `run-supervisor/legacy-sweep.test.mjs: a recorded process that is alive keeps the run with pid-alive`; `run-supervisor/legacy-sweep.test.mjs: a version-1 home still present keeps the run even when every process is dead` |

## 5. event-store (inventory done, nothing to retire)

Node 75 tests (16 files): 1 route (`facade.test.mjs:37`), 74 owns, 0 retired. Rust: 150 tests. Mutations ES-R1, R2, R3, R7, R8 are not caught by any Rust test (the crate has no ahead/behind, delta-export, segment-count, maintenance-receipt or age assertion), so the Node tests that catch them are the only proof. ES-R6 (Git env scrubbing) fails both layers, but `facade.test.mjs:97` also owns the composition git config -> state-root machine-id file, which no Rust test composes.

| id | seeded mutation | Rust tests that fail | Node tests that fail |
|---|---|---|---|
| ES-N1 | facade lets rank 58 through the outside-gate check (Node native.mjs) | n/a (Node-only edit) | **none** |
| ES-N2 | facade never reuses a prepared store (Node native.mjs) | n/a (Node-only edit) | `event-store/facade.test.mjs: preparation caches resolution, honors Git machine config, and rejects non-repositories` |
| ES-N3 | config accepts a zero seal interval (Node config.mjs) | n/a (Node-only edit) | `event-store/verbs.test.mjs: config merges project over global and validates integer boundaries; dormant rebuild has no c...` |
| ES-N4 | facade hands native the unparsed historical event (Node native.mjs) | n/a (Node-only edit) | `event-store/migrate.test.mjs: real import is deterministic, preserves nested bytes, replaces unfenced stale legacy ref a...` |
| ES-N5 | facade drops the retained native view (Node native.mjs) | n/a (Node-only edit) | **none** |
| ES-N6 | facade drops the retained sequence prefix (Node native.mjs) | n/a (Node-only edit) | `event-store/store-hardening.test.mjs: store-only worker measures append and cache without a Work consumer`; `event-store/store-hardening.test.mjs: retained native view rejects edited envelopes and an ordinary copied view still ve...`; `event-store/store-hardening.test.mjs: concurrent benchmark sessions advance the own cursor with the in-gate tail` |
| ES-R1 | status ahead/behind swapped (Rust diagnostics) | **none** | `event-store/verbs.test.mjs: ahead and behind count only commits outside the opposite tip ancestry` |
| ES-R2 | delta export re-emits already exported events (Rust export) | **none** | `event-store/verbs.test.mjs: JSONL export writes canonical reader order, cursors and refuses existing output` |
| ES-R3 | seal reports two segments per segment (Rust seal) | **none** | `event-store/facade.test.mjs: real facade append, full read, seal, and published read retain the same envelope`; `event-store/topologies.test.mjs: plain repository: one open root in the common directory and a full round trip`; `event-store/topologies.test.mjs: linked worktree on another filesystem shares the main clone store and origin`; `event-store/topologies.test.mjs: bare repository with a worktree resolves the bare common directory when the bare is tru...`; `event-store/topologies.test.mjs: submodule with its own git directory has its own store, separate from the superproject` |
| ES-R4 | sync --no-push still pushes (Rust sync) | **none** | **none** |
| ES-R5 | legacy import ignores the porting/ root (Rust legacy_import) | **none** | **none** |
| ES-R6 | Git env scrubbing keeps GIT_* variables (Rust git driver) | `driver::tests::scrubbed_environment_cannot_supply_git_authority`; `driver::tests::scrubbed_environment_child` | `event-store/facade.test.mjs: machine fallback and Git environment scrubbing use the real config-read port`; `event-store/migrate-cutover-grant.test.mjs: real Git 05 hook migration and second-run no-op` |
| ES-R7 | maintenance reports no last push (Rust diagnostics) | **none** | `event-store/store-hardening.test.mjs: maintenance returns the actual last push receipt` |
| ES-R8 | maintenance reports age 0 for every stream (Rust diagnostics) | **none** | `event-store/store-hardening.test.mjs: maintenance reads local age and push receipts without ref or legacy verification` |

## 6. Gaps found (survivors; ideas for the owner, nothing was added)

- ES-R4: `sync --no-push` still pushing the event ref passes every test in both layers.
- ES-R5: dropping the `porting/` root from the legacy import inventory passes every test.
- ES-N1: the JS rank check (`>= 58`) is invisible because the native layer refuses the same ranks with the same code.
- ES-N5: dropping the retained native view (`views.set`) passes every test.
- RS-N4/RS-N4b: no test asserts the refusal code `attempt-still-running`.
- RS-N6: a held unit controller no longer keeps the unit `running`; no test notices.
Each is a candidate for a missing owning proof, to be chosen by the owner (RUL104: not added here).

## 7. E6 inventory (every Node test of the three areas; line numbers at base `61883b444`)

Columns: E6 verdict (Kept / Retired), label, owner or evidence. "same as above" repeats the file's first row. Retired rows in run-supervisor are the decided ones in section 4.

### event-store

`test/event-store/canonical-vectors.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 13 | canonical leaf vectors match ECMAScript numbers and UTF-16 key order | Kept | owns | independent ECMAScript/sha256 oracle for the shared vector files; the crate test (vectors.rs) checks the Rust encoder against the same files, so neither side alone proves the vectors |
| 18 | event hash vectors include exactly one newline and exclude h | Kept | owns | same as above |
| 28 | batch and seal records share canonical bytes and digest vectors | Kept | owns | same as above |

`test/event-store/consumers.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 7 | the dormant registry matches the shipped manifest without import-time registration | Kept | owns | Node consumer-registry loader (src/event-store/consumers.mjs); no Rust twin |
| 16 | the manifest is the authority for contracts and lazy rebuilds, and rejects duplicate/unsafe entries | Kept | owns | same as above |

`test/event-store/door-fixtures.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 10 | E3 census creates its own repositories and ignores caller repository paths | Kept | owns | census script fixtures (scripts/); no Rust twin |

`test/event-store/door.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 155 | the reader scan follows a retired event path through a helper to a file read | Kept | owns | source-scan guards over product code and the scan itself; no Rust twin |
| 184 | the shared scan reports event-publication argv behind launchers, computed values and cfg(test) neighbours | Kept | owns | same as above |
| 196 | event-store product code has no Git spawn site and no classified spawn: its Git work goes through the typed ports | Kept | owns | same as above |
| 256 | dormant reader census retains declared sites and rejects additions or stale debt | Kept | owns | same as above |
| 264 | dormant identity ignores unrelated edits but detects a new reader inside a legacy owner | Kept | owns | same as above |

`test/event-store/export-legacy-parity.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 41 | rollback preserves pinned bytes, drops markers and reports causal versus legacy order differences | Kept | owns | Node reducers (Work, porting) against the facade export and rollback; mutation ES-R2: only Node catches export changes |
| 59 | rollback without clock inversion has parity and rejects an output symlink | Kept | owns | same as above |
| 66 | rollback rejects symlink and gitlink tree entries before creating output | Kept | owns | same as above |
| 83 | real legacy subtrees export with exact production Work and porting reader parity | Kept | owns | same as above |
| 107 | legacy export excludes private streams by default and rejects explicit private streams | Kept | owns | same as above |
| 123 | porting legacy import and rollback retain physical log order across clock rollback | Kept | owns | same as above |
| 137 | rollback refuses ambiguous multiple historical porting destinations | Kept | owns | same as above |

`test/event-store/facade.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 37 | real facade append, full read, seal, and published read retain the same envelope | Kept | route | the one wiring proof: Node facade -> combined addon -> Rust store (append, read, seal, published read, status); mutation ES-R3 fails it |
| 54 | seal-like operations require held ranks and reject ranks 58 and 80 before native work | Kept | owns | same as above |
| 64 | prefetched store survives a hot transaction while every Git route refuses by name | Kept | owns | same as above |
| 76 | preparation caches resolution, honors Git machine config, and rejects non-repositories | Kept | owns | same as above |
| 86 | empty stores read before the first append and linked worktrees share the prepared common directory | Kept | owns | same as above |
| 97 | machine fallback and Git environment scrubbing use the real config-read port | Kept | owns | addon composition: git config, then the state-root machine-id file, under a hostile Git environment; the unit pieces are owned by identity.rs tests and git driver::tests (mutation ES-R6 fails both layers), the composition by this test only |
| 115 | sync marshals a real local bare-remote round trip through Publication authority | Kept | owns | same as above |
| 127 | native prepared authority binds append identity and has no raw constructor | Kept | owns | same as above |
| 142 | preparation requires trusted main and validates each loader descriptor before cache reuse | Kept | owns | same as above |
| 154 | hot-section release is one-shot and nested sections preserve the process guard | Kept | owns | same as above |
| 166 | ownOrigin is explicitly absent until the first local append | Kept | owns | same as above |

`test/event-store/legacy-order-parity.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 9 | frozen legacy vectors equal the production Node reader | Kept | owns | the production Node reader against the frozen legacy vectors; the crate reads the same file for its own decoder |

`test/event-store/migrate-cutover-grant.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 39 | migrate --check runs real quiesce/setup/parity without publishing a ref or changing HEAD | Kept | owns | Node migrate cutover, hook, WAL and quiesce orchestration over the real Git ports; no Rust twin for the orchestration |
| 57 | real Git 05 hook migration and second-run no-op | Kept | owns | same as above |
| 79 | real hook rejection restores baseline-only inputs and rerun uses a fresh WAL attempt | Kept | owns | same as above |
| 106 | a process working inside the fixture workspace or one of its linked worktrees blocks migrate before any Git or ref ... | Kept | owns | same as above |
| 131 | pre-commit filesystem failure restores deleted inputs without naming a Git record | Kept | owns | same as above |

`test/event-store/migrate.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 17 | HEAD inventory, check-only parity, anchored cache and explicit baseline use real tracked bytes | Kept | owns | Node migrate use case (inventory, check, import, doctor, restoration); mutations ES-R5 and ES-N4 show Node is the only side that observes the import through the facade |
| 38 | real import is deterministic, preserves nested bytes, replaces unfenced stale legacy ref and does not cut over main | Kept | owns | same as above |
| 61 | baseline-only project, multiple porting refusal, migration write admission and missing pinned ref | Kept | owns | same as above |
| 72 | legacy-layout doctor warns on pre-migration inventory | Kept | owns | same as above |
| 78 | current checkout tracked Work history reproduces its legacy fold in a temporary repository | Kept | owns | same as above |
| 98 | fresh project doctor passes and unfenced reads ignore stale local/mirror imports | Kept | owns | same as above |
| 117 | cutover restoration respects typed recovery and unknown outcomes | Kept | owns | same as above |
| 131 | published stale mirrors refuse before local ref creation or replacement, including check | Kept | owns | same as above |
| 150 | a matching local and mirror import is published even when the computed import matches | Kept | owns | same as above |

`test/event-store/no-spawn-in-gate.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 13 | real append/readInGate run under the hot-lock process guard | Kept | owns | hot-lock process guard and strace of the append/readInGate window (Node + addon wiring) |
| 19 | strace observes zero process creation calls in the append/readInGate window ${mode.join(' ')} | Kept | owns | same as above |

`test/event-store/platform-refusal.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 6 | every native facade entry refuses a non-Linux platform before resolving paths or loading the addon | Kept | owns | JS-side platform guard of every facade export |

`test/event-store/rollback-export.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 13 | real import then fixture fence, v4 append and rollback export preserve Work and nested porting parity | Kept | owns | Node rollback export and porting parity over a real import |

`test/event-store/store-hardening.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 11 | maintenance reads local age and push receipts without ref or legacy verification | Kept | owns | facade glue (maintenance, branch keys, retained view, promote, config stamp) and the benchmark tooling; mutations ES-R7, ES-R8 and ES-N6: only Node catches |
| 27 | maintenance returns the actual last push receipt | Kept | owns | same as above |
| 37 | facade branch keys use the crate normalization and validation | Kept | owns | same as above |
| 42 | read passes retained coverage and history through sealing and new appends | Kept | owns | same as above |
| 58 | store-only benchmark seed retains realistic payloads and explicit history | Kept | owns | same as above |
| 77 | store-only worker measures append and cache without a Work consumer | Kept | owns | same as above |
| 107 | facade promotion publishes registered branch events through the crate | Kept | owns | same as above |
| 118 | Inspect config reuse rejects changed stamps and recovers after repair | Kept | owns | same as above |
| 129 | retained native view rejects edited envelopes and an ordinary copied view still verifies | Kept | owns | same as above |
| 144 | concurrent benchmark sessions advance the own cursor with the in-gate tail | Kept | owns | same as above |

`test/event-store/topologies.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 82 | plain repository: one open root in the common directory and a full round trip | Kept | owns | documented owning proof of the section 8 topologies through the facade; the crate owns the layout grammar only (see the file header) |
| 92 | linked worktree on another filesystem shares the main clone store and origin | Kept | owns | same as above |
| 108 | bare repository with a worktree resolves the bare common directory when the bare is trusted | Kept | owns | same as above |
| 123 | submodule with its own git directory has its own store, separate from the superproject | Kept | owns | same as above |
| 135 | gitfile layouts (--separate-git-dir, absorbed submodule) are refused before any store exists | Kept | owns | same as above |
| 151 | the Git floor is read from Git: the installed git passes, a git below the floor refuses the store | Kept | owns | same as above |

`test/event-store/v-spawn-bench.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 9 | benchmark refuses an existing root without changing its contents | Kept | owns | benchmark script guards; no Rust twin |
| 18 | benchmark refuses tmpfs before creating the fixture | Kept | owns | same as above |
| 25 | benchmark refuses source-tree fixture and result paths before mutation | Kept | owns | same as above |
| 31 | nearest-rank percentile handles unsorted observations and tails | Kept | owns | same as above |

`test/event-store/verbs.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 14 | status exposes real open counts, receipt, refs, deferred fields and linked/subdir discovery | Kept | owns | use cases in src/verbs/events (status, sync, export, config, rebuild); mutations ES-R1, ES-R2 and ES-N3: only Node catches (the crate has no ahead/behind or delta-export test) |
| 29 | sync waits, seals and records actual fetch/push; no-push preserves last push | Kept | owns | same as above |
| 36 | JSONL export writes canonical reader order, cursors and refuses existing output | Kept | owns | same as above |
| 46 | config merges project over global and validates integer boundaries; dormant rebuild has no consumers | Kept | owns | same as above |
| 55 | status identifies deferred predecessors explicitly and exports no deferred event | Kept | owns | same as above |
| 66 | rebuild resolves shipped consumer contracts, removes both caches and refolds from real events | Kept | owns | same as above |
| 91 | ahead and behind count only commits outside the opposite tip ancestry | Kept | owns | same as above |

### terminal-control

`test/terminal-control/client-route.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 41 | capabilities reports the driver and the live server incarnation | Retired | retired | mirrors Rust. Owners: packages/terminal-control/rust/tests/herdr_driver_fake.rs:declares_what_herdr_can_do_after_one_probe and :incarnation_is_the_socket_owner_identified_by_the_os. Its assertions moved into the route test (client-route.test.mjs:55), so the Node wiring of `capabilities` stays proven (mutations TC-R4 and TC-R5 still fail Node) |
| 55 | every operation of the port answers through the route | Kept | route | the one wiring proof of the port: every operation, now including `capabilities` and `launch`, answers through the route |
| 87 | a close is refused while a foreign process holds the foreground, and goes through once only the shell is left | Retired | retired | mirrors Rust. Owner: packages/terminal-control/rust/tests/core_failures.rs:immediate_close_with_a_foreign_foreground_is_kept_without_a_release_marker (same refuse-then-close sequence; mutation TC-R1 fails it). Born in a fix commit (e1d5a4005); the case already lives in that Rust test and in run-supervisor release_slot_step.rs |
| 100 | launch keeps the slot after a request and never launches into it twice | Retired | retired | mirrors Rust. Owner: core_failures.rs:launch_requested_without_launched_is_kept_and_never_launched_into_again (and :the_core_never_launches_into_an_attached_or_released_slot); mutation TC-R2 fails it. The Node `launch` wiring moved into the route test |
| 116 | unknown keys and a missing herdr come back as results, not exceptions | Kept | owns | Node client contract: `unknown` and `unsupported` come back as results, never exceptions |
| 126 | a bad request or a wrong protocol throws a named error | Kept | owns | Node client errors (TerminalControlError codes); mutation TC-N1: only Node catches. The host-binary protocol mismatch half is also owned by route.rs:a_protocol_other_than_one_is_a_version_mismatch (TC-R3 fails both) |
| 136 | read through the route is fast enough to poll (p50/p95 over 200 calls) | Kept | owns | polling budget of the Node client (p95 under 1 s); no Rust twin |

`test/terminal-control/contracts.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 18 | every contract file parses and names itself at version 1 | Kept | owns | contract-file lint; mutation TC-C1: the crate never reads these files, so this test is the only guard of port/route/capability consistency |
| 28 | driver capability names are unique and every herdr capability is declared | Kept | owns | same as above |
| 41 | every port operation has a route op and only names results the port defines | Kept | owns | same as above |
| 51 | operations that touch the terminal can answer unsupported and unknown | Kept | owns | same as above |
| 58 | the route reports a protocol mismatch the same way the other internal routes do | Kept | owns | same as above |
| 65 | the allocation record carries the full server incarnation and both origins | Kept | owns | same as above |
| 72 | the placement policy decides split, newTab or unsupported and its default is registered | Kept | owns | same as above |

`test/terminal-control/group-queue.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 40 | calls of one group never overlap; another group runs alongside | Kept | owns | Node per-group promise queue (src/terminal-control/client.mjs); no Rust twin |
| 72 | a failed call does not stall the calls queued behind it | Kept | owns | same as above |
| 81 | closing a key whose group is unknown is refused, not run outside the queue | Kept | owns | same as above |
| 87 | a route error rejects its own call and the queue moves on | Kept | owns | same as above |
| 95 | 5 allocates and 2 closes of one group reach herdr one at a time | Kept | owns | same as above |

### run-supervisor

`test/run-supervisor/adopt-client.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 48 | adoptRun drives an attempt to closed once and reports closed after that | Kept | owns | Node adopt client (src/run-supervisor/client.mjs): marshalling, listing order, named route errors |
| 64 | adoptRun with probeOnly changes nothing and a foreign run dir is legacy-run | Retired | retired | mirrors Rust. Owners: rust/tests/adopt_matrix.rs:adopt_probe_only_reports_without_writing_or_running_anything and :adopt_a_run_dir_without_the_v3_layout_is_legacy_and_nothing_changes (mutations RS-R6, RS-R7 fail them); the Node probe-only flag marshalling is owned by inspect-recover-adopt.test.mjs:63,95,122 (mutation RS-N5 fails them) and the legacy-run reading by inspect-recover-adopt.test.mjs:144 |
| 78 | adoptScan lists open attempts under runs/, skips closed ones and answers in listing order | Kept | owns | same as above |
| 101 | a route that fails is a named error, not a verdict | Kept | owns | same as above |

`test/run-supervisor/attempt-steps.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 106 | settle-attempt on an exited receipt with an outbox writes result.json; a second run changes nothing | Kept | owns | Node settle-attempt / finalize-home steps (src/run-supervisor/steps); the Rust runner only schedules them |
| 127 | settle-attempt on a gate-lost receipt settles from the outbox; without one the run fails | Kept | owns | same as above |
| 142 | a timeout receipt with an outbox result is still judged from the outbox | Kept | owns | same as above |
| 151 | run control settled but result.json missing: the same token completes the publish with no new epoch | Kept | owns | same as above |
| 165 | side file gone: a live control writer means retry, a dead one lets the step take a new epoch | Kept | owns | same as above |
| 214 | finalize-home after a timeout writes the renewed login back to its account and removes the home | Kept | owns | same as above |
| 230 | finalize-home keeps the home and asks for a retry while the renewed login cannot be staged | Kept | owns | same as above |
| 247 | finalize-home stops retrying after the kept-home budget: a named outcome, the home stays, the count is per home | Kept | owns | same as above |
| 284 | finalize-home refuses a home whose marker is another attempt or version 1, and removes nothing | Kept | owns | same as above |
| 299 | the entry reports a missing step variable and a payload the envelope does not name | Kept | owns | same as above |

`test/run-supervisor/bwrap-driver.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 24 | a direct launch has its own pid namespace as pid 1 and never dies with its parent | Kept | owns | Node bwrap launch-prefix builder; mutation RS-N3: only Node catches |
| 33 | a terminal launch dies with its parent and binds the runtime socket directory | Kept | owns | same as above |
| 47 | a supervised attempt gets a prefix ending in -- and no worker command; the digest covers prefix, gate and agent argv | Kept | owns | same as above |
| 60 | a request without an attempt keeps the worker command in the argv | Kept | owns | same as above |
| 66 | the prefix really puts the command at pid 1 of a fresh namespace | Kept | owns | same as above |
| 76 | a run directory and gate binary under /tmp are readable inside the sandbox, and the bound attempt file stays writable | Kept | owns | same as above |

`test/run-supervisor/cancel-registry.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 37 | registry keeps the delivered runs, once each | Kept | owns | Node controller signal handling, cancel registry and cancel-wait config; mutation RS-N2: only Node catches |
| 45 | the cancel wait defaults to the kill grace plus five seconds and refuses a value below one second | Kept | owns | same as above |
| 58 | a request names who asked and stands once written | Kept | owns | same as above |
| 72 | 1. SIGINT after the binding: cancel request, receipt cancelled, the resume line, exit 130 within the wait | Kept | owns | same as above |
| 86 | 2. a second SIGINT within 100 ms ends the controller at once and the attempt still ends cancelled | Kept | owns | same as above |
| 100 | 3. SIGTERM exits 143 | Kept | owns | same as above |
| 111 | 4. a signal with nothing handed over writes no cancel file and leaves at once | Kept | owns | same as above |
| 148 | 5. a signal while an attempt is handed over waits for its binding, then cancels it and names the unit | Kept | owns | same as above |
| 167 | 6. a launch that fails before any binding ends the wait and still prints the resume line | Kept | owns | same as above |
| 181 | 7. after a signal no launch and no step starts | Kept | owns | same as above |

`test/run-supervisor/contracts-terminal.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 37 | terminal envelope vector carries every terminal field and the digest reproduces | Kept | owns | contract/vector lint across the run-supervisor, session-identity and agent-protocol contracts; mutation RS-C4: Rust does not catch a narrowed attemptIdPattern |
| 53 | direct and terminal envelopes follow the mode rules | Kept | owns | same as above |
| 67 | both envelopes carry identity equal to the minted attempt writer id | Kept | owns | same as above |
| 75 | attempt writer id vectors reproduce through the reference mint | Retired | retired | mirrors Rust. Owners: packages/session-identity/rust/tests/attempt_writer_id.rs:every_vector_case_reproduces_and_valid_ids_resolve_as_env_ids and test/session-identity/attempt-writer-id.test.mjs:24 (mutation RS-C1 fails both); a contract/vector drift of the pattern is still caught by contracts-terminal.test.mjs:67 and :88 (mutation RS-C4) |
| 88 | a minted writer id always passes the resolve rule and the length bound is tight | Kept | owns | same as above |
| 103 | gate-go terminal section defines the socket, peer check, fd order and orphan reasons | Kept | owns | same as above |
| 114 | orphan reasons agree between gate-go, gate-exit and the receipt | Kept | owns | same as above |
| 123 | terminal outcomes are the interactive subset of the agent protocol results | Kept | owns | same as above |

`test/run-supervisor/contracts-unit-state.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 19 | unit and attempt states are the named sets with a rule each | Kept | owns | contract lint; the described behaviours are owned by inspect-recover-adopt, cancel-registry and resume-adopts except where a row says otherwise |
| 27 | awaiting-resume needs a closed last attempt, no unit-summary and no live controller | Kept | owns | kept: the live-controller condition of awaiting-resume has no behaviour owner (mutation RS-N6 survives everywhere), so this prose is its only record |
| 35 | abandoned-not-started agrees with the receipt outcome set | Kept | owns | same as above |
| 40 | cancel-requested names who asked and keeps the fields the supervisor reads | Kept | owns | same as above |
| 48 | the cancel wait key is documented with its default and floor | Retired | retired | contract-prose. Owner: cancel-registry.test.mjs:45 (default grace + 5 s, floor 1 s; mutation RS-N2 fails it and not this test) |
| 55 | resume rules cover every attempt state a resume can meet | Retired | retired | contract-prose (regex on rule text). Owners: resume-adopts.test.mjs:77 (running attempt refused; mutation RS-N7 fails it), :149 (resume-in-progress), :166 (no second supervisor); resume paths 1,3,4,7,8,9 cover the other attempt states. Gap noted: no test asserts the refusal code name (RS-N4 survives) |
| 65 | automatic resume stays deferred with its seam named | Retired | retired | contract-prose, no behaviour: asserts only that the contract names the deferral of automatic resume |
| 70 | recover offers adopt beside the existing actions | Kept | owns | kept: the action key list is a contract lint with no behaviour twin |

`test/run-supervisor/contracts.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 23 | every run-supervisor contract parses and names its id and version | Kept | owns | contract lint; the crate reads only the vectors, never these files (contract edits such as RS-C3 are caught by Node alone) |
| 33 | envelope digest vectors reproduce through the Node canonical JSON | Kept | owns | production Node canonicalJson/digest against the shared envelope vectors (the crate side is envelope_digest_vectors.rs) |
| 43 | the envelope vector is a complete v3 direct envelope | Kept | owns | same as above |
| 55 | containment kinds agree across the port, the binding and the predecessor record | Kept | owns | same as above |
| 71 | the attempt lock path follows the lock registry row | Kept | owns | same as above |
| 82 | receipt outcomes and step ids are shared by every contract that names them | Kept | owns | same as above |

`test/run-supervisor/crash-matrix-adopt-resume.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 377 | ${modeName}: ${row}: --resume takes the attempt through adopt to the unit summary, the agent runs once | Kept | owns | controller-level crash rows of --resume through adopt in both modes (Node controller, steps and commit over the real supervisor) |
| 398 | ${modeName}: ${row}: two adopters at once, one adopts and the side effects happen once | Kept | owns | same as above |
| 413 | ${modeName}: a resume after adopt already closed the attempt uses its result and adopts nothing again | Kept | owns | same as above |

`test/run-supervisor/direct-crash-matrix.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 45 | 1. a controller killed with SIGKILL after the binding leaves an agent that finishes and an attempt that settles by ... | Kept | route | the one wiring proof of the port: real `fgos run` -> Node controller -> Rust supervisor, gate and steps -> settled attempt |
| 60 | 2. a controller that gets SIGINT asks the supervisor to cancel, waits for the receipt, prints the resume line and e... | Kept | owns | same as above |
| 77 | 2b. SIGTERM does the same and exits 143 | Kept | owns | same as above |
| 111 | 3. a supervisor killed midway: the agent runs to its end and the next fgos run settles it from gate-exit and the ou... | Kept | owns | same as above |
| 126 | 4. the soft deadline passes after the controller died: the supervisor stops the agent, the receipt says timeout and... | Kept | owns | same as above |
| 140 | 5. controller and supervisor both dead: the gate enforces the hard ceiling and the next run settles a timeout | Kept | owns | same as above |
| 153 | 6. two fgos run starting together over one attempt that needs adopting: it is adopted once | Kept | owns | same as above |
| 191 | 7a. a controller that dies before it took the lock leaves nothing to adopt | Kept | owns | same as above |
| 201 | 7b. a controller that dies after the lock and before the prepare leaves no home and no envelope | Kept | owns | same as above |
| 209 | 7c. a controller that dies after the prepare and before the spawn: adopt closes it abandoned-not-started and remove... | Kept | owns | same as above |
| 218 | 7d. a controller that dies right after the spawn: the attempt is settled once, whichever side of the binding the ki... | Kept | owns | same as above |
| 260 | 8. no descriptor of the attempt or cwd lock reaches the agent or its grandchild | Kept | owns | same as above |
| 275 | 9. read-only attempts on one cwd share it without a lease; a writing attempt holds the lease until the run exits | Kept | owns | same as above |

`test/run-supervisor/direct-cutover.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 31 | the Node supervisor, its IPC channel and the writers of the old bindings are gone from src | Kept | owns | Node direct-launch module (spawnWithLocks, envelope, side file, binding wait, tail capture) and the guard that the old Node supervisor is gone |
| 43 | spawnWithLocks gives the child the lock descriptions at 3 and 4 and nothing else of this process | Kept | owns | same as above |
| 76 | waitForBinding names a supervisor that ended without binding and one that is still silent | Kept | owns | same as above |
| 85 | the step environment carries the state root and PATH and never a lock description | Kept | owns | same as above |
| 96 | the envelope is immutable, digest-checked and secret-free; the side file is 0600 and holds the secrets and the cont... | Kept | owns | same as above |
| 130 | awaitSettledResult returns null for a supervisor that is gone and an attempt the adopt door cannot finish | Kept | owns | same as above |
| 139 | a real run carries the configured kill grace and kill wait in its envelope and keeps the secrets in the side file only | Kept | owns | same as above |
| 158 | captureTail reads a capture file in bounded chunks, keeps multibyte text whole and ignores a link | Kept | owns | same as above |
| 177 | a supervisor program that cannot start is reported on the child and by waitForBinding, not as an uncaught error | Kept | owns | same as above |

`test/run-supervisor/inspect-recover-adopt.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 63 | an orphaned attempt with an outbox result recovers as adopt, and applying it closes the attempt | Kept | owns | Node inspect/recover/show-run use cases over adopt verdicts; mutations RS-N1 and RS-N5 fail them |
| 83 | an attempt whose lock is held offers no action and reads running | Kept | owns | same as above |
| 95 | a recommendation goes stale when the run changes between observe and apply | Kept | owns | same as above |
| 107 | inspect and show-run: a unit with a closed attempt, no summary and no controller awaits resume and names the command | Kept | owns | same as above |
| 122 | a unit whose attempt is not closed stays running, and one with a summary reads its verdict | Kept | owns | same as above |
| 132 | a closed attempt a later resume replaced reads superseded | Kept | owns | same as above |
| 144 | a run from before the supervisor reads legacy-run and recovers as it always did | Kept | owns | same as above |
| 152 | abandon-legacy settles a legacy run only on proof that every recorded process is dead | Kept | owns | same as above |
| 174 | abandon-legacy settles a legacy run whose worker result nobody read, and the other intents still treat it as settled | Kept | owns | same as above |
| 194 | a unit whose only attempt the legacy sweep settled is terminal for the unit and awaits resume | Kept | owns | same as above |

`test/run-supervisor/legacy-sweep.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 45 | finds the runs left running without an attempt lock or a v3 envelope, and only those | Kept | owns | Node legacy sweep (src/run-supervisor/legacy-sweep.mjs); no Rust twin |
| 69 | every recorded process dead settles abandoned-legacy, and a second sweep changes nothing | Kept | owns | same as above |
| 86 | a recorded process that is alive keeps the run with pid-alive | Kept | owns | same as above |
| 101 | a live pid recorded without a start time is unknown and keeps the run | Kept | owns | same as above |
| 111 | a version-1 home still present keeps the run even when every process is dead | Kept | owns | same as above |
| 127 | a run that recorded no process at all is kept, not guessed dead | Kept | owns | same as above |

`test/run-supervisor/resume-adopts.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 60 | 1. controller killed after the binding: --resume takes the settled result, runs the agent once and commits the writes | Kept | owns | Node --resume driving through adopt; mutation RS-N7 fails #2 |
| 77 | 2. --resume while the attempt still runs is refused by name and changes nothing | Kept | owns | same as above |
| 93 | 3. controller dead before the supervisor started: --resume launches a new attempt that supersedes the abandoned one | Kept | owns | same as above |
| 124 | 4. the runner commit failed after the settle: --resume commits again and never spawns the agent | Kept | owns | same as above |
| 149 | 5. two --resume at once: one runs, the other is refused as resume-in-progress | Kept | owns | same as above |
| 166 | 6. a resume of a bound attempt goes through adopt: no second supervisor is started for it | Kept | owns | same as above |
| 183 | 7. after Ctrl-C the resume runs the unit again in a new attempt that supersedes the cancelled one | Kept | owns | same as above |
| 199 | 8. controller, supervisor and gate all dead with the lock free: --resume adopts the attempt itself instead of refus... | Kept | owns | same as above |
| 215 | 9. an attempt the legacy sweep settled is not carried on from: --resume launches a new attempt that supersedes it | Kept | owns | same as above |

`test/run-supervisor/runtime-dir.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 20 | the directory is under XDG_RUNTIME_DIR when set, else /tmp/fgos-<uid> | Kept | owns | Node runtime socket directory helper (a separate implementation from the Rust one in supervise/terminal.rs) |
| 26 | ensure creates the directory 0700 owned by the user, and a socket path fits sun_path | Kept | owns | same as above |
| 36 | ensure refuses a directory open to group or other | Kept | owns | same as above |
| 44 | ensure refuses a path that leaves no room for a socket name | Kept | owns | same as above |

`test/run-supervisor/sweep.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 64 | lock free, domain empty, receipt present: adopt finalizes the home and nothing else touches it | Kept | owns | Node sweepAttempts over the adopt door and the source guard that homes are reached only through adopt |
| 78 | a home with no attempt directory to adopt is never removed, whatever its age | Kept | owns | same as above |
| 88 | the attempt lock is held: adopt does not finalize, and the home stays until the holder lets go | Kept | owns | same as above |
| 113 | two adopters over one dead attempt remove its home once | Kept | owns | same as above |
| 131 | sweepAttempts without a usable host binary says why adopt did not run, and removes nothing | Kept | owns | same as above |
| 144 | no production code reaches a home by any rule but adopt | Kept | owns | same as above |

`test/run-supervisor/terminal-crash-matrix.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 35 | 1. a controller killed with SIGKILL after the binding: the supervisor briefs the agent, the result settles, the pan... | Kept | owns | controller-level crash rows of the terminal launch over the real supervisor and herdr fake |
| 57 | 2. the soft deadline passes after the controller died: the agent is stopped, the receipt says timeout and the captu... | Kept | owns | same as above |
| 78 | 3. a supervisor killed after the brief: the agent runs on, the gate ends the domain when the result shows, adopt se... | Kept | owns | same as above |

`test/run-supervisor/terminal-cutover.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 26 | a herdr-spawn seat runs as a terminal attempt: brief typed by the supervisor, pane closed once, settled by the step | Kept | owns | Node terminal launch wiring (brief, seat, writer id, limit and trust screens); mutations RS-N3 (line 162) and RS-R4 (line 96) fail it |
| 59 | the agent runs as the attempt: its writer id is minted from the attempt, the controller's session ids and pane vari... | Kept | owns | same as above |
| 80 | codex gets the attempt writer id as an explicit setting of its argv, the other CLIs inherit the environment | Kept | owns | same as above |
| 96 | an agent that never started settles as a failed attempt with a named reason and keeps its pane | Kept | owns | same as above |
| 112 | a pane stopped on the provider's own limit screen settles as a provider limit, not as a person to wait for | Kept | owns | same as above |
| 125 | an agent stopped on a trust prompt ends as blocked, not as a timeout, and the failure names the screen and the repair | Kept | owns | same as above |
| 140 | an executor declared by invocations[] runs the same way as one declared flat | Kept | owns | same as above |
| 150 | the brief the pane agent reads names the one result path, the outbox claim | Kept | owns | same as above |
| 162 | fgos run with herdr present runs a confined read-only unit in a pane: the gate is inside the sandbox, the socket is... | Kept | owns | same as above |

`test/run-supervisor/terminal-fallback.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 63 | a limit screen moves the role to the next candidate in a new pane and closes the captured stopped pane | Kept | owns | Node fallback chain over terminal seats |
| 85 | a fallback runs along a chain of three candidates, one pane each | Kept | owns | same as above |
| 99 | with no candidate left a limit stays a structured provider-limit outcome and opens no second pane | Kept | owns | same as above |
| 115 | a writing unit whose first candidate hits a limit is committed through the mutating gate from the fallback | Kept | owns | same as above |

`test/run-supervisor/terminal-groups.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 62 | the seats of one batch share a tab and each gets the key of its attempt | Kept | owns | Node seat groups, trust entries and brief delivery over the terminal-control client |
| 77 | a batch whose first pane is already closed continues in a new tab with the same label | Kept | owns | same as above |
| 88 | a caller anchor pane joins the group, so the batch opens beside it and never closes it | Kept | owns | same as above |
| 102 | a seat released while the fourth of its group is allocated: no error surfaces and no split starts from a closed pane | Kept | owns | same as above |
| 135 | the folder-trust entry a seat wrote is taken back by the cleanup step, from the record the controller left | Kept | owns | same as above |
| 160 | an entry a person vouched for is never named for removal | Kept | owns | same as above |
| 181 | inline delivery types the whole brief and still writes brief-1.md; file-pointer types one line that names it | Kept | owns | same as above |
| 198 | the brief renders the execution contract and one result path, the outbox claim | Kept | owns | same as above |
| 211 | a result already in the run directory refuses the seat before a pane exists: it would settle on somebody else's result | Kept | owns | same as above |
| 222 | a dead anchor pane opens the seat its own tab instead of failing it | Kept | owns | same as above |
| 232 | an agy trust entry a seat wrote is removed by the step; one the person already had stays | Kept | owns | same as above |
| 253 | the brief a reviewer reads says its claim needs assessment.verdict; the producer's does not | Kept | owns | same as above |
| 263 | a controller that died after the allocation leaves the pane alone; the reconcile scan reports it and nobody closes it | Kept | owns | same as above |
| 277 | a controller that fails before the handover gives the pane back and takes the trust entry out again | Kept | owns | same as above |

`test/run-supervisor/windows-custody.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 14 | Windows retains controller custody while its supervisor declares the producer job | Kept | owns | real Windows jobs and LockFileEx (skipped on Linux) |

## 8. Rust tests of the three crates (`cargo test -p <crate> -- --list`)

**fgos-event-store (150):** a_ref_hole_is_not_silently_skipped_and_input_cursor_stays_unchanged, a_verifying_marker_with_internal_sequence_overlap_refuses_instead_of_truncating, abandon_preserves_branch_until_pending_promote_is_sealed, age_rejects_unparseable_first_line_instead_of_reporting_zero, all_seal_boundaries_recover_and_keep_physical_high_separate_from_deferral, altered_published_blob_stops_with_durable_integrity_evidence_and_deletes_nothing, append_ack_hashes_seen_and_cursor_are_verified, append_sweeps_old_and_shared_identity_temps_under_the_lock, authenticated_promote_parent_releases_later_branch_tail_after_certification, batch_marker_is_a_distinct_record, bounded_walk_terminates_and_lost_certificates_only_lengthen_it, branch_and_local_refs_promote_two_parents_and_abandon_exact_old, branch_slug_mapping_is_shared, c4_covered_seal_does_not_prune_unseen_origin_below_merge_and_promote, c5_missing_predecessor_defers_transitively_then_emits_once, c5_ref_deferral_advances_no_coverage_and_certifies_nothing_until_predecessor_arrives, c6_delayed_concurrent_event_requires_suffix_replay_at_zero, c6_new_origin_discovered_on_mirror_replays_from_first_difference, cached_prefix_verifies_growing_tail_and_cross_boundary_sequence, canonical_hash_vectors, certified_commit_cannot_be_reused_under_a_different_machine_ref, changed_legacy_head_forces_rebuild_even_when_v4_order_is_unchanged, complete_damaged_batches_refuse_without_changing_any_bytes, concurrent_initializers_return_one_durable_identity, concurrent_setup_installs_one_complete_machine_id_without_replacing_it, consumer_registration_rules_and_metadata, corrupt_immutable_segments_refuse_and_are_never_truncated, covered_seal_discovers_unknown_origin_with_open_or_rebuilt_receipt_coverage, credentialless_unreachable_http_remote_fails_fast_and_records_the_error, cycles_and_sequence_conflicts_are_named_errors, distribution_move_is_blocked_by_existing_number_and_key_order, durable_history_reconciliation_restores_receipt_and_next_append_uses_next_sequence, eight_real_processes_append_with_one_contiguous_sequence_and_identity, envelope_and_seen_keys_use_the_same_safe_stream_grammar, every_byte_prefix_is_invisible_and_next_append_truncates_it, exact_changeset_bytes_determinism_receipt_deletion_and_private_git_context, export::tests::converted_origins_keep_distinct_legacy_identities, export::tests::export_paths_are_portable_to_windows, failed_reconcile_keeps_the_prior_merge_authenticated, fetch_succeeds_push_rejection_is_recorded_and_next_sync_retries, fetched_event_identity_must_match_seal_header, fetched_tip_machine_scope_and_own_origin_are_checked, files_are_versioned_strict_and_loaded_atomically, frozen_legacy_order_and_provenance, gaps_overlaps_and_unbacked_hints_refuse_without_assigning, garbage_hint_is_rewritten_and_stray_closed_path_is_named, gate_refuses_missing_prefix_and_a_receipted_deleted_tail, git_failure_is_io_and_keeps_cause_instead_of_claiming_gap, guarantee_none_refuses_and_rank_order_is_enforced, head_legacy_ignores_project_files_and_nested_shards, high_water_recovers_receipt_closed_active_and_stale_hint, identical_overlap_recovers_receipt_without_requiring_segment_deletion, identifier_grammars_apply_to_all_records, identity_is_stable_and_copies_moves_and_machine_changes_refuse, ignored_stream_can_advance_after_certification_without_a_false_gap, interrupted_stream_creation_requires_root_barrier_before_ack, interval_trigger_refuses_a_gate_even_before_it_is_due, l5_lost_receipt_and_hint_cannot_restart_published_sequence, layouts_and_linked_worktrees_share_common_root, legacy_hashes_are_verified_without_reencoding, legacy_import::tests::event_attributes_do_not_match_unrelated_union_rules, legacy_import_dirty_multiple_porting_and_moved_head_refuse, legacy_import_real_publication_reuses_exact_commit_and_reads_nested_porting, legacy_import_sealed_tree_refuses_missing_data_and_invalid_events_before_publication, legacy_is_distributed_only_at_the_tracked_fence_pin, legacy_ref_is_authenticated_by_tracked_head_fence_and_seal_digest, linked_worktree_seal_preserves_its_head_index_and_files_even_with_index_lock, local_seal_restart_and_proven_incremental_fold_equal_full_rebuild, locked_recovery_sweeps_only_identity_temps, lost_folded_history_with_coverage_requires_rebuild_from_zero, lost_receipt_and_hint_are_rebuilt_before_next_append, lost_receipt_uses_verified_own_ref_for_own_origin_mirror, machine_identity_precedence_and_validation, machine_setup_and_io_have_distinct_codes, maintenance_reads_only_complete_header_snapshot, maintenance_waits_for_writer_mid_header, malformed_record_headers_are_refused, merged_parent_keeps_its_source_machine_identity_and_is_discovered_below_covered_seal, mirror_rewind_refuses_and_preserves_the_previous_cursor, missing_receipt_with_active_or_closed_tail_recovers, missing_wide_and_symlink_lock_dirs_refuse, offline_errors_are_durable_append_and_read_continue_and_setup_repins_url, one_batch_write_contains_marker_and_a_short_write_never_acknowledges, only_canonical_framed_bytes_are_events, outside_merge_before_first_append_cannot_be_laundered_by_reconciliation, outside_merge_on_own_ref_is_never_authenticated_or_pushed, own_mirror_rewind_still_refuses_publication, pre_epoch_event_seals_with_epoch_date_and_identical_retry, pre_migration_legacy_reads_tracked_head_and_preserves_file_line_provenance, project_consumer_streams_share_one_ref_without_false_move_or_sequence_reuse, promote_is_one_node_with_branch_inputs_and_unpromoted_events_hidden, protocol_counters_cannot_collapse_to_the_same_jcs_number, proven_own_stream_incremental_fold_matches_full_rebuild, read::tests::mirror_namespace_accepts_only_recognized_suffixes, read::tests::mirror_namespace_strips_only_the_remote_segment, read_dedupes_a_rotation_snapshot_and_detects_conflicting_identity, reader_keeps_one_active_descriptor_and_dedupes_rotation_at_each_boundary, reader_uses_inspect_while_publication_lock_is_held, real_guarantee_on_os_temp_and_tmpfs, real_sigkill_after_merge_cas_before_push_authenticates_only_the_recorded_candidate, receipt_alone_prevents_sequence_reuse_after_segment_deletion, receipt_post_rename_error_exposes_effect_and_keeps_segment_until_durable_retry, reconstructed_registry_refuses_historical_scope_change, recovered_integrity_record_is_retired_durably, ref_rewind_or_foreign_move_preserves_segment, repeated_identical_objects_have_the_same_commit_and_explicit_last_event_date, repeated_verified_reads_still_detect_changed_bytes_and_authority, reserved_legacy_mirror_is_not_a_phantom_event_tip, reserved_owners_and_scope_survive_subsequent_registrations, retained_folded_history_with_coverage_keeps_empty_delta_incremental, rewound_mirror_keeps_authenticated_baseline_and_forged_own_origin_is_refused, rotation_has_no_sequence_reset_and_syncs_both_directories, rust_paths_names_and_ranks_match_shared_registry, seal_all_attempts_later_streams_and_aggregates_failures, seal_kinds_roundtrip, seal_refuses_state_high_ranks_and_wrong_store_guard, seeded_interleavings_smoke, shared_machine_diverges_merges_two_parents_and_can_append_after_merge, shared_own_origin_bound_has_one_error_code, shared_record_bytes_and_digests, shared_ref_rewind_to_another_streams_old_receipt_is_refused, shared_ref_sigkill_then_sibling_and_seal_all_recover, sigkill_at_every_append_and_ack_boundary_preserves_acknowledged_prefix, sigkill_at_every_rotation_boundary_never_reuses_sequence, sigkill_at_new_active_file_ack_boundaries_preserves_rotated_and_new_events, sigkill_at_seven_seal_boundaries_recovers_without_loss_or_duplicate, sigkill_during_hint_repair_and_rotation_crash_with_stale_hint, sigkill_during_real_write_never_exposes_a_partial_batch, sigkill_during_truncation_recovery_is_idempotent, spliced_ancestor_machine_and_scope_are_refused, steady_append_performs_three_real_fsyncs_and_no_hint_replacement, steady_sync_prunes_previously_authenticated_event_blobs_and_delta_extends_positions, subtree_listing_does_not_capture_an_oversized_unrelated_project_tree, sync_record_rejects_unknown_fields_and_versions, ten_thousand_seeded_interleavings_and_wal_growth, three_real_clones_join_offline_and_retain_a_departed_machine, timestamps_are_fixed_width_and_calendar_valid, tracked_fence_without_fetched_legacy_is_refspec_missing, two_independent_stores_with_one_machine_ref_have_one_cas_winner, unbacked_hint_refuses_before_truncating_torn_tail, unpromoted_branch_cycles_do_not_enter_project_order, unpublished_summary_rejects_mismatched_layout_before_opening_its_lock, unrelated_stream_and_orphan_branch_do_not_disable_frontier_certification, v_event_mirrors_divergence_receipts_coverage_and_never_force, v_event_real_sigkill_after_seal_cas_then_sync_recovers_receipt_and_publishes, v_seq_01_clock_rollback_equal_times_all_permutations_through_seven, validation_precedes_lock_and_initialization, vanished_already_folded_range_does_not_bounce_the_gate, vanished_closed_segment_is_recorded_and_gate_requires_catch_up, wrong_checksum_marker_and_complete_unmarked_lines_never_fold

**fgos-run-supervisor (133):** a_cancel_request_ends_the_attempt_as_cancelled, a_cancel_request_ends_the_attempt_as_cancelled, a_cancellation_not_stopped_by_cancel_retains, a_ceiling_from_another_boot_means_the_attempt_is_already_over, a_child_in_its_own_session_dies_with_the_gate, a_child_the_agent_leaves_behind_dies_with_the_gate, a_clean_attempt_closes_the_pane_once_and_a_second_pass_does_nothing, a_cooperative_agent_stops_on_the_ceiling_with_sigterm, a_correct_go_runs_the_agent_and_reports_its_tuple, a_dead_worker_with_captured_output_closes_without_an_outbox_result, a_direct_envelope_on_a_socket_channel_is_refused, a_failed_attempt_keeps_the_pane, a_failing_step_stops_the_chain_without_a_receipt, a_full_lifecycle_binds_receipts_runs_the_steps_in_order_and_frees_the_lock, a_full_lifecycle_binds_receipts_runs_the_steps_in_order_and_frees_the_lock, a_full_lifecycle_launches_briefs_waits_for_the_result_and_closes_the_pane_once, a_gate_that_dies_without_gate_exit_gives_a_gate_lost_receipt, a_gate_that_is_not_pid_1_ends_the_orphans_it_adopted, a_gate_that_never_starts_the_agent_still_ends_in_a_named_receipt, a_go_for_another_digest_ends_the_gate_with_65_and_no_agent, a_go_with_the_wrong_number_of_descriptions_is_refused, a_host_bin_that_is_not_the_running_binary_spawns_nothing, a_host_bin_that_is_not_the_running_binary_spawns_nothing, a_launch_that_proves_nothing_sends_no_go_and_the_gate_finds_the_socket_closed, a_long_attempt_with_many_orphans_accumulates_no_zombies, a_mutating_attempt_frees_the_cwd_lease_when_the_gate_is_gone_not_after_the_steps, a_pane_that_cannot_be_read_is_blind_time_that_runs_to_the_deadline_never_idle, a_pane_that_disappears_is_a_lost_carrier_and_nothing_is_closed, a_pane_without_a_controlling_tty_does_not_start_the_agent, a_pending_settlement_leaves_the_slot_undecided_until_it_completes, a_result_after_the_brief_ends_the_domain_after_the_settle_wait, a_second_supervisor_refuses_a_bound_attempt_and_leaves_the_live_agent_alone, a_socket_that_does_not_exist_ends_the_gate_without_the_agent, a_soft_deadline_stops_the_agent_and_every_descendant, a_soft_deadline_stops_the_agent_and_its_children, a_step_answering_75_leaves_no_receipt_and_stops_the_chain, a_step_exit_of_75_leaves_no_receipt_and_stops_the_chain, a_step_gets_exactly_the_environment_the_envelope_names, a_step_holds_no_lock_description, a_step_past_its_timeout_is_killed_with_its_descendants_and_leaves_no_receipt, a_step_that_asks_for_a_retry_leaves_the_slot_undecided, a_step_that_hangs_is_killed_at_its_timeout_and_leaves_no_receipt, a_step_with_a_receipt_is_not_run_again, a_stop_request_ends_the_agent_and_its_child_inside_the_grace, a_supervisor_killed_after_the_brief_leaves_the_gate_running_and_adopt_releases_the_slot, a_supervisor_killed_during_a_mutating_attempt_keeps_the_cwd_lease_guarded_while_the_agent_lives, a_supervisor_killed_midway_leaves_the_agent_running_and_adopt_settles_from_gate_exit, a_supervisor_killed_midway_leaves_the_agent_running_and_the_lock_held_until_the_gate_exits, a_supervisor_that_dies_while_the_gate_waits_for_go_ends_it_without_the_agent, a_supervisor_that_is_already_dead_refuses_the_connection, a_supervisor_that_stays_does_not_trigger_the_outbox_watch, a_tampered_envelope_is_refused_before_anything_starts, a_tampered_envelope_is_refused_before_hello, adopt::tests::a_young_envelope_of_this_boot_is_still_starting_and_anything_else_is_not, adopt::tests::argv_names_one_target_and_needs_protocol_one, adopt_a_binding_without_gate_exit_is_gate_lost_and_records_the_outbox, adopt_a_declared_domain_without_a_binding_is_not_called_empty, adopt_a_domain_that_a_dead_gate_left_behind_is_ended_before_the_attempt_goes_on, adopt_a_domain_that_cannot_be_judged_stays_held_and_nothing_else_happens, adopt_a_gate_exit_without_receipt_becomes_the_receipt, adopt_a_held_lock_is_running_and_an_adopting_marker_makes_it_being_adopted, adopt_a_receipt_that_exists_stands_and_only_the_missing_steps_run, adopt_a_run_dir_without_the_v3_layout_is_legacy_and_nothing_changes, adopt_a_step_that_asks_for_a_retry_leaves_the_attempt_open_for_the_next_adopter, adopt_ignores_a_start_refusal_of_another_attempt, adopt_names_why_a_supervisor_never_bound, adopt_no_binding_and_no_receipt_is_abandoned_not_started_and_the_steps_run_once, adopt_probe_only_reports_without_writing_or_running_anything, adopt_racing_adopters_leave_exactly_one_winner_and_one_run_of_each_step, adopt_scan_leaves_a_running_attempt_and_a_foreign_run_alone, adopt_scan_skips_two_thousand_closed_runs_quickly_and_adopts_the_five_that_need_it, adopt_second_adopter_sees_being_adopted_while_the_first_runs_the_steps, an_agent_reported_working_is_alive_without_asking_the_pane_for_its_processes, an_agent_that_cannot_start_ends_the_attempt_like_a_shell_command_that_cannot, an_agent_that_ends_at_once_still_gets_its_binding_and_a_receipt, an_agent_that_ignores_sigterm_is_killed_after_the_grace, an_agent_that_ignores_the_stop_is_killed_after_the_grace, an_agent_that_prints_past_its_output_budget_is_stopped_and_the_receipt_says_so, an_attempt_that_cannot_go_on_closes_the_captured_pane_and_names_why, an_idle_agent_with_unchanged_invalid_result_stops_and_releases_custody, eof_before_go_ends_the_gate_with_64_and_no_agent, eof_before_go_exits_without_running_the_agent, eof_before_the_brief_ends_the_domain_at_once, every_vector_matches_canonical_json_and_digest, floats_have_no_canonical_form, gate::tests::argv_parses_and_refuses, gate_exit_is_published_once, go_channel::tests::frame_buffer_yields_frames_as_they_complete, go_channel::tests::frames_round_trip, go_channel::tests::oversize_short_and_non_object_frames_are_refused, go_for_another_attempt_is_refused, go_with_the_wrong_digest_is_refused, killing_the_gate_kills_a_setsid_grandchild, killing_the_terminal_monitor_ends_the_gate_and_its_agent, mismatched_cwd_lease_path_never_gets_a_domain_record_or_starts_a_producer, missing_capture_or_gate_exit_or_inconsistent_outcome_retains, neither_the_agent_nor_a_step_holds_a_handle_on_the_attempt_lock, neither_the_agent_nor_its_child_holds_a_lock_description, nested_unsafe_numbers_keep_their_original_error, no_process_of_the_attempt_but_the_gate_holds_the_lock, publish::install_mapping_tests::errors_before_install_propagate_and_errors_after_install_keep_the_outcome, publish::tests::civil_date_matches_known_instants, recognized_deadlines_and_adopted_results_close, route::tests::other_routes_are_not_ours, route::tests::probe_needs_protocol_one, route::tests::probe_refuses_a_stray_flag, sigterm_to_the_gate_stops_the_agent_and_names_the_requested_cause, sigterm_without_a_stop_file_is_a_cancel_by_signal, stdin_comes_from_the_brief_file, steps_run_in_order_and_a_step_with_a_receipt_is_skipped, successful_linux_pgroup_supervisor_drains_setsid_escapee_before_live_controller_handoff, supervise::terminal::tests::a_path_longer_than_a_unix_socket_holds_is_refused_before_anything_is_bound, supervise::terminal::tests::a_socket_directory_other_users_can_enter_is_refused, supervise::terminal::tests::an_early_end_names_why_in_the_receipt_and_a_good_step_names_nothing, supervise::terminal::tests::unreadable_wait_requires_unchanged_bytes_and_consecutive_idle_polls, supervise::tests::argv_needs_protocol_one_and_an_envelope, supervise::tests::outcome_follows_the_receipt_contract, terminal_control_that_cannot_prove_it_may_close_leaves_the_step_open_for_adopt, terminal_slot::tests::missing_receipt_or_missing_facts_retain, terminal_slot::tests::the_envelope_sets_how_long_a_retained_pane_stays, the_agent_environment_is_the_envelope_plus_the_side_file_plus_the_anchor, the_agent_group_is_the_foreground_group_of_the_pane_tty, the_agent_keeps_the_terminal_and_pane_variables_of_its_own_pane, the_agent_sees_the_attempt_identity_and_nothing_of_the_parent_session, the_agent_starts_only_after_go_and_its_output_lands_in_the_capture_files, the_cwd_lease_is_free_the_moment_the_gate_is_gone_while_a_step_still_runs, the_domain_is_recorded_before_the_agent_runs_and_the_controller_keeps_custody, the_gate_is_pid_1_runs_the_agent_and_publishes_gate_exit_once, the_hard_ceiling_is_enforced_with_no_supervisor_left, the_hard_ceiling_is_enforced_with_no_supervisor_left, the_lock_rides_on_go_and_outlives_the_supervisor_until_the_gate_exits, unicode_key_order_and_all_control_escapes_keep_golden_bytes, without_a_result_the_agent_runs_to_the_hard_ceiling

**fgos-terminal-control (87):** a_caller_closes_its_own_attached_pane_and_no_other, a_close_across_an_incarnation_change_is_kept_unknown, a_closed_anchor_continues_the_group_in_a_new_tab_with_the_same_label, a_command_that_replaced_the_shell_is_identified, a_command_that_replaced_the_shell_is_still_the_foreground_of_its_slot, a_different_incarnation_is_a_different_directory, a_driver_without_the_capability_is_unsupported, a_hung_herdr_command_is_unknown_after_the_timeout, a_missing_pane_is_gone_only_when_herdr_says_so, a_new_tab_uses_its_own_first_pane_and_leaves_no_empty_root, a_pane_released_while_the_group_is_measured_does_not_stop_the_allocation, a_pane_with_no_recognised_agent_answers_unknown_state_while_a_failed_read_stays_a_refusal, a_record_is_published_once_and_never_overwritten, a_screen_comes_back_as_plain_text_or_in_the_envelope_and_a_failure_is_named, a_server_restart_invalidates_old_records_and_never_closes_the_new_servers_panes, a_session_without_a_workspace_gets_one_and_its_root_pane_is_the_first_pane, a_shape_that_does_not_match_is_none_not_a_guess, a_slot_inside_the_allocation_grace_is_not_reported, a_split_measured_below_the_minimum_is_closed_and_a_new_tab_opens, absent_herdr_declares_nothing_and_every_op_is_unsupported, agent_get_gives_the_agent_state_and_session, allocate_is_idempotent_per_key, an_attached_pane_joins_the_group_it_names_and_the_next_pane_opens_beside_it, an_orchestrator_that_died_after_allocate_leaves_the_pane_alone, an_unreadable_answer_is_unknown, attach_records_the_pane_and_release_never_closes_it, close_after_retain_does_not_pretend_to_close, commands_do_not_inherit_the_callers_descriptors, cwd_and_env_reach_the_driver_for_a_new_tab_and_for_a_split, declares_what_herdr_can_do_after_one_probe, directories_are_private, each_capability_runs_the_expected_command, error_envelopes_keep_their_code, every_fixture_matches_its_expected_placement, every_pane_of_the_group_vanishing_while_it_is_measured_continues_in_a_new_tab, explain_accepts_the_verdict_wrapped_in_a_result, explain_says_whether_a_screen_rule_matched_or_herdr_only_fell_back, explain_without_a_verdict_is_a_detector_with_no_state, fixtures_are_the_contract_serialization_of_a_placement, herdr_live, identity::tests::a_pane_still_on_its_own_shell_matches_nothing, identity::tests::a_shell_that_exec_replaced_itself_is_the_expected_process, identity::tests::expected_process_matches_the_exec_renamed_launcher_target, immediate_close_with_a_foreign_foreground_is_kept_without_a_release_marker, immediate_close_without_process_info_is_kept_without_a_release_marker, incarnation::a_server_swapped_while_closing_is_unknown, incarnation::an_unreachable_socket_is_unknown, incarnation::close_is_refused_when_the_expected_incarnation_is_not_the_live_one, incarnation::close_of_a_vanished_pane_reports_already_gone, incarnation::close_runs_when_the_incarnation_is_unchanged, incarnation::endpoint_falls_back_to_status_server_when_none_is_given, incarnation::incarnation_is_the_socket_owner_identified_by_the_os, incarnation::listener_helper, inspect_of_a_missing_key_or_gone_pane_is_not_live, invalid_keys_are_refused, key_validation_matches_the_port_pattern, launch_identifies_the_root_process_and_writes_the_launched_marker, launch_requested_without_launched_is_kept_and_never_launched_into_again, layout_gives_area_and_pane_rects, list_and_session_answers_unwrap, markers_are_one_shot_and_are_not_keys, measured_split_fills_352x69_where_the_fixed_down_split_breaks_the_minimum, pane_get_gives_agent_activity, process_info_separates_shell_from_foreground, property_every_split_keeps_both_children_at_or_above_the_minimum, property_filling_a_tab_never_leaves_a_pane_below_the_minimum, registry_resolves_the_default_and_rejects_unknown_names, release_close_closes_only_its_own_pane_and_never_a_tab, retain_closes_only_past_until_on_the_same_incarnation, retain_with_a_foreign_foreground_is_kept, retain_without_until_is_kept_until_a_person_closes_it, route::tests::a_protocol_other_than_one_is_a_version_mismatch, route::tests::config_defaults_and_overrides, route::tests::usage_errors_exit_two, same_group_shares_a_tab_and_other_groups_do_not, send_and_read_reach_the_pane_of_the_key, session_and_socket_reach_herdr_through_its_environment, split_gives_new_pane_and_its_tab, split_ratio_is_the_share_the_existing_pane_keeps, status_server_gives_the_socket, store::install_mapping_tests::errors_before_install_propagate_and_errors_after_install_keep_the_outcome, tab_create_gives_tab_and_root_pane, the_core_never_launches_into_an_attached_or_released_slot, the_core_never_reads_labels_or_lists_to_decide, the_group_hint_is_rewritten, the_policy_opens_a_new_tab_when_no_split_keeps_the_minimum, without_geometry_the_newest_pane_splits_down_and_the_tab_fills_by_count

## 9. Unresolved questions

- Should pure contract-lint tests (no code reads the file, mutation only they catch) ever be retired? This batch kept them; the plan text says contract-prose retires.
- `test/suite-baseline.json` wall seconds (202) is far from this host's 465 s; refresh on the reference machine, not here.
- Event-store: the plan's tally said 70 tests in 19 files; the tree has 75 in 16.

Status: DONE_WITH_CONCERNS
Summary: terminal-control is done and committed (3 mirrors retired, gates green, 0 coverage loss); event-store has a full inventory with nothing to retire; run-supervisor is labelled and mutation-checked with 5 retirements decided but not applied.
Concerns/Blockers: run-supervisor deletions and their gates remain; git and holder-lock not started; two one-off environmental failures (skip-worktree config stub, leaked tmp dir) documented in section 3.
