# Lead report: yaml-write-door p02 (addon and Node door write a frontmatter block)

Branch `yaml-write-door/p02`, base e5ddbef0a (integration head). Red commit first, then code commit, then a format commit.

## Done
- Addon `yaml.emit` (`emit_document` over pure `emit_text`): JSON in, `fgos_yaml_doc::emit` with the `tool` profile, crate refusals travel like `parse`'s; unparsable JSON or non-UTF-8 output is `yaml-internal-error`, value-free.
- Marker `yaml: 2` (`lib.rs`), `combinedAbiMatches` requires `v.yaml >= 2`, doc comment updated; `native-load` exact marker set and a `yaml: 1` refusal assertion in `config-door`.
- `src/util/yaml.mjs`: refusal mapping extracted to one private `viaDoor`; `writeFrontmatter(meta, body, file)` with the three Node rule ids (`frontmatter-not-a-mapping`, `-not-json`, `-not-round-trip`); header says reading and writing. Exports are exactly the six the phase names.
- Census regenerated with its own tool after each code commit.

## Gates
Green: `cargo test -p fgos-node-addon` (yaml_parts 3), fmt, clippy -D warnings, msvc and aarch64-apple-darwin check, one-door scan 0 undeclared, census, architecture, doc-health, decision-citation-drift, yaml, config-door, native-load, and every test that names `util/yaml.mjs` or `native/door.mjs` (26 files, one per run).
`test/rust-host/release-tree.test.mjs` after one release build (`-p fgos -p fgctl -p fgos-node-addon`): the staged-door import assertion failed on `node:util` (the door's deep-equality read-back). Plan lead chose to allow it: the expected list is now `['node:util', '../native/door.mjs']`, message still "no parser". Rerun: 4 of 4 pass; architecture and census pass.
Not run: full npm test, cargo test --workspace.

## Landing note
Integration activation must pair payload and addon: an addon with `yaml: 1` makes the whole native door unavailable to this payload.
No `## [Unreleased]` line from this phase alone.

## Lessons
- `cargo fmt --all` after the red commit rewrote the test file; run fmt before the first commit.
- The first commit attempt with a judged test file is refused until the census is regenerated; regenerate before committing, not after the refusal.
- Choosing a refusal rule for a proof (`zero-width`) needs the rule list in `model.rs`; the plan's example id was not a real rule.
