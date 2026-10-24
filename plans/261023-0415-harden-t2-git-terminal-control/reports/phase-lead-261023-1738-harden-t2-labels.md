# Readable tab and pane labels: lead report

Branch `harden/t2-p15-labels`, cut from `a486166cf`. Owner decision 25 (label format). RUL104: no new mechanism.

## Shape (one builder, in Rust)

`Display` loses `label` and gains structured `id`, `title`, `session` (beside `role`, `agent`, `model`). `Display::tab_label` and `Display::pane_label` in `packages/terminal-control/rust/src/port.rs` are the only place that formats or truncates. The core calls them for the tab (create and overflow `(n)`), the worker pane label after allocate, and the `label` op.

Why this shape: the shell already talks to the core through the `attach`/`label` ops, so passing fields through them needs no new `fgos` verb and no Node round trip from shell; Node passes the same fields. Both callers stay thin and cannot grow a third format. Ids stay whole in the record (the skill's `attach` now carries the display).

## What changed

- Rust: `port.rs` builder (+45), `core.rs` four call sites.
- Node: `terminal-slot.mjs` `slotDisplay` now structured (no formatting), new `workLabelOf(assignment)`; `herdr-round.mjs` two small hunks (ctx `workLabel`, `slotDisplay` call; `groupKey` line and anything near `groupSize` untouched); `assignment-runner.mjs` passes `workLabel: workLabelOf(effectiveAssignment)`.
- Skill: `rename.sh` passes `{id, title?, session?}` (optional 3rd arg title; a.ssid removed), `terminal-port.sh` `fgos_terminal_attach` takes optional display JSON, `SKILL.md` text.
- Contracts: `terminal-control.port.v1.json` display fields, `allocation-record.v1.json` display. Spec section 5 rule 5 "Naming" plus a decision line. CHANGELOG one line.

## Where the facts come from (the question the brief asked)

- Short id for a work item: `assignment.workId` (a real work item id on a work-step unit).
- Run without work item: `run-` plus the first 4 chars of the unit run id's random part (`unit-run-<clock>-<hex8>`: the first 8 chars of the whole id would be the useless `unit-run`), title = start of `assignment.objective` (which is the prompt for `fgos run`).
- Work item title: first report said it was missing; the big lead asked to deliver it if no new lookup is needed. It needs none: `workUnitFor` (src/runner/work-dispatch.mjs, the one builder of `declared`) holds the item in hand. It now adds an optional `declared.title`; `runUnit` persists it in unit.json `declared` and puts it on the producer assignment (`operationFields`); `workLabelOf` passes it to the label. `operation-choice.mjs` only passes `built.declared` through, so no other builder needed a move. Proof: `work-unit-for.test.mjs` (declared.title), `driver-rununit.test.mjs` (assignment.json carries the title), `dispatch-terminal-slot.test.mjs` (workLabelOf), `terminal-groups.test.mjs` (round to port wiring, unchanged). A work item with no title, and any seat other than the operation-carrying producer (a reviewer seat's assignment has no `workId`), still labels by what it has.
- A reviewer seat's `objective` is the role's own task text; if a reviewer ever opens the tab first, a run's title is that text. Producers go first in every pattern read.

## Proof

| Behaviour | Owner |
|---|---|
| id cut at 8, title cut at 24 and whitespace collapsed, multibyte title, no title, no id, group-key fallback, role/model/agent pane, own pane with 8-char session | `labels_are_built_from_short_ids_and_titles_of_at_most_24_characters_in_one_place` (core_rules.rs). New: no existing test builds text from fields. |
| tab label on create, overflow `(2)`, worker pane label after allocate | `the_tab_and_the_worker_pane_take_their_labels_from_the_display_and_an_overflow_tab_is_numbered` (core_rules.rs). New: existing overflow and pane tests use plain titles. |
| round hands id/title/role to the port (wiring) | extended `the brief a reviewer reads...` in terminal-groups.test.mjs (tab `tsk-1lvx · fix terminal layout`, panes `producer · sonnet`, `reviewer · sonnet`) |
| which facts a round names (work item, run, no title) | new `test/runner/dispatch-terminal-slot.test.mjs` (module had no test owner), 2 tests |
| skill pane label | terminal-skill-attach.test.mjs, the two rename.sh tests updated: `fg.ssid:codex-thread-skill` became `fg.ssid:codex-th` because the visible session is now its first 8 characters; plus the record keeps the whole id |

Existing tests with a `label` display (Rust `Display { label }`, four Node suites, run-supervisor fake support) moved to `title`; their expectations (`label-g`, `label-g (2)`, `batch-one`) are unchanged because a title alone, or the group key, is the label. Test cost: +3 Rust-or-Node tests total (2 Rust, 2 Node-pure new, 0 retired; 1 Node test extended, 2 skill tests edited), 0 new host spawns.

## Verification (CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p15-target)

- `cargo test --no-fail-fast -p fgos-terminal-control`: 114 passed, 0 failed.
- `cargo test --no-fail-fast -p fgos-run-supervisor`: 135 passed, 0 failed.
- `cargo clippy -p fgos-terminal-control -p fgos-run-supervisor --all-targets -- -D warnings`: clean.
- Node one-file command: terminal-control/*, terminal-skill-attach, dispatch-terminal-slot, terminal-groups, terminal-control-checks, dispatch-worker-session: tests 68, pass 68, fail 0, skipped 0, no `run-tests: ERROR`. Wider dispatch set (worker-session*, herdr-*, confinement-*, import-graph, architecture): 273 pass, 0 fail.
- Census: no Git file touched, not regenerated.

## Labels as a person sees them

```
tab            tsk-1lvx · fix terminal layout
overflow tab   tsk-1lvx · fix terminal layout (2)
worker panes   producer · claude-sonnet     judge · gpt-5
own pane       tsk-1lvx · fix terminal layout | fg.ssid:sess-ski
run, no item   run-9f3a · rename the flag across   (title cut at 24)
no title       tsk-1lvx
```

Δ lines: Rust src +50/-6, Rust tests +45/-7; Node src +33/-12, Node tests +45/-12; shell +17/-14; JSON/docs +20/-6.

## Concerns

- Records written before this change keep a `label` key that is now ignored.
- Merge with the even-split branch: my `herdr-round.mjs` hunks are the `ctx` destructure line (adds `workLabel` at its end) and the `slotDisplay(` line; a `groupSize` addition to the same destructure line would be a one-line textual conflict.
