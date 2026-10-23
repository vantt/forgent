# Phase 04: Load the section schemas and standard files, lint them, validate through the validator crate

Depends on 01 (04a) and on the owner sign-off of phase 03 (04b). Suggested executor: sonnet. This one phase replaces the earlier descriptor model, descriptor lint and custom value check: the standard JSON Schema keywords and the validator crate carry what those three built.

## Context

Spec section 4 (amended 2026-10-23, again 11:45): section schemas are JSON Schema draft 2020-12 authored as YAML at `core/config-schema/<section>.schema.yaml` (shape and meaning only, no `default`); the standard values are normal config files at `core/config-standard/<section>.yaml`; the only fgOS facts JSON Schema cannot express are five `x-fgos-` annotations (`scope`, `sensitivity`, `file`, `merge`, `absent`); revision is `$id`, owner and justification are `$comment`; validation is the validator crate's. Config keeps only: loading the bundled schemas and standard files, a small lint of the annotations, the `$id`/`$comment` conventions, the spec section 3 scope and sensitivity rules and the standard against the schema, and the merge of the standard files into the standard layer. No custom type dialect, no custom value checker, no path pattern language.

Two commit groups, so the gate on phase 03 parks as little as possible:

- **04a (no validator needed):** loader, path resolution with annotation inheritance, bundle and digest, annotation lint, standard assembly. Lands before the gate; unblocks 06, 07, 08, 12 (authoring).
- **04b (after sign-off):** wrapper over the validator crate, the lint rules that need it. Unblocks 09-13 proofs.

## Files it may touch

`src/schema.rs`, `src/bundle.rs`, `src/lint.rs`, `src/standard.rs` (04a: loads and merges the standard files); `src/validate.rs` and the `Cargo.toml` dependency line (04b, after phase 03's record); reads `contracts/annotations.v1.json` (created by 01), `contracts/fixtures/{schema,lint,validate,standard}.v1.json`, `tests/golden_{schema,lint,validate,standard}.rs`, and an append to the `schema-` list of `contracts/failure-codes.v1.json`. No file under `core/config-schema/` or `core/config-standard/` yet (phases 12-13); golden inputs are inline YAML text.

## Design

- **File shape (D6):** each file is one JSON Schema document, parsed with `fgos_yaml_doc::parse(bytes, Profile::StrictConfig, file)` (no aliases, tags or duplicate keys, 1 MiB) and converted with `Document::to_json()`; the `Document` is kept so a lint finding carries line and column. A yaml-doc refusal is wrapped as `config-parse`. The file stem is the section; the root carries `$schema` (2020-12), `$id` = `urn:fgos:config-schema:<section>:v<N>` and a `$comment` whose first line is `owner: <component>`. A standard file `<section>.yaml` is parsed the same way (`strict-config`, `to_json()`, the `Document` kept for line and column) and holds the one top-level key named by its stem. Reuse inside the set is `$defs`/`$ref` (strict-config forbids YAML anchors, which is fine: the standard has its own reuse).
- **Resolve (the one door for path-to-node):** `Schemas::resolve(&[Segment]) -> Option<Resolved>` walks `properties`, then `additionalProperties`, following local `$ref`; `properties` wins over `additionalProperties`, so there is no ambiguity rule to lint. `Resolved` carries the node plus the effective `x-fgos-scope`, `-sensitivity`, `-file`, `-merge`, `-absent` (the five annotations, no others), inherited from the nearest ancestor node that states each (D20), then the default. Scope (06), snapshot (09), write (10), standard (04a) and the merge-rule closure all call it. `patternProperties` is not used: the lint refuses it (the walk would otherwise need a regex engine).
- **Bundle (D7):** `src/bundle.rs` lists every schema and standard file with `include_str!`; a test enumerates `core/config-schema/` and `core/config-standard/` and fails on a file missing from the list or a listed file that is gone. `Schemas::bundled()` parses the schemas and returns the model plus the **bundle digest** (sha256 over the sorted `(kind, name, bytes)` pairs of both sets), the key phase 09's cache uses. No `build.rs`.
- **Lint (small, closed ids, each with one failing and one passing case):**

| Id | Rule |
|---|---|
| `schema-dialect` | `$schema` missing or not 2020-12; `$ref` not local to the bundled set; `patternProperties` used; a `$ref` cycle |
| `schema-default-forbidden` | a `default` keyword anywhere (the standard file is the one source of values, D25) |
| `schema-annotation-unknown` | an `x-fgos-` keyword not in `annotations.v1.json` (a typo guard; this also catches a leftover `x-fgos-version`, `-owner`, `-justification`, `-suggestion`) |
| `schema-annotation-value` | an annotation value outside its allowed set (`x-fgos-scope: global`) |
| `schema-id` | root `$id` missing, not `urn:fgos:config-schema:<section>:v<N>`, N not a positive integer, or `<section>` not the file's section |
| `schema-owner` | root `$comment` missing or its first line not `owner: <component>` |
| `schema-description-missing` | a node reachable by a config path (a `properties` entry or an `additionalProperties` schema) without a one-line `description` |
| `schema-scope-implicit` | spec section 3 rule 1: `x-fgos-sensitivity` other than `public` without an own `x-fgos-scope` |
| `schema-scope-both-unjustified` | `x-fgos-scope: both` on a non-public key whose node `$comment` does not start `justification:` |
| `schema-scope-conflict` | a descendant `project-only` under a `global-only` ancestor, or the reverse |
| `schema-file-placement` | `x-fgos-file: accounts` or `token` with scope other than `global-only`; `token` with a type other than string or a sensitivity other than `secret-value`; `accounts` with sensitivity `public` |
| `schema-absent-conflict` | `x-fgos-absent` on a path the standard holds a value for (it is used only where the standard has none) |
| `standard-orphan` | a standard file whose section has no schema, or a top-level key other than its stem |
| `standard-forbidden-key` | the standard holds a value at a `secret-reference` or `secret-value` path, a path with `x-fgos-file` other than `config`, or a `detected` key (the standard holds no account, no token and no machine-detected value, spec section 4) |
| `standard-invalid` (04b) | the standard layer, or one standard file, fails the validator against its own schema (`required` judged only on the merge) |

- **Standard (the standard layer):** `Standard::bundled(&Schemas) -> Standard` parses every bundled standard file and merges them in schema-set order into one `Value` plus the per-file `Document`s, so a standard value has a file name, line and column (`Standard::span_of(path)`); `Standard::value_at(path)` is what the doc-line renderer (phase 08, D26) and the redundancy rule (phase 10) read. Deterministic, the same on every machine; no `default` is ever read. A catalog is just a map value in the standard file.
- **Validate (04b):** `validate(&Schemas, effective: &Value) -> Vec<Finding>`. The composite schema (one root whose `properties` each `$ref` a section schema by its `$id`, resources registered in memory, no retriever) is compiled once per `Schemas` value. The standard layer is validated by the same function (`standard-invalid`), with findings of keyword `required` ignored there because `required` holds only for the merge. It validates the **effective merged value**, never one file (a file holds differences only, so `required` holds only for the merge; decision D22). A finding is `{keyword, instance_path, schema_path}`; the validator's message text is dropped (D23; it can quote a value). The snapshot (09) attributes each finding to its source file, line and column through provenance. `undescribed(&Schemas, &Value) -> Vec<Path>` (04a, no validator) lists present paths with no schema node: a doctor warning later, never an error, and kept on writes. A `null` is refused unless the node's `type` includes `"null"` (D16).

## Steps

1. Merge `origin/main`. **04a:** write schema, bundle, lint (all rules except `standard-invalid`), standard loader and merge, `undescribed`. Fixtures: `schema.v1.json` (about 12 cases: minimal valid file, every `type`, `default: null` versus no `default`, path resolution through `properties`, `additionalProperties`, `$ref`, a `.` inside a bracket-quoted key, `properties` wins, inheritance of each annotation from an ancestor and a child override, resolve miss, unknown or wrong-typed annotation reaches lint not the loader, digest changes when one byte changes and is order-independent); `lint.v1.json` (about 16 cases: one failing per rule plus two combined passing cases such as a legitimate `global-only` account entry); `standard.v1.json` (about 8 cases: scalar values, a catalog value, a section with no standard file, merge order across files, provenance line and column, secret/file-placed/detected keys refused by `standard-forbidden-key`, an orphan file, determinism). A test over the bundled schemas and standard files expects zero lint findings (the standing gate for phases 12-13).
2. **04b (after phase 03 sign-off):** add the dependency; write `validate.rs`; add `standard-invalid`. `validate.v1.json` (about 12 cases): each type, `enum`, bounds, `required` on the merged value, a map entry against `additionalProperties`, an array item path, `null` allowed and refused, an unknown `x-fgos-` keyword changes nothing, a finding carries keyword and paths and no value. One assertion that a finding's text form contains no scalar of its input (the full no-echo proof is phase 11's).
3. Report cumulative Rust source lines (command in plan.md) in the commit message; phase target about 300, see the budget.

