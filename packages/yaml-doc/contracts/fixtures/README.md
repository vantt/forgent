# YAML Document golden fixtures

The contract of `fgos-yaml-doc` is its port plus these files, not the parser crate underneath
(`docs/platform/yaml-document/spec.md`, sections 4 to 9). A parser upgrade or swap lands only when
every fixture passes.

## Files and their owners

Each file belongs to exactly one runner test. A case that two runners could run is a defect.

| File | Owning test | Content |
|---|---|---|
| `parse.v1.json` | `tests/golden_parse.rs` | profiles, limits, alias expansion, key identity, error positions, byte revision, node spans |
| `prescan.v1.json` | `tests/golden_prescan.rs` | byte bound, UTF-8, flow and block depth before any parser recurses |
| `path.v1.json` | `tests/golden_path.rs` | path text form |
| `comment.v1.json` | `tests/golden_comment.rs` | comment injection guard |
| `merge.v1.json` | `tests/golden_merge.rs` | merge primitive |
| `edit.v1.json` | `tests/golden_edit.rs` | byte fidelity, edits, comments, re-parse check |

`tests/fixture_shape.rs` owns only fixture integrity (well-formed, known rule ids, unique ids,
size claims of generated inputs); it proves no parser behaviour.

## A case

```json
{ "id": "kebab-case-unique-across-files", "why": "one line naming the spec section or the old test",
  "profiles": ["strict-config", "tool"], "input": {}, "expect": {} }
```

`profiles` lists the profiles the case runs under. A case whose expectation differs per profile is
two cases. Some files add fields: `kind` (comment), `ops` (edit; an op may carry `acknowledge: true`), `old: true` (a case moved from the
Node test) and `max_millis` (a parse case that must finish within that time).

### `input`

| Form | Meaning |
|---|---|
| `{"lines": [...]}` | each line followed by LF |
| `{"text": "..."}` | exact characters (the whole input for path and comment cases) |
| `{"hex": "6b 3a ff"}` | exact bytes, for input that is not UTF-8 |
| `{"parts": [input, ...]}` | the parts concatenated |
| `{"generate": {"prefix", "unit", "count", "separator", "suffix"}}` | `prefix`, then `unit` repeated `count` times joined by `separator`, then `suffix`; in `unit`, `{i}` is the index and `{indent}` is two spaces per index |
| `{"layers": [...], "rules": {...}}` | merge input: layers highest priority first (`{"value": ...}`, or `{"nested": {"key", "depth", "leaf"}}` for a value nested `depth` times), and a rule (`deep`, `replace`, `leaf`) per path text |

A generator may claim its size so the claim is checked: `min_bytes`, or `size` of
`over-input-limit` (exactly one byte past the input bound of every profile of the case) or
`at-input-limit`.

### `expect`

| File | Success form |
|---|---|
| parse | `{"value": ...}`, or `{"checks": [{"path": "<path text>", "length": n}]}` (`"string_bytes": n` for a string) for values too large to write out |
| parse, optional extras | `"spans": [{"path", "value", "key"?, "line"?, "column"?}]` next to `value`: the source text the node's value (and key) occupies, and where the value starts; `"revision": "<sha256 hex>"` next to `value` |
| prescan | `{"ok": true}` |
| path | `{"segments": [...]}` (a string is a key, a number an index), plus `"canonical"` when the written form differs from the input |
| comment | `{"lines": [...]}` for kind `block` |
| edit | `{"output": "..."}` or `{"output": ...}` as the exact result bytes, `{"unchanged": true}`, or `{"comments": {"block": [...], "inline": ...}}` |
| merge | `{"value": ..., "origins": {"<path text>": <layer index>}}`, one origin per leaf of the result |

A refusal is `{"refusal": {"rule", "line", "column", "path", "detail"}}`; only `rule` is required,
the rest are compared when present. A refused edit leaves the document as it was. In a parse
`value`, `{"$float": "nan" | "inf" | "-inf" | "-0"}` stands for a float JSON cannot write.

Positions are 1-based; a column counts characters. Rule ids are the closed list in
`../refusal-rules.v1.json`.

## Adding a case

Add it to the file whose runner owns the behaviour, with a unique id and a `why`. Run
`cargo test -p fgos-yaml-doc --jobs 4`. A wrong expectation is fixed in the fixture file in its own
commit that says why.
