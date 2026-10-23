# Phase 04: Descriptor lint

Depends on 03. Suggested executor: sonnet.

## Context

The lint turns the spec's descriptor rules into closed rule ids a descriptor author sees before a file reaches a project. It runs over the whole bundled set (cross-file: ownership, duplicates) and over a single file in tests. Spec sources: section 3 (scope rules 1-4), section 4 (field table, catalog defaults, `<any>`, `suggestion`, `file`), section 9 (secret kinds).

## Files it may touch

`src/lint.rs`, `contracts/fixtures/lint.v1.json`, `tests/golden_lint.rs`, and an append to the `descriptor-` list of `contracts/failure-codes.v1.json` (after phase 03's commit).

## Rules (each is one id, one fixture pair: a failing and a passing case)

| Id | Rule |
|---|---|
| `descriptor-path-outside-section` | the first segment of every path equals the file's `section` |
| `descriptor-duplicate-path` | two entries with the same path (after parse) |
| `descriptor-pattern-ambiguous` | two entries whose patterns match a common path with equal specificity |
| `descriptor-any-misplaced` | `<any>` whose parent entry is not `map of T` (or a `list` index is never a wildcard); a literal key `<any>` cannot be expressed, so a descriptor naming one is refused |
| `descriptor-type-values` | `enum` without `values`; `values` on a type that does not use it; a range on a non-number; empty `values`; `values: [null]` anywhere except on an `<any>` child (D16) |
| `descriptor-default-type` | `default` or `suggestion` does not satisfy the entry's type and values. **Implemented in phase 05** (it needs the value check); the id is reserved here and its fixtures land with 05 |
| `descriptor-absent-default` | `absent: default` (the default) needs a `default` or a catalog; `required`, `detected` and `off` forbid `default` |
| `descriptor-catalog-invalid` | a catalog `default` at a `map of T` path whose entries do not satisfy the `<any>` child descriptors (a standard that fails its own check). **Implemented in phase 05**, same reason |
| `descriptor-scope-implicit` | spec section 3 rule 1: `sensitivity` other than `public` without an explicit `scope` |
| `descriptor-scope-both-unjustified` | same rule: `scope: both` on a non-public key without `justification` (D5) |
| `descriptor-scope-conflict` | a descendant `project-only` under a `global-only` ancestor, or the reverse |
| `descriptor-file-placement` | `file: accounts` or `token` with `scope` other than `global-only`; `file: token` with a type other than `string` or a sensitivity other than `secret-value`; `file: accounts` with a sensitivity of `public` |
| `descriptor-secret-has-value` | `secret-reference` or `secret-value` with a `default` or `suggestion` (the standard holds no account and no token, spec section 4) |
| `descriptor-merge-mismatch` | `merge: deep` on a scalar type, `leaf` on `map of T` without a stated reason is allowed; only the impossible combinations are refused |
| `descriptor-owner-inconsistent` | one file with entries naming two owners, or the same `section` in two files |
| `descriptor-version` | `version` not a positive integer |

Closed, small, each id used by a fixture. Rules that depend on other files (`descriptor-owner-inconsistent`, `descriptor-duplicate-path` across files) run on the `Descriptors` set; the rest per file.

## Steps

1. Merge `origin/main`; implement `lint(&Descriptors) -> Vec<LintFinding>` where a finding names the rule id, file, entry path and the YAML line and column of the entry (kept by the loader from phase 03's spans). Findings never carry a `default` value.
2. About 34 golden cases (a failing and a passing one per rule, plus 3 combination cases such as a legitimate `global-only` account entry that passes all rules).
3. A test over `Descriptors::bundled()` that expects zero findings: this is the standing gate for phases 12 and 13 (it passes trivially now).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Each lint rule fires on its case and only there | `golden_lint.rs` over `lint.v1.json` |
| The bundled set is lint-clean | `golden_lint.rs::bundled_set_is_clean` (the one place this is asserted) |

## Validation

`cargo test -p fgos-config --test golden_lint --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A lint rule is stricter than the real catalog needs and forces contortions in phase 13 | M x L | rules come only from the spec's wording; if a real descriptor cannot pass, change the descriptor or raise a decision question, not the rule silently |
| `descriptor-default-type` and `-catalog-invalid` depend on phase 05's value check | M x L | phase 05 waits for 04 and appends those two rules to `src/lint.rs` and their cases to `lint.v1.json` (the one shared edit, 04 then 05); until then the runner skips exactly those two ids, named in the test, and phase 05 deletes the skip |

## Rollback

Revert: new files only plus the appended ids.
