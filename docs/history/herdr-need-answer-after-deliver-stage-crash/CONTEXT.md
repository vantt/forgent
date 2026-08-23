# tsk-1pg: herdr-plugin NEED ANSWER / AFTER DELIVER boxes render empty

## Feature boundary

`herdr-plugin` (the fgOS TUI dashboard, Rust). Fix two independent bugs in
`herdr-plugin/src/fgos.rs` and `herdr-plugin/src/app.rs` that combine to
leave the NEED ANSWER and AFTER DELIVER boxes permanently empty even when
real items belong there:

1. `WorkItemRaw.stage` is a mandatory `String` field, but real state data
   has items with no `stage` (e.g. `tsk-mvp-test-1`, `status: wontfix`).
   `serde_json::from_str::<ListEnvelope>` deserializes the entire `work`
   map strictly before any filter runs, so one stage-less item crashes
   `parse_need_answer`/`parse_after_deliver` — even though neither
   function reads `stage` at all.
2. `app.rs`'s `refresh_from_fgos` calls 5 sources sequentially (triage,
   doing, need_answer, after_deliver, merge_list); each source's `Ok`
   branch does `self.last_error = None` unconditionally. A later source's
   success wipes out an earlier source's real parse error, so the status
   bar (`ui.rs:337`, one line) silently loses the error that explains why
   the boxes are empty.

Out of scope: any other `WorkItemRaw` field, any other `WorkItemSource`
port method, any TUI layout change. No new feature — bug fix only.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Missing `stage` on a work item defaults to `"executing"` inside `WorkItemRaw`/parsing, matching the JS engine's own established convention for a missing stage (`item.stage ?? 'executing'` / `item.stage ?? stageForStep(domain, 'Execute')`), applied unconditionally regardless of `status`. Pinned from existing codebase precedent (`src/state/frontier.mjs:105`, `src/intake/plan.mjs:645`, `src/state/impact.mjs:128`, `src/state/stage-fsm.mjs:85`) — not asked as a question since the convention already conclusively answers it. |
| D2 | When 2+ of the 5 sources fail within the same `refresh_from_fgos` call, the status bar shows the **first** error encountered in call order (triage → doing → need_answer → after_deliver → merge_list). Once an error is recorded during a refresh cycle, no later branch in that same cycle — success or failure — overwrites it. Confirmed by user. |

## Pinned terms

- "the same refresh cycle" = one call to `refresh_from_fgos`, i.e. the 5
  sequential source fetches it performs in one invocation, not across
  separate polls.
- "default" (D1) applies at parse/struct level, not by mutating the
  underlying fgOS state — a stage-less item stays stage-less in `.fgos/`;
  only the herdr-plugin's in-memory view treats it as `"executing"`.

## Scout evidence

- `herdr-plugin/src/fgos.rs:58-66` — `WorkItemRaw` struct, `stage: String`
  (mandatory, no `Option`, no serde default).
- `herdr-plugin/src/fgos.rs:223-257` — `parse_need_answer`/
  `parse_after_deliver` filter on `item.status` only (`"blocked" |
  "awaiting-human"` and `"retrospective" | "cleanup"` respectively); never
  read `item.stage` — confirms the crash is a pure deserialization
  side-effect, not a real dependency on the field.
- `herdr-plugin/src/app.rs:462-543` — `refresh_from_fgos`: 5 sequential
  `match source.fetch_*() { Ok(...) => { ...; self.last_error = None; } Err(err)
  => self.last_error = Some(err.to_string()) }` blocks; every `Ok` branch
  unconditionally clears `last_error`.
- `herdr-plugin/src/ui.rs:334-344` — status bar renders exactly one line;
  `last_error` (red) takes priority over `pick_status`/filter text when
  present.
- JS engine's missing-stage convention: `src/state/frontier.mjs:105`,
  `src/intake/plan.mjs:645`, `src/state/impact.mjs:128,155`,
  `src/state/stage-fsm.mjs:85` — all read `item.stage ?? <Execute stage>`.
- Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
  --capability impact-analysis --status present` returned GitNexus,
  `status: present` → **full**. No code changed yet during this
  clarify pass, so no blast-radius report was needed this stage; planning/
  execution should run `impact` on `WorkItemRaw`/`refresh_from_fgos`
  before editing per the repo gate.

## Verify

`verify` locked as:

```
cargo test --manifest-path herdr-plugin/Cargo.toml need_answer_survives_missing_stage && cargo test --manifest-path herdr-plugin/Cargo.toml last_error_first_error_wins && cargo build --release --manifest-path herdr-plugin/Cargo.toml
```

Names two new regression tests this fix must add to
`herdr-plugin/src/fgos.rs`'s existing `mod tests` (alongside its own
`parse_need_answer`/`parse_after_deliver` fixture tests at lines 640/681)
and `app.rs`'s test module respectively — a generic `cargo test` run
(the repo's own prior convention for this crate, e.g. `"cargo test
--manifest-path herdr-plugin/Cargo.toml && cargo build --release
--manifest-path herdr-plugin/Cargo.toml"` used elsewhere) does not
distinguish fixed from unfixed here, since neither bug currently has a
regression test — the existing suite passes identically before and after
the fix. Test bodies (fixture shape, assertions) are `fgos-coding-planning`'s
call, not designed here — this only fixes their names as the proof
target, following this crate's own existing verify convention of naming a
specific test filter (e.g. `"cargo test --manifest-path herdr-plugin/
Cargo.toml pane_focus"`).

**Update (fgos-coding-validating round 1):** the command above was found to not
discriminate fixed vs unfixed (a zero-match `cargo test <filter>` exits 0
under this crate's nextest alias) — see `plan.md`'s "Validating round 1"
section for the evidence and the corrected, `grep`-gated verify actually
locked on the item now.

## Outstanding questions deferred to planning

- Exact fixture shape and assertions for `need_answer_survives_missing_stage`
  and `last_error_first_error_wins` (see Verify above). Implementation
  concern — left to `fgos-coding-planning`.
