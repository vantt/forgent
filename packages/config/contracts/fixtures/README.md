# Config golden fixtures

The contract of `fgos-config` is its port plus these files (`docs/platform/config/spec.md`). One
authority per list: failure ids are closed in `../failure-codes.v1.json`, annotations in
`../annotations.v1.json`, YAML refusal ids in `packages/yaml-doc/contracts/refusal-rules.v1.json`.

## Files and their owners

Each file belongs to exactly one runner test; a case that two runners could run is a defect. Rows
are added as the phases that own them land.

| File | Owning test | Content |
|---|---|---|
| `grammar.v1.json` | `tests/golden_grammar.rs` | reasons, actors, doc and why lines, header, comment blocks |
| `schema.v1.json` | `tests/golden_schema.rs` | loading, path resolution, annotation inheritance, bundle digest |
| `standard.v1.json` | `tests/golden_standard.rs` | the standard layer: values, merge order, provenance |
| `lint.v1.json` | `tests/golden_lint.rs` | cross-node and cross-file lint rules, `standard-invalid` |
| `validate.v1.json` | `tests/golden_validate.rs` | the effective value against the section schemas: paths, `required` on the merge, null, order |
| `meta.v1.json` | `tests/golden_meta.rs` | one failing section schema per meta-schema rule, plus passing ones |
| `scope.v1.json` | `tests/golden_scope.rs` | which file may hold which key: scope, ancestors, wildcards, file placement |
| `snapshot.v1.json` | `tests/golden_snapshot.rs` | the snapshot: ladder, merge rules, provenance, trusted root, confined accounts, detected values, refusals |

`json-schema-suite/` is the official JSON-Schema-Test-Suite (draft 2020-12), vendored verbatim for the
keywords fgOS schemas use; see its README. It is run by `tests/validator_acceptance.rs` and is not
in the case format below.

`tests/fixture_shape.rs` owns only fixture integrity (well-formed JSON, unique ids, known failure
ids); it proves no behaviour.

## A case

```json
{ "id": "kebab-case-unique-across-files", "why": "one line naming the spec section",
  "input": {}, "expect": {} }
```

A refusal case names its id in `expect.code`.
