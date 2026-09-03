---
framework: diataxis
mode: how-to
---
# Scaffold and link a herdr plugin

A recipe for standing up the first working slice of a herdr plugin
(manifest + a `[[panes]]` binary) and proving it registers with a real
local herdr install — grounded in `tsk-19y-1`, the first plugin manifest
ever authored in this repo.

## 1. Put the crate at the repo top level, not under `plugins/`

`plugins/` is Claude-Code-reserved in this repo. The plugin crate path
was moved out mid-planning for exactly this reason:

> "move plugin crate path out of plugins/ (Claude-Code-reserved) to
> top-level herdr-plugin/" (`docs/history/herdr-fgos-tui-plugin/plan.md`,
> updated by commit `68309ff`)

So a Rust herdr-plugin crate lives at `<repo-root>/herdr-plugin/`, a
sibling of `plugins/`, `src/`, `docs/` — not nested inside `plugins/`.

## 2. First slice: mock data only, no external polling

When a dashboard-style plugin also needs to consume this repo's own CLI
(`fgos list --json` / `fgos triage --json`), don't wire that in the same
slice that proves the plugin plumbing works. The locked decision for this
item split it explicitly:

> "First deliverable is a mock/static UI — a rendered dashboard with
> fake/placeholder rows, proving only that the herdr-plugin plumbing works
> end to end (manifest, `herdr plugin link`, pane launch, rendering).
> Wiring real fgOS data ... is explicitly a separate, later piece — not
> bundled into the first slice." (`docs/history/herdr-fgos-tui-plugin/
> CONTEXT.md`, D6)

Concretely: the binary renders `App::mock()`'s hardcoded rows and makes
no `fgos`/CLI subprocess call at all in this slice.

## 3. Match the host application's own dependency versions

Don't guess a TUI library version — read them off the actual herdr binary
this plugin has to run inside, if it's vendored locally:

```bash
grep -n "ratatui\|crossterm" upstreams/herdr/Cargo.toml
# ratatui = { version = "0.30", features = ["unstable-rendered-line-info"] }
# crossterm = "0.29"
```

Pin the plugin crate's own `Cargo.toml` to the same versions.

## 4. Give the crate both a lib and a bin target

A rendering smoke test (step 6) needs to `use` the crate's `ui`/`app`
modules from an integration test, which can only import a **library**
target, not a binary. Split `main.rs`'s logic into `lib.rs` + modules, and
add `[lib]` alongside `[[bin]]` in `Cargo.toml`:

```toml
[lib]
name = "herdr_fgos"
path = "src/lib.rs"

[[bin]]
name = "herdr-fgos"
path = "src/main.rs"
```

`main.rs` then does `use herdr_fgos::app::App;` / `use herdr_fgos::ui::draw;`
the same way `tests/render_smoke.rs` does.

## 5. Watch the `Backend::Error` vs `io::Error` mismatch

`ratatui::Terminal::draw` returns `Result<_, B::Error>`, which is generic
per backend. A function typed `-> io::Result<()>` cannot `?`-propagate that
error unless the backend's `Error` type is pinned to `io::Error`:

```rust
fn run<B: ratatui::backend::Backend<Error = io::Error>>(
    terminal: &mut Terminal<B>,
    app: &App,
) -> io::Result<()> {
```

Both `CrosstermBackend` and ratatui's own `TestBackend` use `io::Error`,
so this bound is satisfiable by both the real terminal path and the test
path without a second code path.

## 6. Prove the render doesn't panic with `TestBackend`

No live terminal needed for the plumbing proof — render against a fixture
backend from an integration test:

```rust
use ratatui::backend::TestBackend;
use ratatui::Terminal;
use herdr_fgos::app::App;
use herdr_fgos::ui::draw;

#[test]
fn dashboard_renders_without_panicking() {
    let backend = TestBackend::new(80, 24);
    let mut terminal = Terminal::new(backend).expect("terminal init");
    let app = App::mock();
    terminal.draw(|frame| draw(frame, &app)).expect("draw should not panic");
}
```

## 7. Write the manifest's `[[panes]]` command as `sh -c "$HERDR_PLUGIN_ROOT/..."`, never a bare relative path

`herdr plugin list --json` accepting the manifest is not proof the pane
command actually spawns. `herdr plugin link` + `list --json` only proves
the *manifest parses*; `herdr plugin pane open` is the only real proof the
command spawns. A bare relative `argv[0]` fails there even though link/list
looked fine:

```
$ herdr plugin pane open --plugin fgos.dashboard --entrypoint dashboard
{"error":{"code":"plugin_pane_open_failed","message":"Unable to spawn
target/release/herdr-fgos because:\nNo viable candidates found in PATH
\"...\""}}
```

Cause: herdr's pane spawner (`portable_pty`'s `CommandBuilder`) resolves
`argv[0]` against `PATH` before the child's `cwd` is applied — a bare
relative path like `target/release/herdr-fgos` isn't a `PATH` entry and
isn't resolved relative to the plugin directory the way later `argv`
elements or an interpreter's own relative-path handling would be.

The working pattern, confirmed against a real already-linked plugin on
this machine (`persiyanov.reviewr`'s pane entry) — wrap in `sh -c` and use
the `HERDR_PLUGIN_ROOT` env var herdr injects into every plugin command
(absolute, no relative-path ambiguity at all):

```toml
id = "fgos.dashboard"
name = "fgOS Dashboard"
version = "0.1.0"
min_herdr_version = "0.7.0"
description = "fgOS work-item and in-process task cockpit inside a herdr pane"
platforms = ["linux", "macos"]

[[panes]]
id = "dashboard"
title = "fgOS Dashboard"
placement = "overlay"
command = ["sh", "-c", "exec \"$HERDR_PLUGIN_ROOT/target/release/herdr-fgos\""]
```

`sh` itself resolves via `PATH` (always found), and `$HERDR_PLUGIN_ROOT`
is an absolute path, so there is no cwd-relative resolution left to get
wrong.

## 8. Build, test, link, then actually open the pane

```bash
cargo build --release --manifest-path herdr-plugin/Cargo.toml
cargo test --manifest-path herdr-plugin/Cargo.toml
herdr plugin link "$(pwd)/herdr-plugin"
herdr plugin list --json   # confirm the plugin_id shows up, "enabled": true
herdr plugin pane open --plugin fgos.dashboard --entrypoint dashboard
```

`herdr plugin link` (not `install`) is the right verb for a plugin that
lives in this repo's own working tree — `install` is for remote/GitHub
sources. `herdr plugin list --json` only proves the manifest parsed and
registered; it does not prove the pane's command actually spawns (see
step 7) — `pane open` is the step that does, and it must be run inside a
live herdr session (workspace/tab context), not a bare shell.

If the link was only a one-time smoke check (not something the running
session needs to keep registered), `herdr plugin unlink <id>` cleans it
back up — the linked/enabled state itself isn't a build artifact and
isn't meant to be a byproduct of running tests.

## Ignore the build output directory

Rust's `target/` isn't covered by a generic top-level ignore rule in a
JS-first repo. Add it explicitly once the first Rust crate lands:

```gitignore
# Rust build output
/herdr-plugin/target/
```

`Cargo.lock` is still committed for a binary crate — only `target/` is
ignored.
