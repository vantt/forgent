# Phase 02: the addon and the Node door write a frontmatter block

Start after: 01 landed on the integration branch. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: F1, F2, F6.
Worktree `ywd-p02`, target `ywd-p02-target`, report slug `ywd-p02-node-door-write`. Effort: 3h.

## Context

Node reaches the crate only through the addon's `yaml` namespace (spec section 10). Today it exposes `parse`. Every
writer of the census writes a frontmatter block (F3), and the door already owns the read side (`readFrontmatter`). The
write side lands next to it so one module owns what a frontmatter block is, both ways. No general `stringifyYaml` export:
no caller exists outside frontmatter (F3), and the crate's `emit` stays general for the day one does (decision D2 in plan.md).

## Requirements

1. Addon: `#[napi(namespace = "yaml", js_name = "emit")] pub fn emit_document(json: String, filename: Option<String>) -> Result<String>`
   in `packages/git/node-addon/src/yaml.rs`, behind `check()` and `guarded`, over a pure
   `pub fn emit_text(json: &str, filename: &str) -> Result<String, Failure>`: `serde_json::from_str` (a parse error is the
   failure id `yaml-emit-not-json`, value-free), `Value::from_json`, `fgos_yaml_doc::emit(.., Profile::Tool, filename)`,
   UTF-8 text. Refusals travel exactly like `parse`'s (JSON message of `marshal::Failure`).
2. `packages/git/node-addon/Cargo.toml`: `serde_json = { workspace = true, features = ["preserve_order"] }` with a one-line
   comment (key order of emitted text follows the caller's object). No `Cargo.lock` change expected (`indexmap` already
   locked); if one appears, stop and ask the big lead.
3. ABI marker: `"yaml": 2` in `packages/git/node-addon/src/lib.rs:73`; `src/native/door.mjs` `combinedAbiMatches` requires
   `v.yaml >= 2`, and its doc comment adds "`yaml` 2 is the first with `emit`". An addon from before fails by name
   (`combined addon ABI mismatch`) instead of `emit is not a function`.
4. `src/util/yaml.mjs`:
   - extract the refusal mapping of `parseYaml` (`:31-38`) into one private helper used by both calls (DRY);
   - `export function writeFrontmatter(meta, body, file)`: `meta` must be a plain object (else throw
     `YamlParseError({ id: 'frontmatter-not-a-mapping', file })`, the reader's rule); text =
     `` `---\n${emitted}---\n${body}` `` written as that one template literal (the doors row of phase 09 allows this file
     by that literal; a fence built from a constant would leave the `allowed` entry stale); then `readFrontmatter(text, file)` and `util.isDeepStrictEqual(read.meta, meta)` or
     throw `YamlParseError({ id: 'frontmatter-not-round-trip', file })` (catches what JSON cannot carry: `undefined`,
     `NaN`, a `Date`, a class instance). Returns the text. JSDoc states: the one writer of YAML text in Node; output reads
     back through `readFrontmatter` to `{ meta, body }`; key order follows `meta`; quoting is the crate's.
   - header comment of the module: "reading and writing YAML" instead of "reading YAML".

## Files

- Modify: `packages/git/node-addon/src/yaml.rs`, `packages/git/node-addon/src/lib.rs` (marker only),
  `packages/git/node-addon/Cargo.toml`, `packages/git/node-addon/tests/yaml_parts.rs` (pure half of `emit`: key order
  kept, non-JSON refused value-free, a crate refusal passed through), `src/native/door.mjs`, `src/util/yaml.mjs`,
  `test/util/yaml.test.mjs` (the one Node wiring proof: `writeFrontmatter` then `readFrontmatter` returns the same
  `{ meta, body }` for a meta with a quoted string, a list and a number; a non-mapping meta and a `Date` value are refused
  by rule and file), `test/config/config-door.test.mjs` (one assertion beside `:39`: `{ ...v, yaml: 1 }` is false, "an addon
  before emit"), `test/git/native-load.test.mjs:25` (`yaml: 2`).
- Create: none. Delete: none. Tests retired: none.
- Net size: about +45 Rust, +30 Node, +35 test lines.

## Steps

1. Red: `yaml_parts.rs` emit cases and the `test/util/yaml.test.mjs` round-trip case (fails: no export). Commit, push.
2. Implement 1-4. Build the addon the way `npm test` stages it (`node scripts/run-tests.mjs` does).
3. Green: `cargo test -p fgos-node-addon --test yaml_parts`; `node scripts/run-tests.mjs test/util/yaml.test.mjs
   test/config/config-door.test.mjs test/git/native-load.test.mjs` plus every test importing `src/util/yaml.mjs` or
   `src/native/door.mjs` that the rg in phase-lead-rules lists (run the list, do not guess).
4. Gates in phase-lead-rules (Rust: `-p fgos-node-addon`; msvc and aarch64-apple-darwin check).

## Acceptance

- `writeFrontmatter` exported from `src/util/yaml.mjs`; `nativeDoor().yaml.emit` exists; `versions().yaml === 2`.
- The wiring proof passes; `combinedAbiMatches({ ...v, yaml: 1 })` is false.
- No `stringifyYaml`, `emitYaml` or similar general export in Node (`rg -n "export function" src/util/yaml.mjs` lists
  `parseYaml`, `describeYamlError`, `cutFrontmatter`, `readFrontmatter`, `writeFrontmatter`, plus the error class).

## Risks

- Stale addon on a machine (L x M; machines upgrade together): the marker makes it a named ABI mismatch at load.
- `preserve_order` silently dropped later (L x L): `yaml_parts.rs` key-order case fails by name.
- Hot files `src/native/door.mjs`, `packages/git/node-addon/src/lib.rs`: no other running plan edits them (collision
  table); if one does at land time, rebase, never hand-merge the marker line.

## Rollback

Revert the phase's commits together with every writer phase that landed after it (03-07 import `writeFrontmatter`).
