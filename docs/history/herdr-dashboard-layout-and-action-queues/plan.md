# Plan — herdr-plugin dashboard: layout + action-queue redesign

Mode: standard

Flags counted (per `fgos-routing`'s Mode gate, applied directly — no lane
was handed off from Orient since this session entered via `/fgOS:pick`
straight into `fgos-coding-driving`, never through `fgos-routing` first;
this is the direct-entry fallback case): **existing covered behavior**
(replaces `tsk-1eu`'s 2-panel focus/pick/jump tests and the modal's
Pick-only test) and **weak proof around the area** (no precedent in this
codebase for ratatui mouse-event handling or click hit-testing) = 2 flags.
No hard-gate flag applies (no auth/data-loss/audit/external-provider/
validation-removal). 2 flags alone would land at the tiny/small-standard
boundary, but the item is also clearly story-sized (9 locked decisions
across 4 architecturally distinct pieces, `docs/history/herdr-dashboard-
layout-and-action-queues/CONTEXT.md`) — `fgos-routing`'s own gate treats
"story-sized behavior" as an independent trigger for **standard**, same as
2-3 flags.

Impact-analysis posture: **degraded**, corrected during `fgos-coding-validating`
(the `full` recorded during clarify only checked `fgos tool query
--capability impact-analysis --status present`, which reports
`status: "present"` with no freshness signal). Running `node
.gitnexus/run.cjs analyze` from the main checkout during validating failed
with a real error: `COPY failed for File: Runtime exception: FTS index
'file_fts' is inconsistent: document for node offset 1069 is missing
during delete. Drop and recreate the FTS index.` — the index is not
merely stale, it is currently broken and cannot self-heal via a normal
`analyze` run. None of the 4 children's own proof surfaces (grep + `cargo
test`, all self-contained) depend on GitNexus output, so this does not
block any feasibility-matrix row. It DOES mean: when a child later reaches
`executing` and the per-symbol `impact()` MUST-run gate applies
(`AGENTS.md`), treat its result as weak evidence per the degraded branch of
`CLAUDE.md`'s capability gate, and cross-check with a plain `rg`/`grep` for
the symbol's real call sites before trusting a suspiciously clean/empty
`impact()` result.

## Approach

`herdr-plugin` today (`herdr-plugin/src/`) is a small, well-factored Rust
TUI (~2650 LOC total): `app.rs` (domain state, no ratatui types),
`ui.rs` (render + terminal lifecycle + `poll_event`), `fgos.rs` (CLI
subprocess source, `parse_triage`/`parse_doing`), `ports.rs` (`WorkItemSource`/
`PaneRegistry`/`PaneOrchestrator`/`TerminalUi` traits, `UiEvent` enum),
`main.rs` (event loop, composition root). The hexagonal split (`tsk-3t9`)
already isolates ratatui from the domain — this plan works with that
boundary, not around it.

**Rejected alternative:** one single PR touching all 9 decisions at once.
Rejected because the "existing covered behavior" flag is real — `tsk-1eu`'s
panel-focus tests and the modal's `work_item_enter_opens_detail_modal_
and_pick_only_fires_on_second_edit`-style test all need to change, and a
single giant diff makes it hard to tell which behavior change broke which
test. Splitting into 4 pieces, each provable independently against
`cargo test`, keeps that traceable.

**Risk map:**

| Piece | Risk | Why | Proof point (for `fgos-coding-validating`) |
|---|---|---|---|
| Left panel (tabs/columns/sort) | standard | Changes `TriageRow`'s shape and the existing "Work items" table's sort order — read by existing render-smoke test | `cargo test --manifest-path herdr-plugin/Cargo.toml` green, including a new priority-ASC-order assertion |
| Right side (3 boxes) | standard | New data-fetch paths (`NEED ANSWER`/`AFTER DELIVER` need new `fgos.rs` filters; `MERGE LIST` shells a second CLI verb, `fgos merge list`) | Each box's fetch function unit-tested against a fixture JSON matching real `fgos merge list --json`'s shape (already captured this session) |
| Detail modal buttons | light | Additive: one more button next to the existing Pick button, same modal | `cargo test` covering the disabled-when-not-clarify case |
| Mouse + hit-test | standard | No precedent in this codebase; `Event::Mouse` currently entirely unhandled (`ui.rs:71`) — real new event-loop path | `cargo test` covering a click-inside-`Rect` and click-outside-`Rect` case for both buttons |

**Files touched** (declared per child below as `--footprint`; overlap
across children on `ui.rs`/`app.rs`/`main.rs` is expected and intentional
— they are processed sequentially, one `doing` at a time, not in
parallel, so `footprintOverlapAmong`'s parallel-collision warning does not
apply here):

- `herdr-plugin/src/fgos.rs` — `TriageRow` field extension (A), new
  `NEED ANSWER`/`AFTER DELIVER`/`MERGE LIST` fetch functions (B)
- `herdr-plugin/src/app.rs` — `WorkItem` field extension + tab/filter
  state (A), new `NeedAnswerRow`/`MergeListRow`/`AfterDeliverRow` structs
  (B), button `Rect` storage (D)
- `herdr-plugin/src/ui.rs` — `Tabs` widget, 7-column table, `/` filter
  input (A); 3 bordered boxes (B); second modal button (C); mouse capture
  + `Event::Mouse` handling (D)
- `herdr-plugin/src/ports.rs` — `WorkItemSource` trait gains fetch methods
  for the 3 boxes (B); `UiEvent` gains a `Discover` variant (C)
- `herdr-plugin/src/main.rs` — composition root wiring for the new fetch
  calls (B), `UiEvent::Discover` dispatch arm (C), mouse-capture
  init/teardown (D)

`fgos graph --json` confirms `tsk-1d5` is currently an isolated,
size-1 component (no deps, not on `criticalPath`, not in `topUnblock`) —
there is no existing backlog signal to order the split against; the order
below is decided from real code dependency instead (D depends on C's
buttons existing to hit-test against; A and B are mutually independent
but share files, so still sequenced rather than parallelized).

## Shape — 4 children, sequential

1. **Left panel: tabs + columns + priority sort + filter** (D1, D2, D7, D8)
2. **Right side: 3 action-queue boxes** (D3, D9)
3. **Detail modal: Pick + Discover buttons** (D4)
4. **Mouse support + hit-test** (D5) — depends on piece 3's buttons existing

D6 (stay on ratatui, color reference from beads_viewer/taskwarrior-tui/
gitui/bottom) is not its own piece — it's styling guidance every piece
above applies while building its own region, not a separate diff that
would just re-touch lines the other 4 children already own.

## Assumptions (not covered by CONTEXT.md, none material enough to send back to clarify)

- Exact keybindings for tab-switching and cycling focus across the now-5
  focusable regions (left panel + 3 boxes + implicit filter-input mode)
  are the implementer's choice — no product behavior in `CONTEXT.md` hangs
  on the literal key, only on which action happens (D8/D9 already lock
  those). `[`/`]` for tabs and a numbered or `Tab`-cycle for box focus are
  both consistent with the vim/gitui convention already chosen for `/`.
- The proposed `[ERR]`/`[ASK]`/`[RUN]`/`[MRG]`/`[RTR]`/`[POL]` tag/color
  table from research is a default, not a locked decision — piece 2 may
  adjust it during implementation without a clarify round-trip.

## Handoff

Once this plan is approved, `fgos-coding-validating` runs the reality check
before `decompose` moves to `executing` for the anchoring root
(`tsk-1d5` itself becomes anchored by these 4 children once they exist —
it will not be directly executable again until every child reaches
`delivered`/`retrospective`/`cleanup`/`done`/`wontfix`).
