# Config slice B fix batch (coordinator decisions 2026-10-23 14:20)

Branch `cfg/slice-b`. Crate src: 2,436 lines before, 2,372 after (`bundle.rs` 166 to about 110; `grammar.rs`, `write.rs` grew a little). `cargo test -p fgos-config` green, `clippy --all-targets -D warnings` clean, `cargo fmt --check` clean.

| # | Commit | What changed |
|---|---|---|
| 1 | `fa5e152d7` | `bundle.rs`: a `sections!` macro expands section names to `(name, include_str!(...))` pairs; one line of names per set. Bundle-completeness test unchanged. |
| 2 | `799fd4897` | `core/config-standard/runner.yaml`: `credentialStore` (11 invocations) and `env.PI_CONFIG_DIR` (4) restored from the authoring source. The three profile-naming descriptions stay scrubbed. Five `invocations` rows dropped from `repo-differences.v1.json`. The scrub search list loses `homeEnv` and `credentialStore` (they are now legitimate). Equivalence test green. |
| 3 | `83759097f` (with 5) | Meta-schema `description` pattern is now "has a non-space character" (was single-line). `grammar::doc_lines` returns one `@fgos:doc` line per non-blank description line, in order; enum, bounds and standard value follow the first line. `parse_block.doc` is a list: the first unbroken run of doc lines (a doc line after any other line stays a free note). The three ladder descriptions in `runner.schema.yaml` and their two standard doc blocks are now: own sentence, `Tier ladder, weakest first:`, one line per tier. Authoring test pins the ladder against the Seat Binding contract per tier line. Spec section 7 gets one sentence. New fixtures: multi-line parse, changed block, multi-line description valid in meta. |
| 4 | `aeba81075` | `schema-default-forbidden` and `schema-dialect.node` now apply to object subschemas only (`schema-dialect.node` had the same `not: {required}` defect, so `additionalProperties: false` still failed on it; confirmed by running the fixture against the old meta-schema). Fixtures: boolean subschema valid; default beside a boolean subschema still refused. |
| 5 | `83759097f` (with 3) | `doc_lines(node, standard: Option<&Value>)`; the `default` keyword on a node is ignored. Rule kept: scalar or list up to 120 chars, no map, no null. Test-side injection removed (`registry_defaults.rs`); `write.rs` node copy no longer injects a default. Grammar fixtures moved `default` to `standard`; new cases for list, map, null, 118/119 chars, keyword ignored. |
| 6 | `7414dcdad` | `write.rs`: before the reason rule, `all_redundant` checks that every edit sets the standard value on a key the file lacks; then a blank reason is accepted (no-op notice). A file that cannot be parsed there counts as not redundant (refused after the lock as before); empty edit list still needs a reason. Fixtures: redundant set with blank reason; real edit beside a redundant one still refused. |
| 7 | `22c8341d1` | `secrets.schema.yaml` `$comment` says declarations are a map in the file and converted to `Vec<Declaration>` at the Slice C seam. No Secrets crate change. |
| - | `b0ad8c067` | clippy `needless_borrow` in two test calls. |

Notes
- Items 3 and 5 share one commit: both rewrite the same function (`doc_line` to `doc_lines`) and its one fixture runner; separating them would leave a non-compiling middle.
- Existing fixtures changed shape only where the items force it: grammar `doc` cases (`line` to `lines`, `default` to `standard`), `parse` cases (`doc` is a list). No assertion was weakened.
- Multi-line suffix placement (values and standard value on the first line) is my choice; the decision did not say. Easy to move to the last line if preferred.

Status: DONE
Summary: All seven decisions applied, tests/clippy/fmt green, crate src 2,436 to 2,372.
Concerns/Blockers: items 3 and 5 are one commit; suffix on first doc line is a judgement call; src total is below the expected 2,350-2,400 only by being near its lower edge (within range).
