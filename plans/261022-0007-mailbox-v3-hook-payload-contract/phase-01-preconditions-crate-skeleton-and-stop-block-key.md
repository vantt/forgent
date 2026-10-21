---
phase: 1
title: "Preconditions, crate fgos-mailbox skeleton, Stop-block key, shared test support"
status: pending
priority: P2
effort: "2.5h"
dependencies: []
---

# Phase 1: Preconditions, crate `fgos-mailbox` skeleton, Stop-block key, shared test support

## Goal

This phase sets up four things:

- an empty but real crate `fgos-mailbox` in the workspace, with its lints;
- the one hook key V3 reads, `mailbox.stopBlock.max`, added to the limits contract;
- a `reader` field on every key of that contract, saying which crate reads it;
- one shared copy of the test support that both crates' tests use.

## Preconditions (stop if any fails; report to the controller)

1. **V1 is closed.**
   - Run `git -C /home/vantt/projects/forgent-mailbox log origin/mailbox/v1-v3 --oneline -1`. It must show V1's phase 8 commit (`docs(mailbox): record the V1 core on its branch`), **pushed**.
   - Also, either `/home/vantt/projects/forgent/plans/261021-2255-mailbox-v1-core-crate/plan.md` front matter is no longer `pending`, or the controller confirms V1 is closed.
2. **No V1 work is in flight.** `git -C /home/vantt/projects/forgent-mailbox status --short` is empty.
3. **Baseline.** Run the branch sync (plan.md). Then `cargo test --locked -p fgos-mailbox-core` must be green; record the test count.

## Files

- **Create `packages/mailbox/rust/store/Cargo.toml`.**
  - Package `fgos-mailbox`, with `version.workspace` and `edition.workspace`.
  - Dependencies:
    - `fgos-mailbox-core = { path = "../core" }`
    - `fgos-process = { path = "../../../process/rust" }`
    - `serde` and `serde_json` from the workspace
  - Dev-dependencies: `fgos-session-identity = { path = "../../../session-identity/rust" }`.
  - Check every path against the real package names with `cargo metadata --no-deps --format-version 1`.
- **Create `packages/mailbox/rust/store/src/lib.rs`** with:
  - a module doc that names spec §4.1 and §6.1;
  - `#![forbid(unsafe_code)]`;
  - `#![deny(clippy::print_stdout, clippy::print_stderr)]`. Stdout is the frame channel, and only the shell writes to it.
- **Create `packages/mailbox/rust/store/src/hook/limits.rs`** with `HookLimits { stop_block: StopBlockLimits { max: u32 } }`.
  - Serde `camelCase`; it reads key `stopBlock.max` from the same `mailbox` config section as the core's `Limits`.
  - No `Default` and no constant.
- **Edit workspace `Cargo.toml`:** add member `packages/mailbox/rust/store` next to `packages/mailbox/rust/core`.
- **Edit `packages/mailbox/contracts/limits.v1.json`:**
  - Add `{ "key": "mailbox.stopBlock.max", "reader": "hook", "default": 3, "unit": "blocks", "meaning": "consecutive Stop blocks that were written and finished for one head generation; the count returns to zero when a Stop passes without blocking or a new turn starts", "source": "spec §12", "status": "placeholder, unmeasured" }`.
  - Add `"reader": "core"` to every existing key.
  - Update the file's `description` to say each key names its reader.
- **Shared test support**, one copy only:
  - Move `config_section`, `limits_contract` and `SeqIds` out of `packages/mailbox/rust/core/tests/common/mod.rs` into a new `packages/mailbox/rust/core/tests/common/support.rs`.
  - `common/mod.rs` re-exports them, so no core test changes its imports.
  - The store's `tests/common/mod.rs` includes the same file with `#[path = "../../../core/tests/common/support.rs"] mod support;`. Check the relative path from the store's `tests/common/`.
- **Create `packages/mailbox/rust/store/tests/limits_contract.rs`.**

## Tests first (red, then green)

| Test | File | Behaviour | Proof status |
|---|---|---|---|
| `the_limits_contract_carries_every_core_key_and_limits_reads_all_of_them` | core `tests/limits_contract.rs` | **Retargeted:** it now iterates only over keys with `"reader": "core"`, and asserts that dropping any one of them makes `Limits` fail to load | Retargeted, not weakened. This test turns red as soon as a hook key joins the contract, because `Limits` ignores unknown top-level keys (`packages/mailbox/rust/core/tests/limits_contract.rs:12-22`, `src/limits.rs:7-8`). The behaviour it owns ("no core field falls back to a code default") is unchanged |
| `every_contract_key_names_exactly_one_known_reader` | core `tests/limits_contract.rs` | Every key has `reader` equal to `core` or `hook` | New. It keeps the split between the two readers honest |
| `the_contract_fills_every_hook_limit_and_none_falls_back_to_a_default` | store `tests/limits_contract.rs` | The folded contract deserializes into `HookLimits`. Dropping any `"reader": "hook"` key makes `HookLimits` fail to load | The hook keys' owning proof. It mirrors the core's test for the core keys |

## Steps

1. Check the preconditions above.
2. Make the contract and support changes and write the tests. The new store test fails because the crate does not exist yet; the retargeted core test fails until `reader` is added.
3. Add the crate, the workspace member and `HookLimits`. All tests go green.
4. Run `cargo test --locked -p fgos-mailbox-core`. It must be green with V1's count plus one.
5. Run `cargo clippy --locked -p fgos-mailbox -p fgos-mailbox-core --all-targets -- -D warnings`.
6. Regenerate the census with `node scripts/git-one-door-scan.mjs --write-census`. Commit `feat(mailbox): add the fgos-mailbox crate and the Stop-block limit`, together with `Cargo.lock` and the census.
7. At the end of the phase: sync, run the proof again, push.

## Acceptance criteria

- `cargo test --locked -p fgos-mailbox` is green, and `cargo test --locked -p fgos-mailbox-core` is green with V1's count plus one.
- `cargo tree -p fgos-mailbox -e normal --depth 1` lists only `fgos-mailbox-core`, `fgos-process`, `serde` and `serde_json`.
- No number for `stopBlock.max` appears in Rust source.
- `SeqIds` and `config_section` exist exactly once: `rg -n 'struct SeqIds|fn config_section' packages/mailbox` finds one hit each.

## Risks

- The workspace `Cargo.toml` lists `packages/durable-file/rust` twice (a risk recorded in the V1 plan). Fixing that is not part of this plan.
- The `#[path]` include couples the two test trees. If a third consumer appears, move the shared support into a small test-support crate instead.
