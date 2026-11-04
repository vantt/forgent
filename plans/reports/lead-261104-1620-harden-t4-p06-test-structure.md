# HARDEN T4 phase 06 (test structure) lead report

Branch `harden/t4-p06-test-structure`, worktree `/home/vantt/projects/forgent-worktrees/harden-t4-p06`, cargo target `/home/vantt/projects/forgent-worktrees/harden-t4-p06-cargo`. Base main `e15418d1a`. Load at start 0.9, at end 0.9 (below 20).

## Commit

- `87a6522f1` test(run-supervisor): retire Node crash-matrix rows the host tests own, one case per resume branch, one wait helper (one commit: the census regenerates with the Rust test edit; census file included).

## (a)/(b)/(c) table

Owners re-found by title on current main and read. (c) = what no owner asserts.

| Retired | (a) asserted | (b) owner now | (c) | Result |
|---|---|---|---|---|
| direct 2 SIGINT | exit 130, cancel-requested `signal:SIGINT`, receipt cancelled, resume line, closed.json, settled files, agent started once | `cancel-registry` 1 (all but the last two) | settled-file set and start count after a cancel; closed.json is written only after every step, so the files follow | retired |
| direct 2b SIGTERM | exit 143, request `signal:SIGTERM`, receipt cancelled, closed | `cancel-registry` 3 (same asserts) | same as above | retired |
| direct 4 soft deadline, controller dead | receipt timeout, grandchild gone, settled | `supervise_lifecycle::a_soft_deadline_stops_the_agent_and_every_descendant`, `supervise_portable::a_soft_deadline_stops_the_agent_and_its_children` (stop, stoppedBy, domain dead, lock free); `attempt-steps` timeout settle cases | none | retired |
| direct 5 hard ceiling, nobody left | gate ends at ceiling, agent dead, next run settles timeout | `gate_ceiling` / `gate_portable::the_hard_ceiling_is_enforced_with_no_supervisor_left`; `adopt_matrix::adopt_a_gate_exit_without_receipt_becomes_the_receipt` (hard-ceiling -> timeout) | none | retired |
| direct 6 two runs over one attempt | one adopter, closedBy adopt, one receipt per step | `adopt_concurrency::adopt_racing_adopters_...` (one winner, one run of each step, closed); Node wiring `sweep.test.mjs` "two adopters over one dead attempt remove its home once" (still present, passes) | none | retired |
| direct 8 no lock description reaches agent | agent and grandchild fd listing has no attempt.lock and no dispatch-cwd | `gate_pid1`, `supervise_portable`, `steps_runner`, `gate_terminal_socket` (cwd.lease, terminal only) | the cwd lease of a direct attempt reaching the agent: no host test passes a lease to a direct gate; row 9 cannot see it (ancestry check includes the gate) | **kept** |
| terminal 2 soft deadline, pane closes | timeout, soft-deadline stop, agent gone, release-slot close, pane closed once | `supervise_terminal_fake_herdr::a_deadline_stop_names_a_provider_stop_...` asserted no close; extended (release-slot disposition `close`, one `pane close`); `release_slot_step` timeout case; gate stop cases | none after the extension | retired |
| terminal 3 supervisor killed after brief | agent outlives supervisor, orphan-result gate exit, adopt settles and closes the pane | `supervise_terminal_fake_herdr::a_supervisor_killed_after_the_brief_...` (same asserts); real settle steps: terminal row 1 and `attempt-steps` | completed-pass classification after adopt (same settle step as row 1) | retired |
| adopt-resume two adopters, every row | one adopter, steps ran once | `adopt_concurrency`; `sweep` wiring | none | retired |
| adopt-resume `settled-no-result` (both) | resume completes the publish after control settled | `attempt-steps` "run control settled but result.json missing: the same token completes the publish with no new epoch" + `adopt_matrix` receipt-stands case | none | retired |
| adopt-resume `receipt-not-settled` (both) | adopt runs the missing settle step | `adopt_matrix::adopt_a_receipt_that_exists_stands_...`, `adopt_..._asks_for_a_retry_...`, `release_slot_step` pending cases | none | retired |
| adopt-resume `all-steps-no-closed` (both) | adopt only writes closed.json | same adopt_matrix loop (zero steps missing) | the zero-missing-steps iteration is not a separate Rust case; same loop | retired |
| adopt-resume terminal `result-no-finalize` | adopt runs finalize-home | direct `result-no-finalize` (kept) | none | retired |
| adopt-resume terminal resume-after-closed | resume reuses result | direct case (kept) | none | retired |

