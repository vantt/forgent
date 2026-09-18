# Cargo.toml package info

Root `Cargo.toml` is a workspace manifest (no `[package]` section). Version is declared once in `[workspace.package]` and inherited by members.

- **Package name**: `mdview` (from `crates/mdview/Cargo.toml`, the workspace's binary crate)
- **Version**: `0.7.5` (from `[workspace.package].version` in root `Cargo.toml`, inherited via `version.workspace = true`)

Workspace members: `crates/mdview-core`, `crates/mdview` (both share version 0.7.5). `crates/mdview-desktop` is excluded from the workspace.
