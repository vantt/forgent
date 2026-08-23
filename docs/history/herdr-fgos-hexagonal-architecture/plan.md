# herdr-fgos dashboard hexagonal architecture — plan

Item: `tsk-3t9`. Decisions: `docs/history/herdr-fgos-hexagonal-architecture/CONTEXT.md` (D1-D3).

## Mode

**small.**

Flags counted (of: auth, authorization, data model, audit/security,
external systems, public contracts, cross-platform, existing covered
behavior, weak proof around the area, multi-domain):

- **existing covered behavior** — yes. 9 tests already cover the code this
  item restructures (`fgos.rs` 2, `pick.rs` 6, `tests/render_smoke.rs` 1)
  and must keep passing unchanged (D3).
- everything else — no. No auth/data-model/audit/public-contract/
  cross-platform/multi-domain surface; "external systems" (fgOS CLI, herdr
  CLI) are existing integration points being wrapped, not new ones; no
  weak-proof area — the touched logic is already well-tested.

1 flag → **small**: a few files, no gray areas left (D1-D3 already lock
every product decision), a short plan is enough — not `standard`, because
there is no genuine risk map beyond "did the behavior stay the same," and
not `tiny`, because 6 files move in a coordinated shape, not one direct
edit.

## Approach

Cut the two seams D1 locked, purify the domain per D2, keep every existing
adapter's tested logic body unchanged (only wrapped behind a trait impl) so
D3's structural-only verify holds.

**Chosen path**: introduce one new file, `herdr-plugin/src/ports.rs`,
declaring three domain-owned traits; make each existing integration file an
adapter implementing one port; make `main.rs` the composition root that
constructs concrete adapters and drives the domain only through trait
methods.

**Rejected alternative**: collapse all three concerns behind a single
`Terminal` port (one trait covering both herdr-pane-orchestration and
rendering) — rejected by D1 itself, which locked two independent seams
because they are genuinely independent (a pane-multiplexer swap and a
TUI-library swap are unrelated changes).

**Rejected alternative**: put port traits inside `app.rs` alongside the
domain structs — rejected because `app.rs` should describe only domain
*data and behavior* (D2); trait *contracts* the domain depends on but does
not implement belong in their own file so `app.rs`'s import list stays the
proof that D2 held (zero `ratatui`/`std::process` imports in `app.rs` after
this item).

### `fgos graph` input

```
fgos graph --what-if tsk-3t9 --json
```
→ `unblocksTransitive: 1`, `newlyReady: ["tsk-4vo"]`. Only `tsk-4vo` formally
depends on this item today (confirmed in CONTEXT.md's deferred section —
whether `tsk-4zo`/`tsk-1q3`/`tsk-67u`/`tsk-1eu` should also depend on it is
left to whoever plans those items). This does not change the file order
below — with only one piece of work and no split, `fgos graph`'s
`criticalPath` has nothing to arbitrate between.

### Files touched (all in `herdr-plugin/`)

