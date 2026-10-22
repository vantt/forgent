# Phase 05: Backend adapter, document parse, both profiles, limits, alias expansion, JSON bridge

Depends on 03, 04 and the **owner's recorded sign-off**. Suggested executor: opus.

## Context

Spec sections 3, 4, 8. The parser is a port; correctness is decided by `parse.v1.json`. Profiles are enforced on our tree walk, never by parser settings (spike: both viable parsers accept duplicate keys and tags by default).

## Files it may touch

- `src/backend.rs` (the only file that names the parser crate; exposes a crate-private normalized tree: node kind, span, tag, anchor, alias target, scalar style and raw text, mapping entries in order, document count). If phase 04 chose a candidate needing a different tree shape, the shape is amended here and the amendment is noted in the upgrade record.
- `src/document.rs` (`Document { source, value, spans }`, `parse(bytes, profile, file)`, `value()`, `source()`, `revision()` = sha256 of source bytes as lowercase hex, `span_of(path)`, `to_json()`), `src/profile.rs` (rule walk, D4 order), `src/expand.rs` (alias expansion with node and byte counters), `src/guard.rs` (`guard(|| ...)`: `catch_unwind(AssertUnwindSafe)` returning `Refusal{rule: yaml-internal-error}`; used by every public entry).
- `tests/golden_parse.rs`.
- `packages/yaml-doc/rust/Cargo.toml`: parser dependency line; root `Cargo.toml`: `exclude` of `packages/yaml-doc/third-party/*` and `[patch.crates-io]` entries, if layout (a) was chosen.
- `packages/yaml-doc/third-party/**` per the owner's layout choice, plus the integrity test `tests/third_party_integrity.rs` (digest per vendored tree equals the value in `upgrade-record.md`) under layout (a). Under (b) none of these.
- `packages/yaml-doc/upgrade-record.md`: fill the integrity hash line.

## Design

1. `parse`: pre-scan (phase 03) then backend parse then tree walk. Walk order is document order; the first violation wins (D4).
2. Profile table is data: `profiles.v1.json` (phase 02) loaded once (`OnceLock`) and consulted by the walk; code contains no per-profile `if profile == ...` chains beyond the lookup. Rules: duplicate key on resolved scalar values (so `a`, `"a"`, `'a'`, `"\x61"` collide); tags; `yes/no/on/off` as strings; anchors and aliases; `<<`; multiple documents; zero documents is `Null`; complex keys; non-string keys (strict refuses, tool stringifies); prototype keys (strict); bidi and zero-width scan over keys and values (strict) or keys (tool), BOM exception D2; integer outside +-(2^53-1), `.nan`, `.inf`, `-.inf`, `-0` (strict refuses; tool converts, large ints to `Float`); timestamps are strings.
3. Scalar resolution is the YAML 1.2 core schema as today's door resolves it (fixtures decide edge forms: `0o`, `0x`, `1e3`, `.5`, `+1`, `~`, `Null`, `TRUE`).
4. Limits from `limits.v1.json`: scalar bytes, key bytes, node count (D1), depth re-check on the tree (exact), alias count 100, expansion node and byte counters. Alias expansion is ours: the backend gives alias nodes; `expand.rs` walks with a stack, counting every visit and the bytes of expanded scalars, refusing at the bound; a self-referencing anchor ends at the bound too (no recursion on the call stack).
5. `to_json(&self) -> Result<serde_json::Value, Refusal>` for the three consumers: maps keep order only as far as `serde_json::Map` does (consumers do not depend on key order: the gateway sorts, the harness reads by key, the manifest is typed); `Int` to number; `Float` to number, NaN/inf refused with `non-finite-number` (tool profile only, never hit by consumers).
6. The crate's public types never expose a parser type.

## Owning proofs

| Behaviour | Owner |
|---|---|
| Every row of spec section 4 for both profiles, every bound at limit and limit plus one, all old-test cases, byte revision, spans, error positions | `tests/golden_parse.rs` over `parse.v1.json` |
| Vendored bytes match the record | `tests/third_party_integrity.rs` (layout a) |
| `to_json` of a parsed fixture equals the fixture's expected JSON | same golden runner (the case's `expect.value` is the JSON form); no separate test |

Not re-proved here: pre-scan behaviours (phase 03's runner). The `golden_parse` runner skips ids with stage `prescan`, which are the property of `golden_prescan`.

## Steps

1. Merge main. Add the dependency per the owner's layout; `cargo tree -p fgos-yaml-doc` equals the recorded tree (no surprise crates).
2. Write `backend.rs` against the chosen crate; keep it under about 250 lines.
3. Implement `document.rs`, `profile.rs`, `expand.rs`, `guard.rs`; run the runner until all `parse` fixtures pass.
4. Scratch differential run (not committed): parse every YAML file in the repo with the old door (`node -e` calling `parseYaml`) and with the new crate in `tool` profile (small scratch bin); compare canonical JSON. Expected: same for all but the files both reject; each difference gets a verdict (our bug, or fixture-worthy new rule). Record counts in the upgrade record.
5. Fill the integrity hash line in the upgrade record. Run `cargo clippy --workspace --all-targets --jobs 4 -- -D warnings` once to prove `third-party/` is not swept in.

## Validation

`cargo test -p fgos-yaml-doc --jobs 4` (narrow: `--test golden_parse`), clippy and fmt as above. No workspace-wide test yet (phase 10).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Backend cannot give an exact span for some node kind | M x H | known from phase 04; if only one kind fails, the document records it as unsupported for edits (phase 06 refuses with a named rule), not as a parse failure |
| Fixtures expose a parser quirk (position off by one) | M x L | D7; pin the parser's value only where today's test pins it |
| Parser panics on adversarial bytes | M x H | pre-scan in front; `guard` converts a panic to `yaml-internal-error`; phase 09 fuzz |
| Core-schema resolution differs from js-yaml in an edge form real files use | M x M | step 4 differential over every repo YAML file |
| `[patch]` path crates change `Cargo.lock` unexpectedly | L x M | review the lock diff; only the new crates and checksum lines change |

## Rollback

Revert this phase's commits: removes the dependency, the committed third-party tree, the root `exclude`/`[patch]` lines and the runner. Nothing consumes the crate yet (phase 08 comes after), so no consumer breaks.

## Note added 2026-10-22 (coordinator)

The refused invisible set also covers U+200E, U+200F (directional marks), U+061C (Arabic letter mark) and U+2060 (word joiner), for values, keys and comment text alike: they hide text in a diff the same way as the listed bidi and zero-width characters. Add them to the profile rule and the comment guard in one change, with fixtures, and extend the spec lists in sections 4 and 6 with one dated line in its decision history.