Kept in `crash-matrix-adopt-resume` (RT-P17): no-binding, binding-no-gate-exit, gate-exit-no-receipt (both modes), steps pending (direct `result-no-finalize`, terminal `release-slot-pending`), one resume-after-closed (direct).
Kept controller-only rows: direct 1, 3 (the one controller wiring), 7a, 7b, 7c, 7d, 9; terminal 1.

## Sleep

`sleep(4_000)` (adopt-resume terminal `gate-exit-no-receipt`) stays. It waits for the supervisor to confirm the brief and send `BRIEF_DELIVERED` to the gate; that is a frame on the gate socket, no file or record is published. The twin in terminal-crash-matrix went with row 3. The Rust twin (3.5 s) stays for the same reason.

## Helpers

- Rust: `wait_for` and `wait_until` now once in new `tests/support/wait.rs` (a subdirectory file, so cargo does not build it as its own test binary); `support/mod.rs` includes it, `portable/mod.rs` includes it with `#[path = "../support/wait.rs"]`; both re-export under the old names with `#[allow(unused_imports)]` (each test binary uses a subset), so no caller changed.
- Node: `terminal-harness.mjs` imports `sleep` and the poll loop from `direct-harness.mjs`; its 60 s / 20 ms defaults are explicit in a one-line wrapper. One loop.

## Tests and seconds

| File | Tests before -> after | Seconds before -> after |
|---|---|---|
| `direct-crash-matrix` | 13 -> 7 | 90 -> 41 |
| `terminal-crash-matrix` | 3 -> 1 | 29 -> 5 |
| `crash-matrix-adopt-resume` | 30 -> 9 | 158 -> 49 |
| Rust crate `fgos-run-supervisor` (build examples + test) | 147 -> 147 | 76 -> 72 |

Node tests 46 -> 17 (29 fewer, plan estimated about 40). Same machine, load band under 2.

## Δ lines (`git diff --numstat main`)

- Node tests: +31 / -268 = -237 (estimate -243 total with helpers)
- Rust tests: +51 / -42 = +9 (new wait.rs 29 lines; the deadline owner gained 7 asserted lines)
- Census: +11 / -10 (regenerated)
- Net about -227 vs estimate -243.

## Validation run

- FR files: direct-crash-matrix, terminal-crash-matrix, crash-matrix-adopt-resume (before and after), `cancel-registry` + `sweep` (17 pass), `resume-adopts`, `terminal-cutover`, `terminal-fallback`, `direct-cutover`, `terminal-groups`, `event-store/background-seal-confined` (49 pass, the other importers of the two harnesses).
- `cargo build -q --examples && cargo test -q` green; `cargo clippy -q --all-targets -- -D warnings` clean; `cargo fmt --all --check` clean; `cargo check --tests` clean for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`.

## Retired list for TEST (`test/suite-baseline.json`, not edited)

No file retired. Tests retired, by file:
- `test/run-supervisor/direct-crash-matrix.test.mjs`: "2. a controller that gets SIGINT...", "2b. SIGTERM does the same...", "4. the soft deadline passes after the controller died...", "5. controller and supervisor both dead...", "6. two fgos run starting together...".
- `test/run-supervisor/terminal-crash-matrix.test.mjs`: "2. the soft deadline passes after the controller died...", "3. a supervisor killed after the brief...".
- `test/run-supervisor/crash-matrix-adopt-resume.test.mjs`: `direct`/`terminal` `settled-no-result`, `receipt-not-settled`, `all-steps-no-closed` (resume body and two-adopter body each); `terminal: result-no-finalize` (both bodies); every remaining "two adopters at once" body (direct and terminal `binding-no-gate-exit`, `gate-exit-no-receipt`, `result-no-finalize` direct, `release-slot-pending`); `terminal: a resume after adopt already closed...` (renamed `direct: a resume after adopt already closed the attempt uses its result and adopts nothing again`, the former `direct:` prefix title is the same behaviour).
- Retained titles in these files keep their numbers (1, 3, 7a-7d, 9), so numbering has gaps.

Test cost: tests added 0, retired 29; the Rust deadline owner extended by assertions, no new test; no new host or CLI spawns.

## Doc lines needed

None.

## Not done

- Direct row 8 kept (see table, non-empty (c)). To retire it later, give a direct-gate Rust test a cwd lease descriptor and assert the agent listing.
- Sleep stays (above).

Status: DONE_WITH_CONCERNS
Summary: Crash-matrix Node tests 46 -> 17 and the three files 277 s -> 95 s, one wait helper per language, Rust suite green; direct row 8 kept because no host test covers the cwd lease of a direct attempt, and the 4 s sleep stays because the brief-delivered signal is not published.
Concerns/Blockers: row 8 kept; sleep stays.
