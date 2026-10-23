# Phase 05: Value check against descriptors, standard assembly

Depends on 04. Suggested executor: sonnet.

## Context

Spec section 4: shape errors are reported with file, line, column and the descriptor that refused the value; a type mismatch is reported, never repaired; an unknown key is a doctor warning and kept (the warning itself is Slice D, but the check must report "undescribed" as a finding class, not drop it). Spec section 4 also defines the standard: every `default`, including whole catalogs, assembled into one value that is "the same on every machine" and holds no account, token or detected value.

## Files it may touch

`src/check.rs`, `src/standard.rs`, `contracts/fixtures/{check,standard}.v1.json`, `tests/golden_check.rs`, `tests/golden_standard.rs`; appends to `src/lint.rs` and `contracts/fixtures/lint.v1.json` (the two reserved rules of phase 04, deleting the runner's skip).

## Design

- `check(&Descriptors, value: &Value, source: &CheckSource) -> Vec<Finding>` where `CheckSource` carries the file name and, optionally, the parsed `Document` so a finding can carry line and column through `Document::span_of(path)` (`packages/yaml-doc/rust/src/document.rs:187`). A finding is `{class, path, descriptor_path, expected, line?, column?, file}`; classes: `type-mismatch`, `value-out-of-set` (enum/range), `undescribed` (key with no descriptor; allowed, reported), `null-not-allowed`. **No finding carries the offending value**, only the expected type and the position (spec section 9 "no error echoes a value"; the no-echo fixtures of phase 11 re-prove it across the whole crate).
- Typing rules: scalar types strict (`integer` refuses a float and a string; `number` accepts both; `boolean` only booleans, since the `strict-config` profile already made `yes` a string); `enum` and bounded numbers against `values`; `list of T` checks every item, reporting the index in the path; `map of T` checks every entry against the `<any>` child set; `object` checks listed children and reports the rest as `undescribed`. A `null` is a `null-not-allowed` finding except where the descriptor allows it. Spec section 3: "To switch off a standard entry a file sets it to `null`, where the map's descriptor allows `null`", so the permission sits on the **`<any>` child entry of a `map of T`**. Decision D16: that child states it with `values: [null]` (the existing `values` field, read as "also allowed: null"); no new dialect field. Lint (phase 04) refuses `values: [null]` anywhere except on an `<any>` child. If the first fixtures show this reading is unworkable, the fallback is a boolean `nullable` on the `<any>` child, which extends the dialect: stop and ask in the decision-question template before shipping it.
- `standard(&Descriptors) -> Value`: walk entries in file order; each `default` at its path; a catalog `default` at a `map of T` path is merged under its path; keys with `absent` of `required`, `detected` or `off` contribute nothing (they appear as placeholders only in Slice D's text renderer). Output is deterministic (entry order), contains no `secret-*`, `file: accounts|token` key, and no key whose `scope` is `project-only` ... (project-only keys can have standard values; only the accounts/token files and secrets are excluded).
- The two reserved lint rules: `descriptor-default-type` = `check` of each `default`/`suggestion` against its own entry; `descriptor-catalog-invalid` = `check` of the standard against the whole set and expect zero findings other than `undescribed` for entries the descriptor set intentionally leaves free.

## Steps

1. Merge `origin/main`. Implement check, then standard, then the two lint rules; delete the skip in `golden_lint.rs`.
2. Fixtures: check about 28 cases (each type, enum, range edges, list index path, map entry, object with unknown child, null allowed and refused, position reported, no value in the finding), standard about 10 cases (scalars, catalog default, nested catalog, absent kinds contribute nothing, secret and file-placed keys excluded, determinism).
3. Position cases use real YAML text so line and column come from yaml-doc, not hand-built values.

## Owning proofs

| Behaviour | Proof |
|---|---|
| Types, values, `<any>`, positions, no value in findings | `golden_check.rs` over `check.v1.json` |
| What the standard contains and omits | `golden_standard.rs` over `standard.v1.json` |
| The two default-related lint rules | `golden_lint.rs` (cases appended) |

## Validation

`cargo test -p fgos-config --test golden_check --test golden_standard --test golden_lint --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Nullability design guess (D16) conflicts with the owner's reading of section 4 | M x L | first choice uses only spec fields; fallback needs an owner mention before it ships; fixtures pin the choice |
| `check` is slow on the 42-entry capability catalog (nested `<any>`) | L x L | linear walk; a timing assertion is not added (design principle 8: no flaky proofs); phase 13 observes the real time |
| Check disagrees with the Node `validateRunnerConfigShape` on shape | M x L | by design: section owners keep their cross-field validation (spec section 2); Config checks shape only |

## Rollback

Revert: new files plus the appended lint rules.
