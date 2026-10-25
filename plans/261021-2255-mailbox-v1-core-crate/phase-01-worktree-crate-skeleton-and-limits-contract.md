---
phase: 1
title: "Worktree, crate skeleton, limits contract, purity lint"
status: done
priority: P2
effort: "3h"
dependencies: []
---

# Phase 1: Worktree, crate skeleton, limits contract, purity lint

## Goal

Create the isolated branch and worktree, add an empty-but-real `fgos-mailbox-core` crate to the workspace, put every core starting value into one contract file, and make the "no I/O, no clock, no process" rule fail the build mechanically.

## Context links

- Spec §4 rules 1 and 3 (line 143), §4.1 layout, §5.3 "not in code constants", §12 configuration table.
- Precedent for a serde-only core with manual errors: `packages/secrets/rust` (`Cargo.toml`, `src/lib.rs`, `tests/common/mod.rs`).
- Config-default registration (used by V5, not V1): `src/setup/registrations.mjs:2334` (`registerConfigDefault({ id: 'lock', key: 'lock', shape: … })`; that shape comes from a JS constant, `src/holder-lock/protocol.mjs:25`, while the mailbox will build it from `limits.v1.json`).
- CI gates: `.github/workflows/ci.yml:284-291` (`cargo fmt --all -- --check`, `cargo clippy --locked --workspace --all-targets -- -D warnings`, `cargo test --locked --workspace`), cargo-deny `:294-297`.

## Steps

### 1. Branch and worktree (once, before any code)

```bash
git -C /home/vantt/projects/forgent fetch --all --prune
git -C /home/vantt/projects/forgent branch --list 'mailbox/*' ; git -C /home/vantt/projects/forgent ls-remote --heads origin 'mailbox/*'
# if mailbox/v1-v3 does not exist anywhere:
git -C /home/vantt/projects/forgent worktree add -b mailbox/v1-v3 /home/vantt/projects/forgent-mailbox origin/main
# if it exists (another lead started): git worktree add /home/vantt/projects/forgent-mailbox mailbox/v1-v3, then the branch sync of plan.md
cd /home/vantt/projects/forgent-mailbox && npm ci
```

From here on the branch sync rule of plan.md applies (merge `origin/main`, never rebase; at phase start and end and before every proof run). Every later command in this plan runs inside `/home/vantt/projects/forgent-mailbox`. Never commit mailbox code in the main checkout. Leave the worktree's Cargo target at its default (`target/` in the worktree) so builds of other lanes in the main checkout are not serialised behind this one.

### 2. Baseline (record, do not fix)

Run and record pass/fail with the exit code in the phase report: `cargo fmt --all -- --check`, `cargo clippy --locked --workspace --all-targets -- -D warnings`. A pre-existing failure outside `packages/mailbox` is noted and left alone; phase 8 compares against it.

### 3. Tests before (red)

Create `packages/mailbox/rust/core/tests/limits_contract.rs` with one test, *"the limits contract carries every core key and Limits reads all of them"*:

- parse `packages/mailbox/contracts/limits.v1.json` (`include_str!` + `serde_json`);
- fold the contract's `keys[]` (dotted key → `default`) into the nested `mailbox` config shape with the helper `common::config_section(&contract)` (generic: split on `.`, drop the `mailbox.` prefix; no per-field code) and deserialise it into `Limits`; assert it succeeds;
- drop one key and assert deserialisation fails. This guards plan decision 1 (no field may fall back to a code default), not serde itself.

It fails because the crate does not exist.

### 4. Implement

Files to create:

