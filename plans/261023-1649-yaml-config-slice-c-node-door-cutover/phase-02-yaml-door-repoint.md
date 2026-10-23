# Phase 02: `src/util/yaml.mjs` over the addon, error shape, ABI marker, Node wiring proofs

Depends on 01. Suggested executor: sonnet. Shared file: `src/native/door.mjs` (D 11 first, then this phase; phase 06 edits it again). Impact analysis on `parseYaml`, `describeYamlError`, `loadNativeAddon`.

## Context

`src/util/yaml.mjs` keeps its name and `parseYaml(text, { filename })` signature, so its importers do not change (9 in `src`/`scripts`, phase 00 list). The one other contract is the error: `describeYamlError` (6 callers) reads `error.reason` and `error.mark.{line,column}` of a js-yaml error (`yaml.mjs:60-66`). The new error is a refusal with the rule, file, line and column (1-based) and no value.

## Files it may touch

`src/util/yaml.mjs`, `src/native/door.mjs` (marker check `typeof v.yaml !== 'number'` in the combined ABI check at `:61`, and the helper below), `test/util/yaml.test.mjs`, `packages/yaml-doc/contracts/fixtures/yaml-test-mapping.v1.json` (deleted), `packages/yaml-doc/contracts/fixtures/README.md` (the line that mentions it), `packages/yaml-doc/rust/tests/fixture_shape.rs` (the check that reads `test/util/yaml.test.mjs` and the mapping goes: its own note says it "is retired together with the Node test when the Node door moves to the native addon").

## Design

- `src/native/door.mjs` gains `fromDoorJson(text, { special = [], nullPrototype = false })`: `JSON.parse` (own `__proto__` key by construction), apply `special` (set `NaN`, `Infinity`, `-Infinity` at each path), and when `nullPrototype` is set make every plain object prototype-free with a reviver that calls `Object.setPrototypeOf(value, null)`. This is the one define-semantics point for both namespaces (C2); phase 07's facade uses `nullPrototype: true`, `parseYaml` uses the default (ordinary prototype, today's contract).
- `parseYaml(text, { filename })`: `nativeDoor().yaml.parse(text, filename ?? 'YAML input')`; on a failure throw `YamlParseError` (`name`, `message` = `<file>: <rule> (line L, column C)` with the file name `YAML input` when none was given, `code` = the rule id, `rule`, `file`, `line`, `column`); no `mark`, no `reason`. `describeYamlError(error)` returns `<rule text> (line L, column C)` from those fields (the existing callers print it unchanged in shape). The missing-addon error is the door's own (`git-addon-unavailable` / `git-addon-not-shipped`), unchanged: **no JavaScript fallback**.
- The expansion bounds, the alias limit and the multiple-document rule are the crate's (`tool` profile); the JavaScript copies (`MAX_ALIASES`, `assertExpandedSize`, `loadAll`) go.

## Steps

1. Merge `origin/main`; record the parity baseline: with the old door still in place, parse every tracked YAML and frontmatter document (`git ls-files '*.yaml' '*.yml'` plus workflow, persona and unit files the importers read) and write canonical JSON per file to scratch.
2. Edit `door.mjs` (marker, helper), `yaml.mjs`; delete the mapping fixture and the fixture-shape check; rewrite `test/util/yaml.test.mjs`.
3. Re-run the parity comparison with the new door: **every document equal, the same set rejected** (the 2026-10-16 run found 828 documents, 13 rejected by both). A difference is a bug in the addon or a finding to put to the owner; it is never papered over in the Node helper.
4. `test/util/yaml.test.mjs` becomes **wiring only** (about 60 lines, replacing 154): a mapping/sequence/scalar round trip; a malformed input gives an error naming file, line and column and containing no input text; `.nan` becomes `NaN` through `special`; `__proto__` and `constructor.prototype` keys are own keys and `Object.getPrototypeOf(doc) === Object.prototype` (extends the old pin at `:119`); adversarial input (200,000 nested flow brackets, a 9-level alias bomb) returns a named refusal and the process keeps running (spec section 10 fixture); the missing-addon error by name (a descriptor-less `loadNativeAddon` call, the pattern of the git door tests). The old hash test and the vendored-file cases leave with phase 03.
5. Run the focused file through the launcher that stages the addon (phase 00's command), then `cargo test -p fgos-yaml-doc --jobs 4` (the shape test no longer reads the Node test).

## Owning proofs

Semantics: Slice A goldens. Wiring: this phase's test, one per namespace (the `config` namespace's is phase 06). Each deleted Node test case names its Rust owner in the commit message (the retired mapping file listed them: `plain-values`, `syntax-error-position`, `null-*`, `multi-doc-*`, `dup-key-*`, `core-*`, `tag-*`, `alias-*`, `flat-*`, `proto-keys-*`).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A caller depends on a js-yaml error field other than `reason`/`mark` | L x M | phase 00 greps (`rg "\.mark\b|\.reason\b"` on YAML errors found only `yaml.mjs` and its test) |
| `JSON.parse` reorders keys relative to the document | L x L | same as js-yaml (object semantics); parity run compares canonical JSON |
| Process cold start: the first `parseYaml` now loads the addon (0.5 ms plus an 8.4 ms hash check, spec G1) | M x L | measured in phase 08 together with config reads |

## Rollback

Revert the commit: `parseYaml` is the old function again (the vendored file is still in place until phase 03).
