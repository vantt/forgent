# Lead report: yaml-write-door p01 (crate emits a whole document)

Branch `yaml-write-door/p01`, base 86a582785 (integration head). Code head 7bc16e36e; red test commit 25b1f474d.

## Done
- `Document::set(&[], v, ..)` on a document with no node writes the whole value in one splice (`plan_new_root`, shares `append_root_lines` with `plan_append_root`); commit re-parse check unchanged.
- `edit::emit(value, profile, file)` re-exported from `lib.rs`, guarded; seal table row added.
- Hidden set (`Hidden::of`) + U+2028/2029 share one `needs_escape`: never plain/single/block, `double_quoted` writes `\uXXXX`. Block-scalar check (`block_ok`) uses it too, so a block scalar cannot carry them raw (small extension of requirement 3, same invariant).
- `serde_json` `preserve_order` in `packages/yaml-doc/rust/Cargo.toml`; Cargo.lock unchanged.
- 17 empty-document cases added to `edit.v1.json`; `emit` composition test in `golden_edit.rs`; `emit` driven from `edit_all` in `api_seal.rs`.

## Fixture notes
- A key named `null` is quoted by the writer (expected), so the string-quoting case uses key `nothing`.
- `__proto__` is refused by `strict-config` (`prototype-key`), so it is its own `tool`-only case; `a: b` key case runs under both.

## Gates (all green)
`cargo test -p fgos-yaml-doc`; `-p fgos-host-runtime`, `-p fgos-convention`, `-p fgos-run-result`, `-p fgos-seat-binding`, `-p fgos-identity --features provider` (no test depended on sorted keys); fmt; clippy -D warnings `-p fgos-yaml-doc`; msvc and aarch64-apple-darwin check; census, architecture, doc-health, decision-citation-drift, `test/util/yaml.test.mjs`; one-door scan 0 undeclared.
Not run (not asked): full npm test, cargo test --workspace.

No `## [Unreleased]` line needed from this phase alone (crate-internal; user-visible effect arrives with the writers).

## Lessons
- Each Bash call is a fresh shell: `export CARGO_TARGET_DIR` must be in the same command as cargo; the census scan builds `fgos` and may use its own target.
- `fgos-identity --features provider` cannot be quoted into a `-p` loop; run it on its own.
- Fixture expectations for quoting are best derived by running once and reading the diff; two of mine were wrong about profile rules, not code.
