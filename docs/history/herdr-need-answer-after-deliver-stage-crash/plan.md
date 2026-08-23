# tsk-1pg: herdr-plugin NEED ANSWER / AFTER DELIVER boxes render empty

Mode: **standard**

Direct-entry: no `Mode:` line existed yet and this session's own Orient
step never ran before `fgos-coding-planning` was loaded (entered via `/fgOS:pick`
→ `fgos-coding-driving`, not `fgos-routing`), so the lane was derived here
per `fgos-routing`'s own Mode-gate table. Flags counted: **existing
covered behavior** (yes — `parse_need_answer`/`parse_after_deliver` and
`refresh_from_fgos` already have tests: `fgos.rs:640,681`,
`main.rs:933`), **weak proof around the area** (yes — neither bug
CONTEXT.md locked has a regression test today; the existing suite passes
identically before and after either fix, per the discover verify dispute
this item already hit). No hard-gate flag (no auth/data-loss/audit/
external-provider/validation-removal). 2 flags → standard.

## Validating round 1 — Proof surface FAIL, verify revised

`fgos-coding-validating`'s reality gate FAILed the Proof surface dimension on the
verify this plan originally reused from `discover` (`"cargo test
--manifest-path herdr-plugin/Cargo.toml need_answer_survives_missing_stage
&& cargo test --manifest-path herdr-plugin/Cargo.toml
last_error_first_error_wins && cargo build --release --manifest-path
herdr-plugin/Cargo.toml"`). Evidence, gathered live in this session: this
crate aliases `cargo test` to nextest — a filter matching zero tests
prints `cargo test: 0 passed, N filtered out (K suites, ...)` and exits
**0**, not a failure (empirically run against `herdr-plugin` at commit
`5220434`, before either test exists: `0 passed, 62 filtered out`, exit
0). The trailing `&& cargo build --release` also always succeeds
regardless of the bug. So the original verify would report done even if
the implementer forgot to add either named test — it never actually
discriminated fixed vs unfixed.

Fixed verify: pipe each named test's run through `grep -q "1 passed"` so
the command only succeeds if that exact test both ran and passed —
following this repo's own existing grep-based verify convention (e.g.
`"grep 'isolate: true' bin/fgos.mjs && echo 'PASS: ...'"` elsewhere in
this backlog). Empirically confirmed both directions in this session: the
same zero-tests-added state now fails (`grep -q "1 passed"` finds no
match in `"0 passed, ..."` → exit 1), and a real single passing test
matches correctly (ran `pane_focus_argv_targets_the_given_pane_id`,
got `cargo test: 1 passed, 61 filtered out` → `grep -q "1 passed"`
succeeds).

```
cargo test --manifest-path herdr-plugin/Cargo.toml need_answer_survives_missing_stage 2>&1 | grep -q "1 passed" && cargo test --manifest-path herdr-plugin/Cargo.toml last_error_first_error_wins 2>&1 | grep -q "1 passed" && cargo build --release --manifest-path herdr-plugin/Cargo.toml
```

## Approach

Two independent bugs, same feature boundary (see `CONTEXT.md`), fixed
together since both live in the same poll path and the item's own
description bundles them:

1. **`WorkItemRaw.stage: String` → `Option<String>`**
   (`herdr-plugin/src/fgos.rs:61`). Per D1, every read site that
   currently uses `item.stage` as non-optional defaults it to
   `"executing"` at the point of use — `DoingRow.stage` (`fgos.rs:207`)
   and `doing_tier` (`fgos.rs:71-81`, called with `&a.stage`/`&b.stage`
   right after). `parse_need_answer`/`parse_after_deliver` (`fgos.rs:223-
   257`) never read `item.stage` at all — they only need the struct to
   deserialize successfully; no further change needed in those two
   functions.

2. **`refresh_from_fgos` last_error overwrite ordering**
   (`herdr-plugin/src/app.rs:462-543`). Per D2, once any of the 5 sequential
   `match source.fetch_*()` blocks records an error this cycle, no later
   block — success or failure — overwrites it; the first error in call
   order (triage → doing → need_answer → after_deliver → merge_list) wins.
   Mechanically: track whether an error was already recorded this call
   (e.g. a local `bool`/`Option` checked before each `self.last_error =
   None`/`Some(...)` write), reset once at the top of `refresh_from_fgos`
   before the first fetch. Exact variable shape is an implementation
   choice for Execute, not fixed here.

### Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `WorkItemRaw`/`parse_need_answer`/`parse_after_deliver` (`fgos.rs`) | Medium — existing, tested parse path; a stage-less fixture must be added and must not regress the two existing fixture tests (`fgos.rs:640,681`) | New test `need_answer_survives_missing_stage`: parse a JSON fixture shaped like real `tsk-mvp-test-1` (no `stage` field, `status: wontfix`) through `parse_need_answer`/`parse_after_deliver` and assert `Ok`, plus the two existing fixture tests still pass |
| `refresh_from_fgos` (`app.rs`) | Medium — existing, tested method (`main.rs:933` already asserts `last_error.is_none()` on the happy path); ordering fix must not break that assertion | New test `last_error_first_error_wins`: a fake `WorkItemSource` where source N fails and a later source N+k succeeds in the same call, assert `app.last_error` reports source N's error after `refresh_from_fgos` returns |
| `doing_tier`/`DoingRow` (`fgos.rs:71-81,207`) | Low — only consumer of the new default; `doing_tier` already has a `_ => 4` fallback arm, so an `"executing"`-defaulted stage just sorts through the existing `"executing" => 1` arm, no new branch needed | Covered by the same `need_answer_survives_missing_stage` fixture if it also exercises `parse_triage`/`parse_doing`, or a second small assertion in that test |

Impact-analysis posture (`CLAUDE.md` gate): `fgos tool query --capability
impact-analysis --status present` → GitNexus present. Index freshness
flagged **stale** by the repo's own post-tool hook (`last indexed:
251d0b5`) during this session → **degraded**, evidence kept but marked
weak. Ran anyway for the record: `impact(refresh_from_fgos, upstream)` →
`risk: LOW`, `impactedCount: 8`, 2 direct callers — matches this session's
own `rg` cross-check (`app.rs:626,650`, both inside `main.rs`'s init/loop
call sites). `impact(WorkItemRaw, upstream)` → "not found" (GitNexus
does not index this private Rust struct); cross-checked manually via `rg
-n "WorkItemRaw" herdr-plugin/src/*.rs` — confirmed contained to
`fgos.rs` alone (the struct definition and one `BTreeMap<String,
WorkItemRaw>` field), no wider blast radius. Both proof points above are
evidenced by direct `rg` reads, not solely the degraded GitNexus read.

### Files touched

- `herdr-plugin/src/fgos.rs` — `WorkItemRaw.stage` → `Option<String>`;
  `DoingRow.stage`/`doing_tier` call sites default via `?? "executing"`
  equivalent; new fixture + test `need_answer_survives_missing_stage`.
- `herdr-plugin/src/app.rs` — `refresh_from_fgos`'s 5-source error
  tracking; new test `last_error_first_error_wins`.

### Order

Single item, no split (see below) — both bugs are small, same-file-pair,
same verify command already locked at `discover`. Fix (1) `WorkItemRaw`
first: (2)'s new test needs a `WorkItemSource` fake that returns `Ok`/
`Err` per source, independent of (1), but doing (1) first means the
`fgos.rs` test fixture (`tsk-mvp-test-1`-shaped, stage-less) is ready to
reuse if (2)'s fake source ever needs a realistic row. `fgos graph
--what-if tsk-1pg --json` was not run — this item has no dependents
(`deps: []`, nothing else references `tsk-1pg`), so there is no
unblock-ordering question to answer; the two-piece order above is a
same-item file-order call, not a multi-item split.

## Shape

Standard-lane shape — concrete cases to prove:

- **Boundary**: a work item with no `stage` field at all (real shape:
  `tsk-mvp-test-1`) must deserialize and default to `"executing"`, not
  panic or error.
- **Existing behavior must not regress**: the two current fixture tests
  in `fgos.rs` (`fetch_need_answer`/`fetch_after_deliver`, lines 640/681)
  and `main.rs:933`'s `last_error.is_none()` happy-path assertion.
- **Partial failure — single source**: one source fails, the other four
  succeed → status bar shows that one error (already the pre-fix
  behavior when it's the fetch_merge_list, last, that fails; must hold
  for every source position, not just the last).
- **Partial failure — multiple sources (this item's own D2)**: two or
  more sources fail in the same `refresh_from_fgos` call → status bar
  shows the first one in call order; a later success in the same call
  never clears it, and a later failure in the same call never replaces
  it.

No split — this is one honest piece of work: two small, tightly-scoped
Rust changes in two files already covered by the same verify command
locked at `discover`.

## Assumptions

None pinned — `CONTEXT.md` D1/D2 cover every decision this plan needed;
no mid-planning gap arose.