- `packages/mailbox/rust/core/Cargo.toml`: name `fgos-mailbox-core`, `version.workspace`, `edition.workspace`; `[dependencies] serde = { workspace = true }`; `[dev-dependencies] serde_json = { workspace = true }`. Nothing else.
- `packages/mailbox/rust/core/clippy.toml`, each entry with a `reason` citing spec §4 rule 3 (clippy paths take no wildcard, so every entry is a full path):
  - `disallowed-methods`: `std::fs::{read, read_to_string, read_dir, write, copy, rename, remove_file, remove_dir, remove_dir_all, create_dir, create_dir_all, metadata, symlink_metadata, canonicalize, hard_link}`; `std::path::Path::{exists, try_exists, is_file, is_dir, metadata, read_dir, canonicalize}`; `std::env::{var, var_os, vars, vars_os, args, args_os, current_dir, set_current_dir, set_var, remove_var, temp_dir, home_dir}`; `std::io::{stdin, stdout, stderr}`; `std::process::{exit, abort, id}`; `std::time::SystemTime::now`; `std::time::Instant::now`; `std::thread::{sleep, spawn}`;
  - `disallowed-types`: `std::fs::File`, `std::fs::OpenOptions`, `std::process::Command`, `std::net::{TcpStream, TcpListener, UdpSocket}`, `std::os::unix::net::{UnixStream, UnixListener, UnixDatagram}`, `std::time::SystemTime`, `std::time::Instant`;
  - `disallowed-macros`: `std::println`, `std::eprintln`, `std::print`, `std::eprint`, `std::dbg` (a stray print in the core would land on the hook's stdout, the frame channel);
  - a header comment: "this file replaces the workspace root `clippy.toml` for this crate; copy any root setting added later into it". A crate-local `clippy.toml` replaces the (empty) root one for this crate only: verified 2026-10-21 in a scratch two-crate workspace with a root `clippy.toml` (the crate with its own file failed on `std::fs::read` and `SystemTime::now`, its sibling did not).
- `packages/mailbox/rust/core/src/lib.rs`: crate doc stating the purity rule and the authority (spec path); `#![forbid(unsafe_code)]`; `#![deny(clippy::print_stdout, clippy::print_stderr)]`; `mod limits; pub use limits::Limits;` (later phases add modules).
- `packages/mailbox/rust/core/src/limits.rs`: `Limits` with nested structs in the exact config shape of the `mailbox` section, `#[serde(rename_all = "camelCase")]`, inner structs `deny_unknown_fields`, top level not (later rungs add `hook` and `status` sections to the same contract that the core does not read). Fields (all required; byte and second values `u64`, counts `u32`): `maxBodyBytes`; `chain.maxDepth`; `session.budget`, `session.lifetimeCap`; `human.fallbackWindowSec`; `loop.maxPerWindow`, `loop.windowSec` (Rust field `loop_guard` with `#[serde(rename = "loop")]`); `queue.cap`, `queue.perSender`; `counters.maxKeys`; `record.ttlSec`, `record.bodyRetentionSec`; `inFlightTtlSec`; `maxOffers`; `wake.exchangeGapSec`, `wake.maxPerExchange`, `wake.lifetimeCap`; and, per owner question Q1 (provisional option A), `notices.cap`, `notices.windowSec`, `frame.maxHeaderChars`. No `Default` impl, no numeric constant anywhere in `src/`.
- `packages/mailbox/contracts/limits.v1.json`: `{ "contract": { "id": "mailbox-limits", "version": 1 }, "description": …, "keys": [ { "key": "mailbox.chain.maxDepth", "default": 6, "unit": "messages", "meaning": …, "source": "spec §12", "status": "placeholder, unmeasured" }, … ] }` (one list, so a value and its meaning cannot drift; contract-id shape as in `packages/holder-lock/contracts/lock-registry.v1.json:2`). Values exactly as spec §12: 16384, 6, 20, 200, 600, 12/600, 50/10, 64, 86400/604800, 120, 3, 600/5, 50; Q1 placeholders 10, 600, 200 with `"source": "owner question Q1 (provisional)"`. `mailbox.stopBlock.max` and the `hook.*`/`status.*` keys are not core and are added by the rungs that read them (V3/V5/V7).
- `packages/mailbox/rust/core/tests/common/mod.rs`: `pub fn config_section(contract) -> serde_json::Value` and `pub fn spec_limits() -> Limits`. Later phases add the clock helper and `SeqIds` here.

Files to modify:

- `/home/vantt/projects/forgent-mailbox/Cargo.toml`: add `"packages/mailbox/rust/core"` to `members` (keep the list order style; do not touch the duplicate `durable-file` entry, see plan risks).
- `Cargo.lock` (regenerated by the first build; commit it, CI uses `--locked`).
- `packages/git/contracts/mutation-census.v1.json`: `node scripts/git-one-door-scan.mjs --write-census`.

### 5. Prove the purity lint bites (not committed)

Add a probe function to `lib.rs` with one use per family: `std::fs::read("x")`, `std::path::Path::new("x").exists()`, `std::env::var("X")`, `std::io::stdout()`, `std::time::SystemTime::now()`, `std::process::Command::new("x")`, `println!("x")`. Run `cargo clippy -p fgos-mailbox-core --all-targets -- -D warnings`, confirm one error per line (`disallowed_methods`, `disallowed_types`, `disallowed_macros` or `print_stdout`), remove the probe. Paste the error lines into the phase report. If clippy does not pick up the crate-local file, do not work around it with a `CLIPPY_CONF_DIR` setting (an environment switch the CI command does not carry); report `DONE_WITH_CONCERNS` and keep the rule as review-only, as the spec already allows.

## Tests after / regression gate

```bash
git fetch origin && git merge --no-edit origin/main   # branch sync rule (plan.md); proof counts only on a fresh main
cargo test -p fgos-mailbox-core --locked
cargo clippy -p fgos-mailbox-core --all-targets --locked -- -D warnings
cargo fmt -p fgos-mailbox-core -- --check
cargo tree -p fgos-mailbox-core -e normal --depth 1   # shows serde only
```

## Acceptance criteria

- Branch `mailbox/v1-v3` exists with the worktree at `/home/vantt/projects/forgent-mailbox`; main is untouched.
- `cargo tree … -e normal` lists only `serde` (and its derive) under the crate.
- The contract test passes; deleting any key from the contract makes it fail.
- The seven purity probes each failed clippy and were removed. The lint is described everywhere as narrowing rule 3 to listed entry points; review still owns the rule.
- One commit on the branch: `feat(mailbox): add the pure core crate with its limits contract` (no plan or phase ids in the message), containing the crate, contract, workspace member, `Cargo.lock` and the regenerated census.

## Risks

- Clippy's config discovery: verified by step 5, not assumed.
- A future rung adding `hook` keys to the same contract must not make `Limits` fail: guarded by "top level not `deny_unknown_fields`".

## Security

No secrets; the contract holds numbers and prose only.

## Implementation notes (2026-10-21)

- Branch `mailbox/v1-v3` and worktree `/home/vantt/projects/forgent-mailbox` created from `origin/main` `27e5412bc` (no branch existed locally or on origin).
- Baseline before any change: `cargo fmt --all -- --check` exit 1 (175 files outside `packages/mailbox` need formatting: `packages/run-supervisor/rust` 42, `packages/process/rust` 28, `packages/git/rust` 27, `packages/holder-lock/rust` 22, and others under `apps/` and `packages/`); `cargo clippy --locked --workspace --all-targets -- -D warnings` exit 0. Left alone; phase 8 compares against it.
- Deviation (stronger proof, same behaviour): the contract test drops every key in turn, not one, so no `Limits` field can fall back to a code default unnoticed.
- Purity probe (removed after the run), `cargo clippy -p fgos-mailbox-core --all-targets -- -D warnings`: one error per family — `disallowed method std::fs::read`, `std::path::Path::exists`, `std::env::var`, `std::io::stdout`, `std::time::SystemTime::now` (plus `disallowed type std::time::SystemTime`), `disallowed type std::process::Command`, `disallowed macro std::println` (plus `print_stdout`). The crate-local `clippy.toml` is picked up without any environment setting.
