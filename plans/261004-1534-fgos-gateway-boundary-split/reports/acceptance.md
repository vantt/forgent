# Acceptance: fgos gateway boundary split

Branch `refactor/fgos-gateway-boundary`. Date 2026-10-04. impact-analysis: degraded (no GitNexus MCP in this run, `rg` used).

## Final shape

| Component | Path | Crate / binary |
| --- | --- | --- |
| fgos gateway | `apps/fgos-gateway/` | `fgos-gateway` / `fgos-gateway` (no `gateway` argument) |
| herdr plugin | `herdr-dashboard/` (manifest `herdr-plugin.toml`) | `herdr-dashboard` / `herdr-dashboard` |
| shared | `packages/herdr-fgos-common/rust/` | lib `herdr-fgos-common` |

Shared crate holds `fgos.rs`, `settings.rs` and a `ports.rs` with the `WorkItemSource` trait only. The name states that both sides use it.

## Deviations from the plan

1. `ports.rs` could not move whole. `VerbGateway` returns `gateway::GatewayError`, `TerminalUi` uses `app::App`, `PaneRegistry` uses `pane_scan`, and `fgos.rs` implements `WorkItemSource`. Traits moved verbatim: `WorkItemSource` to the shared crate, `VerbGateway` to `apps/fgos-gateway/src/ports.rs`, the rest stays in the dashboard.
2. Gateway and dashboard stay outside the root Cargo workspace (own `Cargo.lock` and `target/`), the shape `herdr-plugin` already had. herdr loads the plugin from `$HERDR_PLUGIN_ROOT/target/release/`, and `.gitignore` already separates their `target/`. Only the shared crate is a workspace member. Gateway and dashboard are built and tested with `--manifest-path`.
3. The `herdr_plugin` field in the observe scorecard `LocBreakdown` is a serialized contract and was left alone; only the path it counts changed to `herdr-dashboard/`.
4. The localStorage key `herdr-gateway-token` in the web client was left alone (renaming would sign users out). The guard allows it.
5. `herdr-fgos-common` contains the substring `herdr-fgos`, so the plan's literal `rg` also matches the shared crate name; the guard excludes it.
6. Historical records were not rewritten: `docs/knowledge/**`, `docs/history/**`, `docs/platform/**/verification/**` logs, three `docs/explanation/*` post-mortems, `test/fixtures/**` run results, CHANGELOG history.

## Only-move check

`git diff -M -U0 main..HEAD -- '*.rs'` with `use`/`mod` lines removed leaves only:

- path or name tokens in comments and strings (`herdr-plugin` to `herdr-dashboard` or `apps/fgos-gateway`, test temp-dir prefix, the workspace-isolation test now reads `../../Cargo.toml` and checks `apps/fgos-gateway`);
- `crate::fgos::` and `crate::settings::` replaced by `herdr_fgos_common::...` and `herdr_fgos::` by `herdr_dashboard::` in paths;
- the removed `gateway` argument branch in the plugin `main.rs` and the new 8-line `apps/fgos-gateway/src/main.rs`;
- the `WorkItemSource` and `VerbGateway` trait definitions, text unchanged, in their new files.

No logic line changed.

## Re-register the plugin with herdr (owner action, after merge and build)

```sh
cd /home/vantt/projects/forgentX/herdr-dashboard && cargo build --release
herdr plugin unlink fgos.dashboard
herdr plugin link /home/vantt/projects/forgentX/herdr-dashboard
herdr plugin list   # fgos.dashboard must show local:.../herdr-dashboard
```

The plugin id in the manifest stays `fgos.dashboard`. `~/.config/herdr/plugins.json` was not edited. Until this runs, new herdr panes cannot start the dashboard TUI.

## Follow-ups noticed, not done

- `ports.rs` in the dashboard still mixes terminal ports with pane ports; fine for now.
- Finer `packages/*` split from `repo-layout-vision.md` remains open (status note added there).
