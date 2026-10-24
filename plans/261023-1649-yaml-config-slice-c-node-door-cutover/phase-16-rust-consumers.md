# Phase 16: Rust readers move onto `fgos-config`

Depends on 05 (and D 14). Suggested executor: sonnet. Caps: 60 lines gross added across the four crates (deletions counted apart). Four independent sub-steps, file-disjoint, run in parallel. Gate G-C3 if dependency growth passes D5's threshold.

## Files it may touch

`apps/fgos-gateway/src/{gateway,cf_access}.rs` (+ Cargo files D 14 already touched), `packages/herdr-fgos-common/rust/{Cargo.toml,src/settings.rs}`, `herdr-dashboard/{Cargo.toml,Cargo.lock,src/main.rs}`, `packages/work-state/rust/{Cargo.toml,src/lib.rs}`, root `Cargo.lock`.

## Design

- **Gateway** (`gateway.rs:143` `load_gateway_config`): token from the token file (D 14); port, bind, `cfAccessTeamDomain`, `cfAccessAud` from `fgos_config::machine::snapshot` (machine view, phase 05) with the unconfined class; the "both cf-access fields or neither" rule stays in the gateway (the section owner's cross-field rule). `NotFound`/`Parse` variants and the texts naming `~/.fgos/config.json` (`:102`, `:521`, `cf_access.rs:16`) are rewritten; a missing global file is an empty source, not an error.
- **herdr-fgos-common** (`settings.rs:78,100`): `read_settings(root)` and `read_web_dashboard_settings(root)` read `herdrOrchestrator` and `herdrWebDashboard` from `fgos_config::snapshot` with `project_root = trusted_root = root` (the caller already passes the main checkout) and keep their documented outcomes on a refusal: all toggles off, and static serving on (C7). The pure `parse_settings`/`parse_web_dashboard_settings` over raw text and their tests go with the raw-text read (behaviour removed; the refusal outcome is tested through the new function with a broken file).
- **herdr-dashboard** (`main.rs:565`): the duplicate `read_herdr_orchestrator_toggles` is deleted and the dashboard calls `herdr_fgos_common::settings::read_settings` (the "leftover duplicate" of spec section 12); its tests at `:1697-1797` write YAML fixtures.
- **work-state** (`lib.rs:72` `read_shared_level`): `gateBypass.level` from the snapshot; when its provenance is `standard`, fall back to `.fgos/gate-bypass.json` exactly as before (C8); invalid or refused -> `off`.
- One process-wide bundled context (`machine::context`, phase 05) so a per-tick read does not re-parse the bundle.

## Steps

1. Merge `origin/main`; measure D5-style: `cargo tree -e normal | wc -l` and release build time for `herdr-dashboard` and `apps/fgos-gateway` before and after; if growth passes the threshold post G-C3 and stop that sub-step.
2. Edit each crate; its own tests first (`cargo test --manifest-path <crate>/Cargo.toml --jobs 4`, one at a time, `free -g` first), then `cargo test -p work-state -p herdr-fgos-common --jobs 4`.
3. `rg -n "config\.json" apps packages herdr-dashboard --glob '*.rs'` finds only the crate's own constants and fixtures.

## Owning proofs

Each crate's unit tests (outcomes per C7); legacy fallback: a `work-state` case and the Node twin of phase 12; machine view: phase 05.

## Risk / rollback

Risks: dependency growth (M x L, G-C3); the dashboard is a separately locked plugin (build once in a scratch target). Rollback: per-crate revert.
