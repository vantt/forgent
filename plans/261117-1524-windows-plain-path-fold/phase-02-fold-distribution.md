# Phase 2 — Fold the distribution copies

Wave 1, no dependencies. Own worktree from base `e8621a54826408a539af371ffc6a81b3ac16d76a`.

## Inputs

- `docs/history/windows-plain-path-fold/DISCUSSION.md` §6 table, D1-D3.
- `packages/process/rust/src/path.rs:7` `plain_path` (behaviour: `\\?\D:\x` -> `D:\x`, every other path unchanged, UNC stays verbatim).
- Sites (line numbers at base): `packages/distribution/rust/src/workspace.rs:56-64`, `verify.rs:331-338`, `agent_hooks.rs:302-322` (`shim_operand`, `strip_verbatim`), `uninstall.rs:116-128` (`comparable`), `test_scratch.rs:50-56` (`canonical`). fgos-distribution already depends on fgos-process (`packages/distribution/rust/Cargo.toml:13`).

## Footprint

- `packages/distribution/rust/src/workspace.rs`
- `packages/distribution/rust/src/verify.rs`
- `packages/distribution/rust/src/agent_hooks.rs`
- `packages/distribution/rust/src/uninstall.rs`
- `packages/distribution/rust/src/test_scratch.rs`

## Steps

1. workspace.rs: replace the `clean` block with `Ok(fgos_process::path::plain_path(&canonical))`.
2. verify.rs: replace `real_path_clean` block with `Ok(fgos_process::path::plain_path(&real_path))`.
3. agent_hooks.rs: delete `fn strip_verbatim`; in `shim_operand` write `let resolved = fgos_process::path::plain_path(&resolved);`.
4. uninstall.rs `comparable`: build components from `fgos_process::path::plain_path(path)`; on Windows lowercase each component, elsewhere keep it. Update the doc comment (the verbatim fold now comes from the door). Leave the test literals at :826/:828 as they are.
5. test_scratch.rs `canonical`: `fgos_process::path::plain_path(&real)` (same UNC-kept behaviour as today). Keep the doc comment's meaning.
6. Use a `use fgos_process::path::plain_path;` import where a file calls it more than once; otherwise the full path. `cargo fmt -p fgos-distribution`.

No new test (the behaviour's owning proof is path.rs).

## Verify

```bash
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/trial-pathfold-target
cargo test -p fgos-distribution
cargo check --target x86_64-pc-windows-msvc -p fgos-distribution --tests
cargo check --target aarch64-apple-darwin -p fgos-distribution --tests
cargo clippy -p fgos-distribution --all-targets -- -D warnings
rg -n -F 'r"\\?\' packages/distribution   # only uninstall.rs test literals
rg -n 'strip_verbatim' packages/distribution   # none
```

Pass: all green and the two greps as noted.

## Rollback

`git revert` the phase commit; phase 4 then lists these files as `debt` entries.
