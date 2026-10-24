# Terminal layout and label bugs: lead report

Branch `harden/t2-p06c-terminal-layout-bugs` (cut from `8e62db729`), commits `1c6ab0644`, `fc1250c2d`, `69a57e5db`.

## Per item

1. Measure once per allocate: DONE.
   - `place_measured` reads one layout per tab (a pane already inside a measured tab is looked up there). `layout_geometry` no longer reads any pty; the trait gets `pane_pty(pane)` (default `None`, herdr reads `process-info` plus ioctl) and `keep_if_roomy` calls it for the new pane only. `PaneGeometry.pty` is removed (RUL104), so `attach` also stops spawning a process-info per pane.
   - Proof: `each_operation_runs_a_fixed_number_of_herdr_commands` (herdr_driver_fake.rs) gains rows for allocate beside 2, 3, 4 live panes; counts grow by 1 per extra record (the liveness check), not by a layout read per pane.
2. Overflow tab number: DONE. The group's open-tab count gives `label (n)` for tab n >= 2; the pane label stays the plain display label. Proof: extended `the_policy_opens_a_new_tab_when_no_split_keeps_the_minimum` (third tab is `label-g (3)`) and the vanish test (second tab `label-g (2)`, the first was live when read). The dead-anchor test is unchanged: its first tab is gone, so the label repeats (a tab that no longer exists).
3. Worker pane label and role: DONE.
   - Core writes `display.label` with the existing `label_pane` op after the record is published (new tab and split alike); a refusal is ignored because the label is display only and the pane is already a recorded slot.
   - Node: `herdr-round.mjs` passes `rawContract?.assignment?.role` to `slotDisplay`. `assignment-runner.mjs` already puts the role into `effectiveContract.assignment` and `terminal-slot.mjs` `slotDisplay` already accepts `role`, so no other file changed. Label text unchanged.
   - Proofs: `an_allocated_pane_carries_its_display_label_in_a_new_tab_and_after_a_split` (core_rules.rs, Rust owner); in `terminal-groups.test.mjs`, one wiring assertion that three seats make three `pane rename` calls with the batch label, and that the record of a reviewer and a producer carries `display.role`.
4. Placement fallback by count: NOT DELETED. Evidence that the path is a documented, tested, supported degraded mode, not dead:
   - `src/setup/terminal-control-checks.mjs:67-68` returns a passing `info` row "this herdr cannot report pane geometry, so tabs fall back to the fixed split";
   - `test/setup/terminal-control-checks.test.mjs:186` asserts that message;
   - spec section on placement and the doctor row in the spec say the same;
   - `herdr.rs` declares `layout.geometry` only when `pane layout --help` succeeds, and no minimum herdr version is recorded anywhere (`rg` for a min version found none).
   Deleting it means reversing that doctor row, its test and spec text (a capability-support decision). Owner or big lead call.

## Herdr calls per allocate (fake herdr, Core over HerdrDriver, `max 4`)

The fake herdr answers a fixed two-pane layout for every read, so the real tab of N panes adds N process-info calls per layout read on top of these numbers (before: about (N+1)^2).

| live group panes | before | after (item 1) | after (items 1-3, +1 pane rename) |
|---|---|---|---|
| 1 | 8 | 5 | 6 |
| 2 | 12 | 6 | 7 |
| 3 | 16 | 7 | 8 |
| 4 | 20 | 8 | 9 |

`attach`: 4 to 2. New tab: 1 to 2 (the pane rename).

## Delta lines (`git diff 8e62db729..HEAD`)

- Rust: +91 -61 (src and tests).
- Node: +12 -1 (`herdr-round.mjs` +1 -1, one test file +11).
- Docs: spec +6 -6 lines touched, CHANGELOG +1.

## Test cost

- Added: 1 Rust test (pane label), 3 table rows, 3 assertions in existing tests; 0 Node tests, 2 assertion groups in an existing one.
- Retired: 0. New CLI or host spawns in tests: 0.

## Verification (target `/home/vantt/projects/forgent-worktrees/t2-p06c-target`)

- `cargo test --no-fail-fast -p fgos-terminal-control`: all suites `ok` (9, 29, 18, 23, 12, 6, 5 passed; live test ignored).
- `cargo test --no-fail-fast -p fgos-run-supervisor`: all suites `ok`.
- `cargo clippy -p fgos-terminal-control --all-targets -- -D warnings`: clean.
- Node, one-file command: `test/terminal-control/*.test.mjs`, `test/setup/terminal-control-checks.test.mjs`, `test/plugins/terminal-skill-attach.test.mjs`, `test/run-supervisor/terminal-groups.test.mjs`: tests 59, pass 59, fail 0, no `run-tests: ERROR` lines.
- One-door census: 5 unresolved-binary sites, same five (bin/fgos.mjs x2, merge.mjs x2, worktree.mjs); no regeneration needed.

## Concerns

- The review report named `core.rs` hunks the brief paraphrased; big-lead answers item 12 was not found by that number in plan.md (only the lead rules were read).
- A pane label is written once per allocate, after publish; if herdr refuses `pane rename` the pane stays unnamed silently by design.