## Owning proofs

| Behaviour | Proof |
|---|---|
| Schema text becomes the model; path resolution and annotation inheritance; bundle completeness and digest | `golden_schema.rs` over `schema.v1.json` (resolution cases live only here; later phases exercise them through their own behaviour) |
| Each lint rule fires on its case and only there; bundled set is clean | `golden_lint.rs` over `lint.v1.json` (`bundled_set_is_clean` is the one place this is asserted) |
| Validation of the effective value; findings carry no value | `golden_validate.rs` over `validate.v1.json` |
| What the standard layer contains, its provenance, and what it must not hold | `golden_standard.rs` over `standard.v1.json` |

JSON Schema keyword semantics (types, bounds, `$ref`) are the validator crate's own proof; this crate does not re-test them beyond one wiring case per keyword class used.

## Validation

`cargo test -p fgos-config --test golden_schema --test golden_lint --test golden_standard --jobs 4` (04a), plus `--test golden_validate` (04b); clippy; fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Annotation inheritance gives a child a scope the author did not intend | M x M | lint still demands an own `x-fgos-scope` on every non-public node; fixtures for override and default |
| The validator crate rejects or reinterprets a keyword the schemas use | L x M | probe in phase 03; the lint's `schema-dialect` keeps authors inside the probed subset |
| A lint rule is stricter than the real catalog needs | M x L | rules come only from the spec's wording; if a real schema cannot pass, change the schema or raise a decision question, never the rule silently |
| A large standard value (the `runner` catalog) makes validation of the merged value slow | L x L | schemas compile once per `Schemas`; time recorded in phase 13, no assertion |
| Message text of the validator leaks a value | M x H | findings are built from keyword and paths only; phase 11 asserts it |

## Rollback

Revert: new files only (plus the appended failure ids and, for 04b, the dependency line).
