# Phase 02: the addon and the Node door write a frontmatter block

Start after: 01 landed on the integration branch. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: F1, F2, F6.
Worktree `ywd-p02`, target `ywd-p02-target`, report slug `ywd-p02-node-door-write`. Effort: 3h.

## Context

Node reaches the crate only through the addon's `yaml` namespace (spec section 10). Today it exposes `parse`. Every
writer of the census writes a frontmatter block (F3), and the door already owns the read side (`readFrontmatter`). The
write side lands next to it so one module owns what a frontmatter block is, both ways. No general `stringifyYaml` export:
no caller exists outside frontmatter (F3); the crate's `emit` stays general (plan.md D2).

## Requirements

1. Addon: `#[napi(namespace = "yaml", js_name = "emit")] pub fn emit_document(json: String, filename: Option<String>) -> Result<String>`
   in `packages/git/node-addon/src/yaml.rs`, behind `check()` and `guarded`, over a pure
   `pub fn emit_text(json: &str, filename: &str) -> Result<String, Failure>`: `serde_json::from_str` (an invalid JSON
   argument cannot come from the Node door; treat it as `yaml-internal-error`, value-free, no new id), `Value::from_json`,
   `fgos_yaml_doc::emit(.., Profile::Tool, filename)`, UTF-8 text. Refusals travel exactly like `parse`'s (JSON message of
   `marshal::Failure`). No `Cargo.toml` change: key order is the crate's (`preserve_order` set in 01).
2. ABI marker: `"yaml": 2` in `packages/git/node-addon/src/lib.rs:73`; `src/native/door.mjs` `combinedAbiMatches` requires
   `v.yaml >= 2`, and its doc comment adds "`yaml` 2 is the first with `emit`". Note: the check is one conjunction, so an
   addon with `yaml: 1` makes the whole native door unavailable to this payload (every YAML read, config, git), not only
   `emit`; plan.md "Integration and landing" carries the activation step that keeps payload and addon paired.
3. `src/util/yaml.mjs`:
   - extract the refusal mapping of `parseYaml` (`:31-38`) into one private helper used by both calls (DRY);
   - `export function writeFrontmatter(meta, body, file)`:
     - `meta` must be a plain object (prototype `Object.prototype`), else `YamlParseError({ id: 'frontmatter-not-a-mapping', file })` (the reader's rule);
     - `JSON.stringify(meta)` inside `try`; any throw (cycle, `BigInt`, a throwing `toJSON`) becomes
       `YamlParseError({ id: 'frontmatter-not-json', file })` with no message text of the original error;
     - text = the one template literal `` `---\n${emitted}---\n${body}` `` (the doors row of phase 09 allows this file by that
       literal; a fence built from a constant would leave the `allowed` entry stale);
     - `readFrontmatter(text, file)`; `util.isDeepStrictEqual(read.meta, meta)` and `read.body === body`, else
       `YamlParseError({ id: 'frontmatter-not-round-trip', file })` (catches what JSON cannot carry: `undefined`, `NaN`,
       `-0`, a `Date`, a class instance, and a body that the reader would cut differently);
     - returns the text. JSDoc: the one writer of YAML text in Node; output reads back through `readFrontmatter` to
       `{ meta, body }`; key order follows `meta`; quoting is the crate's; the three Node-side rule ids.
   - module header: "reading and writing YAML" instead of "reading YAML".

## Proofs

- `packages/git/node-addon/tests/yaml_parts.rs` (pure half): `emit_text` keeps a non-alphabetical key order, passes a crate
  refusal through value-free.
- `test/util/yaml.test.mjs` (the one Node wiring proof, one test): `writeFrontmatter` then `readFrontmatter` returns the
  same `{ meta, body }` for a meta with a `": "` string, a list and a number; a non-mapping meta, a cyclic meta and a
  `Date` value are refused by rule id and file, and no refusal message contains the value.
- `test/config/config-door.test.mjs`: one assertion beside `:39`, `combinedAbiMatches({ ...v, yaml: 1 }, v.napi) === false`
  ("an addon before emit"); `test/git/native-load.test.mjs:25`: `yaml: 2` in the exact marker set.

## Files

- Modify: `packages/git/node-addon/src/yaml.rs`, `packages/git/node-addon/src/lib.rs` (marker only),
  `packages/git/node-addon/tests/yaml_parts.rs`, `src/native/door.mjs`, `src/util/yaml.mjs`, `test/util/yaml.test.mjs`,
  `test/config/config-door.test.mjs`, `test/git/native-load.test.mjs`, `packages/git/contracts/mutation-census.v1.json`
  (regenerated).
- Create/Delete: none. Tests retired: none.
- Net size: about +40 Rust, +35 Node, +35 test lines.

## Steps

1. Before editing `src/util/yaml.mjs`: `git log origin/main -3 -- src/util/yaml.mjs` (board names CFG as a writer; if a
   commit landed after `0b425a2f0`, rebase first).
2. Red: `yaml_parts.rs` emit cases and the `test/util/yaml.test.mjs` case (fail: no export). Commit, push.
3. Implement 1-3 (the addon is rebuilt by `node scripts/run-tests.mjs`, which stages it).
4. Green: `cargo test -p fgos-node-addon --test yaml_parts`; `node scripts/run-tests.mjs test/util/yaml.test.mjs
   test/config/config-door.test.mjs test/git/native-load.test.mjs test/setup/git-mutation-census.test.mjs` plus every test
   the rg in phase-lead-rules lists for `src/util/yaml.mjs` and `src/native/door.mjs` (run the list, do not guess).
5. Gates in phase-lead-rules (Rust: `-p fgos-node-addon`; msvc and aarch64-apple-darwin check).

## Acceptance

- `writeFrontmatter` exported; `nativeDoor().yaml.emit` exists; `versions().yaml === 2`; proofs above green.
- `rg -n "^export" src/util/yaml.mjs` lists only `YamlParseError`, `parseYaml`, `describeYamlError`, `cutFrontmatter`,
  `readFrontmatter`, `writeFrontmatter` (no general emitter).

## Risks

- Stale addon paired with this payload (L x H): whole native door refused by name; the landing step in plan.md pairs them.
- Hot files `src/native/door.mjs`, `packages/git/node-addon/src/lib.rs` (`origin/harden/ci-state-root` edits another hunk):
  rebase, never hand-merge the marker line.

## Rollback

Revert together with every writer phase that landed after it (03-07 import `writeFrontmatter`); regenerate the census.
