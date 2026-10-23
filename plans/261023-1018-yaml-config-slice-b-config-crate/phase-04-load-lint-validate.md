# Phase 04: Load the section schemas, lint the `x-fgos-` annotations, validate through the validator crate

Depends on 01 (04a) and on the owner sign-off of phase 03 (04b). Suggested executor: sonnet. This one phase replaces the earlier descriptor model, descriptor lint and custom value check: the standard JSON Schema keywords and the validator crate carry what those three built.

## Context

Spec section 4 (amended 2026-10-23): section schemas are JSON Schema draft 2020-12 authored as YAML at `core/config-schema/<section>.yaml`; fgOS-only facts are `x-fgos-` annotations; validation is the validator crate's. Config keeps only: loading the bundled schemas, a small lint of the annotations and of the spec section 3 scope and sensitivity rules, and the standard assembly. No custom type dialect, no custom value checker, no path pattern language.

Two commit groups, so the gate on phase 03 parks as little as possible:

- **04a (no validator needed):** loader, path resolution with annotation inheritance, bundle and digest, annotation lint, standard assembly. Lands before the gate; unblocks 06, 07, 08, 12 (authoring).
- **04b (after sign-off):** wrapper over the validator crate, the lint rules that need it. Unblocks 09-13 proofs.

## Files it may touch

`src/schema.rs`, `src/bundle.rs`, `src/lint.rs`, `src/standard.rs` (04a); `src/validate.rs` and the `Cargo.toml` dependency line (04b, after phase 03's record); reads `contracts/annotations.v1.json` (created by 01), `contracts/fixtures/{schema,lint,validate,standard}.v1.json`, `tests/golden_{schema,lint,validate,standard}.rs`, and an append to the `schema-` list of `contracts/failure-codes.v1.json`. No file under `core/config-schema/` yet (phases 12-13); golden inputs are inline YAML text.

## Design

- **File shape (D6):** each file is one JSON Schema document, parsed with `fgos_yaml_doc::parse(bytes, Profile::StrictConfig, file)` (no aliases, tags or duplicate keys, 1 MiB) and converted with `Document::to_json()`; the `Document` is kept so a lint finding carries line and column. A yaml-doc refusal is wrapped as `config-parse`. The file stem is the section; the root carries `$schema` (2020-12), `x-fgos-owner`, `x-fgos-version`. Reuse inside the set is `$defs`/`$ref` (strict-config forbids YAML anchors, which is fine: the standard has its own reuse).
- **Resolve (the one door for path-to-node):** `Schemas::resolve(&[Segment]) -> Option<Resolved>` walks `properties`, then `additionalProperties`, following local `$ref`; `properties` wins over `additionalProperties`, so there is no ambiguity rule to lint. `Resolved` carries the node plus the effective `x-fgos-scope`, `-sensitivity`, `-file`, `-merge`, `-absent`, inherited from the nearest ancestor node that states each (D20), then the default. Scope (06), snapshot (09), write (10), standard (04a) and the merge-rule closure all call it. `patternProperties` is not used: the lint refuses it (the walk would otherwise need a regex engine).
- **Bundle (D7):** `src/bundle.rs` lists every schema file with `include_str!`; a test enumerates `core/config-schema/` and fails on a file missing from the list or a listed file that is gone. `Schemas::bundled()` parses them all and returns the model plus the **bundle digest** (sha256 over the sorted `(name, bytes)` pairs), the key phase 09's cache uses. No `build.rs`.
- **Lint (small, closed ids, each with one failing and one passing case):**

| Id | Rule |
|---|---|
| `schema-dialect` | `$schema` missing or not 2020-12; `$ref` not local to the bundled set; `patternProperties` used; a `$ref` cycle |
| `schema-annotation-unknown` | an `x-fgos-` keyword not in `annotations.v1.json` (a typo guard) |
| `schema-annotation-value` | an annotation value outside its allowed set (`x-fgos-scope: global`) |
| `schema-owner-version` | root without `x-fgos-owner`, or `x-fgos-version` not a positive integer |
| `schema-description-missing` | a node reachable by a config path (a `properties` entry or an `additionalProperties` schema) without a one-line `description` |
| `schema-scope-implicit` | spec section 3 rule 1: `x-fgos-sensitivity` other than `public` without an own `x-fgos-scope` |
| `schema-scope-both-unjustified` | `x-fgos-scope: both` on a non-public key without `x-fgos-justification` |
| `schema-scope-conflict` | a descendant `project-only` under a `global-only` ancestor, or the reverse |
| `schema-file-placement` | `x-fgos-file: accounts` or `token` with scope other than `global-only`; `token` with a type other than string or a sensitivity other than `secret-value`; `accounts` with sensitivity `public` |
| `schema-secret-has-default` | `secret-reference` or `secret-value` with a `default` or `x-fgos-suggestion` (the standard holds no account and no token, spec section 4) |
| `schema-absent-default` | `x-fgos-absent` together with a `default` (it is used only where there is none) |
| `schema-default-invalid` (04b) | a `default`, a catalog `default` or an `x-fgos-suggestion` that fails the validator against its own node |

- **Standard:** `standard(&Schemas) -> Value`: walk nodes in file order; each `default` at its path; a catalog `default` at a map path sits under its path; nodes with `x-fgos-absent`, `secret-*` sensitivity or `x-fgos-file` other than `config` contribute nothing. Deterministic, the same on every machine.
- **Validate (04b):** `validate(&Schemas, effective: &Value) -> Vec<Finding>`. The composite schema (one root whose `properties` are the section files) is compiled once per `Schemas` value. It validates the **effective merged value**, never one file (a file holds differences only, so `required` holds only for the merge; decision D22). A finding is `{keyword, instance_path, schema_path}`; the validator's message text is dropped (D23; it can quote a value). The snapshot (09) attributes each finding to its source file, line and column through provenance. `undescribed(&Schemas, &Value) -> Vec<Path>` (04a, no validator) lists present paths with no schema node: a doctor warning later, never an error, and kept on writes. A `null` is refused unless the node's `type` includes `"null"` (D16).

## Steps

1. Merge `origin/main`. **04a:** write schema, bundle, lint (all rules except `schema-default-invalid`), standard, `undescribed`. Fixtures: `schema.v1.json` (about 12 cases: minimal valid file, every `type`, `default: null` versus no `default`, path resolution through `properties`, `additionalProperties`, `$ref`, a `.` inside a bracket-quoted key, `properties` wins, inheritance of each annotation from an ancestor and a child override, resolve miss, unknown or wrong-typed annotation reaches lint not the loader, digest changes when one byte changes and is order-independent); `lint.v1.json` (about 14 cases: one failing per rule plus two combined passing cases such as a legitimate `global-only` account entry); `standard.v1.json` (about 8 cases: scalars, catalog default, absent kinds contribute nothing, secret and file-placed keys excluded, determinism). A test over `Schemas::bundled()` expects zero lint findings (the standing gate for phases 12-13).
2. **04b (after phase 03 sign-off):** add the dependency; write `validate.rs`; add `schema-default-invalid`. `validate.v1.json` (about 12 cases): each type, `enum`, bounds, `required` on the merged value, a map entry against `additionalProperties`, an array item path, `null` allowed and refused, an unknown `x-fgos-` keyword changes nothing, a finding carries keyword and paths and no value. One assertion that a finding's text form contains no scalar of its input (the full no-echo proof is phase 11's).
3. Report cumulative Rust source lines (command in plan.md) in the commit message; phase target about 300, see the budget.