| File | Change |
|---|---|
| `src/ports.rs` (new) | 3 traits: `WorkItemSource` (fetch triage/doing rows), `PaneOrchestrator` (open a pick pane for an id), `TerminalUi` (init/draw/poll-event/teardown, using a domain-level `UiEvent` enum — `Up`/`Down`/`Pick`/`Quit` — never a `crossterm`/`ratatui` type in the signature). |
| `src/app.rs` | D2: `App.selected` becomes a plain `Option<usize>`; `select_next`/`select_previous`/`selected_id`/`clamp_selection` operate on it directly. Drop the `ratatui::widgets::ListState` import. **Also drop `use crate::fgos;`** (currently `app.rs:5`) — `refresh_from_fgos(&mut self, root: &Path)` (currently `app.rs:120`, calling `fgos::fetch_triage(root)`/`fgos::fetch_doing(root)` directly) changes its signature to `refresh_from_fgos(&mut self, source: &dyn ports::WorkItemSource)`, calling the port's methods instead of the concrete module. Only the composition root (`main.rs`) constructs the concrete `FgosCliSource` and owns `root: &Path`; `app.rs` never imports `crate::fgos`, `ratatui`, or `std::process` after this item — that empty import list on `app.rs` is the literal proof D1's WorkItemSource port is actually exercised by the domain, not just declared. |
| `src/fgos.rs` | Wrap existing `fetch_triage`/`fetch_doing`/`parse_triage`/`parse_doing`/`repo_root`/`run_fgos` bodies, unchanged, inside an adapter struct (e.g. `FgosCliSource`) that `impl WorkItemSource for FgosCliSource`. Existing 2 tests keep testing the free `parse_*` functions directly — no test rewrite needed. |
| `src/pick.rs` | Wrap existing `open_pick_pane`/`split_argv`/`run_argv`/`parse_split_pane_id`/`herdr_bin` bodies, unchanged, inside an adapter struct (e.g. `HerdrPaneAdapter`) that `impl PaneOrchestrator for HerdrPaneAdapter`. Existing 6 tests keep testing the free functions directly — no test rewrite needed. |
| `src/ui.rs` | Becomes the `TerminalUi` port's ratatui-backed adapter: owns the `Terminal<CrosstermBackend>` and raw-mode/alternate-screen lifecycle (moved from `main.rs`), translates crossterm `Event`/`KeyCode` into `UiEvent`, and — this is where D2's index meets D1's render seam — converts `App.selected: Option<usize>` into ratatui's `ListState` only inside `draw()`, never storing a `ListState` anywhere outside this file. `draw(frame, app)`'s existing signature and body stay the reference for the widget layout; `tests/render_smoke.rs` must keep compiling and passing against it unchanged. |
| `src/main.rs` | Becomes the composition root: construct `FgosCliSource` (holding `root: PathBuf`, resolved via `fgos::repo_root()` same as today), `HerdrPaneAdapter`, and the ratatui `TerminalUi` adapter; `run()`'s loop calls `app.refresh_from_fgos(&fgos_source)` (matching `app.rs`'s new signature above), `TerminalUi::poll_event`/`draw`, and `PaneOrchestrator::open_pick_pane` — no direct `crossterm`/`ratatui`/`std::process::Command` call left in this file. |
| `src/lib.rs` | Add `pub mod ports;`. |

### Order

1. `ports.rs` — the trait contracts everything else implements or depends
   on; nothing else can compile against a port until it exists.
2. `app.rs` (D2) — independent of the adapter files; unblocks `ui.rs`'s
   rewrite (D2's index is what `ui.rs`'s `draw()` converts to `ListState`).
3. `fgos.rs` adapter wrap — low risk, existing tests already cover the
   wrapped logic untouched.
4. `pick.rs` adapter wrap — low risk, same reasoning as step 3.
5. `ui.rs` + `main.rs` together — highest-complexity step (event-loop
   rewrite, `Terminal` lifecycle relocation), done last because it depends
   on both `ports.rs` (step 1) and `app.rs`'s index (step 2) already
   landing.

## Risk map

| Component | How risky | What proves it (→ `fgos-coding-validating`) |
|---|---|---|
| `app.rs` selection index (D2) | Low — mechanical type swap, but no automated test exists today for `select_next`/`select_previous`/`selected_id` (D3 does not require adding one) | `cargo test --manifest-path herdr-plugin/Cargo.toml` compiles and the existing 9 tests still pass; a manual smoke check (arrow keys move selection, wraps at both ends) since this path has no automated coverage |
| `fgos.rs`/`pick.rs` adapter wrap | Low — existing 2+6 tests exercise the wrapped free functions directly, trait impl is a thin pass-through | `cargo test` — same 8 tests pass unchanged, no test file edits needed |
| `ui.rs`/`main.rs` `TerminalUi` port (D1) | Medium — event-loop and terminal-lifecycle code moves and is re-expressed through `UiEvent`; behavior must stay byte-for-byte identical (same keys, same layout, same poll cadence) | `tests/render_smoke.rs` keeps passing (draw() unchanged); `cargo build --release` succeeds; one manual run of the built binary confirming ↑/↓/Enter/q/Ctrl-C behave identically to before |

## Split

No split. One honest piece of work — D1-D3 already closed every gray area,
and the file list above is a single coordinated refactor, not several
independently shippable pieces.

## Verify

Per D3, structural-only:

```
cargo test --manifest-path herdr-plugin/Cargo.toml && cargo build --release --manifest-path herdr-plugin/Cargo.toml
```

Same command already used by `tsk-19y-1/2/3`. All 9 existing tests
(`fgos.rs` ×2, `pick.rs` ×6, `tests/render_smoke.rs` ×1) must pass
unchanged; no new test is required by this item.
