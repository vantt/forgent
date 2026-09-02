# Cargo.toml name/version verification

**Verdict: CONFIRMED** — requester's (op_004) report is correct.

- Checked: `/home/vantt/projects/mdview/Cargo.toml` (workspace root) and `crates/mdview/Cargo.toml`
- Root `[workspace.package]`: `version = "0.7.5"`
- `crates/mdview/Cargo.toml`: `[package] name = "mdview"`, `version.workspace = true` (inherits 0.7.5)
- Matches recent commit history (`chore: bump version to 0.7.5` at HEAD)

**Result: name = `mdview`, version = `0.7.5`.** No discrepancy found.

No unresolved questions.
