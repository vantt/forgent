//! Guarantees `static/` exists before `RustEmbed`'s derive macro scans it
//! (`src/gateway.rs`'s `WebAssets`), so `cargo build`/`test`/`clippy` never
//! fail on a fresh checkout where `npm run bundle` (herdr-plugin/web/)
//! hasn't produced the web UI yet -- `static/` is gitignored. Minimal port
//! of the reference implementation herdr-gateway's own `build.rs`: only the
//! directory guarantee, per D14 of docs/history/herdr-web-dashboard-plan-
//! realignment/CONTEXT.md -- that decision never asked for the sibling
//! fingerprint/git-sha logic herdr-gateway's own build.rs also carries.

fn main() {
    std::fs::create_dir_all("static").expect("create static/ dir for embedding");
}
