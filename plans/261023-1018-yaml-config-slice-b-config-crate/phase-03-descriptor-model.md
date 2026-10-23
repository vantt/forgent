# Phase 03: Descriptor model, loader, `<any>` path patterns, bundled set

Depends on 01. Suggested executor: sonnet.

## Context

Spec section 4: a descriptor is data at `core/config-schema/<section>.yaml` with an `owner` field; entries carry `path`, `type`, `values`, `default`, `suggestion`, `scope`, `merge`, `absent`, `file`, `sensitivity`, `doc`, `version` (plus D5's `justification`). The dialect is closed: unknown fields are a refusal, not ignored. This phase parses descriptors into a typed model; it judges nothing about whether a descriptor set is sensible (phase 04) or whether a value fits (phase 05).

## Files it may touch

`src/descriptor.rs`, `src/pattern.rs`, `src/bundle.rs`, `contracts/fixtures/descriptor.v1.json`, `tests/golden_descriptor.rs`. No file under `core/config-schema/` yet (phases 12-13); the golden inputs are inline text.

## Design

- **File shape (D6):** a mapping `{owner, section, entries: [ {path, type, ...} ]}` parsed with `fgos_yaml_doc::parse(bytes, Profile::StrictConfig, file)`. A yaml-doc refusal is wrapped as `config-parse` with the file, line and column kept.
- **Types:** `string, integer, number, boolean, enum, list of T, map of T, object`. `T` is one of the scalar types, `object`, or a nested `list of`/`map of`; the textual form (`list of string`, `map of object`) is parsed once into a small enum.
- **Path patterns:** a `path` is parsed with yaml-doc's `parse_path`; the segment `<any>` is a wildcard. `Pattern::matches(&[Segment]) -> bool`, `Pattern::specificity()` (literal segments beat wildcards), and `Descriptors::lookup(&[Segment]) -> Option<&Entry>` returning the most specific matching entry. Matching is exact in length: `a.<any>` matches `a.x` and not `a.x.y` or `a`. `Descriptors::resolve(&[Segment]) -> Resolved` returns the entry plus the effective `scope`, `sensitivity`, `file` and `merge` (decision D20: a field the entry does not state is inherited from the nearest ancestor entry, wildcards included, then the dialect default; this is how `gateway` as a whole is `global-only` and `runner.executors.<any>` as a whole is `command` without repeating the field on every child). `lookup` and `resolve` are the one place wildcard and inheritance semantics live; snapshot (09), check (05), scope (06) and the merge-rule closure all call it (one door).
- **Absent vs null** in descriptors: a `default` key present with `null` is a standard value of null; a missing `default` key means no standard value. Parse keeps that distinction (`Option<Value>`).
- **Bundle:** `src/bundle.rs` holds the list of `(file name, include_str!)` pairs (D7) and `Descriptors::bundled()`, which parses them all and returns the model plus the **bundle digest** (sha256 over the sorted `(name, bytes)` pairs), the key phase 09's cache uses. This phase's list is empty or holds the test fixtures' descriptors via `include_str!` of a contract-dir sample so the loader has an input; phases 12 and 13 append real lines. The test enumerating `core/config-schema/` lands now and passes while the directory is empty or absent (absent directory = empty set; the test states that).

## Steps

1. Merge `origin/main`. Write the model and loader; reject unknown fields, wrong value types and a missing `owner`, `section`, `path`, `type`, `doc`, `version` by name (`descriptor-field-unknown`, `descriptor-field-missing`, `descriptor-field-type`; ids registered in `failure-codes.v1.json` by phase 04's contract edit of that file's `descriptor-` list, ordered so 03 and 04 do not edit the file at once: 03 owns the three parse ids, 04 appends its lint ids in its own commit after 03 lands).
2. Golden fixtures (about 22 cases): minimal valid descriptor; every type; `default: null` vs absent default; `<any>` at each position; a path with a `.` inside a bracket-quoted key; most-specific-wins lookup (`a.<any>.c` over `a.<any>.<any>`); lookup miss; inheritance of `scope`, `sensitivity`, `file` and `merge` from an ancestor, an override by a child, and the default when no ancestor states the field; unknown field; missing field; wrong value type; duplicate YAML key (yaml-doc refusal passes through with file/line); alias in a descriptor (refused by profile); bundle digest changes when one byte changes and is order-independent.
3. `golden_descriptor.rs`: one runner over `descriptor.v1.json`, plus the enumeration test of D7 (every `core/config-schema/*.yaml` is listed in `bundle.rs`, no listed file is missing).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Descriptor text becomes the model; closed dialect | `golden_descriptor.rs` over `descriptor.v1.json` |
| `<any>` matching and most-specific lookup | same runner (lookup cases); no copy in later phases, they exercise it only through their own behaviour |
| Bundled set is complete | enumeration test in the same file |

## Validation

`cargo test -p fgos-config --test golden_descriptor --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| `<any>` ambiguity (two patterns tie) | M x M | tie on specificity is a lint error in phase 04 (`descriptor-pattern-ambiguous`), lookup returns the first by file order only after lint has passed |
| `include_str!` path breaks when packaged | L x M | the Slice A crates already `include_str!` from sibling `contracts/`; phase 14 checks `test/install-packaging.test.mjs` expectations (phase 14 step 4) |
| Parser limits (depth 32) hit by a deep catalog default | L x M | the default catalog is a `Value` inside one entry: depth counts from the descriptor root (entries list adds 3); the runner descriptor is measured in phase 13 against `limits.v1.json` |

## Rollback

Revert: new files only.
