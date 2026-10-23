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
| `lint.v1.json` | `tests/golden_lint.rs` | cross-node and cross-file lint rules |
| `meta.v1.json` | the validator wrapper's test (not yet written) | one failing section schema per meta-schema rule, plus passing ones |

`tests/fixture_shape.rs` owns only fixture integrity (well-formed JSON, unique ids, known failure
ids); it proves no behaviour.

## A case

```json
{ "id": "kebab-case-unique-across-files", "why": "one line naming the spec section",
  "input": {}, "expect": {} }
```

A refusal case names its id in `expect.code`.
