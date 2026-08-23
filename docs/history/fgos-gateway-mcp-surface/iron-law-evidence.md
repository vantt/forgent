# Iron Law evidence — tsk-7l9-3

`classifyIronLaw` result against the real committed diff (`herdr-plugin`
tree at `fgw/tsk-7l9-3` commit `9e4f783d`, parent `HEAD~1`):

```json
{"required":true,"matchedFlags":["security"],"matchedModules":[]}
```

Matched via the `security` keyword flag — expected: this item's own Mode
section (`plan.md`) already names `execute` as the audit/security
hard-gate flag (a new same-process code-execution surface), the same
reasoning that forced the `high-risk` lane throughout planning/validating.

This item adds an entirely new capability (no MCP surface existed on
`main` before it) rather than fixing an existing bug, so the
failing-test-first proof is given the way it structurally has to be for a
brand-new Rust module: the new tests live inside the new/changed source
files themselves (`mcp.rs`, `gateway.rs`'s test module), so "revert just
the implementation, keep the test" (this repo's usual JS-side pattern,
e.g. `docs/history/tsk-48i/iron-law-evidence.md`) does not apply file-by-
file the same way. Instead: the pre-image tree is extracted via
`git archive HEAD~1`, and the exact test names this commit adds are run
against it, proving they do not exist at all before this diff.

## RED — pre-image (`git archive HEAD~1 herdr-plugin`, axum 0.7, no `mcp`
module, no MCP route)

```
$ grep -c "mod mcp" herdr-plugin/src/lib.rs
0

$ cargo test --lib mcp::
   Finished `test` profile [unoptimized + debuginfo] target(s) in 13.21s
     Running unittests src/lib.rs (target/debug/deps/herdr_fgos-49a4108a6fff25e8)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 110 filtered out; finished in 0.00s

$ cargo test --lib mcp_route_is_mounted
     Running unittests src/lib.rs (target/debug/deps/herdr_fgos-49a4108a6fff25e8)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 110 filtered out; finished in 0.00s

$ cargo test --lib
test result: ok. 110 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
```

Every one of the 10 new tests this item adds (`mcp::tests::*` × 9,
`gateway::tests::mcp_route_is_mounted_on_the_same_router_and_gated_by_the_same_token`
× 1) is filtered out as non-existent — 0 matched, not 0 failed-then-fixed,
because the capability is genuinely new. Baseline lib-suite count: **110**.

## GREEN — post-image (working tree at the real committed `9e4f783d`,
`git status --short herdr-plugin` clean before this run)

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml
test result: ok. 120 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s   (lib)
test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s    (main.rs)
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s     (render_smoke)
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s     (doc-tests)

$ cargo build --release --manifest-path herdr-plugin/Cargo.toml
    Finished `release` profile [optimized] target(s) in 12.99s
```

Lib-suite count: **120** — up from the pre-image baseline of **110** by
exactly the 10 new tests this item adds (9 in `mcp.rs`, 1 in
`gateway.rs`), no other lib-suite count drift. Total across all 4 suites:
162 passing, 0 failed — the item's own recorded `verify` command, run
verbatim.

## Verify command (item's own `work.verify`, unchanged by this pass)

```
cargo test --manifest-path herdr-plugin/Cargo.toml && cargo build --release --manifest-path herdr-plugin/Cargo.toml
```
