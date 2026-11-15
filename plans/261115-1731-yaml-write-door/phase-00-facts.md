# Phase 00: facts and prior art (done at planning time)

Status: done (read on `origin/main` `0b425a2f0`, 2026-11-15). Every later phase re-checks the lines it edits before editing.

## F1. The door today reads only

- `src/util/yaml.mjs:28-39` `parseYaml` calls `nativeDoor().yaml.parse(text, file)`; `:59-67` `cutFrontmatter`; `:82-92`
  `readFrontmatter` (cut + parse, `{ meta, body, block }`, a non-mapping block throws `frontmatter-not-a-mapping`).
  No export writes YAML.
- Addon: `packages/git/node-addon/src/yaml.rs:65-70` exports only `yaml.parse` (`#[napi(namespace = "yaml", js_name = "parse")]`).
  ABI marker `"yaml": 1` at `packages/git/node-addon/src/lib.rs:73`; `src/native/door.mjs:33-35` `combinedAbiMatches` checks
  only `typeof v.yaml === 'number'`. Marker consumers: `test/git/native-load.test.mjs:25` (exact `versions()` object),
  `test/config/config-door.test.mjs:38-40` (owning proof of `combinedAbiMatches`).

## F2. The crate already has the writer (shape A, surgical edit)

- `packages/yaml-doc/rust/src/edit.rs:48` `Document::set(path, value, ack)`; doc comment: "an empty path replaces the whole
  document". Every edit is committed by `commit` (`edit.rs:261`), which re-parses the result under the same profile and
  refuses any result whose value differs from the intended one (spec section 5, guarantee 2). That re-parse check is the
  round-trip guarantee the backlog row asks for.
- Rendering of new content: `render_for` (`edit.rs:1119`), `map_lines`/`entry_lines`/`seq_lines` (`:967-1005`), scalar quoting
  `string`/`plain_ok`/`single_ok`/`double_quoted` (`:889-1068`): a plain scalar only when it reads back as the same string
  (`plain_ok`, `:1007-1039`, ends in `resolve(...) == Str`); `": "`, `" #"`, leading indicator, `---` prefix all force quotes;
  an empty mapping renders inline `{}` (`:921`).
- Production use of "write new YAML through `set`": `packages/config/rust/src/write.rs:349-418` (`produce`) parses a
  header-only text and calls `doc.set(path, Doc::from_json(value), loss)` per key, then `doc.to_bytes()`.
- Gap (code trace, to be proven red first in phase 01): on a document that holds no node, `set_inner` (`edit.rs:71-117`)
  takes the `chain.is_empty()` branch, wraps the value with `nested_map([], value)` and then appends only the FIRST entry
  (`entries.remove(0)`, `:94-96`, `plan_append_root` `:1375-1391`); `commit` then compares the full intended value and
  refuses. A scalar or sequence value returns `not_found` (`:92-93`). So "an empty path replaces the whole document" does
  not hold for an empty document today. Calling `set` once per top-level key (what Config does) works, but each later
  key is rendered with a quoting preference re-derived from the keys already written (`pref`, `:785-818`), so the output
  for a key depends on its siblings.
- JSON to `Value`: `packages/yaml-doc/rust/src/model.rs:23` `Value::from_json`. Key order: `serde_json` has
  `preserve_order` in the addon build only through feature unification (`packages/config/rust/Cargo.toml:18` via
  `packages/git/node-addon/Cargo.toml:25`); `node-addon/Cargo.toml:15` does not name the feature itself. `Cargo.lock`
  already carries `indexmap` for `serde_json`.

## F3. Census of YAML text written by string building (Node, Rust, scripts)

Searched `bin src scripts apps packages core domains .githooks plugins/fgOS tools` for fence literals (`'---'`, `"---\n`,
`` `---\n ``, template lines ending in `` `--- ``), `key: ${...}` emission, `writeln!`/`format!`/`push_str` with `---` in
Rust, `.yaml` files written from strings, and `stringify`/`dump` names. Result:

| # | File:line | Writes | Output | Reader of the output |
|---|---|---|---|---|
| 1 | `src/report/knowledge-projection.mjs:17-24` | `generated: true` | `docs/doc-registry.md` (committed; `fgos doc-registry --check` compares bytes, `bin/fgos.mjs:1531-1543`) | `--check`, doc readers |
| 2 | `src/report/decision-index.mjs:96-101` | `type: explanation`, `title: Decisions index`, `generated: true` | `docs/decisions/index.md` (committed; `fgos decision-index --check`) | docs-index, `--check` |
| 3 | `src/workflow/case-runtime.mjs:197-203` (`renderAnswerFile`) | `approved: yes/no`, `occurrence`, `round`, `subjectDigest` (`'none'` when null) | a case's answer `.md` view under the run dir | a view; no parser reads it |
| 4 | `scripts/knowledge-canary.mjs:39` | `framework: diataxis`, `mode: how-to` | a doc in a disposable sandbox repo | `fgos knowledge attest` in the canary |
| 5 | `scripts/project-agents.mjs:133-138` | `name`, `description`, `tools` (comma string), `skills` (flow list) | `.claude/agents/<name>.md` (4 committed: `council-assumptions`, `council-feedback-loops`, `council-ship-maintain`, `fgos-placeholder`) | Claude Code's agent loader |
| 6 | `core/skills/distill/scripts/distill.mjs:245` | `name`, `type`, `url`, a cursor line, `domains_covered: []` | a feature index in the user's project | `distill.mjs` itself |

- Count of five confirmed (rows 1-5). Row 6 is the shipped standalone skill script: it runs in user projects without the
  addon, the same `oneDoor: standalone` decision (2026-10-20) that keeps its reader in the frontmatter read row
  (`docs/architecture-manifest.json`, row "read a YAML frontmatter block", `allowed`). It stays, `allowed` with that reason.