## Owning proofs

| Behaviour | Proof |
|---|---|
| Schema text becomes the model; path resolution and annotation inheritance; bundle completeness and digest | `golden_schema.rs` over `schema.v1.json` (resolution cases live only here; later phases exercise them through their own behaviour) |
| Each lint rule fires on its case and only there; bundled set is clean | `golden_lint.rs` over `lint.v1.json` (`bundled_set_is_clean` is the one place this is asserted) |
| Validation of the effective value; findings carry no value | `golden_validate.rs` over `validate.v1.json` |
| What the standard contains and omits | `golden_standard.rs` over `standard.v1.json` |

JSON Schema keyword semantics (types, bounds, `$ref`) are the validator crate's own proof; this crate does not re-test them beyond one wiring case per keyword class used.

## Validation

`cargo test -p fgos-config --test golden_schema --test golden_lint --test golden_standard --jobs 4` (04a), plus `--test golden_validate` (04b); clippy; fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Annotation inheritance gives a child a scope the author did not intend | M x M | lint still demands an own `x-fgos-scope` on every non-public node; fixtures for override and default |
| The validator crate rejects or reinterprets a keyword the schemas use | L x M | probe in phase 03; the lint's `schema-dialect` keeps authors inside the probed subset |
| A lint rule is stricter than the real catalog needs | M x L | rules come only from the spec's wording; if a real schema cannot pass, change the schema or raise a decision question, never the rule silently |
| `default` catalogs make the composite schema large | L x L | compile once per `Schemas`; time recorded in phase 13, no assertion |
| Message text of the validator leaks a value | M x H | findings are built from keyword and paths only; phase 11 asserts it |

## Rollback

Revert: new files only (plus the appended failure ids and, for 04b, the dependency line).
