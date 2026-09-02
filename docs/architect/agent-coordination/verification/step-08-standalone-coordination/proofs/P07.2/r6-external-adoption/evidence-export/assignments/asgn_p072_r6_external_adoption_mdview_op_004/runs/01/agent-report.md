# Cargo package check

- Package name: `mdview`
- Version: `0.7.5`

Source: workspace root `Cargo.toml` sets `[workspace.package] version = "0.7.5"`; `crates/mdview/Cargo.toml` has `name = "mdview"` and inherits `version.workspace = true`. (`crates/mdview-core` inherits the same workspace version.)

## Unresolved
- Could not find an addressable agent/session named "consultant" among current peers, so no double-check request was sent. If a specific peer/session should receive this, provide its session name and I'll send the check request.