- Not writers: `src/setup/skill-wrappers.mjs:94,567` and `scripts/build-skill-wrappers.mjs` copy a source block byte for byte
  (`cutFrontmatter`); `src/setup/instruction-projections.mjs:133` writes a Markdown bullet; `scripts/test-proof-inventory.mjs:346,374`
  reads `---` lines of a unified diff; `src/runner/worker-log.mjs:30`, `scripts/record-mailbox-hook-fixtures.mjs:316,1164`,
  `scripts/probe-storytelling-material.mjs:132` write `--- label ---` text; Rust has no YAML text writer outside the crate
  (`packages/config/rust/src/write.rs` goes through `Document::set`). No `.py`/`.sh`/`.ps1` writer.
- Rows 1-5 bytes today vs the emitter (from `plain_ok`): rows 1-4 render identically (`yes`, `none`, `sha256:copy`,
  `explanation`, `Decisions index`, `diataxis`, `how-to` are plain strings under the `tool` profile; `true` and integers are
  plain). Row 5 changes: a `description` holding `": "` becomes double-quoted (today's committed
  `.claude/agents/council-*.md` frontmatter is invalid YAML: `description: Council task posture: assumption testing ...`),
  and `skills: [a, b]` becomes a block sequence. The value is the same or, for the council files, readable at all.

## F4. Prior art (what existed, what removed it, intended?)

- `renderFrontmatter` in `src/report/frontmatter.mjs` (added `320adbdef`, "OKF-style flat frontmatter parser/writer") was the
  only Node YAML writer with a name. Deleted with its only caller `scripts/knowledge-migration.mjs` in `51f39d252`
  ("read every frontmatter block through the YAML door", 2026-11-14). Intended: the decision text
  (`docs/platform/packaging-distribution/spec.md`, history entry 2026-11-14) rejects "a YAML writer in this change" and puts
  the question on the one-door-debt plan's idea list (`plans/261114-2215-one-door-debt/plan.md`, Ideas row 1 and Q1,
  recommendation (a)); the owner approved it as backlog row `p-eqhfqpz3gy` (`docs/backlog.md:22`).
- No `stringify`/`dump` of YAML ever existed in Node: `git log -S` for `stringifyYaml`, `dumpYaml`, `YAML.stringify`,
  `yaml.stringify`, `serializeFrontmatter`, `writeFrontmatter` over `src scripts bin packages` finds nothing; the npm `yaml`
  era (`838b044e5`, 2026-10-16) removed only `import YAML from 'yaml'` parse sites.
- The crate's writer shape was decided 2026-10-22: "writer shape A (surgical edit) ... no B-then-A two-step plan"
  (`docs/platform/yaml-document/spec.md`, section 15). Emitting a new document as one `set` on an empty document is shape A;
  a separate re-render printer would be shape B and is out.
- Origins of the five writers: `5c948d2a4` (knowledge-projection and canary, 2026-08-25), `4722361ae` (decision-index,
  2026-08-17), `5b2b91044` (case answer file, 2026-10-19), `33937a93a` (project-agents frontmatter, 2026-08-16). None was a
  deliberate second YAML authority; each predates a door that could write.
- Side fact (not this plan's scope, see owner question Q1): `3133ed474` removed `model:` from the agent projection
  ("names no model", `scripts/project-agents.mjs:101-104`) without regenerating the committed `.claude/agents/*.md`, which
  still carry `model: sonnet`/`model: haiku`. No test compares committed projections with the generator.

## F5. Guard mechanics

- `test/architecture.test.mjs:1817-1877` `checkDoors`: every pattern runs per line over every product file under
  `bin src scripts apps packages .githooks core domains` (`:1762`), extensions `.mjs .js .cjs .rs .sh .ps1`, minus `test`,
  `tests`, `target`, `node_modules`, and `fixtures`/`third-party` outside `bin/` and `src/` (`:1764-1773`). JS comments are
  blanked, string and template contents are kept (`scripts/lib/js-source-lexer.mjs:24-30`, `code` view); Rust test code is
  blanked. Stale `allowed`/`debt` entries fail; a row allowing both `.mjs` and `.rs` needs `retiredBy`.
- Existing YAML rows: "YAML parser loads" and "read a YAML frontmatter block". No row covers writing.

## F6. Proof owners today

| Behaviour | Owning proof |
|---|---|
| What YAML text means; edits; re-parse check | `packages/yaml-doc/rust/tests/golden_{parse,edit}.rs` over `packages/yaml-doc/contracts/fixtures/*.v1.json`; fixture integrity `tests/fixture_shape.rs:13` (`FIXTURE_FILES`); public seal `tests/api_seal.rs` |
| Addon `yaml` namespace, pure half | `packages/git/node-addon/tests/yaml_parts.rs` |
| Node door wiring | `test/util/yaml.test.mjs` (one wiring proof) |
| ABI marker check | `test/config/config-door.test.mjs:38-40`; exact marker set `test/git/native-load.test.mjs:25` |
| Writer 1 | `test/report/knowledge-lints.test.mjs:42` (`includes('generated: true')`) |
| Writer 2 | `test/report/decision-index.test.mjs` (pure `buildDecisionIndexMarkdown` cases from `:46`) |
| Writer 3 | `test/workflow/case-runtime.test.mjs:44` (regex over the frontmatter bytes) |
| Writer 4 | `test/skills/knowledge-canary.test.mjs` (end-to-end canary) |
| Writer 5 | `test/scripts/project-agents.test.mjs:45-70` (tools line, no model line, skills flow line, no skills), `:188` (newline refused) |
