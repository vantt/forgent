# tsk-584 — Iron Law evidence

## Why the gate fired

`classifyIronLaw` against the real committed diff (`changedFiles`,
`trunk...fgw/tsk-584`) returns:

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/state/status-fsm.mjs","src/state/workflow-stage-graphs.mjs"]}
```

Worth stating plainly: **neither matched module is touched by this item.**
Both arrive on this branch from `tsk-5vs` (Piece 1 of the same parent,
already merged in at `77165ef6`), which carries its own evidence file at
`docs/history/tsk-5vs/iron-law-evidence.md`. This item's own diff is
`herdr-plugin/src/{app,ui,main}.rs` plus `CHANGELOG.md` and its plan.

The evidence below is therefore for this item's own change, proved with
this item's own verify command, rather than a restatement of `tsk-5vs`'s.

## Test command

The item's own recorded verify, run exactly as recorded:

```
cd herdr-plugin && cargo test
```

## Failing-test-first proof

The behavior at issue is `WorkTab::matches` classifying a `backlog` item
into the new `BACKLOG` tab. To prove the new test actually pins that
behavior, the fix — and only the fix — was reverted (`WorkTab::Backlog =>
status == "backlog"` replaced by `WorkTab::Backlog => false`), leaving the
new tests and the rest of the change in place, and the verify was re-run.

Real output, failing before:

```
failures:

---- app::tests::tabs_classify_status_into_backlog_todo_doing_review_done stdout ----

thread 'app::tests::tabs_classify_status_into_backlog_todo_doing_review_done' (1930455) panicked at src/app.rs:1131:9:
assertion `left == right` failed: D3: backlog gets its own tab and appears in no other
  left: []
 right: ["tsk-backlog"]
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

--
failures:
    app::tests::tabs_classify_status_into_backlog_todo_doing_review_done

test result: FAILED. 103 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

error: test failed, to rerun pass `--lib`
```

`left: []` is exactly the bug this item exists to fix: the backlog item is
present in the app's item list but classified into no tab at all, so a
person browsing the TUI cannot see it.

The fix was then restored from the committed HEAD (`git checkout --
herdr-plugin/src/app.rs`) and the same command re-run. Real output, passing
after:

```
test result: ok. 104 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

146 passing across 4 suites, against a pre-change baseline of 145 — the one
added test is the auto-discover regression pin below.

## Honest note on the second new test

`auto_discover_skips_a_backlog_item_even_at_an_eligible_stage`
(`herdr-plugin/src/main.rs`) passes both before and after the production
change, and is presented as a regression pin rather than a failing-test-first
proof. That is correct by construction, not an oversight:
`next_auto_discover_candidate` already filters on `status == "todo"`, so it
excluded `backlog` before this item existed. The test asserts the item is
otherwise fully eligible (`discover_eligible()` is true — right stage,
nothing blocking) so that the exclusion is pinned to the status check
specifically, and cannot silently regress if that check is ever loosened.
