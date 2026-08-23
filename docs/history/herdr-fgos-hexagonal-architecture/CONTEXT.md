# herdr-fgos dashboard hexagonal architecture — decision record

Item: `tsk-3t9` — "Herdr plugin: ap dung clean-code/hexagonal architecture triet
de cho dashboard va cac component lien quan".

## Feature boundary

A behavior-preserving refactor of the already-built herdr-plugin dashboard
(`herdr-plugin/src/{app,fgos,pick,ui,main}.rs`, shipped by `tsk-19y-1/2/3`)
into a hexagonal (ports & adapters) shape: separate the domain (work-item
list, selection, in-process list, pick status) from two concrete
integration points that can each change independently —

- (a) the fgOS data source (`fgos.rs`'s CLI-shelling `fetch_triage`/`fetch_doing`);
- (b) the terminal-lib layer, split into two swappable seams: herdr pane
  orchestration (`pick.rs`'s `Command::new(herdr_bin)` calls) and the TUI
  render framework (`ui.rs`/`main.rs`'s ratatui/crossterm usage).

This item does the seam-cutting only. It does **not** implement any of the
not-yet-built sibling features that will build against these seams later
(`tsk-4zo` pane tracking, `tsk-1q3` launch-agent/layout, `tsk-67u`/`tsk-1eu`
click handlers) — those items are still `stage: clarify`/`todo` today, so
there is no code of theirs yet to refactor. The task's own description names
them only to explain *why* this seam-cutting is being prioritized first
("cac task UI khac se dung tren cac diem noi nay").

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Terminal-lib port scope = **both** seams get their own port/trait: herdr pane-orchestration (today `pick.rs`'s direct `Command::new(herdr_bin)` calls) and the TUI render framework (today `ui.rs`+`main.rs`'s direct ratatui/crossterm usage). Two independent adapters, not one combined "terminal" port. |
| D2 | Domain (`App`, `app.rs`) becomes UI-framework-agnostic. `App.selected` drops its `ratatui::widgets::ListState` field in favor of a plain index (e.g. `Option<usize>`); the render adapter (`ui.rs`) owns converting that index to/from ratatui's `ListState` at draw time. No ratatui type may appear in `app.rs` after this refactor. |
| D3 | Verify = structural-only. `cargo test --manifest-path herdr-plugin/Cargo.toml && cargo build --release --manifest-path herdr-plugin/Cargo.toml` (same convention as `tsk-19y-1/2/3`) — the 5 existing tests (`fgos.rs`'s 2, `pick.rs`'s 5 minus overlap — see scout evidence) must keep passing unchanged, byte-for-byte same external behavior (same CLI subprocess calls, same herdr pane commands, same rendered layout). No new port-boundary/fake-adapter test is required by this item. |

## Pinned terms

- **"Port"** — a Rust trait defined by the domain, expressing what it needs
  from the outside world (e.g. "give me the current work-item rows",
  "open a pane and run a command", "render this state").
- **"Adapter"** — a concrete implementation of a port against one real
  external system: the fgOS CLI adapter (existing `fgos.rs` logic), the
  herdr pane-orchestration adapter (existing `pick.rs` logic), the ratatui
  render adapter (existing `ui.rs`/`main.rs` logic).
- **"Domain"** — `app.rs`'s `App`/`WorkItem`/`InProcessTask` plus their
  behavior (`select_next`/`select_previous`/`selected_id`/`clamp_selection`),
  after D2 with zero ratatui (or herdr-CLI) types in it.

## Scout evidence

- `herdr-plugin/src/app.rs:3,24` — `App.selected: ratatui::widgets::ListState`,
  a UI-framework type stored directly on the domain struct (the concrete
  violation motivating D2).
- `herdr-plugin/src/app.rs:120-150` — `refresh_from_fgos` calls
  `fgos::fetch_triage`/`fgos::fetch_doing` directly (concrete module call,
  no trait indirection) — the (a) seam this item formalizes into a port.
- `herdr-plugin/src/pick.rs:87-107` — `open_pick_pane` calls
  `Command::new(herdr_bin)` directly twice (pane split, pane run) — the
  herdr-orchestration half of the (b) seam (D1).
- `herdr-plugin/src/ui.rs:1-73` — `draw(frame, app)` takes ratatui's
  `Frame` and reads `app.selected` straight into
  `frame.render_stateful_widget` — the render-framework half of the (b)
  seam (D1), and the direct consumer of D2's `ListState` leak.
- `herdr-plugin/src/main.rs:20-43` — wires `crossterm`/`ratatui::Terminal`
  setup directly in `main()`, alongside `fgos::repo_root()` and
  `pick::herdr_bin()` — no dependency-injection boundary today between
  domain, data adapter, and terminal adapters.
- `herdr-plugin/src/fgos.rs` and `herdr-plugin/src/pick.rs` test modules —
  2 tests in `fgos.rs` (`parse_triage_preserves_rank_impact_order`,
  `parse_doing_keeps_only_doing_status`) and 5 tests in `pick.rs`
  (`split_argv_targets_the_calling_pane`,
  `run_argv_matches_exact_pane_run_shape`,
  `run_argv_rejects_an_id_that_could_break_out_of_the_typed_command`,
  `run_argv_rejects_ids_fgos_itself_would_reject`,
  `parse_split_pane_id_reads_the_real_herdr_response_shape`,
  `parse_split_pane_id_returns_none_on_unexpected_shape`) — all already
  adapter-level (parsing/argv-building), independent of any live process;
  D3 requires these keep passing unchanged.
- `docs/history/herdr-fgos-tui-plugin/CONTEXT.md` — `tsk-19y`'s own decision
  record: D1-D6 that shaped the dashboard this item now refactors (impact
  sort, `status: doing` in-process list, pick action, mock-first delivery).
  This item does not revisit any of those; it only restructures the code
  that implements them.
- `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` — locked rule that
  only same-process Node code may link the fgOS core lib directly; every
  other consumer (this Rust binary included) talks to fgOS only through the
  CLI. The (a) fgOS-data-source port/adapter in this item implements that
  boundary in Rust terms, it does not renegotiate it.

## Deferred (out of scope, noted not absorbed)

- Whether `tsk-4zo`/`tsk-1q3`/`tsk-67u`/`tsk-1eu` get their `deps` updated
  to require `tsk-3t9` (so they're forced to build on the new ports) —
  a dependency-graph/shaping call, `fgos-coding-planning`'s job, not decided here.
  Today only `tsk-4vo` formally depends on `tsk-3t9`.
- Exact module/file layout for the new ports (e.g. a new `ports.rs` vs.
  trait definitions colocated with the domain in `app.rs`, an `adapters/`
  subdirectory vs. keeping `fgos.rs`/`pick.rs`/`ui.rs` as the adapter files
  renamed in place) — implementation detail for planning.
- Dependency-injection wiring mechanism in `main.rs` (trait objects vs.
  generics) — implementation detail for planning.
