# Phase 14: The gateway reads the token file

> **Moved to Slice C** (owner decision 2026-10-24 10:00, option B). Not built in Slice D; this file is the detailed spec Slice C's plan links to. Slice C's plan says where it lands and which numbers (caps, ownership order) changed. Read "Slice D" below as "the slice that executes this phase".

Depends on 04 (token rules). Independent of 05-13; may land in parallel with them. Suggested executor: haiku (small edit) with a sonnet check of the dependency cost. Cap: 60 lines in `gateway.rs`.

## Context

Today `load_gateway_config` (`apps/fgos-gateway/src/gateway.rs:136-173`) reads `~/.fgos/config.json`, takes `gateway.port`, `bind`, the cf-access pair and `gateway.token`, and refuses to start without a non-empty token (`MissingToken`, `:110`, `:152-154`). A confined worker can read that file today (`hostRead: allow`, backlog p-a189ff31) and the gateway binds `0.0.0.0` by design, so the token leaves the file. The gateway is outside the workspace (own `Cargo.lock`) and already links `fgos-yaml-doc` by path.

## Files it may touch

`apps/fgos-gateway/src/gateway.rs`, `apps/fgos-gateway/Cargo.toml` and `Cargo.lock` (path dependency on `fgos-config`, D5), the gateway's own tests for `load_gateway_config` (same file's test module or `apps/fgos-gateway/src` tests: phase 00 finds them), and the user-facing strings in `gateway.rs:112` and `:521` that name `~/.fgos/config.json`'s `gateway.token`.

## Design

- `GlobalConfigFile.gateway.token` stops being read (the field is removed from the deserialisation struct: a stray `token` key is then ignored by serde and reported by doctor as `config-key-in-wrong-file`). Port, bind and cf-access still come from `~/.fgos/config.json` (global conversion is not in this slice, D24).
- The token comes from `fgos_config::machine::token::read(&home.join(".fgos"))` (D5, D6): refuses a symlink, a non-regular file, a mode wider than 0600 or a malformed line with `config-token-invalid`; the gateway maps every refusal to a new `GatewayConfigError::Token(String)` whose text names the file and the cause (`mode`, `shape`, `missing`) and says "run `fgos doctor --fix`" (the fix creates a missing file; the mode fix is the doctor's chmod). The token value never reaches an error or log (the crate's `Secret` has no `Display`).
- `NotFound` for `config.json` stays as is: setup creates that file today.
- **Cost check (D5).** Before and after: gateway `cargo tree` line count, `Cargo.lock` package delta, release build wall time on this machine (`free -g` first, `--jobs 4`). Threshold in plan D5: lock grows by more than the validator's crate list or build time by more than 20%: stop and report in the decision-question template (options: a lean reader local to the gateway built on `fgos-durable-file::read_beneath`-style open, or a leaf crate split, Idea I1).

## Steps

1. Merge `origin/main`; `impact` on `load_gateway_config` (callers: `main.rs` and tests).
2. Tests (the existing ones move to the token file; no copy of the crate's token cases): token file present and valid -> `GatewayConfig.token` equals it and `config.json` has no `token`; token missing -> `Token` error naming the file; mode 0644 -> error; `config.json` still carrying a `gateway.token` is ignored (the file wins; no fallback).
3. `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --jobs 4` after `free -g`; clippy; fmt; record the cost numbers in the commit message.
4. Live check on this machine after phase 15's stage 1: `fgos gateway start` then `fgos gateway status` (the one door; never a raw process), then `fgos gateway stop`.

## Owning proof

Token file rules: phase 04's `machine_files.rs`. Gateway wiring: the gateway's own tests (one per outcome above).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Build cost grows | M x L | measured against the D5 threshold; stop-and-ask if exceeded |
| Gateway refuses to start on a machine where stage 1 has not run | M x M | the error names the file and `fgos doctor --fix`; rollout order in phase 15 |
| The old key keeps working by accident | L x M | the field is removed from the struct; test with a `gateway.token` in the JSON and no token file expects the error |

## Rollback

Revert: the gateway reads the JSON token again (valid while stage 2 has not run).
